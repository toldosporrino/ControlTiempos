// ═══════════════════════════════════════════════════════════════════
// HISTORIAL SCREEN - Horas trabajadas por día
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, TouchableOpacity
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getHistorial } from "../services/api";

const DIAS = [
  { label: "Hoy", offset: 0 },
  { label: "Ayer", offset: 1 },
  { label: "Hace 2 días", offset: 2 },
];

function getFechaParam(offset) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getFechaLabel(offset) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long"
  });
}

export default function HistorialScreen() {
  const { usuario } = useAuth();
  const [historial, setHistorial] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [diaOffset, setDiaOffset] = useState(0);

  useEffect(() => {
    cargarHistorial(0);
  }, []);

  async function cargarHistorial(offset) {
    setCargando(true);
    setDiaOffset(offset);
    try {
      const fecha = offset === 0 ? null : getFechaParam(offset);
      const res = await getHistorial(usuario.nombre, fecha);
      if (res.ok) setHistorial(res);
      else setHistorial(null);
    } catch (e) {
      console.log("Error:", e);
      setHistorial(null);
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Selector de día */}
        <View style={styles.chips}>
          {DIAS.map(({ label, offset }) => (
            <TouchableOpacity
              key={offset}
              style={[styles.chip, diaOffset === offset && styles.chipActivo]}
              onPress={() => cargarHistorial(offset)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipTexto, diaOffset === offset && styles.chipTextoActivo]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fecha */}
        <Text style={styles.fecha}>{getFechaLabel(diaOffset)}</Text>

        {cargando ? (
          <ActivityIndicator size="large" color="#E85D26" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Resumen horas */}
            <View style={styles.resumenCard}>
              <Text style={styles.resumenTitulo}>TOTAL</Text>
              <Text style={styles.resumenHoras}>
                {historial?.horasTotales?.toFixed(2) || "0.00"} h
              </Text>

              {historial?.horasPorDepartamento && (
                <View style={styles.dptosResumen}>
                  {Object.entries(historial.horasPorDepartamento).map(([dpto, h]) =>
                    h > 0 ? (
                      <View key={dpto} style={styles.dptoChip}>
                        <Text style={styles.dptoChipTexto}>{dpto}: {h.toFixed(2)}h</Text>
                      </View>
                    ) : null
                  )}
                </View>
              )}
            </View>

            {/* Sesiones del día */}
            <Text style={styles.seccionTitulo}>Sesiones</Text>

            {!historial?.sesiones?.length ? (
              <View style={styles.vacio}>
                <Text style={styles.vacioTexto}>No hay registros</Text>
              </View>
            ) : (
              historial.sesiones.map((sesion, i) => (
                <View key={i} style={[styles.sesionCard, sesion.abierta && styles.sesionAbierta]}>
                  <View style={styles.sesionHeader}>
                    <Text style={styles.sesionPedido}>{sesion.pedido}</Text>
                    <Text style={styles.sesionHoras}>
                      {sesion.abierta ? "En curso" : `${sesion.horas.toFixed(2)}h`}
                    </Text>
                  </View>
                  <View style={styles.sesionDetalle}>
                    <Text style={styles.sesionDpto}>{sesion.departamento}</Text>
                    <Text style={styles.sesionHorario}>
                      {sesion.horaInicio} → {sesion.abierta ? "..." : sesion.horaFin}
                    </Text>
                  </View>
                  {sesion.abierta && (
                    <Text style={styles.sesionAbiertaTexto}>⚡ Fichaje en curso</Text>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  scroll: { padding: 24, paddingBottom: 40 },

  chips: { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  chipActivo: { backgroundColor: "#E85D26", borderColor: "#E85D26" },
  chipTexto: { color: "#888", fontSize: 13, fontWeight: "600" },
  chipTextoActivo: { color: "#FFF" },

  fecha: { color: "#888", fontSize: 15, marginBottom: 16, textTransform: "capitalize" },

  resumenCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 2,
    borderColor: "#E85D26",
  },
  resumenTitulo: { color: "#E85D26", fontSize: 11, fontWeight: "bold", letterSpacing: 3 },
  resumenHoras: { color: "#FFFFFF", fontSize: 48, fontWeight: "900", marginTop: 4 },
  dptosResumen: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 12 },
  dptoChip: { backgroundColor: "#2A2A40", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  dptoChipTexto: { color: "#AAA", fontSize: 13 },

  seccionTitulo: {
    color: "#888", fontSize: 12, fontWeight: "600",
    letterSpacing: 2, textTransform: "uppercase", marginBottom: 12,
  },

  vacio: { backgroundColor: "#1A1A2E", borderRadius: 16, padding: 32, alignItems: "center" },
  vacioTexto: { color: "#666", fontSize: 15 },

  sesionCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  sesionAbierta: { borderColor: "#E85D26" },
  sesionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  sesionPedido: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  sesionHoras: { color: "#E85D26", fontSize: 17, fontWeight: "700" },
  sesionDetalle: { flexDirection: "row", justifyContent: "space-between" },
  sesionDpto: { color: "#888", fontSize: 13 },
  sesionHorario: { color: "#666", fontSize: 13 },
  sesionAbiertaTexto: { color: "#E85D26", fontSize: 12, marginTop: 6 },
});
