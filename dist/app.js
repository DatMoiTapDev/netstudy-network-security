'use strict';
const C=StudyCore, chapters=window.COURSE||[], bank=chapters.flatMap(c=>c.questions.map(q=>({...q,chapter:c.id,file:c.file}))), qmap=new Map(bank.map(q=>[q.id,q])), app=document.querySelector('#app');
let state=C.fresh(), route='', tick=null, timerEl=null, storageError='', activeReviewTab='needs_practice';
try{
const saved=localStorage.getItem(C.KEY);
if(saved){
const parsed=JSON.parse(saved);
state=C.validate(C.migrateStorageToV2(parsed,bank));
}
}catch(e){storageError='Không đọc được dữ liệu đã lưu. Hãy nhập bản sao lưu nếu có.'}

/* Utilities */
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const para=s=>e(s).replace(/\n/g,'<br>');
const list=a=>'<ul>'+a.map(x=>'<li>'+para(x)+'</li>').join('')+'</ul>';
const btn=(label,action,cls='')=>`<button type="button" class="btn ${cls}" data-action="${action}">${label}</button>`;
const minutes=ms=>`${Math.floor(ms/60000)} phút ${Math.floor(ms/1000)%60} giây`;
const chapter=id=>chapters.find(c=>c.id===id);
const source=(c,p)=>`<div class="source">Nguồn: ${e(c.file)} · trang PDF ${e(p)}. Số trang tính từ đầu file.</div>`;
function debounce(fn,delay=120){let timer=null;return function(...args){if(timer)clearTimeout(timer);timer=setTimeout(()=>{timer=null;fn.apply(this,args)},delay)}}
function toast(t){const el=document.querySelector('#toast');if(!el)return;el.textContent=t;el.style.display='block';setTimeout(()=>el.style.display='none',3200)}
function save(){
try{
localStorage.setItem(C.KEY,JSON.stringify(state));
storageError='';
}catch(err){
if(err.name==='QuotaExceededError'||(err.message&&err.message.toLowerCase().includes('quota'))){
storageError='Bộ nhớ trình duyệt đã đầy (QuotaExceededError). Hãy xuất bản sao lưu JSON.';
showQuotaModal();
}else{
storageError='Trình duyệt không lưu được dữ liệu. Hãy xuất bản sao lưu trước khi đóng trang.';
}
toast(storageError);
}
}
function showQuotaModal(){
const existing=document.querySelector('#quotaModal');if(existing)existing.remove();
const html=`<div id="quotaModal" class="quota-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="quotaTitle"><div class="quota-modal"><h2 id="quotaTitle">Cảnh báo Dung lượng Lưu trữ</h2><p class="muted">Bộ nhớ cục bộ của trình duyệt đã đạt giới hạn (QuotaExceededError). Hãy tải bản sao lưu JSON để đảm bảo an toàn dữ liệu.</p><div class="note warn">NetStudy không tự ý xóa dữ liệu của bạn khi chưa có sự xác nhận.</div><div class="actions" style="margin-top:16px">${btn('↓ Tải bản sao lưu JSON ngay','export','primary')}${btn('Dọn dẹp về 100 phiên gần nhất','confirmPruneHistory')}${btn('Đóng','closeQuotaModal')}</div></div></div>`;
document.body.insertAdjacentHTML('beforeend',html);
}
function go(path){if(location.hash==='#'+path)render();else location.hash=path}
function pageTop(eyebrow,title,intro=''){return `<div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${intro?`<p class="intro">${intro}</p>`:''}`}
function progress(c){return c.sections.filter(s=>state.completed.includes(c.id+':'+s.id)).length}

/* Inline SVG Icon Catalog (14+ Vector Icons) */
const ICONS = {
home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
courses: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
terms: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
models: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
practice: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
exam: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
review: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
'star-fill': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>',
history: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
sources: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
monitor: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
check: '<polyline points="20 6 9 17 4 12"/>',
menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
};
function icon(name, cls='', size=null, label=''){
const p = ICONS[name] || '';
const a = label ? ` role="img" aria-label="${e(label)}"` : ' aria-hidden="true"';
const c = cls ? ` ${cls}` : '';
const s = size ? ` style="width:${size}px;height:${size}px"` : '';
return `<svg class="svg-icon${c}" width="24" height="24" viewBox="0 0 24 24"${a}${s}>${p}</svg>`;
}

