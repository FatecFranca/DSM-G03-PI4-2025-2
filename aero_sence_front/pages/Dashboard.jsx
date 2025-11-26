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



// PIE_COLORS movido para antes do componente
const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const Dashboard = () => {
  const [airQualityData, setAirQualityData] = useState({
    aqi: '55', co2: '450 ppm', vocs: '120 ppb', nox: '0.05 ppm', temperature: '-- °C', humidity: '-- %', lastUpdate: ''
  });
  const [co2History, setCo2History] = useState([]);
  const [co2Forecast, setCo2Forecast] = useState([]);
  const [forecastCI, setForecastCI] = useState([]);
  const [history7d, setHistory7d] = useState([]);

  // Função para processar médias reais dos poluentes - usa TODOS os dados do histórico
  const processPieData = (history) => {
    // Usar todos os dados históricos disponíveis, com fallback para history7d se necessário
    const allData = history7d.length > 0 ? history7d : (history || []);
    
    if (!allData || allData.length === 0) return [
      { name: 'CO₂', value: 1 },
      { name: 'VOCs', value: 1 },
      { name: 'NOx', value: 1 }
    ];
    
    console.log('[Dashboard] Processando gráfico de pizza com', allData.length, 'registros históricos');
    
    let sumCo2 = 0, sumVocsPpb = 0, sumNox = 0, count = 0;
    allData.forEach(item => {
      const co2Val = parseFloat(String(item.co2).replace(/[^0-9\.]/g, '')) || 0;
      const vocsVal = parseFloat(String(item.vocs).replace(/[^0-9\.]/g, '')) || 0;
      const noxVal = parseFloat(String(item.nox).replace(/[^0-9eE\.-]/g, '')) || 0;
      
      if (co2Val > 0 || vocsVal > 0 || noxVal > 0) {
        sumCo2 += co2Val;
        sumVocsPpb += vocsVal;
        sumNox += noxVal;
        count++;
      }
    });
    
    if (count === 0) return [
      { name: 'CO₂', value: 1 },
      { name: 'VOCs', value: 1 },
      { name: 'NOx', value: 1 }
    ];
    
    const avgCo2 = sumCo2 / count;
    const avgVocs = (sumVocsPpb / count) / 1000; // Converter ppb para proporção
    const avgNox = parseFloat((sumNox / count).toFixed(6));
    
    let total = avgCo2 + avgVocs + avgNox;
    let data = [
      { name: 'CO₂', value: avgCo2 },
      { name: 'VOCs', value: avgVocs },
      { name: 'NOx', value: avgNox }
    ];
    
    if (total === 0) total = 1;
    
    // Calcular percentuais baseados no histórico completo
    data = data.map(d => ({ ...d, percent: d.value / total }));
    
    // Normalizar para somar 100%
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
        // Carregar TODOS os dados históricos para análise completa
        const allHistoricalData = response.data.filter(item => item.createdAt).map(item => ({
          ...item,
          temperature: item.temperature,
          humidity: item.humidity,
          co2: item.co2,
          vocs: item.vocs,
          nox: item.nox,
          createdAt: item.createdAt
        }));
        console.log('[Dashboard] Carregados', allHistoricalData.length, 'registros históricos completos');
        setHistory7d(allHistoricalData); // Renomear seria ideal, mas mantemos compatibilidade

        // Gráfico de tendência de CO₂ (últimas 24h - dados reais, sem agregação)
        const startWindow = now - 24 * 60 * 60 * 1000;
        const last24h = response.data.filter(item => {
          if (!item.createdAt) return false;
          const ts = new Date(item.createdAt).getTime();
          return !isNaN(ts) && ts >= startWindow && ts <= now;
        });
        
        if (last24h.length > 0) {
          last24h.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const chartData = last24h.map(item => {
            const ts = new Date(item.createdAt).getTime();
            const co2 = typeof item.co2 === 'number' ? Math.max(0, item.co2) : 0;
            return { ts, co2 };
          }).filter(d => d.ts && !isNaN(d.ts) && !isNaN(d.co2));
          
          console.debug('[Dashboard] Dados CO2 processados:', chartData.length, 'pontos');
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
        const response = await api.get('/sensor/forecast-co2');
        console.debug('[Dashboard] /sensor/forecast-co2 response:', response.data);
        if (response.data && Array.isArray(response.data.forecast) && response.data.forecast.length > 0) {
          // Validar se os dados têm formato correto
          const validForecast = response.data.forecast.filter(item => 
            item && typeof item.ts === 'number' && typeof item.co2 === 'number' && !isNaN(item.co2)
          );
          setCo2Forecast(validForecast);
          
          if (Array.isArray(response.data.ci) && response.data.ci.length > 0) {
            const validCI = response.data.ci.filter(item => 
              item && typeof item.ts === 'number' && typeof item.upper === 'number' && !isNaN(item.upper)
            );
            setForecastCI(validCI);
          } else {
            setForecastCI([]);
          }
        } else {
          console.warn('[Dashboard] Forecast data inválida ou vazia');
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

  // Agrupamento de CO₂ por hora para gráfico de barras (últimas 24h)
  const hourlyCo2 = Object.values(
    co2History.reduce((acc, item) => {
      const d = new Date(item.ts);
      const key = d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
      });
      if (!acc[key]) acc[key] = { label: key, sum: 0, count: 0 };
      // Garantir que CO₂ seja um número válido
      const co2Val = typeof item.co2 === 'number' && !isNaN(item.co2) ? item.co2 : 0;
      acc[key].sum += co2Val;
      acc[key].count += 1;
      return acc;
    }, {})
  ).map((grp) => ({
    label: grp.label,
    co2: grp.count ? (grp.sum / grp.count).toFixed(2) : 0,
  })).filter(item => item.co2 > 0).slice(-12); // Últimas 12 horas com dados

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
                    <h5 className="mb-0 fw-semibold text-center">Composição de Poluentes (Histórico Completo)</h5>
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
                    <div className="text-muted small mb-2">Intervalo de confiança ~90% • Projeção baseada em regressão linear</div>
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
                            formatter={(value, name, { payload }) => {
                              if (name !== 'Previsão CO₂ (próximas 24h)' && name !== 'co2') {
                                return null;
                              }
                              if (typeof value === 'number' && value < 0) value = 0;
                              const baseVal = Number(value);
                              let text = `${baseVal.toFixed(2)} ppm`;
                              // Procura o ponto correspondente no forecastCI (mesmo ts) para pegar o upper e calcular o erro
                              if (payload && forecastCI && forecastCI.length > 0 && payload.ts) {
                                const ciPoint = forecastCI.find(p => p.ts === payload.ts);
                                if (ciPoint && typeof ciPoint.upper === 'number') {
                                  const erro = Math.max(0, ciPoint.upper - baseVal);
                                  if (erro > 0) {
                                    text = `${baseVal.toFixed(2)} ppm ± ${erro.toFixed(2)} ppm`;
                                  }
                                }
                              }
                              return [text, 'Previsão CO₂'];
                            }}
                          />
                          {isValidCI && (
                            <Area
                              type="monotone"
                              dataKey="upper"
                              data={forecastCI}
                              name="Intervalo de confiança"
                              fill="#0d6efd"
                              stroke="#0d6efd"
                              strokeOpacity={0}
                              fillOpacity={0.15}
                              activeDot={false}
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
              <Col lg={4}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-danger bg-opacity-10 border-0">
                    <h6 className="mb-0 fw-semibold text-danger">Distribuição de Temperatura (Histórico Completo)</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={(() => {
                        // Calcular distribuição de temperatura baseada em TODOS os dados do banco
                        const allData = history7d;
                        const tempCounts = { '<25°C': 0, '25-26°C': 0, '26-27°C': 0, '27-28°C': 0, '>28°C': 0 };
                        allData.forEach(item => {
                          const temp = parseFloat(String(item.temperature || '0').replace(/[^0-9\.]/g, '')) || 0;
                          if (temp > 0) {
                            if (temp < 25) tempCounts['<25°C']++;
                            else if (temp < 26) tempCounts['25-26°C']++;
                            else if (temp < 27) tempCounts['26-27°C']++;
                            else if (temp < 28) tempCounts['27-28°C']++;
                            else tempCounts['>°28°C']++;
                          }
                        });
                        console.log('[Dashboard] Distribuição temperatura calculada com', allData.length, 'registros');
                        return [
                          { faixa: '<25°C', qtd: tempCounts['<25°C'] },
                          { faixa: '25-26°C', qtd: tempCounts['25-26°C'] },
                          { faixa: '26-27°C', qtd: tempCounts['26-27°C'] },
                          { faixa: '27-28°C', qtd: tempCounts['27-28°C'] },
                          { faixa: '>28°C', qtd: tempCounts['>°28°C'] },
                        ];
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="faixa" label={{ value: 'Faixa de Temperatura', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Frequência', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="qtd" name="Leituras" fill="#0d6efd" />
                      </BarChart>
                    </ResponsiveContainer>
                    <small className="text-muted d-block mt-2">
                      <strong>Interpretação:</strong> Análise de todo o histórico. Faixa ideal: 20-26°C.
                      Padrão geral mostra estabilidade na temperatura do ambiente.
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-primary bg-opacity-10 border-0">
                    <h6 className="mb-0 fw-semibold text-primary">Correlação: Temperatura vs Umidade (Todos os Dados)</h6>
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
                            // Usar TODOS os dados de temperatura vs umidade do banco
                            const allData = history7d;
                            const correlationData = allData.map(item => {
                              const temp = parseFloat(String(item.temperature || '0').replace(/[^0-9\.]/g, '')) || 0;
                              const hum = parseFloat(String(item.humidity || '0').replace(/[^0-9\.]/g, '')) || 0;
                              return { temp, hum };
                            }).filter(d => d.temp > 0 && d.hum > 0);
                            
                            // Amostrar dados se houver muitos (para performance do gráfico)
                            const sampleSize = Math.min(100, correlationData.length);
                            const step = Math.floor(correlationData.length / sampleSize);
                            const sampledData = correlationData.filter((_, index) => index % Math.max(1, step) === 0);
                            console.log('[Dashboard] Correlação calculada com', sampledData.length, 'pontos de', allData.length, 'registros');
                            return sampledData.sort((a, b) => a.temp - b.temp);
                          })()}
                          fill="#0d6efd"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                    <small className="text-muted d-block mt-2">
                      <strong>Interpretação:</strong> Correlação de todo o histórico. Padrão mostra
                      relação estável entre temperatura e umidade no ambiente.
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-info bg-opacity-10 border-0">
                    <h6 className="mb-0 fw-semibold text-info">Distribuição de Umidade (Histórico Completo)</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={(() => {
                        // Calcular distribuição de umidade baseada em TODOS os dados do banco
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
                        console.log('[Dashboard] Distribuição umidade calculada com', allData.length, 'registros');
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
                        <Bar dataKey="qtd" name="Leituras" fill="#0d6efd" />
                      </BarChart>
                    </ResponsiveContainer>
                    <small className="text-muted d-block mt-2">
                      <strong>Interpretação:</strong> Faixa ideal: 40-55%. Análise histórica completa
                      mostra padrão de umidade estável no ambiente.
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




