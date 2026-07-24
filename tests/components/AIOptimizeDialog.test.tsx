// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIOptimizeDialog } from '@/components/editor/AIOptimizeDialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { ReactNode } from 'react'

const mockCallbacks = vi.hoisted(() => ({
  onChunk: null as ((_text: string) => void) | null,
  onComplete: null as (() => void) | null,
  onError: null as ((_err: Error) => void) | null,
}))

vi.mock('@/services', () => ({
  streamOptimizeText: vi.fn(
    (
      _text: string,
      _prompt: string,
      _jobType: string,
      callbacks: {
        onChunk: (_t: string) => void
        onComplete: () => void
        onError: (_e: Error) => void
      },
    ) => {
      mockCallbacks.onChunk = callbacks.onChunk
      mockCallbacks.onComplete = callbacks.onComplete
      mockCallbacks.onError = callbacks.onError
      return { abort: vi.fn() }
    },
  ),
}))

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  selectedText: '**Bold text** with content',
  lineNumber: 1,
  onApply: vi.fn(),
  onNavigateLine: vi.fn(),
}

function Wrapper({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>
}

describe('AIOptimizeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCallbacks.onChunk = null
    mockCallbacks.onComplete = null
    mockCallbacks.onError = null
  })

  it('renders <textarea> (not <p>) in version cards after streaming completes', async () => {
    render(<AIOptimizeDialog {...defaultProps} />, { wrapper: Wrapper })

    await act(async () => {
      fireEvent.click(screen.getByText('生成优化版本'))
    })

    await act(async () => {
      mockCallbacks.onChunk?.(
        'Version A content\n---\nVersion B content\n---\nVersion C content',
      )
    })

    await act(async () => {
      mockCallbacks.onComplete?.()
    })

    const textareas = document.querySelectorAll<HTMLTextAreaElement>('textarea')
    expect(textareas.length).toBeGreaterThan(0)

    const contentInTextarea = Array.from(textareas).some(ta =>
      ta.value.includes('Version A content'),
    )
    expect(contentInTextarea).toBe(true)

    const paragraphs = document.querySelectorAll('p')
    const contentInParagraph = Array.from(paragraphs).some(p =>
      p.textContent?.includes('Version A content'),
    )
    expect(contentInParagraph).toBe(false)
  })

  it('adds readonly attribute to textarea while streaming', async () => {
    render(<AIOptimizeDialog {...defaultProps} />, { wrapper: Wrapper })

    await act(async () => {
      fireEvent.click(screen.getByText('生成优化版本'))
    })

    await act(async () => {
      mockCallbacks.onChunk?.('Version A content\n---\nVersion B content')
    })

    const readonlyTextareas = document.querySelectorAll<HTMLTextAreaElement>(
      'textarea[readonly]',
    )
    expect(readonlyTextareas.length).toBeGreaterThan(0)

    const promptTextarea = screen.getByPlaceholderText(
      /更正式一点/,
    ) as HTMLTextAreaElement
    expect(promptTextarea.readOnly).toBe(false)
  })

  it('shows marching ants SVG for the version being streamed', async () => {
    render(<AIOptimizeDialog {...defaultProps} />, { wrapper: Wrapper })

    await act(async () => {
      fireEvent.click(screen.getByText('生成优化版本'))
    })

    const svgRect = document.querySelector('rect.animate-march-ants')
    expect(svgRect).not.toBeNull()
  })

  it('calls onNavigateLine on ArrowDown/ArrowUp when textarea is readonly', async () => {
    const onNavigateLine = vi.fn()
    render(
      <AIOptimizeDialog {...defaultProps} onNavigateLine={onNavigateLine} />,
      { wrapper: Wrapper },
    )

    await act(async () => {
      fireEvent.click(screen.getByText('生成优化版本'))
    })

    await act(async () => {
      mockCallbacks.onChunk?.('Version A\n---\nVersion B')
    })

    const readonlyTa = document.querySelector<HTMLTextAreaElement>(
      'textarea[readonly]',
    )
    expect(readonlyTa).not.toBeNull()
    if (!readonlyTa) return

    await act(async () => {
      fireEvent.keyDown(readonlyTa, { key: 'ArrowDown' })
    })
    expect(onNavigateLine).toHaveBeenCalledWith('down')

    await act(async () => {
      fireEvent.keyDown(readonlyTa, { key: 'ArrowUp' })
    })
    expect(onNavigateLine).toHaveBeenCalledWith('up')
  })
})
