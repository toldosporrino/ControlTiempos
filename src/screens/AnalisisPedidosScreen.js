// ═══════════════════════════════════════════════════════════════════
// ANÁLISIS PEDIDOS - Solo supervisores
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  ActivityIndicator, TouchableOpacity, TextInput, RefreshControl
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAnalisisPedidos } from "../services/api";

const DPTOS = [
  { key: "hConfeccion",  workerKey: "confeccion",  label: "Confección", color: "#7C3AED" },
  { key: "hTaller",      workerKey: "taller",      label: "Taller",     color: "#0369A1" },
  { key: "hInstalacion", workerKey: "instalacion", label: "Instalación", color: "#065F46" },
];

export default function AnalisisPedidosScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  // { "TP-001_confeccion": true, ... }
  const [abiertos, setAbiertos] = useState({});

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  async function cargar(esRefresh = false) {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    try {
      const res = await getAnalisisPedidos();
      if (res.ok) setPedidos(res.pedidos || []);
    } catch (e) {
      console.log("Error:", e);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  function toggleDpto(pedido, workerKey) {
    const k = pedido + "_" + workerKey;
    setAbiertos(prev => ({ ...prev, [k]: !prev[k] }));
  }

  const filtrados = busqueda.trim()
    ? pedidos.filter(p => p.pedido.toLowerCase().includes(busqueda.toLowerCase()))
    : pedidos;

  const totales = filtrados.reduce((acc, p) => ({
    hConfeccion:  acc.hConfeccion  + p.hConfeccion,
    hTaller:      acc.hTaller      + p.hTaller,
    hInstalacion: acc.hInstalacion + p.hInstalacion,
    hTotal:       acc.hTotal       + p.hTotal,
  }), { hConfeccion: 0, hTaller: 0, hInstalacion: 0, hTotal: 0 });

  function renderPedido({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardPedido}>{item.pedido}</Text>
          <Text style={styles.cardTotal}>{item.hTotal.toFixed(1)}h total</Text>
        </View>

        <View style={styles.deptos}>
          {DPTOS.map(d => {
            const horas = item[d.key] || 0;
            const workers = item.trabajadores?.[d.workerKey] || [];
            const k = item.pedido + "_" + d.workerKey;
            const expandido = !!abiertos[k];
            const pulsable = horas > 0 && workers.length > 0;

            return (
              <TouchableOpacity
                key={d.key}
                style={[
                  styles.dptoChip,
                  { backgroundColor: d.color + "22", borderColor: expandido ? d.color : d.color + "55" },
                  expandido && { borderWidth: 1.5 },
                ]}
                onPress={() => pulsable && toggleDpto(item.pedido, d.workerKey)}
                activeOpacity={pulsable ? 0.7 : 1}
              >
                <Text style={[styles.dptoLabel, { color: d.color }]}>{d.label}</Text>
                <Text style={[styles.dptoHoras, { color: d.color }]}>
                  {horas > 0 ? horas.toFixed(1) + "h" : "—"}
                </Text>
                {pulsable && (
                  <Text style={[styles.dptoFlecha, { color: d.color }]}>
                    {expandido ? "▲" : "▼"}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Desglose por trabajador */}
        {DPTOS.map(d => {
          const k = item.pedido + "_" + d.workerKey;
          if (!abiertos[k]) return null;
          const workers = item.trabajadores?.[d.workerKey] || [];
          return (
            <View key={k} style={[styles.desglose, { borderLeftColor: d.color }]}>
              <Text style={[styles.desgloseTitle, { color: d.color }]}>{d.label}</Text>
              {workers.map(w => (
                <View key={w.nombre} style={styles.desgloseRow}>
                  <Text style={styles.desgloseNombre}>{w.nombre}</Text>
                  <Text style={[styles.desgloseHoras, { color: d.color }]}>{w.horas.toFixed(1)}h</Text>
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.cardFecha}>Última actividad: {item.ultimaActividad}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Buscador */}
      <View style={styles.buscadorWrap}>
        <TextInput
          style={styles.buscador}
          placeholder="Buscar pedido..."
          placeholderTextColor="#555"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="characters"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda("")} style={styles.borrarBtn}>
            <Text style={styles.borrarTexto}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {cargando ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#E85D26" />
        </View>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={item => item.pedido}
          renderItem={renderPedido}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={() => cargar(true)} tintColor="#E85D26" />
          }
          ListHeaderComponent={
            filtrados.length > 0 ? (
              <View style={styles.resumenCard}>
                <Text style={styles.resumenTitulo}>TOTAL — {filtrados.length} PEDIDOS</Text>
                <View style={styles.resumenRow}>
                  {DPTOS.map(d => (
                    <View key={d.key} style={styles.resumenItem}>
                      <Text style={[styles.resumenH, { color: d.color }]}>
                        {totales[d.key].toFixed(1)}h
                      </Text>
                      <Text style={styles.resumenLabel}>{d.label}</Text>
                    </View>
                  ))}
                  <View style={styles.resumenItem}>
                    <Text style={[styles.resumenH, { color: "#E85D26" }]}>
                      {totales.hTotal.toFixed(1)}h
                    </Text>
                    <Text style={styles.resumenLabel}>Total</Text>
                  </View>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={styles.vacioTexto}>No hay pedidos</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  buscadorWrap: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A40",
    paddingHorizontal: 14,
  },
  buscador: { flex: 1, color: "#FFF", fontSize: 16, paddingVertical: 12 },
  borrarBtn: { padding: 6 },
  borrarTexto: { color: "#666", fontSize: 16 },

  lista: { paddingHorizontal: 16, paddingBottom: 32 },

  resumenCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#E85D26",
  },
  resumenTitulo: {
    color: "#E85D26", fontSize: 11, fontWeight: "bold",
    letterSpacing: 2, marginBottom: 12,
  },
  resumenRow: { flexDirection: "row", justifyContent: "space-between" },
  resumenItem: { alignItems: "center", flex: 1 },
  resumenH: { fontSize: 20, fontWeight: "900" },
  resumenLabel: { color: "#666", fontSize: 10, marginTop: 2 },

  card: {
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardPedido: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", letterSpacing: 2 },
  cardTotal: { color: "#E85D26", fontSize: 15, fontWeight: "700" },

  deptos: { flexDirection: "row", gap: 8, marginBottom: 10 },
  dptoChip: {
    flex: 1, borderRadius: 10, padding: 8,
    alignItems: "center", borderWidth: 1,
  },
  dptoLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  dptoHoras: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  dptoFlecha: { fontSize: 9, marginTop: 4, opacity: 0.8 },

  desglose: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 10,
    marginTop: 2,
  },
  desgloseTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  desgloseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  desgloseNombre: { color: "#CCC", fontSize: 13 },
  desgloseHoras: { fontSize: 13, fontWeight: "700" },

  cardFecha: { color: "#444", fontSize: 11, textAlign: "right", marginTop: 4 },

  vacio: { padding: 40, alignItems: "center" },
  vacioTexto: { color: "#666", fontSize: 15 },
});
