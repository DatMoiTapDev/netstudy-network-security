# Quickstart & Verification Guide: Improve DOM Rendering & Keyboard Accessibility

**Feature**: `specs/001-dom-rendering-accessibility`  
**Date**: 2026-11-03  
**Status**: Completed  

---

## 1. Automated Verification Commands

Run the automated regression test suite to ensure the underlying engine, question bank, exam randomizer, and mathematical models remain intact:

```powershell
# 1. Assemble and verify source curriculum data
py assemble.py
py build-models.py

# 2. Syntax validation
node --check dist/app.js
node --check dist/core.js
node --check dist/models.js
node --check dist/model-ui.js

# 3. Headless VM test execution
node checks.cjs
node checks-models.cjs
```

**Expected Result**:
- `checks.cjs`: Outputs `PASS: schema, routes, matrix, score, answer visibility, expiry, persisted deadline, backup`.
- `checks-models.cjs`: Outputs `PASS: sources, SVG edges/highlights, every step, delegated clicks, invalid indices, chapter filter, RSA/DH/OTP numeric examples`.

---

## 2. In-Browser Manual Validation Scenarios

Start a local server to test in real desktop and mobile browsers:

```powershell
py -m http.server 8000 --directory dist
```
Navigate to: `http://localhost:8000`

### Scenario A: In-Place Option Selection & Scroll Stability
1. Click **Luyện tập** (`#practice`).
2. Select **Bài 3**, Mode: **Học có giải thích**, Count: **10**, click **Bắt đầu luyện tập**.
3. Scroll down so the question and options are centered.
4. Click option **B** (or press key `2` / `B`).
5. **Verify**:
   - Option B displays `.selected` immediately.
   - If incorrect, displays red `.wrong` and the correct option displays green `.right`.
   - The `.rationale` block appears directly below without page flicker.
   - The scroll position remains unchanged (0px jitter).
   - In the sidebar `qnav`, button 1 becomes green (`answered`).
   - The counter updates to `1/10 câu đã trả lời`.

### Scenario B: Keyboard Focus Preservation
1. With question 1 open, press `Tab` until focus reaches option **A** (notice green focus outline).
2. Press `Space` to select.
3. **Verify**: The focus outline remains firmly on option **A**. Focus does NOT jump to the top of the page (`<body>`).
4. Press `F` (or `Tab` to the flag button and press `Space`).
5. **Verify**: Flag button toggles to `'★ Đã đánh dấu'`, qnav item 1 receives the gold bottom border (`flagged`), and focus remains on the flag button.

### Scenario C: Keyboard Shortcut Navigation
1. Press `ArrowRight` (or key `N`).
2. **Verify**: View transitions to question 2. Focus is moved to the question container or first option.
3. Press `1` to select option A.
4. Press `ArrowLeft` (or key `P`).
5. **Verify**: View transitions back to question 1 with option state preserved.

### Scenario D: Exam Countdown Timer Continuity
1. Navigate to `#exam` and start **Đề cố định A** (40 questions / 75 minutes).
2. Observe the `#timer` counting down seconds (e.g. `74:58`, `74:57`).
3. Rapidly click through answers 1 to 5.
4. **Verify**: The timer counts down continuously and steadily without visual stutter or pause.

### Scenario E: Lesson Section Completion
1. Navigate to **Giáo trình** $\rightarrow$ **Bài 3** (`#lesson/3`).
2. Scroll down to Section 3.4.
3. Click **Đánh dấu đã học**.
4. **Verify**: The button text updates to `✓ Đã học mục này` immediately. Section 3.4 in the right-hand `lesson-nav` displays `✓`. The page does NOT reload or jump scroll position.
