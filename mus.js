// --- 1. LÓGICA DE LA BARAJA ---
const palos = ['Oros', 'Copas', 'Espadas', 'Bastos'];
const numeros = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

function crearBarajaMus() {
    let baraja = [];
    palos.forEach(palo => {
        numeros.forEach(numero => {
            let valorJuego = numero;
            // Figuras y 3s valen 10
            if (numero === 10 || numero === 11 || numero === 12 || numero === 3) valorJuego = 10;
            // 2s valen 1
            if (numero === 2) valorJuego = 1;

            baraja.push({
                palo: palo,
                numero: numero,
                valorJuego: valorJuego,
                nombre: `${numero} de ${palo}`
            });
        });
    });
    return baraja;
}

function barajar(baraja) {
    for (let i = baraja.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
    }
    return baraja;
}

function repartir(baraja) {
    let jugadores = { jugador1: [], jugador2: [], jugador3: [], jugador4: [] };
    for (let i = 0; i < 4; i++) {
        jugadores.jugador1.push(baraja.pop());
        jugadores.jugador2.push(baraja.pop());
        jugadores.jugador3.push(baraja.pop());
        jugadores.jugador4.push(baraja.pop());
    }
    return { manos: jugadores, mazoSobrante: baraja };
}

// --- 2. RENDERIZADO VISUAL E INTERACCIÓN ---
let faseMus = true;
let cartasADescartar = []; 

function renderizarCartas(manos) {
    const divJ1 = document.getElementById('cartas-j1');
    const divsOcultos = [
        { id: 'cartas-j2', cartas: manos.jugador2 },
        { id: 'cartas-j3', cartas: manos.jugador3 },
        { id: 'cartas-j4', cartas: manos.jugador4 }
    ];

    // Limpiar mesa
    divJ1.innerHTML = '';
    divsOcultos.forEach(jugador => document.getElementById(jugador.id).innerHTML = '');

    // Renderizar Jugador 1 (Tú)
    manos.jugador1.forEach((carta, index) => {
        const cartaDiv = document.createElement('div');
        cartaDiv.className = 'carta';
        cartaDiv.innerText = carta.nombre;
        
        // Mantener estilo si la carta está seleccionada
        if (cartasADescartar.includes(index)) {
            cartaDiv.classList.add('seleccionada');
        }

        cartaDiv.addEventListener('click', () => {
            if (!faseMus) return;
            
            if (cartasADescartar.includes(index)) {
                cartasADescartar = cartasADescartar.filter(i => i !== index);
            } else {
                cartasADescartar.push(index);
            }
            renderizarCartas(manosActuales);
        });

        divJ1.appendChild(cartaDiv);
    });

    // Renderizar Rivales y Compañero (Boca abajo)
    divsOcultos.forEach(jugador => {
        const contenedor = document.getElementById(jugador.id);
        jugador.cartas.forEach(() => {
            const cartaDiv = document.createElement('div');
            cartaDiv.className = 'carta carta-oculta';
            contenedor.appendChild(cartaDiv);
        });
    });
}

// --- 3. INTELIGENCIA ARTIFICIAL DE DESCARTES ---

function decidirDescartesIA(mano) {
    let cartasTirar = [];
    
    // Regla v1.0: Descartar todas las cartas que sean 4, 5, 6 o 7.
    // (Más adelante le enseñaremos a no tirarlas si forman pares)
    mano.forEach((carta, index) => {
        if (carta.numero >= 4 && carta.numero <= 7) {
            cartasTirar.push(index);
        }
    });
    
    return cartasTirar;
}


// --- 4. LÓGICA DE LOS BOTONES Y FLUJO DE DESCARTE ---

