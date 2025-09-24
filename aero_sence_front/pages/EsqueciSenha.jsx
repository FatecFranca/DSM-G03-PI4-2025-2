import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/styles/Auth.css'; 
import logo from '../public/logo.png';
import { ArrowLeft } from 'react-bootstrap-icons';

const EsqueciSenha = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email) {
      setError('Por favor, insira seu endereço de e-mail.');
      setIsLoading(false);
      return;
    }

    // Simulação de chamada de API para recuperação de senha
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Lógica de sucesso/falha
    // Para este exemplo, vamos sempre mostrar sucesso
    setSuccess(`Um e-mail de recuperação foi enviado para ${email}, caso ele esteja cadastrado em nosso sistema.`);
    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <Card className="shadow auth-card">
        <Card.Body>
          <div className="text-center">
            <img src={logo} alt="AeroSense Logo" className="auth-logo" />
            <h2 className="auth-title mb-3">Recuperar Senha</h2>
            <p className="text-muted mb-4">
              Digite seu e-mail e enviaremos um link para você redefinir sua senha.
            </p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="email">
              <Form.Label className="auth-form-label">E-mail</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="Digite o e-mail cadastrado" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!success} // Desabilita o campo após o sucesso
              />
            </Form.Group>

            <Button type="submit" className="w-100 auth-submit-button" disabled={isLoading || !!success}>
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Enviando...</span>
                </>
              ) : (
                'Enviar e-mail de recuperação'
              )}
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

export default EsqueciSenha;