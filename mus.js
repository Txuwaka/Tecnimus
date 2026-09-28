// ==========================================
// 1. VARIABLES GLOBALES Y MARCADOR
// ==========================================
let mazoActual = [];
let manosActuales = {};
let faseMus = true;
let cartasADescartar = [];
const ordenFases = ['GRANDE', 'CHICA', 'PARES', 'JUEGO'];
let indiceFaseActual = 0;

// Sistema de puntuación (Partida a 40 piedras / 4 amarracos)
let puntosNosotros = 0;
let puntosEllos = 0;
let botesFase = { GRANDE: 1, CHICA: 1, PARES: 0, JUEGO: 0 }; 
let piedrasEnMesa = 0;

function sumarPuntos(equipo, cantidad) {
    if (equipo === 'nosotros') puntosNosotros += cantidad;
    if (equipo === 'ellos') puntosEllos += cantidad;
    
    document.getElementById('pts-nosotros').innerText = puntosNosotros;
    document.getElementById('pts-ellos').innerText = puntosEllos;

    if (puntosNosotros >= 40) setTimeout(() => alert("🏆 ¡ENHORABUENA! Vuestro equipo ha ganado la partida."), 500);
    if (puntosEllos >= 40) setTimeout(() => alert("💀 FIN DEL JUEGO. Han ganado los rivales."), 500);
}

function esNuestroEquipo(idJugador) {
    return idJugador === 'jugador1' || idJugador === 'jugador3';
}

// ==========================================
// 2. BARAJA Y REPARTO
// ==========================================
const palos = ['Oros', 'Copas', 'Espadas', 'Bastos'];
const numeros = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

