/** Utilities for testing collisions between axis-aligned bounding boxes. */

/**
 * Return a point of coordinates (X,Y).
 */
'use strict';

function point(x, y) {
  return { x: x, y: y };
}

/**
 * Create a box with from the coordinates of its TOP_LEFT corner, its
 * WIDTH and its HEIGHT.
 */
function box(top_left, width, height) {
  return { x: top_left.x, y: top_left.y, width: width, height: height };
}

/**
 * Return the center point of BOX.
 */
function box_center(box) {
  return point(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * Return all the corners of BOX as an array of points.
 */
function box_corners(box) {
  return [point(box.x, box.y), point(box.x + box.width, box.y), point(box.x + box.width, box.y + box.height), point(box.x, box.y + box.height)];
}

/**
 * Return true if and only if POINT lies inside BOX.
 */
function is_point_inside_box(point, box) {
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

/**
 * Return true if and only if BOX1 and BOX2 have some overlap.
 */
function do_boxes_collide(box1, box2) {
  // Consequence of the Separation Axis Theorem (SAT): if the two boxes overlap,
  // their projections on the two axes overlap as well.  Conversely, if there is
  // a gap in one axis, then the boxes do not overlap.
  return box1.x <= box2.x + box2.width && box1.x + box1.width >= box2.x && box1.y <= box2.y + box2.height && box1.y + box1.height >= box2.y;
}

/**
 * Return true if convex polygons POLY1 and POLY2 overlap.  Both arguments are
 * arrays of vertices describing the polygons.  The array of vertices is open
 * (i.e., there are as many points in the array as there are sides to the
 * polygon).
 */
function do_polygons_collide(poly1, poly2) {
  // Use the SAT theorem for determining if the two convex polygons collide.
  return no_separation_axis(poly1, poly2) && no_separation_axis(poly2, poly1);
}

/**
 * Return true if there is no separation axis between POLY1 and POLY2, checking
 * only for the axes of POLY1.
 *
 * Used by do_polygons_collide.
 */
function no_separation_axis(poly1, poly2) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = get_axes(poly1)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var axis = _step.value;

      var p1 = project(poly1, axis);
      var p2 = project(poly2, axis);
      if (!overlap(p1, p2)) return false;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return true;
}

/**
 * Return the list of axes of POLY used to find a separation axis by
 * no_separation_axis.  The list is returned as an array of vectors.
 */
function get_axes(poly) {
  // For each edge of the polygon, return its normal.

  var axes = [];
  for (var i = 0; i < poly.length; ++i) {
    var p0 = poly[i];
    var p1 = poly[(i + 1) % poly.length];
    var edge = vec_minus(p0, p1);
    var normal = vec_unit(vec_perp(edge));
    // We return the normalized axis, though it is only necessary if we wish to
    // find the minimum translation between the polygons.
    axes.push(normal);
  }

  return axes;
}

/**
 * Return the interval obtained by projecting POLY onto AXIS.
 * The interval is an object {min, max}.
 */
function project(poly, axis) {
  // To project the polygon onto the axis, dot product each vertex with the
  // axis, and keep the min and max values.

  var min = +Infinity;
  var max = -Infinity;

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = poly[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var vert = _step2.value;

      var p = vec_dot(axis, vert);
      if (p < min) min = p;
      if (p > max) max = p;
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
        _iterator2['return']();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return { min: min, max: max };
}

/**
 * Return true if projections PROJ1 and PROJ2 overlap.
 */
function overlap(proj1, proj2) {
  // Compare bounds of interval.  Single axis version of do_boxes_collide.
  return proj1.min <= proj2.max && proj1.max >= proj2.min;
}

function vec_length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function vec_unit(v) {
  var l = vec_length(v);
  return point(v.x / l, v.y / l);
}

function vec_perp(v) {
  return point(-v.y, v.x);
}

function vec_plus(u, v) {
  return point(u.x + v.x, u.y + v.y);
}

function vec_minus(u, v) {
  return point(u.x - v.x, u.y - v.y);
}

function vec_mult(v, s) {
  return point(v.x * s, v.y * s);
}

function vec_dot(u, v) {
  return u.x * v.x + u.y * v.y;
}

function vec_rotate(v, a) {
  var cos = Math.cos(a);
  var sin = Math.sin(a);
  return point(v.x * cos - v.y * sin, v.x * sin + v.y * cos);
}

function mod(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var x = _x,
        n = _x2;
    _again = false;

    if (isNaN(x)) return x;else if (x >= 0) return x % n;else {
      _x = x + n;
      _x2 = n;
      _again = true;
      continue _function;
    }
  }
}

function clamp(x, m, n) {
  var a, b;
  if (m < n) {
    a = m;b = n;
  } else {
    a = n;b = m;
  }
  if (x < a) return a;else if (x > b) return b;else return x;
}

/**
 * Rotate POLY along ANGLE, then translate it along VEC, and return the result
 * as a new polygon.
 *
 * Useful for projecting hitboxes of rotating, moving objects which store their
 * hitboxes as relative coordinates.
 */
function adjust_hitbox(poly, vec, angle) {
  var p = [];
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = poly[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var v = _step3.value;

      p.push(vec_plus(vec_rotate(v, angle), vec));
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3['return']) {
        _iterator3['return']();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return p;
}

/**

 * Spatial hashing.

 We divide the game area in a grid of cells.  Each object is inserted in all the
 cells intersecting with its axis-aligned bounding box.

 A cell is a couple of coordinates {x, y}.  All cells have the same size.

 Spatial hashing helps avoiding the exponential complexity of checking all
 objects against each other for collisions.  Instead, objects are checked for
 collisions only if they reside in the same spatial hash cell.  This is called a
 /broad phase collision detection/.

 Choosing the cell size is a compromise: small cells will allocate more memory,
 but lookups in each cell will be faster.  However, a global lookup of
 collisions through all the cells will not benefit much if objects are
 duplicated in many cells.  Large cells may contain too many objects, and thus
 we may lose the benefit of spatial hashing.

 Ideally objects should appear in the fewest cells possible.  This implies that
 cells should be larger than the average object, but not too much.  Assuming the
 objects do not deviate wildly from the average, between 1 and 2 times the
 average object size is a good value for the cell size.

 Positions of objects in the hash are not tracked: clients of the hash should
 remove and reinsert objects that move.

 Objects that do not move, but can collide, need to be inserted in the hash only
 once.

 Spatial hashing is best for game areas without wild variations of object
 density.  Alternatives that might be better suited to these variations:
 quad-trees or r-trees.

 */

var emptySet = new Set();

var spatialHash = {
  'new': function _new(cellSize) {
    return {
      __proto__: this,
      cellSize: cellSize,
      map: new Map()
    };
  },

  /** Return the cell coordinates of POINT. */
  cellFromPoint: function cellFromPoint(point) {
    var x = Math.floor(point.x / this.cellSize);
    var y = Math.floor(point.y / this.cellSize);
    return { x: x, y: y };
  },

  /** Return the hash value of CELL, used as a key into the grid map. */
  hashCell: function hashCell(cell) {
    return cell.x + '%' + cell.y;
  },

  /** Return an array of the cells overlapping with the given axis-aligned
      bounding BOX. */
  cellsIntersectingWith: function cellsIntersectingWith(box) {
    var cells = [];
    var start = this.cellFromPoint(box);
    var end = this.cellFromPoint({ x: box.x + box.width,
      y: box.y + box.height });

    for (var x = start.x; x <= end.x; ++x) for (var y = start.y; y <= end.y; ++y) cells.push({ x: x, y: y });

    return cells;
  },

  insertObjectInCell: function insertObjectInCell(obj, cell) {
    var h = this.hashCell(cell);
    if (!this.map.has(h)) this.map.set(h, new Set());

    this.map.get(h).add(obj);
  },

  /** Insert OBJECT in the grid, based on the coordinates of the axis-aligned
      bounding BOX.  As the bounding box can overlap multiple grid cells, we
      insert the object into all the intersecting cells. */
  insertObjectWithBoundingBox: function insertObjectWithBoundingBox(obj, box) {
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = this.cellsIntersectingWith(box)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var c = _step4.value;

        this.insertObjectInCell(obj, c);
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4['return']) {
          _iterator4['return']();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }
  },

  /** Return the set of objects present in CELL. */
  objectsInCell: function objectsInCell(cell) {
    return this.map.get(this.hashCell(cell)) || emptySet;
  },

  /** Return the set of objects present in the cell of the grid POINT is
      in. */
  objectsNearPoint: function objectsNearPoint(point) {
    return this.map.get(this.hashCell(this.cellFromPoint(point))) || emptySet;
  },

  /** Return the set of objects present in all the cells overlapping with the
      axis-aligned bounding BOX. */
  objectsNearBoundingBox: function objectsNearBoundingBox(box) {
    var objs = new Set();

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = this.cellsIntersectingWith(box)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var c = _step5.value;
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = this.map.get(this.hashCell(c))[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var o = _step6.value;

            objs.add(o);
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6['return']) {
              _iterator6['return']();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5['return']) {
          _iterator5['return']();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    return objs;
  },

  /** Remove all objects in CELL. */
  clearCell: function clearCell(cell) {
    this.map.get(this.hashCell(cell)).clear();
  },

  /** Remove all objects from the grid.  Cells are not deallocated. */
  clearAllCells: function clearAllCells() {
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
      for (var _iterator7 = this.map[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
        var kv = _step7.value;

        kv[1].clear();
      }
    } catch (err) {
      _didIteratorError7 = true;
      _iteratorError7 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion7 && _iterator7['return']) {
          _iterator7['return']();
        }
      } finally {
        if (_didIteratorError7) {
          throw _iteratorError7;
        }
      }
    }
  },

  printStats: function printStats() {
    var avg = 0;
    var _iteratorNormalCompletion8 = true;
    var _didIteratorError8 = false;
    var _iteratorError8 = undefined;

    try {
      for (var _iterator8 = this.map[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
        var kv = _step8.value;

        avg += kv[1].size;
      }
    } catch (err) {
      _didIteratorError8 = true;
      _iteratorError8 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion8 && _iterator8['return']) {
          _iterator8['return']();
        }
      } finally {
        if (_didIteratorError8) {
          throw _iteratorError8;
        }
      }
    }

    avg /= this.map.size;

    console.log('Allocated cells', this.map.size);
    console.log('Average objects per cell', avg);
  }
};
'use strict';

