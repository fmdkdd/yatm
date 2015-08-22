var DEBUG = false

var canvas
var ctx
var spritesheet

function initCanvas() {
  canvas = document.getElementById('canvas')
  canvas.width = 320
  canvas.height = 200

  ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false // pixel goodness

  spritesheet = document.getElementById('spritesheet')
  tilesheet = document.getElementById('tilesheet')
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(camera.x, camera.y)

  for (var e = 0, n = world.mask.length; e < n; ++e) {
    if (world.mask[e] & C_RENDERABLE) {
      var r = world.renderable[e]
      r(e, ctx)
    }
  }

  ctx.restore()
}

var camera = {x: 0, y: 0, zoom: 1}

function camera_transition(to, length, bezier) {
  if (length == null) length = 500

  bezier = bezier || cubicBezier(
    point(0.25, 0.1),
    point(0.25, 0.1)
  )

  var from = {x: camera.x, y: camera.y, zoom: camera.zoom}

  activeTransitions.push(
    transition.new(camera, from, to, length, bezier))
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Individual rendering functions

var TILE_SIZE = 16
var defaultSprite = {x: 0, y : 0}

function renderTile(e, ctx) {
  if (!(world.mask[e] & C_POSITION))
    console.error('Trying to render tile without a position')

  var p = world.body[e].position
  var s = world.sprite[e] || defaultSprite

  ctx.save()
  ctx.translate(p.x, p.y)

  ctx.drawImage(tilesheet,
                s.x * TILE_SIZE, s.y * TILE_SIZE,
                TILE_SIZE, TILE_SIZE,
                0, 0,
                TILE_SIZE, TILE_SIZE)

  if (DEBUG) {
    var bounds = world.body[e].parts[0].bounds
    ctx.strokeStyle = '#ff0000'
    ctx.strokeRect(0, 0, bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y)
  }

  ctx.restore()
}

function renderMunster(e, ctx) {
  if (!(world.mask[e] & C_POSITION))
    console.error('Trying to render münster without a position')

  var body = world.body[e]
  var p = body.position
  var s = world.sprite[e] || defaultSprite

  ctx.save()
  ctx.translate(p.x, p.y)

  ctx.drawImage(spritesheet,
                s.x * TILE_SIZE, s.y * TILE_SIZE,
                TILE_SIZE, TILE_SIZE,
                0, 0,
                TILE_SIZE, TILE_SIZE)

  if (DEBUG) {
    var bounds = world.body[e].parts[0].bounds
    ctx.strokeStyle = '#ff0000'
    ctx.strokeRect(0, 0, bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y)

    ctx.strokeStyle = '#0000ff'
    ctx.beginPath()
    ctx.moveTo((bounds.max.x - bounds.min.x) / 2, (bounds.max.y - bounds.min.y) / 2)
    ctx.lineTo(body.velocity.x * 20, body.velocity.y * 20);
    ctx.stroke()
  }

  ctx.restore()

}
