import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
// Reuse installed Playwright and Edge; no system browser installation or state injection.
let playwright;
try { playwright=await import('playwright'); } catch {
 const cache=path.join(process.env.LOCALAPPDATA||'','npm-cache','_npx');
 const entry=fs.existsSync(cache)?fs.readdirSync(cache).map(d=>path.join(cache,d,'node_modules/playwright/index.mjs')).find(p=>fs.existsSync(p)):null;
 if(!entry)throw new Error('Playwright is not available. Install it separately to run this optional check.');
 playwright=await import(pathToFileURL(entry).href);
}
const edge=path.join(process.env['PROGRAMFILES(X86)']||'','Microsoft/Edge/Application/msedge.exe');
const browser=await playwright.chromium.launch({headless:true,...(fs.existsSync(edge)?{executablePath:edge}:{})});
const page=await browser.newPage({viewport:{width:1366,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
page.on('requestfailed',r=>errors.push(`${r.failure()?.errorText} ${r.url()}`));
const url=process.argv[2];if(!url)throw new Error('Pass the local preview URL.');
fs.mkdirSync('artifacts',{recursive:true});
const snap=()=>page.evaluate(()=>window.quietHouse.snapshot());
const wait=predicate=>page.waitForFunction(predicate,null,{timeout:50000,polling:'raf'});
async function goTo(x){
 const here=(await snap()).x;if(Math.abs(here-x)<3)return;
 await page.keyboard.down(here<x?'KeyD':'KeyA');
 try {await wait(new Function(`return Math.abs(window.quietHouse.snapshot().x-${x})<3`));}
 finally {await page.keyboard.up(here<x?'KeyD':'KeyA');}
}
async function open(text){if(!await page.locator('#nearby-panel').isVisible())await page.locator('#nearby-button').click();await page.locator('#nearby-objects button').filter({hasText:text}).first().click();}
async function floorTo(floor){
 if((await snap()).floor===floor)return;
 await goTo(floor===1?438:548);await page.keyboard.press(floor===1?'KeyW':'KeyS');
 await wait(new Function(`return window.quietHouse.snapshot().floor===${floor}&&!window.quietHouse.snapshot().stairs`));
}
async function visit(o){await floorTo(o.floor);await goTo(o.x);}
async function lootItem(id){
 const o=(await snap()).objects.find(o=>o.item===id);await visit(o);await open(o.name);
 await page.locator('#loot button').filter({hasText:'Взять:'}).click();
 assert.ok((await snap()).inventory.includes(id),`pickup ${id} from ${o.id}: ${JSON.stringify({inspection:(await snap()).inspection,inventory:(await snap()).inventory,consumed:(await snap()).consumed,title:await page.locator('#inspection-title').textContent()})}`);
 await page.keyboard.press('KeyE');
 assert.ok((await snap()).inventory.includes(id),`closing inspection keeps ${id}`);
}
async function use(){await page.waitForTimeout(350);await page.keyboard.press('Space');}
const arrangement=s=>s.objects.map(o=>[o.id,o.item,o.spider]);
async function spendEvening(day){
 const old=arrangement(await snap());
 const start=await snap(),items=start.objects.filter(o=>o.item).map(o=>o.item);
 assert.equal(start.objects.length,24);assert.equal(items.length,10);assert.equal(new Set(items).size,10);
 assert.equal(start.objects.filter(o=>o.spider).length,day===1?2:4);
 // Only 2/4 weapons are needed; the last kill unlocks sleep, not an automatic transition.
 const hiding=start.objects.filter(o=>o.spider);
 for(const [i,o] of hiding.entries()){
  const id=items[i];await lootItem(id);
  await visit(o);await open(o.name);
  await wait(()=>!window.quietHouse.snapshot().inspection&&!window.quietHouse.snapshot().recoil);
  const target=(await snap()).spiders.find(p=>p.id===o.id);await goTo(target.x);
  await use();const after=await snap();assert.ok(after.consumed.includes(id));
  assert.equal(after.kills,i+1);
  if(i<hiding.length-1)assert.equal(after.transition,null);
 }
 assert.equal((await snap()).consumed.length,hiding.length);
 assert.equal((await snap()).spiders.filter(p=>!p.dead).length,0);
 assert.equal((await snap()).transition,null);await page.waitForTimeout(1200);assert.equal((await snap()).day,day);
 await page.locator('#quest-notice').waitFor({state:'visible'});assert.match(await page.locator('#notice-title').innerText(),/спать/);
 await page.screenshot({path:`artifacts/sleep-notice-day-${day}.png`});
 for(const [width,height] of [[320,568],[667,375]]){
  await page.setViewportSize({width,height});
  assert.equal(await page.locator('#close-notice').evaluate(b=>{const r=b.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;}),true);
  const noticeBox=await page.locator('#quest-notice').boundingBox(),interactionBox=await page.locator('#interaction').boundingBox();
  if(interactionBox)assert.ok(noticeBox.y+noticeBox.height<=interactionBox.y||interactionBox.y+interactionBox.height<=noticeBox.y,'notice does not cover interaction');
  await page.screenshot({path:`artifacts/notice-${width}x${height}.png`});
 }
 await page.setViewportSize({width:1366,height:900});await page.locator('#close-notice').click();assert.equal(await page.locator('#quest-notice').isVisible(),false);
 // Search all caches after clearing: the house remains playable until bed.
 for(const o of (await snap()).objects.filter(o=>o.money)){
  await visit(o);await open(o.name);await page.getByRole('button',{name:`Забрать ${o.money} ₽`,exact:true}).click();
  const cash=(await snap()).money;await page.keyboard.press('KeyE');await open(o.name);
  assert.equal(await page.getByRole('button',{name:`Забрать ${o.money} ₽`,exact:true}).count(),0);assert.equal((await snap()).money,cash);await page.keyboard.press('KeyE');
 }
 assert.equal((await snap()).money,day*280);
 await visit({floor:1,x:218});await open('Лечь спать — следующий день');
 assert.match(await page.locator('#transition-description').innerText(),/Вы легли спать/);
 assert.equal((await snap()).transition?.kind,'day');
 await page.screenshot({path:`artifacts/day-${day}-transition.png`});
 await wait(new Function(`const s=window.quietHouse.snapshot();return s.day===${day+1}&&!s.transition`));
 assert.deepEqual((await snap()).inventory,[null,null]);assert.equal((await snap()).consumed.length,0);
 assert.notDeepEqual(arrangement(await snap()),old);
 assert.equal(await page.locator('#chapter-label').innerText(),`День ${day+1} · ${day===2?'Утро':'Вечер'}`);
}
async function faintOnDay(day){
 const before=await snap(),o=before.objects.find(o=>o.spider);await visit(o);await open(o.name);
 await wait(()=>window.quietHouse.snapshot().spiders.length===1);
 await wait(()=>!window.quietHouse.snapshot().recoil);
 assert.equal((await snap()).panicRate,3);assert.equal(await page.locator('#panic-rate').innerText(),'Паук в комнате · +3%/с');
 const near=(await snap()).panic;await page.waitForTimeout(1100);assert.ok((await snap()).panic-near>2.5);
 const safe=before.objects.find(a=>a.floor===o.floor&&((a.x<350?0:a.x<586?1:2)!==(o.x<350?0:o.x<586?1:2)));
 await visit(safe);await page.waitForTimeout(100);assert.equal((await snap()).panicRate,1);
 assert.equal(await page.locator('#panic-rate').innerText(),'Паук в доме · +1%/с');
 await page.keyboard.press('Escape');const frozen=(await snap()).panic;await page.waitForTimeout(300);assert.equal((await snap()).panic,frozen);
 await page.getByRole('button',{name:'Вернуться в дом',exact:true}).click();await visit(o);
 await wait(()=>window.quietHouse.snapshot().transition?.kind==='faint');
 assert.match(await page.locator('#transition-description').innerText(),new RegExp(`день ${day} заново`));
 await page.waitForTimeout(1250);assert.ok((await snap()).fade>.95);await page.screenshot({path:'artifacts/faint-blackout.png'});
 await wait(()=>!window.quietHouse.snapshot().transition);
 assert.equal((await snap()).day,day);assert.equal((await snap()).panic,0);assert.equal((await snap()).spiders.length,0);
 assert.equal((await snap()).objects.filter(o=>o.item).length,10);
 assert.equal((await snap()).objects.filter(o=>o.spider).length,day===1?2:4);
 assert.notDeepEqual(arrangement(await snap()),arrangement(before));
 console.log(`PASS: +3/+1 panic, pause, blackout, automatic same-day ${day} retry and reshuffle.`);
}
try {
 await page.goto(url);await wait(()=>!!window.quietHouse);await page.locator('#game').click();
 assert.equal((await snap()).room,'hall');assert.equal(await page.locator('#light-button').count(),0);
 assert.equal(await page.getByRole('button',{name:'Начать ночь заново'}).count(),0);
 const first=arrangement(await snap());await page.reload();await wait(()=>!!window.quietHouse);assert.notDeepEqual(arrangement(await snap()),first);
 await page.locator('#game').click();
 const walkStart=(await snap()).x;await page.keyboard.down('KeyD');await page.waitForTimeout(400);await page.keyboard.up('KeyD');const walkDistance=(await snap()).x-walkStart;
 const runStart=(await snap()).x;await page.keyboard.down('ShiftLeft');await page.keyboard.down('KeyD');await page.waitForTimeout(400);await page.keyboard.up('KeyD');await page.keyboard.up('ShiftLeft');
 assert.ok((await snap()).x-runStart>walkDistance*1.6,'Shift runs faster');
 await faintOnDay(1);
 // Full inventory and drop/re-take with randomly placed items, no state injection.
 await lootItem('slipper');await lootItem('spray');
 const jar=(await snap()).objects.find(o=>o.item==='jar');await visit(jar);await open(jar.name);
 assert.equal(await page.locator('#loot button').filter({hasText:'Взять:'}).isDisabled(),true);await page.keyboard.press('KeyE');
 await page.keyboard.press('Digit1');await page.keyboard.press('KeyQ');assert.ok((await snap()).audio.counts.drop>0);await open('Тапок');await page.locator('#loot button').filter({hasText:'Взять:'}).click();assert.equal((await snap()).drops.length,0);
 await page.reload();await wait(()=>!!window.quietHouse);await page.locator('#game').click();
 await spendEvening(1);await faintOnDay(2);await spendEvening(2);
 await page.locator('#quest-notice').waitFor({state:'visible'});assert.equal((await snap()).notice.id,'go-out');
 await page.screenshot({path:'artifacts/day-3-house.png',fullPage:true});
 await goTo(387);await open('Выйти на улицу');assert.equal((await snap()).scene,'street');
 await page.screenshot({path:'artifacts/street-desktop.png',fullPage:true});
 await goTo(1240);await open('Хозтовары');assert.equal(await page.getByRole('button',{name:'Нужен совет соседа',exact:true}).count(),2);
 await page.getByRole('button',{name:'Выйти из магазина',exact:true}).click();
 for(const id of ['commuter','reader','runner','neighbor']){
  const p=(await snap()).pedestrians.find(p=>p.id===id);await goTo(p.x);
  const name={commuter:'Прохожий с портфелем',reader:'Женщина у скамейки',runner:'Бегун',neighbor:'Сосед с сумкой'}[id];
  await open(name);await page.locator('#dialogue-overlay').waitFor({state:'visible'});
  if(id==='commuter'){
   const index=(await snap()).dialogue.index;await page.keyboard.press('Escape');assert.equal((await snap()).paused,true);
   assert.equal((await snap()).dialogue.index,index);await page.getByRole('button',{name:'Вернуться на улицу',exact:true}).click();
  }
  let guard=0;while((await snap()).dialogue&&guard++<10)await page.locator('#dialogue-next').click();
  assert.ok((await snap()).talked.includes(id));
 }
 assert.equal((await snap()).talked.length,4);assert.match((await snap()).advice,/сетк/);
 await goTo(1240);await open('Хозтовары');assert.equal((await snap()).shop,true);
 await page.locator('#shop-pause').click();assert.equal((await snap()).paused,true);await page.getByRole('button',{name:'Вернуться на улицу',exact:true}).click();assert.equal((await snap()).shop,true);
 const beforeShop=(await snap()).money,xShop=(await snap()).x;await page.keyboard.down('KeyD');await page.waitForTimeout(250);await page.keyboard.up('KeyD');assert.equal((await snap()).x,xShop);
 await page.getByRole('button',{name:'Купить · 160 ₽',exact:true}).click();assert.equal((await snap()).money,beforeShop-160);
 await page.getByRole('button',{name:'Купить · 120 ₽',exact:true}).click();assert.equal((await snap()).money,beforeShop-280);assert.equal((await snap()).purchased.length,2);
 assert.equal(await page.getByRole('button',{name:'Куплено',exact:true}).count(),2);
 await page.setViewportSize({width:320,height:568});await page.screenshot({path:'artifacts/shop-mobile.png'});
 assert.equal(await page.locator('#close-shop').evaluate(b=>{const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;}),true);
 await page.keyboard.press('Escape');assert.equal((await snap()).shop,false);await page.setViewportSize({width:1366,height:900});
 await page.locator('#journal-button').click();await page.locator('#journal').waitFor({state:'visible'});
 await page.screenshot({path:'artifacts/street-advice.png',fullPage:true});await page.locator('#close-journal').click();
 // Mobile dialogue must stay accessible and not be covered by the diary or pause.
 await page.setViewportSize({width:390,height:844});
 const p=(await snap()).pedestrians.find(p=>p.id==='neighbor');await goTo(p.x);await open('Сосед с сумкой');
 await page.screenshot({path:'artifacts/street-mobile-dialogue.png',fullPage:true});
 assert.equal(await page.locator('#dialogue-next').evaluate(b=>{const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;}),true);
 while((await snap()).dialogue)await page.locator('#dialogue-next').click();
 await goTo(100);await open('Вернуться домой');assert.equal((await snap()).scene,'house');assert.ok((await snap()).advice);
 const left=page.getByRole('button',{name:'Идти влево',exact:true});await left.scrollIntoViewIfNeeded();const box=await left.boundingBox(),x=(await snap()).x;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(350);await page.mouse.up();assert.ok((await snap()).x<x-15);
 const run=page.getByRole('button',{name:'Бежать (удерживать)',exact:true});
 const runBox=await run.boundingBox();await page.mouse.move(runBox.x+runBox.width/2,runBox.y+runBox.height/2);await page.mouse.down();
 await page.keyboard.down('KeyA');await page.waitForTimeout(150);assert.equal((await snap()).running,true);
 await page.keyboard.up('KeyA');await page.mouse.up();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const safeInspection=(await snap()).objects.find(o=>!o.spider&&o.floor===0);await visit(safeInspection);await open(safeInspection.name);await page.screenshot({path:'artifacts/campaign-mobile-inspection.png',fullPage:true});
 assert.equal(await page.locator('#close-inspection').evaluate(b=>{const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;}),true);
 await page.getByRole('button',{name:'Закрыть осмотр'}).click();
 // Real installation after the earned purchases, with no injected game state.
 const sites=[{name:'Сетка · окно кухни',floor:0,x:267,kind:'mesh'},{name:'Сетка · окно спальни',floor:1,x:182,kind:'mesh'},{name:'Сетка · вентиляция',floor:1,x:801,kind:'mesh'},{name:'Герметик · щель у плинтуса',floor:0,x:535,kind:'sealant'},{name:'Герметик · ввод трубы',floor:0,x:148,kind:'sealant'}];
 for(const [index,site] of sites.entries()){
  await visit(site);await open('Установить: '+site.name);await page.locator('#installation-overlay').waitFor({state:'visible'});
  const frozen=await snap();await page.keyboard.down('KeyD');await page.waitForTimeout(120);await page.keyboard.up('KeyD');assert.equal((await snap()).x,frozen.x);assert.equal((await snap()).panic,frozen.panic);
  if(index===0){
   await page.locator('#installation-pause').click();assert.equal((await snap()).paused,true);await page.getByRole('button',{name:'Вернуться в дом',exact:true}).click();
   await page.keyboard.press('Escape');assert.equal((await snap()).installation,null);assert.equal((await snap()).installed.length,0);await open('Установить: '+site.name);
   await page.getByRole('button',{name:'Совместить сетку',exact:true}).click();assert.equal((await snap()).installed.length,0);assert.ok((await snap()).installation.mistakes>0);
  }
  for(const [width,height] of [[320,568],[667,375],[1366,900]]){
   await page.setViewportSize({width,height});await page.locator('#cancel-installation').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#cancel-installation').evaluate(b=>{const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;}),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:`artifacts/install-${site.kind}-${width}.png`});
  }
  if(site.kind==='mesh'){
   await page.locator('#installation-board').click({position:{x:8,y:8}});
   const offset=(await snap()).installation;
   for(let i=0;i<Math.abs(offset.offsetX);i++)await page.keyboard.press(offset.offsetX>0?'ArrowLeft':'ArrowRight');for(let i=0;i<Math.abs(offset.offsetY);i++)await page.keyboard.press(offset.offsetY>0?'ArrowUp':'ArrowDown');
   await page.getByRole('button',{name:'Совместить сетку',exact:true}).click();assert.equal((await snap()).installation.aligned,true);
   for(let i=1;i<=4;i++)await page.getByRole('button',{name:`Закрепить угол ${i}`,exact:true}).click();
  }else{
   await page.getByRole('button',{name:'Заделать участок 2',exact:true}).click();assert.equal((await snap()).installation.progress,0);
   for(let i=1;i<=8;i++)await page.getByRole('button',{name:`Заделать участок ${i}`,exact:true}).click();
  }
  assert.equal((await snap()).installation,null);assert.equal((await snap()).installed.length,index+1);assert.equal((await snap()).purchased.length,2);
 }
 assert.equal((await snap()).quest,'protected');assert.equal((await snap()).notice.id,'house-protected');await page.locator('#quest-notice').waitFor({state:'visible'});
 await page.screenshot({path:'artifacts/house-protected.png'});
 await page.locator('#journal-button').click();assert.match(await page.locator('#objective').innerText(),/Дом защищён/);assert.match(await page.locator('#supplies').innerText(),/3\/3 установлено/);assert.match(await page.locator('#supplies').innerText(),/2\/2 установлено/);await page.locator('#close-journal').click();
 const sound=(await snap()).audio;assert.equal(sound.state,'running');
 for(const cue of ['repair-step','repair-error','repair-done'])assert.ok(sound.counts[cue]>0,`repair sound ${cue}`);
 for(const cue of ['step','stair','search','spider','talk','money','purchase','pickup','hit','notice','faint','sleep'])assert.ok(sound.counts[cue]>0,`actual WebAudio cue: ${cue}`);
 const mute=page.getByRole('button',{name:'Выключить звук',exact:true});await mute.click();const silent=(await snap()).audio.counts;await page.keyboard.down('KeyD');await page.waitForTimeout(300);await page.keyboard.up('KeyD');assert.deepEqual((await snap()).audio.counts,silent);
 // Finish day three through actual searches, combat and the bed; no state injection.
 await page.getByRole('button',{name:'Включить звук',exact:true}).click();
 const third=await snap(),weapons=third.objects.filter(o=>o.item).map(o=>o.item);
 for(const [i,o] of third.objects.filter(o=>o.spider).entries()){
  await lootItem(weapons[i]);await visit(o);await open(o.name);
  await wait(()=>!window.quietHouse.snapshot().inspection&&!window.quietHouse.snapshot().recoil);
  await goTo((await snap()).spiders.find(p=>p.id===o.id).x);await use();assert.equal((await snap()).kills,i+1);
 }
 assert.equal((await snap()).transition,null);assert.equal((await snap()).ending,null);assert.equal((await snap()).notice.id,'final-sleep');
 await page.screenshot({path:'artifacts/final-sleep-notice.png'});
 const final=await snap();await visit({floor:1,x:218});await open('Лечь спать — закончить историю');
 assert.equal((await snap()).transition.kind,'ending');await page.locator('#credits-overlay').waitFor({state:'visible'});
 assert.equal(await page.locator('#credits-overlay section p').count(),6);
 assert.deepEqual(await page.locator('#credits-overlay section p').allTextContents(),['Beomelin','GPT 6.1 Sol (Mid and high effort)','GPT 6.1 Sol (Mid and high effort)','GPT 6.1 Sol (Mid and high effort)','GPT 6.1 Sol (Mid and high effort)','GPT 6.1 Sol и Beomelin']);
 assert.equal(await page.locator('.credits-signature').textContent(),'GPT 6.1 Sol и Beomelin');
 const ended=await snap();await page.keyboard.press('Escape');await page.keyboard.press('KeyJ');await page.keyboard.down('KeyD');await page.waitForTimeout(400);await page.keyboard.up('KeyD');
 assert.equal((await snap()).x,ended.x);assert.equal((await snap()).paused,false);assert.equal((await snap()).day,3);assert.equal((await snap()).money,final.money);assert.equal((await snap()).score,final.score);
 assert.equal((await snap()).audio.counts.ending,1);
 for(const [width,height] of [[1366,900],[320,568],[667,375]]){
  await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`artifacts/credits-${width}.png`});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#credits-overlay').evaluate(el=>el.scrollTop=el.scrollHeight);await page.getByText('Конец',{exact:true}).waitFor({state:'visible'});
 await page.getByText('Конец',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/credits-end.png'});
 console.log('PASS: day 3 cleanup, final bed interaction, exact credits, immutable terminal state, ending sound, desktop/mobile/landscape credits.');
 // Mute persistence is checked on a fresh run after the terminal overlay.
 await page.reload();await wait(()=>!!window.quietHouse);await page.getByRole('button',{name:'Выключить звук',exact:true}).click();
 await page.reload();await wait(()=>!!window.quietHouse);assert.equal((await snap()).audio.muted,true);await page.getByRole('button',{name:'Включить звук',exact:true}).click();await wait(()=>window.quietHouse.snapshot().audio.state==='running');
 assert.deepEqual(errors,[]);
 console.log('PASS: 10 random weapons on both evenings, last of 2/4 spiders unlocks sleep, six money caches each day, wallet carried across sleep, real shop purchases, Shift sprint, correct counts after fainting, all six rooms/stairs, automatic days 2/3, street, four dialogues, pause in dialogue, advice journal, return home, mobile controls/overlays; no JS, HTTP or request errors.');
} catch(error){console.error('Runtime state:',await snap());throw error;}finally{await browser.close();}
