# Cherry Editor — Arquitectura Técnica

## Descripción General

Cherry Editor es un sistema de edición visual basado en componentes con una arquitectura modular, observable y desacoplada. El editor se comunica con el Canvas del core a través de un adapter, manteniendo total independencia entre la lógica de edición y la lógica funcional de widgets.

---

## Capas Arquitectónicas

```
┌─────────────────────────────────────────────┐
│         UI LAYER (Presentación)             │
│  Inspector | Canvas Viewport | Library      │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│      INTERACTION LAYER                      │
│  - Drag/Drop  - Selection  - Resize         │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│      STATE LAYER (EditorState)              │
│  - Observable  - Immutable  - Single Source │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│      MANAGERS LAYER                         │
│  - Overlay  - Selection  - History          │
│  - Snap     - Preview    - Zoom             │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│      ADAPTER LAYER (CanvasAdapter)          │
│  Bridge to Core Canvas & Widgets            │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│      CORE LAYER                             │
│  Canvas | Widgets | Grid | State            │
└─────────────────────────────────────────────┘
```

---

## Componentes Principales

### 1. Editor (Main Manager)

**Archivo:** `src/editor/Editor.js`

**Responsabilidades:**
- Orquestar la experiencia completa
- Crear y gestionar la UI
- Conectar managers y eventos
- Exponer API pública

**Métodos Clave:**
- `initialize()` - Setup inicial
- `createEditorLayout()` - Crear UI
- `setupCanvasInteractions()` - Listeners
- `openWidgetContextMenu()` - Menús

**Propiedades:**
- `state` - EditorState
- `overlayManager` - Gestión de overlays
- `selectionManager` - Visualización
- `canvasAdapter` - Puente al core

---

### 2. EditorState (Observed State)

**Archivo:** `src/editor/EditorState.js`

**Patrón:** Observable (publish-subscribe)

**Estado Administrado:**
```javascript
{
  // Selección
  selectedWidgets: [],
  focusedWidget: null,

  // Vista
  zoom: 1,
  panX: 0,
  panY: 0,

  // Herramientas
  gridVisible: true,
  snapEnabled: true,
  guidesVisible: false,

  // Apariencia
  accentColor: '#3b82f6',
  themeMode: 'dark'
}
```

**Patrón Observer:**
```javascript
// Suscribirse a cambios
const unsubscribe = state.subscribe((newState) => {
  console.log('Estado cambió:', newState);
});

// Hacer cambios
state.selectWidget('widget-id');
state.setMode('preview');
```

---

### 3. OverlayManager (Central Overlay System)

**Archivo:** `src/editor/managers/OverlayManager.js`

**Características:**
- **Single Source of Truth** para overlays
- **Anti-Overflow**: Repositionamiento automático
- **Stack Management**: ESC cierra overlay activo
- **Click-Outside**: Cierra overlay

**Algoritmo de Posicionamiento:**
```
1. Intentar posición primaria (bottom-left)
2. Si no cabe, intentar alternativas
3. Elegir primera que cabe en viewport
4. Fallback: ajustar a viewport con margen

Direcciones soportadas:
- bottom-left, bottom-center, bottom-right
- top-left, top-center, top-right
- left-center, right-center
```

**API:**
```javascript
overlayManager.create('menu-id', {
  content: htmlElement,
  position: { x, y },
  anchor: referenceElement,
  align: 'bottom-left'
});

overlayManager.close('menu-id');
overlayManager.closeAll();
```

---

### 4. SelectionManager (Visual Selection)

**Archivo:** `src/editor/managers/SelectionManager.js`

**Responsabilidades:**
- Mostrar/ocultar outline de selección
- Crear resize handles
- Mostrar multi-selection box
- Botón ⋯ contextual

**Estados Visuales:**
```css
cherry-selection-outline    /* Outline azul */
cherry-resize-handle        /* Handles 8 direcciones */
cherry-multi-selection-box  /* Bounding box múltiple */
cherry-widget--selected     /* Clase en widget */
```

**Handles:**
```
Position: 8 corners + 4 midpoints
Cursor: Dinámico según dirección (n, s, e, w, ne, nw, se, sw)
```

---

### 5. CanvasAdapter (Core Bridge)

**Archivo:** `src/editor/CanvasAdapter.js`

**Patrón:** Adapter (convert interfaces)

**Propósito:** Traducir operaciones del editor a operaciones del core

**Métodos Públicos:**
```javascript
// Movimiento
moveWidget(widgetId, deltaX, deltaY)

// Redimensionamiento
resizeWidget(widgetId, width, height)

// Propiedades
setWidgetSize(widgetId, size)
setWidgetVariant(widgetId, variant)
setWidgetStyle(widgetId, style)

// Orden
bringToFront(widgetId)
sendToBack(widgetId)

// Alineación
alignWidgets(widgetIds, alignment)
distributeWidgets(widgetIds, distribution)

// Info
getWidget(widgetId)
getWidgetInfo(widgetId)
getAllWidgets()
```

---

### 6. Managers Auxiliares

#### EditorHistory
- Almacena estados
- Undo/Redo
- Máximo 50 estados

#### SnapManager
- Snap a grid
- Snap a widgets
- Cálculo de guías
- Distancias

#### PreviewManager
- Modo preview
- Oculta editor
- Muestra solo canvas

---

## Flujo de Datos

### Seleccionar un Widget

```
User Click
  ↓
setupCanvasInteractions() listener
  ↓
state.selectWidget(widgetId)
  ↓
EditorState.notify()
  ↓
SelectionManager.updateSelection()
  ↓
Visual updates (outline, handles)
```

