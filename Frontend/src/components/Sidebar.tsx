import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, CloudUpload,
  Archive, Settings, BookOpen, Users, X, PanelLeftOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

interface SidebarProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useLang();
  const canSeeUsers = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
    { icon: FileText,        label: t('nav.documents'), path: '/documents' },
    { icon: CloudUpload,     label: t('nav.upload'),    path: '/upload' },
    { icon: Archive,         label: t('nav.archive'),   path: '/archive' },
    ...(canSeeUsers ? [{ icon: Users, label: t('nav.users'), path: '/users' }] : []),
    { icon: BookOpen,        label: t('nav.guide'),     path: '/how-it-works' },
    { icon: Settings,        label: t('nav.settings'),  path: '/settings' },
  ];

  return (
    <>
      {/* Har doim ko'rinadigan toggle tugma */}
      <AnimatePresence initial={false}>
        {!open && (
          <motion.button
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.18 }}
            onClick={onOpen}
            className="fixed top-3 left-3 z-50 flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-colors"
            title={t('nav.menu')}
          >
            <PanelLeftOpen className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">{t('nav.menu')}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 z-50 w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col shadow-2xl"
          >
            {/* Logo + yopish */}
            <div className="h-14 px-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
                  QR
                </div>
                <span className="font-black text-gray-900 dark:text-white text-sm tracking-tight">
                  QR Hujjat Tizimi
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigatsiya */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`} />
                      <span className="text-xs font-semibold">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Foydalanuvchi */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3 px-1">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                  {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium truncate">{user?.role}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
