import { useRef, useCallback, type RefObject } from 'react'
import { useReactToPrint } from 'react-to-print'

/**
 * 生成打印样式字符串
 * @param padding 每页四周的边距（像素），与预览的 spacing.padding 保持一致
 */
function buildPrintStyles() {
  return `
    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      html, body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        margin: 0;
        padding: 0;
        background: white !important;
      }
      .no-print,
      .page-number {
        display: none !important;
      }
      /* 移除预览容器的装饰样式 */
      .resume-preview {
        max-width: none !important;
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        background: transparent !important;
      }
      /* 每个页面容器打印为独立一页，保留 padding 作为页边距 */
      .preview-page {
        min-height: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        break-after: page;
        page-break-after: always;
      }
      .preview-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }
    }
  `
}

/**
 * 使用 react-to-print 的打印方案
 * @param ref 外部传入的 ref，指向预览 DOM 节点，不传则内部创建
 */
export function useReactToPrintExport(ref?: RefObject<HTMLDivElement | null>) {
  const internalRef = useRef<HTMLDivElement>(null)
  const contentRef = ref ?? internalRef

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: '简历',
    pageStyle: buildPrintStyles(),
  })

  return { handlePrint }
}

/**
 * 基于 iframe 的 PDF 导出方案
 * @param ref 外部传入的 ref，指向预览 DOM 节点，不传则内部创建
 */
export function usePDFExport(ref?: RefObject<HTMLDivElement | null>) {
  const internalRef = useRef<HTMLDivElement>(null)
  const contentRef = ref ?? internalRef

  const handlePrint = useCallback(() => {
    const content = contentRef.current || document.getElementById('resume-preview')

    if (!content) {
      alert('未找到简历内容')
      return
    }

    // 创建隐藏的 iframe
    let printIframe = document.getElementById('print-iframe') as HTMLIFrameElement

    if (!printIframe) {
      printIframe = document.createElement('iframe')
      printIframe.id = 'print-iframe'
      printIframe.style.position = 'fixed'
      printIframe.style.left = '-9999px'
      printIframe.style.top = '0'
      printIframe.style.width = '0'
      printIframe.style.height = '0'
      printIframe.style.border = 'none'
      document.body.appendChild(printIframe)
    }

    const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document
    if (!iframeDoc) return

    // 收集当前页面的所有样式
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n')
        } catch {
          // 跨域样式表无法访问，使用 link 标签
          if (sheet.ownerNode instanceof HTMLLinkElement) {
            return `@import url("${sheet.ownerNode.href}");`
          }
          return ''
        }
      })
      .join('\n')

    // 写入内容
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>简历</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            ${styles}
            ${buildPrintStyles()}
          </style>
        </head>
        <body>
          ${content.outerHTML}
        </body>
      </html>
    `)
    iframeDoc.close()

    // 等待样式和字体加载后打印
    setTimeout(() => {
      printIframe.contentWindow?.focus()
      printIframe.contentWindow?.print()
    }, 800)
  }, [contentRef])

  return {
    handlePrint,
  }
}

/**
 * 将预览区 DOM 截图为 PNG 并写入剪贴板
 * @param ref 指向预览 DOM 节点的 ref
 */
export function useCopyImageExport(ref?: RefObject<HTMLDivElement | null>) {
  const internalRef = useRef<HTMLDivElement>(null)
  const contentRef = ref ?? internalRef

  const handleCopyImage = useCallback(async () => {
    const el = contentRef.current
    if (!el) throw new Error('未找到预览元素')

    const { domToBlob } = await import('modern-screenshot')
    const blob = await domToBlob(el, { scale: 2 })
    if (!blob) throw new Error('生成图片失败')
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  }, [contentRef])

  return { handleCopyImage }
}

// 保留 html2canvas 方案作为备用
export async function exportToPDFLegacy(filename: string = 'resume.pdf'): Promise<void> {
  const element = document.getElementById('resume-preview')
  if (!element) {
    throw new Error('未找到预览元素')
  }

  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  const originalStyle = element.style.cssText
  element.style.width = '210mm'
  element.style.minHeight = '297mm'
  element.style.padding = '40px'
  element.style.backgroundColor = '#ffffff'

  try {
    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    })

    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/jpeg', 0.7)

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  } finally {
    element.style.cssText = originalStyle
  }
}