document.getElementById('btn-mus').addEventListener('click', () => {
    if (!faseMus) return;

    if (cartasADescartar.length === 0) {
        alert("Selecciona al menos una carta haciendo clic sobre ella para descartar.");
        return;
    }

    // --- FASE 1: LOS BOTS DECIDEN SI QUIEREN MUS O CORTAN ---
    let alguienCorta = false;
    let quienCorta = "";
    let descartesPrevistos = {};
    const jugadoresIA = ['jugador2', 'jugador3', 'jugador4'];

    jugadoresIA.forEach(jugador => {
        descartesPrevistos[jugador] = decidirDescartesIA(manosActuales[jugador]);
        
        // Si un bot tiene cartas tan buenas que decide tirar 0, corta el Mus.
        if (descartesPrevistos[jugador].length === 0) {
            alguienCorta = true;
            quienCorta = jugador;
        }
    });

    // Si alguien corta, se cancelan los descartes de todo el mundo
    if (alguienCorta) {
        faseMus = false;
        
        // Traducir el ID del jugador a un nombre amigable
        let nombreCorte = "Rival 2";
        if (quienCorta === 'jugador2') nombreCorte = "Rival 1";
        if (quienCorta === 'jugador3') nombreCorte = "Tu compañero";
        
        alert(`¡${nombreCorte} corta el Mus porque está servido! Empieza la GRANDE.`);
        
        document.getElementById('btn-mus').style.opacity = '0.5';
        document.getElementById('btn-cortar').style.opacity = '0.5';
        cartasADescartar = [];
        renderizarCartas(manosActuales);
        return; 
    }

    // --- FASE 2: NADIE CORTÓ, TODOS DESCARTAN ---
    
    // Comprobación de seguridad para el mazo
    let totalCartasPedidas = cartasADescartar.length + 
                             descartesPrevistos['jugador2'].length + 
                             descartesPrevistos['jugador3'].length + 
                             descartesPrevistos['jugador4'].length;

    if (mazoActual.length < totalCartasPedidas) {
        alert("El mazo se ha quedado sin cartas. (Lógica de re-barajar pendientes)");
        return;
    }

    // Tu descarte
    cartasADescartar.forEach(index => {
        manosActuales.jugador1[index] = mazoActual.pop();
    });
    cartasADescartar = [];

    // Descarte de la IA
    jugadoresIA.forEach(jugador => {
        descartesPrevistos[jugador].forEach(index => {
            manosActuales[jugador][index] = mazoActual.pop();
        });
        console.log(`${jugador} descartó ${descartesPrevistos[jugador].length} cartas.`);
    });

    // Actualizamos la mesa
    renderizarCartas(manosActuales);
    console.log("Cartas restantes en mazo:", mazoActual.length);
});

document.getElementById('btn-cortar').addEventListener('click', () => {
    if (!faseMus) return;
    faseMus = false;
    alert("¡Cortas el Mus! Empieza la ronda de la GRANDE.");
    
    document.getElementById('btn-mus').style.opacity = '0.5';
    document.getElementById('btn-cortar').style.opacity = '0.5';
    cartasADescartar = [];
    renderizarCartas(manosActuales);
});

// Recuerda que debajo de esto debe seguir estando la sección: 
// // --- 5. INICIO DE PARTIDA ---
let mazoActual = [];
let manosActuales = {};

function iniciarPartida() {
    let barajaNueva = crearBarajaMus();
    mazoActual = barajar(barajaNueva);
    
    let reparto = repartir(mazoActual);
    manosActuales = reparto.manos;
    mazoActual = reparto.mazoSobrante;

    cartasADescartar = [];
    faseMus = true;
    
    document.getElementById('btn-mus').style.opacity = '1';
    document.getElementById('btn-cortar').style.opacity = '1';

    renderizarCartas(manosActuales);
}

window.onload = iniciarPartida;
// --- 5. EVALUACIÓN DE LAS JUGADAS ---

// 5.1. Obtener el valor real de la carta para La Grande y La Chica
function obtenerValorGrande(carta) {
    if (carta.numero === 3) return 12; // Los 3 son Reyes
    if (carta.numero === 2) return 1;  // Los 2 son Ases
    return carta.numero;               // Resto de cartas: 12, 11, 10, 7, 6, 5, 4, 1
}

// 5.2. Ordenar una mano de mayor a menor
function ordenarManoParaGrande(mano) {
    // Usamos [...mano] para crear una copia y no desordenar las cartas visualmente en la mesa
    return [...mano].sort((a, b) => obtenerValorGrande(b) - obtenerValorGrande(a));
}

