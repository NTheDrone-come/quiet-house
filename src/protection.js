// Fixed repair targets are separate from the 24 randomized hiding places.
// One purchased kit covers all targets of its kind. Only finished work is saved in this attempt.
export const PROTECTION_SITES=[
 {id:'install-kitchen-window',kind:'mesh',name:'Сетка · окно кухни',room:'kitchen',floor:0,x:267,rect:[244,341,46,49]},
 {id:'install-bedroom-window',kind:'mesh',name:'Сетка · окно спальни',room:'bedroom',floor:1,x:182,rect:[161,185,42,55]},
 {id:'install-vent',kind:'mesh',name:'Сетка · вентиляция',room:'study',floor:1,x:801,rect:[787,193,27,27]},
 {id:'install-baseboard',kind:'sealant',name:'Герметик · щель у плинтуса',room:'hall',floor:0,x:535,rect:[516,436,40,6]},
 {id:'install-pipe',kind:'sealant',name:'Герметик · ввод трубы',room:'kitchen',floor:0,x:148,rect:[137,421,20,18]},
];
export const SEAL_PATH=[[13,54],[23,48],[33,57],[43,46],[53,51],[63,42],[73,48],[85,40]];
export const protectionComplete=s=>PROTECTION_SITES.every(o=>s.installed.has(o.id));
export function protectionObjective(s){
 if(protectionComplete(s))return 'Дом защищён: сетки закреплены, щели заделаны. Найди и уничтожь всех оставшихся пауков, включая скрытых. Затем поднимись в спальню и ляг спать у кровати — это завершит историю.';
 const left=PROTECTION_SITES.filter(o=>!s.installed.has(o.id));
 return `Установлено ${s.installed.size} / ${PROTECTION_SITES.length}. ${left.map(o=>o.name).join('; ')}. Вернись домой, подойди к точке и нажми E. Один комплект материала покрывает все его точки.`;
}
export function installationObjects(s){
 if(s.day!==3||!s.advice||s.scene!=='house')return [];
 return PROTECTION_SITES.filter(o=>o.room===s.room&&!s.installed.has(o.id)).map(o=>({...o,name:`${s.purchased.has(o.kind)?'Установить':'Нужно купить'}: ${o.name}`}));
}
export function startInstallation(s,id){
 const site=PROTECTION_SITES.find(o=>o.id===id);
 if(!site||s.day!==3||!s.advice||s.scene!=='house'||s.floor!==site.floor||s.room!==site.room||Math.abs(s.x-site.x)>62||s.paused||s.transition||s.dialogue||s.shop||s.inspection||s.stairs||s.recoil||s.installation||s.installed.has(id))return false;
 if(!s.purchased.has(site.kind)){s.thought='Сначала купи нужный материал в «Хозтоварах» на улице.';return false;}
 s.installation={id,kind:site.kind,offsetX:3,offsetY:-2,aligned:false,progress:0,mistakes:0,message:site.kind==='mesh'?'Совмести край сетки с рамой стрелками.':'Начни с первой подсвеченной точки щели.'};
 s.moving=false;s.running=false;return true;
}
const active=(s,kind)=>s.installation?.kind===kind&&!s.paused&&!s.transition;
export function cancelInstallation(s){if(!s.installation||s.paused||s.transition)return false;s.installation=null;s.thought='Материал сохранён. Можно вернуться к установке позже.';return true;}
export function moveMesh(s,dx,dy){
 if(!active(s,'mesh')||s.installation.aligned||![dx,dy].every(Number.isFinite))return false;
 const g=s.installation;g.offsetX=Math.max(-5,Math.min(5,g.offsetX+Math.round(dx)));g.offsetY=Math.max(-4,Math.min(4,g.offsetY+Math.round(dy)));g.message='Края должны точно совпасть с рамой.';return true;
}
function wrong(g,text){g.mistakes++;g.message=text;return false;}
export function confirmMesh(s){
 if(!active(s,'mesh')||s.installation.aligned)return false;const g=s.installation;
 if(g.offsetX||g.offsetY)return wrong(g,'Пока неровно. Подвинь сетку стрелками и попробуй ещё раз.');
 g.aligned=true;g.message='Теперь закрепи четыре угла по порядку, начиная с первого.';return true;
}
function finish(s){
 const site=PROTECTION_SITES.find(o=>o.id===s.installation.id);s.installed.add(site.id);s.installation=null;
 s.quest=protectionComplete(s)?'protected':'install-protection';s.thought=protectionComplete(s)?'Готово. Сетки стоят, щели заделаны. Новые пути в дом закрыты.':'Готово: '+site.name+'. Остальные точки отмечены в дневнике.';
}
export function fastenMesh(s,index){
 if(!active(s,'mesh')||!s.installation.aligned)return false;const g=s.installation;
 if(index!==g.progress)return wrong(g,'Сначала подсвеченный угол. Крепления идут по порядку.');
 g.progress++;g.message='Крепление держится. Закрепи следующий угол.';if(g.progress===4)finish(s);return true;
}
export function sealPoint(s,index){
 if(!active(s,'sealant'))return false;const g=s.installation;
 if(index!==g.progress)return wrong(g,'Не оставляй разрывов: продолжи с подсвеченной точки.');
 g.progress++;g.message='Шов ровный. Продолжай вдоль щели.';if(g.progress===SEAL_PATH.length)finish(s);return true;
}
