import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL, VIDEO_BASE_URL } from '../config';

const windowWidth = Dimensions.get('window').width;
const videoHeight = (windowWidth * 9) / 16;

export default function IniciarDeteccion() {
  const navigation = useNavigation<any>();
  const [descripcion, setDescripcion] = useState('');
  const [procesoIniciado, setProcesoIniciado] = useState(false);
  const [idReporte, setIdReporte] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);

  const ajustarHoraYFecha = (fecha: string, hora: string) => {
    const [dia, mes, anio] = fecha.split('/').map(Number);
    const [h, m, s] = hora.split(':').map(Number);
    let date = new Date(anio, mes - 1, dia, h, m, s);
    date.setHours(date.getHours() - 6);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  const iniciarProceso = async () => {
    if (!descripcion.trim()) {
      Alert.alert('Advertencia', 'Por favor ingresa una descripción del campo.');
      return;
    }

    try {
      setCargando(true);
      const resCoords = await axios.get(`${API_BASE_URL}/coordenadasEB`);
      const { latitud, longitud, fecha, hora } = resCoords.data;
      const fechaGeneracion = ajustarHoraYFecha(fecha, hora);

      const nuevoReporte = {
        fechaGeneracion,
        descripcion,
        nombreArchivo: 'a',
        latitud,
        longitud,
        estatus: 'pendiente',
      };

      const resReporte = await axios.post(`${API_BASE_URL}/reportes`, nuevoReporte);
      const id = resReporte.data.id;
      setIdReporte(id);

      await axios.get(`${VIDEO_BASE_URL}/inferencia/${id}`);
      setProcesoIniciado(true);
    } catch (error) {
      console.error('Error al iniciar el proceso:', error);
      Alert.alert('Error', 'No se pudo iniciar el proceso.');
    } finally {
      setCargando(false);
    }
  };

  const detenerProceso = async () => {
    try {
      await axios.get(`${VIDEO_BASE_URL}/detener-inferencia`);
      navigation.navigate('Principal');
    } catch (error) {
      console.error('Error al detener el proceso:', error);
      Alert.alert('Error', 'No se pudo detener la inferencia.');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <WebView
            source={{ uri: `${VIDEO_BASE_URL}/videoUAV` }}
            style={styles.video}
          />

          {!procesoIniciado && (
            <TextInput
              style={styles.input}
              placeholder="Descripción del campo"
              value={descripcion}
              onChangeText={setDescripcion}
            />
          )}

          {cargando && <ActivityIndicator size="large" color="#165222" style={{ marginTop: 20 }} />}

          {!procesoIniciado && !cargando && (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.startButton} onPress={iniciarProceso}>
                <Text style={styles.buttonText}>Iniciar Proceso</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {procesoIniciado && (
            <TouchableOpacity style={styles.stopButton} onPress={detenerProceso}>
              <Text style={styles.buttonText}>Detener Proceso</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    marginTop: 20,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  video: {
    width: windowWidth - 32,
    height: videoHeight,
    borderRadius: 10,
    alignSelf: 'center',
    backgroundColor: '#000',
    marginBottom: 16,
  },
  input: {
    borderColor: '#165222',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#165222',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
    marginLeft: 8,
  },
  stopButton: {
    marginTop: 20,
    backgroundColor: '#9F2241',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
