'use strict';
// Variante de 40 cartas, ocho reyes y ocho ases. El usuario decide por su pareja.
const MusRules = (() => {
  const ids = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];
  const sides = {jugador1:'nosotros', jugador3:'nosotros', jugador2:'ellos', jugador4:'ellos'};
  const ranks = [1,2,3,4,5,6,7,10,11,12];
  const suits = ['Oros','Copas','Espadas','Bastos'];
  const rank = card => card.numero === 3 ? 12 : card.numero === 2 ? 1 : card.numero;
  const sum = hand => hand.reduce((n,c) => n + (rank(c) >= 10 ? 10 : rank(c)), 0);
  const deck = () => suits.flatMap(palo => ranks.map(numero => ({palo,numero})));
  const shuffle = cards => { for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards; };
  function pairs(hand){
    const counts = new Map(); hand.forEach(c => counts.set(rank(c),(counts.get(rank(c))||0)+1));
    const doubles = [...counts].filter(([,n])=>n===2).map(([v])=>v).sort((a,b)=>b-a);
    const four = [...counts].find(([,n])=>n===4);
    const three = [...counts].find(([,n])=>n===3);
    if(four) return {tier:3,values:[four[0],four[0]],name:'Duples',points:3};
    if(doubles.length===2) return {tier:3,values:doubles,name:'Duples',points:3};
    if(three) return {tier:2,values:[three[0]],name:'Medias',points:2};
    if(doubles.length) return {tier:1,values:doubles,name:'Par',points:1};
    return {tier:0,values:[],name:'Sin pares',points:0};
  }
  const gameOrder = [31,32,40,37,36,35,34,33];
  function strength(hand, phase){
    if(phase==='GRANDE') return hand.map(rank).sort((a,b)=>b-a);
    if(phase==='CHICA') return hand.map(c=>-rank(c)).sort((a,b)=>b-a);
    if(phase==='PARES'){const p=pairs(hand);return [p.tier,...p.values];}
    const n=sum(hand);
    if(phase==='JUEGO') return [n>=31 ? gameOrder.length-gameOrder.indexOf(n) : 0];
    return [n]; // PUNTO
  }
  function compare(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const diff=(a[i]||0)-(b[i]||0);if(diff) return Math.sign(diff);}return 0;}
  function qualifies(hand,phase){return phase==='PARES' ? pairs(hand).tier>0 : phase==='JUEGO' ? sum(hand)>=31 : true;}
  function order(mano){return ids.map((_,i)=>ids[(mano+i)%4]);}
  function winner(hands,phase,mano){const eligible=order(mano).filter(id=>qualifies(hands[id],phase));if(!eligible.length)return null;return eligible.reduce((best,id)=>compare(strength(hands[id],phase),strength(hands[best],phase))>0?id:best);}
  function phases(hands){const all=ids.map(id=>hands[id]);const pairPresent=all.some(h=>qualifies(h,'PARES'));const gamePresent=all.some(h=>qualifies(h,'JUEGO'));return ['GRANDE','CHICA',...(pairPresent?['PARES']:[]),gamePresent?'JUEGO':'PUNTO'];}
  function canBet(hands,phase){return ['nosotros','ellos'].every(side=>ids.some(id=>sides[id]===side&&qualifies(hands[id],phase)));}
  function intrinsic(hands,phase,side){const own=ids.filter(id=>sides[id]===side);if(phase==='PARES')return own.reduce((n,id)=>n+pairs(hands[id]).points,0);if(phase==='JUEGO')return own.reduce((n,id)=>n+(sum(hands[id])===31?3:sum(hands[id])>=32?2:0),0);return 1;}
  return {ids,sides,rank,sum,deck,shuffle,pairs,strength,compare,qualifies,order,winner,phases,canBet,intrinsic};
})();
if(typeof module!=='undefined' && module.exports) module.exports=MusRules;

