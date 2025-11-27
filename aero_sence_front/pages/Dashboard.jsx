import React, { useState, useEffect, useMemo } from 'react';
import { Card, Container, Row, Col, Badge } from 'react-bootstrap';
// Importações ajustadas para usar ícones inline como fallback para "react-bootstrap-icons"
import { Wind, Activity, Thermometer, Droplet, CloudHaze, Clock, ArrowUpCircleFill, ArrowDownCircleFill } from 'react-bootstrap-icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ScatterChart, Scatter, Area
} from 'recharts';
import api from '../src/services/api';

// ==========================================================
// 1. COMPONENTES AUXILIARES
// ==========================================================

// AqiGaugeChart (simplificado como um círculo)
const AqiGaugeChart = ({ value }) => {
    let color, status;
    if (value <= 50) { color = '#198754'; status = 'Boa'; }
    else if (value <= 100) { color = '#ffc107'; status = 'Moderada'; }
    else if (value <= 150) { color = '#fd7e14'; status = 'Insalubre'; }
    else { color = '#dc3545'; status = 'Ruim'; }

    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ width: '100%', maxWidth: 200, height: 200, margin: '20px 0' }}>
            <div
                style={{
                    width: 150, height: 150, borderRadius: '50%',
                    backgroundColor: color, color: 'white',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '2.5rem', boxShadow: `0 0 15px ${color}`
                }}
            >
                {value}
            </div>
            <h5 className="mt-3" style={{ color: color }}>Qualidade: {status}</h5>
        </div>
    );
};

// ==========================================================
// 2. ERROR BOUNDARY E COMPONENTE PRINCIPAL
// ==========================================================

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

