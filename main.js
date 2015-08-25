//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Engine

var C_NONE         = 0,
    C_POSITION     = 1 << 0,
    C_BOUNDING_BOX = 1 << 1,
    C_RENDERABLE   = 1 << 2,
    C_INPUT        = 1 << 3,
    C_PHYSICS      = 1 << 4,
    C_MUNSTER      = 1 << 6,
    C_COIN         = 1 << 7,
    C_PATROL       = 1 << 8,
    C_FLY          = 1 << 9,
    C_WORM         = 1 << 10,
    C_WINGS        = 1 << 11,
    C_MEANPEOPLE   = 1 << 12,
    C_TEXT         = 1 << 13,
    C_PATROL_SIN   = 1 << 14,
    C_CHECKPOINT   = 1 << 15,
    C_HORNS        = 1 << 16,
    C_FLOATING     = 1 << 17

var world = {
  mask: [],
  position: [],
  boundingBox: [],
  boundingBoxHit: [],
  renderable: [],               // Function to render the entity
  sprite: [],                   // {x,y} coordinates into the spritesheet
  body: [],                     // Rigid body subject to the physics simulation
  patrolPath: [],
  text: [],
  floating: []
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

var munster

var lastCheckpoint
var start = lastCheckpoint = point(3280, 3280)
//start = lastCheckpoint = point(141*16, 137*16)

function saveGame() {
  window.localStorage.setItem('horns', hasHorns)
  window.localStorage.setItem('wings', canDoubleJump)

  window.localStorage.setItem('checkpoint_x', lastCheckpoint.x)
  window.localStorage.setItem('checkpoint_y', lastCheckpoint.y)
}

function loadGame() {
  hasHorns = window.localStorage.getItem('horns') === 'true' || false
  canDoubleJump = window.localStorage.getItem('wings') === 'true' || false

  lastCheckpoint.x = window.localStorage.getItem('checkpoint_x') || start.x
  lastCheckpoint.y = window.localStorage.getItem('checkpoint_y') || start.y
  start = lastCheckpoint
}

function clearGame() {
  localStorage.clear()
}

function initWorld(cb) {
  load(function() {
    totalCoins = Array.from(getEntities(C_COIN)).length

    cb()
  })

  loadGame()
  setInterval(saveGame, 10000) // 10 seconds?

  munster = createMunster(point(0,0))
  resetMunster()

  if (doIntroZoom)
    startIntroZoom()
}

function resetMunster() {
  moveBody(world.body[munster], lastCheckpoint)
}

var munsterGroup = Matter.Body.nextGroup(true)

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
    density: 0.5,
    groupId: munsterGroup
  }
  world.body[e] = Matter.Bodies.circle(
    position.x, position.y, 8, options)

  world.boundingBox[e] = bodyToBB(world.body[e])
  world.boundingBoxHit[e] = false

  world.body[e].entity = e

  Matter.World.add(engine.world, [world.body[e]])

  return e
}

var hasHorns = false

function isMunsterScary() {
  return hasHorns
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
// Checkpoints

function checkpoint(c) {

  var pos
  if (c) {
    if (lastCheckpoint === c) return
    var bb = world.boundingBox[c]
    pos = point(bb.x + bb.width/2, bb.y + bb.height/2)
  }
  else
    pos = world.body[munster].position

  lastCheckpoint = point(pos.x, pos.y)
  //console.info('Checkpoint ' + pos)
}

function createCheckpoint(position, type, properties) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_CHECKPOINT
    | C_BOUNDING_BOX

  world.boundingBox[e] = {
    x: position.x,
    y: position.y,
    width: properties.width,
    height: properties.height}

  return e
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Powerups

function createPowerup(position, type, properties) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_BOUNDING_BOX

  world.position[e] = point(position.x, position.y)

  if (type === 'coin') {
    world.mask[e] |= C_COIN
    world.renderable[e] = renderCoin
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
      width: parseInt(properties.width, 10) || 5,
      height: parseInt(properties.height, 10) || 5}

    world.boundingBoxHit[e] = false
  }

  else if (type === 'wings' || type === 'horns') {

    if (type === 'wings') {
      world.mask[e] |= C_WINGS
      world.renderable[e] = renderWings

      world.text[e] = [
        'BAT WINGS',
        'Fly high']
    }
    else {
      world.mask[e] |= C_HORNS
      world.renderable[e] = renderHorns

      world.text[e] = [
        'DEMON HORNS',
        'Instill fear']
    }

    world.mask[e] |= C_FLOATING | C_TEXT

    world.floating[e] = {
      initialPos: point(position.x, position.y),
      speed: 0.002,
      amplitude: 5
    }

    world.boundingBox[e] = {
      x: position.x,
      y: position.y,
      width: 32,
      height: 32}
  }
  else
    console.error('Unknown powerup type!', type)

  world.boundingBoxHit[e] = false

  return e
}