function load(cb) {
  var req = new XMLHttpRequest();
  req.onload = function getMapRequest() {
    var tmxData = JSON.parse(this.responseText);
    build(tmxData);
    cb();
  };
  req.open('get', 'assets/world.json', true);
  req.send();
}

function build(tmxData) {

  // Tiles
  var tiles = parseTileLayer(tmxData, 'decor3', false);
  var tiles = tiles.concat(parseTileLayer(tmxData, 'decor2', false));
  tiles = tiles.concat(parseTileLayer(tmxData, 'decor', false));
  tiles = tiles.concat(parseTileLayer(tmxData, 'main', true));

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = tiles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var t = _step.value;

      createTile(point(t.x * TILE_SIZE, t.y * TILE_SIZE), { x: t.tx, y: t.ty }, t.tangible, t.properties);
    }

    // Objects
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var objects = parseObjectLayer(tmxData, 'coins');
  objects = objects.concat(parseObjectLayer(tmxData, 'enemies'));
  objects = objects.concat(parseObjectLayer(tmxData, 'people'));
  objects = objects.concat(parseObjectLayer(tmxData, 'powerup'));
  objects = objects.concat(parseObjectLayer(tmxData, 'checkpoints'));

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = objects[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var o = _step2.value;

      var factory;

      if (o.type === 'fly' || o.type === 'worm') factory = createEnemy;else if (o.type === 'coin' || o.type === 'wings' || o.type === 'horns') factory = createPowerup;else if (o.type === 'people') factory = createMeanPeople;else if (o.type === 'checkpoint') factory = createCheckpoint;else {
        console.log('Unknown object type: ' + o.type);
        continue;
      }

      factory(point(o.x, o.y), o.type, o.properties);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
        _iterator2['return']();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
}

function parseTileLayer(tmxData, name, tangible) {

  var tileset = tmxData.tilesets[0];
  var tilesetWidth = tileset.imagewidth / tileset.tilewidth;
  var tilesetHeight = tileset.imageheight / tileset.tileheight;

  var tiles = [];
  var layer = tmxData.layers.filter(function (l) {
    return l.name === name;
  })[0];

  layer.data.forEach(function (tileId, index) {
    // Skip empty tiles
    if (tileId === 0) return;

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
    });
  });

  return tiles;
}

function parseObjectLayer(tmxData, name) {

  var objects = [];
  var layer = tmxData.layers.filter(function (l) {
    return l.name == name;
  })[0];

  layer.objects.forEach(function (object) {

    var props = object.properties || {};

    // Add width and height, can be useful
    props.width = object.width;
    props.height = object.height;

    objects.push({
      // World coordinates
      x: object.x,
      y: object.y,

      // Enemy, coin, powerup....
      type: object.type,

      properties: object.properties || {}
    });
  });

  return objects;
}
"use strict";

function cubicBezier(c, d) {
  var a = point(0, 0);
  var b = point(1, 1);

  return function (t) {
    var u = 1 - t;
    var u2 = u * u;
    var u3 = u2 * u;
    var t2 = t * t;
    var t3 = t2 * t;

    var r = vec_mult(a, u3);
    r = vec_plus(r, vec_mult(c, 3 * u2 * t));
    r = vec_plus(r, vec_mult(d, 3 * u * t2));
    r = vec_plus(r, vec_mult(b, t3));

    return r.x;
  };
}

var transition = {
  expire: false,

  "new": function _new(obj, from, to, length, bezier) {

    return {
      __proto__: this,
      startTime: performance.now(),
      obj: obj, from: from, to: to, length: length, bezier: bezier };
  },

  update: function update(now) {
    var dt = now - this.startTime;
    var t = dt / this.length;

    if (t >= 1) {
      t = 1;
      this.expire = true;
    }

    var f = this.bezier(t);
    for (var p in this.to) {
      this.obj[p] = this.from[p] + f * (this.to[p] - this.from[p]);
    }
  }
};

var activeTransitions = [];

function updateTransitions(dt, now) {
  var newTransitions = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = activeTransitions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var t = _step.value;

      t.update(now);
      if (!t.expire) newTransitions.push(t);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"]) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  activeTransitions = newTransitions;
}
'use strict';

var DEBUG = false;

var canvas;
var ctx;
var spritesheet;
var tilesheet;
var munster_sheet;
var horns_sheet;
var horns_powerup;
var wings_sheet;
var wingflap;
var meanpeople_sheet;
var titleImage;
var bling_sheet;
var spike_death;
var worm_sheet;
var worm_sheet_green;
var fly_sheet;

function initCanvas() {
  canvas = document.getElementById('canvas');
  canvas.width = 640;
  canvas.height = 400;

  ctx = canvas.getContext('2d');

  // Pixel goodness
  ctx.imageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.msImageSmoothingEnabled = false;

  spritesheet = document.getElementById('spritesheet');
  tilesheet = document.getElementById('tilesheet');
  munster_sheet = document.getElementById('munster-sheet');
  horns_sheet = document.getElementById('horns-sheet');
  horns_powerup = document.getElementById('horns-powerup');
  wings_sheet = document.getElementById('wings-sheet');
  wingflap = document.getElementById('wingflap');
  meanpeople_sheet = document.getElementById('meanpeople-sheet');
  titleImage = document.getElementById('title');
  bling_sheet = document.getElementById('bling-sheet');
  spike_death = document.getElementById('spike-death');
  worm_sheet = document.getElementById('worm-sheet');
  worm_sheet_green = document.getElementById('worm-sheet-green');
  fly_sheet = document.getElementById('fly-sheet');

  createBackground('hills-bg', 5000, 10, 3, 3);
  createBackground('hills2-bg', 2000, 220, 2, 2);
}

