import { createState as createRandomState } from '../src/model.js';
// Fixed arrangements only for isolated interaction regressions. Random generation has its own suite.
export function createState(){
 const s=createRandomState();
 const items={fridge:'jar',coat:'slipper','hall-cabinet':'spray','coffee-table':'newspaper',nightstand:'key',desk:'pencil','kitchen-cabinet':'flyswatter','kitchen-picture':'book','bed-picture':'brush','study-picture':'pan'};
 const spiders=new Set(['sink','sofa','wardrobe','landing-table','books']);
 for(const o of s.objects){o.item=items[o.id]||null;o.spider=spiders.has(o.id);delete o.money;}
 return s;
}
