var _typeof = require("./typeof.js")["default"];
var checkInRHS = require("./checkInRHS.js");
var setFunctionName = require("./setFunctionName.js");
var toPropertyKey = require("./toPropertyKey.js");
function applyDecs2305(e, t, r, n, o, a) {
  function i(e, t, r) {
    return function (n, o) {
      return r && r(n), e[t].call(n, o);
    };
  }
  function c(e, t) {
    for (var r = 0; r < e.length; r++) e[r].call(t);
    return t;
  }
  function s(e, t, r, n) {
    if ("function" != typeof e && (n || void 0 !== e)) throw new TypeError(t + " must " + (r || "be") + " a function" + (n ? "" : " or undefined"));
    return e;
  }
  function applyDec(e, t, r, n, o, a, c, u, l, f, p, d, h) {
    function m(e) {
      if (!h(e)) throw new TypeError("Attempted to access private element on non-instance");
    }
    var y,
      v,
      g = t[0],
      b = t[3],
      w = !u;
    if (!w) {
      r || Array.isArray(g) || (g = [g]);
      var S = {},
        A = [],
        P = 3 === o ? "get" : 4 === o || d ? "set" : "value";
      f ? (p || d ? S = {
        get: setFunctionName(function () {
          return b(this);
        }, n, "get"),
        set: function set(e) {
          t[4](this, e);
        }
      } : S[P] = b, p || setFunctionName(S[P], n, 2 === o ? "" : P)) : p || (S = Object.getOwnPropertyDescriptor(e, n));
    }
    for (var j = g.length - 1; j >= 0; j -= r ? 2 : 1) {
      var D = g[j],
        E = r ? g[j - 1] : void 0,
        I = {},
        O = {
          kind: ["field", "accessor", "method", "getter", "setter", "class"][o],
          name: n,
          metadata: a,
          addInitializer: function (e, t) {
            if (e.v) throw new Error("attempted to call addInitializer after decoration was finished");
            s(t, "An initializer", "be", !0), c.push(t);
          }.bind(null, I)
        };
      try {
        if (w) v = D.call(E, e, O);else {
          var k, F;
          O["static"] = l, O["private"] = f, f || !p && 2 !== o ? 2 === o ? k = function k(e) {
            return m(e), S.value;
          } : ((o < 2 || 3 === o) && (k = i(S, "get", f && m)), (o < 2 || 4 === o) && (F = i(S, "set", f && m))) : (k = function k(e) {
            return e[n];
          }, p && (F = function F(e, t) {
            e[n] = t;
          }));
          var N = O.access = {
            has: f ? h.bind() : function (e) {
              return n in e;
            }
          };
          if (k && (N.get = k), F && (N.set = F), v = D.call(E, d ? {
            get: S.get,
            set: S.set
          } : S[P], O), d) {
            if ("object" == _typeof(v) && v) (y = s(v.get, "accessor.get")) && (S.get = y), (y = s(v.set, "accessor.set")) && (S.set = y), (y = s(v.init, "accessor.init")) && A.push(y);else if (void 0 !== v) throw new TypeError("accessor decorators must return an object with get, set, or init properties or void 0");
          } else s(v, (p ? "field" : "method") + " decorators", "return") && (p ? A.push(v) : S[P] = v);
        }
      } finally {
        I.v = !0;
      }
    }
    return (p || d) && u.push(function (e, t) {
      for (var r = A.length - 1; r >= 0; r--) t = A[r].call(e, t);
      return t;
    }), p || w || (f ? d ? u.push(i(S, "get"), i(S, "set")) : u.push(2 === o ? S[P] : i.call.bind(S[P])) : Object.defineProperty(e, n, S)), v;
  }
  function u(e, t) {
    return Object.defineProperty(e, Symbol.metadata || Symbol["for"]("Symbol.metadata"), {
      configurable: !0,
      enumerable: !0,
      value: t
    });
  }
  if (arguments.length >= 6) var l = a[Symbol.metadata || Symbol["for"]("Symbol.metadata")];
  var f = Object.create(null == l ? null : l),
    p = function (e, t, r, n) {
      var o,
        a,
        i = [],
        s = function s(t) {
          return checkInRHS(t) === e;
        },
        u = new Map();
      function l(e) {
        e && i.push(c.bind(null, e));
      }
      for (var f = 0; f < t.length; f++) {
        var p = t[f];
        if (Array.isArray(p)) {
          var d = p[1],
            h = p[2],
            m = p.length > 3,
            y = 16 & d,
            v = !!(8 & d),
            g = 0 == (d &= 7),
            b = h + "/" + v;
          if (!g && !m) {
            var w = u.get(b);
            if (!0 === w || 3 === w && 4 !== d || 4 === w && 3 !== d) throw new Error("Attempted to decorate a public method/accessor that has the same name as a previously decorated public method/accessor. This is not currently supported by the decorators plugin. Property name was: " + h);
            u.set(b, !(d > 2) || d);
          }
          applyDec(v ? e : e.prototype, p, y, m ? "#" + h : toPropertyKey(h), d, n, v ? a = a || [] : o = o || [], i, v, m, g, 1 === d, v && m ? s : r);
        }
      }
      return l(o), l(a), i;
    }(e, t, o, f);
  return r.length || u(e, f), {
    e: p,
    get c() {
      var t = [];
      return r.length && [u(s(applyDec(e, [r], n, e.name, 5, f, t), "class decorators", "return") || e, f), c.bind(null, t, e)];
    }
  };
}
module.exports = applyDecs2305, module.exports.__esModule = true, module.exports["default"] = module.exports;