import { useState } from 'react'
import { STATUS } from '../data'

export default function ModalNuevaDecision({ nodes, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', owner: '', role: '', due: '', status: 'pending', impactDays: '', impactCost: '', parent: 'root', critical: false })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.title.trim() || !form.owner.trim()) return
    onSave({
      id: `custom_${Date.now()}`,
      code: `${nodes.length}`,
      title: form.title, owner: form.owner, role: form.role, due: form.due,
      status: form.status,
      impactDays: parseInt(form.impactDays) || 0,
      impactCost: parseInt(form.impactCost) || 0,
      parent: form.parent, critical: form.critical,
      remaining: null, desc: 'Nueva decisión agregada manualmente.',
      x: 300 + Math.random() * 400, y: 520,
    })
    onClose()
  }

  const inputStyle = { padding: '7px 10px', borderRadius: 7, border: '1px solid #1f2436', background: '#0d0f1a', color: '#E5E7EB', fontSize: 12.5, outline: 'none', width: '100%' }
  const labelStyle = { fontSize: 10.5, color: '#6B7280', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 520, background: '#141826', border: '1px solid #1f2436', borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid #1c2030', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F3F4F6' }}>Nueva decisión</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          <div>
            <label style={labelStyle}>Título de la decisión</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej. Aprobación de planos estructurales" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['Responsable', 'owner', 'Nombre completo'], ['Rol', 'role', 'Cargo o función'], ['Fecha límite', 'due', 'DD/MM/AAAA']].map(([lbl, key, ph]) => (
              <div key={key}>
                <label style={labelStyle}>{lbl}</label>
                <input style={inputStyle} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} />
              </div>
            ))}
            <div>
              <label style={labelStyle}>Estado inicial</label>
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            {[['Impacto días', 'impactDays', '0'], ['Impacto S/', 'impactCost', '0']].map(([lbl, key, ph]) => (
              <div key={key}>
                <label style={labelStyle}>{lbl}</label>
                <input style={inputStyle} type="number" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} />
              </div>
            ))}
          </div>

          <div>
            <label style={labelStyle}>Nodo padre (dependencia)</label>
            <select style={inputStyle} value={form.parent} onChange={e => set('parent', e.target.value)}>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.code} — {n.title.slice(0, 40)}</option>)}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.critical} onChange={e => set('critical', e.target.checked)} style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 12, color: '#E5E7EB', fontWeight: 500 }}>Marcar como nodo de ruta crítica</span>
          </label>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #1c2030', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #1f2436', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontSize: 12.5, fontWeight: 500 }}>Cancelar</button>
          <button onClick={handleSave} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>Guardar decisión</button>
        </div>
      </div>
    </div>
  )
}
