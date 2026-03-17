import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MarkdownRenderer } from './MarkdownRenderer'

vi.mock('./CodeBlock', () => ({
  CodeBlock: ({ code, language }: { code: string; language?: string }) => (
    <div data-testid="code-block">{`${language ?? 'text'}:${code}`}</div>
  ),
}))

describe('MarkdownRenderer', () => {
  it('renders headings and inline code', () => {
    render(<MarkdownRenderer content={'# Title\n\nUse `pnpm`'} />)

    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('pnpm')).toBeInTheDocument()
  })

  it('renders fenced code blocks via CodeBlock', () => {
    render(<MarkdownRenderer content={'```ts\nconst x = 1\n```'} />)

    expect(screen.getByTestId('code-block')).toHaveTextContent('ts:const x = 1')
  })

  it('accepts isStreaming prop without crashing', () => {
    render(<MarkdownRenderer content={'Hello **world**'} isStreaming={true} />)

    expect(screen.getByRole('paragraph')).toHaveTextContent('Hello world')
  })
})
