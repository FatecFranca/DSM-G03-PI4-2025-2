import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Placeholder,
  Alert,
  ButtonGroup,
  Badge,
} from "react-bootstrap";
import {
  Wind,
  Activity,
  Thermometer,
  Droplet,
  CloudHaze,
  ArrowRepeat,
  Download,
} from "react-bootstrap-icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import api from "../src/services/api";
import AqiGaugeChart from "../components/AqiGaugeChart";

/** ------------------------------------------------------------
 * Utilidades
 * -------------------------------------------------------------*/
const parseNumber = (val) => {
  if (val === null || val === undefined) return null;
  const n = parseFloat(String(val).replace(/[^0-9+\-.,]/g, "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
};

const aqiLabel = (aqi) => {
  const n = parseNumber(aqi);
  if (n == null) return { text: "--", variant: "secondary" };
  if (n <= 50) return { text: "Boa", variant: "success" };
  if (n <= 100) return { text: "Moderada", variant: "warning" };
  if (n <= 150) return { text: "Ruim p/ sensíveis", variant: "warning" };
  if (n <= 200) return { text: "Ruim", variant: "danger" };
  return { text: "Muito ruim", variant: "danger" };
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const cutoffFor = (filter) => {
  const now = Date.now();
  if (filter === "today") return startOfToday();
  if (filter === "7d") return now - 7 * 86400000; // 7 dias
  if (filter === "30d") return now - 30 * 86400000; // 30 dias
  return 0;
};

const formatTime = (ts) => new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const formatDate = (ts) => new Date(ts).toLocaleDateString("pt-BR");

const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b"]; // roxo, verde, âmbar

/** ------------------------------------------------------------
 * Subcomponentes
 * -------------------------------------------------------------*/
const StatCard = ({ title, value, subtitle, icon, className }) => (
  <Card className={`h-100 shadow-sm border-0 ${className || ""}`}>
    <Card.Body className="d-flex flex-column justify-content-center text-center p-3">
      <div className="d-flex align-items-center justify-content-center gap-2 text-muted" aria-hidden>
        {icon}
        <h6 className="mb-0 fw-semibold">{title}</h6>
      </div>
      <h3 className="mt-2 mb-1 fw-bold">{value}</h3>
      {subtitle && <small className="text-muted">{subtitle}</small>}
    </Card.Body>
  </Card>
);

const SkeletonCard = () => (
  <Card className="h-100 shadow-sm border-0">
    <Card.Body>
      <Placeholder as="div" animation="glow">
        <Placeholder xs={4} />
      </Placeholder>
      <Placeholder as="div" animation="glow" className="mt-3">
        <Placeholder xs={8} />
      </Placeholder>
    </Card.Body>
  </Card>
);

/** ------------------------------------------------------------
 * Componente principal
 * -------------------------------------------------------------*/
export default function Dashboard() {
  const [filter, setFilter] = useState("7d");
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Busca dados: último e histórico
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [latestRes, historyRes] = await Promise.all([
          api.get("/sensor/latest"),
          api.get("/sensor/history"),
        ]);

        if (!mounted) return;

        const latestData = latestRes.data || {};
        const historyData = (historyRes.data || []).map((r) => {
          const ts = new Date(r.createdAt || r.timestamp || Date.now()).getTime();
          return {
            ts: Number.isNaN(ts) ? 0 : ts,
            aqi: parseNumber(r.aqi),
            co2: parseNumber(r.co2),
            vocs: parseNumber(r.vocs),
            nox: parseNumber(r.nox),
            temperature: parseNumber(r.temperature),
            humidity: parseNumber(r.humidity),
          };
        });

        setLatest({
          aqi: String(latestData.aqi ?? "--"),
          co2: latestData.co2 != null ? `${parseNumber(latestData.co2)} ppm` : "-- ppm",
          temperature:
            latestData.temperature != null ? `${parseNumber(latestData.temperature)} °C` : "-- °C",
          humidity:
            latestData.humidity != null ? `${parseNumber(latestData.humidity)} %` : "-- %",
          vocs: latestData.vocs != null ? `${parseNumber(latestData.vocs)} ppb` : "-- ppb",
          nox: latestData.nox != null ? `${parseNumber(latestData.nox)} ppm` : "-- ppm",
          lastUpdate: latestData.createdAt
            ? new Date(latestData.createdAt).toLocaleTimeString("pt-BR")
            : "",
        });
        setHistory(historyData);
      } catch (e) {
        console.error(e);
        setError("Não foi possível carregar os dados. Tente novamente.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    const iv = setInterval(fetchAll, 30000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  // Aplica filtro de janela temporal (corrigido)
  const cutoff = useMemo(() => cutoffFor(filter), [filter]);
  const filteredHistory = useMemo(
    () => history.filter((d) => (d.ts || 0) >= cutoff).sort((a, b) => a.ts - b.ts),
    [history, cutoff]
  );

  // Dados do gráfico de tendência (AQI), com rótulos legíveis
  const trendData = useMemo(() => {
    return filteredHistory.map((d) => ({
      time: filter === "today" ? formatTime(d.ts) : formatDate(d.ts),
      aqi: d.aqi,
    }));
  }, [filteredHistory, filter]);

  // Pizza de composição baseada no "latest"
  const pieData = useMemo(() => {
    const co2 = parseNumber(latest?.co2) || 0;
    const vocs = parseNumber(latest?.vocs) || 0;
    const nox = parseNumber(latest?.nox) || 0;
    return [
      { name: "CO₂", value: co2 },
      { name: "VOCs", value: vocs },
      { name: "NOx", value: nox },
    ];
  }, [latest]);

  const aqiInfo = aqiLabel(latest?.aqi);

  const filterLabel = filter === "today" ? "Hoje" : filter === "7d" ? "Últimos 7 dias" : "Últimos 30 dias";

  const handleExportCSV = () => {
    const header = [
      "data",
      "hora",
      "aqi",
      "co2(ppm)",
      "vocs(ppb)",
      "nox(ppm)",
      "temperatura(°C)",
      "umidade(%)",
    ];
    const rows = filteredHistory.map((d) => [
      new Date(d.ts).toLocaleDateString("pt-BR"),
      formatTime(d.ts),
      d.aqi ?? "",
      d.co2 ?? "",
      d.vocs ?? "",
      d.nox ?? "",
      d.temperature ?? "",
      d.humidity ?? "",
    ]);

    const csv = [header, ...rows].map((r) => r.join(";"))?.join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico_${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container fluid className="py-4 px-3">
      <Row className="justify-content-center">
        <Col xs={12} xl={11} xxl={10}>
          {/* Cabeçalho */}
          <div className="mb-4 d-flex flex-wrap gap-3 align-items-end justify-content-between">
            <div>
              <h1 className="display-6 fw-bold text-primary mb-1">
                <Wind className="me-3" size={40} /> Qualidade do Ar
              </h1>
              <p className="text-muted mb-0">
                Monitoramento em tempo real • Última atualização: {latest?.lastUpdate || "--"}
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <ButtonGroup aria-label="Filtro de período">
                <Button
                  size="sm"
                  variant={filter === "today" ? "primary" : "outline-secondary"}
                  onClick={() => setFilter("today")}
                >
                  Hoje
                </Button>
                <Button
                  size="sm"
                  variant={filter === "7d" ? "primary" : "outline-secondary"}
                  onClick={() => setFilter("7d")}
                >
                  7 dias
                </Button>
                <Button
                  size="sm"
                  variant={filter === "30d" ? "primary" : "outline-secondary"}
                  onClick={() => setFilter("30d")}
                >
                  30 dias
                </Button>
              </ButtonGroup>
              <Button size="sm" variant="outline-primary" onClick={handleExportCSV}>
                <Download className="me-2" /> Exportar CSV
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={() => window.location.reload()}>
                <ArrowRepeat className="me-2" /> Atualizar
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4" role="alert">
              {error}
            </Alert>
          )}

          {/* Linha de topo: Gauge + Pizza */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-light border-0 d-flex align-items-center justify-content-between">
                  <h5 className="mb-0 fw-semibold">Índice de Qualidade do Ar (AQI)</h5>
                  <Badge bg={aqiInfo.variant}>{aqiInfo.text}</Badge>
                </Card.Header>
                <Card.Body className="d-flex align-items-center justify-content-center" style={{ minHeight: 220 }}>
                  {loading ? (
                    <Spinner animation="border" />
                  ) : latest ? (
                    <AqiGaugeChart value={parseInt(latest.aqi || "0", 10)} />
                  ) : (
                    <SkeletonCard />
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-light border-0">
                  <h5 className="mb-0 fw-semibold text-center">Composição de Poluentes</h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="d-flex justify-content-center py-5">
                      <Spinner animation="border" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={`c-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [v, "valor"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Linha média: tendências + métricas rápidas */}
          <Row className="g-4 mb-4">
            <Col lg={8}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-primary bg-opacity-10 border-0">
                  <h5 className="mb-0 text-primary fw-semibold">
                    <Activity className="me-2" /> Tendência do AQI ({filterLabel})
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  {loading ? (
                    <div className="d-flex justify-content-center py-5">
                      <Spinner animation="border" />
                    </div>
                  ) : trendData.length === 0 ? (
                    <div className="text-center text-muted">Sem dados para o período selecionado.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tickMargin={6} />
                        <YAxis allowDecimals={false} domain={[0, (dataMax) => Math.max(100, Math.ceil(dataMax / 10) * 10)]} />
                        <Tooltip formatter={(v) => [v, "AQI"]} />
                        <Area type="monotone" dataKey="aqi" stroke="#4f46e5" fill="url(#aqiFill)" activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Row className="g-3">
                {loading ? (
                  <>
                    <Col xs={12}><SkeletonCard /></Col>
                    <Col xs={12}><SkeletonCard /></Col>
                  </>
                ) : (
                  <>
                    <Col xs={12}>
                      <StatCard
                        title="Temperatura"
                        value={latest?.temperature || "-- °C"}
                        icon={<Thermometer className="text-danger" size={18} />}
                      />
                    </Col>
                    <Col xs={12}>
                      <StatCard
                        title="Umidade"
                        value={latest?.humidity || "-- %"}
                        icon={<Droplet className="text-primary" size={18} />}
                      />
                    </Col>
                  </>
                )}
              </Row>

              <Row className="g-3 mt-1">
                {loading ? (
                  <>
                    <Col xs={12}><SkeletonCard /></Col>
                    <Col xs={12}><SkeletonCard /></Col>
                    <Col xs={12}><SkeletonCard /></Col>
                  </>
                ) : (
                  <>
                    <Col xs={12}>
                      <StatCard
                        title="Dióxido de Carbono (CO₂)"
                        value={latest?.co2 || "-- ppm"}
                        icon={<CloudHaze className="text-secondary" size={18} />}
                      />
                    </Col>
                    <Col xs={12}>
                      <StatCard
                        title="Compostos Orgânicos (VOCs)"
                        value={latest?.vocs || "-- ppb"}
                        icon={<Droplet className="text-warning" size={18} />}
                      />
                    </Col>
                    <Col xs={12}>
                      <StatCard
                        title="NOx / Fumaça / Partículas"
                        value={latest?.nox || "-- ppm"}
                        icon={<CloudHaze className="text-danger" size={18} />}
                      />
                    </Col>
                  </>
                )}
              </Row>
            </Col>
          </Row>

          {/* Mini tendências (opcional) */}
          <Row className="g-4">
            {[
              { key: "co2", name: "CO₂", unit: "ppm" },
              { key: "temperature", name: "Temperatura", unit: "°C" },
              { key: "humidity", name: "Umidade", unit: "%" },
            ].map((m) => (
              <Col md={4} key={m.key}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Header className="bg-light border-0">
                    <h6 className="mb-0 fw-semibold">{m.name} — {filterLabel}</h6>
                  </Card.Header>
                  <Card.Body className="px-3 py-3">
                    {loading || filteredHistory.length === 0 ? (
                      <div className="d-flex justify-content-center py-4"><Spinner animation="border" /></div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={filteredHistory.map((d) => ({
                          t: filter === "today" ? formatTime(d.ts) : formatDate(d.ts),
                          v: d[m.key],
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="t" hide />
                          <YAxis width={30} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => [`${v} ${m.unit}`, m.name]} />
                          <Line type="monotone" dataKey="v" stroke="#0ea5e9" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Container>
  );
}
