import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PfSettingsPage } from './PfSettingsPage'

describe('PfSettingsPage', () => {
  it('renders title when provided', () => {
    render(<PfSettingsPage title="Settings">content</PfSettingsPage>)
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Settings').tagName).toBe('H1')
  })

  it('renders children', () => {
    render(
      <PfSettingsPage>
        <div data-testid="child">Hello</div>
      </PfSettingsPage>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('omits title when not provided', () => {
    render(<PfSettingsPage data-testid="page">content</PfSettingsPage>)
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('accepts data-testid', () => {
    render(<PfSettingsPage data-testid="my-page">content</PfSettingsPage>)
    expect(screen.getByTestId('my-page')).toBeInTheDocument()
  })

  it('applies layout styles', () => {
    render(<PfSettingsPage data-testid="page">content</PfSettingsPage>)
    const el = screen.getByTestId('page')
    expect(el.style.maxWidth).toBe('640px')
    expect(el.style.display).toBe('flex')
    expect(el.style.flexDirection).toBe('column')
  })
})