function updateFloating(dt, now) {
  for (var e of getEntities(C_FLOATING)) {
    var f = world.floating[e]

    world.position[e] = point(f.initialPos.x,
                              f.initialPos.y + Math.sin(now * f.speed) * f.amplitude)

    world.boundingBox[e].y = world.position[e].y
  }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Enemies

function createEnemy(position, type, properties) {
  if (type === 'fly')
    createFly(position, properties)
  else if (type === 'worm')
    createWorm(position, properties)
}

function createFly(position, properties) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_BOUNDING_BOX
    | C_PATROL_SIN
    | C_FLY

  world.renderable[e] = renderFly
  world.sprite[e] = [{x:0, y:0},
                     {x:1, y:0}]

  world.position[e] = point(position.x, position.y)

  var right = parseFloat(properties.right) || 100
  var speed = parseFloat(properties.speed) || 10
  var amplitude = parseFloat(properties.amplitude) || 15
  var frequency = parseFloat(properties.frequency) || 10

  world.patrolPath[e] = {
    start: position,
    end: vec_plus(position, point(right, 0)),
    speed: speed,
    amplitude: amplitude,
    frequency: frequency
  }

  world.boundingBox[e] = {
    x: position.x,
    y: position.y,
    width: 10,
    height: 10,
  }

  return e
}

function createWorm(position, properties) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_BOUNDING_BOX
    | C_PATROL
    | C_WORM

  world.position[e] = point(position.x, position.y)
  world.renderable[e] = renderWorm
  world.sprite[e] = [{x:0, y:0},
                     {x:1, y:0}]
  world.sprite[e].frame = Math.floor(Math.random()%2)
  world.sprite[e].flip = !!parseInt(properties.flip, 10) || false

  if (properties.color === 'green')
    world.sprite[e].sheet = worm_sheet_green
  else
    world.sprite[e].sheet = worm_sheet

  world.boundingBox[e] = {x: position.x,
                          y: position.y,
                          width: 8,
                          height: 5}

  var patrol = {
    start: {
      x: parseInt(properties.patrolStartX, 10) || 0,
      y: parseInt(properties.patrolStartY, 10) || 0,
    },
    end: {
      x: parseInt(properties.patrolEndX, 10) || 20,
      y: parseInt(properties.patrolEndY, 10) || 0,
    },
  }

  world.patrolPath[e] = {
    start: vec_plus(position, patrol.start),
    end: vec_plus(position, patrol.end),
    speed: parseInt(properties.patrolSpeed, 10) || 0.3,
  }

  return e
}

