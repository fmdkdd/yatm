function loadTiles(cb) {
  var req = new XMLHttpRequest();
  req.onload = function getMapRequest() {
    var tmxData = JSON.parse(this.responseText)
    buildTiles(tmxData)
    cb()
  }
  req.open('get', 'assets/map.json', true);
  req.send();
}

function buildTiles(tmxData) {
  var tiles = parseMap(tmxData)

  for (var t of tiles) {
    createTile(point(t.x * TILE_SIZE, t.y * TILE_SIZE),
               {x: t.tx, y: t.ty})
  }
}

function parseMap(tmxData) {
  // One layer, one tileset
  var layer = tmxData.layers[0];
  var tileset = tmxData.tilesets[0];

  var tilesetWidth = tileset.imagewidth / tileset.tilewidth;
  var tilesetHeight = tileset.imageheight / tileset.tileheight;

  var tiles = []

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
      ty: Math.floor(tileId / tilesetHeight)
    })
  });

  return tiles
}
