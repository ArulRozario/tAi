# tAI Frontend Development Guidelines

This document outlines the core technical rules and established patterns for frontend development in the tAI project. All AI agents and developers must strictly adhere to these guidelines to ensure architectural consistency, maintainability, and seamless theming support.

## 1. Component Strategy: PrimeNG First

**Rule:** Always prioritize using native PrimeNG components over building custom HTML/CSS structures for standard UI elements.

*   **Implementation:** 
    *   Use `<p-card>` instead of custom `<div class="card">` containers. 
    *   Use `<p-tag>` for status indicators instead of custom pills or dots.
    *   Use `<p-table>`, `<p-avatar>`, `<p-progressBar>`, etc., for their respective use cases.
    *   Ensure the corresponding PrimeNG module (e.g., `CardModule`, `TagModule`) is imported into the standalone component's `imports` array.
*   **Customization:** When a PrimeNG component requires a specific structural layout defined by our design system, apply a semantic `styleClass` (e.g., `<p-card styleClass="tai-stat-card">`) rather than avoiding the component entirely.

## 2. Theming & Styling: Dark/Light Mode

**Rule:** The application strictly supports dynamic Light and Dark modes. Hardcoded color values (Hex, RGB) are strictly prohibited in component SCSS files.

*   **Implementation:** Always use CSS variables for styling.
    *   **PrimeNG Tokens:** Use PrimeNG's internal design tokens (e.g., `var(--p-content-background)`, `var(--p-text-color)`, `var(--p-primary-color)`) to ensure elements automatically adapt to the active PrimeNG theme.
    *   **Custom Tokens:** Use custom theme variables defined in `src/theme.scss` (e.g., `var(--bg-canvas)`, `var(--text-main)`, `var(--accent-success)`) for custom layout structures and application-specific coloring.
*   **Theme Management:** Dark mode is controlled via the `.dark` class applied to the document root html tag, managed by the `ThemeService`. Ensure all custom variables in `theme.scss` provide proper overrides within the `html.dark` block.

## 3. Centralized PrimeNG Overrides

**Rule:** Do NOT write deep structural overrides (`::ng-deep`) for PrimeNG components within individual component `.scss` files.

*   **Implementation:** 
    *   All global visual modifications, structural tweaks, and design system alignments for PrimeNG components MUST be placed in `src/primeng-overrides.scss`.
    *   This ensures a single source of truth for the application's aesthetic and prevents conflicting styles across different modules.

## 4. Global Styles and Utilities

**Rule:** Keep component-level SCSS focused strictly on local layout positioning (e.g., flexbox, grid, specific margins).

*   **Implementation:**
    *   Place reusable semantic typography classes (e.g., `.tai-eyebrow`, `.tai-mono`) and cross-component layout helpers in `src/styles.scss`.
    *   If you find yourself duplicating a style pattern across multiple components, extract it to a global utility class or a PrimeNG override.
