import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, BackHandler, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

export default function ConfiguracoesScreen({ onDashboard, onHistorico }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  // Carrega nome e email do armazenamento local quando a tela monta
  useEffect(() => {
    (async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setNome(user.name || user.nome || '');
          setEmail(user.email || '');
        }
      } catch (e) {
        // não crítico — manter campos vazios se falhar
      }
    })();
  }, []);

  const handleSair = () => {
    Alert.alert(
      "Sair do Aplicativo",
      "Você tem certeza que deseja sair?",
      [
        {
          text: "Cancelar",
          onPress: () => null,
          style: "cancel"
        },
        { 
          text: "Sair", 
          onPress: () => BackHandler.exitApp()
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={onDashboard}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={28} color="#53b7c8" />
        </TouchableOpacity>
        <Text style={styles.header}>Gerenciar Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados Pessoais</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
            editable={false}
            selectTextOnFocus={false}
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            editable={false}
            selectTextOnFocus={false}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Segurança</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Senha atual"
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
          />
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Nova senha"
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry
          />
          <TouchableOpacity style={styles.alterBtn}>
            <Text style={styles.alterBtnText}>Alterar</Text>
          </TouchableOpacity>
        </View>
      </View> {/* <--- A CORREÇÃO FOI FEITA AQUI. Estava </É> */}
      
      <TouchableOpacity style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>Excluir conta</Text>
      </TouchableOpacity>
      
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <TouchableOpacity style={styles.sairBtn} onPress={handleSair}>
        <Text style={styles.sairBtnText}>Sair</Text>
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onHistorico}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Histórico</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onDashboard}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerSpacer: {
    width: 44, // Mesmo tamanho do botão de voltar para manter o título centralizado
  },
  content: {
    alignItems: 'center',
    paddingBottom: 110, // evitar que o footer cubra conteúdo
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginTop: 100,
    marginBottom: 20,
  },
  section: {
    width: '92%',
    marginBottom: 18,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 15,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    height: 36,
    marginRight: 8,
  },
  editBtn: {
    backgroundColor: '#444',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  alterBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  alterBtnText: {
    color: '#444',
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#ff3333',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '92%',
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sairBtn: {
    backgroundColor: '#53b7c8',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    width: '35%',
  },
  sairBtnText: {
    color: '#000000ff',
    fontWeight: 'bold',
    fontSize: 16,
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