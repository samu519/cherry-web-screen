# Cherry Editor — Guía de Desarrollo Continuado

## Estado Actual (Fin de Fase 1)

✅ **Completado:**
- Arquitectura base implementada
- UI con 3 paneles
- Estado observable
- Managers principales
- OverlayManager con anti-overflow
- SelectionManager con visualización
- CanvasAdapter para integración
- Sistema de estilos (900+ líneas)

⚙️ **Funcional:**
- Selección de widgets
- Visualización de selección
- Menú contextual
- Inspector básico
- Toolbar con controles
- Tema claro/oscuro

❌ **Pendiente:**
- Drag con actualización real
- Resize con actualización real
- Propiedades editables
- Menús dinámicos
- Historial funcional
- Zoom/Pan

---

## Fase 2: Integración de Drag y Resize

### Objetivo
Que al mover/redimensionar widgets, se actualice realmente su posición/tamaño en el Canvas del core.

### Archivos a Modificar
- `src/editor/Editor.js` - setupCanvasInteractions()
- `src/editor/managers/SnapManager.js` - Visualizar snap

### Pasos

#### 1. Implementar mouseup finalización
```javascript
// En setupCanvasInteractions(), el mouseup debe:
document.addEventListener('mouseup', (e) => {
  if (this.isDragging && this.draggedWidgetId) {
    // Calcular delta
    const dx = e.clientX - this.dragStartPos.x;
    const dy = e.clientY - this.dragStartPos.y;

    // Actualizar en canvas
    this.canvasAdapter.moveWidget(this.draggedWidgetId, dx, dy);

    // Actualizar selección visual
    this.selectionManager.updateHandlePositions();
  }
});
```

#### 2. Implementar resize
```javascript
// En setupSelectionInteractions(), agregar resize real
document.addEventListener('mousemove', (e) => {
  if (this.isResizing && this.draggedWidgetId) {
    const dx = e.clientX - this.dragStartPos.x;
    const dy = e.clientY - this.dragStartPos.y;

    const oldRect = this.dragStartRect;
    const direction = this.resizeDirection;

    // Calcular nuevo tamaño basado en dirección
    const newWidth = this.calculateNewWidth(oldRect, dx, direction);
    const newHeight = this.calculateNewHeight(oldRect, dy, direction);

    this.canvasAdapter.resizeWidget(this.draggedWidgetId, newWidth, newHeight);
  }
});
```

#### 3. Agregar snap visual
```javascript
// En moveWidget visual, mostrar guías
const snapResult = this.snapManager.snapPosition(x, y, rect);
if (snapResult.snapped) {
  // Mostrar guías visuales
  this.drawGuides(snapResult.guides);
}
```

---

## Fase 3: Menús Contextuales Dinámicos

### Objetivo
Que los menús de Size, Variant, Style se generen dinámicamente basados en el widget.

### Archivos a Crear
- `src/editor/ui/components/MenuItem.js`
- `src/editor/ui/components/MenuGroup.js`

### Archivos a Modificar
- `src/editor/Editor.js` - openWidgetContextMenu()

### Pasos

#### 1. Crear MenuItem component
```javascript
class MenuItem {
  constructor(label, action, icon = null) {
    this.label = label;
    this.action = action;
    this.icon = icon;
  }

  createElement() {
    const btn = document.createElement('button');
    btn.className = 'cherry-context-menu__item';
    if (this.icon) btn.textContent = this.icon + ' ' + this.label;
    else btn.textContent = this.label;
    return btn;
  }
}
```

#### 2. Obtener propiedades del widget dinámicamente
```javascript
const widget = this.canvasAdapter.getWidgetInfo(widgetId);

// Obtener tamaños disponibles
const availableSizes = widget.element.dataset.sizes?.split(',') || ['mini', 'small', 'medium', 'large'];

// Obtener variantes disponibles
const availableVariants = widget.element.dataset.variants?.split(',') || ['translucid', 'solid'];

// Obtener estilos
const availableStyles = widget.element.dataset.styles?.split(',') || ['default'];
```

