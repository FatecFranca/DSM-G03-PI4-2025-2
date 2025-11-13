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
    if (aqi <= 50) return <Badge bg="success">Bom</Badge>;
    if (aqi <= 100) return <Badge bg="warning" text="dark">Moderado</Badge>;
    if (aqi <= 150) return <Badge bg="warning">Insalubre para Sensíveis</Badge>;
    if (aqi <= 200) return <Badge bg="danger">Insalubre</Badge>;
    if (aqi <= 300) return <Badge bg="danger" style={{backgroundColor: '#8b008b'}}>Muito Insalubre</Badge>;
    return <Badge bg="danger" style={{backgroundColor: '#7e0023'}}>Perigoso</Badge>;
};

const getCo2Badge = (co2Value) => {
    const co2 = parseFloat(String(co2Value).replace(/[^0-9\.]/g, '')) || 0;
    if (co2 === 0) return <span className="text-muted">--</span>;
    if (co2 <= 600) return <span className="text-success"><ArrowDownCircleFill className="me-1" /> Bom</span>;
    if (co2 <= 1000) return <span className="text-success"><ArrowDownCircleFill className="me-1" /> Normal</span>;
    if (co2 <= 1500) return <span className="text-warning"><ArrowUpCircleFill className="me-1" /> Aceitável</span>;
    if (co2 <= 2000) return <span className="text-danger"><ArrowUpCircleFill className="me-1" /> Elevado</span>;
    return <span className="text-danger"><ArrowUpCircleFill className="me-1" /> Muito Alto</span>;
};


