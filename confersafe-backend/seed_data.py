"""
Initial seed data — mirrors src/data.js from the frontend.
Run once on startup if projects table is empty.
"""

INITIAL_PROJECTS = [
    {
        "id": "edificio-mirador",
        "name": "Edificio Mirador",
        "location": "San Isidro, Lima",
        "abbr": "EM",
        "color": "#6366F1",
    },
    {
        "id": "cc-el-sol",
        "name": "CC El Sol",
        "location": "Miraflores, Lima",
        "abbr": "CS",
        "color": "#0891B2",
    },
]

INITIAL_NODES_MIRADOR = [
    {
        "id": "root", "code": "0", "title": "Inicio del proyecto",
        "status": "approved", "pos_x": 590, "pos_y": 50, "parent_id": None,
        "owner": "Rodrigo Palma", "role": "Director de Proyecto",
        "due": "01/03/2026", "remaining": None, "impact_days": 0, "impact_cost": 0, "critical": False,
        "desc": "Hito de arranque. Directorio de Grupo Alcázar aprobó el inicio del Edificio Mirador — 10 pisos, uso mixto, San Isidro.",
    },
    {
        "id": "n1", "code": "1", "title": "Selección del contratista general",
        "status": "pending", "pos_x": 200, "pos_y": 180, "parent_id": "root",
        "owner": "Rodrigo Palma", "role": "Director de Proyecto",
        "due": "08/05/2026", "remaining": 4, "impact_days": 15, "impact_cost": 320000, "critical": True,
        "desc": "Evaluación y adjudicación del contratista principal. Cuatro postores pre-calificados.",
    },
    {
        "id": "n2", "code": "2", "title": "Aprobación del diseño estructural",
        "status": "approved", "pos_x": 590, "pos_y": 180, "parent_id": "root",
        "owner": "Marco Herrera", "role": "Ingeniero Estructural",
        "due": "10/04/2026", "remaining": None, "impact_days": 0, "impact_cost": 0, "critical": False,
        "desc": "Planos estructurales validados. Sistema aporticado de concreto armado + aisladores sísmicos.",
    },
    {
        "id": "n3", "code": "3", "title": "Permisos municipales de obra",
        "status": "review", "pos_x": 980, "pos_y": 180, "parent_id": "root",
        "owner": "Valeria Torres", "role": "Gestora Legal",
        "due": "22/05/2026", "remaining": 18, "impact_days": 10, "impact_cost": 180000, "critical": True,
        "desc": "Licencia de edificación y autorizaciones de la Municipalidad de San Isidro.",
    },
    {
        "id": "n11", "code": "1.1", "title": "Evaluación de propuestas técnicas",
        "status": "pending", "pos_x": 90, "pos_y": 330, "parent_id": "n1",
        "owner": "Carlos Ibáñez", "role": "Jefe de Obras",
        "due": "06/05/2026", "remaining": 2, "impact_days": 5, "impact_cost": 95000, "critical": True,
        "desc": "Revisión técnica y económica de las 4 propuestas recibidas.",
    },
    {
        "id": "n12", "code": "1.2", "title": "Verificación de referencias",
        "status": "risk", "pos_x": 290, "pos_y": 330, "parent_id": "n1",
        "owner": "Daniela Cáceres", "role": "Analista de Contratos",
        "due": "02/05/2026", "remaining": -2, "impact_days": 8, "impact_cost": 210000, "critical": True,
        "desc": "Validación de obras ejecutadas y solidez financiera de los postores. Vencida hace 2 días.",
    },
    {
        "id": "n21", "code": "2.1", "title": "Revisión de planos estructurales",
        "status": "approved", "pos_x": 490, "pos_y": 330, "parent_id": "n2",
        "owner": "Marco Herrera", "role": "Ingeniero Estructural",
        "due": "20/03/2026", "remaining": None, "impact_days": 0, "impact_cost": 0, "critical": False,
        "desc": "Revisión detallada de planos completada. Sin observaciones.",
    },
    {
        "id": "n22", "code": "2.2", "title": "Proveedor de acero corrugado",
        "status": "pending", "pos_x": 690, "pos_y": 330, "parent_id": "n2",
        "owner": "Andrea Núñez", "role": "Jefa de Logística",
        "due": "12/05/2026", "remaining": 8, "impact_days": 6, "impact_cost": 145000, "critical": False,
        "desc": "Negociación y orden de compra para acero corrugado fy=4200.",
    },
    {
        "id": "n31", "code": "3.1", "title": "Licencia de edificación",
        "status": "review", "pos_x": 890, "pos_y": 330, "parent_id": "n3",
        "owner": "Valeria Torres", "role": "Gestora Legal",
        "due": "28/05/2026", "remaining": 24, "impact_days": 7, "impact_cost": 135000, "critical": True,
        "desc": "Expediente de licencia ingresado a la Municipalidad de San Isidro.",
    },
    {
        "id": "n32", "code": "3.2", "title": "Proveedor de concreto premezclado",
        "status": "pending", "pos_x": 1080, "pos_y": 330, "parent_id": "n3",
        "owner": "Andrea Núñez", "role": "Jefa de Logística",
        "due": "15/05/2026", "remaining": 11, "impact_days": 9, "impact_cost": 198000, "critical": False,
        "desc": "Contrato con planta de concreto para abastecimiento continuo.",
    },
    {
        "id": "n111", "code": "1.1.1", "title": "Reuniones con contratistas",
        "status": "done", "pos_x": 90, "pos_y": 470, "parent_id": "n11",
        "owner": "Carlos Ibáñez", "role": "Jefe de Obras",
        "due": "25/04/2026", "remaining": None, "impact_days": 0, "impact_cost": 0, "critical": False,
        "desc": "Reuniones técnicas realizadas con los 4 contratistas. Minutas firmadas.",
    },
    {
        "id": "n311", "code": "3.1.1", "title": "Parámetros urbanísticos",
        "status": "pending", "pos_x": 890, "pos_y": 470, "parent_id": "n31",
        "owner": "Sofía Quiroz", "role": "Arquitecta Senior",
        "due": "18/05/2026", "remaining": 14, "impact_days": 4, "impact_cost": 72000, "critical": True,
        "desc": "Certificado de parámetros urbanísticos y edificatorios del predio.",
    },
]

