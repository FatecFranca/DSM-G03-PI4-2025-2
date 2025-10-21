import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function DashboardScreen({ onHistorico, onConfiguracoes }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Dashboard</Text>

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
          <Text style={styles.infoValue}>1200</Text>
          <Text style={styles.infoUnit}>ppm</Text>
          <Text style={styles.infoLabel}>Nível de CO²</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoValue}>500</Text>
          <Text style={styles.infoUnit}>ppb</Text>
          <Text style={styles.infoLabel}>TVOC</Text>
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
    marginBottom: 5,
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
    bottom: 0,
    top: 780,
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
