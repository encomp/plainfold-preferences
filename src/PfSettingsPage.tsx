import type { ReactNode } from 'react'

interface PfSettingsPageProps {
  title?: string
  children: ReactNode
  'data-testid'?: string
}

export function PfSettingsPage({ title, children, 'data-testid': testId }: PfSettingsPageProps) {
  return (
    <div data-testid={testId} style={{ padding: '24px', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {title && (
        <h1 style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '24px', fontWeight: 700, color: 'var(--pf-text-primary)', margin: 0 }}>
          {title}
        </h1>
      )}
      {children}
    </div>
  )
}
