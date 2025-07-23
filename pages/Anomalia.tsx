import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import Modal from 'react-native-modal';
import ImageViewer from 'react-native-image-zoom-viewer';

import { RootStackParamList } from '../types/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API_BASE_URL } from '../config';

const windowWidth = Dimensions.get('window').width;

export default function AnomaliaScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Anomalia'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { anomalia, reporte } = route.params;

  const [ubicacionNombre, setUbicacionNombre] = useState('Cargando ubicación...');
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const folderName = reporte.nombreArchivo.replace('_NOPROCESADO.mp4', '');
  const frameUri = `${API_BASE_URL}/frames/${folderName}/${anomalia.nombreFrame}`;

  const injectedJS = `
    window.dataFromApp = {
      coordenadas: [],
      anomalia: {
        latitud: ${anomalia.latitud},
        longitud: ${anomalia.longitud}
      }
    };
    true;
  `;

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/ubicacion/${anomalia.latitud}/${anomalia.longitud}`)
      .then((res) => setUbicacionNombre(res.data.nombre || 'Ubicación desconocida'))
      .catch(() => setUbicacionNombre('Ubicación desconocida'));
  }, []);

  const handleAttendOption = async (option: string) => {
    setMenuVisible(false);
    let endpoint = '';
    let destinoCerca: keyof RootStackParamList;
    let destinoLejos: keyof RootStackParamList;

    if (option === 'Aérea') {
      endpoint = 'coordenadasUAVEB';
      destinoCerca = 'UAVCercaEB';
      destinoLejos = 'UAVNoCercaEB';
    } else if (option === 'Terrestre') {
      endpoint = 'coordenadasUGVEB';
      destinoCerca = 'UGVCercaEB';
      destinoLejos = 'UGVNoCercaEB';
    } else {
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/${endpoint}`);
      const distancia = res.data.distancia;

      if (distancia > 50) {
        navigation.navigate(destinoLejos, { anomalia, reporte });
      } else {
        navigation.navigate(destinoCerca, { anomalia, reporte });
      }
    } catch (error) {
      console.error(`Error al consultar /${endpoint}:`, error);
      Alert.alert('Error', `No se pudo calcular la distancia (${option}).`);
    }
  };

  const eliminarAnomalia = async () => {
    Alert.alert(
      'Descartar Anomalía',
      '¿Estás seguro de que deseas descartar esta anomalía?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/anomalias/${anomalia.id}`);
              Alert.alert('Anomalía descartada');
              navigation.navigate('Principal');
            } catch (error) {
              console.error('Error al descartar la anomalía:', error);
              Alert.alert('Error', 'No se pudo descartar la anomalía.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Posible Anomalía</Text>

      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image
          source={{ uri: frameUri }}
          style={styles.video}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
        style={{ margin: 0, backgroundColor: '#000' }}
      >
        <ImageViewer
          imageUrls={[{ url: frameUri }]}
          enableSwipeDown={true}
          onSwipeDown={() => setModalVisible(false)}
          backgroundColor="#000"
        />
      </Modal>

      <View style={styles.mapContainer}>
        <WebView
          source={require('../assets/leafletMap.html')}
          injectedJavaScript={injectedJS}
          javaScriptEnabled={true}
          style={styles.map}
        />
      </View>

      <Text style={styles.label}>🗺️ Ubicación:</Text>
      <Text style={styles.text}>{ubicacionNombre}</Text>

      <Text style={styles.label}>📅 Fecha y Hora:</Text>
      <Text style={styles.text}>{reporte.fechaGeneracion}</Text>

      <View style={styles.buttonsContainer}>
        <View style={styles.buttonWrapper}>
          {menuVisible && (
            <View style={styles.dropdown}>
              <TouchableOpacity onPress={() => handleAttendOption('Aérea')} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>VÍA AÉREA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('UGVCercaEB', { anomalia, reporte })}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownText}>VÍA TERRESTRE</Text>
              </TouchableOpacity>

            </View>
          )}

          <TouchableOpacity
            style={styles.attendButton}
            onPress={() => setMenuVisible(!menuVisible)}
          >
            <Text style={styles.buttonText}>{menuVisible ? 'ATENDER ▲' : 'ATENDER ▼'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.discardButton} onPress={eliminarAnomalia}>
          <Text style={styles.buttonText}>DESCARTAR</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 40,
  },
  video: {
    width: windowWidth - 32,
    height: (windowWidth - 32) * 9 / 16,
    borderRadius: 8,
    backgroundColor: '#000',
    alignSelf: 'center',
    marginBottom: 20,
  },
  mapContainer: {
    height: 220,
    width: windowWidth - 32,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 8,
  },
  map: {
    flex: 1,
  },
  label: { fontWeight: 'bold', marginTop: 8 },
  text: { marginBottom: 4 },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    alignItems: 'flex-end',
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  attendButton: {
    backgroundColor: '#165222',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 140,
    alignItems: 'center',
    zIndex: 1,
    marginVertical: 8,
  },
  discardButton: {
    backgroundColor: '#9F2241',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute',
    bottom: 55,
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    width: 140,
    zIndex: 2,
  },
  dropdownItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomColor: '#165222',
    borderBottomWidth: 1,
  },
  dropdownText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
