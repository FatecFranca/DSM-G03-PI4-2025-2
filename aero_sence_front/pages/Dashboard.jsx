import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { Wind, Activity, Thermometer, Droplet, CloudHaze } from 'react-bootstrap-icons';
import api from '../src/services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ScatterChart, Scatter, Area
} from 'recharts';
import AqiGaugeChart from '../components/AqiGaugeChart';

// Error Boundary de classe para capturar erros de renderização
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', fontWeight: 'bold', padding: 40, fontSize: 22, background: '#fff3f3', border: '2px solid #f00', borderRadius: 8 }}>
          Erro crítico de renderização no Dashboard:<br />
          {this.state.error && this.state.error.toString()}
          <br />
          <pre style={{ fontSize: 16, marginTop: 20 }}>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

// Função para processar médias reais dos poluentes dos últimos 7 dias
const processPieData = (history) => {
  if (!history || history.length === 0) return [
    { name: 'CO₂', value: 1 },
    { name: 'VOCs', value: 1 },
    { name: 'NOx', value: 1 }
  ];
  let sumCo2 = 0, sumVocsPpb = 0, sumNox = 0, count = 0;
  history.forEach(item => {
    sumCo2 += parseFloat(String(item.co2).replace(/[^0-9\.]/g, '')) || 0;
    sumVocsPpb += parseFloat(String(item.vocs).replace(/[^0-9\.]/g, '')) || 0;
    sumNox += parseFloat(String(item.nox).replace(/[^0-9eE\.-]/g, '')) || 0;
    count++;
  });
  const avgCo2 = sumCo2 / count;
  const avgVocs = (sumVocsPpb / count) / 1000;
  const avgNox = parseFloat((sumNox / count).toFixed(6));
  let total = avgCo2 + avgVocs + avgNox;
  let data = [
    { name: 'CO₂', value: avgCo2 },
    { name: 'VOCs', value: avgVocs },
    { name: 'NOx', value: avgNox }
  ];
  if (total === 0) total = 1;
  // Ajuste para garantir soma 100% mesmo com valores pequenos
  data = data.map(d => ({ ...d, percent: d.value / total }));
  // Corrigir arredondamento para garantir 100%
  let percSum = data.reduce((acc, d) => acc + Math.round(d.percent * 10000) / 100, 0);
  if (percSum !== 100) {
    // Ajustar o maior valor para compensar diferença
    let maxIdx = 0;
    data.forEach((d, i) => { if (d.percent > data[maxIdx].percent) maxIdx = i; });
    const diff = 100 - percSum;
    data[maxIdx].percent = Math.round((data[maxIdx].percent * 100 + diff)) / 100;
  }
  return data;
};

