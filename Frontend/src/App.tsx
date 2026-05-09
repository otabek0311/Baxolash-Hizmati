import React, { useState, useEffect, useRef, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/Upload';
import { HowItWorks } from './pages/HowItWorks';
import { Documents, Archive, Settings } from './pages/OtherPages';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/Login';
import { QRLandingPage } from './pages/QRLandingPage';
import { Search, HelpCircle, QrCode, LogOut } from 'lucide-react';
import { QRScanner } from './components/QRScanner';
import { AIChatBot } from './components/AIChatBot';
import { SearchModal } from './components/SearchModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { api } from './services/api';
import { useLang } from './context/LanguageContext';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Xatolik yuz berdi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
            >
              Sahifani yangilash
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [isScannerOpen, setIsScannerOpen]   = useState(false);
  const [qrResult, setQrResult]             = useState<any>(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [shortcutsOpen, setShortcutsOpen]   = useState(false);

  // G-chord refs (avoid stale closures)
  const gMode  = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only register shortcuts on devices with a fine pointer (keyboard present)
    if (!window.matchMedia('(any-pointer: fine)').matches) return;

    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    };

    const handler = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K — works even in inputs
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(s => !s);
        return;
      }

      // All other shortcuts skip when user is typing
      if (isTyping() || e.ctrlKey || e.metaKey || e.altKey) return;

      // G-chord: second key
      if (gMode.current) {
        gMode.current = false;
        if (gTimer.current) clearTimeout(gTimer.current);
        switch (e.key.toLowerCase()) {
          case 'h': navigate('/');             break;
          case 'd': navigate('/documents');    break;
          case 'u': navigate('/upload');       break;
          case 's': navigate('/settings');     break;
          case 'x': navigate('/users');        break;
          case '?': navigate('/how-it-works'); break;
        }
        return;
      }

      switch (e.key) {
        case 'g':
        case 'G':
          gMode.current = true;
          gTimer.current = setTimeout(() => { gMode.current = false; }, 1000);
          break;
        case '/':
          e.preventDefault();
          setSearchOpen(true);
          break;
        case 'q':
        case 'Q':
          setIsScannerOpen(true);
          break;
        case 'n':
        case 'N':
          navigate('/upload');
          break;
        case 'm':
        case 'M':
          setSidebarOpen(s => !s);
          break;
        case '?':
          setShortcutsOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (gTimer.current) clearTimeout(gTimer.current);
    };
  }, [navigate]);

  const handleScanSuccess = async (scanned: string) => {
    // QR kod to'liq URL bo'lishi mumkin: http://IP:5000/api/qr/TOKEN/view
    const token = scanned.includes('/api/qr/')
      ? scanned.split('/api/qr/')[1].replace('/view', '')
      : scanned;
    try {
      const result = await api.scanQR(token);
      setQrResult(result);
      setIsScannerOpen(false);
    } catch (err: any) {
      const msg = err.message === 'Failed to fetch'
        ? 'Server bilan aloqa yo\'q. Backend ishlaayotganini tekshiring.'
        : err.message || 'QR kod yaroqsiz';
      alert(msg);
      setIsScannerOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] dark:bg-gray-900 text-[#1F2937] dark:text-white font-sans overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
      />

      {isScannerOpen && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {qrResult && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">{t('qr.result')}</h3>

            {qrResult.type === 'document' ? (
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t('qr.fullDoc')}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{qrResult.document?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{qrResult.document?.uploadedBy} • {qrResult.document?.totalPages} bet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Muddati: {new Date(qrResult.document?.expiresAt).toLocaleDateString('uz-UZ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{t('qr.allPages')}</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {qrResult.document?.pages?.map((p: any) => (
                      <div key={p.pageNumber} className="aspect-square bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl flex items-center justify-center">
                        <span className="text-[10px] font-black text-gray-500 dark:text-gray-400">{p.pageNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-100 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">{qrResult.document?.page}-bet</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{qrResult.document?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{qrResult.document?.uploadedBy} {t('qr.uploadedBy')}</p>
              </div>
            )}

            <div className="flex gap-3">
              {qrResult.downloadUrl && (
                <button
                  onClick={() => api.downloadDocument(qrResult.document?.id, qrResult.document?.name)}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                >
                  {t('common.download')}
                </button>
              )}
              <button
                onClick={() => setQrResult(null)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <AIChatBot />
      <SearchModal   open={searchOpen}    onClose={() => setSearchOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between sticky top-0 z-30">
          {/* Search trigger — md+ */}
          <div className="hidden md:flex items-center flex-1 max-w-xl pl-28">
            <button
              onClick={() => setSearchOpen(true)}
              className="relative group flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-100 dark:border-gray-600 hover:border-gray-200 dark:hover:border-gray-500 rounded-lg py-1.5 px-3 transition-all text-left"
            >
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 dark:text-gray-400 font-medium flex-1">{t('search.placeholder')}</span>
              <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-gray-300 dark:text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md">
                Ctrl K
              </kbd>
            </button>
          </div>
          {/* Mobile: spacer for menu button */}
          <div className="md:hidden w-28 flex-shrink-0" />

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all"
              title="QR Skaner (Q)"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShortcutsOpen(true)}
              className="hidden md:flex p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
              title="Tezkor tugmalar (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold text-gray-900 dark:text-white leading-none">{user?.name}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-all"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/"            element={<Dashboard />} />
              <Route path="/documents"   element={<Documents />} />
              <Route path="/upload"      element={<UploadPage />} />
              <Route path="/archive"     element={<Archive />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/users"       element={
                (user?.role === 'SUPERADMIN' || user?.role === 'ADMIN')
                  ? <UsersPage />
                  : <Navigate to="/" replace />
              } />
              <Route path="/settings"    element={<Settings />} />
            </Routes>
          </div>
          <footer className="mt-20 pt-8 border-t border-gray-100 dark:border-gray-700 text-center pb-12 max-w-7xl mx-auto">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{t('common.copyright')}</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <AppLayout /> : <LoginPage />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/qr/:token" element={<QRLandingPage />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
