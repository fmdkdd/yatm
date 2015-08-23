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

  deactivateControls()
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
  deactivateControls()
}