var backgrounds = [];

function createBackground(id, parallax, y, sx, sy) {
  var img = document.querySelector('#' + id);
  backgrounds.push({
    img: img,
    parallax: parallax,
    y: y,
    sx: sx, sy: sy // scaling
  });
}

function renderBackgrounds() {

  ctx.fillStyle = '#dddddd';
  ctx.fillRect(0, 0, canvas.width, 150);

  ctx.fillStyle = '#dbd785';
  ctx.fillRect(0, 150, canvas.width, 340);

  ctx.fillStyle = '#c6b555';
  ctx.fillRect(0, 340, canvas.width, canvas.height);

  backgrounds.forEach(function (bg) {
    for (var i = 0; i < 7; ++i) {
      var r = camera.x % bg.parallax / bg.parallax;
      var w = bg.img.width * bg.sx;
      var h = bg.img.height * bg.sy;
      ctx.drawImage(bg.img, (i + r) * w, bg.y, w, h);
    }
  });
}

var frame = 0;

var currentFlash = null;

function flash(r, g, b, frames) {
  if (currentFlash) return;

  currentFlash = {
    color: [r, g, b],
    colorText: 'rgba(' + r + ',' + g + ',' + b + ',',
    frames: frames,
    current: 0
  };
}

function render() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  renderBackgrounds();

  var p = world.body[munster].position;

  // INTRO ZOOM EFFECT ONLY ONCE
  if (introZoom) {
    camera_focus({ x: p.x + TS / 2, y: p.y + TS / 2 });
    if (camera.zoom === 3) {
      introZoom = false;
      activateControls();
    }
  } else camera_transition({ x: canvas.width / 2 / camera.zoom - (p.x + 8),
    y: canvas.height / 2 / camera.zoom - (p.y + 8) }, 50);

  var screen = {
    x: -camera.x, y: -camera.y,
    width: canvas.width / camera.zoom,
    height: canvas.height / camera.zoom };

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(camera.x, camera.y);

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = getEntities(C_RENDERABLE)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var e = _step.value;

      if (e === munster) continue; // Draw munster on top of every renderable

      var r = world.renderable[e];
      p = world.position[e];
      if (do_boxes_collide(screen, {
        x: p.x, y: p.y, width: TS2, height: TS2 })) {
        r(e, ctx);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  world.renderable[munster](munster, ctx);

  ctx.restore();

  if (introZoom) ctx.drawImage(titleImage, 5, 60, 63 * 10, 24 * 10);

  if (DEBUG) {
    ctx.save();

    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(camera.x, camera.y);

    drawBoundingBox(ctx);

    ctx.strokeStyle = '#11c';
    ctx.strokeRect(screen.x, screen.y, screen.width, screen.height);

    ctx.restore();
  }

  // FLASH
  if (currentFlash) {
    ++currentFlash.current;

    var alpha = 1 - currentFlash.current / currentFlash.frames;
    ctx.fillStyle = currentFlash.colorText + alpha + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentFlash.frames <= currentFlash.current) currentFlash = null;
  }

  frame++;
}

var camera = { x: 0, y: 0, zoom: 3 };

function camera_transition(to, length, bezier) {
  if (length == null) length = 500;

  bezier = bezier || cubicBezier(point(0.25, 0.1), point(0.25, 0.1));

  var from = { x: camera.x, y: camera.y, zoom: camera.zoom };

  activeTransitions.push(transition['new'](camera, from, to, length, bezier));
}

function camera_focus(position) {
  camera.x = canvas.width / 2 / camera.zoom - position.x;
  camera.y = canvas.height / 2 / camera.zoom - position.y;
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Individual rendering functions

var TS, TS2, TSH;
var TILE_SIZE = TS = 16;
var TILE_SIZE_TWO = TS2 = TS * 2;
var TILE_SIZE_HALF = TSH = TS / 2;
var defaultSprite = { x: 0, y: 0 };

function renderTile(e, ctx) {
  if (!testEntity(e, C_POSITION)) console.error('Trying to render tile without a position');

  var p = world.position[e];
  var s = world.sprite[e] || defaultSprite;

  ctx.save();
  ctx.translate(p.x, p.y);

  ctx.drawImage(tilesheet, s.x * TS, s.y * TS, TS, TS, 0, 0, TS, TS);
  ctx.restore();

  if (DEBUG && world.mask[e] & C_PHYSICS) {
    ctx.save();
    p = world.body[e].position;
    ctx.translate(p.x, p.y);
    var bounds = world.body[e].parts[0].bounds;
    var w = bounds.max.x - bounds.min.x;
    var h = bounds.max.y - bounds.min.y;
    ctx.strokeStyle = '#ff0000';
    ctx.strokeRect(TS / 2 - w / 2, TS / 2 - h / 2, w, h);
    ctx.restore();
  }
}

var munsterRotation = 0;
var munsterRotationStep = 0.2;
var SHOW_WINGS_ON_MUNSTER = true;
var SHOW_WINGS_IN_AIR = true;

function renderMunster(e, ctx) {
  if (!(world.mask[e] & C_POSITION)) console.error('Trying to render münster without a position');

  var body = world.body[e];
  var p = body.position;
  var s = world.sprite[e] || defaultSprite;

  if (Array.isArray(s)) {
    var r = s.length / (2 * Math.PI);
    var i = mod(Math.floor(munsterRotation * r), s.length);
    s = s[i];
  }

  ctx.save();
  ctx.translate(p.x, p.y);

  // Wings
  if (canDoubleJump) {

    if (!jumping && SHOW_WINGS_ON_MUNSTER) {
      ctx.drawImage(wings_sheet, s.x * 64, s.y * 64, 64, 64, -24, -24, 64, 64);
    }

    if (jumping && !doubleJumping && frame % 20 < 10) {
      ctx.drawImage(wingflap, 0, 0, 64, 32, -24, -8, 64, 32);
    } else if (jumping && !doubleJumping || doubleJumping) {
      ctx.drawImage(wingflap, 64, 0, 64, 32, -24, -8, 64, 32);
    }
    /*else if (jumping && !doubleJumping && SHOW_WINGS_IN_AIR) {
      ctx.drawImage(wingflap,
              0, 0,
              64, 32,
              -24, -8,
              64, 32)
    }
    else if (doubleJumping && SHOW_WINGS_IN_AIR) {
      ctx.drawImage(wingflap,
              64, 0,
              64, 32,
              -24, -8,
              64, 32)
    }*/
  }

  // Body
  ctx.drawImage(munster_sheet, s.x * TILE_SIZE, s.y * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);

  // Horns
  if (hasHorns) {
    ctx.drawImage(horns_sheet, s.x * TS2, s.y * TS2, TS2, TS2, -TSH, -TSH, TS2, TS2);
  }

  if (DEBUG) {
    var bounds = world.body[e].parts[0].bounds;
    ctx.strokeStyle = '#ff0000';
    ctx.strokeRect(0, 0, bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);

    ctx.strokeStyle = '#0000ff';
    ctx.beginPath();
    ctx.moveTo((bounds.max.x - bounds.min.x) / 2, (bounds.max.y - bounds.min.y) / 2);
    ctx.lineTo(body.velocity.x * 20, body.velocity.y * 20);
    ctx.stroke();

    var part = body.parts[0];
    var axis = part.axes[0];
    ctx.strokeStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo((bounds.max.x - bounds.min.x) / 2, (bounds.max.y - bounds.min.y) / 2);
    ctx.lineTo(axis.x * 20, axis.y * 20);
    ctx.stroke();
  }

  ctx.restore();
}

function renderFly(e, ctx) {
  var p = world.position[e];
  var s = world.sprite[e] || defaultSprite;

  s = s[Math.floor(frame / 3 % s.length)];

  ctx.save();
  ctx.translate(p.x, p.y);

  if (!world.patrolPath[e].reverse) ctx.scale(-1, 1);

  ctx.drawImage(fly_sheet, s.x * TILE_SIZE, s.y * TILE_SIZE, TILE_SIZE, TILE_SIZE, -8, 0, TILE_SIZE, TILE_SIZE);

  ctx.restore();
}

function renderCoin(e, ctx) {
  var p = world.position[e];
  var s = world.sprite[e] || defaultSprite;

  if (Array.isArray(s)) {
    s = s[Math.floor(frame / 5 % s.length)];
  }

  ctx.save();
  ctx.translate(p.x, p.y);

  ctx.drawImage(bling_sheet, s.x * TILE_SIZE, s.y * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);

  ctx.restore();
}

function renderWorm(e, ctx) {
  var p = world.position[e];
  var s = world.sprite[e] || defaultSprite;

  var mirror = 1;
  if (s.flip) mirror *= -1;
  if (world.patrolPath[e].reverse) mirror *= -1;

  if (Array.isArray(s)) {
    var i = Math.floor(s.frame++ / 30 % s.length);
    s = s[i];
    world.patrolPath[e].speed = i / 10;
  }

  ctx.save();
  ctx.translate(p.x, p.y);
  if (mirror === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-TS, 0);
  }

  ctx.drawImage(world.sprite[e].sheet, s.x * TILE_SIZE, s.y * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);

  ctx.restore();
}

