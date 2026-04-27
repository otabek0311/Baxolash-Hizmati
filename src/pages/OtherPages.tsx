import React from 'react';
import { RecentFiles } from '../components/RecentFiles';

export const Documents = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hujjatlar kutubxonasi</h1>
          <p className="text-sm text-gray-500">Barcha yuklangan va ishlov berilgan hujjatlar ro'yxati.</p>
        </div>
      </div>
      <RecentFiles />
    </div>
  );
};

export const Archive = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
      <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900">Arxiv bo'sh</h2>
      <p className="text-gray-500 max-w-sm">Hozircha arxivlangan hujjatlar mavjud emas.</p>
    </div>
  );
};

export const Settings = () => {
  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 border-b border-gray-50 pb-4">Tizim sozlamalari</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-gray-900">Bildirishnomalar</p>
            <p className="text-xs text-gray-500">Elektron pochta orqali ogohlantirishlar</p>
          </div>
          <div className="w-10 h-5 bg-blue-600 rounded-full relative">
            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-gray-900">Tungi rejim</p>
            <p className="text-xs text-gray-500">Interfeys ranglarini almashtirish</p>
          </div>
          <div className="w-10 h-5 bg-gray-300 rounded-full relative">
            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
