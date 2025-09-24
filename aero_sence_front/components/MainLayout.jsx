// aero_sence_front/components/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AppNavbar from './Navbar';

const MainLayout = () => {
  return (
    <>
      <AppNavbar />
      <main style={{ paddingTop: '70px' }}> {/* Adiciona espaço para a navbar fixa */}
        <Outlet /> {/* As rotas aninhadas serão renderizadas aqui */}
      </main>
    </>
  );
};

export default MainLayout;