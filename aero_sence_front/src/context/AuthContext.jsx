import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Ao montar, se existir um token no localStorage, configura o header
  // e tenta recuperar o perfil do utilizador para restaurar o estado.
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    (async () => {
      try {
        const res = await api.get('/user/profile');
        if (res && res.data) setUser(res.data);
      } catch (err) {
        console.error('Falha ao restaurar sessão:', err);
        // Token inválido ou expirado — remover
        localStorage.removeItem('authToken');
        delete api.defaults.headers.common['Authorization'];
      }
    })();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('authToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    navigate('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
    navigate('/');
  };

  // --- NOVA FUNÇÃO ADICIONADA ---
  // Esta função irá permitir que outras partes da aplicação atualizem o estado do utilizador
  const updateUser = (newUserData) => {
    setUser(prevUser => ({ ...prevUser, ...newUserData }));
  };


  const value = { user, login, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};