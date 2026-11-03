# UI Interaction & Keyboard Contract

**Feature**: `specs/001-dom-rendering-accessibility`  
**Date**: 2026-11-03  
**Status**: Completed  

---

## 1. Action Event Contract (`data-action`)

User click interactions are dispatched via a single delegated event listener on `app` (or `document`), parsing `b.dataset.action.split('|')`.

```text
Action Format: <action_name>[|<arg_1>|<arg_2>|...]
```

### Supported Actions & Update Protocols:

| Action Identifier | Arguments | DOM Behavior Protocol | Re-render Scope |
|:---|:---|:---|:---|
| `answer` | `optionIndex` (0..3) | - Toggle `.selected` and `aria-pressed` on 4 option buttons.<br>- In `learn` mode: append `.right` / `.wrong`, set `disabled=true`, render `.rationale`.<br>- Add `.answered` to `qnav` button for current question index.<br>- Update answered counter text.<br>- Maintain focus on active option button. | **Surgical (In-Place)** — No full-page re-render. |
| `flag` | None | - Toggle label between `'☆ Đánh dấu xem lại'` and `'★ Đã đánh dấu'`.<br>- Toggle `.flagged` on `qnav` button for current question index.<br>- Maintain focus on flag button. | **Surgical (In-Place)** — No full-page re-render. |
| `jump` | `questionIndex` (integer) | - Update `a.index = questionIndex`.<br>- Rebuild question view for new question.<br>- Set focus to question container or first option. | **View-level (Question Card)**. |
| `prev` | None | - Decrement `a.index` (clamped to 0).<br>- Rebuild question view.<br>- Maintain focus on `prev` button. | **View-level (Question Card)**. |
| `next` | None | - Increment `a.index` (wraps around).<br>- Rebuild question view.<br>- Maintain focus on `next` button. | **View-level (Question Card)**. |
| `complete` | `chapterId`, `sectionId` | - Toggle `key` in `state.completed`.<br>- Toggle button text between `'Đánh dấu đã học'` and `'✓ Đã học mục này'`.<br>- Toggle `✓` marker in `.lesson-nav` link.<br>- Maintain focus on complete button. | **Surgical (In-Place)** — No full-page re-render. |
| `mark` | `questionId` | - Toggle `questionId` in `state.marked`.<br>- Toggle button text between `'☆ Lưu câu này'` and `'★ Bỏ đánh dấu'`.<br>- Maintain focus on mark button. | **Surgical (In-Place)** — No full-page re-render. |

---

## 2. Keyboard Interaction Contract

### Global Context Guard
A single document-level `keydown` listener intercepts keyboard inputs under strict safety guards:
```javascript
// Safety guard: only execute shortcuts when in quiz session and not typing in an input
if (route !== 'session' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
  return;
}
```

### Shortcut Key Mapping:

| Key Binding | Target Action | Condition | Screen Reader Announcement |
|:---|:---|:---|:---|
| `1` or `A` / `a` | Select Option 0 (`answer\|0`) | Unanswered or editable in `exam`/`test` mode | Announces option 0 selected / state |
| `2` or `B` / `b` | Select Option 1 (`answer\|1`) | Unanswered or editable in `exam`/`test` mode | Announces option 1 selected / state |
| `3` or `C` / `c` | Select Option 2 (`answer\|2`) | Unanswered or editable in `exam`/`test` mode | Announces option 2 selected / state |
| `4` or `D` / `d` | Select Option 3 (`answer\|3`) | Unanswered or editable in `exam`/`test` mode | Announces option 3 selected / state |
| `ArrowRight` or `N` / `n` | Go to next question (`next`) | Always available in quiz session | Focus shifts; reads new question index |
| `ArrowLeft` or `P` / `p` | Go to previous question (`prev`) | Always available in quiz session | Focus shifts; reads new question index |
| `F` or `f` | Toggle review flag (`flag`) | Always available in quiz session | Announces flag status toggled |
| `Enter` / `Space` | Activate currently focused element | Native browser button behavior | Native button activation |
| `Tab` / `Shift+Tab` | Traverse focusable elements | Native logical tab order | Standard accessibility traversal |

---

## 3. Backward Compatibility & Test Contract

1. **`render()` Idempotence**:
   The `render()` function MUST remain capable of full idempotent generation from `state`.
   When invoked directly by testing scripts (such as `checks.cjs` in Node.js VM), `render()` MUST output the full HTML markup for `#app` with all answers, rationales, and navigation states accurately represented.
2. **Deterministic Mutation**:
   Targeted DOM updates MUST execute the exact same state transformations (`state.active.answers[...] = ...; save();`) as the full `render()` pass would have reflected, ensuring zero drift between the in-memory state, `localStorage`, and DOM representation.
