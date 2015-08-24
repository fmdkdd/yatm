var DEBUG = false

var canvas
var ctx
var spritesheet
var tilesheet
var munster_sheet
var horns_sheet
var horns_powerup
var meanpeople_sheet
var titleImage
var bling_sheet
var spike_death
var worm_sheet
var fly_sheet

function initCanvas() {
  canvas = document.getElementById('canvas')
  canvas.width = 640
  canvas.height = 400

  ctx = canvas.getContext('2d')

  // Pixel goodness
  ctx.imageSmoothingEnabled
    = ctx.webkitImageSmoothingEnabled
    = ctx.mozImageSmoothingEnabled
    = ctx.msImageSmoothingEnabled
    = false

  spritesheet = document.getElementById('spritesheet')
  tilesheet = document.getElementById('tilesheet')
  munster_sheet = document.getElementById('munster-sheet')
  horns_sheet = document.getElementById('horns-sheet')
  horns_powerup = document.getElementById('horns-powerup')
  meanpeople_sheet = document.getElementById('meanpeople-sheet')
  titleImage = document.getElementById('title')
  bling_sheet = document.getElementById('bling-sheet')
  spike_death = document.getElementById('spike-death')
  worm_sheet = document.getElementById('worm-sheet')
  fly_sheet = document.getElementById('fly-sheet')

  createBackground('hills-bg', 5000, 10, 3, 3)
  createBackground('hills2-bg', 2000, 220, 2, 2)
}

var backgrounds = []

function createBackground(id, parallax, y, sx, sy) {
  var img = document.querySelector('#' + id)
  backgrounds.push({
    img,
    parallax,
    y,
    sx, sy // scaling
  })
}

function renderBackgrounds() {

  ctx.fillStyle = '#dddddd'
  ctx.fillRect(0, 0, canvas.width, 150)

  ctx.fillStyle = '#dbd785'
  ctx.fillRect(0, 150, canvas.width, 340)

  ctx.fillStyle = '#c6b555'
  ctx.fillRect(0, 340, canvas.width, canvas.height)

  backgrounds.forEach(function(bg) {
    for (var i = 0; i < 7; ++i) {
      var r = (camera.x % bg.parallax) / bg.parallax
      var w = bg.img.width * bg.sx
      var h = bg.img.height * bg.sy
      ctx.drawImage(bg.img, (i + r) * w, bg.y, w, h)
    }
  })
}

var frame = 0

var currentFlash = null

function flash(r, g, b, frames) {
  if (currentFlash)
    return

  currentFlash = {
    color: [r,g,b],
    colorText: 'rgba(' + r + ',' + g + ',' + b + ',',
    frames,
    current: 0
  }
}

