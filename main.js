//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Engine

var C_NONE             = 0,
    C_POSITION         = 1 << 0,
    C_BOUNDING_BOX     = 1 << 1,
    C_RENDERABLE       = 1 << 2,
    C_INPUT            = 1 << 3,
    C_PHYSICS          = 1 << 4,
    C_PHYSICS_CONTROLS = 1 << 5

var world = {
  mask: [],
  position: [],
  boundingBox: [],
  boundingBoxHit: [],
  renderable: [],               // Function to render the entity
  sprite: [],                   // {x,y} coordinates into the spritesheet
  body: [],                     // Rigid body subject to the physics simulation
}

function createEntity() {
  var i = 0
  while (world.mask[i] !== C_NONE && world.mask[i] != null)
    ++i

  return i
}

function destroyEntity(e) {
  world.mask[e] = C_NONE
}

function* getEntities(mask) {
  for (var e = 0, n = world.mask.length; e < n; ++e)
    if (world.mask[e] & mask === mask)
      yield e
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// World

function initWorld(cb) {
  loadTiles(cb)

  createMunster(point(10, 3))
}

function createMunster(position) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_INPUT
    | C_PHYSICS
    | C_PHYSICS_CONTROLS

  world.position[e] = point(position.x, position.y)
  world.renderable[e] = renderMunster
  world.sprite[e] = {x: 0, y: 19}

  var options = {
    friction: 0.1,
    restitution: 0.2,
    density: 0.01
  }
  world.body[e] = Matter.Bodies.circle(position.x, position.y,
                                       8  ,
                                       options)

  Matter.World.add(engine.world, [world.body[e]])
}

function createTile(position, sprite) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_PHYSICS

  world.position[e] = point(position.x, position.y)
  world.renderable[e] = renderTile
  world.sprite[e] = {x: sprite.x, y: sprite.y}

  world.body[e] = Matter.Bodies.rectangle(
    position.x, position.y,
    TILE_SIZE, TILE_SIZE,
    { isStatic: true })

  Matter.World.add(engine.world, [world.body[e]])
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Physics

var engine

function initPhysics() {
  engine = Matter.Engine.create()
  engine.world.gravity.y = 0.7
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Input

var keys = {}
function onKeyDown(e) { keys[e.which] = true }
function onKeyUp(e) { keys[e.which] = false }

// Keyboard keycodes
var K_LEFT  = 37,
    K_RIGHT = 39,
    K_SPACE = 32

function initKeyListeners() {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
}

var controlsMask = C_PHYSICS | C_PHYSICS_CONTROLS

function applyForce(body, force) {
  Matter.Body.applyForce(body,
                         body.position,
                         force)
}

var velocity = 0.005
var jumpVelocity = 0.005

function controls() {
  for (var e of getEntities(controlsMask)) {
    if (keys[K_SPACE])
      applyForce(world.body[e], point(0, -jumpVelocity))

    if (keys[K_LEFT])
      applyForce(world.body[e], point(-velocity, 0))
    if (keys[K_RIGHT])
      applyForce(world.body[e], point(velocity, 0))
  }
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Audio

var sfx_cache = {}

function sfx_play(id) {
  if (!sfx_cache[id])
    sfx_cache[id] = document.getElementById(id)
  sfx_cache[id].play()
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Entry point

document.addEventListener('DOMContentLoaded', init)

function init() {
  initCanvas()
  initPhysics();
  initKeyListeners();
  initWorld(startLoop)
}

function updatePhysics(dt, now) {
  Matter.Engine.update(engine, dt)
}

var lastFrameTime

function startLoop() {
  var now = performance.now()
  lastFrameTime = now
  loop(now)
}

function loop(now) {
  var dt = now - lastFrameTime
  lastFrameTime = now

  controls();
  updateTransitions(dt, now)
  updatePhysics(dt, now)

  render()

  requestAnimationFrame(loop)
}