// 5.3. Comparar dos manos. Devuelve 1 (gana manoA), -1 (gana manoB), o 0 (empate)
function compararManosGrande(manoA, manoB) {
    let ordenA = ordenarManoParaGrande(manoA);
    let ordenB = ordenarManoParaGrande(manoB);

    for (let i = 0; i < 4; i++) {
        let valA = obtenerValorGrande(ordenA[i]);
        let valB = obtenerValorGrande(ordenB[i]);
        
        if (valA > valB) return 1;
        if (valB > valA) return -1;
    }
    return 0; // Si las 4 cartas son idénticas en valor
}

// 5.4. Evaluar a los 4 jugadores para ver quién tiene la mejor Grande
function evaluarGanadorGrande() {
    const ordenJugadores = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];
    
    // Asumimos que jugador1 (Tú) es "la mano" y tiene prioridad en caso de empate total
    let ganadorActual = 'jugador1';

    for (let i = 1; i < ordenJugadores.length; i++) {
        let rival = ordenJugadores[i];
        let resultado = compararManosGrande(manosActuales[ganadorActual], manosActuales[rival]);
        
        // Si el rival tiene estrictamente mejor mano, nos roba el puesto de ganador.
        // Si hay empate (resultado === 0), el que iba ganando retiene el liderato por posición.
        if (resultado === -1) {
            ganadorActual = rival;
        }
    }

    return ganadorActual;
}


// 5.5. Ordenar una mano de menor a mayor (para La Chica)
function ordenarManoParaChica(mano) {
    // Ordenamos de menor a mayor usando el mismo valor real de las cartas
    return [...mano].sort((a, b) => obtenerValorGrande(a) - obtenerValorGrande(b));
}

// 5.6. Comparar dos manos para La Chica
function compararManosChica(manoA, manoB) {
    let ordenA = ordenarManoParaChica(manoA);
    let ordenB = ordenarManoParaChica(manoB);

    for (let i = 0; i < 4; i++) {
        let valA = obtenerValorGrande(ordenA[i]);
        let valB = obtenerValorGrande(ordenB[i]);
        
        // El que tenga la carta más baja gana
        if (valA < valB) return 1;  // Gana manoA
        if (valB < valA) return -1; // Gana manoB
    }
    return 0; // Si las 4 cartas son idénticas en valor
}

// 5.7. Evaluar a los 4 jugadores para ver quién tiene la mejor Chica
function evaluarGanadorChica() {
    const ordenJugadores = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];
    let ganadorActual = 'jugador1';

    for (let i = 1; i < ordenJugadores.length; i++) {
        let rival = ordenJugadores[i];
        let resultado = compararManosChica(manosActuales[ganadorActual], manosActuales[rival]);
        
        // Si el rival tiene estrictamente mejor Chica, nos roba el liderato.
        // En caso de empate, la "mano" retiene la victoria.
        if (resultado === -1) {
            ganadorActual = rival;
        }
    }

    return ganadorActual;
}
// --- 6. MODO TEST: LEVANTAR CARTAS Y EVALUAR ---
document.getElementById('btn-resolver').addEventListener('click', () => {
    // 1. Damos la vuelta a las cartas de los rivales
    const rivales = [
        { id: 'cartas-j2', mano: manosActuales.jugador2 },
        { id: 'cartas-j3', mano: manosActuales.jugador3 },
        { id: 'cartas-j4', mano: manosActuales.jugador4 }
    ];

    rivales.forEach(rival => {
        const contenedor = document.getElementById(rival.id);
        contenedor.innerHTML = ''; 
        
        rival.mano.forEach(carta => {
            const cartaDiv = document.createElement('div');
            cartaDiv.className = 'carta'; 
            cartaDiv.innerText = carta.nombre;
            contenedor.appendChild(cartaDiv);
        });
    });

    // 2. Calculamos los ganadores de ambas fases
    let idGanadorGrande = evaluarGanadorGrande();
    let idGanadorChica = evaluarGanadorChica();
    
    let nombres = {
        'jugador1': 'Tú',
        'jugador2': 'Rival 1',
        'jugador3': 'Tu compañero',
        'jugador4': 'Rival 2'
    };

    // 3. Mostramos el resultado
    alert(`¡Las cartas están boca arriba!\n\n` +
          `🏆 GRANDE: Gana ${nombres[idGanadorGrande]}\n` +
          `🏆 CHICA: Gana ${nombres[idGanadorChica]}`);
});
