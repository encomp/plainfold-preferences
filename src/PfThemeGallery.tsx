import { useState, useEffect, useRef } from 'react'
import { BUNDLED_THEMES, ThemeLibrary, applyTheme, validateThemeFull } from '@plainfold/design-tokens'
import { Settings } from '@plainfold/store'
import type { PfTheme } from '@plainfold/design-tokens'

interface PfThemeGalleryProps {
  /** Extra built-in themes shown after BUNDLED_THEMES (no Remove button, deduped by id). */
  extraBundledThemes?: PfTheme[]
  /** Highlighted when nothing is saved. Defaults to the first bundled theme. */
  defaultThemeId?: string
  /** Called after a theme is picked and saved, and for the fallback when the active installed theme is removed
   *  (with followDevice and no defaultThemeId that fallback is Follow, which calls followDevice.onSelect instead). */
  onThemeChange?: (theme: PfTheme) => void
  /** Adds a first card that clears the saved theme and calls onSelect. */
  followDevice?: { label?: string; selected?: boolean; onSelect: () => void }
  'data-testid'?: string
}

const ACTIVE_THEME_KEY = 'pf:theme:activeTheme'

/** How long to wait for the saved theme before showing the default (blocked site data can leave the read pending). */
const STORAGE_READ_TIMEOUT_MS = 1500

export function PfThemeGallery({ 'data-testid': testId, extraBundledThemes, defaultThemeId, onThemeChange, followDevice }: PfThemeGalleryProps) {
  const [activeThemeId, setActiveThemeId] = useState<string>('')
  const [installedThemes, setInstalledThemes] = useState<PfTheme[]>([])
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pickedRef = useRef(false) // a saved theme arriving late never overrides a pick

  const allBundled = [...BUNDLED_THEMES, ...(extraBundledThemes ?? [])].filter(
    (t, i, arr) => arr.findIndex(o => o.id === t.id) === i,
  )
  const fallbackId = defaultThemeId ?? BUNDLED_THEMES[0]?.id ?? ''

  useEffect(() => {
    async function init() {
      // blocked storage: start with the default theme and no installed themes; a read that does not settle
      // within the timeout starts with the default, and a saved theme arriving later still wins (unless one was picked since, tracked by pickedRef)
      const read = (async () => (await Settings.get<PfTheme>(ACTIVE_THEME_KEY))?.id)().catch(() => undefined)
      let timer: ReturnType<typeof setTimeout> | undefined
      const timedOut = Symbol()
      const first = await Promise.race([read, new Promise<symbol>(r => { timer = setTimeout(() => r(timedOut), STORAGE_READ_TIMEOUT_MS) })])
      clearTimeout(timer)
      if (first === timedOut) {
        setActiveThemeId(fallbackId)
        void read.then(id => { if (id && !pickedRef.current) setActiveThemeId(id) })
      } else setActiveThemeId((first as string | undefined) ?? fallbackId)
      const installed = await (async () => ThemeLibrary.getAll())().catch(() => [])
      setInstalledThemes(installed)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApply = async (theme: PfTheme) => {
    pickedRef.current = true
    applyTheme(theme)
    try {
      await Settings.set(ACTIVE_THEME_KEY, theme)
    } catch {
      // blocked storage: the theme is applied for this session
    }
    setActiveThemeId(theme.id)
    onThemeChange?.(theme)
  }

  const handleFollow = async () => {
    pickedRef.current = true
    if (!followDevice) return
    try {
      await Settings.remove(ACTIVE_THEME_KEY)
    } catch {
      // blocked storage: still follow the device for this session
    }
    setActiveThemeId('')
    followDevice.onSelect()
  }

  const handleRemove = async (theme: PfTheme) => {
    try {
      await ThemeLibrary.remove(theme.id)
    } catch {
      // blocked storage: the theme is removed for this session
    }
    setInstalledThemes(prev => prev.filter(t => t.id !== theme.id))
    if (activeThemeId === theme.id) {
      // an app that offers Follow and names no default returns to Follow, not to the first bundled theme
      if (followDevice && defaultThemeId === undefined) {
        await handleFollow()
        return
      }
      const fallback = allBundled.find(t => t.id === fallbackId) ?? allBundled[0]
      if (fallback) await handleApply(fallback)
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

  const followSelected = !!followDevice?.selected

  const activate = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fn()
    }
  }

  const renderThemeCard = (theme: PfTheme, removable: boolean) => {
    const isActive = !followSelected && activeThemeId === theme.id
    const card = (
    <div
      key={removable ? undefined : theme.id}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      style={cardStyle(isActive)}
      onClick={() => handleApply(theme)}
      onKeyDown={(e) => activate(e, () => handleApply(theme))}
      data-testid={`theme-card-${theme.id}`}
    >
      <div style={{ display: 'flex', gap: '4px' }}>
        {swatchColors.map(v => (
          <div key={v} style={{ width: '16px', height: '16px', borderRadius: '50%', background: theme.tokens[v] ?? 'transparent', border: '1px solid rgba(128,128,128,0.2)' }} />
        ))}
      </div>
      <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '13px', fontWeight: 600, color: 'var(--pf-text-primary)' }}>{theme.name}</div>
      <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '11px', color: 'var(--pf-text-muted)' }}>{theme.description}</div>
    </div>
    )
    if (!removable) return card
    // Remove sits beside the card button, never inside it (no nested interactive controls)
    return (
      <div key={theme.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {card}
        <button
          type="button"
          onClick={() => handleRemove(theme)}
          aria-label={`Remove ${theme.name}`}
          data-testid={`theme-remove-${theme.id}`}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--pf-danger)', fontFamily: 'var(--pf-font-ui)', fontSize: '12px', cursor: 'pointer', padding: '2px 4px' }}
        >
          Remove
        </button>
      </div>
    )
  }

  const renderFollowCard = () => followDevice && (
    <div
      key="follow-device"
      role="button"
      tabIndex={0}
      aria-pressed={followSelected}
      style={cardStyle(followSelected)}
      onClick={handleFollow}
      onKeyDown={(e) => activate(e, handleFollow)}
      data-testid="theme-card-follow-device"
    >
      <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '13px', fontWeight: 600, color: 'var(--pf-text-primary)' }}>
        {followDevice.label ?? 'Follow my device'}
      </div>
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
          {renderFollowCard()}
          {allBundled.map(t => renderThemeCard(t, false))}
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
