import { createArt } from './art.js';
import { ITEMS } from './objects.js';
// Pixel drawings shared by close-ups, floor pickups and the two inventory slots.
export function drawItem(ctx,kind,x,y,s=1){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);const {r,line}=createArt(ctx);
 if(kind==='slipper'){r(-15,-4,29,12,'#312f31');r(-17,-8,34,10,'#8b6551');r(-13,-14,19,15,'#b9966c');r(-10,-12,12,7,'#463e39');r(-15,2,30,3,'#c2a275');for(let i=0;i<5;i++)r(-13+i*6,6,3,1,'#8b8a7b');}
 else if(kind==='spray'){r(-7,-17,14,28,'#9dada3');r(-6,-15,3,25,'#d0d2b5');r(-8,-9,16,14,'#7c604d');r(-3,-7,6,9,'#d4bf89');r(-5,-22,10,5,'#414b4b');r(-2,-25,7,4,'#c3bb9e');r(4,-24,4,2,'#5d6153');line(-4,8,5,8,'#505e59');}
 else if(kind==='paper'){r(-17,-12,34,24,'#c6bea0');r(-14,-9,13,4,'#666e65');for(let j=0;j<4;j++){r(-14,-2+j*3,12,1,'#8a8c79');r(2,-9+j*4,12,1,'#848775');}r(-17,10,34,3,'#928c75');}
 else if(kind==='jar'){r(-10,-14,20,4,'#b49d6b');r(-9,-10,18,23,'#8caaa3');r(-6,-8,3,18,'#d2d7bc');r(-5,6,10,5,'#7c9590');r(4,-8,2,14,'#a9c0b3');r(-8,13,16,2,'#425958');}
 else if(kind==='key'){r(-12,-8,10,10,'#bd9d57');r(-9,-5,4,4,'#504839');r(-3,-4,20,4,'#d6b96d');r(11,0,3,6,'#ad8848');r(16,-1,3,5,'#ad8848');}
 else if(kind==='pencil'){ctx.rotate(-.3);r(-23,-2,42,5,'#bd934f');r(-23,-2,5,5,'#a66b62');r(-14,-1,32,1,'#e4c68c');r(19,-2,6,5,'#d8c19b');r(25,0,3,1,'#343e3b');}
 else if(kind==='flyswatter'){r(-2,-1,4,20,'#ab8862');r(-12,-23,24,24,'#809b86');r(-9,-20,18,18,'#344f49');for(let i=0;i<4;i++){r(-9+i*5,-20,1,18,'#a5b5a0');r(-9,-20+i*5,18,1,'#a5b5a0');}r(-3,13,6,7,'#bd9b70');}
 else if(kind==='book'){r(-16,-20,31,36,'#4c625c');r(-12,-17,26,29,'#c4b694');r(-16,-20,5,36,'#8c6d51');r(-10,-20,25,4,'#718873');r(-10,12,25,4,'#718873');for(let i=0;i<4;i++)r(-9,-8+i*5,19,1,'#908570');r(-15,-15,3,4,'#c6ad78');}
 else if(kind==='brush'){r(-18,-8,36,9,'#a17f56');r(-15,-6,30,2,'#d0ae78');for(let i=0;i<9;i++){r(-17+i*4,1,3,12,'#c2b68d');r(-17+i*4,9,2,5,'#7d8b74');}r(-6,-15,12,7,'#715b43');}
 else if(kind==='cash'){r(-24,-12,48,27,'#596e53');r(-21,-10,42,21,'#a5b783');r(-18,-7,36,15,'#748e62');r(-8,-7,16,15,'#b8c491');ctx.fillStyle='#3c5c43';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('₽',0,4);r(14,5,11,9,'#c0a15f');r(16,6,7,2,'#e4ca89');}
 else if(kind==='mesh'){r(-23,-18,40,34,'#b8bbaa');r(-20,-15,34,28,'#456159');for(let i=0;i<7;i++){r(-20+i*5,-15,1,28,'#a5b5a0');r(-20,-15+i*4,34,1,'#a5b5a0');}r(16,-20,7,38,'#ddd1a7');r(18,-18,2,34,'#9ca88a');}
 else if(kind==='sealant'){r(-9,-17,18,31,'#b6bda4');r(-6,-13,12,21,'#698274');r(-4,-8,8,11,'#d4c38e');r(-7,14,14,3,'#d4c38e');r(-7,-21,14,4,'#536b61');r(-3,-30,6,10,'#d4c38e');r(-1,-35,3,7,'#d4c38e');}
 else if(kind==='pan'){r(-3,1,6,22,'#805b43');r(-2,4,2,15,'#bc9262');r(-16,-22,32,25,'#363e40');r(-12,-25,24,31,'#495657');r(-11,-19,22,19,'#202e32');r(-9,-17,18,2,'#738681');r(-11,-22,20,2,'#9ba498');}
 ctx.restore();
}
export function drawSpider(ctx,x,y,s=1,phase=0,dead=false){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(s,s);const {r,line}=createArt(ctx);
 for(let i=0;i<4;i++){const yy=-6+i*3,offset=dead?4:Math.sin(phase*12+i)*2;for(const sign of [-1,1]){line(sign*2,yy,sign*(8+i%2*2),yy-3+offset,'#27252a',1);line(sign*(8+i%2*2),yy-3+offset,sign*(12+i%2*2),yy+3+offset,'#27252a',1);}}
 r(-4,-8,8,9,dead?'#4c4037':'#342b2c');r(-3,-7,5,2,'#75604b');r(-3,1,6,5,'#29262a');if(!dead){r(-2,2,1,1,'#bda16e');r(1,2,1,1,'#bda16e');}ctx.restore();
}
function trinket(ctx,label,x,y,i){
 const {r,line}=createArt(ctx);const color=['#bcb593','#80958b','#ba9871'][i%3];
 if(/Шарф|Одеяло|Носок|Рубаш|Штора|Прихват|Тряп|Салфет/.test(label)){r(x-25,y-16,47,31,color);r(x-20,y-13,36,4,'#d5bea0');for(let n=0;n<6;n++)line(x-20+n*7,y-8,x-17+n*7,y+12,'#5e6f68',2);for(let n=0;n<8;n++)r(x-23+n*6,y+15,2,5,color);}
 else if(/тапок/.test(label)){drawItem(ctx,'slipper',x-12,y,1);drawItem(ctx,'slipper',x+15,y+9,.9);}
 else if(/Карман/.test(label)){r(x-23,y-20,46,38,'#4e5357');r(x-22,y-7,44,3,'#83816e');r(x-19,y-4,38,2,'#292e34');line(x-19,y,x-17,y+14,'#9a957d');line(x-17,y+14,x+17,y+14,'#9a957d');line(x+17,y+14,x+20,y,'#9a957d');}
 else if(/Труба/.test(label)){r(x-23,y-17,45,8,'#9da99c');r(x+14,y-17,9,32,'#748a81');r(x-11,y+6,33,9,'#8e9d90');r(x-16,y-2,9,17,'#9aa799');r(x-15,y-17,4,8,'#c6c6ab');r(x+13,y+2,12,4,'#c0c1a5');}
 else if(/Пульт/.test(label)){r(x-9,y-24,20,45,'#303b3b');r(x-5,y-19,4,3,'#ad7464');for(let row=0;row<4;row++)for(let col=0;col<3;col++)r(x-5+col*5,y-9+row*6,3,3,'#9ba598');}
 else if(/Губка|Щётка/.test(label)){r(x-25,y-6,50,17,'#9eaf79');r(x-25,y+7,50,5,'#516b5b');for(let n=0;n<20;n++)r(x-22+(n*13)%43,y-4+(n*3)%9,2,1,'#6d8057');}
 else if(/Ламп|Лампочка/.test(label)){r(x-8,y-22,16,8,'#d6bc81');r(x-13,y-14,26,22,'#eed49b');r(x-7,y+8,14,11,'#8b9181');for(let n=0;n<3;n++)r(x-7,y+9+n*3,14,1,'#c0b99a');line(x-5,y-3,x+5,y-3,'#9f946c');}
 else if(/Лимон/.test(label)){r(x-18,y-9,36,18,'#c7ae65');r(x-13,y-13,26,26,'#d8bb6c');r(x-22,y-3,44,6,'#c7ae65');r(x-8,y-9,9,3,'#f2d693');}
 else if(/Крошки|Пес|Пыль|Земля/.test(label)){for(let n=0;n<22;n++)r(x-24+(n*13)%48,y-13+(n*7)%28,2+n%3,2,['#b29d74','#75624c','#cfbb90'][n%3]);}
 else if(/Книг|том|Письм|Записк|Фото|Конверт|Блокнот|Квитан|бумаг|Заклад/.test(label)){r(x-20,y-13,40,27,color);r(x-17,y-10,34,21,'#d1c3a0');for(let n=0;n<4;n++)r(x-13,y-6+n*4,23-(n%2)*8,1,'#8c8873');}
 else if(/Чаш|Банк|Бутыл|Таблет|Молок/.test(label)){r(x-10,y-15,20,27,color);r(x-8,y-19,16,4,'#d8ca9c');r(x-7,y-11,3,20,'#dfd4b4');r(x-4,y-5,13,8,'#877b5c');}
 else if(/Тарел|Очки|Шестер|Ключ|Пугов|Камеш|Креп/.test(label)){r(x-17,y-7,34,14,'#665c48');r(x-14,y-10,28,16,color);r(x-9,y-6,18,8,'#837d65');r(x-4,y-4,8,4,'#cfbd90');}
 else if(/Лож|Вил|Шуруп|Гвозд|Ручк|Задвиж|Провод|Шнур/.test(label)){line(x-21,y+8,x+16,y-10,color,3);r(x+10,y-14,13,9,'#b8b69a');line(x-20,y+7,x+10,y-9,'#dad2af');}
 else if(/Лист|Земл|Череп|трав/.test(label)){r(x-21,y+4,42,7,'#635140');line(x-8,y+6,x+12,y-15,'#78845c',2);r(x-5,y-9,16,5,'#92a16c');r(x-14,y-2,12,5,'#657c58');}
 else {r(x-23,y-10,46,22,color);r(x-20,y-8,40,3,'#d3c19c');for(let n=0;n<5;n++)line(x-20+n*8,y-3,x-16+n*8,y+8,'#736d5a');}
}
export function drawInspection(canvas,obj,state){
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const {r,line}=createArt(ctx);ctx.clearRect(0,0,640,320);
 r(0,0,640,320,'#1e2528');r(20,18,600,285,'#514330');r(24,22,592,277,'#a5865e');r(30,28,580,265,'#362f29');
 const kind=obj.kind;
 if(kind==='coat'){
  r(45,40,550,232,'#4b4e50');for(let x=50;x<592;x+=9)r(x,42,2,228,'#71727128');r(298,42,18,230,'#32373c');r(316,42,5,230,'#8b8873');
  for(let y=64;y<260;y+=38){r(323,y,8,8,'#b3aa8a');r(325,y+2,3,3,'#51564f');}r(61,85,180,99,'#3c4247');r(67,90,168,5,'#9a9279');r(66,101,170,5,'#222c32');line(67,114,73,176,'#8b8d79');line(73,176,229,176,'#8b8d79');
 }else if(['drawer','cabinet','wood','table'].includes(kind)){
  r(47,42,546,226,'#654b33');for(let y=45;y<265;y+=13){line(49,y,590,y,'#846343');for(let n=0;n<6;n++)r(58+n*91+(y%5)*3,y+4,25,1,'#58402d');}
  r(43,263,554,23,'#b18a59');r(51,265,536,3,'#d2aa72');r(291,270,58,9,'#4b3d2d');r(297,271,46,3,'#c2a16b');
 }else if(['fridge','oven','sink'].includes(kind)){
  r(43,40,554,231,kind==='oven'?'#343b39':'#b3b6a2');r(54,47,532,216,kind==='sink'?'#697f77':'#849789');for(let y=107;y<275;y+=83){r(48,y,544,5,'#d6d2b4');r(49,y+5,542,5,'#4b605b');}for(let i=0;i<7;i++)r(59+i*6,51,2,53,'#6e8179');
 }else if(kind==='wardrobe'){
  r(45,40,550,232,'#43372c');r(57,64,526,5,'#b2a078');for(let i=0;i<5;i++){const x=104+i*97;line(x,67,x-17,81,'#9c9d86',2);line(x-17,81,x+17,81,'#9c9d86',2);line(x+17,81,x,67,'#9c9d86',2);r(x-29,84,58,114,['#78867a','#7e6b5c','#8d8064','#526c71','#a58d72'][i]);r(x-11,84,23,8,'#383a36');r(x-1,94,2,100,'#c0b89b');for(let y=103;y<188;y+=17)r(x+3,y,2,2,'#504e43');}r(46,214,548,8,'#ac8758');r(473,230,72,28,'#a88b62');r(477,233,64,3,'#c4ab7d');
 }else if(kind==='books'){
  r(45,40,550,230,'#43372c');for(let row=0;row<2;row++){for(let i=0;i<18;i++){const h=42+(i*13)%36,x=53+i*30,y=123+row*122;r(x,y-h,23,h,['#7f6952','#768676','#a18c61','#536b72'][i%4]);r(x+3,y-h+7,17,2,'#c1b18a');}r(46,123+row*122,548,8,'#ac8758');}
 }else if(kind==='rug'){
  r(44,40,552,232,'#836653');r(58,52,524,208,'#c0a77e');r(69,63,502,186,'#6e7763');for(let x=82;x<566;x+=30)for(let y=73;y<246;y+=25){r(x,y,16,3,'#ad9773');r(x+6,y-6,3,15,'#ad9773');}for(let y=43;y<270;y+=7){r(34,y,15,2,'#c7b38e');r(590,y,17,2,'#c7b38e');}
 }else if(['sofa','bed'].includes(kind)){
  r(44,40,552,232,kind==='rug'?'#8b6556':'#677b6c');for(let x=51;x<595;x+=12)for(let y=46;y<272;y+=10)r(x,y,4,2,'#b5b09122');
  r(61,55,244,194,'#7d8b74');r(332,55,244,194,'#70806c');r(305,41,25,230,'#2d3832');for(let y=62;y<241;y+=8){r(64,y,1,4,'#c2be93');r(569,y,1,4,'#adaf8c');}
 }else if(kind==='window'){
  r(43,40,554,234,'#304553');for(let i=0;i<35;i++)r(55+(i*71)%530,44+(i*31)%210,1,6,'#6e929c');r(311,40,15,234,'#b1a27e');r(43,153,554,10,'#ad9a71');r(60,263,520,8,'#c3b18b');
 }else if(kind==='clock'){
  r(45,40,550,234,'#675137');for(let i=0;i<8;i++){const x=80+i*67,y=70+(i%3)*42;r(x-15,y-15,30,30,'#a78b53');r(x-10,y-10,20,20,'#4a4333');r(x-3,y-22,6,44,'#c6a466');r(x-22,y-3,44,6,'#c6a466');}r(315,155,5,91,'#caaf70');r(300,235,36,20,'#b29354');
 }else if(kind==='picture'){
  r(44,40,552,234,'#918469');for(let y=48;y<271;y+=7)line(49,y,590,y,'#9f9277');r(76,60,488,4,'#c8b797');line(100,60,320,42,'#454e49');line(320,42,540,60,'#454e49');
 }else if(kind==='lamp'){
  r(44,40,552,234,'#7b6b4d');r(167,60,310,131,'#c3af80');r(196,79,252,94,'#e0c997');for(let x=180;x<470;x+=15)r(x,60,2,131,'#9d885b');r(309,187,22,61,'#817354');r(255,249,130,9,'#a08d60');
 }else if(kind==='plant'){
  r(44,40,552,234,'#4d4332');for(let i=0;i<160;i++)r(49+(i*71)%537,50+(i*37)%214,3,2,['#766042','#938062','#38382c'][i%3]);line(318,244,322,48,'#657950',6);for(let i=0;i<7;i++){const side=i%2?1:-1;r(320+(side<0?-110:0),60+i*24,110,15,'#78945f');r(320+(side<0?-93:7),60+i*24,85,4,'#a1ae75');}
 }else{r(44,40,552,234,'#9d987d');for(let y=46;y<270;y+=5)line(49,y,590,y,'#aaa58a');}
 // Unique surface wear for each object rather than random flicker.
 const seed=[...obj.id].reduce((a,c)=>a+c.charCodeAt(0),0);for(let i=0;i<40;i++)r(47+(i*71+seed)%540,45+(i*37+seed)%222,i%3+1,1,'#dfc79b25');
 obj.contents.forEach((label,i)=>{const x=143+i*177,y=128+(i%2)*39;trinket(ctx,label,x,y,i);ctx.fillStyle='#e8dcc0';ctx.font='12px Trebuchet MS';ctx.textAlign='center';ctx.fillText(label,x,239);});
 if(obj.item&&!state.taken.has(obj.id))drawItem(ctx,ITEMS[obj.item].kind,487,188,1.5);
 if(obj.money&&!state.moneyTaken.has(obj.id))drawItem(ctx,'cash',440,183,1.8);
 if(state.inspection?.spider)drawSpider(ctx,356,181,2.4,state.inspection.elapsed*2);
 r(0,0,640,6,'#121b20');r(0,314,640,6,'#121b20');
}
