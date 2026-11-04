import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const theme = { id: 'theme-a', name: 'Theme A', description: 'd', version: '1.0.0', tokens: {} }
const get = vi.fn()
const blocked = () => Promise.reject(new Error('SecurityError'))

vi.mock('@plainfold/design-tokens', () => ({
  BUNDLED_THEMES: [theme, { ...theme, id: 'theme-b', name: 'Theme B' }],
  BUNDLED_THEME_IDS: new Set(['theme-a', 'theme-b']),
  applyTheme: vi.fn(),
  validateThemeFull: vi.fn(),
  ThemeLibrary: { getAll: blocked, add: blocked, remove: blocked },
}))
vi.mock('@plainfold/store', () => ({ Settings: { get: (...a: unknown[]) => get(...a), set: blocked, remove: blocked } }))

const { PfThemeGallery } = await import('./PfThemeGallery')

afterEach(() => {
  vi.useRealTimers()
  get.mockImplementation(blocked)
})
get.mockImplementation(blocked)

describe('PfThemeGallery with site data blocked', () => {
  it('shows the default theme as active when the reads reject', async () => {
    await act(async () => { render(<PfThemeGallery />) })
    expect(screen.getByTestId('theme-card-theme-a')).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the default when the read throws synchronously', async () => {
    get.mockImplementation(() => { throw new Error('SecurityError') })
    await act(async () => { render(<PfThemeGallery />) })
    expect(screen.getByTestId('theme-card-theme-a')).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the default after the timeout and a late saved theme wins', async () => {
    vi.useFakeTimers()
    let late: (v: unknown) => void = () => {}
    get.mockReturnValue(new Promise(r => { late = r }))
    await act(async () => { render(<PfThemeGallery defaultThemeId="theme-a" />) })
    await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
    expect(screen.getByTestId('theme-card-theme-a')).toHaveAttribute('aria-pressed', 'true')
    await act(async () => { late({ id: 'theme-b' }); await vi.advanceTimersByTimeAsync(10) })
    expect(screen.getByTestId('theme-card-theme-b')).toHaveAttribute('aria-pressed', 'true')
  })

  it('a pick of the default made before the late read lands is not overridden', async () => {
    vi.useFakeTimers()
    let late: (v: unknown) => void = () => {}
    get.mockReturnValue(new Promise(r => { late = r }))
    await act(async () => { render(<PfThemeGallery defaultThemeId="theme-a" />) })
    await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
    await act(async () => { screen.getByTestId('theme-card-theme-a').click() })
    await act(async () => { late({ id: 'theme-b' }); await vi.advanceTimersByTimeAsync(10) })
    expect(screen.getByTestId('theme-card-theme-a')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('theme-card-theme-b')).toHaveAttribute('aria-pressed', 'false')
  })
})
