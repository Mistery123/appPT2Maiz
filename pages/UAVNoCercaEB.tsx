import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';

const windowWidth = Dimensions.get('window').width;

export default function UAVNoCercaEB() {
  const [coords, setCoords] = useState<{ uav: any; eb: any } | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchCoords = async () => {
      try {
        const [uavRes, ebRes] = await Promise.all([
          axios.get('http://192.168.5.80:3000/coordenadasUAV'),
          axios.get('http://192.168.5.80:3000/coordenadasEB')
        ]);
        setCoords({ uav: uavRes.data, eb: ebRes.data });
      } catch (err) {
        console.error('Error al obtener coordenadas:', err);
        Alert.alert('Error', 'No se pudieron obtener las coordenadas.');
      }
    };

    fetchCoords();
  }, []);

  const handleRetry = () => {
    navigation.goBack();
  };

  const injectedJS = coords
    ? `
    const uav = [${coords.uav.latitud}, ${coords.uav.longitud}];
    const eb = [${coords.eb.latitud}, ${coords.eb.longitud}];

    const map = L.map('map').setView(eb, 17);

    // Capa satelital de Esri
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri'
    }).addTo(map);

    L.marker(uav).addTo(map).bindPopup("📍 UAV").openPopup();
    L.marker(eb).addTo(map).bindPopup("Estación Base");

    const polyline = L.polyline([uav, eb], { color: 'red' }).addTo(map);

    // Calcular distancia
    const R = 6371000; // Radio Tierra en m
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(eb[0] - uav[0]);
    const dLon = toRad(eb[1] - uav[1]);
    const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(uav[0])) * Math.cos(toRad(eb[0])) * Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = (R * c).toFixed(1);

    const midLat = (uav[0] + eb[0]) / 2;
    const midLon = (uav[1] + eb[1]) / 2;

L.marker([midLat, midLon], {
  icon: L.divIcon({
    className: 'distance-label',
    html: \`
      <div style="
        background: rgba(0,0,0,0.75);
        color: #fff;
        padding: 6px 18px;
        border-radius: 16px;
        font-size: 15px;
        font-weight: 600;
        white-space: nowrap;
        min-width: 70px;
        display: inline-block;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      ">
        \${distancia} m
      </div>
    \`
  })
}).addTo(map);


  `
    : '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Posible Anomalía 1</Text>
      <Text style={styles.subtitle}>UAV NO ESTÁ CERCA DE{"\n"}EN ESTACIÓN BASE</Text>

      <View style={styles.mapContainer}>
        {coords && (
          <WebView
            source={require('../assets/leafletMap.html')}
            injectedJavaScript={injectedJS}
            javaScriptEnabled={true}
            style={styles.map}
          />
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.buttonText}>VOLVER A INTENTAR</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Principal')} style={styles.cancelButton}>
          <Text style={styles.buttonText}>CANCELAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  mapContainer: {
    height: 220,
    width: windowWidth - 32,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  map: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
  retryButton: {
    backgroundColor: '#165222',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