const Historico = () => {
    const [filter, setFilter] = useState('7d'); // Filtro padrão: 7 dias
    const [showStats, setShowStats] = useState(false); // Toggle para mostrar estatísticas avançadas
    const [estatisticas, setEstatisticas] = useState(null); // Estatísticas virão da API
    const [loadingStats, setLoadingStats] = useState(false);

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

    // Buscar estatísticas da API baseado no filtro
    useEffect(() => {
        const fetchStatistics = async () => {
            setLoadingStats(true);
            try {
                // Mapear filtro para período da API
                let period = filter === 'today' ? '24h' : filter;
                const res = await api.get(`/sensor/statistics?period=${period}`);
                setEstatisticas({
                    co2: res.data.co2,
                    temperatura: res.data.temperatura,
                    umidade: res.data.umidade,
                });
            } catch (err) {
                console.error('Erro ao buscar estatísticas:', err);
                // Mantém null, componente vai lidar com isso
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStatistics();
    }, [filter]); // Recarrega quando o filtro muda

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
                                    {typeof averageAqi === 'number' ? getAqiBadge(averageAqi) : <Badge bg="secondary">Sem dados</Badge>}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted mb-3">Pico de CO₂ (7 dias)</h6>
                                    <h2 className="fw-bold display-5">{peakCo2}</h2>
                                    {getCo2Badge(peakCo2)}
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

                    {/* --- ESTATÍSTICAS AVANÇADAS --- */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-semibold">Análise Estatística Detalhada</h5>
                            <Button 
                                variant="outline-primary" 
                                size="sm" 
                                onClick={() => setShowStats(!showStats)}
                            >
                                {showStats ? 'Ocultar' : 'Mostrar'} Estatísticas
                            </Button>
                        </Card.Header>
                        {showStats && (
                            <Card.Body>
                                {loadingStats ? (
                                    <div className="text-center p-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Carregando...</span>
                                        </div>
                                        <p className="mt-2 text-muted">Calculando estatísticas...</p>
                                    </div>
                                ) : !estatisticas ? (
                                    <div className="text-center p-4 text-muted">
                                        <p>Não foi possível carregar as estatísticas.</p>
                                    </div>
                                ) : (
                                <>
                                <Row className="g-4">
                                    {/* CO₂ */}
                                    <Col md={4}>
                                        <h6 className="text-primary fw-bold mb-3">CO₂ (ppm)</h6>
                                        <Table size="sm" bordered>
                                            <tbody>
                                                <tr><td>Média</td><td className="fw-bold">{estatisticas.co2.media}</td></tr>
                                                <tr><td>Mediana</td><td className="fw-bold">{estatisticas.co2.mediana}</td></tr>
                                                <tr><td>Desvio Padrão</td><td className="fw-bold">{estatisticas.co2.desvioPadrao}</td></tr>
                                                <tr><td>Mínimo</td><td className="fw-bold">{estatisticas.co2.minimo}</td></tr>
                                                <tr><td>Máximo</td><td className="fw-bold">{estatisticas.co2.maximo}</td></tr>
                                                <tr><td>Assimetria</td><td className="fw-bold">{estatisticas.co2.assimetria.toFixed(2)}</td></tr>
                                                <tr><td>Coef. Variação</td><td className="fw-bold">{estatisticas.co2.coefVariacao}%</td></tr>
                                                <tr><td>Percentil 95</td><td className="fw-bold">{estatisticas.co2.percentil95}</td></tr>
                                                <tr><td>% Tempo Crítico</td><td className="fw-bold text-danger">{estatisticas.co2.tempoRisco}%</td></tr>
                                            </tbody>
                                        </Table>
                                        <small className="text-muted">
                                            <strong>Interpretação:</strong> {estatisticas.co2.media > 1000 ? 'CO₂ médio elevado. Ventilação recomendada.' : 'CO₂ médio está dentro do normal.'}
                                        </small>
                                    </Col>

                                    {/* Temperatura */}
                                    <Col md={4}>
                                        <h6 className="text-primary fw-bold mb-3">Temperatura (°C)</h6>
                                        <Table size="sm" bordered>
                                            <tbody>
                                                <tr><td>Média</td><td className="fw-bold">{estatisticas.temperatura.media}</td></tr>
                                                <tr><td>Mediana</td><td className="fw-bold">{estatisticas.temperatura.mediana}</td></tr>
                                                <tr><td>Desvio Padrão</td><td className="fw-bold">{estatisticas.temperatura.desvioPadrao}</td></tr>
                                                <tr><td>Mínimo</td><td className="fw-bold">{estatisticas.temperatura.minimo}</td></tr>
                                                <tr><td>Máximo</td><td className="fw-bold">{estatisticas.temperatura.maximo}</td></tr>
                                                <tr><td>Assimetria</td><td className="fw-bold">{estatisticas.temperatura.assimetria.toFixed(2)}</td></tr>
                                                <tr><td>Coef. Variação</td><td className="fw-bold">{estatisticas.temperatura.coefVariacao}%</td></tr>
                                                <tr><td>Percentil 95</td><td className="fw-bold">{estatisticas.temperatura.percentil95}</td></tr>
                                                <tr><td>% Tempo Crítico</td><td className="fw-bold text-success">{estatisticas.temperatura.tempoRisco}%</td></tr>
                                            </tbody>
                                        </Table>
                                        <small className="text-muted">
                                            <strong>Interpretação:</strong> Temperatura estável com baixa variação. 
                                            Ambiente termicamente confortável na maior parte do tempo.
                                        </small>
                                    </Col>

                                    {/* Umidade */}
                                    <Col md={4}>
                                        <h6 className="text-primary fw-bold mb-3">Umidade (%)</h6>
                                        <Table size="sm" bordered>
                                            <tbody>
                                                <tr><td>Média</td><td className="fw-bold">{estatisticas.umidade.media}</td></tr>
                                                <tr><td>Mediana</td><td className="fw-bold">{estatisticas.umidade.mediana}</td></tr>
                                                <tr><td>Desvio Padrão</td><td className="fw-bold">{estatisticas.umidade.desvioPadrao}</td></tr>
                                                <tr><td>Mínimo</td><td className="fw-bold">{estatisticas.umidade.minimo}</td></tr>
                                                <tr><td>Máximo</td><td className="fw-bold">{estatisticas.umidade.maximo}</td></tr>
                                                <tr><td>Assimetria</td><td className="fw-bold">{estatisticas.umidade.assimetria.toFixed(2)}</td></tr>
                                                <tr><td>Coef. Variação</td><td className="fw-bold">{estatisticas.umidade.coefVariacao}%</td></tr>
                                                <tr><td>Percentil 95</td><td className="fw-bold">{estatisticas.umidade.percentil95}</td></tr>
                                                <tr><td>% Tempo Crítico</td><td className="fw-bold text-warning">{estatisticas.umidade.tempoRisco}%</td></tr>
                                            </tbody>
                                        </Table>
                                        <small className="text-muted">
                                            <strong>Interpretação:</strong> Umidade dentro da faixa ideal (40-60%). 
                                            Baixo risco de desconforto ou problemas respiratórios.
                                        </small>
                                    </Col>
                                </Row>

                                {/* Explicações técnicas */}
                                <hr className="my-4" />
                                <Row>
                                    <Col>
                                        <h6 className="text-secondary fw-bold mb-3">Glossário Estatístico</h6>
                                        <Row className="g-3">
                                            <Col md={4}>
                                                <strong>Média:</strong> Valor típico no período.
                                            </Col>
                                            <Col md={4}>
                                                <strong>Mediana:</strong> Valor central (menos afetado por picos).
                                            </Col>
                                            <Col md={4}>
                                                <strong>Desvio Padrão:</strong> Quanto os valores variam da média.
                                            </Col>
                                            <Col md={4}>
                                                <strong>Assimetria:</strong> Distribuição "torta" (+: mais valores baixos, -: mais valores altos).
                                            </Col>
                                            <Col md={4}>
                                                <strong>Coef. Variação:</strong> Variabilidade relativa (%) em relação à média.
                                            </Col>
                                            <Col md={4}>
                                                <strong>Percentil 95:</strong> 95% do tempo o valor ficou abaixo deste limite.
                                            </Col>
                                            <Col md={4}>
                                                <strong>% Tempo Crítico:</strong> Porcentagem do tempo em níveis preocupantes.
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                                </>
                                )}
                            </Card.Body>
                        )}
                    </Card>

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