const Dashboard = () => {
  const [airQualityData, setAirQualityData] = useState({
    aqi: '55', co2: '450 ppm', vocs: '120 ppb', nox: '0.05 ppm', temperature: '-- °C', humidity: '-- %', pressure: '-- hPa', lastUpdate: ''
  });
  const [co2History, setCo2History] = useState([]);
  const [tempForecast, setTempForecast] = useState([]);
  const [forecastCI, setForecastCI] = useState([]);
  const [history7d, setHistory7d] = useState([]);

  const now = Date.now();

  // Função para processar médias reais dos poluentes - usa TODOS os dados do histórico
  const processPieData = (history) => {
    // SEMPRE usa history7d se disponível
    const allData = history7d.length > 0 ? history7d : (history || []);

    console.log('[Dashboard] processPieData chamado, history7d.length:', history7d.length);
    
    if (!allData || allData.length === 0) {
      console.warn('[Dashboard] Nenhum dado disponível para gráfico de pizza');
      return [
        { name: 'CO₂', value: 1, realValue: 0, percent: 0.33 },
        { name: 'VOCs', value: 1, realValue: 0, percent: 0.33 },
        { name: 'NOx', value: 1, realValue: 0, percent: 0.34 }
      ];
    }

    console.log('[Dashboard] Processando gráfico de pizza com', allData.length, 'registros históricos');
    console.log('[Dashboard] Amostra para pizza:', allData.slice(0, 2));

    let sumCo2 = 0, sumVocsPpb = 0, sumNox = 0, count = 0;
    allData.forEach(item => {
      // Converte diretamente para número, tratando null/undefined
      const co2Val = Number(item.co2) || 0;
      const vocsVal = Number(item.vocs) || 0;
      const noxVal = Number(item.nox) || 0;

      console.log('[Pizza] Item:', { co2: co2Val, vocs: vocsVal, nox: noxVal });

      if (co2Val > 0 || vocsVal > 0 || noxVal > 0) {
        sumCo2 += co2Val;
        sumVocsPpb += vocsVal;
        sumNox += noxVal;
        count++;
      }
    });

    console.log('[Pizza] Somas:', { sumCo2, sumVocsPpb, sumNox, count });

    if (count === 0) return [
      { name: 'CO₂', value: 1 },
      { name: 'VOCs', value: 1 },
      { name: 'NOx', value: 1 }
    ];

    const avgCo2 = sumCo2 / count;
    const avgVocs = sumVocsPpb / count;
    const avgNox = sumNox / count;

    // Normalização para exibição proporcional
    // CO2 está em ppm (400-2000), VOCs em ppb (50-2000), NOx em ppm (0.01-0.5)
    // Ajusta escalas para visualização proporcional
    const co2Normalized = avgCo2;
    const vocsNormalized = avgVocs * 2; // VOCs geralmente são 2x menores que CO2 em escala
    const noxNormalized = avgNox * 1000; // NOx está em escala muito menor

    let totalScaled = co2Normalized + vocsNormalized + noxNormalized;
    let data = [
      { name: 'CO₂', value: co2Normalized, realValue: avgCo2 },
      { name: 'VOCs', value: vocsNormalized, realValue: avgVocs },
      { name: 'NOx', value: noxNormalized, realValue: avgNox }
    ];

    if (totalScaled === 0) totalScaled = 1;

    data = data.map(d => ({ ...d, percent: d.value / totalScaled }));

    let percSum = data.reduce((acc, d) => acc + d.percent, 0);
    if (percSum > 0) {
      data = data.map(d => ({ ...d, percent: d.percent / percSum }));
    }

    console.log('[Dashboard] Composição calculada:', data.map(d => `${d.name}: ${(d.percent * 100).toFixed(1)}%`).join(', '));
    return data;
  };

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await api.get('/sensor/latest');
        console.debug('[Dashboard] /sensor/latest response:', response.data);
        if (!response.data || typeof response.data.aqi === 'undefined') {
          console.error('Dados de sensor inválidos:', response.data);
          return;
        }
        setAirQualityData({
          aqi: response.data.aqi.toString(),
          co2: `${response.data.co2} ppm`,
          temperature: response.data.temperature !== undefined ? `${response.data.temperature} °C` : '-- °C',
          humidity: response.data.humidity !== undefined ? `${response.data.humidity} %` : '-- %',
          pressure: response.data.pressure !== undefined ? `${response.data.pressure} hPa` : '-- hPa',
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
        
        console.log('[Dashboard] Histórico raw recebido:', response.data.length, 'registros');
        console.log('[Dashboard] Primeiro item:', response.data[0]);
        console.log('[Dashboard] Último item:', response.data[response.data.length - 1]);
        
        // Log das datas únicas para debug
        const uniqueDates = [...new Set(response.data.map(item => item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : null))];
        console.log('[Dashboard] Datas únicas no histórico:', uniqueDates);
        
        const allHistoricalData = response.data.filter(item => item.createdAt).map(item => ({
          ...item,
          temperature: item.temperature,
          humidity: item.humidity,
          co2: item.co2,
          vocs: item.vocs,
          nox: item.nox,
          aqi: item.aqi,
          createdAt: item.createdAt
        }));
        
        console.log('[Dashboard] Histórico processado:', allHistoricalData.length, 'registros');
        console.log('[Dashboard] Amostra dados:', allHistoricalData.slice(0, 3).map(d => ({ co2: d.co2, vocs: d.vocs, nox: d.nox })));
        
        setHistory7d(allHistoricalData);

        const startWindow = now - 24 * 60 * 60 * 1000;
        const last24h = allHistoricalData.filter(item => {
          if (!item.createdAt) return false;
          const ts = new Date(item.createdAt).getTime();
          return !isNaN(ts) && ts >= startWindow && ts <= now;
        });

        if (last24h.length > 0) {
          last24h.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const chartData = last24h.map(item => {
            const ts = new Date(item.createdAt).getTime();
            const co2 = typeof item.co2 === 'number' ? Math.max(0, item.co2) : 0;
            const aqi = typeof item.aqi === 'number' ? item.aqi : 0;
            return { ts, co2, aqi };
          }).filter(d => d.ts && !isNaN(d.ts) && !isNaN(d.co2));

          console.debug('[Dashboard] Dados CO2/AQI 24h processados:', chartData.length, 'pontos');
          setCo2History(chartData);
        } else {
          console.warn('[Dashboard] Nenhum dado válido encontrado nas últimas 24h');
          setCo2History([]);
        }
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      }
    };

    const fetchForecast = async () => {
      try {
        const response = await api.get('/sensor/forecast-temperature');
        console.debug('[Dashboard] /sensor/forecast-temperature response:', response.data);
        if (response.data && Array.isArray(response.data.forecast) && response.data.forecast.length > 0) {
          const validForecast = response.data.forecast.filter(item =>
            item && typeof item.ts === 'number' && typeof item.temperature === 'number' && !isNaN(item.temperature)
          );
          setTempForecast(validForecast);

          if (Array.isArray(response.data.ci) && response.data.ci.length > 0) {
            const validCI = response.data.ci.filter(item =>
              item && typeof item.ts === 'number' && typeof item.upper === 'number' && typeof item.lower === 'number' && !isNaN(item.upper) && !isNaN(item.lower)
            );
            setForecastCI(validCI);
          } else {
            setForecastCI([]);
          }
        } else {
          setTempForecast([]);
          setForecastCI([]);
        }
      } catch (error) {
        console.error('Erro ao buscar previsão de temperatura:', error);
        setTempForecast([]);
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
  const pieChartData = useMemo(() => {
    console.log('[Dashboard] Recalculando pieChartData, history7d.length:', history7d.length);
    return processPieData(history7d);
  }, [history7d]);
  
  const isHistoryAvailable = co2History && co2History.length > 0;
  const isValidForecast = tempForecast && tempForecast.length > 0;
  const isValidCI = forecastCI && forecastCI.length > 0;


  // Dados para o Gráfico de Correlação CO₂ vs Temperatura
  const co2TempCorrelationData = useMemo(() => {
    const allData = history7d;
    const correlationData = allData.map(item => {
      const co2 = parseFloat(String(item.co2 || '0').replace(/[^0-9\.]/g, '')) || 0;
      const temp = parseFloat(String(item.temperature || '0').replace(/[^0-9\.]/g, '')) || 0;
      return { co2, temp };
    }).filter(d => d.co2 > 0 && d.temp > 0);

    const sampleSize = Math.min(100, correlationData.length);
    const step = Math.floor(correlationData.length / sampleSize);
    const sampledData = correlationData.filter((_, index) => index % Math.max(1, step) === 0);
    console.log('[Dashboard] Correlação CO2 vs Temp calculada com', sampledData.length, 'pontos');
    return sampledData;
  }, [history7d]);

  // Função utilitária para formatar o XAxis
  const timeTickFormatter = (value) => {
    const d = new Date(value);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };


  return (
    <DashboardErrorBoundary>
      <Container fluid className="py-4 px-3">
        <Row className="justify-content-center">
          <Col xs={12} xl={10}>
            <div className="mb-4">
              <h1 className="display-6 fw-bold text-primary mb-2" style={{letterSpacing: '1px'}}><span style={{color:'#222'}}>Aero</span> <span style={{color:'#0d6efd'}}>Sense</span></h1>
              <p className="text-muted mb-0" style={{fontSize:'1.1rem'}}>Monitoramento em tempo real</p>
            </div>

            <Row className="g-4 mb-4">
              <Col md={12}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Header className="bg-light border-0 text-center">
                    <h5 className="mb-0 fw-semibold">Índice de Qualidade do Ar (AQI)</h5>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                    <AqiGaugeChart value={parseInt(airQualityData.aqi, 10)} />
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col md={4}>
                <Card className="shadow-sm border-0 mb-3">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                    <div className="d-flex align-items-center mb-2">
                      <Thermometer className="text-danger me-2" size={22} />
                      <span className="fw-semibold">Temperatura</span>
                    </div>
                    <h4 className="mb-0 fw-bold">{airQualityData.temperature}</h4>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm border-0 mb-3">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                    <div className="d-flex align-items-center mb-2">
                      <Droplet className="text-primary me-2" size={22} />
                      <span className="fw-semibold">Umidade</span>
                    </div>
                    <h4 className="mb-0 fw-bold">{airQualityData.humidity}</h4>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm border-0 mb-3">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                    <div className="d-flex align-items-center mb-2">
                      <CloudHaze className="text-info me-2" size={22} />
                      <span className="fw-semibold">Pressão</span>
                    </div>
                    <h4 className="mb-0 fw-bold">{airQualityData.pressure}</h4>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col md={12}>
                <Card className="shadow-sm border-0 mb-3">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                    <div className="d-flex align-items-center mb-2">
                      <CloudHaze className="text-secondary me-2" size={22} />
                      <span className="fw-semibold">Dióxido de Carbono (CO₂)</span>
                    </div>
                    <h4 className="mb-0 fw-bold">{airQualityData.co2}</h4>
                  </Card.Body>
                </Card>
                <Card className="shadow-sm border-0 mb-3">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                    <div className="d-flex align-items-center mb-2">
                      <Droplet className="text-warning me-2" size={22} />
                      <span className="fw-semibold">Compostos Orgânicos (VOCs)</span>
                    </div>
                    <h4 className="mb-0 fw-bold">{airQualityData.vocs}</h4>
                  </Card.Body>
                </Card>
                <Card className="shadow-sm border-0 mb-3">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                    <div className="d-flex align-items-center mb-2">
                      <CloudHaze className="text-danger me-2" size={22} />
                      <span className="fw-semibold">NOx / Fumaça / Partículas</span>
                    </div>
                    <h4 className="mb-0 fw-bold">{airQualityData.nox}</h4>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* --- TERCEIRA LINHA: ANÁLISE ESTATÍSTICA --- */}
            <Row className="g-4 mt-4 mb-4">
              <Col xs={12}>
                <h4 className="fw-bold text-primary mb-3">Análise Estatística e Preditiva</h4>
              </Col>
              
              {/* Distribuição de Temperatura */}
              <Col lg={4}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-danger bg-opacity-10 border-0">
                    <h6 className="mb-0 fw-semibold text-danger">Distribuição de Temperatura</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={(() => {
                        const allData = history7d;
                        const tempCounts = { '<25°C': 0, '25-26°C': 0, '26-27°C': 0, '27-28°C': 0, '>28°C': 0 };
                        allData.forEach(item => {
                          const temp = parseFloat(String(item.temperature || '0').replace(/[^0-9\.]/g, '')) || 0;
                          if (temp > 0) {
                            if (temp < 25) tempCounts['<25°C']++;
                            else if (temp < 26) tempCounts['25-26°C']++;
                            else if (temp < 27) tempCounts['26-27°C']++;
                            else if (temp < 28) tempCounts['27-28°C']++;
                            else tempCounts['>28°C']++;
                          }
                        });
                        return [
                          { faixa: '<25°C', qtd: tempCounts['<25°C'] },
                          { faixa: '25-26°C', qtd: tempCounts['25-26°C'] },
                          { faixa: '26-27°C', qtd: tempCounts['26-27°C'] },
                          { faixa: '27-28°C', qtd: tempCounts['27-28°C'] },
                          { faixa: '>28°C', qtd: tempCounts['>28°C'] },
                        ];
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="faixa" label={{ value: 'Faixa de Temperatura', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Frequência', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="qtd" name="Leituras" fill="#dc3545" />
                      </BarChart>
                    </ResponsiveContainer>
                    <small className="text-muted d-block mt-2">
                      <strong>Interpretação:</strong> Frequência de ocorrência de cada faixa de temperatura.
                    </small>
       
                  </Card.Body>
                </Card>
              </Col>

              {/* Correlação: Temperatura vs Umidade */}
              <Col lg={4}>
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
                          data={(() => {
                            const allData = history7d;
                            const correlationData = allData.map(item => {
                              const temp = parseFloat(String(item.temperature || '0').replace(/[^0-9\.]/g, '')) || 0;
                              const hum = parseFloat(String(item.humidity || '0').replace(/[^0-9\.]/g, '')) || 0;
                              return { temp, hum };
                            }).filter(d => d.temp > 0 && d.hum > 0);
                            
                            const sampleSize = Math.min(100, correlationData.length);
                            const step = Math.floor(correlationData.length / sampleSize);
                            const sampledData = correlationData.filter((_, index) => index % Math.max(1, step) === 0);
                            return sampledData.sort((a, b) => a.temp - b.temp);
                          })()}
                          fill="#0d6efd"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                    <small className="text-muted d-block mt-2">
                      <strong>Interpretação:</strong> Relação entre as condições climáticas. Baixa correlação ou dispersão sugere controle ambiental ativo.
                    </small>
                  </Card.Body>
                </Card>
              </Col>

              {/* Distribuição de Umidade */}
              <Col lg={4}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-info bg-opacity-10 border-0">
                    <h6 className="mb-0 fw-semibold text-info">Distribuição de Umidade</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={(() => {
                        const allData = history7d;
                        const humCounts = { '<35%': 0, '35-40%': 0, '40-50%': 0, '50-55%': 0, '>55%': 0 };
                        allData.forEach(item => {
                          const hum = parseFloat(String(item.humidity || '0').replace(/[^0-9\.]/g, '')) || 0;
                          if (hum > 0) {
                            if (hum < 35) humCounts['<35%']++;
                            else if (hum < 40) humCounts['35-40%']++;
                            else if (hum < 50) humCounts['40-50%']++;
                            else if (hum < 55) humCounts['50-55%']++;
                            else humCounts['>55%']++;
                          }
                        });
                        return [
                          { faixa: '<35%', qtd: humCounts['<35%'] },
                          { faixa: '35-40%', qtd: humCounts['35-40%'] },
                          { faixa: '40-50%', qtd: humCounts['40-50%'] },
                          { faixa: '50-55%', qtd: humCounts['50-55%'] },
                          { faixa: '>55%', qtd: humCounts['>55%'] },
                        ];
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="faixa" label={{ value: 'Faixa de Umidade', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Frequência', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="qtd" name="Leituras" fill="#17a2b8" />
                      </BarChart>
                    </ResponsiveContainer>
                    <small className="text-muted d-block mt-2">
                      <strong>Interpretação:</strong> Frequência de ocorrência de cada faixa de umidade. Faixa ideal: 40-55%.
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