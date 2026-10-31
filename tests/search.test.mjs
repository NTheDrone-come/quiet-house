import test from 'node:test';
import assert from 'node:assert/strict';
import * as actions from '../src/model.js';
import { createState } from './fixtures.mjs';
const model={...actions,createState};
import { OBJECTS, ROOMS, WORLD } from '../src/world.js';
const tick=(s,n, input={})=>{for(let i=0;i<n;i++)model.update(s,input,.01);};
function at(id){const s=model.createState(),o=OBJECTS.find(o=>o.id===id);s.x=o.x;s.floor=o.floor;s.y=WORLD.floors[o.floor];s.room=ROOMS.find(r=>r.floor===o.floor&&o.x>=r.left&&o.x<r.right).id;return s;}
test('осмотр открывает содержимое и блокирует ходьбу до закрытия',()=>{
 const s=at('fridge');model.interact(s,'fridge');assert.equal(s.inspection?.id,'fridge');const x=s.x;tick(s,50,{right:true});assert.equal(s.x,x);model.closeInspection(s);tick(s,20,{right:true});assert.ok(s.x>x);
});
test('все вещи имеют подробное содержимое, доступны по комнате, сквозь стены не осмотреть',()=>{
 assert.equal(OBJECTS.length,24);for(const o of OBJECTS){assert.ok(o.kind);assert.ok(o.contents.length>=3);const s=at(o.id);model.interact(s,o.id);assert.equal(s.inspection?.id,o.id);}
 const s=at('fridge');model.interact(s,'books');assert.equal(s.inspection,null);
});
test('паук закрывает осмотр ровно через полсекунды, испуг отбрасывает героя и выпускает паука',()=>{
 const s=at('sofa');model.interact(s,'sofa');const x=s.x;tick(s,49);assert.equal(s.inspection?.id,'sofa');assert.equal(s.spiders.length,0);model.update(s,{},.01);assert.equal(s.inspection,null);assert.equal(s.spiders.length,1);assert.ok(s.recoil);tick(s,45);assert.ok(Math.abs(s.x-x)>12);assert.equal(s.room,'living');
 model.interact(s,'sofa');assert.equal(s.inspection?.spider,false);
});
test('нельзя отменить испуг закрытием окна; пауза останавливает таймер',()=>{
 const s=at('sofa');model.interact(s,'sofa');model.closeInspection(s);assert.ok(s.inspection);model.setPaused(s,true);tick(s,80);assert.equal(s.inspection.elapsed,0);model.setPaused(s,false);tick(s,50);assert.equal(s.inspection,null);
});
test('инвентарь держит ровно два предмета, выброшенный можно снова подобрать',()=>{
 const s=at('coat');model.interact(s,'coat');assert.equal(model.takeItem(s,'slipper'),true);assert.equal(model.takeItem(s,'slipper'),false);model.closeInspection(s);
 s.x=572;model.interact(s,'hall-cabinet');assert.equal(model.takeItem(s,'spray'),true);model.closeInspection(s);s.x=154;s.room='kitchen';model.interact(s,'fridge');assert.equal(model.takeItem(s,'jar'),false);assert.equal(s.inventory.filter(Boolean).length,2);
 model.closeInspection(s);model.dropItem(s,0);assert.equal(s.inventory.filter(Boolean).length,1);const drop=s.drops[0];assert.equal(drop.item,'slipper');model.interact(s,drop.id);assert.equal(model.takeItem(s,'slipper'),true);assert.equal(s.drops.length,0);
});
test('паук требует оружие и дистанцию; убийство считается только один раз',()=>{
 const s=at('sofa');model.interact(s,'sofa');tick(s,100);assert.equal(model.attack(s),false);assert.equal(s.kills,0);
 s.inventory[0]='slipper';s.selected=0; s.x=600;assert.equal(model.attack(s),false);assert.equal(s.inventory[0],null);tick(s,31);s.inventory[0]='newspaper';s.x=s.spiders[0].x;assert.equal(model.attack(s),true);assert.equal(s.kills,1);assert.equal(s.score,100);assert.equal(model.attack(s),false);assert.equal(s.kills,1);
});
test('пустая рука не оружие, спрей расходуется, выбор слота и перезапуск',()=>{
 const s=at('sofa');model.interact(s,'sofa');tick(s,100);s.x=s.spiders[0].x;assert.equal(model.attack(s),false);s.inventory[1]='spray';model.selectSlot(s,1);assert.equal(s.selected,1);assert.equal(model.attack(s),true);assert.equal(s.charges.spray,0);assert.equal(s.inventory[1],null);model.resetState(s);assert.deepEqual(s.inventory,[null,null]);assert.equal(s.spiders.length,0);assert.equal(s.score,0);assert.equal('light' in s,false);
});
test('светлота комнат плавно стремится к 1 в текущей и к 0.5 в остальных',()=>{
 const s=model.createState();assert.equal(s.roomLight.hall,1);assert.equal(s.roomLight.kitchen,.5);s.x=340;model.update(s,{},.05);assert.ok(s.roomLight.kitchen>.5&&s.roomLight.kitchen<1);assert.ok(s.roomLight.hall<1&&s.roomLight.hall>.5);tick(s,200);assert.ok(Math.abs(s.roomLight.kitchen-1)<.001);assert.ok(Math.abs(s.roomLight.hall-.5)<.001);
});
