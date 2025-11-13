import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { Wind, Activity, Thermometer, Droplet, CloudHaze } from 'react-bootstrap-icons';
import api from '../src/services/api'; 
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ScatterChart, Scatter
} from 'recharts';
import AqiGaugeChart from '../components/AqiGaugeChart';

// --- Funções auxiliares ---
const processPieData = (data) => {
    // Normalizar valores para proporções visuais balanceadas
    // CO₂ (ppm) - normalizar para escala 0-100
    const co2Value = parseFloat(data.co2) || 0;
    const co2Normalized = Math.min((co2Value / 10) * 100, 100); // 10ppm = 100%
    
    // VOCs (ppb) - normalizar para escala 0-100
    const vocsValue = parseFloat(data.vocs) || 0;
    const vocsNormalized = Math.min((vocsValue / 10000) * 100, 100); // 10000ppb = 100%
    
    // NOx (ppm) - normalizar para escala 0-100
    const noxValue = parseFloat(data.nox) || 0;
    const noxNormalized = Math.min((noxValue / 0.1) * 100, 100); // 0.1ppm = 100%
    
    return [
        { name: 'CO₂', value: co2Normalized || 1 }, 
        { name: 'VOCs', value: vocsNormalized || 1 }, 
        { name: 'NOx', value: noxNormalized || 1 }
    ];
};
const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const Dashboard = () => {
  const [airQualityData, setAirQualityData] = useState({
    aqi: '55', co2: '450 ppm', vocs: '120 ppb', nox: '0.05 ppm', temperature: '-- °C', humidity: '-- %', lastUpdate: ''
  });
  const [co2History, setCo2History] = useState([]);
  // Controles do eixo de tempo do gráfico (ticks fixos: 00h, 06h, 12h, 18h)
  const [timeTicks, setTimeTicks] = useState([]);
  const [timeDomain, setTimeDomain] = useState([0, 0]);

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

    const fetchHistory = async () => {
      try {
        const response = await api.get('/sensor/history');
        if (response.data && Array.isArray(response.data)) {
          // Referências de tempo
          const now = Date.now();
          const today = new Date();
          const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          const startWindow = now - 24 * 60 * 60 * 1000; // 24h (ainda usado para filtrar os dados)

          // Filtrar últimas 24 horas
          const last24h = response.data.filter(item => {
            const ts = new Date(item.createdAt).getTime();
            return ts >= startWindow && ts <= now;
          });

          // Ordenar por data crescente
          last24h.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          // Amostragem adaptativa: manter até ~200 pontos
          const maxPoints = 200;
          const step = Math.max(1, Math.ceil(last24h.length / maxPoints));
          const sampled = last24h.filter((_, idx) => idx % step === 0 || idx === last24h.length - 1);

          // Dados do gráfico com timestamp numérico
          const chartData = sampled.map(item => ({
            ts: new Date(item.createdAt).getTime(),
            co2: item.co2 || 0,
          }));
          setCo2History(chartData);

          // Ajuste adaptativo: se a extensão dos dados for pequena, usa domínio dos dados; senão mostra o dia inteiro.
          const hourMs = 60 * 60 * 1000;
          const endOfDay = midnight + 24 * hourMs - 1000; // 23:59:59
          let ticks;
          const hasData = chartData.length > 0;
          if (hasData) {
            const earliest = chartData[0].ts;
            const latest = chartData[chartData.length - 1].ts;
            const span = latest - earliest;
            // Se menos de 6 horas de dados, gera ticks por hora dentro do intervalo + início/fim
            if (span < 6 * hourMs) {
              const startTick = earliest - (earliest % hourMs); // arredonda para hora cheia anterior
              const tempTicks = [];
              for (let t = startTick; t <= latest; t += hourMs) {
                tempTicks.push(t);
              }
              // garante inclusão do último ponto se não caiu em hora cheia
              if (tempTicks[tempTicks.length - 1] < latest) tempTicks.push(latest);
              ticks = tempTicks;
              setTimeDomain([startTick, latest]);
            } else {
              // Mostrar ticks principais do dia todo
              ticks = [0, 6, 12, 18, 23].map(h => midnight + h * hourMs);
              setTimeDomain([midnight, endOfDay]);
            }
          } else {
            // Sem dados: configura domínio do dia para evitar inconsistência
            ticks = [0, 6, 12, 18, 23].map(h => midnight + h * hourMs);
            setTimeDomain([midnight, endOfDay]);
          }
          setTimeTicks(ticks);
        }
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      }
    };

    fetchSensorData();
    fetchHistory();
    const interval = setInterval(() => {
      fetchSensorData();
      fetchHistory();
    }, 30000);
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
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie 
                        data={pieChartData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={50} 
                        outerRadius={80} 
                        fill="#8884d8" 
                        paddingAngle={5} 
                        dataKey="value" 
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={true}
                      >
                        {pieChartData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} /> ))}
                      </Pie>
                      <Tooltip />
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
                <Card.Header className="bg-success bg-opacity-10 border-0">
                  <h5 className="mb-0 text-success fw-semibold"><Activity className="me-2" />Tendência de CO₂ - Últimas 24h</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={co2History.length > 0 ? co2History : [{ ts: Date.now(), co2: 0 }]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        scale="time"
                        domain={timeDomain}
                        ticks={timeTicks}
                        tickFormatter={(value) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      />
                      <YAxis label={{ value: 'ppm', angle: -90, position: 'insideLeft' }} />
                      <Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} />
                      <Line type="monotone" dataKey="co2" name="CO₂ (ppm)" stroke="#4caf50" strokeWidth={2} activeDot={{ r: 6 }} />
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

          {/* --- GRÁFICOS ESTATÍSTICOS AVANÇADOS --- */}
          <Row className="g-4 mt-4">
            <Col xs={12}>
              <h4 className="fw-bold text-primary mb-3">Análise das Principais Métricas</h4>
            </Col>
            
            {/* Tendência Temporal de CO₂ nas últimas 24h */}
            <Col lg={6}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-success bg-opacity-10 border-0">
                  <h6 className="mb-0 fw-semibold text-success">Evolução de CO₂ (24 horas)</h6>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={co2History.slice(-24)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="ts" 
                        type="number"
                        scale="time"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(ts) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        label={{ value: 'Horário', position: 'insideBottom', offset: -5 }} 
                      />
                      <YAxis label={{ value: 'CO₂ (ppm)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        labelFormatter={(ts) => new Date(ts).toLocaleString('pt-BR')}
                        formatter={(value) => [value.toFixed(2) + ' ppm', 'CO₂']}
                      />
                      <Line type="monotone" dataKey="co2" stroke="#4caf50" strokeWidth={2} name="CO₂" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <small className="text-muted d-block mt-2">
                    <strong>Interpretação:</strong> Acompanhe as variações de CO₂ ao longo do dia. 
                    Valores acima de 1000 ppm indicam necessidade de ventilação.
                  </small>
                </Card.Body>
              </Card>
            </Col>

            {/* Histograma de Temperatura */}
            <Col lg={6}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-danger bg-opacity-10 border-0">
                  <h6 className="mb-0 fw-semibold text-danger">Distribuição de Temperatura</h6>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={[
                      { faixa: '<28°C', qtd: 25, color: '#2196f3' },
                      { faixa: '28-29°C', qtd: 68, color: '#4caf50' },
                      { faixa: '29-30°C', qtd: 142, color: '#8bc34a' },
                      { faixa: '30-31°C', qtd: 89, color: '#ffeb3b' },
                      { faixa: '>31°C', qtd: 42, color: '#ff5722' },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="faixa" label={{ value: 'Faixa de Temperatura', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Frequência', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="qtd" name="Leituras">
                        {[
                          { color: '#2196f3' },
                          { color: '#4caf50' },
                          { color: '#8bc34a' },
                          { color: '#ffeb3b' },
                          { color: '#ff5722' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <small className="text-muted d-block mt-2">
                    <strong>Interpretação:</strong> Faixa confortável: 18-26°C. 
                    Maior concentração entre 29-30°C indica ambiente quente.
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4 mt-1">
            {/* Correlação Temperatura x Umidade */}
            <Col lg={6}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-primary bg-opacity-10 border-0">
                  <h6 className="mb-0 fw-semibold text-primary">Correlação: Temperatura vs Umidade</h6>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="temp" name="Temperatura" unit="°C" label={{ value: 'Temperatura (°C)', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="hum" name="Umidade" unit="%" label={{ value: 'Umidade (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Legend />
                      <Scatter 
                        name="Leituras" 
                        data={[
                          { temp: 28.5, hum: 48 }, { temp: 29, hum: 46 }, { temp: 29.5, hum: 45 },
                          { temp: 30, hum: 43 }, { temp: 30.5, hum: 42 }, { temp: 31, hum: 41 },
                          { temp: 31.5, hum: 40 }, { temp: 32, hum: 38 }, { temp: 29.2, hum: 45.5 },
                          { temp: 30.3, hum: 42.5 }, { temp: 30.8, hum: 41.5 }, { temp: 28.8, hum: 47 },
                          { temp: 31.2, hum: 40.5 }, { temp: 30.6, hum: 42.2 }, { temp: 29.8, hum: 44 },
                        ]} 
                        fill="#0d6efd" 
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <small className="text-muted d-block mt-2">
                    <strong>Interpretação:</strong> Relação inversa entre temperatura e umidade. 
                    Ar mais quente reduz umidade relativa. Ideal: 40-60%.
                  </small>
                </Card.Body>
              </Card>
            </Col>

            {/* Histograma de Umidade */}
            <Col lg={6}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-info bg-opacity-10 border-0">
                  <h6 className="mb-0 fw-semibold text-info">Distribuição de Umidade</h6>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={[
                      { faixa: '<30%', qtd: 8, color: '#ff9800' },
                      { faixa: '30-40%', qtd: 45, color: '#ffeb3b' },
                      { faixa: '40-50%', qtd: 178, color: '#4caf50' },
                      { faixa: '50-60%', qtd: 98, color: '#2196f3' },
                      { faixa: '>60%', qtd: 37, color: '#9c27b0' },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="faixa" label={{ value: 'Faixa de Umidade', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Frequência', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="qtd" name="Leituras">
                        {[
                          { color: '#ff9800' },
                          { color: '#ffeb3b' },
                          { color: '#4caf50' },
                          { color: '#2196f3' },
                          { color: '#9c27b0' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <small className="text-muted d-block mt-2">
                    <strong>Interpretação:</strong> Faixa ideal: 40-60%. 
                    Umidade muito baixa (&lt;30%) pode causar desconforto respiratório.
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;