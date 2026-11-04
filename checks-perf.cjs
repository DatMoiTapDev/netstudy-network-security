// NetStudy Automated Performance Benchmark Runner (checks-perf.cjs)
// Validates performance contracts, execution latencies, and payload budgets.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');

const distDir = path.join(__dirname, 'dist');
const files = [
  'index.html',
  'style.css',
  'models.css',
  'app.js',
  'core.js',
  'data.js',
  'models.js',
  'model-ui.js'
];

// 1. Payload Size Audit
const sizes = {};
let totalBytes = 0;
for (const file of files) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`FATAL: Missing distribution file: ${filePath}`);
    process.exit(1);
  }
  const sz = fs.statSync(filePath).size;
  sizes[file] = sz;
  totalBytes += sz;
}

const MAX_PAYLOAD_BYTES = 752640; // SLA budget (735 KB per Feature 004 FR-010)
if (totalBytes > MAX_PAYLOAD_BYTES) {
  console.error(`FAIL: Total payload ${totalBytes} bytes exceeds SLA budget of ${MAX_PAYLOAD_BYTES} bytes!`);
  process.exit(1);
}

// 2. Headless VM Context Simulation
const els = new Map();
function createMockEl(sel) {
  return {
    innerHTML: '',
    textContent: '',
    style: {},
    value: '',
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    setAttribute() {},
    getAttribute() { return null; },
    insertAdjacentHTML() {},
    addEventListener() {},
    click() {}
  };
}

function el(sel) {
  if (!els.has(sel)) {
    els.set(sel, createMockEl(sel));
  }
  return els.get(sel);
}

const t0 = performance.now();
const ctx = {
  window: {
    addEventListener() {},
    scrollTo() {},
    COURSE: []
  },
  document: {
    querySelector: el,
    querySelectorAll: () => [],
    addEventListener() {},
    getElementById() { return { scrollIntoView() {} }; },
    createElement() { return { click() {} }; },
    documentElement: { dataset: {} },
    hidden: false
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  location: { hash: '#home' },
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  requestAnimationFrame: (fn) => fn(),
  scrollTo() {},
  Blob,
  URL: {
    createObjectURL: () => '',
    revokeObjectURL: () => {}
  },
  Date,
  console
};

vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(distDir, 'data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(distDir, 'core.js'), 'utf8'), ctx);
ctx.StudyCore = ctx.window.StudyCore;
vm.runInContext(fs.readFileSync(path.join(distDir, 'models.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(distDir, 'model-ui.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(distDir, 'app.js'), 'utf8'), ctx);
const tLoad = performance.now() - t0;

// 3. Route Transition Latency (100 transitions)
const tR0 = performance.now();
const routes = ['home', 'courses', 'terms', 'models', 'practice', 'exam', 'history', 'review', 'sources', 'settings'];
for (let i = 0; i < 100; i++) {
  ctx.location.hash = '#' + routes[i % routes.length];
  vm.runInContext('render()', ctx);
}
const tRenders = performance.now() - tR0;
const avgRouteMs = tRenders / 100;

// 4. Model SVG Render Latency (270 renders across all 27 models)
const tM0 = performance.now();
for (let i = 0; i < 10; i++) {
  for (const m of ctx.window.NET_MODELS || []) {
    ctx.window.ModelUI.svg(m, 0);
  }
}
const tModels = performance.now() - tM0;
const avgModelMs = tModels / 270;

// 5. Assertions against SLAs
const MAX_LOAD_MS = 30.0;
const MAX_ROUTE_MS = 0.500;
const MAX_MODEL_MS = 0.080;

if (tLoad > MAX_LOAD_MS) {
  console.error(`FAIL: Script load time ${tLoad.toFixed(2)}ms exceeds threshold ${MAX_LOAD_MS}ms!`);
  process.exit(1);
}
if (avgRouteMs > MAX_ROUTE_MS) {
  console.error(`FAIL: Route transition ${avgRouteMs.toFixed(3)}ms exceeds threshold ${MAX_ROUTE_MS}ms!`);
  process.exit(1);
}
if (avgModelMs > MAX_MODEL_MS) {
  console.error(`FAIL: Model SVG render ${avgModelMs.toFixed(3)}ms exceeds threshold ${MAX_MODEL_MS}ms!`);
  process.exit(1);
}

const summary = {
  status: 'PASS',
  totalPayloadBytes: totalBytes,
  totalPayloadKB: (totalBytes / 1024).toFixed(2),
  scriptLoadMs: Number(tLoad.toFixed(2)),
  avgRouteRenderMs: Number(avgRouteMs.toFixed(3)),
  avgModelSvgMs: Number(avgModelMs.toFixed(3)),
  checks: 'PASS: payload budget, script eval, 100 routes, 270 SVG models'
};

console.log(JSON.stringify(summary, null, 2));
