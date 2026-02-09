import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Home, Wallet, ArrowLeftRight, Calendar, Heart, BarChart3, LogOut, Moon, Sun, TrendingDown } from 'lucide-react';
import { Button } from './ui/button';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/caixinhas', icon: Wallet, label: 'Caixinhas' },
    { path: '/transacoes', icon: ArrowLeftRight, label: 'Transações' },
    { path: '/recorrencias', icon: Calendar, label: 'Recorrências' },
    { path: '/dividas', icon: TrendingDown, label: 'Dívidas' },
    { path: '/wishlist', icon: Heart, label: 'Wishlist' },
    { path: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:flex md:flex-col w-64 border-r border-border/40 bg-card/50 backdrop-blur-xl">
        <div className="p-6 border-b border-border/40">
          <h1 className="text-2xl font-bold tracking-tight">CashFlow Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/40 space-y-2">
          <Button
            variant="ghost"
            data-testid="theme-toggle-btn"
            onClick={toggleTheme}
            className="w-full justify-start"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </Button>
          <Button
            variant="ghost"
            data-testid="logout-btn"
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/40 bg-background/90 backdrop-blur-lg z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