#### 3. Crear menús dinámicos en openWidgetContextMenu()
```javascript
const menuContent = document.createElement('div');
menuContent.className = 'cherry-context-menu';

// Grupo de acciones
const actionsGroup = this.createMenuGroup('Editar', [
  { label: 'Duplicar', action: 'duplicate' },
  { label: 'Copiar', action: 'copy' },
  { label: 'Eliminar', action: 'delete' }
]);

// Grupo de tamaño (dinámico)
const sizeGroup = this.createSizeMenu(widgetId, availableSizes);

// Grupo de variante (dinámico)
const variantGroup = this.createVariantMenu(widgetId, availableVariants);

menuContent.appendChild(actionsGroup);
menuContent.appendChild(sizeGroup);
menuContent.appendChild(variantGroup);
```

---

## Fase 4: Inspector Funcional

### Objetivo
Que las propiedades en el Inspector sean editables y actualicen el widget.

### Archivos a Modificar
- `src/editor/Editor.js` - updateInspectorProperties()

### Pasos

#### 1. Hacer los controles interactivos
```javascript
const sizeSelect = document.createElement('select');
sizeSelect.addEventListener('change', (e) => {
  const newSize = e.target.value;
  this.canvasAdapter.setWidgetSize(widgetId, newSize);
  this.updateInspectorProperties(); // Refrescar
});
```

#### 2. Manejar multi-select indeterminado
```javascript
if (this.state.isMultiSelected()) {
  // Si múltiples widgets tienen diferentes tamaños
  // mostrar opción especial "Mixed" o vacío
  sizeSelect.value = '';
  sizeSelect.disabled = false;
  sizeSelect.addEventListener('change', (e) => {
    // Aplicar a todos los widgets seleccionados
    this.state.selectedWidgets.forEach(id => {
      this.canvasAdapter.setWidgetSize(id, e.target.value);
    });
  });
}
```

---

## Fase 5: Widget Library Funcional

### Objetivo
Drag & Drop funcional para agregar widgets nuevos.

### Archivos a Modificar
- `src/editor/Editor.js` - createWidgetLibrary()

### Pasos

#### 1. Agregar dragover al canvas
```javascript
this.canvasViewport.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  this.canvasViewport.classList.add('cherry-canvas-viewport--drag-over');
});

this.canvasViewport.addEventListener('dragleave', () => {
  this.canvasViewport.classList.remove('cherry-canvas-viewport--drag-over');
});

this.canvasViewport.addEventListener('drop', (e) => {
  e.preventDefault();
  const widgetType = e.dataTransfer.getData('widget-type');
  this.addNewWidget(widgetType, e.clientX, e.clientY);
});
```

#### 2. Método addNewWidget
```javascript
addNewWidget(widgetType, x, y) {
  // Importar dinámicamente el widget
  const WidgetClass = this.getWidgetClass(widgetType);
  
  const newWidget = new WidgetClass({
    layout: { column: 0, row: 0 }
  });

  this.canvas.addWidget(newWidget);
  this.state.selectWidget(newWidget.id);
}
```

---

## Fase 6: Historial (Undo/Redo)

### Objetivo
Sistema funcional de Undo/Redo.

### Archivos a Crear
- Nada nuevo, usar EditorHistory.js existente

### Archivos a Modificar
- `src/editor/Editor.js` - Todas las acciones importantes

### Pasos

#### 1. Integrar EditorHistory
```javascript
import { EditorHistory } from './managers/EditorHistory.js';

constructor(canvas, options = {}) {
  // ...
  this.history = new EditorHistory();
  this.history.subscribe((info) => {
    console.log('Undo available:', info.canUndo);
    console.log('Redo available:', info.canRedo);
  });
}
```

#### 2. Guardar estado en cada acción
```javascript
executeWidgetAction(widgetId, action) {
  const stateBefore = {
    selectedWidgets: [...this.state.selectedWidgets],
    widgets: this.canvasAdapter.getAllWidgets()
  };

  // Ejecutar acción
  switch(action) {
    case 'delete':
      widget.remove();
      break;
    // ...
  }

  // Guardar en historia
  this.history.addState(stateBefore, `${action} on ${widgetId}`);
}
```

#### 3. Conectar botones de Undo/Redo
```javascript
undoBtn.addEventListener('click', () => {
  const prevState = this.history.undo();
  if (prevState) this.applyState(prevState);
});

redoBtn.addEventListener('click', () => {
  const nextState = this.history.redo();
  if (nextState) this.applyState(nextState);
});
```