function updatePatrol(dt, now) {
  for (var e of getEntities(C_PATROL)) {
    var path = world.patrolPath[e]
    var p = world.position[e]

    var start = path.reverse ? path.end : path.start
    var end = path.reverse ? path.start : path.end

    var v = vec_unit(vec_minus(end, start))
    v = vec_mult(v, path.speed)

    p.x = clamp(p.x + v.x, start.x, end.x)
    p.y = clamp(p.y + v.y, start.y, end.y)

    if (world.mask[e] & C_BOUNDING_BOX) {
      var b = world.boundingBox[e]
      b.x = p.x + 4
      b.y = p.y + 11
    }

    if (vec_length(vec_minus(p, end)) <= 1)
      path.reverse = !path.reverse
  }

  // Similar to C_PATROL, with vertical modulation
  for (var e of getEntities(C_PATROL_SIN)) {
    var path = world.patrolPath[e]
    var p = world.position[e]

    var start = path.reverse ? path.end : path.start
    var end = path.reverse ? path.start : path.end

    var v = vec_unit(vec_minus(end, start))
    v = vec_mult(v, path.speed)

    p.x = clamp(p.x + v.x, start.x, end.x)

    var progress = vec_length(vec_minus(p, start)) / vec_length(vec_minus(end, start))
    p.y = path.start.y + Math.sin(now*0.01) * path.amplitude

    if (world.mask[e] & C_BOUNDING_BOX) {
      var b = world.boundingBox[e]
      b.x = p.x - 4
      b.y = p.y + 3
    }

    if (progress > 0.99)
      path.reverse = !path.reverse
  }
}

function createMeanPeople(position, type, properties) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE
    | C_PATROL
    | C_MEANPEOPLE
    | C_TEXT

  world.position[e] = point(position.x, position.y)
  world.renderable[e] = renderMeanPeople

  world.sprite[e] = {
    animations: {
      walk:  [{x: 0, y: 0},
              {x: 1, y: 0}],
      flee:  [{x: 2, y: 0},
              {x: 3, y: 0}],
      laugh: [{x: 4, y: 0},
              {x: 5, y: 0}]
    },
    current: 'walk'
  }

  var left = parseInt(properties.left) || 10
  var right = parseInt(properties.right) || 10
  var speed = parseFloat(properties.speed) || 0.3

  world.patrolPath[e] = {
    start: vec_plus(position, point(-left, 0)),
    end: vec_plus(position, point(right, 0)),
    speed: speed,
  }

  world.text[e] = {
    text: 'AAAAHH!', //properties.text || '...',
    enabled: false
  }

  return e
}

var meanPeopleDistance = 60
var meanPeopleSpeed = 0.3
var meanPeopleFleeSpeed = 0.7

var meanMessages = [
  'HAHA!',
  'HA. HA. HA.',
  'You\'re cheese.',
  'You\'re no monster.',
  'That\'s absurd.',
  'Go home, you are a cheese.',
  'You look like like Pac-Man...'
]

var scaredMessages = [
  'HAAAAAAAAA!',
  'You are a monster!',
  'You are the monster!',
  'MONSTERRRR!',
  'RUN!',
  'RUN RUN RUN!',
  '#@?€!',
  'THIS IS A NIGHTMARE',
  'HOLY CAMEMBERT!',
  ':('
]

function pickMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)]
}

