import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/model.js';
import { ITEMS, SEARCH_OBJECTS } from '../src/objects.js';
import { WORLD, roomAt } from '../src/world.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const layout=s=>s.objects.map(o=>[o.id,o.item,o.spider]);
function position(s,o){s.x=o.x;s.floor=o.floor;s.y=WORLD.floors[o.floor];s.room=roomAt(o.x,o.floor).id;}

test('случайная расстановка содержит все десять вещей ровно по разу и два разных укрытия в первый день',()=>{
 for(let seed=1;seed<=100;seed++){
  const s=m.createState(rng(seed));assert.ok(Array.isArray(s.objects),'расстановка должна принадлежать состоянию игры');
  assert.equal(s.objects.length,SEARCH_OBJECTS.length);
  assert.deepEqual(s.objects.filter(o=>o.item).map(o=>o.item).sort(),Object.keys(ITEMS).sort());
  assert.equal(s.objects.filter(o=>o.spider).length,2);
  assert.ok(s.objects.every(o=>!(o.item&&o.spider)),'паук не должен блокировать единственный предмет');
  for(const o of s.objects){position(s,o);assert.ok(m.availableObjects(s).some(a=>a.id===o.id));}
 }
});

test('разные генераторы дают разные места; предметы могут оказаться в холодильнике и за картиной',()=>{
 const itemHomes=new Map(Object.keys(ITEMS).map(id=>[id,new Set()])),spiderHomes=new Set(),layouts=new Set();
 for(let seed=1;seed<=300;seed++){
  const s=m.createState(rng(seed));assert.ok(s.objects);layouts.add(JSON.stringify(layout(s)));
  for(const o of s.objects){if(o.item)itemHomes.get(o.item).add(o.id);if(o.spider)spiderHomes.add(o.id);}
 }
 assert.ok(layouts.size>290);assert.ok(itemHomes.get('slipper').has('fridge'));assert.ok(itemHomes.get('pencil').has('kitchen-picture'));
 for(const homes of itemHomes.values())assert.ok(homes.size>=22);
 assert.equal(spiderHomes.size,24);
});

test('генерация не меняет шаблоны и соседние попытки; сброс создаёт новую расстановку',()=>{
 const template=JSON.stringify(SEARCH_OBJECTS),a=m.createState(rng(10)),b=m.createState(rng(20));
 assert.ok(a.objects&&b.objects);const before=layout(b);a.objects[0].contents.push('test');
 assert.deepEqual(layout(b),before);assert.equal(JSON.stringify(SEARCH_OBJECTS),template);
 const old=layout(a);m.resetState(a,rng(30));assert.notDeepEqual(layout(a),old);assert.deepEqual(layout(b),before);
});

test('осмотр, испуг, подбор и повторное открытие используют расстановку текущей попытки',()=>{
 const s=m.createState(rng(45));assert.ok(s.objects);
 for(const o of s.objects.filter(o=>o.item)){
  position(s,o);assert.equal(m.interact(s,o.id),true);assert.equal(m.inspectionObject(s).item,o.item);
  assert.equal(m.takeItem(s,o.item),true);assert.equal(m.takeItem(s,o.item),false);m.closeInspection(s);m.dropItem(s);
 }
 const o=s.objects.find(o=>o.spider);position(s,o);assert.equal(m.interact(s,o.id),true);assert.equal(s.inspection.spider,true);
 for(let i=0;i<100;i++)m.update(s,{},.01);
 assert.equal(s.spiders.length,1);assert.equal(s.spiders[0].id,o.id);assert.equal(s.spiders[0].floor,o.floor);
 position(s,o);m.interact(s,o.id);assert.equal(s.inspection.spider,false);
});
