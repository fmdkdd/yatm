var DEBUG = false

var canvas
var ctx
var spritesheet
var tilesheet
var munster_sheet

function initCanvas() {
  canvas = document.getElementById('canvas')
  canvas.width = 640
  canvas.height = 400

  ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false // pixel goodness

  spritesheet = document.getElementById('spritesheet')
  tilesheet = document.getElementById('tilesheet')
  munster_sheet = document.getElementById('munster-sheet')
}

function render() {
  var p = world.body[munster].position
  camera_transition(
    {x: canvas.width / Math.pow(camera.zoom, 2) - p.x,
     y: canvas.height / Math.pow(camera.zoom,2) - p.y}, 50)

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(camera.x, camera.y)

  for (var e of getEntities(C_RENDERABLE)) {
    var r = world.renderable[e]
    r(e, ctx)
  }

  ctx.restore()
}

var camera = {x: 0, y: 0, zoom: 3}

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

function camera_focus(position) {
  camera.x = canvas.width / Math.pow(camera.zoom,2) - position.x
  camera.y = canvas.height / Math.pow(camera.zoom,2) - position.y
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

  var a = body.angle

  if (Array.isArray(s)) {
    var i = mod(Math.floor(a / (Math.PI / s.length)), s.length)
    s = s[i]
  }

  ctx.save()
  ctx.translate(p.x, p.y)

  ctx.drawImage(munster_sheet,
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
