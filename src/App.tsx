import { useState, useCallback, forwardRef, useRef, useEffect, useMemo } from 'react';
import { Header } from './components/layout';
import { MarkdownEditor } from './components/editor';
import { SettingsPanel } from './components/settings';
import { SimpleLayout, ModernLayout, CreativeLayout } from './layouts';
import { useResumeStore } from './store';
import { usePDFExport, useReactToPrintExport, getShareDataFromUrl, clearShareHash } from './services';
import { downloadFile } from './utils';
import type { TemplateId, ResumeSettings } from './types';
import './index.css';

// A4 纸张尺寸 (像素，96dpi: 1mm ≈ 3.78px)
const A4_HEIGHT_PX = Math.round(297 * 3.78); // ≈ 1122px
const A4_WIDTH_PX = Math.round(210 * 3.78);  // ≈ 794px

interface ResumePreviewProps {
  templateId: TemplateId;
  content: string;
  settings: ResumeSettings;
}

// 简历预览组件
const ResumePreview = ({ templateId, content, settings }: ResumePreviewProps) => {
  switch (templateId) {
    case 'modern':
      return <ModernLayout content={content} settings={settings} />;
    case 'creative':
      return <CreativeLayout content={content} settings={settings} />;
    default:
      return <SimpleLayout content={content} settings={settings} />;
  }
};

