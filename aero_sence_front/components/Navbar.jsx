// aero_sence_front/components/Navbar.jsx
import React from 'react';
import { Navbar, Nav, Container, Dropdown, NavItem } from 'react-bootstrap';
import { Grid3x3Gap, ClockHistory, PersonCircle, BoxArrowRight, WrenchAdjustable } from 'react-bootstrap-icons';
import lgHorizontal from '../src/assets/lg_horizontal.png';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';

const CustomNavbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageName = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/historico':
        return 'Histórico';
      case '/config':
        return 'Configurações';
      default:
        return '';
    }
  };

  const currentPage = getPageName(location.pathname);

  return (
    <Navbar expand="lg" className="shadow-sm" fixed="top" bg="light" variant="light">
      <Container fluid className="px-4">
        {/* Logo */}
        <Navbar.Brand as={Link} to="/dashboard">
          <img src={lgHorizontal} alt="Logo AeroSense" style={{ height: '40px' }} />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Links de navegação */}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-auto">
            <Nav.Link as={Link} to="/dashboard" active={currentPage === 'Dashboard'}>
              <Grid3x3Gap className="me-2" />Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/historico" active={currentPage === 'Histórico'}>
              <ClockHistory className="me-2" />Histórico
            </Nav.Link>
            {/* O link de Configurações foi removido daqui */}
          </Nav>
          
          {/* Menu Dropdown do Usuário */}
          <Nav>
            <Dropdown as={NavItem}>
              <Dropdown.Toggle as={Nav.Link} className="d-flex align-items-center">
                <PersonCircle size={22} className="me-2" />
                <span>Olá, {user ? user.name : 'Usuário'}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item as={Link} to="/config">
                    <WrenchAdjustable className="me-2" />
                    Minha Conta
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={logout} className="text-danger">
                  <BoxArrowRight className="me-2" />
                  Sair
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;