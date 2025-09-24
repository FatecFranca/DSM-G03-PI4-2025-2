// aero_sence_front/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import EsqueciSenha from '../pages/EsqueciSenha';
import Config from '../pages/Config';
import Dashboard from '../pages/Dashboard';
import Historico from '../pages/Historico';
import MainLayout from '../components/MainLayout';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />

          {/* Rotas privadas */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/config" element={<Config />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;