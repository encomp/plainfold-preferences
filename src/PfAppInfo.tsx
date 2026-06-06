interface PfAppInfoProps {
  appName: string
  version: string
  buildDate?: string
  metadata?: Record<string, string>
  'data-testid'?: string
}

export function PfAppInfo({ appName, version, buildDate, metadata, 'data-testid': testId }: PfAppInfoProps) {
  const cardStyle: React.CSSProperties = {
    background: 'var(--pf-bg-surface)',
    border: '1px solid var(--pf-border)',
    borderRadius: 'var(--pf-radius-md)',
    padding: '20px',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--pf-text-muted)',
    fontFamily: 'var(--pf-font-ui)',
  }

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'var(--pf-text-primary)',
    fontFamily: 'var(--pf-font-mono)',
  }

  return (
    <div data-testid={testId} style={cardStyle}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--pf-text-secondary)', fontFamily: 'var(--pf-font-ui)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
        About
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div><span style={labelStyle}>App: </span><span style={valueStyle}>{appName}</span></div>
        <div><span style={labelStyle}>Version: </span><span style={valueStyle}>{version}</span></div>
        {buildDate && <div><span style={labelStyle}>Build: </span><span style={valueStyle}>{buildDate}</span></div>}
        {metadata && Object.entries(metadata).map(([k, v]) => (
          <div key={k}><span style={labelStyle}>{k}: </span><span style={valueStyle}>{v}</span></div>
        ))}
      </div>
    </div>
  )
}
