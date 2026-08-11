import { useEffect, useRef, useState } from 'react'

/** dataTransfer 中拖的是文件而非文本 */
function isFileDrag(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

/**
 * window 级文件拖拽监听
 * 只在拖的是文件时 preventDefault：既阻止浏览器直接打开文件，
 * 又不干扰 CodeMirror 内部的文本拖拽
 * @param onFiles 松手时收到的文件列表
 */
export function useFileDropZone(onFiles: (files: FileList) => void) {
  const [dragging, setDragging] = useState(false)
  // dragleave 在子元素间穿梭时也会触发，用计数器抵消
  const depthRef = useRef(0)
  const onFilesRef = useRef(onFiles)

  useEffect(() => {
    onFilesRef.current = onFiles
  }, [onFiles])

  useEffect(() => {
    const handleEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) return
      event.preventDefault()
      depthRef.current++
      setDragging(true)
    }

    const handleOver = (event: DragEvent) => {
      if (!isFileDrag(event)) return
      // 不 preventDefault 的话浏览器会拒绝 drop
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    }

    const handleLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) return
      depthRef.current = Math.max(depthRef.current - 1, 0)
      if (depthRef.current === 0) setDragging(false)
    }

    const handleDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) return
      event.preventDefault()
      depthRef.current = 0
      setDragging(false)
      const files = event.dataTransfer?.files
      if (files && files.length > 0) onFilesRef.current(files)
    }

    window.addEventListener('dragenter', handleEnter)
    window.addEventListener('dragover', handleOver)
    window.addEventListener('dragleave', handleLeave)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragenter', handleEnter)
      window.removeEventListener('dragover', handleOver)
      window.removeEventListener('dragleave', handleLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

  return dragging
}