const Dashboard = () => {
  const [airQualityData, setAirQualityData] = useState({
    aqi: '55', co2: '450 ppm', vocs: '120 ppb', nox: '0.05 ppm', temperature: '-- °C', humidity: '-- %', lastUpdate: ''
  });
  const [co2History, setCo2History] = useState([]);
  const [co2Forecast, setCo2Forecast] = useState([]);
  const [forecastCI, setForecastCI] = useState([]);
  const [history7d, setHistory7d] = useState([]);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await api.get('/sensor/latest');
        if (!response.data || typeof response.data.aqi === 'undefined') {
          console.error('Dados de sensor inválidos:', response.data);
          return;
        }
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
      }
    };

    const fetchHistory = async () => {
      try {
        const response = await api.get('/sensor/history');
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Histórico inválido:', response.data);
          return;
        }
        // Últimos 7 dias para análise real
        const now = Date.now();
        const cutoff = now - 7 * 24 * 60 * 60 * 1000;
        const history7d = response.data.filter(item => {
          if (!item.createdAt) return false;
          const ts = new Date(item.createdAt).getTime();
          return ts >= cutoff && ts <= now;
        });
        setHistory7d(history7d);

        // Gráfico de tendência de CO₂ (últimas 24h - dados reais, sem agregação)
        const startWindow = now - 24 * 60 * 60 * 1000;
        const last24h = response.data.filter(item => {
          if (!item.createdAt) return false;
          const ts = new Date(item.createdAt).getTime();
          return ts >= startWindow && ts <= now;
        });
        last24h.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const chartData = last24h.map(item => ({
          ts: item.createdAt ? new Date(item.createdAt).getTime() : 0,
          co2: typeof item.co2 === 'number' ? item.co2 : 0,
        })).filter(d => d.ts && !isNaN(d.ts));
        setCo2History(chartData);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      }
    };

    const fetchForecast = async () => {
      try {
        const response = await api.get('/sensor/forecast-co2');
        if (response.data && Array.isArray(response.data.forecast) && Array.isArray(response.data.ci)) {
          setCo2Forecast(response.data.forecast);
          setForecastCI(response.data.ci);
        } else {
          setCo2Forecast([]);
          setForecastCI([]);
        }
      } catch (error) {
        console.error('Erro ao buscar previsão de CO₂:', error);
        setCo2Forecast([]);
        setForecastCI([]);
      }
    };

    fetchSensorData();
    fetchHistory();
    fetchForecast();
    const interval = setInterval(() => {
      fetchSensorData();
      fetchHistory();
      fetchForecast();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Dados para gráficos ---
  const pieChartData = processPieData(history7d);
  const isValidForecast = co2Forecast && co2Forecast.length > 0;
  const isValidCI = forecastCI && forecastCI.length > 0;

  return (
    <DashboardErrorBoundary>
      <Container fluid className="py-4 px-3">
        <Row className="justify-content-center">
          <Col xs={12} xl={10}>
            {/* --- Título da Página --- */}
            <div className="mb-4">
              <h1 className="display-6 fw-bold text-primary mb-2"><Wind className="me-3" size={40} />Qualidade do Ar</h1>
              <p className="text-muted mb-0">Monitoramento em tempo real • Última atualização: {airQualityData.lastUpdate}</p>
            </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ResponsiveContainer width={220} height={200}>
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={2}
                            dataKey="value"
                            label={false}
                            labelLine={false}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value ? value.toFixed(2) : '--'}`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pieChartData.map((entry, index) => (
                          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 16, height: 16, background: PIE_COLORS[index % PIE_COLORS.length], display: 'inline-block', borderRadius: 4 }}></span>
                            <span style={{ fontWeight: 600 }}>{entry.name}</span>
                            <span style={{ color: '#444', fontWeight: 500 }}>{(entry.percent * 100).toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            {/* --- LINHA INFERIOR COM GRÁFICO DE TENDÊNCIA E CARDS DE MEDIDORES --- */}
            <Row className="g-4">
              <Col lg={8}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Header className="bg-success bg-opacity-10 border-0">
                    <h5 className="mb-0 text-primary fw-semibold"><Activity className="me-2" />Previsão de CO₂ para as próximas 24h</h5>
                    <div className="text-muted small mb-2">Intervalo de confiança 99% • Projeção baseada em regressão linear</div>
                  </Card.Header>
                  <Card.Body className="p-4">
                    {isValidForecast ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="ts"
                            type="number"
                            scale="time"
                            domain={['dataMin', 'dataMax']}
                            ticks={co2Forecast.map(d => d.ts)}
                            tickFormatter={(value) => {
                              const d = new Date(value);
                              return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            }}
                          />
                          <YAxis label={{ value: 'ppm', angle: -90, position: 'insideLeft' }} />
                          <Tooltip
                            labelFormatter={(ts) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            formatter={(value, name, props) => {
                              if (name !== 'Previsão CO₂ (próximas 24h)' && name !== 'co2') {
                                // ignora séries auxiliares no conteúdo, mas deixa o horário
                                return null;
                              }

                              if (typeof value === 'number' && value < 0) value = 0;

                              // Encontrar o intervalo correspondente (upper/lower) para este timestamp
                              const ts = props && props.payload && props.payload.ts;
                              let intervalo = null;
                              if (ts && forecastCI && forecastCI.length) {
                                const ponto = forecastCI.find(p => p.ts === ts);
                                if (ponto && typeof ponto.upper === 'number' && typeof ponto.lower === 'number') {
                                  const mid = (ponto.upper + ponto.lower) / 2;
                                  intervalo = Math.abs(ponto.upper - mid);
                                }
                              }

                              const base = `${Number(value).toFixed(2)} ppm`;
                              if (intervalo !== null) {
                                return [`${base} ± ${intervalo.toFixed(2)} ppm`, 'Previsão CO₂ (99% IC)'];
                              }
                              return [base, 'Previsão CO₂'];
                            }}
                          />
                          {/* Faixa de IC 99% */}
                          {isValidCI && (
                            <Area
                              type="monotone"
                              dataKey="upper"
                              data={forecastCI.map(d => ({ ...d, upper: d.upper }))}
                              fill="#0d6efd"
                              fillOpacity={0.12}
                              isAnimationActive={false}
                            />
                          )}
                          <Line type="monotone" dataKey="co2" name="Previsão CO₂ (próximas 24h)" stroke="#0d6efd" strokeDasharray="6 4" dot={{ r: 5 }} data={co2Forecast} />
                          <Legend formatter={(value) => {
                            if (value === 'Previsão CO₂ (próximas 24h)') return 'Previsão CO₂ (próximas 24h)';
                            return value;
                          }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>
                        Dados insuficientes para previsão de CO₂ nas próximas 24h.
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <div className="d-flex flex-column justify-content-between h-100">
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
                  <div className="my-2"></div>
                  <Card className="shadow-sm border-0 flex-grow-1">
                    <Card.Body className="d-flex flex-column justify-content-center p-4">
                      <div><Droplet className="text-warning" size={24} /><h6 className="mb-0 fw-semibold d-inline-block ms-2">Compostos Orgânicos (VOCs)</h6></div>
                      <h3 className="mb-0 fw-bold mt-3">{airQualityData.vocs}</h3>
                    </Card.Body>
                  </Card>
                  <div className="my-2"></div>
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
              <Col lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-success bg-opacity-10 border-0">
                    <h6 className="mb-0 fw-semibold text-success">Evolução de CO₂ (24 horas)</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={co2History}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="ts"
                          type="number"
                          scale="time"
                          domain={['dataMin', 'dataMax']}
                          tickFormatter={(ts) => {
                            const d = new Date(ts);
                            return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          }}
                          minTickGap={30}
                          label={{ value: 'Horário (últimas 24h)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis label={{ value: 'CO₂ (ppm)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                          labelFormatter={(ts) => new Date(ts).toLocaleString('pt-BR')}
                          formatter={(value) => [value.toFixed(2) + ' ppm', 'CO₂']}
                        />
                        <Line type="monotone" dataKey="co2" stroke="#4caf50" strokeWidth={2} name="CO₂ (24h)" dot={{ r: 3 }} />
                        <Legend formatter={() => 'CO₂ (24h)'} />
                      </LineChart>
                    </ResponsiveContainer>
                    <small className="text-muted d-block mt-2">
                      <strong>Interpretação:</strong> Acompanhe as variações de CO₂ ao longo das últimas 24 horas. Valores acima de 1000 ppm indicam necessidade de ventilação.
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-danger bg-opacity-10 border-0">
                    <h6 className="mb-0 fw-semibold text-danger">Distribuição de Temperatura</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={[
                        { faixa: '<28°C', qtd: 25 },
                        { faixa: '28-29°C', qtd: 68 },
                        { faixa: '29-30°C', qtd: 142 },
                        { faixa: '30-31°C', qtd: 89 },
                        { faixa: '>31°C', qtd: 42 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="faixa" label={{ value: 'Faixa de Temperatura', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Frequência', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="qtd" name="Leituras" fill="#0d6efd" />
                      </BarChart>
                    </ResponsiveContainer>
                    <small className="text-muted d-block mt-2">
                      <strong>Interpretação:</strong> Faixa confortável: 18-26°C.
                      Maior concentração entre 29-30°C indica ambiente quente.
                    </small>
                  </Card.Body>
                </Card>
              </Col>
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
                            { temp: 28.5, hum: 48 }, { temp: 28.8, hum: 47 }, { temp: 29, hum: 46 }, { temp: 29.2, hum: 45.5 }, { temp: 29.5, hum: 45 }, { temp: 29.8, hum: 44 },
                            { temp: 30, hum: 43 }, { temp: 30.3, hum: 42.5 }, { temp: 30.5, hum: 42 }, { temp: 30.6, hum: 42.2 }, { temp: 30.8, hum: 41.5 },
                            { temp: 31, hum: 41 }, { temp: 31.2, hum: 40.5 }, { temp: 31.5, hum: 40 }, { temp: 32, hum: 38 }
                          ].sort((a, b) => a.temp - b.temp)}
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
              <Col lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-info bg-opacity-10 border-0">
                    <h6 className="mb-0 fw-semibold text-info">Distribuição de Umidade</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={[
                        { faixa: '<30%', qtd: 8 },
                        { faixa: '30-40%', qtd: 45 },
                        { faixa: '40-50%', qtd: 178 },
                        { faixa: '50-60%', qtd: 98 },
                        { faixa: '>60%', qtd: 37 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="faixa" label={{ value: 'Faixa de Umidade', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Frequência', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="qtd" name="Leituras" fill="#0d6efd" />
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
    </DashboardErrorBoundary>
  );
};

export default Dashboard;




