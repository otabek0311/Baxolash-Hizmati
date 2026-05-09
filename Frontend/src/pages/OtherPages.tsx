import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import type { Lang } from '../context/LanguageContext';
import {
  Loader2, Save, FileText, Download, Trash2,
  CheckCircle, Clock, AlertCircle, Archive as ArchiveIcon, X, Filter,
  Sun, Moon,
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

const STATUS_CLS: Record<string, string> = {
  '':          'text-gray-600 bg-gray-100 border-gray-200',
  READY:       'text-green-700 bg-green-50 border-green-200',
  PROCESSING:  'text-blue-700 bg-blue-50 border-blue-200',
  EXPIRED:     'text-red-600 bg-red-50 border-red-200',
  ARCHIVED:    'text-gray-500 bg-gray-50 border-gray-200',
};
const STATUS_ICONS: Record<string, React.FC<any>> = {
  '': Filter, READY: CheckCircle, PROCESSING: Clock, EXPIRED: AlertCircle, ARCHIVED: ArchiveIcon,
};
const statusClass: Record<string, string> = {
  PROCESSING: 'bg-blue-50 text-blue-700',
  READY:      'bg-green-50 text-green-700',
  ARCHIVED:   'bg-gray-100 text-gray-500',
  EXPIRED:    'bg-red-50 text-red-500',
};

const inDateRange = (dateStr: string, range: string) => {
  if (!range) return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (range === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (range === 'week') {
    const w = new Date(now); w.setDate(now.getDate() - 7);
    return d >= w;
  }
  if (range === 'month') {
    const m = new Date(now); m.setDate(now.getDate() - 30);
    return d >= m;
  }
  return true;
};

export const Documents = () => {
  const { t } = useLang();
  const [files, setFiles]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatus]   = useState('');
  const [dateFilter, setDate]       = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; fileId: string | null; fileName: string }>({
    isOpen: false, fileId: null, fileName: '',
  });

  const STATUS_OPTS = [
    { value: '',          label: t('common.all'),         icon: Filter        },
    { value: 'READY',     label: t('status.ready'),       icon: CheckCircle   },
    { value: 'PROCESSING',label: t('status.processing'),  icon: Clock         },
    { value: 'EXPIRED',   label: t('status.expired'),     icon: AlertCircle   },
    { value: 'ARCHIVED',  label: t('status.archived'),    icon: ArchiveIcon   },
  ];
  const DATE_OPTS = [
    { value: '',      label: t('common.allTime') },
    { value: 'today', label: t('common.today')   },
    { value: 'week',  label: t('common.week')    },
    { value: 'month', label: t('common.month')   },
  ];
  const statusLabel: Record<string, string> = {
    PROCESSING: t('status.processing'), READY: t('status.ready'),
    ARCHIVED: t('status.archived'), EXPIRED: t('status.expired'),
  };

  const load = useCallback(() => {
    setLoading(true);
    api.getDocuments(1, 100)
      .then(res => setFiles(res.documents ?? res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = files.filter(f => {
    if (statusFilter && f.status !== statusFilter) return false;
    if (!inDateRange(f.createdAt, dateFilter)) return false;
    return true;
  });

  const hasFilter = statusFilter || dateFilter;

  const handleDownload = async (file: any) => {
    try { await api.downloadDocument(file.id, file.originalName); }
    catch (err: any) { alert(err.message); }
  };

  const confirmDelete = async () => {
    if (!deleteModal.fileId) return;
    try {
      await api.deleteDocument(deleteModal.fileId);
      setFiles(prev => prev.filter(f => f.id !== deleteModal.fileId));
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('docs.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('docs.subtitle')}</p>
        </div>
        <button onClick={load} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex-shrink-0 mt-1">
          {t('common.refresh')}
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Status chips */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTS.map(opt => {
            const Icon = opt.icon;
            const active = statusFilter === opt.value;
            const cls = STATUS_CLS[opt.value] || STATUS_CLS[''];
            return (
              <button
                key={opt.value}
                onClick={() => setStatus(active ? '' : opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                  active ? cls + ' shadow-sm' : 'text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Icon className="w-3 h-3" />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('docs.filterByDate')}</span>
          <div className="flex gap-2 flex-wrap">
            {DATE_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDate(dateFilter === opt.value ? '' : opt.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  dateFilter === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {hasFilter && (
            <button
              onClick={() => { setStatus(''); setDate(''); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all ml-auto"
            >
              <X className="w-3 h-3" /> {t('common.clearFilter')}
            </button>
          )}
        </div>

        {/* Count */}
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
          {loading ? '...' : `${filtered.length} ta hujjat${hasFilter ? ` (jami ${files.length} dan)` : ''}`}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 space-y-2">
            <FileText className="w-8 h-8" />
            <p className="text-xs font-bold uppercase tracking-widest">
              {hasFilter ? t('docs.noResults') : t('docs.noDocuments')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 dark:border-gray-700 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest bg-gray-50/30 dark:bg-gray-900/30">
                  <th className="px-4 sm:px-6 py-3 font-black">{t('docs.name')}</th>
                  <th className="hidden sm:table-cell px-6 py-3">{t('docs.pages')}</th>
                  <th className="hidden md:table-cell px-6 py-3">{t('docs.uploadedBy')}</th>
                  <th className="hidden md:table-cell px-6 py-3">{t('common.date')}</th>
                  <th className="px-4 sm:px-6 py-3">{t('docs.status')}</th>
                  <th className="px-4 sm:px-6 py-3 text-right">{t('docs.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filtered.map(file => (
                  <tr key={file.id} className="text-[11px] hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-200 truncate max-w-[130px] sm:max-w-[200px] md:max-w-[260px]">
                          {file.originalName}
                        </span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                      {file.pageCount || '—'} {t('common.pages')}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                      {file.uploadedBy?.name || '—'}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                      {new Date(file.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${statusClass[file.status] || 'bg-gray-50 text-gray-500'}`}>
                        {statusLabel[file.status] || file.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        {file.status === 'READY' && (
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                            title={t('common.download')}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, fileId: file.id, fileName: file.originalName })}
                          className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
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
      </div>

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

export const Archive = () => {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('archive.empty')}</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">{t('archive.emptyDesc')}</p>
    </div>
  );
};

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const [settings, setSettings] = useState({ defaultRetentionDays: 30, minRetentionDays: 7, maxRetentionDays: 90, maxFileSizeMb: 150 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(s => { if (s) setSettings(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await api.updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.subtitle')}</p>
      </div>

      {/* Appearance & Language */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 space-y-8">
        <div className="space-y-6">
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 pb-3">
            {t('settings.appearance')}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium -mt-4">{t('settings.appearanceDesc')}</p>

          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
              </span>
            </div>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Language selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('settings.language')}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{t('settings.languageDesc')}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLang(opt.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${
                    lang === opt.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span>{opt.flag}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Retention settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 space-y-8">
        <div className="space-y-6">
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 pb-3">
            {t('settings.retention')}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('settings.defaultPeriod')}</label>
              <span className="text-sm font-black text-blue-600">{settings.defaultRetentionDays} {t('common.days')}</span>
            </div>
            <input
              type="range"
              min={settings.minRetentionDays}
              max={settings.maxRetentionDays}
              value={settings.defaultRetentionDays}
              onChange={e => setSettings(s => ({ ...s, defaultRetentionDays: Number(e.target.value) }))}
              disabled={!isSuperAdmin}
              className="w-full accent-blue-600 disabled:opacity-50"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{t('settings.defaultPeriodDesc')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('settings.minPeriod')}</label>
              <input
                type="number"
                min={7}
                max={90}
                value={settings.minRetentionDays}
                onChange={e => setSettings(s => ({ ...s, minRetentionDays: Number(e.target.value) }))}
                disabled={!isSuperAdmin}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl py-2.5 px-4 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('settings.maxPeriod')}</label>
              <input
                type="number"
                min={7}
                max={90}
                value={settings.maxRetentionDays}
                onChange={e => setSettings(s => ({ ...s, maxRetentionDays: Number(e.target.value) }))}
                disabled={!isSuperAdmin}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl py-2.5 px-4 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('settings.maxFileSize')}</label>
            <input
              type="number"
              min={1}
              max={200}
              value={settings.maxFileSizeMb}
              onChange={e => setSettings(s => ({ ...s, maxFileSizeMb: Number(e.target.value) }))}
              disabled={!isSuperAdmin}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl py-2.5 px-4 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
          </div>
        </div>

        {!isSuperAdmin && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-xl">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">{t('settings.adminOnly')}</p>
          </div>
        )}

        {isSuperAdmin && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('common.save')}
            </button>
            {success && <span className="text-xs font-bold text-green-600">{t('common.saved')}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
