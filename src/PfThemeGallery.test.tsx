import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PfTheme } from '@plainfold/design-tokens'

const mockThemeA: PfTheme = {
  id: 'theme-a',
  name: 'Theme A',
  description: 'A light theme',
  version: '1.0.0',
  tokens: { '--pf-accent': '#0066ff', '--pf-positive': '#00cc66', '--pf-warning': '#ffcc00', '--pf-danger': '#ff3333', '--pf-bg-surface-alt': '#f5f5f5' },
}

const mockThemeB: PfTheme = {
  id: 'theme-b',
  name: 'Theme B',
  description: 'A dark theme',
  version: '1.0.0',
  tokens: { '--pf-accent': '#6699ff', '--pf-positive': '#33ff99', '--pf-warning': '#ffdd33', '--pf-danger': '#ff6666', '--pf-bg-surface-alt': '#1a1a1a' },
}

const mockApplyTheme = vi.fn()
const mockValidateThemeFull = vi.fn()
const mockThemeLibraryGetAll = vi.fn()
const mockThemeLibraryAdd = vi.fn()
const mockThemeLibraryRemove = vi.fn()
const mockSettingsGet = vi.fn()
const mockSettingsSet = vi.fn()

vi.mock('@plainfold/design-tokens', () => ({
  BUNDLED_THEMES: [mockThemeA, mockThemeB],
  BUNDLED_THEME_IDS: new Set(['theme-a', 'theme-b']),
  applyTheme: (...args: unknown[]) => mockApplyTheme(...args),
  validateThemeFull: (...args: unknown[]) => mockValidateThemeFull(...args),
  ThemeLibrary: {
    getAll: (...args: unknown[]) => mockThemeLibraryGetAll(...args),
    add: (...args: unknown[]) => mockThemeLibraryAdd(...args),
    remove: (...args: unknown[]) => mockThemeLibraryRemove(...args),
  },
}))

vi.mock('@plainfold/store', () => ({
  Settings: {
    get: (...args: unknown[]) => mockSettingsGet(...args),
    set: (...args: unknown[]) => mockSettingsSet(...args),
  },
}))

// Must import after vi.mock
const { PfThemeGallery } = await import('./PfThemeGallery')

