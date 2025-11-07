import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import CadastroScreen from './CadastroScreen';
import LoginScreen from './LoginScreen'; 
import DashboardScreen from './DashboardScreen';
import HistoricoScreen from './HistoricoScreen';
import ConfiguracoesScreen from './ConfiguracoesScreen';
import EsqueciSenhaScreen from './EsqueciSenhaScreen';

export default function App() {
  const [tela, setTela] = useState('login');

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Esconde a barra de navegação no Android
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  // Re-esconde os botões quando a tela muda
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
    }
  }, [tela]);

  if (tela === 'login') {
    return <LoginScreen 
      onCadastro={() => {
        console.log('Mudando para tela de cadastro');
        setTela('cadastro');
      }} 
      onEntrar={() => setTela('dashboard')}
      onEsqueciSenha={() => setTela('esqueciSenha')}
    />;
  }
  if (tela === 'cadastro') {
    return <CadastroScreen onLogin={() => setTela('login')} />;
  }
  if (tela === 'esqueciSenha') {
    return <EsqueciSenhaScreen onVoltar={() => setTela('login')} />;
  }
  if (tela === 'dashboard') {
    return <DashboardScreen 
      onHistorico={() => setTela('historico')} 
      onConfiguracoes={() => setTela('configuracoes')}
      onSair={() => setTela('login')}
    />;
  }
  if (tela === 'historico') {
    return <HistoricoScreen onDashboard={() => setTela('dashboard')} onConfiguracoes={() => setTela('configuracoes')} />;
  }
  if (tela === 'configuracoes') {
    return <ConfiguracoesScreen onDashboard={() => setTela('dashboard')} onHistorico={() => setTela('historico')} />;
  }
  return null;
}
