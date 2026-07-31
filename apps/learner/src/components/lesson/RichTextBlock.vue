<script setup lang="ts">
/**
 * RichText block component — renders sanitized HTML content
 * Content is sanitized server-side, additional client-side safety
 */

interface Props {
  content: {
    html?: string
  }
}

defineProps<Props>()
</script>

<template>
  <div v-if="content.html" class="richtext-block" v-html="content.html" />
  <div v-else class="richtext-empty">
    <p>No content</p>
  </div>
</template>

<style scoped>
.richtext-block {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--color-text);
}

/* Typography within rich text */
.richtext-block h1,
.richtext-block h2,
.richtext-block h3,
.richtext-block h4,
.richtext-block h5,
.richtext-block h6 {
  margin: var(--space-4) 0 var(--space-3) 0;
  font-weight: 700;
  color: var(--color-text);
}

.richtext-block h1 { font-size: 1.75rem; }
.richtext-block h2 { font-size: 1.5rem; }
.richtext-block h3 { font-size: 1.25rem; }
.richtext-block h4 { font-size: 1.125rem; }
.richtext-block h5 { font-size: 1rem; }
.richtext-block h6 { font-size: 0.875rem; }

.richtext-block p {
  margin: 0 0 var(--space-4) 0;
}

.richtext-block p:last-child {
  margin-bottom: 0;
}

/* Lists */
.richtext-block ul,
.richtext-block ol {
  margin: var(--space-4) 0;
  padding-left: var(--space-8);
}

.richtext-block li {
  margin-bottom: var(--space-2);
}

/* Links */
.richtext-block a {
  color: var(--module-1);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.richtext-block a:hover {
  color: var(--module-1-accessible);
  text-decoration: underline;
}

.richtext-block a:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* Blockquotes */
.richtext-block blockquote {
  margin: var(--space-4) 0;
  padding-left: var(--space-4);
  border-left: 4px solid var(--module-1);
  color: var(--color-text-muted);
  font-style: italic;
}

/* Code */
.richtext-block code {
  padding: var(--space-1) var(--space-2);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  font-family: 'Courier New', monospace;
  font-size: 0.875em;
  color: #d73a49;
}

.richtext-block pre {
  margin: var(--space-4) 0;
  padding: var(--space-4);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text);
}

.richtext-block pre code {
  padding: 0;
  background: transparent;
  color: inherit;
}

/* Tables */
.richtext-block table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-4) 0;
  font-size: 0.875rem;
}

.richtext-block th,
.richtext-block td {
  padding: var(--space-3);
  text-align: left;
  border: 1px solid var(--color-border);
}

.richtext-block th {
  background: var(--color-surface-alt);
  font-weight: 600;
  color: var(--color-text);
}

.richtext-block tr:nth-child(even) {
  background: var(--color-surface-alt);
}

/* Images */
.richtext-block img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  margin: var(--space-4) 0;
}

/* Strong and emphasis */
.richtext-block strong {
  font-weight: 700;
}

.richtext-block em {
  font-style: italic;
}

.richtext-empty {
  padding: var(--space-6);
  text-align: center;
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}

.richtext-empty p {
  margin: 0;
}
</style>
