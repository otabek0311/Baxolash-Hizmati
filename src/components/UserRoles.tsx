import React from 'react';
import { Shield, Users, UserCog } from 'lucide-react';
import { motion } from 'motion/react';

const roles = [
  {
    icon: Shield,
    title: 'Admin',
    desc: 'To‘liq nazorat va foydalanuvchilar boshqaruvi',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Users,
    title: 'Xodim',
    desc: 'Faqat hujjat yuklash va QR kod qo\'shish',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: UserCog,
    title: 'Boshqaruvchi',
    desc: 'Statistika va hisobotlarni ko‘rish',
    color: 'bg-teal-100 text-teal-600',
  },
];

export const UserRoles = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {roles.map((role, i) => (
        <div
          key={role.title}
          className="group bg-gray-50/50 p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-white transition-all flex flex-col items-center text-center space-y-4"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${role.color}`}>
            <role.icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-gray-900 uppercase tracking-widest">{role.title}</p>
            <p className="text-xs text-gray-500 font-medium leading-relaxed px-4">{role.desc}</p>
          </div>
          <div className="pt-2">
            <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">Huquqlarni boshqarish →</span>
          </div>
        </div>
      ))}
    </div>
  );
};
