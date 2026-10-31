import {PROTECTION_SITES,SEAL_PATH,moveMesh,confirmMesh,fastenMesh,sealPoint,cancelInstallation} from './protection.js';
export function createProtectionUI(s,{refresh,clearInput,focusGame,audio,pause}){
 const overlay=document.getElementById('installation-overlay');let current=null,dragging=false;
 const sheet=document.createElement('div');sheet.className='installation-sheet';
 sheet.innerHTML='<header><div><span class="sheet-caption">Защита дома · работа руками</span><h2 id="installation-title"></h2></div><button type="button" class="icon-button" id="installation-pause" aria-label="Пауза установки">Ⅱ</button><button type="button" class="icon-button" id="cancel-installation" aria-label="Отложить установку">×</button></header><p id="installation-instructions"></p><div id="installation-board" class="installation-board"></div><div id="installation-controls"></div><p id="installation-status" role="status"></p><p class="installation-footnote">Без таймера. Esc — отложить, материал не теряется. Ходьба и паника остановлены.</p>';
 overlay.append(sheet);
 const $=id=>document.getElementById(id),board=$('installation-board'),controls=$('installation-controls');
 function act(fn){const before=s.installed.size,progress=s.installation?.progress;const ok=fn();audio.play(!ok?'repair-error':s.installed.size>before?'repair-done':s.installation?.progress!==progress?'repair-step':'ui');clearInput();refresh();if(!s.installation)focusGame();}
 function addButton(parent,label,fn,className='tool-button'){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=className;b.addEventListener('click',()=>act(fn));parent.append(b);return b;}
 $('cancel-installation').onclick=()=>act(()=>cancelInstallation(s));$('installation-pause').onclick=()=>pause(true);
 document.addEventListener('pointerup',()=>dragging=false);document.addEventListener('pointercancel',()=>dragging=false);
 function render(){
  const g=s.installation;overlay.hidden=!g;if(!g){current=null;return;}
  const fresh=current!==g.id;current=g.id;
  if(fresh){
   const site=PROTECTION_SITES.find(o=>o.id===g.id);$('installation-title').textContent=site.name;
   board.className='installation-board '+g.kind;board.replaceChildren();controls.replaceChildren();controls.hidden=g.kind==='sealant';board.onpointermove=null;
   if(g.kind==='mesh'){
    $('installation-instructions').textContent='Подвинь сетку стрелками до точного совпадения с рамой. Подтверди и закрепи углы 1–4.';
    const frame=document.createElement('div');frame.className='mesh-frame';const mesh=document.createElement('div');mesh.className='loose-mesh';board.append(frame,mesh);
    for(const [i,[x,y]] of [[14,15],[86,15],[86,85],[14,85]].entries()){
     const b=addButton(board,String(i+1),()=>fastenMesh(s,i),'repair-target fastener');b.style.left=x+'%';b.style.top=y+'%';b.setAttribute('aria-label',`Закрепить угол ${i+1}`);
    }
    const arrows=document.createElement('div');arrows.className='mesh-arrows';controls.append(arrows);
    for(const [label,x,y] of [['←',-1,0],['↑',0,-1],['↓',0,1],['→',1,0]])addButton(arrows,label,()=>moveMesh(s,x,y));
    addButton(controls,'Совместить сетку',()=>confirmMesh(s),'primary-button');
   }else{
    $('installation-instructions').textContent='Заполни щель без разрывов: нажимай точки по порядку или веди пальцем/мышью по шву. Enter или пробел — следующая точка.';
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.innerHTML=`<polyline points="${SEAL_PATH.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#11191f" stroke-width="5"/><polyline id="sealed-line" fill="none" stroke="#ddc99d" stroke-width="3"/>`;board.append(svg);
    for(const [i,[x,y]] of SEAL_PATH.entries()){
     const b=addButton(board,String(i+1),()=>s.installation&&i<s.installation.progress?true:sealPoint(s,i),'repair-target seam-point');b.style.left=x+'%';b.style.top=y+'%';b.setAttribute('aria-label',`Заделать участок ${i+1}`);
     b.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;act(()=>sealPoint(s,i));});
    }
    board.onpointermove=e=>{if(!dragging||s.installation?.kind!=='sealant')return;const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.seam-point');if(hit&&Number(hit.textContent)-1===s.installation.progress)act(()=>sealPoint(s,s.installation.progress));};
   }
  }
  if(g.kind==='mesh'){
   board.querySelector('.loose-mesh').style.transform=`translate(${g.offsetX*4}px,${g.offsetY*4}px)`;
   board.classList.toggle('aligned',g.aligned);
   [...board.querySelectorAll('.fastener')].forEach((b,i)=>{b.disabled=!g.aligned||i<g.progress;b.classList.toggle('done',i<g.progress);b.classList.toggle('next',g.aligned&&i===g.progress);});
   controls.hidden=g.aligned;
  }else{
   [...board.querySelectorAll('.seam-point')].forEach((b,i)=>{b.disabled=i<g.progress;b.classList.toggle('done',i<g.progress);b.classList.toggle('next',i===g.progress);});
   $('sealed-line').setAttribute('points',SEAL_PATH.slice(0,g.progress).map(p=>p.join(',')).join(' '));
  }
  $('installation-status').textContent=`${g.kind==='mesh'?(g.aligned?'Крепления: '+g.progress+' / 4':`Сдвиг: ${g.offsetX}, ${g.offsetY}`):'Шов: '+g.progress+' / '+SEAL_PATH.length}. ${g.message}`;
  if(fresh)$('cancel-installation').focus({preventScroll:true});
 }
 function key(event){
  if(!s.installation||s.paused)return false;
  if(event.code==='Tab')return false;
  const keys=['Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Enter','Space'];if(!keys.includes(event.code))return true;
  event.preventDefault();if(event.repeat)return true;
  if(event.code==='Escape'){act(()=>cancelInstallation(s));return true;}
  const g=s.installation,dir={ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0],ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1]}[event.code];
  if(dir&&g.kind==='mesh'&&!g.aligned)act(()=>moveMesh(s,...dir));
  else if(['Enter','Space'].includes(event.code))act(()=>g.kind==='sealant'?sealPoint(s,g.progress):g.aligned?fastenMesh(s,g.progress):confirmMesh(s));return true;
 }
 return {render,key};
}
