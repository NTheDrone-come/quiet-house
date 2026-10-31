import { createArt } from './art.js';
import { nearby } from './model.js';
export function createStreetRenderer(ctx,character){
 const layer=document.createElement('canvas');layer.width=1800;layer.height=540;
 const b=layer.getContext('2d'),{r,line}=createArt(b);
 r(0,0,1800,540,'#a8c3c0');r(0,176,1800,110,'#b2c4b7');
 for(let i=0;i<14;i++){const x=i*143+20,y=115+i%3*18;r(x,y,56,9,'#d4d8c4');r(x+9,y-6,35,8,'#d4d8c4');}
 r(1595,81,28,28,'#e6d9a6');r(1590,89,38,12,'#e6d9a6');
 // Far roofs, chimneys and the repeating rhythm of an old residential street.
 for(let i=0;i<11;i++){const x=i*180-30,y=215+(i%3)*11;r(x,y,158,140,'#8eaaa4');r(x+15,y-15,123,15,'#7f9996');r(x+90,y-27,12,17,'#839b95');for(let j=0;j<4;j++)r(x+18+j*33,y+25,14,23,'#a8bdb0');}
 for(const [x,w,c,roof] of [[5,214,'#8e8b70','#565e59'],[260,220,'#c1ad89','#766c60'],[540,232,'#a5ae9b','#596c67'],[850,232,'#baa58c','#79695d'],[1150,215,'#aab2a0','#667870'],[1460,248,'#b9a483','#7a6b5c']]){
  r(x,237,w,167,c);for(let i=0;i<9;i++)r(x+10+i*8,237-i*5,w-20-i*16,5,roof);
  r(x-5,233,w+10,7,roof);r(x,398,w,6,'#727561');r(x+10,242,3,156,'#e2c9a04d');
  for(let j=0;j<3;j++){const wx=x+25+j*60;r(wx-4,267,36,55,'#ded0ad');r(wx,271,28,47,'#586f72');r(wx+13,271,3,47,'#c2bea3');r(wx,294,28,3,'#c2bea3');r(wx-7,322,42,4,'#e0c8a0');r(wx+2,274,6,18,'#9fb3b0');}
  const dx=x+80;r(dx-5,342,42,62,'#dfc6a0');r(dx,346,32,58,'#596965');r(dx+5,351,22,22,'#8a9f93');r(dx+24,380,3,3,'#d4b573');r(dx-8,403,48,5,'#8f8d76');
  for(let k=0;k<16;k++){r(x+12+k*12,389-(k%3)*3,6,1,'#716f5e55');}
 }
 // The player's door is recognisable from the pavement.
 r(77,342,42,62,'#d7bd91');r(82,347,32,57,'#6e6652');r(86,351,24,20,'#a3b7aa');r(105,381,3,3,'#e2c18d');
 b.fillStyle='#eee0ba';b.font='9px monospace';b.fillText('ДОМ',85,338);
 r(0,410,1800,40,'#a9a58d');r(0,411,1800,3,'#d6ccb0');for(let x=0;x<1800;x+=43){line(x,414,x-12,448,'#908f7e');r(x+5,433,32,1,'#bdb69c');}
 r(0,450,1800,9,'#d0c8ab');r(0,459,1800,81,'#75817c');r(0,459,1800,3,'#5e716c');for(let x=0;x<1800;x+=110)r(x,501,59,3,'#c1bc9c');
 for(const x of [225,800,1330,1745]){r(x,244,7,168,'#485c56');r(x-9,239,25,7,'#53675d');r(x-7,222,21,17,'#c5c8ab');r(x-10,218,27,4,'#52675d');r(x-5,224,3,13,'#e4d9ac');r(x-6,407,19,6,'#637165');}
 for(const x of [510,1130,1650]){r(x,329,9,81,'#6d7861');r(x-3,325,13,12,'#6d7861');for(let j=0;j<7;j++){const xx=x-35+j*12,yy=284+(j%3)*12;r(xx,yy,24,37,j%2?'#789478':'#8ca17e');r(xx+3,yy,16,3,'#a2b58b');}r(x-18,405,47,5,'#7e876b');}
 for(const x of [650,1210]){r(x,384,91,5,'#8e795d');r(x,392,91,5,'#aa9270');r(x+2,403,88,5,'#8b7659');r(x+8,408,5,21,'#586557');r(x+74,408,5,21,'#586557');r(x+6,388,4,15,'#647060');r(x+79,388,4,15,'#647060');}
 for(const x of [460,1390]){r(x,400,19,29,'#697b6e');r(x-2,399,23,4,'#8b9a80');for(let j=0;j<4;j++)r(x+3+j*4,406,1,20,'#4c665b');}
 for(let i=0;i<80;i++){const x=(i*127)%1800,y=418+i%28;r(x,y,2,1,i%2?'#c7bd9e':'#838c73');}
 // A small hardware shop, with mesh rolls and sealant visible behind the glass.
 r(1180,249,157,21,'#344e42');r(1182,251,153,2,'#a4b08b');b.fillStyle='#e7d3a1';b.font='12px monospace';b.textAlign='center';b.fillText('ХОЗТОВАРЫ',1258,265);b.textAlign='start';
 r(1174,279,67,65,'#d1bf99');r(1178,283,59,57,'#3f625b');for(let i=0;i<4;i++){r(1182+i*12,288,8,35,'#9cab91');for(let j=0;j<6;j++)r(1183+i*12,290+j*5,6,1,'#567b69');}r(1182,329,48,4,'#aa9470');
 r(1251,279,67,65,'#d1bf99');r(1255,283,59,57,'#3f625b');for(let i=0;i<4;i++){r(1261+i*12,302,7,24,'#c1c4a4');r(1263+i*12,295,3,8,'#d7c69b');r(1262+i*12,308,5,12,'#7b9277');}
 function person(p){
  const {r}=createArt(ctx);ctx.save();ctx.translate(Math.round(p.x),449);ctx.scale(p.direction,1);
  const step=Math.sin(p.walk*2)*2;r(-9,0,21,2,'#516b5966');r(-6,-17,5,17+step,'#485d62');r(2,-17,5,17-step,'#526b70');r(-8,-3+step,8,3,'#4d5046');r(2,-3-step,8,3,'#4d5046');r(-8,-34,17,19,p.color);r(-10,-31,4,17,p.color);r(8,-31,4,14,p.color);r(8,-18,4,4,'#d9b690');r(-5,-47,14,14,'#c9ab87');r(-6,-48,14,5,p.hair);r(-7,-44,3,10,p.hair);r(5,-40,2,2,'#354640');r(8,-39,3,3,'#d8b994');
  if(p.id==='commuter'){r(9,-15,13,11,'#6a5848');r(12,-18,7,3,'#6a5848');}if(p.id==='neighbor'){r(-15,-18,11,18,'#c0ac85');r(-13,-22,7,4,'#786f58');}if(p.id==='reader')r(5,-24,15,10,'#ddd0a7');ctx.restore();
 }
 return (state,width=960,height=540)=>{
  const scale=Math.max(width/960,height/540)*1.8,half=width/scale/2,camera=Math.max(half,Math.min(1800-half,state.x));ctx.save();ctx.translate(width/2,height/2);ctx.scale(scale,scale);ctx.translate(-camera,-325);ctx.drawImage(layer,0,0);
  state.pedestrians.forEach(person);character(state);
  const obj=nearby(state);if(obj){ctx.fillStyle='#253d38';ctx.fillRect(obj.x-7,381,14,14);ctx.fillStyle='#eee2be';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('E',obj.x,392);}
  ctx.restore();
 };
}