/* Theme Management API */
const THEME_KEY = 'netstudy-theme';
function getThemeMode(){
try{ return localStorage.getItem(THEME_KEY) || 'system'; }catch(_){ return 'system'; }
}
function getResolvedTheme(m){
const mode = m || getThemeMode();
if(mode === 'dark' || mode === 'light') return mode;
return (typeof window!=='undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}
function setThemeMode(m){
const mode = ['light','dark','system'].includes(m) ? m : 'system';
try{ localStorage.setItem(THEME_KEY, mode); }catch(_){}
if(typeof document!=='undefined' && document.documentElement){
document.documentElement.dataset.theme = getResolvedTheme(mode);
}
updateThemeControls();
}
function cycleThemeMode(){
const cur = getThemeMode();
const next = cur === 'system' ? 'light' : cur === 'light' ? 'dark' : 'system';
setThemeMode(next);
}
function updateThemeControls(){
const mode = getThemeMode();
const modeNames = { light: 'Sáng', dark: 'Tối', system: 'Tự động' };
const modeName = modeNames[mode] || 'Tự động';
const iconName = mode === 'light' ? 'sun' : mode === 'dark' ? 'moon' : 'monitor';

const headerBtn = document.querySelector('#themeToggle');
if(headerBtn){
headerBtn.innerHTML = icon(iconName);
headerBtn.setAttribute?.('aria-label', `Giao diện: ${modeName}. Nhấn để chuyển.`);
headerBtn.title = `Giao diện: ${modeName} (nhấn để đổi Sáng / Tối / Tự động)`;
}
const sideBtn = document.querySelector('#sidebarThemeBtn');
if(sideBtn){
sideBtn.innerHTML = `${icon(iconName)}<span>${modeName}</span>`;
sideBtn.setAttribute?.('aria-label', `Giao diện: ${modeName}. Nhấn để chuyển.`);
}
}
if(typeof window!=='undefined' && window.matchMedia){
try{
const mq = window.matchMedia('(prefers-color-scheme: dark)');
if(mq.addEventListener){
mq.addEventListener('change', ()=>{
if(getThemeMode() === 'system'){
  if(document.documentElement) document.documentElement.dataset.theme = getResolvedTheme('system');
  updateThemeControls();
}
});
}
}catch(_){}
}

/* Mobile Drawer Controls */
function openDrawer(){
const d = document.querySelector('#mobileDrawer');
if(d){ d.classList?.add?.('open'); d.setAttribute?.('aria-hidden','false'); }
}
function closeDrawer(){
const d = document.querySelector('#mobileDrawer');
if(d){ d.classList?.remove?.('open'); d.setAttribute?.('aria-hidden','true'); }
}

/* Card Component */
function card(c){
const done=progress(c), total=c.sections.length;
return `<a class="card chapter-card" href="#lesson/${c.id}"><div class="chapter-top"><span class="chapter-number">BÀI ${e(c.id.toUpperCase())}</span><span class="chip">${done===total?'Đã học':done?'Đang học':'Bắt đầu'}</span></div><h3>${e(c.title)}</h3><p>${e(c.objectives[0])}</p><div class="progress"><b style="width:${done/total*100}%"></b></div><div class="chapter-meta"><span>${total} mục · ${c.questions.length} câu luyện tập</span><span>Học bài &nbsp;↗</span></div></a>`;
}

/* Page Views */
function home(){
const overall=C.computeOverallProgress(bank,state.questionStats,state.completed);
const chProgress=C.computeChapterProgress(bank,state.questionStats,state.completed);
const last=state.history.at(-1);
const next=chapters.find(c=>progress(c)<c.sections.length)||chapters[0];
const weakChapters=chProgress.filter(c=>c.isWeak);
app.innerHTML=`<section class="hero"><div><div class="eyebrow">HỌC HIỂU · LUYỆN NHỚ · TỰ TIN ĐI THI</div><h1>An toàn mạng.<br><em>Hiểu từ bản chất.</em></h1><p class="muted">Biến những slide nhiều lý thuyết thành kiến thức bạn có thể giải thích bằng lời của mình. Mỗi ngày, tiến thêm một chút.</p><div class="actions"><a class="btn primary" href="#lesson/${next.id}">${overall.completedSectionsCount?'Tiếp tục học':'Bắt đầu học'} &nbsp; →</a><a class="btn" href="#exam">Làm đề thi thử</a><a class="btn light" href="#practice">Luyện tập thích ứng</a></div></div><div class="hero-visual" aria-hidden="true"><div class="orbit"></div><div class="shield">${icon('check')}</div><div class="float-tag a">Hiểu cơ chế, nhớ lâu hơn</div><div class="float-tag b">${icon('exam')} &nbsp;40 câu / 75 phút</div></div></section><div class="section-head"><h2>Bảng điều khiển Tiến độ Học tập</h2><a href="#review">Mở sổ ôn tập thông minh ↗</a></div><div class="stats"><div class="stat"><span class="stat-icon">${icon('courses')}</span><div class="value">${overall.completedSectionsCount}<span class="tiny">/95</span></div><small>Mục lý thuyết đã học (${Math.round(overall.completedSectionsCount/95*100)}%)</small></div><div class="stat"><span class="stat-icon">${icon('practice')}</span><div class="value">${overall.attemptedQuestions}<span class="tiny">/264</span></div><small>Câu hỏi đã chạm tới (${Math.round(overall.questionCoverageRate)}%)</small></div><div class="stat"><span class="stat-icon">${icon('check')}</span><div class="value">${overall.overallAccuracyRate!==null?overall.overallAccuracyRate.toFixed(1)+'<span class="tiny">%</span>':'---'}</div><small>Tỷ lệ đúng toàn cục</small></div><div class="stat"><span class="stat-icon">${icon('star-fill')}</span><div class="value">${overall.masteredCount}<span class="tiny">/264</span></div><small>Câu hỏi đã nắm vững</small></div></div>${weakChapters.length?`<div class="note warn" style="margin-top:16px"><strong>Vùng trũng kiến thức cần củng cố:</strong> Các bài sau có độ chính xác dưới 70%: ${weakChapters.map(c=>`<b>Bài ${c.chapterId} (${c.accuracyRate!==null?c.accuracyRate.toFixed(0):0}%)</b>`).join(', ')}. <a href="#practice">Luyện củng cố ngay →</a></div>`:''}${!state.history.length?`<div class="card" style="margin-top:16px;text-align:center;padding:24px"><h3>Chào mừng bạn đến với NetStudy!</h3><p class="muted">Hệ thống theo dõi chuỗi đúng thành thạo (Mastery) và gợi ý bài tập thích ứng hoàn toàn cục bộ.</p><p>Hãy bắt đầu đọc Bài 1 hoặc làm bài luyện tập để kích hoạt dữ liệu cá nhân hóa.</p><a class="btn primary" href="#lesson/1" style="margin-top:10px">Học Bài 1: Tổng quan →</a></div>`:''}${state.active?`<div class="note"><strong>Bạn có bài đang làm dở.</strong> Câu trả lời và thời hạn được khôi phục khi tải lại trang. <a href="#session">Tiếp tục bài →</a></div>`:''}<div class="section-head" style="margin-top:24px"><h2>Tiến độ chi tiết từng bài học</h2><a href="#courses">Xem toàn bộ bài học ↗</a></div><div class="grid">${chapters.map(c=>{const prog=chProgress.find(p=>p.chapterId===c.id)||{attemptedQuestions:0,accuracyRate:null,isWeak:false};const done=progress(c),total=c.sections.length;return `<a class="card chapter-card" href="#lesson/${c.id}"><div class="chapter-top"><span class="chapter-number">BÀI ${e(c.id.toUpperCase())}</span><span class="chip">${done===total?'Đã học':done?'Đang học':'Bắt đầu'}</span>${prog.isWeak?'<span class="weak-badge">Chương yếu</span>':''}</div><h3>${e(c.title)}</h3><p>${e(c.objectives[0])}</p><div class="progress"><b style="width:${done/total*100}%"></b></div><div class="chapter-meta"><span>${done}/${total} mục · ${prog.attemptedQuestions}/${c.questions.length} câu đã làm</span><span>${prog.accuracyRate!==null?prog.accuracyRate.toFixed(0)+'% đúng':'Chưa làm'} ↗</span></div></a>`}).join('')}</div><div class="two" style="margin-top:24px"><div class="card"><div class="eyebrow">SỔ ÔN TẬP THÔNG MINH</div><h2>Khắc phục triệt để câu sai</h2><p class="muted">Theo dõi chuỗi 2 lần đúng liên tiếp (CL-01). Một câu chỉ được coi là đã khắc phục khi làm đúng ở 2 phiên riêng biệt.</p><a class="btn light" href="#review">Mở sổ ôn tập (${C.getQuestionsByMastery(bank,state.questionStats,'needs_practice').length} câu cần ôn) →</a></div><div class="card"><div class="eyebrow">LẦN LUYỆN GẦN NHẤT</div>${last?`<h2>${C.grade(last,bank,last.ended).score.toFixed(2)}/10</h2><p class="muted">${e(last.title)} · ${new Date(last.ended).toLocaleDateString('vi-VN')}</p><a class="btn light" href="#result/${last.id}">Xem lại kết quả →</a>`:`<h2>Sẵn sàng thử sức?</h2><p class="muted">Bắt đầu từ một bài nhỏ. Mỗi câu sai là một điểm cần hiểu rõ hơn.</p><a class="btn light" href="#practice">Chọn bài luyện tập →</a>`}</div></div><div class="note" style="margin-top:20px">Lịch sử và tiến độ học tập được bảo mật 100% trên trình duyệt thiết bị này (Schema v2). <a href="#settings">Xuất / nhập bản sao lưu JSON →</a></div>`;
}

function courses(){
app.innerHTML=pageTop('GIÁO TRÌNH','Từng bài, từng bước.','Bám cấu trúc tài liệu gốc. Phần diễn giải, ví dụ và gợi ý học là học liệu biên soạn bổ trợ; nguồn slide được ghi ở từng mục.')+`<input class="search" id="courseSearch" placeholder="Tìm bài, khái niệm, nội dung…" aria-label="Tìm bài học"><div class="grid" id="courseGrid">${chapters.map(card).join('')}</div>`;
const cs=document.querySelector('#courseSearch');
if(cs)cs.oninput=debounce(ev=>{let t=ev.target.value.toLocaleLowerCase('vi');const cg=document.querySelector('#courseGrid');if(cg)cg.innerHTML=chapters.filter(c=>JSON.stringify(c).toLocaleLowerCase('vi').includes(t)).map(card).join('')},120);
}

function externalNotes(c){
return (c.external||[]).length?`<div class="note"><strong>Đối chiếu mở rộng · kiểm tra ngày 17/10/2026</strong>${c.external.map(x=>`<p><a href="${e(x.url)}" target="_blank" rel="noopener noreferrer">${e(x.title)} ↗</a><br>${e(x.note)}</p>`).join('')}</div>`:''
}

function lesson(id){
const c=chapter(id);
if(!c)return go('courses');
app.innerHTML=pageTop('GIÁO TRÌNH / BÀI '+e(id),e(c.title))+`<div class="two"><article class="lesson"><div class="card"><details><summary>Cấu trúc gốc trong slide</summary>${list((c.outline||[]).map((t,i)=>(i+1)+'. '+t))}<p class="tiny muted">Các mục dưới đây chia nhỏ thêm để dễ học; giữ nhóm mục gốc và liên kết trang tương ứng.</p></details><h3>Mục tiêu học tập</h3>${list(c.objectives)}<h3>Bức tranh tổng thể</h3><p>${para(c.overview)}</p>${source(c,'1–'+c.pages)}</div>${externalNotes(c)}${c.issues.length?`<details class="note warn"><summary>${c.issues.length} ghi chú nguồn cần lưu ý</summary>${list(c.issues.map(i=>'Trang '+i.page+': '+i.note))}</details>`:''}${c.sections.map(s=>`<section class="card lesson-section" id="section-${e(s.id)}"><div class="eyebrow">MỤC ${e(s.id)}</div><h2>${e(s.title)}</h2>${source(c,s.from+'–'+s.to)}<div class="explanation">${para(s.explanation)}</div>${window.ModelUI?.renderSection(c.id,s.id)||''}<div class="plain"><strong>NÓI DỄ HIỂU</strong><p>${para(s.plain)}</p></div><div class="example"><strong>Ví dụ & liên hệ</strong><p>${para(s.example)}</p></div><h3>Điểm dễ sai khi làm trắc nghiệm</h3>${list(s.pitfalls)}<h3>Tự giải thích lại</h3>${list(s.recap)}<div class="actions">${btn(state.completed.includes(c.id+':'+s.id)?(icon('check')+' Đã học mục này'):'Đánh dấu đã học','complete|'+c.id+'|'+s.id,'light')}${btn('Luyện tập mục này →','sectionPractice|'+c.id+'|'+s.id)}</div></section>`).join('')}${c.comparisons.map(t=>`<div class="card lesson-section"><h2>${e(t.title)}</h2><div class="table-wrap"><table><thead><tr>${t.headers.map(h=>'<th>'+e(h)+'</th>').join('')}</tr></thead><tbody>${t.rows.map(r=>'<tr>'+r.map(v=>'<td>'+para(v)+'</td>').join('')+'</tr>').join('')}</tbody></table></div></div>`).join('')}<section class="card"><h2>Cách học & ôn lại</h2>${list(c.study)}<div class="note">Tóm tắt cuối bài: dùng các câu “Tự giải thích lại” ở mỗi mục để tự kể lại toàn bộ bài mà không nhìn slide.</div><a class="btn primary" href="#practice/${c.id}">Luyện tập Bài ${e(c.id)} →</a></section></article><div class="card lesson-nav"><div class="eyebrow">TRONG BÀI NÀY</div>${c.sections.map(s=>`<a href="#lesson/${c.id}/${encodeURIComponent(s.id)}">${e(s.id)} · ${e(s.title)} <span class="nav-check">${state.completed.includes(c.id+':'+s.id)?icon('check'):''}</span></a>`).join('')}<div class="divider"></div><a href="#models/${c.id}">${icon('models')} Mô hình trong bài này</a><a href="#practice/${c.id}">${icon('practice')} Luyện tập ${c.questions.length} câu</a><a href="#sources/${c.id}">${icon('sources')} Bảng đối chiếu nguồn</a></div></div>`;
}

function terms(){
let all=chapters.flatMap(c=>c.terms.map(t=>({...t,chapter:c.id})));
app.innerHTML=pageTop('TỪ ĐIỂN','Gỡ rối thuật ngữ.','Giữ tên tiếng Anh, hiểu bằng tiếng Việt. Các diễn giải dưới đây là phần bổ trợ học tập.')+'<input class="search" id="termSearch" placeholder="Tìm tiếng Anh, tiếng Việt, chữ viết tắt…" aria-label="Tìm thuật ngữ"><div class="card" id="termResults"></div>';
const draw=t=>{
const found=all.filter(x=>JSON.stringify(x).toLowerCase().includes(t.toLowerCase()));
document.querySelector('#termResults').innerHTML=found.length?found.map(x=>`<div class="term"><span class="chip">Bài ${e(x.chapter)}</span><h3>${e(x.en)}</h3><strong>${e(x.vi)}</strong><p class="muted">${para(x.meaning)}</p><a class="tiny" href="#lesson/${x.chapter}">Đọc trong bài →</a></div>`).join(''):'<p>Không tìm thấy thuật ngữ phù hợp.</p>';
};
draw('');
const ts=document.querySelector('#termSearch');
if(ts)ts.oninput=debounce(ev=>draw(ev.target.value),120);
}

function practice(id){
const stats=state.questionStats||{};
const unseenCount=bank.filter(q=>!stats[q.id]||!stats[q.id].attempts).length;
const wrongCount=bank.filter(q=>stats[q.id]&&stats[q.id].wrongCount>0).length;

app.innerHTML=pageTop('LUYỆN TẬP','Rèn luyện có mục tiêu.','Hệ thống gợi ý câu hỏi thích ứng dựa trên tiến độ học tập thực tế, hoặc bạn có thể tự chọn bài theo ý muốn.')+`
<div class="section-head"><h2>Chế độ Luyện tập Thích ứng (Adaptive Practice)</h2></div>
<div class="adaptive-grid">
<div class="adaptive-card"><div><span class="chip">Mục tiêu bao phủ</span><h3>Luyện câu chưa làm</h3><p>Ưu tiên câu hỏi bạn chưa từng làm để bao phủ 100% ngân hàng 264 câu. Còn <b>${unseenCount}</b> câu chưa làm.</p></div><div class="actions">${btn('Luyện 10 câu','startAdaptive|unseen|10','primary')}${btn('Luyện 20 câu','startAdaptive|unseen|20','light')}</div></div>
<div class="adaptive-card"><div><span class="chip">Khắc phục điểm yếu</span><h3>Luyện câu hay sai nhất</h3><p>Tập trung rèn luyện các câu hỏi bạn từng trả lời sai nhiều lần nhất. Hiện có <b>${wrongCount}</b> câu trong danh sách.</p></div><div class="actions">${btn('Luyện 10 câu','startAdaptive|frequent_wrong|10','primary')}${btn('Luyện 20 câu','startAdaptive|frequent_wrong|20','light')}</div></div>
<div class="adaptive-card"><div><span class="chip">Củng cố chương yếu</span><h3>Luyện củng cố chương</h3><p>Tập hợp các câu hỏi thuộc những chương có tỷ lệ đúng dưới 70% để san bằng lỗ hổng kiến thức.</p></div><div class="actions">${btn('Luyện 10 câu','startAdaptive|weak_chapter|10','primary')}${btn('Luyện 20 câu','startAdaptive|weak_chapter|20','light')}</div></div>
<div class="adaptive-card"><div><span class="chip">Phối hợp thông minh</span><h3>Hỗn hợp thích ứng 50/30/20</h3><p>Tỷ lệ vàng: 50% câu sai + 30% câu chưa làm + 20% câu đã thành thạo để vừa sửa sai vừa ôn bài mới.</p></div><div class="actions">${btn('Luyện 10 câu','startAdaptive|adaptive_mixed|10','primary')}${btn('Luyện 20 câu','startAdaptive|adaptive_mixed|20','light')}</div></div>
</div>

<div class="section-head"><h2>Tùy chọn luyện tập thủ công</h2></div>
<div class="card">
<div class="stack">
<label>Bài học <select id="practiceChapter"><option value="all">Tất cả bài học</option>${chapters.map(c=>`<option value="${c.id}" ${c.id===id?'selected':''}>Bài ${c.id}: ${e(c.title)}</option>`).join('')}</select></label>
<label>Chủ đề <select id="practiceTopic"><option value="all">Tất cả chủ đề</option></select></label>
<label>Mức độ <select id="practiceLevel"><option value="all">Tất cả mức độ</option><option>Nhận biết</option><option>Thông hiểu</option><option>Vận dụng</option></select></label>
<label>Chế độ <select id="practiceMode"><option value="learn">Học có giải thích — xem ngay sau trả lời</option><option value="test">Tự kiểm tra — xem sau khi nộp</option></select></label>
<label>Số câu <select id="practiceCount"><option>10</option><option>20</option><option value="all">Tất cả câu phù hợp</option></select></label>
</div>
<div class="actions">${btn('Bắt đầu luyện tập tùy chọn →','startPractice','primary')}</div>
</div>
<div class="note">Không giới hạn thời gian ở chế độ luyện tập. Chấm điểm: đúng 1, sai hoặc bỏ trống 0; quy đổi thang 10 theo số câu.</div>`;

const update=()=>{
let ch=document.querySelector('#practiceChapter')?.value||'all';
let topics=[...new Set(bank.filter(q=>ch==='all'||q.chapter===ch).map(q=>q.topic))];
const pt=document.querySelector('#practiceTopic');
if(pt)pt.innerHTML='<option value="all">Tất cả chủ đề</option>'+topics.map(t=>`<option>${e(t)}</option>`).join('');
};
update();
const pc=document.querySelector('#practiceChapter');
if(pc)pc.onchange=update;
}

function exam(){
let lv={};let fixed=C.makeExam(bank,true);
for(let id of fixed){const l=qmap.get(id).level;lv[l]=(lv[l]||0)+1}
app.innerHTML=pageTop('PHÒNG THI THỬ','40 câu. 75 phút.','Tập làm bài trong điều kiện thời gian thật. Đây là đề ôn tập được biên soạn, không phải đề thi chính thức.')+`<div class="two"><div class="card"><div class="eyebrow">QUY TẮC LÀM BÀI</div><h2>Thử sức khi bạn đã sẵn sàng.</h2>${list(['Đúng 40 câu, mỗi câu 4 lựa chọn và 1 đáp án đúng.','75 phút kể từ lúc bắt đầu; tải lại trang không đặt lại thời hạn.','Hết giờ tự nộp. Đáp án và lời giải chỉ mở sau khi nộp.','Điểm = số câu đúng × 0,25. Không trừ điểm câu sai hoặc bỏ trống.','Có thể đánh dấu để quay lại, chuyển câu bằng bảng điều hướng.'])}<div class="actions">${btn('Đề cố định A →','startExam|fixed','primary')}${btn('Tạo đề ngẫu nhiên','startExam|random')}</div><p class="tiny muted">Đề cố định dùng cùng câu và thứ tự để so sánh tiến bộ. Đề ngẫu nhiên ưu tiên câu chưa xuất hiện trong đề thi trước.</p></div><div class="card"><h3>Ma trận ôn tập đề xuất</h3><p class="tiny muted">Phân bổ theo phạm vi nội dung, tăng trọng số cho mật mã và giao thức; không suy ra từ đề thi thật.</p><table><tr><th>Bài</th><th>Tổng</th><th>NB / TH / VD</th></tr>${chapters.map(c=>`<tr><td>${e(c.id)} · ${e(c.title)}</td><td>${C.matrix[c.id]}</td><td>${C.levelMatrix[c.id].join(' / ')}</td></tr>`).join('')}<tr><th>Tổng</th><th>40</th><th>12 / 20 / 8</th></tr></table><p class="tiny">NB: nhận biết (30%) · TH: thông hiểu (50%) · VD: vận dụng (20%). Nếu bộ câu hỏi thay đổi và thiếu một mức độ, hệ thống dùng câu khác trong cùng bài; phân bổ thực tế của đề A được ghi dưới đây.</p><p class="tiny muted">Đề A thực tế: ${Object.entries(lv).map(([k,v])=>e(k)+': '+v).join(' · ')}.</p></div></div>`;
}

function begin(ids,mode,title){
if(!ids.length)return toast('Chưa có câu hỏi phù hợp.');
if(state.active&&!confirm('Bạn có bài đang làm dở. Thay bằng bài mới? Bài cũ chưa nộp sẽ không được lưu vào lịch sử.'))return;
const now=Date.now();
state.active={id:String(now),ids,mode,title,answers:{},flags:[],index:0,started:now,deadline:mode==='exam'?now+75*60000:null};
save();
go('session');
}

function session(){
const a=state.active;
if(!a){app.innerHTML=pageTop('LÀM BÀI','Chưa có bài đang làm.')+'<a class="btn primary" href="#practice">Chọn bài luyện tập</a>';return}
if(a.deadline&&Date.now()>=a.deadline)return submit(true);
const q=qmap.get(a.ids[a.index]);
if(!q){toast('Có câu hỏi không còn trong phiên bản học liệu. Hãy xuất sao lưu.');return go('settings')}
let answered=Object.hasOwn(a.answers,q.id), reveal=a.mode==='learn'&&answered;
app.innerHTML=pageTop(a.mode==='exam'?'THI THỬ / 40 CÂU · 75 PHÚT':'LUYỆN TẬP',e(a.title))+`<div class="quiz-layout"><div class="card"><div class="quiz-head"><span class="chip">Câu ${a.index+1} / ${a.ids.length}</span><span class="badge">Bài ${e(q.chapter)} · ${e(q.level)}</span></div><div class="question">${e(q.stem)}</div><div>${q.options.map((o,i)=>`<button type="button" class="option ${a.answers[q.id]===i?'selected':''} ${reveal?(i===q.correct?'right':a.answers[q.id]===i?'wrong':''):''}" aria-pressed="${a.answers[q.id]===i}" data-action="answer|${i}" ${reveal?'disabled':''}><b>${'ABCD'[i]}</b><span>${e(o)}</span></button>`).join('')}</div>${reveal?rationale(q):'<p class="tiny muted">Đáp án chưa được công bố.</p>'}<div class="actions">${btn('← Trước','prev')}${btn(a.flags.includes(q.id)?(icon('star-fill')+' Đã đánh dấu'):(icon('review')+' Đánh dấu xem lại'),'flag')}${btn(a.index===a.ids.length-1?'Đến câu đầu ↻':'Tiếp theo →','next','primary')}</div></div><div class="card lesson-nav"><div class="quiz-head"><strong>${a.mode==='exam'?'Thời gian còn lại':'Tiến độ làm bài'}</strong></div><div id="timer" class="timer">${a.deadline?'':'Không giới hạn'}</div><p class="tiny muted">${Object.keys(a.answers).length}/${a.ids.length} câu đã trả lời</p><div class="qnav">${a.ids.map((id,i)=>`<button type="button" aria-label="Đến câu ${i+1}" class="${Object.hasOwn(a.answers,id)?'answered':''} ${a.flags.includes(id)?'flagged':''} ${i===a.index?'current':''}" data-action="jump|${i}">${i+1}</button>`).join('')}</div><p class="tiny muted">Xanh: đã trả lời · Gạch vàng: đánh dấu</p>${btn('Nộp bài','submit','primary')}<p class="tiny muted">Tự lưu sau mỗi thao tác.</p></div></div>`;
timerEl=document.querySelector('#timer');clearInterval(tick);if(a.deadline){updateTimer();tick=setInterval(updateTimer,1000)}
}

function updateTimer(){
let a=state.active;
if(!a||!a.deadline)return;
const remaining=a.deadline-Date.now();
if(remaining<=0){clearInterval(tick);tick=null;timerEl=null;return submit(true)}
if(!timerEl)timerEl=document.querySelector('#timer');let el=timerEl;
if(el){el.textContent=Math.floor(remaining/60000)+':'+String(Math.floor(remaining/1000)%60).padStart(2,'0');el.classList.toggle('urgent',remaining<5*60000)}
}

function rationale(q){
return `<div class="rationale"><strong>Đáp án đúng: ${'ABCD'[q.correct]} · ${e(q.options[q.correct])}</strong>${q.explanations.map((x,i)=>`<p class="${i===q.correct?'correct':''}"><strong>${'ABCD'[i]}.</strong> ${para(x)}</p>`).join('')}${source(chapter(q.chapter),q.page)}<a class="tiny" href="#lesson/${q.chapter}/${encodeURIComponent(q.section)}">Học lại mục liên quan →</a></div>`;
}

function submit(auto=false){
const a=state.active;
if(!a)return;
if(!auto&&!confirm('Nộp bài và xem kết quả? Bạn không thể sửa đáp án sau khi nộp.'))return;
clearInterval(tick);tick=null;timerEl=null;
a.ended=Math.min(Date.now(),a.deadline||Date.now());
a.auto=auto;

if(!state.questionStats)state.questionStats=C.initQuestionStats(bank);
for(const qid of a.ids){
const q=qmap.get(qid);
if(!q)continue;
const ans=a.answers[qid];
if(ans!==undefined&&ans!==null){
const isCorrect=(ans===q.correct);
if(!state.questionStats[qid])state.questionStats[qid]=C.normalizeQuestionRecord(qid,q.chapter,q.level);
C.updateQuestionMastery(state.questionStats[qid],isCorrect,a.mode);
}
}

state.history.push(a);
for(const id of a.flags)if(!state.marked.includes(id))state.marked.push(id);
if(a.mode==='exam')state.seen=[...new Set([...state.seen,...a.ids])];
state.active=null;
save();
go('result/'+a.id);
}

function result(id){
const a=state.history.find(h=>h.id===id);
if(!a)return go('history');
let g=C.grade(a,bank,a.ended), weak=Object.entries(g.topics).filter(([_,v])=>v.correct/v.total<.7);
app.innerHTML=pageTop('KẾT QUẢ',e(a.title),new Date(a.ended).toLocaleString('vi-VN'))+`<div class="card result-banner"><div class="score">${g.score.toFixed(2)}<span class="tiny">/10</span></div><div><h2>${g.correct}/${g.total} câu đúng · ${g.rate.toFixed(1)}%</h2><p class="muted">${g.wrong} sai · ${g.blank} bỏ trống · ${minutes(g.elapsed)}</p><p class="tiny">Điểm = số câu đúng / tổng số câu × 10. Không trừ điểm.</p>${a.auto?'<p class="tiny">Bài được tự nộp khi hết giờ.</p>':''}</div></div><div class="section-head"><h2>Nhìn lại theo chủ đề</h2></div><div class="card"><div class="table-wrap"><table><tr><th>Chủ đề</th><th>Đúng</th><th>Tỷ lệ</th><th>Ôn lại</th></tr>${Object.entries(g.topics).map(([k,v])=>`<tr><td>${e(k)}</td><td>${v.correct}/${v.total}</td><td>${Math.round(v.correct/v.total*100)}%</td><td><a href="#lesson/${v.chapter}">Bài ${v.chapter} →</a></td></tr>`).join('')}</table></div>${weak.length?`<div class="note">Ưu tiên ôn: ${weak.map(([k])=>e(k)).join('; ')}. Đọc lại cơ chế, tự giải thích rồi làm lại câu sai.</div>`:'<div class="note">Bạn đã đạt ít nhất 70% ở các chủ đề của lượt này. Hãy thử thêm đề khác để kiểm tra độ vững.</div>'}</div><div class="section-head"><h2>Đáp án & lời giải từng câu</h2>${btn('Luyện lại câu sai / bỏ trống','retry|'+a.id)}</div>${a.ids.map((qid,i)=>{const q=qmap.get(qid);if(!q)return `<div class="note warn">Câu ${i+1} không còn trong học liệu hiện tại.</div>`;const answer=a.answers[qid];return `<div class="card review-item"><span class="chip">Câu ${i+1} · ${answer===undefined?'Bỏ trống':answer===q.correct?'Đúng':'Sai'}</span><h3>${e(q.stem)}</h3><p class="tiny">Bạn chọn: ${answer===undefined?'Chưa trả lời':'ABCD'[answer]+' · '+e(q.options[answer])}</p>${rationale(q)}${btn(state.marked.includes(q.id)?(icon('star-fill')+' Bỏ đánh dấu'):(icon('review')+' Lưu câu này'),'mark|'+q.id)}</div>`}).join('')}`;
}

let historyFilterActivity='all',historyFilterTime='all',historyFilterResult='all';

function renderSvgScoreChart(exams){
if(!exams.length)return `<div class="card empty"><p>Chưa có bài thi thử nào trong lịch sử để vẽ biểu đồ xu hướng. Hãy làm bài thi 40 câu để ghi nhận tiến trình điểm số.</p><a class="btn primary" href="#exam" style="margin-top:8px">Làm đề thi thử ngay →</a></div>`;
const W=600,H=240,padL=40,padR=20,padT=20,padB=40,chartW=W-padL-padR,chartH=H-padT-padB;
const y0=padT+chartH, y5=padT+chartH*0.5, y7=padT+chartH*0.3, y10=padT;
const points=exams.map((e,idx)=>{
const x=exams.length===1?padL+chartW*0.5:padL+(idx/(exams.length-1))*chartW;
const y=padT+chartH*(1-Math.max(0,Math.min(10,e.score))/10);
return {x:Number(x.toFixed(1)),y:Number(y.toFixed(1)),exam:e,idx:idx+1};
});
const polylinePoints=points.map(p=>`${p.x},${p.y}`).join(' ');

return `
<div class="score-chart-wrap">
<svg class="score-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ tiến trình điểm số thi thử">
<line x1="${padL}" y1="${y10}" x2="${W-padR}" y2="${y10}" /><text x="${padL-8}" y="${y10+4}" text-anchor="end">10</text>
<line x1="${padL}" y1="${y7}" x2="${W-padR}" y2="${y7}" class="pass-line" /><text x="${padL-8}" y="${y7+4}" text-anchor="end" style="fill:var(--accent);font-weight:700">7.0 (Đạt)</text>
<line x1="${padL}" y1="${y5}" x2="${W-padR}" y2="${y5}" /><text x="${padL-8}" y="${y5+4}" text-anchor="end">5</text>
<line x1="${padL}" y1="${y0}" x2="${W-padR}" y2="${y0}" /><text x="${padL-8}" y="${y0+4}" text-anchor="end">0</text>
${points.length>1?`<polyline points="${polylinePoints}" />`:''}
${points.map(p=>`
  <circle cx="${p.x}" cy="${p.y}" r="5">
    <title>Lần ${p.idx}: ${p.exam.score.toFixed(2)}/10 (${p.exam.durationMinutes} phút · ${new Date(p.exam.started).toLocaleDateString('vi-VN')})</title>
  </circle>
  <text x="${p.x}" y="${p.y-10}" text-anchor="middle" style="font-weight:700;font-size:12px;fill:var(--text)">${p.exam.score.toFixed(1)}</text>
`).join('')}
${points.map(p=>`<text x="${p.x}" y="${H-12}" text-anchor="middle">Lần ${p.idx}</text>`).join('')}
</svg>
</div>`;
}

function historyPage(){
const trend=C.computeExamTrend(state.history);
const cogBreakdown=C.computeCognitiveBreakdown(bank,state.questionStats);
const filteredSessions=C.filterHistory(state.history,{activityType:historyFilterActivity,timeRange:historyFilterTime,resultStatus:historyFilterResult});

app.innerHTML=pageTop('PHÂN TÍCH & LỊCH SỬ','Nhìn thấy mình tiến bộ từng ngày.','Biểu đồ điểm thi thực tế, phân bổ độ khó nhận thức và lưu trữ tối đa 100 phiên chi tiết an toàn.')+`
<div class="section-head"><h2>Xu hướng điểm số qua các kỳ thi thử</h2></div>
<div class="stats">
<div class="stat"><span class="stat-icon">${icon('exam')}</span><div class="value">${trend.exams.length}</div><small>Số đề thi thử đã làm</small></div>
<div class="stat"><span class="stat-icon">${icon('check')}</span><div class="value">${trend.averageScore.toFixed(1)}<span class="tiny">/10</span></div><small>Điểm số trung bình</small></div>
<div class="stat"><span class="stat-icon">${icon('practice')}</span><div class="value">${trend.averageDuration}<span class="tiny"> phút</span></div><small>Thời gian làm bài TB</small></div>
<div class="stat"><span class="stat-icon">${icon('star-fill')}</span><div class="value">${trend.passRate}<span class="tiny">%</span></div><small>Tỷ lệ đạt chuẩn (≥ 7.0)</small></div>
</div>

${renderSvgScoreChart(trend.exams)}

<div class="section-head"><h2>Phân tích theo mức độ nhận thức (Ma trận đề thi)</h2></div>
<div class="stats">
<div class="stat"><span class="stat-icon">${icon('courses')}</span><div class="value">${cogBreakdown['Nhận biết'].rate!==null?cogBreakdown['Nhận biết'].rate+'%':'---'}</div><small>Nhận biết (${cogBreakdown['Nhận biết'].attempted}/${cogBreakdown['Nhận biết'].total} câu)</small></div>
<div class="stat"><span class="stat-icon">${icon('models')}</span><div class="value">${cogBreakdown['Thông hiểu'].rate!==null?cogBreakdown['Thông hiểu'].rate+'%':'---'}</div><small>Thông hiểu (${cogBreakdown['Thông hiểu'].attempted}/${cogBreakdown['Thông hiểu'].total} câu)</small></div>
<div class="stat"><span class="stat-icon">${icon('exam')}</span><div class="value">${cogBreakdown['Vận dụng'].rate!==null?cogBreakdown['Vận dụng'].rate+'%':'---'}</div><small>Vận dụng (${cogBreakdown['Vận dụng'].attempted}/${cogBreakdown['Vận dụng'].total} câu)</small></div>
</div>

<div class="section-head" style="margin-top:24px">
<h2>Nhật ký làm bài (${filteredSessions.length}/${state.history.length})</h2>
<a class="btn light" href="#settings">Quản lý dung lượng / Xuất JSON ↗</a>
</div>
${state.history.length>100?`<div class="note warn" style="margin-bottom:16px"><strong>Lịch sử đã vượt quá 100 phiên (${state.history.length} phiên):</strong> Thống kê tích lũy được bảo lưu vĩnh viễn. NetStudy không tự ý xóa dữ liệu của bạn.<div class="actions" style="margin-top:8px">${btn('↓ Xuất sao lưu JSON ngay','export','primary')}${btn('Dọn dẹp về 100 phiên gần nhất','confirmPruneHistory')}</div></div>`:''}
<div class="filter-bar">
<label>Loại: <select id="histFilterActivity"><option value="all" ${historyFilterActivity==='all'?'selected':''}>Tất cả hoạt động</option><option value="exam" ${historyFilterActivity==='exam'?'selected':''}>Thi thử 40 câu</option><option value="learn" ${historyFilterActivity==='learn'?'selected':''}>Học có giải thích</option><option value="test" ${historyFilterActivity==='test'?'selected':''}>Tự kiểm tra</option></select></label>
<label>Thời gian: <select id="histFilterTime"><option value="all" ${historyFilterTime==='all'?'selected':''}>Tất cả thời gian</option><option value="7days" ${historyFilterTime==='7days'?'selected':''}>7 ngày qua</option><option value="30days" ${historyFilterTime==='30days'?'selected':''}>30 ngày qua</option></select></label>
<label>Kết quả: <select id="histFilterResult"><option value="all" ${historyFilterResult==='all'?'selected':''}>Tất cả kết quả</option><option value="pass" ${historyFilterResult==='pass'?'selected':''}>Đạt chuẩn (≥ 7.0)</option><option value="fail" ${historyFilterResult==='fail'?'selected':''}>Cần cải thiện (< 7.0)</option></select></label>
</div>

${filteredSessions.length?`
<div class="card table-wrap">
<table>
  <tr>
    <th>Thời điểm nộp</th>
    <th>Loại / Tên bài</th>
    <th>Điểm số</th>
    <th>Thời gian</th>
    <th>Thao tác</th>
  </tr>
  ${[...filteredSessions].reverse().map(h=>{
const g=C.grade(h,bank,h.ended), isPass=g.score>=7.0;
return `<tr><td>${e(new Date(h.ended).toLocaleString('vi-VN'))}</td><td><span class="chip">${e(h.mode==='exam'?'Thi thử':h.mode==='learn'?'Học':'Kiểm tra')}</span>${h.auto?' <span class="chip" style="background:#ef4444;color:#fff">Hết giờ</span>':''}<br><b>${e(h.title)}</b></td><td><strong style="color:${isPass?'var(--accent)':'#ef4444'}">${g.score.toFixed(2)}/10</strong><br><small class="muted">${g.correct}/${g.total} câu</small></td><td>${minutes(g.elapsed)}</td><td><a class="btn light" style="padding:4px 8px;font-size:12px" href="#result/${h.id}">Chi tiết →</a></td></tr>`;
}).join('')}
</table>
</div>`:`
<div class="card empty">
<p>Không tìm thấy bài làm nào phù hợp với bộ lọc hiện tại.</p>
</div>`}`;

const fa=document.querySelector('#histFilterActivity');
const ft=document.querySelector('#histFilterTime');
const fr=document.querySelector('#histFilterResult');
if(fa)fa.onchange=e=>{historyFilterActivity=e.target.value;render()};
if(ft)ft.onchange=e=>{historyFilterTime=e.target.value;render()};
if(fr)fr.onchange=e=>{historyFilterResult=e.target.value;render()};
}

function wrongIds(){
const latest=new Map();
for(const h of state.history)for(const id of h.ids){const q=qmap.get(id);if(q)latest.set(id,h.answers[id]!==q.correct)}
return [...latest].filter(([_,bad])=>bad).map(([id])=>id);
}

function review(){
const stats=state.questionStats||{};
const needsPractice=C.getQuestionsByMastery(bank,stats,'needs_practice');
const inReview=C.getQuestionsByMastery(bank,stats,'in_review');
const mastered=C.getQuestionsByMastery(bank,stats,'mastered');
const marked=C.getMarkedQuestions(bank,stats);

let currentList=[], tabTitle='';
if(activeReviewTab==='in_review'){currentList=inReview;tabTitle='Đang củng cố (Làm đúng 1 lần)'}
else if(activeReviewTab==='mastered'){currentList=mastered;tabTitle='Đã khắc phục hoàn toàn (Đúng 2 lần liên tiếp)'}
else if(activeReviewTab==='marked'){currentList=marked;tabTitle='Câu hỏi đã đánh dấu'}
else{currentList=needsPractice;tabTitle='Cần ôn tập (Làm sai gần nhất hoặc chuỗi = 0)'}

app.innerHTML=pageTop('SỔ ÔN TẬP THÔNG MINH','Biến câu sai thành điểm mạnh.','Tuân thủ quy tắc CL-01: một câu từng sai chỉ đạt "Đã khắc phục" khi làm đúng 2 lần liên tiếp trong 2 phiên luyện tập riêng biệt.')+`
<div class="review-tabs" role="tablist">
<button type="button" role="tab" class="review-tab ${activeReviewTab==='needs_practice'?'active':''}" data-action="switchReviewTab|needs_practice" aria-selected="${activeReviewTab==='needs_practice'}">Cần ôn tập <span class="badge badge-needs-practice">${needsPractice.length}</span></button>
<button type="button" role="tab" class="review-tab ${activeReviewTab==='in_review'?'active':''}" data-action="switchReviewTab|in_review" aria-selected="${activeReviewTab==='in_review'}">Đang củng cố <span class="badge badge-in-review">${inReview.length}</span></button>
<button type="button" role="tab" class="review-tab ${activeReviewTab==='mastered'?'active':''}" data-action="switchReviewTab|mastered" aria-selected="${activeReviewTab==='mastered'}">Đã khắc phục <span class="badge badge-mastered">${mastered.length}</span></button>
<button type="button" role="tab" class="review-tab ${activeReviewTab==='marked'?'active':''}" data-action="switchReviewTab|marked" aria-selected="${activeReviewTab==='marked'}">Đã đánh dấu <span class="chip">${marked.length}</span></button>
</div>

<div class="section-head">
<h2>${tabTitle} (${currentList.length} câu)</h2>
${currentList.length?btn('Luyện tập danh sách này ('+currentList.length+' câu) →','practiceCurrentReviewList','primary'):''}
</div>

${currentList.length?currentList.map((q,idx)=>{
const rec=stats[q.id]||{};
const statusBadge=rec.masteryStatus==='mastered'
?'<span class="badge badge-mastered">Đã khắc phục (chuỗi: '+rec.consecutiveCorrect+')</span>'
:rec.masteryStatus==='in_review'
?'<span class="badge badge-in-review">Đang củng cố (chuỗi: 1)</span>'
:'<span class="badge badge-needs-practice">Cần ôn (sai '+(rec.wrongCount||1)+' lần)</span>';

return `<div class="card review-item"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div><span class="chip">Bài ${q.chapter} · ${e(q.topic)}</span> ${statusBadge}</div><div>${btn(rec.marked?(icon('star-fill')+' Bỏ lưu'):(icon('review')+' Lưu câu này'),'mark|'+q.id,'light')}</div></div><h3>Câu ${idx+1}: ${e(q.stem)}</h3>${rationale(q)}<div class="actions" style="margin-top:12px">${btn('Luyện riêng câu này →','single|'+q.id,'light')}</div></div>`;
}).join(''):`
<div class="card empty">
<p>Không có câu hỏi nào trong danh mục này.</p>
${activeReviewTab==='needs_practice'?'<p class="muted">Tuyệt vời! Bạn không còn câu hỏi nào cần ôn tập cấp thiết.</p>':''}
</div>`}`;
}

function sources(id){
const cs=id?[chapter(id)].filter(Boolean):chapters;
app.innerHTML=pageTop('NGUỒN & ĐỘ BAO PHỦ','Bản đồ tài liệu.','Số trang là vị trí trong file PDF, gồm cả trang bìa. Các phần diễn giải dễ hiểu, ví dụ và câu hỏi là nội dung biên soạn dựa trên nguồn, không phải nguyên văn slide.')+`<div class="note">Đã nhận đủ 9 tài liệu. Những trang bìa, mục lục và chuyển mục được quản lý trong bảng trang gốc; nội dung chuyên môn được đối chiếu theo các mục dưới đây. Ghi chú xác minh được hiển thị riêng, không xem là nội dung đã xác thực.</div>${cs.map(c=>`<div class="card review-item"><h2>Bài ${c.id} · ${e(c.title)}</h2>${source(c,'1–'+c.pages)}${externalNotes(c)}<div class="table-wrap"><table><tr><th>Mục học</th><th>Trang PDF</th><th>Câu luyện</th></tr>${c.sections.map(s=>`<tr><td><a href="#lesson/${c.id}/${encodeURIComponent(s.id)}">${e(s.id)} · ${e(s.title)}</a></td><td>${s.from}–${s.to}</td><td>${c.questions.filter(q=>q.section===s.id).length}</td></tr>`).join('')}</table></div>${c.issues.length?`<div class="note warn">${list(c.issues.map(i=>'Trang '+i.page+': '+i.note))}</div>`:''}<details><summary>Đối chiếu từng trang gốc</summary><div class="table-wrap"><table><tr><th>Trang</th><th>Tiêu đề / văn bản nhận diện</th><th>Ánh xạ bài học</th></tr>${(window.SOURCE_PAGES?.[c.id]||[]).map(p=>{const matches=c.sections.filter(s=>p.page>=s.from&&p.page<=s.to);return `<tr class="coverage-row"><td>${p.page}</td><td>${e(p.heading||'Trang ảnh / ít văn bản — xem ghi chú nguồn')}</td><td>${matches.map(s=>e(s.id)).join(', ')||'Bìa / mục lục / chuyển mục hoặc cần đối chiếu'}</td></tr>`}).join('')}</table></div></details></div>`).join('')}`;
}

function settings(){
app.innerHTML=pageTop('DỮ LIỆU CÁ NHÂN','Giữ lại hành trình học.','Website công khai; tiến độ và lịch sử của bạn không được đưa lên máy chủ.')+`<div class="card"><h2>Cơ chế lưu trên trình duyệt</h2>${list(['Dữ liệu nằm trong localStorage của trình duyệt hiện tại, trên đúng thiết bị và địa chỉ website này.','Không có tài khoản hoặc đồng bộ giữa các thiết bị. Người cùng dùng hồ sơ trình duyệt có thể xem lịch sử ở đây.','Xóa dữ liệu website, chế độ riêng tư hoặc đổi trình duyệt có thể làm mất dữ liệu. Hãy xuất bản sao lưu định kỳ.','Bài thi lưu thời điểm kết thúc tuyệt đối. Đóng trang không dừng đồng hồ; mở lại sau hạn sẽ tự nộp.','Bổ sung học liệu dùng mã bài/câu ổn định; tiến độ và lịch sử hiện có được giữ lại khi cập nhật.'])}<div class="actions">${btn('↓ Xuất bản sao lưu JSON','export','primary')}${btn('↑ Nhập bản sao lưu','import')}</div><input id="importFile" type="file" accept="application/json,.json"><p class="tiny muted">Nhập sao lưu sẽ thay dữ liệu hiện tại sau khi xác nhận. Nên xuất bản hiện tại trước.</p></div><div class="card review-item"><h2>Bổ sung tài liệu sau này</h2><p>Gửi thêm file trong cuộc trò chuyện để cập nhật website. Bản cập nhật giữ mã bài và câu hiện có, bổ sung mục mới và cập nhật bảng đối chiếu nguồn. Xuất sao lưu trước mỗi lần thay đổi lớn.</p><a href="#sources">Xem danh mục nguồn →</a></div>`;
const fi=document.querySelector('#importFile');
if(fi)fi.onchange=async ev=>{try{const f=ev.target.files[0];if(!f)return;const candidate=C.importUserDataJSON(await f.text(),bank);const unknown=[...candidate.marked,...candidate.history.flatMap(h=>h.ids),...(candidate.active?.ids||[])].filter(id=>!qmap.has(id));if(unknown.length)throw Error('Bản sao lưu chứa câu hỏi không có trong phiên bản học liệu này.');if(!confirm('Thay dữ liệu hiện tại bằng bản sao lưu này?'))return;state=candidate;save();toast('Đã khôi phục bản sao lưu.');render()}catch(err){toast(err.message)}};
}

/* Feature 001 Targeted DOM Micro-Updates & Keyboard Accessibility */
function safeFocus(el,preventScroll=true){
if(el&&typeof el.focus==='function'){
try{el.focus({preventScroll})}catch(_){try{el.focus()}catch(__){}}
}
}

function updateOptionSelection(optIdx,triggerEl){
const a=state.active;if(!a)return;
const q=qmap.get(a.ids[a.index]);if(!q)return;
if(a.mode==='learn'&&Object.hasOwn(a.answers,q.id))return;
a.answers[q.id]=Number(optIdx);
save();
const isLearn=a.mode==='learn';
const optBtns=app.querySelectorAll?app.querySelectorAll('.option[data-action^="answer|"]'):[];
if(optBtns.length){
optBtns.forEach((btn,k)=>{
const isSel=k===Number(optIdx);
btn.classList?.toggle?.('selected',isSel);
btn.setAttribute?.('aria-pressed',String(isSel));
if(isLearn){
btn.classList?.toggle?.('right',k===q.correct);
btn.classList?.toggle?.('wrong',isSel&&k!==q.correct);
btn.disabled=true;
}
});
}
if(isLearn){
const parentCard=(triggerEl||app.querySelector?.('.option'))?.closest?.('.card')||app.querySelector?.('.quiz-layout > .card');
if(parentCard){
let rBlock=parentCard.querySelector?.('.rationale');
if(!rBlock){
const placeholder=parentCard.querySelector?.('p.tiny.muted');
const rHtml=rationale(q);
if(placeholder&&placeholder.textContent?.includes('chưa được công bố')){
  if('outerHTML' in placeholder)placeholder.outerHTML=rHtml;
  else placeholder.textContent=rHtml;
}else{
  const actDiv=parentCard.querySelector?.('.actions');
  if(actDiv)actDiv.insertAdjacentHTML('beforebegin',rHtml);
}
}
}
}
const qnavBtn=app.querySelector?.(`.qnav button[data-action="jump|${a.index}"]`);
if(qnavBtn)qnavBtn.classList?.toggle?.('answered',true);
const counterEl=app.querySelector?.('.lesson-nav p.tiny.muted');
if(counterEl&&counterEl.textContent?.includes('câu đã trả lời')){
counterEl.textContent=`${Object.keys(a.answers).length}/${a.ids.length} câu đã trả lời`;
}
safeFocus(triggerEl||app.querySelector?.(`.option[data-action="answer|${optIdx}"]`));
}

function updateFlagState(triggerEl){
const a=state.active;if(!a)return;
const id=a.ids[a.index];
const isFlagged=a.flags.includes(id);
a.flags=isFlagged?a.flags.filter(x=>x!==id):[...a.flags,id];
save();
const flagBtn=triggerEl||app.querySelector?.('button[data-action="flag"]');
if(flagBtn)flagBtn.innerHTML=a.flags.includes(id)?(icon('star-fill')+' Đã đánh dấu'):(icon('review')+' Đánh dấu xem lại');
const qnavBtn=app.querySelector?.(`.qnav button[data-action="jump|${a.index}"]`);
if(qnavBtn)qnavBtn.classList?.toggle?.('flagged',a.flags.includes(id));
safeFocus(flagBtn);
}

function updateSectionCompletion(chId,secId,triggerEl){
const key=chId+':'+secId;
const isDone=state.completed.includes(key);
state.completed=isDone?state.completed.filter(x=>x!==key):[...state.completed,key];
save();
const compBtn=triggerEl||app.querySelector?.(`button[data-action="complete|${chId}|${secId}"]`);
if(compBtn)compBtn.innerHTML=state.completed.includes(key)?(icon('check')+' Đã học mục này'):'Đánh dấu đã học';
const navLink=app.querySelector?.(`.lesson-nav a[href="#lesson/${chId}/${encodeURIComponent(secId)}"]`);
if(navLink){
const checkSpan=navLink.querySelector?.('.nav-check');
if(checkSpan){
checkSpan.innerHTML=state.completed.includes(key)?icon('check'):'';
} else {
const baseText=navLink.textContent.replace(/\s*✓\s*$/,'').trim();
navLink.innerHTML=`${e(baseText)} <span class="nav-check">${state.completed.includes(key)?icon('check'):''}</span>`;
}
}
safeFocus(compBtn);
}

function updateBookmarkState(qid,triggerEl){
const isMarked=state.marked.includes(qid);
state.marked=isMarked?state.marked.filter(x=>x!==qid):[...state.marked,qid];
save();
const markBtn=triggerEl||app.querySelector?.(`button[data-action="mark|${qid}"]`);
if(markBtn)markBtn.innerHTML=state.marked.includes(qid)?(icon('star-fill')+' Bỏ đánh dấu'):(icon('review')+' Lưu câu này');
safeFocus(markBtn);
}

/* Master Route & Render Dispatcher */
function render(){
closeDrawer();
clearInterval(tick);tick=null;timerEl=null;
if(state.active?.deadline&&Date.now()>=state.active.deadline){submit(true);return}
route=location.hash.slice(1)||'home';
const [page,id,sectionId,modelId]=route.split('/');

const nav=[['home','home','Tổng quan'],['courses','courses','Giáo trình'],['terms','terms','Thuật ngữ'],['models','models','Mô hình trực quan'],['practice','practice','Luyện tập'],['exam','exam','Thi thử'],['review','review','Sổ ôn tập'],['history','history','Lịch sử'],['sources','sources','Nguồn tài liệu'],['settings','settings','Dữ liệu cá nhân']];
const navEl=document.querySelector('#nav');
if(navEl)navEl.innerHTML=nav.map(([k,i,t])=>`<a class="${page===k||(k==='courses'&&page==='lesson')?'active':''}" href="#${k}"><i>${icon(i)}</i>${t}</a>`).join('');

const mobNavEl=document.querySelector('#mobileNav');
if(mobNavEl){
const mobItems=[['home','home','Trang chủ'],['courses','courses','Bài học'],['practice','practice','Luyện tập'],['exam','exam','Thi thử']];
mobNavEl.innerHTML=mobItems.map(([k,i,t])=>`<a class="${page===k||(k==='courses'&&page==='lesson')?'active':''}" href="#${k}">${icon(i)}<span>${t}</span></a>`).join('')+`<button type="button" data-action="openDrawer" aria-label="Mở menu danh mục">${icon('menu')}<span>Thêm</span></button>`;
}

const drawerNavEl=document.querySelector('#drawerNav');
if(drawerNavEl){
const drawerItems=[['terms','terms','Thuật ngữ'],['models','models','Mô hình'],['review','review','Sổ ôn tập'],['history','history','Lịch sử'],['sources','sources','Nguồn tài liệu'],['settings','settings','Dữ liệu cá nhân']];
drawerNavEl.innerHTML=drawerItems.map(([k,i,t])=>`<a class="${page===k?'active':''}" href="#${k}" data-action="closeDrawer">${icon(i)}<span>${t}</span></a>`).join('')+`<button type="button" class="drawer-nav-theme" data-action="toggleTheme" style="grid-column:span 2;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:var(--radius-md);background:var(--bg-subtle);border:1px solid var(--border-default);color:var(--text-primary);font-size:12px;font-weight:600;min-height:44px">${icon('sun')}<span>Đổi giao diện Sáng / Tối</span></button>`;
}

updateThemeControls();

if(page==='session')session();
else if(page==='dashboard')home();
else if(page==='lesson')lesson(id);
else if(page==='courses')courses();
else if(page==='terms')terms();
else if(page==='models')app.innerHTML=window.ModelUI.catalog(id||'all');
else if(page==='practice')practice(id);
else if(page==='exam')exam();
else if(page==='history')historyPage();
else if(page==='review')review();
else if(page==='result')result(id);
else if(page==='sources')sources(id);
else if(page==='settings')settings();
else home();

if(storageError)app.insertAdjacentHTML('afterbegin',`<div class="note error">${e(storageError)}</div>`);
if(sectionId){requestAnimationFrame(()=>document.getElementById(modelId?'model-'+decodeURIComponent(modelId):'section-'+decodeURIComponent(sectionId))?.scrollIntoView())}
else window.scrollTo(0,0);
}

/* Global Click Event Delegation */
document.addEventListener('click',ev=>{
const b=ev.target.closest('[data-action]');
if(!b)return;
const [action,...args]=b.dataset.action.split('|');
const a=state.active;
switch(action){
case 'startAdaptive':{
const mode=args[0]||'adaptive_mixed';
const count=Number(args[1])||10;
const qs=C.selectAdaptiveQuestions(bank,state.questionStats,mode,count);
if(!qs.length)return toast('Không có câu hỏi phù hợp cho chế độ này.');
const titles={unseen:'Luyện câu chưa làm',frequent_wrong:'Luyện câu hay sai',weak_chapter:'Củng cố chương yếu',adaptive_mixed:'Hỗn hợp thích ứng 50/30/20'};
begin(qs.map(q=>q.id),'learn',titles[mode]||'Luyện tập thích ứng');
break;
}
case 'switchReviewTab':
activeReviewTab=args[0]||'needs_practice';
render();
break;
case 'practiceCurrentReviewList':{
const stats=state.questionStats||{};
let qs=[];
if(activeReviewTab==='in_review')qs=C.getQuestionsByMastery(bank,stats,'in_review');
else if(activeReviewTab==='mastered')qs=C.getQuestionsByMastery(bank,stats,'mastered');
else if(activeReviewTab==='marked')qs=C.getMarkedQuestions(bank,stats);
else qs=C.getQuestionsByMastery(bank,stats,'needs_practice');
if(!qs.length)return toast('Danh sách hiện tại không có câu hỏi để luyện tập.');
begin(C.shuffle(qs).map(q=>q.id),'learn','Ôn tập: '+(activeReviewTab==='marked'?'Câu đã đánh dấu':activeReviewTab==='mastered'?'Câu đã khắc phục':activeReviewTab==='in_review'?'Câu đang củng cố':'Câu cần ôn'));
break;
}
case 'closeQuotaModal':
document.querySelector('#quotaModal')?.remove();
break;
case 'toggleTheme': cycleThemeMode(); break;
case 'openDrawer': openDrawer(); break;
case 'closeDrawer': closeDrawer(); break;
case 'complete': updateSectionCompletion(args[0],args[1],b); break;
case 'sectionPractice':{
const qs=bank.filter(q=>q.chapter===args[0]&&q.section===args[1]);
if(!qs.length)return go('practice/'+args[0]);
begin(C.shuffle(qs).map(q=>q.id),'learn','Bài '+args[0]+' · Mục '+args[1]);
break;
}
case 'startPractice':{
const val=id=>document.querySelector('#'+id)?.value, ch=val('practiceChapter'), topic=val('practiceTopic'), level=val('practiceLevel');
let qs=C.shuffle(bank.filter(q=>(ch==='all'||q.chapter===ch)&&(topic==='all'||q.topic===topic)&&(level==='all'||q.level===level)));
const n=val('practiceCount');
if(n!=='all')qs=qs.slice(0,Number(n));
begin(qs.map(q=>q.id),val('practiceMode'),ch==='all'?'Luyện tập tổng hợp':'Luyện tập Bài '+ch);
break;
}
case 'startExam':
begin(C.makeExam(bank,args[0]==='fixed',state.seen),'exam',args[0]==='fixed'?'Đề cố định A':'Đề ngẫu nhiên');
break;
case 'answer': if(a)updateOptionSelection(args[0],b); break;
case 'flag': if(a)updateFlagState(b); break;
case 'jump':
if(a){
a.index=Number(args[0]);
save();
render();
safeFocus(app.querySelector?.('.option')||app.querySelector?.('.question'));
}
break;
case 'prev':
if(a){
a.index=Math.max(0,a.index-1);
save();
render();
safeFocus(app.querySelector?.('button[data-action="prev"]'));
}
break;
case 'next':
if(a){
a.index=(a.index+1)%a.ids.length;
save();
render();
safeFocus(app.querySelector?.('button[data-action="next"]'));
}
break;
case 'submit': submit(); break;
case 'mark': updateBookmarkState(args[0],b); break;
case 'retry':{
const h=state.history.find(h=>h.id===args[0]);
if(h)begin(h.ids.filter(id=>h.answers[id]!==qmap.get(id)?.correct),'learn','Ôn lại câu sai / bỏ trống');
break;
}
case 'reviewWrong': begin(C.shuffle(wrongIds()),'learn','Ôn lại câu sai'); break;
case 'reviewMarked': begin(C.shuffle(state.marked.filter(id=>qmap.has(id))),'learn','Ôn câu đã đánh dấu'); break;
case 'single': begin([args[0]],'learn','Ôn câu đã lưu'); break;
case 'export':{
const url=URL.createObjectURL(new Blob([C.exportUserDataJSON(state)],{type:'application/json'}));
const link=document.createElement('a');
link.href=url;
link.download='netstudy-sao-luu-'+new Date().toISOString().slice(0,10)+'.json';
link.click();
setTimeout(()=>URL.revokeObjectURL(url),1000);
toast('Đã xuất bản sao lưu.');
break;
}
case 'import': document.querySelector('#importFile')?.click(); break;
case 'confirmPruneHistory':{
if(confirm('Bạn có chắc muốn dọn dẹp lịch sử và chỉ giữ lại 100 phiên chi tiết gần nhất? (Bảng thống kê tích lũy câu hỏi vẫn được bảo lưu vĩnh viễn)')){
C.pruneHistorySafely(state,100);
save();
render();
const qm=document.querySelector('#quotaModal');if(qm)qm.remove();
toast('Đã dọn dẹp và giữ lại 100 phiên gần nhất.');
}
break;
}
}
});

/* Keyboard Navigation (Feature 001 Guarded Accessibility + Escape) */
document.addEventListener('keydown',ev=>{
if(ev.key==='Escape'){
const d=document.querySelector('#mobileDrawer');
if(d&&d.classList?.contains?.('open')){
closeDrawer();
return;
}
}
if(route!=='session'||!state.active)return;
const tag=document.activeElement?.tagName;
if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
if(ev.altKey||ev.ctrlKey||ev.metaKey)return;
const k=ev.key?ev.key.toUpperCase():'';
if(['1','A'].includes(k)){ev.preventDefault();updateOptionSelection(0)}
else if(['2','B'].includes(k)){ev.preventDefault();updateOptionSelection(1)}
else if(['3','C'].includes(k)){ev.preventDefault();updateOptionSelection(2)}
else if(['4','D'].includes(k)){ev.preventDefault();updateOptionSelection(3)}
else if(k==='F'){ev.preventDefault();updateFlagState()}
else if(k==='ARROWLEFT'||k==='P'){
ev.preventDefault();
const a=state.active;
if(a&&a.index>0){a.index--;save();render();safeFocus(app.querySelector?.('.option')||app.querySelector?.('.question'))}
}
else if(k==='ARROWRIGHT'||k==='N'){
ev.preventDefault();
const a=state.active;
if(a&&a.index<a.ids.length-1){a.index++;save();render();safeFocus(app.querySelector?.('.option')||app.querySelector?.('.question'))}
}
});

/* Lifecycle & Route Events */
window.addEventListener('hashchange',render);
window.addEventListener('focus',()=>{if(state.active?.deadline&&Date.now()>=state.active.deadline)submit(true)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.active?.deadline&&Date.now()>=state.active.deadline)submit(true)});
render();
setInterval(()=>{if(state.active?.deadline&&Date.now()>=state.active.deadline)submit(true)},1000);
