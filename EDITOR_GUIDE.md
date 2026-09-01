# Cherry Editor — Guía de Uso

## Introducción

Cherry Editor es una herramienta profesional de edición visual para la interfaz Cherry Web Screen. Proporciona una experiencia de diseño intuitiva con tres paneles: Inspector, Canvas y Widget Library.

---

## Interfaz Principal

```
┌─────────────────────────────────────────────────────────┐
│                    TOOLBAR (Herramientas)              │
├──────────┬─────────────────────────┬──────────┐
│          │                         │          │
│INSPECTOR │  CANVAS (Área de Trabajo)  │LIBRARY   │
│          │  (Zona de edición)      │          │
│          │                         │          │
│ - Tema  │   • Widgets              │ Widgets  │
│ - Accent │   • Selección            │ + Drag   │
│ - Props  │   • Manipulación         │ & Drop   │
│          │                         │          │
└──────────┴─────────────────────────┴──────────┘
```

---

## Paneles

### Inspector (Izquierda)

**Apariencia Global:**
- Selector de Accent Color
- Modo Light/Dark

**Propiedades del Widget:**
Cuando seleccionas un widget, aparecen sus propiedades:
- ID del widget
- Tipo
- Tamaño
- Variante
- Estilos

---

### Canvas (Centro)

Área de trabajo principal donde se editan los widgets.

**Acciones:**
- **Click** → Seleccionar widget
- **Ctrl/Cmd + Click** → Selección múltiple
- **Drag** → Mover widget
- **Right-Click** → Menú contextual
- **Botón ⋯** → Menú contextual del widget

---

### Widget Library (Derecha)

Biblioteca de widgets disponibles.

**Interacciones:**
- **Drag & Drop** → Arrastrar widget al canvas
- **Double-Click** → Agregar widget (próximamente)
- **Búsqueda** → Filtrar widgets (próximamente)

---

## Toolbar (Arriba)

### Grupo de Navegación

| Botón | Función |
|-------|---------|
| ↶ | Undo (Deshacer) |
| ↷ | Redo (Rehacer) |

### Grupo de Vista

| Botón | Función |
|-------|---------|
| ⊞ | Mostrar/Ocultar Grid |
| ▦ | Snap ON/OFF |
| 👁️ | Preview Mode |

### Grupo de Zoom

| Botón | Función |
|-------|---------|
| − | Zoom Out |
| 1:1 | Reset Zoom |
| + | Zoom In |

---

## Menú Contextual

Acceso con **Right-Click** o botón **⋯** en widget seleccionado.

### Acciones Disponibles

**Editar**
- Duplicar
- Copiar
- Cortar
- Eliminar

**Posición**
- Traer al Frente
- Enviar Atrás
- Centrar Horizontalmente
- Centrar Verticalmente

**Apariencia**
- Tamaño
- Variante
- Estilo

**Otros**
- Bloquear
- Ocultar

---

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Y | Redo |
| ESC | Cerrar menús |
| Ctrl/Cmd + Click | Selección múltiple |
| Delete | Eliminar widget seleccionado |

---

## Selección y Manipulación

### Selección Simple

```
Click en widget → outline azul + handles
```

### Selección Múltiple

```
Ctrl/Cmd + Click en widgets
```

### Resize

Arrastra los handles de las esquinas o bordes para redimensionar.

```
Handles disponibles:
○ - - ○ - - ○
|           |
○ - - . - - ○
|           |
○ - - ○ - - ○
```

### Move

Arrastra el widget para mover.

---

## Preview Mode

Activa el modo preview para ver el resultado final sin herramientas de edición.

```
Botón 👁️ en Toolbar → Oculta todos los paneles
Botón "← Volver al editor" → Regresa a modo edición
```

---

## Grid y Snap

### Grid
- Visual: Mostrar/ocultar cuadrícula
- Ayuda a alinear elementos

### Snap
- Activado: Alinea automáticamente a grid
- Desactivado: Posicionamiento libre

### Guías (Próximamente)
- Líneas de referencia entre widgets
- Muestra distancias

---

## Temas

### Dark Mode (Predeterminado)
Interfaz oscura, ideal para trabajo prolongado.

### Light Mode
Interfaz clara, mejor en ambientes bien iluminados.

Cambiar en Inspector → Apariencia → Tema

---

## Accent Color

Personaliza el color de acento del editor.

```
Inspector → Apariencia → Accent
```

El color seleccionado afecta:
- Selecciones
- Botones activos
- Enlaces
- Acentos visuales

---

## Historial (Undo/Redo)

El editor mantiene un historial de cambios.

```
↶ Undo → Deshace última acción
↷ Redo → Rehace última acción
```

Acciones registradas:
- Agregar/Eliminar widgets
- Mover widgets
- Redimensionar
- Cambiar propiedades
- Duplicar/Copiar

---

## Consideraciones Importantes

### Anti-Overflow
Los menús nunca salen del viewport. Se reposicionan automáticamente si no caben.

### Arquitectura
El editor no modifica el core de widgets. Consume APIs existentes:
- `canvas.addWidget()`
- `canvas.removeWidget()`
- `widget.setSize()`
- `widget.setVariant()`
- `widget.setStyle()`

### Responsive
La interfaz se adapta a diferentes tamaños de pantalla.

---

## Próximas Características

- [ ] Duplicación de widgets
- [ ] Alineación y distribución automática
- [ ] Búsqueda en Widget Library
- [ ] Favoritos en Library
- [ ] Guías visuales de distancia
- [ ] Bloqueo de widgets
- [ ] Historial visual
- [ ] Exportación de layouts

---

## Debug

Acceso al editor desde consola:

```javascript
// Obtener estado actual
window.cherryEditor.getState()

// Seleccionar widget
window.cherryEditor.state.selectWidget('widget-id')

// Cambiar modo
window.cherryEditor.state.setMode('preview')
```
