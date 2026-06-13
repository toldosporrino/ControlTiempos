// ═══════════════════════════════════════════════════════════════════
// PATCH PARA GOOGLE APPS SCRIPT
// Añadir este caso al switch/if de tu doPost o doGet en el script
// de control de tiempos.
//
// INSTRUCCIONES:
// 1. Abre tu Apps Script en script.google.com
// 2. Busca el bloque donde manejas las acciones (switch o if/else)
// 3. Añade el caso "cerrar_sesion" antes del bloque "default" o "else"
// 4. Republica el script como aplicación web (nueva versión)
// ═══════════════════════════════════════════════════════════════════

// --- AÑADIR EN doPost(), dentro del switch/if de acciones ---

// case "cerrar_sesion":   ← si usas switch(data.accion)
// if (accion === "cerrar_sesion"):  ← si usas if/else

function accion_cerrar_sesion(data) {
  var trabajador = (data.trabajador || "").toString().toUpperCase().trim();
  var solicitante = (data.solicitante || "").toString().toUpperCase().trim();

  if (!trabajador || !solicitante) {
    return { ok: false, error: "Faltan datos" };
  }

  // Verificar que el solicitante es supervisor
  var ss = SpreadsheetApp.getActiveSpreadsheet();  // o SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheetTrabajadores = ss.getSheetByName("Trabajadores");
  var trabajadores = sheetTrabajadores.getDataRange().getValues();

  var esSupervisor = false;
  for (var i = 1; i < trabajadores.length; i++) {
    // Ajusta el índice de columna según tu hoja:
    // trabajadores[i][0] = nombre, trabajadores[i][3] = esSupervisor (columna D)
    var nombre = trabajadores[i][0].toString().toUpperCase().trim();
    if (nombre === solicitante) {
      esSupervisor = trabajadores[i][3] === true || trabajadores[i][3] === "TRUE";
      break;
    }
  }

  if (!esSupervisor) {
    return { ok: false, error: "No tienes permisos de supervisor" };
  }

  // Buscar la fila de Inicio sin Fin del trabajador
  var sheetResp = ss.getSheetByName("Respuestas");
  var datos = sheetResp.getDataRange().getValues();

  // Ajusta los índices según tu hoja de Respuestas:
  // Busca la última fila donde:
  //   columna NOMBRE == trabajador
  //   columna TIPO == "Inicio"
  //   columna HORA_FIN esté vacía
  //
  // El índice exacto depende del orden de tus columnas.
  // Ejemplo con: [0]=Timestamp [1]=Fecha [2]=Nombre [3]=Pedido [4]=Departamento [5]=Tipo [6]=Hora
  //
  // Si tus columnas son distintas, ajusta los índices.

  var COL_NOMBRE = 2;    // ← AJUSTA si es necesario
  var COL_TIPO   = 5;    // ← AJUSTA si es necesario (columna con "Inicio"/"Fin")
  var COL_HORA   = 6;    // ← AJUSTA: columna donde se guarda la hora del fichaje

  // Para el flujo del formulario original, puede que Inicio y Fin sean filas separadas.
  // En ese caso, busca la última fila de Inicio de este trabajador sin una fila de Fin posterior.
  // La lógica más simple: buscar de abajo a arriba la primera fila de Inicio sin Fin.

  var now = new Date();
  var horaFin = Utilities.formatDate(now, "Europe/Madrid", "HH:mm");

  for (var j = datos.length - 1; j >= 1; j--) {
    var nomFila = datos[j][COL_NOMBRE].toString().toUpperCase().trim();
    var tipoFila = datos[j][COL_TIPO].toString().trim();

    if (nomFila === trabajador && tipoFila === "Inicio") {
      // Verificar que no hay ya un Fin posterior para este mismo pedido
      // (simplificación: simplemente escribir el Fin en la siguiente columna si está vacía)
      // O alternativamente, añadir una nueva fila de tipo "Fin":

      // OPCIÓN A: La hora de fin está en la misma fila (columna COL_HORA+1 o similar)
      // sheetResp.getRange(j + 1, COL_HORA + 2).setValue(horaFin);

      // OPCIÓN B: Añadir una nueva fila de Fin (igual que hace el fichaje normal)
      // Esta opción es más compatible con la lógica existente de tu script:
      var filaInicio = datos[j];
      var nuevaFila = filaInicio.slice(); // copia
      nuevaFila[COL_TIPO] = "Fin";
      nuevaFila[COL_HORA] = horaFin;
      nuevaFila[0] = now; // timestamp
      sheetResp.appendRow(nuevaFila);

      return { ok: true, mensaje: "Sesión cerrada para " + trabajador + " a las " + horaFin };
    }
  }

  return { ok: false, error: "No hay sesión abierta para " + trabajador };
}

// ═══════════════════════════════════════════════════════════════════
// CÓMO INTEGRARLO EN TU doPost:
//
// function doPost(e) {
//   var data = JSON.parse(e.postData.contents);
//   var accion = data.accion;
//
//   // ... tus casos existentes ...
//
//   if (accion === "cerrar_sesion") {
//     return responder(accion_cerrar_sesion(data));
//   }
//
//   // ... resto del código ...
// }
// ═══════════════════════════════════════════════════════════════════