### Mover un Widget

```
User Mousedown on Widget
  ↓
isDragging = true
  ↓
User Mousemove
  ↓
Apply visual transform
  ↓
User Mouseup
  ↓
Clear transform
  ↓
Could call: canvasAdapter.moveWidget()
```

### Abrir Menú Contextual

```
User Right-Click on Widget
  ↓
openWidgetContextMenu()
  ↓
Create menu content
  ↓
overlayManager.create()
  ↓
calculatePosition() with anti-overflow
  ↓
Show overlay with animation
```

---

## Comunicación Componentizada

### Publisher-Subscriber (State)

```javascript
// Editor.js
this.state.subscribe((state) => {
  // Cuando state cambia, se notifica
  this.updateInspectorProperties();
});
```

### Observer Pattern (Selection)

```javascript
// SelectionManager se suscribe a state
state.subscribe(() => {
  this.updateSelection();
});
```

### Adapter Pattern (Canvas)

```javascript
// Editor.js usa adapter
this.canvasAdapter.moveWidget(id, dx, dy);
// Adapter traduce a:
widget.setGeometry({ x: newX, y: newY });
```

---

## Estilos Organizados

**Archivo:** `src/editor/styles/editor.css` (900+ líneas)

### Estructura CSS

```css
/* Layout Principal */
.cherry-editor
.cherry-editor__left/center/right
.cherry-editor--preview

/* Paneles */
.cherry-inspector
.cherry-inspector__section
.cherry-inspector__property-control

/* Canvas */
.cherry-canvas-viewport
.cherry-canvas-grid

/* Selection */
.cherry-selection-outline
.cherry-resize-handle
.cherry-multi-selection-box

/* Overlays */
.cherry-overlay
.cherry-overlay.visible
.cherry-context-menu

/* Toolbar */
.cherry-toolbar
.cherry-toolbar__button
.cherry-toolbar__group

/* Tema */
[data-theme="dark"] { ... }

/* Responsive */
@media (max-width: 1200px) { ... }
@media (max-width: 768px) { ... }
```

---

## Integración con Core

### APIs Consumidas

**Canvas:**
```javascript
canvas.widgets           // Array de widgets
canvas.addWidget(widget)
canvas.removeWidget(widget)
canvas.updateWidgetLayout(widget)
```

**Widget:**
```javascript
widget.id
widget.type
widget.size
widget.variant
widget.style
widget.layout
widget.geometry
widget.element
widget.setGeometry(geometry)
```

### Sin Modificaciones al Core

El editor:
- ✅ NO modifica Canvas.js
- ✅ NO modifica Widget.js
- ✅ NO modifica las APIs existentes
- ✅ Consume APIs tal como existen

---

## Flujo de Eventos Clave

### Click en Widget

```
✓ Seleccionar (simple o múltiple)
✓ Mostrar outline
✓ Mostrar handles
✓ Mostrar botón ⋯
✓ Actualizar inspector
```

### Right-Click

```
✓ Abrir menú contextual
✓ Posicionar correctamente
✓ NO salir del viewport
✓ ESC cierra menú
✓ Click outside cierra menú
```

### Drag Widget

```
✓ Visual feedback (transform, opacity, shadow)
✓ Cursor: grab → grabbing
✓ Al soltar: restaurar estado visual
✓ Podría guardar en history
```

### Cambiar Tema

```
✓ Actualizar data-theme
✓ CSS responde automáticamente
✓ Actualizar accent si corresponde
```

---

## Extensibilidad

### Agregar Nuevo Manager

1. Crear `src/editor/managers/NewManager.js`
2. Inyectar en `Editor.constructor`
3. Suscribir a state si es necesario
4. Exponer en `src/editor/index.js`

### Agregar Nueva Acción del Menú

1. Agregar en `openWidgetContextMenu()`
2. Implementar en `executeWidgetAction()`
3. Usar `canvasAdapter` si modifica widgets

### Agregar Nueva Propiedad Visual

1. Actualizar CSS en `editor.css`
2. Considerar tema dark
3. Agregar transiciones
4. Probar responsiveness

---

## Consideraciones de Performance

- **DOM Minimizado**: Solo lo esencial en DOM
- **Event Delegation**: Listeners centralizados
- **Transforms**: Usar CSS transforms (GPU)
- **Debouncing**: Si es necesario para mousemove
- **Virtual Scrolling**: Considerar para muchos widgets

---

## Seguridad

- ✅ Validar IDs de widgets
- ✅ Verificar existencia antes de actuar
- ✅ Boundaries de valores
- ✅ No ejecutar user input como código

---

## Testing

Puntos de prueba principales:
- Selección (simple, múltiple, clear)
- Drag (movimiento visual)
- Menú contextual (posicionamiento)
- Estado observable (cambios)
- CanvasAdapter (métodos)
- Responsive (diferentes tamaños)

---

## Notas de Arquitectura

1. **State First**: Toda lógica depende del estado observable
2. **Separation of Concerns**: Cada manager tiene responsabilidad única
3. **No Global State**: Todo inyectado en constructor
4. **Composition over Inheritance**: Managers componibles
5. **Adapter Pattern**: No tocar core
6. **CSS Grid**: Layout responsive automático

---

## Cambios Futuros Planificados

- Integración real de Undo/Redo
- Validación de propiedades
- Cálculo de bounding box real
- Zoom/Pan implementación
- Grid visual automático
- Guías visuales
- Historial UI
- Búsqueda en library
