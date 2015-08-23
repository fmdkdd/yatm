//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Engine

var C_NONE             = 0,
    C_POSITION         = 1 << 0,
    C_BOUNDING_BOX     = 1 << 1,
    C_RENDERABLE       = 1 << 2,
    C_INPUT            = 1 << 3,
    C_PHYSICS          = 1 << 4,
    C_SINUSOID         = 1 << 5

var world = {
  mask: [],
  position: [],
  boundingBox: [],
  boundingBoxHit: [],
  renderable: [],               // Function to render the entity
  sprite: [],                   // {x,y} coordinates into the spritesheet
  body: [],                     // Rigid body subject to the physics simulation
  sinusoid: []
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
    if ((world.mask[e] & mask) === mask)
      yield e
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// World

var munster;

function initWorld(cb) {
  load(cb)

  munster = createMunster(point(0,0))
  resetMunster()

  // START ZOOM EFFECT
  if (do_start_zoom) {
    camera.zoom = 60
    camera_focus({
      x: world.position[munster].x + TS/2,
      y: world.position[munster].y + TS/2,
    })
    camera_transition({zoom: 3}, 2000)
    start_zooming = true
  }
}

function resetMunster() {
  moveBody(world.body[munster], {x: 3250, y: 3250})
}

function createMunster(position) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_INPUT
    | C_PHYSICS

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
    friction: 0.8,
    frictionAir: 0.075,
    restitution: 0.2,
    density: 0.5
  }
  world.body[e] = Matter.Bodies.circle(
    position.x, position.y, 8, options)

  world.body[e].entity = e

  Matter.World.add(engine.world, [world.body[e]])

  return e
}

function createTile(position, sprite, tangible, properties) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE

  world.position[e] = point(position.x, position.y)
  world.renderable[e] = renderTile
  world.sprite[e] = {x: sprite.x, y: sprite.y}

  if (tangible) {

    world.mask[e] |= C_PHYSICS

    var width = parseInt(properties.width) || TILE_SIZE
    var height = parseInt(properties.height) || TILE_SIZE
    var offset = {x: parseInt(properties.offsetX, 10) || 0,
                  y: parseInt(properties.offsetY, 10) || 0}
    world.body[e] = Matter.Bodies.rectangle(
      position.x + offset.x, position.y + offset.y,
      width, height,
      { isStatic: true,
        friction: 0.5 })

    world.body[e].entity = e
    world.body[e].tileType = properties.type

    Matter.World.add(engine.world, [world.body[e]])
  }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Enemies

function createEnemy(position, type, properties) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_SINUSOID

  world.renderable[e] = renderEnemy

  world.position[e] = point(position.x, position.y)
  world.sinusoid[e] =  {
    start: point(position.x, position.y),
    to: point(position.x + parseInt(properties.span), position.y),
    amplitude: parseInt(properties.amplitude),
    duration: parseInt(properties.duration)
  }
}

function updateEnemies(dt, now) {
  for (var e of getEntities(C_SINUSOID)) {
    var sin = world.sinusoid[e]
    var r = (now % sin.duration) / sin.duration
    var x = r < 0.5 ?
      sin.start.x + r * (sin.to.x - sin.start.x) :
      sin.to.x + r * (sin.start.x - sin.to.x)
    var y = sin.start.y + Math.sin(x) * sin.amplitude;
    world.position[e] = point(x, y)
  }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Physics

var engine

function initPhysics() {

  engine = Matter.Engine.create()
  engine.world.gravity.y = 1.4

  // The ground must be touched before jumps
  Matter.Events.on(engine, 'collisionActive', function touchedGround(event) {
    var pair = event.pairs[0]

    if ((pair.bodyA.entity === munster
         || pair.bodyB.entity === munster) && jumping) {
      if (pair.collision.normal.y < -0.9)
        jumping = doubleJumping = false
    }
  })

  Matter.Events.on(engine, 'collisionStart', function collisionStart(event) {
    var pair = event.pairs[0]

    testPair((a,b) => a.tileType === 'death'
             && b.entity === munster,
             function (a,b) {
               resetMunster(b)
             }, pair)
  })
}

function testPair(test, exec, pair) {
  if (test(pair.bodyA, pair.bodyB))
    exec(pair.bodyA, pair.bodyB)
  else if (test(pair.bodyB, pair.bodyA))
    exec(pair.bodyB, pair.bodyA)
}

function moveBody(b, pos) {
  Matter.Body.translate(b, {x: -b.position.x,
                            y: -b.position.y})
  Matter.Body.translate(b, pos)

}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Input

// Keyboard keycodes
var K_LEFT  = 37,
    K_RIGHT = 39,
    K_SPACE = 32

var keys = {}
var justChanged = {} // Keep track of which keys have just been pressed/released

function initKeyListeners() {
  window.addEventListener('keydown', function(e) {
    justChanged[e.which] = keys[e.which] === false || keys[e.which] === undefined
    keys[e.which] = true
  })
  window.addEventListener('keyup', function(e) {
    justChanged[e.which] = keys[e.which] === true || keys[e.which] === undefined
    keys[e.which] = false
  })
}

var velocity = 0.1
var jumpVelocity = 3
var jumping = true
var doubleJumping = true

function applyForce(body, force) {
  Matter.Body.applyForce(body, body.position, force)
}

function controls() {

  var body = world.body[munster]
  var multiplier = jumping ? 0.5 : 1

  // Horizontal moves
  if (keys[K_LEFT]) {
    applyForce(body, point(-velocity * multiplier, 0))
    munsterRotation -= munsterRotationStep
  }
  if (keys[K_RIGHT]) {
    applyForce(body, point(velocity * multiplier, 0))
    munsterRotation += munsterRotationStep
  }

  // If the jump key was just pressed...
  if (keys[K_SPACE] && justChanged[K_SPACE]) {

    // Jump
    if (jumping === false ) {
      applyForce(body, point(0, -jumpVelocity))
      jumping = true
      sfx_play('sfx-jump')
    }

    // Double jump!
    else if (jumping === true && doubleJumping === false && body.velocity.y > 0) {
      applyForce(body, point(0, -jumpVelocity))
      doubleJumping = true
      sfx_play('sfx-jump')
    }
  }

  // Clear
  justChanged = {}
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

  for (var e of getEntities(C_SINUSOID)) {
    console.log(e)
  }
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
  updateEnemies(dt, now)
  updateTransitions(dt, now)
  //updatePhysics(dt, now)

  render()

  requestAnimationFrame(loop)
}
