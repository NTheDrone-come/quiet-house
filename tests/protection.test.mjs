import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/model.js';
import * as p from '../src/protection.js';
import {roomAt,WORLD} from '../src/world.js';
import {questNotice} from '../src/notices.js';
function position(s,site){s.x=site.x;s.floor=site.floor;s.y=WORLD.floors[s.floor];s.room=roomAt(s.x,s.floor).id;}
function ready(){const s=m.createState(undefined,3);s.advice='Сетка и герметик';s.purchased=new Set(['mesh','sealant']);return s;}
function mesh(s){let g=s.installation;p.moveMesh(s,-g.offsetX,-g.offsetY);assert.equal(p.confirmMesh(s),true);for(let i=0;i<4;i++)assert.equal(p.fastenMesh(s,i),true);}
function seal(s){for(let i=0;i<p.SEAL_PATH.length;i++)assert.equal(p.sealPoint(s,i),true);}
test('ремонт доступен после совета на третий день, по месту и с купленным материалом',()=>{
 const s=ready(),site=p.PROTECTION_SITES[0];position(s,site);s.day=2;assert.equal(p.startInstallation(s,site.id),false);s.day=3;s.advice='';assert.equal(p.startInstallation(s,site.id),false);s.advice='Совет';s.purchased.clear();assert.equal(p.startInstallation(s,site.id),false);
 s.purchased.add(site.kind);s.x+=100;assert.equal(p.startInstallation(s,site.id),false);position(s,site);s.scene='street';assert.equal(p.startInstallation(s,site.id),false);s.scene='house';
 assert.ok(m.availableObjects(s).some(o=>o.id===site.id));assert.equal(m.interact(s,site.id),true);assert.equal(s.installation.id,site.id);assert.equal(s.objects.length,24);
});
test('сетка: сначала совместить, затем четыре крепления по порядку; нельзя зачесть ошибку или установить дважды',()=>{
 const s=ready(),site=p.PROTECTION_SITES.find(o=>o.kind==='mesh');position(s,site);p.startInstallation(s,site.id);
 assert.equal(p.confirmMesh(s),false);assert.equal(p.fastenMesh(s,0),false);p.moveMesh(s,NaN,0);assert.ok(Number.isFinite(s.installation.offsetX));
 const g=s.installation;p.moveMesh(s,-g.offsetX,-g.offsetY);assert.equal(p.confirmMesh(s),true);assert.equal(p.fastenMesh(s,1),false);assert.equal(s.installed.size,0);
 for(let i=0;i<4;i++)assert.equal(p.fastenMesh(s,i),true);assert.equal(s.installation,null);assert.ok(s.installed.has(site.id));assert.equal(p.startInstallation(s,site.id),false);assert.equal(s.purchased.size,2);assert.deepEqual(s.inventory,[null,null]);
});
test('герметик: непрерывная последовательность щели, чужие/повторные точки не засчитываются',()=>{
 const s=ready(),site=p.PROTECTION_SITES.find(o=>o.kind==='sealant');position(s,site);p.startInstallation(s,site.id);
 assert.equal(p.sealPoint(s,1),false);assert.equal(p.sealPoint(s,NaN),false);assert.equal(p.sealPoint(s,0),true);assert.equal(p.sealPoint(s,0),false);assert.equal(s.installation.progress,1);
 for(let i=1;i<p.SEAL_PATH.length;i++)p.sealPoint(s,i);assert.equal(s.installation,null);assert.ok(s.installed.has(site.id));assert.equal(s.money,0);
});
test('мини-игра блокирует движение, лестницу, панику и оружие; пауза и отмена не тратят материал',()=>{
 const s=ready(),site=p.PROTECTION_SITES[0];position(s,site);s.panic=50;s.inventory[0]='slipper';p.startInstallation(s,site.id);const x=s.x;
 for(let i=0;i<100;i++)m.update(s,{right:true,run:true,up:true},.01);assert.equal(s.x,x);assert.equal(s.panic,50);assert.equal(m.useItem(s),false);assert.equal(m.interact(s,'exit'),false);assert.equal(m.climb(s,'up'),false);
 m.setPaused(s,true);assert.equal(p.moveMesh(s,1,0),false);assert.equal(p.cancelInstallation(s),false);m.setPaused(s,false);assert.equal(p.cancelInstallation(s),true);assert.equal(s.installed.size,0);assert.equal(s.purchased.size,2);assert.equal(p.startInstallation(s,site.id),true);
});
test('все пять точек защищают дом, дневник и уведомление отражают прогресс; скрытые пауки не исчезают',()=>{
 const s=ready();const spiders=s.objects.filter(o=>o.spider).length;
 for(const site of p.PROTECTION_SITES){position(s,site);assert.equal(p.startInstallation(s,site.id),true);if(site.kind==='mesh')mesh(s);else seal(s);}
 assert.equal(s.installed.size,5);assert.equal(p.protectionComplete(s),true);assert.equal(s.quest,'protected');assert.match(p.protectionObjective(s),/защищён/);assert.equal(questNotice(s).id,'house-protected');assert.equal(s.objects.filter(o=>o.spider).length,spiders);
 assert.equal(m.availableObjects(s).filter(o=>o.id.startsWith('install-')).length,0);m.resetState(s,undefined,3);assert.equal(s.installed.size,0);assert.equal(s.installation,null);
});
