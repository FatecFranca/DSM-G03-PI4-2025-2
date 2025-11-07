import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function DashboardScreen({ onHistorico, onConfiguracoes, onSair }) {
  const [perfilVisible, setPerfilVisible] = useState(false);
  const [sensorData, setSensorData] = useState(null);

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

  useEffect(() => {
    fetchLatest();
    const id = setInterval(fetchLatest, 10000); // atualiza a cada 10s
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Índice de Qualidade do Ar - últimas 24 horas</Text>
        <View style={styles.chartPlaceholder}>
          {/* Aqui pode ser inserido um gráfico real futuramente */}
          <Text style={styles.chartText}>[Gráfico]</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Índice de Qualidade do Ar</Text>
        <View style={styles.aqiCircle}>
          <Text style={styles.aqiValue}>150</Text>
          <Text style={styles.aqiStatus}>RUIM</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.infoBox}>
          <Text style={styles.infoValue}>{sensorData ? String(sensorData.co2) : '--'}</Text>
          <Text style={styles.infoUnit}>ppm</Text>
          <Text style={styles.infoLabel}>Nível de CO²</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoValue}>{sensorData ? String(sensorData.vocs) : '--'}</Text>
          <Text style={styles.infoUnit}>ppb</Text>
          <Text style={styles.infoLabel}>TVOC</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.infoBox}>
          <Text style={styles.infoValue}>{sensorData ? String(sensorData.temperature) : '--'}</Text>
          <Text style={styles.infoUnit}>°C</Text>
          <Text style={styles.infoLabel}>Temperatura</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoValue}>{sensorData ? String(sensorData.humidity) : '--'}</Text>
          <Text style={styles.infoUnit}>%</Text>
          <Text style={styles.infoLabel}>Umidade</Text>
        </View>
      </View>

      <View style={styles.alertBox}>
        <Text style={styles.alertLabel}>ALERTAS</Text>
        <Text style={styles.alertText}>CO² está muito alto!</Text>
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
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#ff9900',
  },
  aqiStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff9900',
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
