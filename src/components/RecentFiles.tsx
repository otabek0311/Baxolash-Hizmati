import React from 'react';
import { Smartphone, Target, ExternalLink, FileText } from 'lucide-react';

export const QRGuide = () => {
  const steps = [
    { num: '01', desc: 'Smarfoningiz kamerasini QR kodga qarating' },
    { num: '02', desc: 'Tizim sahifa identifikatorini avtomatik o‘qiydi' },
    { num: '03', desc: 'Asl nusxa PDF shaklida ekranda namoyon bo‘ladi' },
  ];

  return (
    <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-xl shadow-blue-100 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
      <h3 className="text-xs font-black uppercase mb-4 opacity-80 tracking-widest flex items-center gap-2">
        <Smartphone className="w-4 h-4" />
        Tezkor qo‘llanma
      </h3>
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 text-[11px] leading-relaxed">
            <span className="font-black text-blue-200">{step.num}</span>
            <p className="font-medium">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RecentFiles = () => {
  const files = [
    { name: 'shartnoma_ijara_final.pdf', pages: 12, date: '12.05.2024', status: 'Tayyor' },
    { name: 'buyruq_045_kadrlar.docx', pages: 3, date: '11.05.2024', status: 'Tayyor' },
    { name: 'hisobot_moliyaviy_q1.pdf', pages: 45, date: '10.05.2024', status: 'Jarayonda' },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex-1">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Oxirgi amallar</h3>
        <button className="text-[10px] font-bold text-blue-600 uppercase">Harchasini ko'rish</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50/30">
              <th className="px-6 py-3 font-black">Hujjat nomi</th>
              <th className="px-6 py-3">Betlar</th>
              <th className="px-6 py-3">Sana</th>
              <th className="px-6 py-3">Holat</th>
              <th className="px-6 py-3 text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {files.map((file, i) => (
              <tr key={i} className="text-[11px] hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-700">{file.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 font-medium">{file.pages} bet</td>
                <td className="px-6 py-4 text-gray-500 font-medium">{file.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                    file.status === 'Tayyor' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {file.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
