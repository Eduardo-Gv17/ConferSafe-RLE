from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from database import engine, Base
from routers import projects, nodes, agent

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="ConferSafe API",
    description="Backend para gestión de decisiones en proyectos de construcción",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["Proyectos"])
app.include_router(nodes.router, prefix="/api/nodes", tags=["Decisiones"])
app.include_router(agent.router, prefix="/api/agent", tags=["Agente IA"])


@app.get("/")
def root():
    return {"message": "ConferSafe API corriendo 🏗️", "docs": "/docs"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
