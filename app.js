'use strict';
const OWNER = 'mdf-leon';
const REPO = 'Tempbrowse';
const VERSION = 'Versão 157.0.8103.38';
const GITHUB = `https://github.com/${OWNER}/${REPO}`;
const RELEASE_DOWNLOAD = `${GITHUB}/releases/latest/download/`;
const BUILDS = [
 {os:'linux',name:'Linux',arch:'x64',format:'.tar.xz',detail:'Portátil · Ubuntu, Debian, Fedora, Arch',file:'guarachrome-157.0.8103.38-linux-x64.tar.xz',size:'126,5 MB',sha:'884cb3bcefbdd971fffd30fef176f146e8b5b14da771d16081c4badd06ae2ab4'},
 {os:'windows',name:'Windows',arch:'x64',format:'.zip',detail:'Portátil · Windows 10 e 11',file:'guarachrome-157.0.8103.38-windows-x64.zip',size:'198,5 MB',sha:'457149662d83c1f32723d28d8b7ba16783763aea2303fee809bb4a8712cd5cd6'},
 {os:'android',name:'Android',arch:'arm64',format:'APK',detail:'Em breve',file:null,size:'',sha:''}
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
 a.href=RELEASE_DOWNLOAD+build.file; a.setAttribute('download','');
 const label = `Baixar para ${build.name} (${build.size})`;
 a.textContent=label+' ↓';
 a.setAttribute('aria-label',`${label} — ${build.name} ${build.arch}`);
 return a;
}
async function renderHero(){
 const container=document.querySelector('#downloads');if(!container)return;
 const {os,arch}=await detectPlatform();
 const label=document.querySelector('#platform');
 if(os==='mobile'||os==='unknown'){
  label.textContent=os==='mobile'?'Android em breve. Por enquanto, só no desktop.':'Sistema não identificado';
  container.firstElementChild.textContent='Ver downloads para desktop ↓';return;
 }
 let matches=BUILDS.filter(b=>b.os===os&&b.file);
 if(!matches.length){label.textContent='Sistema sem build ainda';container.firstElementChild.textContent='Ver downloads ↓';return;}
 container.replaceChildren(...matches.map((b,i)=>downloadLink(b,i===0)));
 const name=matches[0]?.name||os;
 label.textContent=`${name} · x64 · ${matches[0].format} · ${matches[0].size}`;
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
   const icon=document.createElement('span');icon.className='os-icon';icon.setAttribute('aria-hidden','true');icon.textContent={linux:'⌘',windows:'⊞',macos:'◈',android:'▣'}[b.os];
   const info=document.createElement('div');info.className='build-info';const h=document.createElement('h2');h.textContent=`${b.name} · ${b.format}`;const small=document.createElement('small');small.textContent=`${b.arch} / ${b.detail}${b.size?' · '+b.size:''}`;info.append(h,small);
   if(b.sha){const c=document.createElement('code');c.className='sha';c.textContent='SHA-256: '+b.sha;info.append(c);}
   let a;
   if(b.file){a=document.createElement('a');a.href=RELEASE_DOWNLOAD+b.file;a.setAttribute('download','');a.textContent='Baixar ↓';a.setAttribute('aria-label',`Baixar ${b.name} ${b.arch} ${b.format}`);}
   else{a=document.createElement('span');a.className='soon';a.textContent='Em breve';}
   card.append(icon,info,a);list.append(card);
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
