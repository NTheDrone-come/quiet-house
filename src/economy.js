// Fictional in-game currency and prices; supplies are stored separately from the two hands.
export const SHOP={x:1240,name:'Хозтовары · сетки и герметик'};
export const PROTECTION={
 mesh:{name:'Мелкая сетка',price:160,description:'Для окон и вентиляции: перекрыть пути из совета соседа.',kind:'mesh'},
 sealant:{name:'Герметик',price:120,description:'Для щелей у плинтусов и вокруг труб.',kind:'sealant'},
};
export function buyProtection(s,id){
 const item=PROTECTION[id];
 if(!item||!s.shop||s.paused||s.transition||s.dialogue||s.scene!=='street'||Math.abs(s.x-SHOP.x)>62)return false;
 if(!s.advice){s.thought='Сначала стоит узнать у соседа, какая защита нужна.';return false;}
 if(s.purchased.has(id)){s.thought='Это уже куплено. Второй комплект не нужен.';return false;}
 if(s.money<item.price){s.thought=`Не хватает ${item.price-s.money} ₽. Можно поискать деньги в доме.`;return false;}
 s.money-=item.price;s.purchased.add(id);s.thought=`Куплено: ${item.name}. Припасы записаны в дневник.`;
 if(s.purchased.size===Object.keys(PROTECTION).length){s.quest='supplies-bought';s.thought='Сетка и герметик куплены. Вернись домой и установи защиту: точки отмечены в дневнике.';}
 return true;
}
