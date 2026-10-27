import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App.tsx'

describe('App', () => {
  it('renders the application heading', () => {
    render(<App />)

    const heading = screen.queryByRole('heading', { level: 1, name: 'JSON Formatter' })

    expect(heading).not.toBeNull()
  })
})
