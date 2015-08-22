//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Engine

var C_NONE             = 0,
    C_POSITION         = 1 << 0,
    C_BOUNDING_BOX     = 1 << 1,
    C_RENDERABLE       = 1 << 2,
    C_INPUT            = 1 << 3,
    C_PHYSICS          = 1 << 4,
    C_MOVE             = 1 << 5,
    C_JUMP             = 1 << 6,
    C_DOUBLE_JUMP      = 1 << 7

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

var munster;

function initWorld(cb) {
  loadTiles(cb)

  munster = createMunster(point(3200, 3200))
}

function createMunster(position) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_INPUT
    | C_PHYSICS
    | C_MOVE
    | C_JUMP

  world.position[e] = point(position.x, position.y)
  world.renderable[e] = renderMunster
  world.sprite[e] = [{x: 0, y: 0},
                     {x: 1, y: 0},
                     {x: 2, y: 0},
                     {x: 3, y: 0},
                     {x: 4, y: 0},
                     {x: 5, y: 0},
                     {x: 6, y: 0}]

  var options = {
    friction: 0.9,
    restitution: 0.2,
    density: 0.1
  }
  world.body[e] = Matter.Bodies.circle(
    position.x, position.y, 8, options)

  Matter.World.add(engine.world, [world.body[e]])

  return e
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

  Matter.Events.on(engine, 'collisionActive', function touchedGround(event) {
    if (event.pairs[0].bodyA === world.body[munster] && jumping) {
      jumping = doubleJumping = false;
    }
  })
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

var velocity = 0.02
var jumpVelocity = 0.3
var jumping = false
var doubleJumping = false

function applyForce(body, force) {
  Matter.Body.applyForce(body, body.position, force)
}

function controls() {

  var body = world.body[munster]
  var multiplier = jumping ? 0.5 : 1

  // Horizontal moves
  if (keys[K_LEFT])
    applyForce(body, point(-velocity * multiplier, 0))

  if (keys[K_RIGHT])
    applyForce(body, point(velocity * multiplier, 0))

  // Jump
  if (keys[K_SPACE] && jumping === false ) {
    applyForce(body, point(0, -jumpVelocity))
    jumping = true
  }

  // Double jump!
  else if (keys[K_SPACE] && jumping === true && doubleJumping === false && body.velocity.y > 0) {
    applyForce(body, point(0, -jumpVelocity))
    doubleJumping = true;
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
  Matter.Engine.run(engine);
  loop(now)
}

function loop(now) {
  var dt = now - lastFrameTime
  lastFrameTime = now

  controls();
  updateTransitions(dt, now)
  //updatePhysics(dt, now)

  render()

  requestAnimationFrame(loop)
}
