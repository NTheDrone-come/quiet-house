export const CREDIT_NAME='GPT 6.1 Sol (Mid and high effort)';
const FINAL_CREDIT='GPT 6.1 Sol и Beomelin';
const roles=[['Идея и сценарий','Beomelin'],['Программирование',CREDIT_NAME],['Пиксельный мир и персонажи',CREDIT_NAME],['Звук и атмосфера',CREDIT_NAME],['Мини-игры',CREDIT_NAME],['Тестирование и финальные титры',FINAL_CREDIT]];
export function createCredits(overlay,playfield){
 let shown=false;
 return s=>{
  if(!s.ending)return;
  if(!shown){
   shown=true;overlay.hidden=false;playfield.inert=true;
   const sheet=document.createElement('div');sheet.className='credits-sheet';
   const title=document.createElement('h1');title.id='credits-title';title.textContent='Тихий дом';
   const epilogue=document.createElement('p');epilogue.className='credits-epilogue';epilogue.textContent='Все щели закрыты. Все пауки уничтожены. Впервые за три дня — спокойный сон.';
   sheet.append(title,epilogue);
   for(const [role,name] of roles){const row=document.createElement('section'),label=document.createElement('h2'),person=document.createElement('p');label.textContent=role;person.textContent=name;row.append(label,person);sheet.append(row);}
   const end=document.createElement('p');end.className='credits-end';end.textContent='Конец';
   const signature=document.createElement('p');signature.className='credits-signature';signature.textContent=FINAL_CREDIT;
   sheet.append(end,signature);overlay.replaceChildren(sheet);overlay.focus({preventScroll:true});
  }
  // Roll once, then hold the final signature. Reduced motion stays manually scrollable.
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)overlay.scrollTop=Math.max(0,s.ending.elapsed-4)*22;
 };
}
