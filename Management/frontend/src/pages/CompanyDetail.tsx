import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Edit2, Save, X, ExternalLink,
  Copy, Check, AlertTriangle, Cpu, HardDrive, MemoryStick,
  CreditCard, Plus, Trash2, Ban, Play, Server,
  Activity
} from 'lucide-react';
import {
  getCompany, updateCompany, suspendCompany, activateCompany,
  deleteCompany, getPayments, createPayment, createClickLink, createPaymeLink,
  getCompanyStats,
  type Company, type Payment, type CompanyStats
} from '../services/api';

type Tab = 'overview' | 'monitoring' | 'payments' | 'danger';

function StatusBadge({ status }: { status: Company['status'] }) {
  const styles = {
    ACTIVE: 'bg-green-500/20 text-green-400 border border-green-500/30',
    PROVISIONING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    SUSPENDED: 'bg-red-500/20 text-red-400 border border-red-500/30',
    TERMINATED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'ACTIVE' ? 'bg-green-400 animate-pulse' :
        status === 'PROVISIONING' ? 'bg-yellow-400 animate-pulse' :
        status === 'SUSPENDED' ? 'bg-red-400' : 'bg-slate-400'
      }`} />
      {status}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="text-slate-500 hover:text-slate-300 transition-colors ml-1">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ company, onUpdate }: { company: Company; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: company.name,
    domain: company.domain || '',
    monthlyPrice: company.monthlyPrice,
    contactName: company.contactName || '',
    contactEmail: company.contactEmail || '',
    contactPhone: company.contactPhone || '',
    notes: company.notes || '',
  });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompany(company.id, form);
      onUpdate();
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const frontendUrl = company.domain
    ? `https://${company.domain}`
    : company.frontendPort
    ? `http://localhost:${company.frontendPort}`
    : null;

  const backendUrl = company.backendPort
    ? `http://localhost:${company.backendPort}/api`
    : null;

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Korxona ma'lumotlari</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-all"
            >
              <Edit2 size={14} /> Tahrirlash
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-all"
              >
                <X size={14} /> Bekor
              </button>
              <button
                form="edit-form"
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                {saving ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                Saqlash
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <form id="edit-form" onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nomi', key: 'name', type: 'text', required: true },
              { label: 'Domain', key: 'domain', type: 'text' },
              { label: 'Oylik narx (UZS)', key: 'monthlyPrice', type: 'number' },
              { label: 'Kontakt ismi', key: 'contactName', type: 'text' },
              { label: 'Kontakt email', key: 'contactEmail', type: 'email' },
              { label: 'Telefon', key: 'contactPhone', type: 'tel' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                <input
                  type={f.type}
                  required={f.required}
                  value={String(form[f.key as keyof typeof form])}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Eslatmalar</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nomi', value: company.name },
              { label: 'Slug', value: company.slug },
              { label: 'Domain', value: company.domain || '—' },
              { label: 'Oylik narx', value: new Intl.NumberFormat('uz-UZ').format(company.monthlyPrice) + ' UZS' },
              { label: 'Kontakt ismi', value: company.contactName || '—' },
              { label: 'Kontakt email', value: company.contactEmail || '—' },
              { label: 'Telefon', value: company.contactPhone || '—' },
              { label: 'Yaratilgan', value: new Date(company.createdAt).toLocaleDateString('uz-UZ') },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                <p className="text-slate-200 text-sm">{value}</p>
              </div>
            ))}
            {company.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">Eslatmalar</p>
                <p className="text-slate-200 text-sm whitespace-pre-line">{company.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Server Config */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Server size={16} className="text-slate-400" /> Server konfiguratsiyasi
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Frontend port', value: company.frontendPort },
            { label: 'Backend port', value: company.backendPort },
            { label: 'DB port', value: company.dbPort },
            { label: 'DB nomi', value: company.dbName },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-white font-mono text-sm">{value || '—'}</p>
            </div>
          ))}
        </div>

        {/* Access Links */}
        <h4 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Kirish havolalari</h4>
        <div className="space-y-2">
          {frontendUrl && (
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-500 w-20 shrink-0">Frontend</span>
              <a href={frontendUrl} target="_blank" rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 text-sm font-mono flex items-center gap-1 truncate">
                {frontendUrl} <ExternalLink size={12} />
              </a>
              <CopyButton text={frontendUrl} />
            </div>
          )}
          {backendUrl && (
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-500 w-20 shrink-0">Backend</span>
              <a href={backendUrl} target="_blank" rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 text-sm font-mono flex items-center gap-1 truncate">
                {backendUrl} <ExternalLink size={12} />
              </a>
              <CopyButton text={backendUrl} />
            </div>
          )}
          {frontendUrl && (
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-500 w-20 shrink-0">Admin</span>
              <a href={`${frontendUrl}/admin`} target="_blank" rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 text-sm font-mono flex items-center gap-1 truncate">
                {frontendUrl}/admin <ExternalLink size={12} />
              </a>
              <CopyButton text={`${frontendUrl}/admin`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Monitoring Tab ───────────────────────────────────────────────────────────
function MonitoringTab({ companyId }: { companyId: string }) {
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCompanyStats(companyId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [companyId]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Real-time monitoring</h3>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Yangilash
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Server Status */}
      {stats && (
        <>
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${
            stats.status === 'RUNNING'
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <Activity size={20} className={stats.status === 'RUNNING' ? 'text-green-400' : 'text-red-400'} />
            <div>
              <p className="text-white font-semibold">Server {stats.status === 'RUNNING' ? 'ishlayapti' : 'to\'xtatilgan'}</p>
              {stats.uptime && <p className="text-slate-400 text-sm">Uptime: {stats.uptime}</p>}
            </div>
            <span className={`ml-auto w-3 h-3 rounded-full ${
              stats.status === 'RUNNING' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <Cpu size={18} className="text-blue-400" />
                </div>
                <p className="text-slate-400 text-sm">CPU ishlatish</p>
              </div>
              <p className="text-4xl font-bold text-white">{stats.cpu}<span className="text-lg text-slate-400 ml-1">%</span></p>
              <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    stats.cpu > 80 ? 'bg-red-500' : stats.cpu > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(stats.cpu, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <MemoryStick size={18} className="text-purple-400" />
                </div>
                <p className="text-slate-400 text-sm">Xotira (RAM)</p>
              </div>
              <p className="text-4xl font-bold text-white">
                {stats.memoryMb > 1024
                  ? (stats.memoryMb / 1024).toFixed(1)
                  : stats.memoryMb}
                <span className="text-lg text-slate-400 ml-1">
                  {stats.memoryMb > 1024 ? 'GB' : 'MB'}
                </span>
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-teal-600/20 flex items-center justify-center">
                  <HardDrive size={18} className="text-teal-400" />
                </div>
                <p className="text-slate-400 text-sm">Disk</p>
              </div>
              <p className="text-4xl font-bold text-white">
                {stats.diskMb > 1024
                  ? (stats.diskMb / 1024).toFixed(1)
                  : stats.diskMb}
                <span className="text-lg text-slate-400 ml-1">
                  {stats.diskMb > 1024 ? 'GB' : 'MB'}
                </span>
              </p>
            </div>
          </div>
        </>
      )}

      {loading && !stats && (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────
function PaymentsTab({ company }: { company: Company }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    method: 'BANK' as 'CLICK' | 'PAYME' | 'BANK',
    amount: company.monthlyPrice,
    periodStart: '',
    periodEnd: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await getPayments(company.id);
      setPayments(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [company.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setPaymentLink('');
    try {
      if (form.method === 'CLICK') {
        const result = await createClickLink(company.id, form.amount);
        setPaymentLink(result.url);
      } else if (form.method === 'PAYME') {
        const result = await createPaymeLink(company.id, form.amount);
        setPaymentLink(result.url);
      } else {
        await createPayment(company.id, form);
        setShowModal(false);
        await fetchPayments();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paymentStatusStyle = {
    PAID: 'bg-green-500/20 text-green-400 border border-green-500/30',
    PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    FAILED: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">To'lovlar tarixi</h3>
        <button
          onClick={() => { setShowModal(true); setPaymentLink(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Yangi to'lov
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p>To'lovlar topilmadi</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Miqdor</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Usul</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Holat</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Davr</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Sana</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id} className={i < payments.length - 1 ? 'border-b border-slate-700/50' : ''}>
                  <td className="px-4 py-3 text-white font-medium">
                    {new Intl.NumberFormat('uz-UZ').format(p.amount)} UZS
                  </td>
                  <td className="px-4 py-3 text-slate-300">{p.method}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${paymentStatusStyle[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {p.periodStart ? `${new Date(p.periodStart).toLocaleDateString('uz-UZ')} – ${p.periodEnd ? new Date(p.periodEnd).toLocaleDateString('uz-UZ') : '?'}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(p.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Yangi to'lov</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">To'lov usuli</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CLICK', 'PAYME', 'BANK'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setForm(prev => ({ ...prev, method: m })); setPaymentLink(''); }}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                        form.method === m
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Miqdor (UZS)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(prev => ({ ...prev, amount: +e.target.value }))}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Davr boshi</label>
                  <input
                    type="date"
                    value={form.periodStart}
                    onChange={e => setForm(prev => ({ ...prev, periodStart: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Davr oxiri</label>
                  <input
                    type="date"
                    value={form.periodEnd}
                    onChange={e => setForm(prev => ({ ...prev, periodEnd: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {paymentLink && (
                <div className="bg-slate-800 border border-indigo-500/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2">To'lov havolasi yaratildi:</p>
                  <div className="flex items-center gap-2">
                    <a href={paymentLink} target="_blank" rel="noreferrer"
                      className="flex-1 text-indigo-400 text-xs font-mono truncate hover:text-indigo-300">
                      {paymentLink}
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-slate-400 hover:text-white transition-colors shrink-0"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition-all"
                >
                  Yopish
                </button>
                {!paymentLink && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yaratilmoqda...</>
                      : form.method === 'BANK' ? 'Saqlash' : "Havola olish"
                    }
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Danger Tab ───────────────────────────────────────────────────────────────
function DangerTab({ company, onUpdate }: { company: Company; onUpdate: () => void }) {
  const [deleteInput, setDeleteInput] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const navigate = useNavigate();

  const handleToggle = async () => {
    const action = company.status === 'ACTIVE' ? 'to\'xtatish' : 'faollashtirish';
    if (!confirm(`"${company.name}" ni ${action}ni tasdiqlaysizmi?`)) return;
    setActionLoading('toggle');
    try {
      if (company.status === 'ACTIVE') await suspendCompany(company.id);
      else await activateCompany(company.id);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== company.slug) return;
    if (!confirm(`"${company.name}" ni butunlay o'chirishni tasdiqlaysizmi?`)) return;
    setActionLoading('delete');
    try {
      await deleteCompany(company.id);
      navigate('/companies');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
      setActionLoading('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Suspend / Activate */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-white font-semibold mb-1">
          {company.status === 'ACTIVE' ? 'Korxonani to\'xtatish' : 'Korxonani faollashtirish'}
        </h4>
        <p className="text-slate-400 text-sm mb-4">
          {company.status === 'ACTIVE'
            ? 'Korxona serveri to\'xtatiladi va foydalanuvchilar kira olmaydi.'
            : 'Korxona serveri qayta ishga tushiriladi.'}
        </p>
        <button
          onClick={handleToggle}
          disabled={actionLoading === 'toggle'}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
            company.status === 'ACTIVE'
              ? 'bg-orange-600 hover:bg-orange-500 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {actionLoading === 'toggle'
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : company.status === 'ACTIVE' ? <Ban size={15} /> : <Play size={15} />
          }
          {company.status === 'ACTIVE' ? 'To\'xtatish' : 'Faollashtirish'}
        </button>
      </div>

      {/* Delete */}
      <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={16} className="text-red-400" />
          <h4 className="text-red-400 font-semibold">Korxonani o'chirish</h4>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Bu amalni ortga qaytarib bo'lmaydi. Barcha ma'lumotlar, serverlar va sozlamalar butunlay o'chiriladi.
          Tasdiqlash uchun korxona slugini kiriting: <span className="text-white font-mono">{company.slug}</span>
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            placeholder={company.slug}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition-colors w-56"
          />
          <button
            onClick={handleDelete}
            disabled={deleteInput !== company.slug || actionLoading === 'delete'}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
          >
            {actionLoading === 'delete'
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Trash2 size={15} />
            }
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  const fetchCompany = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await getCompany(id);
      setCompany(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompany(); }, [id]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Umumiy' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'payments', label: "To'lovlar" },
    { id: 'danger', label: 'Xavfli zona' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400">{error || 'Topilmadi'}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => navigate('/companies')}
          className="mt-1 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{company.name}</h1>
            <StatusBadge status={company.status} />
          </div>
          <p className="text-slate-400 text-sm mt-0.5 font-mono">{company.slug}</p>
        </div>
        <button
          onClick={fetchCompany}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            } ${t.id === 'danger' && tab !== 'danger' ? 'hover:text-red-400' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && <OverviewTab company={company} onUpdate={fetchCompany} />}
      {tab === 'monitoring' && <MonitoringTab companyId={company.id} />}
      {tab === 'payments' && <PaymentsTab company={company} />}
      {tab === 'danger' && <DangerTab company={company} onUpdate={fetchCompany} />}
    </div>
  );
}
