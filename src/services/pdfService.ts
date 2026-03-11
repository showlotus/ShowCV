import { useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'

// 打印样式常量 - 与 PaginatedPreview 保持一致
const PRINT_STYLES = `
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
    /* 隐藏不需要打印的元素 */
    .no-print,
    .page-number {
      display: none !important;
    }
    /* 分页容器样式 - 移除间距 */
    .paginated-preview {
      display: block !important;
      gap: 0 !important;
    }
    .preview-page {
      page-break-after: always;
      page-break-inside: avoid;
      box-shadow: none !important;
      margin: 0 !important;
      border-radius: 0 !important;
      background: white !important;
    }
    .preview-page:last-child {
      page-break-after: auto;
    }
    /* 确保内容不会被截断在页面中间 */
    .preview-page-content {
      overflow: visible !important;
      background: white !important;
    }
    /* 确保简历模板背景是白色 */
    .resume-template {
      background: white !important;
    }
    /* 分页控制 - 避免元素被截断 */
    .resume-template h1,
    .resume-template h2,
    .resume-template h3,
    .resume-template h4,
    .resume-template h5,
    .resume-template h6,
    .resume-template p,
    .resume-template ul,
    .resume-template ol,
    .resume-template li,
    .resume-template .resume-paragraph,
    .resume-template .resume-list,
    .resume-template .resume-list-item,
    .resume-template .no-break {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    /* 强制分页标记 */
    .resume-template .page-break {
      page-break-after: always !important;
      break-after: page !important;
    }
  }
`

// 使用 react-to-print 的打印方案
export function useReactToPrintExport() {
  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: '简历',
    pageStyle: PRINT_STYLES,
  })

  return {
    contentRef,
    handlePrint,
  }
}

// 原有的 iframe 打印方案
export function usePDFExport() {
  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useCallback(() => {
    // 优先使用分页预览容器，确保打印分页内容
    const content =
      contentRef.current ||
      document.querySelector('.paginated-preview') ||
      document.getElementById('resume-preview')

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
            ${PRINT_STYLES}
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
  }, [])

  return {
    contentRef,
    handlePrint,
  }
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
