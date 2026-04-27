import React, { useState } from 'react';
import { 
  CloudUpload, 
  FileType, 
  Scissors, 
  QrCode, 
  Stamp, 
  FileCheck,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const steps = [
  { 
    icon: CloudUpload, 
    title: 'Hujjat yuklash', 
    desc: 'Word yoki PDF yuklash',
    tech: 'Fayllar HTTPS bayonnomasi orqali xavfsiz yuklanadi va kontent filtrlash tizimidan o\'tadi.',
    benefit: 'Sizning ma\'lumotlaringiz to\'liq himoyalangan va markaziy boshqaruvga tayyor holga keladi.'
  },
  { 
    icon: FileType, 
    title: 'PDF ga aylantirish', 
    desc: 'Tizim formatga o‘giradi',
    tech: 'Tizim Word va boshqa formatlarni xalqaro PDF/A standartiga yuqori aniqlikda o\'giradi.',
    benefit: 'Hujjat istalgan qurilmada bir xil ko\'rinishi va uzoq muddatli saqlanishi kafolatlanadi.'
  },
  { 
    icon: Scissors, 
    title: 'Sahifalarga ajratish', 
    desc: 'Har bir bet ajratiladi',
    tech: 'Har bir bet alohida mantiqiy qatlamlarga ajratiladi va tizimda indekslanadi.',
    benefit: 'Siz butun hujjat ichidan aynan kerakli bitta sahifani bir soniyada topishingiz mumkin.'
  },
  { 
    icon: QrCode, 
    title: 'QR kod yaratish', 
    desc: 'Unikal kod generatsiyasi',
    tech: 'Har bir sahifa uchun kriptografik xavfsiz va takrorlanmas identifikator yaratiladi.',
    benefit: 'Bu hujjatning qalbakilashtirilishini oldini oladi va har bir betga raqamli tamg\'a beradi.'
  },
  { 
    icon: Stamp, 
    title: 'QR joylashtirish', 
    desc: 'Burchakka muhrlash',
    tech: 'Sun\'iy intellekt sahifadagi matnni tahlil qilib, QR kodni bo\'sh qolgan eng qulay burchakka joylaydi.',
    benefit: 'Hujjat mazmuni va estetik ko\'rinishiga mutlaqo zarar yetkazilmaydi.'
  },
  { 
    icon: FileCheck, 
    title: 'Yakuniy PDF', 
    desc: 'Tayyor faylni yuklash',
    tech: 'Tayyor hujjat optimallashtirilgan hajmda saqlanadi va yuklab olish uchun taqdim etiladi.',
    benefit: 'Tezkor va qulay foydalanish uchun hamma narsa tayyor.'
  },
];

export const Pipeline = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {steps.map((step, index) => (
          <button
            key={step.title}
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all group relative cursor-pointer outline-none ${
              expandedIndex === index 
                ? 'bg-blue-50 border-blue-400 shadow-lg shadow-blue-100 ring-2 ring-blue-100' 
                : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3 transition-all ${
              expandedIndex === index 
                ? 'bg-blue-600 text-white border-blue-600 rotate-3' 
                : 'bg-white border-gray-100 text-blue-600 shadow-sm group-hover:scale-110'
            }`}>
              <step.icon className="w-6 h-6" />
            </div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1 leading-tight">{step.title}</h4>
            <div className="mt-1 flex items-center gap-1">
               <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Batafsil</span>
               <ChevronDown className={`w-2 h-2 text-gray-400 transition-transform duration-300 ${expandedIndex === index ? 'rotate-180' : ''}`} />
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {expandedIndex !== null && (
          <motion.div
            key={expandedIndex}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-blue-100 rounded-3xl p-8 shadow-xl shadow-blue-50/50 flex flex-col md:flex-row gap-8 items-center bg-linear-to-br from-white to-blue-50/20">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
                {React.createElement(steps[expandedIndex].icon, { className: "w-10 h-10" })}
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2 justify-center md:justify-start">
                    {steps[expandedIndex].title}
                    <Info className="w-5 h-5 text-blue-500" />
                  </h3>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Bosqich tafsilotlari</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Texnik jarayon</p>
                    <p className="text-gray-700 font-medium leading-relaxed">{steps[expandedIndex].tech}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Asosiy foydasi</p>
                    <p className="text-gray-600 font-medium italic leading-relaxed">"{steps[expandedIndex].benefit}"</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setExpandedIndex(null)}
                className="text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest px-4 py-2 hover:bg-gray-100 rounded-xl transition-colors self-start md:self-center"
              >
                Yopish ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
