import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { Wind, Activity, Thermometer, Droplet, CloudHaze } from 'react-bootstrap-icons';
import api from '../src/services/api'; 
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import AqiGaugeChart from '../components/AqiGaugeChart';

// --- (Dados de exemplo e funções auxiliares - sem alterações) ---
const lineChartData = [
  { time: '18:00', aqi: 35 }, { time: '19:00', aqi: 45 }, { time: '20:00', aqi: 50 },
  { time: '21:00', aqi: 48 }, { time: '22:00', aqi: 60 }, { time: '23:00', aqi: 55 },
];
const processPieData = (data) => {
    const co2Value = parseFloat(data.co2) || 0;
    const vocsValue = parseFloat(data.vocs) || 0;
    const noxValue = parseFloat(data.nox) || 0;
    return [{ name: 'CO₂', value: co2Value }, { name: 'VOCs', value: vocsValue }, { name: 'NOx', value: noxValue }];
};
const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const Dashboard = () => {
  const [airQualityData, setAirQualityData] = useState({
    aqi: '55', co2: '450 ppm', vocs: '120 ppb', nox: '0.05 ppm', temperature: '-- °C', humidity: '-- %', lastUpdate: ''
  });

  // ... (useEffect para buscar dados - sem alterações)
  useEffect(() => {
    const fetchSensorData = async () => {
  try {
    const response = await api.get('/sensor/latest'); 
    setAirQualityData({
      aqi: response.data.aqi.toString(),
      co2: `${response.data.co2} ppm`,
      temperature: response.data.temperature !== undefined ? `${response.data.temperature} °C` : '-- °C',
      humidity: response.data.humidity !== undefined ? `${response.data.humidity} %` : '-- %',
      vocs: `${response.data.vocs} ppb`,
      nox: `${response.data.nox} ppm`,
      lastUpdate: new Date(response.data.createdAt).toLocaleTimeString('pt-BR')
    });
  } catch (error) {
    console.error('Erro ao buscar dados do sensor:', error);
    // ...
  }
};
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const pieChartData = processPieData(airQualityData);

  return (
    <Container fluid className="py-4 px-3">
      <Row className="justify-content-center">
        <Col xs={12} xl={10}>
          {/* --- Título da Página --- */}
          <div className="mb-4">
            <h1 className="display-6 fw-bold text-primary mb-2"><Wind className="me-3" size={40} />Qualidade do Ar</h1>
            <p className="text-muted mb-0">Monitoramento em tempo real • Última atualização: {airQualityData.lastUpdate}</p>
          </div>

          {/* =============================================== */}
          {/* ========= NOVA ESTRUTURA DE LAYOUT ========== */}
          {/* =============================================== */}
          
          {/* --- LINHA SUPERIOR COM GRÁFICOS DE RESUMO --- */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-light border-0">
                  <h5 className="mb-0 fw-semibold text-center">Índice de Qualidade do Ar (AQI)</h5>
                </Card.Header>
                <Card.Body className="d-flex align-items-center justify-content-center">
                  <AqiGaugeChart value={parseInt(airQualityData.aqi, 10)} />
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-light border-0">
                  <h5 className="mb-0 fw-semibold text-center">Composição de Poluentes</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                        {pieChartData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} /> ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* --- LINHA INFERIOR COM GRÁFICO DE TENDÊNCIA E CARDS DE MEDIDORES --- */}
          <Row className="g-4">
            <Col lg={8}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-primary bg-opacity-10 border-0">
                  <h5 className="mb-0 text-primary fw-semibold"><Activity className="me-2" />Tendência Diária do AQI</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="aqi" name="AQI" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>

      <Col lg={4}>
        <div className="d-flex flex-column justify-content-between h-100">
          {/* Temperatura e Umidade - colocadas acima dos outros valores */}
          <div className="d-flex gap-3 mb-3">
            <Card className="flex-fill shadow-sm border-0">
              <Card.Body className="d-flex flex-column justify-content-center p-3 text-center">
                <div><Thermometer className="text-danger" size={20} /><h6 className="mb-0 fw-semibold d-inline-block ms-2">Temperatura</h6></div>
                <h4 className="mb-0 fw-bold mt-2">{airQualityData.temperature}</h4>
              </Card.Body>
            </Card>

            <Card className="flex-fill shadow-sm border-0">
              <Card.Body className="d-flex flex-column justify-content-center p-3 text-center">
                <div><Droplet className="text-primary" size={20} /><h6 className="mb-0 fw-semibold d-inline-block ms-2">Umidade</h6></div>
                <h4 className="mb-0 fw-bold mt-2">{airQualityData.humidity}</h4>
              </Card.Body>
            </Card>
          </div>

          <Card className="shadow-sm border-0 flex-grow-1">
            <Card.Body className="d-flex flex-column justify-content-center p-4">
              <div><CloudHaze className="text-secondary" size={24} /><h6 className="mb-0 fw-semibold d-inline-block ms-2">Dióxido de Carbono (CO₂)</h6></div>
              <h3 className="mb-0 fw-bold mt-3">{airQualityData.co2}</h3>
            </Card.Body>
          </Card>
          <div className="my-2"></div> {/* Espaçador */}
          <Card className="shadow-sm border-0 flex-grow-1">
            <Card.Body className="d-flex flex-column justify-content-center p-4">
              <div><Droplet className="text-warning" size={24} /><h6 className="mb-0 fw-semibold d-inline-block ms-2">Compostos Orgânicos (VOCs)</h6></div>
              <h3 className="mb-0 fw-bold mt-3">{airQualityData.vocs}</h3>
            </Card.Body>
          </Card>
           <div className="my-2"></div> {/* Espaçador */}
          <Card className="shadow-sm border-0 flex-grow-1">
             <Card.Body className="d-flex flex-column justify-content-center p-4">
              <div><CloudHaze className="text-danger" size={24} /><h6 className="mb-0 fw-semibold d-inline-block ms-2">NOx / Fumaça / Partículas</h6></div>
              <h3 className="mb-0 fw-bold mt-3">{airQualityData.nox}</h3>
            </Card.Body>
          </Card>
        </div>
      </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;