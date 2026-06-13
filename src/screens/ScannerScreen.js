// ═══════════════════════════════════════════════════════════════════
// SCANNER SCREEN - Escanear QR del pedido
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Dimensions
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const SCAN_SIZE = width * 0.65;

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  async function onQRLeido({ data }) {
    if (escaneado) return;
    setEscaneado(true);

    try {
      // El QR puede venir en 3 formatos:
      // 1. URL Google Forms: https://docs.google.com/forms/...?entry.796865195=1&entry.678172000=001
      // 2. JSON: {"serie":"1","numero":"001"}
      // 3. Texto simple: "1-001"
      let serie, numero;

      if (data.includes("google.com/forms")) {
        const url = new URL(data);
        serie = url.searchParams.get("entry.796865195");
        numero = url.searchParams.get("entry.678172000");
      } else if (data.includes("{")) {
        const parsed = JSON.parse(data);
        serie = parsed.serie;
        numero = parsed.numero;
      } else if (data.includes("-")) {
        const partes = data.trim().split("-");
        serie = partes[0];
        numero = partes.slice(1).join("-");
      } else {
        throw new Error("Formato QR no reconocido");
      }

      if (!serie || !numero) {
        throw new Error("QR sin datos válidos");
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("Fichar", { serie, numero });

    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "QR no válido",
        "Este QR no corresponde a un pedido. Intenta de nuevo.",
        [{ text: "OK", onPress: () => setEscaneado(false) }]
      );
    }
  }

  // ── PERMISOS ──────────────────────────────────────────────────────

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centrado}>
          <Text style={styles.permisosTexto}>
            Necesitamos acceso a la cámara para escanear los QR de los pedidos
          </Text>
          <TouchableOpacity style={styles.btnPermiso} onPress={requestPermission}>
            <Text style={styles.btnPermisoTexto}>Conceder permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.btnVolver}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── CÁMARA ────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={escaneado ? undefined : onQRLeido}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Overlay oscuro */}
      <View style={styles.overlay}>

        {/* Zona superior */}
        <View style={styles.overlayTop}>
          <TouchableOpacity
            style={styles.btnCancelar}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnCancelarTexto}>✕ Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.instruccion}>Escanea el QR del pedido</Text>
        </View>

        {/* Fila central: oscuro + ventana + oscuro */}
        <View style={styles.overlayMedio}>
          <View style={styles.overlayLateral} />
          <View style={styles.ventana}>
            <View style={[styles.esquina, styles.esquinaTL]} />
            <View style={[styles.esquina, styles.esquinaTR]} />
            <View style={[styles.esquina, styles.esquinaBL]} />
            <View style={[styles.esquina, styles.esquinaBR]} />
          </View>
          <View style={styles.overlayLateral} />
        </View>

        {/* Zona inferior */}
        <View style={styles.overlayBottom}>
          <Text style={styles.ayuda}>Centra el código QR en el recuadro</Text>
        </View>
      </View>
    </View>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#0F0F1A",
  },
  permisosTexto: {
    color: "#AAA",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  btnPermiso: {
    backgroundColor: "#E85D26",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  btnPermisoTexto: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  btnVolver: { color: "#888", fontSize: 14 },

  overlay: {
    flex: 1,
    flexDirection: "column",
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 20,
    paddingTop: 50,
  },
  overlayMedio: {
    flexDirection: "row",
    height: SCAN_SIZE,
  },
  overlayLateral: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  ventana: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
  },

  instruccion: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  ayuda: {
    color: "#AAA",
    fontSize: 14,
  },
  btnCancelar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 16,
  },
  btnCancelarTexto: { color: "#FFF", fontSize: 14 },

  esquina: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#E85D26",
  },
  esquinaTL: {
    top: 0, left: 0,
    borderTopWidth: 4, borderLeftWidth: 4,
    borderTopLeftRadius: 4,
  },
  esquinaTR: {
    top: 0, right: 0,
    borderTopWidth: 4, borderRightWidth: 4,
    borderTopRightRadius: 4,
  },
  esquinaBL: {
    bottom: 0, left: 0,
    borderBottomWidth: 4, borderLeftWidth: 4,
    borderBottomLeftRadius: 4,
  },
  esquinaBR: {
    bottom: 0, right: 0,
    borderBottomWidth: 4, borderRightWidth: 4,
    borderBottomRightRadius: 4,
  },
});
