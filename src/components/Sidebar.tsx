import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  CloudUpload, 
  Archive, 
  Settings, 
  BookOpen
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Boshqaruv paneli', path: '/' },
  { icon: FileText, label: 'Hujjatlar ombori', path: '/documents' },
  { icon: CloudUpload, label: 'Yangi hujjat', path: '/upload' },
  { icon: Archive, label: 'Arxiv tizimi', path: '/archive' },
  { icon: BookOpen, label: 'Tizim qo‘llanmasi', path: '/how-it-works' },
  { icon: Settings, label: 'Sozlamalar', path: '/settings' },
];

export const Sidebar = () => {
  return (
    <aside className="w-56 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-5 border-b border-gray-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            QR
          </div>
          <span className="font-bold text-gray-800 text-sm tracking-tight">
            QR Hujjat Tizimi
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => 
              `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-gray-900 truncate">Admin Profil</p>
            <p className="text-[9px] text-gray-500 truncate">Boshqaruvchi</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
