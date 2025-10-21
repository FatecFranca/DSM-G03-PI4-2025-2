import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/services/api';

export default function CadastroScreen({ onLogin }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  function isEmailValido(email) {
    // Simples validação de e-mail
    return email.includes('@') && (email.endsWith('.com') || email.endsWith('.com.br'));
  }

  async function handleCadastro() {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!isEmailValido(email)) {
      Alert.alert('Erro', 'Digite um e-mail válido.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { name: nome, email, password: senha });
      setLoading(false);
      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!', [
        { text: 'OK', onPress: onLogin }
      ]);
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        Alert.alert('Erro', err.response.data.message);
      } else if (err.response && err.response.data && typeof err.response.data === 'string') {
        Alert.alert('Erro', err.response.data);
      } else {
        Alert.alert('Erro', 'Não foi possível cadastrar. Verifique sua conexão e tente novamente.');
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60, backgroundColor: '#fff' }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Image source={require('./assets/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Seja bem-vindo!</Text>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome"
            value={nome}
            onChangeText={setNome}
          />
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
          <Text style={styles.label}>Confirmar senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite novamente a senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
          />
          <TouchableOpacity onPress={handleCadastro} disabled={loading}>
            <LinearGradient
              colors={['#53b7c8', '#a0d48a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 44,
    marginTop:-25,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    alignSelf: 'flex-start',
    textAlign: 'left',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
    color: '#333',
  },
});
