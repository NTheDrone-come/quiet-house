import { createState, update, interact, nearby, setPaused, climb, availableObjects, inspectionObject, closeInspection, takeItem, dropItem, selectSlot, useItem, advanceDialogue, takeMoney, closeShop } from './model.js';
import { ROOMS } from './world.js';
import { PEOPLE } from './story.js';
import { ITEM_TOTAL, houseCleared, finalReady } from './progression.js';
import { PROTECTION, buyProtection } from './economy.js';
import { ITEMS, SEARCH_OBJECTS } from './objects.js';
import { createRenderer } from './renderer.js';
import { drawInspection, drawItem } from './inspection-art.js';
import { createAudio } from './audio.js';
import { questNotice } from './notices.js';
import { protectionObjective,PROTECTION_SITES } from './protection.js';
import { createProtectionUI } from './protection-ui.js';
import { createCredits } from './credits.js';
const audio=createAudio();
const dismissedNotices=new Set();
let lastNotice=null;
const $=id=>document.getElementById(id);
const canvas=$('game'),state=createState(),renderer=createRenderer(canvas);
const keyboard=new Set(),touch=new Set();
const keyMap={ShiftLeft:'run',ShiftRight:'run',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down'};
let last=0,uiKey='',lastInspection=null,journalOpen=false,messageTimer;
const shell=document.querySelector('.game-shell');
const renderCredits=createCredits($('credits-overlay'),document.querySelector('.playfield'));
function resizeCanvas(){
 const rect=canvas.getBoundingClientRect(),scale=Math.min(1,1920/Math.max(1,rect.width));
 const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
}
new ResizeObserver(resizeCanvas).observe(canvas);
new ResizeObserver(entries=>{shell.style.setProperty('--hud-height',`${entries[0].target.getBoundingClientRect().height}px`);}).observe(document.querySelector('.game-hud'));
function showMessage(text){$('display-message').textContent=text;$('display-message').hidden=false;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('display-message').hidden=true,4500);}
function fullscreenChanged(){const active=!!document.fullscreenElement;$('fullscreen-button').setAttribute('aria-pressed',String(active));$('fullscreen-button').setAttribute('aria-label',active?'Выйти из полного экрана':'Полный экран');$('fullscreen-button').title=active?'Выйти из полного экрана (F)':'Полный экран (F)';clearInput();resizeCanvas();focusGame();}
async function fullscreen(){
 clearInput();
 try {if(document.fullscreenElement)await document.exitFullscreen();else if(shell.requestFullscreen)await shell.requestFullscreen();else showMessage('Этот браузер не поддерживает полный экран. Игра уже занимает всё доступное окно.');}
 catch {showMessage('Браузер не разрешил полный экран. Можно продолжать играть в окне.');}
 fullscreenChanged();
}
function nearbyPanel(value){$('nearby-panel').hidden=!value;$('nearby-button').setAttribute('aria-expanded',String(value));if(!value)focusGame();}
function journal(value){
 if(value&&(state.ending||state.transition||state.inspection||state.dialogue||state.shop||state.installation||state.paused))return;
 journalOpen=value;setPaused(state,value);clearInput();nearbyPanel(false);$('journal-overlay').hidden=!value;
 if(value)$('close-journal').focus();else focusGame();refreshUI();
}
const clearInput=()=>{keyboard.clear();touch.clear();document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));};
const focusGame=()=>(state.ending?$('credits-overlay'):canvas).focus({preventScroll:true});
function pause(value){if(state.transition||state.ending)return;if(journalOpen){journalOpen=false;$('journal-overlay').hidden=true;}nearbyPanel(false);setPaused(state,value);clearInput();$('pause-overlay').hidden=!value;$('pause-button').setAttribute('aria-label',value?'Продолжить':'Пауза');if(value)$('resume-button').focus();else if(state.inspection)$('close-inspection').focus();else if(state.shop)$('close-shop').focus();else if(state.installation)$('cancel-installation').focus();else focusGame();refreshUI();}
function inspect(id){nearbyPanel(false);interact(state,id);clearInput();refreshUI();if(state.shop)$('close-shop').focus();}
function close(){if(closeInspection(state)){clearInput();refreshUI();focusGame();}}
function action(fn){fn();refreshUI();focusGame();}
function button(text,fn,className=''){const b=document.createElement('button');b.textContent=text;b.type='button';b.className=className;b.addEventListener('click',fn);return b;}
const protectionUI=createProtectionUI(state,{refresh:()=>refreshUI(),clearInput,focusGame,audio,pause});
function refreshUI(){
 if(state.ending){renderCredits(state);$('transition-overlay').hidden=true;$('quest-notice').hidden=true;$('pause-overlay').hidden=true;return;}
 protectionUI.render();
 audio.sync(state);
 if(state.transition){dismissedNotices.clear();lastNotice=null;}
 const notice=questNotice(state),noticeBlocked=state.paused||state.transition||state.inspection||state.dialogue||state.shop||state.installation;
 const showNotice=notice&&!noticeBlocked&&!dismissedNotices.has(notice.id);
 $('quest-notice').hidden=!showNotice;
 if(showNotice){
  $('notice-title').textContent=notice.title;$('notice-text').textContent=notice.text;$('notice-icon').textContent=notice.icon;
  if(lastNotice!==notice.id){audio.play('notice');lastNotice=notice.id;}
 }
 const sound=audio.snapshot();$('sound-button').textContent=sound.muted?'♪ ×':'♪';$('sound-button').setAttribute('aria-pressed',String(sound.muted));$('sound-button').setAttribute('aria-label',sound.muted?'Включить звук':'Выключить звук');
 const room=ROOMS.find(r=>r.id===state.room),obj=nearby(state),inspection=inspectionObject(state),street=state.scene==='street';
 document.body.classList.toggle('daylight',state.day===3);
 $('resume-button').textContent=street?'Вернуться на улицу':'Вернуться в дом';
 document.querySelector('.night-time i').textContent=state.day===3?'☀':'☾';
 $('chapter-label').textContent=`День ${state.day} · ${state.day===3?'Утро':'Вечер'}`;
 $('journal-thought').textContent=state.thought;
 $('journal-button').classList.toggle('has-note',!!state.advice);
 $('day-footer').textContent=`День ${state.day} • ${state.day===3?'Найти ответы':'За каждой дверцей'}`;
 $('floor-label').textContent=street?'День':state.stairs?'Лестница':`${state.floor+1} этаж`;
 $('room-label').textContent=street?'Улица · Старый квартал':state.stairs?'Между этажами':room.name;
 document.querySelector('.scene-bottom>span').textContent=street?'Расспросить прохожих':'Только эта комната';
 $('explored').textContent=street?`Разговоры: ${state.talked.size} / ${PEOPLE.length}`:`Комнаты: ${state.visited.size} / 6`;
 $('panic-value').textContent=`${Math.floor(state.panic)}%`;
 $('panic-meter').setAttribute('aria-valuenow',String(Math.floor(state.panic)));
 $('panic-fill').style.width=`${state.panic}%`;
 document.querySelector('.panic-panel').classList.toggle('danger',state.panic>=65);
 $('panic-rate').textContent=state.panicRate<0?'Пауков рядом нет · −1%/с':state.panicRate===3?'Паук в комнате · +3%/с':'Паук в доме · +1%/с';
 $('journal').hidden=!state.advice;$('journal-text').textContent=state.advice;
 $('pause-button').disabled=!!state.transition;
 $('transition-overlay').hidden=!state.transition;$('transition-overlay').style.opacity=String(state.fade);
 if(state.transition){
  const faint=state.transition.kind==='faint',ending=state.transition.kind==='ending';
  $('transition-caption').textContent=ending?'Последняя ночь':faint?'Паника · 100%':`Конец дня ${state.transition.switched?state.day-1:state.day}`;
  $('transition-title').textContent=ending?'Наконец-то тихо':faint?'Ноги больше не держат':state.transition.switched&&state.day===3?'Откуда у нас столько пауков?':'До следующего утра';
  $('transition-description').textContent=ending?'Вы легли спать. Дом защищён, все пауки уничтожены. Больше нечего бояться.':faint?`Всё темнеет… Вы придёте в себя и начнёте день ${state.day} заново.`:'Все пауки уничтожены. Вы легли спать. Дом затихает до утра.';
 }
 $('dialogue-overlay').hidden=!state.dialogue;
 if(state.dialogue){
  const person=PEOPLE.find(p=>p.id===state.dialogue.id),[speaker,line]=person.lines[state.dialogue.index];
  $('dialogue-name').textContent=speaker==='Ты'?'Ты':person.name;
  $('dialogue-text').textContent=line;$('dialogue-page').textContent=`${state.dialogue.index+1} / ${person.lines.length}`;
  $('dialogue-next').textContent=state.dialogue.index===person.lines.length-1?'Закончить':'Дальше';
  if(!state.paused)$('dialogue-next').focus({preventScroll:true});
 }
 $('thought').textContent=state.thought;$('score').textContent=`${state.score} очков`;
 const alive=state.spiders.filter(p=>!p.dead).length;
 $('objective').textContent=finalReady(state)?'Дом защищён, все пауки уничтожены. Ляг спать у кровати в спальне, чтобы завершить историю.':state.day===3?(state.purchased.size===2?protectionObjective(state):state.advice?'Купи мелкую сетку (160 ₽) и герметик (120 ₽) в «Хозтоварах» на улице. Недостающие деньги можно поискать дома.':street?'Расспроси прохожих. Кто-то должен знать, откуда пауки.':'Откуда столько пауков? Выйди через дверь в прихожей и расспроси людей.'):`Пауки уничтожены: ${state.kills} / ${state.objects.filter(o=>o.spider).length}. ${houseCleared(state)?'Дом очищен. Поднимись в спальню и ляг спать у кровати. Можно сначала поискать деньги.':`${alive?`Обнаружено живых: ${alive}. `:''}Найди и убей всех пауков, затем ложись спать в спальне.`} Потрачено вещей: ${state.consumed.size} / ${ITEM_TOTAL}.`;
 $('wallet').textContent=`${state.money} ₽`;
 $('supplies').textContent=`Припасы: ${[...state.purchased].map(id=>`${PROTECTION[id].name} (${PROTECTION_SITES.filter(o=>o.kind===id&&state.installed.has(o.id)).length}/${PROTECTION_SITES.filter(o=>o.kind===id).length} установлено)`).join(', ')||'пока нет'}. Они не занимают руки.`;
 $('shop-overlay').hidden=!state.shop;
 if(state.shop){
  $('shop-wallet').textContent=`В кошельке: ${state.money} ₽`;
  $('shop-note').textContent=state.thought;
  $('shop-items').replaceChildren(...Object.entries(PROTECTION).map(([id,item])=>{
   const row=document.createElement('section');row.className='shop-item';
   const art=document.createElement('canvas');art.width=80;art.height=72;drawItem(art.getContext('2d'),item.kind,40,43,1.3);
   const details=document.createElement('div'),title=document.createElement('h3'),desc=document.createElement('p');title.textContent=item.name;desc.textContent=item.description;details.append(title,desc);
   const owned=state.purchased.has(id),b=button(owned?'Куплено':!state.advice?'Нужен совет соседа':state.money<item.price?`Нужно ${item.price} ₽`:`Купить · ${item.price} ₽`,()=>{buyProtection(state,id);refreshUI();},'primary-button');
   b.disabled=owned||!state.advice||state.money<item.price||state.paused;row.append(art,details,b);return row;
  }));
 }
 $('room-dots').replaceChildren(...ROOMS.map(r=>{const dot=document.createElement('span');dot.className='room-dot'+(state.visited.has(r.id)?' visited':'');dot.title=r.name;dot.setAttribute('aria-label',r.name+(state.visited.has(r.id)?': посещена':': не посещена'));return dot;}));
 $('interaction').hidden=!obj||state.paused||!!inspection;
 if(obj){$('interaction').replaceChildren();const k=document.createElement('kbd');k.textContent='E';$('interaction').append(k,document.createTextNode(obj.id.startsWith('install-')||obj.id==='stairs'||obj.id==='sleep'||street||obj.id==='exit'?obj.name:`Осмотреть: ${obj.name}`));}
 const blocked=state.paused||!!state.transition||!!state.dialogue||state.shop||!!state.installation||!!state.inspection||!!state.stairs||!!state.recoil;
 const objects=availableObjects(state).filter(o=>Math.abs(o.x-state.x)<=62);
 $('nearby-count').textContent=String(objects.length);$('nearby-button').disabled=blocked;
 $('journal-button').disabled=blocked||journalOpen;
 if(blocked&&!$('nearby-panel').hidden)nearbyPanel(false);
 $('nearby-objects').replaceChildren(...objects.map(o=>{const b=button(`${state.inspected.has(o.id)?'✓ ':''}${o.name}`,()=>inspect(o.id));b.disabled=blocked;return b;}));
 if(!objects.length)$('nearby-objects').textContent='Подойди ближе к вещи или прохожему.';
 $('inventory-count').textContent=`${state.inventory.filter(Boolean).length} / 2`;
 $('inventory').replaceChildren(...state.inventory.map((id,i)=>{
  const item=ITEMS[id],b=button('',()=>action(()=>selectSlot(state,i)),'inventory-slot');b.setAttribute('aria-pressed',String(state.selected===i));b.setAttribute('aria-label',`Слот ${i+1}: ${item?.name||'пусто'}`);b.title=item?.description||'Свободная рука';
  const art=document.createElement('canvas');art.width=48;art.height=42;if(item)drawItem(art.getContext('2d'),item.kind,24,27,.85);
  const label=document.createElement('span');label.textContent=`${i+1} · ${item?.name||'Пусто'}${id==='spray'?` (${state.charges.spray})`:''}`;b.append(art,label);b.disabled=state.paused;return b;
 }));
 $('drop-button').disabled=blocked||street||!state.inventory[state.selected];$('attack-button').disabled=blocked||street||!state.inventory[state.selected];
 const selected=state.inventory[state.selected];
 $('attack-button').dataset.shortLabel=selected==='spray'?'Распылить':'Применить';
 $('attack-button').textContent=selected==='spray'?'Распылить · 1 раз [Space]':'Применить · 1 раз [Space]';
 $('inspection-overlay').hidden=!inspection;
 if(inspection){
  $('inspection-title').textContent=inspection.name;$('inspection-description').textContent=inspection.text;
  $('inspection-contents').replaceChildren(...inspection.contents.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  $('close-inspection').disabled=state.inspection.spider;
  $('inspection-hint').textContent=state.inspection.spider?'Что-то шевелится…':state.inventory.every(Boolean)?'Обе руки заняты. Закрой осмотр и положи предмет (Q).':'E или Esc — закрыть';
  const item=ITEMS[inspection.item];$('loot').replaceChildren();
  if(item){if(state.consumed.has(inspection.item))$('loot').textContent='Предмет уже потрачен. Сегодня его больше нет.';
   else if(state.taken.has(inspection.id))$('loot').textContent='Предмет уже в инвентаре или оставлен на полу.';
   else {const b=button(`Взять: ${item.name}`,()=>{takeItem(state,inspection.item);refreshUI();},'primary-button');b.disabled=state.paused||state.inspection.spider||state.inventory.every(Boolean);$('loot').append(b);}}
  if(inspection.money){
   if(state.moneyTaken.has(inspection.id))$('loot').append(document.createTextNode(' Деньги уже забраны.'));
   else {const cash=button(`Забрать ${inspection.money} ₽`,()=>{takeMoney(state);refreshUI();},'primary-button');cash.disabled=state.paused||state.inspection.spider;$('loot').append(cash);}
  }
  if(inspection.id==='bed'){const ready=state.day===3?finalReady(state):houseCleared(state);const sleep=button(state.day===3?(ready?'Лечь спать — закончить историю':'Сначала защити и очисти дом'):ready?'Лечь спать — следующий день':'Нельзя уснуть: остались пауки',()=>{closeInspection(state);interact(state,'sleep');clearInput();refreshUI();},'primary-button');sleep.disabled=!ready||state.paused||state.inspection.spider;$('loot').append(sleep);}
  drawInspection($('inspection-art'),inspection,state);
  if(lastInspection!==inspection.id&&!state.paused)$('close-inspection').focus({preventScroll:true});
 }else if(lastInspection){clearInput();if(!state.paused)focusGame();}
 lastInspection=inspection?.id||null;
}
document.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});
document.addEventListener('keydown',()=>audio.unlock(),{capture:true});
document.addEventListener('click',event=>{if(event.target.closest('button')&&!state.paused)audio.play('ui');});
$('sound-button').addEventListener('click',()=>{audio.toggle();refreshUI();});
$('close-notice').addEventListener('click',()=>{const notice=questNotice(state);if(notice)dismissedNotices.add(notice.id);refreshUI();focusGame();});
$('shop-pause').addEventListener('click',()=>pause(true));
$('close-shop').addEventListener('click',()=>action(()=>closeShop(state)));
$('attack-button').dataset.shortLabel='Применить';
$('fullscreen-button').addEventListener('click',fullscreen);
document.addEventListener('fullscreenchange',fullscreenChanged);
$('journal-button').addEventListener('click',()=>journal(true));$('close-journal').addEventListener('click',()=>journal(false));
$('nearby-button').addEventListener('click',()=>{clearInput();nearbyPanel($('nearby-panel').hidden);});$('close-nearby').addEventListener('click',()=>nearbyPanel(false));
window.addEventListener('keydown',event=>{
 if(event.ctrlKey||event.metaKey||event.altKey)return;
 if(state.ending){if(event.code==='KeyF'&&!event.repeat){event.preventDefault();fullscreen();}else if(!['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.code))event.preventDefault();return;}
 if(protectionUI.key(event))return;
 if(event.code==='KeyF'){event.preventDefault();if(!event.repeat)fullscreen();return;}
 if(journalOpen){if(['Escape','KeyJ'].includes(event.code)){event.preventDefault();if(!event.repeat)journal(false);}return;}
 if(event.code==='KeyJ'){event.preventDefault();if(!event.repeat)journal(true);return;}
 if(event.code==='Escape'&&!$('nearby-panel').hidden){event.preventDefault();nearbyPanel(false);return;}
 if(state.transition){event.preventDefault();clearInput();return;}
 if(state.dialogue&&!state.paused){
  if(event.code==='Escape'){event.preventDefault();if(!event.repeat)pause(true);return;}
  if(['KeyE','Enter','Space'].includes(event.code)){event.preventDefault();if(!event.repeat){advanceDialogue(state);clearInput();refreshUI();if(!state.dialogue)focusGame();}}return;
 }
 if(event.code==='Escape'){event.preventDefault();if(!event.repeat){if(state.paused)pause(false);else if(state.shop){closeShop(state);clearInput();refreshUI();focusGame();}else if(state.inspection&&!state.inspection.spider)close();else pause(true);}return;}
 if(state.paused)return;
 if(state.shop){if(['Escape','KeyE'].includes(event.code)){event.preventDefault();if(!event.repeat){closeShop(state);clearInput();refreshUI();focusGame();}}return;}
 if(state.inspection){if(['KeyE','Enter'].includes(event.code)&&!(event.code==='Enter'&&event.target instanceof HTMLButtonElement)){event.preventDefault();if(!event.repeat)close();}return;}
 if(event.target instanceof HTMLButtonElement&&['Enter','Space'].includes(event.code))return;
 if(keyMap[event.code]){event.preventDefault();keyboard.add(event.code);if(!event.repeat&&['up','down'].includes(keyMap[event.code]))climb(state,keyMap[event.code]);}
 if(['KeyE','Enter','Space','Digit1','Digit2','KeyQ'].includes(event.code)){
  event.preventDefault();if(event.repeat)return;
  if(event.code==='Space')useItem(state);else if(event.code==='KeyQ')dropItem(state);else if(event.code==='Digit1'||event.code==='Digit2')selectSlot(state,Number(event.code.slice(-1))-1);else inspect();refreshUI();
 }
 // Trap focus inside the active dialog without trapping game movement keys.
});
window.addEventListener('keydown',event=>{if(event.code!=='Tab')return;const overlay=state.ending?$('credits-overlay'):journalOpen?$('journal-overlay'):state.paused?$('pause-overlay'):state.dialogue?$('dialogue-overlay'):state.shop?$('shop-overlay'):state.installation?$('installation-overlay'):state.inspection?$('inspection-overlay'):null;if(!overlay)return;const buttons=[...overlay.querySelectorAll('button:not(:disabled)')];if(!buttons.length){event.preventDefault();return;}const i=buttons.indexOf(document.activeElement);if(event.shiftKey&&i<=0){event.preventDefault();buttons.at(-1).focus();}else if(!event.shiftKey&&(i<0||i===buttons.length-1)){event.preventDefault();buttons[0].focus();}});
window.addEventListener('keyup',event=>keyboard.delete(event.code));
window.addEventListener('blur',()=>{if(!state.paused)pause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!state.paused)pause(true);});
canvas.addEventListener('pointerdown',focusGame);
$('pause-button').addEventListener('click',()=>pause(!state.paused));$('help-button').addEventListener('click',()=>pause(true));
$('resume-button').addEventListener('click',()=>pause(false));
$('dialogue-next').addEventListener('click',()=>{advanceDialogue(state);clearInput();refreshUI();if(!state.dialogue)focusGame();});
$('close-inspection').addEventListener('click',close);$('interaction').addEventListener('click',()=>inspect());$('touch-action').addEventListener('click',()=>inspect());
$('attack-button').addEventListener('click',()=>action(()=>useItem(state)));$('drop-button').addEventListener('click',()=>action(()=>dropItem(state)));
for(const b of document.querySelectorAll('[data-hold]')){
 const release=()=>{touch.delete(b.dataset.hold);b.classList.remove('held');};
 b.addEventListener('pointerdown',e=>{e.preventDefault();if(state.ending||state.paused||state.transition||state.dialogue||state.shop||state.installation||state.inspection)return;b.setPointerCapture(e.pointerId);touch.add(b.dataset.hold);if(['up','down'].includes(b.dataset.hold))climb(state,b.dataset.hold);b.classList.add('held');});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,release);
}
function frame(now){
 const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;const input={};for(const k of keyboard)input[keyMap[k]]=true;for(const dir of touch)input[dir]=true;
 update(state,input,dt);audio.sync(state,dt);renderer.draw(state,dt);
 if(state.ending){clearInput();refreshUI();requestAnimationFrame(frame);return;}
 if(state.transition){clearInput();$('pause-overlay').hidden=true;}
 const next=[state.installed.size,state.installation?.id,state.money,state.moneyTaken.size,state.purchased.size,state.shop,state.day,state.scene,Math.floor(state.panic*10),state.panicRate,state.transition?.kind,Math.round(state.fade*100),state.dialogue?.id,state.dialogue?.index,state.talked.size,state.consumed.size,state.advice,state.room,state.floor,!!state.stairs,state.visited.size,state.thought,nearby(state)?.id,state.paused,state.inspection?.id,state.inventory.join(),state.selected,state.kills,Math.round(state.x/5),!!state.recoil,state.drops.length].join('|');
 if(next!==uiKey){refreshUI();uiKey=next;}else if(state.inspection?.spider)drawInspection($('inspection-art'),inspectionObject(state),state);
 requestAnimationFrame(frame);
}
refreshUI();requestAnimationFrame(frame);
Object.defineProperty(window,'quietHouse',{value:Object.freeze({snapshot:()=>({ending:state.ending?{...state.ending}:null,installed:[...state.installed],installation:state.installation?{...state.installation}:null,audio:audio.snapshot(),notice:questNotice(state),objects:state.objects.map(o=>({...o,contents:[...o.contents]})),money:state.money,moneyTaken:[...state.moneyTaken],purchased:[...state.purchased],shop:state.shop,running:state.running,day:state.day,scene:state.scene,panic:state.panic,panicRate:state.panicRate,fade:state.fade,transition:state.transition?{...state.transition}:null,consumed:[...state.consumed],quest:state.quest,advice:state.advice,talked:[...state.talked],dialogue:state.dialogue?{...state.dialogue}:null,pedestrians:state.pedestrians.map(p=>({id:p.id,x:p.x})),x:state.x,y:state.y,floor:state.floor,room:state.room,moving:state.moving,stairs:!!state.stairs,paused:state.paused,visited:[...state.visited],inspected:[...state.inspected],inspection:state.inspection?{...state.inspection}:null,inventory:[...state.inventory],selected:state.selected,spiders:state.spiders.map(p=>({...p})),recoil:!!state.recoil,score:state.score,kills:state.kills,roomLight:{...state.roomLight},drops:state.drops.map(d=>({...d}))})})});
