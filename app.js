'use strict';
// Configure these before publishing. OWNER is intentionally a placeholder.
const OWNER = 'OWNER';
const REPO = 'guarachrome';
const VERSION = 'Prévia de design';
const GITHUB = `https://github.com/${OWNER}/${REPO}`;
const RELEASE_DOWNLOAD = `${GITHUB}/releases/latest/download/`;
// Demonstration catalog, not a statement that these artifacts have been released.
const BUILDS = [
 {os:'linux',name:'Linux',arch:'x64',format:'.deb',detail:'Debian · Ubuntu',file:'guarachrome-linux-x64.deb'},
 {os:'linux',name:'Linux',arch:'x64',format:'.rpm',detail:'Fedora · openSUSE',file:'guarachrome-linux-x64.rpm'},
 {os:'linux',name:'Linux',arch:'x64',format:'AppImage',detail:'Portátil',file:'guarachrome-linux-x64.AppImage'},
 {os:'linux',name:'Linux',arch:'x64',format:'Flatpak',detail:'Pacote universal',file:'guarachrome-linux-x64.flatpak'},
 {os:'linux',name:'Linux',arch:'arm64',format:'.deb',detail:'Debian · Ubuntu',file:'guarachrome-linux-arm64.deb'},
 {os:'linux',name:'Linux',arch:'arm64',format:'.rpm',detail:'Fedora · openSUSE',file:'guarachrome-linux-arm64.rpm'},
 {os:'windows',name:'Windows',arch:'x64',format:'.exe',detail:'Instalador',file:'guarachrome-windows-x64.exe'},
 {os:'windows',name:'Windows',arch:'arm64',format:'.exe',detail:'Instalador',file:'guarachrome-windows-arm64.exe'},
 {os:'macos',name:'macOS',arch:'arm64',format:'.dmg',detail:'Apple Silicon',file:'guarachrome-macos-arm64.dmg'},
 {os:'macos',name:'macOS',arch:'x64',format:'.dmg',detail:'Intel',file:'guarachrome-macos-x64.dmg'}
];
document.querySelectorAll('[data-github]').forEach(a => a.href = GITHUB);
document.querySelectorAll('[data-releases]').forEach(a => a.href = `${GITHUB}/releases`);
async function detectPlatform(){
 const ua = navigator.userAgent;
 const data = navigator.userAgentData;
 let platform = data?.platform || navigator.platform || ua;
 let arch = null;
 try {
  if(data?.getHighEntropyValues){
   const high = await Promise.race([data.getHighEntropyValues(['architecture','bitness']),new Promise(resolve=>setTimeout(()=>resolve({}),700))]);
   if(high.architecture === 'arm') arch='arm64';
   else if(high.architecture === 'x86' && high.bitness === '64') arch='x64';
  }
 } catch (_) { /* Low entropy / UA fallback below. */ }
 if(/Android|iPhone|iPad|iPod/i.test(ua) || (/Mac/.test(platform)&&navigator.maxTouchPoints>1)) return {os:'mobile',arch:null};
 const os = /Win/i.test(platform) ? 'windows' : /Mac/i.test(platform) ? 'macos' : /Linux/i.test(platform) ? 'linux' : 'unknown';
 if(!arch && /aarch64|arm64/i.test(ua)) arch='arm64';
 if(!arch && /x86_64|Win64|x64|amd64/i.test(ua)) arch='x64';
 // macOS UAs deliberately hide Apple Silicon: show both rather than guessing Intel.
 if(os==='macos' && !data) arch=null;
 return {os,arch};
}
function downloadLink(build,primary=false){
 const a=document.createElement('a'); a.className=`button${primary?' primary':''}`;
 a.href=RELEASE_DOWNLOAD+build.file;
 const label = build.os==='macos' ? `Baixar para ${build.arch==='arm64'?'Apple Silicon':'Intel'}` : build.os==='windows' ? `Windows ${build.arch}` : `Baixar ${build.format}`;
 a.textContent=label+' ↓';
 a.setAttribute('aria-label',`${label} — ${build.name} ${build.arch} (download demonstrativo)`);
 return a;
}
async function renderHero(){
 const container=document.querySelector('#downloads');if(!container)return;
 const {os,arch}=await detectPlatform();
 const label=document.querySelector('#platform');
 if(os==='mobile'||os==='unknown'){
  label.textContent=os==='mobile'?'Por enquanto, só no desktop.':'Sistema não identificado';
  container.firstElementChild.textContent='Ver downloads para desktop ↓';return;
 }
 let matches=BUILDS.filter(b=>b.os===os&&(!arch||b.arch===arch));
 if(os==='linux'&&!arch) matches=matches.filter(b=>b.arch==='x64');
 container.replaceChildren(...matches.map((b,i)=>downloadLink(b,i===0)));
 const name=matches[0]?.name||os;
 label.textContent=`${name}${arch?' · '+arch:os==='macos'?' · escolha seu chip':' · x64 / outras arquiteturas abaixo'}`;
}
renderHero();
const search=document.querySelector('#build-search');
if(search){
 let filter='all'; const list=document.querySelector('#build-list');
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function render(){
  const terms=normalize(search.value).trim().split(/\s+/).filter(Boolean);
  const matches=BUILDS.filter(b=>(filter==='all'||b.os===filter)&&terms.every(t=>normalize(`${b.name} ${b.arch} ${b.format} ${b.detail}`).includes(t)));
  list.replaceChildren();
  matches.forEach(b=>{
   const card=document.createElement('article');card.className='build';
   const icon=document.createElement('span');icon.className='os-icon';icon.setAttribute('aria-hidden','true');icon.textContent={linux:'⌘',windows:'⊞',macos:'◈'}[b.os];
   const info=document.createElement('div');info.className='build-info';const h=document.createElement('h2');h.textContent=`${b.name} · ${b.format}`;const small=document.createElement('small');small.textContent=`${b.arch} / ${b.detail}`;info.append(h,small);
   const a=document.createElement('a');a.href=RELEASE_DOWNLOAD+b.file;a.textContent='Baixar ↓';a.setAttribute('aria-label',`Baixar ${b.name} ${b.arch} ${b.format} (demonstrativo)`);card.append(icon,info,a);list.append(card);
  });
  document.querySelector('#result-count').textContent=`${matches.length} ${matches.length===1?'opção':'opções'} · ${VERSION}`;
  document.querySelector('#no-results').hidden=matches.length!==0;
 }
 search.addEventListener('input',render);
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});render();
 }));render();
}
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('waiting');observer.unobserve(entry.target);}}),{threshold:.08});
 document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('waiting');observer.observe(el);});
}
