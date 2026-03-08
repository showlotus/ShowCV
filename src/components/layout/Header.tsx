import { useState } from 'react';
import { FileDown, Settings, Download, Printer, Share2, Check } from 'lucide-react';
import { useResumeStore } from '../../store';
import { TEMPLATE_LIST } from '../../utils/constants';
import { cn } from '../../utils';
import { generateShareUrl } from '../../services';

interface HeaderProps {
  onOpenSettings: () => void;
  onExportPDF: () => void;
  onExportJSON: () => void;
  onPrintWithReactToPrint?: () => void;
}

export function Header({ onOpenSettings, onExportPDF, onExportJSON, onPrintWithReactToPrint }: HeaderProps) {
  const { templateId, setTemplate, content, settings } = useResumeStore();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleShare = async () => {
    const shareUrl = generateShareUrl(content, templateId, settings);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <FileDown className="w-6 h-6 text-blue-600" />
        <span className="font-semibold text-lg text-gray-800">ShowCV</span>
      </div>

      {/* 模板选择 */}
      <div className="flex items-center gap-2">
        {TEMPLATE_LIST.map((template) => (
          <button
            key={template.id}
            onClick={() => setTemplate(template.id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              templateId === template.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {template.name}
          </button>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            copySuccess
              ? "bg-green-600 text-white"
              : "bg-purple-600 text-white hover:bg-purple-700"
          )}
        >
          {copySuccess ? (
            <>
              <Check className="w-4 h-4" />
              已复制
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              分享
            </>
          )}
        </button>
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Settings className="w-4 h-4" />
          样式设置
        </button>
        <button
          onClick={onExportJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          导出 JSON
        </button>
        <button
          onClick={onPrintWithReactToPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <Printer className="w-4 h-4" />
          打印 (React-to-Print)
        </button>
        <button
          onClick={onExportPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          导出 PDF
        </button>
      </div>
    </header>
  );
}
