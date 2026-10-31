// Small procedural foley: no downloads, autoplay, microphone or external assets.
export function createAudio({Context=globalThis.AudioContext||globalThis.webkitAudioContext,storage}={}){
 if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
 let ctx,master,noise,muted=false,previous=null,stepTime=0;
 const counts={},active=new Set();
 try{muted=storage?.getItem('quiet-house-muted')==='true';}catch{}
 function stop(){for(const source of active){try{source.stop();}catch{}}active.clear();}
 function unlock(){
  if(!Context||muted)return;
  try{
   if(!ctx){
    ctx=new Context();master=ctx.createGain();master.gain.value=.24;master.connect(ctx.destination);
    noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.4),ctx.sampleRate);
    const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
   }
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  }catch{/* Sound is optional; blocked audio must never interrupt the game. */}
 }
 function voice(freq,duration,volume,type='sine',delay=0,end=freq){
  const now=ctx.currentTime+delay,gain=ctx.createGain();let source,filter;
  if(type==='noise'){
   source=ctx.createBufferSource();source.buffer=noise;filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=freq;source.connect(filter);filter.connect(gain);
  }else{source=ctx.createOscillator();source.type=type;source.frequency.setValueAtTime(freq,now);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+duration);source.connect(gain);}
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);gain.connect(master);
  active.add(source);source.onended=()=>{active.delete(source);source.disconnect();filter?.disconnect();gain.disconnect();};source.start(now);source.stop(now+duration+.015);
 }
 function play(cue){
  if(muted||!ctx||ctx.state!=='running')return false;
  try{
   switch(cue){
    case 'step':voice(380,.07,.18,'noise');voice(90,.07,.1,'sine');break;
    case 'stair':voice(220,.15,.16,'triangle',0,100);break;
    case 'search':voice(1700,.22,.15,'noise');voice(185,.12,.12,'triangle');break;
    case 'close':voice(140,.09,.12,'triangle',0,75);break;
    case 'spider':voice(2800,.25,.18,'noise');voice(510,.23,.16,'sawtooth',0,180);break;
    case 'talk':voice(230,.065,.12,'triangle');voice(310,.07,.1,'triangle',.09);break;
    case 'money':case 'purchase':voice(660,.13,.18,'sine');voice(990,.18,.16,'sine',.1);break;
    case 'pickup':voice(420,.12,.16,'triangle',0,650);break;
    case 'drop':voice(130,.13,.2,'noise');break;
    case 'hit':voice(500,.14,.25,'noise');voice(110,.12,.2,'triangle',0,45);break;
    case 'miss':voice(1600,.18,.18,'noise');break;
    case 'notice':voice(440,.2,.13,'triangle');voice(554,.25,.12,'triangle',.16);break;
    case 'faint':voice(180,.7,.2,'sine',0,35);break;
    case 'ending':voice(330,.6,.12,'sine');voice(440,.8,.1,'sine',.3);voice(660,1.2,.07,'sine',.6);break;
    case 'sleep':voice(330,.35,.12,'sine');voice(220,.5,.1,'sine',.22);break;
    case 'repair-step':voice(900,.09,.16,'noise');voice(180,.09,.12,'triangle');break;
    case 'repair-done':voice(440,.16,.15,'triangle');voice(660,.2,.13,'triangle',.12);voice(880,.25,.1,'sine',.26);break;
    case 'repair-error':voice(130,.16,.09,'triangle',0,90);break;
    case 'ui':voice(320,.045,.07,'triangle');break;
    default:return false;
   }
   counts[cue]=(counts[cue]||0)+1;return true;
  }catch{return false;}
 }
 function sync(s,dt=0){
  if(s.ending){if(previous){stop();previous=null;}return;}
  const next={inspection:s.inspection?.id||null,revealed:s.revealed.size,consumed:s.consumed.size,kills:s.kills,inventory:s.inventory.filter(Boolean).length,drops:s.drops.length,money:s.money,purchased:s.purchased.size,dialogue:s.dialogue?`${s.dialogue.id}:${s.dialogue.index}`:null,transition:s.transition?.kind||null,scene:s.scene,paused:s.paused,day:s.day};
  if(previous){
   const p=previous;
   if(s.paused||s.transition&&!p.transition)stop();
   if(!s.paused&&next.day===p.day){
    if(next.transition&&next.transition!==p.transition)play(next.transition==='faint'?'faint':next.transition==='ending'?'ending':'sleep');
    if(next.revealed>p.revealed)play('spider');
    if(next.inspection!==p.inspection)play(next.inspection?'search':'close');
    if(next.consumed>p.consumed)play(next.kills>p.kills?'hit':'miss');
    if(next.inventory>p.inventory)play('pickup');
    if(next.drops>p.drops)play('drop');
    if(next.purchased>p.purchased)play('purchase');else if(next.money>p.money)play('money');
    if(next.dialogue&&next.dialogue!==p.dialogue)play('talk');
    if(next.scene!==p.scene)play('close');
   }
  }
  previous=next;
  if(!s.paused&&!s.transition&&!s.dialogue&&!s.shop&&!s.inspection&&!s.recoil&&s.moving){
   stepTime-=dt;if(stepTime<=0){play(s.stairs?'stair':'step');stepTime=s.running?.2:.34;}
  }else stepTime=0;
 }
 return {unlock,play,sync,stop,toggle(){muted=!muted;if(muted)stop();if(master)master.gain.value=muted?0:.24;try{storage?.setItem('quiet-house-muted',String(muted));}catch{}if(!muted)unlock();return muted;},snapshot:()=>({muted,supported:!!Context,state:ctx?.state||'locked',counts:{...counts},active:active.size})};
}
