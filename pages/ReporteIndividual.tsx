import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import axios from 'axios';
import { Video, ResizeMode, VideoFullscreenUpdate } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Reporte, Anomalia } from '../types/RootStackParamList';
import { API_BASE_URL } from '../config';

export default function ReporteIndividual() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReporteIndividual'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { reporte, ubicacion } = route.params;

  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshView, setRefreshView] = useState(false);
  const videoRef = useRef<Video>(null);

  const toggleControls = () => {
    if (!isFullscreen) {
      setShowControls(prev => !prev);
    }
  };

  const handleFullscreenUpdate = async (event: any) => {
    if (event.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_PRESENT) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setIsFullscreen(true);
    }
    if (event.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_DISMISS) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
      setRefreshView(true);
      setTimeout(() => setRefreshView(false), 500);
    }
  };

  const getCarpetaFromNombreArchivo = (nombreArchivo: string): string => {
    return nombreArchivo.replace(/_(NO)?PROCESADO\.mp4$/i, '');
  };

  const getNombreProcesado = (nombreArchivo: string): string => {
    return nombreArchivo.replace(/_NOPROCESADO\.mp4$/i, '_PROCESADO.mp4');
  };

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/anomalias`)
      .then((res) => {
        const filtradas = res.data.filter((a: Anomalia) => a.reporteId === reporte.id);
        setAnomalias(filtradas);
      })
      .catch((err) => console.error('Error al obtener anomalías:', err));
  }, []);

  const handleAnomaliaPress = (anomalia: Anomalia) => {
    navigation.navigate('Anomalia', { anomalia, reporte });
  };

  const nombreProcesado = getNombreProcesado(reporte.nombreArchivo);
  const carpeta = getCarpetaFromNombreArchivo(reporte.nombreArchivo);
  const videoUri = `${API_BASE_URL}/videos/${carpeta}/${nombreProcesado}`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!refreshView && (
        <TouchableWithoutFeedback onPress={toggleControls}>
          <Video
            ref={videoRef}
            source={{
              uri: videoUri,
              overrideFileExtensionAndroid: '.mp4',
            }}
            useNativeControls={true}
            shouldPlay={false}
            resizeMode={ResizeMode.CONTAIN}
            onFullscreenUpdate={handleFullscreenUpdate}
            onLoad={() => {
              videoRef.current?.playAsync();
            }}
            onError={(error) => {
              console.error('Error cargando video procesado:', error);
              console.error('Archivo:', nombreProcesado);
              console.error('URI usada:', videoUri);
            }}
            style={styles.video}
          />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.label}>📅 Fecha:</Text>
        <Text style={styles.value}>{reporte.fechaGeneracion}</Text>

        <Text style={styles.label}>📝 Descripción:</Text>
        <Text style={styles.value}>{reporte.descripcion}</Text>

        <Text style={styles.label}>🗺️ Ubicación:</Text>
        <Text style={styles.value}>{ubicacion || 'Ubicación desconocida'}</Text>
      </View>

      {anomalias.map((a, i) => (
        <TouchableOpacity key={a.id} onPress={() => handleAnomaliaPress(a)} style={styles.anomalia}>
          <Text style={styles.anomaliaEstado}>
            {a.estatus.toLowerCase().includes('pendiente') ? '🔕' : '✔️'} Posible anomalía {i + 1}: {a.estatus}
          </Text>
          <Text style={styles.link}>
            Presione aquí para{' '}
            {a.estatus.toLowerCase().includes('pendiente') ? 'atender' : 'volver a revisar'}.
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginTop: 40,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
    color: '#2e383e',
  },
  value: {
    fontSize: 15,
    color: '#333',
    marginTop: 4,
  },
  anomalia: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  anomaliaEstado: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
    color: '#691C32',
  },
  link: {
    color: '#3498db',
    fontWeight: '600',
  },
});
