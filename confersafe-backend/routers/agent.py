from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
import models, schemas
from gemini_service import call_gemini
from ms_project_parser import parse_ms_project_xml, nodes_to_frontend_format

router = APIRouter()


def _get_rag_context(project_id: str, db: Session) -> Optional[str]:
    """Lee el contexto RAG desde la BD (persiste entre reinicios del servidor)."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    return project.rag_context if project else None


@router.post("/analyze", response_model=schemas.AgentResponse)
async def analyze(request: schemas.AgentRequest, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    # RAG context viene de la BD — sobrevive reinicios de Render
    rag_context = project.rag_context

    result = await call_gemini(
        query=request.query,
        project_id=request.project_id,
        nodes=request.nodes,
        conversation_history=request.conversation_history,
        rag_context=rag_context,
    )

    try:
        db.add(models.ChatHistory(
            project_id=request.project_id,
            role="user",
            content=request.query,
            intent=result.get("intent"),
        ))
        db.add(models.ChatHistory(
            project_id=request.project_id,
            role="assistant",
            content=result.get("summary", ""),
            intent=result.get("intent"),
        ))
        db.commit()
    except Exception as e:
        print(f"[Chat history error] {e}")

    return schemas.AgentResponse(
        query=result["query"],
        intent=result["intent"],
        summary=result["summary"],
        criticalDecisions=[schemas.CriticalDecision(**cd) for cd in result["criticalDecisions"]],
        riskPrediction=schemas.RiskPrediction(**result["riskPrediction"]),
        suggestions=result["suggestions"],
        actions=[schemas.AgentAction(**a) for a in result["actions"]],
        timestamp=result["timestamp"],
        raw_gemini_response=result.get("raw_gemini_response"),
    )


@router.post("/upload-schedule/{project_id}")
async def upload_ms_project(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Parsea el XML de MS Project y persiste todo en BD.
    Si el proyecto ya tiene un cronograma cargado, rechaza la subida.
    """
    if not file.filename.endswith(".xml"):
        raise HTTPException(status_code=422, detail="Solo se aceptan archivos XML de MS Project")

    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=422, detail="Archivo demasiado grande (máx 10MB)")

    # Verificar o crear proyecto
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        project = models.Project(
            id=project_id,
            name=project_id,
            location="Lima, Perú",
            abbr=project_id[:2].upper(),
            color="#6366F1",
        )
        db.add(project)
        db.flush()

    # ── BLOQUEAR si ya tiene cronograma cargado ──────────────────────────────
    if project.rag_context:
        raise HTTPException(
            status_code=409,
            detail=f"Este proyecto ya tiene un cronograma cargado: \"{project.name}\". Para reemplazarlo, usa el endpoint DELETE /api/agent/schedule/{project_id} primero."
        )

    # Parsear XML
    content = await file.read()
    try:
        parsed = parse_ms_project_xml(content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error al parsear el XML: {str(e)}")

    project_info = parsed["project_info"]

    # Actualizar datos del proyecto con info del XML
    if project_info.get("title"):
        project.name = project_info["title"]
    if project_info.get("company"):
        project.location = project_info["company"]

    # ── PERSISTIR RAG CONTEXT EN BD ──────────────────────────────────────────
    project.rag_context = parsed["rag_context"]
    print(f"[RAG] Guardado en BD para {project_id}: {len(parsed['rag_context'])} chars")

    # Eliminar nodos previos y guardar los nuevos
    db.query(models.Node).filter(models.Node.project_id == project_id).delete()
    db.flush()

    nodes_for_frontend = nodes_to_frontend_format(parsed["nodes"])
    for raw_node in nodes_for_frontend:
        db.add(models.Node(
            id=raw_node["id"],
            project_id=project_id,
            code=raw_node.get("code"),
            title=raw_node.get("title", ""),
            owner=raw_node.get("owner"),
            role=raw_node.get("role"),
            due=raw_node.get("due"),
            remaining=raw_node.get("remaining"),
            status=raw_node.get("status", "pending"),
            impact_days=raw_node.get("impactDays", 0),
            impact_cost=raw_node.get("impactCost", 0),
            critical=raw_node.get("critical", False),
            desc=raw_node.get("desc", ""),
            parent_id=raw_node.get("parent"),
            pos_x=raw_node.get("x", 200),
            pos_y=raw_node.get("y", 200),
        ))

    db.commit()
    print(f"[Parser] {len(nodes_for_frontend)} nodos guardados para {project_id}")

    return {
        "success": True,
        "project_info": project_info,
        "summary": parsed["summary"],
        "nodes": nodes_for_frontend,
        "resources": parsed["resources"],
        "message": f"Cronograma cargado: {parsed['summary']['total_tasks']} tareas, {parsed['summary']['total_phases']} fases, {parsed['summary']['critical_tasks']} en ruta crítica.",
    }


@router.delete("/schedule/{project_id}", status_code=200)
def delete_schedule(project_id: str, db: Session = Depends(get_db)):
    """
    Elimina el cronograma de un proyecto (RAG context + nodos).
    Permite volver a subir un XML diferente.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    project.rag_context = None
    db.query(models.Node).filter(models.Node.project_id == project_id).delete()
    db.commit()

    return {"success": True, "message": f"Cronograma eliminado para {project_id}"}


@router.get("/rag-status/{project_id}")
def get_rag_status(project_id: str, db: Session = Depends(get_db)):
    """
    Verifica si hay cronograma cargado para un proyecto.
    El frontend usa esto para mostrar/ocultar el botón de carga.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    has_rag = bool(project and project.rag_context)
    project_name = project.name if project else None

    return {
        "project_id": project_id,
        "has_rag_context": has_rag,
        "project_name": project_name,
        "context_size": len(project.rag_context) if has_rag else 0,
    }


@router.get("/history/{project_id}")
def get_chat_history(project_id: str, limit: int = 20, db: Session = Depends(get_db)):
    rows = (
        db.query(models.ChatHistory)
        .filter(models.ChatHistory.project_id == project_id)
        .order_by(models.ChatHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "role": r.role,
            "content": r.content,
            "intent": r.intent,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reversed(rows)
    ]