import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,update} from '../src/model.js';
import {createSearchObjects,SEARCH_OBJECTS,ITEMS} from '../src/objects.js';
import {ROOMS} from '../src/world.js';
import {questNotice} from '../src/notices.js';
import {createAudio} from '../src/audio.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('24 осмотра: по четыре на комнату, на всех днях хватает мест для оружия, пауков и денег',()=>{
 assert.equal(SEARCH_OBJECTS.length,24);
 for(const r of ROOMS)assert.equal(SEARCH_OBJECTS.filter(o=>o.floor===r.floor&&o.x>=r.left&&o.x<r.right).length,4);
 for(const day of [1,2,3])for(let seed=1;seed<=100;seed++){
  const objects=createSearchObjects(rng(seed),day);
  assert.equal(objects.length,24);assert.equal(new Set(objects.map(o=>o.id)).size,24);
  assert.deepEqual(objects.filter(o=>o.item).map(o=>o.item).sort(),Object.keys(ITEMS).sort());
  assert.equal(objects.filter(o=>o.spider).length,day===1?2:day===2?4:5);
  assert.deepEqual(objects.filter(o=>o.money).map(o=>o.money).sort((a,b)=>a-b),[30,30,40,50,60,70]);
  assert.ok(objects.every(o=>Number(!!o.item)+Number(!!o.spider)+Number(!!o.money)<=1));
 }
});
test('важная мысль о сне не заменяется обычной мыслью комнаты или осмотра',()=>{
 const s=createState();assert.equal(questNotice(s),null);s.quest='sleep';
 assert.match(questNotice(s).title,/спать/);s.thought='Обычная мысль';s.room='kitchen';
 assert.match(questNotice(s).text,/кровати/);
});
test('цели третьего дня: улица, совет, покупка и маршрут установки',()=>{
 const s=createState(undefined,3);assert.equal(questNotice(s).id,'go-out');s.scene='street';assert.equal(questNotice(s),null);
 s.advice='Сетка и герметик';assert.equal(questNotice(s).id,'buy-supplies');s.purchased.add('mesh');assert.equal(questNotice(s).id,'buy-supplies');
 s.purchased.add('sealant');assert.equal(questNotice(s).id,'install-0');assert.match(questNotice(s).text,/Вернись домой/);
});
test('нет AudioContext или доступного хранилища: игра продолжает работу, звук безопасно отключается',()=>{
 const storage={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
 const audio=createAudio({Context:null,storage});audio.unlock();assert.equal(audio.play('step'),false);
 const s=createState();audio.sync(s);update(s,{right:true},.05);audio.sync(s,.05);
 assert.equal(audio.snapshot().supported,false);assert.equal(audio.toggle(),true);assert.equal(audio.toggle(),false);
});
test('отказ запуска аудио не ломает управление и переключатель',()=>{
 class DeniedContext{constructor(){throw Error('blocked');}}
 const audio=createAudio({Context:DeniedContext,storage:null});assert.doesNotThrow(()=>audio.unlock());assert.equal(audio.play('search'),false);assert.equal(audio.toggle(),true);
});
