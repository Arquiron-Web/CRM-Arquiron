# Corrección Apps Script — Portal y Evaluación escriben en fila correcta

## Problema

`getLastRow()` y `appendRow()` devuelven la última fila del sheet incluyendo columnas con **fórmulas** (AK, AL, AM). Eso hace que los leads del Portal y la Evaluación se escriban en la fila ~1500 en lugar de la siguiente vacía.

## Solución

Reemplazar cualquier uso de `getLastRow()` / `appendRow()` para leads por una función que busque la última fila con datos **solo en la columna B** (nombreEmpresa).

---

## Código para agregar al Apps Script

Abre **Extensiones → Apps Script** en tu Google Sheet.

### 1. Función auxiliar para obtener la siguiente fila vacía

Agrega esta función (por ejemplo, antes de `doPost`):

```javascript
/**
 * Obtiene la siguiente fila vacía en LEADS usando solo columna B.
 * Columna B tiene datos reales; AK-AM tienen fórmulas que confunden getLastRow().
 */
function getSiguienteFilaLEADS() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("LEADS");
  var rango = sheet.getRange("B3:B2000");
  var valores = rango.getValues();
  var ultimaFilaReal = 2; // fila 3 en índice 1-based
  for (var i = valores.length - 1; i >= 0; i--) {
    if (valores[i][0] && String(valores[i][0]).trim() !== "") {
      ultimaFilaReal = i + 3; // +3 porque empezamos en fila 3
      break;
    }
  }
  return ultimaFilaReal + 1;
}
```

### 2. Donde escribes leads (Portal / Evaluación)

Busca en tu `doPost()` el bloque que escribe leads del Portal o la Evaluación. Suele usar algo como:

- `sheet.appendRow(fila)` 
- `sheet.getRange(lastRow+1, 1, lastRow+1, 39).setValues([fila])`
- `getLastRow()` para calcular la fila

Reemplázalo por este patrón:

```javascript
// ANTES (ejemplo):
// var lastRow = sheet.getLastRow();
// sheet.appendRow(fila);

// DESPUÉS:
var siguienteFila = getSiguienteFilaLEADS();
sheet.getRange(siguienteFila, 1, siguienteFila, 39).setValues([fila]);
```

O si construyes la fila como array:

```javascript
var siguienteFila = getSiguienteFilaLEADS();
sheet.getRange("A" + siguienteFila + ":AM" + siguienteFila).setValues([fila]);
```

### 3. Estructura de `fila`

Asegúrate de que el array `fila` tenga **39 valores** en este orden (columnas A–AM):

- A=id, B=nombreEmpresa, C=sector, D–J=..., K=nombreContacto, L=cargo, M=email, N=whatsapp, ...
- Columna 31 (AF) = `fuenteFormulario`: `"Portal_Empresarial"` o `"Evaluacion_Madurez"`
- Columna 35 (AJ) = notas/mensaje

---

## Después de editar

1. Guarda el proyecto (Ctrl+S).
2. Implementar → Administrar implementaciones → Nueva versión.
3. Prueba con un envío desde el Portal y otro desde la Evaluación.
