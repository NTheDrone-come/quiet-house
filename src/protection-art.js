import {PROTECTION_SITES} from './protection.js';
export function drawProtection(ctx,s){
 if(s.day!==3||!s.advice)return;
 ctx.save();
 for(const site of PROTECTION_SITES){
  if(site.room!==s.room)continue;
  const [x,y,w,h]=site.rect,done=s.installed.has(site.id);
  if(site.kind==='mesh'){
   if(site.id==='install-vent'){
    ctx.fillStyle='#263c3d';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#a6a088';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
    ctx.fillStyle='#828c7e';for(let yy=y+5;yy<y+h-3;yy+=5)ctx.fillRect(x+4,yy,w-8,2);
   }
   if(done){
    ctx.fillStyle='#b4c2a980';for(let xx=x+3;xx<x+w-2;xx+=3)ctx.fillRect(xx,y+3,1,h-6);for(let yy=y+3;yy<y+h-2;yy+=3)ctx.fillRect(x+3,yy,w-6,1);
    ctx.fillStyle='#d7be8a';for(const [xx,yy] of [[x,y],[x+w-3,y],[x+w-3,y+h-3],[x,y+h-3]])ctx.fillRect(xx,yy,3,3);
   }
  }else{
   if(site.id==='install-pipe'){ctx.fillStyle='#87958b';ctx.fillRect(x+6,y-14,6,h+14);ctx.fillStyle='#aab4a0';ctx.fillRect(x+6,y-14,2,h+14);}
   ctx.strokeStyle=done?'#d7c7a1':'#30352d';ctx.lineWidth=done?3:2;ctx.beginPath();ctx.moveTo(x,y+h/2);for(let i=1;i<=6;i++)ctx.lineTo(x+w*i/6,y+h/2+(i%2?2:-2));ctx.stroke();
  }
  if(!done){ctx.strokeStyle='#d9b578';ctx.lineWidth=1;ctx.setLineDash([3,2]);ctx.strokeRect(x-3,y-3,w+6,h+6);ctx.setLineDash([]);}
 }
 ctx.restore();
}