// 可打印的分页简历组件 - 与预览组件使用相同的分页逻辑
const PrintablePaginatedResume = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ templateId, content, settings }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState(1);

    const padding = settings.spacing.padding;

    // 创建不带 padding 的设置
    const settingsWithoutPadding = useMemo(() => ({
      ...settings,
      spacing: {
        ...settings.spacing,
        padding: 0,
      },
    }), [settings]);

    // 计算页数（同步计算，确保打印时已确定）
    useEffect(() => {
      const calculatePages = () => {
        if (!containerRef.current) return;

        const contentHeight = containerRef.current.scrollHeight;
        const availableHeight = A4_HEIGHT_PX - padding * 2;
        const pages = Math.max(1, Math.ceil(contentHeight / availableHeight));

        setPageCount(pages);
      };

      // 立即计算一次
      calculatePages();

      const timer = setTimeout(calculatePages, 100);
      return () => clearTimeout(timer);
    }, [content, settings, padding]);

    return (
      <div ref={ref} className="print:shadow-none">
        {/* 隐藏的测量容器 */}
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: `${A4_WIDTH_PX}px`,
            visibility: 'hidden',
          }}
        >
          <ResumePreview
            templateId={templateId}
            content={content}
            settings={settingsWithoutPadding}
          />
        </div>

        {/* 每页独立渲染 */}
        {Array.from({ length: pageCount }).map((_, pageIndex) => (
          <div
            key={pageIndex}
            className="print-page"
            style={{
              width: `${A4_WIDTH_PX}px`,
              height: `${A4_HEIGHT_PX}px`,
              padding: `${padding}px`,
              boxSizing: 'border-box',
              overflow: 'hidden',
              backgroundColor: 'white',
              position: 'relative',
              pageBreakAfter: pageIndex < pageCount - 1 ? 'always' : 'auto',
            }}
          >
            {/* 内容层 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  transform: `translateY(-${pageIndex * (A4_HEIGHT_PX - padding * 2)}px)`,
                  width: '100%',
                  padding: `${padding}px`,
                  boxSizing: 'border-box',
                }}
              >
                <ResumePreview
                  templateId={templateId}
                  content={content}
                  settings={settingsWithoutPadding}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

PrintablePaginatedResume.displayName = 'PrintablePaginatedResume';

// 分页预览组件 - 按 A4 纸分页展示
const PaginatedPreview = ({ templateId, content, settings }: ResumePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  const padding = settings.spacing.padding;

  // 创建不带 padding 的设置，用于内容渲染和测量
  const settingsWithoutPadding = useMemo(() => ({
    ...settings,
    spacing: {
      ...settings.spacing,
      padding: 0,
    },
  }), [settings]);

  // 计算页数
  useEffect(() => {
    const calculatePages = () => {
      if (!containerRef.current) return;

      const contentHeight = containerRef.current.scrollHeight;
      // 可用高度 = A4高度 - 上下边距
      const availableHeight = A4_HEIGHT_PX - padding * 2;
      const pages = Math.max(1, Math.ceil(contentHeight / availableHeight));

      setPageCount(pages);
    };

    const timer = setTimeout(calculatePages, 200);
    return () => clearTimeout(timer);
  }, [content, settings, padding]);

  return (
    <div className="space-y-6">
      {/* 隐藏的测量容器 - 使用不带 padding 的设置 */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          width: `${A4_WIDTH_PX}px`,
          visibility: 'hidden',
          padding: `${padding}px`,
          boxSizing: 'border-box',
        }}
      >
        <ResumePreview
          templateId={templateId}
          content={content}
          settings={settingsWithoutPadding}
        />
      </div>

      {/* 分页展示 - 每页是一个带边距的视窗 */}
      {Array.from({ length: pageCount }).map((_, pageIndex) => (
        <div
          key={pageIndex}
          className="bg-white shadow-lg relative"
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${A4_HEIGHT_PX}px`,
            padding: `${padding}px`,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* 内容层 - 通过 transform 定位到对应页面位置 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                transform: `translateY(-${pageIndex * (A4_HEIGHT_PX - padding * 2)}px)`,
                width: '100%',
                padding: `${padding}px`,
                boxSizing: 'border-box',
              }}
            >
              <ResumePreview
                templateId={templateId}
                content={content}
                settings={settingsWithoutPadding}
              />
            </div>
          </div>
          {/* 页码指示 */}
          {pageCount > 1 && (
            <div className="absolute bottom-2 right-4 text-xs text-gray-400 print:hidden z-10">
              {pageIndex + 1} / {pageCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { templateId, content, settings, exportData, setTemplate, setContent, updateFontSettings, updateColorSettings, updateSpacingSettings } = useResumeStore();
  const { contentRef, handlePrint } = usePDFExport();
  const { contentRef: reactToPrintRef, handlePrint: handleReactToPrint } = useReactToPrintExport();

  // 页面加载时检查 URL Hash 中的分享数据
  useEffect(() => {
    const shareData = getShareDataFromUrl();
    if (shareData) {
      // 导入分享数据
      setContent(shareData.content);
      setTemplate(shareData.templateId);
      updateFontSettings(shareData.settings.font);
      updateColorSettings(shareData.settings.color);
      updateSpacingSettings(shareData.settings.spacing);
      // 清除 URL 中的 hash，避免刷新后重复导入
      clearShareHash();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleExportPDF = useCallback(() => {
    handlePrint();
  }, [handlePrint]);

  const handlePrintWithReactToPrint = useCallback(() => {
    handleReactToPrint();
  }, [handleReactToPrint]);

  const handleExportJSON = useCallback(() => {
    const data = exportData();
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${data.title}.json`, 'application/json');
  }, [exportData]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header
        onOpenSettings={handleOpenSettings}
        onExportPDF={handleExportPDF}
        onExportJSON={handleExportJSON}
        onPrintWithReactToPrint={handlePrintWithReactToPrint}
      />

      <main className="flex-1 flex min-h-0">
        {/* 左侧编辑区 */}
        <div className="w-1/2 border-r border-gray-200 bg-white flex flex-col min-h-0">
          <MarkdownEditor />
        </div>

        {/* 右侧预览区 */}
        <div className="w-1/2 overflow-auto p-6 bg-gray-100">
          <div className="max-w-[210mm] mx-auto">
            {/* 屏幕预览 - 支持分页指示 */}
            <div className="screen-preview">
              <PaginatedPreview templateId={templateId} content={content} settings={settings} />
            </div>
            {/* 打印内容（隐藏但用于打印） */}
            <div className="print:block hidden">
              {/* 原有的 iframe 打印方案 */}
              <PrintablePaginatedResume
                ref={contentRef}
                templateId={templateId}
                content={content}
                settings={settings}
              />
              {/* react-to-print 打印方案 */}
              <PrintablePaginatedResume
                ref={reactToPrintRef}
                templateId={templateId}
                content={content}
                settings={settings}
              />
            </div>
          </div>
        </div>
      </main>

      <SettingsPanel isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </div>
  );
}

export default App;
