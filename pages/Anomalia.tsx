import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import axios from 'axios';

import { RootStackParamList } from '../types/RootStackParamList';
import coordenadas from '../assets/mapeo_coordenadas'; // archivo .js con array de coordenadas exportado

const windowWidth = Dimensions.get('window').width;

export default function AnomaliaScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Anomalia'>>();
  const { anomalia, reporte } = route.params;

  const videoRef = useRef<Video>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [ubicacionNombre, setUbicacionNombre] = useState('Cargando ubicación...');
  const [menuVisible, setMenuVisible] = useState(false);
  const [puntoMarcado, setPuntoMarcado] = useState<{ lat: number; lon: number } | null>(null);
  const [puntosGuardados, setPuntosGuardados] = useState<
    { lat: number; lon: number; tiempo: number }[]
  >([]);

  const videoUri = `http://192.168.5.151:3000/videos/${reporte.nombreArchivo.replace(
    'NOPROCESADO',
    'PROCESADO'
  )}`;

  const onWebViewMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    setPuntoMarcado({ lat: data.lat, lon: data.lon });
    Alert.alert('📍 Punto tocado', `Lat: ${data.lat.toFixed(6)}\nLon: ${data.lon.toFixed(6)}`);
  };

  const injectedJS = `
  window.dataFromApp = {
    coordenadas: ${JSON.stringify(coordenadas)},
    anomalia: ${JSON.stringify(anomalia)}
  };
  true;
`;


  useEffect(() => {
    axios
      .get(`http://192.168.5.151:3000/ubicacion/${anomalia.latitud}/${anomalia.longitud}`)
      .then((res) => setUbicacionNombre(res.data.nombre || 'Ubicación desconocida'))
      .catch(() => setUbicacionNombre('Ubicación desconocida'));
  }, []);

  useEffect(() => {
    if (videoReady && videoRef.current && anomalia.minutoDetectado) {
      const seconds = anomalia.minutoDetectado * 60;
      videoRef.current.setPositionAsync(seconds * 1000);
    }
  }, [videoReady]);

  const marcarMomentoDelVideo = async () => {
    if (videoRef.current && puntoMarcado) {
      const status = await videoRef.current.getStatusAsync();

      if ('positionMillis' in status && status.isLoaded) {
        const tiempoSegundos = status.positionMillis / 1000;
      
        const nuevoPunto = {
          lat: puntoMarcado.lat,
          lon: puntoMarcado.lon,
          tiempo: parseFloat(tiempoSegundos.toFixed(2))
        };
      
        setPuntosGuardados([...puntosGuardados, nuevoPunto]);
        Alert.alert(
          '📌 Punto guardado',
          `Lat: ${nuevoPunto.lat.toFixed(6)}\nLon: ${nuevoPunto.lon.toFixed(6)}\nSegundo: ${nuevoPunto.tiempo}`
        );
      }
      
    }
  };

  const handleAttendOption = (option: string) => {
    console.log('Atender vía:', option);
    setMenuVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Posible Anomalía {anomalia.id}</Text>

      <Video
        ref={videoRef}
        source={{ uri: videoUri, overrideFileExtensionAndroid: '.mp4' }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        onReadyForDisplay={() => setVideoReady(true)}
        style={styles.video}
      />

      <View style={styles.mapContainer}>
        <WebView
          source={require('../assets/leafletMap.html')}
          injectedJavaScript={injectedJS}
          javaScriptEnabled={true}
          onMessage={onWebViewMessage}
          style={styles.map}
        />
      </View>

      <TouchableOpacity onPress={marcarMomentoDelVideo} style={styles.attendButton}>
        <Text style={styles.buttonText}>Guardar Punto</Text>
      </TouchableOpacity>

      <Text style={styles.label}>🗺️ Ubicación:</Text>
      <Text style={styles.text}>{ubicacionNombre}</Text>

      <Text style={styles.label}>📅 Fecha y Hora:</Text>
      <Text style={styles.text}>{reporte.fechaGeneracion}</Text>

      <Text style={styles.label}>⏱ Minuto:</Text>
      <Text style={styles.text}>{anomalia.minutoDetectado}</Text>

      <View style={styles.buttonsContainer}>
        <View style={styles.buttonWrapper}>
          {menuVisible && (
            <View style={styles.dropdown}>
              <TouchableOpacity onPress={() => handleAttendOption('Aérea')} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>VÍA AÉREA</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleAttendOption('Terrestre')} style={styles.dropdownItem}>
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

        <TouchableOpacity style={styles.discardButton}>
          <Text style={styles.buttonText}>DESCARTAR</Text>
        </TouchableOpacity>
      </View>

      {puntosGuardados.length > 0 && (
        <>
          <Text style={[styles.label, { marginTop: 20 }]}>📍 Puntos Guardados:</Text>
          {puntosGuardados.map((p, index) => (
            <Text key={index} style={styles.text}>
              {index + 1}. Lat: {p.lat.toFixed(6)}, Lon: {p.lon.toFixed(6)}, Tiempo: {p.tiempo}s
            </Text>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
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
    backgroundColor: '#000',
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
