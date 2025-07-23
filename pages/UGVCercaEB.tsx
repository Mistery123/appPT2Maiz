import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { RootStackParamList } from '../types/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API_BASE_URL, UGV_BASE_URL } from '../config';

const windowWidth = Dimensions.get('window').width;

export default function UGVCercaEB() {
  const route = useRoute<RouteProp<RootStackParamList, 'UGVCercaEB'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { anomalia } = route.params;

  const [mostrarMapa, setMostrarMapa] = useState(true);

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

  const accionarDispersor = async () => {
    try {
      await axios.get(`${API_BASE_URL}/encenderServo`);
      Alert.alert('✅ Dispersor activado');
    } catch {
      Alert.alert('❌ Error al accionar dispersor');
    }
  };

  const detenerDispersor = async () => {
    try {
      await axios.get(`${API_BASE_URL}/apagarServo`);
      Alert.alert('✅ Dispersor detenido');
    } catch {
      Alert.alert('❌ Error al detener dispersor');
    }
  };

  const terminarAtencion = async () => {
    try {
      await axios.put(`${API_BASE_URL}/anomalias/${anomalia.id}/estatus`, {
        estatus: 'resuelta',
      });
      Alert.alert('✅ Anomalía marcada como resuelta');
      navigation.navigate('Principal');
    } catch {
      Alert.alert('❌ Error al actualizar el estatus');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {mostrarMapa ? (
        <>
          <Text style={styles.title}>Traza la ruta hacia la anomalía</Text>

          <View style={styles.mapContainer}>
            <WebView
              source={require('../assets/leafletMap.html')}
              injectedJavaScript={injectedJS}
              javaScriptEnabled
              style={styles.map}
            />
          </View>

          <Text style={styles.subtitulo}>Vista en tiempo real de la estación base</Text>
          <WebView
            source={{ uri: `${UGV_BASE_URL}/mapaMission` }}
            style={styles.stream}
            javaScriptEnabled
            allowsInlineMediaPlayback
          />

          <TouchableOpacity style={styles.botonListo} onPress={() => setMostrarMapa(false)}>
            <Text style={styles.botonTexto}>Listo</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <WebView
            source={{ uri: `${UGV_BASE_URL}/videoOTG` }}
            style={styles.video}
            javaScriptEnabled
            allowsInlineMediaPlayback
          />

          <Text style={styles.subtitulo}>Vista en tiempo real de la estación base</Text>
          <WebView
            source={{ uri: `${UGV_BASE_URL}/mapaMission` }}
            style={styles.stream}
            javaScriptEnabled
            allowsInlineMediaPlayback
          />

          <View style={styles.botonSeccion}>
            <TouchableOpacity style={[styles.boton, styles.botonAzul]} onPress={accionarDispersor}>
              <Text style={styles.botonTexto}>Accionar dispersor</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.boton, styles.botonRojo]} onPress={detenerDispersor}>
              <Text style={styles.botonTexto}>Detener dispersor</Text>
            </TouchableOpacity>

            <View style={styles.filaBotonesInferiores}>
              <TouchableOpacity style={[styles.botonInferior, styles.botonVerde]} onPress={terminarAtencion}>
                <Text style={styles.botonTexto}>Terminar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.botonInferior, styles.botonNegro]} onPress={() => navigation.navigate('Principal')}>
                <Text style={styles.botonTexto}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#2E383E',
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
    color: '#2E383E',
  },
  mapContainer: {
    height: 300,
    width: windowWidth - 32,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    backgroundColor: '#eee',
  },
  map: {
    flex: 1,
  },
  stream: {
    width: windowWidth - 32,
    height: 200,
    marginBottom: 24,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: windowWidth,
    height: 260,
    marginBottom: 24,
    backgroundColor: '#000',
  },
  botonSeccion: {
    width: '90%',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  boton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  filaBotonesInferiores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  botonInferior: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  botonListo: {
    width: '50%',
    backgroundColor: '#165222',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    marginBottom: 24,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonVerde: {
    backgroundColor: '#165222',
  },
  botonNegro: {
    backgroundColor: '#000000',
  },
  botonAzul: {
    backgroundColor: '#4BACC6',
  },
  botonRojo: {
    backgroundColor: '#9F2241',
  },
});
