# QUIZMANIA — UI/UX DESIGN SYSTEM SPECIFICATION
**Version:** 2.0 (Ultra-Premium Light-Mode Edition)  
**Author:** Product Design & Frontend Architecture Studio

---

## 1. Design Philosophy & Creative Direction

The QuizMania design system is engineered around **clarity, academic trust, and distraction-free examination usability**. It draws inspiration from world-class modern software products (Linear, Stripe, Notion, Apple) tailored specifically for high-stakes school examinations.

### Core Principles
- **Light-Mode Consistency:** Strict adherence to a clean, high-contrast light-mode visual hierarchy across all public, candidate, and administrative surfaces.
- **Clarity Over Clutter:** Generous whitespace, disciplined typography, and clear semantic states ensure students focus purely on reading and solving technical questions.
- **Immediate State Legibility:** Answering status, countdown urgency, and saving confirmations are recognizable at a glance without cognitive overhead.
- **Accessible Contrast:** Meets and exceeds WCAG AA contrast standards across all text, borders, buttons, and status badges.

---

## 2. Color Palette & Semantic Tokens

| Token | Hex / Value | Semantic Role |
|---|---|---|
| `--bg-base` | `#F8FAFC` (Slate 50) | Overall viewport background |
| `--surface` | `#FFFFFF` (White) | Primary cards, workspace containers, modals |
| `--surface-elevated` | `#F1F5F9` (Slate 100) | Secondary panels, pedestals, filter bars |
| `--border-subtle` | `#E2E8F0` (Slate 200) | Standard borders, divider lines |
| `--border-strong` | `#CBD5E1` (Slate 300) | Focus rings, active container outlines |
| `--text-primary` | `#0F172A` (Slate 900) | Headings, questions, primary figures |
| `--text-secondary` | `#475569` (Slate 600) | Body text, explanations, options |
| `--text-muted` | `#64748B` (Slate 500) | Timestamps, metadata, helper text |
| `--accent-indigo` | `#4F46E5` (Indigo 600) | Primary CTAs, active question highlight, candidate badge |
| `--accent-blue` | `#2563EB` (Blue 600) | Secondary round indicators, navigation highlights |
| `--color-success` | `#16A34A` (Emerald 600) | Answered status, verified candidate badge, qualification pass |
| `--color-warning` | `#D97706` (Amber 600) | Visited-unanswered indicator, timer low-warning |
| `--color-error` | `#DC2626` (Rose 600) | Critical time warning, reset destructive actions |
| `--color-review` | `#7C3AED` (Violet 600) | Flagged for Review status badges & palette dots |

---

## 3. Typography Scale

- **Heading 1 (Hero / Exam Titles):** `font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight`
- **Heading 2 (Question Text / Sections):** `font-bold text-lg sm:text-xl text-slate-900 leading-relaxed`
- **Body Text:** `font-medium text-sm text-slate-700 leading-normal`
- **Labels & Micro-copy:** `font-bold text-xs uppercase tracking-wider text-slate-500`
- **Monospace (Timers, Points, Codes):** `font-mono font-bold` (`JetBrains Mono`, monospace)

---

## 4. Question Palette Visual Language

The 10-Question Navigator uses 4 distinct, accessible visual states:

1. **Not Visited:**
   - Background: Pure White (`#FFFFFF`)
   - Border: Subtle Slate (`border-slate-200`)
   - Text: Slate 600 (`text-slate-600`)
2. **Visited but Unanswered:**
   - Background: Soft Amber (`bg-amber-50`)
   - Border: Amber 300 (`border-amber-300`)
   - Text: Amber 800 (`text-amber-800 font-semibold`)
3. **Answered:**
   - Background: Solid Indigo (`bg-indigo-600`)
   - Border: Indigo 600 (`border-indigo-600`)
   - Text: White (`text-white font-bold`)
   - Indicator: Subtle checkmark or solid indicator
4. **Marked for Review:**
   - Background: Violet Tint (`bg-purple-100`)
   - Border: Violet 300 (`border-purple-300`)
   - Text: Violet 900 (`text-purple-900 font-bold`)
   - Badge: Small purple indicator dot (`bg-purple-600`)

---

## 5. Shadows & Depth

```css
.shadow-soft-sm {
  box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
}
.shadow-soft {
  box-shadow: 0 2px 6px -1px rgba(15, 23, 42, 0.06), 0 1px 3px -1px rgba(15, 23, 42, 0.04);
}
.shadow-soft-lg {
  box-shadow: 0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04);
}
```

---

## 6. Interaction & Motion Standards

- Transitions: `transition-all duration-200 ease-out` for option hover and selection.
- Reduced Motion: Respects `prefers-reduced-motion: reduce`.
- Keyboard Accessibility:
  - `A`, `B`, `C`, `D` or `1`, `2`, `3`, `4` directly select corresponding options.
  - Tab indexing across all action buttons with clear `:focus-visible` rings.
- Confirmation Gates: Mandatory checkboxes before initiating timed sessions and modal reviews before final submission.

