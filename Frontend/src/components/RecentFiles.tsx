import React, { useState, useEffect } from 'react';
import { Smartphone, ExternalLink, FileText, Trash2, Download, Loader2 } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { api } from '../services/api';
import { useLang } from '../context/LanguageContext';

export const QRGuide = () => {
  const { t } = useLang();

  const steps = [
    { num: '01', key: 'dashboard.qr1' },
    { num: '02', key: 'dashboard.qr2' },
    { num: '03', key: 'dashboard.qr3' },
  ];

  return (
    <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-blue-900/30 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
      <h3 className="text-xs font-black uppercase mb-4 opacity-80 tracking-widest flex items-center gap-2">
        <Smartphone className="w-4 h-4" />
        {t('dashboard.qrGuide')}
      </h3>
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 text-[11px] leading-relaxed">
            <span className="font-black text-blue-200">{step.num}</span>
            <p className="font-medium">{t(step.key)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RecentFiles = () => {
  const { t } = useLang();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; fileId: string | null; fileName: string }>({
    isOpen: false, fileId: null, fileName: '',
  });

  const fetchDocuments = () => {
    setLoading(true);
    api.getDocuments()
      .then(data => setFiles(data.slice(0, 10)))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocuments(); }, []);

  const confirmDelete = async () => {
    if (!deleteModal.fileId) return;
    try {
      await api.deleteDocument(deleteModal.fileId);
      setFiles(prev => prev.filter(f => f.id !== deleteModal.fileId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDownload = async (file: any) => {
    try {
      await api.downloadDocument(file.id, file.originalName);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const statusLabel: Record<string, string> = {
    PROCESSING: t('status.processing'),
    READY: t('status.ready'),
    ARCHIVED: t('status.archived'),
    EXPIRED: t('status.expired'),
  };

  const statusClass: Record<string, string> = {
    PROCESSING: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    READY: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    ARCHIVED: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
    EXPIRED: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm flex-1">
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-100 dark:border-gray-600 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase text-gray-400 dark:text-gray-300 tracking-widest">{t('dashboard.recentDocs')}</h3>
        <button onClick={fetchDocuments} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase hover:underline">
          {t('common.refresh')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 space-y-2">
          <FileText className="w-8 h-8" />
          <p className="text-xs font-bold uppercase tracking-widest">{t('docs.noDocuments')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-700 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest bg-gray-50/30 dark:bg-gray-700/30">
                <th className="px-4 sm:px-6 py-3 font-black">{t('docs.name')}</th>
                <th className="hidden sm:table-cell px-6 py-3">{t('docs.pages')}</th>
                <th className="hidden md:table-cell px-6 py-3">{t('common.date')}</th>
                <th className="px-4 sm:px-6 py-3">{t('docs.status')}</th>
                <th className="px-4 sm:px-6 py-3 text-right">{t('docs.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {files.map(file => (
                <tr key={file.id} className="text-[11px] hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="font-bold text-gray-700 dark:text-gray-200 truncate max-w-[120px] sm:max-w-[180px] md:max-w-[240px]">{file.originalName}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">{file.pageCount || '—'} {t('common.pages')}</td>
                  <td className="hidden md:table-cell px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                    {new Date(file.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${statusClass[file.status] || 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                      {statusLabel[file.status] || file.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      {file.status === 'READY' && (
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title={t('common.download')}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, fileId: file.id, fileName: file.originalName })}
                        className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title={t('docs.deleteTitle')}
        message={`"${deleteModal.fileName}" ${t('docs.deleteMessage')}`}
      />
    </div>
  );
};
