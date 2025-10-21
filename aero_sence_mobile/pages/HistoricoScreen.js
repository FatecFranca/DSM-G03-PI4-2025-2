import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import api from '../src/services/api';

export default function HistoricoScreen({ onDashboard, onConfiguracoes }) {
  const [periodo, setPeriodo] = useState('dia');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/sensor/history');
        setHistory(res.data.reverse());
      } catch (e) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Prepara dados para o gráfico
  const chartData = {
    labels: history.length > 0 ? history.map((d, i) => i % 6 === 0 ? new Date(d.createdAt).getHours() + 'h' : '') : [],
    datasets: [
      {
        data: history.map(d => d.aqi),
        color: () => '#53b7c8',
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Histórico</Text>
      <Text style={styles.subtitle}>MONITORAMENTO DE QUALIDADE DO AR</Text>
      <View style={styles.card}>
        <View style={styles.chartPlaceholder}>
          {loading ? (
            <Text style={styles.chartText}>Carregando gráfico...</Text>
          ) : history.length > 0 ? (
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - 60}
              height={180}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(83, 183, 200, ${opacity})`,
                labelColor: () => '#333',
                style: { borderRadius: 8 },
                propsForDots: { r: '2', strokeWidth: '1', stroke: '#53b7c8' },
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          ) : (
            <Text style={styles.chartText}>Sem dados para exibir.</Text>
          )}
        </View>
        <View style={styles.periodoRow}>
          <TouchableOpacity
            style={[styles.periodoBtn, periodo === 'dia' && styles.periodoBtnAtivo]}
            onPress={() => setPeriodo('dia')}
          >
            <Text style={[styles.periodoBtnText, periodo === 'dia' && styles.periodoBtnTextAtivo]}>Dia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.periodoBtn}
            onPress={() => setPeriodo('semana')}
          >
            <Text style={styles.periodoBtnText}>Semana</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.periodoBtn}
            onPress={() => setPeriodo('mes')}
          >
            <Text style={styles.periodoBtnText}>Mês</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onDashboard}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Histórico</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onDashboard}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onConfiguracoes}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Configurações</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 80,
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
    top: 780,
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    paddingBottom: 8,
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
