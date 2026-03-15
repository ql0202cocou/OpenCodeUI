import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CodePreview } from './CodePreview'

vi.mock('../hooks/useSyntaxHighlight', () => ({
  useSyntaxHighlightRef: () => ({
    tokensRef: { current: null },
    version: 0,
  }),
}))

describe('CodePreview', () => {
  it('renders plain text lines when syntax highlight is unavailable', () => {
    render(<CodePreview code={'first line\nsecond line'} language="text" />)

    expect(screen.getByText('first line')).toBeInTheDocument()
    // "second line" 同时出现在可见行和隐藏的宽度探测元素中
    expect(screen.getAllByText('second line').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
