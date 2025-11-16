import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ onHistorico, onConfiguracoes, onSair }) {
  const [perfilVisible, setPerfilVisible] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [co2History, setCo2History] = useState([]);    // histórico real (ts + co2)
  const [history7d, setHistory7d] = useState([]);      // últimos 7 dias para composição
  const [co2Forecast, setCo2Forecast] = useState([]);  // previsão próximas 24h

  // Função para obter status do AQI
  const getAqiStatus = (aqi) => {
    if (!aqi) return { label: '--', color: '#999' };
    if (aqi <= 50) return { label: 'BOM', color: '#4caf50' };
    if (aqi <= 100) return { label: 'MODERADO', color: '#ffeb3b' };
    if (aqi <= 150) return { label: 'INSALUBRE SENSÍVEIS', color: '#ff9800' };
    if (aqi <= 200) return { label: 'INSALUBRE', color: '#f44336' };
    if (aqi <= 300) return { label: 'MUITO INSALUBRE', color: '#9c27b0' };
    return { label: 'PERIGOSO', color: '#7e0023' };
  };

  // Função para obter status do CO₂
  const getCo2Status = (co2) => {
    if (!co2) return { label: '--', color: '#999' };
    if (co2 <= 600) return { label: 'Bom', color: '#4caf50' };
    if (co2 <= 1000) return { label: 'Normal', color: '#8bc34a' };
    if (co2 <= 1500) return { label: 'Aceitável', color: '#ffeb3b' };
    if (co2 <= 2000) return { label: 'Elevado', color: '#ff9800' };
    return { label: 'Muito Alto', color: '#f44336' };
  };

  const aqiValue = sensorData?.aqi ?? 50;
  const aqiInfo = getAqiStatus(aqiValue);
  const co2Value = sensorData?.co2 ?? null;
  const co2Info = getCo2Status(co2Value);

  // Composição de poluentes (média dos últimos 7 dias, similar ao front)
  const computeComposition = () => {
    if (!history7d || history7d.length === 0) {
      return [
        { label: 'CO₂', value: '--' },
        { label: 'VOCs', value: '--' },
        { label: 'NOx', value: '--' },
      ];
    }
    let sumCo2 = 0;
    let sumVocs = 0;
    let sumNox = 0;
    history7d.forEach((item) => {
      sumCo2 += typeof item.co2 === 'number' ? item.co2 : 0;
      sumVocs += typeof item.vocs === 'number' ? item.vocs : 0;
      sumNox += typeof item.nox === 'number' ? item.nox : 0;
    });
    const count = history7d.length || 1;
    const avgCo2 = sumCo2 / count;
    const avgVocsPpm = (sumVocs / count) / 1000; // converte para ppm aproximado
    const avgNox = sumNox / count;
    const total = avgCo2 + avgVocsPpm + avgNox || 1;
    return [
      { label: 'CO₂', value: `${((avgCo2 / total) * 100).toFixed(1)}%` },
      { label: 'VOCs', value: `${((avgVocsPpm / total) * 100).toFixed(1)}%` },
      { label: 'NOx', value: `${((avgNox / total) * 100).toFixed(1)}%` },
    ];
  };

  const composition = computeComposition();

  // Busca os dados mais recentes do sensor
  const fetchLatest = async () => {
    try {
      const res = await api.get('/sensor/latest');
      if (res && res.data) setSensorData(res.data);
    } catch (e) {
      // silencioso — pode logar se quiser
      // console.warn('Falha ao buscar dados do sensor', e);
    }
  };

  // Busca histórico para o gráfico de CO₂ e composição (similar ao front)
  const fetchHistory = async () => {
    try {
      const res = await api.get('/sensor/history');
      if (res && res.data && Array.isArray(res.data)) {
        const now = Date.now();
        // Últimos 7 dias para composição
        const cutoff7d = now - 7 * 24 * 60 * 60 * 1000;
        const last7d = res.data.filter((item) => {
          if (!item.createdAt) return false;
          const ts = new Date(item.createdAt).getTime();
          return ts && ts >= cutoff7d && ts <= now;
        });
        setHistory7d(last7d);

        // Histórico de CO₂ das últimas 24h (semelhante ao front)
        const cutoff24h = now - 24 * 60 * 60 * 1000;
        const last24h = res.data.filter((item) => {
          if (!item.createdAt) return false;
          const ts = new Date(item.createdAt).getTime();
          return ts && ts >= cutoff24h && ts <= now;
        });
        last24h.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const points = last24h
          .map((item) => ({
            ts: item.createdAt ? new Date(item.createdAt).getTime() : 0,
            co2: typeof item.co2 === 'number' ? item.co2 : 0,
          }))
          .filter((p) => p.ts && !Number.isNaN(p.ts));
        setCo2History(points);
      }
    } catch (e) {
      // silencioso
    }
  };

  // Busca previsão de CO₂ (próximas 24h) do backend
  const fetchForecast = async () => {
    try {
      const res = await api.get('/sensor/forecast-co2');
      if (res && res.data && Array.isArray(res.data.forecast)) {
        setCo2Forecast(res.data.forecast);
      } else {
        setCo2Forecast([]);
      }
    } catch (e) {
      setCo2Forecast([]);
    }
  };

  useEffect(() => {
    fetchLatest();
    fetchHistory();
    fetchForecast();
    const id = setInterval(() => {
      fetchLatest();
      fetchHistory();
      fetchForecast();
    }, 30000); // atualiza a cada 30s
    return () => clearInterval(id);
  }, []);

  const handleSair = async () => {
    try {
      await AsyncStorage.removeItem('token');
      if (onSair) {
        onSair();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Dashboard</Text>
        <TouchableOpacity 
          style={styles.perfilButton} 
          onPress={() => setPerfilVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <View>
              <MaterialIcons name="account-circle" size={32} color="#53b7c8" />
            </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={perfilVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPerfilVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPerfilVisible(false)}
        >
          <View style={styles.perfilMenu}>
            <TouchableOpacity 
              style={styles.perfilMenuItem}
              onPress={onConfiguracoes}
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="settings" size={24} color="#333" />
                <Text style={styles.perfilMenuText}>Configurações</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.perfilMenuItem}
              onPress={handleSair}
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name="logout" size={24} color="#ff4444" />
                <Text style={[styles.perfilMenuText, { color: '#ff4444' }]}>Sair</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Gráfico de CO₂ - últimas 24h (dados reais, semelhante ao front) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Evolução de CO₂ (24 horas)</Text>
        <View style={styles.chartPlaceholder}>
          {co2History.length > 0 ? (
            <LineChart
              data={{
                labels: co2History.map((p, i) =>
                  i % 6 === 0
                    ? new Date(p.ts).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''
                ),
                datasets: [{ data: co2History.map((p) => p.co2) }],
              }}
              width={Dimensions.get('window').width - 60}
              height={180}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: () => '#333',
                style: { borderRadius: 8 },
                propsForDots: { r: '3', strokeWidth: '1', stroke: '#4caf50' },
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          ) : (
            <Text style={styles.chartText}>Dados insuficientes nas últimas 24 horas.</Text>
          )}
        </View>
      </View>

      {/* Previsão de CO₂ para as próximas 24h (semelhante ao front, sem IC visual) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Previsão de CO₂ para as próximas 24h</Text>
        <Text style={styles.cardSubtitle}>Projeção baseada em regressão linear</Text>
        <View style={styles.chartPlaceholder}>
          {co2Forecast.length > 0 ? (
            <LineChart
              data={{
                labels: co2Forecast.map((p, i) =>
                  i % 6 === 0
                    ? new Date(p.ts).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''
                ),
                datasets: [{ data: co2Forecast.map((p) => p.co2) }],
              }}
              width={Dimensions.get('window').width - 60}
              height={180}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(13, 110, 253, ${opacity})`,
                labelColor: () => '#333',
                style: { borderRadius: 8 },
                propsForDots: { r: '3', strokeWidth: '1', stroke: '#0d6efd' },
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          ) : (
            <Text style={styles.chartText}>Dados insuficientes para previsão de CO₂.</Text>
          )}
        </View>
      </View>

      {/* Card de AQI semelhante ao front (resumo) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Índice de Qualidade do Ar (AQI)</Text>
        <View style={styles.aqiCircle}>
          <Text style={styles.aqiValue}>{aqiValue}</Text>
          <Text style={[styles.aqiStatus, { color: aqiInfo.color }]}>{aqiInfo.label}</Text>
        </View>
      </View>

      {/* Cards de composição e métricas rápidas, espelhando o front */}
      <View style={styles.row}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>CO₂ médio (24h)</Text>
          <Text style={styles.infoValue}>{co2Value ?? '--'}</Text>
          <Text style={styles.infoUnit}>ppm</Text>
          <Text style={[styles.infoStatus, { color: co2Info.color }]}>{co2Info.label}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>VOCs</Text>
          <Text style={styles.infoValue}>{sensorData ? String(sensorData.vocs) : '--'}</Text>
          <Text style={styles.infoUnit}>ppb</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Temperatura</Text>
          <Text style={styles.infoValue}>{sensorData ? String(sensorData.temperature) : '--'}</Text>
          <Text style={styles.infoUnit}>°C</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Umidade</Text>
          <Text style={styles.infoValue}>{sensorData ? String(sensorData.humidity) : '--'}</Text>
          <Text style={styles.infoUnit}>%</Text>
        </View>
      </View>

      {/* Composição de poluentes resumida (sem pizza, mas com percentuais) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Composição de Poluentes (7 dias)</Text>
        <View style={styles.compositionRow}>
          {composition.map((item) => (
            <View key={item.label} style={styles.compositionItem}>
              <Text style={styles.compositionLabel}>{item.label}</Text>
              <Text style={styles.compositionValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.alertBox}>
        <Text style={styles.alertLabel}>ALERTAS</Text>
        <Text style={styles.alertText}>
          {co2Value == null
            ? 'Sem dados suficientes para avaliar o nível de CO₂.'
            : co2Value > 1000
              ? 'CO₂ acima do ideal, ventile o ambiente.'
              : 'CO₂ em nível adequado.'}
        </Text>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onHistorico}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Histórico</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const bottomInset = Platform.OS === 'android' ? 14 : 0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'transparent', // deixar transparente para não criar um retângulo branco
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  /* header (duplicate removed) */
  perfilButton: {
    padding: 8,
    marginRight: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  perfilMenu: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  perfilMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
  },
  perfilMenuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 110 + bottomInset, // espaço extra para o footer não cobrir o conteúdo
  },
  header: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
    textAlign: 'left',
    marginLeft: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    width: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chartPlaceholder: {
    height: 180,
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chartText: {
    color: '#bbb',
    fontStyle: 'italic',
  },
  aqiCircle: {
    borderWidth: 2,
    borderColor: '#bbb',
    borderRadius: 60,
    width: 120,
    height: 120,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  aqiValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  aqiStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '92%',
    marginTop: 8,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 4,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
  },
  infoUnit: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#222',
    marginTop: 2,
    fontWeight: 'bold',
  },
  infoStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  alertBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 12,
    padding: 12,
    width: '92%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  alertLabel: {
    fontWeight: 'bold',
    color: '#888',
    fontSize: 14,
  },
  alertText: {
    color: '#ff3333',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 2,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    position: 'absolute',
    bottom: bottomInset,
    left: 0,
    right: 0,
    height: 64 + bottomInset,
    paddingBottom: 8,
    zIndex: 20,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 12,
    color: '#888',
  },
});
