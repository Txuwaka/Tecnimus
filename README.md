# TecniMus

Juego de mus para un jugador contra tres jugadores controlados por el navegador. Tu compañero juega sus cartas automáticamente; tú eliges los descartes y decides las apuestas de la pareja. No requiere instalación ni servidor.

## Publicarlo en GitHub Pages

1. Descomprime el ZIP y sube los archivos `index.html`, `style.css` y `mus.js` a la raíz del repositorio.
2. En GitHub, abre **Settings → Pages** y selecciona **Deploy from a branch**, rama **main**, carpeta **/(root)**.
3. También puedes abrir `index.html` en el navegador para jugar sin publicar nada.

## Reglas implementadas

Baraja española de 40 cartas con 8 reyes y 8 ases: los treses valen reyes y los doses, ases. Mano rotatoria en los empates. Lances por orden: grande, chica, pares y juego; punto cuando nadie tiene juego. Gana el primer equipo que llega a 40 piedras. Se cobran los envites no queridos en el acto y se puntúan los demás lances al descubrir las cartas. El órdago querido resuelve inmediatamente la partida.

Esta es una versión simplificada para un jugador. La máquina usa una estrategia básica; no hay señas, subidas de apuesta, declaración manual de pares o juego ni series de varios juegos.
