import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/model.js';
import { ITEMS } from '../src/objects.js';
import { WORLD, roomAt } from '../src/world.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const tick=(s,seconds)=>{for(let i=0;i<Math.round(seconds*100);i++)m.update(s,{},.01);};
function position(s,o){s.x=o.x;s.floor=o.floor;s.y=WORLD.floors[o.floor];s.room=roomAt(o.x,o.floor).id;}
function pickup(s,id){const o=s.objects.find(o=>o.item===id);position(s,o);assert.equal(m.interact(s,o.id),true);assert.equal(m.takeItem(s,id),true);m.closeInspection(s);}
const counts=s=>({items:s.objects.filter(o=>o.item).length,spiders:s.objects.filter(o=>o.spider).length});

test('каждая случайная попытка содержит 10 разных оружий, 2 паука в день 1 и 4 в день 2',()=>{
 for(const day of [1,2])for(let seed=1;seed<=100;seed++){
  const s=m.createState(rng(seed),day);assert.equal(s.day,day);
  assert.deepEqual(counts(s),{items:10,spiders:day===1?2:4});
  assert.equal(new Set(s.objects.filter(o=>o.item).map(o=>o.item)).size,10);
  assert.ok(s.objects.every(o=>!(o.item&&o.spider)));
 }
});

test('все десять находок можно подобрать и каждой убить паука ровно один раз',()=>{
 assert.equal(Object.keys(ITEMS).length,10);
 for(const [id,item] of Object.entries(ITEMS)){
  assert.equal(item.weapon,true,`${id} должен быть оружием`);assert.ok(item.range>0);
  const s=m.createState(rng(35));pickup(s,id);
  s.spiders.push({id:'target',x:s.x,origin:s.x,floor:s.floor,room:s.room,phase:0,dead:false});
  assert.equal(m.attack(s),true,id);assert.equal(s.kills,1);assert.equal(s.score,100);assert.ok(s.spiders[0].dead);
  assert.deepEqual(s.inventory,[null,null]);assert.ok(s.consumed.has(id));tick(s,.4);
  assert.equal(m.attack(s),false);assert.equal(s.kills,1);
  const o=s.objects.find(o=>o.item===id);position(s,o);m.interact(s,o.id);assert.equal(m.takeItem(s,id),false);
 }
});

test('оба вечера: последний паук разрешает сон, день продолжается до кровати',()=>{
 const s=m.createState(rng(88));
 for(const day of [1,2]){
  assert.equal(s.day,day);assert.deepEqual(counts(s),{items:10,spiders:day===1?2:4});
  const ids=Object.keys(ITEMS),hiding=s.objects.filter(o=>o.spider),oldScore=s.score;
  for(const [i,o] of hiding.entries()){
   pickup(s,ids[i]);position(s,o);assert.equal(m.interact(s,o.id),true);tick(s,1);
   s.x=s.spiders.at(-1).x;assert.equal(m.attack(s),true);
   assert.equal(s.kills,i+1);
   if(i<hiding.length-1){assert.equal(s.transition,null,'скрытые пауки тоже должны быть убиты');tick(s,.4);}
  }
  assert.equal(s.day,day);assert.equal(s.spiders.filter(p=>!p.dead).length,0);
  assert.equal(s.consumed.size,hiding.length);assert.ok(s.consumed.size<10);
  assert.equal(s.transition,null);tick(s,4);assert.equal(s.day,day);
  position(s,s.objects.find(o=>o.id==='bed'));assert.equal(m.interact(s,'sleep'),true);
  assert.equal(s.transition?.kind,'day');tick(s,4);
  assert.equal(s.day,day+1);assert.equal(s.score,oldScore+hiding.length*100);
  assert.equal(s.dayStartScore,s.score);assert.equal(s.consumed.size,0);assert.deepEqual(s.inventory,[null,null]);
 }
 assert.equal(s.day,3);assert.equal(s.quest,'ask-neighbors');s.x=387;s.room='hall';assert.equal(m.interact(s,'exit'),true);assert.equal(s.scene,'street');
});

test('расход всех десяти предметов промахами не завершает день с живыми скрытыми пауками',()=>{
 const s=m.createState(rng(88));
 for(const id of Object.keys(ITEMS)){pickup(s,id);assert.equal(m.attack(s),false);tick(s,.4);}
 assert.equal(s.consumed.size,10);assert.equal(s.transition,null);tick(s,4);assert.equal(s.day,1);
});

test('обморок сохраняет день и заново создаёт его набор: 10 оружий и 2 или 4 паука',()=>{
 for(const day of [1,2]){
  const s=m.createState(rng(45),day),old=s.objects.map(o=>[o.item,o.spider]);s.dayStartScore=100;s.score=200;
  s.panic=99.99;s.spiders.push({id:'target',x:s.x,origin:s.x,floor:s.floor,room:s.room,phase:0,dead:false});
  tick(s,4);assert.equal(s.day,day);assert.equal(s.score,100);assert.equal(s.panic,0);
  assert.deepEqual(counts(s),{items:10,spiders:day===1?2:4});assert.notDeepEqual(s.objects.map(o=>[o.item,o.spider]),old);
 }
});