function updateMeanPeople(dt, now) {
  var munsterPos = world.body[munster].position

  for (var e of getEntities(C_MEANPEOPLE | C_PATROL | C_TEXT)) {

    var p = world.position[e]
    var d = vec_length(vec_minus(p, munsterPos))

    var sprite = world.sprite[e]
    var text = world.text[e]
    var path = world.patrolPath[e]

    // React to the proximity of the munster
    if (d < meanPeopleDistance) {

      if (!isMunsterScary() && sprite.current != 'laugh') {
        sprite.current = 'laugh'
        path.speed = 0
        text.enabled = true
        text.text = pickMessage(meanMessages)
      }
      else if (isMunsterScary() && sprite.current != 'flee') {
        sprite.current = 'flee'
        path.speed = meanPeopleFleeSpeed
        text.enabled = true
        text.text = pickMessage(scaredMessages)
      }

      // Face or run away from the munster depending on the state
      path.reverse = sprite.current == 'laugh' ?
        munsterPos.x < p.x :
        munsterPos.x > p.x
    }

    // Go back to normal when far from the munster
    else if (d > meanPeopleDistance && sprite.current != 'walk') {
      sprite.current = 'walk'
      path.speed = meanPeopleSpeed
      text.enabled = false
    }

  }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Physics

var engine

function initPhysics() {

  engine = Matter.Engine.create()
  engine.world.gravity.y = 1.4

  // The ground must be touched before jumps
  Matter.Events.on(engine, 'collisionStart', function touchedGround(event) {
    if (jumping === false)
      return

    if(event.pairs.some(function(pair) {
      return pair.bodyA.entity === munster && vec_unit(pair.collision.normal).y < -0.95
    }))
      jumping = doubleJumping = false
  })

  Matter.Events.on(engine, 'collisionStart', function collisionStart(event) {
    var pair = event.pairs[0]

    testPair(
      function (a,b) {return a.tileType === 'death' && b.entity === munster},
      function (a,b) {
        totalDeaths++
        beginSpikeDeathAnim(a.entity)
      },
      pair)
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

function onCollide(type1, type2, handler) {
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
var canDoubleJump = false

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

    if (jumping === false ) {
      applyForce(body, point(0, -jumpVelocity))
      jumping = true
      sfx_play('sfx-jump')
    }

    // Double jump!
    else if (canDoubleJump && jumping === true && doubleJumping === false && body.velocity.y > 0) {
      applyForce(body, point(0, -jumpVelocity))
      doubleJumping = true
      sfx_play('sfx-flap')
    }
  }

  // Clear
  justChanged = {}
}

function deactivateControls(sleep) {
  world.mask[munster] &= ~C_INPUT
  if (sleep)
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

  for (a of sfx_cache['sfx-pickup-powerup'])
    a.volume = 0.3

  for (a of sfx_cache['sfx-hit'])
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

  onCollide(C_MUNSTER, C_COIN, function(m, c) {
    sfx_play('sfx-pickup-coin')
    destroyEntity(c)
    collectedCoins++
  })


  onCollide(C_MUNSTER, C_FLY, function(m, f) {
    // 1. Detect fly collision
    // TODO: 2. ???
    // TODO: 3. PROFIT!

    flash(255, 255, 255, 5)
    sfx_play('sfx-hit')
    deactivateControls(false)

    // Throw in the air
    var dir = vec_unit(vec_minus(world.body[m].position, world.position[f]))
    dir.y = -0.4
    applyForce(world.body[m], dir)

    totalDeaths++

    setTimeout(function() {
      resetMunster()
      activateControls()
    }, 2000)
  })

  onCollide(C_MUNSTER, C_WORM, function(m, w) {
    // Throw in the air
    var dir = vec_unit(vec_minus(world.body[m].position, world.position[w]))
    dir.y += -1
    dir = vec_mult(dir, 0.25)
    applyForce(world.body[m], dir)
  })


  onCollide(C_MUNSTER, C_WINGS, function(m, w) {
    if (!acquireWings)
      startAcquireWings(w)
  })


  onCollide(C_MUNSTER, C_HORNS, function(m, h) {
    if (!acquireHorns)
      startAcquireHorns(h)
  })

  onCollide(C_MUNSTER, C_CHECKPOINT, function(m, c) {
    checkpoint(c)
  })
}

function updatePhysics(dt, now) {
  Matter.Engine.update(engine, dt)
}

var reqId
var lastFrameTime

function startLoop() {
  var now = performance.now()
  lastFrameTime = now
  Matter.Engine.run(engine);
  loop(now)
}

function stopLoop() {
  cancelAnimationFrame(reqId)
}

function loop(now) {
  var dt = now - lastFrameTime
  lastFrameTime = now

  controls();
  updatePatrol(dt, now)
  updateMeanPeople(dt, now)
  updateTransitions(dt, now)
  updateFloating(dt, now)
  //updatePhysics(dt, now)
  checkCollisions()
  resolveCollisions()

  render()

  reqId = requestAnimationFrame(loop)
}
