// ═══════════════════════════════════════════════════════════════════
// HOME SCREEN - Estado actual del trabajador
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, ScrollView
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getEstado, fichar } from "../services/api";

export default function HomeScreen({ navigation }) {
  const { usuario, cerrarSesion } = useAuth();
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [fichando, setFichando] = useState(false);

  // Recargar estado cada vez que la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      cargarEstado();
    }, [])
  );

  async function cargarEstado() {
    setCargando(true);
    try {
      const res = await getEstado(usuario.nombre);
      if (res.ok) setEstado(res);
    } catch (e) {
      console.log("Error cargando estado:", e);
    } finally {
      setCargando(false);
    }
  }

  async function marcarFin() {
    if (!estado?.fichado) return;

    Alert.alert(
      "Marcar Fin",
      `¿Confirmas que terminas en ${estado.pedido} (${estado.departamento})?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar Fin",
          style: "destructive",
          onPress: async () => {
            setFichando(true);
            try {
              const res = await fichar({
                nombre: usuario.nombre,
                serie: estado.serie,
                numero: estado.numero,
                departamento: estado.departamento,
                tipo: "Fin",
              });

              if (res.ok) {
                Alert.alert("✅ Fin registrado", `${res.pedido} · ${res.hora}`);
                cargarEstado();
              } else {
                Alert.alert("Error", res.error);
              }
            } catch (e) {
              Alert.alert("Error de red", "Inténtalo de nuevo");
            } finally {
              setFichando(false);
            }
          },
        },
      ]
    );
  }

  function irAFichar() {
    navigation.navigate("Scanner");
  }

  // ── RENDER ────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saludo}>Hola,</Text>
            <Text style={styles.nombre}>{usuario.nombre}</Text>
            {usuario.esSupervisor && (
              <Text style={styles.badgeSupervisor}>SUPERVISOR</Text>
            )}
          </View>
          <TouchableOpacity onPress={cerrarSesion} style={styles.btnSalir}>
            <Text style={styles.btnSalirTexto}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Estado actual */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Estado actual</Text>

          {cargando ? (
            <ActivityIndicator color="#E85D26" style={{ marginTop: 20 }} />
          ) : estado?.fichado ? (
            <View style={styles.tarjetaFichado}>
              <View style={styles.indicadorActivo} />
              <Text style={styles.fichado}>EN CURSO</Text>
              <Text style={styles.pedidoTexto}>{estado.pedido}</Text>
              <Text style={styles.dptoTexto}>{estado.departamento}</Text>
              <Text style={styles.horaTexto}>Desde las {estado.horaInicio}</Text>

              <TouchableOpacity
                style={styles.btnFin}
                onPress={marcarFin}
                disabled={fichando}
                activeOpacity={0.8}
              >
                {fichando
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.btnFinTexto}>⏹ Marcar FIN</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tarjetaLibre}>
              <Text style={styles.libreEmoji}>🟢</Text>
              <Text style={styles.libreTexto}>Sin fichaje activo</Text>
            </View>
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Acciones</Text>

          <TouchableOpacity
            style={[styles.btnAccion, styles.btnPrimario]}
            onPress={irAFichar}
            activeOpacity={0.8}
          >
            <Text style={styles.btnAccionIcono}>📷</Text>
            <Text style={styles.btnAccionTexto}>Nuevo fichaje</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAccion, styles.btnSecundario]}
            onPress={() => navigation.navigate("Historial")}
            activeOpacity={0.8}
          >
            <Text style={styles.btnAccionIcono}>📋</Text>
            <Text style={styles.btnAccionTexto}>Ver historial de hoy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAccion, styles.btnSecundario]}
            onPress={() => navigation.navigate("CambiarPin")}
            activeOpacity={0.8}
          >
            <Text style={styles.btnAccionIcono}>🔑</Text>
            <Text style={styles.btnAccionTexto}>Cambiar PIN</Text>
          </TouchableOpacity>

          {usuario.esSupervisor && (
            <TouchableOpacity
              style={[styles.btnAccion, styles.btnSupervisor]}
              onPress={() => navigation.navigate("Supervisor")}
              activeOpacity={0.8}
            >
              <Text style={styles.btnAccionIcono}>👁️</Text>
              <Text style={styles.btnAccionTexto}>Panel supervisor</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  scroll: { padding: 24, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingTop: 16,
  },
  saludo: { color: "#888", fontSize: 16 },
  nombre: { color: "#FFFFFF", fontSize: 28, fontWeight: "800" },
  badgeSupervisor: {
    color: "#E85D26",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2,
    marginTop: 2,
  },
  btnSalir: {
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  btnSalirTexto: { color: "#888", fontSize: 14 },

  // Secciones
  seccion: { marginBottom: 28 },
  seccionTitulo: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  // Tarjeta fichado
  tarjetaFichado: {
    backgroundColor: "#1A1A2E",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E85D26",
  },
  indicadorActivo: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E85D26",
    marginBottom: 12,
  },
  fichado: {
    color: "#E85D26",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 3,
    marginBottom: 8,
  },
  pedidoTexto: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
  },
  dptoTexto: {
    color: "#AAA",
    fontSize: 16,
    marginTop: 4,
  },
  horaTexto: {
    color: "#666",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  btnFin: {
    backgroundColor: "#E85D26",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  btnFinTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Tarjeta libre
  tarjetaLibre: {
    backgroundColor: "#1A1A2E",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  libreEmoji: { fontSize: 32, marginBottom: 8 },
  libreTexto: { color: "#888", fontSize: 16 },

  // Botones acción
  btnAccion: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
  },
  btnPrimario: {
    backgroundColor: "#E85D26",
    borderColor: "#E85D26",
  },
  btnSecundario: {
    backgroundColor: "#1A1A2E",
    borderColor: "#2A2A40",
  },
  btnSupervisor: {
    backgroundColor: "#1A1A2E",
    borderColor: "#E85D26",
    borderWidth: 2,
  },
  btnAccionIcono: { fontSize: 20, marginRight: 14 },
  btnAccionTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
