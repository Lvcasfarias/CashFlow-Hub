import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CaixinhasPage } from './pages/CaixinhasPage';
import { TransacoesPage } from './pages/TransacoesPage';
import { RecorrenciasPage } from './pages/RecorrenciasPage';
import { DividasPage } from './pages/DividasPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
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
              path="/wishlist"
              element={
                <PrivateRoute>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Wishlist</h1>
                    <p className="text-muted-foreground mt-2">Em desenvolvimento</p>
                  </div>
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
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
