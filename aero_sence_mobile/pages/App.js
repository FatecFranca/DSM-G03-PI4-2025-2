// teste

import React, { useState } from 'react';
import CadastroScreen from '../CadastroScreen';
import LoginScreen from 'LoginScreen';
import DashboardScreen from './DashboardScreen';
import HistoricoScreen from './HistoricoScreen';
import ConfiguracoesScreen from './ConfiguracoesScreen';

export default function App() {
  const [tela, setTela] = useState('login');

  if (tela === 'login') {
    return <LoginScreen onCadastro={() => setTela('cadastro')} onEntrar={() => setTela('dashboard')} />;
  }
  if (tela === 'cadastro') {
    return <CadastroScreen onLogin={() => setTela('login')} />;
  }
  if (tela === 'dashboard') {
    return <DashboardScreen onHistorico={() => setTela('historico')} onConfiguracoes={() => setTela('configuracoes')} />;
  }
  if (tela === 'historico') {
    return <HistoricoScreen onDashboard={() => setTela('dashboard')} onConfiguracoes={() => setTela('configuracoes')} />;
  }
  if (tela === 'configuracoes') {
    return <ConfiguracoesScreen onDashboard={() => setTela('dashboard')} onHistorico={() => setTela('historico')} />;
  }
  return null;
}
