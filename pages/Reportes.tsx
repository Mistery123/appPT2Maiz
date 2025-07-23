import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { MaterialIcons, Entypo, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { RootStackParamList } from '../types/RootStackParamList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Reporte } from '../types/RootStackParamList';
import { API_BASE_URL } from '../config';

export default function Reportes() {
  const [ubicaciones, setUbicaciones] = useState<Record<number, string>>({});
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/reportes`)
      .then((res) => {
        const ordenados = ordenarReportes(res.data);
        setReportes(ordenados);
        ordenados.forEach((rep: Reporte) => {
          fetchUbicacion(rep.latitud, rep.longitud, rep.id);
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al obtener reportes:', err);
        setLoading(false);
      });
  }, []);

const ordenarReportes = (data: Reporte[]) => {
  const parseFecha = (fecha: string) => new Date(fecha).getTime();

  const pendientes = data
    .filter(r => r.estatus.toLowerCase() === 'pendiente')
    .sort((a, b) => parseFecha(b.fechaGeneracion) - parseFecha(a.fechaGeneracion));

  const resueltos = data
    .filter(r => r.estatus.toLowerCase() === 'resuelto')
    .sort((a, b) => parseFecha(b.fechaGeneracion) - parseFecha(a.fechaGeneracion));

  const descartados = data
    .filter(r => r.estatus.toLowerCase() === 'descartada')
    .sort((a, b) => parseFecha(b.fechaGeneracion) - parseFecha(a.fechaGeneracion));

  return [...pendientes, ...resueltos, ...descartados];
};

  const fetchUbicacion = async (lat: number, lon: number, id: number) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/ubicacion/${lat}/${lon}`);
      setUbicaciones((prev) => ({ ...prev, [id]: res.data.nombre }));
    } catch (err) {
      console.error(`Error al obtener ubicación para reporte ${id}:`, err);
      setUbicaciones((prev) => ({ ...prev, [id]: 'Ubicación desconocida' }));
    }
  };

  const eliminarReporte = async (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este reporte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/reportes/${id}`);
              setReportes((prev) => prev.filter((r) => r.id !== id));
            } catch (error) {
              console.error('Error al eliminar reporte:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderEstado = (estatus: string) => {
    const est = estatus.toLowerCase();
    if (est === 'pendiente') {
      return (
        <View style={styles.estadoRow}>
          <MaterialIcons name="error" size={16} color="#9F2241" />
          <Text style={[styles.estadoTexto, { color: '#9F2241' }]}> Pendiente</Text>
        </View>
      );
    } else if (est === 'resuelto') {
      return (
        <View style={styles.estadoRow}>
          <FontAwesome name="check" size={16} color="#46c35f" />
          <Text style={[styles.estadoTexto, { color: '#46c35f' }]}> Resuelto</Text>
        </View>
      );
    } else if (est === 'descartada') {
      return (
        <View style={styles.estadoRow}>
          <Entypo name="circle-with-cross" size={16} color="#6F7271" />
          <Text style={[styles.estadoTexto, { color: '#6F7271' }]}> Descartado</Text>
        </View>
      );
    } else {
      return <Text style={styles.estadoTexto}>Estado desconocido</Text>;
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
        <View key={rep.id} style={styles.card}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ReporteIndividual', {
                reporte: rep,
                ubicacion: ubicaciones[rep.id],
              })
            }
          >
            <Text style={styles.label}>📅 Fecha:</Text>
            <Text style={styles.value}>{rep.fechaGeneracion}</Text>

            <Text style={styles.label}>📝 Descripción:</Text>
            <Text style={styles.value} numberOfLines={2}>
              {rep.descripcion}
            </Text>

            <Text style={styles.label}>📍 Ubicación:</Text>
            <Text style={styles.value}>{ubicaciones[rep.id] || 'Resolviendo ubicación...'}</Text>

            <Text style={styles.label}>🔘 Estado:</Text>
            {renderEstado(rep.estatus)}
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonEliminar} onPress={() => eliminarReporte(rep.id)}>
            <Text style={styles.botonTexto}>🗑️ Eliminar</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 40,
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
  value: {
    marginBottom: 8,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  estadoTexto: {
    fontWeight: 'bold',
  },
  botonEliminar: {
    backgroundColor: '#f2f7f8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderColor: '#f96868',
    borderWidth: 1,
    marginTop: 16,
    alignItems: 'center',
  },
  botonTexto: {
    fontWeight: '600',
    color: '#2e383e',
  },
});
