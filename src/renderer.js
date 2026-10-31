import { createArt } from './art.js';
import { createStreetRenderer } from './street-art.js';
import { nearby } from './model.js';
import { drawProtection } from './protection-art.js';
import { ROOMS, WORLD } from './world.js';
import { ITEMS } from './objects.js';
import { drawSpider, drawItem } from './inspection-art.js';

export function createRenderer(canvas) {
  const ctx=canvas.getContext('2d');
  const backdrop=document.createElement('canvas');backdrop.width=960;backdrop.height=540;
  const bg=backdrop.getContext('2d');
  const art=createArt(bg),{r,line}=art;
  let camera={x:468,y:384,scale:3.35};
  // A cached, hand-drawn backdrop keeps every game frame to a handful of draws.
  function paintBackdrop() {
    r(0,0,960,540,'#233344');r(0,130,960,300,'#2c3e4d');
    r(0,375,960,165,'#283a3f');r(0,460,960,80,'#263533');
    for(let i=0;i<54;i++){let x=(i*173+23)%960,y=(i*37+11)%177;r(x,y,i%4===0?2:1,1,i%3?'#71818d':'#a3a9a2');}
    r(852,81,22,4,'#d6d5b5');r(847,85,30,14,'#d6d5b5');r(852,99,22,4,'#d6d5b5');r(860,81,15,15,'#233344');
    function tree(x,y,s) {
      r(x,y-116*s,5*s,126*s,'#1a2d32');
      for(let i=0;i<5;i++){const yy=y-145*s+i*22*s,w=(14+i*8)*s;r(x-w/2,yy,w,16*s,'#1b3036');r(x-w*.7,yy+11*s,w*1.4,12*s,'#1b3036');}
    }
    tree(45,451,1.1);tree(900,460,1.3);tree(939,434,.8);tree(14,418,.7);
    for(let x=0;x<960;x+=30){r(x,446,4,30,'#364441');r(x+2,444,1,2,'#4d5750');}r(0,454,960,3,'#3e4c46');r(0,468,960,3,'#3e4c46');
    r(85,473,790,8,'#17262c');r(100,469,759,7,'#1c282c');
    // Roof and chimney: stepped silhouettes rather than smoothed vector edges.
    r(728,71,28,62,'#3a3c40');r(725,67,34,7,'#62605a');
    for(let y=75;y<133;y+=8){line(729,y,754,y,'#515050');r(740+(y%16?0:8),y,1,8,'#242e35');}
    for(let y=88;y<156;y+=4){let inset=(156-y)*1.25;r(94+inset,y,772-inset*2,4,'#303f48');line(98+inset,y+1,862-inset,y+1,'#45505a');}
    for(let i=0;i<11;i++)line(188+i*58,91,110+i*72,154,'#26343e',2);
    r(99,154,762,7,'#596064');r(104,161,752,7,'#292e32');r(110,168,740,302,'#645c4e');
    r(117,172,726,277,'#342f2d');
    const rooms=[{x:122,y:174,w:225,h:120,c:'#73796b',trim:'#acaa88'},{x:353,y:174,w:229,h:120,c:'#847b63',trim:'#b8a47b'},{x:589,y:174,w:249,h:120,c:'#5b716b',trim:'#97a18a'},{x:122,y:311,w:225,h:138,c:'#8b8568',trim:'#bcb08b'},{x:353,y:311,w:229,h:138,c:'#8b795c',trim:'#b5a07b'},{x:589,y:311,w:249,h:138,c:'#6e7a68',trim:'#a7a88a'}];
    for(const room of rooms){
      r(room.x,room.y,room.w,room.h,room.c);
      for(let x=room.x+7;x<room.x+room.w;x+=12){r(x,room.y,1,room.h,'#bdb18a12');for(let y=room.y+8;y<room.y+room.h-16;y+=20){r(x+4,y,2,2,'#d3c59822');r(x+3,y+2,4,1,'#d3c59815');}}
      r(room.x,room.y,room.w,3,room.trim);r(room.x,room.y+room.h-7,room.w,7,'#5f513e');r(room.x,room.y+room.h-7,room.w,1,room.trim);
      r(room.x,room.y,room.w,10,'#00000015');r(room.x,room.y,7,room.h,'#0000000d');
    }
    // Floorboards are walkable foreground; furniture sits behind the walking lane.
    for(const y of [294,449]){r(119,y,722,14,'#a08761');r(119,y+1,722,2,'#c2a678');for(let x=120;x<840;x+=45){r(x,y+3,1,10,'#725c43');r(x+4,y+7,28,1,'#b3976a');r(x+22,y+10,16,1,'#8f7653');}r(116,y+14,728,5,'#4b4035');r(116,y+19,728,3,'#2f3030');}
    art.bedroom();art.landing();art.study();art.kitchen();art.hall();art.living();
    // Scratches, stitches, fittings and lived-in clutter remain crisp in the room camera.
    for(const [x,y,w,h] of [[183,410,143,29],[298,217,30,63],[565,411,13,26],[265,272,18,16],[680,274,17,15]]){
      for(let i=0;i<16;i++){const xx=x+2+(i*13)%(w-4),yy=y+2+(i*7)%(h-4);r(xx,yy,2+i%4,1,i%2?'#dbc29833':'#342b2944');}
    }
    for(let x=628;x<716;x+=5){r(x,427,2,1,'#bdc0a15c');r(x,436,2,1,'#1f393a66');}
    for(let x=189;x<251;x+=4)for(let y=266;y<282;y+=5)r(x,y,1,2,'#c9ded64a');
    r(291,393,6,7,'#c7baa0');r(291,393,5,1,'#e1d6bb');r(297,395,2,3,'#978b73');
    r(247,395,8,4,'#9d7754');r(249,393,6,2,'#d1ae77');r(305,435,9,4,'#4d503e');
    line(551,356,569,376,'#9d8b6b');r(552,363,4,5,'#bc9c73');
    for(let i=0;i<6;i++){r(626+i*3,263,1,2,'#898676');r(756+i*9,286,5,1,'#b3966b');}
    r(273,281,6,2,'#4e483e');r(274,280,4,1,'#cdb683');r(703,432,6,1,'#977e5b');
    // Partition returns above open doorways keep movement between rooms readable.
    for(const x of [347,582]){for(const y of [174,311]){r(x,y,7,67,'#4c473e');r(x-2,y,3,72,'#c0a67a');r(x+5,y,3,72,'#9c8663');}r(x,288,7,6,'#5c4e3b');r(x,443,7,6,'#5c4e3b');}
    // Diagonal staircase and a handrail, linking the actual walkable floor heights.
    for(let i=0;i<13;i++){const x=437+i*8.5,y=449-i*11.9;r(x,y-8,11,8,'#665340');r(x-2,y-10,15,3,'#b99b71');r(x+1,y-6,9,1,'#7b644a');}
    line(433,415,548,260,'#463f35',4);line(433,412,548,257,'#b3976a',3);
    for(let i=0;i<7;i++){const x=437+i*18,y=442-i*24;line(x,y,x,y-31,'#8c7454',2);r(x-1,y-33,4,3,'#c4a476');}
    r(547,257,4,37,'#b6986d');r(432,411,4,38,'#b6986d');r(430,409,8,4,'#d3b17d');r(545,255,8,4,'#d3b17d');
    // Cut edge and foundation.
    r(110,169,9,300,'#4c4841');r(112,169,3,300,'#887860');r(841,169,9,300,'#4c4841');r(841,169,3,300,'#a08a67');
    r(108,470,745,8,'#565750');r(116,478,729,8,'#3f4945');r(116,478,729,2,'#6b6a59');
    for(let x=120;x<840;x+=31){r(x,481,1,5,'#293b3b');}
    // Pendant lights and deliberately local pools of warm light.
    for(const [x,y] of [[218,174],[473,174],[712,174],[256,311],[475,311],[675,311]]){
      r(x,y,1,15,'#514a3d');r(x-8,y+15,17,3,'#706447');r(x-12,y+18,25,5,'#d4b377');r(x-9,y+23,19,2,'#f0d698');
      let glow=bg.createRadialGradient(x,y+30,0,x,y+43,86);glow.addColorStop(0,'#f0cb7e1a');glow.addColorStop(1,'#edc47700');bg.fillStyle=glow;bg.fillRect(x-90,y+20,180,100);
    }
    r(365,478,103,3,'#a19074');r(352,481,129,4,'#73776a');r(343,485,147,4,'#59645a');
    for(let i=0;i<100;i++){let x=(i*71)%960,y=489+(i*17)%51;r(x,y,2,1,i%2?'#3e4c40':'#1f302f');if(i%7===0)r(x,y-4,1,4,'#4d5b46');}
    art.plant(94,485);art.plant(871,484);
    const vignette=bg.createRadialGradient(480,296,190,480,296,530);vignette.addColorStop(0,'#0c192000');vignette.addColorStop(1,'#0c19204d');bg.fillStyle=vignette;bg.fillRect(0,0,960,540);
  }
  paintBackdrop();
  function character(state) {
    const a=createArt(ctx),{r}=a;const x=Math.round(state.x),y=Math.round(state.y);
    ctx.save();ctx.translate(x,y);
    if(state.transition?.kind==='faint'&&!state.transition.switched)ctx.rotate(-state.facing*Math.min(1,state.transition.elapsed/.9)*Math.PI/2);
    ctx.fillStyle='#15222170';ctx.beginPath();ctx.ellipse(0,1,12,3,0,0,Math.PI*2);ctx.fill();
    const step=state.moving?Math.sin(state.walk*2)*(state.running?5:3):0,bob=state.moving?Math.abs(Math.sin(state.walk*2))*(state.running?2:1):0;
    ctx.translate(0,-Math.round(bob));ctx.scale(state.facing,1);
    // Slippers, pyjama trousers, faded shirt, hunched shoulders, anxious eyes.
    r(-7,-15,6,12+Math.round(step),'#3d4e59');r(2,-15,6,12-Math.round(step),'#536371');
    r(-9,-4+Math.round(step),9,4,'#8b7863');r(1,-4-Math.round(step),10,4,'#aa9376');
    r(-9,-32,18,18,'#a47f59');r(-7,-31,13,16,'#c0a079');r(-8,-30,2,13,'#8b6b4f');r(-7,-16,15,3,'#7b6752');r(4,-30,3,15,'#d0b18b');
    r(-10,-29,5,15,'#a58763');r(-10,-16,5,5,'#c9a17b');
    r(-6,-47,15,15,'#3b3531');r(-8,-43,3,9,'#504338');r(-5,-43,16,11,'#d0aa82');r(8,-40,5,5,'#d9b58d');
    r(-5,-47,12,5,'#514235');r(-7,-44,4,9,'#514235');r(-4,-47,9,1,'#8b765d');r(-5,-35,4,4,'#c39772');r(1,-33,7,2,'#9d7559');
    r(6,-41,4,4,'#efe2c0');r(8,-40,2,3,'#28343a');r(5,-43,6,2,'#645043');r(7,-35,4,1,'#6c4e40');r(-5,-37,3,4,'#e0b991');
    r(7,-28,4,11,'#b89971');r(9,-20,6,4,'#dfb88b');
    r(-3,-29,8,1,'#e0bf94');r(-2,-26,1,2,'#735f4d');r(-2,-21,1,2,'#735f4d');
    const held=ITEMS[state.inventory[state.selected]];if(held){ctx.save();ctx.translate(14,state.attackTime>0?-30:-20);ctx.rotate(state.attackTime>0?-.8:.3);ctx.scale(.65,.65);drawItem(ctx,held.kind,0,0);ctx.restore();}
    ctx.restore();
  }
  const drawStreet=createStreetRenderer(ctx,character);
  function draw(state,dt=0) {
    ctx.imageSmoothingEnabled=false;
    const width=canvas.width,height=canvas.height;
    ctx.clearRect(0,0,width,height);
    if(state.scene==='street'){drawStreet(state,width,height);return;}
    const room=ROOMS.find(r=>r.id===state.room),top=room.floor===0?311:174;
    const blend=1-Math.exp(-Math.min(dt,.05)*7);
    // Fit a single room into the available scene, with square pixels at every aspect ratio.
    camera.scale=Math.min(width/(room.right-room.left+8),height/162);
    camera.x+=((room.left+room.right)/2-camera.x)*blend;
    camera.y+=(state.stairs?state.y-57:top+73)-camera.y;
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#11191f';ctx.fillRect(0,0,width,height);ctx.save();
    ctx.translate(width/2,height/2);ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.x,-camera.y);
    // The viewport never reveals another room, even while the camera eases across a doorway.
    ctx.beginPath();ctx.rect(room.left-2,state.stairs?camera.y-76:top-3,room.right-room.left+3,state.stairs?161:WORLD.floors[room.floor]-top+24);ctx.clip();
    ctx.drawImage(backdrop,0,0);
    if(state.day===3){ctx.fillStyle='#eedfa628';ctx.fillRect(room.left,top,room.right-room.left,WORLD.floors[room.floor]-top+18);}
    drawProtection(ctx,state);
    for(const p of state.spiders){if(p.floor!==state.floor)continue;drawSpider(ctx,p.x,WORLD.floors[p.floor]-3,1,p.phase,p.dead);}
    for(const d of state.drops){if(d.floor!==state.floor)continue;const item=ITEMS[d.item];drawItem(ctx,item.kind,d.x,WORLD.floors[d.floor]-9);}
    character(state);
    if(state.attackTime>0){ctx.strokeStyle='#ecd2a6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(state.x,state.y-20,27,-1,1);ctx.stroke();}
    for(const r of ROOMS){const t=r.floor===0?311:174;ctx.fillStyle=`rgba(0,0,0,${1-state.roomLight[r.id]})`;ctx.fillRect(r.left,t,r.right-r.left,WORLD.floors[r.floor]-t+18);}
    const obj=nearby(state);
    if(obj&&!state.paused){const x=obj.id==='stairs'?state.x:obj.x,y=state.y-60;ctx.fillStyle='#202b33';ctx.fillRect(Math.round(x)-6,y-8,12,12);ctx.fillStyle='#f0dfb6';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('E',Math.round(x),y+1);}
    ctx.restore();
  }
  return { draw };
}
