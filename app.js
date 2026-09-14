const header = document.querySelector('.header');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.header nav');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 30), {passive:true});
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
}));
const observer = new IntersectionObserver(entries => entries.forEach(e => {
  if(e.isIntersecting){e.target.classList.add('visible'); observer.unobserve(e.target);}
}), {threshold:.12});
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const profileGrid=document.getElementById('therapistGrid');
const profileModal=document.getElementById('profileModal');
const profileModalContent=document.getElementById('profileModalContent');
let mwManagers=[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function profilePhotos(m){const p=Array.isArray(m.photos)?m.photos:[];return [...new Set([m.image,...p].filter(Boolean))].slice(0,5)}
function renderProfiles(){
  if(!profileGrid)return;
  if(!mwManagers.length){profileGrid.innerHTML='<div class="profile-empty"><img src="assets/myeongwol-logo.png" alt=""><h3>관리사 프로필 준비 중</h3><p>새로운 프로필을 곧 안내해 드립니다.</p></div>';return}
  profileGrid.innerHTML=mwManagers.map((m,i)=>{const img=profilePhotos(m)[0]||'assets/myeongwol-profile.png';return `<button class="therapist-card" type="button" data-index="${i}"><span class="therapist-photo"><img src="${esc(img)}" alt="${esc(m.name)} 관리사 프로필" loading="lazy"></span><span class="therapist-copy"><small>MYEONGWOLGWAN</small><strong>${esc(m.name)}</strong><span>${esc(m.age||'나이 문의')} · ${esc(m.height||'키 문의')}</span><em>${esc(m.work||'출근시간 문의')}</em><b>PROFILE VIEW →</b></span></button>`}).join('');
  profileGrid.querySelectorAll('.therapist-card').forEach(btn=>btn.addEventListener('click',()=>openProfile(Number(btn.dataset.index))));
}
function openProfile(i){const m=mwManagers[i];if(!m)return;const photos=profilePhotos(m);const img=photos[0]||'assets/myeongwol-profile.png';profileModalContent.innerHTML=`<div class="profile-detail"><div class="profile-detail-photo"><img src="${esc(img)}" alt="${esc(m.name)} 관리사"></div><div class="profile-detail-info"><small>THERAPIST PROFILE</small><h2>${esc(m.name)}</h2><dl><div><dt>AGE</dt><dd>${esc(m.age||'문의')}</dd></div><div><dt>HEIGHT</dt><dd>${esc(m.height||'문의')}</dd></div><div><dt>BODY</dt><dd>${esc(m.body||'문의')}</dd></div><div><dt>WORK</dt><dd>${esc(m.work||'문의')}</dd></div></dl><p>${esc(m.intro||'편안한 분위기에서 정성껏 관리해 드립니다.')}</p><div class="profile-detail-actions"><a href="tel:01048982140">전화 예약</a><a href="https://t.me/myeongwol2140" target="_blank" rel="noopener">텔레그램</a></div></div></div>`;profileModal.classList.add('show');profileModal.setAttribute('aria-hidden','false')}
document.getElementById('profileModalClose')?.addEventListener('click',()=>{profileModal.classList.remove('show');profileModal.setAttribute('aria-hidden','true')});
profileModal?.addEventListener('click',e=>{if(e.target===profileModal)document.getElementById('profileModalClose').click()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&profileModal?.classList.contains('show'))document.getElementById('profileModalClose').click()});
if(window.mwDb){window.mwDb.child('managers').on('value',snap=>{const v=snap.val();mwManagers=Array.isArray(v)?v.filter(Boolean):v?Object.values(v):[];renderProfiles()},()=>renderProfiles())}else renderProfiles();
