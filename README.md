# TecniMus Beta 4 — Más juego, más carácter

Sube el contenido de esta carpeta a la raíz de tu repositorio de GitHub Pages, manteniendo `assets` y los nombres de los archivos. El motor continúa la base de Beta 3.

## Apuestas

Escribe la cantidad del envite o usa los accesos 2, 5 y 10. El envite inicial admite enteros desde 2. Para reenvidar, escribe cuánto quieres **añadir** (desde 1): se muestra el total antes de pulsar Subo. Siempre puedes querer, no querer o echar órdago. Un órdago sólo admite querer o no querer.

La cantidad en juego aparece en el tapete. La IA considera tanto su mano y las señas recibidas como el tamaño de la apuesta; también puede iniciar apuestas mayores y reenvidar.

## Sonido y ambiente

Efectos diferenciados para selección de cartas, mus, corte, paso, envite, subida, seña enviada/recibida, confirmación, turno, cambio de lance, reparto, revelado, victoria y derrota. El volumen y el interruptor se guardan en el navegador. El audio comienza tras interactuar con la página. El órdago destaca visualmente y respeta la preferencia de reducir movimiento.

## Más información

La libreta conserva la conversación de la mano actual (hasta 120 acciones). Las estadísticas locales registran victorias, derrotas, manos y mejor racha. No se envían a ningún servidor. Una partida reiniciada sin terminar no cuenta como victoria ni derrota.

Se mantienen las señas, logo, baraja, descartes animados, turnos individuales, consejos opcionales y controles móviles.

## Pruebas de desarrollo

Ejecuta `node tests/regression.cjs` para comprobar el motor por simulación: turnos, puntuación, señas, descarte, envites personalizados, subidas, rechazo, presión de apuestas para la IA, estadísticas y salida de audio simulada. La prueba utiliza un DOM simulado; la revisión visual y auditiva en navegador real queda pendiente.
