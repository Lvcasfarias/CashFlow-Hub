import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BalanceProvider } from './context/BalanceContext';
import { Toaster } from './components/ui/sonner';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CaixinhasPage } from './pages/CaixinhasPage';
import { TransacoesPage } from './pages/TransacoesPage';
import { RecorrenciasPage } from './pages/RecorrenciasPage';
import { DividasPage } from './pages/DividasPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { CartoesPage } from './pages/CartoesPage';
import { MetasPage } from './pages/MetasPage';
import { WishlistPage } from './pages/WishlistPage';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/caixinhas"
        element={
          <PrivateRoute>
            <CaixinhasPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/transacoes"
        element={
          <PrivateRoute>
            <TransacoesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/recorrencias"
        element={
          <PrivateRoute>
            <RecorrenciasPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/dividas"
        element={
          <PrivateRoute>
            <DividasPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/cartoes"
        element={
          <PrivateRoute>
            <CartoesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/metas"
        element={
          <PrivateRoute>
            <MetasPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/wishlist"
        element={
          <PrivateRoute>
            <WishlistPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <PrivateRoute>
            <RelatoriosPage />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BalanceProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </BalanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