var bubbleMargin = 2;
var bubbleTip = 2;

function renderMeanPeople(e, ctx) {
  var p = world.position[e];
  var s = world.sprite[e];
  var path = world.patrolPath[e];
  var text = world.text[e];

  var anim = s.animations[s.current];
  var speed = s.current == 'flee' ? 5 : 20;
  s = anim[Math.floor(frame / speed % anim.length)];

  ctx.save();
  ctx.translate(p.x, p.y);

  if (text.enabled) {
    ctx.font = '5px Pixels';
    var metrics = ctx.measureText(text.text);

    // compute bubble size
    var w = metrics.width + bubbleMargin * 2;
    var h = 5 * 1.1 + bubbleMargin * 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -h - bubbleTip);
    ctx.lineTo(w, -h - bubbleTip);
    ctx.lineTo(w, -bubbleTip);
    ctx.lineTo(bubbleTip, -bubbleTip);
    ctx.closePath();

    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.strokeStyle = '#a58935';
    ctx.lineWidth = 0.3;
    ctx.stroke();

    ctx.fillStyle = '#4f2f09';
    ctx.fillText(text.text, bubbleMargin, -bubbleTip - h / 4);
  }

  if (!path.reverse) ctx.scale(-1, 1);

  ctx.drawImage(meanpeople_sheet, s.x * TILE_SIZE, s.y * TILE_SIZE_TWO, TILE_SIZE, TILE_SIZE_TWO, -8, 0, // X-axis centered to avoid shifts when flipping
  TILE_SIZE, TILE_SIZE_TWO);

  ctx.restore();
}

function renderWings(e, ctx) {
  var p = world.position[e];
  var s = { x: 0, y: 2 };

  ctx.save();
  ctx.translate(p.x, p.y);

  // Gradient
  var r = 80;
  var powerUpGradient = ctx.createRadialGradient(TS, TS, 0, TS, TS, TS2);
  powerUpGradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  powerUpGradient.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  powerUpGradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(r / 2, r / 2, r, 0, 2 * Math.PI);
  ctx.fillStyle = powerUpGradient;
  ctx.fill();

  // Picture
  ctx.drawImage(tilesheet, s.x * TS, s.y * TS, TS2, TS2, 0, 16, TS2, TS2);

  // Text
  var t = world.text[e];
  if (t) {
    var main = t[0];
    var sub = t[1];

    ctx.fillStyle = '#4f2f09';

    ctx.font = '7px Pixels';
    var metrics = ctx.measureText(main);
    ctx.fillText(main, -metrics.width / 4, -10);

    ctx.font = '5px Pixels';
    ctx.fillText(sub, metrics.width / 3, -2);
  }

  ctx.restore();
}

function renderHorns(e, ctx) {
  var p = world.position[e];
  var s = world.sprite[e];

  ctx.save();
  ctx.translate(p.x, p.y);

  // Gradient
  var r = 80;
  var powerUpGradient = ctx.createRadialGradient(TS, TS, 0, TS, TS, TS2);
  powerUpGradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  powerUpGradient.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  powerUpGradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(r / 2, r / 2, r, 0, 2 * Math.PI);
  ctx.fillStyle = powerUpGradient;
  ctx.fill();

  // Picture
  ctx.drawImage(horns_powerup, 0, 0, 32, 32);

  // Text
  var t = world.text[e];
  if (t) {
    var main = t[0];
    var sub = t[1];

    ctx.fillStyle = '#4f2f09';

    ctx.font = '7px Pixels';
    var metrics = ctx.measureText(main);
    ctx.fillText(main, -metrics.width / 4, -10);

    ctx.font = '5px Pixels';
    ctx.fillText(sub, metrics.width / 3, -2);
  }

  ctx.restore();
}

function renderNothing() {}

function drawBoundingBox(ctx) {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = getEntities(C_BOUNDING_BOX)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var e = _step2.value;

      var b = world.boundingBox[e];
      var h = world.boundingBoxHit[e];

      ctx.strokeStyle = h ? '#1c1' : '#c11';
      ctx.strokeRect(b.x, b.y, b.width, b.height);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
        _iterator2['return']();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
}
'use strict';

var spikeDeathAnim = false;
var spikeDeathEntity;
var spikeDeathFrame = 0;
var spikeDeathFrameStep = 0.1;
var spikeDeathFrameTotal = 0;

function beginSpikeDeathAnim(spike) {
  spikeDeathFrame = 0;
  spikeDeathFrameTotal = 0;
  spikeDeathAnim = true;
  spikeDeathEntity = spike;

  world.renderable[spike] = renderSpikeDeathAnim;
  world.renderable[munster] = renderNothing;

  deactivateControls(true);
}

function renderSpikeDeathAnim(e, ctx) {
  var p = world.position[e];
  var s = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }];

  s = s[Math.floor(spikeDeathFrame % s.length)];

  if (spikeDeathFrame < 4) spikeDeathFrame += spikeDeathFrameStep;

  spikeDeathFrameTotal++;
  if (spikeDeathFrameTotal > 100) {
    spikeDeathAnim = false;
    world.renderable[munster] = renderMunster;
    world.renderable[e] = renderTile;
    resetMunster();
    activateControls();
  }

  ctx.save();
  ctx.translate(p.x, p.y - 16);

  ctx.drawImage(spike_death, s.x * TILE_SIZE, s.y * TILE_SIZE, TILE_SIZE, 2 * TILE_SIZE, 0, 0, TILE_SIZE, 2 * TILE_SIZE);

  ctx.restore();
}

var doIntroZoom = true;
var introZoom = false;

function startIntroZoom() {
  camera.zoom = 400;
  camera_focus({
    x: world.position[munster].x + TS / 2,
    y: world.position[munster].y + TS / 2
  });
  camera_transition({ zoom: 3 }, 7000);
  introZoom = true;
  deactivateControls(true);
}

var acquireWings = false;
var climaxDuration = 1500; // heh!

function startAcquireWings(w) {
  acquireWings = true;
  deactivateControls(true);
  canDoubleJump = true;
  flash(255, 255, 255, 100);
  bgm.pause();
  world.mask[w] &= ~C_FLOATING;
  sfx_play('sfx-pickup-powerup');

  setTimeout(function () {
    destroyEntity(w);
    activateControls();
    bgm.play();
  }, climaxDuration);
}

