import React from 'react';
import { RecentFiles, QRGuide } from '../components/RecentFiles';
import { UploadArea } from '../components/UploadArea';
import { FileText, Users, Clock, ArrowUpRight } from 'lucide-react';

export const Dashboard = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tizim nazorati</h1>
          <p className="text-sm text-gray-500 font-medium">Bugungi faollik va hujjatlar aylanishi statistikasi</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest">
            Hisobotlar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jami hujjatlar</p>
            <p className="text-2xl font-black text-gray-900">1,284</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kutish rejimida</p>
            <p className="text-2xl font-black text-gray-900">12</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Onlayn xodimlar</p>
            <p className="text-2xl font-black text-gray-900">24</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <RecentFiles />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <QRGuide />
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tezkor amallar</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all flex items-center justify-between group">
                Hujjatlarni saralash 
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>
              <button className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all flex items-center justify-between group">
                Xavfsizlik bayonnomasi
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>
              <button className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all flex items-center justify-between group">
                 Yangi xodim qo'shish
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
