import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, User, Calendar, Hash, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? '/api' : `http://${window.location.hostname}:5000/api`);
const API_BASE = BASE_URL.replace('/api', '');

interface QRResult {
  valid: boolean;
  type: 'document' | 'page';
  document: {
    id?: string;
    name: string;
    page?: number;
    totalPages?: number;
    uploadedBy: string;
    expiresAt: string;
    pages?: { pageNumber: number; qrUrl: string }[];
  };
}

export const QRLandingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<QRResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError('Token topilmadi'); setLoading(false); return; }

    fetch(`${API_BASE}/api/qr/${token}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Xato yuz berdi');
        setResult(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const daysLeft = result
    ? Math.ceil((new Date(result.document.expiresAt).getTime() - Date.now()) / 86400000)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Hujjat tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-sm border border-red-100 text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Hujjat topilmadi</h2>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
          <p className="text-xs text-gray-400">
            QR kod muddati o'tgan yoki hujjat o'chirilgan bo'lishi mumkin.
          </p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isExpired = daysLeft <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 max-w-sm w-full overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">
                QR Hujjat Tizimi
              </p>
              <p className="text-sm font-black">
                {result.type === 'page' ? `${result.document.page}-bet` : 'To\'liq hujjat'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">

          {/* Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black ${
            isExpired
              ? 'bg-red-50 text-red-600'
              : daysLeft <= 7
              ? 'bg-amber-50 text-amber-600'
              : 'bg-green-50 text-green-600'
          }`}>
            <CheckCircle className="w-3.5 h-3.5" />
            {isExpired ? 'Muddati o\'tgan' : daysLeft <= 7 ? `${daysLeft} kun qoldi` : 'Hujjat asl nusxa'}
          </div>

          {/* Document info */}
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hujjat nomi</p>
                  <p className="text-sm font-bold text-gray-900 leading-snug">{result.document.name}</p>
                </div>
              </div>

              {result.type === 'page' && result.document.page && (
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bet raqami</p>
                    <p className="text-sm font-bold text-gray-900">{result.document.page}-bet</p>
                  </div>
                </div>
              )}

              {result.type === 'document' && result.document.totalPages && (
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sahifalar soni</p>
                    <p className="text-sm font-bold text-gray-900">{result.document.totalPages} ta bet</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Yuklagan</p>
                  <p className="text-sm font-bold text-gray-900">{result.document.uploadedBy}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Muddati</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(result.document.expiresAt).toLocaleDateString('uz-UZ', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pages grid for full document */}
          {result.type === 'document' && result.document.pages && result.document.pages.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Barcha betlar</p>
              <div className="grid grid-cols-6 gap-1.5">
                {result.document.pages.map(p => (
                  <div
                    key={p.pageNumber}
                    className="aspect-square bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center"
                  >
                    <span className="text-[9px] font-black text-gray-500">{p.pageNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Login hint */}
          <div className="pt-2 border-t border-gray-50">
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Hujjatni yuklab olish uchun tizimga kiring
            </p>
            <a
              href="/"
              className="mt-2 block w-full bg-blue-600 text-white text-center py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors"
            >
              Tizimga kirish
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 text-center">
          <p className="text-[9px] text-gray-300 font-medium">© 2026 QR Hujjat Tizimi</p>
        </div>
      </div>
    </div>
  );
};
