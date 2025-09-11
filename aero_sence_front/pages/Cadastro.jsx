import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '.././src/assets/logo.png';
import { Link } from 'react-router-dom';

const Cadastro = () => {
    return (
        <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh', minWidth: '100vw' }}>
            <div className="card p-4 shadow" style={{ maxWidth: '400px', width: '100%', transform: 'scale(0.9)', transformOrigin: 'center', paddingTop: '32px', paddingBottom: '32px' }}>
                <div className="text-center mb-2">
                    <img src={logo} alt="logo" className="img-fluid mb-2" style={{ width: '90px' }}/>
                    <h2 className="fs-4 fw-bold">Seja bem-vindo!</h2>
                </div>
                <form className="row g-2">
                    <div className="col-12">
                        <label htmlFor="nome" className="form-label fw-bold">Nome</label>
                        <input type="text" id="nome" className="form-control" placeholder="Digite seu nome" />
                    </div>
                    <div className="col-12">
                        <label htmlFor="email" className="form-label fw-bold">E-mail</label>
                        <input type="email" id="email" className="form-control" placeholder="Digite seu e-mail" style={{paddingLeft: '8px'}}/>
                    </div>
                                        <div className="col-12 col-md-6">
                                                <label htmlFor="password" className="form-label fw-bold">Senha</label>
                                                <input
                                                    type="password"
                                                    id="password"
                                                    className="form-control"
                                                    placeholder=""
                                                    style={{ width: '100%' }}
                                                    autoComplete="new-password"
                                                />
                                        </div>
                                        <div className="col-12 col-md-6">
                                                <label htmlFor="password_confirm" className="form-label fw-bold">Confirmar senha</label>
                                                <input
                                                    type="password"
                                                    id="password_confirm"
                                                    className="form-control"
                                                    placeholder=""
                                                    style={{ width: '100%' }}
                                                    autoComplete="new-password"
                                                />
                                        </div>
                    <div className="col-12">
                        <button 
                            type="submit" 
                            className="btn btn-lg btn-primary w-100 fw-bold mt-2" 
                            style={{ background: 'linear-gradient(90deg, #53a3c9, #28a745)', border: 'none', color: 'white', fontSize: '1rem' }}
                        >
                            Cadastrar
                        </button>
                    </div>
                </form>
                <p className="text-center mt-2 text-secondary">
                    Já tem conta? <Link to="/">Entrar</Link>
                </p>
            </div>
        </div>
    );
};

export default Cadastro;