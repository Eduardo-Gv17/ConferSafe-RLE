from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id          = Column(String, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    location    = Column(String)
    abbr        = Column(String(5))
    color       = Column(String(10))
    rag_context = Column(Text, nullable=True)   # ← NUEVO: contexto RAG del XML persistido

    nodes = relationship("Node", back_populates="project", cascade="all, delete-orphan")
    chats = relationship("ChatHistory", back_populates="project", cascade="all, delete-orphan")


class Node(Base):
    __tablename__ = "nodes"

    id          = Column(String, primary_key=True, index=True)
    project_id  = Column(String, ForeignKey("projects.id"), nullable=False)
    code        = Column(String(20))
    title       = Column(String(300), nullable=False)
    owner       = Column(String(200))
    role        = Column(String(200))
    due         = Column(String(20))
    remaining   = Column(Integer, nullable=True)
    status      = Column(String(20), default="pending")
    impact_days = Column(Integer, default=0)
    impact_cost = Column(Float, default=0)
    critical    = Column(Boolean, default=False)
    desc        = Column(Text, default="")
    parent_id   = Column(String, nullable=True)
    pos_x       = Column(Float, default=200)
    pos_y       = Column(Float, default=200)

    project = relationship("Project", back_populates="nodes")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    role       = Column(String(10))
    content    = Column(Text)
    intent     = Column(String(30), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="chats")