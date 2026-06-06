import { useState, useEffect, useRef } from 'react'
import { BUNDLED_THEMES, ThemeLibrary, applyTheme, validateThemeFull } from '@plainfold/design-tokens'
import { Settings } from '@plainfold/store'
import type { PfTheme } from '@plainfold/design-tokens'

interface PfThemeGalleryProps {
  'data-testid'?: string
}

const ACTIVE_THEME_KEY = 'pf:theme:activeTheme'

export function PfThemeGallery({ 'data-testid': testId }: PfThemeGalleryProps) {
  const [activeThemeId, setActiveThemeId] = useState<string>('')
  const [installedThemes, setInstalledThemes] = useState<PfTheme[]>([])
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const active = await Settings.get<PfTheme>(ACTIVE_THEME_KEY)
      setActiveThemeId(active?.id ?? BUNDLED_THEMES[0]?.id ?? '')
      const installed = await ThemeLibrary.getAll()
      setInstalledThemes(installed)
    }
    init()
  }, [])

  const handleApply = async (theme: PfTheme) => {
    applyTheme(theme)
    await Settings.set(ACTIVE_THEME_KEY, theme)
    setActiveThemeId(theme.id)
  }

  const handleRemove = async (theme: PfTheme) => {
    await ThemeLibrary.remove(theme.id)
    setInstalledThemes(prev => prev.filter(t => t.id !== theme.id))
    if (activeThemeId === theme.id && BUNDLED_THEMES[0]) {
      await handleApply(BUNDLED_THEMES[0])
    }
  }

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })

  const handleFileUpload = async (file: File) => {
    try {
      const text = await readFileAsText(file)
      const json: unknown = JSON.parse(text)
      const result = validateThemeFull(json)
      if (!result.success) {
        setMessage({ text: 'Invalid theme file', type: 'error' })
        return
      }
      const theme = json as PfTheme
      await ThemeLibrary.add(theme)
      setInstalledThemes(prev => [...prev, theme])
      setMessage({ text: `Theme "${theme.name}" added`, type: 'success' })
    } catch {
      setMessage({ text: 'Could not read theme file', type: 'error' })
    }
  }

  const cardStyle = (isActive: boolean): React.CSSProperties => ({
    border: isActive ? '2px solid var(--pf-accent)' : '1px solid var(--pf-border)',
    borderRadius: 'var(--pf-radius-md)',
    padding: '12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '140px',
  })

  const swatchColors = ['--pf-accent', '--pf-positive', '--pf-warning', '--pf-danger', '--pf-bg-surface-alt']

  const renderThemeCard = (theme: PfTheme, removable: boolean) => (
    <div key={theme.id} style={cardStyle(activeThemeId === theme.id)} onClick={() => handleApply(theme)} data-testid={`theme-card-${theme.id}`}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {swatchColors.map(v => (
          <div key={v} style={{ width: '16px', height: '16px', borderRadius: '50%', background: theme.tokens[v] ?? 'transparent', border: '1px solid rgba(128,128,128,0.2)' }} />
        ))}
      </div>
      <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '13px', fontWeight: 600, color: 'var(--pf-text-primary)' }}>{theme.name}</div>
      <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '11px', color: 'var(--pf-text-muted)' }}>{theme.description}</div>
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); handleRemove(theme) }}
          data-testid={`theme-remove-${theme.id}`}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--pf-danger)', fontFamily: 'var(--pf-font-ui)', fontSize: '12px', cursor: 'pointer', padding: '2px 4px' }}
        >
          Remove
        </button>
      )}
    </div>
  )

  return (
    <div data-testid={testId} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Bundled */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--pf-text-muted)', fontFamily: 'var(--pf-font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          Bundled Themes
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {BUNDLED_THEMES.map(t => renderThemeCard(t, false))}
        </div>
      </div>

      {/* Installed */}
      {installedThemes.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--pf-text-muted)', fontFamily: 'var(--pf-font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Your Themes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {installedThemes.map(t => renderThemeCard(t, true))}
          </div>
        </div>
      )}

      {/* Upload */}
      <div>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--pf-border)',
            borderRadius: 'var(--pf-radius-md)',
            background: 'var(--pf-bg-surface-alt)',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer',
            color: 'var(--pf-text-muted)',
            fontFamily: 'var(--pf-font-ui)',
            fontSize: '13px',
          }}
        >
          Click to add a theme pack (.json)
        </div>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} data-testid="theme-upload" onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFileUpload(f)
          if (fileRef.current) fileRef.current.value = ''
        }} />
      </div>

      {/* Message */}
      {message && (
        <div style={{
          fontFamily: 'var(--pf-font-ui)', fontSize: '14px', padding: '10px 14px', borderRadius: 'var(--pf-radius-sm)',
          background: message.type === 'success' ? 'var(--pf-positive-muted)' : 'var(--pf-danger-muted)',
          color: message.type === 'success' ? 'var(--pf-positive)' : 'var(--pf-danger)',
        }}>
          {message.text}
        </div>
      )}
    </div>
  )
}
