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
