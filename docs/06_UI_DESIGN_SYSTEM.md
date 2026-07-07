# 06_UI_DESIGN_SYSTEM.md — UI Design Tokens & Theme Standards

This document specifies the typography scale, spacing variables, HSL color tokens, and layout guidelines for **Agency365**.

---

## 1. Color Palette Tokens

The app uses CSS custom properties defined in `styles.css` to manage theme values.

| CSS Property | Light Mode Value | Dark Mode Value | Usage |
|--------------|------------------|-----------------|-------|
| `--bg-color` | `#f9fafb` | `#0b0f19` | Page body background |
| `--bg-secondary` | `#f3f4f6` | `#111827` | Inner containers, inputs |
| `--card-bg` | `#ffffff` | `#1f2937` | Content cards, modals |
| `--text-primary` | `#0f1117` | `#f3f4f6` | Primary titles, body text |
| `--text-secondary` | `#6b7280` | `#9ca3af` | Metadata labels, descriptions |
| `--border-color` | `#e5e7eb` | `#374151` | Dividers, element borders |
| `--accent-color` | `#12b76a` | `#12b76a` | Avocado Green (brand main) |
| `--secondary-color`| `#e5eed7` | `#2d3720` | Subtle background highlights |

---

## 2. Typography Hierarchy

- **Main Font Family:** `'Inter'`, system sans-serif font stack.
- **Display Font Family:** `'Newsreader'`, serif font stack. Applied to headings and brand elements to establish a premium feel.

| Element | Font Family | Size | Weight | Line Height |
|---------|-------------|------|--------|-------------|
| Page Title (`h1`) | `'Newsreader'` | `1.75rem` | `800` | `1.2` |
| Card Title (`h2`) | `'Newsreader'` | `1.15rem` | `700` | `1.3` |
| Section Head (`h3`) | `'Inter'` | `0.95rem` | `600` | `1.4` |
| Body Text | `'Inter'` | `0.88rem` | `400` | `1.5` |
| Small / Meta | `'Inter'` | `0.78rem` | `500` | `1.4` |

---

## 3. Responsive Breakpoints

Layout parameters collapse dynamically based on viewport widths:

### A. Tablet Breakpoint (`max-width: 768px`)
- **Navigation:** Desktop sidebars hide (`display: none !important`). Mobile bottom navigation bar becomes visible.
- **Content Padding:** Reduces to `1rem` on sides; bottom padding set to `6rem` to clear the fixed bottom nav bar.
- **Tables:** Containment wrappers get `overflow-x: auto` enabling horizontal swipe gestures.
- **Modals:** Align to the bottom of the viewport, acting as sliding **bottom sheets** (22px top-corner border radius).

### B. Mobile Breakpoint (`max-width: 480px`)
- **Gaps:** Spacing grid gaps reduce to `0.6rem`.
- **Grids:** Multi-column grids (like stats cards or dashboard balances) collapse to single-column lists.
- **Fonts:** Page Title headers reduce to `1.25rem` to prevent clipping.
