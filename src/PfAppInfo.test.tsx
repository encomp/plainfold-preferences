import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PfAppInfo } from './PfAppInfo'

describe('PfAppInfo', () => {
  it('renders app name and version', () => {
    render(<PfAppInfo appName="MyApp" version="1.2.3" />)
    expect(screen.getByText('MyApp')).toBeInTheDocument()
    expect(screen.getByText('1.2.3')).toBeInTheDocument()
  })

  it('renders the About heading', () => {
    render(<PfAppInfo appName="MyApp" version="1.0.0" />)
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('renders build date when provided', () => {
    render(<PfAppInfo appName="MyApp" version="1.0.0" buildDate="2026-01-15" />)
    expect(screen.getByText('2026-01-15')).toBeInTheDocument()
  })

  it('omits build date when not provided', () => {
    render(<PfAppInfo appName="MyApp" version="1.0.0" data-testid="info" />)
    expect(screen.queryByText('Build:')).toBeNull()
  })

  it('renders metadata entries', () => {
    render(
      <PfAppInfo
        appName="MyApp"
        version="1.0.0"
        metadata={{ Environment: 'production', Commit: 'abc123' }}
      />
    )
    expect(screen.getByText('Environment:')).toBeInTheDocument()
    expect(screen.getByText('production')).toBeInTheDocument()
    expect(screen.getByText('Commit:')).toBeInTheDocument()
    expect(screen.getByText('abc123')).toBeInTheDocument()
  })

  it('accepts data-testid', () => {
    render(<PfAppInfo appName="MyApp" version="1.0.0" data-testid="app-info" />)
    expect(screen.getByTestId('app-info')).toBeInTheDocument()
  })
})
