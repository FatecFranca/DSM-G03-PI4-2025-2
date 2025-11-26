import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner, InputGroup, Row, Col } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/styles/Auth.css';
// import logo from '../public/logo.png'; // Temporariamente desabilitado
const logo = '/logo.png'; // Usar caminho público
import api from '../src/services/api';

const Cadastro = () => {
    const [formData, setFormData] = useState({ nome: '', email: '', password: '', password_confirm: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevState => ({ ...prevState, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        const { nome, email, password, password_confirm } = formData;

        if (!nome || !email || !password || !password_confirm) {
            setError('Todos os campos são obrigatórios.');
            setIsLoading(false);
            return;
        }
        if (password !== password_confirm) {
            setError('As senhas não coincidem.');
            setIsLoading(false);
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/auth/register', {
                name: nome,
                email,
                password,
            });

            setSuccess('Cadastro realizado com sucesso! A redirecionar para o login...');
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            // ESTA É A PARTE IMPORTANTE
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Não foi possível realizar o cadastro. Verifique a sua ligação à API.');
            }
            console.error("Detalhes do erro no cadastro:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Card className="shadow auth-card">
              <Card.Body>
                <div className="text-center mb-4">
                    <img src={logo} alt="logo" className="auth-logo"/>
                    <h2 className="auth-title">Crie sua conta</h2>
                </div>

                {/* PROCURE PELA MENSAGEM DE ERRO QUE APARECERÁ AQUI */}
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                    {/* ... (o resto do formulário continua igual) ... */}
                    <Form.Group className="mb-3" controlId="nome">
                        <Form.Label className="auth-form-label">Nome</Form.Label>
                        <Form.Control type="text" placeholder="Digite seu nome completo" value={formData.nome} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="email">
                        <Form.Label className="auth-form-label">E-mail</Form.Label>
                        <Form.Control type="email" placeholder="Digite seu e-mail" value={formData.email} onChange={handleChange} />
                    </Form.Group>
                    <Row>
                      <Col sm={6}>
                        <Form.Group className="mb-3" controlId="password">
                          <Form.Label className="auth-form-label">Senha</Form.Label>
                           <InputGroup>
                            <Form.Control type={showPassword ? "text" : "password"} placeholder="Mín. 6 caracteres" value={formData.password} onChange={handleChange} />
                             <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{cursor: 'pointer'}}>{showPassword ? <EyeSlash /> : <Eye />}</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3" controlId="password_confirm">
                          <Form.Label className="auth-form-label">Confirmar Senha</Form.Label>
                           <InputGroup>
                            <Form.Control type={showConfirmPassword ? "text" : "password"} placeholder="Repita a senha" value={formData.password_confirm} onChange={handleChange} />
                             <InputGroup.Text onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{cursor: 'pointer'}}>{showConfirmPassword ? <EyeSlash /> : <Eye />}</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button type="submit" className="w-100 auth-submit-button" disabled={isLoading || !!success}>
                      {isLoading ? <><Spinner as="span" animation="border" size="sm" /> Cadastrando...</> : 'Cadastrar'}
                    </Button>
                </Form>
                <p className="text-center mt-3 text-secondary">
                    Já tem conta? <Link to="/" className="auth-link">Entrar</Link>
                </p>
              </Card.Body>
            </Card>
        </div>
    );
};

export default Cadastro;