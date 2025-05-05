import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Principal from './pages/Principal';
import Reportes from './pages/Reportes';
import ReporteIndividual from './pages/ReporteIndividual'
import IniciarDeteccion from './pages/IniciarDeteccion';
import Anomalia from './pages/Anomalia';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Principal" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Principal" component={Principal} />
        <Stack.Screen name="Reportes" component={Reportes} />
        <Stack.Screen name="IniciarDeteccion" component={IniciarDeteccion} />
        <Stack.Screen name="ReporteIndividual" component={ReporteIndividual} />
        <Stack.Screen name="Anomalia" component={Anomalia} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
