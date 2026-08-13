import { PIPELINE_STAGES } from './pipeline.config.js'
import { getBuildingConfig } from './buildings/index.js'

/**
 * First-run onboarding sequence, shown only to a brand-new game (see
 * types/tutorial.js / createInitialState.js). Each step optionally
 * highlights a UI target (a toolbar button or a building on the canvas -
 * see GameCanvas.vue's tutorial ring and index.vue's toolbar glow) and
 * optionally auto-advances once `isComplete(gameState)` returns true,
 * mirroring the trophy `check(prestige)` pattern in trophies.config.js.
 * Steps without isComplete only advance via the card's Next button.
 * @typedef {Object} TutorialStep
 * @property {string} id
 * @property {string} title
 * @property {string} body
 * @property {{ kind: 'toolbar', label: string }|{ kind: 'building', type: string }|null} highlight
 * @property {((gameState: import('../types/state.js').GameState) => boolean)|null} [isComplete]
 */

const PIPELINE_BUILDING_TYPES = ['town_hall', ...PIPELINE_STAGES.map((s) => s.type), 'distribution']

/** Building legend shown on the welcome step - reuses each building's own
 * displayName/description rather than duplicating them here. */
export const BUILDING_LEGEND = PIPELINE_BUILDING_TYPES.map((type) => {
  const config = getBuildingConfig(type)
  return { type, displayName: config.displayName, description: config.description, icon: config.icon }
})

function pipelineStepFor(stage) {
  const config = getBuildingConfig(stage.type)
  return {
    id: stage.type,
    title: `Run the ${config.displayName}`,
    body: `Click the ${config.displayName}, then Start a batch. Once the progress ring finishes, click it again to collect - that feeds the next stage.`,
    highlight: { kind: 'building', type: stage.type },
    isComplete: (gameState) => (gameState.resources.storage[stage.outputKey] ?? 0) > 0
  }
}

/** @type {TutorialStep[]} */
export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to the farm',
    body:
      'You run a tobacco farm: raw leaf moves through six processing buildings before it becomes sellable cigars. ' +
      'Here is what each building on your map does:',
    highlight: null,
    isComplete: null
  },
  {
    id: 'buy_seeds',
    title: 'Seeds start every batch',
    body:
      'You start with 30 seeds - enough for a few Nursery batches. Once you run low, open the Store and buy a Seed Pack ' +
      'with the money your cigars bring in.',
    highlight: { kind: 'toolbar', label: 'Store' },
    isComplete: null
  },
  ...PIPELINE_STAGES.map(pipelineStepFor),
  {
    id: 'done',
    title: 'First cigars produced!',
    body:
      'The Distribution Depot automatically sells cigars from storage for money - even while you are away. ' +
      'Keep the pipeline moving, upgrade buildings, and check the Lab and Prestige when you are ready to grow further. ' +
      'Keyboard shortcuts: press C to collect every ready building at once, and 1-6 to start a batch on every idle ' +
      'Tobacco Nursery, Field, Curing Barn, Steaming House, Fermentation Cellar, or Rolling House you own.',
    highlight: null,
    isComplete: null
  }
]
