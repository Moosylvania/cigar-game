<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<style lang="scss">
@use '~/assets/scss/variables' as *;

html,
body {
  color-scheme: dark;
  margin: 0;
  padding: 0;
  background: $color-bg;
  color: $color-text;
  font-family: $font-stack;
  height: 100%;
  // This is a fixed, app-like layout (not a scrollable document) - the game
  // area manages its own internal scroll regions (panels, build strip),
  // so lock the page itself and kill mobile pull-to-refresh/bounce.
  overflow: hidden;
  overscroll-behavior: none;
}

* {
  box-sizing: border-box;
  letter-spacing: 0 !important;
}

button, input, select, textarea {
  font-family: inherit;
}

button {
  transition: background-color 140ms ease, border-color 140ms ease, transform 140ms ease;
}

button:hover:not(:disabled) { filter: brightness(0.96); }
button:active:not(:disabled) { transform: translateY(1px); }
:focus-visible { outline: 3px solid #dfb866; outline-offset: 3px; }

.modal, .tutorial-card, .panel-backdrop > .panel, .modal-overlay > .panel {
  animation: panel-arrive 200ms ease-out;
}

.research-row:not(.maxed) .research-icon .iconify,
.item-row.active .item-icon .iconify {
  animation: workshop-pulse 3s ease-in-out infinite;
}

@keyframes workshop-pulse {
  0%, 100% { transform: rotate(-5deg) scale(0.95); }
  50% { transform: rotate(5deg) scale(1.06); }
}

@keyframes panel-arrive {
  from { transform: translateY(10px); opacity: 0.7; }
  to { transform: translateY(0); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

html[data-game-motion='off'] {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

// Applied to UI chrome that isn't the tutorial's current target, so the
// target (a toolbar button raised above this via z-index, or a building
// spotlighted directly on the canvas - see GameCanvas.vue) reads as the
// obviously-correct thing to interact with.
.tutorial-dim {
  filter: grayscale(0.85) brightness(0.55);
  opacity: 0.7;
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.app-shell {
  height: 100vh;
  height: 100dvh;
}
</style>
