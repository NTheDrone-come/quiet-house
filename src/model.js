import { WORLD, STAIR, ROOMS, roomAt } from './world.js';
import { ITEMS, createSearchObjects } from './objects.js';
import { campaignState, locked, consume, updateCampaign, houseCleared, finalReady, startTransition } from './progression.js';
import { STREET, streetObjects, interactStreet, updateStreet } from './story.js';
export { advanceDialogue } from './story.js';
import { installationObjects, startInstallation } from './protection.js';
export function createState(random=Math.random,day=1) {
 return {...campaignState(),day,quest:day===3?'ask-neighbors':'survive',objects:createSearchObjects(random,day),x:405,y:WORLD.floors[0],floor:0,facing:1,walk:0,moving:false,running:false,stairs:null,stairLatch:false,paused:false,room:'hall',thought:roomAt(405,0).thought,thoughtTime:0,visited:new Set(['hall']),inspected:new Set(),time:0,inspection:null,inventory:[null,null],selected:0,taken:new Set(),revealed:new Set(),spiders:[],drops:[],dropSerial:0,recoil:null,attackTime:0,charges:{spray:1},kills:0,score:0,roomLight:Object.fromEntries(ROOMS.map(r=>[r.id,r.id==='hall'?1:.5]))};
}
export function resetState(s,random=Math.random,day=1){Object.assign(s,createState(random,day));}
export function setPaused(s,value){if(s.transition||s.ending)return;s.paused=value;s.moving=false;s.running=false;}
export function availableObjects(s){
 if(s.scene==='street')return streetObjects(s);
 const objects=[...s.objects,...s.drops].filter(o=>o.floor===s.floor&&roomAt(o.x,o.floor).id===s.room);
 if(s.room==='bedroom')objects.push({id:'sleep',x:218,floor:1,name:s.day===3?(finalReady(s)?'Лечь спать — закончить историю':'Лечь спать — сначала защитить и очистить дом'):houseCleared(s)?'Лечь спать — следующий день':'Лечь спать — сначала уничтожить пауков'});
 if(s.day===3&&s.room==='hall')objects.push({id:'exit',x:387,floor:0,name:'Выйти на улицу — спросить соседей'});
 return [...objects,...installationObjects(s)];
}
export function nearby(s){
 if(s.stairs||s.inspection||s.recoil||locked(s))return null;
 if(s.scene==='street')return availableObjects(s).filter(o=>Math.abs(o.x-s.x)<=62).sort((a,b)=>Math.abs(a.x-s.x)-Math.abs(b.x-s.x))[0]??null;
 if(s.day===3&&s.room==='hall'&&Math.abs(s.x-387)<30)return availableObjects(s).find(o=>o.id==='exit');
 if(s.room==='bedroom'&&(s.day<3?houseCleared(s):finalReady(s))&&Math.abs(s.x-218)<30)return availableObjects(s).find(o=>o.id==='sleep');
 const anchor=s.floor===0?STAIR.bottomX:STAIR.topX;
 if(Math.abs(s.x-anchor)<=STAIR.range)return {id:'stairs',name:s.floor===0?'Подняться на 2 этаж':'Спуститься на 1 этаж'};
 return availableObjects(s).filter(o=>Math.abs(o.x-s.x)<30).sort((a,b)=>Math.abs(a.x-s.x)-Math.abs(b.x-s.x))[0]??null;
}
function beginStairs(s){
 const up=s.floor===0,anchor=up?STAIR.bottomX:STAIR.topX;
 if(s.stairs||s.inspection||s.recoil||Math.abs(s.x-anchor)>STAIR.range)return false;
 s.stairs={fromX:s.x,fromY:s.y,toX:up?STAIR.topX:STAIR.bottomX,toY:up?STAIR.topY:STAIR.bottomY,target:up?1:0,progress:0};s.facing=up?1:-1;return true;
}
export function climb(s,direction){if(s.paused||locked(s)||s.scene!=='house'||s.stairs||(direction==='up'&&s.floor!==0)||(direction==='down'&&s.floor!==1))return false;return beginStairs(s);}
export function interact(s,id){
 if(s.paused||locked(s)||s.stairs||s.inspection||s.recoil)return false;
 if(s.scene==='street')return interactStreet(s,id||nearby(s)?.id);
 const obj=id?availableObjects(s).find(o=>o.id===id&&Math.abs(o.x-s.x)<=62):nearby(s);
 if(!obj)return false;if(obj.id==='stairs')return beginStairs(s);
 if(obj.id.startsWith('install-'))return startInstallation(s,obj.id);
 if(obj.id==='sleep'){
  if(s.day===3&&!finalReady(s)){s.thought='Сначала нужно установить все сетки, заделать обе щели и уничтожить всех пауков. Тогда смогу спокойно уснуть.';return false;}
  if(!houseCleared(s)){s.thought='Не могу уснуть: в доме ещё остались пауки. Нужно найти и уничтожить всех.';return false;}
  startTransition(s,s.day===3?'ending':'day');return true;
 }
 if(obj.id==='exit'){s.scene='street';s.room='street';s.x=STREET.door;s.y=STREET.floor;s.floor=0;s.thought='Днём улица кажется обычной. Может, кто-нибудь знает, что происходит?';return true;}
 s.inspected.add(obj.id);s.thought=obj.text;s.thoughtTime=6;s.moving=false;s.running=false;
 s.inspection={id:obj.id,elapsed:0,spider:obj.spider&&!s.revealed.has(obj.id)};return true;
}
export function inspectionObject(s){return [...s.objects,...s.drops].find(o=>o.id===s.inspection?.id);}
export function closeInspection(s){if(s.inspection?.spider)return false;s.inspection=null;return true;}
export function selectSlot(s,index){if(!s.paused&&!locked(s)&&index>=0&&index<2)s.selected=index;}
export function takeItem(s,id){
 const o=inspectionObject(s);if(s.paused||locked(s)||!o||s.inspection.spider||o.item!==id||s.taken.has(o.id)||s.consumed.has(id))return false;
 const slot=s.inventory.indexOf(null);if(slot<0){s.thought='Обе руки заняты. Закрой осмотр и положи один предмет на пол (Q).';return false;}
 s.inventory[slot]=id;s.selected=slot;s.taken.add(o.id);s.thought=`Взято: ${ITEMS[id].name}.`;
 if(o.id.startsWith('drop-')){s.drops=s.drops.filter(d=>d.id!==o.id);s.inspection=null;}
 return true;
}
export function takeMoney(s){
 const o=inspectionObject(s);
 if(s.paused||locked(s)||!o?.money||s.inspection.spider||s.moneyTaken.has(o.id))return false;
 s.money+=o.money;s.moneyTaken.add(o.id);s.thought=`Найдено ${o.money} ₽. В кошельке ${s.money} ₽.`;return true;
}
export function closeShop(s){if(s.paused||s.transition||!s.shop)return false;s.shop=false;return true;}
export function dropItem(s,index=s.selected){
 if(s.paused||locked(s)||s.scene!=='house'||s.inspection||s.stairs||s.recoil||!s.inventory[index])return false;
 const item=s.inventory[index];s.inventory[index]=null;
 s.drops.push({id:`drop-${++s.dropSerial}`,x:s.x,floor:s.floor,name:ITEMS[item].name,kind:ITEMS[item].kind,contents:['Оставленный предмет','Пыль на полу','Тень'],text:'Предмет, который ты оставил здесь.',item});s.thought=`На полу: ${ITEMS[item].name}. Можно подобрать снова.`;return true;
}
export function attack(s){
 const item=ITEMS[s.inventory[s.selected]];
 if(!item?.weapon){if(!locked(s))s.thought='Нужно найти предмет против пауков. Все десять находок одноразовые.';return false;}
 return useItem(s);
}
export function useItem(s){
 if(s.paused||locked(s)||s.scene!=='house'||s.inspection||s.stairs||s.recoil||s.attackTime>0)return false;
 const id=s.inventory[s.selected],item=ITEMS[id];if(!item||s.consumed.has(id))return false;
 const targets=s.spiders.filter(p=>!p.dead&&p.floor===s.floor&&p.room===s.room&&Math.abs(p.x-s.x)<=item.range);
 s.attackTime=.3;
 if(targets.length){const p=targets.sort((a,b)=>Math.abs(a.x-s.x)-Math.abs(b.x-s.x))[0];p.dead=true;s.facing=p.x>=s.x?1:-1;s.kills++;s.score+=100;s.thought='Минус один. Предмет больше не годится. +100';}
 else s.thought=`Промах. ${item.name} потрачен. Следующий раз нужно подойти ближе.`;
 consume(s,id);return targets.length>0;
}
function enterRoom(s){const r=roomAt(s.x,s.floor);if(r.id!==s.room){s.room=r.id;s.visited.add(r.id);if(!s.thoughtTime)s.thought=r.thought;}}
export function update(s,input,dt){
 dt=Math.min(Math.max(dt,0),.05);
 if(s.ending){s.ending.elapsed+=dt;s.moving=false;s.running=false;return;}
 if(s.transition){updateCampaign(s,dt,resetState);return;}
 if(s.paused||s.installation){s.moving=false;s.running=false;return;}
 if(updateCampaign(s,dt,resetState))return;
 if(s.scene==='street'){s.time+=dt;updateStreet(s,input,dt);return;}
 s.time+=dt;s.moving=false;s.running=false;s.thoughtTime=Math.max(0,s.thoughtTime-dt);s.attackTime=Math.max(0,s.attackTime-dt);
 if(s.inspection){
  s.inspection.elapsed+=dt;
  if(s.inspection.spider&&s.inspection.elapsed>=.5-1e-9){
   const o=inspectionObject(s),r=roomAt(s.x,s.floor);s.revealed.add(o.id);
   s.spiders.push({id:o.id,x:o.x,floor:o.floor,room:r.id,origin:o.x,dead:false,phase:0});
   const dir=s.x<o.x?-1:s.x>o.x?1:-s.facing;
   s.recoil={elapsed:0,from:s.x,to:Math.max(r.left+10,Math.min(r.right-10,s.x+dir*33))};s.inspection=null;s.thought='ПАУК! Назад! Нужно найти, чем его убить.';s.thoughtTime=8;
  }
 }else if(s.recoil){const a=s.recoil;a.elapsed+=dt;const t=Math.min(1,a.elapsed/.4);s.x=a.from+(a.to-a.from)*(1-(1-t)**2);s.y=WORLD.floors[s.floor]-Math.sin(t*Math.PI)*12;if(t>=1){s.recoil=null;s.y=WORLD.floors[s.floor];}}
 else if(s.stairs){
  const a=s.stairs;a.progress=Math.min(1,a.progress+dt/STAIR.duration);s.x=a.fromX+(a.toX-a.fromX)*a.progress;s.y=a.fromY+(a.toY-a.fromY)*a.progress;s.moving=true;s.walk+=dt*9;
  if(a.progress>=1){s.floor=a.target;s.stairs=null;enterRoom(s);}
 }else{
  const dir=Number(!!input.right)-Number(!!input.left);if(dir){const prev=s.x;s.x=Math.max(WORLD.left,Math.min(WORLD.right,s.x+dir*WORLD.speed*(input.run?2:1)*dt));s.facing=dir;s.moving=s.x!==prev;s.running=s.moving&&!!input.run;if(s.moving)s.walk+=dt*(s.running?15:9);}
  if(!input.up&&!input.down)s.stairLatch=false;
  if(!s.stairLatch&&((input.up&&s.floor===0)||(input.down&&s.floor===1))&&beginStairs(s))s.stairLatch=true;
  if(!s.stairs)enterRoom(s);
 }
 for(const r of ROOMS){const target=r.id===s.room?1:.5;s.roomLight[r.id]+=(target-s.roomLight[r.id])*(1-Math.exp(-dt*6));}
 if(!s.inspection)for(const p of s.spiders){if(p.dead)continue;p.phase+=dt;const r=ROOMS.find(r=>r.id===p.room);p.x=Math.max(r.left+12,Math.min(r.right-12,p.origin+Math.sin(p.phase*1.7)*19));}
}
