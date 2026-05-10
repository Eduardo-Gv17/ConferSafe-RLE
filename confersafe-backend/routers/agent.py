from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
import models, schemas
from gemini_service import call_gemini

router = APIRouter()


@router.post("/analyze", response_model=schemas.AgentResponse)
async def analyze(request: schemas.AgentRequest, db: Session = Depends(get_db)):
    """
    Main Confi endpoint.
    Accepts the current node state from the frontend, calls Gemini,
    and returns a structured analysis response.
    """
    # Validate project exists
    project = db.query(models.Project).filter(models.Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    # Call Gemini (or fallback)
    result = await call_gemini(
        query=request.query,
        project_id=request.project_id,
        nodes=request.nodes,
        conversation_history=request.conversation_history,
    )

    # Persist conversation in DB
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
        print(f"[Chat history save error] {e}")
        # Don't fail the response because of a logging error

    # Map to response schema
    return schemas.AgentResponse(
        query=result["query"],
        intent=result["intent"],
        summary=result["summary"],
        criticalDecisions=[
            schemas.CriticalDecision(**cd) for cd in result["criticalDecisions"]
        ],
        riskPrediction=schemas.RiskPrediction(**result["riskPrediction"]),
        suggestions=result["suggestions"],
        actions=[schemas.AgentAction(**a) for a in result["actions"]],
        timestamp=result["timestamp"],
        raw_gemini_response=result.get("raw_gemini_response"),
    )


@router.get("/history/{project_id}")
def get_chat_history(project_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """Get recent conversation history for a project."""
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
