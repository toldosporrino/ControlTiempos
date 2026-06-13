// ═══════════════════════════════════════════════════════════════════
// SUPERVISOR SCREEN - Panel de control
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getSesionesAbiertas, cerrarSesionAjena } from "../services/api";

export default function SupervisorScreen() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [cerrando, setCerrando] = useState(null);

  useFocusEffect(
    useCallback(() => {
      cargar();
      const interval = setInterval(cargar, 30000);
      return () => clearInterval(interval);
    }, [])
  );

  async function cargar(esRefresh = false) {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);

    try {
      const res = await getSesionesAbiertas();
      if (res.ok) setDatos(res);
    } catch (e) {
      console.log("Error:", e);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  function confirmarCierre(nombre) {
    Alert.alert(
      "Cerrar sesión",
      `¿Cerrar el fichaje de ${nombre}? Se registrará la hora actual como FIN.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar fichaje",
          style: "destructive",
          onPress: () => ejecutarCierre(nombre),
        },
      ]
    );
  }

  async function ejecutarCierre(nombre) {
    setCerrando(nombre);
    try {
      const res = await cerrarSesionAjena(nombre, usuario.nombre);
      if (res.ok) {
        Alert.alert("✅ Sesión cerrada", `Fichaje de ${nombre} cerrado correctamente`);
        cargar();
      } else {
        Alert.alert("Error", res.error || "No se pudo cerrar la sesión");
      }
    } catch (e) {
      Alert.alert("Error de red", "Inténtalo de nuevo");
    } finally {
      setCerrando(null);
    }
  }

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#E85D26" />
        <Text style={styles.loadingTexto}>Cargando datos...</Text>
      </View>
    );
  }

  const alertas = datos?.sesiones?.filter(s => s.alerta) || [];
  const activos = datos?.sesiones || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargar(true)}
            tintColor="#E85D26"
          />
        }
      >
        {/* Resumen */}
        <View style={styles.resumenRow}>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenNum}>{activos.length}</Text>
            <Text style={styles.resumenLabel}>Trabajando ahora</Text>
          </View>
          <View style={[styles.resumenCard, alertas.length > 0 && styles.resumenAlerta]}>
            <Text style={styles.resumenNum}>{alertas.length}</Text>
            <Text style={styles.resumenLabel}>Alertas</Text>
          </View>
        </View>

        {/* Alertas */}
        {alertas.length > 0 && (
          <>
            <Text style={styles.seccionTitulo}>⚠️ Alertas (más de 8h)</Text>
            {alertas.map((s, i) => (
              <View key={i} style={styles.alertaCard}>
                <View style={styles.alertaRow}>
                  <View style={styles.alertaInfo}>
                    <Text style={styles.alertaNombre}>{s.nombre}</Text>
                    <Text style={styles.alertaDetalle}>{s.pedido} · {s.departamento}</Text>
                    <Text style={styles.alertaTiempo}>⏱ {s.tiempoTexto} desde las {s.horaInicio}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.btnCerrar}
                    onPress={() => confirmarCierre(s.nombre)}
                    disabled={cerrando === s.nombre}
                  >
                    {cerrando === s.nombre
                      ? <ActivityIndicator size="small" color="#FFF" />
                      : <Text style={styles.btnCerrarTexto}>Cerrar</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Sesiones activas */}
        <Text style={styles.seccionTitulo}>En curso ahora</Text>

        {activos.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTexto}>Nadie fichado ahora mismo</Text>
          </View>
        ) : (
          activos.map((s, i) => (
            <View key={i} style={[styles.sesionCard, s.alerta && styles.sesionAlerta]}>
              <View style={styles.sesionHeader}>
                <View style={styles.inicial}>
                  <Text style={styles.inicialTexto}>{s.nombre.charAt(0)}</Text>
                </View>
                <View style={styles.sesionInfo}>
                  <Text style={styles.sesionNombre}>{s.nombre}</Text>
                  <Text style={styles.sesionPedido}>{s.pedido}</Text>
                  <Text style={styles.sesionDpto}>{s.departamento}</Text>
                </View>
                <View style={styles.sesionDerecha}>
                  <View style={styles.sesionTiempo}>
                    <Text style={styles.sesionTiempoTexto}>{s.tiempoTexto}</Text>
                    <Text style={styles.sesionHora}>desde {s.horaInicio}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.btnCerrarSmall}
                    onPress={() => confirmarCierre(s.nombre)}
                    disabled={cerrando === s.nombre}
                  >
                    {cerrando === s.nombre
                      ? <ActivityIndicator size="small" color="#FFF" />
                      : <Text style={styles.btnCerrarSmallTexto}>✕</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <Text style={styles.ultimaActualizacion}>
          Se actualiza cada 30s · Desliza para refrescar
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  scroll: { padding: 24, paddingBottom: 40 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F0F1A" },
  loadingTexto: { color: "#666", marginTop: 12 },

  resumenRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  resumenCard: {
    flex: 1, backgroundColor: "#1A1A2E", borderRadius: 16,
    padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#2A2A40",
  },
  resumenAlerta: { borderColor: "#FF6B35" },
  resumenNum: { color: "#FFFFFF", fontSize: 36, fontWeight: "900" },
  resumenLabel: { color: "#888", fontSize: 12, marginTop: 4, textAlign: "center" },

  seccionTitulo: {
    color: "#888", fontSize: 12, fontWeight: "600",
    letterSpacing: 2, textTransform: "uppercase", marginBottom: 12,
  },

  alertaCard: {
    backgroundColor: "#2A1500", borderRadius: 14, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: "#FF6B35",
  },
  alertaRow: { flexDirection: "row", alignItems: "center" },
  alertaInfo: { flex: 1 },
  alertaNombre: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  alertaDetalle: { color: "#AAA", fontSize: 13, marginTop: 2 },
  alertaTiempo: { color: "#FF6B35", fontSize: 13, marginTop: 4 },
  btnCerrar: {
    backgroundColor: "#C62828",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 12,
    minWidth: 60,
    alignItems: "center",
  },
  btnCerrarTexto: { color: "#FFF", fontSize: 13, fontWeight: "700" },

  vacio: { backgroundColor: "#1A1A2E", borderRadius: 16, padding: 32, alignItems: "center" },
  vacioTexto: { color: "#666", fontSize: 15 },

  sesionCard: {
    backgroundColor: "#1A1A2E", borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: "#2A2A40",
  },
  sesionAlerta: { borderColor: "#FF6B35" },
  sesionHeader: { flexDirection: "row", alignItems: "center" },
  inicial: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#E85D26", justifyContent: "center", alignItems: "center",
    marginRight: 14,
  },
  inicialTexto: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  sesionInfo: { flex: 1 },
  sesionNombre: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  sesionPedido: { color: "#E85D26", fontSize: 14, fontWeight: "600", marginTop: 2 },
  sesionDpto: { color: "#888", fontSize: 12, marginTop: 1 },
  sesionDerecha: { alignItems: "flex-end", gap: 8 },
  sesionTiempo: { alignItems: "flex-end" },
  sesionTiempoTexto: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  sesionHora: { color: "#666", fontSize: 11, marginTop: 2 },
  btnCerrarSmall: {
    backgroundColor: "#C62828",
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  btnCerrarSmallTexto: { color: "#FFF", fontSize: 14, fontWeight: "700" },

  ultimaActualizacion: { color: "#444", fontSize: 11, textAlign: "center", marginTop: 20 },
});
