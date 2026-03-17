import { isValidElement, memo, useMemo } from 'react'
import { Streamdown, type Components } from 'streamdown'
import { math } from '@streamdown/math'
import { CodeBlock } from './CodeBlock'
import { detectLanguage } from '../utils/languageUtils'

interface MarkdownRendererProps {
  content: string
  className?: string
  /** Whether the content is actively being streamed */
  isStreaming?: boolean
}

/**
 * Inline code component
 */
const InlineCode = memo(function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1 py-0.5 bg-bg-200/50 border border-border-200/50 rounded text-accent-main-100 text-[0.9em] font-mono align-baseline break-words">
      {children}
    </code>
  )
})

/**
 * Extract text content from React node tree (for code block extraction)
 */
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  return ''
}

/**
 * Extract code and language from a <pre> element's children
 */
function extractBlockCode(children: React.ReactNode): { code: string; language?: string } | null {
  const codeNode = Array.isArray(children) ? children[0] : children
  if (!isValidElement(codeNode)) return null

  const props = codeNode.props as { className?: string; children?: React.ReactNode }
  const match = /language-([\w-]+)/.exec(props.className || '')
  const contentStr = extractText(props.children).replace(/\n$/, '')

  return {
    code: contentStr,
    language: match?.[1],
  }
}

/**
 * Main Markdown renderer component
 *
 * Uses Streamdown for streaming-optimized rendering:
 * - Block-level memoization (completed blocks skip re-render)
 * - Unterminated markdown block healing via remend
 * - GFM support built-in
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className = '',
  isStreaming = false,
}: MarkdownRendererProps) {
  const components = useMemo<Components>(
    () => ({
      // Inline code — Streamdown supports `inlineCode` as a dedicated key
      inlineCode({ children }) {
        return <InlineCode>{children}</InlineCode>
      },

      // Block code — delegate to our existing CodeBlock with shiki highlighting
      pre({ children }) {
        const blockCode = extractBlockCode(children)
        if (!blockCode) return <pre>{children}</pre>

        return (
          <div className="my-4 first:mt-0 last:mb-0 w-full">
            <CodeBlock code={blockCode.code} language={blockCode.language} />
          </div>
        )
      },

      // Headings
      h1: ({ children }) => (
        <h1 className="text-xl font-bold text-text-100 mt-8 mb-4 first:mt-0 last:mb-0 tracking-tight">{children}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-lg font-bold text-text-100 mt-6 mb-3 first:mt-0 last:mb-0 tracking-tight pb-1 border-b border-border-100/50">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-base font-semibold text-text-100 mt-5 mb-2 first:mt-0 last:mb-0 tracking-tight">
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="text-sm font-semibold text-text-100 mt-4 mb-2 first:mt-0 last:mb-0 tracking-tight">
          {children}
        </h4>
      ),

      // Paragraphs
      p: ({ children }) => <p className="mb-4 last:mb-0 leading-7 text-text-200">{children}</p>,

      // Lists
      ul: ({ children }) => (
        <ul className="list-disc list-outside ml-5 mb-4 last:mb-0 space-y-1 marker:text-text-400/80">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-outside ml-5 mb-4 last:mb-0 space-y-1 marker:text-text-400/80">{children}</ol>
      ),
      li: ({ children }) => <li className="text-text-200 pl-1 leading-7">{children}</li>,

      // Links
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent-main-100 hover:text-accent-main-200 hover:underline underline-offset-2 transition-colors"
        >
          {children}
        </a>
      ),

      // Blockquotes
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-accent-main-100 pl-4 py-1 my-4 first:mt-0 last:mb-0 bg-bg-200/30 rounded-r-md text-text-300 italic">
          {children}
        </blockquote>
      ),

      // Tables
      table: ({ children }) => (
        <div className="overflow-x-auto my-6 first:mt-0 last:mb-0 border border-border-200 rounded-lg shadow-sm w-full">
          <table className="min-w-full border-collapse text-sm divide-y divide-border-200">{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-bg-100 text-text-200 font-medium">{children}</thead>,
      th: ({ children }) => (
        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap border-b border-border-200">{children}</th>
      ),
      tbody: ({ children }) => <tbody className="divide-y divide-border-200/50 bg-bg-000">{children}</tbody>,
      tr: ({ children }) => <tr className="hover:bg-bg-200/30 transition-colors even:bg-bg-200/15">{children}</tr>,
      td: ({ children }) => <td className="px-4 py-2.5 text-text-300 leading-relaxed">{children}</td>,

      // Horizontal rule
      hr: () => <hr className="border-border-200 my-8 first:mt-0 last:mb-0" />,

      // Strong and emphasis
      strong: ({ children }) => <strong className="font-semibold text-text-100">{children}</strong>,
      em: ({ children }) => <em className="italic text-text-200">{children}</em>,

      // Strikethrough (GFM)
      del: ({ children }) => <del className="text-text-400 line-through decoration-text-400/50">{children}</del>,
    }),
    [],
  )

  return (
    <div
      className={`markdown-content text-sm text-text-100 leading-relaxed break-words min-w-0 overflow-hidden ${className}`}
    >
      <Streamdown components={components} isAnimating={isStreaming} controls={false} plugins={{ math }}>
        {content}
      </Streamdown>
    </div>
  )
})

/**
 * Standalone code highlighter for tool previews
 * Uses file extension to determine language
 */
export const HighlightedCode = memo(function HighlightedCode({
  code,
  filePath,
  language,
  maxHeight,
  className = '',
}: {
  code: string
  filePath?: string
  language?: string
  maxHeight?: number
  className?: string
}) {
  const lang = useMemo(() => {
    return language || detectLanguage(filePath)
  }, [filePath, language])

  return (
    <div className={`overflow-auto ${className}`} style={maxHeight ? { maxHeight } : undefined}>
      <CodeBlock code={code} language={lang} />
    </div>
  )
})

export default MarkdownRenderer
