export type Save={coins:number,records:Record<string,number>};
const key='joyfliper-save-v1';
export function load():Save {try {const v=JSON.parse(localStorage.getItem(key)||'null');if(v&&Number.isFinite(v.coins)&&v.coins>=0&&typeof v.records==='object'&&v.records!==null)return {coins:Math.floor(v.coins),records:v.records};}catch{}return {coins:100,records:{}};}
export const save:Save=load();
export function persist(){localStorage.setItem(key,JSON.stringify(save));const el=document.querySelector('#coins');if(el)el.textContent=String(save.coins);}
export function reward(points:number,game:string){const previous=save.records[game]||0;if(points>previous)save.records[game]=points;save.coins+=Math.max(1,Math.floor(points/10));persist();}
