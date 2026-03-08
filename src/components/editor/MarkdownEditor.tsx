import { useCallback } from 'react'
import { Editor } from '@bytemd/react'
import { useResumeStore } from '../../store'

import 'bytemd/dist/index.css'
import '../../styles/editor.css'

export function MarkdownEditor() {
  const { content, setContent } = useResumeStore()

  const handleChange = useCallback(
    (value: string) => {
      setContent(value)
    },
    [setContent],
  )

  return (
    <div className="flex-1 min-h-0 markdown-editor">
      <Editor
        value={content}
        placeholder="在此输入 Markdown 内容..."
        onChange={handleChange}
        editorConfig={{
          autofocus: true,
          mode: 'write',
        }}
      />
    </div>
  )
}
