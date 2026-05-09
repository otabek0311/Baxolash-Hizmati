import { useEffect, useState } from 'react';
import {
  CreditCard, Search, RefreshCw, TrendingUp, Clock,
  Building2, Filter
} from 'lucide-react';
import { getCompanies, getPayments, type Company, type Payment } from '../services/api';

type StatusFilter = 'ALL' | 'PAID' | 'PENDING' | 'FAILED';
type MethodFilter = 'ALL' | 'CLICK' | 'PAYME' | 'BANK';

interface PaymentWithCompany extends Payment {
  companyName: string;
}

const paymentStatusStyle = {
  PAID: 'bg-green-500/20 text-green-400 border border-green-500/30',
  PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const methodStyle = {
  CLICK: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  PAYME: 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
  BANK: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

export default function PaymentsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const comps = await getCompanies();
      setCompanies(comps);

      const paymentArrays = await Promise.allSettled(
        comps.map(async c => {
          try {
            const payments = await getPayments(c.id);
            return payments.map(p => ({ ...p, companyName: c.name }));
          } catch {
            return [];
          }
        })
      );

      const allPays: PaymentWithCompany[] = [];
      paymentArrays.forEach(result => {
        if (result.status === 'fulfilled') {
          allPays.push(...result.value);
        }
      });

      allPays.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllPayments(allPays);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = allPayments.filter(p => {
    const matchSearch = p.companyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchMethod = methodFilter === 'ALL' || p.method === methodFilter;
    const matchCompany = companyFilter === 'ALL' || p.companyId === companyFilter;
    return matchSearch && matchStatus && matchMethod && matchCompany;
  });

  const now = new Date();
  const thisMonthPaid = allPayments.filter(p => {
    const d = new Date(p.createdAt);
    return p.status === 'PAID' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + p.amount, 0);

  const pendingTotal = allPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';
  const formatDate = (d: string) => new Date(d).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">To'lovlar</h1>
          <p className="text-slate-400 text-sm mt-0.5">Barcha korxonalar bo'yicha to'lovlar</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
        >
          <RefreshCw size={15} />
          Yangilash
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Ushbu oy yig'ildi</p>
              <p className="text-2xl font-bold text-white mt-1">{formatPrice(thisMonthPaid)}</p>
              <p className="text-slate-500 text-xs mt-1">To'langan to'lovlar</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Kutilayotgan</p>
              <p className="text-2xl font-bold text-white mt-1">{formatPrice(pendingTotal)}</p>
              <p className="text-slate-500 text-xs mt-1">
                {allPayments.filter(p => p.status === 'PENDING').length} ta to'lov
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-600 flex items-center justify-center">
              <Clock size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Jami to'lovlar</p>
              <p className="text-2xl font-bold text-white mt-1">{allPayments.length}</p>
              <p className="text-slate-500 text-xs mt-1">Barcha vaqt</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Korxona nomi bo'yicha qidirish..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Company filter */}
        <div className="relative">
          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
          >
            <option value="ALL">Barcha korxonalar</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
          >
            <option value="ALL">Barcha holat</option>
            <option value="PAID">To'langan</option>
            <option value="PENDING">Kutilmoqda</option>
            <option value="FAILED">Muvaffaqiyatsiz</option>
          </select>
        </div>

        {/* Method filter */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
          {(['ALL', 'CLICK', 'PAYME', 'BANK'] as MethodFilter[]).map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                methodFilter === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'ALL' ? 'Barchasi' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <CreditCard size={48} className="mb-3 opacity-30" />
          <p className="font-medium">To'lovlar topilmadi</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Korxona</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Miqdor</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Usul</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Holat</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Davr</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Sana</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment, i) => (
                <tr
                  key={payment.id}
                  className={`hover:bg-slate-700/30 transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-700/50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{payment.companyName}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-semibold">
                    {formatPrice(payment.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${methodStyle[payment.method]}`}>
                      {payment.method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusStyle[payment.status]}`}>
                      {payment.status === 'PAID' ? 'To\'langan' : payment.status === 'PENDING' ? 'Kutilmoqda' : 'Muvaffaqiyatsiz'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {payment.periodStart
                      ? `${formatDate(payment.periodStart)} – ${payment.periodEnd ? formatDate(payment.periodEnd) : '?'}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {formatDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
            <p className="text-slate-500 text-xs">{filtered.length} ta to'lov ko'rsatilmoqda</p>
            {filtered.filter(p => p.status === 'PAID').length > 0 && (
              <p className="text-slate-400 text-xs">
                Jami to'langan:{' '}
                <span className="text-white font-semibold">
                  {formatPrice(filtered.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0))}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
