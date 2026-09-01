import { defineStore } from 'pinia'
import { createInitialState } from '#game/state/createInitialState.js'
import {
  startBatch as engineStartBatch,
  collectBatch as engineCollectBatch,
  isCollectBlockedByOutputCap as engineIsCollectBlockedByOutputCap,
  resolveOfflineSlots,
  runAutomation
} from '#game/engine/batchEngine.js'
import { startUpgradeToLevel as engineStartUpgradeToLevel, getUpgradePlan, getAffordableUpgradeTarget, resolveCompletedUpgrades, getMaxAllowedLevel } from '#game/engine/upgradeEngine.js'
import {
  getMultipliers,
  getResearchLevel as engineGetResearchLevel,
  getNextLevelCost,
  canBuyResearch as engineCanBuyResearch,
  buyResearch as engineBuyResearch
} from '#game/engine/labEngine.js'
import { getFleetCapacityPerHour, getEffectiveSalePrice, exportCigars } from '#game/engine/economy.js'
import {
  placeBuilding as enginePlaceBuilding,
  canPlaceBuilding,
  planRelocation,
  relocateBuildings as engineRelocateBuildings,
  getBuildingSellValue,
  sellBuilding as engineSellBuilding
} from '#game/engine/placementEngine.js'
import {
  canPlaceDecoration as engineCanPlaceDecoration,
  placeDecoration as enginePlaceDecoration,
  removeDecoration as engineRemoveDecoration
} from '#game/engine/decorationEngine.js'
import {
  getOwnedTileSet,
  getOwnedBounds,
  getMaxPurchasableRing,
  isOwnedTile as engineIsOwnedTile,
  isTilePurchasable as engineIsTilePurchasable,
  getTileCost as engineGetTileCost,
  canBuyTile as engineCanBuyTile,
  buyTile as engineBuyTile
} from '#game/engine/landEngine.js'
import {
  canBuyVehicle as engineCanBuyVehicle,
  buyVehicle as engineBuyVehicle,
  canReplaceVehicle as engineCanReplaceVehicle,
  replaceVehicle as engineReplaceVehicle,
  getMaxSlots as engineGetMaxFleetSlots,
  getTotalFleetCount as engineGetTotalFleetCount,
  getCigarStorageCapacity
} from '#game/engine/distributionEngine.js'
import { canBuyStoreItem as engineCanBuyStoreItem, buyStoreItem as engineBuyStoreItem, getSeedsPerBatch } from '#game/engine/storeEngine.js'
import { getBoostMultipliers, pruneExpiredBoosts } from '#game/engine/boostEngine.js'
import { updateCoinDelivery, collectCoinDelivery as engineCollectCoinDelivery } from '#game/engine/coinDeliveryEngine.js'
import {
  canPrestige as engineCanPrestige,
  getActiveTierMultiplier,
  getTotalPrestigeMultiplier,
  getLeavesEarned,
  getLeafMultiplier,
  getLeafBonusPerLeaf,
  getLeafBoostCost,
  getLeafBoostCooldownRemainingMs,
  canBuyLeafBoost as engineCanBuyLeafBoost,
  buyLeafBoost as engineBuyLeafBoost,
  doPrestige as engineDoPrestige,
  canAdvanceTier as engineCanAdvanceTier,
  advanceTier as engineAdvanceTier
} from '#game/engine/prestigeEngine.js'
import {
  getEpicMultipliers,
  getEpicResearchLevel as engineGetEpicResearchLevel,
  getEpicNextLevelCost,
  canBuyEpicResearch as engineCanBuyEpicResearch,
  buyEpicResearch as engineBuyEpicResearch
} from '#game/engine/epicResearchEngine.js'
import { getBuildingConfig } from '#game/config/buildings/index.js'
import { PIPELINE_STAGES } from '#game/config/pipeline.config.js'
import { TUTORIAL_STEPS } from '#game/config/tutorial.config.js'
import { PRESTIGE_TIERS } from '#game/config/prestige.config.js'
import { TROPHIES } from '#game/config/trophies.config.js'
import { now } from '#game/util/time.js'

