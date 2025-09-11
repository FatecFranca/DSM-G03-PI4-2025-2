import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap'; // 1. Importe o Container
// Se estiver usando react-router, importe o Link
// import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const AppNavbar = () => {
  return (
    // 2. Remova o style inline e as classes de largura desnecessárias.
    // A Navbar por padrão já ocupa 100% da largura.
    // Adicionei fixed="top" como uma opção comum e útil.
    <Navbar bg="light" expand="lg" className="shadow-sm" fixed="top">
      {/* 3. Adicione um <Container> para alinhar e conter o seu logo e links */}
      <Container>
        <Navbar.Brand href="/">
          <img
            src={logo}
            height="80" // 4. Defina uma altura razoável em vez de 0
            className="d-inline-block align-top"
            alt="Logo"
            style={{ objectFit: 'contain' }}
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="/" className="fw-semibold">Home</Nav.Link>
            <Nav.Link href="/historico" className="fw-semibold">Histórico</Nav.Link>
            <Nav.Link href="/config" className="fw-semibold">Settings</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;