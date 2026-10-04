const fs=require('fs'),vm=require('vm'),assert=require('assert');
const nodes=new Map(),queue=[],storage=new Map();
function element(id=''){return {id,textContent:'',innerHTML:'',hidden:false,disabled:false,dataset:{},children:[],style:{},getBoundingClientRect(){return {left:50,top:50,width:45,height:70}},animate(){return {cancel(){}}},remove(){},classList:{toggle(){},add(){}},setAttribute(){},addEventListener(t,fn){this['on'+t]=fn},append(...x){this.children.push(...x)},replaceChildren(...x){this.children=x},click(){this.onclick?.()}}}
const document={querySelectorAll(){return []},addEventListener(){},body:{dataset:{},classList:{toggle(){}}},getElementById(id){if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)},createElement(){return element()}};
const localStorage={getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,v)}};
const ctx={document,localStorage,window:{setTimeout(fn){queue.push(fn)},confirm(){return true}},module:{exports:{}},console};vm.createContext(ctx);
const source=fs.readFileSync(require('path').join(__dirname,'..','mus.js'),'utf8').replace(/\n}\s*$/, '\n;globalThis.test={state,cardNode,responseAction,declarationStep,discardRound,newGame,order,sendSignal,signalWindow,maybePartnerSignal,resetSignals,aiStrong,MusRules,openingAction,playerBet,responseStep,closeGame,playSound,unlockAudio,aiConfidence};\n}');vm.runInContext(source,ctx);
const {state,cardNode,responseAction,declarationStep}=ctx.test;
function tick(){if(queue.length)queue.shift()()};function until(f){for(let i=0;i<500;i++){if(f())return;if(!queue.length)throw Error('stalled '+state.stage);tick()}throw Error('timeout '+state.stage)};function click(id){nodes.get(id).click()}
assert.equal(nodes.get('btn-consejos').textContent,'Consejos OFF');click('btn-consejos');assert.equal(storage.get('tecnimus-consejos'),'on');click('btn-consejos');assert.equal(storage.get('tecnimus-consejos'),'off');
for(let n=1;n<=7;n++)assert.equal((cardNode({numero:n,palo:'Oros'}).innerHTML.match(/class="pip"/g)||[]).length,n);
for(let n of [10,11,12]){const html=cardNode({numero:n,palo:'Copas'}).innerHTML;assert(html.includes('figure-image')&&html.includes('figure-suit'))}
assert.equal(state.actor,'jugador1');click('btn-cortar');until(()=>state.stage==='opening'&&state.actor==='jugador1');
for(let i=0;i<500;i++){if(state.stage==='opening'&&state.actor==='jugador1')click('btn-paso');else if(state.stage==='response'&&state.actor==='jugador1')click('btn-no-quiero');else if(state.stage==='ready'){click('btn-resolver');break}else if(queue.length)tick();else throw Error('stalled '+state.stage)}
assert(['summary','finished'].includes(state.stage));assert(state.phases.includes('PARES'));
if(state.stage==='summary'){click('btn-siguiente');until(()=>state.stage==='mus'&&state.actor==='jugador4');assert.equal(state.mano,1)}
state.stage='response';state.phases=['GRANDE'];state.phaseIndex=0;state.offer={side:'ellos',amount:2,previous:0,ordago:false};state.response=['jugador1','jugador3'];state.cursor=0;state.pending={rejected:[]};state.actor='jugador1';click('btn-no-quiero');assert.equal(state.cursor,1);until(()=>state.actor==='jugador3');responseAction('jugador3','accept');assert.equal(state.bets.GRANDE.status,'accepted');
console.log('OK: consejos, 1–7, figuras, mano completa, rotación, respuesta independiente');
state.stage='response';state.phases=['GRANDE'];state.phaseIndex=0;state.offer={side:'ellos',amount:40,previous:2,ordago:true};state.response=['jugador1','jugador3'];state.cursor=0;state.pending={rejected:[]};state.actor='jugador1';responseAction('jugador1','accept');until(()=>state.stage==='finished');assert(state.scores.nosotros>=40||state.scores.ellos>=40);console.log('OK: órdago querido termina partida');

