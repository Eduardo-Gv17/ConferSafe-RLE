// Colores optimizados para fondo claro
export const STATUS = {
  pending:  { label: 'Pendiente',   color: '#D97706', bg: '#FFFBEB',  border: '#FDE68A' },
  review:   { label: 'En revisión', color: '#2563EB', bg: '#EFF6FF',  border: '#BFDBFE' },
  approved: { label: 'Aprobada',    color: '#059669', bg: '#ECFDF5',  border: '#A7F3D0' },
  risk:     { label: 'En riesgo',   color: '#DC2626', bg: '#FEF2F2',  border: '#FECACA' },
  rejected: { label: 'Rechazada',   color: '#64748B', bg: '#F8FAFC',  border: '#CBD5E1' },
  done:     { label: 'Completada',  color: '#059669', bg: '#ECFDF5',  border: '#6EE7B7' },
}

// ── Proyectos disponibles ────────────────────────────────────────────────────
export const PROJECTS = [
  { id: 'torre-b-utec', name: 'Proyecto Torre B - UTEC',  location: 'Barranco, Lima',  abbr: 'EM', color: '#6366F1' },
  { id: 'cc-el-sol',        name: 'CC El Sol',          location: 'Miraflores, Lima',  abbr: 'CS', color: '#0891B2' },
]

// ── Proyecto: Edificio Mirador (10 pisos mixtos, San Isidro) ─────────────────
export const INITIAL_NODES = [
  {
    id:'root', code:'0', title:'Inicio del proyecto',
    status:'approved', x:590, y:50, parent:null,
    owner:'Rodrigo Palma', role:'Director de Proyecto',
    due:'01/03/2026', remaining:null, impactDays:0, impactCost:0, critical:false,
    desc:'Hito de arranque. Directorio de Grupo Alcázar aprobó el inicio del Edificio Mirador — 10 pisos, uso mixto, San Isidro.',
  },
  {
    id:'n1', code:'1', title:'Selección del contratista general',
    status:'pending', x:200, y:180, parent:'root',
    owner:'Rodrigo Palma', role:'Director de Proyecto',
    due:'08/05/2026', remaining:4, impactDays:15, impactCost:320000, critical:true,
    desc:'Evaluación y adjudicación del contratista principal. Cuatro postores pre-calificados. Retraso impacta fecha de inicio de excavación.',
  },
  {
    id:'n2', code:'2', title:'Aprobación del diseño estructural',
    status:'approved', x:590, y:180, parent:'root',
    owner:'Marco Herrera', role:'Ingeniero Estructural',
    due:'10/04/2026', remaining:null, impactDays:0, impactCost:0, critical:false,
    desc:'Planos estructurales del edificio validados y firmados. Sistema aporticado de concreto armado + aisladores sísmicos en sótano.',
  },
  {
    id:'n3', code:'3', title:'Permisos municipales de obra',
    status:'review', x:980, y:180, parent:'root',
    owner:'Valeria Torres', role:'Gestora Legal',
    due:'22/05/2026', remaining:18, impactDays:10, impactCost:180000, critical:true,
    desc:'Licencia de edificación y autorizaciones de la Municipalidad de San Isidro. En revisión por el área de obras privadas.',
  },
  {
    id:'n11', code:'1.1', title:'Evaluación de propuestas técnicas',
    status:'pending', x:90, y:330, parent:'n1',
    owner:'Carlos Ibáñez', role:'Jefe de Obras',
    due:'06/05/2026', remaining:2, impactDays:5, impactCost:95000, critical:true,
    desc:'Revisión técnica y económica de las 4 propuestas recibidas. Pendiente de dictamen del comité técnico.',
  },
  {
    id:'n12', code:'1.2', title:'Verificación de referencias',
    status:'risk', x:290, y:330, parent:'n1',
    owner:'Daniela Cáceres', role:'Analista de Contratos',
    due:'02/05/2026', remaining:-2, impactDays:8, impactCost:210000, critical:true,
    desc:'Validación de obras ejecutadas y solidez financiera de los postores. Venció hace 2 días sin cierre.',
  },
  {
    id:'n21', code:'2.1', title:'Revisión de planos estructurales',
    status:'approved', x:490, y:330, parent:'n2',
    owner:'Marco Herrera', role:'Ingeniero Estructural',
    due:'20/03/2026', remaining:null, impactDays:0, impactCost:0, critical:false,
    desc:'Revisión detallada de planos completada. Sin observaciones.',
  },
  {
    id:'n22', code:'2.2', title:'Proveedor de acero corrugado',
    status:'pending', x:690, y:330, parent:'n2',
    owner:'Andrea Núñez', role:'Jefa de Logística',
    due:'12/05/2026', remaining:8, impactDays:6, impactCost:145000, critical:false,
    desc:'Negociación y orden de compra para acero corrugado fy=4200. Tres cotizaciones recibidas, pendiente de elección.',
  },
  {
    id:'n31', code:'3.1', title:'Licencia de edificación',
    status:'review', x:890, y:330, parent:'n3',
    owner:'Valeria Torres', role:'Gestora Legal',
    due:'28/05/2026', remaining:24, impactDays:7, impactCost:135000, critical:true,
    desc:'Expediente de licencia ingresado a la Municipalidad de San Isidro. En etapa de revisión técnica.',
  },
  {
    id:'n32', code:'3.2', title:'Proveedor de concreto premezclado',
    status:'pending', x:1080, y:330, parent:'n3',
    owner:'Andrea Núñez', role:'Jefa de Logística',
    due:'15/05/2026', remaining:11, impactDays:9, impactCost:198000, critical:false,
    desc:'Contrato con planta de concreto para abastecimiento continuo desde inicio de vaciado de cimientos.',
  },
  {
    id:'n111', code:'1.1.1', title:'Reuniones con contratistas',
    status:'done', x:90, y:470, parent:'n11',
    owner:'Carlos Ibáñez', role:'Jefe de Obras',
    due:'25/04/2026', remaining:null, impactDays:0, impactCost:0, critical:false,
    desc:'Reuniones técnicas realizadas con los 4 contratistas. Minutas firmadas.',
  },
  {
    id:'n311', code:'3.1.1', title:'Parámetros urbanísticos',
    status:'pending', x:890, y:470, parent:'n31',
    owner:'Sofía Quiroz', role:'Arquitecta Senior',
    due:'18/05/2026', remaining:14, impactDays:4, impactCost:72000, critical:true,
    desc:'Certificado de parámetros urbanísticos y edificatorios del predio. Requisito previo a la licencia.',
  },
]

