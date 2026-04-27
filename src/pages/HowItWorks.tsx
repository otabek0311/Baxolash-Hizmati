import React from 'react';
import { Pipeline } from '../components/Pipeline';
import { UserRoles } from '../components/UserRoles';
import { BookOpen, ShieldCheck, Zap, HelpCircle, Users } from 'lucide-react';

export const HowItWorks = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-16 py-12 px-6">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl shadow-sm mb-4">
          <BookOpen className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Tizim qanday ishlaydi?</h1>
        <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
          QR Hujjat Tizimi zamonaviy algoritmlar yordamida qog'oz va raqamli dunyo o'rtasidagi ko'prik vazifasini o'taydi.
        </p>
      </div>

      <section className="space-y-10">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
          <Zap className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Ish jarayoni bosqichlari</h2>
        </div>
        
        <Pipeline />
      </section>

      <section className="space-y-10 pt-8 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <HelpCircle className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">Foydalanish ruxsatnomalari</h2>
        </div>
        <UserRoles />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Xavfsizlik va Samaradorlik</h3>
          <p className="text-base text-gray-500 leading-relaxed">
            QR kodlar orqali hujjatlarni kuzatish — bu shunchaki qulaylik emas, balki xavfsizlikning yangi darajasi. 
            Har bir skanerlash orqali siz hujjatning asl nusxasiga to'g'ridan-to'g'ri bog'lanasiz, bu esa soxta hujjatlar bilan ishlash xavfini nolga tushiradi. 
            Xodimlar o'nlab sahifalar ichidan kerakli ma'lumotni qidirishga ketadigan vaqtini 90% gacha tejashadi.
          </p>
        </div>
        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">AI Imkoniyatlari</h3>
          <p className="text-base text-gray-500 leading-relaxed">
            Bizning sun'iy intellekt modelimiz har bir sahifani piksellar darajasida tahlil qiladi. 
            U nafaqat QR kodni bo'sh joyga qo'yadi, balki u yerda muhim muhrlar, imzolar yoki rasm elementlari yo'qligini tushunadi. 
            QR kodlar vizual tarzda hamma sahifalarda bir xil turishi va hujjatning yuridik kuchini saqlab qolishi uchun aqlli algoritmlar mas'ul.
          </p>
        </div>
      </div>
    </div>
  );
};
