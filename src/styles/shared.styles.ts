/**
 * Shared Tailwind stylesheet for Lit Shadow DOM adoption.
 * Import `tw` into any component's `static styles` array.
 * Lit deduplicates CSSStyleSheet references — no memory overhead.
 */
import { unsafeCSS } from 'lit';
// @ts-expect-error — Vite ?inline import returns string at build time
import tailwindContent from './tailwind.css?inline';

export const tw = unsafeCSS(tailwindContent as string);
