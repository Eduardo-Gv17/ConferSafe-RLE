import AlertsList from '../components/AlertsList'

export default function ViewAlertas({ nodes }) {
  const riskCount = nodes.filter(n => n.status === 'risk').length
  const warningCount = nodes.filter(n => n.remaining !== null && n.remaining <= 7 && n.remaining >= 0).length

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F3F4F6' }}>Centro de Alertas</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Ordenadas por severidad · Proyecto Hospital D.A. Carrión</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 11.5, fontWeight: 700 }}>{riskCount} críticas</span>
          <span style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', fontSize: 11.5, fontWeight: 700 }}>{warningCount} avisos</span>
        </div>
      </div>
      <AlertsList nodes={nodes} />
    </div>
  )
}
