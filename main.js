//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Engine

var C_NONE         = 0,
    C_POSITION     = 1 << 0,
    C_BOUNDING_BOX = 1 << 1,
    C_RENDERABLE   = 1 << 2

var world = {
  mask: [],
  position: [],
  boundingBox: [],
  boundingBoxHit: [],
  renderable: [],               // Function to render the entity
  sprite: [],                   // {x,y} coordinates into the spritesheet
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

  world.position[e] = point(position.x, position.y)
  world.renderable[e] = renderMunster
  world.sprite[e] = {x: 0, y: 19}

}

function createTile(position, sprite) {
  var e = createEntity()

  world.mask[e] =
    C_POSITION
    | C_RENDERABLE

  world.position[e] = point(position.x, position.y)
  world.renderable[e] = renderTile
  world.sprite[e] = {x: sprite.x, y: sprite.y}
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Entry point

document.addEventListener('DOMContentLoaded', init)

function init() {
  initCanvas()
  initWorld(loop)
}

function loop() {
  render()

  requestAnimationFrame(loop)
}
