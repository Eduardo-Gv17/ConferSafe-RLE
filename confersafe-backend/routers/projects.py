from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas
from seed_data import INITIAL_PROJECTS, INITIAL_NODES_MIRADOR, INITIAL_NODES_CC

router = APIRouter()


def _seed_project(db: Session, project_id: str, project_data: dict, nodes_data: list):
    """Create project + its default nodes if not already in DB."""
    exists = db.query(models.Project).filter(models.Project.id == project_id).first()
    if exists:
        return

    db_project = models.Project(**project_data)
    db.add(db_project)
    db.flush()

    for n in nodes_data:
        db_node = models.Node(
            project_id=project_id,
            **n,
        )
        db.add(db_node)

    db.commit()


@router.get("/", response_model=List[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    """List all projects. Seeds defaults on first call."""
    # Auto-seed if empty
    count = db.query(models.Project).count()
    if count == 0:
        for pd in INITIAL_PROJECTS:
            nodes = INITIAL_NODES_MIRADOR if pd["id"] == "edificio-mirador" else INITIAL_NODES_CC
            _seed_project(db, pd["id"], pd, nodes)

    return db.query(models.Project).all()


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return project


@router.post("/", response_model=schemas.ProjectOut, status_code=201)
def create_project(data: schemas.ProjectCreate, db: Session = Depends(get_db)):
    if db.query(models.Project).filter(models.Project.id == data.id).first():
        raise HTTPException(status_code=409, detail="Ya existe un proyecto con ese ID")
    db_project = models.Project(**data.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project
