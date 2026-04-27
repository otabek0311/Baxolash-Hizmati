import React, { useState } from 'react';
import { QrCode, FileText, Info, History, Download, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const DocumentDetails = () => {
  const [activeTab, setActiveTab] = useState('pages');

  const tabs = [
    { id: 'pages', label: 'Sahifalar ko‘rinishi', icon: FileText },
    { id: 'info', label: 'Metama’lumotlar', icon: Info },
    { id: 'history', label: 'Jarayonlar tarixi', icon: History },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gray-50/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Hujjat tahlili</h3>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-widest">Yakunlangan</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">shartnoma_ijara_final_v2.pdf • 1.4 MB • 12 sahifa</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95">
          <Download className="w-4 h-4" />
          PDF yuklab olish
        </button>
      </div>

      <div className="px-8 pt-6 border-b border-gray-100">
        <div className="flex gap-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabDetails"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 flex-1 overflow-y-auto">
        {activeTab === 'pages' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[3/4] bg-gray-50 border border-gray-100 rounded-xl overflow-hidden mb-3 transition-all group-hover:border-blue-400 group-hover:shadow-xl group-hover:shadow-blue-50 relative">
                  <div className="absolute inset-0 p-4 flex flex-col">
                    <div className="flex-1 space-y-3 opacity-10">
                      <div className="h-1.5 w-full bg-gray-400 rounded-full" />
                      <div className="h-1.5 w-5/6 bg-gray-400 rounded-full" />
                      <div className="h-1.5 w-4/6 bg-gray-400 rounded-full" />
                      <div className="h-1.5 w-full bg-gray-400 rounded-full" />
                    </div>
                    <div className="flex justify-end">
                      <div className="w-10 h-10 bg-white border border-gray-100 shadow-sm rounded-lg p-1.5 flex items-center justify-center">
                        <QrCode className="w-full h-full text-gray-800 opacity-60" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors" />
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{i + 1}-bet</span>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title="QR tamg'alangan" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-8 max-w-lg">
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                   <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hujjat nomi</p>
                  <p className="text-sm font-bold text-gray-900">shartnoma_ijara_final_v2.pdf</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                   <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Yuklangan vaqt</p>
                  <p className="text-sm font-bold text-gray-900">Bugun, 27-aprel, 11:45</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                   <Info className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Xavfsizlik darajasi</p>
                  <p className="text-sm font-bold text-gray-900">O'ta yuqori (SHA-256 tamg'a)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {[
              { title: 'QR kodlar muhrlandi', time: '11:47', desc: 'Barcha 12 betga unikal identifikatorlar joylandi.' },
              { title: 'PDF formatga o\'girildi', time: '11:46', desc: 'Fayl DOCX dan PDF/A standartiga o\'tkazildi.' },
              { title: 'Fayl tizimga yuklandi', time: '11:45', desc: 'Admin tomonidan shartnoma_final fayli kiritildi.' }
            ].map((item, i) => (
              <div key={i} className="flex gap-5 p-5 rounded-2xl border border-gray-50 hover:bg-gray-50 hover:border-gray-100 transition-all group">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900 leading-none">{item.title}</p>
                    <span className="text-[10px] font-bold text-blue-500 px-1.5 py-0.5 bg-blue-50 rounded">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
