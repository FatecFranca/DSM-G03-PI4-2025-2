import React, { useState, useEffect } from 'react';
import {
  Card,
  Container,
  Row,
  Col,
  Badge,
  ProgressBar
} from 'react-bootstrap';
import {
  CloudFog,
  Wind,
  Thermometer,
  Droplet,
  Activity
} from 'react-bootstrap-icons';
import axios from 'axios';

const Dashboard = () => {
  const [airQualityData, setAirQualityData] = useState({
    aqi: '',
    pm25: '',
    pm10: '',
    co2: '',
    nh3: '',
    benzeno: '',
    alcool: '',
    etanol: '',
    nox: '',
    fumaca: '',
    humidity: '',
    lastUpdate: ''
  });

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await axios.get('/api/sensor'); // ajuste a URL conforme sua API
        setAirQualityData({
          ...response.data,
          lastUpdate: new Date().toLocaleTimeString('pt-BR')
        });
      } catch (error) {
        // Trate erro de conexão ou resposta
        console.error('Erro ao buscar dados do sensor:', error);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return { text: 'Boa', color: 'success', bg: 'success' };
    if (aqi <= 100) return { text: 'Moderada', color: 'warning', bg: 'warning' };
    if (aqi <= 150) return { text: 'Insalubre para grupos sensíveis', color: 'danger', bg: 'danger' };
    return { text: 'Insalubre', color: 'dark', bg: 'dark' };
  };

  const getPM25Status = (pm25) => {
    if (pm25 <= 12) return { color: 'success', trend: 'down' };
    if (pm25 <= 35) return { color: 'warning', trend: 'stable' };
    return { color: 'danger', trend: 'up' };
  };

  const aqiStatus = getAQIStatus(airQualityData.aqi);
  const pm25Status = getPM25Status(parseFloat(airQualityData.pm25));

  return (
    <Container fluid className="py-4 px-3">
      <Row className="justify-content-center">
        <Col xs={12} xl={10}>
          <div className="mb-4">
            <h1 className="display-6 fw-bold text-primary mb-2">
              <Wind className="me-3" size={40} />
              Qualidade do Ar
            </h1>
            <p className="text-muted mb-0">
              Monitoramento em tempo real • Última atualização: {airQualityData.lastUpdate}
            </p>
          </div>
          <Row className="g-4">
            <Col xs={12} lg={8}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-primary bg-opacity-10 border-0">
                  <div className="d-flex align-items-center justify-content-between">
                    <h5 className="mb-0 text-primary fw-semibold">
                      <Activity className="me-2" />
                      Tendência da Qualidade do Ar
                    </h5>
                    <Badge bg={aqiStatus.bg} className="px-3 py-2">
                      AQI: {airQualityData.aqi} - {aqiStatus.text}
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="position-relative" style={{ height: '300px' }}>
                    <div className="d-flex align-items-end justify-content-around h-100 border-bottom border-2">
                      {/* Gráfico zerado */}
                      {Array.from({ length: 12 }).map((_, index) => (
                        <div
                          key={index}
                          className="bg-primary bg-opacity-75 rounded-top"
                          style={{
                            width: '6%',
                            height: `0%`,
                            minHeight: '2px',
                            transition: 'all 0.3s ease'
                          }}
                          title={`Hora ${index + 1}: AQI 0`}
                        ></div>
                      ))}
                    </div>
                    <div className="d-flex justify-content-around mt-2">
                      {['00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'].map((time, index) => (
                        <small key={index} className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {time}
                        </small>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-light rounded">
                    <div className="row text-center">
                      <div className="col-3">
                        <div className="text-success fw-bold">0-50</div>
                        <small className="text-muted">Boa</small>
                      </div>
                      <div className="col-3">
                        <div className="text-warning fw-bold">51-100</div>
                        <small className="text-muted">Moderada</small>
                      </div>
                      <div className="col-3">
                        <div className="text-danger fw-bold">101-150</div>
                        <small className="text-muted">Insalubre</small>
                      </div>
                      <div className="col-3">
                        <div className="text-dark fw-bold">151+</div>
                        <small className="text-muted">Perigosa</small>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} lg={4}>
              <Row className="g-4">
                {/* Amônia (NH3) */}
                <Col xs={12} sm={6} lg={12}>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="p-2 rounded-circle bg-success bg-opacity-10 me-3">
                            <CloudFog className="text-success" size={24} />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold">Amônia (NH₃)</h6>
                            <small className="text-muted">10 a 300 ppm</small>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-0 fw-bold">{airQualityData.nh3}</h3>
                        <small className="text-muted">ppm</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                {/* Benzeno (C6H6) */}
                <Col xs={12} sm={6} lg={12}>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="p-2 rounded-circle bg-warning bg-opacity-10 me-3">
                            <CloudFog className="text-warning" size={24} />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold">Benzeno (C₆H₆)</h6>
                            <small className="text-muted">10 a 1000 ppm</small>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-0 fw-bold">{airQualityData.benzeno}</h3>
                        <small className="text-muted">ppm</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                {/* Álcool e Etanol */}
                <Col xs={12} sm={6} lg={12}>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="p-2 rounded-circle bg-info bg-opacity-10 me-3">
                            <CloudFog className="text-info" size={24} />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold">Álcool / Etanol</h6>
                            <small className="text-muted">Detecção presente</small>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-0 fw-bold">{airQualityData.alcool}</h3>
                        <small className="text-muted">Álcool</small>
                        <br />
                        <h3 className="mb-0 fw-bold">{airQualityData.etanol}</h3>
                        <small className="text-muted">Etanol</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                {/* Óxido Nítrico (NOx) */}
                <Col xs={12} sm={6} lg={12}>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="p-2 rounded-circle bg-primary bg-opacity-10 me-3">
                            <CloudFog className="text-primary" size={24} />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold">Óxido Nítrico (NOx)</h6>
                            <small className="text-muted">Detecção presente</small>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-0 fw-bold">{airQualityData.nox}</h3>
                        <small className="text-muted">ppm</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                {/* Dióxido de Carbono (CO2) */}
                <Col xs={12} sm={6} lg={12}>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="p-2 rounded-circle bg-secondary bg-opacity-10 me-3">
                            <CloudFog className="text-secondary" size={24} />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold">Dióxido de Carbono (CO₂)</h6>
                            <small className="text-muted">Detecção presente</small>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-0 fw-bold">{airQualityData.co2}</h3>
                        <small className="text-muted">ppm</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                {/* Fumaça */}
                <Col xs={12} sm={6} lg={12}>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="p-2 rounded-circle bg-dark bg-opacity-10 me-3">
                            <CloudFog className="text-dark" size={24} />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold">Fumaça</h6>
                            <small className="text-muted">Detecção presente</small>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-0 fw-bold">{airQualityData.fumaca}</h3>
                        <small className="text-muted">ppm</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
