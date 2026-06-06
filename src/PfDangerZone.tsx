import { useState } from 'react'

interface DangerAction {
  label: string
  onConfirm: () => void | Promise<void>
  confirmTitle: string
  confirmDescription: string
}

interface PfDangerZoneProps {
  actions: DangerAction[]
  'data-testid'?: string
}

export function PfDangerZone({ actions, 'data-testid': testId }: PfDangerZoneProps) {
  const [confirming, setConfirming] = useState<number | null>(null)

  const sectionStyle: React.CSSProperties = {
    background: 'var(--pf-bg-surface)',
    border: '1px solid var(--pf-danger)',
    borderRadius: 'var(--pf-radius-md)',
    padding: '20px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--pf-danger)',
    fontFamily: 'var(--pf-font-ui)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '16px',
  }

  const btnStyle: React.CSSProperties = {
    background: 'var(--pf-danger-muted)',
    color: 'var(--pf-danger)',
    border: '1px solid var(--pf-danger)',
    fontFamily: 'var(--pf-font-ui)',
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: 'var(--pf-radius-md)',
    cursor: 'pointer',
  }

  return (
    <div data-testid={testId} style={sectionStyle}>
      <div style={titleStyle}>Danger Zone</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {actions.map((action, i) => (
          <div key={i}>
            {confirming === i ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--pf-danger-muted)', padding: '12px', borderRadius: 'var(--pf-radius-sm)' }}>
                <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '14px', fontWeight: 600, color: 'var(--pf-text-primary)' }}>{action.confirmTitle}</div>
                <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '13px', color: 'var(--pf-text-secondary)' }}>{action.confirmDescription}</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setConfirming(null)} style={{ ...btnStyle, background: 'transparent', color: 'var(--pf-text-secondary)', border: '1px solid transparent' }}>Cancel</button>
                  <button onClick={() => { action.onConfirm(); setConfirming(null) }} data-testid={`danger-confirm-${i}`} style={btnStyle}>{action.label}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirming(i)} data-testid={`danger-action-${i}`} style={btnStyle}>{action.label}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
