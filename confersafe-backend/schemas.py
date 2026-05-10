from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ── Project ────────────────────────────────────────────────────────────────────

class ProjectBase(BaseModel):
    id: str
    name: str
    location: Optional[str] = None
    abbr: Optional[str] = None
    color: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    class Config:
        from_attributes = True


# ── Node ───────────────────────────────────────────────────────────────────────

class NodeBase(BaseModel):
    id: str
    code: Optional[str] = None
    title: str
    owner: Optional[str] = None
    role: Optional[str] = None
    due: Optional[str] = None
    remaining: Optional[int] = None
    status: str = "pending"
    impact_days: int = Field(default=0, alias="impactDays")
    impact_cost: float = Field(default=0, alias="impactCost")
    critical: bool = False
    desc: Optional[str] = ""
    parent_id: Optional[str] = Field(default=None, alias="parent")
    pos_x: float = Field(default=200, alias="x")
    pos_y: float = Field(default=200, alias="y")

    class Config:
        populate_by_name = True

class NodeCreate(NodeBase):
    project_id: str

class NodeUpdate(BaseModel):
    title: Optional[str] = None
    owner: Optional[str] = None
    role: Optional[str] = None
    due: Optional[str] = None
    remaining: Optional[int] = None
    status: Optional[str] = None
    impact_days: Optional[int] = Field(default=None, alias="impactDays")
    impact_cost: Optional[float] = Field(default=None, alias="impactCost")
    critical: Optional[bool] = None
    desc: Optional[str] = None
    parent_id: Optional[str] = Field(default=None, alias="parent")
    pos_x: Optional[float] = Field(default=None, alias="x")
    pos_y: Optional[float] = Field(default=None, alias="y")

    class Config:
        populate_by_name = True

class NodeOut(BaseModel):
    id: str
    code: Optional[str]
    title: str
    owner: Optional[str]
    role: Optional[str]
    due: Optional[str]
    remaining: Optional[int]
    status: str
    impactDays: int
    impactCost: float
    critical: bool
    desc: Optional[str]
    parent: Optional[str]
    x: float
    y: float
    project_id: str

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_node(cls, node):
        return cls(
            id=node.id,
            code=node.code,
            title=node.title,
            owner=node.owner,
            role=node.role,
            due=node.due,
            remaining=node.remaining,
            status=node.status,
            impactDays=node.impact_days,
            impactCost=node.impact_cost,
            critical=node.critical,
            desc=node.desc,
            parent=node.parent_id,
            x=node.pos_x,
            y=node.pos_y,
            project_id=node.project_id,
        )


# ── Batch node upsert (used when frontend syncs all nodes) ─────────────────────

class NodesBatchUpsert(BaseModel):
    nodes: List[dict]   # raw frontend node objects


# ── Agent / Chat ───────────────────────────────────────────────────────────────

class AgentRequest(BaseModel):
    query: str
    project_id: str
    nodes: List[dict]           # current node state from frontend
    conversation_history: Optional[List[dict]] = []   # [{role, content}]

class CriticalDecision(BaseModel):
    id: str
    code: Optional[str]
    title: str
    owner: Optional[str]
    status: str
    remaining: Optional[int]
    impactDays: int
    impactCost: float
    urgency: str

class RiskPrediction(BaseModel):
    message: str
    affectedDays: int
    affectedCost: float

class AgentAction(BaseModel):
    type: str
    nodeId: str
    newStatus: str
    label: str

class AgentResponse(BaseModel):
    query: str
    intent: str
    summary: str
    criticalDecisions: List[CriticalDecision]
    riskPrediction: RiskPrediction
    suggestions: List[str]
    actions: List[AgentAction]
    timestamp: str
    raw_gemini_response: Optional[str] = None
