// ═══════════════════════════════════════════════════════════════════
// CAMBIAR PIN SCREEN
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, Dimensions
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { cambiarPin } from "../services/api";

const { width } = Dimensions.get("window");

const PASOS = ["actual", "nuevo", "confirmar"];

export default function CambiarPinScreen({ navigation }) {
  const { usuario } = useAuth();
  const [paso, setPaso] = useState("actual");
  const [pinActual, setPinActual] = useState("");
  const [pinNuevo, setPinNuevo] = useState("");
  const [pinConfirmar, setPinConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  function pinActivo() {
    if (paso === "actual") return pinActual;
    if (paso === "nuevo") return pinNuevo;
    return pinConfirmar;
  }

  function setPinActivo(val) {
    if (paso === "actual") setPinActual(val);
    else if (paso === "nuevo") setPinNuevo(val);
    else setPinConfirmar(val);
  }

  function pulsarTecla(tecla) {
    const pin = pinActivo();
    if (tecla === "del") {
      setPinActivo(pin.slice(0, -1));
      setError("");
      return;
    }
    if (pin.length >= 4) return;
    const nuevo = pin + tecla;
    setPinActivo(nuevo);
    if (nuevo.length === 4) setTimeout(() => avanzar(nuevo), 150);
  }

  async function avanzar(pinCompleto) {
    if (paso === "actual") {
      setPaso("nuevo");
    } else if (paso === "nuevo") {
      setPaso("confirmar");
    } else {
      // Confirmar
      if (pinCompleto !== pinNuevo) {
        setError("Los PINs no coinciden");
        setPinConfirmar("");
        setPinNuevo("");
        setPaso("nuevo");
        return;
      }
      await guardarPin();
    }
  }

  async function guardarPin() {
    setEnviando(true);
    try {
      const res = await cambiarPin(usuario.nombre, pinActual, pinNuevo);
      if (res.ok) {
        Alert.alert("✅ PIN cambiado", "Tu nuevo PIN está activo", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert("Error", res.error);
        resetear();
      }
    } catch (e) {
      Alert.alert("Error de red", "Inténtalo de nuevo");
      resetear();
    } finally {
      setEnviando(false);
    }
  }

  function resetear() {
    setPinActual(""); setPinNuevo(""); setPinConfirmar("");
    setPaso("actual"); setError("");
  }

  const titulos = {
    actual: "PIN actual",
    nuevo: "Nuevo PIN",
    confirmar: "Confirmar PIN",
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contenido}>

        {/* Progreso */}
        <View style={styles.progreso}>
          {PASOS.map((p, i) => (
            <View key={p} style={[styles.progresoPaso, paso === p && styles.progresoActivo,
              PASOS.indexOf(paso) > i && styles.progresoHecho]} />
          ))}
        </View>

        <Text style={styles.titulo}>{titulos[paso]}</Text>

        {/* Puntos PIN */}
        <View style={styles.pinPuntos}>
          {[0,1,2,3].map(i => (
            <View key={i} style={[styles.punto, i < pinActivo().length && styles.puntoRelleno]} />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {enviando ? (
          <ActivityIndicator color="#E85D26" size="large" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.teclado}>
            {["1","2","3","4","5","6","7","8","9","","0","del"].map((tecla, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.tecla, tecla === "" && styles.teclaVacia]}
                onPress={() => tecla !== "" && pulsarTecla(tecla)}
                disabled={tecla === ""}
                activeOpacity={0.6}
              >
                <Text style={[styles.teclaTexto, tecla === "del" && styles.teclaDelTexto]}>
                  {tecla === "del" ? "⌫" : tecla}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  contenido: { flex: 1, padding: 24, alignItems: "center" },

  progreso: { flexDirection: "row", gap: 8, marginBottom: 32, marginTop: 16 },
  progresoPaso: { width: 60, height: 4, borderRadius: 2, backgroundColor: "#2A2A40" },
  progresoActivo: { backgroundColor: "#E85D26" },
  progresoHecho: { backgroundColor: "#4CAF50" },

  titulo: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginBottom: 32 },

  pinPuntos: { flexDirection: "row", gap: 16, marginBottom: 20 },
  punto: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#444" },
  puntoRelleno: { backgroundColor: "#E85D26", borderColor: "#E85D26" },

  error: { color: "#FF4444", fontSize: 14, marginBottom: 16 },

  teclado: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16, marginTop: 16 },
  tecla: {
    width: (width - 80 - 32) / 3,
    height: 72,
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  teclaVacia: { backgroundColor: "transparent", borderColor: "transparent" },
  teclaTexto: { color: "#FFFFFF", fontSize: 24, fontWeight: "600" },
  teclaDelTexto: { fontSize: 20, color: "#888" },
});
