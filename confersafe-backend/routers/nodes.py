from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas

router = APIRouter()


def node_to_out(node: models.Node) -> schemas.NodeOut:
    return schemas.NodeOut.from_orm_node(node)


@router.get("/{project_id}", response_model=List[schemas.NodeOut])
def get_nodes(project_id: str, db: Session = Depends(get_db)):
    """Get all nodes/decisions for a project."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    nodes = db.query(models.Node).filter(models.Node.project_id == project_id).all()
    return [node_to_out(n) for n in nodes]


@router.put("/{project_id}/batch", response_model=List[schemas.NodeOut])
def batch_upsert_nodes(project_id: str, body: schemas.NodesBatchUpsert, db: Session = Depends(get_db)):
    """
    Sync all nodes from frontend to DB.
    This replaces the localStorage approach — the frontend calls this
    whenever it saves state.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    # Delete nodes that no longer exist in the incoming list
    incoming_ids = {n["id"] for n in body.nodes}
    db.query(models.Node).filter(
        models.Node.project_id == project_id,
        ~models.Node.id.in_(incoming_ids)
    ).delete(synchronize_session=False)

    result = []
    for raw in body.nodes:
        existing = db.query(models.Node).filter(
            models.Node.id == raw["id"],
            models.Node.project_id == project_id
        ).first()

        node_data = {
            "id":          raw["id"],
            "project_id":  project_id,
            "code":        raw.get("code"),
            "title":       raw.get("title", ""),
            "owner":       raw.get("owner"),
            "role":        raw.get("role"),
            "due":         raw.get("due"),
            "remaining":   raw.get("remaining"),
            "status":      raw.get("status", "pending"),
            "impact_days": raw.get("impactDays", raw.get("impact_days", 0)),
            "impact_cost": raw.get("impactCost", raw.get("impact_cost", 0)),
            "critical":    raw.get("critical", False),
            "desc":        raw.get("desc", ""),
            "parent_id":   raw.get("parent") or raw.get("parent_id"),
            "pos_x":       raw.get("x", raw.get("pos_x", 200)),
            "pos_y":       raw.get("y", raw.get("pos_y", 200)),
        }

        if existing:
            for k, v in node_data.items():
                if k not in ("id", "project_id"):
                    setattr(existing, k, v)
            result.append(existing)
        else:
            new_node = models.Node(**node_data)
            db.add(new_node)
            result.append(new_node)

    db.commit()
    for n in result:
        db.refresh(n)

    return [node_to_out(n) for n in result]


@router.patch("/{project_id}/{node_id}/status")
def update_node_status(
    project_id: str,
    node_id: str,
    body: dict,
    db: Session = Depends(get_db)
):
    """Quick status update — used by Confi's action buttons."""
    node = db.query(models.Node).filter(
        models.Node.id == node_id,
        models.Node.project_id == project_id,
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Decisión no encontrada")

    new_status = body.get("status")
    valid = {"pending", "review", "approved", "risk", "done", "rejected"}
    if new_status not in valid:
        raise HTTPException(status_code=422, detail=f"Estado inválido. Válidos: {valid}")

    node.status = new_status
    db.commit()
    db.refresh(node)
    return node_to_out(node)


@router.post("/{project_id}", response_model=schemas.NodeOut, status_code=201)
def create_node(project_id: str, data: schemas.NodeCreate, db: Session = Depends(get_db)):
    """Create a single new decision node."""
    if db.query(models.Node).filter(models.Node.id == data.id, models.Node.project_id == project_id).first():
        raise HTTPException(status_code=409, detail="Ya existe un nodo con ese ID")

    node = models.Node(
        project_id=project_id,
        id=data.id,
        code=data.code,
        title=data.title,
        owner=data.owner,
        role=data.role,
        due=data.due,
        remaining=data.remaining,
        status=data.status,
        impact_days=data.impact_days,
        impact_cost=data.impact_cost,
        critical=data.critical,
        desc=data.desc,
        parent_id=data.parent_id,
        pos_x=data.pos_x,
        pos_y=data.pos_y,
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return node_to_out(node)


@router.delete("/{project_id}/{node_id}", status_code=204)
def delete_node(project_id: str, node_id: str, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(
        models.Node.id == node_id,
        models.Node.project_id == project_id,
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Decisión no encontrada")
    db.delete(node)
    db.commit()
