import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileText, X, Loader2,
  LayoutDashboard, CloudUpload, Archive, Settings, BookOpen, Users,
  Download, CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<{ documents: any[]; users: any[] }>({ documents: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor]   = useState(0);

  const STATUS_META: Record<string, { label: string; icon: React.FC<any>; color: string }> = {
    READY:      { label: t('status.ready'),      icon: CheckCircle,  color: 'text-green-600'  },
    PROCESSING: { label: t('status.processing'), icon: Clock,        color: 'text-blue-600'   },
    EXPIRED:    { label: t('status.expired'),    icon: AlertCircle,  color: 'text-red-500'    },
    ARCHIVED:   { label: t('status.archived'),   icon: Archive,      color: 'text-gray-400'   },
  };

  const QUICK_LINKS = [
    { label: t('nav.dashboard'), path: '/',            icon: LayoutDashboard },
    { label: t('nav.documents'), path: '/documents',   icon: FileText        },
    { label: t('nav.upload'),    path: '/upload',      icon: CloudUpload     },
    { label: t('nav.archive'),   path: '/archive',     icon: Archive         },
    { label: t('nav.guide'),     path: '/how-it-works', icon: BookOpen       },
    { label: t('nav.settings'),  path: '/settings',    icon: Settings        },
    { label: t('nav.users'),     path: '/users',       icon: Users           },
  ];

  useEffect(() => {
    if (!query.trim()) { setResults({ documents: [], users: [] }); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query.trim());
        setResults(data);
        setCursor(0);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setQuery('');
      setResults({ documents: [], users: [] });
      setCursor(0);
    }
  }, [open]);

  const canSeeUsers = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';
  const showSearch = query.trim().length > 0;

  const allItems: { type: string; data: any }[] = showSearch
    ? [
        ...results.documents.map(d => ({ type: 'doc', data: d })),
        ...(canSeeUsers ? results.users.map(u => ({ type: 'user', data: u })) : []),
      ]
    : QUICK_LINKS.map(l => ({ type: 'link', data: l }));

  const go = useCallback((item: { type: string; data: any }) => {
    if (item.type === 'link') {
      navigate(item.data.path);
    } else if (item.type === 'doc') {
      navigate('/documents');
    } else if (item.type === 'user') {
      navigate('/users');
    }
    onClose();
  }, [navigate, onClose]);

  const handleDownload = async (doc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await api.downloadDocument(doc.id, doc.originalName); } catch (err: any) { alert(err.message); }
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === 'Enter' && allItems[cursor]) { go(allItems[cursor]); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, allItems, cursor, go, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
              {loading
                ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                : <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setCursor(0); }}
                placeholder={t('search.placeholder')}
                className="flex-1 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-lg">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Empty search → quick links */}
              {!showSearch && (
                <div className="p-2">
                  <p className="px-3 py-1.5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {t('search.quickNav')}
                  </p>
                  {QUICK_LINKS.map((link, i) => {
                    const Icon = link.icon;
                    const active = cursor === i;
                    return (
                      <button
                        key={link.path}
                        onClick={() => go({ type: 'link', data: link })}
                        onMouseEnter={() => setCursor(i)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                          active ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${active ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <Icon className={`w-3.5 h-3.5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                        </div>
                        <span className={`text-sm font-semibold ${active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                          {link.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search results */}
              {showSearch && (
                <div className="p-2 space-y-1">
                  {/* Documents */}
                  {results.documents.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {t('search.documents')}
                      </p>
                      {results.documents.map((doc, i) => {
                        const active = cursor === i;
                        const sm = STATUS_META[doc.status] || STATUS_META.ARCHIVED;
                        const SmIcon = sm.icon;
                        return (
                          <button
                            key={doc.id}
                            onClick={() => go({ type: 'doc', data: doc })}
                            onMouseEnter={() => setCursor(i)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group ${
                              active ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                              <FileText className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${active ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-white'}`}>
                                {doc.originalName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <SmIcon className={`w-3 h-3 ${sm.color}`} />
                                <span className={`text-[10px] font-bold ${sm.color}`}>{sm.label}</span>
                                {doc.pageCount && (
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{doc.pageCount} {t('common.pages')}</span>
                                )}
                                {doc.uploadedBy?.name && (
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">{doc.uploadedBy.name}</span>
                                )}
                              </div>
                            </div>
                            {doc.status === 'READY' && (
                              <button
                                onClick={e => handleDownload(doc, e)}
                                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                  active ? 'hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-500' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400'
                                }`}
                                title={t('common.download')}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Users */}
                  {canSeeUsers && results.users.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {t('search.users')}
                      </p>
                      {results.users.map((u, i) => {
                        const idx = results.documents.length + i;
                        const active = cursor === idx;
                        return (
                          <button
                            key={u.id}
                            onClick={() => go({ type: 'user', data: u })}
                            onMouseEnter={() => setCursor(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                              active ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 ${
                              u.role === 'ADMIN' ? 'bg-blue-600' : 'bg-indigo-500'
                            }`}>
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${active ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-white'}`}>
                                {u.name}
                              </p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">{u.email}</p>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              u.role === 'ADMIN' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            }`}>
                              {u.role}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* No results */}
                  {results.documents.length === 0 && results.users.length === 0 && !loading && (
                    <div className="py-12 text-center">
                      <Search className="w-8 h-8 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-400 dark:text-gray-500">
                        {t('search.noResults')} "<span className="text-gray-600 dark:text-gray-300">{query.slice(0, 60)}</span>"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t border-gray-50 dark:border-gray-700 flex items-center gap-4 text-[10px] font-bold text-gray-300 dark:text-gray-500">
              <span>↑↓ {t('search.nav')}</span>
              <span>↵ {t('search.open')}</span>
              <span>ESC {t('search.close')}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
