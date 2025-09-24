import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Cria o Contexto
const AuthContext = createContext(null);

// 2. Cria o Provedor do Contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({ name: 'Usuário Exemplo' });
  const navigate = useNavigate();

  // Função de login (a ser chamada na tela de Login)
  const login = (userData) => {
    setUser(userData);
    navigate('/dashboard');
  };
  
  // Função de logout
  const logout = () => {
    // Limpa os dados do usuário
    setUser(null);
    navigate('/'); // Redireciona para a tela de login
  };

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Cria um hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  return useContext(AuthContext);
};