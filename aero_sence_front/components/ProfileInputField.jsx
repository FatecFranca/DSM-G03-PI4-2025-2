import React, { useState, useEffect } from 'react';
import { Form, InputGroup, Button, Spinner } from 'react-bootstrap';
import { PencilFill, CheckLg, XLg } from 'react-bootstrap-icons';

// Componente reutilizável para cada campo do perfil
const ProfileInputField = ({ field, label, type = "text", value, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const [isLoading, setIsLoading] = useState(false);

    // Atualiza o valor interno se a prop externa mudar
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleSave = async () => {
        setIsLoading(true);
        // Simula uma chamada de API
        await new Promise(resolve => setTimeout(resolve, 500));
        onSave(field, currentValue);
        setIsLoading(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setCurrentValue(value); // Restaura o valor original
        setIsEditing(false);
    };

    return (
        <Form.Group className="mb-3">
            <Form.Label htmlFor={field} className="fw-bold">{label}</Form.Label>
            <InputGroup>
                <Form.Control
                    type={type}
                    id={field}
                    name={field}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    readOnly={!isEditing}
                    style={{ 
                        backgroundColor: isEditing ? '#fff' : '#f8f9fa',
                        cursor: isEditing ? 'text' : 'default'
                    }}
                />
                {isEditing ? (
                    <>
                        <Button variant="outline-success" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? <Spinner as="span" animation="border" size="sm" /> : <CheckLg />}
                        </Button>
                        <Button variant="outline-secondary" onClick={handleCancel}>
                            <XLg />
                        </Button>
                    </>
                ) : (
                    <Button variant="outline-secondary" onClick={() => setIsEditing(true)}>
                        <PencilFill />
                    </Button>
                )}
            </InputGroup>
        </Form.Group>
    );
};

export default ProfileInputField;