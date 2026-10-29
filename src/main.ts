import './style.css';
import {save,persist} from './state';
import {mount as dodge} from './games/dodge';
import {mount as claw} from './games/claw';
import {mount as ttt} from './games/tictactoe';
import {mount as memory} from './games/memory';
import {mount as snake} from './games/snake';
export type Cleanup=()=>void;
const games=[{id:'dodge',icon:'🚀',title:'Desvie!',subtitle:'Arcade clássico',mount:dodge},{id:'claw',icon:'🧸',title:'Máquina de garra',subtitle:'Prêmios virtuais',mount:claw},{id:'ttt',icon:'🎲',title:'Jogo da velha',subtitle:'Computador ou amigo',mount:ttt},{id:'memory',icon:'🃏',title:'Memória',subtitle:'Cartas e pares',mount:memory},{id:'snake',icon:'🐍',title:'Cobrinha',subtitle:'Arcade clássico · GameZ',mount:snake}];
const app=document.querySelector<HTMLDivElement>('#app')!;
let cleanup:Cleanup|undefined;
function header(){return `<header><button class="back" id="back" aria-label="Voltar ao menu">←</button><div class="brand">🌈 Joyfliper</div><div class="wallet">🪙 <span id="coins">${save.coins}</span></div></header>`;}
function home(){cleanup?.();cleanup=undefined;app.innerHTML=header()+`<main><div class="hero"><h1>Seu fliperama de bolso ✨</h1><p>Escolha uma máquina e divirta-se!</p></div><div class="grid">${games.map(g=>`<button class="tile" data-game="${g.id}"><span class="emoji">${g.icon}</span><strong>${g.title}</strong><small>${g.subtitle}</small><small>🏆 ${save.records[g.id]||0}</small></button>`).join('')}</div><p class="note">Sem apostas, dinheiro real ou prêmios físicos. Progresso salvo neste aparelho.</p></main>`;app.querySelectorAll<HTMLButtonElement>('[data-game]').forEach(b=>b.onclick=()=>open(b.dataset.game!));}
function open(id:string){cleanup?.();const g=games.find(x=>x.id===id);if(!g)return;app.innerHTML=header()+`<main><h1>${g.icon} ${g.title}</h1><section id="game"></section></main>`;document.querySelector<HTMLButtonElement>('#back')!.onclick=home;cleanup=g.mount(document.querySelector<HTMLElement>('#game')!);persist();}
home();
