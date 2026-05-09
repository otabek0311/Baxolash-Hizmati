import React, { useState } from 'react';
import { Shield, Users, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const roles = [
  {
    icon: Shield,
    title: 'Super Admin',
    role: 'SUPERADMIN',
    color: 'bg-purple-100 text-purple-600',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    desc: "Tizimga to'liq nazorat. Barcha funksiyalar mavjud.",
    permissions: [
      { label: 'Barcha hujjatlarni ko\'rish',         allowed: true },
      { label: 'Hujjat yuklash',                       allowed: true },
      { label: 'Hujjat yuklab olish',                  allowed: true },
      { label: 'Hujjat o\'chirish',                    allowed: true },
      { label: 'Dashboard statistikasini ko\'rish',    allowed: true },
      { label: 'Xodimlar ro\'yxatini ko\'rish',        allowed: true },
      { label: 'Yangi Admin qo\'shish',                allowed: true },
      { label: 'Yangi Xodim qo\'shish',                allowed: true },
      { label: 'Foydalanuvchi rolini o\'zgartirish',   allowed: true },
      { label: 'Foydalanuvchini bloklash',             allowed: true },
      { label: 'Parolni tiklash',                      allowed: true },
      { label: 'Audit logni ko\'rish',                 allowed: true },
      { label: 'Tizim sozlamalarini o\'zgartirish',    allowed: true },
    ],
  },
  {
    icon: Shield,
    title: 'Admin',
    role: 'ADMIN',
    color: 'bg-blue-100 text-blue-600',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    desc: "Xodimlarni boshqarish va barcha hujjatlarga kirish.",
    permissions: [
      { label: 'Barcha hujjatlarni ko\'rish',         allowed: true },
      { label: 'Hujjat yuklash',                       allowed: true },
      { label: 'Hujjat yuklab olish',                  allowed: true },
      { label: 'Hujjat o\'chirish',                    allowed: true },
      { label: 'Dashboard statistikasini ko\'rish',    allowed: true },
      { label: 'Xodimlar ro\'yxatini ko\'rish',        allowed: true },
      { label: 'Yangi Admin qo\'shish',                allowed: false },
      { label: 'Yangi Xodim qo\'shish',                allowed: true },
      { label: 'Foydalanuvchi rolini o\'zgartirish',   allowed: false },
      { label: 'Foydalanuvchini bloklash',             allowed: true },
      { label: 'Parolni tiklash',                      allowed: true },
      { label: 'Audit logni ko\'rish',                 allowed: true },
      { label: 'Tizim sozlamalarini o\'zgartirish',    allowed: false },
    ],
  },
  {
    icon: Users,
    title: 'Xodim',
    role: 'XODIM',
    color: 'bg-orange-100 text-orange-600',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    desc: "Faqat o'z hujjatlari bilan ishlash.",
    permissions: [
      { label: 'Faqat o\'z hujjatlarini ko\'rish',    allowed: true },
      { label: 'Hujjat yuklash',                       allowed: true },
      { label: 'O\'z hujjatini yuklab olish',          allowed: true },
      { label: 'Hujjat o\'chirish',                    allowed: false },
      { label: 'Dashboard statistikasini ko\'rish',    allowed: false },
      { label: 'Xodimlar ro\'yxatini ko\'rish',        allowed: false },
      { label: 'Yangi Admin qo\'shish',                allowed: false },
      { label: 'Yangi Xodim qo\'shish',                allowed: false },
      { label: 'Foydalanuvchi rolini o\'zgartirish',   allowed: false },
      { label: 'Foydalanuvchini bloklash',             allowed: false },
      { label: 'Parolni tiklash',                      allowed: false },
      { label: 'Audit logni ko\'rish',                 allowed: false },
      { label: 'Tizim sozlamalarini o\'zgartirish',    allowed: false },
    ],
  },
];

export const UserRoles = () => {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {roles.map((role) => {
        const isOpen = open === role.role;
        const allowed = role.permissions.filter(p => p.allowed).length;
        const total   = role.permissions.length;

        return (
          <div
            key={role.role}
            className={`rounded-2xl border ${isOpen ? role.border : 'border-gray-100 dark:border-gray-700'} bg-white dark:bg-gray-800 overflow-hidden transition-all`}
          >
            {/* Header — bosiladigan qism */}
            <button
              onClick={() => setOpen(isOpen ? null : role.role)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${role.color}`}>
                  <role.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-black text-gray-900 dark:text-white">{role.title}</p>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest ${role.badge}`}>
                      {role.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{role.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className="text-[10px] font-black text-gray-400 hidden sm:block">
                  {allowed}/{total} huquq
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              </div>
            </button>

            {/* Kengaytirilgan kontent */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-gray-50 dark:border-gray-700">
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {role.permissions.map((perm) => (
                        <div
                          key={perm.label}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                            perm.allowed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            perm.allowed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                          }`}>
                            {perm.allowed
                              ? <Check className="w-3 h-3 text-white" />
                              : <X className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                            }
                          </div>
                          <span className={`text-xs font-semibold ${
                            perm.allowed ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {perm.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        <span>Huquqlar darajasi</span>
                        <span>{Math.round((allowed / total) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(allowed / total) * 100}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            role.role === 'SUPERADMIN' ? 'bg-purple-500' :
                            role.role === 'ADMIN'      ? 'bg-blue-500'   : 'bg-orange-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
