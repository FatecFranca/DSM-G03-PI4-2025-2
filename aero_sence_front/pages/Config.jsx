import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  Modal,
  Alert,
  Spinner
} from 'react-bootstrap';
import { InfoCircleFill, ExclamationTriangleFill } from 'react-bootstrap-icons';
import ProfileInputField from '../components/ProfileInputField';
import NotificationToast from '../components/NotificationToast';

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
      <div
         style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '1000px',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '12px',
          zIndex: 1000
        }}
      >

        <Alert variant="info" className="d-flex align-items-center mb-3">
          <InfoCircleFill className="me-2" />
          Suas informações de perfil são visíveis apenas para você.
        </Alert>

        <Card className="mb-3 shadow-sm">
          <Card.Header as="h5">Informações do Perfil</Card.Header>
          <Card.Body>
            <ProfileInputField field="name" label="Nome" value={user.name} onSave={handleSaveField} />
            <ProfileInputField field="email" label="E-mail" type="email" value={user.email} onSave={handleSaveField} />
          </Card.Body>
        </Card>

        <Card className="mb-3 shadow-sm">
          <Card.Header as="h5">Alterar Senha</Card.Header>
          <Card.Body>
            <Form onSubmit={handleUpdatePassword}>
              <Form.Group className="mb-3" controlId="newPassword">
                <Form.Label>Nova Senha</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={password.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Mínimo de 6 caracteres"
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="confirmPassword">
                <Form.Label>Confirmar Nova Senha</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={password.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Repita a nova senha"
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Atualizar Senha'}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        <Card border="danger" className="shadow-sm">
          <Card.Header as="h5" className="text-danger bg-danger bg-opacity-10">
            <ExclamationTriangleFill className="me-2" /> Zona de Perigo
          </Card.Header>
          <Card.Body>
            <Card.Text>
              A exclusão da sua conta é uma ação permanente e irreversível.
            </Card.Text>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)} className="w-100">
              Excluir minha conta
            </Button>
          </Card.Body>
        </Card>
      </div>

      {/* Modal de confirmação */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Você tem certeza que deseja excluir sua conta? Todos os seus dados serão perdidos permanentemente. Esta ação não pode ser desfeita.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleConfirmDelete}>Sim, quero excluir</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Config;
