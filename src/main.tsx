import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { ExportUrlPage } from '@/components/export'
import { parseExportUrl } from '@/services/exportUrlService'
import './index.css'
import App from './App.tsx'

// 开发环境启用 react-scan
if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan({
      enabled: false,
      log: true,
      showToolbar: true,
    })
  })
}

// /export?... 为图片下载直链，直接进入导出页而不加载编辑器
const exportParams = parseExportUrl(window.location.href)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      {exportParams ? <ExportUrlPage params={exportParams} /> : <App />}
      <Toaster position="top-center" duration={2000} />
    </TooltipProvider>
  </StrictMode>
)
