import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, CheckCircle, XCircle, DollarSign,
  AlertTriangle, Clock, ArrowRight, ExternalLink,
  RefreshCw, TrendingUp
} from 'lucide-react';
import { getCompanies, createClickLink, createPaymeLink, type Company } from '../services/api';

function StatusBadge({ status }: { status: Company['status'] }) {
  const styles = {
    ACTIVE: 'bg-green-500/20 text-green-400 border border-green-500/30',
    PROVISIONING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    SUSPENDED: 'bg-red-500/20 text-red-400 border border-red-500/30',
    TERMINATED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function ServerBadge({ status }: { status?: 'RUNNING' | 'STOPPED' }) {
  if (!status) return <span className="text-slate-600 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status === 'RUNNING' ? 'text-green-400' : 'text-red-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'RUNNING' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      {status}
    </span>
  );
}

function StatCard({
  title, value, icon: Icon, color, subtitle
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkLoading, setLinkLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeCompanies = companies.filter(c => c.status === 'ACTIVE');
  const suspendedCompanies = companies.filter(c => c.status === 'SUSPENDED');
  const monthlyRevenue = activeCompanies.reduce((sum, c) => sum + (c.monthlyPrice || 0), 0);
  const alertCompanies = companies.filter(c => (c.daysUntilExpiry ?? 999) <= 7);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysColor = (days?: number) => {
    if (days === undefined) return 'text-slate-400';
    if (days <= 7) return 'text-red-400';
    if (days <= 14) return 'text-orange-400';
    return 'text-green-400';
  };

  const handleCreateLink = async (company: Company, method: 'click' | 'payme') => {
    setLinkLoading(`${company.id}-${method}`);
    try {
      const fn = method === 'click' ? createClickLink : createPaymeLink;
      const result = await fn(company.id, company.monthlyPrice);
      window.open(result.url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setLinkLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Tizim umumiy holati</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition-all text-sm"
        >
          <RefreshCw size={15} />
          Yangilash
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Jami korxonalar"
          value={companies.length}
          icon={Building2}
          color="bg-indigo-600"
        />
        <StatCard
          title="Faol korxonalar"
          value={activeCompanies.length}
          icon={CheckCircle}
          color="bg-green-600"
        />
        <StatCard
          title="To'xtatilgan"
          value={suspendedCompanies.length}
          icon={XCircle}
          color="bg-red-600"
        />
        <StatCard
          title="Oylik daromad"
          value={formatPrice(monthlyRevenue)}
          icon={TrendingUp}
          color="bg-purple-600"
          subtitle="Faol korxonalardan"
        />
      </div>

      {/* Payment Alerts */}
      {alertCompanies.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-orange-400" />
            <h2 className="text-lg font-semibold text-white">To'lov eslatmalari</h2>
            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs px-2 py-0.5 rounded-full">
              {alertCompanies.length} ta
            </span>
          </div>
          <div className="grid gap-3">
            {alertCompanies.map(company => {
              const days = company.daysUntilExpiry ?? 0;
              const isUrgent = days <= 3;
              return (
                <div
                  key={company.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    isUrgent
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-orange-500/10 border-orange-500/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isUrgent ? 'bg-red-500/20' : 'bg-orange-500/20'
                  }`}>
                    <Clock size={20} className={isUrgent ? 'text-red-400' : 'text-orange-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold truncate">{company.name}</p>
                      <StatusBadge status={company.status} />
                    </div>
                    <p className={`text-sm ${isUrgent ? 'text-red-400' : 'text-orange-400'}`}>
                      {days === 0 ? 'Bugun muddati tugaydi!' : `${days} kun qoldi`}
                      {' · '}
                      <span className="text-slate-300">{formatPrice(company.monthlyPrice)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCreateLink(company, 'click')}
                      disabled={linkLoading === `${company.id}-click`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    >
                      <DollarSign size={13} />
                      Click
                    </button>
                    <button
                      onClick={() => handleCreateLink(company, 'payme')}
                      disabled={linkLoading === `${company.id}-payme`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600/20 border border-teal-500/30 text-teal-400 hover:bg-teal-600/30 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    >
                      <DollarSign size={13} />
                      Payme
                    </button>
                    <button
                      onClick={() => navigate(`/companies/${company.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 border border-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all"
                    >
                      <ExternalLink size={13} />
                      Ko'rish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Companies Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Korxonalar holati</h2>
          <button
            onClick={() => navigate('/companies')}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            Barchasi <ArrowRight size={15} />
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Korxona</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Holat</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Oylik narx</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Keyingi to'lov</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Server</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Korxonalar topilmadi
                  </td>
                </tr>
              ) : (
                companies.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-700/40 transition-colors ${
                      i < companies.length - 1 ? 'border-b border-slate-700/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{c.name}</p>
                        <p className="text-slate-500 text-xs">{c.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatPrice(c.monthlyPrice)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-300">{formatDate(c.nextPaymentDue)}</p>
                        {c.daysUntilExpiry !== undefined && (
                          <p className={`text-xs ${getDaysColor(c.daysUntilExpiry)}`}>
                            {c.daysUntilExpiry} kun
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ServerBadge status={c.serverStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/companies/${c.id}`)}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
