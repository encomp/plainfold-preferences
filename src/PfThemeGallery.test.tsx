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
const mockSettingsRemove = vi.fn()

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
    remove: (...args: unknown[]) => mockSettingsRemove(...args),
  },
}))

// Must import after vi.mock
const { PfThemeGallery } = await import('./PfThemeGallery')

describe('PfThemeGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSettingsGet.mockResolvedValue(undefined)
    mockSettingsSet.mockResolvedValue('ok')
    mockSettingsRemove.mockResolvedValue(undefined)
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

  describe('P1 additions', () => {
    const extra: PfTheme = { id: 'extra-x', name: 'Extra X', description: 'Extra', version: '1.0.0', tokens: { '--pf-accent': '#123456' } }
    const user: PfTheme = { id: 'user-theme', name: 'Custom Theme', description: 'mine', version: '1.0.0', tokens: {} }
    const renderG = async (props: Record<string, unknown> = {}) => {
      await act(async () => { render(<PfThemeGallery {...props} />) })
    }

    it('shows extra bundled themes without Remove, deduped by id', async () => {
      await renderG({ extraBundledThemes: [extra, mockThemeA, extra] })
      expect(screen.getAllByTestId('theme-card-extra-x')).toHaveLength(1)
      expect(screen.getAllByTestId('theme-card-theme-a')).toHaveLength(1)
      expect(screen.queryByTestId('theme-remove-extra-x')).toBeNull()
    })

    it('picking saves whole object, applies and calls onThemeChange', async () => {
      const onThemeChange = vi.fn()
      await renderG({ extraBundledThemes: [extra], onThemeChange })
      await act(async () => { fireEvent.click(screen.getByTestId('theme-card-extra-x')) })
      expect(mockApplyTheme).toHaveBeenCalledWith(extra)
      expect(mockSettingsSet).toHaveBeenCalledWith('pf:theme:activeTheme', extra)
      expect(onThemeChange).toHaveBeenCalledWith(extra)
    })

    it('defaultThemeId highlights when nothing is saved', async () => {
      await renderG({ defaultThemeId: 'theme-b' })
      expect(screen.getByTestId('theme-card-theme-b').style.border).toContain('var(--pf-accent)')
      expect(screen.getByTestId('theme-card-theme-a').style.border).not.toContain('var(--pf-accent)')
    })

    it('no follow card without the prop', async () => {
      await renderG()
      expect(screen.queryByTestId('theme-card-follow-device')).toBeNull()
    })

    it('follow card: click removes key then onSelect', async () => {
      const onSelect = vi.fn()
      await renderG({ followDevice: { onSelect } })
      expect(screen.getByText('Follow my device')).toBeInTheDocument()
      await act(async () => { fireEvent.click(screen.getByTestId('theme-card-follow-device')) })
      expect(mockSettingsRemove).toHaveBeenCalledWith('pf:theme:activeTheme')
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('follow card is keyboard operable (Enter and Space)', async () => {
      const onSelect = vi.fn()
      await renderG({ followDevice: { onSelect } })
      const card = screen.getByTestId('theme-card-follow-device')
      expect(card).toHaveAttribute('role', 'button')
      await act(async () => { fireEvent.keyDown(card, { key: 'Enter' }) })
      await act(async () => { fireEvent.keyDown(card, { key: ' ' }) })
      expect(onSelect).toHaveBeenCalledTimes(2)
    })

    it('removing the previously active theme after Follow does not switch off Follow', async () => {
      mockThemeLibraryGetAll.mockResolvedValue([user])
      mockSettingsGet.mockResolvedValue(user)
      const onThemeChange = vi.fn()
      await renderG({ onThemeChange, followDevice: { onSelect: vi.fn() } })
      await act(async () => { fireEvent.click(screen.getByTestId('theme-card-follow-device')) })
      await act(async () => { fireEvent.click(screen.getByTestId('theme-remove-user-theme')) })
      expect(mockThemeLibraryRemove).toHaveBeenCalledWith('user-theme')
      expect(onThemeChange).not.toHaveBeenCalled()
      expect(mockApplyTheme).not.toHaveBeenCalled()
    })

    it('still calls onThemeChange when saving the theme rejects', async () => {
      mockSettingsSet.mockRejectedValue(new Error('blocked'))
      const onThemeChange = vi.fn()
      await renderG({ onThemeChange })
      await act(async () => { fireEvent.click(screen.getByTestId('theme-card-theme-b')) })
      expect(mockApplyTheme).toHaveBeenCalledWith(mockThemeB)
      expect(onThemeChange).toHaveBeenCalledWith(mockThemeB)
    })

    it('follow card still calls onSelect when remove rejects, and uses custom label', async () => {
      mockSettingsRemove.mockRejectedValue(new Error('blocked'))
      const onSelect = vi.fn()
      await renderG({ followDevice: { onSelect, label: 'Match system' } })
      expect(screen.getByText('Match system')).toBeInTheDocument()
      await act(async () => { fireEvent.click(screen.getByTestId('theme-card-follow-device')) })
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('followDevice.selected wins over defaultThemeId and saved theme', async () => {
      mockSettingsGet.mockResolvedValue(mockThemeB)
      await renderG({ defaultThemeId: 'theme-a', followDevice: { onSelect: vi.fn(), selected: true } })
      expect(screen.getByTestId('theme-card-follow-device').style.border).toContain('var(--pf-accent)')
      expect(screen.getByTestId('theme-card-theme-a').style.border).not.toContain('var(--pf-accent)')
      expect(screen.getByTestId('theme-card-theme-b').style.border).not.toContain('var(--pf-accent)')
      expect(screen.getByTestId('theme-card-follow-device')).toHaveAttribute('aria-pressed', 'true')
    })

    it('cards are keyboard operable: role, tabIndex, Enter and Space', async () => {
      const onThemeChange = vi.fn()
      await renderG({ onThemeChange })
      const card = screen.getByTestId('theme-card-theme-b')
      expect(card).toHaveAttribute('role', 'button')
      expect(card).toHaveAttribute('tabindex', '0')
      expect(card).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByTestId('theme-card-theme-a')).toHaveAttribute('aria-pressed', 'true')
      act(() => { card.focus() })
      expect(card).toHaveFocus()
      await act(async () => { fireEvent.keyDown(card, { key: 'Enter' }) })
      expect(onThemeChange).toHaveBeenCalledWith(mockThemeB)
      onThemeChange.mockClear()
      await act(async () => { fireEvent.keyDown(card, { key: ' ' }) })
      expect(onThemeChange).toHaveBeenCalledWith(mockThemeB)
    })

    it('Remove stays a real button and keys on it do not activate the card', async () => {
      mockThemeLibraryGetAll.mockResolvedValue([user])
      const onThemeChange = vi.fn()
      await renderG({ onThemeChange })
      const rm = screen.getByTestId('theme-remove-user-theme')
      expect(rm.tagName).toBe('BUTTON')
      await act(async () => { fireEvent.keyDown(rm, { key: 'Enter' }) })
      expect(onThemeChange).not.toHaveBeenCalled()
    })

    it('removing the active installed theme reports the fallback', async () => {
      mockThemeLibraryGetAll.mockResolvedValue([user])
      mockSettingsGet.mockResolvedValue(user)
      const onThemeChange = vi.fn()
      await renderG({ onThemeChange, defaultThemeId: 'theme-b' })
      await act(async () => { fireEvent.click(screen.getByTestId('theme-remove-user-theme')) })
      expect(onThemeChange).toHaveBeenCalledWith(mockThemeB)
      expect(mockApplyTheme).toHaveBeenCalledWith(mockThemeB)
    })

    it('Remove is not nested inside the card button; they are siblings', async () => {
      mockThemeLibraryGetAll.mockResolvedValue([user])
      await renderG()
      const rm = screen.getByTestId('theme-remove-user-theme')
      const card = screen.getByTestId('theme-card-user-theme')
      expect(rm.closest('[role="button"]')).toBeNull()
      expect(card.contains(rm)).toBe(false)
      expect(rm.parentElement).toBe(card.parentElement)
    })

    it('removing the active installed theme with followDevice and no defaultThemeId returns to Follow my device', async () => {
      mockThemeLibraryGetAll.mockResolvedValue([user])
      mockSettingsGet.mockResolvedValue(user)
      const onThemeChange = vi.fn()
      const onSelect = vi.fn()
      await renderG({ onThemeChange, followDevice: { onSelect } })
      await act(async () => { fireEvent.click(screen.getByTestId('theme-remove-user-theme')) })
      expect(mockThemeLibraryRemove).toHaveBeenCalledWith('user-theme')
      expect(mockSettingsRemove).toHaveBeenCalledWith('pf:theme:activeTheme')
      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onThemeChange).not.toHaveBeenCalled()
      expect(mockApplyTheme).not.toHaveBeenCalled()
      expect(mockSettingsSet).not.toHaveBeenCalled()
    })

    it('removing the active installed theme with followDevice and a defaultThemeId applies that default', async () => {
      mockThemeLibraryGetAll.mockResolvedValue([user])
      mockSettingsGet.mockResolvedValue(user)
      const onThemeChange = vi.fn()
      const onSelect = vi.fn()
      await renderG({ onThemeChange, defaultThemeId: 'theme-b', followDevice: { onSelect } })
      await act(async () => { fireEvent.click(screen.getByTestId('theme-remove-user-theme')) })
      expect(onThemeChange).toHaveBeenCalledWith(mockThemeB)
      expect(onSelect).not.toHaveBeenCalled()
    })
  })
})
