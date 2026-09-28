'use strict';
// TecniMus Alpha 2 · 40 cartas, ocho reyes y ocho ases.
// Orden de juego a derechas visto desde el jugador humano: Tú → Rival 2 → Compañero → Rival 1.
const MusRules = (() => {
  const ids = ['jugador1', 'jugador4', 'jugador3', 'jugador2'];
  const sides = {jugador1:'nosotros', jugador3:'nosotros', jugador2:'ellos', jugador4:'ellos'};
  const ranks = [1,2,3,4,5,6,7,10,11,12];
  const suits = ['Oros','Copas','Espadas','Bastos'];
  const rank = card => card.numero === 3 ? 12 : card.numero === 2 ? 1 : card.numero;
  const sum = hand => hand.reduce((n,c) => n + (rank(c) >= 10 ? 10 : rank(c)), 0);
  const deck = () => suits.flatMap(palo => ranks.map(numero => ({palo,numero})));
  const shuffle = cards => {
    for(let i=cards.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [cards[i],cards[j]]=[cards[j],cards[i]];
    }
    return cards;
  };

  function pairs(hand){
    const counts = new Map();
    hand.forEach(c => counts.set(rank(c),(counts.get(rank(c))||0)+1));
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
    if(phase==='PARES'){
      const p=pairs(hand);
      return [p.tier,...p.values];
    }
    const n=sum(hand);
    if(phase==='JUEGO') return [n>=31 ? gameOrder.length-gameOrder.indexOf(n) : 0];
    return [n]; // PUNTO
  }

  function compare(a,b){
    for(let i=0;i<Math.max(a.length,b.length);i++){
      const diff=(a[i]||0)-(b[i]||0);
      if(diff) return Math.sign(diff);
    }
    return 0;
  }

  function qualifies(hand,phase){
    return phase==='PARES' ? pairs(hand).tier>0 : phase==='JUEGO' ? sum(hand)>=31 : true;
  }

  // ids ya está ordenado a derechas; mano es el índice del jugador que es mano.
  function order(mano){return ids.map((_,i)=>ids[(mano+i)%4]);}

  function winner(hands,phase,mano){
    const eligible=order(mano).filter(id=>qualifies(hands[id],phase));
    if(!eligible.length)return null;
    // En empate se conserva el primero según el orden desde la mano.
    return eligible.reduce((best,id)=>compare(strength(hands[id],phase),strength(hands[best],phase))>0?id:best);
  }

  function phases(hands){
    const all=ids.map(id=>hands[id]);
    const pairPresent=all.some(h=>qualifies(h,'PARES'));
    const gamePresent=all.some(h=>qualifies(h,'JUEGO'));
    return ['GRANDE','CHICA',...(pairPresent?['PARES']:[]),gamePresent?'JUEGO':'PUNTO'];
  }

  function canBet(hands,phase){
    return ['nosotros','ellos'].every(side=>ids.some(id=>sides[id]===side&&qualifies(hands[id],phase)));
  }

  function intrinsic(hands,phase,side){
    const own=ids.filter(id=>sides[id]===side);
    if(phase==='PARES')return own.reduce((n,id)=>n+pairs(hands[id]).points,0);
    if(phase==='JUEGO')return own.reduce((n,id)=>n+(sum(hands[id])===31?3:sum(hands[id])>=32?2:0),0);
    return 1;
  }

  return {ids,sides,rank,sum,deck,shuffle,pairs,strength,compare,qualifies,order,winner,phases,canBet,intrinsic};
})();

if(typeof module!=='undefined' && module.exports) module.exports=MusRules;