export const useGameStore = defineStore('game', {
  state: () => ({
    /** @type {import('#game/types/state.js').GameState} */
    game: createInitialState(),
    isLoaded: false,
    offlineEarnings: null
  }),

  getters: {
    money: (state) => state.game.resources.money,
    storage: (state) => state.game.resources.storage,
    townHall: (state) => state.game.townHall,
    buildings: (state) => state.game.buildings,
    allBuildings: (state) => [state.game.townHall, ...state.game.buildings],
    hasActiveTimers(state) {
      return this.allBuildings.some((b) => b.slot?.status === 'processing' || b.upgrade)
    },
    // A Set, not a rectangle - owned land is now individually-purchased
    // tiles, not always a single contiguous rect. Computed here (once per
    // reactive dependency change, not per call) so per-tile lookups during
    // rendering/placement stay O(1) instead of re-scanning purchasedTiles.
    ownedTileSet(state) {
      return getOwnedTileSet(state.game)
    },
    // Bounding box around all owned land, for camera centering/framing -
    // see getOwnedBounds's own doc comment for why it's an envelope, not
    // the true owned shape.
    ownedBounds(state) {
      return getOwnedBounds(state.game)
    },
    // How far out (in rings from the starting region) a tile can currently
    // be purchased - memoized off ownedTileSet, not recomputed per rendered
    // tile, since finding it means scanning whole ring perimeters (see
    // landEngine.js getHighestCompletedRing).
    maxPurchasableRing() {
      return getMaxPurchasableRing(this.ownedTileSet)
    },
    labMultipliers: (state) => getMultipliers(state.game.lab),
    epicMultipliers: (state) => getEpicMultipliers(state.game.prestige),
    totalPrestigeMultiplier() {
      return getTotalPrestigeMultiplier(this.prestige, this.epicMultipliers.prestigeMultiplierBoost)
    },
    /**
     * Merges Lab research, Epic research, and the prestige multiplier into
     * one bag - every engine call site that used to take labMultipliers
     * takes this instead, so prestige/epic bonuses reach the same places
     * regular research does without those engine modules knowing about
     * prestige at all.
     */
    combinedMultipliers() {
      const lab = this.labMultipliers
      const epic = this.epicMultipliers
      const boost = getBoostMultipliers(this.game.boosts)
      // Iterates every pipeline type explicitly (not just whichever keys
      // lab/epic happen to already have an entry for) so the boost's
      // across-the-board speedup never silently drops for a type neither
      // of those has touched yet.
      const speedMultipliers = {}
      for (const stage of PIPELINE_STAGES) {
        const type = stage.type
        speedMultipliers[type] = (lab.speedMultipliers[type] ?? 1) * (epic.speedMultipliers[type] ?? 1) * boost.processingSpeedMultiplier
      }
      const batchSizeMultipliers = {}
      for (const key of new Set([...Object.keys(lab.batchSizeMultipliers), ...Object.keys(epic.batchSizeMultipliers)])) {
        batchSizeMultipliers[key] = (lab.batchSizeMultipliers[key] ?? 1) * (epic.batchSizeMultipliers[key] ?? 1)
      }
      return {
        salePriceMultiplier: lab.salePriceMultiplier * epic.salePriceMultiplier * boost.salePriceMultiplier,
        speedMultipliers,
        batchSizeMultipliers,
        depotCapacityMultiplier: lab.depotCapacityMultiplier * epic.depotCapacityMultiplier,
        fleetThroughputMultiplier: lab.fleetThroughputMultiplier * epic.fleetThroughputMultiplier,
        prestigeMultiplier: this.totalPrestigeMultiplier,
        upgradeSpeedMultiplier: boost.upgradeSpeedMultiplier
      }
    },
    fleetCapacityPerHour(state) {
      return getFleetCapacityPerHour(state.game.distribution, this.combinedMultipliers)
    },
    effectiveSalePrice(state) {
      return getEffectiveSalePrice(state.game, this.combinedMultipliers)
    },
    cigarStorageCapacity(state) {
      return getCigarStorageCapacity(state.game, this.combinedMultipliers)
    },
    fleet: (state) => state.game.distribution.fleet,
    fleetMaxSlots(state) {
      return engineGetMaxFleetSlots(state.game)
    },
    fleetSlotsUsed(state) {
      return engineGetTotalFleetCount(state.game)
    },
    seedsPerBatch(state) {
      return getSeedsPerBatch(state.game, this.combinedMultipliers)
    },
    distributionBuilding: (state) => state.game.buildings.find((b) => b.type === 'distribution') ?? null,
    // Raw boost data (expiresAt timestamps) - components compute live
    // remaining time themselves against useClock's nowMs, same pattern as
    // building upgrade/slot countdowns (see BuildingUpgradePanel.vue).
    boosts: (state) => state.game.boosts,
    coins: (state) => state.game.coins,
    pendingCoinDelivery: (state) => state.game.coinDelivery.pending,
    readyBuildingIds: (state) => state.game.buildings.filter((b) => b.slot?.status === 'ready').map((b) => b.id),
    decorations: (state) => state.game.decorations,

    prestige: (state) => state.game.prestige,
    lifetimeMoneyEarnedThisRun: (state) => state.game.meta.lifetimeMoneyEarned ?? 0,
    canPrestige(state) {
      return engineCanPrestige(state.game)
    },
    canAdvanceTier(state) {
      return engineCanAdvanceTier(state.game)
    },
    legacyLeaves(state) {
      return state.game.prestige.legacyLeaves ?? 0
    },
    // How many Legacy Leaves this run's not-yet-banked earnings would add
    // on top of legacyLeaves if the player prestiged (or advanced) right
    // now - shown as a preview next to the Prestige button.
    projectedLeavesEarned() {
      return getLeavesEarned(this.lifetimeMoneyEarnedThisRun)
    },
    leafBonusPerLeaf() {
      return getLeafBonusPerLeaf(this.prestige)
    },
    leafMultiplier() {
      return getLeafMultiplier(this.prestige)
    },
    leafBoostCost() {
      return getLeafBoostCost(this.prestige.leafBoostLevel ?? 0)
    },
    leafBoostCooldownRemainingMs() {
      return getLeafBoostCooldownRemainingMs(this.prestige)
    },
    canBuyLeafBoost(state) {
      return engineCanBuyLeafBoost(state.game)
    },
    /**
     * Function-valued getter: what totalPrestigeMultiplier would become if
     * the player prestiged (or advanced to targetIndex) right now, banking
     * this run's not-yet-banked earnings (both into lifetimeMoneyEarnedAllTime,
     * for tier-unlock thresholds, and into legacyLeaves, which is what
     * actually drives the multiplier). Lets the UI show a before/after
     * preview.
     * @returns {(targetIndex?: number) => number}
     */
    projectedPrestigeMultiplier() {
      const prestige = this.prestige
      const dollarsThisRun = this.lifetimeMoneyEarnedThisRun
      const projectedAllTime = (prestige.lifetimeMoneyEarnedAllTime ?? 0) + dollarsThisRun
      const projectedLeaves = (prestige.legacyLeaves ?? 0) + getLeavesEarned(dollarsThisRun)
      const boost = this.epicMultipliers.prestigeMultiplierBoost
      return (targetIndex) => {
        const resolvedTarget = targetIndex ?? (prestige.activeTierIndex ?? prestige.unlockedCount - 1)
        const projectedPrestige = {
          ...prestige,
          lifetimeMoneyEarnedAllTime: projectedAllTime,
          legacyLeaves: projectedLeaves,
          unlockedCount: Math.max(prestige.unlockedCount, resolvedTarget + 1),
          activeTierIndex: resolvedTarget
        }
        return getTotalPrestigeMultiplier(projectedPrestige, boost)
      }
    },
    prestigeTiers() {
      const prestige = this.prestige
      // Includes this run's not-yet-banked earnings, so a locked tier's
      // progress bar (and "eligible to advance" state) updates live as you
      // play, not only right after a prestige.
      const allTimeEarned = (prestige.lifetimeMoneyEarnedAllTime ?? 0) + this.lifetimeMoneyEarnedThisRun
      const activeTierIndex = prestige.activeTierIndex ?? prestige.unlockedCount - 1
      return PRESTIGE_TIERS.map((tier, index) => {
        const unlocked = index < prestige.unlockedCount
        const active = index === activeTierIndex
        const bandStart = index === 0 ? 0 : PRESTIGE_TIERS[index - 1].unlockThreshold
        const bandEnd = tier.unlockThreshold
        const bandWidth = Number.isFinite(bandEnd) ? bandEnd - bandStart : null
        const earnedInBand = Math.max(0, Math.min(allTimeEarned, Number.isFinite(bandEnd) ? bandEnd : allTimeEarned) - bandStart)
        const progress = bandWidth ? Math.min(1, earnedInBand / bandWidth) : unlocked ? 1 : 0
        return {
          tier,
          index,
          unlocked,
          active,
          // The flat bonus this tier gives while it's the active one (see
          // prestigeEngine.js getActiveTierMultiplier) - a fixed function
          // of tier index, so it's shown the same whether or not the tier
          // is unlocked yet, as a preview of what moving up is worth.
          multiplier: getActiveTierMultiplier(index),
          // A locked tier whose own threshold is already met - a brand new
          // tier, never reached before. Not just the very next one; a big
          // run can vault past several thresholds at once, and advanceTier
          // lets the player jump straight to whichever of them they choose.
          eligible: !unlocked && progress >= 1,
          // Any tier other than the active one that advanceTier can move
          // to right now - either a new eligible tier above, or one the
          // player already reached before (unlockedCount only grows, so
          // once visited a tier stays movable-to forever, in either
          // direction). Moving always costs the same full reset as
          // prestiging (see prestigeEngine.js advanceTier) - it's not a
          // free look-around toggle.
          movable: !active && (unlocked || progress >= 1),
          unlockAt: bandEnd,
          earnedInBand,
          bandWidth,
          progress
        }
      })
    },
    // The prestige tier whose sprite theme should currently render on the
    // board - wherever advanceTier last moved the player to, which isn't
    // necessarily the highest tier ever unlocked (see prestigeTiers'
    // movable rows above - moving is always a full reset, forward or
    // back). 'backyard' (index 0) has no separate theme pack of its own -
    // it IS the default sprite pack - see renderers/buildingSprites.js.
    activeThemeId() {
      const index = this.prestige.activeTierIndex ?? Math.max(0, this.prestige.unlockedCount - 1)
      return PRESTIGE_TIERS[index]?.id ?? 'backyard'
    },
    trophyRows() {
      const unlockedIds = this.prestige.unlockedTrophyIds
      return TROPHIES.map((trophy) => ({ trophy, unlocked: unlockedIds.includes(trophy.id) }))
    },

    tutorial: (state) => state.game.tutorial,
    isTutorialVisible(state) {
      return state.game.tutorial.active && !state.game.tutorial.dismissed
    },
    currentTutorialStep(state) {
      return TUTORIAL_STEPS[state.game.tutorial.currentStep] ?? null
    },
    isCurrentTutorialStepComplete(state) {
      const step = this.currentTutorialStep
      return step?.isComplete ? step.isComplete(state.game) : false
    }
  },

  actions: {
    hydrate(gameState) {
      this.game = gameState
      this.isLoaded = true
    },

    findBuilding(buildingId) {
      if (this.game.townHall.id === buildingId) return this.game.townHall
      return this.game.buildings.find((b) => b.id === buildingId) ?? null
    },

    getBuildingConfig(type) {
      return getBuildingConfig(type)
    },

    getMaxAllowedLevel(buildingId) {
      const building = this.findBuilding(buildingId)
      return building ? getMaxAllowedLevel(building, this.game) : null
    },

    getUpgradePlan(buildingId, targetLevel) {
      const building = this.findBuilding(buildingId)
      return building ? getUpgradePlan(building.type, building.level, targetLevel, this.combinedMultipliers.upgradeSpeedMultiplier) : null
    },

    getAffordableUpgradeTarget(buildingId) {
      const building = this.findBuilding(buildingId)
      return building ? getAffordableUpgradeTarget(building, this.game) : null
    },

    canPlaceBuilding(type, position) {
      return canPlaceBuilding(this.game, type, position)
    },

    placeBuilding(type, position) {
      return enginePlaceBuilding(this.game, type, position)
    },

    getBuildingSellValue(buildingId) {
      const building = this.findBuilding(buildingId)
      return building ? getBuildingSellValue(building) : null
    },

    sellBuilding(buildingId) {
      return engineSellBuilding(this.game, buildingId)
    },

    canRelocateBuildings(moves) {
      return planRelocation(this.game, moves)
    },

    relocateBuildings(moves) {
      return engineRelocateBuildings(this.game, moves)
    },

    canPlaceDecoration(decorationId, position) {
      return engineCanPlaceDecoration(this.game, decorationId, position)
    },

    placeDecoration(decorationId, position) {
      return enginePlaceDecoration(this.game, decorationId, position)
    },

    removeDecoration(instanceId) {
      return engineRemoveDecoration(this.game, instanceId)
    },

    startBuildingUpgradeToLevel(buildingId, targetLevel) {
      const building = this.findBuilding(buildingId)
      if (!building) return { ok: false, reason: 'not_found' }
      return engineStartUpgradeToLevel(building, this.game, targetLevel, this.combinedMultipliers.upgradeSpeedMultiplier)
    },

    startBatch(buildingId) {
      const building = this.findBuilding(buildingId)
      if (!building) return { ok: false, reason: 'not_found' }
      return engineStartBatch(building, this.game, this.combinedMultipliers)
    },

    collectBatch(buildingId) {
      const building = this.findBuilding(buildingId)
      if (!building) return { ok: false, reason: 'not_found' }
      return engineCollectBatch(building, this.game, this.combinedMultipliers)
    },

    /**
     * Collects every building currently sitting in 'ready' status in one
     * click - each collect still goes through the normal engine path
     * (moving output to storage). A Rolling House whose batch would
     * overflow the Depot is skipped, same as a manual collect would be
     * blocked (see batchEngine.js collectBatch's cappedOutput refusal).
     */
    collectAllReady() {
      const readyBuildings = this.game.buildings.filter((b) => b.slot?.status === 'ready')
      let count = 0
      for (const building of readyBuildings) {
        const result = engineCollectBatch(building, this.game, this.combinedMultipliers)
        if (result.ok) count += 1
      }
      return { count }
    },

    /** Whether this building's finished batch can't be collected right now
     * because the Depot has no room for it (Rolling House only - see
     * batchEngine.js isCollectBlockedByOutputCap). Drives the warning badge
     * on the building tile and blocks the tap-to-collect indicator. */
    isCollectBlocked(buildingId) {
      const building = this.findBuilding(buildingId)
      if (!building) return false
      return engineIsCollectBlockedByOutputCap(building, this.game, this.combinedMultipliers)
    },

    /**
     * Starts a batch on every idle building of one pipeline type in one
     * keypress (see index.vue's 1-6 shortcuts) - same per-building path as
     * startBatch, just applied to every idle building of that type instead
     * of one at a time. A building without enough input to start simply
     * gets skipped (engineStartBatch already returns not-ok for that)
     * rather than surfacing an error, same as a manual click would.
     * Highest-level buildings go first - startBatch pulls from the shared
     * input pool first-come-first-served (no fair share, same as a manual
     * click - see batchEngine.js), so when input is scarce this ensures
     * the biggest, most efficient batches claim it before smaller ones.
     */
    startAllIdleOfType(type) {
      const idleBuildings = this.game.buildings
        .filter((b) => b.type === type && b.slot?.status === 'idle')
        .sort((a, b) => b.level - a.level)
      let started = 0
      for (const building of idleBuildings) {
        const result = engineStartBatch(building, this.game, this.combinedMultipliers)
        if (result.ok) started += 1
      }
      return { count: started }
    },

    collectCoinDelivery() {
      return engineCollectCoinDelivery(this.game)
    },

    isTileOwned(x, y) {
      return engineIsOwnedTile(this.ownedTileSet, x, y)
    },

    isTilePurchasable(x, y) {
      return engineIsTilePurchasable(this.ownedTileSet, x, y, this.maxPurchasableRing)
    },

    getTileCost(x, y) {
      return engineGetTileCost(x, y)
    },

    canBuyLandTile(x, y) {
      return engineCanBuyTile(this.game, x, y)
    },

    buyLandTile(x, y) {
      return engineBuyTile(this.game, x, y)
    },

    getResearchLevel(researchId) {
      return engineGetResearchLevel(this.game.lab, researchId)
    },

    getNextResearchCost(research) {
      return getNextLevelCost(research, this.getResearchLevel(research.id))
    },

    canBuyResearch(researchId) {
      return engineCanBuyResearch(this.game, researchId)
    },

    buyResearch(researchId) {
      return engineBuyResearch(this.game, researchId)
    },

    canBuyVehicle(vehicleTierId) {
      return engineCanBuyVehicle(this.game, vehicleTierId)
    },

    buyVehicle(vehicleTierId) {
      return engineBuyVehicle(this.game, vehicleTierId)
    },

    canReplaceVehicle(fromVehicleTierId, toVehicleTierId) {
      return engineCanReplaceVehicle(this.game, fromVehicleTierId, toVehicleTierId)
    },

    replaceVehicle(fromVehicleTierId, toVehicleTierId) {
      return engineReplaceVehicle(this.game, fromVehicleTierId, toVehicleTierId)
    },

    canBuyStoreItem(itemId) {
      return engineCanBuyStoreItem(this.game, itemId)
    },

    buyStoreItem(itemId) {
      return engineBuyStoreItem(this.game, itemId, this.combinedMultipliers)
    },

    getEpicResearchLevel(researchId) {
      return engineGetEpicResearchLevel(this.game.prestige, researchId)
    },

    getNextEpicResearchCost(research) {
      return getEpicNextLevelCost(research, this.getEpicResearchLevel(research.id))
    },

    canBuyEpicResearch(researchId) {
      return engineCanBuyEpicResearch(this.game, researchId)
    },

    buyEpicResearch(researchId) {
      return engineBuyEpicResearch(this.game, researchId)
    },

    doPrestige() {
      return engineDoPrestige(this.game)
    },

    advanceTier(targetIndex) {
      return engineAdvanceTier(this.game, targetIndex)
    },

    buyLeafBoost() {
      return engineBuyLeafBoost(this.game)
    },

    nextTutorialStep() {
      const tutorial = this.game.tutorial
      if (tutorial.currentStep >= TUTORIAL_STEPS.length - 1) {
        tutorial.active = false
        tutorial.dismissed = true
      } else {
        tutorial.currentStep += 1
      }
    },

    previousTutorialStep() {
      const tutorial = this.game.tutorial
      if (tutorial.currentStep > 0) tutorial.currentStep -= 1
    },

    skipTutorial() {
      this.game.tutorial.active = false
      this.game.tutorial.dismissed = true
    },

    reopenTutorial() {
      this.game.tutorial.currentStep = 0
      this.game.tutorial.active = true
      this.game.tutorial.dismissed = false
    },

    /**
     * Realtime per-tick work: resolve any batch/upgrade timers that
     * finished, run automation (auto-collect/auto-start for leveled-up
     * buildings), then export/sell from cigar storage at the fleet's
     * throughput rate - this last step is what continuously turns cigars
     * into money now, independent of Rolling's own automation tier (see
     * economy.js exportCigars). useGameLoop calls tick() once per
     * simulated second, so elapsedSeconds is always 1 here. The shared
     * display clock (countdown text) is a separate thing entirely now -
     * see useClock.js - updated every animation frame instead of once per
     * tick, and deliberately outside this store so it doesn't interfere
     * with the autosave debounce below.
     */
    tick() {
      const atTime = now()
      resolveOfflineSlots(this.game, atTime)
      resolveCompletedUpgrades(this.game, atTime)
      runAutomation(this.game, this.combinedMultipliers)
      exportCigars(this.game, 1, this.combinedMultipliers)
      updateCoinDelivery(this.game, atTime)
      pruneExpiredBoosts(this.game.boosts, atTime)
    },

    /**
     * Dev-only affordance: instantly resolves every in-progress batch and
     * upgrade timer, however far from completion, by reusing the same
     * resolve functions with a time far in the future instead of "now".
     */
    skipAllTimers() {
      resolveOfflineSlots(this.game, Infinity)
      resolveCompletedUpgrades(this.game, Infinity)
    }
  }
})
