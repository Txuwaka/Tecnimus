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
    return ['GRANDE','CHICA','PARES',gamePresent?'JUEGO':'PUNTO'];
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

  // Recursos gráficos personalizados creados para TecniMus.
  const suitAsset={
    Oros:'assets/oros.png',
    Copas:'assets/copas.png',
    Espadas:'assets/espadas.png',
    Bastos:'assets/bastos.png'
  };
  const figureAsset={10:'assets/sota.png',11:'assets/caballo.png',12:'assets/rey.jpg'};
  const AI_DELAY=1100;
  const TIPS_KEY='tecnimus-consejos';
  let tipsEnabled=false;
  try{tipsEnabled=localStorage.getItem(TIPS_KEY)==='on';}catch(e){}
  function renderTips(){document.body.classList.toggle('tips-on',tipsEnabled);$('btn-consejos').textContent='Consejos '+(tipsEnabled?'ON':'OFF');$('btn-consejos').setAttribute('aria-pressed',String(tipsEnabled));}


  const SOUND_KEY='tecnimus-sonido';
  let soundEnabled=true,audioContext=null;
  try{soundEnabled=localStorage.getItem(SOUND_KEY)!=='off';}catch(e){}
  function renderSound(){ $('btn-sonido').textContent='Sonido '+(soundEnabled?'ON':'OFF');$('btn-sonido').setAttribute('aria-pressed',String(soundEnabled)); }
  function unlockAudio(){
    if(!soundEnabled)return;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio&&!audioContext)audioContext=new Audio();
      if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{});
    }catch(e){}
  }
  function playSound(kind){
    if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
    try{
      const at=audioContext.currentTime;
      if(kind==='cards'){
        const frames=Math.floor(audioContext.sampleRate*.12),buffer=audioContext.createBuffer(1,frames,audioContext.sampleRate),data=buffer.getChannelData(0);
        for(let i=0;i<frames;i++)data[i]=(Math.random()*2-1)*(1-i/frames);
        const src=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();
        src.buffer=buffer;filter.type='highpass';filter.frequency.value=1400;gain.gain.value=.065;
        src.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);src.start(at);return;
      }
      const notes=kind==='ordago'?[330,440,660]:kind==='bet'?[440,587]:kind==='accept'?[523,659]:kind==='win'?[523,659,784]:[kind==='cut'?185:290];
      notes.forEach((freq,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();
        osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,at+i*.1);
        gain.gain.exponentialRampToValueAtTime(.035,at+i*.1+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+i*.1+.16);
        osc.connect(gain);gain.connect(audioContext.destination);osc.start(at+i*.1);osc.stop(at+i*.1+.18);});
    }catch(e){}
  }
  const jokes={
    jugador1:{MUS:['A ver si mejora la cosa.','Estas venían torcidas.'],PASO:['Me hago el interesante.','Yo aquí, tranquilito.'],ENVIDO:['Dos. Sin despeinarme.','Esto tiene buena pinta.'],QUIERO:['Venga, que me lío.'],NO:['Hoy no me meto.'],ÓRDAGO:['¡Se acabó el aperitivo!']},
    jugador3:{MUS:['Una mano de pintura.','Socio, vamos afinando.'],PASO:['Estoy cocinando algo.','Que hablen los valientes.'],ENVIDO:['Socio, confía.','Traigo merienda.'],QUIERO:['¡Yo te cubro, socio!'],NO:['Mejor vivir otro día.'],ÓRDAGO:['¡Sujétame el café!']},
    jugador2:{MUS:['Baraja, pórtate.','Cambio de armario.'],PASO:['Estoy haciendo cuentas.','El silencio cotiza.'],ENVIDO:['Dos y una sonrisa.','Que no se enfríe esto.'],QUIERO:['He venido a jugar.'],NO:['Mi abogado dice que no.'],ÓRDAGO:['¡Hoy se cena fuerte!']},
    jugador4:{MUS:['Estas no eran mi talla.','Otra vuelta, camarero.'],PASO:['Yo sólo venía a mirar.','Pausa dramática.'],ENVIDO:['Venga, que es domingo.','Un poquito de picante.'],QUIERO:['¿Quién dijo miedo?'],NO:['Tengo una cita con la prudencia.'],ÓRDAGO:['¡Que tiemble el tapete!']}
  };
  const visualAnimations=new Set();
  function clearVisuals(){for(const a of visualAnimations)a.cancel();visualAnimations.clear();$('flight-layer').replaceChildren();$('discard-zone').hidden=true;}
  function reducedMotion(){return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
  function flyCard(id,index,outgoing){
    const source=$('cartas-j'+id.at(-1)).children[index],felt=$('tapete');
    if(!source?.getBoundingClientRect||!felt.getBoundingClientRect)return;
    const r=source.getBoundingClientRect(),table=felt.getBoundingClientRect();
    const ghost=cardNode(state.hands[id][index],true);ghost.classList.add('flying-card');
    ghost.style.width=r.width+'px';ghost.style.height=r.height+'px';
    const x=r.left-table.left,y=r.top-table.top,cx=table.width*.5-r.width/2,cy=table.height*.64-r.height/2;
    ghost.style.left=(outgoing?x:cx)+'px';ghost.style.top=(outgoing?y:cy)+'px';$('flight-layer').append(ghost);
    if(outgoing)source.style.visibility='hidden';
    if(!ghost.animate||reducedMotion()){ghost.remove();return;}
    const dx=outgoing?cx-x:x-cx,dy=outgoing?cy-y:y-cy;
    const animation=ghost.animate([{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) rotate('+(outgoing?12:-3)+'deg)',opacity:outgoing?.85:0}],{duration:480,delay:index*65,easing:'cubic-bezier(.22,.7,.35,1)',fill:'forwards'});
    visualAnimations.add(animation);animation.onfinish=()=>{visualAnimations.delete(animation);ghost.remove();};
  }
  function discardRound(selections){
    state.stage='discarding';state.calls={};state.discardCounts={};state.discardSelections=selections;panel('none');
    const turnOrder=order();let playerIndex=0;
    function nextDiscard(){
      if(playerIndex===4){
        // Las cartas salen de las cuatro manos antes de reponer; evita duplicados al reciclar la baraja.
        for(const id of turnOrder)for(const i of selections[id])state.discard.push(state.hands[id][i]);
        for(const id of turnOrder)for(const i of selections[id])state.hands[id][i]=draw();
        state.selected.clear();state.musTurns++;state.musCalls={};state.cursor=0;state.actor=null;state.stage='dealing';
        $('cuenta-descartes').textContent='(0)';render();
        for(const id of turnOrder)for(const i of selections[id])flyCard(id,i,false);
        playSound('cards');status('Cartas nuevas. ¡Otra vuelta!','La mano vuelve a hablar primero.','REPARTO');
        schedule(()=>{state.stage='mus';$('discard-zone').hidden=true;step();},1200);return;
      }
      const id=turnOrder[playerIndex++],count=selections[id].length;
      state.discardCounts[id]=count;setActor(id,'DESCARTO '+count);status(label[id]+': '+count+' al montón.','Descarte en orden desde la mano.','DESCARTES');render();
      $('discard-zone').hidden=false;$('discard-caption').textContent='AL MONTÓN · '+Object.values(state.discardCounts).reduce((a,b)=>a+b,0);
      for(const i of selections[id])flyCard(id,i,true);
      if(count)playSound('cards');schedule(nextDiscard,reducedMotion()?650:1000);
    }
    nextDiscard();
  }

  // Estados: mus -> declarations -> opening -> response -> ready -> summary/finished.
  // Un cursor recorre el orden desde la mano. Sólo response restringe el turno
  // a la pareja que contesta; cada miembro conserva su decisión independiente.
  const state={scores:{nosotros:0,ellos:0},handNumber:0,mano:0,hands:{},deck:[],discard:[],selected:new Set(),musTurns:0,
    stage:'mus',phases:[],phaseIndex:0,bets:{},pending:null,revealed:false,note:'',result:[],
    cutter:null,actor:null,lastActor:null,lastAction:'',calls:{},actionLog:[],flowToken:0,cursor:0,
    musCalls:{},discardCounts:{},banter:{},declarations:[],opening:[],response:[],passedSides:new Set(),offer:null};
  function announce(message){$('anuncio').textContent=message;}
  function status(title,detail,stage){$('mensaje').textContent=title;$('ayuda').textContent=detail;$('etapa').textContent=stage;announce(title+' '+detail);}
  function panel(id){for(const name of ['mus','apuestas','respuesta','resolver','siguiente','fin'])$('panel-'+name).hidden=name!==id;}
  function phase(){return state.phases[state.phaseIndex];}
  function handId(){return MusRules.order(state.mano)[0];}
  function side(id){return MusRules.sides[id];}
  function setActor(id,action=''){
    state.actor=id||null;
    if(id&&action){state.lastActor=id;state.lastAction=action;state.calls[id]=action;
      state.actionLog.push(label[id]+': '+action);if(state.actionLog.length>5)state.actionLog.shift();
      const key=action.startsWith('NO ')?'NO':action.startsWith('REENVIDO')?'ENVIDO':action.split(' ')[0];
      const lines=jokes[id]?.[key];state.banter[id]=lines?lines[(state.handNumber+state.actionLog.length)%lines.length]:'';
      playSound(key==='ÓRDAGO'?'ordago':key==='ENVIDO'?'bet':key==='QUIERO'?'accept':key==='CORTO'?'cut':'pass');}
  }
  function schedule(fn,delay=AI_DELAY){const token=state.flowToken;window.setTimeout(()=>{if(state.flowToken===token)fn();},delay);}
  function order(){return MusRules.order(state.mano);}
  function enabled(id,f){return MusRules.qualifies(state.hands[id],f);}
  function aiStrong(id,f){
    const h=state.hands[id],r=h.map(MusRules.rank);
    if(f==='GRANDE')return r.filter(v=>v===12).length>=2;
    if(f==='CHICA')return r.filter(v=>v===1).length>=2;
    if(f==='PARES')return MusRules.pairs(h).tier>=2||MusRules.pairs(h).values[0]===12;
    if(f==='JUEGO')return [31,32].includes(MusRules.sum(h));
    return MusRules.sum(h)>=28;
  }
  function imageTag(src,cls,alt=''){
    return '<img class="'+cls+'" src="'+src+'" alt="'+alt+'" draggable="false">';
  }

  // Posiciones propias de cada carta, en porcentaje del área interior.
  const pipPositions={
    1:[[50,50]],2:[[50,22],[50,78]],3:[[50,18],[50,50],[50,82]],
    4:[[22,18],[78,18],[22,82],[78,82]],
    5:[[22,18],[78,18],[50,50],[22,82],[78,82]],
    6:[[22,18],[78,18],[22,50],[78,50],[22,82],[78,82]],
    7:[[22,18],[78,18],[22,40],[78,40],[50,62],[22,82],[78,82]]
  };
  function pips(card){return pipPositions[card.numero].map(([x,y])=>'<span class="pip" style="left:'+x+'%;top:'+y+'%">'+imageTag(suitAsset[card.palo],'suit-image','')+'</span>').join('');}
  function cardNode(card,back=false){
    const el=document.createElement('div');
    el.className='card'+(back?' back':' '+suitColor[card.palo]+' number-'+card.numero);
    if(back){
      el.setAttribute('aria-label','Carta boca abajo');
      return el;
    }
    const n=cardNumber[card.numero]||String(card.numero);
    const suit=imageTag(suitAsset[card.palo],'suit-image','');
    if(figureName[card.numero]){
      el.classList.add('figure','figure-'+card.numero);
      const art=imageTag(figureAsset[card.numero],'figure-image','');
      el.innerHTML='<span class="corner">'+n+'</span><span class="figure-art">'+art+'</span><span class="figure-suit" aria-hidden="true">'+suit+'</span><span class="figure-caption">'+figureName[card.numero]+' · '+card.palo+'</span><span class="corner bottom">'+n+'</span>';
    }else{
      el.innerHTML='<span class="corner">'+n+'</span><span class="pip-field" aria-hidden="true">'+pips(card)+'</span><span class="card-name">'+card.palo+'</span><span class="corner bottom">'+n+'</span>';
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
    $('fase-indicador').textContent=['discarding','dealing'].includes(state.stage)?'DESCARTES':state.stage==='mus'?'MUS':state.stage==='finished'?'PARTIDA FINALIZADA':phaseName[phase()]?.toUpperCase()||'RESULTADOS';
    $('baraja-indicador').textContent='40 CARTAS · JUEGO A DERECHAS';

    const phaseTitle=phaseName[phase()]||'Lances';
    $('centro-titulo').textContent=['discarding','dealing'].includes(state.stage)?'Al montón':state.stage==='mus'?'Mus':state.stage==='finished'?'Fin de partida':state.stage==='summary'?'Cartas vistas':phaseTitle;
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
      const isLast=!!state.calls[id];
      player.classList.toggle('is-hand',isHand);
      player.classList.toggle('is-active',isActive);
      player.classList.toggle('is-cutter',isCutter);
      player.classList.toggle('is-last',isLast);
      player.dataset.call=state.calls[id]||'';
      $('broma-j'+id.at(-1)).textContent=state.banter[id]||'';
      const badge=$('descarte-j'+id.at(-1)),count=state.discardCounts[id];badge.hidden=count===undefined;badge.textContent=count===undefined?'':count+' descartada'+(count===1?'':'s');

      const tags=[];
      if(isHand)tags.push('MANO');
      if(isCutter)tags.push('CORTA');
      if(isActive)tags.push('TURNO');
      // La acción ya está en el bocadillo; el nombre conserva sólo mano y turno.
      $('turno-j'+id.at(-1)).textContent=tags.length?'· '+tags.join(' · '):'';

      const box=$('cartas-j'+id.at(-1));box.replaceChildren();
      state.hands[id].forEach((c,i)=>{
        if(id==='jugador1'){
          const b=document.createElement('button');
          b.type='button';
          b.className='card '+suitColor[c.palo]+' number-'+c.numero+(state.selected.has(i)?' selected':'');
          b.disabled=state.stage!=='mus'||state.actor!=='jugador1';
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
    if(state.stage==='discarding')for(const id of order())if(state.discardCounts[id]!==undefined)for(const i of state.discardSelections[id])$('cartas-j'+id.at(-1)).children[i].style.visibility='hidden';
    const musBtn=$('btn-mus');
    if(musBtn)musBtn.disabled=state.stage!=='mus'||state.actor!=='jugador1'||state.selected.size===0;
    renderHandStrength();
  }

  function freshHand(){
    state.flowToken++;clearVisuals();state.discardCounts={};state.banter={};state.handNumber++;state.mano=(state.handNumber-1)%4;
    state.deck=MusRules.shuffle(MusRules.deck());state.discard=[];
    state.hands=Object.fromEntries(MusRules.ids.map(id=>[id,[]]));
    for(let i=0;i<4;i++)for(const id of order())state.hands[id].push(state.deck.pop());
    state.selected.clear();state.musTurns=0;state.stage='mus';state.phases=[];state.phaseIndex=0;
    state.bets={};state.pending=null;state.offer=null;state.revealed=false;state.note='';state.result=[];
    state.cutter=null;state.lastActor=null;state.lastAction='';state.calls={};state.actionLog=[];
    state.cursor=0;state.musCalls={};$('resumen').innerHTML='<p class="empty">Aquí aparecerán los resultados al descubrir las cartas.</p>';
    $('cuenta-descartes').textContent='(0)';step();
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

  function step(){
    if(state.stage==='mus')return musStep();
    if(state.stage==='declarations')return declarationStep();
    if(state.stage==='opening')return openingStep();
    if(state.stage==='response')return responseStep();
  }
  function speak(id,action,detail){
    setActor(id,action);panel('none');status(label[id]+': '+action+'.',detail||'Sigue el turno a derechas.',phaseName[phase()]||'MUS');render();state.actor=null;
    schedule(step);
  }
  function musStep(){
    if(state.cursor===4){
      const selections={};for(const id of order())selections[id]=id==='jugador1'?[...state.selected]:aiDiscard(state.hands[id]);
      discardRound(selections);return;
    }
    const id=order()[state.cursor];setActor(id);render();
    if(id==='jugador1'){panel('mus');status('Te toca hablar de mus.','Selecciona al menos una carta para dar mus o corta.','TU TURNO');render();return;}
    panel('none');status('Habla '+label[id]+'.','La mesa sigue a derechas.','MUS');render();
    schedule(()=>{
      if(state.stage!=='mus')return;
      const h=state.hands[id];const cut=MusRules.sum(h)===31||MusRules.pairs(h).tier>=2||aiDiscard(h).length===0;
      musAction(id,cut);
    });
  }
  function musAction(id,cut){
    if(state.stage!=='mus'||state.actor!==id)return;
    if(cut){state.cutter=id;state.calls={};setActor(id,'CORTO MUS');state.stage='declarations';state.phases=MusRules.phases(state.hands);state.phaseIndex=0;
      state.declarations=order();state.cursor=0;panel('none');status(label[id]+' corta el mus.','Empiezan las declaraciones y los lances desde la mano.','CORTO MUS');render();schedule(preparePhase,1300);return;}
    state.musCalls[id]=true;state.cursor++;speak(id,'MUS','Habla el siguiente jugador.');
  }
  function giveMus(){if(state.stage==='mus'&&state.actor==='jugador1'){
    if(!state.selected.size){status('Selecciona al menos una carta.','Para dar mus debes descartar como mínimo una carta.','MUS');return;}
    musAction('jugador1',false);
  }}
  function preparePhase(){
    if(state.phaseIndex>=state.phases.length){state.stage='ready';state.actor=null;panel('resolver');status('Lances terminados.','Muestra las cartas para puntuar la mano.','A DESCUBRIR');render();return;}
    state.calls={};state.cursor=0;state.offer=null;state.pending=null;state.passedSides=new Set();
    const f=phase();
    if(f==='PARES'||f==='JUEGO'||f==='PUNTO'){state.stage='declarations';state.declarations=order();}
    else{state.stage='opening';state.opening=order();}
    step();
  }
  function declarationStep(){
    if(state.cursor>=state.declarations.length){
      if((phase()==='PARES'||phase()==='JUEGO')&&!MusRules.canBet(state.hands,phase())){state.bets[phase()]={status:'automatic',amount:0};state.phaseIndex++;schedule(preparePhase);return;}
      state.stage='opening';state.cursor=0;state.calls={};state.opening=order().filter(id=>enabled(id,phase()));schedule(step);return;
    }
    const id=state.declarations[state.cursor++];const yes=phase()==='PUNTO'?MusRules.qualifies(state.hands[id],'JUEGO'):enabled(id,phase());setActor(id);
    const call=phase()==='PARES'?(yes?'PARES':'NO PARES'):(yes?'JUEGO':'NO JUEGO');
    panel('none');speak(id,call,'Cada jugador declara individualmente.');
  }
  function openingStep(){
    if(state.cursor>=state.opening.length){state.bets[phase()]={status:'passed',amount:0};state.phaseIndex++;schedule(preparePhase);return;}
    const id=state.opening[state.cursor];setActor(id);render();
    if(id==='jugador1'){panel('apuestas');status(phaseName[phase()]+': hablas tú.','Puedes pasar, envidar 2 o lanzar órdago.','TU TURNO');render();return;}
    panel('none');status(phaseName[phase()]+': habla '+label[id]+'.','Esperando su decisión.','LANCE');render();
    schedule(()=>{
      if(state.stage!=='opening'||state.actor!==id)return;
      openingAction(id,aiStrong(id,phase())?'bet':'pass');
    });
  }
  function openingAction(id,action){
    if(state.stage!=='opening'||state.actor!==id)return;
    if(action==='pass'){state.passedSides.add(side(id));state.cursor++;speak(id,'PASO');return;}
    const ordago=action==='ordago';state.offer={side:side(id),amount:ordago?40:2,previous:0,ordago};
    beginResponse(id,ordago?'ÓRDAGO':'ENVIDO 2');
  }
  function beginResponse(id,call){
    state.stage='response';state.response=order().filter(x=>side(x)!==side(id)&&enabled(x,phase()));
    // Quien responde lo hace en orden de mano, sin que el primer rechazo ate a su pareja.
    state.cursor=0;state.pending={rejected:[],raisedBy:id};speak(id,call,'Responden los dos rivales habilitados, cada uno en su turno.');
  }
  function responseStep(){
    if(state.cursor>=state.response.length){
      const o=state.offer;state.bets[phase()]={status:'refused',amount:0,side:o.side};
      const points=o.previous||1;state.scores[o.side]+=points;
      if(state.scores[o.side]>=40){closeGame(o.side,'La apuesta rechazada dio la piedra decisiva.');return;}
      state.phaseIndex++;schedule(preparePhase);return;
    }
    const id=state.response[state.cursor];setActor(id);render();
    if(id==='jugador1'){panel('respuesta');$('btn-envido-mas').textContent='Reenvido · '+(state.offer.amount+2);
      $('btn-envido-mas').disabled=state.offer.ordago;$('btn-ordago-respuesta').disabled=state.offer.ordago;
      status(phaseName[phase()]+': responde tú.','Tu compañero puede decidir después si dices «No quiero».','RESPONDE');render();return;}
    panel('none');status('Responde '+label[id]+'.','La decisión de su pareja es independiente.','RESPUESTA');render();
    schedule(()=>{
      if(state.stage!=='response'||state.actor!==id)return;
      const strong=aiStrong(id,phase());const o=state.offer;
      responseAction(id,strong&&(o.amount<4||MusRules.compare(MusRules.strength(state.hands[id],phase()),[0])>0)?'accept':'decline');
    });
  }
  function responseAction(id,action){
    if(state.stage!=='response'||state.actor!==id)return;
    const o=state.offer;
    if(action==='decline'){state.pending.rejected.push(id);state.cursor++;speak(id,'NO QUIERO',state.cursor<state.response.length?'Su compañero aún puede querer.':'La pareja rechaza el envite.');return;}
    if(action==='raise'&&o.ordago)return;
    if(action==='raise'||action==='ordago'){
      const amount=action==='ordago'?40:o.amount+2;
      state.offer={side:side(id),amount,previous:o.amount,ordago:action==='ordago'};
      beginResponse(id,action==='ordago'?'ÓRDAGO':'REENVIDO '+amount);return;
    }
    state.stage='settling';speak(id,'QUIERO','Envite aceptado.');
    if(o.ordago){state.bets[phase()]={status:'accepted',amount:40};schedule(()=>showResults(true),AI_DELAY+100);return;}
    state.bets[phase()]={status:'accepted',amount:o.amount};state.stage='settling';
    schedule(()=>{state.phaseIndex++;preparePhase();},AI_DELAY+100);
  }
  function playerPass(){if(state.stage==='opening'&&state.actor==='jugador1')openingAction('jugador1','pass');}
  function playerBet(ordago=false){if(state.stage==='opening'&&state.actor==='jugador1')openingAction('jugador1',ordago?'ordago':'bet');}
  function respond(accept){if(state.stage==='response'&&state.actor==='jugador1')responseAction('jugador1',accept?'accept':'decline');}
  function respondRaise(ordago=false){if(state.stage==='response'&&state.actor==='jugador1')responseAction('jugador1',ordago?'ordago':'raise');}
  function closeGame(winner,message){playSound('win');state.stage='finished';state.revealed=true;state.actor=null;panel('fin');render();status((winner==='nosotros'?'¡Habéis ganado!':'Ganan los rivales.')+' '+message,'Partida terminada · '+state.scores.nosotros+' a '+state.scores.ellos+' piedras.','FIN DE PARTIDA');}
  function award(winner,points){state.scores[winner]+=points;return state.scores[winner]>=40;}

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

  document.addEventListener('pointerdown',unlockAudio);document.addEventListener('keydown',unlockAudio);
  $('btn-sonido').addEventListener('click',()=>{soundEnabled=!soundEnabled;try{localStorage.setItem(SOUND_KEY,soundEnabled?'on':'off');}catch(e){}renderSound();if(soundEnabled){unlockAudio();playSound('accept');}});
  renderSound();
  $('btn-consejos').addEventListener('click',()=>{tipsEnabled=!tipsEnabled;try{localStorage.setItem(TIPS_KEY,tipsEnabled?'on':'off');}catch(e){}renderTips();});
  renderTips();
  $('btn-mus').addEventListener('click',giveMus);
  $('btn-cortar').addEventListener('click',()=>{
    if(state.stage==='mus'&&state.actor==='jugador1'){
      musAction('jugador1',true);
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
