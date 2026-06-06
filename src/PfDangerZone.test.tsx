import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PfDangerZone } from './PfDangerZone'

describe('PfDangerZone', () => {
  const defaultActions = [
    {
      label: 'Delete Account',
      onConfirm: vi.fn(),
      confirmTitle: 'Are you sure?',
      confirmDescription: 'This cannot be undone.',
    },
    {
      label: 'Reset Data',
      onConfirm: vi.fn(),
      confirmTitle: 'Reset everything?',
      confirmDescription: 'All data will be lost.',
    },
  ]

  it('renders the Danger Zone title', () => {
    render(<PfDangerZone actions={defaultActions} />)
    expect(screen.getByText('Danger Zone')).toBeInTheDocument()
  })

  it('renders all action buttons', () => {
    render(<PfDangerZone actions={defaultActions} />)
    expect(screen.getByTestId('danger-action-0')).toHaveTextContent('Delete Account')
    expect(screen.getByTestId('danger-action-1')).toHaveTextContent('Reset Data')
  })

  it('shows confirmation UI when action is clicked', () => {
    render(<PfDangerZone actions={defaultActions} />)
    fireEvent.click(screen.getByTestId('danger-action-0'))
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('calls onConfirm when confirmed', () => {
    const onConfirm = vi.fn()
    const actions = [{ label: 'Delete', onConfirm, confirmTitle: 'Sure?', confirmDescription: 'Gone.' }]
    render(<PfDangerZone actions={actions} />)
    fireEvent.click(screen.getByTestId('danger-action-0'))
    fireEvent.click(screen.getByTestId('danger-confirm-0'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('hides confirmation when cancel is clicked', () => {
    render(<PfDangerZone actions={defaultActions} />)
    fireEvent.click(screen.getByTestId('danger-action-0'))
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Are you sure?')).toBeNull()
    // Original button should reappear
    expect(screen.getByTestId('danger-action-0')).toBeInTheDocument()
  })

  it('does not call onConfirm when cancelled', () => {
    const onConfirm = vi.fn()
    const actions = [{ label: 'Delete', onConfirm, confirmTitle: 'Sure?', confirmDescription: 'Gone.' }]
    render(<PfDangerZone actions={actions} />)
    fireEvent.click(screen.getByTestId('danger-action-0'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('accepts data-testid', () => {
    render(<PfDangerZone actions={defaultActions} data-testid="danger" />)
    expect(screen.getByTestId('danger')).toBeInTheDocument()
  })

  it('applies danger border styling', () => {
    render(<PfDangerZone actions={defaultActions} data-testid="danger" />)
    const el = screen.getByTestId('danger')
    expect(el.style.border).toContain('var(--pf-danger)')
  })
})
