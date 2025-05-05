import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { MaterialIcons, Entypo, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { RootStackParamList } from '../types/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Reporte } from '../types/RootStackParamList';

export default function Reportes() {
  const [ubicaciones, setUbicaciones] = useState<Record<number, string>>({});
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    axios
      .get('http://192.168.5.151:3000/reportes')
      .then((res) => {
        setReportes(res.data);
        res.data.forEach((rep: Reporte) => {
          fetchUbicacion(rep.latitud, rep.longitud, rep.id);
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Error al obtener reportes:', err);
        setLoading(false);
      });
  }, []);

  const fetchUbicacion = async (lat: number, lon: number, id: number) => {
    try {
      const res = await axios.get(`http://192.168.5.151:3000/ubicacion/${lat}/${lon}`);
      setUbicaciones(prev => ({ ...prev, [id]: res.data.nombre }));
    } catch (err) {
      console.error(`Error al obtener ubicación para reporte ${id}:`, err);
      setUbicaciones(prev => ({ ...prev, [id]: "Ubicación desconocida" }));
    }
  };

  const renderEstado = (estatus: string) => {
    if (estatus.toLowerCase().includes('sin atender')) {
      return (
        <View style={styles.estadoRow}>
          <MaterialIcons name="error" size={16} color="#9F2241" />
          <Text style={[styles.estadoTexto, { color: '#9F2241' }]}> Sin atender</Text>
        </View>
      );
    } else if (estatus.toLowerCase().includes('atendido') && estatus.includes('%')) {
      return (
        <View style={styles.estadoRow}>
          <Entypo name="warning" size={16} color="#f2a654" />
          <Text style={[styles.estadoTexto, { color: '#f2a654' }]}> {estatus}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.estadoRow}>
          <FontAwesome name="check" size={16} color="#46c35f" />
          <Text style={[styles.estadoTexto, { color: '#46c35f' }]}> Atendido</Text>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#165222" />
        <Text style={{ marginTop: 10 }}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Reportes Generados</Text>
      {reportes.map((rep) => (
        <TouchableOpacity
          key={rep.id}
          style={styles.card}
          onPress={() => navigation.navigate('ReporteIndividual', { reporte: rep, ubicacion: ubicaciones[rep.id] })}
        >
          <Text style={styles.label}>📅 Fecha:</Text>
          <Text>{rep.fechaGeneracion}</Text>

          <Text style={styles.label}>📝 Descripción:</Text>
          <Text numberOfLines={2}>{rep.descripcion}</Text>

          <Text>{ubicaciones[rep.id] || "Resolviendo ubicación..."}</Text>

          <Text style={styles.label}>🔘 Estado:</Text>
          {renderEstado(rep.estatus)}
        </TouchableOpacity>

      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    width: '90%',
    borderColor: '#ccc',
    borderWidth: 1,
    elevation: 3,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  estadoTexto: {
    fontWeight: 'bold',
  },
});
