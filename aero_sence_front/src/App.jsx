import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Config from '../pages/Config';
import AppNavbar from '../components/Navbar';
import './styles/global.css';

function App(){
  return(
    <Router>
      {/* Exibe a Navbar em todas as páginas, exceto na tela de login */}
      {window.location.pathname !== '/' && <AppNavbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/config" element={<Config />} />
      </Routes>
    </Router>
  );
};

export default App; 