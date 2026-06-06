import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PfSettingsSection } from './PfSettingsSection'

describe('PfSettingsSection', () => {
  it('renders title and children', () => {
    render(
      <PfSettingsSection title="General">
        <div data-testid="child">Setting 1</div>
      </PfSettingsSection>
    )
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(
      <PfSettingsSection title="Theme" icon={<span data-testid="icon">*</span>}>
        content
      </PfSettingsSection>
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('is not collapsible by default', () => {
    render(
      <PfSettingsSection title="General">
        <div data-testid="child">content</div>
      </PfSettingsSection>
    )
    // Children should always be visible
    expect(screen.getByTestId('child')).toBeInTheDocument()
    // No button role
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('hides children when collapsible and clicked', () => {
    render(
      <PfSettingsSection title="Advanced" collapsible>
        <div data-testid="child">hidden content</div>
      </PfSettingsSection>
    )
    // Initially open by default
    expect(screen.getByTestId('child')).toBeInTheDocument()
    // Click to collapse
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByTestId('child')).toBeNull()
    // Click to expand
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('starts collapsed when defaultOpen=false', () => {
    render(
      <PfSettingsSection title="Advanced" collapsible defaultOpen={false}>
        <div data-testid="child">hidden</div>
      </PfSettingsSection>
    )
    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('shows aria-expanded attribute when collapsible', () => {
    render(
      <PfSettingsSection title="Advanced" collapsible>
        content
      </PfSettingsSection>
    )
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('accepts data-testid', () => {
    render(
      <PfSettingsSection title="Test" data-testid="section">
        content
      </PfSettingsSection>
    )
    expect(screen.getByTestId('section')).toBeInTheDocument()
  })
})