if(typeof document!=='undefined'){
  const $=id=>document.getElementById(id);
  const label={jugador1:'Tú',jugador2:'Rival 1',jugador3:'Compañero',jugador4:'Rival 2'};
  const phaseName={GRANDE:'Grande',CHICA:'Chica',PARES:'Pares',JUEGO:'Juego',PUNTO:'Punto'};
  const suitColor={Oros:'gold',Copas:'red',Espadas:'blue',Bastos:'green'};
  const figureName={10:'SOTA',11:'CABALLO',12:'REY'};
  const cardNumber={1:'1',10:'10',11:'11',12:'12'};

  // Dibujos propios de los cuatro palos españoles.
  const suitIcon={
    Oros:'<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="9"/><path d="m16 8 1.9 5.7L24 16l-6.1 2.3L16 24l-1.9-5.7L8 16l6.1-2.3Z"/>',
    Copas:'<path d="M6 5h20l-1.7 9.2C23.5 19 20.7 21 16 21s-7.5-2-8.3-6.8L6 5Z"/><path d="M16 21v6M10 28h12"/><path d="M7 9H4c0 4 2 6 5 6M25 9h3c0 4-2 6-5 6"/>',
    Espadas:'<path d="m16 2 3.2 4.5-2 13.5-1.2 2-1.2-2-2-13.5L16 2Z"/><path d="M9 21h14M16 22v6M13 29h6"/><path d="m9 21-2-3m16 3 2-3"/>',
    Bastos:'<path d="M11 28 20.5 6.5a3.2 3.2 0 0 1 6 2.6L16 29Z"/><path d="m17 14 5 2m-7 3 5 2m-7 3 5 2"/><circle cx="24" cy="7" r="1"/>'
  };

  const state={
    scores:{nosotros:0,ellos:0},handNumber:0,mano:0,hands:{},deck:[],discard:[],selected:new Set(),musTurns:0,
    stage:'mus',phases:[],phaseIndex:0,bets:{},pending:null,revealed:false,note:'',result:[],
    cutter:null,actor:'jugador1',lastActor:null,lastAction:'',actionLog:[]
  };

  function announce(message){$('anuncio').textContent=message;}
  function status(title,detail,stage){$('mensaje').textContent=title;$('ayuda').textContent=detail;$('etapa').textContent=stage;announce(title+' '+detail);}
  function panel(id){for(const name of ['mus','apuestas','respuesta','resolver','siguiente','fin'])$('panel-'+name).hidden=name!==id;}
  function phase(){return state.phases[state.phaseIndex];}
  function handId(){return MusRules.order(state.mano)[0];}

  function setActor(id,action=''){
    state.actor=id||null;
    if(id&&action){
      state.lastActor=id;state.lastAction=action;
      const entry=label[id]+': '+action;
      if(state.actionLog[state.actionLog.length-1]!==entry)state.actionLog.push(entry);
      if(state.actionLog.length>3)state.actionLog.shift();
    }
  }

  function emblemSvg(palo){
    return '<g transform="translate(31 48) scale(.62) translate(-16 -16)" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">'+suitIcon[palo]+'</g>';
  }

  // Figuras originales y ligeras: no dependen de imágenes externas y escalan bien en móvil.
  function figureSvg(card){
    const emblem=emblemSvg(card.palo);
    const frame='<rect x="3" y="3" width="58" height="72" rx="6" class="figure-frame"/>';
    let art='';
    if(card.numero===10){
      art='<path class="figure-cloth" d="M17 64c2-15 7-23 15-23s13 8 15 23Z"/>'+
          '<circle class="figure-skin" cx="32" cy="27" r="10"/>'+
          '<path d="M22 25c2-10 17-13 21-2-5-2-7-7-16-4-3 1-4 4-5 6Z"/>'+
          '<path d="M27 31c3 2 7 2 10 0M29 25h1m5 0h1"/>'+
          '<path d="M21 49h22M25 43l-6-7M39 43l6-7"/>';
    }else if(card.numero===11){
      art='<path class="horse" d="M14 58c4-12 7-21 12-27l-4-10 8 5c5-3 11-1 15 5l5 8-8-1-4 8c-2 5-2 11-1 18Z"/>'+
          '<circle class="figure-skin" cx="26" cy="20" r="7"/>'+
          '<path class="figure-cloth" d="M21 29c7-4 13-1 17 6l-8 12-10-7Z"/>'+
          '<path d="M19 17c3-7 12-8 15-1M24 21h1m4 0h1M34 38l8 9M41 47l6-2"/>';
    }else{
      art='<path class="figure-cloth" d="M15 66c1-18 7-27 17-27s16 9 17 27Z"/>'+
          '<circle class="figure-skin" cx="32" cy="29" r="10"/>'+
          '<path class="crown" d="M21 19l3-11 7 7 6-9 5 12Z"/>'+
          '<path d="M24 31c5 4 11 4 16 0M27 27h1m8 0h1M27 38l5 5 5-5M21 52h22"/>'+
          '<path class="beard" d="M24 34c2 11 14 14 17 0-5 5-12 6-17 0Z"/>';
    }
    return '<svg viewBox="0 0 64 78" aria-hidden="true">'+frame+art+emblem+'</svg>';
  }

  function cardNode(card,back=false){
    const el=document.createElement('div');
    el.className='card'+(back?' back':' '+suitColor[card.palo]);
    if(back){
      el.setAttribute('aria-label','Carta boca abajo');
      return el;
    }
    const n=cardNumber[card.numero]||String(card.numero);
    if(figureName[card.numero]){
      el.classList.add('figure','figure-'+card.numero);
      el.innerHTML='<span class="corner">'+n+'</span><span class="figure-art">'+figureSvg(card)+'</span><span class="figure-caption">'+figureName[card.numero]+' · '+card.palo+'</span><span class="corner bottom">'+n+'</span>';
    }else{
      el.innerHTML='<span class="corner">'+n+'</span><span class="suit" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+suitIcon[card.palo]+'</svg></span><span class="card-name">'+card.palo+'</span><span class="corner bottom">'+n+'</span>';
    }
    el.setAttribute('aria-label',(figureName[card.numero]||card.numero)+' de '+card.palo);
    return el;
  }

  function rankName(v){
    if(v===12)return 'rey';
    if(v===11)return 'caballo';
    if(v===10)return 'sota';
    if(v===1)return 'as';
    return String(v);
  }

  function renderHandStrength(){
    const box=$('fuerza-mano');
    if(!box||!state.hands.jugador1?.length)return;
    const hand=state.hands.jugador1;
    const ranks=hand.map(MusRules.rank);
    const kings=ranks.filter(v=>v===12).length;
    const ases=ranks.filter(v=>v===1).length;
    const pares=MusRules.pairs(hand);
    const total=MusRules.sum(hand);
    const grande=kings ? (kings===1?'1 rey':kings+' reyes') : 'máx. '+rankName(Math.max(...ranks));
    const chica=ases ? (ases===1?'1 as':ases+' ases') : 'mín. '+rankName(Math.min(...ranks));
    const paresTxt=pares.tier ? pares.name : 'sin pares';
    const juegoTxt=total>=31 ? 'juego '+total : 'punto '+total;
    const data=[['Grande',grande],['Chica',chica],['Pares',paresTxt],['Juego',juegoTxt]];
    box.replaceChildren();
    for(const [name,value] of data){
      const item=document.createElement('span');item.className='strength-chip';
      const strong=document.createElement('strong');strong.textContent=name;
      const small=document.createElement('small');small.textContent=value;
      item.append(strong,small);box.append(item);
    }
  }

  function playerCanSpeak(f){
    if(!['PARES','JUEGO'].includes(f))return true;
    return MusRules.qualifies(state.hands.jugador1,f);
  }

  function partnerCanSpeak(f){
    return ['PARES','JUEGO'].includes(f)&&MusRules.qualifies(state.hands.jugador3,f);
  }

  function rivalSpeaker(f){
    return MusRules.order(state.mano).find(id=>MusRules.sides[id]==='ellos'&&MusRules.qualifies(state.hands[id],f)) || 'jugador4';
  }

  function render(){
    $('pts-nosotros').textContent=state.scores.nosotros;
    $('pts-ellos').textContent=state.scores.ellos;
    $('mano-indicador').textContent='MANO '+state.handNumber+' · '+label[handId()].toUpperCase();
    $('fase-indicador').textContent=state.stage==='mus'?'MUS':state.stage==='finished'?'PARTIDA FINALIZADA':phaseName[phase()]?.toUpperCase()||'RESULTADOS';
    $('baraja-indicador').textContent='40 CARTAS · JUEGO A DERECHAS';

    const phaseTitle=phaseName[phase()]||'Lances';
    $('centro-titulo').textContent=state.stage==='mus'?'Mus':state.stage==='finished'?'Fin de partida':state.stage==='summary'?'Cartas vistas':phaseTitle;
    if(state.stage==='mus')$('centro-subtitulo').textContent='Mano: '+label[handId()]+' · a derechas';
    else if(state.stage==='summary')$('centro-subtitulo').textContent='Siguiente mano: '+label[MusRules.ids[(state.mano+1)%4]];
    else if(state.stage==='finished')$('centro-subtitulo').textContent='40 piedras';
    else $('centro-subtitulo').textContent=state.actor?'Habla: '+label[state.actor]:'Resolviendo lance';
    const feed=$('turn-feed');if(feed)feed.textContent=state.actionLog.length?state.actionLog.join('  →  '):'La acción aparecerá aquí';

    MusRules.ids.forEach(id=>{
      const player=$(id);
      const isHand=handId()===id;
      const isActive=state.actor===id&&!['summary','finished','ready'].includes(state.stage);
      const isCutter=state.cutter===id;
      const isLast=state.lastActor===id&&!!state.lastAction;
      player.classList.toggle('is-hand',isHand);
      player.classList.toggle('is-active',isActive);
      player.classList.toggle('is-cutter',isCutter);
      player.classList.toggle('is-last',isLast);

      const tags=[];
      if(isHand)tags.push('MANO');
      if(isCutter)tags.push('CORTA');
      if(isActive)tags.push('TURNO');
      if(isLast&&!tags.includes(state.lastAction))tags.push(state.lastAction);
      $('turno-j'+id.at(-1)).textContent=tags.length?'· '+tags.join(' · '):'';

      const box=$('cartas-j'+id.at(-1));box.replaceChildren();
      state.hands[id].forEach((c,i)=>{
        if(id==='jugador1'){
          const b=document.createElement('button');
          b.type='button';
          b.className='card '+suitColor[c.palo]+(state.selected.has(i)?' selected':'');
          b.disabled=state.stage!=='mus';
          b.setAttribute('aria-pressed',String(state.selected.has(i)));
          b.setAttribute('aria-label',(figureName[c.numero]||c.numero)+' de '+c.palo+(state.selected.has(i)?', seleccionada':''));
          const face=cardNode(c);
          b.innerHTML=face.innerHTML;
          if(figureName[c.numero])b.classList.add('figure','figure-'+c.numero);
          b.addEventListener('click',()=>{
            if(state.selected.has(i))state.selected.delete(i);else state.selected.add(i);
            $('cuenta-descartes').textContent='('+state.selected.size+')';
            render();
          });
          box.append(b);
        }else{
          box.append(cardNode(c,!state.revealed));
        }
      });
    });
    renderHandStrength();
  }

  function freshHand(){
    state.handNumber++;
    state.mano=(state.handNumber-1)%4;
    state.deck=MusRules.shuffle(MusRules.deck());
    state.discard=[];
    state.hands=Object.fromEntries(MusRules.ids.map(id=>[id,[]]));
    for(let i=0;i<4;i++)for(const id of MusRules.order(state.mano))state.hands[id].push(state.deck.pop());
    state.selected.clear();state.musTurns=0;state.stage='mus';state.phases=[];state.phaseIndex=0;state.bets={};state.pending=null;
    state.revealed=false;state.note='';state.result=[];state.cutter=null;state.lastActor=null;state.lastAction='';state.actionLog=[];setActor('jugador1');
    $('resumen').innerHTML='<p class="empty">Aquí aparecerán los resultados al descubrir las cartas.</p>';
    $('cuenta-descartes').textContent='(0)';
    panel('mus');
    status('Selecciona las cartas que quieras cambiar.','Puedes dar mus sin descartar cartas o cortar. La mano avanza a derechas.','TU TURNO');
    render();
  }

  function aiDiscard(hand){
    const keep=new Set();const counts=new Map();
    hand.forEach(c=>counts.set(MusRules.rank(c),(counts.get(MusRules.rank(c))||0)+1));
    hand.forEach((c,i)=>{
      const v=MusRules.rank(c);
      if(counts.get(v)>=2||v===12||v===1||MusRules.sum(hand)===31)keep.add(i);
    });
    return hand.map((_,i)=>i).filter(i=>!keep.has(i));
  }

  function draw(){
    if(!state.deck.length)state.deck=MusRules.shuffle(state.discard.splice(0));
    return state.deck.pop();
  }

  function giveMus(){
    if(state.stage!=='mus')return;
    const aiIds=MusRules.ids.filter(id=>id!=='jugador1');
    const cutter=MusRules.order(state.mano).filter(id=>id!=='jugador1').find(id=>{
      const h=state.hands[id];
      return MusRules.sum(h)===31||MusRules.pairs(h).tier>=2||aiDiscard(h).length===0;
    });
    if(cutter){
      state.cutter=cutter;setActor(cutter,'CORTA');
      startBetting(label[cutter]+' corta el mus.',cutter);return;
    }

    const selections={jugador1:[...state.selected],...Object.fromEntries(aiIds.map(id=>[id,aiDiscard(state.hands[id])]))};
    const removed=[];
    for(const id of MusRules.ids)for(const i of selections[id])removed.push(state.hands[id][i]);
    state.discard.push(...removed);
    for(const id of MusRules.order(state.mano))for(const i of selections[id])state.hands[id][i]=draw();
    state.selected.clear();state.musTurns++;$('cuenta-descartes').textContent='(0)';setActor('jugador1','MUS');
    status('Mus dado · vuelta '+state.musTurns+'.','Has cambiado '+selections.jugador1.length+' carta'+(selections.jugador1.length===1?'':'s')+'. Puedes volver a dar mus o cortar.','MUS');
    render();
  }

  function startBetting(note,cutter=null){
    state.selected.clear();state.note=note;if(cutter)state.cutter=cutter;
    state.phases=MusRules.phases(state.hands);state.phaseIndex=0;state.stage='betting';preparePhase();
  }

  function partnerWants(f){
    const h=state.hands.jugador3;
    if(f==='PARES'){
      const p=MusRules.pairs(h);return p.tier>=2||p.values[0]===12;
    }
    if(f==='JUEGO')return [31,32].includes(MusRules.sum(h));
    return false;
  }

  function partnerVeryStrong(f){
    const h=state.hands.jugador3;
    if(f==='PARES')return MusRules.pairs(h).tier===3;
    if(f==='JUEGO')return MusRules.sum(h)===31;
    return false;
  }

  function preparePhase(){
    while(state.phaseIndex<state.phases.length&&!MusRules.canBet(state.hands,phase())){
      state.bets[phase()]={status:'automatic',amount:0};state.phaseIndex++;
    }
    if(state.phaseIndex>=state.phases.length){
      state.stage='ready';state.actor=null;panel('resolver');
      status('Lances terminados.','Muestra las cartas para conocer el resultado de la mano.','A DESCUBRIR');render();return;
    }

    const f=phase();
    if(!playerCanSpeak(f)&&partnerCanSpeak(f)){
      state.stage='partner';panel('none');setActor('jugador3');
      const why=f==='PARES'?'Tú no llevas pares.':'Tú no llevas juego.';
      status(phaseName[f]+': habla tu compañero.',why+' Él decide este lance por la pareja.','COMPAÑERO');render();
      partnerLead(f);return;
    }

    state.stage='betting';panel('apuestas');setActor('jugador1');
    status(phaseName[f]+': ¿qué hacemos?',state.note||'Puedes pasar, envidar 2 piedras o lanzar un órdago.','TU TURNO');
    state.note='';render();
  }

  function advance(){state.phaseIndex++;preparePhase();}

  function aiWants(f){
    const theirs=['jugador2','jugador4'].map(id=>state.hands[id]).filter(h=>MusRules.qualifies(h,f));
    if(f==='GRANDE')return theirs.some(h=>h.filter(c=>MusRules.rank(c)===12).length>=2);
    if(f==='CHICA')return theirs.some(h=>h.filter(c=>MusRules.rank(c)===1).length>=2);
    if(f==='PARES')return theirs.some(h=>MusRules.pairs(h).tier>=2||MusRules.pairs(h).values[0]===12);
    if(f==='JUEGO')return theirs.some(h=>[31,32].includes(MusRules.sum(h)));
    return theirs.some(h=>MusRules.sum(h)>=28);
  }

  function aiVeryStrong(f){
    const theirs=['jugador2','jugador4'].map(id=>state.hands[id]).filter(h=>MusRules.qualifies(h,f));
    if(f==='GRANDE')return theirs.some(h=>h.filter(c=>MusRules.rank(c)===12).length>=3);
    if(f==='CHICA')return theirs.some(h=>h.filter(c=>MusRules.rank(c)===1).length>=3);
    if(f==='PARES')return theirs.some(h=>MusRules.pairs(h).tier===3);
    if(f==='JUEGO')return theirs.some(h=>MusRules.sum(h)===31);
    return theirs.some(h=>MusRules.sum(h)===30);
  }

  function award(side,points){state.scores[side]+=points;return state.scores[side]>=40;}

  function closeGame(side,message){
    state.stage='finished';state.revealed=true;state.actor=null;panel('fin');render();
    status((side==='nosotros'?'¡Habéis ganado!':'Ganan los rivales.')+' '+message,'Partida terminada · '+state.scores.nosotros+' a '+state.scores.ellos+' piedras.','FIN DE PARTIDA');
  }

  function refused(side,points=1,rejector=null){
    const f=phase();state.bets[f]={status:'refused',amount:0,side};
    if(rejector)setActor(rejector,'NO QUIERE');
    const finished=award(side,points);
    const who=rejector?label[rejector]:(side==='nosotros'?'Rivales':'Tu equipo');
    state.note=who+' no quiere. '+(side==='nosotros'?'Tu equipo':'Los rivales')+' cobra'+(points===1?'':'n')+' '+points+' '+(points===1?'piedra.':'piedras.');
    if(finished){
      state.revealed=true;$('resumen').replaceChildren();
      const item=document.createElement('div');item.className='result-row';
      item.textContent=phaseName[f]+' · apuesta no querida · +'+points+' para '+(side==='nosotros'?'tu equipo':'rivales');
      $('resumen').append(item);closeGame(side,'La apuesta rechazada dio la piedra decisiva.');return;
    }
    advance();
  }

  function offerFromRivals(amount,previous,ordago=false){
    const f=phase();const speaker=rivalSpeaker(f);
    state.pending={side:'ellos',amount,previous,ordago};
    setActor(speaker,ordago?'ÓRDAGO':'ENVIDA '+amount);

    if(!playerCanSpeak(f)&&partnerCanSpeak(f)){
      state.stage='partner-respond';panel('none');
      status(label[speaker]+' '+(ordago?'lanza órdago.':'envida '+amount+'.'),'Tú no puedes hablar en '+phaseName[f].toLowerCase()+'. Responde tu compañero.','COMPAÑERO');render();
      partnerRespond(amount,previous,ordago);return;
    }

    state.stage='respond';panel('respuesta');
    $('btn-envido-mas').textContent='Envido más · '+(amount+2);
    status(label[speaker]+' '+(ordago?'lanza órdago.':'envida '+amount+'.'),'Puedes querer, subir dos piedras, lanzar un órdago o no querer. Si rechazas, cobran '+(previous||1)+'.','RESPONDE');render();
  }

  function aiAnswer(amount,previous,ordago=false){
    const f=phase();const speaker=rivalSpeaker(f);
    if(!aiWants(f)||(amount>=4&&!aiVeryStrong(f))){
      setActor(speaker,'NO QUIERE');refused('nosotros',previous||1,speaker);return;
    }
    if(ordago){
      setActor(speaker,'QUIERO');state.bets[f]={status:'accepted',amount:40};showResults(true);return;
    }
    if(aiVeryStrong(f)&&amount<6){
      offerFromRivals(amount+2,amount,false);return;
    }
    setActor(speaker,'QUIERO');state.bets[f]={status:'accepted',amount};
    state.note=label[speaker]+': quiero. Apuesta aceptada de '+amount+' piedras.';advance();
  }

  function partnerLead(f){
    if(state.stage!=='partner'||phase()!==f)return;
    if(partnerWants(f)){
      setActor('jugador3','ENVIDA 2');state.note='Compañero: envido 2.';aiAnswer(2,0,false);
    }else{
      setActor('jugador3','PASA');
      if(aiWants(f))offerFromRivals(2,0,false);
      else{state.bets[f]={status:'passed',amount:0};state.note='Tu compañero pasa y los rivales también.';advance();}
    }
  }

  function partnerRespond(amount,previous,ordago=false){
    const f=phase();state.pending=null;
    if(!partnerWants(f)||(amount>=4&&!partnerVeryStrong(f))){
      setActor('jugador3','NO QUIERE');refused('ellos',previous||1,'jugador3');return;
    }
    if(ordago){
      setActor('jugador3','QUIERO');state.bets[f]={status:'accepted',amount:40};showResults(true);return;
    }
    if(partnerVeryStrong(f)&&amount<6){
      const raised=amount+2;setActor('jugador3','REENVIDA '+raised);aiAnswer(raised,amount,false);return;
    }
    setActor('jugador3','QUIERO');state.bets[f]={status:'accepted',amount};
    state.note='Compañero: quiero. Apuesta aceptada de '+amount+' piedras.';advance();
  }

  function playerPass(){
    if(state.stage!=='betting')return;
    const f=phase();setActor('jugador1','PASA');
    if(aiWants(f))offerFromRivals(2,0,false);
    else{state.bets[f]={status:'passed',amount:0};state.note='Tú pasas y los rivales también.';advance();}
  }

  function playerBet(ordago=false){
    if(state.stage!=='betting')return;
    const f=phase();
    if(!playerCanSpeak(f))return;
    setActor('jugador1',ordago?'ÓRDAGO':'ENVIDA 2');
    aiAnswer(ordago?40:2,0,ordago);
  }

  function respond(accept){
    if(state.stage!=='respond')return;
    const pending=state.pending;state.pending=null;
    if(!accept){setActor('jugador1','NO QUIERE');refused('ellos',pending.previous||1,'jugador1');return;}
    if(pending.ordago){setActor('jugador1','QUIERO');state.bets[phase()]={status:'accepted',amount:40};showResults(true);return;}
    setActor('jugador1','QUIERO');state.bets[phase()]={status:'accepted',amount:pending.amount};
    state.note='Tú: quiero. Apuesta aceptada de '+pending.amount+' piedras.';advance();
  }

  function respondRaise(ordago=false){
    if(state.stage!=='respond'||state.pending?.ordago)return;
    const previous=state.pending.amount;state.pending=null;state.stage='betting';
    setActor('jugador1',ordago?'ÓRDAGO':'REENVIDA '+(previous+2));
    aiAnswer(ordago?40:previous+2,previous,ordago);
  }

  function showResults(ordago=false){
    if(!ordago&&state.stage!=='ready')return;
    state.revealed=true;const phases=ordago?[phase()]:state.phases;
    const rows=[];let finalSide=null;
    for(const f of phases){
      const winner=MusRules.winner(state.hands,f,state.mano);if(!winner)continue;
      const bet=state.bets[f]||{status:'passed',amount:0};
      const side=bet.status==='refused'?bet.side:MusRules.sides[winner];
      let points=0,description='';
      if(bet.status==='refused'){
        points=['PARES','JUEGO','PUNTO'].includes(f)?MusRules.intrinsic(state.hands,f,side):0;
        description='Apuesta no querida · '+(side==='nosotros'?'tu equipo':'rivales');
        if(points&&award(side,points))finalSide=side;
      }else if(ordago){
        description='Órdago querido · '+label[winner]+' gana la partida';finalSide=side;
      }else{
        points=(['GRANDE','CHICA'].includes(f)&&bet.status==='accepted'?0:MusRules.intrinsic(state.hands,f,side))+(bet.amount||0);
        description=label[winner]+' · '+(f==='PARES'?MusRules.pairs(state.hands[winner]).name:f==='JUEGO'||f==='PUNTO'?MusRules.sum(state.hands[winner])+' puntos':phaseName[f]);
        if(award(side,points))finalSide=side;
      }
      rows.push({phase:f,description,points,side,refused:bet.status==='refused'});
      if(finalSide)break;
    }

    state.result=rows;state.actor=null;render();
    const box=$('resumen');box.replaceChildren();
    rows.forEach(row=>{
      const item=document.createElement('div');item.className='result-row';
      const name=document.createElement('strong');name.textContent=phaseName[row.phase];
      const detail=document.createElement('span');detail.className=row.refused?'muted':row.side==='nosotros'?'won':'lost';
      detail.textContent=row.description+(row.points?' · +'+row.points:'');item.append(name,detail);box.append(item);
    });
    if(ordago){state.scores[finalSide]=40;render();closeGame(finalSide,'Órdago querido.');return;}
    if(finalSide){closeGame(finalSide,'Se alcanzaron las 40 piedras.');return;}
    state.stage='summary';panel('siguiente');render();
    status('Mano resuelta.','Revisa las cartas y el resumen. La mano pasa al jugador de la derecha.','RESULTADOS');
  }

  function newGame(){state.scores={nosotros:0,ellos:0};state.handNumber=0;freshHand();}

  $('btn-mus').addEventListener('click',giveMus);
  $('btn-cortar').addEventListener('click',()=>{
    if(state.stage==='mus'){
      state.cutter='jugador1';setActor('jugador1','CORTA');startBetting('Tú cortas el mus.','jugador1');
    }
  });
  $('btn-paso').addEventListener('click',playerPass);
  $('btn-envido').addEventListener('click',()=>playerBet(false));
  $('btn-ordago').addEventListener('click',()=>playerBet(true));
  $('btn-quiero').addEventListener('click',()=>respond(true));
  $('btn-no-quiero').addEventListener('click',()=>respond(false));
  $('btn-envido-mas').addEventListener('click',()=>respondRaise(false));
  $('btn-ordago-respuesta').addEventListener('click',()=>respondRaise(true));
  $('btn-resolver').addEventListener('click',()=>showResults(false));
  $('btn-siguiente').addEventListener('click',()=>{if(state.stage==='summary')freshHand();});
  $('btn-nueva').addEventListener('click',newGame);
  $('btn-reiniciar').addEventListener('click',()=>{
    if(state.handNumber===1&&state.stage==='mus'&&state.scores.nosotros===0&&state.scores.ellos===0){newGame();return;}
    if(window.confirm('¿Empezar una partida nueva? Se perderá el marcador actual.'))newGame();
  });

  newGame();
}
