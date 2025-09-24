import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { Calendar2Week, ClockHistory, ArrowUpCircleFill, ArrowDownCircleFill } from 'react-bootstrap-icons';

// Dados de exemplo
const historicalData = [
  { date: '2024-09-22', time: '18:30', aqi: 55, co2: '450 ppm', vocs: '125 ppb', nox: '0.05 ppm' },
  { date: '2024-09-22', time: '17:30', aqi: 62, co2: '480 ppm', vocs: '140 ppb', nox: '0.06 ppm' },
  { date: '2024-09-21', time: '20:00', aqi: 48, co2: '430 ppm', vocs: '110 ppb', nox: '0.04 ppm' },
  { date: '2024-09-20', time: '15:10', aqi: 75, co2: '510 ppm', vocs: '160 ppb', nox: '0.07 ppm' },
  { date: '2024-09-19', time: '11:45', aqi: 42, co2: '400 ppm', vocs: '95 ppb', nox: '0.03 ppm' },
];

const getAqiBadge = (aqi) => {
    if (aqi <= 50) return <Badge bg="success">Boa</Badge>;
    if (aqi <= 100) return <Badge bg="warning">Moderada</Badge>;
    return <Badge bg="danger">Insalubre</Badge>;
};


const Historico = () => {
    const [filter, setFilter] = useState('7d'); // Filtro padrão: 7 dias

    // Lógica (simulada) para filtrar os dados
    const filteredData = historicalData;

    // Cálculos de média (simulados)
    const averageAqi = 56;
    const peakCo2 = '510 ppm';
    const averageVocs = '126 ppb';


    return (
        <Container fluid className="py-4 px-3">
            <Row className="justify-content-center">
                <Col xs={12} xl={10}>
                    {/* --- TÍTULO --- */}
                    <div className="mb-4">
                        <h1 className="display-6 fw-bold text-primary mb-2">
                            <ClockHistory className="me-3" size={40} />
                            Histórico de Dados
                        </h1>
                        <p className="text-muted mb-0">
                            Analise as médias e registros detalhados da qualidade do ar.
                        </p>
                    </div>

                    {/* --- CARDS DE MÉDIA --- */}
                    <Row className="g-4 mb-4">
                        <Col md={4}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted mb-3">Média de AQI (7 dias)</h6>
                                    <h2 className="fw-bold display-5">{averageAqi}</h2>
                                    <Badge bg="warning">Moderada</Badge>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted mb-3">Pico de CO₂ (7 dias)</h6>
                                    <h2 className="fw-bold display-5">{peakCo2}</h2>
                                    <span className="text-danger"><ArrowUpCircleFill className="me-1" /> Elevado</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted mb-3">Nível Médio de VOCs</h6>
                                    <h2 className="fw-bold display-5">{averageVocs}</h2>
                                     <span className="text-success"><ArrowDownCircleFill className="me-1" /> Baixo</span>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    
                    {/* --- TABELA DE REGISTROS --- */}
                    <Card className="shadow-sm border-0">
                        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                            <h5 className="mb-0 fw-semibold">
                                Registros Detalhados
                            </h5>
                            <div>
                                <Button variant={filter === 'today' ? 'primary' : 'outline-secondary'} size="sm" className="me-2" onClick={() => setFilter('today')}>Hoje</Button>
                                <Button variant={filter === '7d' ? 'primary' : 'outline-secondary'} size="sm" className="me-2" onClick={() => setFilter('7d')}>Últimos 7 dias</Button>
                                <Button variant={filter === '30d' ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setFilter('30d')}>Últimos 30 dias</Button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                             <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Hora</th>
                                        <th>AQI</th>
                                        <th>Qualidade</th>
                                        <th>CO₂</th>
                                        <th>VOCs</th>
                                        <th>NOx/Fumaça</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((record, index) => (
                                        <tr key={index}>
                                            <td>{record.date}</td>
                                            <td>{record.time}</td>
                                            <td className="fw-bold">{record.aqi}</td>
                                            <td>{getAqiBadge(record.aqi)}</td>
                                            <td>{record.co2}</td>
                                            <td>{record.vocs}</td>
                                            <td>{record.nox}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Historico;