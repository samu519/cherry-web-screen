# Cherry Web Screen

Cherry Web Screen es un panel visual tipo dashboard personalizable, construido con JavaScript vanilla y un sistema de widgets reutilizable. El proyecto combina un canvas de layout, un editor visual y una colección de widgets para crear pantallas de control, información y multimedia con apariencia premium.

## ✨ Características principales

- Editor visual con panel izquierdo, centro y derecha
- Gestión de widgets por tamaño, estilo y variante
- Sistema de arrastre, selección y redimensión
- Persistencia del layout en localStorage
- Soporte para widgets de reloj, media, sistema, controles, visualizador, texto, toggle y slider
- Modo de edición con acceso rápido desde la vista principal

## 🧩 Arquitectura del proyecto

```text
cherry-web-screen/
├── index.html
├── README.md
├── assets/
│   └── media/
├── src/
│   ├── app/
│   │   └── main.js
│   ├── core/
│   │   ├── canvas/
│   │   ├── layouts/
│   │   ├── state/
│   │   ├── storage/
│   │   └── widgets/
│   ├── editor/
│   │   ├── managers/
│   │   ├── styles/
│   │   ├── ui/
│   │   ├── Editor.js
│   │   ├── EditorState.js
│   │   ├── CanvasAdapter.js
│   │   └── index.js
│   ├── styles/
│   │   ├── base/
│   │   ├── layout/
│   │   ├── widget/
│   │   ├── widgets/
│   │   └── main.css
│   └── widgets/
│       ├── clock/
│       ├── controls/
│       ├── media/
│       ├── system/
│       ├── text/
│       ├── visual/
│       └── ...
└── SUMMARY.md
```

## 🚀 Cómo arrancarlo

1. Abre la carpeta del proyecto en tu editor.
2. Desde la terminal, ejecuta:

```bash
python -m http.server 8000
```

3. En el navegador entra a:

```text
http://localhost:8000/
```

## 🛠️ Flujo de uso

- La vista principal muestra el dashboard normal.
- En la esquina del canvas aparece el botón Editar.
- Al entrar al editor puedes:
  - seleccionar widgets
  - cambiar tamaño, estilo y variante
  - moverlos por la grilla
  - añadir widgets desde la librería
  - deshacer/rehacer cambios
- Al salir del editor, el layout se guarda de forma persistente.

## 📦 Widgets incluidos

- Clock
- Media
- System
- Controls
- Text
- Toggle
- Slider
- Media Visual

## 🧠 Tecnologías

- JavaScript ES modules
- HTML5
- CSS Grid / CSS variables
- DOM manipulation sin frameworks

## 🎯 Objetivo del proyecto

Cherry Web Screen está pensado como una base para pantallas de control personalizables, dashboards estilo smart-home, paneles informativos y experiencias visuales ligeras con una estructura modular y fácilmente extensible.

## 👤 Estado actual

El proyecto se encuentra en desarrollo activo, con una base sólida para:

- edición visual
- personalización de widgets
- persistencia de layouts
- expansión hacia más widgets y mejoras de experiencia

## 📌 Nota de contribución

Si quieres ampliar el proyecto, la mejor forma es mantener la separación entre:

- lógica del canvas
- widgets
- editor visual
- almacenamiento de layout

Esto ayuda a que cada nuevo widget o nueva funcionalidad sea más fácil de integrar sin romper el sistema general.