function render() {

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  renderBackgrounds()

  var p = world.body[munster].position

  // INTRO ZOOM EFFECT ONLY ONCE
  if (introZoom) {
    camera_focus({x: p.x + TS/2, y: p.y + TS/2})
    if (camera.zoom === 3) {
      introZoom = false
      activateControls()
    }
  }

  else
    camera_transition(
      {x: canvas.width / 2 / camera.zoom - (p.x + 8),
       y: canvas.height / 2 / camera.zoom - (p.y + 8)}, 50)

  var screen = {
    x: -camera.x, y: -camera.y,
    width: canvas.width / camera.zoom,
    height: canvas.height / camera.zoom}

  ctx.save()
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(camera.x, camera.y)

  for (var e of getEntities(C_RENDERABLE)) {
    if (e === munster) continue // Draw munster on top of every renderable

    var r = world.renderable[e]
    p = world.position[e]
    if (do_boxes_collide(screen, {
      x: p.x, y: p.y, width: TS2, height: TS2})) {
      r(e, ctx)
    }
  }

  world.renderable[munster](munster, ctx)

  ctx.restore()

  if (introZoom)
    ctx.drawImage(titleImage, 5, 60, 63 * 10, 24 * 10)

  if (DEBUG) {
    ctx.save()

    ctx.scale(camera.zoom, camera.zoom)
    ctx.translate(camera.x, camera.y)

    drawBoundingBox(ctx)

    ctx.strokeStyle = '#11c'
    ctx.strokeRect(screen.x, screen.y, screen.width, screen.height)

    ctx.restore()
  }

  // FLASH
  if (currentFlash) {
    ++currentFlash.current

    var alpha = 1 - (currentFlash.current / currentFlash.frames)
    ctx.fillStyle = currentFlash.colorText + alpha + ')'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (currentFlash.frames <= currentFlash.current)
      currentFlash = null
  }

  frame++
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
  camera.x = canvas.width/ 2 / camera.zoom - position.x
  camera.y = canvas.height/ 2 / camera.zoom - position.y
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Individual rendering functions

var TILE_SIZE = TS = 16
var TILE_SIZE_TWO = TS2 = TS*2
var TILE_SIZE_HALF = TSH = TS/2
var defaultSprite = {x: 0, y : 0}

function renderTile(e, ctx) {
  if (!testEntity(e, C_POSITION))
    console.error('Trying to render tile without a position')

  var p = world.position[e]
  var s = world.sprite[e] || defaultSprite

  ctx.save()
  ctx.translate(p.x, p.y)

  ctx.drawImage(tilesheet,
                s.x * TS, s.y * TS, TS, TS,
                0, 0, TS, TS)
  ctx.restore()

  if (DEBUG && world.mask[e] & C_PHYSICS) {
    ctx.save()
    p = world.body[e].position
    ctx.translate(p.x, p.y)
    var bounds = world.body[e].parts[0].bounds
    var w = bounds.max.x - bounds.min.x
    var h = bounds.max.y - bounds.min.y
    ctx.strokeStyle = '#ff0000'
    ctx.strokeRect(TS/2 - w/2, TS/2 - h/2, w, h)
    ctx.restore()
  }
}

var munsterRotation = 0
var munsterRotationStep = 0.2

function renderMunster(e, ctx) {
  if (!(world.mask[e] & C_POSITION))
    console.error('Trying to render münster without a position')

  var body = world.body[e]
  var p = body.position
  var s = world.sprite[e] || defaultSprite

  if (Array.isArray(s)) {
    var r = s.length / (2 * Math.PI)
    var i = mod(Math.floor(munsterRotation * r), s.length)
    s = s[i]
  }

  ctx.save()
  ctx.translate(p.x, p.y)

  ctx.drawImage(munster_sheet,
                s.x * TILE_SIZE, s.y * TILE_SIZE,
                TILE_SIZE, TILE_SIZE,
                0, 0,
                TILE_SIZE, TILE_SIZE)

  if (hasHorns) {
    ctx.drawImage(horns_sheet,
                  s.x * TS2, s.y * TS2,
                  TS2, TS2,
                  -TSH, -TSH,
                  TS2, TS2)
  }

  if (DEBUG) {
    var bounds = world.body[e].parts[0].bounds
    ctx.strokeStyle = '#ff0000'
    ctx.strokeRect(0, 0, bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y)

    ctx.strokeStyle = '#0000ff'
    ctx.beginPath()
    ctx.moveTo((bounds.max.x - bounds.min.x) / 2, (bounds.max.y - bounds.min.y) / 2)
    ctx.lineTo(body.velocity.x * 20, body.velocity.y * 20);
    ctx.stroke()

    var part = body.parts[0]
    var axis = part.axes[0];
    ctx.strokeStyle = '#00ff00'
    ctx.beginPath()
    ctx.moveTo((bounds.max.x - bounds.min.x) / 2, (bounds.max.y - bounds.min.y) / 2)
    ctx.lineTo(axis.x * 20, axis.y * 20)
    ctx.stroke()
  }

  ctx.restore()

}

function renderFly(e, ctx) {
  var p = world.position[e]
  var s = world.sprite[e] || defaultSprite

  s = s[Math.floor(frame/3 % s.length)]

  ctx.save()
  ctx.translate(p.x, p.y)

  if (!world.patrolPath[e].reverse)
    ctx.scale(-1, 1)

  ctx.drawImage(fly_sheet,
                s.x * TILE_SIZE, s.y * TILE_SIZE,
                TILE_SIZE, TILE_SIZE,
                -8, 0,
                TILE_SIZE, TILE_SIZE)

  ctx.restore()

}

function renderCoin(e, ctx) {
  var p = world.position[e]
  var s = world.sprite[e] || defaultSprite

  if (Array.isArray(s)) {
    s = s[Math.floor(frame/5 % s.length)]
  }

  ctx.save()
  ctx.translate(p.x, p.y)

  ctx.drawImage(bling_sheet,
                s.x * TILE_SIZE, s.y * TILE_SIZE,
                TILE_SIZE, TILE_SIZE,
                0, 0,
                TILE_SIZE, TILE_SIZE)

  ctx.restore()
}

function renderWorm(e, ctx) {
  var p = world.position[e]
  var s = world.sprite[e] || defaultSprite

  var mirror = 1
  if (s.flip) mirror *= -1
  if (world.patrolPath[e].reverse) mirror *= -1

  if (Array.isArray(s)) {
    var i = Math.floor(s.frame++/30 % s.length)
    s = s[i]
    world.patrolPath[e].speed = (i)/10
  }

  ctx.save()
  ctx.translate(p.x, p.y)
  if (mirror === -1) {
    ctx.scale(-1,1)
    ctx.translate(-TS,0)
  }

  ctx.drawImage(worm_sheet,
                s.x * TILE_SIZE, s.y * TILE_SIZE,
                TILE_SIZE, TILE_SIZE,
                0, 0,
                TILE_SIZE, TILE_SIZE)

  ctx.restore()
}

var bubbleMargin = 2
var bubbleTip = 2

function renderMeanPeople(e, ctx) {
  var p = world.position[e]
  var s = world.sprite[e]
  var path = world.patrolPath[e]
  var text = world.text[e]

  var anim = s.animations[s.current]
  var speed = s.current == 'flee' ? 5: 20
  s = anim[Math.floor(frame/speed % anim.length)]

  ctx.save()
  ctx.translate(p.x, p.y)

  if (text.enabled) {
    ctx.font = '5px Pixels'
    var metrics = ctx.measureText(text.text)

    // compute bubble size
    var w = metrics.width + (bubbleMargin * 2)
    var h = 5 * 1.1 + (bubbleMargin * 2)

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -h - bubbleTip)
    ctx.lineTo(w, -h - bubbleTip)
    ctx.lineTo(w, -bubbleTip)
    ctx.lineTo(bubbleTip, -bubbleTip)
    ctx.closePath()

    ctx.fillStyle = '#ffffff'
    ctx.fill()

    ctx.strokeStyle = '#a58935'
    ctx.lineWidth = 0.3
    ctx.stroke()

    ctx.fillStyle = '#4f2f09'
    ctx.fillText(text.text, bubbleMargin, -bubbleTip - h/4)
  }

  if (!path.reverse)
    ctx.scale(-1, 1)

  ctx.drawImage(meanpeople_sheet,
                s.x * TILE_SIZE, s.y * TILE_SIZE_TWO,
                TILE_SIZE, TILE_SIZE_TWO,
                -8, 0, // X-axis centered to avoid shifts when flipping
                TILE_SIZE, TILE_SIZE_TWO)

  ctx.restore()
}

