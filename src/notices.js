import {protectionComplete} from './protection.js';
import {finalReady} from './progression.js';
// Quest notices are derived from progress, not transient room/inspection thoughts.
export function questNotice(s){
 if(s.ending||s.transition?.kind==='ending')return null;
 if(finalReady(s))return {id:'final-sleep',title:'Наконец-то можно спать',text:'Все пять точек защищены, все пауки уничтожены. Поднимись в спальню и нажми E у кровати — пора закончить эту историю.',icon:'☾'};
 if(s.day<3&&s.quest==='sleep')return {id:`sleep-${s.day}`,title:'Можно идти спать',text:'Все пауки уничтожены. Поднимись на второй этаж, зайди в спальню и нажми E у кровати. До сна можно поискать деньги.',icon:'☾'};
 if(s.day===3&&!s.advice&&s.scene==='house')return {id:'go-out',title:'Откуда столько пауков?',text:'Нужно спросить соседей. Выйди на улицу через дверь в прихожей на первом этаже.',icon:'!'};
 if(s.day===3&&s.advice&&s.purchased.size<2)return {id:'buy-supplies',title:'Сосед подсказал, что делать',text:'Загляни в «Хозтовары» на улице: нужны мелкая сетка и герметик. Если денег не хватает — поищи их дома.',icon:'!'};
 if(protectionComplete(s))return {id:'house-protected',title:'Дом защищён',text:'Сетки закреплены, щели заделаны. Пути проникновения закрыты. Уже спрятавшихся пауков защита не уничтожает.',icon:'✓'};
 if(s.purchased.size===2)return {id:`install-${s.installed.size}`,title:'Пора защитить дом',text:`Установлено ${s.installed.size} / 5. Вернись домой: сетка — окна кухни и спальни, вентиляция кабинета; герметик — плинтус прихожей и труба кухни. Подойди и нажми E.`,icon:'!'};
 return null;
}
