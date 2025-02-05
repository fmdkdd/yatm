/** Utilities for testing collisions between axis-aligned bounding boxes. */

/**
 * Return a point of coordinates (X,Y).
 */
function point(x, y) {
  return {x, y}
}

/**
 * Create a box with from the coordinates of its TOP_LEFT corner, its
 * WIDTH and its HEIGHT.
 */
function box(top_left, width, height) {
  return {x: top_left.x, y: top_left.y, width, height}
}

/**
 * Return the center point of BOX.
 */
function box_center(box) {
  return point(box.x + box.width  / 2,
               box.y + box.height / 2)
}

/**
 * Return all the corners of BOX as an array of points.
 */
function box_corners(box) {
  return [
    point(box.x, box.y),
    point(box.x + box.width, box.y),
    point(box.x + box.width, box.y + box.height),
    point(box.x, box.y + box.height),
  ]
}

/**
 * Return true if and only if POINT lies inside BOX.
 */
function is_point_inside_box(point, box) {
  return point.x >= box.x && point.x <= box.x + box.width
      && point.y >= box.y && point.y <= box.y + box.height
}

/**
 * Return true if and only if BOX1 and BOX2 have some overlap.
 */
function do_boxes_collide(box1, box2) {
  // Consequence of the Separation Axis Theorem (SAT): if the two boxes overlap,
  // their projections on the two axes overlap as well.  Conversely, if there is
  // a gap in one axis, then the boxes do not overlap.
  return box1.x <= box2.x + box2.width && box1.x + box1.width >= box2.x
      && box1.y <= box2.y + box2.height && box1.y + box1.height >= box2.y
}

/**
 * Return true if convex polygons POLY1 and POLY2 overlap.  Both arguments are
 * arrays of vertices describing the polygons.  The array of vertices is open
 * (i.e., there are as many points in the array as there are sides to the
 * polygon).
 */
function do_polygons_collide(poly1, poly2) {
  // Use the SAT theorem for determining if the two convex polygons collide.
  return no_separation_axis(poly1, poly2) && no_separation_axis(poly2, poly1)
}

/**
 * Return true if there is no separation axis between POLY1 and POLY2, checking
 * only for the axes of POLY1.
 *
 * Used by do_polygons_collide.
 */
function no_separation_axis(poly1, poly2) {
  for (var axis of get_axes(poly1)) {
    var p1 = project(poly1, axis)
    var p2 = project(poly2, axis)
    if (!overlap(p1, p2))
      return false
  }

  return true
}

/**
 * Return the list of axes of POLY used to find a separation axis by
 * no_separation_axis.  The list is returned as an array of vectors.
 */
function get_axes(poly) {
  // For each edge of the polygon, return its normal.

  var axes = []
  for (var i = 0; i < poly.length; ++i) {
    var p0 = poly[i]
    var p1 = poly[(i + 1) % poly.length]
    var edge = vec_minus(p0, p1)
    var normal = vec_unit(vec_perp(edge))
    // We return the normalized axis, though it is only necessary if we wish to
    // find the minimum translation between the polygons.
    axes.push(normal)
  }

  return axes
}

/**
 * Return the interval obtained by projecting POLY onto AXIS.
 * The interval is an object {min, max}.
 */
function project(poly, axis) {
  // To project the polygon onto the axis, dot product each vertex with the
  // axis, and keep the min and max values.

  var min = +Infinity
  var max = -Infinity

  for (var vert of poly) {
    var p = vec_dot(axis, vert)
    if (p < min) min = p
    if (p > max) max = p
  }

  return {min, max}
}

/**
 * Return true if projections PROJ1 and PROJ2 overlap.
 */
function overlap(proj1, proj2) {
  // Compare bounds of interval.  Single axis version of do_boxes_collide.
  return proj1.min <= proj2.max && proj1.max >= proj2.min
}

function vec_length(v) {
  return Math.sqrt(v.x*v.x + v.y*v.y)
}

function vec_unit(v) {
  var l = vec_length(v)
  return point(v.x / l, v.y / l)
}

