import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { ClockHistory } from 'react-bootstrap-icons';
import api from '../src/services/api';

// ------------------------------------------------------------
// FUNÇÕES DE FORMATAÇÃO E ESTATÍSTICA
// ------------------------------------------------------------
const getAqiBadge = (aqi) => {
    const n = typeof aqi === 'number' ? aqi : parseFloat(String(aqi).replace(/[^0-9\.]/g, ''));
    if (Number.isNaN(n) || n === null) return <Badge bg="secondary">--</Badge>;
    if (n <= 50) return <Badge bg="success">Boa</Badge>;
    if (n <= 100) return <Badge bg="warning">Moderada</Badge>;
    return <Badge bg="danger">Insalubre</Badge>;
};

const calculateMedian = (arr) => {
    if (!arr || arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
};

const calculateStdDev = (arr) => {
    if (!arr || arr.length === 0) return null;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
};

const calculatePercentile = (arr, p) => {
    if (!arr || arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
};

// ------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------------------------
const Historico = () => {

    // ESTADOS
    const [filter, setFilter] = useState('7d');
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // CÁLCULO DO PERÍODO DO FILTRO
    const getCutoff = (filter) => {
        const now = new Date(); // Data/hora atual

        if (filter === 'today') {
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            return startOfDay.getTime();
        }
        
        if (filter === '7d') {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            return sevenDaysAgo.getTime();
        }
        
        if (filter === '30d') {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            thirtyDaysAgo.setHours(0, 0, 0, 0);
            return thirtyDaysAgo.getTime();
        }

        return 0; // Fallback: sem filtro
    };

    const cutoff = getCutoff(filter);

    const parseValue = (val) => {
        const parsed = parseFloat(String(val).replace(/[^0-9\.]/g, ''));
        return isNaN(parsed) ? null : parsed;
    };

    // BUSCA DO HISTÓRICO
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await api.get('/sensor/history');

                const mapped = res.data.map((r) => {
                    // Normaliza timestamp considerando diferentes formatos possíveis
                    const rawDate = r.createdAt || r.date;
                    const timestamp = typeof rawDate === 'number' 
                        ? rawDate // Assume que já está em milissegundos
                        : typeof rawDate === 'string'
                            ? Date.parse(rawDate) || Date.now() // Tenta parse da string ou usa data atual
                            : Date.now(); // Fallback para data atual
                    
                    const d = new Date(timestamp);
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Processando registro:', {
                            raw: rawDate,
                            normalizado: timestamp,
                            data: d.toLocaleString()
                        });
                    }

                    return {
                        date: d.toISOString().slice(0, 10),
                        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        _ts: timestamp,

                        // valores exibidos
                        aqi: r.aqi ?? '--',
                        co2: r.co2 != null ? `${parseValue(r.co2).toFixed(0)} ppm` : '--',
                        vocs: r.vocs != null ? `${parseValue(r.vocs).toFixed(0)} ppb` : '--',
                        nox: r.nox != null ? `${parseValue(r.nox).toFixed(2)} ppm` : '--',
                        temperature: r.temperature != null ? `${parseValue(r.temperature).toFixed(1)} °C` : '--',
                        humidity: r.humidity != null ? `${parseValue(r.humidity).toFixed(0)} %` : '--',

                        // valores crus (RAW) para cálculos
                        aqiRaw: r.aqi != null ? parseValue(r.aqi) : null,
                        co2Raw: r.co2 != null ? parseValue(r.co2) : null,
                        vocsRaw: r.vocs != null ? parseValue(r.vocs) : null,
                        noxRaw: r.nox != null ? parseValue(r.nox) : null,
                        temperatureRaw: r.temperature != null ? parseValue(r.temperature) : null,
                        humidityRaw: r.humidity != null ? parseValue(r.humidity) : null,
                    };
                });

                setHistoricalData(mapped);
                setError(null);

            } catch (err) {
                setError('Erro ao carregar histórico.');
                setHistoricalData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // DADOS FILTRADOS PELO PERÍODO
    const cutoffTime = getCutoff(filter);

    // Debug para investigar os timestamps
    console.log('Debug timestamps:', {
        filter,
        cutoff: new Date(cutoffTime).toLocaleString(),
        now: new Date().toLocaleString(),
        firstRecord: historicalData[0] ? {
            date: historicalData[0].date,
            time: historicalData[0].time,
            ts: new Date(historicalData[0]._ts).toLocaleString()
        } : null,
        totalRecords: historicalData.length,
    });

    const filteredData = historicalData.filter(r => {
        const passes = (r._ts || 0) >= cutoffTime;
        if (process.env.NODE_ENV === 'development') {
            console.log('Verificando registro:', {
                date: r.date,
                time: r.time,
                timestamp: new Date(r._ts).toLocaleString(),
                cutoff: new Date(cutoffTime).toLocaleString(),
                incluido: passes ? 'Sim' : 'Não'
            });
        }
        return passes;
    });

    const filterLabel =
        filter === 'today' ? 'Hoje' :
            filter === '7d' ? 'Últimos 7 dias' :
                'Últimos 30 dias';

    // ------------------------------------------------------------
    // CÁLCULOS DAS ESTATÍSTICAS USANDO *APENAS* VALORES RAW DO PERÍODO FILTRADO
    // ------------------------------------------------------------
    const aqiValues = filteredData.map(r => r.aqiRaw).filter(v => v !== null);
    const co2Values = filteredData.map(r => r.co2Raw).filter(v => v !== null);
    const vocsValues = filteredData.map(r => r.vocsRaw).filter(v => v !== null);
    const tempValues = filteredData.map(r => r.temperatureRaw).filter(v => v !== null);
    const humidValues = filteredData.map(r => r.humidityRaw).filter(v => v !== null);

    let averageAqi = '--';
    let peakCo2 = '--';
    let averageVocs = '--';
    let averageTemperature = '--';
    let averageHumidity = '--';
    let medianTemperature = '--';
    let stdDevTemp = '--';
    let rangeTemp = '--';
    let percentile90Temp = '--';
    let percentile95Temp = '--';

    if (filteredData.length > 0) {

        // MÉDIAS
        averageAqi = aqiValues.length ? Math.round(aqiValues.reduce((s, r) => s + r, 0) / aqiValues.length) : '--';
        peakCo2 = co2Values.length ? `${Math.max(...co2Values).toFixed(0)} ppm` : '--';
        averageVocs = vocsValues.length ? `${Math.round(vocsValues.reduce((s, r) => s + r, 0) / vocsValues.length)} ppb` : '--';
        averageTemperature = tempValues.length ? `${(tempValues.reduce((s, r) => s + r, 0) / tempValues.length).toFixed(1)} °C` : '--';
        averageHumidity = humidValues.length ? `${Math.round(humidValues.reduce((s, r) => s + r, 0) / humidValues.length)} %` : '--';

        // MEDIANA
        const med = calculateMedian(tempValues);
        if (med != null) medianTemperature = med.toFixed(1) + ' °C';

        // DESVIO PADRÃO
        const sd = calculateStdDev(tempValues);
        if (sd != null) stdDevTemp = sd.toFixed(2) + ' °C';

        // AMPLITUDE
        if (tempValues.length > 0) {
            const minT = Math.min(...tempValues);
            const maxT = Math.max(...tempValues);
            rangeTemp = (maxT - minT).toFixed(1) + ' °C';
        }

        // PERCENTIS
        const p90 = calculatePercentile(tempValues, 90);
        const p95 = calculatePercentile(tempValues, 95);

        percentile90Temp = p90 != null ? p90.toFixed(1) + ' °C' : '--';
        percentile95Temp = p95 != null ? p95.toFixed(1) + ' °C' : '--';
    }

    // ------------------------------------------------------------
    // LAYOUT COMPLETO
    // ------------------------------------------------------------
    return (
        <Container fluid className="py-4 px-3">
            <Row className="justify-content-center">
                <Col xs={12} xl={10}>

                    {/* TÍTULO */}
                    <div className="mb-4">
                        <h1 className="display-6 fw-bold text-primary mb-2">
                            <ClockHistory className="me-3" size={40} />
                            Histórico de Dados
                        </h1>
                        <p className="text-muted">Analise estatísticas e registros ambientais.</p>
                    </div>

                    {loading && <div className="text-muted mb-2">Carregando...</div>}
                    {error && <div className="text-danger mb-2">{error}</div>}


                    {/* ==================================================== */}
                    {/* LINHA 1 — MÉTRICAS PRINCIPAIS */}
                    {/* ==================================================== */}
                    <Row className="g-4 mb-4">

                        <Col md={4}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted">Média de AQI ({filterLabel})</h6>
                                    <h2 className="fw-bold display-6">{averageAqi}</h2>
                                    {getAqiBadge(averageAqi)}
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted">Pico de CO₂ ({filterLabel})</h6>
                                    <h2 className="fw-bold display-6">{peakCo2}</h2>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted">Média de VOCs ({filterLabel})</h6>
                                    <h2 className="fw-bold display-6">{averageVocs}</h2>
                                </Card.Body>
                            </Card>
                        </Col>

                    </Row>


                    {/* ==================================================== */}
                    {/* LINHA 2 — ESTATÍSTICAS DE TEMPERATURA */}
                    {/* ==================================================== */}
                    <Row className="g-4 mb-4">

                        <Col md={2}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <small className="text-muted">Mediana</small>
                                    <h3 className="fw-bold mt-2">{medianTemperature}</h3>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={2}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <small className="text-muted">Desvio Padrão</small>
                                    <h3 className="fw-bold mt-2">{stdDevTemp}</h3>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={2}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <small className="text-muted">Amplitude</small>
                                    <h3 className="fw-bold mt-2">{rangeTemp}</h3>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <small className="text-muted">Percentil 90</small>
                                    <h3 className="fw-bold mt-2">{percentile90Temp}</h3>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <small className="text-muted">Percentil 95</small>
                                    <h3 className="fw-bold mt-2">{percentile95Temp}</h3>
                                </Card.Body>
                            </Card>
                        </Col>

                    </Row>


                    {/* ==================================================== */}
                    {/* LINHA 3 — TEMPERATURA E UMIDADE MÉDIAS */}
                    {/* ==================================================== */}
                    <Row className="g-4 mb-4">

                        <Col md={6}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted">Temperatura Média ({filterLabel})</h6>
                                    <h2 className="fw-bold display-5">{averageTemperature}</h2>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6}>
                            <Card className="text-center shadow-sm border-0 h-100">
                                <Card.Body>
                                    <h6 className="text-muted">Umidade Média ({filterLabel})</h6>
                                    <h2 className="fw-bold display-5">{averageHumidity}</h2>
                                </Card.Body>
                            </Card>
                        </Col>

                    </Row>


                    {/* ==================================================== */}
                    {/* TABELA DE REGISTROS */}
                    {/* ==================================================== */}
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                            <h5 className="fw-semibold mb-0">Registros Detalhados</h5>

                            <div>
                                <Button
                                    size="sm"
                                    className="me-2"
                                    variant={filter === 'today' ? 'primary' : 'outline-secondary'}
                                    onClick={() => setFilter('today')}
                                >
                                    Hoje
                                </Button>
                                <Button
                                    size="sm"
                                    className="me-2"
                                    variant={filter === '7d' ? 'primary' : 'outline-secondary'}
                                    onClick={() => setFilter('7d')}
                                >
                                    Últimos 7 dias
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filter === '30d' ? 'primary' : 'outline-secondary'}
                                    onClick={() => setFilter('30d')}
                                >
                                    Últimos 30 dias
                                </Button>
                            </div>
                        </Card.Header>

                        <div className="px-3 mt-2 d-flex justify-content-between">
                            <small className="text-muted">Filtrando: <strong>{filterLabel}</strong></small>
                            <small className="text-muted">Registros: <strong>{filteredData.length}</strong></small>
                        </div>

                        <Card.Body>
                            {filteredData.length === 0 ? (
                                <p className="text-center text-muted m-4">Nenhum registro encontrado.</p>
                            ) : (
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
                            )}
                        </Card.Body>
                    </Card>

                </Col>
            </Row>
        </Container>
    );
};

export default Historico;
