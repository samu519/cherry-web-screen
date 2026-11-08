# Prueba pendiente en la pantalla táctil física

La validación automática usa ratón y tacto emulado en Chrome. Esta lista requiere el dispositivo real.

Anotar: modelo de pantalla, sistema operativo, escala del sistema, navegador o versión de Tauri y fecha.

- [ ] Abrir Cherry en la pantalla vertical. Confirmar que se ve el último widget y que no aparecen barras de desplazamiento del documento. La vista se ajusta a la ventana; las coordenadas del diseño siguen siendo 480 × 1920.
- [ ] Tocar Wi-Fi una vez: cambia solo una vez y el toggle independiente muestra el mismo estado.
- [ ] Mantener Wi-Fi unos 500 ms: se abren los ajustes centrados sin alternar el control al soltar.
- [ ] Tocar Cerrar una vez y volver a abrir. El primer toque responde; no quedan capas bloqueando los controles.
- [ ] Comenzar una pulsación y mover el dedo, salir del control o soltar antes de 500 ms: no se abre un panel tardío.
- [ ] Mover volumen y brillo. Confirmar seguimiento del dedo y valores legibles.
- [ ] Abrir «More» y usar sus controles. Confirmar que el panel cabe y que el contenido se puede desplazar cuando sea necesario.
- [ ] Repetir la apertura y el cierre varias veces y entrar/salir del editor. Confirmar que el dashboard vuelve a verse completo.

Si algo falla, registrar el paso, el resultado esperado, lo que ocurrió y si se usó navegador o Tauri. Los controles siguen siendo estado de demostración; esta prueba no verifica cambios reales del sistema operativo.
