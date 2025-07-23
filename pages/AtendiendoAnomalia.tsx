import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { API_BASE_URL, VIDEO_BASE_URL } from '../config';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const windowWidth = Dimensions.get('window').width;

export default function AtendiendoAnomalia() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AtendiendoAnomalia'>>();

  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);

  const anomalia = route.params?.anomalia;

  useEffect(() => {
    const obtenerCoordenadas = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/coordenadasUAV`);
        setLatitud(res.data.latitud);
        setLongitud(res.data.longitud);
      } catch (error) {
        console.error('Error al obtener coordenadas del UAV:', error);
      }
    };

    obtenerCoordenadas();
    const intervalo = setInterval(obtenerCoordenadas, 2000);
    return () => clearInterval(intervalo);
  }, []);


  const injectedJS = `
  window.dataFromApp = {
    uav: {
      latitud: ${latitud},
      longitud: ${longitud}
    },
    coordenadas: []
  };
  true;
`;


  const activarDispensador = async () => {
    try {
      await axios.get(`${API_BASE_URL}/encenderServo`);
      Alert.alert('Éxito', 'Dispensador activado.');
    } catch (error) {
      console.error('Error al activar dispensador:', error);
      Alert.alert('Error', 'No se pudo activar el dispensador.');
    }
  };

  const desactivarDispensador = async () => {
    try {
      await axios.get(`${API_BASE_URL}/apagarServo`);
      Alert.alert('Éxito', 'Dispensador desactivado.');
    } catch (error) {
      console.error('Error al desactivar dispensador:', error);
      Alert.alert('Error', 'No se pudo desactivar el dispensador.');
    }
  };

  const terminarAtencion = async () => {
    if (!anomalia?.id) {
      Alert.alert('Error', 'No se encontró el ID de la anomalía.');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/anomalias/${anomalia.id}/estatus`, {
        estatus: 'resuelta',
      });
      Alert.alert('Éxito', 'Anomalía marcada como resuelta.');
      navigation.navigate('Principal');
    } catch (error) {
      console.error('Error al actualizar anomalía:', error);
      Alert.alert('Error', 'No se pudo actualizar la anomalía.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Posible Anomalía 1</Text>

      <View style={styles.videoBox}>
        <WebView
          source={{ uri: `${VIDEO_BASE_URL}/videoUAV` }}
          allowsInlineMediaPlayback
          javaScriptEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          style={styles.videoStream}
        />
      </View>

      <View style={styles.mapContainer}>
        <WebView
          source={require('../assets/leafletMap.html')}
          injectedJavaScript={injectedJS}
          javaScriptEnabled={true}
          style={styles.map}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonLeft} onPress={activarDispensador}>
          <Text style={styles.buttonText}>Activar dispensador</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonRight} onPress={desactivarDispensador}>
          <Text style={styles.buttonText}>Desactivar dispensador</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonLeft} onPress={terminarAtencion}>
          <Text style={styles.buttonText}>Terminar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonRightCancel} onPress={() => navigation.navigate('Principal')}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  videoBox: {
    height: 200,
    width: windowWidth - 32,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignSelf: 'center',
    marginBottom: 16,
  },
  videoStream: {
    flex: 1,
  },
  mapContainer: {
    height: 220,
    width: windowWidth - 32,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 10,
  },
  buttonLeft: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#165222',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  buttonRight: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#6F7271',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  buttonRightCancel: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#9F2241',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
