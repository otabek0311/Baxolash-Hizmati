import React, { useState, useEffect, useRef } from 'react';
import { FileText, Info, History, Download, Clock, Loader2, Sheet } from 'lucide-react';
import { motion } from 'motion/react';
import * as pdfjsLib from 'pdfjs-dist';
import { api } from '../services/api';
import { useLang } from '../context/LanguageContext';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface DocumentDetailsProps {
  documentId: string;
}

const PageThumbnail: React.FC<{ pdfDoc: any; pageNumber: number }> = ({ pdfDoc, pageNumber }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setRendered(true);
      } catch {}
    };
    render();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: (pageNumber - 1) * 0.04 }}
      className="group cursor-pointer"
    >
      <div className="aspect-[3/4] bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl overflow-hidden mb-2 transition-all group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-50 dark:group-hover:shadow-blue-900/20 relative">
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-300 dark:text-gray-500" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ display: rendered ? 'block' : 'none' }}
        />
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{pageNumber}-bet</span>
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title="QR tamg'alangan" />
      </div>
    </motion.div>
  );
};

export const DocumentDetails: React.FC<DocumentDetailsProps> = ({ documentId }) => {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('pages');
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const pdfUrlRef = useRef<string | null>(null);

  useEffect(() => {
    api.getDocument(documentId)
      .then(setDoc)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [documentId]);

  useEffect(() => {
    if (activeTab !== 'pages' || pdfDoc) return;
    setPdfLoading(true);
    api.getDocumentPreviewUrl(documentId).then(async (url) => {
      pdfUrlRef.current = url;
      const loaded = await pdfjsLib.getDocument(url).promise;
      setPdfDoc(loaded);
    }).catch(console.error).finally(() => setPdfLoading(false));

    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, [activeTab, documentId]);

  const handleDownload = async (format: 'pdf' | 'xlsx' = 'pdf') => {
    if (!doc) return;
    setDownloading(true);
    try {
      await api.downloadDocument(doc.id, doc.originalName, format);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const isExcel = (name: string) => /\.(xlsx|xls)$/i.test(name);

  const tabs = [
    { id: 'pages',   label: t('doc.tabPages'),   icon: FileText },
    { id: 'info',    label: t('doc.tabInfo'),     icon: Info     },
    { id: 'history', label: t('doc.tabHistory'),  icon: History  },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }
  if (!doc) return null;

  const sizeKb = Math.round(doc.sizeBytes / 1024);
  const sizeMb = (doc.sizeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('doc.analysisTitle')}</h3>
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded uppercase tracking-widest">{t('doc.done')}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {doc.originalName} • {sizeKb < 1024 ? `${sizeKb} KB` : `${sizeMb} MB`} • {doc.pageCount} {t('common.pages')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloading}
            className="px-5 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 active:scale-95 disabled:opacity-60"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </button>
          {isExcel(doc.originalName) && (
            <button
              onClick={() => handleDownload('xlsx')}
              disabled={downloading}
              className="px-5 py-3 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2 active:scale-95 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sheet className="w-4 h-4" />}
              Excel
            </button>
          )}
        </div>
      </div>

      <div className="px-8 pt-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTabDetails" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {activeTab === 'pages' && (
          pdfLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('doc.loadingPages')}</p>
            </div>
          ) : pdfDoc ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: doc.pageCount }).map((_, i) => (
                <PageThumbnail key={i} pdfDoc={pdfDoc} pageNumber={i + 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-xs font-bold uppercase tracking-widest">{t('doc.pagesNotLoaded')}</p>
            </div>
          )
        )}

        {activeTab === 'info' && (
          <div className="space-y-4 max-w-lg">
            {[
              { icon: FileText, label: t('doc.fileName'),    value: doc.originalName },
              { icon: Clock,    label: t('doc.uploadedAt'),  value: new Date(doc.createdAt).toLocaleString('uz-UZ') },
              { icon: Clock,    label: t('doc.expiresAt'),   value: new Date(doc.expiresAt).toLocaleDateString('uz-UZ') },
              { icon: Info,     label: t('doc.pageCount'),   value: `${doc.pageCount} ta sahifa` },
              { icon: Info,     label: t('doc.fileSize'),    value: sizeKb < 1024 ? `${sizeKb} KB` : `${sizeMb} MB` },
              { icon: Info,     label: t('doc.uploadedBy'),  value: doc.uploadedBy?.name || '—' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm flex-shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white break-all">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {[
              { icon: History, title: t('doc.historyQR'),     time: new Date(doc.updatedAt).toLocaleTimeString('uz-UZ'), desc: `${t('doc.historyQRDesc')} ${doc.pageCount} ${t('doc.historyQRDesc2')}` },
              { icon: History, title: t('doc.historyPDF'),    time: new Date(doc.createdAt).toLocaleTimeString('uz-UZ'), desc: t('doc.historyPDFDesc') },
              { icon: History, title: t('doc.historyUpload'), time: new Date(doc.createdAt).toLocaleTimeString('uz-UZ'), desc: `${doc.uploadedBy?.name || t('common.employee')} ${t('doc.historyUploadDesc')}` },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 p-5 rounded-2xl border border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-100 dark:hover:border-gray-600 transition-all">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-sm flex-shrink-0">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</p>
                    <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
