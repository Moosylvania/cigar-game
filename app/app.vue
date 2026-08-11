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

.app-shell {
  height: 100vh;
  height: 100dvh;
}
</style>
