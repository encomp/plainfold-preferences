import { useState, type ReactNode } from 'react'

interface PfSettingsSectionProps {
  title: string
  icon?: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  children: ReactNode
  'data-testid'?: string
}

export function PfSettingsSection({ title, icon, collapsible = false, defaultOpen = true, children, 'data-testid': testId }: PfSettingsSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const cardStyle: React.CSSProperties = {
    background: 'var(--pf-bg-surface)',
    border: '1px solid var(--pf-border)',
    borderRadius: 'var(--pf-radius-md)',
    padding: '20px',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: collapsible ? 'pointer' : 'default',
    userSelect: 'none',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--pf-text-secondary)',
    fontFamily: 'var(--pf-font-ui)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flex: 1,
  }

  return (
    <div data-testid={testId} style={cardStyle}>
      <div style={headerStyle} onClick={collapsible ? () => setOpen(v => !v) : undefined} role={collapsible ? 'button' : undefined} aria-expanded={collapsible ? open : undefined}>
        {icon && <span style={{ color: 'var(--pf-accent)', display: 'flex', flexShrink: 0 }}>{icon}</span>}
        <span style={titleStyle}>{title}</span>
        {collapsible && (
          <span style={{ color: 'var(--pf-text-muted)', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'flex' }}>&#9654;</span>
        )}
      </div>
      {(!collapsible || open) && (
        <div style={{ marginTop: '16px' }}>{children}</div>
      )}
    </div>
  )
}
