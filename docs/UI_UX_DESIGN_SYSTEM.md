# QUIZMANIA — ULTRA-PREMIUM PRODUCT DESIGN SYSTEM & BRAND SPECIFICATION
**Version:** 3.0 (Award-Winning Light-Mode Edition)  
**Studio Team:** Creative Director, Product Architect, UI/UX Lead, Design Systems Lead  
**Reference Quality:** Linear, Stripe, Apple, Notion, Vercel  

---

## 1. Design Philosophy & Creative Direction

QuizMania is engineered as an ultra-premium educational technology product for high-stakes school examinations and competitive quiz tournaments. It replaces generic forms and enterprise dashboards with an editorial, highly polished aesthetic combining:
- **Academic Trust & Excellence:** Subdued, disciplined color palette with generous whitespace and high typographic hierarchy.
- **Immediate Cognitive Clarity:** Prominent per-question 20-second timers, distinct answer selection states, and instant auto-save feedback.
- **Zero Distraction Examination Layer:** Eliminates decorative animations during the examination workspace, prioritizing question readability and touch precision.
- **AI-Assisted Art Direction:** Original 3D abstract compositions (`hero-academic.png` and `achievement-emblem.png`) developed with studio lighting and clean geometry to celebrate scholastic excellence.

---

## 2. Refined Light-Mode Color Palette & Tokens

| Design Token | Hex Code | Semantic Role | Tailwind Utility Equivalent |
|---|---|---|---|
| **Main Viewport Background** | `#F8F9FC` | Clean ambient base | `bg-[#F8F9FC]` |
| **Elevated Surface** | `#FFFFFF` | Cards, workspace containers, modal dialogs | `bg-white` |
| **Elevated Secondary** | `#F1F4F9` | Pedestals, filter strips, progress backgrounds | `bg-[#F1F4F9]` |
| **Primary Text** | `#172033` | Headings, questions, primary figures | `text-[#172033]` |
| **Secondary Text** | `#647084` | Body text, explanations, options | `text-[#647084]` |
| **Muted Metadata** | `#8E9BAE` | Timestamps, micro-copy, input placeholders | `text-[#8E9BAE]` |
| **Primary Accent** | `#465FE5` | Primary CTAs, active question highlight, brand badges | `bg-[#465FE5]`, `text-[#465FE5]` |
| **Accent Light** | `#E9EDFF` | Active selection backgrounds, subtle pill badges | `bg-[#E9EDFF]`, `border-[#C5D0FF]` |
| **Subtle Border** | `#E7EAF0` | Structural dividers, container boundaries | `border-[#E7EAF0]` |
| **Strong Border** | `#D1D7E2` | Interactive input borders, card outlines | `border-[#D1D7E2]` |
| **Success** | `#16845B` | Answered state, verified badge, qualification pass | `text-[#16845B]`, `bg-[#E8F5E9]` |
| **Warning** | `#B7791F` | Timer low warning (<= 7s), review flags, unreturned exits | `text-[#B7791F]`, `bg-[#FEF3C7]` |
| **Critical Error** | `#C2414A` | Critical countdown (<= 3s), destructive reset | `text-[#C2414A]`, `bg-[#FEE2E2]` |

---

## 3. Typography Scale & Hierarchy

- **Editorial Display Headline:** `font-black text-4xl sm:text-6xl text-[#172033] tracking-tight leading-[1.1]`
- **Section & Title Headings:** `font-extrabold text-2xl sm:text-3xl text-[#172033] tracking-tight`
- **Question Statements:** `font-bold text-lg sm:text-xl text-[#172033] leading-relaxed`
- **Answer Option Text:** `font-medium text-sm sm:text-base text-[#172033]`
- **Monospace Telemetry (Timers, Codes, Scores):** `font-mono font-black` (`JetBrains Mono`, monospace)
- **Status & Navigation Badges:** `font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider`

---

## 4. Question Palette Visual Language (1 to 10)

The 10-Question Navigator represents candidate progress in real time:

1. **Active Question:**
   - Background: Solid Accent Indigo (`#465FE5`)
   - Border: `#465FE5` with 2px offset ring
   - Text: White (`#FFFFFF font-bold`)
   - Marker: Solid dot indicator
2. **Answered:**
   - Background: Emerald Green (`#16845B`)
   - Border: `#16845B`
   - Text: White (`#FFFFFF font-bold`)
   - Marker: Checkmark icon
3. **Expired / Skipped:**
   - Background: Soft Amber Tint (`#FEF3C7`)
   - Border: Amber (`#FDE68A`)
   - Text: Amber (`#B7791F font-semibold`)
   - Marker: Locked icon when past
4. **Upcoming / Unvisited:**
   - Background: Pure White (`#FFFFFF`)
   - Border: Subtle Border (`#E7EAF0`)
   - Text: Muted (`#8E9BAE`)

---

## 5. Shadows & Elevation System

```css
.shadow-soft-sm {
  box-shadow: 0 1px 2px 0 rgba(23, 32, 51, 0.04);
}
.shadow-soft {
  box-shadow: 0 2px 6px -1px rgba(23, 32, 51, 0.06), 0 1px 3px -1px rgba(23, 32, 51, 0.04);
}
.shadow-soft-lg {
  box-shadow: 0 12px 32px -4px rgba(23, 32, 51, 0.08), 0 4px 12px -2px rgba(23, 32, 51, 0.04);
}
.shadow-card {
  box-shadow: 0 0 0 1px #E7EAF0, 0 2px 8px 0 rgba(23, 32, 51, 0.04);
}
.shadow-card-hover {
  box-shadow: 0 0 0 1px #D1D7E2, 0 8px 24px -2px rgba(23, 32, 51, 0.08);
}
```

---

## 6. Fullscreen & Interaction Architecture

- **Keyboard Shortcuts:** `A`, `B`, `C`, `D` or `1`, `2`, `3`, `4` select corresponding options; `Enter` confirms and advances immediately.
- **Full-Screen Telemetry:** Continuous listening on `fullscreenchange` with warning overlay modal and instant return button.
- **Auto-Advancement:** Smooth transition at `00:00` without page reload, saving selected response or marking as expired.
- **Reduced Motion:** Full conformance with `prefers-reduced-motion: reduce`.
