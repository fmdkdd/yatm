//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Engine

var C_NONE         = 0,
    C_POSITION     = 1 << 0,
    C_BOUNDING_BOX = 1 << 1,
    C_RENDERABLE   = 1 << 2,
    C_PHYSICS      = 1 << 3

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
    | C_PHYSICS

  world.position[e] = point(position.x, position.y)
  world.renderable[e] = renderMunster
  world.sprite[e] = {x: 0, y: 19}

  world.body[e] = Matter.Bodies.circle(position.x, position.y, 8)
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

var Renderer = {
  create: function() {
    return {controller: Renderer}
  },
  world: function(engine) {
    bodies = Matter.Composite.allBodies(engine.world)
    bodies.forEach(function(body) {
      ctx.strokeStyle = '#ff0000'
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0,
                   0,
                   TILE_SIZE,
                   TILE_SIZE)
    })
  }
}

var engine

function initPhysics() {
  engine = Matter.Engine.create()
  engine.world.gravity.y = 1
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Entry point

document.addEventListener('DOMContentLoaded', init)

function init() {
  initCanvas()
  initPhysics();
  initWorld(loop)
}

var lastUpdate = Date.now()

function update() {
  var now = Date.now()

  Matter.Engine.update(engine, now - lastUpdate)

  lastUpdate = now;
}

function loop() {
  updateTransitions()
  update()

  render()

  requestAnimationFrame(loop)
}
