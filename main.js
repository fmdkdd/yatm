//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Engine

var C_NONE         = 0,
    C_POSITION     = 1 << 0,
    C_BOUNDING_BOX = 1 << 1,
    C_RENDERABLE   = 1 << 2,
    C_INPUT        = 1 << 3,
    C_PHYSICS      = 1 << 4,
    C_SINUSOID     = 1 << 5,
    C_MUNSTER      = 1 << 6,
    C_COIN         = 1 << 7

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

function testEntity(e, mask) {
  return (world.mask[e] & mask) === mask
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

  if (doIntroZoom)
    startIntroZoom()
}

function resetMunster() {
  moveBody(world.body[munster], {x: 3280, y: 3280})
}

function createMunster(position) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_INPUT
    | C_PHYSICS
    | C_MUNSTER
    | C_BOUNDING_BOX

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

  world.boundingBox[e] = bodyToBB(world.body[e])
  world.boundingBoxHit[e] = false

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

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Powerups

function createPowerup(position, type, properties) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_BOUNDING_BOX

  if (type === 'coin') {
    world.renderable[e] = renderCoin
    world.mask[e] |= C_COIN
  }
  else
    console.error('Unknown powerup type!', type)

  world.position[e] = point(position.x, position.y)

  world.sprite[e] = [{x: 0, y: 0},
                     {x: 1, y: 0},
                     {x: 2, y: 0},
                     {x: 3, y: 0}]

  var offset = {
    x: parseInt(properties.offsetX) || 0,
    y: parseInt(properties.offsetY) || 0,
  }

  world.boundingBox[e] = {
    x: position.x + offset.x,
    y: position.y + offset.y,
    width: parseInt(properties.width, 10),
    height: parseInt(properties.height, 10)}

  world.boundingBoxHit[e] = false

  return e
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
               beginSpikeDeathAnim(a.entity)
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

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Bounding box collisions

var grid = spatialHash.new(200)
var hitQueue = []

function checkCollisions() {
  grid.clearAllCells()
  clearCheckedPairs()
  hitQueue.length = 0

  world.boundingBox[munster] = bodyToBB(world.body[munster])

  for (var e of getEntities(C_BOUNDING_BOX)) {
    var b = world.boundingBox[e]
    grid.insertObjectWithBoundingBox(e, b)
    world.boundingBoxHit[e] = false
  }

  for (var objSet of grid.map.values()) {
    var objs = Array.from(objSet)
    for (var i = 0; i < objs.length; ++i) {
      var e1 = objs[i]
      var b1 = world.boundingBox[e1]
      for (var j = i+1; j < objs.length; ++j) {
        var e2 = objs[j]

        if (alreadyChecked(e1, e2))
          continue

        var b2 = world.boundingBox[e2]
        if (do_boxes_collide(b1, b2)) {
          world.boundingBoxHit[e1] =  world.boundingBoxHit[e2] = true
          hitQueue.push([e1, e2])
          checkPair(e1, e2)
        }
      }
    }
  }
}

var checkedPairs = new Map()

function alreadyChecked(e1, e2) {
  return (checkedPairs.has(e1) && checkedPairs.get(e1).has(e2))
    || (checkedPairs.has(e2) && checkedPairs.get(e2).has(e1))
}

function checkPair(e1, e2) {
  if (!checkedPairs.has(e1))
    checkedPairs.set(e1, new Set())
  checkedPairs.get(e1).add(e2)
}

function clearCheckedPairs() {
  for (var p of checkedPairs.values())
    p.clear()
}

function bodyToBB(body) {
  var b = body.parts[0].bounds
  var w = b.max.x - b.min.x
  var h = b.max.y - b.min.y
  return {
    x: b.min.x + w/2,
    y: b.min.y + h/2,
    width: w,
    height: h
  }
}

function resolveCollisions() {
  for (var h of hitQueue) {
    var e1 = h[0]
    var e2 = h[1]
    var m1 = world.mask[e1]
    var m2 = world.mask[e2]

    for (var c of collisionHandlers) {
      if (m1 & c.type1 && m2 & c.type2)
        c.handler(e1, e2)
      else if (m1 & c.type2 && m2 & c.type1)
        c.handler(e2, e1)
    }
  }
}

var collisionHandlers = []

function addCollisionHandler(type1, type2, handler) {
  collisionHandlers.push({type1, type2, handler})
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
  if (!(world.mask[munster] & C_INPUT)) return

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

function deactivateControls() {
  world.mask[munster] &= ~C_INPUT
  Matter.Sleeping.set(world.body[munster], true)
}

function activateControls() {
  world.mask[munster] |= C_INPUT
  Matter.Sleeping.set(world.body[munster], false)
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Audio

var sfx_cache = {}

function sfx_play(id) {
  // Find first unused channel
  for (var c of sfx_cache[id]) {
    if (c.currentTime === 0 || c.ended) {
      c.play()
      return
    }
  }
}

var channels = 4

function initAudio() {
  document.getElementById('bgm').play()

  for (var a of Array.from(document.querySelectorAll('.sfx'))) {
    sfx_cache[a.id] = [a]
    for (var i = 1; i < channels; ++i) {
      sfx_cache[a.id].push(new Audio(a.src))
    }
  }

  for (a of sfx_cache['sfx-pickup-coin'])
    a.volume = 0.15
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Entry point

document.addEventListener('DOMContentLoaded', init)

function init() {
  initCanvas()
  initAudio()
  initPhysics();
  initKeyListeners();
  initWorld(startLoop)

  addCollisionHandler(C_MUNSTER, C_COIN, function(m, c) {
    sfx_play('sfx-pickup-coin')
    destroyEntity(c)
  })
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
  checkCollisions()
  resolveCollisions()

  render()

  requestAnimationFrame(loop)
}
