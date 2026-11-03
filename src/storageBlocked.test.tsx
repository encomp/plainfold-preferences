import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const theme = { id: 'theme-a', name: 'Theme A', description: 'd', version: '1.0.0', tokens: {} }
const blocked = () => Promise.reject(new Error('SecurityError'))

vi.mock('@plainfold/design-tokens', () => ({
  BUNDLED_THEMES: [theme],
  BUNDLED_THEME_IDS: new Set(['theme-a']),
  applyTheme: vi.fn(),
  validateThemeFull: vi.fn(),
  ThemeLibrary: { getAll: blocked, add: blocked, remove: blocked },
}))
vi.mock('@plainfold/store', () => ({ Settings: { get: blocked, set: blocked, remove: blocked } }))

const { PfThemeGallery } = await import('./PfThemeGallery')

describe('PfThemeGallery with site data blocked', () => {
  it('shows the default theme as active when the reads reject', async () => {
    await act(async () => { render(<PfThemeGallery />) })
    expect(screen.getByTestId('theme-card-theme-a')).toHaveAttribute('aria-pressed', 'true')
  })
})
