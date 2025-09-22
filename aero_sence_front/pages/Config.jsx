import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  Modal,
  Alert,
  Spinner,
  Container,
  Row,
  Col
} from 'react-bootstrap';
import { InfoCircleFill, ExclamationTriangleFill } from 'react-bootstrap-icons';
import ProfileInputField from '../components/ProfileInputField';
import NotificationToast from '../components/NotificationToast';
import { CheckCircle } from 'react-bootstrap-icons';

const Config = () => {
  const [user, setUser] = useState({ name: '', email: '' });
  const [password, setPassword] = useState({ newPassword: '', confirmPassword: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    // Simula fetch
    setUser({ name: 'Usuário Exemplo', email: 'exemplo@email.com' });
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const handleSaveField = (field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
    showToast(`${field.charAt(0).toUpperCase() + field.slice(1)} atualizado com sucesso!`);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      showToast('As senhas não coincidem!', 'danger');
      return;
    }
    if (password.newPassword.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres.', 'warning');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    showToast('Senha alterada com sucesso!');
    setPassword({ newPassword: '', confirmPassword: '' });
  };

  const handleConfirmDelete = () => {
    console.log('Conta excluída!');
    setShowDeleteModal(false);
    showToast('Sua conta foi excluída.', 'info');
  };

  return (
    <>
      <NotificationToast
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />
      
      {/* Container responsivo com padding adequado e espaço para Navbar */}
      <Container
        fluid
        className="px-3 min-vh-100 d-flex flex-column align-items-center justify-content-center"
        style={{ paddingTop: '100px', paddingBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Row className="w-100" style={{ display: 'flex', justifyContent: 'center' }}>
          <Col xs={12} sm={10} md={8} lg={6} xl={5} xxl={4} style={{ margin: '0 auto' }}>
            
            {/* Alert informativo */}
            <Alert variant="info" className="d-flex align-items-center mb-4 shadow-sm">
              <InfoCircleFill className="me-2 flex-shrink-0" />
              <span>Suas informações de perfil são visíveis apenas para você.</span>
            </Alert>

            {/* Card de Informações do Perfil */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-primary bg-opacity-10 border-0">
                <h5 className="mb-0 text-primary fw-semibold">
                  <i className="bi bi-person-circle me-2"></i>
                  Informações do Perfil
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <ProfileInputField 
                  field="name" 
                  label="Nome" 
                  value={user.name} 
                  onSave={handleSaveField} 
                />
                <ProfileInputField 
                  field="email" 
                  label="E-mail" 
                  type="email" 
                  value={user.email} 
                  onSave={handleSaveField} 
                />
              </Card.Body>
            </Card>

            {/* Card de Alteração de Senha */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-warning bg-opacity-10 border-0">
                <h5 className="mb-0 text-warning-emphasis fw-semibold">
                  <i className="bi bi-shield-lock me-2"></i>
                  Alterar Senha
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleUpdatePassword}>
                  <Row className="gy-3">
                    <Col xs={12} md={6}>
                      <Form.Group controlId="newPassword" className="position-relative">
                        <Form.Label className="fw-medium">Nova Senha</Form.Label>
                        <div className="d-flex align-items-center">
                          <Form.Control
                            type="password"
                            name="newPassword"
                            value={password.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Mínimo de 6 caracteres"
                            className="border-2"
                            style={{ paddingRight: '2.5rem' }}
                          />
                          {password.newPassword.length >= 6 && password.newPassword === password.confirmPassword && password.newPassword !== '' && (
                            <CheckCircle
                              className="text-success ms-2"
                              size={22}
                              style={{ minWidth: 22 }}
                              title="Senha válida"
                            />
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group controlId="confirmPassword" className="position-relative">
                        <Form.Label className="fw-medium">Confirmar Nova Senha</Form.Label>
                        <div className="d-flex align-items-center">
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={password.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Repita a nova senha"
                            className="border-2"
                            style={{ paddingRight: '2.5rem' }}
                          />
                          {password.confirmPassword.length >= 6 && password.newPassword === password.confirmPassword && password.confirmPassword !== '' && (
                            <CheckCircle
                              className="text-success ms-2"
                              size={22}
                              style={{ minWidth: 22 }}
                              title="Senhas coincidem"
                            />
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <div className="d-flex justify-content-md-end">
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={isLoading}
                          className="px-4 py-2 w-100 w-md-auto"
                          style={{ maxWidth: 180 }}
                        >
                          {isLoading ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" className="me-2" />
                              Atualizando...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-2"></i>
                              Atualizar Senha
                            </>
                          )}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            {/* Card de Zona de Perigo */}
            <Card className="border-danger shadow-sm">
              <Card.Header className="bg-danger bg-opacity-10 border-danger">
                <h5 className="mb-0 text-danger fw-semibold">
                  <ExclamationTriangleFill className="me-2" />
                  Zona de Perigo
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between">
                  <div className="mb-3 mb-md-0">
                    <h6 className="fw-semibold text-danger mb-1">Excluir Conta</h6>
                    <p className="text-muted mb-0 small">
                      A exclusão da sua conta é uma ação permanente e irreversível.
                      Todos os seus dados serão perdidos permanentemente.
                    </p>
                  </div>
                  <Button 
                    variant="outline-danger" 
                    onClick={() => setShowDeleteModal(true)}
                    className="flex-shrink-0 px-4"
                  >
                    <i className="bi bi-trash me-2"></i>
                    Excluir Conta
                  </Button>
                </div>
              </Card.Body>
            </Card>

          </Col>
        </Row>
      </Container>

      {/* Modal de confirmação com melhor design */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)} 
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <ExclamationTriangleFill className="me-2" />
            Confirmar Exclusão
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <div className="text-center py-3">
            <div className="text-danger mb-3">
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '3rem' }}></i>
            </div>
            <h6 className="fw-semibold mb-3">Você tem certeza que deseja excluir sua conta?</h6>
            <p className="text-muted mb-0">
              Todos os seus dados serão perdidos permanentemente. 
              Esta ação não pode ser desfeita.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowDeleteModal(false)}
            className="px-4"
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDelete}
            className="px-4"
          >
            <i className="bi bi-check-circle me-2"></i>
            Sim, quero excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Config;