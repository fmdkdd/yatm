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
  var tiles = parseTileLayer(tmxData, 'decor2', false)
  tiles = tiles.concat(parseTileLayer(tmxData, 'decor', false))
  tiles = tiles.concat(parseTileLayer(tmxData, 'main', true))

  for (var t of tiles) {
    createTile(point(t.x * TILE_SIZE, t.y * TILE_SIZE),
               {x: t.tx, y: t.ty},
               t.tangible,
               t.properties)
  }

  // Objects
  var objects = parseObjectLayer(tmxData, 'coins')
  objects = objects.concat(parseObjectLayer(tmxData, 'enemies'))
  objects = objects.concat(parseObjectLayer(tmxData, 'people'))
  objects = objects.concat(parseObjectLayer(tmxData, 'powerup'))

  for (var o of objects) {
    var factory

    if (o.type === 'fly' || o.type === 'worm')
      factory = createEnemy
    else if (o.type === 'coin' || o.type === 'wings')
      factory = createPowerup
    else if (o.type === 'people')
      factory = createMeanPeople
    else {
      console.log('Unknown object type: ' + o.type)
      continue
    }

    factory(point(o.x, o.y), o.type, o.properties)
  }
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

function parseObjectLayer(tmxData, name) {

  var objects = []
  var layer = tmxData.layers.filter(function(l) { return l.name == name })[0]

  layer.objects.forEach(function(object) {

    objects.push({
      // World coordinates
      x: object.x,
      y: object.y,

      // Enemy, coin, powerup....
      type: object.type,

      properties: object.properties || {}
    })
  });

  return objects
}