var acquireHorns = false;
function startAcquireHorns(h) {
  acquireHorns = true;
  deactivateControls(true);
  hasHorns = true;
  flash(255, 255, 255, 100);
  bgm.pause();
  world.mask[h] &= ~C_FLOATING; // ??
  sfx_play('sfx-pickup-powerup');

  setTimeout(function () {
    destroyEntity(h);
    activateControls();
    bgm.play();
  }, climaxDuration);
}

var collectedCoins = 0;
var collectedCoinIds = [];
var totalCoins = 0;
var totalDeaths = 0;

var victory = false;

function doVictoryScreen() {
  victory = true;

  // CLEAR THE LOCALSTORAGE TO PLAY ANOTHER GAME
  clearInterval(saveInterval);
  clearGame();

  var length = 7000;
  camera_transition({ zoom: 400 }, length);
  setTimeout(function () {
    stopLoop();

    ctx.save();

    ctx.font = '45px Pixels';

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

    ctx.fillStyle = '#4f2f09';
    ctx.fillText('Congratulations!', 60, 100);
    ctx.fillText('You Are The Monster!', 60, 160);
    ctx.fillText(collectedCoins + '/' + totalCoins, 132, 256);
    ctx.fillText('Deaths:' + totalDeaths, 320, 256);

    ctx.drawImage(bling_sheet, 0, 0, TS, TS, 60, 213, TS * 4, TS * 4);

    ctx.restore();
  }, length);
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Engine

'use strict';

var marked0$0 = [getEntities].map(regeneratorRuntime.mark);
var C_NONE = 0,
    C_POSITION = 1 << 0,
    C_BOUNDING_BOX = 1 << 1,
    C_RENDERABLE = 1 << 2,
    C_INPUT = 1 << 3,
    C_PHYSICS = 1 << 4,
    C_MUNSTER = 1 << 6,
    C_COIN = 1 << 7,
    C_PATROL = 1 << 8,
    C_FLY = 1 << 9,
    C_WORM = 1 << 10,
    C_WINGS = 1 << 11,
    C_MEANPEOPLE = 1 << 12,
    C_TEXT = 1 << 13,
    C_PATROL_SIN = 1 << 14,
    C_CHECKPOINT = 1 << 15,
    C_HORNS = 1 << 16,
    C_FLOATING = 1 << 17;

var world = {
  mask: [],
  position: [],
  boundingBox: [],
  boundingBoxHit: [],
  renderable: [], // Function to render the entity
  sprite: [], // {x,y} coordinates into the spritesheet
  body: [], // Rigid body subject to the physics simulation
  patrolPath: [],
  text: [],
  floating: []
};

function createEntity() {
  var i = 0;
  while (world.mask[i] !== C_NONE && world.mask[i] != null) ++i;

  return i;
}

function destroyEntity(e) {
  world.mask[e] = C_NONE;
}

function destroyAllEntities(mask) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = getEntities(mask)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var e = _step.value;

      destroyEntity(e);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

function testEntity(e, mask) {
  return (world.mask[e] & mask) === mask;
}

function getEntities(mask) {
  var e, n;
  return regeneratorRuntime.wrap(function getEntities$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        e = 0, n = world.mask.length;

      case 1:
        if (!(e < n)) {
          context$1$0.next = 8;
          break;
        }

        if (!((world.mask[e] & mask) === mask)) {
          context$1$0.next = 5;
          break;
        }

        context$1$0.next = 5;
        return e;

      case 5:
        ++e;
        context$1$0.next = 1;
        break;

      case 8:
      case 'end':
        return context$1$0.stop();
    }
  }, marked0$0[0], this);
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// World

var munster;

var lastCheckpoint;
var start = lastCheckpoint = point(3280, 3280);
//start = lastCheckpoint = point(141*16, 137*16)

var saveinterval;
function saveGame() {
  window.localStorage.setItem('horns', hasHorns);
  window.localStorage.setItem('wings', canDoubleJump);

  window.localStorage.setItem('checkpoint_x', lastCheckpoint.x);
  window.localStorage.setItem('checkpoint_y', lastCheckpoint.y);

  window.localStorage.setItem('totalDeaths', totalDeaths);
  window.localStorage.setItem('coins', JSON.stringify(collectedCoinIds));
}

function loadGame() {
  hasHorns = window.localStorage.getItem('horns') === 'true' || false;
  if (hasHorns) destroyAllEntities(C_HORNS);

  canDoubleJump = window.localStorage.getItem('wings') === 'true' || false;
  if (canDoubleJump) destroyAllEntities(C_WINGS);

  lastCheckpoint.x = window.localStorage.getItem('checkpoint_x') || start.x;
  lastCheckpoint.y = window.localStorage.getItem('checkpoint_y') || start.y;
  start = lastCheckpoint;
  resetMunster();

  totalDeaths = parseInt(window.localStorage.getItem('totalDeaths')) || 0;

  collectedCoinIds = JSON.parse(window.localStorage.getItem('coins')) || [];
  collectedCoins = collectedCoinIds.length;

  // Remove collected coins from the world
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = getEntities(C_COIN)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var coin = _step2.value;

      if (collectedCoinIds.indexOf(coin) > -1) destroyEntity(coin);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
        _iterator2['return']();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
}

function clearGame() {
  localStorage.clear();
}

var saveInterval;

function initWorld(cb) {
  load(function () {
    totalCoins = Array.from(getEntities(C_COIN)).length;

    munster = createMunster(point(0, 0));
    resetMunster();

    loadGame();
    saveInterval = setInterval(saveGame, 10000); // 10 seconds?

    if (doIntroZoom) startIntroZoom();

    cb();
  });
}

function resetMunster() {
  moveBody(world.body[munster], lastCheckpoint);
}

var munsterGroup = Matter.Body.nextGroup(true);

function createMunster(position) {
  var e = createEntity();

  world.mask[e] = C_POSITION | C_RENDERABLE | C_INPUT | C_PHYSICS | C_MUNSTER | C_BOUNDING_BOX;

  world.position[e] = point(position.x, position.y);
  world.renderable[e] = renderMunster;
  world.sprite[e] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }];

  var options = {
    friction: 0.8,
    frictionAir: 0.075,
    restitution: 0.2,
    density: 0.5,
    groupId: munsterGroup
  };
  world.body[e] = Matter.Bodies.circle(position.x, position.y, 8, options);

  world.boundingBox[e] = bodyToBB(world.body[e]);
  world.boundingBoxHit[e] = false;

  world.body[e].entity = e;

  Matter.World.add(engine.world, [world.body[e]]);

  return e;
}

var hasHorns = false;

function isMunsterScary() {
  return hasHorns;
}