// Sólo nuestra pareja tiene juego: nadie puede envidar en ese lance.
const card=n=>({numero:n,palo:'Oros'});
state.hands.jugador1=[card(12),card(11),card(10),card(1)];
for(const id of ['jugador2','jugador3','jugador4'])state.hands[id]=[card(4),card(5),card(6),card(7)];
state.phases=['JUEGO'];state.phaseIndex=0;state.stage='declarations';state.declarations=['jugador1','jugador4','jugador3','jugador2'];state.cursor=0;
for(let i=0;i<5;i++)declarationStep();
assert.equal(state.bets.JUEGO.status,'automatic');assert.equal(state.phaseIndex,1);console.log('OK: juego exclusivo sin envite');

// Reparto animado: todos descartan y la baraja conserva sus 40 cartas únicas.
ctx.test.newGame();queue.splice(0);
const selections=Object.fromEntries(ctx.test.order().map(id=>[id,[0,1]]));
ctx.test.discardRound(selections);assert.equal(state.stage,'discarding');until(()=>state.stage==='mus');
for(const id of ctx.test.order())assert.equal(state.discardCounts[id],2);
const full=[...state.deck,...state.discard,...Object.values(state.hands).flat()];assert.equal(full.length,40);assert.equal(new Set(full.map(c=>c.palo+c.numero)).size,40);
console.log('OK: descarte de cuatro jugadores, recuentos y baraja sin duplicados');
ctx.test.discardRound(selections);ctx.test.newGame();assert.equal(state.stage,'mus');assert.equal(Object.keys(state.discardCounts).length,0);
for(let i=0;i<10&&queue.length;i++)tick();assert.equal(state.stage,'mus');assert.equal(Object.keys(state.discardCounts).length,0);
assert.equal(nodes.get('btn-sonido').textContent,'Sonido ON');click('btn-sonido');assert.equal(storage.get('tecnimus-sonido'),'off');assert.equal(nodes.get('btn-sonido').textContent,'Sonido OFF');
console.log('OK: reinicio durante animación y sonido desactivable');

// Señales válidas, recepción real y utilidad para el compañero.
const T=ctx.test,R=T.MusRules,hand=ns=>ns.map(n=>({numero:n,palo:'Oros'}));
assert(R.signals(hand([12,3,10,1])).includes('reyes'));assert(R.signals(hand([12,3,10,1])).includes('31'));
assert(!R.signals(hand([12,3,1,2])).includes('reyes'));assert(R.signals(hand([12,3,1,2])).includes('duples'));
assert(!R.signals(hand([7,7,7,10])).includes('medias'));assert(R.signals(hand([7,7,7,10]),{grandeDone:true}).includes('medias'));
T.newGame();queue.splice(0);assert(!T.signalWindow());T.sendSignal('31');assert(!state.signalPending);
state.stage='opening';state.phases=['GRANDE','CHICA','PARES','JUEGO'];state.phaseIndex=0;state.actor='jugador1';
state.hands.jugador1=hand([12,3,10,1]);state.hands.jugador3=hand([4,5,6,7]);
T.sendSignal('duples');assert(!state.signalPending);T.sendSignal('reyes');assert.equal(state.signalPending,'reyes');
until(()=>!!state.signalSeen.reyes);assert(T.aiStrong('jugador3','GRANDE'));assert(nodes.get('signal-receipt').textContent.includes('Socio la ha visto'));
T.resetSignals();state.hands.jugador3=hand([12,11,10,1]);T.maybePartnerSignal();assert.equal(state.signalIncoming,'31');assert.equal(state.signalMotion.jugador3,'wink');click('btn-sena-vista');assert(!state.signalIncoming);
T.resetSignals();state.hands.jugador1=hand([12,3,10,1]);T.sendSignal('31');T.resetSignals();for(let i=0;i<10&&queue.length;i++)tick();assert(!state.signalSeen['31']);
console.log('OK: señas válidas, confirmación, decisiones informadas, seña del socio y caducidad');

