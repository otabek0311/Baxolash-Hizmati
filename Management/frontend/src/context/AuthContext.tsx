import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  login as apiLogin,
  setToken,
  removeToken,
  type Admin,
} from '../services/api';

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('mgmt_token');
    const storedAdmin = localStorage.getItem('mgmt_admin');
    if (storedToken && storedAdmin) {
      try {
        setTokenState(storedToken);
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        localStorage.removeItem('mgmt_token');
        localStorage.removeItem('mgmt_admin');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setToken(result.token);
    localStorage.setItem('mgmt_admin', JSON.stringify(result.admin));
    setTokenState(result.token);
    setAdmin(result.admin);
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem('mgmt_admin');
    setTokenState(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