function createTile(position, sprite, tangible, properties) {
  var e = createEntity();

  world.mask[e] = C_POSITION | C_RENDERABLE;

  world.position[e] = point(position.x, position.y);
  world.renderable[e] = renderTile;
  world.sprite[e] = { x: sprite.x, y: sprite.y };

  if (tangible) {

    world.mask[e] |= C_PHYSICS;

    var width = parseInt(properties.width) || TILE_SIZE;
    var height = parseInt(properties.height) || TILE_SIZE;
    var offset = { x: parseInt(properties.offsetX, 10) || 0,
      y: parseInt(properties.offsetY, 10) || 0 };

    world.body[e] = Matter.Bodies.rectangle(position.x + offset.x, position.y + offset.y, width, height, { isStatic: true,
      friction: 0.5 });

    world.body[e].entity = e;
    world.body[e].tileType = properties.type;

    Matter.World.add(engine.world, [world.body[e]]);
  }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Checkpoints

function checkpoint(c) {

  var pos;
  if (c) {
    if (lastCheckpoint === c) return;
    var bb = world.boundingBox[c];
    pos = point(bb.x + bb.width / 2, bb.y + bb.height / 2);
  } else pos = world.body[munster].position;

  lastCheckpoint = point(pos.x, pos.y);
  //console.info('Checkpoint ' + pos)
}

function createCheckpoint(position, type, properties) {
  var e = createEntity();

  world.mask[e] = C_POSITION | C_CHECKPOINT | C_BOUNDING_BOX;

  world.boundingBox[e] = {
    x: position.x,
    y: position.y,
    width: properties.width,
    height: properties.height };

  return e;
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Powerups

function createPowerup(position, type, properties) {
  var e = createEntity();

  world.mask[e] = C_POSITION | C_RENDERABLE | C_BOUNDING_BOX;

  world.position[e] = point(position.x, position.y);

  if (type === 'coin') {
    world.mask[e] |= C_COIN;
    world.renderable[e] = renderCoin;
    world.sprite[e] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }];

    var offset = {
      x: parseInt(properties.offsetX) || 0,
      y: parseInt(properties.offsetY) || 0
    };

    world.boundingBox[e] = {
      x: position.x + offset.x,
      y: position.y + offset.y,
      width: parseInt(properties.width, 10) || 5,
      height: parseInt(properties.height, 10) || 5 };

    world.boundingBoxHit[e] = false;
  } else if (type === 'wings' || type === 'horns') {

    if (type === 'wings') {
      world.mask[e] |= C_WINGS;
      world.renderable[e] = renderWings;

      world.text[e] = ['BAT WINGS', 'Fly high'];
    } else {
      world.mask[e] |= C_HORNS;
      world.renderable[e] = renderHorns;

      world.text[e] = ['DEMON HORNS', 'Instill fear'];
    }

    world.mask[e] |= C_FLOATING | C_TEXT;

    world.floating[e] = {
      initialPos: point(position.x, position.y),
      speed: 0.002,
      amplitude: 5
    };

    world.boundingBox[e] = {
      x: position.x,
      y: position.y,
      width: 32,
      height: 32 };
  } else console.error('Unknown powerup type!', type);

  world.boundingBoxHit[e] = false;

  return e;
}

function updateFloating(dt, now) {
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = getEntities(C_FLOATING)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var e = _step3.value;

      var f = world.floating[e];

      world.position[e] = point(f.initialPos.x, f.initialPos.y + Math.sin(now * f.speed) * f.amplitude);

      world.boundingBox[e].y = world.position[e].y;
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3['return']) {
        _iterator3['return']();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Enemies

function createEnemy(position, type, properties) {
  if (type === 'fly') createFly(position, properties);else if (type === 'worm') createWorm(position, properties);
}

function createFly(position, properties) {
  var e = createEntity();

  world.mask[e] = C_POSITION | C_RENDERABLE | C_BOUNDING_BOX | C_PATROL_SIN | C_FLY;

  world.renderable[e] = renderFly;
  world.sprite[e] = [{ x: 0, y: 0 }, { x: 1, y: 0 }];

  world.position[e] = point(position.x, position.y);

  var right = parseFloat(properties.right) || 100;
  var speed = parseFloat(properties.speed) || 10;
  var amplitude = parseFloat(properties.amplitude) || 15;
  var frequency = parseFloat(properties.frequency) || 10;

  world.patrolPath[e] = {
    start: position,
    end: vec_plus(position, point(right, 0)),
    speed: speed,
    amplitude: amplitude,
    frequency: frequency
  };

  world.boundingBox[e] = {
    x: position.x,
    y: position.y,
    width: 10,
    height: 10
  };

  return e;
}

function createWorm(position, properties) {
  var e = createEntity();

  world.mask[e] = C_POSITION | C_RENDERABLE | C_BOUNDING_BOX | C_PATROL | C_WORM;

  world.position[e] = point(position.x, position.y);
  world.renderable[e] = renderWorm;
  world.sprite[e] = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
  world.sprite[e].frame = Math.floor(Math.random() % 2);
  world.sprite[e].flip = !!parseInt(properties.flip, 10) || false;

  if (properties.color === 'green') world.sprite[e].sheet = worm_sheet_green;else world.sprite[e].sheet = worm_sheet;

  world.boundingBox[e] = { x: position.x,
    y: position.y,
    width: 8,
    height: 5 };

  var patrol = {
    start: {
      x: parseInt(properties.patrolStartX, 10) || 0,
      y: parseInt(properties.patrolStartY, 10) || 0
    },
    end: {
      x: parseInt(properties.patrolEndX, 10) || 20,
      y: parseInt(properties.patrolEndY, 10) || 0
    }
  };

  world.patrolPath[e] = {
    start: vec_plus(position, patrol.start),
    end: vec_plus(position, patrol.end),
    speed: parseInt(properties.patrolSpeed, 10) || 0.3
  };

  return e;
}

function updatePatrol(dt, now) {
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = getEntities(C_PATROL)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var e = _step4.value;

      var path = world.patrolPath[e];
      var p = world.position[e];

      var start = path.reverse ? path.end : path.start;
      var end = path.reverse ? path.start : path.end;

      var v = vec_unit(vec_minus(end, start));
      v = vec_mult(v, path.speed);

      p.x = clamp(p.x + v.x, start.x, end.x);
      p.y = clamp(p.y + v.y, start.y, end.y);

      if (world.mask[e] & C_BOUNDING_BOX) {
        var b = world.boundingBox[e];
        b.x = p.x + 4;
        b.y = p.y + 11;
      }

      if (vec_length(vec_minus(p, end)) <= 1) path.reverse = !path.reverse;
    }

    // Similar to C_PATROL, with vertical modulation
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4['return']) {
        _iterator4['return']();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = getEntities(C_PATROL_SIN)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var e = _step5.value;

      var path = world.patrolPath[e];
      var p = world.position[e];

      var start = path.reverse ? path.end : path.start;
      var end = path.reverse ? path.start : path.end;

      var v = vec_unit(vec_minus(end, start));
      v = vec_mult(v, path.speed);

      p.x = clamp(p.x + v.x, start.x, end.x);

      var progress = vec_length(vec_minus(p, start)) / vec_length(vec_minus(end, start));
      p.y = path.start.y + Math.sin(now * 0.01) * path.amplitude;

      if (world.mask[e] & C_BOUNDING_BOX) {
        var b = world.boundingBox[e];
        b.x = p.x - 4;
        b.y = p.y + 3;
      }

      if (progress > 0.99) path.reverse = !path.reverse;
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5['return']) {
        _iterator5['return']();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }
}

function createMeanPeople(position, type, properties) {
  var e = createEntity();

  world.mask[e] = C_POSITION | C_RENDERABLE | C_PATROL | C_MEANPEOPLE | C_TEXT;

  world.position[e] = point(position.x, position.y);
  world.renderable[e] = renderMeanPeople;

  world.sprite[e] = {
    animations: {
      walk: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      flee: [{ x: 2, y: 0 }, { x: 3, y: 0 }],
      laugh: [{ x: 4, y: 0 }, { x: 5, y: 0 }]
    },
    current: 'walk'
  };

  var left = parseInt(properties.left) || 10;
  var right = parseInt(properties.right) || 10;
  var speed = parseFloat(properties.speed) || 0.3;

  world.patrolPath[e] = {
    start: vec_plus(position, point(-left, 0)),
    end: vec_plus(position, point(right, 0)),
    speed: speed
  };

  world.text[e] = {
    text: 'AAAAHH!', //properties.text || '...',
    enabled: false
  };

  return e;
}

var meanPeopleDistance = 60;
var meanPeopleSpeed = 0.3;
var meanPeopleFleeSpeed = 0.7;

var meanMessages = ['HAHA!', 'HA. HA. HA.', 'You\'re cheese.', 'You\'re no monster.', 'That\'s absurd.', 'Go home, you are a cheese.', 'You look like like Pac-Man...'];

