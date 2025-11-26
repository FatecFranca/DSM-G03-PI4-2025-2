import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/styles/Auth.css';
// import logo from '../public/logo.png'; // Temporariamente desabilitado
const logo = '/logo.png'; // Usar caminho público
import { useAuth } from '../src/context/AuthContext'; 
import api from '../src/services/api'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      const { user, token } = response.data;
      login(user, token);

    } catch (err) {
      setError('E-mail ou senha inválidos. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="shadow auth-card">
        <Card.Body>
          <div className="text-center">
            <img src={logo} alt="AeroSense Logo" className="auth-logo" />
            <h2 className="auth-title mb-4">Bem-vindo de volta!</h2>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label className="auth-form-label">E-mail</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="Digite seu e-mail" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2" controlId="password">
              <Form.Label className="auth-form-label">Senha</Form.Label>
              <InputGroup>
                <Form.Control 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Digite sua senha" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{cursor: 'pointer'}}>
                    {showPassword ? <EyeSlash /> : <Eye />}
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>

            <Button type="submit" className="w-100 auth-submit-button mt-3" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Entrando...</span>
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </Form>

          <p className="text-center mt-3 text-secondary">
            Não tem conta? <Link to="/cadastro" className="auth-link">Cadastre-se</Link>
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login;