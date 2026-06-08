from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from database import get_db
import models

router = APIRouter()


class WaitlistEntry(BaseModel):
    nombre: str
    empresa: Optional[str] = ""
    whatsapp: Optional[str] = ""
    email: str
    mensaje: Optional[str] = ""


@router.post("/", status_code=201)
def join_waitlist(entry: WaitlistEntry, db: Session = Depends(get_db)):
    # Verificar si el email ya está registrado
    existing = db.query(models.Waitlist).filter(
        models.Waitlist.email == entry.email.lower().strip()
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Este correo ya está en la lista de espera. Te contactaremos pronto."
        )

    db_entry = models.Waitlist(
        nombre=entry.nombre.strip(),
        empresa=entry.empresa.strip() if entry.empresa else "",
        whatsapp=entry.whatsapp.strip() if entry.whatsapp else "",
        email=entry.email.lower().strip(),
        mensaje=entry.mensaje.strip() if entry.mensaje else "",
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    print(f"[Waitlist] Nuevo registro: {entry.nombre} <{entry.email}> — {entry.empresa}")

    return {
        "success": True,
        "message": "¡Gracias! Te contactaremos en menos de 24 horas.",
        "id": db_entry.id,
    }


@router.get("/")
def list_waitlist(db: Session = Depends(get_db)):
    """Ver todos los registros — usar solo internamente."""
    entries = db.query(models.Waitlist).order_by(models.Waitlist.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "nombre": e.nombre,
            "empresa": e.empresa,
            "whatsapp": e.whatsapp,
            "email": e.email,
            "mensaje": e.mensaje,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in entries
    ]
