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

// --- 3. LÓGICA DE LOS BOTONES ---
document.getElementById('btn-mus').addEventListener('click', () => {
    if (!faseMus) return;

    if (cartasADescartar.length === 0) {
        alert("Selecciona al menos una carta haciendo clic sobre ella para descartar.");
        return;
    }

    if (mazoActual.length < cartasADescartar.length) {
        alert("No quedan cartas suficientes en el mazo.");
        return;
    }

    // Robar cartas nuevas del mazo y sustituir las descartadas
    cartasADescartar.forEach(index => {
        manosActuales.jugador1[index] = mazoActual.pop();
    });

    // Resetear la selección y redibujar
    cartasADescartar = [];
    renderizarCartas(manosActuales);
    
    console.log("Cartas restantes en mazo tras tu descarte:", mazoActual.length);
});

document.getElementById('btn-cortar').addEventListener('click', () => {
    if (!faseMus) return;
    faseMus = false;
    alert("¡Se corta el Mus! Empieza la ronda de la GRANDE.");
    
    // Apagar botones y resetear selecciones
    document.getElementById('btn-mus').style.opacity = '0.5';
    document.getElementById('btn-cortar').style.opacity = '0.5';
    cartasADescartar = [];
    renderizarCartas(manosActuales);
});

// --- 4. INICIO DE PARTIDA ---
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