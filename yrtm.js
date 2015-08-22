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


function initWorld() {
  // TODO: load tiles
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
// Rendering

var canvas
var ctx
var spritesheet

function initCanvas() {
  canvas = document.getElementById('canvas')
  ctx = canvas.getContext('2d')

  canvas.width = 320
  canvas.height = 200

  spritesheet = document.getElementById('spritesheet')
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.translate(camera.x, camera.y)

  for (var e = 0, n = world.mask.length; e < n; ++e) {
    if (world.mask[e] & C_RENDERABLE) {
      var r = world.renderable[e]
      r(e, ctx)
    }
  }

  ctx.restore()
}

var camera = {x: 0, y: 0}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Individual rendering functions

var TILE_SIZE = 16
var defaultSprite = {x: 0, y : 0}

function renderTile(e, ctx) {
  if (!(world.mask[e] & C_POSITION))
    console.error('Trying to render tile without a position')

  var p = world.position[e]
  var s = world.sprite[e] || defaultSprite

  ctx.save()
  ctx.translate(p.x, p.y)

  ctx.drawImage(spritesheet,
                s.x * TILE_SIZE, s.y * TILE_SIZE,
                TILE_SIZE, TILE_SIZE,
                p.x, p.y,
                TILE_SIZE, TILE_SIZE)

  ctx.restore()
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Entry point

document.addEventListener('DOMContentLoaded', init)

function init() {
  initCanvas()
  initWorld()

  loop()
}

function loop() {
  render()

  requestAnimationFrame(loop)
}
