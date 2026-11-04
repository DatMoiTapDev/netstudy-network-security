(function(root){
const VERSION=2, KEY='netstudy-atmmt-v1';
function freshV2(){return {version:2,completed:[],marked:[],history:[],active:null,seen:[],questionStats:{},savedExams:[],bookmarks:[]}}
function fresh(v=2){if(v===1)return {version:1,completed:[],marked:[],history:[],active:null,seen:[]};return freshV2()}
function validate(s){
if(!s||(s.version!==1&&s.version!==2)||!Array.isArray(s.completed)||!Array.isArray(s.marked)||!Array.isArray(s.history)||!Array.isArray(s.seen))throw Error('Bản sao lưu không đúng định dạng NetStudy.');
if(s.version===2){
if(!s.questionStats||typeof s.questionStats!=='object'||Array.isArray(s.questionStats))throw Error('questionStats không hợp lệ.');
if(s.savedExams&&!Array.isArray(s.savedExams))throw Error('savedExams không hợp lệ.');
if(s.bookmarks&&!Array.isArray(s.bookmarks))throw Error('bookmarks không hợp lệ.');
}
for(const h of s.history){if(!Array.isArray(h.ids)||!h.answers||!Number.isFinite(h.started)||!Number.isFinite(h.ended))throw Error('Lịch sử không hợp lệ.')}
if(s.active&&(!Array.isArray(s.active.ids)||!s.active.ids.length||!s.active.answers||!Array.isArray(s.active.flags)||!Number.isFinite(s.active.started)||!Number.isInteger(s.active.index)||s.active.index<0||s.active.index>=s.active.ids.length||!['learn','test','exam'].includes(s.active.mode)||(s.active.mode==='exam'&&(!Number.isFinite(s.active.deadline)||s.active.ids.length!==40))))throw Error('Bài đang làm không hợp lệ.');
for(const session of [...s.history,...(s.active?[s.active]:[])]){
if(!session.ids.length||!session.answers||Array.isArray(session.answers)||typeof session.answers!=='object')throw Error('Dữ liệu câu trả lời không hợp lệ.');
if(typeof session.id!=='string'||!/^\d+$/.test(session.id)||typeof session.title!=='string'||!['learn','test','exam'].includes(session.mode))throw Error('Thông tin lượt làm bài không hợp lệ.');
if(new Set(session.ids).size!==session.ids.length)throw Error('Bản sao lưu có câu hỏi trùng.');
for(const [id,v] of Object.entries(session.answers)){if(!session.ids.includes(id)||!Number.isInteger(v)||v<0||v>3)throw Error('Câu trả lời trong sao lưu không hợp lệ.')}
}
return s;
}
function validateV2(s){if(!s||s.version!==2)throw Error('Lược đồ không phải Version 2.');return validate(s)}
function shuffle(a,rng=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function seeded(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const matrix={'1':4,'2a':3,'2b':3,'3':6,'4':5,'5':5,'6':6,'7':5,'8':3};
const levelMatrix={'1':[1,2,1],'2a':[1,1,1],'2b':[1,2,0],'3':[2,3,1],'4':[1,3,1],'5':[2,2,1],'6':[2,3,1],'7':[1,3,1],'8':[1,1,1]};
function makeExam(bank,fixed=false,seen=[]){
const rng=fixed?seeded(533):Math.random;let chosen=[];
for(const [chapter,n] of Object.entries(matrix)){
let pool=bank.filter(q=>q.chapter===chapter);
if(pool.length<n)throw Error('Ngân hàng chưa đủ câu cho Bài '+chapter);
pool=shuffle(pool,rng);
if(!fixed)pool.sort((a,b)=>Number(seen.includes(a.id))-Number(seen.includes(b.id)));
let selected=[];const [recognize,understand,apply]=levelMatrix[chapter];
const targets={'Nhận biết':recognize,'Thông hiểu':understand,'Vận dụng':apply};
for(const [level,count] of Object.entries(targets)){const available=pool.filter(q=>q.level===level);selected.push(...available.slice(0,count))}
for(const q of pool){if(selected.length>=n)break;if(!selected.includes(q))selected.push(q)}
chosen.push(...selected.slice(0,n));
}
return shuffle(chosen,rng).map(q=>q.id);
}
function grade(session,bank,now=Date.now()){
let correct=0,wrong=0,blank=0,topics={};const map=new Map(bank.map(q=>[q.id,q]));
for(const id of session.ids){
const q=map.get(id);if(!q)continue;const a=session.answers[id];
let good=a===q.correct;
if(a===undefined||a===null)blank++;else if(good)correct++;else wrong++;
const key=q.chapter+' · '+q.topic;topics[key]??={correct:0,total:0,chapter:q.chapter};
topics[key].total++;if(good)topics[key].correct++;
}
const elapsed=Math.max(0,Math.min(now,session.deadline||now)-session.started);
return {correct,wrong,blank,total:session.ids.length,score:correct/session.ids.length*10,rate:correct/session.ids.length*100,elapsed,topics};
}
function normalizeQuestionRecord(questionId,chapter='',level='',existing=null){
return {
questionId:String(questionId),chapter:String(chapter||existing?.chapter||''),level:String(level||existing?.level||''),
attempts:Number.isInteger(existing?.attempts)?existing.attempts:0,correctCount:Number.isInteger(existing?.correctCount)?existing.correctCount:0,
wrongCount:Number.isInteger(existing?.wrongCount)?existing.wrongCount:0,consecutiveCorrect:Number.isInteger(existing?.consecutiveCorrect)?existing.consecutiveCorrect:0,
masteryStatus:['needs_practice','in_review','mastered'].includes(existing?.masteryStatus)?existing.masteryStatus:'needs_practice',
lastAttempted:Number.isFinite(existing?.lastAttempted)?existing.lastAttempted:null,lastResult:typeof existing?.lastResult==='boolean'?existing.lastResult:null,
marked:Boolean(existing?.marked)
};
}
function initQuestionStats(bank=[],existingStats={}){
const stats={};
if(Array.isArray(bank)){for(const q of bank)stats[q.id]=normalizeQuestionRecord(q.id,q.chapter,q.level,existingStats[q.id])}
for(const [id,rec] of Object.entries(existingStats||{})){if(!stats[id])stats[id]=normalizeQuestionRecord(id,rec.chapter,rec.level,rec)}
return stats;
}
function updateQuestionMastery(record,isCorrect,sessionType){
if(!record)return record;
record.attempts=(record.attempts||0)+1;record.lastAttempted=Date.now();record.lastResult=Boolean(isCorrect);
if(!isCorrect){record.wrongCount=(record.wrongCount||0)+1;record.consecutiveCorrect=0;record.masteryStatus='needs_practice'}
else{
record.correctCount=(record.correctCount||0)+1;record.consecutiveCorrect=(record.consecutiveCorrect||0)+1;
if(sessionType==='exam'){if(record.masteryStatus!=='mastered')record.masteryStatus=record.consecutiveCorrect>=1?'in_review':'needs_practice'}
else{record.masteryStatus=record.consecutiveCorrect>=2?'mastered':'in_review'}
}
return record;
}
function toggleQuestionMarked(stats,questionId){
if(!stats)return false;if(!stats[questionId])stats[questionId]=normalizeQuestionRecord(questionId);
stats[questionId].marked=!stats[questionId].marked;return stats[questionId].marked;
}
function migrateStorageToV2(raw,bank=null){
if(!raw||typeof raw!=='object')return fresh(2);
if(raw.version===2&&raw.questionStats&&typeof raw.questionStats==='object'){
return {
version:2,completed:Array.isArray(raw.completed)?[...raw.completed]:[],marked:Array.isArray(raw.marked)?[...raw.marked]:[],
history:Array.isArray(raw.history)?[...raw.history]:[],active:raw.active||null,seen:Array.isArray(raw.seen)?[...raw.seen]:[],
questionStats:initQuestionStats(bank||[],raw.questionStats),savedExams:Array.isArray(raw.savedExams)?[...raw.savedExams]:[],
bookmarks:Array.isArray(raw.bookmarks)?[...raw.bookmarks]:(Array.isArray(raw.marked)?[...raw.marked]:[])
};
}
const baseHistory=Array.isArray(raw.history)?raw.history:[];const stats=initQuestionStats(bank||[],{});
const sortedHistory=[...baseHistory].sort((a,b)=>(a.started||0)-(b.started||0));
for(const session of sortedHistory){
if(!session||!Array.isArray(session.ids)||!session.answers)continue;
for(const qId of session.ids){
const ans=session.answers[qId];if(ans===undefined||ans===null)continue;
let isCorrect=null;if(bank&&Array.isArray(bank)){const q=bank.find(item=>item.id===qId);if(q)isCorrect=(ans===q.correct)}
if(isCorrect!==null){if(!stats[qId])stats[qId]=normalizeQuestionRecord(qId);updateQuestionMastery(stats[qId],isCorrect,session.mode||'learn')}
}
}
if(Array.isArray(raw.marked)){for(const id of raw.marked){if(!stats[id])stats[id]=normalizeQuestionRecord(id);stats[id].marked=true}}
return {
version:2,completed:Array.isArray(raw.completed)?[...raw.completed]:[],marked:Array.isArray(raw.marked)?[...raw.marked]:[],
history:[...baseHistory],active:raw.active||null,seen:Array.isArray(raw.seen)?[...raw.seen]:[],questionStats:stats,
savedExams:[],bookmarks:Array.isArray(raw.marked)?[...raw.marked]:[]
};
}
function pruneHistorySafely(store,maxSessions=100){
if(!store||!Array.isArray(store.history))return store;
if(store.history.length>maxSessions)store.history=store.history.slice(-maxSessions);
return store;
}
function exportUserDataJSON(store){return JSON.stringify({app:'NetStudy-Network-Security',exportedAt:new Date().toISOString(),schemaVersion:2,data:store},null,2)}
function importUserDataJSON(jsonStr,bank=null){
if(!jsonStr||typeof jsonStr!=='string')throw Error('Dữ liệu nhập không hợp lệ.');
if(jsonStr.length>10*1024*1024)throw Error('Tệp sao lưu vượt quá dung lượng cho phép (10MB).');
let parsed;try{parsed=JSON.parse(jsonStr)}catch(e){throw Error('Tệp sao lưu không đúng định dạng JSON.')}
const rawData=(parsed&&parsed.data)?parsed.data:parsed;const migrated=migrateStorageToV2(rawData,bank);
validate(migrated);return migrated;
}
function getQuestionsByMastery(bank=[],stats={},status='needs_practice'){
if(!Array.isArray(bank))return [];
return bank.filter(q=>{
const rec=stats[q.id];
if(status==='unseen')return !rec||!rec.attempts;
if(status==='needs_practice')return Boolean(rec&&rec.attempts>0&&rec.masteryStatus==='needs_practice');
return Boolean(rec&&rec.masteryStatus===status);
});
}
function getMarkedQuestions(bank=[],stats={}){if(!Array.isArray(bank))return [];return bank.filter(q=>stats[q.id]?.marked)}
function selectAdaptiveQuestions(bank=[],stats={},mode='adaptive_mixed',count=20){
if(!Array.isArray(bank)||!bank.length)return [];
const limit=(count===Infinity||count==='all'||count<=0)?bank.length:Math.min(count,bank.length);
const qStats=stats||{};
if(mode==='unseen')return bank.filter(q=>!qStats[q.id]?.attempts).slice(0,limit);
if(mode==='frequent_wrong'){
const pool=bank.filter(q=>qStats[q.id]?.wrongCount>0);
pool.sort((a,b)=>{const sa=qStats[a.id],sb=qStats[b.id],rA=sa.wrongCount/sa.attempts,rB=sb.wrongCount/sb.attempts;return rB!==rA?rB-rA:sb.wrongCount-sa.wrongCount});
return pool.slice(0,limit);
}
if(mode==='weak_chapter'){
const chAcc={};
for(const q of bank){chAcc[q.chapter]=chAcc[q.chapter]||{correct:0,attempts:0};const s=qStats[q.id];if(s?.attempts){chAcc[q.chapter].attempts+=s.attempts;chAcc[q.chapter].correct+=s.correctCount}}
const weakChapters=new Set();let minAcc=1,weakest=null;
for(const [ch,acc] of Object.entries(chAcc)){if(acc.attempts>0){const rate=acc.correct/acc.attempts;if(rate<0.70)weakChapters.add(ch);if(rate<minAcc){minAcc=rate;weakest=ch}}}
if(!weakChapters.size&&weakest)weakChapters.add(weakest);
return shuffle(bank.filter(q=>weakChapters.has(q.chapter))).slice(0,limit);
}
if(mode==='adaptive_mixed'){
const wrong=bank.filter(q=>qStats[q.id]&&(qStats[q.id].masteryStatus==='needs_practice'||qStats[q.id].masteryStatus==='in_review')&&qStats[q.id].attempts>0);
const unseen=bank.filter(q=>!qStats[q.id]?.attempts);const mastered=bank.filter(q=>qStats[q.id]?.masteryStatus==='mastered');
const targetWrong=Math.round(limit*0.5),targetUnseen=Math.round(limit*0.3),targetMastered=limit-targetWrong-targetUnseen;
const chosen=new Set(),result=[];
function addFrom(pool,maxCount){
for(const q of shuffle(pool)){
if(result.length>=limit)break;
if(!chosen.has(q.id)){chosen.add(q.id);result.push(q);if(maxCount&&result.length>=maxCount)break}
}
}
addFrom(wrong,targetWrong);addFrom(unseen,result.length+targetUnseen);addFrom(mastered,result.length+targetMastered);
if(result.length<limit)addFrom(unseen);if(result.length<limit)addFrom(wrong);if(result.length<limit)addFrom(bank);
return result.slice(0,limit);
}
return bank.slice(0,limit);
}
function computeChapterProgress(bank=[],stats={},completedSections=[]){
if(!Array.isArray(bank))return [];
const chapters={},secSet=new Set(Array.isArray(completedSections)?completedSections:[]);
for(const q of bank){
const ch=q.chapter;
if(!chapters[ch])chapters[ch]={chapterId:ch,totalQuestions:0,attemptedQuestions:0,correctCount:0,wrongCount:0,masteredCount:0,sections:new Set()};
const c=chapters[ch];c.totalQuestions++;if(q.section)c.sections.add(q.section);
const s=stats[q.id];if(s?.attempts>0){c.attemptedQuestions++;c.correctCount+=s.correctCount;c.wrongCount+=s.wrongCount;if(s.masteryStatus==='mastered')c.masteredCount++}
}
return Object.values(chapters).map(c=>{
let completedCount=0;for(const sec of c.sections)if(secSet.has(sec))completedCount++;
c.completedSections=completedCount;c.totalSections=c.sections.size;c.totalAttempts=c.correctCount+c.wrongCount;
c.accuracyRate=c.totalAttempts>0?(c.correctCount/c.totalAttempts*100):null;
c.isWeak=(c.totalAttempts>=3&&c.accuracyRate!==null&&c.accuracyRate<70);delete c.sections;return c;
});
}
function computeOverallProgress(bank=[],stats={},completedSections=[]){
const totalQuestions=bank.length;let attempted=0,mastered=0,correct=0,wrong=0;
for(const q of bank){const s=stats[q.id];if(s?.attempts>0){attempted++;correct+=s.correctCount;wrong+=s.wrongCount;if(s.masteryStatus==='mastered')mastered++}}
const totalAttempts=correct+wrong;
return {
totalQuestions,attemptedQuestions:attempted,questionCoverageRate:totalQuestions>0?(attempted/totalQuestions*100):0,
masteredCount:mastered,totalAttempts,totalCorrect:correct,totalWrong:wrong,
overallAccuracyRate:totalAttempts>0?(correct/totalAttempts*100):null,
completedSectionsCount:Array.isArray(completedSections)?completedSections.length:0,totalSections:95
};
}
function computeExamTrend(history=[]){
if(!Array.isArray(history))return {exams:[],averageScore:0,averageDuration:0,passRate:0};
const exams=history.filter(h=>h.mode==='exam'&&Number.isFinite(h.score!==undefined?h.score:(h.rate!==undefined?h.rate/10:null)))
.map(h=>({id:h.id,started:h.started,score:h.score!==undefined?h.score:(h.rate/10),durationMinutes:Math.round(((h.ended||h.started)-h.started)/60000),autoSubmitted:Boolean(h.auto)}));
if(!exams.length)return {exams:[],averageScore:0,averageDuration:0,passRate:0};
const totalScore=exams.reduce((acc,e)=>acc+e.score,0),totalDuration=exams.reduce((acc,e)=>acc+e.durationMinutes,0);
const passCount=exams.filter(e=>e.score>=7.0).length;
return {exams,averageScore:Number((totalScore/exams.length).toFixed(1)),averageDuration:Math.round(totalDuration/exams.length),passRate:Math.round((passCount/exams.length)*100)};
}
function computeCognitiveBreakdown(bank=[],stats={}){
const breakdown={'Nhận biết':{total:0,attempted:0,correct:0,rate:null},'Thông hiểu':{total:0,attempted:0,correct:0,rate:null},'Vận dụng':{total:0,attempted:0,correct:0,rate:null}};
for(const q of bank){
const lvl=q.level;
if(breakdown[lvl]){breakdown[lvl].total++;const s=stats[q.id];if(s?.attempts>0){breakdown[lvl].attempted++;breakdown[lvl].correct+=s.correctCount}}
}
for(const key of Object.keys(breakdown)){const b=breakdown[key];b.rate=b.attempted>0?Math.round((b.correct/b.attempted)*100):null}
return breakdown;
}
function filterHistory(history=[],filters={}){
if(!Array.isArray(history))return [];
const {activityType='all',timeRange='all',resultStatus='all'}=filters;
const now=Date.now(),dayMs=86400000;
return history.filter(h=>{
if(activityType!=='all'&&h.mode!==activityType)return false;
if(timeRange==='7days'&&(now-h.started)>7*dayMs)return false;
if(timeRange==='30days'&&(now-h.started)>30*dayMs)return false;
if(resultStatus!=='all'){
const score=h.score!==undefined?h.score:(h.rate!==undefined?h.rate/10:0);
if(resultStatus==='pass'&&score<7.0)return false;
if(resultStatus==='fail'&&score>=7.0)return false;
}
return true;
});
}
root.StudyCore = {
KEY,VERSION,fresh,freshV2,validate,validateV2,shuffle,seeded,matrix,levelMatrix,makeExam,grade,
normalizeQuestionRecord,initQuestionStats,migrateStorageToV2,exportUserDataJSON,importUserDataJSON,
pruneHistorySafely,updateQuestionMastery,toggleQuestionMarked,getQuestionsByMastery,getMarkedQuestions,
selectAdaptiveQuestions,computeChapterProgress,computeOverallProgress,computeExamTrend,
computeCognitiveBreakdown,filterHistory
};
if(typeof module!=='undefined')module.exports=root.StudyCore;
})(typeof window!=='undefined'?window:globalThis);
