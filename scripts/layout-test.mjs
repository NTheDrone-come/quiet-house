import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
let playwright;
try { playwright=await import('playwright'); } catch {
 const cache=path.join(process.env.LOCALAPPDATA||'','npm-cache','_npx');
 const entry=fs.existsSync(cache)?fs.readdirSync(cache).map(d=>path.join(cache,d,'node_modules/playwright/index.mjs')).find(p=>fs.existsSync(p)):null;
 if(!entry)throw new Error('Playwright is not available.');
 playwright=await import(pathToFileURL(entry).href);
}
const edge=path.join(process.env['PROGRAMFILES(X86)']||'','Microsoft/Edge/Application/msedge.exe');
const browser=await playwright.chromium.launch({headless:true,...(fs.existsSync(edge)?{executablePath:edge}:{})});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('requestfailed',r=>errors.push(r.failure()?.errorText));
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
fs.mkdirSync('artifacts',{recursive:true});
const url=process.argv[2];if(!url)throw new Error('Pass preview URL');
async function usable(selector){
 const result=await page.locator(selector).evaluate(el=>{
  const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return r.width>0&&r.height>0&&r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&(el===hit||el.contains(hit));
 });assert.ok(result,`${selector} must fit and be reachable`);
}
try {
 for(const [width,height] of [[1366,768],[1920,1080],[2560,1080],[1024,768],[390,844],[320,568],[844,390],[667,375]]){
  await page.setViewportSize({width,height});await page.goto(url);await page.waitForFunction(()=>!!window.quietHouse);
  const box=await page.locator('.playfield').boundingBox();
  assert.ok(box.width>=width-2,'game fills viewport width');assert.ok(box.height>=height-2,'game fills viewport height');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),'no page scrolling');
  for(const sel of ['#inventory','.inventory-slot:nth-child(1)','.inventory-slot:nth-child(2)','#panic-meter','#pause-button','#fullscreen-button','#journal-button','#sound-button','#nearby-button'])await usable(sel);
  assert.equal(await page.locator('.playfield #inventory').count(),1);assert.equal(await page.locator('.playfield #panic-meter').count(),1);
  assert.equal(await page.locator('#inventory button').count(),2);
  const wallet=await page.locator('#wallet').boundingBox();assert.ok(wallet.x>=0&&wallet.y>=0&&wallet.x+wallet.width<=width&&wallet.y+wallet.height<=height,'wallet visible within viewport');
  const ratio=await page.locator('#game').evaluate(c=>{const r=c.getBoundingClientRect();return Math.abs(r.width/r.height-c.width/c.height);});assert.ok(ratio<.01,'canvas not stretched');
  if(width<=850){for(const sel of ['[data-hold="left"]','[data-hold="right"]','[data-hold="run"]','#touch-action','#attack-button','#drop-button'])await usable(sel);}
  await page.locator('#nearby-button').click();await page.locator('#nearby-objects button').first().click();
  await page.locator('#inspection-overlay').waitFor({state:'visible'});await usable('#close-inspection');
  if(!await page.locator('#close-inspection').isDisabled())await page.locator('#close-inspection').click();
  else await page.locator('#inspection-overlay').waitFor({state:'hidden'});
  await page.locator('#journal-button').click();await page.locator('#journal-overlay').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>window.quietHouse.snapshot().paused),true);await usable('#close-journal');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#journal-overlay').isVisible(),false);
  await page.locator('#pause-button').click();await usable('#resume-button');await page.locator('#resume-button').click();
  await page.screenshot({path:`artifacts/layout-${width}x${height}.png`});
 }
 await page.setViewportSize({width:1366,height:768});await page.goto(url);await page.waitForFunction(()=>!!window.quietHouse);
 await page.locator('#fullscreen-button').click();await page.waitForFunction(()=>!!document.fullscreenElement);
 assert.equal(await page.locator('#fullscreen-button').getAttribute('aria-pressed'),'true');await usable('#inventory');
 await page.locator('#fullscreen-button').click();await page.waitForFunction(()=>!document.fullscreenElement);
 const before=await page.evaluate(()=>window.quietHouse.snapshot().x);await page.locator('#game').click();await page.keyboard.down('KeyD');await page.waitForTimeout(350);await page.keyboard.up('KeyD');
 assert.ok((await page.evaluate(()=>window.quietHouse.snapshot().x))>before+15,'movement works after fullscreen');
 // A denied API request must not leave the HUD in a fake fullscreen state.
 await page.evaluate(()=>{document.querySelector('.game-shell').requestFullscreen=()=>Promise.reject(new DOMException('Denied','NotAllowedError'));});
 await page.locator('#fullscreen-button').click();await page.locator('#display-message').waitFor({state:'visible'});
 assert.equal(await page.locator('#fullscreen-button').getAttribute('aria-pressed'),'false');
 assert.deepEqual(errors,[]);
 console.log('PASS: 8 viewport sizes, full-width HUD, two slots, unstretched canvas, no scrolling, touch controls, inspection, journal pause/close, pause/resume, real fullscreen enter/exit, denied fullscreen, movement, no console/network errors.');
} finally {await browser.close();}