// ── Proyecto: CC El Sol (4 niveles + 2 sótanos, Miraflores) ─────────────────
export const INITIAL_NODES_CC = [
  {
    id:'root', code:'0', title:'Inicio del proyecto',
    status:'approved', x:420, y:50, parent:null,
    owner:'Patricia Lema', role:'Directora de Proyecto',
    due:'15/02/2026', remaining:null, impactDays:0, impactCost:0, critical:false,
    desc:'Arranque del centro comercial de 4 niveles + 2 sótanos en Miraflores.',
  },
  {
    id:'n1', code:'1', title:'Diseño arquitectónico',
    status:'approved', x:200, y:180, parent:'root',
    owner:'Felipe Mora', role:'Arquitecto Jefe',
    due:'20/03/2026', remaining:null, impactDays:0, impactCost:0, critical:false,
    desc:'Planos arquitectónicos aprobados por el cliente y el municipio.',
  },
  {
    id:'n2', code:'2', title:'Estudio de impacto vial',
    status:'review', x:640, y:180, parent:'root',
    owner:'Rocío Salas', role:'Consultora de Tráfico',
    due:'20/05/2026', remaining:16, impactDays:8, impactCost:95000, critical:true,
    desc:'Evaluación de impacto de tránsito vehicular en avenida principal. En revisión por MTC.',
  },
  {
    id:'n11', code:'1.1', title:'Aprobación de fachada',
    status:'pending', x:100, y:330, parent:'n1',
    owner:'Municipalidad Miraflores', role:'Entidad Reguladora',
    due:'10/05/2026', remaining:6, impactDays:5, impactCost:60000, critical:true,
    desc:'Validación del diseño de fachada por la municipalidad de Miraflores.',
  },
  {
    id:'n12', code:'1.2', title:'Maqueta 3D aprobada',
    status:'done', x:300, y:330, parent:'n1',
    owner:'Felipe Mora', role:'Arquitecto Jefe',
    due:'15/03/2026', remaining:null, impactDays:0, impactCost:0, critical:false,
    desc:'Maqueta digital y renders aprobados por el cliente.',
  },
  {
    id:'n21', code:'2.1', title:'Aforo de plazas de parqueo',
    status:'risk', x:540, y:330, parent:'n2',
    owner:'Rocío Salas', role:'Consultora de Tráfico',
    due:'05/05/2026', remaining:1, impactDays:12, impactCost:140000, critical:true,
    desc:'Cálculo de plazas de estacionamiento requeridas. Vence mañana sin cierre.',
  },
  {
    id:'n22', code:'2.2', title:'Convenio con municipalidad',
    status:'pending', x:740, y:330, parent:'n2',
    owner:'Patricia Lema', role:'Directora de Proyecto',
    due:'28/05/2026', remaining:24, impactDays:6, impactCost:75000, critical:false,
    desc:'Firma de convenio de vía alternativa durante etapa de construcción.',
  },
]

export const NAV_ITEMS = [
  { key:'agente',     label:'Agente',      icon:'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3z' },
  { key:'decisiones', label:'Decisiones',  icon:'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
  { key:'timeline',   label:'Timeline',    icon:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { key:'arbol',      label:'Árbol',       icon:'M12 3v4M5 21v-6M19 21v-6M12 11v4M4 11h16M12 7a2 2 0 100-4 2 2 0 000 4zM5 15a2 2 0 100-4 2 2 0 000 4zM19 15a2 2 0 100-4 2 2 0 000 4z' },
]

export const fmt = n => new Intl.NumberFormat('es-PE').format(n)
