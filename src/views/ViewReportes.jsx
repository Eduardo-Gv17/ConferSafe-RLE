import { Icon } from '../components/ui'

const REPORTS = [
  { title: 'Compatibilidad INVIERTE.PE', sub: 'Sistema Nacional de Programación Multianual y Gestión de Inversiones', color: '#10B981', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { title: 'Registro OSCE',              sub: 'Organismo Supervisor de las Contrataciones del Estado — Expediente digital', color: '#3B82F6', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { title: 'Exportar PDF Ejecutivo',     sub: 'Resumen de decisiones y ruta crítica para comité directivo', color: '#8B5CF6', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { title: 'Exportar Excel',             sub: 'Datos completos de decisiones, responsables e impactos', color: '#F59E0B', icon: 'M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z' },
]

const LEGAL = [
  { label: 'INVIERTE.PE', color: '#10B981', desc: 'Ley 27293 · Sistema Nacional de Inversión Pública' },
  { label: 'OSCE',        color: '#3B82F6', desc: 'D.L. 1444 · Ley de Contrataciones del Estado' },
  { label: 'RNE',         color: '#F59E0B', desc: 'Reglamento Nacional de Edificaciones — Norma E.030' },
]

export default function ViewReportes() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#F3F4F6' }}>Reportes y Exportaciones</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {REPORTS.map((r, i) => (
          <div key={i}
            style={{ padding: 20, borderRadius: 10, background: '#141826', border: '1px solid #1c2030', display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${r.color}40`}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1c2030'}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: `${r.color}18`, border: `1px solid ${r.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon d={r.icon} size={18} color={r.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.4 }}>{r.sub}</div>
              <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: r.color, fontWeight: 600 }}>
                Generar reporte
                <Icon d="M5 12h14M12 5l7 7-7 7" size={11} color={r.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 16, borderRadius: 10, background: '#141826', border: '1px solid #1c2030' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#D1D5DB', marginBottom: 8 }}>Marco regulatorio</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {LEGAL.map((t, i) => (
            <div key={i} style={{ flex: 1, padding: '10px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.02)', border: `1px solid ${t.color}25` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 10.5, color: '#6B7280' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
