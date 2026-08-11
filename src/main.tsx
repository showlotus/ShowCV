import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { DeleteUrlPage } from '@/components/delete'
import { parseDeleteUrl } from '@/services/deleteUrlService'
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

// /delete?... 为批量删除直链，直接进入删除页而不加载编辑器
const deleteParams = parseDeleteUrl(window.location.href)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      {deleteParams ? <DeleteUrlPage params={deleteParams} /> : <App />}
      <Toaster position="top-center" duration={2000} />
    </TooltipProvider>
  </StrictMode>
)
