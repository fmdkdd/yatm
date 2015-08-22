function cubicBezier(c, d) {
  var a = point(0,0)
  var b = point(1,1)

  return function(t) {
    var u = (1 - t)
    var u2 = u * u
    var u3 = u2 * u
    var t2 = t * t
    var t3 = t2 * t

    var r = vec_mult(a, u3)
    r = vec_plus(r, vec_mult(c, 3 * u2 * t))
    r = vec_plus(r, vec_mult(d, 3 * u * t2))
    r = vec_plus(r, vec_mult(b, t3))

    return r.x
  }
}

var transition = {
  expire: false,

  new(obj, from, to, length, bezier) {

    return {
      __proto__: this,
      startTime: performance.now(),
      obj, from, to, length, bezier}
  },

  update(now) {
    var dt = now - this.startTime
    var t = dt / this.length

    if (t > 1) {
      this.expire = true
      return
    }

    var f = this.bezier(t)
    for (var p in this.to) {
      this.obj[p] = this.from[p] + f * (this.to[p] - this.from[p])
    }
  }
}

var activeTransitions = []

function updateTransitions(dt, now) {
  var newTransitions = []
  for (var t of activeTransitions) {
    t.update(now)
    if (!t.expire)
      newTransitions.push(t)
  }
  activeTransitions = newTransitions
}