var scaredMessages = ['HAAAAAAAAA!', 'You are a monster!', 'You are the monster!', 'MONSTERRRR!', 'RUN!', 'RUN RUN RUN!', '#@?€!', 'THIS IS A NIGHTMARE', 'HOLY CAMEMBERT!', ':('];

function pickMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

var victoryScreenComing = false;

function updateMeanPeople(dt, now) {
  var munsterPos = world.body[munster].position;

  var _iteratorNormalCompletion6 = true;
  var _didIteratorError6 = false;
  var _iteratorError6 = undefined;

  try {
    for (var _iterator6 = getEntities(C_MEANPEOPLE | C_PATROL | C_TEXT)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
      var e = _step6.value;

      var p = world.position[e];
      var d = vec_length(vec_minus(p, munsterPos));

      var sprite = world.sprite[e];
      var text = world.text[e];
      var path = world.patrolPath[e];

      // React to the proximity of the munster
      if (d < meanPeopleDistance) {

        if (!isMunsterScary() && sprite.current != 'laugh' && !victoryScreenComing) {
          sprite.current = 'laugh';
          path.speed = 0;
          text.enabled = true;
          text.text = pickMessage(meanMessages);
        } else if (isMunsterScary() && sprite.current != 'flee') {
          sprite.current = 'flee';
          path.speed = meanPeopleFleeSpeed;
          text.enabled = true;
          text.text = pickMessage(scaredMessages);

          if (victory === false) {
            victoryScreenComing = true;
            setTimeout(doVictoryScreen, 10000);
          }
        }

        // Face or run away from the munster depending on the state
        path.reverse = sprite.current == 'laugh' ? munsterPos.x < p.x : munsterPos.x > p.x;
      }

      // Go back to normal when far from the munster
      else if (d > meanPeopleDistance && sprite.current != 'walk' && !victoryScreenComing) {
          sprite.current = 'walk';
          path.speed = meanPeopleSpeed;
          text.enabled = false;
        }
    }
  } catch (err) {
    _didIteratorError6 = true;
    _iteratorError6 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion6 && _iterator6['return']) {
        _iterator6['return']();
      }
    } finally {
      if (_didIteratorError6) {
        throw _iteratorError6;
      }
    }
  }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Physics

var engine;

function initPhysics() {

  engine = Matter.Engine.create();
  engine.world.gravity.y = 1.4;

  // The ground must be touched before jumps
  Matter.Events.on(engine, 'collisionStart', function touchedGround(event) {
    if (jumping === false) return;
    if (event.pairs.some(function (pair) {
      return pair.bodyA.entity === munster && vec_unit(pair.collision.normal).y < -0.95 || pair.bodyB.entity === munster && vec_unit(pair.collision.normal).y > 0.95;
    })) jumping = doubleJumping = false;
  });

  Matter.Events.on(engine, 'collisionStart', function collisionStart(event) {
    var pair = event.pairs[0];

    testPair(function (a, b) {
      return a.tileType === 'death' && b.entity === munster;
    }, function (a, b) {
      totalDeaths++;
      beginSpikeDeathAnim(a.entity);
    }, pair);
  });
}

function testPair(test, exec, pair) {
  if (test(pair.bodyA, pair.bodyB)) exec(pair.bodyA, pair.bodyB);else if (test(pair.bodyB, pair.bodyA)) exec(pair.bodyB, pair.bodyA);
}

