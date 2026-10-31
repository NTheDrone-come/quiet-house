import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/model.js';
import { buyProtection, PROTECTION } from '../src/economy.js';
import { WORLD, roomAt } from '../src/world.js';
const tick=(s,seconds,input={})=>{for(let i=0;i<Math.round(seconds*100);i++)m.update(s,input,.01);};
function position(s,o){s.x=o.x;s.floor=o.floor;s.y=WORLD.floors[o.floor];s.room=roomAt(o.x,o.floor).id;}
function collect(s,o){position(s,o);assert.equal(m.interact(s,o.id),true);assert.equal(m.takeMoney(s),true);m.closeInspection(s);}
function clear(s){for(const o of s.objects.filter(o=>o.spider)){s.revealed.add(o.id);s.spiders.push({id:o.id,x:o.x,origin:o.x,floor:o.floor,room:roomAt(o.x,o.floor).id,dead:true,phase:0});}}
test('бег вдвое быстрее ходьбы дома и на улице, не проходит сквозь стены и паузу',()=>{
 for(const scene of ['house','street']){const a=m.createState(),b=m.createState();a.scene=b.scene=scene;
 tick(a,.5,{right:true});tick(b,.5,{right:true,run:true});assert.ok(Math.abs((b.x-405)-2*(a.x-405))<.001);assert.ok(b.running);
 m.setPaused(b,true);const x=b.x;tick(b,1,{right:true,run:true});assert.equal(b.x,x);m.setPaused(b,false);
 tick(b,20,{right:true,run:true});assert.equal(b.x,scene==='house'?WORLD.right:1740);
 }
});
test('деньги случайны, не занимают руки, собираются только при осмотре один раз',()=>{
 const layouts=[];
 for(let i=0;i<20;i++){const s=m.createState(),caches=s.objects.filter(o=>o.money);layouts.push(caches.map(o=>o.id).join(','));
 assert.equal(caches.length,6);assert.ok(caches.every(o=>!o.spider&&!o.item));assert.equal(caches.reduce((n,o)=>n+o.money,0),280);
 assert.equal(m.takeMoney(s),false);s.inventory=['slipper','spray'];const o=caches[0];collect(s,o);assert.equal(s.money,o.money);assert.deepEqual(s.inventory,['slipper','spray']);
 m.interact(s,o.id);assert.equal(m.takeMoney(s),false);assert.equal(s.money,o.money);m.closeInspection(s);
 }
 assert.ok(new Set(layouts).size>1);
});
test('сон требует зачистки, спальни и близости; убийства сами не запускают новый день',()=>{
 const s=m.createState();const bed=s.objects.find(o=>o.id==='bed');position(s,bed);assert.equal(m.interact(s,'sleep'),false);assert.match(s.thought,/паук/);
 clear(s);tick(s,5);assert.equal(s.day,1);assert.equal(s.transition,null);s.x=500;assert.equal(m.interact(s,'sleep'),false);
 position(s,bed);m.setPaused(s,true);assert.equal(m.interact(s,'sleep'),false);m.setPaused(s,false);
 assert.equal(m.nearby(s).id,'sleep');assert.equal(m.interact(s,'sleep'),true);assert.equal(s.transition.kind,'day');tick(s,4);assert.equal(s.day,2);
});
test('кошелёк переходит через сон, а обморок откатывает деньги к началу текущего дня',()=>{
 const s=m.createState();collect(s,s.objects.find(o=>o.money));const saved=s.money;clear(s);position(s,s.objects.find(o=>o.id==='bed'));m.interact(s,'sleep');tick(s,4);
 assert.equal(s.day,2);assert.equal(s.money,saved);assert.equal(s.dayStartMoney,saved);collect(s,s.objects.find(o=>o.money));assert.ok(s.money>saved);
 s.panic=99.99;s.spiders.push({id:'panic',x:s.x,origin:s.x,floor:s.floor,room:s.room,dead:false,phase:0});tick(s,4);
 assert.equal(s.day,2);assert.equal(s.money,saved);assert.equal(s.moneyTaken.size,0);
});
test('магазин: совет, близость, средства, защита от повторной покупки и блокировка управления',()=>{
 const s=m.createState(undefined,3);s.scene='street';s.room='street';s.x=1240;s.money=300;
 assert.equal(buyProtection(s,'mesh'),false);assert.equal(m.interact(s,'shop'),true);assert.equal(buyProtection(s,'mesh'),false);
 s.advice='Мелкая сетка и герметик';s.money=0;assert.equal(buyProtection(s,'mesh'),false);assert.equal(s.money,0);
 s.money=300;assert.equal(buyProtection(s,'unknown'),false);assert.equal(buyProtection(s,'mesh'),true);assert.equal(s.money,300-PROTECTION.mesh.price);
 assert.equal(buyProtection(s,'mesh'),false);m.setPaused(s,true);assert.equal(buyProtection(s,'sealant'),false);m.setPaused(s,false);
 const x=s.x;tick(s,1,{right:true,run:true});assert.equal(s.x,x);assert.equal(buyProtection(s,'sealant'),true);assert.equal(s.purchased.size,2);assert.equal(s.quest,'supplies-bought');
 assert.deepEqual(s.inventory,[null,null]);assert.equal(m.closeShop(s),true);s.x=100;assert.equal(m.interact(s,'shop'),false);assert.equal(buyProtection(s,'mesh'),false);
});