function renderWings(e, ctx) {
  var p = world.position[e]
  var s = {x:0, y:2}

  ctx.save()
  ctx.translate(p.x, p.y)

  ctx.drawImage(tilesheet,
                s.x * TILE_SIZE, s.y * TILE_SIZE,
                TILE_SIZE * 2, TILE_SIZE,
                0, 0,
                TILE_SIZE * 2, TILE_SIZE)

  ctx.restore()
}

function renderPowerup(e, ctx) {
  var p = world.position[e]

  ctx.save()
  ctx.translate(p.x, p.y)

  // Gradient
  var r = 80
  var powerUpGradient = ctx.createRadialGradient(TS, TS, 0, TS, TS, TS2)
  powerUpGradient.addColorStop(0, 'rgba(255,255,255,0.9)')
  powerUpGradient.addColorStop(0.5, 'rgba(255,255,255,0.6)')
  powerUpGradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.beginPath();
  ctx.arc(r/2, r/2, r, 0, 2 * Math.PI);
  ctx.fillStyle = powerUpGradient;
  ctx.fill();

  // Picture
  ctx.drawImage(horns_powerup, 0, 0, 32, 32)

  // Text
  var t = world.text[e]
  if (t) {
    var main = t[0]
    var sub = t[1]

    ctx.fillStyle = '#4f2f09'

    ctx.font = '7px Pixels'
    var metrics = ctx.measureText(main)
    ctx.fillText(main, -metrics.width/4, -10)

    ctx.font = '5px Pixels'
    ctx.fillText(sub, metrics.width/3, -2)
  }

  ctx.restore()
}

function renderNothing() {}

function drawBoundingBox(ctx) {
  for (var e of getEntities(C_BOUNDING_BOX)) {
    var b = world.boundingBox[e]
    var h = world.boundingBoxHit[e]

    ctx.strokeStyle = h ? '#1c1' : '#c11'
    ctx.strokeRect(b.x, b.y, b.width, b.height)
  }
}
