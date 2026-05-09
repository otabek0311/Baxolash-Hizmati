import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Building2, Server, Calendar,
  ChevronRight, Ban, Play, RefreshCw
} from 'lucide-react';
import {
  getCompanies, suspendCompany, activateCompany,
  type Company
} from '../services/api';

type FilterStatus = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING' | 'TERMINATED';

function StatusBadge({ status }: { status: Company['status'] }) {
  const styles = {
    ACTIVE: 'bg-green-500/20 text-green-400 border border-green-500/30',
    PROVISIONING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    SUSPENDED: 'bg-red-500/20 text-red-400 border border-red-500/30',
    TERMINATED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'ACTIVE' ? 'bg-green-400 animate-pulse' :
        status === 'PROVISIONING' ? 'bg-yellow-400 animate-pulse' :
        status === 'SUSPENDED' ? 'bg-red-400' : 'bg-slate-400'
      }`} />
      {status}
    </span>
  );
}

function getDaysColor(days?: number) {
  if (days === undefined) return 'text-slate-500';
  if (days <= 7) return 'text-red-400';
  if (days <= 14) return 'text-orange-400';
  return 'text-green-400';
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = companies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const handleToggleStatus = async (company: Company) => {
    if (!confirm(
      company.status === 'ACTIVE'
        ? `"${company.name}" ni to'xtatishni tasdiqlaysizmi?`
        : `"${company.name}" ni faollashtirmoqchimisiz?`
    )) return;
    setActionLoading(company.id);
    try {
      if (company.status === 'ACTIVE') {
        await suspendCompany(company.id);
      } else {
        await activateCompany(company.id);
      }
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';
  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'Barchasi', value: 'ALL' },
    { label: 'Faol', value: 'ACTIVE' },
    { label: 'To\'xtatilgan', value: 'SUSPENDED' },
    { label: 'Sozlanmoqda', value: 'PROVISIONING' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Korxonalar</h1>
          <p className="text-slate-400 text-sm mt-0.5">{companies.length} ta korxona ro'yxatda</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => navigate('/companies/new')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Yangi korxona
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Korxona nomi yoki slug bo'yicha qidirish..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                filter === btn.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Building2 size={48} className="mb-3 opacity-30" />
          <p className="font-medium">Korxona topilmadi</p>
          <p className="text-sm mt-1">Qidiruv yoki filtrni o'zgartiring</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(company => (
            <div
              key={company.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all group"
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{company.name}</h3>
                  <p className="text-slate-500 text-xs font-mono mt-0.5">{company.slug}</p>
                </div>
                <StatusBadge status={company.status} />
              </div>

              {/* Server ports */}
              {(company.frontendPort || company.backendPort) && (
                <div className="flex items-center gap-2 mb-3">
                  <Server size={13} className="text-slate-500 shrink-0" />
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {company.frontendPort && (
                      <span className="bg-slate-700 px-1.5 py-0.5 rounded font-mono">:{company.frontendPort}</span>
                    )}
                    {company.backendPort && (
                      <span className="bg-slate-700 px-1.5 py-0.5 rounded font-mono">:{company.backendPort}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between py-3 border-t border-slate-700">
                <div>
                  <p className="text-xs text-slate-500">Oylik to'lov</p>
                  <p className="text-white font-semibold">{formatPrice(company.monthlyPrice)}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Calendar size={12} className="text-slate-500" />
                    <p className="text-xs text-slate-500">Keyingi to'lov</p>
                  </div>
                  <p className={`text-sm font-medium ${getDaysColor(company.daysUntilExpiry)}`}>
                    {company.nextPaymentDue ? formatDate(company.nextPaymentDue) : '—'}
                  </p>
                  {company.daysUntilExpiry !== undefined && (
                    <p className={`text-xs ${getDaysColor(company.daysUntilExpiry)}`}>
                      {company.daysUntilExpiry} kun qoldi
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                <button
                  onClick={() => handleToggleStatus(company)}
                  disabled={actionLoading === company.id || company.status === 'PROVISIONING'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                    company.status === 'ACTIVE'
                      ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                      : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'
                  }`}
                >
                  {actionLoading === company.id ? (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : company.status === 'ACTIVE' ? (
                    <><Ban size={13} /> To'xtatish</>
                  ) : (
                    <><Play size={13} /> Faollashtirish</>
                  )}
                </button>
                <button
                  onClick={() => navigate(`/companies/${company.id}`)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 rounded-lg text-xs font-medium transition-all"
                >
                  Ko'rish <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