// Cantidades elegidas, subidas y cobro de la apuesta anterior.
function bettingSetup(){T.newGame();queue.splice(0);state.stage='opening';state.phases=['GRANDE'];state.phaseIndex=0;state.opening=T.order();state.actor='jugador1';state.cursor=0;}
bettingSetup();for(const n of [-1,0,1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER]){T.openingAction('jugador1','bet',n);assert.equal(state.stage,'opening');assert.equal(state.offer,null);}
nodes.get('bet-amount').value='9';T.playerBet();assert.equal(state.offer.amount,9);assert.equal(state.offer.previous,0);
state.actor='jugador4';T.responseAction('jugador4','raise',7);assert.equal(state.offer.amount,16);assert.equal(state.offer.previous,9);
state.actor='jugador1';T.responseAction('jugador1','raise',0);assert.equal(state.offer.amount,16);T.responseAction('jugador1','raise',3);assert.equal(state.offer.amount,19);assert.equal(state.offer.previous,16);
queue.splice(0);state.actor=state.response[0];T.responseAction(state.actor,'decline');state.actor=state.response[1];T.responseAction(state.actor,'decline');queue.splice(0);T.responseStep();assert.equal(state.scores.nosotros,16);
bettingSetup();T.openingAction('jugador1','bet',9);state.actor=state.response[0];T.responseAction(state.actor,'accept');until(()=>state.stage==='ready');click('btn-resolver');assert.equal(state.scores.nosotros+state.scores.ellos,9);
bettingSetup();T.openingAction('jugador1','ordago');state.actor=state.response[0];T.responseAction(state.actor,'raise',50);assert(state.offer.ordago);assert.equal(state.offer.amount,40);
console.log('OK: envite libre, subidas, rechazo, importe cobrado, importes inválidos y órdago');
for(const amount of [2,20]){bettingSetup();state.hands.jugador4=hand([12,3,5,6]);T.openingAction('jugador1','bet',amount);queue.splice(0);T.responseStep();tick();assert.equal(state.calls.jugador4,amount===2?'QUIERO':'NO QUIERO');}
console.log('OK: la IA responde al tamaño de la apuesta con la misma mano');

// Estadísticas: cada final de partida se cuenta una sola vez.
let previous=JSON.parse(storage.get('tecnimus-estadisticas'));T.closeGame('nosotros','Prueba');T.closeGame('nosotros','Prueba repetida');let current=JSON.parse(storage.get('tecnimus-estadisticas'));assert.equal(current.wins,previous.wins+1);
T.newGame();T.closeGame('ellos','Prueba');let last=JSON.parse(storage.get('tecnimus-estadisticas'));assert.equal(last.losses,current.losses+1);assert.equal(last.streak,0);
console.log('OK: estadísticas persistentes sin dobles victorias');
// Salida de sonido: melodías distintas y silencio real al apagar o poner volumen cero.
const heard=[],gainNodes=[];ctx.window.AudioContext=class {constructor(){this.state='running';this.currentTime=0;this.sampleRate=8000;this.destination={};}createGain(){const g={gain:{value:1,setValueAtTime(n){this.value=n},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};gainNodes.push(g);return g;}createOscillator(){return {frequency:{value:0},connect(){},disconnect(){},start(){heard.push(this.frequency.value)},stop(){}}}};
if(nodes.get('btn-sonido').textContent==='Sonido OFF')click('btn-sonido');T.unlockAudio();heard.splice(0);T.playSound('win');const win=heard.splice(0);T.playSound('lose');const lose=heard.splice(0);assert(win.at(-1)>win[0]);assert(lose.at(-1)<lose[0]);
T.playSound('signal');assert(heard.length>0);heard.splice(0);click('btn-sonido');T.playSound('bet');assert.equal(heard.length,0);assert.equal(gainNodes[0].gain.value,0);
click('btn-sonido');heard.splice(0);nodes.get('sound-volume').value='0';nodes.get('sound-volume').oninput();T.playSound('ordago');assert.equal(heard.length,0);assert.equal(storage.get('tecnimus-volumen'),'0');
console.log('OK: efectos de seña, victoria/derrota, mute y volumen cero');
