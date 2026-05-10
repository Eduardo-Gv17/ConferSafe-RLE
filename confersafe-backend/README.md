# ConferSafe — Backend FastAPI

El cerebro de **Confi**, el agente IA de gestión de proyectos de construcción.

## Stack

| Capa | Tecnología |
|------|-----------|
| API  | FastAPI + Python 3.11+ |
| IA   | Google Gemini 1.5 Flash |
| BD   | SQLite (dev) / PostgreSQL (prod) |
| ORM  | SQLAlchemy 2.0 |

---

## Instalación rápida

### 1. Clona / copia la carpeta del backend

```bash
cd confersafe-backend
```

### 2. Crea un entorno virtual

```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate          # Windows
```

### 3. Instala dependencias

```bash
pip install -r requirements.txt
```

### 4. Configura el entorno

```bash
cp .env.example .env
# Abre .env y pega tu GEMINI_API_KEY
```

> 🔑 Obtén tu API key gratis (sin tarjeta) en https://aistudio.google.com/

### 5. Corre el servidor

```bash
uvicorn main:app --reload
```

El servidor estará en **http://localhost:8000**  
Documentación Swagger: **http://localhost:8000/docs**

---

## Conectar el frontend

### Opción A (mínimo esfuerzo)

Copia el archivo `frontend_integration/assistantService.js` a:
```
confersafe-frontend/src/engine/assistantService.js
```

Reemplaza el archivo original. El nuevo archivo:
- Llama al backend real cuando está disponible
- Cae automáticamente al modo offline (lógica original) si el backend no responde
- No rompe nada si el servidor está apagado

### Opción B (variable de entorno)

Crea un `.env.local` en la raíz del frontend:
```
VITE_API_URL=http://localhost:8000/api
```

---

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/agent/analyze` | **Pregunta a Confi (IA)** |
| `GET`  | `/api/agent/history/{project_id}` | Historial de conversación |
| `GET`  | `/api/projects/` | Lista de proyectos |
| `GET`  | `/api/nodes/{project_id}` | Decisiones del proyecto |
| `PUT`  | `/api/nodes/{project_id}/batch` | Sincronizar nodos desde frontend |
| `PATCH`| `/api/nodes/{project_id}/{node_id}/status` | Cambiar estado de una decisión |
| `POST` | `/api/nodes/{project_id}` | Crear nueva decisión |
| `DELETE`| `/api/nodes/{project_id}/{node_id}` | Eliminar decisión |

---

## Cómo funciona Confi

```
Usuario pregunta
      ↓
FastAPI recibe query + nodos actuales + historial
      ↓
gemini_service.py construye:
  1. System prompt (experto en construcción peruana)
  2. Contexto del proyecto (nodos, riesgos, fechas)
  3. Historial de conversación (últimos 4 turnos)
      ↓
Gemini 1.5 Flash genera respuesta JSON estructurada
      ↓
Backend parsea, valida y enriquece la respuesta
      ↓
Frontend recibe: summary + critical_decisions + risk + suggestions + actions
```

### El System Prompt

Confi conoce:
- **RNE** (Reglamento Nacional de Edificaciones)
- **INVIERTE.PE** (Sistema Nacional de Inversión Pública)
- **OSCE** (Ley de Contrataciones del Estado)
- **Metodología CPM/PERT** (Ruta Crítica)
- **Gestión de riesgos en obra** (costos, plazos, responsables)

---

## Migrar a PostgreSQL

1. Instala el driver:
   ```bash
   pip install psycopg2-binary
   ```

2. Edita `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/confersafe
   ```

3. El resto es automático — SQLAlchemy crea las tablas.

---

## Estructura del proyecto

```
confersafe-backend/
├── main.py              # FastAPI app + CORS + lifespan
├── database.py          # SQLAlchemy engine + session
├── models.py            # Tablas: Project, Node, ChatHistory
├── schemas.py           # Pydantic request/response models
├── gemini_service.py    # Lógica de IA (Gemini + fallback)
├── seed_data.py         # Datos iniciales (espeja src/data.js)
├── requirements.txt
├── .env.example
├── routers/
│   ├── projects.py      # CRUD proyectos
│   ├── nodes.py         # CRUD decisiones
│   └── agent.py         # Endpoint IA
└── frontend_integration/
    └── assistantService.js   # Drop-in replacement para el frontend
```
