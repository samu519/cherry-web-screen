# Layouts de Cherry

Abre **Diseño y pantalla** desde el dashboard o **Diseño** en la barra del editor.

- **Libre:** conserva posiciones y tamaños en píxeles. Puedes superponer widgets.
- **Grid:** mover, redimensionar y usar las flechas ajusta a las celdas reales de la pantalla. No elimina superposiciones existentes. La librería busca espacio para el tamaño completo del widget.
- **Perfiles:** Cherry 480 × 1920, vertical 480 × 1280, horizontal 1920 × 480 y escritorio 1280 × 720. Al cambiar orientación, se transpone la distribución; después puedes ajustar cada widget en el editor.
- **Presets:** Cherry original, Minimal y lienzo vacío. Sustituyen el diseño actual y dejan el anterior en recuperación.
- **Modo pantalla:** oculta las herramientas y conserva los controles interactivos del dashboard. Escape o el área táctil de 44 × 44 en la esquina superior derecha vuelve a mostrar las herramientas. `?display=1` abre directamente este modo.

## Guardar, importar y recuperar

Los cambios del editor se guardan en el navegador, incluidas las instancias duplicadas, eliminaciones, posiciones, configuración de controles, visibilidad, bloqueo y orden. Un dashboard sin widgets se conserva vacío al recargar.

**Exportar layout** descarga JSON. **Importar layout** valida el archivo completo antes de reemplazar el dashboard. Un archivo inválido mantiene intacto el diseño actual. El formato admite hasta 128 widgets y archivos de 2 MB.

**Recuperar copia anterior** carga el último documento válido anterior a un cambio. Es una copia de recuperación, no un historial ilimitado: exporta los diseños que quieras conservar a largo plazo. Si el documento guardado no se puede leer, Cherry conserva sus bytes para descargarlos y busca la copia válida anterior; si no existe, abre el preset inicial.

En navegadores compatibles, **Vincular archivo y guardar** permite sincronizar un archivo local. La reconexión que necesita permiso se hace desde el botón correspondiente; el autoguardado no abre solicitudes de permiso. La importación y exportación normal funcionan sin esta API.

## Formato

El documento exportado usa `kind: "cherry-layout"` y `schemaVersion: 2`. Contiene `profile`, `layoutMode`, `appearance` y `widgets`. Cada descriptor de widget incluye `id`, `type`, `size`, `style`, `variant`, `layout`, `geometry`, `settings`, `state` y `flags`.

Los toggles y sliders guardan además `control`. El `id` del widget identifica la instancia; `control.id` identifica el estado compartido. Duplicar un widget Wi-Fi crea otra instancia que sigue controlando `wifi`.

Los documentos antiguos con `{ widgets, appearance }` o una lista de widgets se migran al cargar. Las versiones futuras no compatibles se rechazan. Para añadir un tipo de widget, registra su clase en `widgetRegistry.js` y su configuración admitida en `widgetCatalog.js`.

## Comprobación

`npm test` comprueba migración, validación, recuperación y geometría. `npm run test:browser` comprueba las interacciones y el ciclo de vida completo de layouts en Chrome. `npm run test:layout` ejecuta solo las pruebas de layouts.

Las integraciones de archivo nativo de Tauri y la pantalla táctil física aún requieren validación en el dispositivo real. Estos layouts no agregan control real del sistema operativo.
