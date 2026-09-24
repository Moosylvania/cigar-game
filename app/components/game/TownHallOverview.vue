<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '~/stores/game.js'
import { getTownStats, MAX_TOWN_NAME_LENGTH } from '#game/engine/townProfile.js'
import { PRESTIGE_TIERS } from '#game/config/prestige.config.js'
import { TROPHIES } from '#game/config/trophies.config.js'
import { formatCompactNumber } from '#game/util/format.js'
const store = useGameStore()
const draft = ref(store.townName)
const error = ref('')
const saved = ref(false)
const stats = computed(() => getTownStats(store.game))
const collectable = computed(() => store.readyBuildingIds.filter(id => !store.isCollectBlocked(id)).length)
const tier = computed(() => PRESTIGE_TIERS[store.prestige.activeTierIndex ?? 0])
const nextTier = computed(() => {
  const index = store.prestige.unlockedCount ?? 1
  return index < PRESTIGE_TIERS.length ? { ...PRESTIGE_TIERS[index], threshold: PRESTIGE_TIERS[index - 1].unlockThreshold } : null
})
const trophies = computed(() => TROPHIES.filter(t => store.prestige.unlockedTrophyIds.includes(t.id)))
const priorities = computed(() => {
  const items = []
  if (collectable.value) items.push(`${collectable.value} building${collectable.value === 1 ? '' : 's'} ready to collect.`)
  const blocked = stats.value.ready - collectable.value
  if (blocked) items.push(`${blocked} ready batch${blocked === 1 ? '' : 'es'} waiting for storage space. Let your fleet export cigars or expand the depot.`)
  if (stats.value.idle) items.push(`${stats.value.idle} production building${stats.value.idle === 1 ? '' : 's'} idle. Check supplies and start a batch.`)
  if (stats.value.upgrading) items.push(`${stats.value.upgrading} upgrade${stats.value.upgrading === 1 ? '' : 's'} underway.`)
  if (nextTier.value) {
    const remaining = Math.max(0, nextTier.value.threshold - stats.value.allTimeEarnings)
    items.push(remaining ? `$${formatCompactNumber(remaining)} more lifetime earnings to reach ${nextTier.value.name}.` : `${nextTier.value.name} is within reach. Open Prestige to advance.`)
  }
  return items.length ? items : ['Your town is running smoothly. Keep the production chain supplied.']
})
function saveName() {
  const result = store.renameTown(draft.value)
  error.value = result.error ?? ''
  saved.value = result.ok
  if (result.ok) draft.value = store.townName
}
const number = formatCompactNumber
</script>

<template>
  <div class="town-overview">
    <form @submit.prevent="saveName">
      <label for="town-name">Edit farm name</label>
      <div class="name-editor">
        <input id="town-name" v-model="draft" :maxlength="MAX_TOWN_NAME_LENGTH * 2" :aria-invalid="!!error" aria-describedby="town-name-feedback" autocomplete="off" @input="saved = false; error = ''" />
        <button type="submit">Save name</button>
      </div>
      <p id="town-name-feedback" class="feedback" :class="{ error }" role="status">{{ error || (saved ? 'Farm name saved. It stays with you through prestige.' : `Up to ${MAX_TOWN_NAME_LENGTH} characters. Your name stays with your save.`) }}</p>
    </form>

    <section>
      <h4>Global stats <span>Across your prestige runs</span></h4>
      <dl>
        <div><dt>Lifetime earnings</dt><dd>${{ number(stats.allTimeEarnings) }}</dd></div>
        <div><dt>Prestiges completed</dt><dd>{{ number(store.prestige.totalPrestigeCount) }}</dd></div>
        <div><dt>Legacy leaves</dt><dd>{{ number(store.prestige.legacyLeaves) }}</dd></div>
        <div><dt>Prestige tiers unlocked</dt><dd>{{ store.prestige.unlockedCount }} / {{ PRESTIGE_TIERS.length }}</dd></div>
        <div><dt>Trophies earned</dt><dd>{{ trophies.length }} / {{ TROPHIES.length }}</dd></div>
      </dl>
    </section>
    <section>
      <h4>Your town today <span>{{ tier?.name }}</span></h4>
      <dl>
        <div><dt>This run's earnings</dt><dd>${{ number(store.lifetimeMoneyEarnedThisRun) }}</dd></div>
        <div><dt>Buildings / level 10</dt><dd>{{ stats.buildings }} / {{ stats.maxLevelBuildings }}</dd></div>
        <div><dt>Owned land</dt><dd>{{ store.ownedTileSet.size }} tiles</dd></div>
        <div><dt>Decorations</dt><dd>{{ store.game.decorations.length }}</dd></div>
        <div><dt>Active production</dt><dd>{{ stats.processing }} buildings</dd></div>
        <div><dt>Vehicles owned</dt><dd>{{ stats.fleet }}</dd></div>
        <div><dt>Export capacity</dt><dd>{{ number(store.fleetCapacityPerHour) }} cigars / hr</dd></div>
        <div><dt>Cigars in storage</dt><dd>{{ number(store.game.resources.storage.cigars) }} / {{ number(store.cigarStorageCapacity) }}</dd></div>
        <div><dt>Lab research levels</dt><dd>{{ stats.researchLevels }}</dd></div>
      </dl>
    </section>
    <section>
      <h4>Town priorities</h4>
      <ul><li v-for="item in priorities" :key="item">{{ item }}</li></ul>
      <button v-if="collectable" class="collect" @click="store.collectAllReady()">Collect ready batches</button>
    </section>
    <section>
      <h4>Trophy cabinet</h4>
      <p v-if="!trophies.length" class="muted">Your first prestige earns your first trophy. Build your legacy here.</p>
      <ul v-else class="trophies"><li v-for="trophy in trophies" :key="trophy.id"><Icon :name="trophy.icon" /><div><strong>{{ trophy.name }}</strong><p>{{ trophy.description }}</p></div></li></ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;
.town-overview { display: grid; gap: 24px; }
label, h4 { display: block; font-size: .95rem; font-weight: 600; margin: 0 0 10px; }
h4 span { display: block; margin-top: 4px; font-size: .78rem; color: $color-text-muted; font-weight: 400; }
.name-editor { display: flex; gap: 8px; }
input { min-width: 0; flex: 1; border: 1px solid $color-panel-border; background: $color-bg; color: $color-text; border-radius: $radius-sm; padding: 10px; font: inherit; }
button { border: 1px solid $color-accent; color: $color-bg; background: $color-accent; padding: 10px 12px; border-radius: $radius-sm; font: inherit; cursor: pointer; }
.feedback, .muted { color: $color-text-muted; font-size: .78rem; line-height: 1.5; margin: 8px 0 0; }
.error { color: $color-danger; }
dl { margin: 0; }
dl > div { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid $color-panel-border; font-size: .85rem; }
dt { color: $color-text-muted; } dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
ul { margin: 0; padding-left: 20px; font-size: .85rem; line-height: 1.6; }
li + li { margin-top: 8px; }
.collect { margin-top: 12px; }
.trophies { list-style: none; padding: 0; }
.trophies li { display: flex; gap: 10px; align-items: flex-start; }
.trophies .iconify { color: $color-accent; font-size: 24px; flex-shrink: 0; }
.trophies p { margin: 3px 0 0; color: $color-text-muted; font-size: .8rem; }
@media (max-width: 400px) { .name-editor { flex-wrap: wrap; } .name-editor input { flex-basis: 100%; } }
</style>