---

## Fase 7: Herramientas Avanzadas

### Alineación
```javascript
// En menú contextual
const alignMenu = this.createAlignmentMenu([
  { label: 'Izq', action: 'left' },
  { label: 'Centro', action: 'center' },
  { label: 'Der', action: 'right' },
  { label: 'Arriba', action: 'top' },
  { label: 'Medio', action: 'middle' },
  { label: 'Abajo', action: 'bottom' }
]);

// Ejecutar
this.canvasAdapter.alignWidgets(this.state.selectedWidgets, alignment);
```

### Distribución
```javascript
this.canvasAdapter.distributeWidgets(
  this.state.selectedWidgets,
  'equal-spacing'
);
```

### Bloqueo
```javascript
// Ya existe en executeWidgetAction('lock')
// Solo necesita persistencia en localstorage o similar
```

---

## Checklist de Desarrollo

### Antes de empezar cada fase:
- [ ] Leer la guía de esa fase
- [ ] Identificar archivos a crear/modificar
- [ ] Crear ramas si usa git
- [ ] Escribir test cases mentales

### Durante el desarrollo:
- [ ] Mantener separación de responsabilidades
- [ ] Usar CanvasAdapter para modificar canvas
- [ ] Notificar state cuando cambie
- [ ] Actualizar selección visual
- [ ] Probar tema oscuro

### Después de cada cambio:
- [ ] Verificar sin errores: `get_errors()`
- [ ] Probar en navegador
- [ ] Probar en tema oscuro
- [ ] Verificar responsive
- [ ] Commit si usa git

---

## Comandos Útiles para Testing

```javascript
// En consola del navegador

// Obtener estado actual
window.cherryEditor.state.getState()

// Seleccionar widget
window.cherryEditor.state.selectWidget('widget-id')

// Cambiar tema
window.cherryEditor.state.setThemeMode('light')

// Cambiar accent
window.cherryEditor.state.setAccentColor('#ff0000')

// Ver todos los widgets
window.cherryEditor.canvasAdapter.getAllWidgets()

// Mover widget programáticamente
window.cherryEditor.canvasAdapter.moveWidget('widget-id', 10, 20)

// Obtener widget info
window.cherryEditor.canvasAdapter.getWidgetInfo('widget-id')

// Ver historial
window.cherryEditor.history.getInfo()
```

---

## Convenciones de Código

### Naming
- Clases: PascalCase (EditorState, OverlayManager)
- Funciones: camelCase (openWidgetContextMenu)
- Constantes: UPPER_SNAKE_CASE
- Privadas: leadingUnderscore si es necesario

### Comments
- Secciones: /* ===== SECTION NAME ===== */
- Métodos: /* Descripción */
- Código complejo: explicar lógica

### CSS
- Clases: cherry-component__element--modifier
- Variables: --cherry-property-name
- Grupos de propiedades: espaciadas con comentarios

---

## Recursos Clave

- `ARCHITECTURE.md` - Explicación detallada
- `EDITOR_GUIDE.md` - Guía de usuario
- `src/editor/` - Código fuente
- `src/editor/styles/editor.css` - Todos los estilos

---

## Preguntas Frecuentes

### ¿Dónde agrego una nueva acción al menú?
En `openWidgetContextMenu()`, agregar objeto a `actions` array, luego implementar en `executeWidgetAction()`.

### ¿Cómo actualizo un widget?
Usa `this.canvasAdapter.setWidgetSize/Variant/Style()` o `moveWidget()` / `resizeWidget()`.

### ¿Cómo notifico cambios de estado?
Llama `this.state.selectWidget()` o similar, que automáticamente notifica a subscribers.

### ¿Debo modificar Canvas.js?
NO. Usa CanvasAdapter como intermediario.

### ¿Dónde agrego estilos?
En `src/editor/styles/editor.css`. Mantener organizado por componente.

---

## Próximos Pasos Inmediatos

1. Implementar Fase 2 (Drag/Resize real)
2. Agregar snapManager.visualize()
3. Conectar undo/redo
4. Hacer inspector editable
5. Menús dinámicos

---

**Fecha de creación:** 2026-09-01  
**Última actualización:** Fin de Fase 1  
**Estado:** En desarrollo
