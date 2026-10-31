import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/model.js';
import {PROTECTION_SITES} from '../src/protection.js';
import {houseCleared} from '../src/progression.js';
import {questNotice} from '../src/notices.js';
import {WORLD,roomAt} from '../src/world.js';
function ready(){const s=m.createState(undefined,3);s.advice='Совет';s.purchased=new Set(['mesh','sealant']);s.installed=new Set(PROTECTION_SITES.map(o=>o.id));s.spiders=s.objects.filter(o=>o.spider).map(o=>({id:o.id,dead:true,x:o.x,floor:o.floor,room:roomAt(o.x,o.floor).id}));s.kills=s.spiders.length;s.x=218;s.floor=1;s.y=WORLD.floors[1];s.room='bedroom';return s;}
function tick(s,seconds){for(let i=0;i<Math.ceil(seconds/.05);i++)m.update(s,{right:true,run:true,up:true},.05);}
test('финал требует всех пяти установок и всех пауков, включая скрытых',()=>{
 const s=ready();assert.ok(houseCleared(s));s.installed.delete(PROTECTION_SITES[0].id);assert.equal(m.interact(s,'sleep'),false);assert.equal(s.transition,null);
 s.installed.add(PROTECTION_SITES[0].id);s.spiders.pop();assert.equal(m.interact(s,'sleep'),false);assert.equal(s.transition,null);
 const o=s.objects.find(o=>o.spider&&!s.spiders.some(p=>p.id===o.id));s.spiders.push({id:o.id,dead:false});assert.equal(m.interact(s,'sleep'),false);
});
test('завершённая защита и зачистка только разрешают сон, финал начинается у кровати',()=>{
 const s=ready();tick(s,.5);assert.equal(s.transition,null);assert.equal(s.ending,null);s.x=450;s.room='landing';assert.equal(m.interact(s,'sleep'),false);
 s.x=218;s.room='bedroom';assert.equal(m.nearby(s)?.id,'sleep');assert.equal(questNotice(s)?.id,'final-sleep');assert.equal(m.interact(s,'sleep'),true);assert.equal(s.transition.kind,'ending');
});
test('финальный сон приводит к терминальным титрам без сброса дня, денег, очков и расстановки',()=>{
 const s=ready();s.money=123;s.score=1500;const objects=s.objects;assert.equal(m.interact(s,'sleep'),true);tick(s,4);
 assert.ok(s.ending);assert.equal(s.transition,null);assert.equal(s.day,3);assert.equal(s.money,123);assert.equal(s.score,1500);assert.equal(s.objects,objects);assert.equal(s.installed.size,5);assert.equal(questNotice(s),null);
 const x=s.x,panic=s.panic,elapsed=s.ending.elapsed;tick(s,10);assert.equal(s.x,x);assert.equal(s.panic,panic);assert.ok(s.ending.elapsed>elapsed);assert.equal(m.interact(s,'sleep'),false);assert.equal(m.climb(s,'down'),false);s.inventory[0]='slipper';assert.equal(m.useItem(s),false);assert.equal(m.dropItem(s),false);m.setPaused(s,true);assert.equal(s.paused,false);
 m.resetState(s);assert.equal(s.ending,null);
});
