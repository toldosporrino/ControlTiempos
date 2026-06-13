// ═══════════════════════════════════════════════════════════════════
// FICHAR SCREEN - Seleccionar departamento y confirmar fichaje
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { getEstado, fichar } from "../services/api";

const DEPARTAMENTOS = ["Confección", "Taller", "Instalación"];

export default function FicharScreen({ route, navigation }) {
  const { serie, numero } = route.params;
  const { usuario } = useAuth();

  const [departamento, setDepartamento] = useState(null);
  const [estadoActual, setEstadoActual] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [cambiandoPedido, setCambiandoPedido] = useState(false);

  useEffect(() => {
    Promise.all([comprobarEstado(), cargarUltimoDepartamento()]);
  }, []);

  async function cargarUltimoDepartamento() {
    try {
      const saved = await AsyncStorage.getItem(`last_dept_${usuario.nombre}`);
      if (saved && DEPARTAMENTOS.includes(saved)) {
        setDepartamento(saved);
      }
    } catch (e) {
      // ignorar
    }
  }

  async function seleccionarDepartamento(d) {
    setDepartamento(d);
    try {
      await AsyncStorage.setItem(`last_dept_${usuario.nombre}`, d);
    } catch (e) {
      // ignorar
    }
  }

  async function comprobarEstado() {
    try {
      const res = await getEstado(usuario.nombre);
      if (res.ok) setEstadoActual(res);
    } catch (e) {
      console.log("Error:", e);
    } finally {
      setCargando(false);
    }
  }

  async function confirmarFichaje(tipo) {
    if (!departamento) {
      Alert.alert("Selecciona departamento", "Elige el departamento antes de fichar");
      return;
    }

    setEnviando(true);
    try {
      const res = await fichar({
        nombre: usuario.nombre,
        serie,
        numero,
        departamento,
        tipo,
      });

      if (res.ok) {
        Alert.alert(
          tipo === "Inicio" ? "✅ Inicio registrado" : "✅ Fin registrado",
          `Pedido: ${res.pedido}\nDepartamento: ${departamento}\nHora: ${res.hora}`,
          [{ text: "OK", onPress: () => navigation.navigate("Home") }]
        );
      } else {
        Alert.alert("Error", res.error || "No se pudo registrar el fichaje");
      }
    } catch (e) {
      Alert.alert("Error de red", "Inténtalo de nuevo");
    } finally {
      setEnviando(false);
    }
  }

  // Cierra el pedido actual y abre el nuevo en un solo paso
  async function cambiarDePedido() {
    if (!departamento) {
      Alert.alert("Selecciona departamento", "Elige el departamento del nuevo pedido");
      return;
    }

    setCambiandoPedido(true);
    try {
      const resFin = await fichar({
        nombre: usuario.nombre,
        serie: estadoActual.serie,
        numero: estadoActual.numero,
        departamento: estadoActual.departamento,
        tipo: "Fin",
      });

      if (!resFin.ok) {
        Alert.alert("Error", "No se pudo cerrar el fichaje anterior: " + (resFin.error || ""));
        return;
      }

      const resInicio = await fichar({
        nombre: usuario.nombre,
        serie,
        numero,
        departamento,
        tipo: "Inicio",
      });

      if (resInicio.ok) {
        Alert.alert(
          "✅ Cambio registrado",
          `Cerrado: ${estadoActual.pedido}\nAbierto: ${resInicio.pedido}\nHora: ${resInicio.hora}`,
          [{ text: "OK", onPress: () => navigation.navigate("Home") }]
        );
      } else {
        Alert.alert("Error", resInicio.error || "No se pudo abrir el nuevo fichaje");
      }
    } catch (e) {
      Alert.alert("Error de red", "Inténtalo de nuevo");
    } finally {
      setCambiandoPedido(false);
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────

  const pedidoID = `${serie}-${("000" + numero).slice(-3)}`;
  const esMismoPedido = estadoActual?.fichado &&
    estadoActual.serie === serie &&
    estadoActual.numero === ("000" + numero).slice(-3);
  const hayOtroPedidoAbierto = estadoActual?.fichado && !esMismoPedido;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contenido}>

        {/* Pedido escaneado */}
        <View style={styles.pedidoCard}>
          <Text style={styles.pedidoLabel}>PEDIDO</Text>
          <Text style={styles.pedidoID}>{pedidoID}</Text>
        </View>

        {cargando ? (
          <ActivityIndicator color="#E85D26" style={{ marginTop: 32 }} />
        ) : (
          <>
            {/* Selector de departamento */}
            <Text style={styles.seccionTitulo}>Departamento</Text>
            <View style={styles.dptoGrid}>
              {DEPARTAMENTOS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dptoBtn,
                    departamento === d && styles.dptoSeleccionado,
                    esMismoPedido && estadoActual.departamento === d && styles.dptoActivo
                  ]}
                  onPress={() => seleccionarDepartamento(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dptoBtnTexto,
                    departamento === d && styles.dptoBtnTextoSeleccionado
                  ]}>
                    {d === "Confección" ? "✂️" : d === "Taller" ? "🔧" : "🏗️"} {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botones de fichaje */}
            <View style={styles.botonesContainer}>
              {/* Caso: tengo un pedido diferente abierto → botón de cambio automático */}
              {hayOtroPedidoAbierto && (
                <>
                  <View style={styles.aviso}>
                    <Text style={styles.avisoTexto}>
                      Tienes abierto: {estadoActual.pedido} ({estadoActual.departamento})
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.btnFichar, styles.btnCambio, !departamento && styles.btnDisabled]}
                    onPress={cambiarDePedido}
                    disabled={!departamento || cambiandoPedido || enviando}
                    activeOpacity={0.8}
                  >
                    {cambiandoPedido
                      ? <ActivityIndicator color="#FFF" />
                      : <Text style={styles.btnFicharTexto}>
                          ⇄ Cerrar {estadoActual.pedido} y abrir este
                        </Text>
                    }
                  </TouchableOpacity>
                </>
              )}

              {/* Caso: sin fichaje abierto → INICIO */}
              {!estadoActual?.fichado && (
                <TouchableOpacity
                  style={[styles.btnFichar, styles.btnInicio, !departamento && styles.btnDisabled]}
                  onPress={() => confirmarFichaje("Inicio")}
                  disabled={!departamento || enviando}
                  activeOpacity={0.8}
                >
                  {enviando
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.btnFicharTexto}>▶ Marcar INICIO</Text>
                  }
                </TouchableOpacity>
              )}

              {/* Caso: mismo pedido ya abierto → FIN */}
              {esMismoPedido && (
                <TouchableOpacity
                  style={[styles.btnFichar, styles.btnFin, !departamento && styles.btnDisabled]}
                  onPress={() => confirmarFichaje("Fin")}
                  disabled={!departamento || enviando}
                  activeOpacity={0.8}
                >
                  {enviando
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.btnFicharTexto}>⏹ Marcar FIN</Text>
                  }
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  contenido: { flex: 1, padding: 24 },

  pedidoCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#E85D26",
  },
  pedidoLabel: {
    color: "#E85D26",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 3,
    marginBottom: 8,
  },
  pedidoID: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 4,
  },

  aviso: {
    backgroundColor: "#2A1A00",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FF9500",
  },
  avisoTexto: { color: "#FF9500", fontSize: 13, textAlign: "center" },

  seccionTitulo: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 8,
  },

  dptoGrid: { gap: 10, marginBottom: 28 },
  dptoBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A40",
    alignItems: "center",
  },
  dptoSeleccionado: {
    backgroundColor: "#E85D26",
    borderColor: "#E85D26",
  },
  dptoActivo: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  dptoBtnTexto: { color: "#AAA", fontSize: 16, fontWeight: "600" },
  dptoBtnTextoSeleccionado: { color: "#FFFFFF" },

  botonesContainer: { gap: 12, marginBottom: 16 },
  btnFichar: {
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  btnInicio: { backgroundColor: "#2E7D32" },
  btnFin: { backgroundColor: "#C62828" },
  btnCambio: { backgroundColor: "#1565C0" },
  btnDisabled: { opacity: 0.4 },
  btnFicharTexto: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },

  btnCancelar: { alignItems: "center", paddingVertical: 12 },
  btnCancelarTexto: { color: "#666", fontSize: 15 },
});
