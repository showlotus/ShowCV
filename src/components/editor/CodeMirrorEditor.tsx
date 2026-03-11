import { useEffect, useRef } from 'react'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
} from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } from '@codemirror/language'
import { search, searchKeymap } from '@codemirror/search'
import { autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { lintKeymap } from '@codemirror/lint'
import { tags } from '@lezer/highlight'
import { useResumeStore } from '@/store'
import { DEFAULT_CONTENT } from '@/utils/constants'

import '@/styles/codemirror.css'

// 防抖延迟时间（毫秒）
const DEBOUNCE_DELAY = 0

// 自定义语法高亮主题 - 使用 CSS 变量适配主题
const createHighlightStyle = () => HighlightStyle.define([
  { tag: tags.heading1, fontSize: '1.4em', fontWeight: '600', color: 'var(--accent)' },
  { tag: tags.heading2, fontSize: '1.2em', fontWeight: '600', color: 'var(--accent)' },
  { tag: tags.heading3, fontSize: '1.1em', fontWeight: '600', color: 'var(--accent)' },
  { tag: tags.heading4, fontWeight: '600', color: 'var(--accent)' },
  { tag: tags.heading5, fontWeight: '600', color: 'var(--accent)' },
  { tag: tags.heading6, fontWeight: '600', color: 'var(--accent)' },
  { tag: tags.strong, fontWeight: '700', color: 'var(--fg-primary)' },
  { tag: tags.emphasis, fontStyle: 'italic', color: 'var(--fg-secondary)' },
  { tag: tags.link, color: 'var(--accent)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--fg-muted)' },
  {
    tag: tags.monospace,
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--success)',
    padding: '2px 4px',
    borderRadius: '4px',
  },
  { tag: tags.quote, color: 'var(--success)' },
  { tag: tags.list, color: 'var(--fg-secondary)' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: 'var(--fg-muted)' },
])

const customHighlightStyle = createHighlightStyle()

export function CodeMirrorEditor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 从当前简历获取内容
  const currentResume = useResumeStore((state) => state.currentResume)
  const setContent = useResumeStore((state) => state.setContent)

  const content = currentResume?.content ?? DEFAULT_CONTENT

  // 使用 ref 保存最新的 setContent 函数，避免 useEffect 重新执行
  const setContentRef = useRef(setContent)

  useEffect(() => {
    setContentRef.current = setContent
  }, [setContent])

  useEffect(() => {
    if (!editorRef.current) return

    // 创建编辑器状态
    const startState = EditorState.create({
      doc: content,
      extensions: [
        // 基础功能
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        search(),
        autocompletion(),

        // Markdown 支持
        markdown({
          base: markdownLanguage,
        }),

        // 语法高亮
        syntaxHighlighting(customHighlightStyle),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

        // 键盘快捷键
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...completionKeymap,
          ...lintKeymap,
        ]),

        // 编辑器样式 - 适配主题
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
            color: 'var(--fg-primary)',
          },
          '.cm-scroller': {
            lineHeight: '1.8',
            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
          },
          '.cm-content': {
            padding: '20px',
          },
          '.cm-gutters': {
            backgroundColor: 'var(--bg-tertiary)',
            borderRight: '1px solid var(--border)',
            paddingRight: '8px',
          },
          '.cm-lineNumbers .cm-gutterElement': {
            color: 'var(--fg-muted)',
            minWidth: '30px',
          },
          '.cm-activeLine': {
            backgroundColor: 'var(--accent-soft)',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'var(--accent-soft)',
          },
          '.cm-selectionBackground, ::selection': {
            backgroundColor: 'var(--accent-soft) !important',
          },
          '&.cm-focused .cm-selectionBackground, &.cm-focused ::selection': {
            backgroundColor: 'var(--accent-soft) !important',
          },
          '.cm-cursor': {
            borderLeftColor: 'var(--accent)',
            borderLeftWidth: '2px',
          },
        }),

        // 占位符
        EditorView.contentAttributes.of({
          'aria-placeholder': '在此输入 Markdown 内容...',
        }),

        // 监听文档变化（带防抖）
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString()

            // 清除之前的定时器
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current)
            }

            // 设置新的定时器，延迟更新 store
            debounceTimerRef.current = setTimeout(() => {
              setContentRef.current(newContent)
            }, DEBOUNCE_DELAY)
          }
        }),
      ],
    })

    // 创建编辑器视图
    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    })

    viewRef.current = view

    // 清理函数
    return () => {
      // 清除防抖定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      view.destroy()
      viewRef.current = null
    }
  }, []) // 只在组件挂载时创建一次

  // 当外部 content 变化时更新编辑器（比如从分享链接导入）
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentContent = view.state.doc.toString()
    if (currentContent !== content) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      })
    }
  }, [content])

  return (
    <div className="codemirror-editor min-h-0 flex-1">
      <div ref={editorRef} className="h-full" />
    </div>
  )
}
