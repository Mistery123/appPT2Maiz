import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import axios from 'axios';
import { Video, ResizeMode, VideoFullscreenUpdate } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';


import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Reporte, Anomalia } from '../types/RootStackParamList';




export default function ReporteIndividual() {
    const route = useRoute<RouteProp<RootStackParamList, 'ReporteIndividual'>>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { reporte, ubicacion } = route.params as { reporte: Reporte; ubicacion: string };

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

    useEffect(() => {
        axios
            .get(`http://192.168.5.151:3000/anomalias`)
            .then((res) => {
                const filtradas = res.data.filter((a: Anomalia) => a.reporteId === reporte.id);
                setAnomalias(filtradas);
            })
            .catch((err) => console.error('Error al obtener anomalías:', err));
    }, []);

    const handleAnomaliaPress = (anomalia: Anomalia) => {
        navigation.navigate('Anomalia', { anomalia, reporte });
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {!refreshView && (
                <TouchableWithoutFeedback onPress={toggleControls}>
                    <Video
                        ref={videoRef}
                        source={{
                            uri: `http://192.168.5.151:3000/videos/${reporte.nombreArchivo}`,
                            overrideFileExtensionAndroid: '.mp4',
                        }}
                        useNativeControls={showControls}
                        shouldPlay={false}
                        resizeMode={ResizeMode.CONTAIN}
                        onFullscreenUpdate={handleFullscreenUpdate}
                        onLoad={() => {
                            console.log('Video cargado:', reporte.nombreArchivo);
                            videoRef.current?.playAsync();
                        }}
                        onError={(error) => {
                            console.error('Error cargando video:', error);
                            console.error('Nombre del archivo al fallar:', reporte.nombreArchivo);
                        }}
                        style={{
                            width: Dimensions.get('window').width - 32,
                            height: (Dimensions.get('window').width - 32) * 9 / 16,
                            borderRadius: 8,
                            backgroundColor: '#000',
                            alignSelf: 'center',
                            marginBottom: 20,
                        }}
                    />


                </TouchableWithoutFeedback>

            )}

            <Text style={styles.label}>📅 Fecha:</Text>
            <Text>{reporte.fechaGeneracion}</Text>

            <Text style={styles.label}>📝 Descripción:</Text>
            <Text>{reporte.descripcion}</Text>

            <Text style={styles.label}>🗺️ Ubicación:</Text>
            <Text>{ubicacion || 'Ubicación desconocida'}</Text>

            {anomalias.map((a, i) => (
                <TouchableOpacity key={a.id} onPress={() => handleAnomaliaPress(a)} style={styles.anomalia}>
                    <Text style={styles.anomaliaEstado}>
                        {a.estatus.toLowerCase().includes('pendiente') ? '🔕' : '✔️'} Posible anomalía {i + 1}: {a.estatus}.
                    </Text>
                    <Text>
                        Minuto {a.minutoDetectado}.{' '}
                        <Text style={styles.link}>Presione aquí para {a.estatus.toLowerCase().includes('pendiente') ? 'atender' : 'volver a revisar'}.</Text>
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    video: {
        width: Dimensions.get('window').width - 32,
        height: 200,
        borderRadius: 8,
        backgroundColor: '#000',
        marginBottom: 20,
        alignSelf: 'center'
    },
    label: {
        fontWeight: 'bold',
        marginTop: 12,
    },
    anomalia: {
        marginTop: 20,
    },
    anomaliaEstado: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    link: {
        color: '#3498db',
        fontWeight: '600',
    },
});
