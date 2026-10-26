const fs=require('fs'),vm=require('vm'),assert=require('assert');
const figures=new Map(),handlers={},cards=[];
const document={activeElement:null,addEventListener(type,fn){handlers[type]=fn},getElementById(id){return figures.get(id)},querySelectorAll(){return cards}};
const ctx={window:{},document};vm.createContext(ctx);
for(const f of ['data.js','models.js','model-ui.js'])vm.runInContext(fs.readFileSync(__dirname+'/dist/'+f,'utf8'),ctx);
const {NET_MODELS:models,COURSE:course,ModelUI:UI}=ctx.window;
assert.equal(models.length,27);assert.equal(new Set(models.map(m=>m.id)).size,models.length);
assert.equal(new Set(models.map(m=>m.chapter)).size,course.length);
let count=0,svgs=[];
for(const m of models){
 const ch=course.find(c=>c.id===m.chapter);assert(ch&&ch.sections.some(s=>s.id===m.section),m.id+' source');
 const ids=new Set(m.nodes.map(n=>n.id)),edges=new Set(m.edges.map(e=>e.id));assert.equal(ids.size,m.nodes.length);assert.equal(edges.size,m.edges.length);
 for(const e of m.edges)assert(ids.has(e.fromId)&&ids.has(e.toId),m.id+' edge');
 for(const n of m.nodes)assert(/^[a-i]$/.test(n.slot));
 const diagram={innerHTML:''},panel={innerHTML:'',contains:()=>false};figures.set('model-'+m.id,{querySelector:s=>s==='.model-diagram'?diagram:panel});
 for(let i=0;i<m.steps.length;i++){
  const s=m.steps[i];assert(s.edges.length);for(const id of s.edges)assert(edges.has(id));
  const content=UI.svg(m,i);assert(content.includes('role="img"'));assert(!content.includes('NaN'));assert.equal((content.match(/class="model-node/g)||[]).length,m.nodes.length);assert.equal((content.match(/class="model-edge is-active/g)||[]).length,new Set(s.edges).size);
  assert(UI.selectStep(m.id,i));assert.equal(diagram.innerHTML,content);assert(panel.innerHTML.includes('aria-live="polite"'));assert(panel.innerHTML.includes('aria-pressed="true"'));
  // Real delegated event: a step button changes the displayed diagram/body, not learner state.
  const next=(i+1)%m.steps.length;handlers.click({target:{closest:()=>({dataset:{modelTarget:m.id,modelStep:String(next)}})}});assert.equal(diagram.innerHTML,UI.svg(m,next));
  count++;
 }
 const before=diagram.innerHTML;assert.equal(UI.selectStep(m.id,-1),false);assert.equal(UI.selectStep(m.id,m.steps.length),false);assert.equal(UI.selectStep(m.id,NaN),false);assert.equal(diagram.innerHTML,before);
 const html=UI.renderSection(m.chapter,m.section);assert(html.includes('id="model-'+m.id+'"'));assert(html.includes('Đọc liên tục toàn bộ cơ chế'));assert(html.includes('Giới hạn của hình'));
 svgs.push({id:m.id,svg:UI.svg(m,Math.min(1,m.steps.length-1))});
}
assert.equal(UI.selectStep('missing',0),false);
for(const m of models)cards.push({dataset:{modelChapter:m.chapter},hidden:false});handlers.change({target:{id:'modelChapterFilter',value:'6'}});assert(cards.every(c=>c.hidden===(c.dataset.modelChapter!=='6')));handlers.change({target:{id:'modelChapterFilter',value:'all'}});assert(cards.every(c=>!c.hidden));
// Check numeric worked examples independently.
const modpow=(b,e,n)=>{let v=1n;for(;e>0n;e>>=1n,b=b*b%n)if(e&1n)v=v*b%n;return v};
assert.equal(modpow(7n,3n,55n),13n);assert.equal(modpow(13n,27n,55n),7n);
assert.equal(modpow(5n,6n,23n),8n);assert.equal(modpow(5n,15n,23n),19n);assert.equal(modpow(19n,6n,23n),2n);assert.equal(modpow(8n,15n,23n),2n);
assert.equal((0b1010^0b0110)^(0b1100^0b0110),0b1010^0b1100);
if(process.env.EXPORT_MODEL_SVGS)fs.writeFileSync(process.env.EXPORT_MODEL_SVGS,JSON.stringify(svgs));
console.log(JSON.stringify({models:models.length,steps:count,checks:'PASS: sources, SVG edges/highlights, every step, delegated clicks, invalid indices, chapter filter, RSA/DH/OTP numeric examples'}));
