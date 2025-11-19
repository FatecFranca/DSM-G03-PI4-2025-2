import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  Modal,
  Container,
  Row,
  Col,
  Tabs,
  Tab,
  Alert
} from 'react-bootstrap';
import { PersonCircle, ExclamationTriangleFill } from 'react-bootstrap-icons';
import ProfileInputField from '../components/ProfileInputField';
import NotificationToast from '../components/NotificationToast';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';

const Config = () => {
  const { logout, updateUser } = useAuth();
  const [user, setUser] = useState({ name: '', email: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Busca os dados do utilizador quando a página carrega
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/user/profile');
        setUser(response.data);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        showToast('Não foi possível carregar os seus dados.', 'danger');
      }
    };
    fetchUserProfile();
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  // Conecta a função de guardar nome/e-mail à API
  const handleSaveField = async (field, value) => {
    const originalUser = { ...user };
    const updatedUser = { ...user, [field]: value };
    setUser(updatedUser); // Atualiza a UI otimisticamente

    try {
        const response = await api.put('/user/profile', { [field]: value });
        showToast(`${field.charAt(0).toUpperCase() + field.slice(1)} atualizado com sucesso!`);
        updateUser(response.data.user); // Atualiza o estado global do utilizador
    } catch (error) {
        setUser(originalUser); // Reverte se houver erro
        showToast(`Erro ao atualizar ${field}.`, 'danger');
    }
  };

  // Aba 'Segurança' removida — alteração de senha não é mostrada aqui

  // Conecta a função de apagar conta à API
  const handleConfirmDelete = async () => {
    try {
        await api.delete('/user/account');
        showToast('A sua conta foi apagada. A redirecionar...', 'info');
        setTimeout(() => {
            logout(); // Faz o logout e redireciona para a página de login
        }, 2000);
    } catch (error) {
        showToast('Não foi possível apagar a sua conta.', 'danger');
    } finally {
        setShowDeleteModal(false);
        setDeleteConfirmationText('');
    }
  };

  return (
    <>
      <NotificationToast
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />
      <Container fluid className="px-3 py-4">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8} xl={7}>
            <h1 className="h2 fw-bold mb-4">Configurações da Conta</h1>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-0">
                <Tabs defaultActiveKey="perfil" fill>
                  <Tab eventKey="perfil" title={<><PersonCircle className="me-2" />Perfil</>}>
                    <div className="p-4">
                       <ProfileInputField field="name" label="Nome" value={user.name} onSave={handleSaveField} />
                       <ProfileInputField field="email" label="E-mail" type="email" value={user.email} onSave={handleSaveField} />
                    </div>
                  </Tab>
                  {/* Aba 'Segurança' removida conforme solicitado */}
                  <Tab eventKey="conta" title={<><ExclamationTriangleFill className="me-2" />Conta</>}>
                     <Alert variant="danger" className="m-4">
                        <Alert.Heading><ExclamationTriangleFill className="me-2" />Zona de Perigo</Alert.Heading>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <p className="mb-0 small">Esta ação é permanente e irreversível. Todos os seus dados serão perdidos.</p>
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
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger"><ExclamationTriangleFill className="me-2" />Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Para confirmar, digite <strong>excluir</strong> no campo abaixo.</p>
          <Form.Control type="text" value={deleteConfirmationText} onChange={(e) => setDeleteConfirmationText(e.target.value)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={deleteConfirmationText.toLowerCase() !== 'excluir'}>
            Excluir permanentemente
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Config;