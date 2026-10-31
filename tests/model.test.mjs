import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, update, interact, nearby, setPaused, resetState, climb } from '../src/model.js';
import { WORLD, STAIR, ROOMS } from '../src/world.js';
const walk = (s, input, seconds) => { for(let i=0;i<Math.ceil(seconds*60);i++) update(s,input,1/60); };
test('персонаж начинает в прихожей на первом этаже', () => {
  const s = createState(); assert.equal(s.floor,0); assert.equal(s.room,'hall'); assert.equal(s.y,WORLD.floors[0]); assert.deepEqual([...s.visited],['hall']);
});
test('ходьба, направление, анимация и границы стен', () => {
  const s=createState(); const x=s.x; walk(s,{right:true},.5); assert.ok(s.x>x); assert.equal(s.facing,1); assert.ok(s.walk>0);
  walk(s,{left:true},20); assert.equal(s.x,WORLD.left); assert.equal(s.facing,-1);
  walk(s,{right:true},20); assert.equal(s.x,WORLD.right); assert.equal(s.room,'living');
});
test('подъём возможен только у лестницы, переход плавный и можно спуститься', () => {
  const s=createState(); s.x=150; update(s,{up:true},.1); assert.equal(s.stairs,null);
  s.x=STAIR.bottomX; update(s,{up:true},.016); assert.ok(s.stairs); walk(s,{},.8);
  assert.ok(s.y<STAIR.bottomY && s.y>STAIR.topY); walk(s,{},2); assert.equal(s.floor,1); assert.equal(s.x,STAIR.topX); assert.equal(s.y,STAIR.topY);
  update(s,{down:true},.016); walk(s,{},2); assert.equal(s.floor,0); assert.equal(s.y,STAIR.bottomY);
});
test('оба этажа и все шесть комнат доступны без телепортации', () => {
  const s=createState(); walk(s,{left:true},5); walk(s,{right:true},9); walk(s,{left:true},(WORLD.right-STAIR.bottomX)/WORLD.speed);
  assert.ok(Math.abs(s.x-STAIR.bottomX)<3); update(s,{up:true},.016); walk(s,{},2);
  walk(s,{left:true},6); walk(s,{right:true},9); assert.equal(s.visited.size,ROOMS.length);
});
test('осмотр доступен только рядом и в той же комнате', () => {
  const s=createState(); s.x=154; s.room='kitchen'; assert.equal(nearby(s).id,'fridge'); interact(s); assert.equal(s.inspection.id,'fridge'); assert.ok(s.inspected.has('fridge'));
  s.inspection=null; s.x=570; s.room='hall'; assert.equal(nearby(s).id,'hall-cabinet');
});
test('пауза замораживает ходьбу, лестницу и осмотр; перезапуск очищает состояние', () => {
  const s=createState(); s.x=STAIR.bottomX; interact(s); const y=s.y; setPaused(s,true); walk(s,{right:true},3); assert.equal(s.y,y); assert.equal(s.x,STAIR.bottomX);
  s.x=154; interact(s); assert.equal(s.inspected.size,0); setPaused(s,false); resetState(s); assert.equal(s.room,'hall'); assert.equal(s.paused,false); assert.equal(s.visited.size,1);
});
test('короткий тап запускает лестницу без ожидания кадра и соблюдает направление', () => {
  const s=createState();s.x=STAIR.bottomX;
  assert.equal(climb(s,'down'),false);assert.equal(climb(s,'up'),true);
  walk(s,{},2);assert.equal(s.floor,1);assert.equal(climb(s,'up'),false);
  setPaused(s,true);assert.equal(climb(s,'down'),false);
  setPaused(s,false);assert.equal(climb(s,'down'),true);walk(s,{},2);assert.equal(s.floor,0);
});
test('частота кадров не меняет скорость; большой dt ограничен', () => {
  const a=createState(),b=createState(); for(let i=0;i<30;i++)update(a,{right:true},1/30); for(let i=0;i<120;i++)update(b,{right:true},1/120); assert.ok(Math.abs(a.x-b.x)<.001);
  const x=a.x; update(a,{right:true},20); assert.ok(a.x-x<=WORLD.speed*.05+.001);
});
