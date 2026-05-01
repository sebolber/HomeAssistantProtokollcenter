/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const te = globalThis, be = te.ShadowRoot && (te.ShadyCSS === void 0 || te.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ve = Symbol(), $e = /* @__PURE__ */ new WeakMap();
let Ie = class {
  constructor(e, s, i) {
    if (this._$cssResult$ = !0, i !== ve) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (be && e === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (e = $e.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && $e.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Qe = (t) => new Ie(typeof t == "string" ? t : t + "", void 0, ve), k = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((i, r, a) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + t[a + 1], t[0]);
  return new Ie(s, t, ve);
}, Ke = (t, e) => {
  if (be) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const i = document.createElement("style"), r = te.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = s.cssText, t.appendChild(i);
  }
}, we = be ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const i of e.cssRules) s += i.cssText;
  return Qe(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: qe, defineProperty: Ge, getOwnPropertyDescriptor: Ye, getOwnPropertyNames: Ze, getOwnPropertySymbols: Xe, getPrototypeOf: et } = Object, C = globalThis, ke = C.trustedTypes, tt = ke ? ke.emptyScript : "", de = C.reactiveElementPolyfillSupport, Q = (t, e) => t, se = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? tt : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let s = t;
  switch (e) {
    case Boolean:
      s = t !== null;
      break;
    case Number:
      s = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        s = JSON.parse(t);
      } catch {
        s = null;
      }
  }
  return s;
} }, me = (t, e) => !qe(t, e), Ae = { attribute: !0, type: String, converter: se, reflect: !1, useDefault: !1, hasChanged: me };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), C.litPropertyMetadata ?? (C.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let I = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = Ae) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(e, i, s);
      r !== void 0 && Ge(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, s, i) {
    const { get: r, set: a } = Ye(this.prototype, e) ?? { get() {
      return this[s];
    }, set(o) {
      this[s] = o;
    } };
    return { get: r, set(o) {
      const c = r == null ? void 0 : r.call(this);
      a == null || a.call(this, o), this.requestUpdate(e, c, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Ae;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Q("elementProperties"))) return;
    const e = et(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Q("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Q("properties"))) {
      const s = this.properties, i = [...Ze(s), ...Xe(s)];
      for (const r of i) this.createProperty(r, s[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const s = litPropertyMetadata.get(e);
      if (s !== void 0) for (const [i, r] of s) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, i] of this.elementProperties) {
      const r = this._$Eu(s, i);
      r !== void 0 && this._$Eh.set(r, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const s = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const r of i) s.unshift(we(r));
    } else e !== void 0 && s.push(we(e));
    return s;
  }
  static _$Eu(e, s) {
    const i = s.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((s) => this.enableUpdating = s), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((s) => s(this));
  }
  addController(e) {
    var s;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((s = e.hostConnected) == null || s.call(e));
  }
  removeController(e) {
    var s;
    (s = this._$EO) == null || s.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
    for (const i of s.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Ke(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((s) => {
      var i;
      return (i = s.hostConnected) == null ? void 0 : i.call(s);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((s) => {
      var i;
      return (i = s.hostDisconnected) == null ? void 0 : i.call(s);
    });
  }
  attributeChangedCallback(e, s, i) {
    this._$AK(e, i);
  }
  _$ET(e, s) {
    var a;
    const i = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, i);
    if (r !== void 0 && i.reflect === !0) {
      const o = (((a = i.converter) == null ? void 0 : a.toAttribute) !== void 0 ? i.converter : se).toAttribute(s, i.type);
      this._$Em = e, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(e, s) {
    var a, o;
    const i = this.constructor, r = i._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const c = i.getPropertyOptions(r), n = typeof c.converter == "function" ? { fromAttribute: c.converter } : ((a = c.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? c.converter : se;
      this._$Em = r;
      const h = n.fromAttribute(s, c.type);
      this[r] = h ?? ((o = this._$Ej) == null ? void 0 : o.get(r)) ?? h, this._$Em = null;
    }
  }
  requestUpdate(e, s, i, r = !1, a) {
    var o;
    if (e !== void 0) {
      const c = this.constructor;
      if (r === !1 && (a = this[e]), i ?? (i = c.getPropertyOptions(e)), !((i.hasChanged ?? me)(a, s) || i.useDefault && i.reflect && a === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(c._$Eu(e, i)))) return;
      this.C(e, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: i, reflect: r, wrapped: a }, o) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, o ?? s ?? this[e]), a !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (s = void 0), this._$AL.set(e, s)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (s) {
      Promise.reject(s);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [a, o] of this._$Ep) this[a] = o;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [a, o] of r) {
        const { wrapped: c } = o, n = this[a];
        c !== !0 || this._$AL.has(a) || n === void 0 || this.C(a, void 0, o, n);
      }
    }
    let e = !1;
    const s = this._$AL;
    try {
      e = this.shouldUpdate(s), e ? (this.willUpdate(s), (i = this._$EO) == null || i.forEach((r) => {
        var a;
        return (a = r.hostUpdate) == null ? void 0 : a.call(r);
      }), this.update(s)) : this._$EM();
    } catch (r) {
      throw e = !1, this._$EM(), r;
    }
    e && this._$AE(s);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var s;
    (s = this._$EO) == null || s.forEach((i) => {
      var r;
      return (r = i.hostUpdated) == null ? void 0 : r.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((s) => this._$ET(s, this[s]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
I.elementStyles = [], I.shadowRootOptions = { mode: "open" }, I[Q("elementProperties")] = /* @__PURE__ */ new Map(), I[Q("finalized")] = /* @__PURE__ */ new Map(), de == null || de({ ReactiveElement: I }), (C.reactiveElementVersions ?? (C.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const K = globalThis, Se = (t) => t, re = K.trustedTypes, Ee = re ? re.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Re = "$lit$", P = `lit$${Math.random().toFixed(9).slice(2)}$`, Fe = "?" + P, st = `<${Fe}>`, D = document, q = () => D.createComment(""), G = (t) => t === null || typeof t != "object" && typeof t != "function", _e = Array.isArray, rt = (t) => _e(t) || typeof (t == null ? void 0 : t[Symbol.iterator]) == "function", he = `[ 	
\f\r]`, V = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Te = /-->/g, Pe = />/g, z = RegExp(`>|${he}(?:([^\\s"'>=/]+)(${he}*=${he}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ce = /'/g, Oe = /"/g, We = /^(?:script|style|textarea|title)$/i, it = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), l = it(1), j = Symbol.for("lit-noChange"), b = Symbol.for("lit-nothing"), ze = /* @__PURE__ */ new WeakMap(), N = D.createTreeWalker(D, 129);
function Be(t, e) {
  if (!_e(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ee !== void 0 ? Ee.createHTML(e) : e;
}
const ot = (t, e) => {
  const s = t.length - 1, i = [];
  let r, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = V;
  for (let c = 0; c < s; c++) {
    const n = t[c];
    let h, g, d = -1, f = 0;
    for (; f < n.length && (o.lastIndex = f, g = o.exec(n), g !== null); ) f = o.lastIndex, o === V ? g[1] === "!--" ? o = Te : g[1] !== void 0 ? o = Pe : g[2] !== void 0 ? (We.test(g[2]) && (r = RegExp("</" + g[2], "g")), o = z) : g[3] !== void 0 && (o = z) : o === z ? g[0] === ">" ? (o = r ?? V, d = -1) : g[1] === void 0 ? d = -2 : (d = o.lastIndex - g[2].length, h = g[1], o = g[3] === void 0 ? z : g[3] === '"' ? Oe : Ce) : o === Oe || o === Ce ? o = z : o === Te || o === Pe ? o = V : (o = z, r = void 0);
    const u = o === z && t[c + 1].startsWith("/>") ? " " : "";
    a += o === V ? n + st : d >= 0 ? (i.push(h), n.slice(0, d) + Re + n.slice(d) + P + u) : n + P + (d === -2 ? c : u);
  }
  return [Be(t, a + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class Y {
  constructor({ strings: e, _$litType$: s }, i) {
    let r;
    this.parts = [];
    let a = 0, o = 0;
    const c = e.length - 1, n = this.parts, [h, g] = ot(e, s);
    if (this.el = Y.createElement(h, i), N.currentNode = this.el.content, s === 2 || s === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (r = N.nextNode()) !== null && n.length < c; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const d of r.getAttributeNames()) if (d.endsWith(Re)) {
          const f = g[o++], u = r.getAttribute(d).split(P), v = /([.?@])?(.*)/.exec(f);
          n.push({ type: 1, index: a, name: v[2], strings: u, ctor: v[1] === "." ? nt : v[1] === "?" ? lt : v[1] === "@" ? ct : ae }), r.removeAttribute(d);
        } else d.startsWith(P) && (n.push({ type: 6, index: a }), r.removeAttribute(d));
        if (We.test(r.tagName)) {
          const d = r.textContent.split(P), f = d.length - 1;
          if (f > 0) {
            r.textContent = re ? re.emptyScript : "";
            for (let u = 0; u < f; u++) r.append(d[u], q()), N.nextNode(), n.push({ type: 2, index: ++a });
            r.append(d[f], q());
          }
        }
      } else if (r.nodeType === 8) if (r.data === Fe) n.push({ type: 2, index: a });
      else {
        let d = -1;
        for (; (d = r.data.indexOf(P, d + 1)) !== -1; ) n.push({ type: 7, index: a }), d += P.length - 1;
      }
      a++;
    }
  }
  static createElement(e, s) {
    const i = D.createElement("template");
    return i.innerHTML = e, i;
  }
}
function R(t, e, s = t, i) {
  var o, c;
  if (e === j) return e;
  let r = i !== void 0 ? (o = s._$Co) == null ? void 0 : o[i] : s._$Cl;
  const a = G(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== a && ((c = r == null ? void 0 : r._$AO) == null || c.call(r, !1), a === void 0 ? r = void 0 : (r = new a(t), r._$AT(t, s, i)), i !== void 0 ? (s._$Co ?? (s._$Co = []))[i] = r : s._$Cl = r), r !== void 0 && (e = R(t, r._$AS(t, e.values), r, i)), e;
}
class at {
  constructor(e, s) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = s;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: s }, parts: i } = this._$AD, r = ((e == null ? void 0 : e.creationScope) ?? D).importNode(s, !0);
    N.currentNode = r;
    let a = N.nextNode(), o = 0, c = 0, n = i[0];
    for (; n !== void 0; ) {
      if (o === n.index) {
        let h;
        n.type === 2 ? h = new B(a, a.nextSibling, this, e) : n.type === 1 ? h = new n.ctor(a, n.name, n.strings, this, e) : n.type === 6 && (h = new dt(a, this, e)), this._$AV.push(h), n = i[++c];
      }
      o !== (n == null ? void 0 : n.index) && (a = N.nextNode(), o++);
    }
    return N.currentNode = D, r;
  }
  p(e) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, s), s += i.strings.length - 2) : i._$AI(e[s])), s++;
  }
}
class B {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, s, i, r) {
    this.type = 2, this._$AH = b, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = i, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const s = this._$AM;
    return s !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = s.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, s = this) {
    e = R(this, e, s), G(e) ? e === b || e == null || e === "" ? (this._$AH !== b && this._$AR(), this._$AH = b) : e !== this._$AH && e !== j && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : rt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== b && G(this._$AH) ? this._$AA.nextSibling.data = e : this.T(D.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var a;
    const { values: s, _$litType$: i } = e, r = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = Y.createElement(Be(i.h, i.h[0]), this.options)), i);
    if (((a = this._$AH) == null ? void 0 : a._$AD) === r) this._$AH.p(s);
    else {
      const o = new at(r, this), c = o.u(this.options);
      o.p(s), this.T(c), this._$AH = o;
    }
  }
  _$AC(e) {
    let s = ze.get(e.strings);
    return s === void 0 && ze.set(e.strings, s = new Y(e)), s;
  }
  k(e) {
    _e(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, r = 0;
    for (const a of e) r === s.length ? s.push(i = new B(this.O(q()), this.O(q()), this, this.options)) : i = s[r], i._$AI(a), r++;
    r < s.length && (this._$AR(i && i._$AB.nextSibling, r), s.length = r);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, s); e !== this._$AB; ) {
      const r = Se(e).nextSibling;
      Se(e).remove(), e = r;
    }
  }
  setConnected(e) {
    var s;
    this._$AM === void 0 && (this._$Cv = e, (s = this._$AP) == null || s.call(this, e));
  }
}
class ae {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, s, i, r, a) {
    this.type = 1, this._$AH = b, this._$AN = void 0, this.element = e, this.name = s, this._$AM = r, this.options = a, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = b;
  }
  _$AI(e, s = this, i, r) {
    const a = this.strings;
    let o = !1;
    if (a === void 0) e = R(this, e, s, 0), o = !G(e) || e !== this._$AH && e !== j, o && (this._$AH = e);
    else {
      const c = e;
      let n, h;
      for (e = a[0], n = 0; n < a.length - 1; n++) h = R(this, c[i + n], s, n), h === j && (h = this._$AH[n]), o || (o = !G(h) || h !== this._$AH[n]), h === b ? e = b : e !== b && (e += (h ?? "") + a[n + 1]), this._$AH[n] = h;
    }
    o && !r && this.j(e);
  }
  j(e) {
    e === b ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class nt extends ae {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === b ? void 0 : e;
  }
}
class lt extends ae {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== b);
  }
}
class ct extends ae {
  constructor(e, s, i, r, a) {
    super(e, s, i, r, a), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = R(this, e, s, 0) ?? b) === j) return;
    const i = this._$AH, r = e === b && i !== b || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, a = e !== b && (i === b || r);
    r && this.element.removeEventListener(this.name, this, i), a && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var s;
    typeof this._$AH == "function" ? this._$AH.call(((s = this.options) == null ? void 0 : s.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class dt {
  constructor(e, s, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    R(this, e);
  }
}
const ht = { I: B }, pe = K.litHtmlPolyfillSupport;
pe == null || pe(Y, B), (K.litHtmlVersions ?? (K.litHtmlVersions = [])).push("3.3.2");
const pt = (t, e, s) => {
  const i = (s == null ? void 0 : s.renderBefore) ?? e;
  let r = i._$litPart$;
  if (r === void 0) {
    const a = (s == null ? void 0 : s.renderBefore) ?? null;
    i._$litPart$ = r = new B(e.insertBefore(q(), a), a, void 0, s ?? {});
  }
  return r._$AI(t), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis;
let y = class extends I {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var s;
    const e = super.createRenderRoot();
    return (s = this.renderOptions).renderBefore ?? (s.renderBefore = e.firstChild), e;
  }
  update(e) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = pt(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return j;
  }
};
var Le;
y._$litElement$ = !0, y.finalized = !0, (Le = M.litElementHydrateSupport) == null || Le.call(M, { LitElement: y });
const ue = M.litElementPolyfillSupport;
ue == null || ue({ LitElement: y });
(M.litElementVersions ?? (M.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const A = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ut = { attribute: !0, type: String, converter: se, reflect: !1, hasChanged: me }, ft = (t = ut, e, s) => {
  const { kind: i, metadata: r } = s;
  let a = globalThis.litPropertyMetadata.get(r);
  if (a === void 0 && globalThis.litPropertyMetadata.set(r, a = /* @__PURE__ */ new Map()), i === "setter" && ((t = Object.create(t)).wrapped = !0), a.set(s.name, t), i === "accessor") {
    const { name: o } = s;
    return { set(c) {
      const n = e.get.call(this);
      e.set.call(this, c), this.requestUpdate(o, n, t, !0, c);
    }, init(c) {
      return c !== void 0 && this.C(o, void 0, t, c), c;
    } };
  }
  if (i === "setter") {
    const { name: o } = s;
    return function(c) {
      const n = this[o];
      e.call(this, c), this.requestUpdate(o, n, t, !0, c);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function m(t) {
  return (e, s) => typeof s == "object" ? ft(t, e, s) : ((i, r, a) => {
    const o = r.hasOwnProperty(a);
    return r.constructor.createProperty(a, i), o ? Object.getOwnPropertyDescriptor(r, a) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function p(t) {
  return m({ ...t, state: !0, attribute: !1 });
}
class gt {
  constructor(e = "") {
    this.baseUrl = e, this.auth = null;
  }
  setAuth(e) {
    this.auth = { token: e };
  }
  headers() {
    const e = { "Content-Type": "application/json" };
    return this.auth && (e.Authorization = `Bearer ${this.auth.token}`), e;
  }
  async listMessages(e = {}) {
    var a;
    const s = new URLSearchParams();
    (a = e.severity) != null && a.length && s.set("severity", e.severity.join(",")), e.source && s.set("source", e.source), e.search && s.set("search", e.search), e.from && s.set("from", e.from), e.to && s.set("to", e.to), e.limit !== void 0 && s.set("limit", String(e.limit)), e.offset !== void 0 && s.set("offset", String(e.offset)), e.order && s.set("order", e.order);
    const i = `${this.baseUrl}/api/messagehub/messages?${s.toString()}`, r = await fetch(i, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }
  async getMessage(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}`, {
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return await s.json();
  }
  async deleteMessage(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  async setMessageStatus(e, s) {
    const i = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/status`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ status: s })
    });
    if (!i.ok) throw new Error(`HTTP ${i.status}: ${await i.text()}`);
  }
  async getMessageTags(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/tags`, {
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return (await s.json()).tags;
  }
  async addMessageTag(e, s) {
    const i = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tag: s })
    });
    if (!i.ok) throw new Error(`HTTP ${i.status}`);
    return (await i.json()).tags;
  }
  async removeMessageTag(e, s) {
    const i = `${this.baseUrl}/api/messagehub/messages/${e}/tags?tag=${encodeURIComponent(s)}`, r = await fetch(i, { method: "DELETE", headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()).tags;
  }
  async getRunbookForSource(e, s) {
    const i = s ? `?fingerprint=${encodeURIComponent(s)}` : "", r = await fetch(
      `${this.baseUrl}/api/messagehub/runbook/${encodeURIComponent(e)}${i}`,
      { headers: this.headers() }
    );
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }
  async listAudit(e = 200) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/audit?limit=${e}`, {
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return (await s.json()).items;
  }
  exportUrl(e) {
    var i;
    const s = new URLSearchParams();
    return (i = e.severity) != null && i.length && s.set("severity", e.severity.join(",")), e.source && s.set("source", e.source), e.search && s.set("search", e.search), e.from && s.set("from", e.from), e.to && s.set("to", e.to), s.set("format", e.format ?? "jsonl"), e.limit !== void 0 && s.set("limit", String(e.limit)), `${this.baseUrl}/api/messagehub/export?${s.toString()}`;
  }
  async deleteMessages(e = {}) {
    var o;
    const s = new URLSearchParams();
    (o = e.severity) != null && o.length && s.set("severity", e.severity.join(",")), e.source && s.set("source", e.source), e.search && s.set("search", e.search), e.from && s.set("from", e.from), e.to && s.set("to", e.to);
    const i = `${this.baseUrl}/api/messagehub/messages?${s.toString()}`, r = await fetch(i, { method: "DELETE", headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()).deleted;
  }
  async listSources() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/sources`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).sources;
  }
  async getStats() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/stats`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return await e.json();
  }
  async listWebhooks() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/webhooks`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).webhooks;
  }
  async createWebhook(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/webhooks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async updateWebhook(e, s) {
    const i = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${e}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(s)
      }
    );
    if (!i.ok) throw new Error(`HTTP ${i.status}: ${await i.text()}`);
    return await i.json();
  }
  async deleteWebhook(e) {
    const s = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${e}`,
      { method: "DELETE", headers: this.headers() }
    );
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const bt = { CHILD: 2 }, vt = (t) => (...e) => ({ _$litDirective$: t, values: e });
let mt = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, s, i) {
    this._$Ct = e, this._$AM = s, this._$Ci = i;
  }
  _$AS(e, s) {
    return this.update(e, s);
  }
  update(e, s) {
    return this.render(...s);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: _t } = ht, Ue = (t) => t, Ne = () => document.createComment(""), J = (t, e, s) => {
  var a;
  const i = t._$AA.parentNode, r = e === void 0 ? t._$AB : e._$AA;
  if (s === void 0) {
    const o = i.insertBefore(Ne(), r), c = i.insertBefore(Ne(), r);
    s = new _t(o, c, t, t.options);
  } else {
    const o = s._$AB.nextSibling, c = s._$AM, n = c !== t;
    if (n) {
      let h;
      (a = s._$AQ) == null || a.call(s, t), s._$AM = t, s._$AP !== void 0 && (h = t._$AU) !== c._$AU && s._$AP(h);
    }
    if (o !== r || n) {
      let h = s._$AA;
      for (; h !== o; ) {
        const g = Ue(h).nextSibling;
        Ue(i).insertBefore(h, r), h = g;
      }
    }
  }
  return s;
}, U = (t, e, s = t) => (t._$AI(e, s), t), yt = {}, xt = (t, e = yt) => t._$AH = e, $t = (t) => t._$AH, fe = (t) => {
  t._$AR(), t._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Me = (t, e, s) => {
  const i = /* @__PURE__ */ new Map();
  for (let r = e; r <= s; r++) i.set(t[r], r);
  return i;
}, wt = vt(class extends mt {
  constructor(t) {
    if (super(t), t.type !== bt.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(t, e, s) {
    let i;
    s === void 0 ? s = e : e !== void 0 && (i = e);
    const r = [], a = [];
    let o = 0;
    for (const c of t) r[o] = i ? i(c, o) : o, a[o] = s(c, o), o++;
    return { values: a, keys: r };
  }
  render(t, e, s) {
    return this.dt(t, e, s).values;
  }
  update(t, [e, s, i]) {
    const r = $t(t), { values: a, keys: o } = this.dt(e, s, i);
    if (!Array.isArray(r)) return this.ut = o, a;
    const c = this.ut ?? (this.ut = []), n = [];
    let h, g, d = 0, f = r.length - 1, u = 0, v = a.length - 1;
    for (; d <= f && u <= v; ) if (r[d] === null) d++;
    else if (r[f] === null) f--;
    else if (c[d] === o[u]) n[u] = U(r[d], a[u]), d++, u++;
    else if (c[f] === o[v]) n[v] = U(r[f], a[v]), f--, v--;
    else if (c[d] === o[v]) n[v] = U(r[d], a[v]), J(t, n[v + 1], r[d]), d++, v--;
    else if (c[f] === o[u]) n[u] = U(r[f], a[u]), J(t, r[d], r[f]), f--, u++;
    else if (h === void 0 && (h = Me(o, u, v), g = Me(c, d, f)), h.has(c[d])) if (h.has(c[f])) {
      const E = g.get(o[u]), ce = E !== void 0 ? r[E] : null;
      if (ce === null) {
        const xe = J(t, r[d]);
        U(xe, a[u]), n[u] = xe;
      } else n[u] = U(ce, a[u]), J(t, r[d], ce), r[E] = null;
      u++;
    } else fe(r[f]), f--;
    else fe(r[d]), d++;
    for (; u <= v; ) {
      const E = J(t, n[v + 1]);
      U(E, a[u]), n[u++] = E;
    }
    for (; d <= f; ) {
      const E = r[d++];
      E !== null && fe(E);
    }
    return this.ut = o, xt(t, n), j;
  }
});
var kt = Object.defineProperty, At = Object.getOwnPropertyDescriptor, Ve = (t, e, s, i) => {
  for (var r = i > 1 ? void 0 : i ? At(e, s) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (r = (i ? o(e, s, r) : o(r)) || r);
  return i && r && kt(e, s, r), r;
};
const St = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·"
}, De = {
  error: "Error",
  warning: "Warning",
  info: "Info",
  debug: "Debug"
};
let ie = class extends y {
  constructor() {
    super(...arguments), this.items = [], this._onClick = (t) => {
      this.dispatchEvent(
        new CustomEvent("select", { detail: { msg: t }, bubbles: !0, composed: !0 })
      );
    }, this._onKey = (t, e) => {
      (t.key === "Enter" || t.key === " ") && (t.preventDefault(), this._onClick(e));
    };
  }
  _renderHeader() {
    return l`
      <div class="header" role="row">
        <span class="col-icon" role="columnheader" title="Severity (Schweregrad)">
          Sev
        </span>
        <span class="col-ts" role="columnheader" title="Empfangs-Zeitpunkt (UTC)">
          Zeit
        </span>
        <span class="col-src" role="columnheader" title="Quelle / Herkunft der Nachricht">
          Quelle
        </span>
        <span class="col-text" role="columnheader" title="Nachrichten-Text (Klick: Detail)">
          Nachricht
        </span>
      </div>
    `;
  }
  render() {
    return this.items.length ? l`
      <div class="root">
        ${this._renderHeader()}
        <div class="scroll" role="list">
          ${wt(
      this.items,
      (t) => t.id,
      (t) => l`
              <div
                class=${`row sev-${t.severity}`}
                tabindex="0"
                role="listitem button"
                @click=${() => this._onClick(t)}
                @keydown=${(e) => this._onKey(e, t)}
              >
                <span
                  class="col-icon icon"
                  aria-label=${De[t.severity] ?? t.severity}
                  title=${De[t.severity] ?? t.severity}
                >
                  ${St[t.severity] ?? "·"}
                </span>
                <span class="col-ts ts">
                  ${t.timestamp.replace("T", " ").replace(/\+00:00$/, "Z")}
                </span>
                <span class="col-src src">${t.source}</span>
                <span class="col-text text">${t.text}</span>
              </div>
            `
    )}
        </div>
      </div>
    ` : l`
        <div class="root">
          ${this._renderHeader()}
          <div class="empty">Keine Nachrichten</div>
        </div>
      `;
  }
};
ie.styles = k`
    :host {
      display: block;
      flex: 1;
      overflow: hidden;
    }
    .root {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .header,
    .row {
      display: grid;
      grid-template-columns: 40px 180px 160px 1fr;
      gap: 12px;
      padding: 6px 16px;
      align-items: center;
    }
    .header {
      background: var(--secondary-background-color, #f3f3f3);
      border-bottom: 2px solid var(--divider-color, #ddd);
      font-size: 0.78em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--secondary-text-color, #666);
      padding-top: 8px;
      padding-bottom: 8px;
      position: sticky;
      top: 0;
      z-index: 1;
      cursor: default;
    }
    .header span {
      cursor: help;
    }
    .col-icon {
      text-align: center;
    }
    .col-ts {
      font-variant-numeric: tabular-nums;
    }
    .scroll {
      flex: 1;
      overflow: auto;
    }
    .row {
      border-bottom: 1px solid var(--divider-color, #eee);
      cursor: pointer;
    }
    .row:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .row:focus-visible {
      background: var(--secondary-background-color, #f3f3f3);
      outline: 2px solid var(--primary-color, #03a9f4);
      outline-offset: -2px;
    }
    .icon {
      font-size: 1.2em;
    }
    .row.sev-error .icon {
      color: var(--error-color, #db4437);
    }
    .row.sev-warning .icon {
      color: var(--warning-color, #ff9800);
    }
    .row.sev-info .icon {
      color: var(--info-color, #03a9f4);
    }
    .row.sev-debug .icon {
      color: var(--secondary-text-color, #888);
    }
    .ts {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      color: var(--secondary-text-color, #666);
    }
    .src {
      font-weight: 500;
    }
    .text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .empty {
      padding: 32px;
      text-align: center;
      color: var(--secondary-text-color, #666);
    }
    @media (max-width: 600px) {
      .header,
      .row {
        grid-template-columns: 28px 120px 1fr;
        gap: 8px;
        padding: 6px 8px;
      }
      .col-src {
        display: none;
      }
    }
  `;
Ve([
  m({ attribute: !1 })
], ie.prototype, "items", 2);
ie = Ve([
  A("message-table")
], ie);
var Et = Object.defineProperty, Tt = Object.getOwnPropertyDescriptor, Je = (t, e, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Tt(e, s) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (r = (i ? o(e, s, r) : o(r)) || r);
  return i && r && Et(e, s, r), r;
};
const je = ["error", "warning", "info", "debug"];
let oe = class extends y {
  constructor() {
    super(...arguments), this.selected = [...je];
  }
  _toggle(t) {
    const e = this.selected.includes(t) ? this.selected.filter((s) => s !== t) : [...this.selected, t];
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { severities: e },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return l`
      <div class="chips">
        ${je.map(
      (t) => l`<button
            class=${`chip sev-${t} ${this.selected.includes(t) ? "active" : ""}`}
            @click=${() => this._toggle(t)}
          >
            ${t}
          </button>`
    )}
      </div>
    `;
  }
};
oe.styles = k`
    .chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .chip {
      padding: 4px 10px;
      border-radius: 14px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      font-size: 0.85em;
      text-transform: capitalize;
    }
    .chip.active {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
    }
    .chip.sev-error.active {
      background: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    .chip.sev-warning.active {
      background: var(--warning-color, #ff9800);
      border-color: var(--warning-color, #ff9800);
    }
  `;
Je([
  m({ attribute: !1 })
], oe.prototype, "selected", 2);
oe = Je([
  A("severity-filter")
], oe);
var Pt = Object.defineProperty, Ct = Object.getOwnPropertyDescriptor, ne = (t, e, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Ct(e, s) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (r = (i ? o(e, s, r) : o(r)) || r);
  return i && r && Pt(e, s, r), r;
};
let F = class extends y {
  constructor() {
    super(...arguments), this.selected = "", this._sources = [];
  }
  async firstUpdated() {
    if (this.api)
      try {
        this._sources = await this.api.listSources();
      } catch {
        this._sources = [];
      }
  }
  _onChange(t) {
    const e = t.target.value;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { source: e },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return l`
      <select @change=${this._onChange} .value=${this.selected}>
        <option value="">Alle Quellen</option>
        ${this._sources.map((t) => l`<option value=${t}>${t}</option>`)}
      </select>
    `;
  }
};
F.styles = k`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `;
ne([
  m({ attribute: !1 })
], F.prototype, "api", 2);
ne([
  m({ attribute: !1 })
], F.prototype, "selected", 2);
ne([
  p()
], F.prototype, "_sources", 2);
F = ne([
  A("source-filter")
], F);
var Ot = Object.defineProperty, zt = Object.getOwnPropertyDescriptor, ye = (t, e, s, i) => {
  for (var r = i > 1 ? void 0 : i ? zt(e, s) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (r = (i ? o(e, s, r) : o(r)) || r);
  return i && r && Ot(e, s, r), r;
};
let Z = class extends y {
  _set(t) {
    let e;
    const s = /* @__PURE__ */ new Date();
    t === "1h" ? e = new Date(s.getTime() - 36e5).toISOString() : t === "24h" ? e = new Date(s.getTime() - 864e5).toISOString() : t === "7d" ? e = new Date(s.getTime() - 7 * 864e5).toISOString() : e = void 0, this.dispatchEvent(
      new CustomEvent("change", {
        detail: { fromIso: e, toIso: void 0 },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return l`
      <div class="presets">
        <button @click=${() => this._set("1h")}>1h</button>
        <button @click=${() => this._set("24h")}>24h</button>
        <button @click=${() => this._set("7d")}>7d</button>
        <button @click=${() => this._set("all")}>Alle</button>
      </div>
    `;
  }
};
Z.styles = k`
    .presets {
      display: flex;
      gap: 4px;
    }
    button {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
    }
  `;
ye([
  m({ attribute: !1 })
], Z.prototype, "fromIso", 2);
ye([
  m({ attribute: !1 })
], Z.prototype, "toIso", 2);
Z = ye([
  A("time-range-filter")
], Z);
var Ut = Object.defineProperty, Nt = Object.getOwnPropertyDescriptor, O = (t, e, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Nt(e, s) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (r = (i ? o(e, s, r) : o(r)) || r);
  return i && r && Ut(e, s, r), r;
};
let w = class extends y {
  constructor() {
    super(...arguments), this._status = "new", this._tags = [], this._newTag = "", this._runbook = null, this._busy = !1;
  }
  willUpdate(t) {
    t.has("msg") && this.msg && (this._status = this.msg.status ?? "new", this._loadTags(), this._loadRunbook());
  }
  async _loadTags() {
    if (!(!this.api || !this.msg))
      try {
        this._tags = await this.api.getMessageTags(this.msg.id);
      } catch {
        this._tags = [];
      }
  }
  async _loadRunbook() {
    if (!(!this.api || !this.msg))
      try {
        this._runbook = await this.api.getRunbookForSource(this.msg.source);
      } catch {
        this._runbook = null;
      }
  }
  _close() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: !0, composed: !0 }));
  }
  async _setStatus(t) {
    if (this.api) {
      this._busy = !0;
      try {
        await this.api.setMessageStatus(this.msg.id, t), this._status = t, this.dispatchEvent(
          new CustomEvent("status-change", {
            detail: { id: this.msg.id, status: t },
            bubbles: !0,
            composed: !0
          })
        );
      } catch (e) {
        this.dispatchEvent(
          new CustomEvent("error", {
            detail: { message: e.message },
            bubbles: !0,
            composed: !0
          })
        );
      } finally {
        this._busy = !1;
      }
    }
  }
  async _addTag() {
    if (!this.api || !this._newTag.trim()) return;
    const t = this._newTag.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    try {
      this._tags = await this.api.addMessageTag(this.msg.id, t), this._newTag = "";
    } catch {
    }
  }
  async _removeTag(t) {
    if (this.api)
      try {
        this._tags = await this.api.removeMessageTag(this.msg.id, t);
      } catch {
      }
  }
  async _delete() {
    confirm(`Nachricht #${this.msg.id} endgueltig loeschen?`) && this.dispatchEvent(
      new CustomEvent("delete", {
        detail: { id: this.msg.id },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _statusBadge() {
    const t = {
      new: "Neu",
      acknowledged: "Bestätigt",
      resolved: "Gelöst",
      expired: "Abgelaufen"
    };
    return l`<span class=${`status-badge status-${this._status}`}>
      ${t[this._status] ?? this._status}
    </span>`;
  }
  render() {
    return l`
      <aside>
        <header>
          <h2>
            #${this.msg.id}
            ${this._statusBadge()}
          </h2>
          <button class="close" aria-label="Schliessen" @click=${this._close}>×</button>
        </header>

        <div class="status-actions" role="group" aria-label="Status">
          <button
            ?disabled=${this._busy || this._status === "acknowledged"}
            @click=${() => this._setStatus("acknowledged")}
          >
            ✓ Bestätigen
          </button>
          <button
            ?disabled=${this._busy || this._status === "resolved"}
            @click=${() => this._setStatus("resolved")}
          >
            ✓✓ Gelöst
          </button>
          <button
            ?disabled=${this._busy || this._status === "new"}
            @click=${() => this._setStatus("new")}
          >
            ↺ Neu öffnen
          </button>
        </div>

        <dl>
          <dt>Severity</dt>
          <dd class=${`sev-${this.msg.severity}`}>${this.msg.severity}</dd>
          <dt>Source</dt>
          <dd><code>${this.msg.source}</code></dd>
          <dt>Timestamp</dt>
          <dd>${this.msg.timestamp}</dd>
          <dt>Webhook</dt>
          <dd>${this.msg.webhook_id ?? "—"}</dd>
        </dl>

        <h3>Text</h3>
        <pre class="text">${this.msg.text}</pre>

        ${this.msg.metadata ? l`<h3>Metadata</h3>
              <pre class="meta">${JSON.stringify(this.msg.metadata, null, 2)}</pre>` : b}

        <h3>Tags</h3>
        <div class="tags">
          ${this._tags.length === 0 ? l`<span class="hint">keine Tags</span>` : this._tags.map(
      (t) => l`
                  <span class="tag">
                    #${t}
                    <button
                      class="tag-remove"
                      aria-label=${`Tag ${t} entfernen`}
                      @click=${() => this._removeTag(t)}
                    >
                      ×
                    </button>
                  </span>
                `
    )}
        </div>
        <div class="tag-input">
          <input
            type="text"
            placeholder="neuer Tag"
            .value=${this._newTag}
            @input=${(t) => this._newTag = t.target.value}
            @keydown=${(t) => {
      t.key === "Enter" && this._addTag();
    }}
          />
          <button @click=${this._addTag} ?disabled=${!this._newTag.trim()}>+ Hinzufügen</button>
        </div>

        ${this._runbook ? l`<h3>Runbook: ${this._runbook.title}</h3>
              <pre class="runbook">${this._runbook.markdown}</pre>` : b}

        <footer>
          <button class="del" @click=${this._delete}>Löschen</button>
        </footer>
      </aside>
    `;
  }
};
w.styles = k`
    :host {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(480px, 100%);
      background: var(--card-background-color, white);
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
      display: flex;
      z-index: 50;
    }
    @media (max-width: 600px) {
      :host {
        width: 100%;
      }
    }
    aside {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 16px;
      overflow: auto;
      gap: 12px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--divider-color, #ddd);
      padding-bottom: 8px;
    }
    h2 {
      margin: 0;
      font-size: 1em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h3 {
      margin: 0;
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color, #666);
    }
    .status-badge {
      font-size: 0.7em;
      padding: 2px 8px;
      border-radius: 10px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 600;
    }
    .status-new {
      background: rgba(3, 169, 244, 0.15);
      color: var(--info-color, #03a9f4);
    }
    .status-acknowledged {
      background: rgba(255, 152, 0, 0.15);
      color: var(--warning-color, #ff9800);
    }
    .status-resolved {
      background: rgba(76, 175, 80, 0.15);
      color: #2e7d32;
    }
    .status-expired {
      background: rgba(0, 0, 0, 0.08);
      color: var(--secondary-text-color, #666);
    }
    .close {
      font-size: 1.4em;
      background: transparent;
      border: 0;
      cursor: pointer;
      color: inherit;
    }
    .status-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .status-actions button {
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      font: inherit;
      font-size: 0.85em;
    }
    .status-actions button:hover:not(:disabled) {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .status-actions button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    dl {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: 4px 12px;
      margin: 0;
    }
    dt {
      color: var(--secondary-text-color, #666);
      font-size: 0.85em;
    }
    dd {
      margin: 0;
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.9em;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 1px 6px;
      border-radius: 3px;
    }
    .sev-error {
      color: var(--error-color, #db4437);
      font-weight: bold;
    }
    .sev-warning {
      color: var(--warning-color, #ff9800);
      font-weight: bold;
    }
    pre.text,
    pre.meta,
    pre.runbook {
      margin: 0;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 8px;
      border-radius: 4px;
      overflow: auto;
      max-height: 240px;
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      white-space: pre-wrap;
    }
    pre.runbook {
      background: rgba(255, 235, 59, 0.08);
      border-left: 3px solid var(--warning-color, #ff9800);
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .hint {
      color: var(--secondary-text-color, #888);
      font-size: 0.85em;
      font-style: italic;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      padding: 2px 4px 2px 8px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 12px;
      font-size: 0.85em;
      color: var(--primary-text-color, #222);
    }
    .tag-remove {
      margin-left: 4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 0;
      background: transparent;
      color: var(--secondary-text-color, #666);
      cursor: pointer;
      font-size: 0.9em;
      line-height: 1;
    }
    .tag-remove:hover {
      background: rgba(219, 68, 55, 0.15);
      color: var(--error-color, #db4437);
    }
    .tag-input {
      display: flex;
      gap: 6px;
    }
    .tag-input input {
      flex: 1;
      padding: 6px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font: inherit;
      font-size: 0.9em;
    }
    .tag-input button {
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      font: inherit;
      font-size: 0.85em;
    }
    .tag-input button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    footer {
      margin-top: auto;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color, #ddd);
      display: flex;
      justify-content: flex-end;
    }
    .del {
      padding: 6px 16px;
      background: var(--error-color, #db4437);
      color: white;
      border: 0;
      border-radius: 4px;
      cursor: pointer;
    }
  `;
O([
  m({ attribute: !1 })
], w.prototype, "msg", 2);
O([
  m({ attribute: !1 })
], w.prototype, "api", 2);
O([
  p()
], w.prototype, "_status", 2);
O([
  p()
], w.prototype, "_tags", 2);
O([
  p()
], w.prototype, "_newTag", 2);
O([
  p()
], w.prototype, "_runbook", 2);
O([
  p()
], w.prototype, "_busy", 2);
w = O([
  A("detail-pane")
], w);
var Mt = Object.defineProperty, Dt = Object.getOwnPropertyDescriptor, S = (t, e, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Dt(e, s) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (r = (i ? o(e, s, r) : o(r)) || r);
  return i && r && Mt(e, s, r), r;
};
const jt = ["debug", "info", "warning", "error"], Ht = JSON.stringify(
  {
    severity: "$.level",
    source: "$.app.name",
    text: "$.message",
    metadata: "$.extra"
  },
  null,
  2
), ge = /^[a-z0-9._-]{1,64}$/;
function Lt(t) {
  return t.toLowerCase().normalize("NFKD").replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss").replace(/[\s/\\]+/g, "-").replace(/[^a-z0-9._-]/g, "").slice(0, 64);
}
let $ = class extends y {
  constructor() {
    super(...arguments), this.editing = null, this._name = "", this._source = "", this._severity = "info", this._enabled = !0, this._mappingText = "", this._error = "", this._saving = !1;
  }
  willUpdate(t) {
    if (t.has("editing")) {
      const e = this.editing;
      this._name = (e == null ? void 0 : e.name) ?? "", this._source = (e == null ? void 0 : e.default_source) ?? "", this._severity = (e == null ? void 0 : e.default_severity) ?? "info", this._enabled = (e == null ? void 0 : e.enabled) ?? !0, this._mappingText = e != null && e.field_map ? JSON.stringify(e.field_map, null, 2) : "", this._error = "";
    }
  }
  _validateMapping() {
    if (!this._mappingText.trim()) return null;
    try {
      const t = JSON.parse(this._mappingText);
      if (typeof t != "object" || Array.isArray(t))
        throw new Error("muss ein JSON-Objekt sein");
      return t;
    } catch (t) {
      throw new Error(`Mapping-JSON ungueltig: ${t.message}`);
    }
  }
  async _save() {
    if (this.api) {
      this._error = "", this._saving = !0;
      try {
        const t = this._validateMapping();
        if (!this._name.trim()) throw new Error("Name darf nicht leer sein");
        if (!ge.test(this._source))
          throw new Error("Source ist leer oder ungueltig.");
        let e;
        this.editing ? e = await this.api.updateWebhook(this.editing.webhook_id, {
          name: this._name.trim(),
          default_source: this._source,
          default_severity: this._severity,
          field_map: t,
          enabled: this._enabled
        }) : e = await this.api.createWebhook({
          name: this._name.trim(),
          default_source: this._source,
          default_severity: this._severity,
          field_map: t,
          enabled: this._enabled
        }), this.dispatchEvent(
          new CustomEvent("saved", {
            detail: { webhook: e },
            bubbles: !0,
            composed: !0
          })
        );
      } catch (t) {
        this._error = t.message;
      } finally {
        this._saving = !1;
      }
    }
  }
  _cancel() {
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: !0, composed: !0 }));
  }
  _useExample() {
    this._mappingText = Ht;
  }
  render() {
    const t = this.editing !== null;
    return l`
      <div class="card">
        <h3>${t ? "Webhook bearbeiten" : "Neuen Webhook anlegen"}</h3>

        <label>
          <span>Name</span>
          <input
            type="text"
            .value=${this._name}
            @input=${(e) => this._name = e.target.value}
            placeholder="z. B. Pi-hole Alerts"
          />
        </label>

        <div class="row-2">
          <label>
            <span>
              Default-Source
              ${this._source && ge.test(this._source) ? l`<span class="ok-badge" title="ok">✓</span>` : null}
            </span>
            <input
              type="text"
              class=${this._source && !ge.test(this._source) ? "invalid" : ""}
              .value=${this._source}
              @input=${(e) => {
      const s = e.target.value;
      this._source = Lt(s);
    }}
              placeholder="z. B. pihole"
              autocomplete="off"
              spellcheck="false"
            />
            <small>
              Wird automatisch in <code>kebab-case</code> umgewandelt
              (Beispiele: <code>pihole</code>, <code>knx-bus</code>,
              <code>backup.job</code>, <code>nas-1</code>).
              Erlaubt: a–z, 0–9, „.", „_", „-" — max 64 Zeichen.
            </small>
          </label>

          <label>
            <span>Default-Severity</span>
            <select
              .value=${this._severity}
              @change=${(e) => this._severity = e.target.value}
            >
              ${jt.map(
      (e) => l`<option value=${e} ?selected=${this._severity === e}>${e}</option>`
    )}
            </select>
          </label>
        </div>

        <label class="checkbox">
          <input
            type="checkbox"
            .checked=${this._enabled}
            @change=${(e) => this._enabled = e.target.checked}
          />
          <span>aktiv</span>
        </label>

        <div class="mapping">
          <div class="mapping-head">
            <span>JSONPath-Mapping (optional)</span>
            <button class="link" @click=${this._useExample}>
              Beispiel einfuegen
            </button>
          </div>
          <textarea
            .value=${this._mappingText}
            @input=${(e) => this._mappingText = e.target.value}
            placeholder=${'{"severity": "$.level", "source": "$.app.name", ...}'}
            rows="6"
            spellcheck="false"
          ></textarea>
          <small>
            Leer lassen fuer 1:1-Mapping (severity/source/text/metadata in der
            Top-Level-Payload).
          </small>
        </div>

        ${this._error ? l`<div class="error">${this._error}</div>` : null}

        <div class="actions">
          <button class="primary" ?disabled=${this._saving} @click=${this._save}>
            ${this._saving ? "speichere…" : t ? "Speichern" : "Anlegen"}
          </button>
          <button @click=${this._cancel}>Abbrechen</button>
        </div>
      </div>
    `;
  }
};
$.styles = k`
    .card {
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    h3 {
      margin: 0 0 4px 0;
      font-size: 1.05em;
      color: var(--primary-text-color, #222);
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    label > span {
      font-weight: 500;
      color: var(--primary-text-color, #222);
    }
    .row-2 {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .row-2 {
        grid-template-columns: 1fr;
      }
    }
    input[type="text"],
    select,
    textarea {
      padding: 8px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: var(--primary-text-color, #222);
      font: inherit;
    }
    textarea {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      resize: vertical;
    }
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible {
      outline: 2px solid var(--primary-color, #03a9f4);
      outline-offset: 1px;
    }
    input.invalid {
      border-color: var(--error-color, #db4437);
    }
    .ok-badge {
      display: inline-block;
      margin-left: 6px;
      color: var(--success-color, #2e7d32);
      font-size: 0.85em;
      font-weight: 700;
    }
    small code {
      background: var(--secondary-background-color, #f5f5f5);
      padding: 1px 4px;
      border-radius: 3px;
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.95em;
    }
    small {
      font-size: 0.78em;
      color: var(--secondary-text-color, #888);
    }
    .checkbox {
      flex-direction: row;
      align-items: center;
      gap: 6px;
    }
    .mapping {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mapping-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    button {
      padding: 8px 14px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: inherit;
      font: inherit;
    }
    button:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    button.primary {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
    }
    button.primary:hover {
      filter: brightness(0.9);
    }
    button.primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    button.link {
      padding: 2px 6px;
      border: 0;
      color: var(--primary-color, #03a9f4);
      background: transparent;
      cursor: pointer;
      font-size: 0.85em;
      text-decoration: underline;
    }
    .error {
      color: var(--error-color, #db4437);
      font-size: 0.9em;
      padding: 6px 8px;
      background: rgba(219, 68, 55, 0.08);
      border-left: 3px solid var(--error-color, #db4437);
      border-radius: 2px;
    }
    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 4px;
    }
  `;
S([
  m({ attribute: !1 })
], $.prototype, "api", 2);
S([
  m({ attribute: !1 })
], $.prototype, "editing", 2);
S([
  p()
], $.prototype, "_name", 2);
S([
  p()
], $.prototype, "_source", 2);
S([
  p()
], $.prototype, "_severity", 2);
S([
  p()
], $.prototype, "_enabled", 2);
S([
  p()
], $.prototype, "_mappingText", 2);
S([
  p()
], $.prototype, "_error", 2);
S([
  p()
], $.prototype, "_saving", 2);
$ = S([
  A("webhook-form")
], $);
var It = Object.defineProperty, Rt = Object.getOwnPropertyDescriptor, L = (t, e, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Rt(e, s) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (r = (i ? o(e, s, r) : o(r)) || r);
  return i && r && It(e, s, r), r;
};
let T = class extends y {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._showForm = !1, this._editing = null, this._toast = "";
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    if (this.api) {
      this._loading = !0;
      try {
        this._items = await this.api.listWebhooks();
      } finally {
        this._loading = !1;
      }
    }
  }
  async _copyUrl(t) {
    const e = `${window.location.origin}/api/webhook/${t}`;
    try {
      await navigator.clipboard.writeText(e), this._showToast("URL kopiert");
    } catch {
      this._showToast("Kopieren fehlgeschlagen");
    }
  }
  async _delete(t) {
    this.api && window.confirm(`Webhook „${t.name}" wirklich loeschen?`) && (await this.api.deleteWebhook(t.webhook_id), this._showToast(`„${t.name}" geloescht`), await this._load());
  }
  async _toggle(t) {
    this.api && (await this.api.updateWebhook(t.webhook_id, { enabled: !t.enabled }), await this._load());
  }
  _onSaved(t) {
    this._showForm = !1, this._editing = null, this._showToast("Webhook gespeichert"), this._load();
  }
  _onCancel() {
    this._showForm = !1, this._editing = null;
  }
  _add() {
    this._editing = null, this._showForm = !0;
  }
  _edit(t) {
    this._editing = t, this._showForm = !0;
  }
  _showToast(t) {
    this._toast = t, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2400);
  }
  _renderEmpty() {
    return l`
      <div class="empty">
        <h3>Noch keine Webhooks</h3>
        <p>
          Lege deinen ersten Webhook an, um Nachrichten von externen Quellen
          (Pi-hole, Grafana, Skripte, IoT-Geraete) zu empfangen. Jeder Webhook
          bekommt eine eigene Geheim-URL nach
          <code>https://&lt;ha-host&gt;/api/webhook/&lt;id&gt;</code>.
        </p>
        <button class="primary" @click=${this._add}>+ Webhook anlegen</button>
      </div>
    `;
  }
  _renderItem(t) {
    const e = `${window.location.origin}/api/webhook/${t.webhook_id}`;
    return l`
      <div class=${`card ${t.enabled ? "" : "disabled"}`}>
        <header>
          <div class="title">
            <h4>${t.name}</h4>
            <span class=${`status ${t.enabled ? "ok" : "off"}`}>
              ${t.enabled ? "aktiv" : "deaktiviert"}
            </span>
          </div>
          <div class="actions">
            <button @click=${() => this._toggle(t)}>
              ${t.enabled ? "Deaktivieren" : "Aktivieren"}
            </button>
            <button @click=${() => this._edit(t)}>Bearbeiten</button>
            <button class="danger" @click=${() => this._delete(t)}>Loeschen</button>
          </div>
        </header>

        <dl>
          <dt>Default-Source</dt>
          <dd><code>${t.default_source}</code></dd>
          <dt>Default-Severity</dt>
          <dd><code>${t.default_severity}</code></dd>
          <dt>Webhook-URL</dt>
          <dd>
            <code class="url">${e}</code>
            <button class="link" @click=${() => this._copyUrl(t.webhook_id)}>
              kopieren
            </button>
          </dd>
          ${t.field_map ? l`<dt>JSONPath-Mapping</dt>
                <dd>
                  <pre><code>${JSON.stringify(t.field_map, null, 2)}</code></pre>
                </dd>` : null}
        </dl>
      </div>
    `;
  }
  render() {
    return l`
      <div class="root">
        <section>
          <header class="section-head">
            <div>
              <h2>Webhooks</h2>
              <p class="hint">
                Eingehende Nachrichten via HTTP-POST. Pro Webhook eigene URL +
                optionales JSONPath-Mapping fuer beliebige Payload-Strukturen.
              </p>
            </div>
            ${this._items.length > 0 && !this._showForm ? l`<button class="primary" @click=${this._add}>+ Webhook anlegen</button>` : null}
          </header>

          ${this._showForm ? l`<webhook-form
                .api=${this.api}
                .editing=${this._editing}
                @saved=${this._onSaved}
                @cancel=${this._onCancel}
              ></webhook-form>` : null}

          ${this._loading ? l`<p class="status">lade…</p>` : this._items.length === 0 && !this._showForm ? this._renderEmpty() : l`<div class="grid">${this._items.map((t) => this._renderItem(t))}</div>`}
        </section>

        <section>
          <header class="section-head">
            <div>
              <h2>Notification-Channels</h2>
              <p class="hint">
                Telegram, Pushover, ntfy, Signal — mit Quiet Hours und Throttling.
              </p>
            </div>
          </header>
          <div class="placeholder">
            <p>
              Channel-Verwaltung kommt in Iteration v0.2. Backend-Logik ist
              implementiert (Forwarder, Quiet Hours, Throttling), das UI folgt.
            </p>
          </div>
        </section>

        <section>
          <header class="section-head">
            <div>
              <h2>Heartbeat-Quellen</h2>
              <p class="hint">Stille Quellen erkennen und alarmieren.</p>
            </div>
          </header>
          <div class="placeholder">
            <p>UI fuer Heartbeat-Konfiguration in v0.2.</p>
          </div>
        </section>

        ${this._toast ? l`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
};
T.styles = k`
    :host {
      display: block;
      overflow-y: auto;
      height: 100%;
    }
    .root {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }
    h2 {
      margin: 0;
      font-size: 1.2em;
      color: var(--primary-text-color, #222);
    }
    .hint {
      margin: 4px 0 0 0;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .card {
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 16px;
    }
    .card.disabled {
      opacity: 0.65;
    }
    .card header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h4 {
      margin: 0;
      font-size: 1em;
    }
    .status {
      font-size: 0.75em;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .status.ok {
      background: rgba(76, 175, 80, 0.12);
      color: #2e7d32;
    }
    .status.off {
      background: rgba(0, 0, 0, 0.06);
      color: var(--secondary-text-color, #666);
    }
    .card .actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    button {
      padding: 6px 10px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: inherit;
      font: inherit;
      font-size: 0.85em;
    }
    button:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    button.primary {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
      padding: 8px 14px;
      font-size: 0.9em;
    }
    button.primary:hover {
      filter: brightness(0.9);
    }
    button.danger {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    button.danger:hover {
      background: rgba(219, 68, 55, 0.08);
    }
    button.link {
      padding: 2px 6px;
      border: 0;
      background: transparent;
      color: var(--primary-color, #03a9f4);
      text-decoration: underline;
      font-size: 0.85em;
    }
    dl {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 6px 12px;
      margin: 0;
    }
    @media (max-width: 600px) {
      dl {
        grid-template-columns: 1fr;
      }
      dt {
        margin-top: 6px;
      }
    }
    dt {
      color: var(--secondary-text-color, #666);
      font-size: 0.85em;
    }
    dd {
      margin: 0;
      color: var(--primary-text-color, #222);
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 2px 6px;
      border-radius: 3px;
    }
    code.url {
      word-break: break-all;
    }
    pre {
      margin: 0;
      padding: 8px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 4px;
      overflow: auto;
      max-width: 100%;
    }
    pre code {
      background: transparent;
      padding: 0;
    }
    .empty {
      background: var(--card-background-color, white);
      border: 1px dashed var(--divider-color, #ccc);
      border-radius: 8px;
      padding: 32px;
      text-align: center;
    }
    .empty h3 {
      margin: 0 0 8px 0;
    }
    .empty p {
      margin: 0 0 16px 0;
      color: var(--secondary-text-color, #666);
      max-width: 420px;
      margin-inline: auto;
    }
    .placeholder {
      background: var(--card-background-color, white);
      border: 1px dashed var(--divider-color, #ccc);
      border-radius: 8px;
      padding: 16px;
      color: var(--secondary-text-color, #666);
      font-size: 0.9em;
    }
    .placeholder p {
      margin: 0;
    }
    .status {
      color: var(--secondary-text-color, #666);
      padding: 8px 0;
    }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary-text-color, #222);
      color: var(--primary-background-color, white);
      padding: 10px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      font-size: 0.9em;
      animation: slidein 0.2s ease-out;
    }
    @keyframes slidein {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
L([
  m({ attribute: !1 })
], T.prototype, "api", 2);
L([
  p()
], T.prototype, "_items", 2);
L([
  p()
], T.prototype, "_loading", 2);
L([
  p()
], T.prototype, "_showForm", 2);
L([
  p()
], T.prototype, "_editing", 2);
L([
  p()
], T.prototype, "_toast", 2);
T = L([
  A("settings-view")
], T);
var Ft = Object.defineProperty, Wt = Object.getOwnPropertyDescriptor, X = (t, e, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Wt(e, s) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (r = (i ? o(e, s, r) : o(r)) || r);
  return i && r && Ft(e, s, r), r;
};
const Bt = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
  debug: "Debug"
}, Vt = {
  error: "var(--error-color, #db4437)",
  warning: "var(--warning-color, #ff9800)",
  info: "var(--info-color, #03a9f4)",
  debug: "var(--secondary-text-color, #888)"
};
let H = class extends y {
  constructor() {
    super(...arguments), this._stats = null, this._sources = [], this._loading = !1;
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    if (this.api) {
      this._loading = !0;
      try {
        const [t, e] = await Promise.all([
          this.api.getStats(),
          this.api.listSources()
        ]);
        this._stats = t, this._sources = e;
      } finally {
        this._loading = !1;
      }
    }
  }
  _renderSeverityBars() {
    if (!this._stats) return l``;
    const t = this._stats.severity_24h, e = Math.max(1, Object.values(t).reduce((i, r) => i + r, 0));
    return l`
      <div class="bars">
        ${["error", "warning", "info", "debug"].map((i) => {
      const r = t[i] ?? 0, a = r / e * 100;
      return l`
            <div class="bar-row">
              <span class="bar-label">${Bt[i] ?? i}</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  style=${`width: ${a}%; background: ${Vt[i]}`}
                ></div>
              </div>
              <span class="bar-count">${r}</span>
            </div>
          `;
    })}
      </div>
    `;
  }
  render() {
    if (this._loading && !this._stats)
      return l`<div class="root"><p class="status">lade…</p></div>`;
    if (!this._stats)
      return l`<div class="root"><p class="status">Keine Daten verfuegbar.</p></div>`;
    const t = this._stats, e = Object.values(t.severity_24h).reduce((s, i) => s + i, 0);
    return l`
      <div class="root">
        <section>
          <h2>Live-Status</h2>
          <div class="kpis">
            <div class="kpi">
              <span class="kpi-label">Gesamt</span>
              <span class="kpi-value">${t.total.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">Nachrichten in der Datenbank</span>
            </div>
            <div class="kpi accent-info">
              <span class="kpi-label">Letzte 24h</span>
              <span class="kpi-value">${e.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">alle Severities</span>
            </div>
            <div class="kpi accent-error">
              <span class="kpi-label">Errors 24h</span>
              <span class="kpi-value">${t.severity_24h.error ?? 0}</span>
              <span class="kpi-hint">unbehoben + bestaetigt</span>
            </div>
            <div class="kpi accent-warning">
              <span class="kpi-label">Warnings 24h</span>
              <span class="kpi-value">${t.severity_24h.warning ?? 0}</span>
              <span class="kpi-hint">letzte 24 Stunden</span>
            </div>
          </div>
        </section>

        <section>
          <h2>Severity-Verteilung (24h)</h2>
          <div class="card">${this._renderSeverityBars()}</div>
        </section>

        <section>
          <h2>Aktive Quellen</h2>
          <div class="card">
            ${this._sources.length === 0 ? l`<p class="status">
                  Noch keine Quellen erfasst. Sobald die erste Nachricht reinkommt,
                  erscheint sie hier.
                </p>` : l`<ul class="sources">
                  ${this._sources.map(
      (s) => l`<li><code>${s}</code></li>`
    )}
                </ul>`}
          </div>
        </section>

        <section>
          <h2>Heatmap, MTTR, Top-10</h2>
          <div class="placeholder">
            <p>
              Detaillierte Visualisierungen (Heatmap Stunde × Wochentag, MTTR pro Source,
              Top-10-Quellen mit Trend) folgen in v0.2. Backend-Endpoints sind bereits
              vorhanden (<code>/api/messagehub/stats</code>,
              <code>heatmap_hour_weekday</code>, <code>top_sources</code>).
            </p>
          </div>
        </section>
      </div>
    `;
  }
};
H.styles = k`
    :host {
      display: block;
      overflow-y: auto;
      height: 100%;
    }
    .root {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    h2 {
      margin: 0;
      font-size: 1.1em;
      color: var(--primary-text-color, #222);
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .kpi {
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-left: 4px solid var(--divider-color, #e0e0e0);
    }
    .kpi.accent-info {
      border-left-color: var(--info-color, #03a9f4);
    }
    .kpi.accent-error {
      border-left-color: var(--error-color, #db4437);
    }
    .kpi.accent-warning {
      border-left-color: var(--warning-color, #ff9800);
    }
    .kpi-label {
      font-size: 0.85em;
      color: var(--secondary-text-color, #666);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-value {
      font-size: 2em;
      font-weight: 600;
      color: var(--primary-text-color, #222);
      line-height: 1;
      margin: 4px 0;
    }
    .kpi-hint {
      font-size: 0.78em;
      color: var(--secondary-text-color, #888);
    }
    .card {
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 16px;
    }
    .bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .bar-row {
      display: grid;
      grid-template-columns: 80px 1fr 50px;
      gap: 12px;
      align-items: center;
    }
    .bar-label {
      font-size: 0.9em;
      color: var(--primary-text-color, #222);
    }
    .bar-track {
      height: 8px;
      background: var(--secondary-background-color, #f3f3f3);
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      transition: width 0.3s ease;
      min-width: 1px;
    }
    .bar-count {
      text-align: right;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
      font-variant-numeric: tabular-nums;
    }
    .sources {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .sources li {
      padding: 4px 8px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 4px;
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
    }
    .placeholder {
      background: var(--card-background-color, white);
      border: 1px dashed var(--divider-color, #ccc);
      border-radius: 8px;
      padding: 16px;
      color: var(--secondary-text-color, #666);
      font-size: 0.9em;
    }
    .placeholder p {
      margin: 0;
      max-width: 600px;
    }
    .status {
      color: var(--secondary-text-color, #666);
      padding: 8px 0;
      margin: 0;
    }
  `;
X([
  m({ attribute: !1 })
], H.prototype, "api", 2);
X([
  p()
], H.prototype, "_stats", 2);
X([
  p()
], H.prototype, "_sources", 2);
X([
  p()
], H.prototype, "_loading", 2);
H = X([
  A("stats-view")
], H);
var Jt = Object.defineProperty, Qt = Object.getOwnPropertyDescriptor, le = (t, e, s, i) => {
  for (var r = i > 1 ? void 0 : i ? Qt(e, s) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (r = (i ? o(e, s, r) : o(r)) || r);
  return i && r && Jt(e, s, r), r;
};
let W = class extends y {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1;
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    if (this.api) {
      this._loading = !0;
      try {
        this._items = await this.api.listAudit(200);
      } finally {
        this._loading = !1;
      }
    }
  }
  render() {
    return l`
      <div class="root">
        <header>
          <h2>Audit-Log</h2>
          <button @click=${() => void this._load()}>↻ Aktualisieren</button>
        </header>
        <p class="hint">
          Letzte 200 administrativen Aktionen: Loeschen, Status-Aenderungen,
          Webhook-CRUD. Eintraege sind unveraenderlich.
        </p>
        ${this._loading ? l`<p class="status">lade…</p>` : this._items.length === 0 ? l`<p class="status">Noch keine Audit-Eintraege.</p>` : l`<table>
                <thead>
                  <tr>
                    <th>Zeit</th>
                    <th>Wer</th>
                    <th>Aktion</th>
                    <th>Ziel</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  ${this._items.map(
      (t) => l`<tr>
                      <td class="ts">${String(t.timestamp).replace("T", " ").replace(/\+00:00$/, "")}</td>
                      <td>${t.actor}</td>
                      <td><code>${t.action}</code></td>
                      <td>
                        ${t.target_type}${t.target_id ? l` #${t.target_id}` : ""}
                      </td>
                      <td>
                        ${t.details ? l`<code>${JSON.stringify(t.details)}</code>` : ""}
                      </td>
                    </tr>`
    )}
                </tbody>
              </table>`}
      </div>
    `;
  }
};
W.styles = k`
    :host {
      display: block;
      overflow-y: auto;
      height: 100%;
    }
    .root {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    h2 {
      margin: 0;
      font-size: 1.1em;
    }
    .hint {
      margin: 0 0 16px 0;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    button {
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      font: inherit;
      font-size: 0.85em;
    }
    button:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .status {
      color: var(--secondary-text-color, #666);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      font-size: 0.9em;
    }
    th,
    td {
      text-align: left;
      padding: 8px 12px;
      border-bottom: 1px solid var(--divider-color, #eee);
    }
    th {
      background: var(--secondary-background-color, #f3f3f3);
      font-size: 0.78em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color, #666);
    }
    .ts {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      white-space: nowrap;
      color: var(--secondary-text-color, #666);
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 1px 5px;
      border-radius: 3px;
    }
  `;
le([
  m({ attribute: !1 })
], W.prototype, "api", 2);
le([
  p()
], W.prototype, "_items", 2);
le([
  p()
], W.prototype, "_loading", 2);
W = le([
  A("audit-view")
], W);
var Kt = Object.defineProperty, qt = Object.getOwnPropertyDescriptor, x = (t, e, s, i) => {
  for (var r = i > 1 ? void 0 : i ? qt(e, s) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (r = (i ? o(e, s, r) : o(r)) || r);
  return i && r && Kt(e, s, r), r;
};
const He = "messagehub.filters", ee = {
  severity: ["error", "warning", "info"],
  source: "",
  search: ""
};
let _ = class extends y {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "messages", this._items = [], this._total = 0, this._loading = !1, this._selected = null, this._filters = this._loadFilters(), this._newCount = 0, this._testing = !1, this._toast = "", this._api = new gt(), this._onSeverityChange = (t) => {
      this._filters = { ...this._filters, severity: t.detail.severities }, this._persistFilters(), this._reload();
    }, this._onSourceChange = (t) => {
      this._filters = { ...this._filters, source: t.detail.source }, this._persistFilters(), this._reload();
    }, this._onTimeRange = (t) => {
      this._filters = { ...this._filters, fromIso: t.detail.fromIso, toIso: t.detail.toIso }, this._persistFilters(), this._reload();
    }, this._onSelect = (t) => {
      this._selected = t.detail.msg;
    }, this._onDelete = async (t) => {
      try {
        await this._api.deleteMessage(t.detail.id), this._items = this._items.filter((e) => e.id !== t.detail.id), this._total = Math.max(0, this._total - 1), this._selected = null, this._showToast("Nachricht geloescht");
      } catch (e) {
        this._showToast(`Loeschen fehlgeschlagen: ${e.message}`);
      }
    };
  }
  firstUpdated() {
    var t;
    (t = this.hass) != null && t.auth && this._api.setAuth(this.hass.auth.data.access_token), this._reload(), this._subscribeLive();
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._unsubLive) == null || t.call(this);
  }
  async _subscribeLive() {
    var t, e;
    (e = (t = this.hass) == null ? void 0 : t.connection) != null && e.subscribeEvents && (this._unsubLive = await this.hass.connection.subscribeEvents((s) => {
      const i = s.data;
      this._matchesFilters(i) && (this._items = [i, ...this._items].slice(0, 200), this._total += 1, this._newCount += 1, window.setTimeout(() => this._newCount = Math.max(0, this._newCount - 1), 4e3));
    }, "messagehub_message_added"));
  }
  _matchesFilters(t) {
    return !(this._filters.severity.length && !this._filters.severity.includes(t.severity) || this._filters.source && t.source !== this._filters.source || this._filters.search && !t.text.toLowerCase().includes(this._filters.search.toLowerCase()));
  }
  _loadFilters() {
    try {
      const t = localStorage.getItem(He);
      if (t) return { ...ee, ...JSON.parse(t) };
    } catch {
    }
    return { ...ee };
  }
  _persistFilters() {
    try {
      localStorage.setItem(He, JSON.stringify(this._filters));
    } catch {
    }
  }
  _resetFilters() {
    this._filters = { ...ee }, this._persistFilters(), this._reload();
  }
  async _reload() {
    this._loading = !0;
    try {
      const t = await this._api.listMessages({
        severity: this._filters.severity,
        source: this._filters.source || void 0,
        search: this._filters.search || void 0,
        from: this._filters.fromIso,
        to: this._filters.toIso,
        limit: 100
      });
      this._items = t.items, this._total = t.total;
    } catch (t) {
      this._showToast(`Laden fehlgeschlagen: ${t.message}`);
    } finally {
      this._loading = !1;
    }
  }
  async _bulkDelete(t) {
    if (this._total === 0) return;
    const e = t === "all" ? this._total : this._total, s = t === "all" ? `ALLE ${e} Nachrichten dauerhaft loeschen?` : `${e} gefilterte Nachrichten dauerhaft loeschen?`;
    if (window.confirm(s))
      try {
        const i = t === "all" ? {} : {
          severity: this._filters.severity,
          source: this._filters.source || void 0,
          search: this._filters.search || void 0,
          from: this._filters.fromIso,
          to: this._filters.toIso
        }, r = await this._api.deleteMessages(i);
        this._showToast(`${r} Nachrichten geloescht`), this._selected = null, await this._reload();
      } catch (i) {
        this._showToast(`Loeschen fehlgeschlagen: ${i.message}`);
      }
  }
  async _sendTestMessage() {
    var t;
    if (!((t = this.hass) != null && t.callService)) {
      this._showToast("Test nicht verfuegbar — hass.callService fehlt");
      return;
    }
    this._testing = !0;
    try {
      const e = ["info", "warning", "error", "info", "info"], s = ["pihole", "knx-bus", "backup-job", "test-script"], i = [
        "Demo-Nachricht aus dem Panel",
        "Test: DNS-Query erfolgreich",
        "Backup abgeschlossen, Dauer 12 min",
        "KNX 1/2/3 — Wohnzimmer Deckenlicht ein"
      ], r = (a) => Math.floor(Math.random() * a);
      await this.hass.callService("messagehub", "add_message", {
        severity: e[r(e.length)],
        source: s[r(s.length)],
        text: i[r(i.length)],
        metadata: { source_panel: !0, ts: (/* @__PURE__ */ new Date()).toISOString() }
      }), this._showToast("Test-Nachricht gesendet"), window.setTimeout(() => void this._reload(), 300);
    } catch (e) {
      this._showToast(`Service-Call fehlgeschlagen: ${e.message}`);
    } finally {
      this._testing = !1;
    }
  }
  _showToast(t) {
    this._toast = t, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  _debounceSearch(t) {
    this._debounceTimer && window.clearTimeout(this._debounceTimer), this._debounceTimer = window.setTimeout(() => {
      this._filters = { ...this._filters, search: t }, this._persistFilters(), this._reload();
    }, 300);
  }
  _hasActiveFilters() {
    return this._filters.severity.length !== ee.severity.length || this._filters.source !== "" || this._filters.search !== "" || this._filters.fromIso !== void 0;
  }
  _exportUrl(t) {
    return this._api.exportUrl({
      severity: this._filters.severity,
      source: this._filters.source || void 0,
      search: this._filters.search || void 0,
      from: this._filters.fromIso,
      to: this._filters.toIso,
      limit: 1e4,
      format: t
    });
  }
  _renderEmptyMessages() {
    return l`
      <div class="empty">
        <h3>Noch keine Nachrichten ${this._hasActiveFilters() ? "fuer diese Filter" : ""}</h3>
        <p>
          ${this._hasActiveFilters() ? "Probiere weniger restriktive Filter oder setze sie zurueck." : "Sobald Nachrichten ueber Webhook, MQTT, Eventbus oder den Service messagehub.add_message reinkommen, erscheinen sie hier."}
        </p>
        <div class="empty-actions">
          ${this._hasActiveFilters() ? l`<button @click=${this._resetFilters}>Filter zuruecksetzen</button>` : null}
          <button class="primary" ?disabled=${this._testing} @click=${this._sendTestMessage}>
            ${this._testing ? "sende…" : "+ Test-Nachricht senden"}
          </button>
        </div>
      </div>
    `;
  }
  _renderMessages() {
    return l`
      <div class="filter-bar" role="toolbar" aria-label="Filter">
        <severity-filter
          .selected=${this._filters.severity}
          @change=${this._onSeverityChange}
        ></severity-filter>
        <source-filter
          .api=${this._api}
          .selected=${this._filters.source}
          @change=${this._onSourceChange}
        ></source-filter>
        <input
          class="search"
          type="search"
          placeholder="Volltextsuche…"
          aria-label="Volltextsuche"
          .value=${this._filters.search}
          @input=${(t) => {
      const e = t.target.value;
      this._debounceSearch(e);
    }}
        />
        <time-range-filter
          .fromIso=${this._filters.fromIso}
          .toIso=${this._filters.toIso}
          @change=${this._onTimeRange}
        ></time-range-filter>
        ${this._hasActiveFilters() ? l`<button class="filter-reset" @click=${this._resetFilters}>
              Filter loeschen
            </button>` : null}
      </div>

      <div class="status-bar">
        <span>
          ${this._loading ? "lade…" : `${this._items.length.toLocaleString("de-DE")} von ${this._total.toLocaleString("de-DE")}`}
          ${this._newCount > 0 ? l`<span class="new-badge"
                >+${this._newCount} neue</span
              >` : null}
        </span>
        <div class="status-actions">
          ${this._total > 0 ? l`<a
                  class="export-link"
                  href=${this._exportUrl("jsonl")}
                  download="messagehub-export.jsonl"
                  >⤓ JSONL</a
                >
                <a
                  class="export-link"
                  href=${this._exportUrl("csv")}
                  download="messagehub-export.csv"
                  >⤓ CSV</a
                >` : null}
          ${this._total > 0 && this._hasActiveFilters() ? l`<button class="danger" @click=${() => this._bulkDelete("filter")}>
                Gefilterte loeschen
              </button>` : null}
          <button ?disabled=${this._testing} @click=${this._sendTestMessage}>
            ${this._testing ? "sende…" : "+ Test"}
          </button>
        </div>
      </div>

      ${this._items.length === 0 && !this._loading ? this._renderEmptyMessages() : l`<message-table
            .items=${this._items}
            @select=${this._onSelect}
          ></message-table>`}

      ${this._selected ? l`<detail-pane
            .msg=${this._selected}
            .api=${this._api}
            @close=${() => this._selected = null}
            @delete=${this._onDelete}
            @status-change=${() => void this._reload()}
            @error=${(t) => this._showToast(t.detail.message)}
          ></detail-pane>` : null}
    `;
  }
  render() {
    return l`
      <div class="root">
        <header>
          <div class="brand">
            <span class="logo" aria-hidden="true">📨</span>
            <h1>Message Hub</h1>
          </div>
          <nav role="tablist">
            <button
              role="tab"
              aria-selected=${this._tab === "messages"}
              class=${this._tab === "messages" ? "active" : ""}
              @click=${() => this._tab = "messages"}
            >
              Nachrichten
            </button>
            <button
              role="tab"
              aria-selected=${this._tab === "stats"}
              class=${this._tab === "stats" ? "active" : ""}
              @click=${() => this._tab = "stats"}
            >
              Statistik
            </button>
            <button
              role="tab"
              aria-selected=${this._tab === "settings"}
              class=${this._tab === "settings" ? "active" : ""}
              @click=${() => this._tab = "settings"}
            >
              Einstellungen
            </button>
            <button
              role="tab"
              aria-selected=${this._tab === "audit"}
              class=${this._tab === "audit" ? "active" : ""}
              @click=${() => this._tab = "audit"}
            >
              Audit
            </button>
            ${this._tab === "messages" ? l`<button
                  class="header-danger"
                  ?disabled=${this._total === 0}
                  title=${this._total === 0 ? "Keine Nachrichten zum Loeschen" : `${this._total} Nachrichten loeschen`}
                  @click=${() => this._bulkDelete("all")}
                >
                  🗑 Alle loeschen
                </button>` : null}
            <button
              class="refresh"
              aria-label="Aktualisieren"
              @click=${() => void this._reload()}
            >
              ↻
            </button>
          </nav>
        </header>

        <main>
          ${this._tab === "messages" ? this._renderMessages() : null}
          ${this._tab === "stats" ? l`<stats-view .api=${this._api}></stats-view>` : null}
          ${this._tab === "settings" ? l`<settings-view .api=${this._api}></settings-view>` : null}
          ${this._tab === "audit" ? l`<audit-view .api=${this._api}></audit-view>` : null}
        </main>

        ${this._toast ? l`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
};
_.styles = k`
    :host {
      display: block;
      height: 100vh;
      background: var(--primary-background-color, #fafafa);
      color: var(--primary-text-color, #222);
      font-family: var(--ha-font-family-body, system-ui, sans-serif);
    }
    .root {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid var(--divider-color, #ddd);
      background: var(--app-header-background-color, var(--primary-color, #03a9f4));
      color: var(--app-header-text-color, white);
      flex-wrap: wrap;
      gap: 8px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo {
      font-size: 1.3em;
    }
    h1 {
      font-size: 1.1em;
      margin: 0;
      font-weight: 600;
    }
    nav {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    nav button {
      background: transparent;
      color: inherit;
      border: 1px solid currentColor;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font: inherit;
      font-size: 0.9em;
    }
    nav button:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    nav button:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }
    nav button.active {
      background: white;
      color: var(--app-header-background-color, var(--primary-color, #03a9f4));
      font-weight: 600;
    }
    nav button.refresh {
      font-size: 1.1em;
      padding: 6px 10px;
    }
    nav button.header-danger {
      background: rgba(255, 255, 255, 0.95);
      color: var(--error-color, #db4437);
      border-color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
    }
    nav button.header-danger:hover:not(:disabled) {
      background: white;
      filter: brightness(0.95);
    }
    nav button.header-danger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    main {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: var(--primary-background-color, #fafafa);
    }
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--divider-color, #ddd);
      background: var(--card-background-color, white);
      align-items: center;
    }
    @media (max-width: 600px) {
      .filter-bar {
        padding: 8px;
      }
      .filter-bar > * {
        flex: 1 1 auto;
      }
    }
    input.search {
      padding: 6px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      min-width: 200px;
      flex: 1;
      max-width: 320px;
      font: inherit;
      background: var(--card-background-color, white);
      color: var(--primary-text-color, #222);
    }
    input.search:focus-visible {
      outline: 2px solid var(--primary-color, #03a9f4);
      outline-offset: 1px;
    }
    .filter-reset {
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: var(--secondary-text-color, #666);
      font: inherit;
      font-size: 0.85em;
    }
    .filter-reset:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 16px;
      font-size: 0.85em;
      color: var(--secondary-text-color, #666);
      background: var(--primary-background-color, #fafafa);
      border-bottom: 1px solid var(--divider-color, #eee);
    }
    .new-badge {
      display: inline-block;
      margin-left: 8px;
      padding: 1px 8px;
      background: var(--primary-color, #03a9f4);
      color: white;
      border-radius: 10px;
      font-size: 0.78em;
      font-weight: 500;
      animation: pulse 1s ease-in-out infinite alternate;
    }
    @keyframes pulse {
      from {
        opacity: 0.7;
      }
      to {
        opacity: 1;
      }
    }
    .status-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .status-actions button {
      padding: 4px 10px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: inherit;
      font: inherit;
      font-size: 0.85em;
    }
    .status-actions button:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .status-actions button.danger {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    .status-actions button.danger:hover {
      background: rgba(219, 68, 55, 0.08);
    }
    .status-actions a.export-link {
      padding: 4px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      text-decoration: none;
      color: inherit;
      font-size: 0.85em;
    }
    .status-actions a.export-link:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--secondary-text-color, #666);
    }
    .empty h3 {
      margin: 0 0 8px 0;
      color: var(--primary-text-color, #222);
    }
    .empty p {
      margin: 0 0 20px 0;
      max-width: 460px;
    }
    .empty-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .empty button {
      padding: 8px 16px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: inherit;
      font: inherit;
    }
    .empty button.primary {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
    }
    .empty button.primary:hover {
      filter: brightness(0.9);
    }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary-text-color, #222);
      color: var(--primary-background-color, white);
      padding: 10px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      font-size: 0.9em;
      z-index: 100;
      animation: slidein 0.2s ease-out;
    }
    @keyframes slidein {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
x([
  m({ attribute: !1 })
], _.prototype, "hass", 2);
x([
  m({ type: Boolean })
], _.prototype, "narrow", 2);
x([
  m({ attribute: !1 })
], _.prototype, "panel", 2);
x([
  p()
], _.prototype, "_tab", 2);
x([
  p()
], _.prototype, "_items", 2);
x([
  p()
], _.prototype, "_total", 2);
x([
  p()
], _.prototype, "_loading", 2);
x([
  p()
], _.prototype, "_selected", 2);
x([
  p()
], _.prototype, "_filters", 2);
x([
  p()
], _.prototype, "_newCount", 2);
x([
  p()
], _.prototype, "_testing", 2);
x([
  p()
], _.prototype, "_toast", 2);
_ = x([
  A("messagehub-panel")
], _);
export {
  _ as MessageHubPanel
};
