import React, { useState } from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { House, Grid3x3Gap, Gear, ClockHistory, PersonCircle } from 'react-bootstrap-icons';
import lgHorizontal from '../src/assets/lg_horizontal.png';

const CustomNavbar = ({ onToggleSidebar, currentPage, setCurrentPage, userName = "Usuário" }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLinkClick = (linkName) => {
    setCurrentPage(linkName);
    if (linkName === 'configuracoes') {
      window.location.assign('/Config');
    }
    if (linkName === 'dashboard') {
      window.location.assign('/Dashboard');
    }
    if (linkName === 'historico') {
      window.location.assign('/Historico');
    }
  };

  const handleLogout = () => {
    window.location.href = '/Login';
  };

  return (
    <Navbar 
      expand="lg" 
      className="custom-navbar shadow-sm"
      fixed="top"
      style={{
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      <Container fluid className="px-4">
        {/* Logo */}
        <Navbar.Brand 
          href="#home" 
          className="d-flex align-items-center"
        >
          <img 
            src={lgHorizontal} 
            alt="Logo da Aplicação"
            className="navbar-logo"
            style={{
              height: '40px',
              width: 'auto',
              maxWidth: '200px',
              objectFit: 'contain'
            }}
          />
        </Navbar.Brand>

        {/* Toggle button para mobile e para abrir sidebar */}
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav"
          onClick={onToggleSidebar}
          style={{
            border: 'none',
            padding: '4px 8px'
          }}
        >
          <span style={{
            display: 'block',
            width: '22px',
            height: '2px',
            backgroundColor: '#495057',
            margin: '4px 0',
            transition: '0.3s'
          }}></span>
          <span style={{
            display: 'block',
            width: '22px',
            height: '2px',
            backgroundColor: '#495057',
            margin: '4px 0',
            transition: '0.3s'
          }}></span>
          <span style={{
            display: 'block',
            width: '22px',
            height: '2px',
            backgroundColor: '#495057',
            margin: '4px 0',
            transition: '0.3s'
          }}></span>
        </Navbar.Toggle>

        {/* Links de navegação */}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link
              href="#dashboard"
              className={`nav-link-custom ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={e => { e.preventDefault(); handleLinkClick('dashboard'); }}
              style={{
                color: currentPage === 'dashboard' ? '#0d6efd' : '#6c757d',
                fontWeight: '500',
                padding: '8px 16px',
                margin: '0 4px',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                backgroundColor: currentPage === 'dashboard' ? '#e7f3ff' : 'transparent'
              }}
            >
              <Grid3x3Gap className="me-2" size={16} />
              Dashboard
            </Nav.Link>

            <Nav.Link
              href="#historico"
              className={`nav-link-custom ${currentPage === 'historico' ? 'active' : ''}`}
              onClick={e => { e.preventDefault(); handleLinkClick('historico'); }}
              style={{
                color: currentPage === 'historico' ? '#0d6efd' : '#6c757d',
                fontWeight: '500',
                padding: '8px 16px',
                margin: '0 4px',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                backgroundColor: currentPage === 'historico' ? '#e7f3ff' : 'transparent'
              }}
            >
              <ClockHistory className="me-2" size={16} />
              Histórico
            </Nav.Link>

            <Nav.Link
              href="#configuracoes"
              className={`nav-link-custom ${currentPage === 'configuracoes' ? 'active' : ''}`}
              onClick={e => { e.preventDefault(); handleLinkClick('configuracoes'); }}
              style={{
                color: currentPage === 'configuracoes' ? '#0d6efd' : '#6c757d',
                fontWeight: '500',
                padding: '8px 16px',
                margin: '0 4px',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                backgroundColor: currentPage === 'configuracoes' ? '#e7f3ff' : 'transparent'
              }}
            >
              <Gear className="me-2" size={16} />
              Configurações
            </Nav.Link>

            {/* Usuário Dropdown */}
            <Dropdown align="end" show={showUserMenu} onToggle={setShowUserMenu} className="ms-2">
              <Dropdown.Toggle
                variant="link"
                id="dropdown-user"
                className="d-flex align-items-center p-0 border-0 bg-transparent shadow-none"
                style={{ textDecoration: 'none', color: '#495057', fontWeight: 500 }}
              >
                <PersonCircle size={22} className="me-2" />
                <span className="d-none d-md-inline">Olá, {userName}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleLogout}>Sair</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>

      {/* CSS customizado inline para efeitos hover */}
      <style jsx>{`
        .nav-link-custom:hover {
          color: #0d6efd !important;
          background-color: #f0f8ff !important;
          transform: translateY(-1px);
        }
        
        .custom-navbar {
          min-height: 70px;
        }
        
        .navbar-logo {
          transition: all 0.3s ease;
          filter: brightness(1);
        }
        
        .navbar-brand:hover .navbar-logo {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
        
        @media (max-width: 991.98px) {
          .navbar-collapse {
            background-color: #ffffff;
            border-radius: 8px;
            margin-top: 10px;
            padding: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .navbar-logo {
            height: 35px !important;
            max-width: 180px !important;
          }
        }
        
        @media (max-width: 575.98px) {
          .navbar-logo {
            height: 30px !important;
            max-width: 150px !important;
          }
        }
        
        .navbar-toggler:focus {
          box-shadow: none;
        }
        
        .navbar-brand:hover {
          transform: none;
        }
      `}</style>
    </Navbar>
  );
};

export default CustomNavbar;