function crearBarajaMus() {
    let baraja = [];
    palos.forEach(palo => {
        numeros.forEach(numero => {
            let valorJuego = numero;
            if ([10, 11, 12, 3].includes(numero)) valorJuego = 10;
            if (numero === 2) valorJuego = 1;
            baraja.push({ palo, numero, valorJuego, nombre: `${numero} de ${palo}` });
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
    let j = { jugador1: [], jugador2: [], jugador3: [], jugador4: [] };
    for (let i = 0; i < 4; i++) {
        j.jugador1.push(baraja.pop()); j.jugador2.push(baraja.pop());
        j.jugador3.push(baraja.pop()); j.jugador4.push(baraja.pop());
    }
    return { manos: j, mazoSobrante: baraja };
}

// ==========================================
// 3. RENDERIZADO VISUAL E INTERACCIÓN
// ==========================================
function renderizarCartas(manos) {
    const divJ1 = document.getElementById('cartas-j1');
    const divsOcultos = [{ id: 'cartas-j2', cartas: manos.jugador2 }, { id: 'cartas-j3', cartas: manos.jugador3 }, { id: 'cartas-j4', cartas: manos.jugador4 }];

    divJ1.innerHTML = '';
    divsOcultos.forEach(j => document.getElementById(j.id).innerHTML = '');

    manos.jugador1.forEach((carta, index) => {
        const cartaDiv = document.createElement('div');
        cartaDiv.className = `carta ${cartasADescartar.includes(index) ? 'seleccionada' : ''}`;
        cartaDiv.innerText = carta.nombre;
        
        cartaDiv.addEventListener('click', () => {
            if (!faseMus) return;
            cartasADescartar.includes(index) ? cartasADescartar = cartasADescartar.filter(i => i !== index) : cartasADescartar.push(index);
            renderizarCartas(manosActuales);
        });
        divJ1.appendChild(cartaDiv);
    });

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
    return mano.map((c, i) => (c.numero >= 4 && c.numero <= 7) ? i : -1).filter(i => i !== -1);
}

document.getElementById('btn-mus').addEventListener('click', () => {
    if (!faseMus || cartasADescartar.length === 0) return alert("Selecciona cartas para descartar.");

    let alguienCorta = false, quienCorta = "", descartesPrevistos = {};
    ['jugador2', 'jugador3', 'jugador4'].forEach(j => {
        descartesPrevistos[j] = decidirDescartesIA(manosActuales[j]);
        if (descartesPrevistos[j].length === 0) { alguienCorta = true; quienCorta = j; }
    });

    if (alguienCorta) {
        faseMus = false;
        alert(`¡Alguien está servido y corta el Mus! Empieza la ronda de apuestas.`);
        cartasADescartar = []; renderizarCartas(manosActuales); iniciarFaseApuestas(); return; 
    }

    if (mazoActual.length < 12) return alert("El mazo se ha quedado sin cartas.");

    cartasADescartar.forEach(i => manosActuales.jugador1[i] = mazoActual.pop());
    cartasADescartar = [];
    ['jugador2', 'jugador3', 'jugador4'].forEach(j => descartesPrevistos[j].forEach(i => manosActuales[j][i] = mazoActual.pop()));

    renderizarCartas(manosActuales);
});

document.getElementById('btn-cortar').addEventListener('click', () => {
    if (!faseMus) return;
    faseMus = false; alert("¡Cortas el Mus! Empieza la ronda de apuestas.");
    cartasADescartar = []; renderizarCartas(manosActuales); iniciarFaseApuestas();
});

// ==========================================
// 5. MÁQUINA DE ESTADOS E IA DE APUESTAS
// ==========================================
function equipoTienePares(esNosotros) {
    let j1 = esNosotros ? 'jugador1' : 'jugador2';
    let j2 = esNosotros ? 'jugador3' : 'jugador4';
    return evaluarParesJugador(manosActuales[j1]).categoria > 0 ||
           evaluarParesJugador(manosActuales[j2]).categoria > 0;
}

function equipoTieneJuego(esNosotros) {
    let j1 = esNosotros ? 'jugador1' : 'jugador2';
    let j2 = esNosotros ? 'jugador3' : 'jugador4';
    return calcularSumaJuego(manosActuales[j1]) >= 31 ||
           calcularSumaJuego(manosActuales[j2]) >= 31;
}

function iniciarFaseApuestas() {
    document.getElementById('panel-descartes').style.display = 'none';
    document.getElementById('panel-apuestas').style.display = 'block';
    
    // Reseteamos los botes para la nueva ronda
    botesFase = { GRANDE: 1, CHICA: 1, PARES: 0, JUEGO: 0 };
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
        let nombreFase = ordenFases[indiceFaseActual];

        // --- FILTRO DE PARES ---
        if (nombreFase === 'PARES') {
            let nosotrosPares = equipoTienePares(true);
            let ellosPares = equipoTienePares(false);
            
            // Si NO es cierto que ambos equipos tengan pares, nos saltamos la apuesta.
            // (Ya sea porque nadie tiene, o porque solo un equipo tiene).
            if (!(nosotrosPares && ellosPares)) {
                return avanzarFase();
            }
        }

        // --- FILTRO DE JUEGO / PUNTO ---
        if (nombreFase === 'JUEGO') {
            let nosotrosJuego = equipoTieneJuego(true);
            let ellosJuego = equipoTieneJuego(false);

            if (nosotrosJuego || ellosJuego) {
                // Hay Juego en la mesa. ¿Ambos tienen para poder pelear?
                if (!(nosotrosJuego && ellosJuego)) {
                    return avanzarFase(); // Solo un equipo tiene, no hay apuestas.
                }
            } else {
                // Nadie tiene Juego, así que habilitamos visualmente el PUNTO
                nombreFase = 'PUNTO';
            }
        }

        prepararFaseUI(nombreFase);
        
    } else {
        alert("Apuestas terminadas. Vamos a ver las cartas y repartir los puntos.");
        document.getElementById('panel-apuestas').style.display = 'none';
        document.getElementById('btn-resolver').style.display = 'inline-block';
    }
}

function IA_QuiereApostar(faseActual) {
    let mR1 = manosActuales['jugador2'], mR2 = manosActuales['jugador4'];
    function evaluarM(mano, fase) {
        if (fase === 'GRANDE') return mano.filter(c => obtenerValorGrande(c) >= 11).length >= 2;
        if (fase === 'CHICA') return mano.filter(c => obtenerValorGrande(c) <= 2).length >= 2;
        if (fase === 'PARES') return evaluarParesJugador(mano).categoria >= 2;
        if (fase === 'JUEGO') return [31, 32, 30, 29].includes(calcularSumaJuego(mano));
        return false;
    }
    return evaluarM(mR1, faseActual) || evaluarM(mR2, faseActual);
}

document.getElementById('btn-paso').addEventListener('click', () => {
    let f = ordenFases[indiceFaseActual];
    if (IA_QuiereApostar(f)) {
        piedrasEnMesa = 2; alert(`Tú: Paso.\nRivales: ¡Nosotros ENVIDAMOS!`);
        ['btn-paso', 'btn-envido', 'btn-ordago'].forEach(id => document.getElementById(id).style.display = 'none');
        ['btn-quiero', 'btn-no-quiero'].forEach(id => document.getElementById(id).style.display = 'inline-block');
    } else avanzarFase();
});

document.getElementById('btn-envido').addEventListener('click', () => {
    piedrasEnMesa = 2; let f = ordenFases[indiceFaseActual];
    if (IA_QuiereApostar(f)) {
        alert(`Tú: ¡Envido!\nRivales: ¡QUIERO!`);
        botesFase[f] = piedrasEnMesa; avanzarFase();
    } else {
        alert(`Tú: ¡Envido!\nRivales: NO QUIERO.`);
        sumarPuntos('nosotros', 1); botesFase[f] = -1; avanzarFase(); 
    }
});

document.getElementById('btn-ordago').addEventListener('click', () => {
    let f = ordenFases[indiceFaseActual];
    if (IA_QuiereApostar(f)) {
        alert(`¡ÓRDAGO QUERIDO! La partida se decide en la ${f}`);
        botesFase[f] = 40; avanzarFase();
    } else {
        alert(`Rivales: NO QUIERO el Órdago.`);
        sumarPuntos('nosotros', 1); botesFase[f] = -1; avanzarFase();
    }
});

document.getElementById('btn-quiero').addEventListener('click', () => {
    alert(`Apuesta aceptada.`);
    botesFase[ordenFases[indiceFaseActual]] = piedrasEnMesa; avanzarFase();
});

document.getElementById('btn-no-quiero').addEventListener('click', () => {
    alert(`Apuesta rechazada. Los rivales se llevan 1 piedra.`);
    sumarPuntos('ellos', 1); botesFase[ordenFases[indiceFaseActual]] = -1; avanzarFase();
});

// ==========================================
// 6. MOTOR DE EVALUACIÓN (Lógica Matemática)
// ==========================================
function obtenerValorGrande(c) { return c.numero === 3 ? 12 : (c.numero === 2 ? 1 : c.numero); }
function ordenarPara(m, fase) { return [...m].sort((a, b) => fase === 'G' ? obtenerValorGrande(b) - obtenerValorGrande(a) : obtenerValorGrande(a) - obtenerValorGrande(b)); }
function compararManos(mA, mB, fase) {
    let oA = ordenarPara(mA, fase), oB = ordenarPara(mB, fase);
    for (let i = 0; i < 4; i++) {
        let vA = obtenerValorGrande(oA[i]), vB = obtenerValorGrande(oB[i]);
        if (fase === 'G' ? vA > vB : vA < vB) return 1;
        if (fase === 'G' ? vB > vA : vB < vA) return -1;
    } return 0;
}
function evaluarFase(fase) {
    let ganador = 'jugador1', ord = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];
    for (let i = 1; i < 4; i++) if (compararManos(manosActuales[ganador], manosActuales[ord[i]], fase) === -1) ganador = ord[i];
    return ganador;
}
function evaluarGanadorGrande() { return evaluarFase('G'); }
function evaluarGanadorChica() { return evaluarFase('C'); }

function evaluarParesJugador(m) {
    let conteo = {}, p = [], t = [], k = [];
    m.forEach(c => conteo[obtenerValorGrande(c)] = (conteo[obtenerValorGrande(c)] || 0) + 1);
    for (let val in conteo) { let v = parseInt(val); if(conteo[val]===2) p.push(v); if(conteo[val]===3) t.push(v); if(conteo[val]===4) k.push(v); }
    p.sort((a, b) => b - a);
    if (k.length === 1) return { tipo: 'Duples', categoria: 3, valores: [k[0], k[0]] };
    if (p.length === 2) return { tipo: 'Duples', categoria: 3, valores: [p[0], p[1]] };
    if (t.length === 1) return { tipo: 'Medias', categoria: 2, valores: [t[0]] };
    if (p.length === 1) return { tipo: 'Pares', categoria: 1, valores: [p[0]] };
    return { tipo: 'Nada', categoria: 0, valores: [] };
}
function compararPares(pA, pB) {
    if (pA.categoria > pB.categoria) return 1; if (pB.categoria > pA.categoria) return -1;
    for (let i = 0; i < pA.valores.length; i++) { if (pA.valores[i] > pB.valores[i]) return 1; if (pB.valores[i] > pA.valores[i]) return -1; } return 0;
}
function evaluarGanadorPares() {
    let gan = null, mej = { categoria: 0, valores: [] }, tip = 'Nada';
    ['jugador1', 'jugador2', 'jugador3', 'jugador4'].forEach(j => {
        let p = evaluarParesJugador(manosActuales[j]);
        if (p.categoria > 0 && (gan === null || compararPares(mej, p) === -1)) { gan = j; mej = p; tip = p.tipo; }
    });
    return { id: gan, jugada: tip, categoria: mej.categoria };
}

function calcularSumaJuego(m) { return m.reduce((t, c) => t + c.valorJuego, 0); }
function evaluarGanadorJuegoPunto() {
    let sumas = {}, hayJuego = false, ord = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];
    ord.forEach(j => { sumas[j] = calcularSumaJuego(manosActuales[j]); if (sumas[j] >= 31) hayJuego = true; });
    let gan = 'jugador1';
    if (hayJuego) {
        const jer = { 31: 1, 32: 2, 40: 3, 37: 4, 36: 5, 35: 6, 34: 7, 33: 8 };
        let mejF = sumas['jugador1'] >= 31 ? jer[sumas['jugador1']] : 99;
        for (let i = 1; i < 4; i++) if (sumas[ord[i]] >= 31 && jer[sumas[ord[i]]] < mejF) { gan = ord[i]; mejF = jer[sumas[ord[i]]]; }
        return { fase: 'JUEGO', id: gan, suma: sumas[gan] };
    } else {
        let mejS = sumas['jugador1'];
        for (let i = 1; i < 4; i++) if (sumas[ord[i]] > mejS) { gan = ord[i]; mejS = sumas[ord[i]]; }
        return { fase: 'PUNTO', id: gan, suma: mejS };
    }
}

// ==========================================
// 7. RESOLUCIÓN DE LA RONDA Y REPARTO DE PIEDRAS
// ==========================================
document.getElementById('btn-resolver').addEventListener('click', () => {
    // 1. Dar vuelta a las cartas
    [{ id: 'cartas-j2', mano: manosActuales.jugador2 }, { id: 'cartas-j3', mano: manosActuales.jugador3 }, { id: 'cartas-j4', mano: manosActuales.jugador4 }]
        .forEach(r => {
            const cont = document.getElementById(r.id); cont.innerHTML = ''; 
            r.mano.forEach(c => { const d = document.createElement('div'); d.className = 'carta'; d.innerText = c.nombre; cont.appendChild(d); });
        });

    // 2. Calcular ganadores
    let idG = evaluarGanadorGrande(), idC = evaluarGanadorChica(), resP = evaluarGanadorPares(), resJ = evaluarGanadorJuegoPunto();
    let noms = { 'jugador1': 'Tú', 'jugador2': 'Rival 1', 'jugador3': 'Tu compañero', 'jugador4': 'Rival 2' };
    
    // 3. REPARTIR LOS PUNTOS AL EQUIPO GANADOR
    
    // Grande y Chica: Sumamos el bote, o 1 si todos habían dicho "Paso" (bote === 0)
    if (botesFase.GRANDE !== -1) sumarPuntos(esNuestroEquipo(idG) ? 'nosotros' : 'ellos', Math.max(1, botesFase.GRANDE));
    if (botesFase.CHICA !== -1) sumarPuntos(esNuestroEquipo(idC) ? 'nosotros' : 'ellos', Math.max(1, botesFase.CHICA));
    
    // Pares: Suma el bote apostado MÁS el valor de los pares de los DOS miembros del equipo
    let textoParesExtra = "";
    if (resP.id && botesFase.PARES !== -1) {
        let equipoGana = esNuestroEquipo(resP.id) ? 'nosotros' : 'ellos';
        let equipoNombres = equipoGana === 'nosotros' ? ['jugador1', 'jugador3'] : ['jugador2', 'jugador4'];
        let puntosExtra = 0;

        // Comprobamos los pares de los dos jugadores
        equipoNombres.forEach(j => {
            let p = evaluarParesJugador(manosActuales[j]);
            if (p.categoria === 3) puntosExtra += 3; // Duples
            if (p.categoria === 2) puntosExtra += 2; // Medias
            if (p.categoria === 1) puntosExtra += 1; // Pares
        });

        let totalPares = botesFase.PARES + puntosExtra;
        sumarPuntos(equipoGana, totalPares);
        textoParesExtra = ` (+${totalPares})`;
    }

    // Juego o Punto: Suma bote MÁS el valor del juego de los DOS miembros
    let textoJuegoExtra = "";
    if (resJ.id && botesFase.JUEGO !== -1) {
        let equipoGana = esNuestroEquipo(resJ.id) ? 'nosotros' : 'ellos';
        let equipoNombres = equipoGana === 'nosotros' ? ['jugador1', 'jugador3'] : ['jugador2', 'jugador4'];
        let puntosExtra = 0;

        if (resJ.fase === 'JUEGO') {
            // Comprobamos los juegos de los dos jugadores
            equipoNombres.forEach(j => {
                let suma = calcularSumaJuego(manosActuales[j]);
                if (suma === 31) puntosExtra += 3;
                else if (suma >= 32) puntosExtra += 2;
            });
        } else {
            // Si es punto, solo se lleva 1 punto en total el equipo ganador
            puntosExtra = 1;
        }

        let totalJuego = botesFase.JUEGO + puntosExtra;
        sumarPuntos(equipoGana, totalJuego);
        textoJuegoExtra = ` (+${totalJuego})`;
    }

    // 4. Informe final
    alert(`RESUMEN DE LA MANO:\n\n` +
          `GRANDE: Gana ${noms[idG]} (+${botesFase.GRANDE !== -1 ? Math.max(1, botesFase.GRANDE) : 0})\n` +
          `CHICA: Gana ${noms[idC]} (+${botesFase.CHICA !== -1 ? Math.max(1, botesFase.CHICA) : 0})\n` +
          `PARES: ${resP.id ? `Gana ${noms[resP.id]}${textoParesExtra}` : "Nadie"}\n` +
          `${resJ.fase}: Gana ${noms[resJ.id]} con ${resJ.suma}${textoJuegoExtra}`);

    // Alternar botones
    document.getElementById('btn-resolver').style.display = 'none';
    document.getElementById('btn-siguiente').style.display = 'inline-block';
});

// ==========================================
// 8. ARRANQUE DEL JUEGO
// ==========================================
function iniciarPartida() {
    let barajaNueva = crearBarajaMus(); mazoActual = barajar(barajaNueva);
    let reparto = repartir(mazoActual); manosActuales = reparto.manos; mazoActual = reparto.mazoSobrante;

    cartasADescartar = []; faseMus = true;
    document.getElementById('panel-descartes').style.display = 'block';
    document.getElementById('panel-apuestas').style.display = 'none';

    renderizarCartas(manosActuales);
}
window.onload = iniciarPartida;