if(typeof document!=='undefined'){
  const $=id=>document.getElementById(id);
  const label={jugador1:'Tú',jugador2:'Rival 1',jugador3:'Compañero',jugador4:'Rival 2'};
  const suitSymbol={Oros:'◆',Copas:'♥',Espadas:'♠',Bastos:'♣'};
  const suitColor={Oros:'gold',Copas:'red',Espadas:'blue',Bastos:'green'};
  const cardNumber={1:'A',10:'S',11:'C',12:'R'};
  const phaseName={GRANDE:'Grande',CHICA:'Chica',PARES:'Pares',JUEGO:'Juego',PUNTO:'Punto'};
  const state={scores:{nosotros:0,ellos:0},handNumber:0,mano:0,hands:{},deck:[],discard:[],selected:new Set(),musTurns:0,stage:'mus',phases:[],phaseIndex:0,bets:{},pending:null,revealed:false,note:'',result:[]};
  function announce(message){$('anuncio').textContent=message;}
  function status(title,detail,stage){$('mensaje').textContent=title;$('ayuda').textContent=detail;$('etapa').textContent=stage;announce(title+' '+detail);}
  function panel(id){for(const name of ['mus','apuestas','respuesta','resolver','siguiente','fin'])$('panel-'+name).hidden=name!==id;}
  function cardNode(card,back=false,mini=false){
    const el=document.createElement('div');el.className='card'+(back?' back':' '+suitColor[card.palo]);
    if(!back){const n=cardNumber[card.numero]||String(card.numero);el.innerHTML='<span class="corner">'+n+'</span><span class="suit" aria-hidden="true">'+suitSymbol[card.palo]+'</span><span class="card-name">'+card.palo+'</span><span class="corner bottom">'+n+'</span>';el.setAttribute('aria-label',card.numero+' de '+card.palo);}
    else el.setAttribute('aria-label','Carta boca abajo');
    return el;
  }
  function render(){
    $('pts-nosotros').textContent=state.scores.nosotros;$('pts-ellos').textContent=state.scores.ellos;
    $('mano-indicador').textContent='MANO '+state.handNumber;
    $('fase-indicador').textContent=state.stage==='mus'?'MUS':state.stage==='finished'?'PARTIDA FINALIZADA':phaseName[state.phases[state.phaseIndex]]?.toUpperCase()||'RESULTADOS';
    $('centro-titulo').textContent=state.stage==='mus'?'Mus':state.stage==='finished'?'Fin de partida':state.stage==='summary'?'Cartas vistas':phaseName[state.phases[state.phaseIndex]]||'Lances';
    $('centro-subtitulo').textContent=state.stage==='mus'?'Dar mus o cortar':state.stage==='summary'?'Siguiente mano':state.stage==='finished'?'40 piedras':'Tú decides por tu equipo';
    MusRules.ids.forEach(id=>{
      const box=$('cartas-j'+id.at(-1));box.replaceChildren();
      $('turno-j'+id.at(-1)).textContent=MusRules.order(state.mano)[0]===id?'· MANO':'';
      state.hands[id].forEach((c,i)=>{
        if(id==='jugador1'){
          const b=document.createElement('button');b.type='button';b.className='card '+suitColor[c.palo]+(state.selected.has(i)?' selected':'');b.disabled=state.stage!=='mus';b.setAttribute('aria-pressed',String(state.selected.has(i)));b.setAttribute('aria-label',(cardNumber[c.numero]||c.numero)+' de '+c.palo+(state.selected.has(i)?', seleccionada':''));
          const face=cardNode(c);b.innerHTML=face.innerHTML;
          b.addEventListener('click',()=>{if(state.selected.has(i))state.selected.delete(i);else state.selected.add(i);$('cuenta-descartes').textContent='('+state.selected.size+')';render();});box.append(b);
        }else box.append(cardNode(c,!state.revealed,true));
      });
    });
  }
  function freshHand(){
    state.handNumber++;state.mano=(state.handNumber-1)%4;
    state.deck=MusRules.shuffle(MusRules.deck());state.discard=[];state.hands=Object.fromEntries(MusRules.ids.map(id=>[id,[]]));
    for(let i=0;i<4;i++)for(const id of MusRules.order(state.mano))state.hands[id].push(state.deck.pop());
    state.selected.clear();state.musTurns=0;state.stage='mus';state.phases=[];state.phaseIndex=0;state.bets={};state.pending=null;state.revealed=false;state.note='';state.result=[];
    $('resumen').innerHTML='<p class="empty">Aquí aparecerán los resultados al descubrir las cartas.</p>';
    $('cuenta-descartes').textContent='(0)';
    panel('mus');status('Selecciona las cartas que quieras cambiar.','Puedes dar mus sin descartar cartas, o cortar para empezar los lances.','TU TURNO');render();
  }
  function aiDiscard(hand){
    const keep=new Set();const counts=new Map();hand.forEach(c=>counts.set(MusRules.rank(c),(counts.get(MusRules.rank(c))||0)+1));
    hand.forEach((c,i)=>{const v=MusRules.rank(c);if(counts.get(v)>=2||v===12||v===1||MusRules.sum(hand)===31)keep.add(i);});
    return hand.map((_,i)=>i).filter(i=>!keep.has(i));
  }
  function draw(){if(!state.deck.length){state.deck=MusRules.shuffle(state.discard.splice(0));}return state.deck.pop();}
  function giveMus(){
    if(state.stage!=='mus')return;
    const aiIds=['jugador2','jugador3','jugador4'];
    const cutter=aiIds.find(id=>{const h=state.hands[id];return MusRules.sum(h)===31||MusRules.pairs(h).tier>=2||aiDiscard(h).length===0;});
    if(cutter){startBetting(label[cutter]+' corta el mus.');return;}
    // Retirar todas las cartas antes de robar; barajar descartes sólo si se agota el mazo.
    const selections={jugador1:[...state.selected],...Object.fromEntries(aiIds.map(id=>[id,aiDiscard(state.hands[id])]))};
    const removed=[];for(const id of MusRules.ids)for(const i of selections[id])removed.push(state.hands[id][i]);
    state.discard.push(...removed);
    for(const id of MusRules.order(state.mano))for(const i of selections[id])state.hands[id][i]=draw();
    state.selected.clear();state.musTurns++;$('cuenta-descartes').textContent='(0)';
    status('Mus dado · vuelta '+state.musTurns+'.','Se han cambiado '+selections.jugador1.length+' de tus cartas. Puedes volver a dar mus o cortar.','MUS');render();
  }
  function phase(){return state.phases[state.phaseIndex];}
  function startBetting(note){state.selected.clear();state.note=note;state.phases=MusRules.phases(state.hands);state.phaseIndex=0;state.stage='betting';preparePhase();}
  function preparePhase(){
    while(state.phaseIndex<state.phases.length&&!MusRules.canBet(state.hands,phase())){
      state.bets[phase()]={status:'automatic',amount:0};state.phaseIndex++;
    }
    if(state.phaseIndex>=state.phases.length){state.stage='ready';panel('resolver');status('Lances terminados.','Muestra las cartas para conocer el resultado de la mano.','A DESCUBRIR');render();return;}
    state.stage='betting';panel('apuestas');const f=phase();
    status(phaseName[f]+': ¿qué hacemos?',state.note||'Puedes pasar, envidar 2 piedras o lanzar un órdago.','APUESTAS');
    state.note='';render();
  }
  function advance(){state.phaseIndex++;preparePhase();}
  function aiWants(phaseNameValue){
    const theirs=['jugador2','jugador4'].map(id=>state.hands[id]).filter(h=>MusRules.qualifies(h,phaseNameValue));
    if(phaseNameValue==='GRANDE')return theirs.some(h=>h.filter(c=>MusRules.rank(c)===12).length>=2);
    if(phaseNameValue==='CHICA')return theirs.some(h=>h.filter(c=>MusRules.rank(c)===1).length>=2);
    if(phaseNameValue==='PARES')return theirs.some(h=>MusRules.pairs(h).tier>=2||MusRules.pairs(h).values[0]===12);
    if(phaseNameValue==='JUEGO')return theirs.some(h=>[31,32].includes(MusRules.sum(h)));
    return theirs.some(h=>MusRules.sum(h)>=28);
  }
  function award(side,points){state.scores[side]+=points;return state.scores[side]>=40;}
  function closeGame(side,message){state.stage='finished';state.revealed=true;panel('fin');render();status((side==='nosotros'?'¡Habéis ganado!':'Ganan los rivales.')+' '+message,'Partida terminada · '+state.scores.nosotros+' a '+state.scores.ellos+' piedras.','FIN DE PARTIDA');}
  function refused(side){
    const f=phase();state.bets[f]={status:'refused',amount:0,side};
    const finished=award(side,1);state.note=(side==='nosotros'?'Rivales: no quieren.':'No quieres. Los rivales cobran una piedra.');
    if(finished){
      state.revealed=true;
      $('resumen').replaceChildren();
      const item=document.createElement('div');item.className='result-row';
      item.textContent=phaseName[f]+' · apuesta no querida · +1 para '+(side==='nosotros'?'tu equipo':'rivales');
      $('resumen').append(item);
      closeGame(side,'La apuesta rechazada dio la piedra decisiva.');return;
    }
    advance();
  }
  function playerPass(){if(state.stage!=='betting')return;const f=phase();if(aiWants(f)){
    state.stage='respond';state.pending={side:'ellos',amount:2};panel('respuesta');status('Los rivales envidan 2.','¿Quieres aceptar la apuesta o darles una piedra?','RESPONDE');render();
  }else{state.bets[f]={status:'passed',amount:0};state.note='Ambos equipos pasan.';advance();}}
  function playerBet(ordo=false){if(state.stage!=='betting')return;const f=phase();if(aiWants(f)){
    state.bets[f]={status:'accepted',amount:ordo?40:2};
    if(ordo){showResults(true);return;}
    state.note='Rivales: quiero. Apuesta aceptada de 2 piedras.';advance();
  }else refused('nosotros');}
  function respond(accept){if(state.stage!=='respond')return;const f=phase();if(accept){state.bets[f]={status:'accepted',amount:state.pending.amount};state.pending=null;state.note='Quiero. Apuesta aceptada de 2 piedras.';advance();}
    else{state.pending=null;refused('ellos');}}
  function showResults(ordo=false){
    if(!ordo&&state.stage!=='ready')return;
    state.revealed=true;const phases=ordo?[phase()]:state.phases;
    const rows=[];let finalSide=null;
    for(const f of phases){
      const winner=MusRules.winner(state.hands,f,state.mano);if(!winner)continue;
      const bet=state.bets[f]||{status:'passed',amount:0};
      const side=bet.status==='refused'?bet.side:MusRules.sides[winner];
      let points=0,description='';
      if(bet.status==='refused'){
        // El deje ya se cobró. Pares, juego y punto conservan su valor para el que envidó.
        points=['PARES','JUEGO','PUNTO'].includes(f)?MusRules.intrinsic(state.hands,f,side):0;
        description='Apuesta no querida · '+(side==='nosotros'?'tu equipo':'rivales');
        if(points&&award(side,points))finalSide=side;
      }
      else if(ordo){description='Órdago querido · '+label[winner]+' gana la partida';finalSide=side;}
      else{
        // Grande y chica sólo cobran un punto cuando quedan en paso.
        points=(['GRANDE','CHICA'].includes(f)&&bet.status==='accepted'?0:MusRules.intrinsic(state.hands,f,side))+(bet.amount||0);
        description=label[winner]+' · '+(f==='PARES'?MusRules.pairs(state.hands[winner]).name:f==='JUEGO'||f==='PUNTO'?MusRules.sum(state.hands[winner])+' puntos':phaseName[f]);
        if(award(side,points)){finalSide=side;}
      }
      rows.push({phase:f,description,points,side,refused:bet.status==='refused'});
      if(finalSide)break; // Los lances se cobran en orden; la partida termina al llegar a 40.
    }
    state.result=rows;render();
    const box=$('resumen');box.replaceChildren();
    rows.forEach(row=>{const item=document.createElement('div');item.className='result-row';
      const name=document.createElement('strong');name.textContent=phaseName[row.phase];
      const detail=document.createElement('span');detail.className=row.refused?'muted':row.side==='nosotros'?'won':'lost';detail.textContent=row.description+(row.points?' · +'+row.points:'');
      item.append(name,detail);box.append(item);});
    if(ordo){state.scores[finalSide]=40;render();closeGame(finalSide,'Órdago querido.');return;}
    if(finalSide){closeGame(finalSide,'Se alcanzaron las 40 piedras.');return;}
    state.stage='summary';panel('siguiente');render();status('Mano resuelta.','Revisa las cartas y el resumen. La mano pasará al siguiente jugador.','RESULTADOS');
  }
  function newGame(){state.scores={nosotros:0,ellos:0};state.handNumber=0;freshHand();}
  $('btn-mus').addEventListener('click',giveMus);
  $('btn-cortar').addEventListener('click',()=>{if(state.stage==='mus')startBetting('Tú cortas el mus.');});
  $('btn-paso').addEventListener('click',playerPass);
  $('btn-envido').addEventListener('click',()=>playerBet(false));
  $('btn-ordago').addEventListener('click',()=>playerBet(true));
  $('btn-quiero').addEventListener('click',()=>respond(true));
  $('btn-no-quiero').addEventListener('click',()=>respond(false));
  $('btn-resolver').addEventListener('click',()=>showResults(false));
  $('btn-siguiente').addEventListener('click',()=>{if(state.stage==='summary')freshHand();});
  $('btn-nueva').addEventListener('click',newGame);
  $('btn-reiniciar').addEventListener('click',()=>{if(state.handNumber===1&&state.stage==='mus'&&state.scores.nosotros===0&&state.scores.ellos===0){newGame();return;}if(window.confirm('¿Empezar una partida nueva? Se perderá el marcador actual.'))newGame();});
  newGame();
}
