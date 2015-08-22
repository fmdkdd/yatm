
document.addEventListener('DOMContentLoaded', function() {
  var req = new XMLHttpRequest();
  req.onload = parseMap;
  req.open('get', 'map.json', true);
  req.send();
});

function parseMap() {
  data = JSON.parse(this.responseText);

  // One layer, one tileset
  var layer = data.layers[0];
  var tileset = data.tilesets[0];

  var tilesetWidth = tileset.imagewidth / tileset.tilewidth;
  var tilesetHeight = tileset.imageheight / tileset.tileheight;

  return layer.data.map(function(tileId, index) {

    tileId -= tileset.firstgid;

    return {
      // World coordinates
      x: index % layer.width,
      y: Math.floor(index / layer.height),

      // Tile coordinates on the spritesheet
      tx: tileId % tilesetWidth,
      ty: Math.floor(tileId / tilesetHeight)
    }
  });
}
