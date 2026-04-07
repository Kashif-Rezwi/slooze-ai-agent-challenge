/**
 * MarkdownContent
 * ───────────────
 * Renders AI response text as styled Markdown.
 * Uses react-markdown + rehype-highlight for syntax-highlighted code blocks.
 * Styled via the .prose class defined in globals.css — no inline styles.
 *
 * Adopted from: better-dev-ui & code-review-agent (both use react-markdown).
 * Monaco Editor is intentionally NOT used here — it's for code editing, not display.
 */
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import type { Components } from 'react-markdown'

// Minimal set of custom renderers — only override elements that need it
const components: Components = {
  // Open external links in a new tab safely
  a({ href, children, ...props }) {
    return (
      <a
        href={href}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    )
  },
  // Wrap tables for horizontal scroll without breaking layout
  table({ children, ...props }) {
    return (
      <div className="overflow-x-auto my-4">
        <table {...props}>{children}</table>
      </div>
    )
  },
}

interface MarkdownContentProps {
  content: string
  /** Set true while the AI is still streaming tokens (adds blinking cursor) */
  isStreaming?: boolean
}

export default function MarkdownContent({ content, isStreaming }: MarkdownContentProps) {
  return (
    <div
      className="prose"
      {...(isStreaming ? { 'data-streaming': '' } : {})}
    >
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
