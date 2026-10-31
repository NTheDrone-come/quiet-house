export const WORLD = { width: 960, height: 540, left: 124, right: 836, floors: [449, 294], speed: 92 };
export const STAIR = { bottomX: 438, topX: 548, bottomY: 449, topY: 294, duration: 1.8, range: 25 };
export const ROOMS = [
  { id: 'kitchen', name: 'Кухня', floor: 0, left: 124, right: 350, thought: '«Холодильник гудит. Хорошо, что хоть кто-то здесь спокоен.»' },
  { id: 'hall', name: 'Прихожая', floor: 0, left: 350, right: 586, thought: '«Это просто старый дом. Просто старый дом…»' },
  { id: 'living', name: 'Гостиная', floor: 0, left: 586, right: 837, thought: '«На диване что-то шевельнулось? Нет. Показалось.»' },
  { id: 'bedroom', name: 'Спальня', floor: 1, left: 124, right: 350, thought: '«Под кровать я сегодня заглядывать не буду. Пока.»' },
  { id: 'landing', name: 'Коридор', floor: 1, left: 350, right: 586, thought: '«Третья ступенька всё так же скрипит.»' },
  { id: 'study', name: 'Кабинет', floor: 1, left: 586, right: 837, thought: '«Столько книг. Столько тёмных щелей между ними.»' },
];
export { SEARCH_OBJECTS as OBJECTS } from './objects.js';
export function roomAt(x, floor) { return ROOMS.find(r => r.floor === floor && x >= r.left && x < r.right) ?? ROOMS.find(r => r.floor === floor); }
