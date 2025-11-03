import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { Calendar2Week, ClockHistory, ArrowUpCircleFill, ArrowDownCircleFill } from 'react-bootstrap-icons';

// Dados de exemplo (usado como fallback inicial)
const SAMPLE_HISTORICAL = [
    { date: '2024-09-22', time: '18:30', aqi: 55, co2: '450 ppm', vocs: '125 ppb', nox: '0.05 ppm', temperature: '23.4 °C', humidity: '45 %' },
    { date: '2024-09-22', time: '17:30', aqi: 62, co2: '480 ppm', vocs: '140 ppb', nox: '0.06 ppm', temperature: '24.1 °C', humidity: '47 %' },
    { date: '2024-09-21', time: '20:00', aqi: 48, co2: '430 ppm', vocs: '110 ppb', nox: '0.04 ppm', temperature: '22.8 °C', humidity: '50 %' },
    { date: '2024-09-20', time: '15:10', aqi: 75, co2: '510 ppm', vocs: '160 ppb', nox: '0.07 ppm', temperature: '26.0 °C', humidity: '40 %' },
    { date: '2024-09-19', time: '11:45', aqi: 42, co2: '400 ppm', vocs: '95 ppb', nox: '0.03 ppm', temperature: '21.6 °C', humidity: '55 %' },
];

import api from '../src/services/api';

const getAqiBadge = (aqi) => {
    if (aqi <= 50) return <Badge bg="success">Boa</Badge>;
    if (aqi <= 100) return <Badge bg="warning">Moderada</Badge>;
    return <Badge bg="danger">Insalubre</Badge>;
};


const Historico = () => {
    const [filter, setFilter] = useState('7d'); // Filtro padrão: 7 dias

    // Estado para os dados históricos (inicializa com fallback normalizado)
    const normalizeSample = (r) => {
        // tenta construir um timestamp a partir de date + time, senão usa Date.now()
        let d;
        try {
            d = new Date(`${r.date}T${r.time}:00`);
            if (isNaN(d.getTime())) throw new Error('invalid date');
        } catch {
            d = new Date();
        }
        return { ...r, _ts: d.getTime() };
    };
    const [historicalData, setHistoricalData] = useState(SAMPLE_HISTORICAL.map(normalizeSample));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lógica para filtrar os dados com base no filtro selecionado
    const getCutoff = (filter) => {
        const now = Date.now();
        if (filter === 'today') {
            const start = new Date(); start.setHours(0,0,0,0);
            return start.getTime();
        }
        if (filter === '7d') return now - 7 * 24 * 60 * 60 * 1000;
        if (filter === '30d') return now - 30 * 24 * 60 * 60 * 1000;
        return 0;
    };

    const cutoff = getCutoff(filter);
    const filteredData = historicalData.filter((r) => (r._ts || 0) >= cutoff);

    // Buscar histórico do backend ao montar o componente
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await api.get('/sensor/history');
                // Mapear os registros para o formato usado na tabela
                const mapped = res.data.map((r) => {
                    const d = new Date(r.createdAt || r.date || Date.now());
                    const date = d.toISOString().slice(0,10);
                    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return {
                        date,
                        time,
                        _ts: d.getTime(),
                        aqi: r.aqi,
                        co2: r.co2 != null ? `${r.co2} ppm` : '--',
                        vocs: r.vocs != null ? `${r.vocs} ppb` : '--',
                        nox: r.nox != null ? `${r.nox} ppm` : '--',
                        temperature: r.temperature != null ? `${r.temperature} °C` : '--',
                        humidity: r.humidity != null ? `${r.humidity} %` : '--',
                    };
                });
                setHistoricalData(mapped);
            } catch (err) {
                console.error('Erro ao buscar histórico:', err);
                setError('Não foi possível carregar o histórico. Exibindo dados de exemplo.');
                // mantém SAMPLE_HISTORICAL como fallback
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // Cálculos de média (baseados nos registros filtrados)
    const len = filteredData.length;
    let averageAqi = '--';
    let peakCo2 = '--';
    let averageVocs = '--';
    let averageTemperature = '--';
    let averageHumidity = '--';

    if (len > 0) {
        averageAqi = Math.round(filteredData.reduce((s, r) => s + (r.aqi || 0), 0) / len);
        const peak = filteredData.reduce((max, r) => {
            const val = parseFloat(String(r.co2).replace(/[^0-9\.]/g, '')) || 0;
            return val > max ? val : max;
        }, 0);
        peakCo2 = peak ? peak + ' ppm' : '--';
        averageVocs = Math.round(filteredData.reduce((s, r) => s + (parseFloat(String(r.vocs).replace(/[^0-9\.]/g, '')) || 0), 0) / len) + ' ppb';
        averageTemperature = (filteredData.reduce((s, r) => s + (parseFloat(String(r.temperature).replace(/[^0-9\.]/g, '')) || 0), 0) / len).toFixed(1) + ' °C';
        averageHumidity = Math.round(filteredData.reduce((s, r) => s + (parseFloat(String(r.humidity).replace(/[^0-9\.]/g, '')) || 0), 0) / len) + ' %';
    }

    // Pequeno efeito de debug: loga counts por filtro para ajudar a diagnosticar problemas
    useEffect(() => {
        const now = Date.now();
        const counts = {
            today: historicalData.filter(r => (r._ts || 0) >= (new Date().setHours(0,0,0,0))).length,
            '7d': historicalData.filter(r => (r._ts || 0) >= now - 7 * 24 * 60 * 60 * 1000).length,
            '30d': historicalData.filter(r => (r._ts || 0) >= now - 30 * 24 * 60 * 60 * 1000).length,
            total: historicalData.length,
        };
        console.log('[Historico] counts:', counts, 'active filter:', filter);
    }, [historicalData, filter]);

    // Mostrar quantos registros estão sendo exibidos atualmente
    const filterLabel = filter === 'today' ? 'Hoje' : filter === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias';


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

                    {loading && <div className="mb-3 text-muted">Carregando histórico...</div>}
                    {error && <div className="mb-3 text-danger">{error}</div>}

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

                    {/* Linha adicional para Temperatura e Umidade médias */}
                    <Row className="g-4 mb-4">
                        <Col md={6}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted mb-3">Temperatura Média (7 dias)</h6>
                                    <h2 className="fw-bold display-5">{averageTemperature}</h2>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted mb-3">Umidade Média (7 dias)</h6>
                                    <h2 className="fw-bold display-5">{averageHumidity}</h2>
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
                        <div className="px-3 mt-2 d-flex justify-content-between align-items-center">
                            <small className="text-muted">Filtrando: <strong>{filterLabel}</strong></small>
                            <small className="text-muted">Registros exibidos: <strong>{filteredData.length}</strong></small>
                        </div>
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
                                        <th>Temperatura</th>
                                        <th>Umidade</th>
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
                                            <td>{record.temperature}</td>
                                            <td>{record.humidity}</td>
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