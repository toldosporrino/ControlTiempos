// ═══════════════════════════════════════════════════════════════════
// APP.JS - Navegación principal
// ═══════════════════════════════════════════════════════════════════

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, StyleSheet } from "react-native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import FicharScreen from "./src/screens/FicharScreen";
import HistorialScreen from "./src/screens/HistorialScreen";
import CambiarPinScreen from "./src/screens/CambiarPinScreen";
import SupervisorScreen from "./src/screens/SupervisorScreen";
import AnalisisPedidosScreen from "./src/screens/AnalisisPedidosScreen";

const Stack = createStackNavigator();

function NavegacionPrincipal() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#E85D26" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#1A1A2E" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold" },
        cardStyle: { backgroundColor: "#0F0F1A" },
      }}
    >
      {!usuario ? (
        // Sin sesión → Login
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        // Con sesión → App
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ title: "Escanear QR", headerShown: false }}
          />
          <Stack.Screen
            name="Fichar"
            component={FicharScreen}
            options={{ title: "Fichar" }}
          />
          <Stack.Screen
            name="Historial"
            component={HistorialScreen}
            options={{ title: "Mi Historial" }}
          />
          <Stack.Screen
            name="CambiarPin"
            component={CambiarPinScreen}
            options={{ title: "Cambiar PIN" }}
          />
          <Stack.Screen
            name="Supervisor"
            component={SupervisorScreen}
            options={{ title: "Panel Supervisor" }}
          />
          <Stack.Screen
            name="AnalisisPedidos"
            component={AnalisisPedidosScreen}
            options={{ title: "Análisis Pedidos" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <NavegacionPrincipal />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F1A",
  },
});
