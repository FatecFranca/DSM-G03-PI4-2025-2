import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const NotificationToast = ({ show, onClose, message, type }) => {
    return (
        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1055 }}>
            <Toast onClose={onClose} show={show} delay={3000} autohide bg={type}>
                <Toast.Header closeButton={true}>
                    <strong className="me-auto">Notificação</strong>
                </Toast.Header>
                <Toast.Body className={type === 'danger' || type === 'success' ? 'text-white' : ''}>
                    {message}
                </Toast.Body>
            </Toast>
        </ToastContainer>
    );
};

export default NotificationToast;