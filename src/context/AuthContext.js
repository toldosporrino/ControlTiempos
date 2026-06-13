// ═══════════════════════════════════════════════════════════════════
// AUTH CONTEXT - Estado global del usuario logueado
// ═══════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Recuperar sesión guardada al arrancar
  useEffect(() => {
    recuperarSesion();
  }, []);

  async function recuperarSesion() {
    try {
      const datos = await AsyncStorage.getItem("usuario");
      if (datos) {
        setUsuario(JSON.parse(datos));
      }
    } catch (e) {
      console.log("Error recuperando sesión:", e);
    } finally {
      setCargando(false);
    }
  }

  async function guardarUsuario(datos) {
    setUsuario(datos);
    await AsyncStorage.setItem("usuario", JSON.stringify(datos));
  }

  async function cerrarSesion() {
    setUsuario(null);
    await AsyncStorage.removeItem("usuario");
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, guardarUsuario, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
