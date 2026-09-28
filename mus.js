// ==========================================
// 1. VARIABLES GLOBALES DE ESTADO
// ==========================================
let mazoActual = [];
let manosActuales = {};
let faseMus = true;
let cartasADescartar = [];
const ordenFases = ['GRANDE', 'CHICA', 'PARES', 'JUEGO'];
let indiceFaseActual = 0;
let piedrasEnMesa = 0;


// ==========================================
// 2. LÓGICA DE LA BARAJA Y REPARTO
// ==========================================
const palos = ['Oros', 'Copas', 'Espadas', 'Bastos'];
const numeros = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

function crearBarajaMus() {
    let baraja = [];
    palos.forEach(palo => {
        numeros.forEach(numero => {
            let valorJuego = numero;
            if (numero === 10 || numero === 11 || numero === 12 || numero === 3) valorJuego = 10;
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


// ==========================================
// 3. RENDERIZADO VISUAL E INTERACCIÓN
// ==========================================
function renderizarCartas(manos) {
    const divJ1 = document.getElementById('cartas-j1');
    const divsOcultos = [
        { id: 'cartas-j2', cartas: manos.jugador2 },
        { id: 'cartas-j3', cartas: manos.jugador3 },
        { id: 'cartas-j4', cartas: manos.jugador4 }
    ];

    divJ1.innerHTML = '';
    divsOcultos.forEach(jugador => document.getElementById(jugador.id).innerHTML = '');

    // Tus cartas
    manos.jugador1.forEach((carta, index) => {
        const cartaDiv = document.createElement('div');
        cartaDiv.className = 'carta';
        cartaDiv.innerText = carta.nombre;
        
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

    // Cartas rivales ocultas
    divsOcultos.forEach(jugador => {
        const contenedor = document.getElementById(jugador.id);
        jugador.cartas.forEach(() => {
            const cartaDiv = document.createElement('div');
            cartaDiv.className = 'carta carta-oculta';
            contenedor.appendChild(cartaDiv);
        });
    });
}


// ==========================================
// 4. FLUJO DE DESCARTES (MUS)
// ==========================================
function decidirDescartesIA(mano) {
    let cartasTirar = [];
    mano.forEach((carta, index) => {
        if (carta.numero >= 4 && carta.numero <= 7) cartasTirar.push(index);
    });
    return cartasTirar;
}

document.getElementById('btn-mus').addEventListener('click', () => {
    if (!faseMus) return;

    if (cartasADescartar.length === 0) {
        alert("Selecciona al menos una carta para descartar.");
        return;
    }

    let alguienCorta = false;
    let quienCorta = "";
    let descartesPrevistos = {};
    const jugadoresIA = ['jugador2', 'jugador3', 'jugador4'];

    jugadoresIA.forEach(jugador => {
        descartesPrevistos[jugador] = decidirDescartesIA(manosActuales[jugador]);
        if (descartesPrevistos[jugador].length === 0) {
            alguienCorta = true;
            quienCorta = jugador;
        }
    });

    // ¡AQUÍ ESTABA EL PRIMER ERROR! Faltaba iniciarFaseApuestas()
    if (alguienCorta) {
        faseMus = false;
        let nombreCorte = quienCorta === 'jugador2' ? "Rival 1" : (quienCorta === 'jugador3' ? "Tu compañero" : "Rival 2");
        
        alert(`¡${nombreCorte} corta el Mus porque está servido! Empieza la GRANDE.`);
        
        cartasADescartar = [];
        renderizarCartas(manosActuales);
        iniciarFaseApuestas(); // <--- CORREGIDO
        return; 
    }

    let totalCartasPedidas = cartasADescartar.length + 
                             descartesPrevistos['jugador2'].length + 
                             descartesPrevistos['jugador3'].length + 
                             descartesPrevistos['jugador4'].length;

    if (mazoActual.length < totalCartasPedidas) {
        alert("El mazo se ha quedado sin cartas.");
        return;
    }

    cartasADescartar.forEach(index => manosActuales.jugador1[index] = mazoActual.pop());
    cartasADescartar = [];

    jugadoresIA.forEach(jugador => {
        descartesPrevistos[jugador].forEach(index => {
            manosActuales[jugador][index] = mazoActual.pop();
        });
    });

    renderizarCartas(manosActuales);
});

// ¡AQUÍ ESTABA EL SEGUNDO ERROR! Faltaba iniciarFaseApuestas()
document.getElementById('btn-cortar').addEventListener('click', () => {
    if (!faseMus) return;
    faseMus = false;
    alert("¡Cortas el Mus! Empieza la ronda de la GRANDE.");
    
    cartasADescartar = [];
    renderizarCartas(manosActuales);
    iniciarFaseApuestas(); // <--- CORREGIDO
});


// ==========================================
// 5. MÁQUINA DE ESTADOS: APUESTAS Y FASES
// ==========================================
function iniciarFaseApuestas() {
    document.getElementById('panel-descartes').style.display = 'none';
    document.getElementById('panel-apuestas').style.display = 'block';
    
    indiceFaseActual = 0;
    prepararFaseUI(ordenFases[indiceFaseActual]);
}

function prepararFaseUI(nombreFase) {
    piedrasEnMesa = 0;
    document.getElementById('texto-fase').innerText = `Fase: ${nombreFase}`;
    
    document.getElementById('btn-paso').style.display = 'inline-block';
    document.getElementById('btn-envido').style.display = 'inline-block';
    document.getElementById('btn-ordago').style.display = 'inline-block';
    document.getElementById('btn-quiero').style.display = 'none';
    document.getElementById('btn-no-quiero').style.display = 'none';
}

function avanzarFase() {
    indiceFaseActual++;
    if (indiceFaseActual < ordenFases.length) {
        if (ordenFases[indiceFaseActual] === 'PARES') {
            let resultadoPares = evaluarGanadorPares();
            if (resultadoPares.id === null) {
                avanzarFase();
                return;
            }
        }
        prepararFaseUI(ordenFases[indiceFaseActual]);
    } else {
        alert("Ronda de apuestas terminada. Haz clic en el botón de Test para ver el recuento final.");
        document.getElementById('panel-apuestas').style.display = 'none';
    }
}

document.getElementById('btn-paso').addEventListener('click', () => avanzarFase());

document.getElementById('btn-envido').addEventListener('click', () => {
    piedrasEnMesa += 2;
    document.getElementById('btn-paso').style.display = 'none';
    document.getElementById('btn-envido').style.display = 'none';
    document.getElementById('btn-ordago').style.display = 'none';
    
    document.getElementById('btn-quiero').style.display = 'inline-block';
    document.getElementById('btn-no-quiero').style.display = 'inline-block';
});

document.getElementById('btn-quiero').addEventListener('click', () => avanzarFase());
document.getElementById('btn-no-quiero').addEventListener('click', () => avanzarFase());


// ==========================================
// 6. MOTOR DE EVALUACIÓN MATEMÁTICA
// ==========================================
function obtenerValorGrande(carta) {
    if (carta.numero === 3) return 12; 
    if (carta.numero === 2) return 1;  
    return carta.numero;               
}

function ordenarManoParaGrande(mano) {
    return [...mano].sort((a, b) => obtenerValorGrande(b) - obtenerValorGrande(a));
}

function compararManosGrande(manoA, manoB) {
    let ordenA = ordenarManoParaGrande(manoA);
    let ordenB = ordenarManoParaGrande(manoB);
    for (let i = 0; i < 4; i++) {
        if (obtenerValorGrande(ordenA[i]) > obtenerValorGrande(ordenB[i])) return 1;
        if (obtenerValorGrande(ordenB[i]) > obtenerValorGrande(ordenA[i])) return -1;
    }
    return 0; 
}

function evaluarGanadorGrande() {
    const ordenJugadores = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];
    let ganadorActual = 'jugador1';
    for (let i = 1; i < ordenJugadores.length; i++) {
        if (compararManosGrande(manosActuales[ganadorActual], manosActuales[ordenJugadores[i]]) === -1) {
            ganadorActual = ordenJugadores[i];
        }
    }
    return ganadorActual;
}

function ordenarManoParaChica(mano) {
    return [...mano].sort((a, b) => obtenerValorGrande(a) - obtenerValorGrande(b));
}

function compararManosChica(manoA, manoB) {
    let ordenA = ordenarManoParaChica(manoA);
    let ordenB = ordenarManoParaChica(manoB);
    for (let i = 0; i < 4; i++) {
        if (obtenerValorGrande(ordenA[i]) < obtenerValorGrande(ordenB[i])) return 1;
        if (obtenerValorGrande(ordenB[i]) < obtenerValorGrande(ordenA[i])) return -1;
    }
    return 0;
}

function evaluarGanadorChica() {
    const ordenJugadores = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];
    let ganadorActual = 'jugador1';
    for (let i = 1; i < ordenJugadores.length; i++) {
        if (compararManosChica(manosActuales[ganadorActual], manosActuales[ordenJugadores[i]]) === -1) {
            ganadorActual = ordenJugadores[i];
        }
    }
    return ganadorActual;
}

function evaluarParesJugador(mano) {
    let valores = mano.map(carta => obtenerValorGrande(carta));
    let conteo = {};
    valores.forEach(v => conteo[v] = (conteo[v] || 0) + 1);

    let parejas = [], trios = [], poker = [];
    for (let val in conteo) {
        let v = parseInt(val);
        if (conteo[val] === 2) parejas.push(v);
        if (conteo[val] === 3) trios.push(v);
        if (conteo[val] === 4) poker.push(v);
    }

    parejas.sort((a, b) => b - a);

    if (poker.length === 1) return { tipo: 'Duples', categoria: 3, valores: [poker[0], poker[0]] };
    if (parejas.length === 2) return { tipo: 'Duples', categoria: 3, valores: [parejas[0], parejas[1]] };
    if (trios.length === 1) return { tipo: 'Medias', categoria: 2, valores: [trios[0]] };
    if (parejas.length === 1) return { tipo: 'Pares', categoria: 1, valores: [parejas[0]] };
    
    return { tipo: 'Nada', categoria: 0, valores: [] };
}

function compararManosPares(paresA, paresB) {
    if (paresA.categoria > paresB.categoria) return 1;
    if (paresB.categoria > paresA.categoria) return -1;
    for (let i = 0; i < paresA.valores.length; i++) {
        if (paresA.valores[i] > paresB.valores[i]) return 1;
        if (paresB.valores[i] > paresA.valores[i]) return -1;
    }
    return 0;
}

function evaluarGanadorPares() {
    const ordenJugadores = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];
    let ganadorActual = null, mejoresPares = { categoria: 0, valores: [] }, tipoJugada = 'Nada';

    ordenJugadores.forEach(jugador => {
        let pares = evaluarParesJugador(manosActuales[jugador]);
        if (pares.categoria > 0) {
            if (ganadorActual === null || compararManosPares(mejoresPares, pares) === -1) {
                ganadorActual = jugador;
                mejoresPares = pares;
                tipoJugada = pares.tipo;
            }
        }
    });
    return { id: ganadorActual, jugada: tipoJugada };
}

function calcularSumaJuego(mano) {
    return mano.reduce((total, carta) => total + carta.valorJuego, 0);
}

function evaluarGanadorJuegoPunto() {
    const ordenJugadores = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];
    let sumas = {}, hayJuego = false;

    ordenJugadores.forEach(jugador => {
        let suma = calcularSumaJuego(manosActuales[jugador]);
        sumas[jugador] = suma;
        if (suma >= 31) hayJuego = true;
    });

    let ganadorActual = 'jugador1';

    if (hayJuego) {
        const jerarquia = { 31: 1, 32: 2, 40: 3, 37: 4, 36: 5, 35: 6, 34: 7, 33: 8 };
        let mejorFuerza = sumas['jugador1'] >= 31 ? jerarquia[sumas['jugador1']] : 99;
        
        for (let i = 1; i < ordenJugadores.length; i++) {
            if (sumas[ordenJugadores[i]] >= 31 && jerarquia[sumas[ordenJugadores[i]]] < mejorFuerza) {
                ganadorActual = ordenJugadores[i];
                mejorFuerza = jerarquia[sumas[ordenJugadores[i]]];
            }
        }
        return { fase: 'JUEGO', id: ganadorActual, suma: sumas[ganadorActual] };
    } else {
        let mejorSuma = sumas['jugador1'];
        for (let i = 1; i < ordenJugadores.length; i++) {
            if (sumas[ordenJugadores[i]] > mejorSuma) {
                ganadorActual = ordenJugadores[i];
                mejorSuma = sumas[ordenJugadores[i]];
            }
        }
        return { fase: 'PUNTO', id: ganadorActual, suma: mejorSuma };
    }
}


// ==========================================
// 7. INICIO Y TEST DE PARTIDA
// ==========================================
function iniciarPartida() {
    let barajaNueva = crearBarajaMus();
    mazoActual = barajar(barajaNueva);
    
    let reparto = repartir(mazoActual);
    manosActuales = reparto.manos;
    mazoActual = reparto.mazoSobrante;

    cartasADescartar = [];
    faseMus = true;
    
    // Mostramos panel descartes y ocultamos apuestas
    document.getElementById('panel-descartes').style.display = 'block';
    document.getElementById('panel-apuestas').style.display = 'none';

    renderizarCartas(manosActuales);
}

window.onload = iniciarPartida;

document.getElementById('btn-resolver').addEventListener('click', () => {
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

    let idG = evaluarGanadorGrande();
    let idC = evaluarGanadorChica();
    let resP = evaluarGanadorPares();
    let resJ = evaluarGanadorJuegoPunto();
    
    let noms = { 'jugador1': 'Tú', 'jugador2': 'Rival 1', 'jugador3': 'Tu compañero', 'jugador4': 'Rival 2' };
    let txtPares = resP.id !== null ? `Gana ${noms[resP.id]} con ${resP.jugada}` : "Nadie tiene pares";

    alert(`¡Las cartas están boca arriba!\n\n` +
          `🏆 GRANDE: Gana ${noms[idG]}\n` +
          `🏆 CHICA: Gana ${noms[idC]}\n` +
          `🏆 PARES: ${txtPares}\n` +
          `🏆 ${resJ.fase}: Gana ${noms[resJ.id]} con ${resJ.suma}`);
});
