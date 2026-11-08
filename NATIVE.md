# Cherry Core V0.1 · Windows primero

La interfaz sigue funcionando en un navegador con datos **Demo**. Para conectar el equipo, abre la aplicación de escritorio:

```sh
npm install
npm run native:dev
```

Requiere Rust, las herramientas C++ de Visual Studio y WebView2 para Tauri en Windows. `npm run native:build` prepara el frontend y genera la aplicación. Solo se copian `index.html`, `src/` y `assets/` a `dist/`; las dependencias y archivos del proyecto no se incluyen en el frontend.
La ventana solicita 480 × 1920 y limita su tamaño inicial al área de trabajo disponible. El canvas conserva la geometría lógica y ajusta su escala dentro de la ventana.

## Datos y disponibilidad

| Función | Proveedor Windows |
| --- | --- |
| CPU total | Diferencia entre muestras de `GetSystemTimes`; la primera lectura espera una segunda muestra |
| RAM física | `GlobalMemoryStatusEx`, uso porcentual y bytes usados/totales |
| Sensores | Consulta WMI de LibreHardwareMonitor u OpenHardwareMonitor, si el proveedor ya está disponible |
| GPU | Sensor de carga GPU Core, si existe en ese proveedor |
| Temperatura | Sensor CPU más caliente; el motivo de la lectura identifica el sensor |
| Volumen y micrófono | Nivel del dispositivo predeterminado de reproducción/captura mediante Core Audio |
| Wi-Fi y Bluetooth | Estado de radio mediante WinRT; modificarlo depende del permiso y del hardware |
| Multimedia | Sesión activa de Windows: título, artista, portada, posición y acciones admitidas |
| Brillo externo, No molestar, modo avión y ahorro de energía | No implementados; deshabilitados en modo nativo |

No se instala ni se inicia un monitor de sensores automáticamente. Sin un proveedor WMI compatible, temperatura y GPU muestran **—**, con el motivo disponible en el elemento. La colección completa de sensores está en `window.cherryApp.native.snapshot.telemetry.sensors`. La consulta de sensores se actualiza cada 10 segundos; el resto de la lectura se solicita aproximadamente cada 2 segundos, sin consultas superpuestas. No hay control de ventiladores en V0.1.

Una sesión multimedia requiere una aplicación que publique sus datos en Windows. Sin sesión activa no se muestra la canción de ejemplo. La portada solo acepta imágenes JPEG, PNG o WebP de hasta 1 MiB. Las acciones se habilitan según lo que anuncie la sesión.

## Puente y estado

`src/services/nativeBridge.d.ts` define el contrato tipado del frontend. `nativeBridge.js` valida las respuestas en ejecución. Las estructuras Rust usan los mismos nombres JSON y `protocolVersion: 1`. `src-tauri/cherry-core` contiene el proveedor y el contrato sin depender de la ventana Tauri; `src-tauri/src/lib.rs` adapta esos servicios a los comandos de escritorio.

- `native_capabilities`: plataforma, proveedor, controles disponibles, soporte multimedia y proveedor de sensores.
- `native_snapshot`: lecturas, controles y sesión multimedia; una lectura ausente es `null` y lleva un motivo.
- `native_set_control`: recibe exclusivamente un identificador conocido y un valor booleano o numérico validado; devuelve el valor leído después de solicitar el cambio.
- `native_media_action`: admite reproducir/pausar, anterior y siguiente; devuelve la sesión leída después de la acción.

El backend realiza estas operaciones fuera del hilo de interfaz. La solicitud de permiso de radios se inicia en el hilo principal, como exige Windows, únicamente tras una acción del usuario. Las preferencias guardadas nunca se aplican automáticamente al sistema. No se ejecutan comandos de shell.

`NativeService` espera la confirmación antes de actualizar `appState`, bloquea solicitudes repetidas mientras están pendientes y evita que una consulta anterior sobrescriba una confirmación nueva. Los cambios externos se sincronizan en la siguiente lectura. Si el proveedor falla o supera 15 segundos, se borran las lecturas actuales, se deshabilitan los controles y se reintenta; no se sustituyen por datos Demo. El puente impide acumular lecturas si el backend sigue procesando una petición anterior. El modo oscuro y el color siguen siendo preferencias locales de Cherry.

Los paneles nativos de pulsación larga muestran estado y disponibilidad reales. La exploración de redes y el emparejamiento no están implementados. Las preferencias del navegador se conservan separadas de las muestras nativas y los valores de telemetría y medios no se guardan en el layout.

## Verificación

```sh
npm test
npm run test:browser
npm run test:native-ui
npm run native:prepare
cargo test --manifest-path src-tauri/cherry-core/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
npm run test:native-live
```

Las pruebas de interfaz nativa usan IPC simulado para verificar confirmaciones demoradas, rechazos, sensores ausentes, multimedia y desconexiones sin modificar Windows. La prueba Rust de lectura consulta el equipo real sin cambiar controles. `test:native-live` ejecuta un diagnóstico sin interfaz y valida que el JSON real de Rust sea aceptado por el puente JavaScript. La comprobación de permisos de radios, cambios de volumen y acciones en aplicaciones multimedia reales debe hacerse manualmente en el equipo de destino. Linux queda para un proveedor posterior y comunica explícitamente que aún no está implementado.

Comprobado en Windows: 28 pruebas JavaScript, las suites Chrome de interacción/layouts e IPC nativo simulado, tres pruebas Rust y el diagnóstico real del contrato Rust → JavaScript. El diagnóstico obtuvo CPU y RAM reales, detectó audio y radios, y comunicó correctamente sensores y sesión multimedia ausentes. No se modificaron ajustes del sistema.

Queda pendiente completar la compilación del shell Tauri y probar su ventana real. La comprobación se detuvo mientras compilaba la biblioteca de Windows en este entorno de 4 GB, tras una espera prolongada y fuerte presión de memoria. El núcleo Windows se compiló y sus pruebas terminaron correctamente usando una salida temporal.

Si Windows impide crear la carpeta de compilación dentro del proyecto, puede usarse una salida temporal mediante `CARGO_TARGET_DIR`. Esto no requiere modificar los permisos del proyecto ni del sistema.
En equipos con poca memoria, `CARGO_BUILD_JOBS=1` limita la compilación a un trabajo a la vez.

```powershell
$env:CARGO_TARGET_DIR = Join-Path $env:TEMP 'cherry-native-target'
$env:CARGO_BUILD_JOBS = '1'
npm run native:dev
```

Referencias: [comandos de Tauri](https://v2.tauri.app/develop/calling-rust/), [permiso de radios](https://learn.microsoft.com/en-us/uwp/api/windows.devices.radios.radio.requestaccessasync), [Core Audio](https://learn.microsoft.com/en-us/windows/win32/coreaudio/core-audio-interfaces), [sesiones multimedia de Windows](https://microsoft.github.io/windows-docs-rs/doc/windows/Media/Control/struct.GlobalSystemMediaTransportControlsSessionManager.html), [esquema WMI de OpenHardwareMonitor](https://openhardwaremonitor.org/wordpress/wp-content/uploads/2011/04/OpenHardwareMonitor-WMI.pdf), [ejemplo WMI de LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/blob/master/LibreHardwareMonitor.Windows.Forms/TestScripts/basicwmi.py).
