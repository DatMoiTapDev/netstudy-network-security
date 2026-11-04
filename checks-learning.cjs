/**
 * checks-learning.cjs
 * Automated Headless Test Suite for Feature 004 — Learning Experience & Smart Review
 * Zero-dependency, offline-autonomous verification runner.
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== RUNNING FEATURE 004 LEARNING SUITE ===\n');

// 1. Load data.js and core.js in VM context
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('dist/data.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('dist/core.js', 'utf8'), ctx);

const StudyCore = ctx.window.StudyCore;
const chapters = ctx.window.COURSE || [];
const bank = chapters.flatMap(c => c.questions.map(q => ({ ...q, chapter: c.id, file: c.file })));

assert(StudyCore, 'StudyCore must be defined');
assert.strictEqual(bank.length, 264, 'Question bank must have exactly 264 questions');
console.log('PASS 1: Core environment & question bank loaded (264 questions across 9 chapters)');

// 2. Test Schema v2 Creation & Validation
const fresh1 = StudyCore.fresh(1);
assert.strictEqual(fresh1.version, 1, 'fresh(1) must return version 1');
StudyCore.validate(fresh1);

const fresh2 = StudyCore.fresh(2);
assert.strictEqual(fresh2.version, 2, 'fresh(2) must return version 2');
assert(fresh2.questionStats && typeof fresh2.questionStats === 'object', 'fresh(2) must have questionStats');
assert(Array.isArray(fresh2.savedExams), 'fresh(2) must have savedExams array');
assert(Array.isArray(fresh2.bookmarks), 'fresh(2) must have bookmarks array');
StudyCore.validate(fresh2);
if (StudyCore.validateV2) StudyCore.validateV2(fresh2);

// Validation error checks
assert.throws(() => StudyCore.validate({ version: 2 }));
assert.throws(() => StudyCore.validate({ ...fresh2, questionStats: null }));
assert.throws(() => StudyCore.validate({ ...fresh2, history: 'invalid' }));
console.log('PASS 2: Schema v2 structure and validation assertions verified');

// 3. Test Idempotent Schema Migration (v1 -> v2)
const v1Fixture = {
  version: 1,
  completed: ['1.1', '1.2'],
  marked: ['1-q1', '1-q2'],
  history: [
    {
      id: '1001',
      mode: 'learn',
      title: 'Bài 1: Luyện tập',
      ids: ['1-q1', '1-q2'],
      answers: { '1-q1': 3, '1-q2': 1 }, // 1-q1 correct (3), 1-q2 wrong (expected 0, answered 1)
      started: Date.now() - 3600000,
      ended: Date.now() - 3000000
    }
  ],
  active: null,
  seen: ['1-q1', '1-q2']
};

const migratedV2 = StudyCore.migrateStorageToV2(v1Fixture, bank);
assert.strictEqual(migratedV2.version, 2, 'Migrated state must have version 2');
assert.strictEqual(migratedV2.completed.length, 2, 'Completed sections must be preserved');
assert.strictEqual(migratedV2.history.length, 1, 'History must be preserved');
assert(migratedV2.questionStats['1-q1'], 'questionStats must contain records for tested questions');
assert.strictEqual(migratedV2.questionStats['1-q1'].attempts, 1, 'attempts count must be replayed accurately');
assert.strictEqual(migratedV2.questionStats['1-q1'].correctCount, 1, 'correctCount must be 1');
assert.strictEqual(migratedV2.questionStats['1-q1'].marked, true, 'marked flag from v1 must be preserved');
assert.strictEqual(migratedV2.questionStats['1-q2'].wrongCount, 1, 'wrongCount must be 1 for 1-q2');

// Idempotency check: migrating an already migrated v2 state must produce identical output
const reMigrated = StudyCore.migrateStorageToV2(migratedV2, bank);
assert.strictEqual(reMigrated.version, 2, 'Idempotent migration version unchanged');
assert.strictEqual(reMigrated.history.length, 1, 'Idempotent migration history length unchanged');
assert.strictEqual(reMigrated.questionStats['1-q1'].attempts, 1, 'Attempts count unchanged on re-migration');

// Null and corrupt handling
const safeDefault = StudyCore.migrateStorageToV2(null, bank);
assert.strictEqual(safeDefault.version, 2, 'Null input safely yields fresh v2');
console.log('PASS 3: Idempotent migration v1 -> v2 verified with zero data loss');

// 4. Test Mastery State Machine & CL-01 2-Streak Rule
let qRec = StudyCore.normalizeQuestionRecord('1-q1', '1', 'Nhận biết');
assert.strictEqual(qRec.masteryStatus, 'needs_practice');
assert.strictEqual(qRec.consecutiveCorrect, 0);

// Session 1 (Practice): wrong answer
StudyCore.updateQuestionMastery(qRec, false, 'learn');
assert.strictEqual(qRec.attempts, 1);
assert.strictEqual(qRec.wrongCount, 1);
assert.strictEqual(qRec.consecutiveCorrect, 0);
assert.strictEqual(qRec.masteryStatus, 'needs_practice');

// Session 2 (Practice): correct answer 1st time
StudyCore.updateQuestionMastery(qRec, true, 'learn');
assert.strictEqual(qRec.attempts, 2);
assert.strictEqual(qRec.correctCount, 1);
assert.strictEqual(qRec.consecutiveCorrect, 1);
assert.strictEqual(qRec.masteryStatus, 'in_review');

// Session 3 (Practice): wrong answer resets streak
StudyCore.updateQuestionMastery(qRec, false, 'learn');
assert.strictEqual(qRec.attempts, 3);
assert.strictEqual(qRec.wrongCount, 2);
assert.strictEqual(qRec.consecutiveCorrect, 0);
assert.strictEqual(qRec.masteryStatus, 'needs_practice');

// Session 4 (Practice): correct answer 1st time again
StudyCore.updateQuestionMastery(qRec, true, 'learn');
assert.strictEqual(qRec.consecutiveCorrect, 1);
assert.strictEqual(qRec.masteryStatus, 'in_review');

// Session 5 (Practice): correct answer 2nd consecutive time -> MASTERED!
StudyCore.updateQuestionMastery(qRec, true, 'learn');
assert.strictEqual(qRec.consecutiveCorrect, 2);
assert.strictEqual(qRec.masteryStatus, 'mastered');

// Session 6 (Practice): wrong answer on a mastered question -> drops back to needs_practice!
StudyCore.updateQuestionMastery(qRec, false, 'learn');
assert.strictEqual(qRec.consecutiveCorrect, 0);
assert.strictEqual(qRec.masteryStatus, 'needs_practice');

// CL-01 Exam Rule: correct in exam mode does NOT auto-master
StudyCore.updateQuestionMastery(qRec, true, 'learn'); // streak = 1 (in_review)
assert.strictEqual(qRec.masteryStatus, 'in_review');
StudyCore.updateQuestionMastery(qRec, true, 'exam'); // 2nd correct, but in EXAM mode!
assert.strictEqual(qRec.consecutiveCorrect, 2);
assert.notStrictEqual(qRec.masteryStatus, 'mastered', 'Exam correct answer must NEVER auto-master!');
console.log('PASS 4: CL-01 2-streak mastery state machine & exam boundary verified');

// 5. Test Adaptive Practice Presets & Fallback Hierarchy
const testStats = {};
for (const q of bank) {
  testStats[q.id] = StudyCore.normalizeQuestionRecord(q.id, q.chapter, q.level);
}
// Set up some known stats: 3 wrong questions, 5 mastered
testStats['1-q1'].attempts = 2; testStats['1-q1'].wrongCount = 2; testStats['1-q1'].masteryStatus = 'needs_practice';
testStats['1-q2'].attempts = 3; testStats['1-q2'].wrongCount = 2; testStats['1-q2'].masteryStatus = 'needs_practice';
testStats['1-q3'].attempts = 1; testStats['1-q3'].wrongCount = 1; testStats['1-q3'].masteryStatus = 'needs_practice';
testStats['2a-q1'].attempts = 2; testStats['2a-q1'].correctCount = 2; testStats['2a-q1'].consecutiveCorrect = 2; testStats['2a-q1'].masteryStatus = 'mastered';

// Mode 1: unseen
const unseen10 = StudyCore.selectAdaptiveQuestions(bank, testStats, 'unseen', 10);
assert.strictEqual(unseen10.length, 10, 'Unseen should return 10 questions');
assert(unseen10.every(q => !testStats[q.id].attempts), 'All unseen questions must have 0 attempts');

// Mode 2: frequent_wrong
const wrongList = StudyCore.selectAdaptiveQuestions(bank, testStats, 'frequent_wrong', 10);
assert(wrongList.length >= 3, 'Should pick the 3 wrong questions');
assert.strictEqual(wrongList[0].id, '1-q1', '1-q1 has 100% error rate so ranked first');

// Mode 3: weak_chapter
const weakList = StudyCore.selectAdaptiveQuestions(bank, testStats, 'weak_chapter', 5);
assert.strictEqual(weakList.length, 5);

// Mode 4: adaptive_mixed 50/30/20 with fallback
const mixed20 = StudyCore.selectAdaptiveQuestions(bank, testStats, 'adaptive_mixed', 20);
assert.strictEqual(mixed20.length, 20, 'Adaptive mixed must return exact count requested');
const uniqueMixedIds = new Set(mixed20.map(q => q.id));
assert.strictEqual(uniqueMixedIds.size, 20, 'Zero duplicate questions in adaptive mixed session');
console.log('PASS 5: Adaptive practice 4 presets, fallback hierarchy and zero duplicates verified');

// 6. Test Learning Dashboard Metrics & Progress Calculation
const chProg = StudyCore.computeChapterProgress(bank, testStats, ['1.1', '1.2']);
assert.strictEqual(chProg.length, 9, 'Must compute progress for 9 chapters');
const ch1 = chProg.find(c => c.chapterId === '1');
assert(ch1, 'Chapter 1 progress summary must exist');
assert.strictEqual(ch1.totalQuestions, 25, 'Chapter 1 has 25 questions');
assert.strictEqual(ch1.attemptedQuestions, 3, '3 questions attempted in Chapter 1');
assert.strictEqual(ch1.isWeak, true, 'Chapter 1 accuracy < 70% with >= 3 attempts flagged as weak');

const overall = StudyCore.computeOverallProgress(bank, testStats, ['1.1', '1.2']);
assert.strictEqual(overall.totalQuestions, 264);
assert.strictEqual(overall.attemptedQuestions, 4);
assert.strictEqual(overall.masteredCount, 1);
console.log('PASS 6: Dashboard chapter progress and weak chapter identification verified');

// 7. Test Exam Analytics & Score Trend
const mockHistory = [
  { id: '1', mode: 'exam', score: 6.5, started: 1000000, ended: 1000000 + 45 * 60000 },
  { id: '2', mode: 'exam', score: 7.5, started: 2000000, ended: 2000000 + 50 * 60000 },
  { id: '3', mode: 'learn', score: 9.0, started: 3000000, ended: 3000000 + 10 * 60000 }
];
const examTrend = StudyCore.computeExamTrend(mockHistory);
assert.strictEqual(examTrend.exams.length, 2, 'Only exam sessions counted in trend');
assert.strictEqual(examTrend.averageScore, 7.0, 'Average score must be (6.5 + 7.5) / 2 = 7.0');
assert.strictEqual(examTrend.averageDuration, 48, 'Average duration (45 + 50)/2 = 47.5 -> 48');
assert.strictEqual(examTrend.passRate, 50, '1 out of 2 passed (>= 7.0) -> 50%');

const cogBreakdown = StudyCore.computeCognitiveBreakdown(bank, testStats);
assert.strictEqual(cogBreakdown['Nhận biết'].total, 73);
assert.strictEqual(cogBreakdown['Thông hiểu'].total, 128);
assert.strictEqual(cogBreakdown['Vận dụng'].total, 63);
console.log('PASS 7: Exam analytics, trend calculation, and verified cognitive breakdown verified');

// 8. Test Storage Quota & Safe History Pruning
const store120 = {
  version: 2,
  completed: [],
  marked: [],
  history: Array.from({ length: 120 }, (_, i) => ({
    id: String(i + 1),
    mode: 'exam',
    title: 'Exam ' + (i + 1),
    ids: ['1-q1'],
    answers: { '1-q1': 3 },
    started: 100000 + i * 1000,
    ended: 100000 + i * 1000 + 500
  })),
  active: null,
  seen: [],
  questionStats: testStats,
  savedExams: [],
  bookmarks: []
};
assert.strictEqual(store120.history.length, 120);
StudyCore.pruneHistorySafely(store120, 100);
assert.strictEqual(store120.history.length, 100, 'History pruned to exactly 100 recent sessions');
assert.strictEqual(store120.history[0].id, '21', 'Earliest 20 sessions safely trimmed');
assert.strictEqual(Object.keys(store120.questionStats).length, 264, 'questionStats permanently preserved');

// Test Export and Import JSON
const exportedStr = StudyCore.exportUserDataJSON(store120);
assert(typeof exportedStr === 'string' && exportedStr.length > 500);
const importedStore = StudyCore.importUserDataJSON(exportedStr, bank);
assert.strictEqual(importedStore.version, 2);
assert.strictEqual(importedStore.history.length, 100);
console.log('PASS 8: Storage pruning and backup export/import validation verified');

// 9. Invariance: Exam seed 533 40-question engine
const examCheck1 = StudyCore.makeExam(bank, true);
const examCheck2 = StudyCore.makeExam(bank, true);
assert.strictEqual(examCheck1.length, 40);
assert(examCheck1.every((id, idx) => id === examCheck2[idx]), 'Exam seed 533 must remain strictly deterministic');
console.log('PASS 9: Deterministic exam engine invariance confirmed');

console.log('\n=== ALL 9 GROUPS OF FEATURE 004 TESTS PASSED 100% ===');
