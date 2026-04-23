# Design System Strategy: The Ethereal Ledger

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **The Ethereal Ledger**. 

In the Indian financial landscape, trust is often associated with heavy, rigid structures. This system breaks that convention by introducing a high-end editorial feel that balances authoritative weight with "weightless" digital surfaces. We move away from the "template" look by using intentional asymmetry—placing hero elements slightly off-center or overlapping cards—and utilizing a typography scale that treats currency as a bold, architectural element rather than just a number. The result is an experience that feels like a premium concierge service rather than a utility tool.

---

## 2. Colors: Tonal Depth & Soul
We avoid the "flatness" of standard UI by using a sophisticated palette that prioritizes depth over decoration.

*   **Primary Engine:** The Teal-500 (`primary_color_hex`) to Cyan-500 (`tertiary_color_hex`) gradient is our "energy source." It is reserved for high-action CTAs, progress indicators, and the AI interface. 
*   **The "No-Line" Rule:** To achieve a truly bespoke feel, **1px solid borders for sectioning are strictly prohibited.** Boundaries must be defined solely through background color shifts. For example, a card (using `surface_container_lowest`) should sit on a background of `surface_container_low`. The contrast between these two tokens is the only "line" the user needs.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of physical layers. 
    *   **Base:** `neutral_color_hex` (#f7f9fb)
    *   **In-Page Sections:** `surface_container_low` (#f2f4f6)
    *   **Interactive Cards:** `surface_container_lowest` (#ffffff)
*   **Signature Textures:** For the "Net Worth" hero section, use the Dark Hero Slate-900 (`secondary_color_hex`). This provides a heavy visual anchor, making the subsequent teal gradients feel more vibrant and light-infused.

---

## 3. Typography: The Editorial Voice
We use **Inter** to create a structured, high-contrast hierarchy that feels like a premium financial journal.

*   **Currency as Architecture:** For primary balances, use `display-lg` (3.5rem) with a `font-weight: 700`. These are "hero numbers" that demand the user's focus.
*   **The Label System:** Use `label-md` with `text-transform: uppercase` and `letter-spacing: 0.1em`. This wide tracking adds a layer of "luxury branding" to the smaller metadata.
*   **Tonal Hierarchy:** Headlines (`headline-md`) should use the `on_surface` token for maximum authority, while secondary body text should drop to `on_surface_variant` to create a clear informational path.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows and borders create visual clutter. This design system uses **Ambient Layering** to define space.

*   **The Layering Principle:** Depth is achieved by "stacking" the surface-container tokens. A white card (`surface_container_lowest`) placed on a light grey background (`surface_container`) creates a soft, natural lift that mimics fine paper.
*   **Ambient Shadows:** When an element must "float" (like the AI FAB), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 107, 95, 0.08)`. The shadow should be tinted with the `primary` color to create a "glow" rather than a grey smudge.
*   **The "Ghost Border" Fallback:** If a container requires an edge for accessibility (e.g., in high-glare environments), use a **Ghost Border**. Use the `outline_variant` token at 15% opacity. Never use 100% opaque borders.
*   **Glassmorphism:** For overlays or navigation bars, use `surface` at 80% opacity with a `backdrop-filter: blur(24px)`. This allows the vibrant teal gradients and slate heroes to bleed through, making the app feel like a unified, singular flow.

---

## 5. Components

### Primary Buttons (Dark)
*   **Base:** `secondary_color_hex` (#131b2e) for maximum contrast against the light surfaces.
*   **Corner Radius:** `full` (9999px) or `xl` (3rem) for a modern, approachable feel.
*   **Text:** `surface_container_lowest` (#ffffff), `label-md` uppercase.

### The AI Floating Action Button (FAB)
*   **Surface:** Teal-to-Cyan gradient (`primary` to `tertiary_container`).
*   **Effect:** Subtle internal glow and a large ambient shadow.
*   **Interaction:** On tap, use a backdrop-blur expansion that covers the screen in a semi-transparent glass layer.

### Gradient Progress Bars
*   **Track:** `surface_container_high`.
*   **Fill:** Linear gradient from `primary` to `primary_fixed_dim`. 
*   **Constraint:** No rounded ends on the *fill* if it is 0%; only the *track* should have `rounded-full`.

### Cards & Transaction Lists
*   **Rule:** Forbid the use of divider lines.
*   **Execution:** Separate transactions using `spacing` value of 8 (2rem) of vertical spacing. If grouping is required, use a subtle background shift to `surface_container_low` for the group container.
*   **Rounding:** Apply `rounded-2xl` to cards and `rounded-3xl` to parent hero sections to create a "nested" visual language.

---

## 6. Do's and Don'ts

### Do
*   **Use Asymmetry:** Offset the "Net Worth" balance to the left, leaving breathing room on the right for a subtle AI suggestion or a glass-morphic icon.
*   **Embrace Whitespace:** Use the Spacing Scale `spacing` values 10 (2.5rem) or 12 (3rem) between major sections. Finance is stressful; the UI should feel calm.
*   **Trust the Gradient:** Only use the Teal/Cyan gradient for things that move or think (AI, loading states, growth charts).

### Don't
*   **Don't use 1px Dividers:** Never use a line to separate content. Use a background color change or whitespace.
*   **Don't use Pure Black:** Use `secondary_color_hex` (#131b2e) for "black" elements. It feels more organic and premium.
*   **Don't Cram:** If a screen feels full, it is wrong. Use horizontal scrolling (carousels) for cards rather than stacking them vertically and sacrificing margin.