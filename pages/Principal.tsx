import React from 'react';
import { Text, StyleSheet, Pressable, StatusBar, View, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Principal() {
  const navigation = useNavigation<any>();

  const handleIniciarDeteccion = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/coordenadasUAVEB`);
      const distancia = res.data.distancia;

      if (distancia <= 50) {
        navigation.navigate('IniciarDeteccion');
      } else {
        navigation.navigate('UAVNoCercaEB');
      }
    } catch (error) {
      console.error('Error al obtener coordenadas:', error);
      Alert.alert('Error', 'No se pudo calcular la distancia UAV-EB');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topContainer}>
        <Text style={styles.title}>Bienvenido</Text>
      </View>

      <View style={styles.middleContainer}>
        <Text style={styles.description}>
          Monitorea, detecta y actúa sobre las anomalías en tus cultivos de maíz.
          Visualiza reportes procesados por IA, accede a videos capturados por el UAV y
          toma decisiones inteligentes para optimizar tu producción agrícola.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable android_ripple={{ color: 'transparent' }} onPress={() => navigation.navigate('Reportes')}>
          <LinearGradient
            colors={['#165222', '#0d2e12']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>VER REPORTES</Text>
          </LinearGradient>
        </Pressable>

        <Pressable android_ripple={{ color: 'transparent' }} onPress={handleIniciarDeteccion}>
          <LinearGradient
            colors={['#165222', '#0d2e12']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, styles.secondButton]}
          >
            <Text style={styles.buttonText}>INICIAR DETECCIÓN</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  topContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  middleContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    color: '#000',
    marginTop: 100,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 100,
    elevation: 4,
    minWidth: 220,
    alignItems: 'center',
  },
  secondButton: {
    marginTop: 50,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
