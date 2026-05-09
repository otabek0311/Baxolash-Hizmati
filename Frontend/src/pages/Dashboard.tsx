import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RecentFiles, QRGuide } from '../components/RecentFiles';
import { FileText, Users, Clock, ArrowUpRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { t } = useLang();
  const { user } = useAuth();
  const canViewStats = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canViewStats) { setLoading(false); return; }
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [canViewStats]);

  const total = stats?.totalDocs ?? 0;
  const processing = stats?.byStatus?.find((s: any) => s.status === 'PROCESSING')?._count?.id ?? 0;
  const users = stats?.totalUsers ?? 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {canViewStats && <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('dashboard.totalDocs')}</p>
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300 dark:text-gray-600" /> : (
              <p className="text-2xl font-black text-gray-900 dark:text-white">{total.toLocaleString()}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:border-orange-200 dark:hover:border-orange-700 transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('dashboard.processing')}</p>
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300 dark:text-gray-600" /> : (
              <p className="text-2xl font-black text-gray-900 dark:text-white">{processing}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:border-green-200 dark:hover:border-green-700 transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('dashboard.activeUsers')}</p>
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300 dark:text-gray-600" /> : (
              <p className="text-2xl font-black text-gray-900 dark:text-white">{users}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <RecentFiles />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <QRGuide />
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('dashboard.quickActions')}</h3>
            <div className="space-y-3">
              <Link to="/documents" className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-all flex items-center justify-between group">
                {t('dashboard.viewDocs')}
                <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
              </Link>
              <Link to="/upload" className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-all flex items-center justify-between group">
                {t('dashboard.uploadNew')}
                <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
              </Link>
              <Link to="/settings" className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-all flex items-center justify-between group">
                {t('dashboard.settings')}
                <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
