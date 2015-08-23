function load(cb) {
  var req = new XMLHttpRequest();
  req.onload = function getMapRequest() {
    var tmxData = JSON.parse(this.responseText)
    build(tmxData)
    cb()
  }
  req.open('get', 'assets/world.json', true);
  req.send();
}

function build(tmxData) {

  // Tiles
  var tiles = parseTileLayer(tmxData, 'main', true)
  tiles = tiles.concat(parseTileLayer(tmxData, 'decor', false))

  for (var t of tiles) {
    createTile(point(t.x * TILE_SIZE, t.y * TILE_SIZE),
               {x: t.tx, y: t.ty},
               t.tangible,
               t.properties)
  }

  // Enemies
  var enemies = parseEnemyLayer(tmxData)

  for (var e of enemies)
    createEnemy(point(e.x, e.y), e.type, e.properties)
}

function parseTileLayer(tmxData, name, tangible) {

  var tileset = tmxData.tilesets[0]
  var tilesetWidth = tileset.imagewidth / tileset.tilewidth
  var tilesetHeight = tileset.imageheight / tileset.tileheight

  var tiles = []
  var layer = tmxData.layers.filter(function(l) { return l.name === name })[0]

  layer.data.forEach(function(tileId, index) {
    // Skip empty tiles
    if (tileId === 0)
      return

    tileId -= tileset.firstgid;

    tiles.push({
      // World coordinates
      x: index % layer.width,
      y: Math.floor(index / layer.height),

      // Tile coordinates on the spritesheet
      tx: tileId % tilesetWidth,
      ty: Math.floor(tileId / tilesetHeight),

      properties: tileset.tileproperties[tileId] || {},

      // Only tiles in the main layer have bodies
      tangible: tangible
    })
  });

  return tiles
}

function parseEnemyLayer(tmxData) {

  var enemies = []
  var layer = tmxData.layers.filter(function(l) { return l.name == 'enemies' })[0]

  layer.objects.forEach(function(object) {

    var props = object.properties || {}
    if (props.duration === undefined) props.duration = 10000
    if (props.span === undefined) props.span = 100
    if (props.amplitude === undefined) props.amplitude = 10

    enemies.push({
      // World coordinates
      x: object.x,
      y: object.y,

      type: object.type,

      properties: props
    })
  });

  return enemies
}
