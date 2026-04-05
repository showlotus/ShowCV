// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { PipeSplit } from '@/templates/utils/PipeSplit'

describe('PipeSplit', () => {
  it('splits children by || into left and right spans', () => {
    const { container } = render(<PipeSplit>Left || Right</PipeSplit>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('flex')
    expect(wrapper.className).toContain('justify-between')
    expect(wrapper.children).toHaveLength(2)
    expect(wrapper.children[0].textContent).toBe('Left')
    expect(wrapper.children[1].textContent).toBe('Right')
  })

  it('renders children as-is when no || present', () => {
    const { container } = render(<PipeSplit>No split here</PipeSplit>)
    expect(container.firstChild?.nodeName).not.toBe('SPAN')
  })

  it('trims whitespace around || split', () => {
    const { container } = render(<PipeSplit>{'Left  ||  Right'}</PipeSplit>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.children[0].textContent).toBe('Left')
    expect(wrapper.children[1].textContent).toBe('Right')
  })

  it('handles empty left side', () => {
    const { container } = render(<PipeSplit>{'  || Right'}</PipeSplit>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.children[0].textContent).toBe('')
    expect(wrapper.children[1].textContent).toBe('Right')
  })

  it('handles empty right side', () => {
    const { container } = render(<PipeSplit>{'Left ||'}</PipeSplit>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.children[0].textContent).toBe('Left')
    expect(wrapper.children[1].textContent).toBe('')
  })
})
