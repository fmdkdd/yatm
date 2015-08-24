var spikeDeathAnim = false
var spikeDeathEntity
var spikeDeathFrame = 0
var spikeDeathFrameStep = 0.1
var spikeDeathFrameTotal = 0

function beginSpikeDeathAnim(spike) {
  spikeDeathFrame = 0
  spikeDeathFrameTotal = 0
  spikeDeathAnim = true
  spikeDeathEntity = spike

  world.renderable[spike] = renderSpikeDeathAnim
  world.renderable[munster] = renderNothing

  deactivateControls(true)
}

function renderSpikeDeathAnim(e, ctx) {
  var p = world.position[e]
  var s = [{x:0, y:0},
           {x:1, y:0},
           {x:2, y:0},
           {x:3, y:0},
           {x:4, y:0}]

  s = s[Math.floor(spikeDeathFrame % s.length)]

  if (spikeDeathFrame < 4)
    spikeDeathFrame += spikeDeathFrameStep

  spikeDeathFrameTotal++
  if (spikeDeathFrameTotal > 100) {
    spikeDeathAnim = false
    world.renderable[munster] = renderMunster
    world.renderable[e] = renderTile
    resetMunster()
    activateControls()
  }

  ctx.save()
  ctx.translate(p.x, p.y - 16)

  ctx.drawImage(spike_death,
                s.x * TILE_SIZE, s.y * TILE_SIZE,
                TILE_SIZE, 2*TILE_SIZE,
                0, 0,
                TILE_SIZE, 2*TILE_SIZE)

  ctx.restore()
}

var doIntroZoom = false
var introZoom = false

function startIntroZoom() {
  camera.zoom = 400
  camera_focus({
    x: world.position[munster].x + TS/2,
    y: world.position[munster].y + TS/2,
  })
  camera_transition({zoom: 3}, 7000)
  introZoom = true
  deactivateControls(true)
}

var acquireWings = false
var climaxDuration = 1500 // heh!

function startAcquireWings(w) {
  acquireWings = true
  deactivateControls(true)
  checkpoint()
  canDoubleJump = true
  flash(255, 255, 255, 100)
  bgm.pause()
  world.mask[w] &= ~C_FLOATING
  sfx_play('sfx-pickup-powerup')

  setTimeout(function() {
    destroyEntity(w)
    activateControls()
    bgm.play()
  }, climaxDuration)
}

var acquireHorns = false
function startAcquireHorns(h) {
  acquireHorns = true
  deactivateControls(true)
  checkpoint()
  hasHorns = true
  flash(255, 255, 255, 100)
  bgm.pause()
  world.mask[h] &= ~C_FLOATING // ??
  sfx_play('sfx-pickup-powerup')

  setTimeout(function() {
    destroyEntity(h)
    activateControls()
    bgm.play()
  }, climaxDuration)
}

var collectedCoins = 0
var totalCoins = 0
var totalDeaths = 0

function doVictoryScreen() {
  var length = 7000
  camera_transition({zoom: 400}, length)
  setTimeout(function() {
    stopLoop()

    ctx.save()

    ctx.font = '45px Pixels'

    // var b = {x: 45, width: 550,
    //          y: 40, height: 270}

    // ctx.beginPath()
    // ctx.moveTo(b.x, b.y)
    // ctx.lineTo(b.x, b.y + b.height)
    // ctx.lineTo(b.x + b.width, b.y + b.height)
    // ctx.lineTo(b.x + b.width, b.y)
    // ctx.closePath()

    // ctx.fillStyle = '#dbd785'
    // ctx.fill()

    // ctx.strokeStyle = '#4f2f09'
    // ctx.lineWidth = 1
    // ctx.stroke()

    ctx.fillStyle = '#4f2f09'
    ctx.fillText('Congratulations!', 60, 100)
    ctx.fillText('You Are The Monster!', 60, 160)
    ctx.fillText(collectedCoins + '/' + totalCoins, 132, 256)
    ctx.fillText('Deaths:' + totalDeaths, 320, 256)

    ctx.drawImage(bling_sheet,
                  0, 0, TS, TS,
                  60, 213, TS*4, TS*4)

    ctx.restore()
  }, length)
}
