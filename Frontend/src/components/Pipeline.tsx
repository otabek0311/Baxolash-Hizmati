import React, { useState } from 'react';
import {
  CloudUpload, FileType, Scissors,
  QrCode, Stamp, FileCheck, ChevronRight, Cpu, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const steps = [
  {
    icon: CloudUpload,
    title: 'Hujjat yuklash',
    short: 'DOC, DOCX yoki PDF formatda fayl qabul qilinadi',
    color: { ring: 'ring-blue-500',   bg: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-600',   bar: 'bg-blue-500'   },
    tech: {
      label: 'Texnik jarayon',
      icon: Cpu,
      text: 'Fayllar HTTPS orqali xavfsiz yuklanadi. Multer middleware fayl turini va hajmini tekshiradi (max 150 MB). Fayl UUID bilan nomlanib diskda saqlanadi.',
    },
    benefit: {
      label: 'Natija',
      icon: Sparkles,
      text: 'Asl fayl nomi saqlanib qoladi, tizimda noyob identifikator beriladi. Keyingi bosqichga tayyor holat yaratiladi.',
    },
  },
  {
    icon: FileType,
    title: 'PDF ga aylantirish',
    short: 'DOC/DOCX fayllar Microsoft Word COM orqali PDF ga o\'giriladi',
    color: { ring: 'ring-violet-500', bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', bar: 'bg-violet-500' },
    tech: {
      label: 'Texnik jarayon',
      icon: Cpu,
      text: 'Windows PowerShell skripti orqali Word.Application COM ob\'ekti ishga tushiriladi va hujjat PDF/17 formatida eksport qilinadi. PDF fayllar to\'g\'ridan-to\'g\'ri ishlanadi.',
    },
    benefit: {
      label: 'Natija',
      icon: Sparkles,
      text: 'Har qanday qurilmada bir xil ko\'rinadigan, vektorli PDF fayl hosil bo\'ladi. Shrift va jadval formatlari saqlanib qoladi.',
    },
  },
  {
    icon: Scissors,
    title: 'Sahifalarga ajratish',
    short: 'pdf-lib orqali hujjatning har bir sahifasi alohida qayta ishlanadi',
    color: { ring: 'ring-cyan-500',   bg: 'bg-cyan-500',   light: 'bg-cyan-50',   text: 'text-cyan-600',   bar: 'bg-cyan-500'   },
    tech: {
      label: 'Texnik jarayon',
      icon: Cpu,
      text: 'PDFDocument.load() bilan fayl xotiraga olinadi. getPages() orqali har bir sahifa ob\'ekti ajratiladi. Sahifa o\'lchami (width, height) aniqlanadi.',
    },
    benefit: {
      label: 'Natija',
      icon: Sparkles,
      text: 'Har bir sahifaga individual QR kod berish imkoni yaratiladi. Sahifa soni bazaga yoziladi va kuzatuv boshlanadi.',
    },
  },
  {
    icon: QrCode,
    title: 'QR kod generatsiyasi',
    short: 'Har bir sahifa uchun UUID asosida noyob QR token yaratiladi',
    color: { ring: 'ring-emerald-500',bg: 'bg-emerald-500',light: 'bg-emerald-50',text: 'text-emerald-600',bar: 'bg-emerald-500'},
    tech: {
      label: 'Texnik jarayon',
      icon: Cpu,
      text: 'uuid v4 bilan kriptografik noyob token generatsiya qilinadi. Token bazaga saqlanadi, QR kod esa PNG formatda BASE64 ga o\'giriladi va pdf-lib orqali embed qilinadi.',
    },
    benefit: {
      label: 'Natija',
      icon: Sparkles,
      text: 'Har bir sahifaning QR kodi faqat shu sahifaga bog\'liq. 1-sahifa QR i barcha hujjat ma\'lumotlarini, qolganlar faqat o\'z sahifasini ko\'rsatadi.',
    },
  },
  {
    icon: Stamp,
    title: 'Footer muhrlash',
    short: 'Sahifa pastiga professional footer — raqam, qrhujjat.uz, QR kod',
    color: { ring: 'ring-orange-500', bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500' },
    tech: {
      label: 'Texnik jarayon',
      icon: Cpu,
      text: 'MediaBox kengaytiriladi: sahifa A4 o\'lchamida saqlanib, pastga 52pt qo\'shimcha joy ochiladi. Footer da chiziq, sahifa raqami, qrhujjat.uz yozuvi va QR kod joylashadi.',
    },
    benefit: {
      label: 'Natija',
      icon: Sparkles,
      text: 'Asl matn mutlaqo yopilmaydi. Chop etganda hamma narsa bitta A4 varag\'iga sig\'adi. Professional ko\'rinish ta\'minlanadi.',
    },
  },
  {
    icon: FileCheck,
    title: 'Tayyor PDF',
    short: 'Watermark bilan yuklab olish yoki tizimda saqlash',
    color: { ring: 'ring-rose-500',   bg: 'bg-rose-500',   light: 'bg-rose-50',   text: 'text-rose-600',   bar: 'bg-rose-500'   },
    tech: {
      label: 'Texnik jarayon',
      icon: Cpu,
      text: 'Yuklab olishda addWatermark() funksiyasi diagonal "Yuklab olindi: Ism | Vaqt" yozuvini har sahifaga qo\'shadi. Content-Disposition header bilan original nom saqlanadi.',
    },
    benefit: {
      label: 'Natija',
      icon: Sparkles,
      text: 'Kim, qachon yuklab olganini kuzatish mumkin. Audit log yoziladi. Hujjat muddati tugagach avtomatik o\'chiriladi.',
    },
  },
];

export const Pipeline = () => {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-blue-200 via-violet-200 to-rose-200 hidden sm:block" />

      <div className="space-y-3">
        {steps.map((step, i) => {
          const isOpen = active === i;
          const c = step.color;

          return (
            <div key={i} className="relative sm:pl-16">
              {/* Step number bubble */}
              <div className={`absolute left-0 top-5 w-12 h-12 rounded-full hidden sm:flex items-center justify-center border-4 border-white shadow-md z-10 transition-all duration-300 ${isOpen ? c.bg : 'bg-white'}`}>
                {isOpen
                  ? <step.icon className="w-5 h-5 text-white" />
                  : <span className={`text-sm font-black ${c.text}`}>{String(i + 1).padStart(2, '0')}</span>
                }
              </div>

              {/* Card */}
              <motion.div
                layout
                onClick={() => setActive(isOpen ? null : i)}
                className={`cursor-pointer rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? `border-transparent ring-2 ${c.ring} bg-white dark:bg-gray-800 shadow-xl`
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${isOpen ? c.bg : c.light}`}>
                      <step.icon className={`w-5 h-5 ${isOpen ? 'text-white' : c.text}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest sm:hidden ${c.text}`}>{i + 1}-bosqich</span>
                      </div>
                      <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{step.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5 leading-snug hidden sm:block">{step.short}</p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ${isOpen ? c.light : 'bg-gray-50'}`}
                  >
                    <ChevronRight className={`w-3.5 h-3.5 ${isOpen ? c.text : 'text-gray-400'}`} />
                  </motion.div>
                </div>

                {/* Progress bar when open */}
                {isOpen && <div className={`h-0.5 ${c.bar} mx-5 rounded-full mb-1`} />}

                {/* Expanded content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2">
                        {/* Short desc on mobile */}
                        <p className="text-xs text-gray-500 font-medium mb-4 sm:hidden">{step.short}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Tech */}
                          <div className={`${c.light} rounded-xl p-4 space-y-2`}>
                            <div className={`flex items-center gap-2 ${c.text}`}>
                              <step.tech.icon className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{step.tech.label}</span>
                            </div>
                            <p className="text-xs text-gray-700 font-medium leading-relaxed">
                              {step.tech.text}
                            </p>
                          </div>

                          {/* Benefit */}
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2 border border-gray-100 dark:border-gray-600">
                            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                              <step.benefit.icon className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{step.benefit.label}</span>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                              {step.benefit.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}
      </div>

      {active === null && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 flex items-center justify-center gap-3"
        >
          <span className="w-8 h-px bg-gray-200" />
          Bosqich ustiga bosib batafsil ko'rish mumkin
          <span className="w-8 h-px bg-gray-200" />
        </motion.p>
      )}
    </div>
  );
};
