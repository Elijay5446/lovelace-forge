// Curated genre playbooks injected into Lovelace's system prompt so first answers
// carry real structure: recommended frameworks/assets (with rough prices) and build order.
export const GENRE_PLAYBOOKS = `
GENRE PLAYBOOKS — when the developer names a genre, ground your plan in this curated knowledge (verify prices as approximate; Unity Asset Store prices fluctuate):

FIGHTING GAME:
- Framework: UFE 2 (Universal Fighting Engine 2, ~$399 Standard / ~$249 Basic) — the industry standard for Unity fighters: frame-data-driven movesets, hitboxes/hurtboxes, combos, netcode-ready.
- Alternatives: build custom with a deterministic input buffer + hitbox system if budget-constrained.
- Build order: 1) character controller + input buffer, 2) hitbox/hurtbox + frame data, 3) two-character combat loop, 4) movesets/combos, 5) AI opponent, 6) stages/UI/rounds, 7) netcode last.

PLATFORMER (2D/3D):
- Framework: Corgi Engine (~$60, 2D) or Platformer Pro; 3D: Unity's Character Controller or Kinematic Character Controller (free since Unity acquisition).
- Helpers: DOTween (free / Pro ~$15) for juice, Cinemachine (free) for camera.
- Build order: 1) movement feel (jump curves, coyote time), 2) camera, 3) hazards/enemies, 4) collectibles/checkpoints, 5) level flow, 6) polish/juice.

RPG / ADVENTURE:
- Frameworks: ORK Framework 3 (~$100) or RPG Builder (~$95); Dialogue System for Unity (~$85) for conversations/quests; ultimate Inventory System or Inventory Pro for items.
- Build order: 1) character + camera, 2) stats/leveling data model (ScriptableObjects), 3) inventory/equipment, 4) dialogue + quests, 5) combat, 6) save/load, 7) world/content.

FPS / SHOOTER:
- Frameworks: Opsive Ultimate Character Controller (~$100) or Unity FPS Microgame as a base; weapons via ScriptableObject data; A* Pathfinding Project (free/Pro ~$90) or NavMesh for enemy AI.
- Multiplayer: Netcode for GameObjects (free) or Photon Fusion.
- Build order: 1) first-person controller + camera, 2) weapon system (raycast first), 3) enemy AI (state machine + NavMesh), 4) health/damage, 5) level + spawning, 6) UI/ammo/HUD, 7) multiplayer last.

PUZZLE / CASUAL:
- Usually no paid framework needed — grid logic + DOTween (free) covers most match/merge/slide games; UI Toolkit or uGUI for menus.
- Build order: 1) core mechanic prototype in a grey-box scene, 2) grid/board data model, 3) input + feedback juice, 4) level definitions (ScriptableObjects/JSON), 5) progression + saves, 6) monetization/ads if mobile.

RACING / SPORTS:
- Frameworks: Realistic Car Controller (~$45) or NWH Vehicle Physics 2 (~$80) for driving feel; Cinemachine for chase cams.
- Build order: 1) vehicle physics + track grey-box, 2) camera, 3) lap/checkpoint system, 4) AI opponents (waypoint following), 5) UI/timing, 6) content/tracks.

UNIVERSAL RECOMMENDATIONS (any genre):
- DOTween (free), Cinemachine (free), Odin Inspector (~$55, editor QoL), Hot Reload (~$20, iteration speed).
- Architecture: ScriptableObjects for data, a simple state machine for game flow, assembly definitions once scripts grow.
- Always grey-box the core loop before buying art; buy frameworks only after the prototype proves fun.

When asked "what should I buy": give 2-3 concrete Asset Store picks with rough prices, say what each saves, and note the free path too. Then produce an ordered, numbered build plan the developer can start immediately.`;