INITIAL_NODES_CC = [
    {
        "id": "root", "code": "0", "title": "Inicio del proyecto",
        "status": "approved", "pos_x": 420, "pos_y": 50, "parent_id": None,
        "owner": "Patricia Lema", "role": "Directora de Proyecto",
        "due": "15/02/2026", "remaining": None, "impact_days": 0, "impact_cost": 0, "critical": False,
        "desc": "Arranque del centro comercial de 4 niveles + 2 sótanos en Miraflores.",
    },
    {
        "id": "n1", "code": "1", "title": "Diseño arquitectónico",
        "status": "approved", "pos_x": 200, "pos_y": 180, "parent_id": "root",
        "owner": "Felipe Mora", "role": "Arquitecto Jefe",
        "due": "20/03/2026", "remaining": None, "impact_days": 0, "impact_cost": 0, "critical": False,
        "desc": "Planos arquitectónicos aprobados por el cliente y el municipio.",
    },
    {
        "id": "n2", "code": "2", "title": "Estudio de impacto vial",
        "status": "review", "pos_x": 640, "pos_y": 180, "parent_id": "root",
        "owner": "Rocío Salas", "role": "Consultora de Tráfico",
        "due": "20/05/2026", "remaining": 16, "impact_days": 8, "impact_cost": 95000, "critical": True,
        "desc": "Evaluación de impacto de tránsito vehicular en avenida principal.",
    },
    {
        "id": "n11", "code": "1.1", "title": "Aprobación de fachada",
        "status": "pending", "pos_x": 100, "pos_y": 330, "parent_id": "n1",
        "owner": "Municipalidad Miraflores", "role": "Entidad Reguladora",
        "due": "10/05/2026", "remaining": 6, "impact_days": 5, "impact_cost": 60000, "critical": True,
        "desc": "Validación del diseño de fachada por la municipalidad de Miraflores.",
    },
    {
        "id": "n12", "code": "1.2", "title": "Maqueta 3D aprobada",
        "status": "done", "pos_x": 300, "pos_y": 330, "parent_id": "n1",
        "owner": "Felipe Mora", "role": "Arquitecto Jefe",
        "due": "15/03/2026", "remaining": None, "impact_days": 0, "impact_cost": 0, "critical": False,
        "desc": "Maqueta digital y renders aprobados por el cliente.",
    },
    {
        "id": "n21", "code": "2.1", "title": "Aforo de plazas de parqueo",
        "status": "risk", "pos_x": 540, "pos_y": 330, "parent_id": "n2",
        "owner": "Rocío Salas", "role": "Consultora de Tráfico",
        "due": "05/05/2026", "remaining": 1, "impact_days": 12, "impact_cost": 140000, "critical": True,
        "desc": "Cálculo de plazas de estacionamiento requeridas. Vence mañana sin cierre.",
    },
    {
        "id": "n22", "code": "2.2", "title": "Convenio con municipalidad",
        "status": "pending", "pos_x": 740, "pos_y": 330, "parent_id": "n2",
        "owner": "Patricia Lema", "role": "Directora de Proyecto",
        "due": "28/05/2026", "remaining": 24, "impact_days": 6, "impact_cost": 75000, "critical": False,
        "desc": "Firma de convenio de vía alternativa durante etapa de construcción.",
    },
]
