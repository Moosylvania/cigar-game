import { defineStore } from 'pinia'
import { createInitialState } from '#game/state/createInitialState.js'
import { startBatch as engineStartBatch, collectBatch as engineCollectBatch, resolveOfflineSlots, runAutomation } from '#game/engine/batchEngine.js'
import { startUpgradeToLevel as engineStartUpgradeToLevel, getUpgradePlan, getAffordableUpgradeTarget, resolveCompletedUpgrades, getMaxAllowedLevel } from '#game/engine/upgradeEngine.js'
import {
  getMultipliers,
  getResearchLevel as engineGetResearchLevel,
  getNextLevelCost,
  canBuyResearch as engineCanBuyResearch,
  buyResearch as engineBuyResearch
} from '#game/engine/labEngine.js'
import { getFleetCapacityPerHour, getEffectiveSalePrice, exportCigars } from '#game/engine/economy.js'
import { placeBuilding as enginePlaceBuilding, canPlaceBuilding, planRelocation, relocateBuildings as engineRelocateBuildings } from '#game/engine/placementEngine.js'
import {
  canPlaceDecoration as engineCanPlaceDecoration,
  placeDecoration as enginePlaceDecoration,
  removeDecoration as engineRemoveDecoration
} from '#game/engine/decorationEngine.js'
import { expandLand as engineExpandLand, canExpandLand, getUnlockedRegion, getNextLandTier } from '#game/engine/landEngine.js'
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
import {
  canPrestige as engineCanPrestige,
  calculatePrestigePoints,
  getVarietyMultiplier,
  getTotalPrestigeMultiplier,
  doPrestige as engineDoPrestige
} from '#game/engine/prestigeEngine.js'
import {
  getEpicMultipliers,
  getEpicResearchLevel as engineGetEpicResearchLevel,
  getEpicNextLevelCost,
  canBuyEpicResearch as engineCanBuyEpicResearch,
  buyEpicResearch as engineBuyEpicResearch,
  isEpicResearchUnlocked as engineIsEpicResearchUnlocked
} from '#game/engine/epicResearchEngine.js'
import { getBuildingConfig } from '#game/config/buildings/index.js'
import { TUTORIAL_STEPS } from '#game/config/tutorial.config.js'
import { TOBACCO_VARIETIES } from '#game/config/prestige.config.js'
import { TROPHIES } from '#game/config/trophies.config.js'
import { getEpicResearchDefinition } from '#game/config/epicResearch.config.js'
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
    landRegion: (state) => getUnlockedRegion(state.game),
    nextLandTier: (state) => getNextLandTier(state.game),
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
      const speedMultipliers = {}
      for (const key of new Set([...Object.keys(lab.speedMultipliers), ...Object.keys(epic.speedMultipliers)])) {
        speedMultipliers[key] = (lab.speedMultipliers[key] ?? 1) * (epic.speedMultipliers[key] ?? 1)
      }
      const batchSizeMultipliers = {}
      for (const key of new Set([...Object.keys(lab.batchSizeMultipliers), ...Object.keys(epic.batchSizeMultipliers)])) {
        batchSizeMultipliers[key] = (lab.batchSizeMultipliers[key] ?? 1) * (epic.batchSizeMultipliers[key] ?? 1)
      }
      return {
        salePriceMultiplier: lab.salePriceMultiplier * epic.salePriceMultiplier,
        speedMultipliers,
        batchSizeMultipliers,
        depotCapacityMultiplier: lab.depotCapacityMultiplier * epic.depotCapacityMultiplier,
        fleetThroughputMultiplier: lab.fleetThroughputMultiplier * epic.fleetThroughputMultiplier,
        prestigeMultiplier: this.totalPrestigeMultiplier
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
    readyBuildingIds: (state) => state.game.buildings.filter((b) => b.slot?.status === 'ready').map((b) => b.id),
    decorations: (state) => state.game.decorations,

    prestige: (state) => state.game.prestige,
    lifetimeMoneyEarnedThisRun: (state) => state.game.meta.lifetimeMoneyEarned ?? 0,
    prestigePointsPreview() {
      return calculatePrestigePoints(this.lifetimeMoneyEarnedThisRun)
    },
    canPrestige(state) {
      return engineCanPrestige(state.game)
    },
    tobaccoVarieties() {
      const prestige = this.prestige
      return TOBACCO_VARIETIES.map((variety, index) => {
        const points = prestige.varietyPoints[index] ?? 0
        const unlocked = index < prestige.unlockedCount
        const active = index === prestige.unlockedCount - 1
        return {
          variety,
          index,
          points,
          unlocked,
          active,
          multiplier: unlocked ? getVarietyMultiplier(points) : 1,
          progress: !unlocked ? 0 : Number.isFinite(variety.unlockThreshold) ? Math.min(1, points / variety.unlockThreshold) : 1
        }
      })
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
      return building ? getUpgradePlan(building.type, building.level, targetLevel) : null
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
      return engineStartUpgradeToLevel(building, this.game, targetLevel)
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
     * (moving output to storage, capped and possibly overflowing for
     * Rolling's cigars - see batchEngine.js collectBatch).
     */
    collectAllReady() {
      const readyBuildings = this.game.buildings.filter((b) => b.slot?.status === 'ready')
      let overflowed = 0
      for (const building of readyBuildings) {
        const result = engineCollectBatch(building, this.game, this.combinedMultipliers)
        overflowed += result.overflowed ?? 0
      }
      return { count: readyBuildings.length, overflowed }
    },

    canExpandLand() {
      return canExpandLand(this.game)
    },

    expandLand() {
      return engineExpandLand(this.game)
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
      return engineCanBuyStoreItem(this.game, itemId, this.combinedMultipliers)
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

    isEpicResearchUnlocked(researchId) {
      const research = getEpicResearchDefinition(researchId)
      return research ? engineIsEpicResearchUnlocked(this.game.prestige, research) : false
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
     * simulated second, so elapsedSeconds is always 1 here.
     */
    tick() {
      const atTime = now()
      resolveOfflineSlots(this.game, atTime)
      resolveCompletedUpgrades(this.game, atTime)
      runAutomation(this.game, this.combinedMultipliers)
      exportCigars(this.game, 1, this.combinedMultipliers)
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
