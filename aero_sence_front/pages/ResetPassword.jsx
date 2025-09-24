import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { Eye, EyeSlash, ArrowLeft } from 'react-bootstrap-icons';
import '../src/styles/Auth.css';
import logo from '../public/logo.png';
import api from '../src/services/api';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            return setError('As senhas não coincidem.');
        }
        if (password.length < 6) {
            return setError('A senha deve ter no mínimo 6 caracteres.');
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/reset-password', { token, password });
            setSuccess(response.data.message + ' Redirecionando para o login...');
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-container">
                <Alert variant="danger">Token de redefinição inválido ou ausente.</Alert>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <Card className="shadow auth-card">
                <Card.Body>
                    <div className="text-center">
                        <img src={logo} alt="AeroSense Logo" className="auth-logo" />
                        <h2 className="auth-title mb-3">Redefinir Senha</h2>
                        <p className="text-muted mb-4">Crie uma nova senha para a sua conta.</p>
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="password">
                            <Form.Label className="auth-form-label">Nova Senha</Form.Label>
                            <InputGroup>
                                <Form.Control 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Digite a nova senha" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={!!success}
                                />
                                <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{cursor: 'pointer'}}>
                                    {showPassword ? <EyeSlash /> : <Eye />}
                                </InputGroup.Text>
                            </InputGroup>
                        </Form.Group>

                         <Form.Group className="mb-4" controlId="confirmPassword">
                            <Form.Label className="auth-form-label">Confirmar Nova Senha</Form.Label>
                            <Form.Control 
                                type="password" 
                                placeholder="Confirme a nova senha" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={!!success}
                            />
                        </Form.Group>

                        <Button type="submit" className="w-100 auth-submit-button" disabled={isLoading || !!success}>
                            {isLoading ? 'Aguarde...' : 'Redefinir Senha'}
                        </Button>
                    </Form>
                    <div className="text-center mt-4">
                        <Link to="/" className="auth-link d-flex align-items-center justify-content-center">
                            <ArrowLeft className="me-2" /> Voltar para o Login
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ResetPassword;