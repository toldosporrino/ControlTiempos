// ═══════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert,
  SafeAreaView, Dimensions
} from "react-native";
import { getTrabajadores, login } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { version } from "../../package.json";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const { guardarUsuario } = useAuth();

  const [paso, setPaso] = useState("seleccion"); // seleccion | pin
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombreSeleccionado, setNombreSeleccionado] = useState(null);
  const [pin, setPin] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarTrabajadores();
  }, []);

  async function cargarTrabajadores() {
    try {
      const res = await getTrabajadores();
      if (res.ok) {
        setTrabajadores(res.trabajadores);
      } else {
        Alert.alert("Error", "No se pudo conectar con el servidor");
      }
    } catch (e) {
      Alert.alert("Error de red", "Comprueba tu conexión a internet");
    } finally {
      setCargando(false);
    }
  }

  function seleccionarNombre(nombre) {
    setNombreSeleccionado(nombre);
    setPin("");
    setError("");
    setPaso("pin");
  }

  function pulsarTecla(tecla) {
    if (tecla === "del") {
      setPin(p => p.slice(0, -1));
      setError("");
      return;
    }

    if (pin.length >= 4) return;

    const nuevoPin = pin + tecla;
    setPin(nuevoPin);

    if (nuevoPin.length === 4) {
      setTimeout(() => verificarPin(nuevoPin), 150);
    }
  }

  async function verificarPin(pinIntroducido) {
    setVerificando(true);
    setError("");

    try {
      const res = await login(nombreSeleccionado, pinIntroducido);

      if (res.ok) {
        await guardarUsuario({
          nombre: res.nombre,
          esSupervisor: res.esSupervisor,
        });
      } else {
        setError("PIN incorrecto");
        setPin("");
      }
    } catch (e) {
      setError("Error de conexión");
      setPin("");
    } finally {
      setVerificando(false);
    }
  }

  // ── RENDER SELECCIÓN ──────────────────────────────────────────────

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#E85D26" />
        <Text style={styles.loadingText}>Conectando...</Text>
      </View>
    );
  }

  if (paso === "seleccion") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TOLDOS</Text>
          <Text style={styles.logoSub}>PORRIÑO</Text>
          <Text style={styles.versionText}>v{version}</Text>
          <Text style={styles.titulo}>¿Quién eres?</Text>
        </View>

        <FlatList
          data={trabajadores}
          keyExtractor={item => item.nombre}
          numColumns={2}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tarjetaNombre, item.esSupervisor && styles.tarjetaSupervisor]}
              onPress={() => seleccionarNombre(item.nombre)}
              activeOpacity={0.7}
            >
              <Text style={styles.inicialNombre}>
                {item.nombre.charAt(0).toUpperCase()}
              </Text>
              <Text style={styles.textoNombre}>{item.nombre}</Text>
              {item.esSupervisor && (
                <Text style={styles.badgeSupervisor}>SUPERVISOR</Text>
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  // ── RENDER PIN ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setPaso("seleccion"); setPin(""); setError(""); }}>
          <Text style={styles.volver}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Hola, {nombreSeleccionado}</Text>
        <Text style={styles.subtitulo}>Introduce tu PIN</Text>
      </View>

      {/* Puntos del PIN */}
      <View style={styles.pinPuntos}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[styles.punto, i < pin.length && styles.puntoRelleno]}
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {verificando ? (
        <ActivityIndicator size="large" color="#E85D26" style={{ marginTop: 20 }} />
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
    </SafeAreaView>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1A",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F1A",
  },
  loadingText: {
    color: "#666",
    marginTop: 12,
    fontSize: 16,
  },

  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  logo: {
    fontSize: 32,
    fontWeight: "900",
    color: "#E85D26",
    letterSpacing: 8,
  },
  logoSub: {
    fontSize: 14,
    fontWeight: "300",
    color: "#E85D26",
    letterSpacing: 12,
    marginTop: -4,
  },
  versionText: {
    color: "#444",
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 1,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 24,
  },
  subtitulo: {
    fontSize: 14,
    color: "#888",
    marginTop: 6,
  },
  volver: {
    color: "#E85D26",
    fontSize: 16,
    marginBottom: 8,
  },

  // Lista de nombres
  lista: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tarjetaNombre: {
    flex: 1,
    margin: 8,
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  tarjetaSupervisor: {
    borderColor: "#E85D26",
    borderWidth: 2,
  },
  inicialNombre: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E85D26",
    textAlign: "center",
    lineHeight: 50,
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    overflow: "hidden",
  },
  textoNombre: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
  },
  badgeSupervisor: {
    color: "#E85D26",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 4,
  },

  // PIN
  pinPuntos: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 32,
    gap: 12,
  },
  punto: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#444",
    backgroundColor: "transparent",
  },
  puntoRelleno: {
    backgroundColor: "#E85D26",
    borderColor: "#E85D26",
  },
  puntoSeparador: {
    marginLeft: 16,
  },
  errorText: {
    color: "#FF4444",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 16,
  },

  // Teclado
  teclado: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
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
  teclaVacia: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  teclaTexto: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  teclaDelTexto: {
    fontSize: 20,
    color: "#888",
  },
});
