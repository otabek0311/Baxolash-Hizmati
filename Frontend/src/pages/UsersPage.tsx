import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, UserPlus, Shield, User, Key,
  CheckCircle, XCircle, Loader2, X, Eye, EyeOff, Edit2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

const ROLE_ORDER: Record<string, number> = { SUPERADMIN: 0, ADMIN: 1, XODIM: 2 };

const ROLE_META: Record<string, { color: string; bg: string }> = {
  SUPERADMIN: { color: 'text-purple-700', bg: 'bg-purple-100' },
  ADMIN:       { color: 'text-blue-700',   bg: 'bg-blue-100'   },
  XODIM:       { color: 'text-orange-700', bg: 'bg-orange-100' },
};

const onlineStatus = (lastSeenAt: string | null) => {
  if (!lastSeenAt) return 'offline';
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < 5 * 60 * 1000)  return 'online';
  if (diff < 30 * 60 * 1000) return 'recent';
  return 'offline';
};

const StatusDot = ({ lastSeenAt, titles }: { lastSeenAt: string | null; titles: { online: string; recent: string; offline: string } }) => {
  const s = onlineStatus(lastSeenAt);
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${
      s === 'online' ? 'bg-green-500' : s === 'recent' ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-500'
    }`} title={s === 'online' ? titles.online : s === 'recent' ? titles.recent : titles.offline} />
  );
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md"
    >
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-black text-gray-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all";

export const UsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const { t } = useLang();
  const canCreate = me?.role === 'SUPERADMIN' || me?.role === 'ADMIN';

  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal]     = useState<any>(null);
  const [pwdModal, setPwdModal]       = useState<any>(null);
  const [saving, setSaving]           = useState(false);
  const [showPwd, setShowPwd]         = useState(false);

  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'XODIM' });
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', isActive: true });
  const [newPwd, setNewPwd]     = useState('');

  const roleLabels: Record<string, string> = {
    SUPERADMIN: t('role.superadmin'),
    ADMIN: t('role.admin'),
    XODIM: t('role.xodim'),
  };

  const load = useCallback(() => {
    setLoading(true);
    api.getUsers()
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          const rd = (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9);
          if (rd !== 0) return rd;
          return a.name.localeCompare(b.name, 'uz');
        });
        setUsers(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ADMIN uchun SUPERADMIN ko'rinmaydi; SUPERADMIN barchasini ko'radi
  const visibleUsers = me?.role === 'ADMIN'
    ? users.filter(u => u.role !== 'SUPERADMIN')
    : users;

  // SUPERADMIN — hammani (o'zini ham) tahrirlaydi
  // ADMIN — XODIM larni va o'zini tahrirlaydi
  const canEditUser = (target: any): boolean => {
    if (me?.role === 'SUPERADMIN') return true;
    if (me?.role === 'ADMIN') return target.role === 'XODIM' || target.id === me?.id;
    return false;
  };

  const stats = {
    total:    visibleUsers.length,
    online:   visibleUsers.filter(u => onlineStatus(u.lastSeenAt) === 'online').length,
    admins:   visibleUsers.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length,
    xodimlar: visibleUsers.filter(u => u.role === 'XODIM').length,
  };

  const openEdit = (u: any) => {
    setEditForm({ name: u.name, email: u.email, role: u.role, isActive: u.isActive });
    setEditModal(u);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.createUser(form);
      setCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'XODIM' });
      load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      await api.updateUser(editModal.id, editForm);
      setEditModal(null);
      load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 6) { alert(t('users.pwdPlaceholder')); return; }
    setSaving(true);
    try {
      await api.resetPassword(pwdModal.id, newPwd);
      setPwdModal(null);
      setNewPwd('');
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const availableRoles = me?.role === 'SUPERADMIN' ? ['ADMIN', 'XODIM'] : ['XODIM'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t('users.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">{t('users.subtitle')}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> {t('users.newUser')}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('users.totalUsers'),  value: stats.total,    icon: Users,       color: 'blue'   },
          { label: t('users.onlineNow'),   value: stats.online,   icon: CheckCircle, color: 'green'  },
          { label: t('users.admins'),      value: stats.admins,   icon: Shield,      color: 'purple' },
          { label: t('users.xodimlar'),    value: stats.xodimlar, icon: User,        color: 'orange' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${s.color}-50`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{t('users.allMembers')}</h2>
          <button onClick={load} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">
            {t('common.refresh')}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-gray-700">
                  <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('users.employee')}</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('users.role')}</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('users.documents')}</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('users.status')}</th>
                  <th className="hidden xl:table-cell px-6 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('users.lastActive')}</th>
                  <th className="px-4 sm:px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {visibleUsers.map(u => {
                  const status = onlineStatus(u.lastSeenAt);
                  const rm = ROLE_META[u.role] || ROLE_META.XODIM;
                  const editable = canEditUser(u);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <StatusDot
                              lastSeenAt={u.lastSeenAt}
                              titles={{
                                online: t('common.online'),
                                recent: t('common.recentlyActive'),
                                offline: t('common.offline'),
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate max-w-[120px] sm:max-w-none">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className={`px-2 sm:px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${rm.bg} ${rm.color}`}>
                          {roleLabels[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{u._count?.documents ?? 0}</span>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {u.isActive ? t('status.active') : t('status.blocked')}
                        </span>
                      </td>
                      <td className="hidden xl:table-cell px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            status === 'online' ? 'bg-green-500' : status === 'recent' ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-500'
                          }`} />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {status === 'online' ? t('common.online') : u.lastSeenAt
                              ? new Date(u.lastSeenAt).toLocaleString('uz-UZ')
                              : t('common.never')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                        {editable && (
                          <button
                            onClick={() => openEdit(u)}
                            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all uppercase tracking-widest whitespace-nowrap"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span className="hidden sm:inline">{t('users.editBtn')}</span>
                            <span className="sm:hidden">{t('users.editBtnShort')}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      <AnimatePresence>
        {createModal && (
          <Modal title={t('users.addUser')} onClose={() => { setCreateModal(false); setShowPwd(false); }}>
            <div className="space-y-4">
              <Field label={t('users.fullName')}>
                <input
                  className={inputCls}
                  placeholder={t('users.namePlaceholder')}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputCls}
                  type="email"
                  placeholder={t('users.emailPlaceholder')}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </Field>
              <Field label={t('auth.password')}>
                <div className="relative">
                  <input
                    className={inputCls + ' pr-10'}
                    type={showPwd ? 'text' : 'password'}
                    placeholder={t('users.pwdPlaceholder')}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label={t('users.role')}>
                <select className={inputCls} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {availableRoles.map(r => <option key={r} value={r}>{roleLabels[r] ?? r}</option>)}
                </select>
              </Field>
              <button
                onClick={handleCreate}
                disabled={saving || !form.name || !form.email || !form.password}
                className="w-full py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {t('common.add')}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── EDIT MODAL ── */}
      <AnimatePresence>
        {editModal && (
          <Modal title={`${t('users.editUser')} — ${editModal.name}`} onClose={() => { setEditModal(null); }}>
            <div className="space-y-4">
              <Field label={t('users.fullName')}>
                <input
                  className={inputCls}
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputCls}
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                />
              </Field>
              {me?.role === 'SUPERADMIN' && editModal?.id !== me?.id && (
                <Field label={t('users.role')}>
                  <select
                    className={inputCls}
                    value={editForm.role}
                    onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  >
                    {availableRoles.map(r => <option key={r} value={r}>{roleLabels[r] ?? r}</option>)}
                  </select>
                </Field>
              )}
              {editModal.id !== me?.id && (
                <Field label={t('users.status')}>
                  <button
                    type="button"
                    onClick={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      editForm.isActive
                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                        : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <div className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${editForm.isActive ? 'bg-green-500' : 'bg-red-400'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${editForm.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                    </div>
                    <span className="text-sm font-bold">
                      {editForm.isActive ? t('users.activeToggle') : t('users.blockedToggle')}
                    </span>
                    {editForm.isActive ? <XCircle className="w-4 h-4 ml-auto" /> : <CheckCircle className="w-4 h-4 ml-auto" />}
                  </button>
                </Field>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEdit}
                  disabled={saving || !editForm.name || !editForm.email}
                  className="flex-1 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  {t('common.save')}
                </button>
                <button
                  onClick={() => { setPwdModal(editModal); setEditModal(null); }}
                  className="px-4 py-3 bg-orange-50 text-orange-600 border border-orange-200 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-orange-100 transition-all flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  {t('users.pwdBtn')}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── RESET PASSWORD MODAL ── */}
      <AnimatePresence>
        {pwdModal && (
          <Modal title={`${t('users.resetPwd')} — ${pwdModal.name}`} onClose={() => { setPwdModal(null); setNewPwd(''); setShowPwd(false); }}>
            <div className="space-y-4">
              <Field label={t('auth.password')}>
                <div className="relative">
                  <input
                    className={inputCls + ' pr-10'}
                    type={showPwd ? 'text' : 'password'}
                    placeholder={t('users.pwdPlaceholder')}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <button
                onClick={handleResetPwd}
                disabled={saving || newPwd.length < 6}
                className="w-full py-3 bg-orange-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {t('users.updatePwd')}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
