import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Config from '../pages/Config';
import AppNavbar from '../components/Navbar';
import Dashboard from '../pages/Dashboard';
import './styles/global.css';

function App(){
  return(
    <Router>
      {window.location.pathname !== '/' && <AppNavbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/config" element={<Config />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;