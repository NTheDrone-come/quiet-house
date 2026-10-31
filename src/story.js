import { SHOP } from './economy.js';
// Street coordinates are independent of the house; all conversations are local fiction.
export const STREET={left:55,right:1740,floor:449,speed:92,door:100};
export const PEOPLE=[
 {id:'commuter',name:'Прохожий с портфелем',x:345,left:280,right:430,speed:11,color:'#766751',hair:'#483f37',lines:[['Ты','Простите… у вас дома не стало больше пауков?'],['Прохожий','Пауков? Я опаздываю на работу. Может, вам просто стоит выспаться?'],['Ты','Да. Конечно. Простите.']]},
 {id:'reader',name:'Женщина у скамейки',x:700,left:650,right:760,speed:-7,color:'#8c6571',hair:'#aea18c',lines:[['Ты','Можно спросить? Каждую ночь нахожу пауков. Всё больше и больше.'],['Женщина','А вы специально их ищете? Странное у вас занятие. Я бы лучше окна помыла.'],['Ты','Кажется, меня не понимают.']]},
 {id:'runner',name:'Бегун',x:1030,left:950,right:1130,speed:18,color:'#648e86',hair:'#544333',lines:[['Ты','У вас тоже пауки в каждом углу?'],['Бегун','В каждом? Нет. Вы в порядке? Подышите свежим воздухом, правда помогает.'],['Ты','Воздух хороший. Только домой всё равно возвращаться.']]},
 {id:'neighbor',name:'Сосед с сумкой',x:1450,left:1370,right:1530,speed:-8,color:'#667b93',hair:'#b6ac96',lines:[['Ты','Извините… У меня в доме стало слишком много пауков. Уже третью ночь. Откуда они?'],['Сосед','Погоди. Ты из старого дома? Я думал, это только у меня было. Они лезли из щелей у подвала и вентиляции.'],['Ты','Значит, я не схожу с ума? Как вы от них избавились?'],['Сосед','Поставь мелкую сетку на окна и вентиляцию. Заделай щели у плинтусов и вокруг труб. Убери паутину и сырость в подвале — там они прячутся.'],['Ты','Сетки, щели, подвал… Теперь хотя бы понятно, с чего начать.'],['Сосед','Осмотри дом при дневном свете. Если их снова будет так много, зови специалиста. Одними тапками это не решить.']]},
];
export const ADVICE='Сосед тоже сталкивался с нашествием. Проверить подвал и вентиляцию; поставить мелкую сетку на окна и вентиляцию, заделать щели у плинтусов и труб, убрать паутину и сырость. Если не поможет — вызвать специалиста. Сетку и герметик можно купить в «Хозтоварах» на улице. Вернись домой: закрепи сетку на окнах кухни и спальни, на вентиляции кабинета; заделай щель у плинтуса в прихожей и ввод трубы на кухне.';
export const createPedestrians=()=>PEOPLE.map(p=>({...p,direction:Math.sign(p.speed),walk:0}));
export function streetObjects(s){return [{id:'home',name:'Вернуться домой',x:STREET.door},{id:'shop',name:SHOP.name,x:SHOP.x},...s.pedestrians.map(p=>({id:p.id,name:`Поговорить: ${p.name}`,x:p.x}))];}
export function interactStreet(s,id){
 const obj=streetObjects(s).find(o=>o.id===id&&Math.abs(o.x-s.x)<=62);if(!obj)return false;
 if(id==='home'){s.scene='house';s.x=387;s.y=449;s.floor=0;s.room='hall';s.thought='Дневной свет делает дом тише. Но вопросы остались.';return true;}
 if(id==='shop'){s.shop=true;s.moving=false;s.running=false;s.thought=s.advice?'Здесь есть мелкая сетка и герметик из совета соседа.':'Что именно нужно купить? Сначала расспрошу соседа.';return true;}
 s.dialogue={id,index:0};s.moving=false;s.running=false;return true;
}
export function advanceDialogue(s){
 if(s.paused||s.transition||!s.dialogue)return false;
 const p=PEOPLE.find(p=>p.id===s.dialogue.id);
 if(++s.dialogue.index<p.lines.length)return true;
 s.talked.add(p.id);s.dialogue=null;
 if(p.id==='neighbor'){s.advice=ADVICE;s.quest=s.purchased.size===2?'supplies-bought':'advice-found';s.thought='Не только у меня. Нужно проверить щели и подвал. Совет соседа записан в дневник.';}
 else s.thought='Кажется, он считает меня странным. Попробую спросить кого-нибудь ещё.';
 return true;
}
export function updateStreet(s,input,dt){
 if(s.dialogue||s.shop){s.moving=false;s.running=false;return;}
 const dir=Number(!!input.right)-Number(!!input.left),before=s.x;
 s.x=Math.max(STREET.left,Math.min(STREET.right,s.x+dir*STREET.speed*(input.run?2:1)*dt));s.moving=s.x!==before;s.running=s.moving&&!!input.run;
 if(dir)s.facing=dir;if(s.moving)s.walk+=dt*(s.running?15:9);
 for(const p of s.pedestrians){p.x+=Math.abs(p.speed)*p.direction*dt;p.walk+=dt*5;if(p.x<p.left){p.x=p.left;p.direction=1;}if(p.x>p.right){p.x=p.right;p.direction=-1;}}
}