function vec_perp(v) {
  return point(-v.y, v.x)
}

function vec_plus(u, v) {
  return point(u.x + v.x, u.y + v.y)
}

function vec_minus(u, v) {
  return point(u.x - v.x, u.y - v.y)
}

function vec_mult(v, s) {
  return point(v.x * s, v.y * s)
}

function vec_dot(u, v) {
  return u.x * v.x + u.y * v.y
}

function vec_rotate(v, a) {
  var cos = Math.cos(a)
  var sin = Math.sin(a)
  return point(v.x * cos - v.y * sin,
               v.x * sin + v.y * cos)
}

function mod(x, n) {
  if (isNaN(x))
    return x
  else if (x >= 0)
    return x % n
  else return mod(x + n, n)
}

function clamp(x, m, n) {
  var a, b
  if (m < n) { a = m; b = n}
  else { a = n; b = m }
  if (x < a) return a
  else if (x > b) return b
  else return x
}

/**
 * Rotate POLY along ANGLE, then translate it along VEC, and return the result
 * as a new polygon.
 *
 * Useful for projecting hitboxes of rotating, moving objects which store their
 * hitboxes as relative coordinates.
 */
function adjust_hitbox(poly, vec, angle) {
  var p = []
  for (var v of poly) {
    p.push(vec_plus(vec_rotate(v, angle), vec))
  }
  return p
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

var emptySet = new Set()

var spatialHash = {
  new(cellSize) {
    return {
      __proto__: this,
      cellSize,
      map: new Map(),
    }
  },

  /** Return the cell coordinates of POINT. */
  cellFromPoint(point) {
    var x = Math.floor(point.x / this.cellSize)
    var y = Math.floor(point.y / this.cellSize)
    return {x, y}
  },

  /** Return the hash value of CELL, used as a key into the grid map. */
  hashCell(cell) {
    return cell.x + '%' + cell.y
  },

  /** Return an array of the cells overlapping with the given axis-aligned
      bounding BOX. */
  cellsIntersectingWith(box) {
    var cells = []
    var start = this.cellFromPoint(box)
    var end = this.cellFromPoint({x: box.x + box.width,
                                  y: box.y + box.height})

    for (var x = start.x; x <= end.x; ++x)
      for (var y = start.y; y <= end.y; ++y)
        cells.push({x,y})

    return cells
  },

  insertObjectInCell(obj, cell) {
    var h = this.hashCell(cell)
    if (!this.map.has(h))
      this.map.set(h, new Set())

    this.map.get(h).add(obj)
  },

  /** Insert OBJECT in the grid, based on the coordinates of the axis-aligned
      bounding BOX.  As the bounding box can overlap multiple grid cells, we
      insert the object into all the intersecting cells. */
  insertObjectWithBoundingBox(obj, box) {
    for (var c of this.cellsIntersectingWith(box))
        this.insertObjectInCell(obj, c)
  },

  /** Return the set of objects present in CELL. */
  objectsInCell(cell) {
    return this.map.get(this.hashCell(cell))
           || emptySet
  },

  /** Return the set of objects present in the cell of the grid POINT is
      in. */
  objectsNearPoint(point) {
    return this.map.get(this.hashCell(this.cellFromPoint(point)))
           || emptySet
  },

  /** Return the set of objects present in all the cells overlapping with the
      axis-aligned bounding BOX. */
  objectsNearBoundingBox(box) {
    var objs = new Set()

    for (var c of this.cellsIntersectingWith(box))
      for (var o of this.map.get(this.hashCell(c)))
        objs.add(o)

    return objs
  },

  /** Remove all objects in CELL. */
  clearCell(cell) {
    this.map.get(this.hashCell(cell)).clear()
  },

  /** Remove all objects from the grid.  Cells are not deallocated. */
  clearAllCells() {
    for (var kv of this.map)
      kv[1].clear()
  },

  printStats() {
    var avg = 0
    for (var kv of this.map)
      avg += kv[1].size
    avg /= this.map.size

    console.log('Allocated cells', this.map.size)
    console.log('Average objects per cell', avg)
  }
}