function moveBody(b, pos) {
  Matter.Body.translate(b, { x: -b.position.x,
    y: -b.position.y });
  Matter.Body.translate(b, pos);
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Bounding box collisions

var grid = spatialHash['new'](200);
var hitQueue = [];

function checkCollisions() {
  grid.clearAllCells();
  clearCheckedPairs();
  hitQueue.length = 0;

  world.boundingBox[munster] = bodyToBB(world.body[munster]);

  var _iteratorNormalCompletion7 = true;
  var _didIteratorError7 = false;
  var _iteratorError7 = undefined;

  try {
    for (var _iterator7 = getEntities(C_BOUNDING_BOX)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
      var e = _step7.value;

      var b = world.boundingBox[e];
      grid.insertObjectWithBoundingBox(e, b);
      world.boundingBoxHit[e] = false;
    }
  } catch (err) {
    _didIteratorError7 = true;
    _iteratorError7 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion7 && _iterator7['return']) {
        _iterator7['return']();
      }
    } finally {
      if (_didIteratorError7) {
        throw _iteratorError7;
      }
    }
  }

  var _iteratorNormalCompletion8 = true;
  var _didIteratorError8 = false;
  var _iteratorError8 = undefined;

  try {
    for (var _iterator8 = grid.map.values()[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
      var objSet = _step8.value;

      var objs = Array.from(objSet);
      for (var i = 0; i < objs.length; ++i) {
        var e1 = objs[i];
        var b1 = world.boundingBox[e1];
        for (var j = i + 1; j < objs.length; ++j) {
          var e2 = objs[j];

          if (alreadyChecked(e1, e2)) continue;

          var b2 = world.boundingBox[e2];
          if (do_boxes_collide(b1, b2)) {
            world.boundingBoxHit[e1] = world.boundingBoxHit[e2] = true;
            hitQueue.push([e1, e2]);
            checkPair(e1, e2);
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError8 = true;
    _iteratorError8 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion8 && _iterator8['return']) {
        _iterator8['return']();
      }
    } finally {
      if (_didIteratorError8) {
        throw _iteratorError8;
      }
    }
  }
}

var checkedPairs = new Map();

function alreadyChecked(e1, e2) {
  return checkedPairs.has(e1) && checkedPairs.get(e1).has(e2) || checkedPairs.has(e2) && checkedPairs.get(e2).has(e1);
}

function checkPair(e1, e2) {
  if (!checkedPairs.has(e1)) checkedPairs.set(e1, new Set());
  checkedPairs.get(e1).add(e2);
}

function clearCheckedPairs() {
  var _iteratorNormalCompletion9 = true;
  var _didIteratorError9 = false;
  var _iteratorError9 = undefined;

  try {
    for (var _iterator9 = checkedPairs.values()[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
      var p = _step9.value;

      p.clear();
    }
  } catch (err) {
    _didIteratorError9 = true;
    _iteratorError9 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion9 && _iterator9['return']) {
        _iterator9['return']();
      }
    } finally {
      if (_didIteratorError9) {
        throw _iteratorError9;
      }
    }
  }
}

function bodyToBB(body) {
  var b = body.parts[0].bounds;
  var w = b.max.x - b.min.x;
  var h = b.max.y - b.min.y;
  return {
    x: b.min.x + w / 2,
    y: b.min.y + h / 2,
    width: w,
    height: h
  };
}

function resolveCollisions() {
  var _iteratorNormalCompletion10 = true;
  var _didIteratorError10 = false;
  var _iteratorError10 = undefined;

  try {
    for (var _iterator10 = hitQueue[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
      var h = _step10.value;

      var e1 = h[0];
      var e2 = h[1];
      var m1 = world.mask[e1];
      var m2 = world.mask[e2];

      var _iteratorNormalCompletion11 = true;
      var _didIteratorError11 = false;
      var _iteratorError11 = undefined;

      try {
        for (var _iterator11 = collisionHandlers[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
          var c = _step11.value;

          if (m1 & c.type1 && m2 & c.type2) c.handler(e1, e2);else if (m1 & c.type2 && m2 & c.type1) c.handler(e2, e1);
        }
      } catch (err) {
        _didIteratorError11 = true;
        _iteratorError11 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion11 && _iterator11['return']) {
            _iterator11['return']();
          }
        } finally {
          if (_didIteratorError11) {
            throw _iteratorError11;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError10 = true;
    _iteratorError10 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion10 && _iterator10['return']) {
        _iterator10['return']();
      }
    } finally {
      if (_didIteratorError10) {
        throw _iteratorError10;
      }
    }
  }
}

var collisionHandlers = [];

function onCollide(type1, type2, handler) {
  collisionHandlers.push({ type1: type1, type2: type2, handler: handler });
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Input

// Keyboard keycodes
var K_LEFT = 37,
    K_RIGHT = 39,
    K_SPACE = 32;

var keys = {};
var justChanged = {}; // Keep track of which keys have just been pressed/released

function initKeyListeners() {
  window.addEventListener('keydown', function (e) {
    justChanged[e.which] = keys[e.which] === false || keys[e.which] === undefined;
    keys[e.which] = true;
  });
  window.addEventListener('keyup', function (e) {
    justChanged[e.which] = keys[e.which] === true || keys[e.which] === undefined;
    keys[e.which] = false;
  });
}

var velocity = 0.1;
var jumpVelocity = 3;
var jumping = true;
var doubleJumping = true;
var canDoubleJump = false;

function applyForce(body, force) {
  Matter.Body.applyForce(body, body.position, force);
}

function controls() {
  if (!(world.mask[munster] & C_INPUT)) return;

  var body = world.body[munster];
  var multiplier = jumping ? 0.5 : 1;

  // Horizontal moves
  if (keys[K_LEFT]) {
    applyForce(body, point(-velocity * multiplier, 0));
    munsterRotation -= munsterRotationStep;
  }
  if (keys[K_RIGHT]) {
    applyForce(body, point(velocity * multiplier, 0));
    munsterRotation += munsterRotationStep;
  }

  // If the jump key was just pressed...
  if (keys[K_SPACE] && justChanged[K_SPACE]) {

    if (jumping === false) {
      applyForce(body, point(0, -jumpVelocity));
      jumping = true;
      sfx_play('sfx-jump');
    }

    // Double jump!
    else if (canDoubleJump && jumping === true && doubleJumping === false && body.velocity.y > 0) {
        applyForce(body, point(0, -jumpVelocity));
        doubleJumping = true;
        sfx_play('sfx-flap');
      }
  }

  // Clear
  justChanged = {};
}

function deactivateControls(sleep) {
  world.mask[munster] &= ~C_INPUT;
  if (sleep) Matter.Sleeping.set(world.body[munster], true);
}

function activateControls() {
  world.mask[munster] |= C_INPUT;
  Matter.Sleeping.set(world.body[munster], false);
}

function controlsActivated() {
  return testEntity(munster, C_INPUT);
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Audio

var sfx_cache = {};

function sfx_play(id) {
  // Find first unused channel
  var _iteratorNormalCompletion12 = true;
  var _didIteratorError12 = false;
  var _iteratorError12 = undefined;

  try {
    for (var _iterator12 = sfx_cache[id][Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
      var c = _step12.value;

      if (c.currentTime === 0 || c.ended) {
        c.play();
        return;
      }
    }
  } catch (err) {
    _didIteratorError12 = true;
    _iteratorError12 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion12 && _iterator12['return']) {
        _iterator12['return']();
      }
    } finally {
      if (_didIteratorError12) {
        throw _iteratorError12;
      }
    }
  }
}

var channels = 4;

function initAudio() {
  document.getElementById('bgm').play();

  var _iteratorNormalCompletion13 = true;
  var _didIteratorError13 = false;
  var _iteratorError13 = undefined;

  try {
    for (var _iterator13 = Array.from(document.querySelectorAll('.sfx'))[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
      var a = _step13.value;

      sfx_cache[a.id] = [a];
      for (var i = 1; i < channels; ++i) {
        sfx_cache[a.id].push(new Audio(a.src));
      }
    }
  } catch (err) {
    _didIteratorError13 = true;
    _iteratorError13 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion13 && _iterator13['return']) {
        _iterator13['return']();
      }
    } finally {
      if (_didIteratorError13) {
        throw _iteratorError13;
      }
    }
  }

  var _iteratorNormalCompletion14 = true;
  var _didIteratorError14 = false;
  var _iteratorError14 = undefined;

  try {
    for (var _iterator14 = sfx_cache['sfx-pickup-coin'][Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
      a = _step14.value;

      a.volume = 0.15;
    }
  } catch (err) {
    _didIteratorError14 = true;
    _iteratorError14 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion14 && _iterator14['return']) {
        _iterator14['return']();
      }
    } finally {
      if (_didIteratorError14) {
        throw _iteratorError14;
      }
    }
  }

  var _iteratorNormalCompletion15 = true;
  var _didIteratorError15 = false;
  var _iteratorError15 = undefined;

  try {
    for (var _iterator15 = sfx_cache['sfx-pickup-powerup'][Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
      a = _step15.value;

      a.volume = 0.3;
    }
  } catch (err) {
    _didIteratorError15 = true;
    _iteratorError15 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion15 && _iterator15['return']) {
        _iterator15['return']();
      }
    } finally {
      if (_didIteratorError15) {
        throw _iteratorError15;
      }
    }
  }

  var _iteratorNormalCompletion16 = true;
  var _didIteratorError16 = false;
  var _iteratorError16 = undefined;

  try {
    for (var _iterator16 = sfx_cache['sfx-hit'][Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
      a = _step16.value;

      a.volume = 0.15;
    }
  } catch (err) {
    _didIteratorError16 = true;
    _iteratorError16 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion16 && _iterator16['return']) {
        _iterator16['return']();
      }
    } finally {
      if (_didIteratorError16) {
        throw _iteratorError16;
      }
    }
  }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Entry point

document.addEventListener('DOMContentLoaded', init);

function init() {
  initCanvas();
  initAudio();
  initPhysics();
  initKeyListeners();
  initWorld(startLoop);

  onCollide(C_MUNSTER, C_COIN, function (m, c) {
    sfx_play('sfx-pickup-coin');
    destroyEntity(c);
    collectedCoins++;
    collectedCoinIds.push(c);
  });

  onCollide(C_MUNSTER, C_FLY, function (m, f) {
    // 1. Detect fly collision
    // TODO: 2. ???
    // TODO: 3. PROFIT!

    // Multiple collisions are handled once
    if (!controlsActivated()) return;

    flash(255, 255, 255, 5);
    sfx_play('sfx-hit');
    deactivateControls(false);

    // Throw in the air
    var dir = vec_unit(vec_minus(world.body[m].position, world.position[f]));
    dir.y = -0.4;
    applyForce(world.body[m], dir);

    totalDeaths++;

    setTimeout(function () {
      resetMunster();
      activateControls();
    }, 2000);
  });

  onCollide(C_MUNSTER, C_WORM, function (m, w) {
    // Throw in the air
    var dir = vec_unit(vec_minus(world.body[m].position, world.position[w]));
    dir.y += -1;
    dir = vec_mult(dir, 0.25);
    applyForce(world.body[m], dir);
  });

  onCollide(C_MUNSTER, C_WINGS, function (m, w) {
    if (!acquireWings) startAcquireWings(w);
  });

  onCollide(C_MUNSTER, C_HORNS, function (m, h) {
    if (!acquireHorns) startAcquireHorns(h);
  });

  onCollide(C_MUNSTER, C_CHECKPOINT, function (m, c) {
    checkpoint(c);
  });
}

function updatePhysics(dt, now) {
  Matter.Engine.update(engine, dt);
}

var reqId;
var lastFrameTime;

function startLoop() {
  var now = performance.now();
  lastFrameTime = now;
  Matter.Engine.run(engine);
  loop(now);
}

function stopLoop() {
  cancelAnimationFrame(reqId);
}

function loop(now) {
  var dt = now - lastFrameTime;
  lastFrameTime = now;

  controls();
  updatePatrol(dt, now);
  updateMeanPeople(dt, now);
  updateTransitions(dt, now);
  updateFloating(dt, now);
  //updatePhysics(dt, now)
  checkCollisions();
  resolveCollisions();

  render();

  reqId = requestAnimationFrame(loop);
}
