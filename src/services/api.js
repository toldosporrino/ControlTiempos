// ═══════════════════════════════════════════════════════════════════
// API SERVICE - Conexión con Google Apps Script
// ═══════════════════════════════════════════════════════════════════

const API_URL = "https://script.google.com/macros/s/AKfycbyZjSlWXObCI3EyiNBSanoPSuz9XfPNBmNl1L7oo-cI0PhxRnf2dvIxzTuDXJrs9gYK/exec";

// Helper GET
async function get(params) {
  const query = Object.keys(params)
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join("&");

  const response = await fetch(`${API_URL}?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return response.json();
}

// Helper POST
async function post(body) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// Obtener lista de trabajadores activos
export async function getTrabajadores() {
  return get({ accion: "trabajadores" });
}

// Login: validar nombre + PIN
export async function login(nombre, pin) {
  return post({ accion: "login", nombre, pin });
}

// Fichar inicio o fin
export async function fichar({ nombre, serie, numero, departamento, tipo }) {
  return post({ accion: "fichar", nombre, serie, numero, departamento, tipo });
}

// Estado actual del trabajador (¿fichado?)
export async function getEstado(nombre) {
  return get({ accion: "estado", trabajador: nombre });
}

// Historial del día
export async function getHistorial(nombre, fecha = null) {
  const params = { accion: "historial", trabajador: nombre };
  if (fecha) params.fecha = fecha;
  return get(params);
}

// Sesiones abiertas (supervisor)
export async function getSesionesAbiertas() {
  return get({ accion: "sesiones_abiertas" });
}

// Cambiar PIN propio
export async function cambiarPin(nombre, pinActual, pinNuevo) {
  return post({ accion: "cambiar_pin", nombre, pin_actual: pinActual, pin_nuevo: pinNuevo });
}

// Crear trabajador (supervisor)
export async function crearTrabajador(nombre, pin, solicitantePin) {
  return post({ accion: "crear_trabajador", nombre, pin, solicitante_pin: solicitantePin });
}

// Desactivar trabajador (supervisor)
export async function desactivarTrabajador(nombre, solicitantePin) {
  return post({ accion: "desactivar_trabajador", nombre, solicitante_pin: solicitantePin });
}

// Resetear PIN (supervisor)
export async function resetearPin(nombre, pinNuevo, solicitantePin) {
  return post({ accion: "resetear_pin", nombre, pin_nuevo: pinNuevo, solicitante_pin: solicitantePin });
}

// Cerrar sesión ajena (supervisor)
export async function cerrarSesionAjena(trabajador, solicitante) {
  return post({ accion: "cerrar_sesion", trabajador, solicitante });
}

// Análisis de pedidos (supervisor)
export async function getAnalisisPedidos() {
  return get({ accion: "analisis_pedidos" });
}
