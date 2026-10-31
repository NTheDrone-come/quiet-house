import { ITEMS } from './objects.js';
import { createPedestrians } from './story.js';
import { protectionComplete } from './protection.js';
export const ITEM_TOTAL=Object.keys(ITEMS).length;
export function campaignState(){return {day:1,dayStartScore:0,money:0,dayStartMoney:0,moneyTaken:new Set(),purchased:new Set(),installed:new Set(),installation:null,ending:null,shop:false,scene:'house',panic:0,panicRate:-1,transition:null,fade:0,consumed:new Set(),quest:'survive',advice:'',talked:new Set(),dialogue:null,pedestrians:createPedestrians()};}
export const locked=s=>!!(s.ending||s.transition||s.dialogue||s.shop||s.installation);
export const finalReady=s=>s.day===3&&protectionComplete(s)&&houseCleared(s);
export function houseCleared(s){
 const hiding=s.objects.filter(o=>o.spider);
 return hiding.length>0&&hiding.every(o=>s.spiders.some(p=>p.id===o.id&&p.dead))&&!s.spiders.some(p=>!p.dead);
}
export function startTransition(s,kind){
 if(s.transition||s.ending)return;
 s.transition={kind,elapsed:0,switched:false};s.paused=false;s.inspection=null;s.recoil=null;s.stairs=null;s.dialogue=null;s.shop=false;s.moving=false;s.running=false;
 s.thought=kind==='ending'?'Дом защищён. Ни одного паука. Наконец-то можно спокойно уснуть.':kind==='faint'?'Слишком много… Ноги не держат. Всё темнеет.':'Все пауки уничтожены. Можно выдохнуть и дождаться утра…';
}
export function consume(s,id){
 s.inventory[s.selected]=null;s.consumed.add(id);if(id==='spray')s.charges.spray=0;
 if(s.day<3&&houseCleared(s)){s.quest='sleep';s.thought='Все пауки уничтожены. Можно ещё поискать деньги или пойти спать: кровать наверху, в спальне.';}
}
// Return true when a transition owns the frame. It cannot be paused or cancelled.
export function updateCampaign(s,dt,reset){
 if(s.transition){
  const t=s.transition;t.elapsed+=dt;
  if(t.kind==='ending'){
   s.fade=Math.min(1,t.elapsed/1.2);
   if(t.elapsed>=2.4){s.ending={elapsed:0};s.transition=null;s.fade=0;s.panic=0;s.panicRate=-1;s.attackTime=0;s.quest='ended';}
   return true;
  }
  if(t.elapsed>=1.6&&!t.switched){
   const kind=t.kind,day=s.day+(kind==='day'?1:0),score=kind==='day'?s.score:s.dayStartScore;
   const money=kind==='day'?s.money:s.dayStartMoney;
   reset(s,undefined,day);s.day=day;s.score=score;s.dayStartScore=score;s.money=money;s.dayStartMoney=money;s.quest=day===3?'ask-neighbors':'survive';
   if(kind==='day'){
    s.thought=day===3?'Третий день. Откуда у нас столько пауков? Не может быть, чтобы только у меня. Днём выйду на улицу и спрошу соседей.':'День 2. Снова вечер. Новые пауки, а под рукой только несколько вещей…';
   }else s.thought=`Пришёл в себя. День ${day} начинается заново. Нужно держать себя в руках.`;
   t.switched=true;s.transition=t;
  }
  s.fade=t.elapsed<1.2?t.elapsed/1.2:t.elapsed<2.1?1:Math.max(0,1-(t.elapsed-2.1)/1.1);
  if(t.elapsed>=3.2-1e-9){s.transition=null;s.fade=0;}
  return true;
 }
 if(s.paused)return false;
 const alive=s.spiders.filter(p=>!p.dead);
 const looking=!!s.inspection?.spider;
 const same=s.scene==='house'&&(looking||alive.some(p=>p.floor===s.floor&&p.room===s.room));
 s.panicRate=same?3:alive.length&&s.scene==='house'?1:-1;
 s.panic=Math.max(0,Math.min(100,s.panic+s.panicRate*dt));
 if(s.panic>=100-1e-8){s.panic=100;startTransition(s,'faint');return true;}
 return false;
}