describe('PfThemeGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSettingsGet.mockResolvedValue(undefined)
    mockSettingsSet.mockResolvedValue('ok')
    mockThemeLibraryGetAll.mockResolvedValue([])
    mockThemeLibraryAdd.mockResolvedValue(undefined)
    mockThemeLibraryRemove.mockResolvedValue(undefined)
    mockValidateThemeFull.mockReturnValue({ success: true })
  })

  it('renders bundled themes', async () => {
    await act(async () => {
      render(<PfThemeGallery data-testid="gallery" />)
    })
    expect(screen.getByText('Bundled Themes')).toBeInTheDocument()
    expect(screen.getByTestId('theme-card-theme-a')).toBeInTheDocument()
    expect(screen.getByTestId('theme-card-theme-b')).toBeInTheDocument()
  })

  it('displays theme name and description', async () => {
    await act(async () => {
      render(<PfThemeGallery />)
    })
    expect(screen.getByText('Theme A')).toBeInTheDocument()
    expect(screen.getByText('A light theme')).toBeInTheDocument()
    expect(screen.getByText('Theme B')).toBeInTheDocument()
    expect(screen.getByText('A dark theme')).toBeInTheDocument()
  })

  it('applies theme when card is clicked', async () => {
    await act(async () => {
      render(<PfThemeGallery />)
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('theme-card-theme-b'))
    })
    expect(mockApplyTheme).toHaveBeenCalledWith(mockThemeB)
    expect(mockSettingsSet).toHaveBeenCalledWith('pf:theme:activeTheme', mockThemeB)
  })

  it('loads active theme from settings on mount', async () => {
    mockSettingsGet.mockResolvedValue(mockThemeB)
    await act(async () => {
      render(<PfThemeGallery />)
    })
    // theme-b should be active (accent border)
    const cardB = screen.getByTestId('theme-card-theme-b')
    expect(cardB.style.border).toContain('var(--pf-accent)')
  })

  it('renders installed themes section when themes exist', async () => {
    const userTheme: PfTheme = {
      id: 'user-theme',
      name: 'Custom Theme',
      description: 'My custom theme',
      version: '1.0.0',
      tokens: {},
    }
    mockThemeLibraryGetAll.mockResolvedValue([userTheme])
    await act(async () => {
      render(<PfThemeGallery />)
    })
    expect(screen.getByText('Your Themes')).toBeInTheDocument()
    expect(screen.getByText('Custom Theme')).toBeInTheDocument()
  })

  it('removes installed theme when remove button is clicked', async () => {
    const userTheme: PfTheme = {
      id: 'user-theme',
      name: 'Custom Theme',
      description: 'My custom theme',
      version: '1.0.0',
      tokens: {},
    }
    mockThemeLibraryGetAll.mockResolvedValue([userTheme])
    await act(async () => {
      render(<PfThemeGallery />)
    })
    expect(screen.getByTestId('theme-remove-user-theme')).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByTestId('theme-remove-user-theme'))
    })
    expect(mockThemeLibraryRemove).toHaveBeenCalledWith('user-theme')
    await waitFor(() => {
      expect(screen.queryByText('Custom Theme')).toBeNull()
    })
  })

  it('shows upload zone', async () => {
    await act(async () => {
      render(<PfThemeGallery />)
    })
    expect(screen.getByText('Click to add a theme pack (.json)')).toBeInTheDocument()
  })

  it('shows error message for invalid theme file', async () => {
    mockValidateThemeFull.mockReturnValue({ success: false, error: { issues: [{ message: 'bad' }] } })
    await act(async () => {
      render(<PfThemeGallery />)
    })

    const fileInput = screen.getByTestId('theme-upload') as HTMLInputElement
    const invalidTheme = JSON.stringify({ bad: 'data' })
    const file = new File([invalidTheme], 'bad.json', { type: 'application/json' })

    const dt = new DataTransfer()
    dt.items.add(file)

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: dt.files, configurable: true })
      fireEvent.change(fileInput)
    })

    await waitFor(() => {
      expect(screen.getByText('Invalid theme file')).toBeInTheDocument()
    })
  })

  it('adds valid theme via file upload', async () => {
    const uploadTheme: PfTheme = {
      id: 'uploaded-theme',
      name: 'Uploaded Theme',
      description: 'A theme from file',
      version: '1.0.0',
      tokens: {},
    }
    mockValidateThemeFull.mockReturnValue({ success: true })
    await act(async () => {
      render(<PfThemeGallery />)
    })

    const fileInput = screen.getByTestId('theme-upload') as HTMLInputElement
    const file = new File([JSON.stringify(uploadTheme)], 'theme.json', { type: 'application/json' })

    const dt = new DataTransfer()
    dt.items.add(file)

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: dt.files, configurable: true })
      fireEvent.change(fileInput)
    })

    await waitFor(() => {
      expect(mockThemeLibraryAdd).toHaveBeenCalled()
      expect(screen.getByText('Theme "Uploaded Theme" added')).toBeInTheDocument()
    })
  })

  it('does not show remove button on bundled themes', async () => {
    await act(async () => {
      render(<PfThemeGallery />)
    })
    expect(screen.queryByTestId('theme-remove-theme-a')).toBeNull()
    expect(screen.queryByTestId('theme-remove-theme-b')).toBeNull()
  })

  it('accepts data-testid', async () => {
    await act(async () => {
      render(<PfThemeGallery data-testid="gallery" />)
    })
    expect(screen.getByTestId('gallery')).toBeInTheDocument()
  })
})
