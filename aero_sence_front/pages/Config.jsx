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
  Col,
  Tabs, 
  Tab   
} from 'react-bootstrap';
import { PersonCircle, ShieldLock, ExclamationTriangleFill, CheckCircle } from 'react-bootstrap-icons';
import ProfileInputField from '../components/ProfileInputField';
import NotificationToast from '../components/NotificationToast';

const Config = () => {
  const [user, setUser] = useState({ name: '', email: '' });
  const [password, setPassword] = useState({ newPassword: '', confirmPassword: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  useEffect(() => {
    // Simula a busca de dados do usuário
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
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula API
    setIsLoading(false);
    showToast('Senha alterada com sucesso!');
    setPassword({ newPassword: '', confirmPassword: '' });
  };

  const handleConfirmDelete = () => {
    console.log('Conta excluída!');
    setShowDeleteModal(false);
    setDeleteConfirmationText('');
    showToast('Sua conta foi excluída.', 'info');
    // Adicionar lógica para deslogar e redirecionar o usuário
  };

  return (
    <>
      <NotificationToast
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />
      
      <Container
        fluid
        className="px-3 d-flex flex-column align-items-center justify-content-center"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <Row className="w-100" style={{ justifyContent: 'center' }}>
          <Col xs={12} md={10} lg={8} xl={7}>
            <h1 className="h2 fw-bold mb-4">Configurações da Conta</h1>
            
            <Card className="shadow-sm border-0">
              <Card.Body className="p-0">
                <Tabs defaultActiveKey="perfil" id="config-tabs" className="nav-tabs-bordered px-4" fill>
                  
                  {/* === ABA PERFIL === */}
                  <Tab eventKey="perfil" title={<><PersonCircle className="me-2" />Perfil</>}>
                    <div className="p-4">
                      <h5 className="mb-3">Informações do Perfil</h5>
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
                    </div>
                  </Tab>
                  
                  {/* === ABA SEGURANÇA === */}
                  <Tab eventKey="seguranca" title={<><ShieldLock className="me-2" />Segurança</>}>
                    <div className="p-4">
                       <h5 className="mb-3">Alterar Senha</h5>
                        <Form onSubmit={handleUpdatePassword}>
                           <Row className="gy-3">
                            <Col xs={12}>
                              <Form.Group controlId="newPassword">
                                <Form.Label className="fw-medium">Nova Senha</Form.Label>
                                <Form.Control type="password" name="newPassword" value={password.newPassword} onChange={handlePasswordChange} placeholder="Mínimo de 6 caracteres" />
                              </Form.Group>
                            </Col>
                            <Col xs={12}>
                              <Form.Group controlId="confirmPassword">
                                <Form.Label className="fw-medium">Confirmar Nova Senha</Form.Label>
                                <Form.Control type="password" name="confirmPassword" value={password.confirmPassword} onChange={handlePasswordChange} placeholder="Repita a nova senha" />
                                {password.newPassword && password.confirmPassword && password.newPassword === password.confirmPassword && (
                                    <div className="text-success small mt-1 d-flex align-items-center"><CheckCircle className="me-1" /> As senhas coincidem.</div>
                                )}
                              </Form.Group>
                            </Col>
                            <Col xs={12} className="text-end">
                              <Button variant="primary" type="submit" disabled={isLoading}>
                                {isLoading ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Atualizando...</> : 'Atualizar Senha'}
                              </Button>
                            </Col>
                          </Row>
                        </Form>
                    </div>
                  </Tab>
                  
                  {/* === ABA CONTA === */}
                  <Tab eventKey="conta" title={<><ExclamationTriangleFill className="me-2" />Conta</>}>
                    <Alert variant="danger" className="m-4 rounded">
                        <Alert.Heading><ExclamationTriangleFill className="me-2" />Zona de Perigo</Alert.Heading>
                        <hr/>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="fw-semibold mb-1">Excluir sua conta</h6>
                                <p className="mb-0 small">Esta ação é permanente e irreversível. Todos os seus dados serão perdidos.</p>
                            </div>
                            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>Excluir Conta</Button>
                        </div>
                    </Alert>
                  </Tab>

                </Tabs>
              </Card.Body>
            </Card>

          </Col>
        </Row>
      </Container>

      {/* === MODAL DE EXCLUSÃO === */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="text-danger"><ExclamationTriangleFill className="me-2" />Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente apagados.</p>
          <p className="fw-bold">Para confirmar, digite <strong>excluir</strong> no campo abaixo.</p>
          <Form.Control 
            type="text" 
            placeholder='Digite "excluir" para confirmar'
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDelete}
            disabled={deleteConfirmationText.toLowerCase() !== 'excluir'}
          >
            Excluir permanentemente
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Config;