import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import api from '../src/services/api';

export default function HistoricoScreen({ onDashboard, onConfiguracoes }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const bottomInset = Platform.OS === 'android' ? 14 : 0;

  // Dados mock de estatísticas (depois virá da API)
  const estatisticas = {
    co2: {
      media: 780,
      mediana: 750,
      desvioPadrao: 180,
      minimo: 420,
      maximo: 1350,
      assimetria: 0.8,
      coefVariacao: 23,
      percentil95: 1100,
      tempoRisco: 12,
    },
    temperatura: {
      media: 22.5,
      mediana: 22.0,
      desvioPadrao: 2.1,
      minimo: 19.0,
      maximo: 26.5,
      assimetria: 0.2,
      coefVariacao: 9,
      percentil95: 25.0,
      tempoRisco: 5,
    },
    umidade: {
      media: 55,
      mediana: 54,
      desvioPadrao: 8,
      minimo: 40,
      maximo: 72,
      assimetria: 0.1,
      coefVariacao: 15,
      percentil95: 68,
      tempoRisco: 8,
    },
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/sensor/history');
        // Ordena do mais recente para o mais antigo, parecido com a lista do front
        const arr = Array.isArray(res.data) ? [...res.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
        setHistory(arr);
      } catch (e) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Histórico de Leituras</Text>
      <Text style={styles.subtitle}>LISTA DAS ÚLTIMAS MEDIÇÕES DO SENSOR</Text>

      {/* Lista de registros, similar ao histórico de dados do front */}
      <View style={styles.card}>
        {loading ? (
          <Text style={styles.chartText}>Carregando histórico...</Text>
        ) : history.length === 0 ? (
          <Text style={styles.chartText}>Sem registros para exibir.</Text>
        ) : (
          history.map((item) => (
            <View key={item.id || item.createdAt} style={styles.historyRow}>
              <View style={styles.historyColLeft}>
                <Text style={styles.historyDate}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })
                    : '--'}
                </Text>
                <Text style={styles.historyTime}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </Text>
              </View>
              <View style={styles.historyColRight}>
                <Text style={styles.historyMetric}>AQI: <Text style={styles.historyMetricValue}>{item.aqi ?? '--'}</Text></Text>
                <Text style={styles.historyMetric}>CO₂: <Text style={styles.historyMetricValue}>{item.co2 ?? '--'} ppm</Text></Text>
                <Text style={styles.historyMetric}>Temp: <Text style={styles.historyMetricValue}>{item.temperature ?? '--'}°C</Text></Text>
                <Text style={styles.historyMetric}>Umidade: <Text style={styles.historyMetricValue}>{item.humidity ?? '--'}%</Text></Text>
              </View>
            </View>
          ))
        )}
      </View>

        {/* Estatísticas resumidas abaixo, mantendo os cards existentes */}
        {/* Card CO₂ */}
          <View style={styles.card}>
            <Text style={styles.metricTitle}>CO₂ (ppm)</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Média:</Text>
              <Text style={styles.statValue}>{estatisticas.co2.media} ppm</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mediana:</Text>
              <Text style={styles.statValue}>{estatisticas.co2.mediana} ppm</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Desvio Padrão:</Text>
              <Text style={styles.statValue}>{estatisticas.co2.desvioPadrao} ppm</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mínimo / Máximo:</Text>
              <Text style={styles.statValue}>{estatisticas.co2.minimo} / {estatisticas.co2.maximo} ppm</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Assimetria:</Text>
              <Text style={styles.statValue}>{estatisticas.co2.assimetria.toFixed(2)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Coef. Variação:</Text>
              <Text style={styles.statValue}>{estatisticas.co2.coefVariacao}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Percentil 95:</Text>
              <Text style={styles.statValue}>{estatisticas.co2.percentil95} ppm</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>% Tempo Crítico:</Text>
              <Text style={styles.statValue}>{estatisticas.co2.tempoRisco}%</Text>
            </View>
          </View>

          {/* Card Temperatura */}
          <View style={styles.card}>
            <Text style={styles.metricTitle}>Temperatura (°C)</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Média:</Text>
              <Text style={styles.statValue}>{estatisticas.temperatura.media}°C</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mediana:</Text>
              <Text style={styles.statValue}>{estatisticas.temperatura.mediana}°C</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Desvio Padrão:</Text>
              <Text style={styles.statValue}>{estatisticas.temperatura.desvioPadrao}°C</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mínimo / Máximo:</Text>
              <Text style={styles.statValue}>{estatisticas.temperatura.minimo}°C / {estatisticas.temperatura.maximo}°C</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Assimetria:</Text>
              <Text style={styles.statValue}>{estatisticas.temperatura.assimetria.toFixed(2)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Coef. Variação:</Text>
              <Text style={styles.statValue}>{estatisticas.temperatura.coefVariacao}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Percentil 95:</Text>
              <Text style={styles.statValue}>{estatisticas.temperatura.percentil95}°C</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>% Tempo Crítico:</Text>
              <Text style={styles.statValue}>{estatisticas.temperatura.tempoRisco}%</Text>
            </View>
          </View>

          {/* Card Umidade */}
          <View style={styles.card}>
            <Text style={styles.metricTitle}>Umidade (%)</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Média:</Text>
              <Text style={styles.statValue}>{estatisticas.umidade.media}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mediana:</Text>
              <Text style={styles.statValue}>{estatisticas.umidade.mediana}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Desvio Padrão:</Text>
              <Text style={styles.statValue}>{estatisticas.umidade.desvioPadrao}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mínimo / Máximo:</Text>
              <Text style={styles.statValue}>{estatisticas.umidade.minimo}% / {estatisticas.umidade.maximo}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Assimetria:</Text>
              <Text style={styles.statValue}>{estatisticas.umidade.assimetria.toFixed(2)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Coef. Variação:</Text>
              <Text style={styles.statValue}>{estatisticas.umidade.coefVariacao}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Percentil 95:</Text>
              <Text style={styles.statValue}>{estatisticas.umidade.percentil95}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>% Tempo Crítico:</Text>
                  <Text style={styles.statValue}>{estatisticas.umidade.tempoRisco}%</Text>
                </View>
              </View>
      </ScrollView>
      <View style={[styles.bottomNav, { height: 64 + bottomInset, paddingBottom: bottomInset }]}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Histórico</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onDashboard}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 110,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 50,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  /* estilos de abas antigos removidos (não há mais abas) */
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
    alignItems: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  historyColLeft: {
    width: '30%',
  },
  historyColRight: {
    width: '68%',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  historyTime: {
    fontSize: 12,
    color: '#777',
  },
  historyMetric: {
    fontSize: 12,
    color: '#555',
  },
  historyMetricValue: {
    fontWeight: 'bold',
    color: '#222',
  },
  metricTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#53b7c8',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: 'bold',
  },
  chartPlaceholder: {
    height: 180,
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartText: {
    color: '#bbb',
    fontStyle: 'italic',
  },
  periodoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  periodoBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginHorizontal: 4,
  },
  periodoBtnAtivo: {
    backgroundColor: '#222',
    borderColor: '#222',
  },
  periodoBtnText: {
    color: '#222',
    fontWeight: 'bold',
  },
  periodoBtnTextAtivo: {
    color: '#fff',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
