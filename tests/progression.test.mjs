import test from 'node:test';
import assert from 'node:assert/strict';
import * as actions from '../src/model.js';
import { createState } from './fixtures.mjs';
const m={...actions,createState};
import { ITEMS } from '../src/objects.js';
import { roomAt } from '../src/world.js';
const tick=(s,seconds,input={})=>{for(let i=0;i<Math.round(seconds*100);i++)m.update(s,input,.01);};
const spider=s=>s.spiders.push({id:'test',x:410,origin:410,floor:0,room:'hall',phase:0,dead:false});
test('паника: рядом +3%/с, в другой комнате +1%/с, без пауков -1%/с',()=>{
 const s=m.createState();assert.equal(s.panic,0);tick(s,2);assert.equal(s.panic,0);spider(s);tick(s,6);assert.ok(Math.abs(s.panic-18)<.001);assert.equal(s.panicRate,3);
 s.x=330;s.room='kitchen';tick(s,3);assert.ok(Math.abs(s.panic-21)<.001);assert.equal(s.panicRate,1);
 s.spiders[0].dead=true;const before=s.panic;tick(s,2);assert.ok(Math.abs(s.panic-(before-2))<.001);
 s.panic=.5;tick(s,1);assert.equal(s.panic,0);
});
test('необнаруженные пауки не вызывают панику; осмотр и пауза корректно учитывают время',()=>{
 const s=m.createState();tick(s,20);assert.equal(s.panic,0);s.x=682;s.room='living';m.interact(s,'sofa');tick(s,.3);assert.ok(Math.abs(s.panic-.9)<.001);m.setPaused(s,true);const p=s.panic;tick(s,1);assert.equal(s.panic,p);m.setPaused(s,false);tick(s,.2);assert.equal(s.spiders.length,1);
});
test('обморок при 100% автоматически перезапускает текущий день, а не кампанию',()=>{
 for(const day of [1,2,3]){
  const s=m.createState();s.day=day;s.dayStartScore=day===1?0:300;s.score=500;spider(s);
  tick(s,33.33);assert.equal(s.transition,null);tick(s,.01);assert.equal(s.transition?.kind,'faint');assert.equal(s.panic,100);
  const x=s.x;assert.equal(m.interact(s,'coat'),false);assert.equal(m.attack(s),false);m.setPaused(s,true);assert.equal(s.paused,false);tick(s,.8,{right:true});assert.equal(s.x,x);
  tick(s,4);assert.equal(s.day,day);assert.equal(s.panic,0);assert.equal(s.score,day===1?0:300);assert.equal(s.spiders.length,0);assert.equal(s.transition,null);assert.deepEqual(s.inventory,[null,null]);assert.equal(s.consumed.size,0);assert.equal(s.quest,day===3?'ask-neighbors':'survive');
 }
});
test('находки применяются один раз; промах тратит оружие, предмет нельзя взять заново',()=>{
 const s=m.createState();m.interact(s,'coat');m.takeItem(s,'slipper');m.closeInspection(s);assert.equal(m.attack(s),false);assert.equal(s.inventory[0],null);assert.ok(s.consumed.has('slipper'));tick(s,.4);m.interact(s,'coat');assert.equal(m.takeItem(s,'slipper'),false);m.closeInspection(s);
 s.inventory[0]='jar';spider(s);assert.equal(m.useItem(s),true);assert.equal(s.spiders[0].dead,true);assert.equal(s.inventory[0],null);assert.equal(s.score,100);
 for(const id of ['key','pencil']){tick(s,.4);s.inventory[0]=id;s.panic=20;assert.equal(m.useItem(s),false);assert.equal(s.inventory[0],null);assert.ok(s.consumed.has(id));assert.equal(s.panic,20);}
});
function clearDay(s){
 const weapons=Object.keys(ITEMS);
 for(const [i,o] of s.objects.filter(o=>o.spider).entries()){
  tick(s,.4);s.x=o.x;s.floor=o.floor;s.room=roomAt(o.x,o.floor).id;
  assert.equal(m.interact(s,o.id),true);tick(s,1);
  s.x=s.spiders.find(p=>p.id===o.id).x;s.inventory[0]=weapons[i];s.selected=0;
  assert.equal(m.useItem(s),true);
 }
 const day=s.day;assert.equal(s.transition,null);tick(s,.5);assert.equal(s.day,day);
 s.x=218;s.floor=1;s.y=294;s.room='bedroom';assert.equal(m.interact(s,'sleep'),true);
}
test('день меняется после зачистки и сна, не после пустого инвентаря; день 3 открывает расследование',()=>{
 const s=m.createState();s.inventory[0]='slipper';m.useItem(s);tick(s,1);assert.equal(s.day,1);assert.equal(s.transition,null);
 m.resetState(s);s.score=400;const layout=s.objects.map(o=>[o.item,o.spider]);clearDay(s);const score=s.score;assert.equal(s.transition?.kind,'day');assert.equal(s.day,1);tick(s,4);assert.equal(s.day,2);assert.equal(s.consumed.size,0);assert.equal(s.taken.size,0);assert.equal(s.scene,'house');assert.equal(s.dayStartScore,score);assert.equal(s.score,score);assert.notDeepEqual(s.objects.map(o=>[o.item,o.spider]),layout);
 clearDay(s);tick(s,4);assert.equal(s.day,3);assert.equal(s.scene,'house');assert.match(s.thought,/откуда/i);assert.equal(s.quest,'ask-neighbors');
 s.x=387;s.floor=0;s.y=449;s.room='hall';assert.equal(m.interact(s,'exit'),true);assert.equal(s.scene,'street');assert.equal(s.room,'street');
});
test('улица недоступна раньше дня 3, прохожие двигаются, диалог требует близости и сохраняет совет',()=>{
 const s=m.createState();assert.equal(m.interact(s,'exit'),false);clearDay(s);tick(s,4);clearDay(s);tick(s,4);m.interact(s,'exit');assert.equal(s.scene,'street');
 assert.ok(s.pedestrians.length>=4);const x=s.pedestrians[0].x;tick(s,1);assert.notEqual(s.pedestrians[0].x,x);assert.equal(m.interact(s,'neighbor'),false);
 for(const person of [...s.pedestrians]){
  s.x=person.x;assert.equal(m.interact(s,person.id),true);const frozen=s.x;tick(s,.2,{right:true});assert.equal(s.x,frozen);assert.ok(s.dialogue);let guard=0;while(s.dialogue&&guard++<10)m.advanceDialogue(s);assert.ok(s.talked.has(person.id));
 }
 assert.equal(s.quest,'advice-found');assert.match(s.advice,/сетк/);assert.equal(s.talked.size,4);assert.equal(m.attack(s),false);s.x=100;assert.equal(m.interact(s,'home'),true);assert.equal(s.scene,'house');assert.equal(s.day,3);assert.ok(s.advice);
});
test('расход спрея равен одному использованию, оставление на полу не считается расходом',()=>{
 const s=m.createState();s.inventory[0]='spray';m.dropItem(s);assert.equal(s.consumed.size,0);m.interact(s,s.drops[0].id);m.takeItem(s,'spray');m.closeInspection(s);m.useItem(s);assert.equal(s.charges.spray,0);assert.equal(s.inventory[0],null);assert.equal(s.consumed.size,1);
});
