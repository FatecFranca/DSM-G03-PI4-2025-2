import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../src/assets/logo.png';

const AppNavbar = () => {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm custom-navbar py-0" fixed="top">
      <Container fluid className="navbar-container">
        <Navbar.Brand href="/">
          <img
            src={logo}
            height="64" /* Aumentei o tamanho da logo */
            className="d-inline-block align-top navbar-logo"
            alt="Logo"
            style={{ objectFit: 'contain' }}
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="fw-semibold">Login</Nav.Link>
            <Nav.Link as={Link} to="/dashboard" className="fw-semibold">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/config" className="fw-semibold">Configurações</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;