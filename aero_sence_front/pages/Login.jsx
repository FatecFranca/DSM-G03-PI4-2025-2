import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import logo from '.././src/assets/logo.png';

const Login = () => {
  return (
    
  <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100dvh', minWidth: '100vw', overflowY: 'hidden', overflowX: 'auto' }}>
  <div className="card p-4 shadow" style={{ maxWidth: '400px', width: '100%', transform: 'scale(0.9)', transformOrigin: 'center', paddingTop: '32px', paddingBottom: '32px' }}>
        <div className="text-center">
          <img src={logo} alt="AeroSense Logo" className="img-fluid mb-2" style={{ width: '90px' }} />
          <h2 className="fs-4 fw-bold mb-3 mt-1">Bem-vindo de volta!</h2>
        </div>
  <form className="row g-2">
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-bold text-start w-100" style={{paddingLeft: '8px'}}>E-mail</label>
            <input type="email" id="email" className="form-control" placeholder="Digite seu e-mail" />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-bold text-start w-100" style={{paddingLeft: '8px'}}>Senha</label>
            <input type="password" id="password" className="form-control" placeholder="Digite sua senha" />
            <p className="text-end text-primary mt-2" style={{ cursor: 'pointer' }}>Esqueci minha senha</p>
          </div>
          <button
            type="submit"
            className="btn btn-lg w-100 fw-bold"
            style={{
              background: 'linear-gradient(90deg, #53a3c9, #28a745)',
              border: 'none',
              color: 'white',
              fontSize: '1rem',
              marginTop: '4px'
            }}
          >
            Entrar
          </button>
        </form>
        <p className="text-center mt-3 text-secondary">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;