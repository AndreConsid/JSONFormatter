import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../src/App.tsx'

describe('App', () => {
  afterEach(cleanup)

  it('renders the application heading', () => {
    render(<App />)

    const heading = screen.queryByRole('heading', { level: 1, name: 'JSON Formatter' })

    expect(heading).not.toBeNull()
  })

  it('renders the JSON formatter', () => {
    render(<App />)

    expect(screen.queryByRole('button', { name: 'Format' })).not.toBeNull()
  })
})
