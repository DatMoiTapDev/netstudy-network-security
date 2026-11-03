# Research & Technical Decisions: Improve DOM Rendering & Keyboard Accessibility

**Feature**: `specs/001-dom-rendering-accessibility`  
**Date**: 2026-11-03  
**Status**: Completed  

---

## 1. Architectural Strategy for DOM Updates

### Context & Problem
In `dist/app.js`, user interactions such as selecting an option (`answer`), toggling a flag (`flag`), marking section completion (`complete`), and bookmarking a question (`mark`) trigger a full re-render:
```javascript
// Current app.js line 35
case 'answer':
  if(a){
    // ...
    a.answers[q.id]=Number(args[0]);
    save();
    const y=scrollY;
    render();
    scrollTo(0,y);
  }
```
`render()` assigns `app.innerHTML = ...`, which wipes the entire `<main id="app">` subtree. This causes:
1. Destruction of all active DOM nodes.
2. Immediate loss of keyboard focus (`document.activeElement` drops to `<body>`).
3. Layout shift / flicker and reliance on a manual `scrollTo(0, y)` hack.
4. Destruction and recreation of unaffected nodes (the timer container, breadcrumbs, question navigation grid, etc.).

### Options Evaluated

| Option | Description | Pros | Cons | Verdict |
|:---|:---|:---|:---|:---|
| **Option A: Virtual DOM library (e.g. Preact/Snabbdom)** | Introduce a micro-vdom library (~3-5KB) to diff and patch DOM. | Declarative components, automatic diffing. | Violates Constitution Principle I (Zero runtime dependencies, no npm packages in `dist/`). Requires build step or bundling. | **REJECTED** |
| **Option B: Full Reactive Signals / State proxy rewrite** | Rewrite state management to fine-grained signals (`createSignal`) or ES6 Proxy to auto-bind DOM text/class updates. | Modern reactive programming model. | High regression risk; invasive rewrite of `core.js` and `app.js`; overhead for simple quiz interactions. | **REJECTED** |
| **Option C: Targeted DOM Mutation Helpers (Surgical Updates)** | Keep `render()` as the foundational route-level renderer (guaranteeing 100% headless test compatibility with `checks.cjs`). Introduce specialized, granular update functions for in-place actions (`updateOptionSelection`, `updateFlagState`, `updateSectionCompletion`, `updateBookmarkState`). | Zero dependencies; zero change to `core.js` or data schemas; 100% backward compatibility with `checks.cjs`; surgical precision; lowest possible execution overhead ($<2\text{ms}$). | Requires explicit DOM targeting by ID/class; slightly more verbose for each action type. | **SELECTED** |

### Decision
**Select Option C (Targeted DOM Mutation Helpers)**.  
When an interaction occurs within the currently active view (e.g. user clicks option B in question 5), the application updates only the specific elements directly affected:
- Option buttons: toggles `.selected`, sets `aria-pressed`, updates `.right`/`.wrong` classes (in `learn` mode), sets `disabled` attributes.
- Rationale container: inserts or reveals the explanation element if in `learn` mode.
- QNav item: updates `.answered` and `.flagged` classes on the single button representing question $i+1$.
- Local state & persistence: calls `save()` without invoking `render()`.
- Keyboard focus: kept on the interacting element via `targetElement.focus({ preventScroll: true })`.

---

## 2. Keyboard Navigation & Focus Preservation Strategy

### Context & Problem
Currently, `app.js` has no `keydown` event listener. Navigation relies entirely on standard browser Tab key traversal. When `innerHTML` is overwritten, focus is lost. Furthermore, keyboard users cannot quickly select options via numbers `1`-`4` or letters `A`-`D`.

### Options Evaluated

| Strategy | Description | Trade-offs | Verdict |
|:---|:---|:---|:---|
| **Global window-level keydown listener** | Attach a single `keydown` listener to `window` that catches all number/letter presses. | Simple to attach, but risks intercepting keystrokes when the user is typing in search inputs (`#courseSearch`, `#termSearch`, `#importFile`). | Requires strict input target guard (`event.target.tagName !== 'INPUT'`). |
| **Scoped Context-Aware Keyboard Dispatcher** | Attach a single event listener on `document` with contextual guards: only active when `route === 'session'` (quiz/exam screen), only when no modal/input is focused, and mapped directly to existing data-actions (`answer|0`, `flag`, `next`, `prev`). | Safe, predictable, zero interference with search inputs, clean separation of concerns. | **SELECTED** |

### Focus Management Policy:
1. **Option Selection**: Keep focus directly on the selected option button. Screen readers will read the updated `aria-pressed="true"`.
2. **Flag Toggle**: Keep focus directly on the flag button.
3. **Question Change (Next / Prev / Jump)**:
   - When clicking/activating "Tiếp theo →", focus remains on the "Tiếp theo →" button so the user can easily press `Space` or `Enter` multiple times to advance through questions.
   - When jumping via the `qnav` button grid, focus is intentionally transferred to the question stem container (`.question`) or the first option button, allowing immediate traversal.
   - When using arrow key shortcuts ($\leftarrow$ / $\rightarrow$), focus transfers to the new question container.
4. **Lesson Section Completion**: Keep focus on the "✓ Đã học mục này" button.

---

## 3. Scroll Preservation Strategy

### Context & Problem
Currently, `app.js` uses:
```javascript
const y = scrollY;
render();
scrollTo(0, y);
```
This causes layout thrashing (reading `scrollY` forces reflow; setting `innerHTML` destroys layout; calling `scrollTo` forces another layout recalculation). If the newly rendered content has a slightly different height (e.g. explanation appears), `scrollTo(0, y)` can produce visual jumps.

### Decision
With **Targeted DOM Updates (Option C)**:
- We **do not re-render the view**.
- The DOM nodes remain stable in the document flow.
- The browser's native scroll position is 100% naturally preserved with zero JavaScript intervention.
- The artificial `const y=scrollY; ... scrollTo(0,y);` calls are completely removed for in-place actions.

---

## 4. Active Exam, Timer & Persistence Invariant Strategy

### Critical Risk Analysis:
1. **Exam Countdown Timer (`tick = setInterval(updateTimer, 1000)`)**:
   - In `session()`, `updateTimer()` reads `state.active.deadline - Date.now()` and updates `#timer` text and class `.urgent`.
   - In `app.js` line 34, `render()` calls `clearInterval(tick)`.
   - In `app.js` line 38, there is a secondary interval checking for deadline expiry.
   - **Risk**: If targeted updates bypass `render()`, does the timer continue running?
   - **Finding**: **Yes!** Because targeted updates do *not* call `render()`, `clearInterval(tick)` is *not* called. The timer continues running seamlessly without being restarted or destroyed! This is a massive improvement over the current implementation, which restarts the timer interval on every single click!
2. **Data Persistence (`save()`)**:
   - Every targeted action continues to call `save()` immediately after updating `state.active.answers` or `state.active.flags`.
   - `localStorage` continues to receive the exact same validated payload.
   - Reloading the page (`F5`) invokes `render()` $\rightarrow$ `session()`, which reads from `localStorage` and reconstructs the view cleanly.
3. **Headless Test Compatibility (`checks.cjs`)**:
   - `checks.cjs` tests `state` by running `render()` in Node.js VM context:
     `run('state.active.answers[state.active.ids[0]]=0;save();render()'); assert(el('#app').innerHTML.includes('Đáp án đúng:'));`
   - Because `render()` continues to be a full idempotent view renderer, `checks.cjs` will continue to pass without any modifications.
