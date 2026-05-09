import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { useLang } from '../context/LanguageContext';

interface UploadAreaProps {
  onUpload: (documentId: string) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onUpload }) => {
  const { t } = useLang();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [retentionDays, setRetentionDays] = useState(30);
  const [settings, setSettings] = useState({ minRetentionDays: 7, maxRetentionDays: 90, defaultRetentionDays: 30 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getSettings().then(s => {
      if (s) {
        setSettings(s);
        setRetentionDays(s.defaultRetentionDays);
      }
    }).catch(() => {});
  }, []);

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
      alert('Faqat PDF, DOC, DOCX formatlar qabul qilinadi');
      return;
    }
    setUploading(true);
    try {
      const result = await api.uploadDocument(file, retentionDays);
      onUpload(result.documentId);
    } catch (err: any) {
      alert(err.message || 'Yuklash xatosi');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('upload.retentionPeriod')}
          </label>
          <span className="text-sm font-black text-blue-600">{retentionDays} {t('common.days')}</span>
        </div>
        <input
          type="range"
          min={settings.minRetentionDays}
          max={settings.maxRetentionDays}
          value={retentionDays}
          onChange={e => setRetentionDays(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          <span>{settings.minRetentionDays} {t('common.days')}</span>
          <span>{settings.maxRetentionDays} {t('common.days')}</span>
        </div>
      </div>

      <motion.div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file && !uploading) handleFile(file);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center group ${
          uploading
            ? 'border-blue-300 dark:border-blue-700 cursor-wait bg-white dark:bg-gray-800'
            : isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 cursor-copy'
            : 'border-gray-200 dark:border-gray-600 bg-gray-50/20 dark:bg-gray-800 hover:border-blue-400 hover:bg-white dark:hover:bg-gray-700 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
        />
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
          {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
        </div>
        <div className="space-y-2 mb-6">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            {uploading ? t('upload.uploading') : isDragging ? t('upload.dropping') : t('upload.dropzone')}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {uploading ? t('upload.uploadingHint') : t('upload.dropzoneHint')}
          </p>
        </div>
        {!uploading && (
          <button className="px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500 transition-all active:scale-95">
            {t('upload.browse')}
          </button>
        )}
        <div className="mt-8 flex items-center gap-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> DOCX</span>
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> DOC</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>{t('upload.maxSize')}</span>
        </div>
      </motion.div>
    </div>
  );
};
