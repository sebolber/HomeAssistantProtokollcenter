/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Z = globalThis, ue = Z.ShadowRoot && (Z.ShadyCSS === void 0 || Z.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, fe = Symbol(), me = /* @__PURE__ */ new WeakMap();
let De = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== fe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (ue && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = me.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && me.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Be = (s) => new De(typeof s == "string" ? s : s + "", void 0, fe), S = (s, ...e) => {
  const t = s.length === 1 ? s[0] : e.reduce((i, r, o) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1], s[0]);
  return new De(t, s, fe);
}, Ve = (s, e) => {
  if (ue) s.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), r = Z.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = t.cssText, s.appendChild(i);
  }
}, $e = ue ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return Be(t);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Je, defineProperty: Qe, getOwnPropertyDescriptor: Ke, getOwnPropertyNames: qe, getOwnPropertySymbols: Ye, getPrototypeOf: Ge } = Object, P = globalThis, ye = P.trustedTypes, Ze = ye ? ye.emptyScript : "", ne = P.reactiveElementPolyfillSupport, B = (s, e) => s, X = { toAttribute(s, e) {
  switch (e) {
    case Boolean:
      s = s ? Ze : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, e) {
  let t = s;
  switch (e) {
    case Boolean:
      t = s !== null;
      break;
    case Number:
      t = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(s);
      } catch {
        t = null;
      }
  }
  return t;
} }, ge = (s, e) => !Je(s, e), xe = { attribute: !0, type: String, converter: X, reflect: !1, useDefault: !1, hasChanged: ge };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), P.litPropertyMetadata ?? (P.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let H = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = xe) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(e, i, t);
      r !== void 0 && Qe(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: r, set: o } = Ke(this.prototype, e) ?? { get() {
      return this[t];
    }, set(a) {
      this[t] = a;
    } };
    return { get: r, set(a) {
      const l = r == null ? void 0 : r.call(this);
      o == null || o.call(this, a), this.requestUpdate(e, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? xe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(B("elementProperties"))) return;
    const e = Ge(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(B("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(B("properties"))) {
      const t = this.properties, i = [...qe(t), ...Ye(t)];
      for (const r of i) this.createProperty(r, t[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, r] of t) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const r = this._$Eu(t, i);
      r !== void 0 && this._$Eh.set(r, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const r of i) t.unshift($e(r));
    } else e !== void 0 && t.push($e(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Ve(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostConnected) == null ? void 0 : i.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostDisconnected) == null ? void 0 : i.call(t);
    });
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    var o;
    const i = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, i);
    if (r !== void 0 && i.reflect === !0) {
      const a = (((o = i.converter) == null ? void 0 : o.toAttribute) !== void 0 ? i.converter : X).toAttribute(t, i.type);
      this._$Em = e, a == null ? this.removeAttribute(r) : this.setAttribute(r, a), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var o, a;
    const i = this.constructor, r = i._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const l = i.getPropertyOptions(r), n = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((o = l.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? l.converter : X;
      this._$Em = r;
      const h = n.fromAttribute(t, l.type);
      this[r] = h ?? ((a = this._$Ej) == null ? void 0 : a.get(r)) ?? h, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, r = !1, o) {
    var a;
    if (e !== void 0) {
      const l = this.constructor;
      if (r === !1 && (o = this[e]), i ?? (i = l.getPropertyOptions(e)), !((i.hasChanged ?? ge)(o, t) || i.useDefault && i.reflect && o === ((a = this._$Ej) == null ? void 0 : a.get(e)) && !this.hasAttribute(l._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: r, wrapped: o }, a) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), o !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
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
        for (const [o, a] of this._$Ep) this[o] = a;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [o, a] of r) {
        const { wrapped: l } = a, n = this[o];
        l !== !0 || this._$AL.has(o) || n === void 0 || this.C(o, void 0, a, n);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (i = this._$EO) == null || i.forEach((r) => {
        var o;
        return (o = r.hostUpdate) == null ? void 0 : o.call(r);
      }), this.update(t)) : this._$EM();
    } catch (r) {
      throw e = !1, this._$EM(), r;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((i) => {
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
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
H.elementStyles = [], H.shadowRootOptions = { mode: "open" }, H[B("elementProperties")] = /* @__PURE__ */ new Map(), H[B("finalized")] = /* @__PURE__ */ new Map(), ne == null || ne({ ReactiveElement: H }), (P.reactiveElementVersions ?? (P.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const V = globalThis, we = (s) => s, ee = V.trustedTypes, ke = ee ? ee.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, je = "$lit$", T = `lit$${Math.random().toFixed(9).slice(2)}$`, He = "?" + T, Xe = `<${He}>`, U = document, J = () => U.createComment(""), Q = (s) => s === null || typeof s != "object" && typeof s != "function", be = Array.isArray, et = (s) => be(s) || typeof (s == null ? void 0 : s[Symbol.iterator]) == "function", le = `[ 	
\f\r]`, F = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ae = /-->/g, Se = />/g, C = RegExp(`>|${le}(?:([^\\s"'>=/]+)(${le}*=${le}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ee = /'/g, Te = /"/g, Ie = /^(?:script|style|textarea|title)$/i, tt = (s) => (e, ...t) => ({ _$litType$: s, strings: e, values: t }), d = tt(1), N = Symbol.for("lit-noChange"), v = Symbol.for("lit-nothing"), Pe = /* @__PURE__ */ new WeakMap(), z = U.createTreeWalker(U, 129);
function Le(s, e) {
  if (!be(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ke !== void 0 ? ke.createHTML(e) : e;
}
const st = (s, e) => {
  const t = s.length - 1, i = [];
  let r, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = F;
  for (let l = 0; l < t; l++) {
    const n = s[l];
    let h, g, c = -1, u = 0;
    for (; u < n.length && (a.lastIndex = u, g = a.exec(n), g !== null); ) u = a.lastIndex, a === F ? g[1] === "!--" ? a = Ae : g[1] !== void 0 ? a = Se : g[2] !== void 0 ? (Ie.test(g[2]) && (r = RegExp("</" + g[2], "g")), a = C) : g[3] !== void 0 && (a = C) : a === C ? g[0] === ">" ? (a = r ?? F, c = -1) : g[1] === void 0 ? c = -2 : (c = a.lastIndex - g[2].length, h = g[1], a = g[3] === void 0 ? C : g[3] === '"' ? Te : Ee) : a === Te || a === Ee ? a = C : a === Ae || a === Se ? a = F : (a = C, r = void 0);
    const p = a === C && s[l + 1].startsWith("/>") ? " " : "";
    o += a === F ? n + Xe : c >= 0 ? (i.push(h), n.slice(0, c) + je + n.slice(c) + T + p) : n + T + (c === -2 ? l : p);
  }
  return [Le(s, o + (s[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class K {
  constructor({ strings: e, _$litType$: t }, i) {
    let r;
    this.parts = [];
    let o = 0, a = 0;
    const l = e.length - 1, n = this.parts, [h, g] = st(e, t);
    if (this.el = K.createElement(h, i), z.currentNode = this.el.content, t === 2 || t === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (r = z.nextNode()) !== null && n.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const c of r.getAttributeNames()) if (c.endsWith(je)) {
          const u = g[a++], p = r.getAttribute(c).split(T), b = /([.?@])?(.*)/.exec(u);
          n.push({ type: 1, index: o, name: b[2], strings: p, ctor: b[1] === "." ? it : b[1] === "?" ? ot : b[1] === "@" ? at : ie }), r.removeAttribute(c);
        } else c.startsWith(T) && (n.push({ type: 6, index: o }), r.removeAttribute(c));
        if (Ie.test(r.tagName)) {
          const c = r.textContent.split(T), u = c.length - 1;
          if (u > 0) {
            r.textContent = ee ? ee.emptyScript : "";
            for (let p = 0; p < u; p++) r.append(c[p], J()), z.nextNode(), n.push({ type: 2, index: ++o });
            r.append(c[u], J());
          }
        }
      } else if (r.nodeType === 8) if (r.data === He) n.push({ type: 2, index: o });
      else {
        let c = -1;
        for (; (c = r.data.indexOf(T, c + 1)) !== -1; ) n.push({ type: 7, index: o }), c += T.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const i = U.createElement("template");
    return i.innerHTML = e, i;
  }
}
function I(s, e, t = s, i) {
  var a, l;
  if (e === N) return e;
  let r = i !== void 0 ? (a = t._$Co) == null ? void 0 : a[i] : t._$Cl;
  const o = Q(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== o && ((l = r == null ? void 0 : r._$AO) == null || l.call(r, !1), o === void 0 ? r = void 0 : (r = new o(s), r._$AT(s, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = r : t._$Cl = r), r !== void 0 && (e = I(s, r._$AS(s, e.values), r, i)), e;
}
class rt {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, r = ((e == null ? void 0 : e.creationScope) ?? U).importNode(t, !0);
    z.currentNode = r;
    let o = z.nextNode(), a = 0, l = 0, n = i[0];
    for (; n !== void 0; ) {
      if (a === n.index) {
        let h;
        n.type === 2 ? h = new R(o, o.nextSibling, this, e) : n.type === 1 ? h = new n.ctor(o, n.name, n.strings, this, e) : n.type === 6 && (h = new nt(o, this, e)), this._$AV.push(h), n = i[++l];
      }
      a !== (n == null ? void 0 : n.index) && (o = z.nextNode(), a++);
    }
    return z.currentNode = U, r;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class R {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, i, r) {
    this.type = 2, this._$AH = v, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = I(this, e, t), Q(e) ? e === v || e == null || e === "" ? (this._$AH !== v && this._$AR(), this._$AH = v) : e !== this._$AH && e !== N && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : et(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== v && Q(this._$AH) ? this._$AA.nextSibling.data = e : this.T(U.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var o;
    const { values: t, _$litType$: i } = e, r = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = K.createElement(Le(i.h, i.h[0]), this.options)), i);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === r) this._$AH.p(t);
    else {
      const a = new rt(r, this), l = a.u(this.options);
      a.p(t), this.T(l), this._$AH = a;
    }
  }
  _$AC(e) {
    let t = Pe.get(e.strings);
    return t === void 0 && Pe.set(e.strings, t = new K(e)), t;
  }
  k(e) {
    be(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, r = 0;
    for (const o of e) r === t.length ? t.push(i = new R(this.O(J()), this.O(J()), this, this.options)) : i = t[r], i._$AI(o), r++;
    r < t.length && (this._$AR(i && i._$AB.nextSibling, r), t.length = r);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, t); e !== this._$AB; ) {
      const r = we(e).nextSibling;
      we(e).remove(), e = r;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class ie {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, r, o) {
    this.type = 1, this._$AH = v, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = v;
  }
  _$AI(e, t = this, i, r) {
    const o = this.strings;
    let a = !1;
    if (o === void 0) e = I(this, e, t, 0), a = !Q(e) || e !== this._$AH && e !== N, a && (this._$AH = e);
    else {
      const l = e;
      let n, h;
      for (e = o[0], n = 0; n < o.length - 1; n++) h = I(this, l[i + n], t, n), h === N && (h = this._$AH[n]), a || (a = !Q(h) || h !== this._$AH[n]), h === v ? e = v : e !== v && (e += (h ?? "") + o[n + 1]), this._$AH[n] = h;
    }
    a && !r && this.j(e);
  }
  j(e) {
    e === v ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class it extends ie {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === v ? void 0 : e;
  }
}
class ot extends ie {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== v);
  }
}
class at extends ie {
  constructor(e, t, i, r, o) {
    super(e, t, i, r, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = I(this, e, t, 0) ?? v) === N) return;
    const i = this._$AH, r = e === v && i !== v || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, o = e !== v && (i === v || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class nt {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    I(this, e);
  }
}
const lt = { I: R }, ce = V.litHtmlPolyfillSupport;
ce == null || ce(K, R), (V.litHtmlVersions ?? (V.litHtmlVersions = [])).push("3.3.2");
const ct = (s, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = r = new R(e.insertBefore(J(), o), o, void 0, t ?? {});
  }
  return r._$AI(s), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis;
let $ = class extends H {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ct(t, this.renderRoot, this.renderOptions);
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
    return N;
  }
};
var Ne;
$._$litElement$ = !0, $.finalized = !0, (Ne = M.litElementHydrateSupport) == null || Ne.call(M, { LitElement: $ });
const de = M.litElementPolyfillSupport;
de == null || de({ LitElement: $ });
(M.litElementVersions ?? (M.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const E = (s) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(s, e);
  }) : customElements.define(s, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const dt = { attribute: !0, type: String, converter: X, reflect: !1, hasChanged: ge }, ht = (s = dt, e, t) => {
  const { kind: i, metadata: r } = t;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), o.set(t.name, s), i === "accessor") {
    const { name: a } = t;
    return { set(l) {
      const n = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(a, n, s, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(a, void 0, s, l), l;
    } };
  }
  if (i === "setter") {
    const { name: a } = t;
    return function(l) {
      const n = this[a];
      e.call(this, l), this.requestUpdate(a, n, s, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function m(s) {
  return (e, t) => typeof t == "object" ? ht(s, e, t) : ((i, r, o) => {
    const a = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, i), a ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(s, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function f(s) {
  return m({ ...s, state: !0, attribute: !1 });
}
class pt {
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
    var o;
    const t = new URLSearchParams();
    (o = e.severity) != null && o.length && t.set("severity", e.severity.join(",")), e.source && t.set("source", e.source), e.search && t.set("search", e.search), e.from && t.set("from", e.from), e.to && t.set("to", e.to), e.limit !== void 0 && t.set("limit", String(e.limit)), e.offset !== void 0 && t.set("offset", String(e.offset)), e.order && t.set("order", e.order);
    const i = `${this.baseUrl}/api/messagehub/messages?${t.toString()}`, r = await fetch(i, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }
  async getMessage(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return await t.json();
  }
  async deleteMessage(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
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
    const t = await fetch(`${this.baseUrl}/api/messagehub/webhooks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}: ${await t.text()}`);
    return await t.json();
  }
  async updateWebhook(e, t) {
    const i = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${e}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(t)
      }
    );
    if (!i.ok) throw new Error(`HTTP ${i.status}: ${await i.text()}`);
    return await i.json();
  }
  async deleteWebhook(e) {
    const t = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${e}`,
      { method: "DELETE", headers: this.headers() }
    );
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ut = { CHILD: 2 }, ft = (s) => (...e) => ({ _$litDirective$: s, values: e });
let gt = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, i) {
    this._$Ct = e, this._$AM = t, this._$Ci = i;
  }
  _$AS(e, t) {
    return this.update(e, t);
  }
  update(e, t) {
    return this.render(...t);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: bt } = lt, Ce = (s) => s, Oe = () => document.createComment(""), W = (s, e, t) => {
  var o;
  const i = s._$AA.parentNode, r = e === void 0 ? s._$AB : e._$AA;
  if (t === void 0) {
    const a = i.insertBefore(Oe(), r), l = i.insertBefore(Oe(), r);
    t = new bt(a, l, s, s.options);
  } else {
    const a = t._$AB.nextSibling, l = t._$AM, n = l !== s;
    if (n) {
      let h;
      (o = t._$AQ) == null || o.call(t, s), t._$AM = s, t._$AP !== void 0 && (h = s._$AU) !== l._$AU && t._$AP(h);
    }
    if (a !== r || n) {
      let h = t._$AA;
      for (; h !== a; ) {
        const g = Ce(h).nextSibling;
        Ce(i).insertBefore(h, r), h = g;
      }
    }
  }
  return t;
}, O = (s, e, t = s) => (s._$AI(e, t), s), vt = {}, _t = (s, e = vt) => s._$AH = e, mt = (s) => s._$AH, he = (s) => {
  s._$AR(), s._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ze = (s, e, t) => {
  const i = /* @__PURE__ */ new Map();
  for (let r = e; r <= t; r++) i.set(s[r], r);
  return i;
}, $t = ft(class extends gt {
  constructor(s) {
    if (super(s), s.type !== ut.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(s, e, t) {
    let i;
    t === void 0 ? t = e : e !== void 0 && (i = e);
    const r = [], o = [];
    let a = 0;
    for (const l of s) r[a] = i ? i(l, a) : a, o[a] = t(l, a), a++;
    return { values: o, keys: r };
  }
  render(s, e, t) {
    return this.dt(s, e, t).values;
  }
  update(s, [e, t, i]) {
    const r = mt(s), { values: o, keys: a } = this.dt(e, t, i);
    if (!Array.isArray(r)) return this.ut = a, o;
    const l = this.ut ?? (this.ut = []), n = [];
    let h, g, c = 0, u = r.length - 1, p = 0, b = o.length - 1;
    for (; c <= u && p <= b; ) if (r[c] === null) c++;
    else if (r[u] === null) u--;
    else if (l[c] === a[p]) n[p] = O(r[c], o[p]), c++, p++;
    else if (l[u] === a[b]) n[b] = O(r[u], o[b]), u--, b--;
    else if (l[c] === a[b]) n[b] = O(r[c], o[b]), W(s, n[b + 1], r[c]), c++, b--;
    else if (l[u] === a[p]) n[p] = O(r[u], o[p]), W(s, r[c], r[u]), u--, p++;
    else if (h === void 0 && (h = ze(a, p, b), g = ze(l, c, u)), h.has(l[c])) if (h.has(l[u])) {
      const k = g.get(a[p]), ae = k !== void 0 ? r[k] : null;
      if (ae === null) {
        const _e = W(s, r[c]);
        O(_e, o[p]), n[p] = _e;
      } else n[p] = O(ae, o[p]), W(s, r[c], ae), r[k] = null;
      p++;
    } else he(r[u]), u--;
    else he(r[c]), c++;
    for (; p <= b; ) {
      const k = W(s, n[b + 1]);
      O(k, o[p]), n[p++] = k;
    }
    for (; c <= u; ) {
      const k = r[c++];
      k !== null && he(k);
    }
    return this.ut = a, _t(s, n), N;
  }
});
var yt = Object.defineProperty, xt = Object.getOwnPropertyDescriptor, Re = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? xt(e, t) : e, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(e, t, r) : a(r)) || r);
  return i && r && yt(e, t, r), r;
};
const wt = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·"
};
let te = class extends $ {
  constructor() {
    super(...arguments), this.items = [], this._onClick = (s) => {
      this.dispatchEvent(
        new CustomEvent("select", { detail: { msg: s }, bubbles: !0, composed: !0 })
      );
    }, this._onKey = (s, e) => {
      (s.key === "Enter" || s.key === " ") && (s.preventDefault(), this._onClick(e));
    };
  }
  render() {
    return this.items.length ? d`
      <div class="scroll" role="list">
        ${$t(
      this.items,
      (s) => s.id,
      (s) => d`
            <div
              class=${`row sev-${s.severity}`}
              tabindex="0"
              role="listitem button"
              @click=${() => this._onClick(s)}
              @keydown=${(e) => this._onKey(e, s)}
            >
              <span class="icon" aria-hidden="true">
                ${wt[s.severity] ?? "·"}
              </span>
              <span class="ts">
                ${s.timestamp.replace("T", " ").replace(/\+00:00$/, "Z")}
              </span>
              <span class="src">${s.source}</span>
              <span class="text">${s.text}</span>
            </div>
          `
    )}
      </div>
    ` : d`<div class="empty">Keine Nachrichten</div>`;
  }
};
te.styles = S`
    :host {
      display: block;
      flex: 1;
      overflow: hidden;
    }
    .scroll {
      height: 100%;
      overflow: auto;
    }
    .row {
      display: grid;
      grid-template-columns: 24px 160px 160px 1fr;
      gap: 12px;
      padding: 6px 16px;
      border-bottom: 1px solid var(--divider-color, #eee);
      cursor: pointer;
      align-items: center;
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
      text-align: center;
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
  `;
Re([
  m({ attribute: !1 })
], te.prototype, "items", 2);
te = Re([
  E("message-table")
], te);
var kt = Object.defineProperty, At = Object.getOwnPropertyDescriptor, Fe = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? At(e, t) : e, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(e, t, r) : a(r)) || r);
  return i && r && kt(e, t, r), r;
};
const Me = ["error", "warning", "info", "debug"];
let se = class extends $ {
  constructor() {
    super(...arguments), this.selected = [...Me];
  }
  _toggle(s) {
    const e = this.selected.includes(s) ? this.selected.filter((t) => t !== s) : [...this.selected, s];
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { severities: e },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return d`
      <div class="chips">
        ${Me.map(
      (s) => d`<button
            class=${`chip sev-${s} ${this.selected.includes(s) ? "active" : ""}`}
            @click=${() => this._toggle(s)}
          >
            ${s}
          </button>`
    )}
      </div>
    `;
  }
};
se.styles = S`
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
Fe([
  m({ attribute: !1 })
], se.prototype, "selected", 2);
se = Fe([
  E("severity-filter")
], se);
var St = Object.defineProperty, Et = Object.getOwnPropertyDescriptor, oe = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Et(e, t) : e, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(e, t, r) : a(r)) || r);
  return i && r && St(e, t, r), r;
};
let L = class extends $ {
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
  _onChange(s) {
    const e = s.target.value;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { source: e },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return d`
      <select @change=${this._onChange} .value=${this.selected}>
        <option value="">Alle Quellen</option>
        ${this._sources.map((s) => d`<option value=${s}>${s}</option>`)}
      </select>
    `;
  }
};
L.styles = S`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `;
oe([
  m({ attribute: !1 })
], L.prototype, "api", 2);
oe([
  m({ attribute: !1 })
], L.prototype, "selected", 2);
oe([
  f()
], L.prototype, "_sources", 2);
L = oe([
  E("source-filter")
], L);
var Tt = Object.defineProperty, Pt = Object.getOwnPropertyDescriptor, ve = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Pt(e, t) : e, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(e, t, r) : a(r)) || r);
  return i && r && Tt(e, t, r), r;
};
let q = class extends $ {
  _set(s) {
    let e;
    const t = /* @__PURE__ */ new Date();
    s === "1h" ? e = new Date(t.getTime() - 36e5).toISOString() : s === "24h" ? e = new Date(t.getTime() - 864e5).toISOString() : s === "7d" ? e = new Date(t.getTime() - 7 * 864e5).toISOString() : e = void 0, this.dispatchEvent(
      new CustomEvent("change", {
        detail: { fromIso: e, toIso: void 0 },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return d`
      <div class="presets">
        <button @click=${() => this._set("1h")}>1h</button>
        <button @click=${() => this._set("24h")}>24h</button>
        <button @click=${() => this._set("7d")}>7d</button>
        <button @click=${() => this._set("all")}>Alle</button>
      </div>
    `;
  }
};
q.styles = S`
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
ve([
  m({ attribute: !1 })
], q.prototype, "fromIso", 2);
ve([
  m({ attribute: !1 })
], q.prototype, "toIso", 2);
q = ve([
  E("time-range-filter")
], q);
var Ct = Object.defineProperty, Ot = Object.getOwnPropertyDescriptor, We = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Ot(e, t) : e, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(e, t, r) : a(r)) || r);
  return i && r && Ct(e, t, r), r;
};
let re = class extends $ {
  _close() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: !0, composed: !0 }));
  }
  async _delete() {
    confirm("Nachricht endgueltig loeschen?") && this.dispatchEvent(
      new CustomEvent("delete", {
        detail: { id: this.msg.id },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return d`
      <aside>
        <header>
          <h2>Detail #${this.msg.id}</h2>
          <button class="close" @click=${this._close}>×</button>
        </header>
        <dl>
          <dt>Severity</dt>
          <dd class=${`sev-${this.msg.severity}`}>${this.msg.severity}</dd>
          <dt>Source</dt>
          <dd>${this.msg.source}</dd>
          <dt>Timestamp</dt>
          <dd>${this.msg.timestamp}</dd>
          <dt>Webhook</dt>
          <dd>${this.msg.webhook_id ?? "-"}</dd>
        </dl>
        <h3>Text</h3>
        <pre class="text">${this.msg.text}</pre>
        ${this.msg.metadata ? d`<h3>Metadata</h3>
              <pre class="meta">${JSON.stringify(this.msg.metadata, null, 2)}</pre>` : null}
        <footer>
          <button class="del" @click=${this._delete}>Loeschen</button>
        </footer>
      </aside>
    `;
  }
};
re.styles = S`
    :host {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(480px, 100%);
      background: var(--card-background-color, white);
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
      display: flex;
    }
    aside {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 16px;
      overflow: auto;
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
    }
    .close {
      font-size: 1.4em;
      background: transparent;
      border: 0;
      cursor: pointer;
      color: inherit;
    }
    dl {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: 4px 12px;
      margin: 12px 0;
    }
    dt {
      color: var(--secondary-text-color, #666);
      font-size: 0.85em;
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
    pre.meta {
      background: var(--secondary-background-color, #f5f5f5);
      padding: 8px;
      border-radius: 4px;
      overflow: auto;
      max-height: 320px;
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
We([
  m({ attribute: !1 })
], re.prototype, "msg", 2);
re = We([
  E("detail-pane")
], re);
var zt = Object.defineProperty, Mt = Object.getOwnPropertyDescriptor, w = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Mt(e, t) : e, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(e, t, r) : a(r)) || r);
  return i && r && zt(e, t, r), r;
};
const Ut = ["debug", "info", "warning", "error"], Nt = JSON.stringify(
  {
    severity: "$.level",
    source: "$.app.name",
    text: "$.message",
    metadata: "$.extra"
  },
  null,
  2
), pe = /^[a-z0-9._-]{1,64}$/;
function Dt(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss").replace(/[\s/\\]+/g, "-").replace(/[^a-z0-9._-]/g, "").slice(0, 64);
}
let x = class extends $ {
  constructor() {
    super(...arguments), this.editing = null, this._name = "", this._source = "", this._severity = "info", this._enabled = !0, this._mappingText = "", this._error = "", this._saving = !1;
  }
  willUpdate(s) {
    if (s.has("editing")) {
      const e = this.editing;
      this._name = (e == null ? void 0 : e.name) ?? "", this._source = (e == null ? void 0 : e.default_source) ?? "", this._severity = (e == null ? void 0 : e.default_severity) ?? "info", this._enabled = (e == null ? void 0 : e.enabled) ?? !0, this._mappingText = e != null && e.field_map ? JSON.stringify(e.field_map, null, 2) : "", this._error = "";
    }
  }
  _validateMapping() {
    if (!this._mappingText.trim()) return null;
    try {
      const s = JSON.parse(this._mappingText);
      if (typeof s != "object" || Array.isArray(s))
        throw new Error("muss ein JSON-Objekt sein");
      return s;
    } catch (s) {
      throw new Error(`Mapping-JSON ungueltig: ${s.message}`);
    }
  }
  async _save() {
    if (this.api) {
      this._error = "", this._saving = !0;
      try {
        const s = this._validateMapping();
        if (!this._name.trim()) throw new Error("Name darf nicht leer sein");
        if (!pe.test(this._source))
          throw new Error("Source ist leer oder ungueltig.");
        let e;
        this.editing ? e = await this.api.updateWebhook(this.editing.webhook_id, {
          name: this._name.trim(),
          default_source: this._source,
          default_severity: this._severity,
          field_map: s,
          enabled: this._enabled
        }) : e = await this.api.createWebhook({
          name: this._name.trim(),
          default_source: this._source,
          default_severity: this._severity,
          field_map: s,
          enabled: this._enabled
        }), this.dispatchEvent(
          new CustomEvent("saved", {
            detail: { webhook: e },
            bubbles: !0,
            composed: !0
          })
        );
      } catch (s) {
        this._error = s.message;
      } finally {
        this._saving = !1;
      }
    }
  }
  _cancel() {
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: !0, composed: !0 }));
  }
  _useExample() {
    this._mappingText = Nt;
  }
  render() {
    const s = this.editing !== null;
    return d`
      <div class="card">
        <h3>${s ? "Webhook bearbeiten" : "Neuen Webhook anlegen"}</h3>

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
              ${this._source && pe.test(this._source) ? d`<span class="ok-badge" title="ok">✓</span>` : null}
            </span>
            <input
              type="text"
              class=${this._source && !pe.test(this._source) ? "invalid" : ""}
              .value=${this._source}
              @input=${(e) => {
      const t = e.target.value;
      this._source = Dt(t);
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
              ${Ut.map(
      (e) => d`<option value=${e} ?selected=${this._severity === e}>${e}</option>`
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

        ${this._error ? d`<div class="error">${this._error}</div>` : null}

        <div class="actions">
          <button class="primary" ?disabled=${this._saving} @click=${this._save}>
            ${this._saving ? "speichere…" : s ? "Speichern" : "Anlegen"}
          </button>
          <button @click=${this._cancel}>Abbrechen</button>
        </div>
      </div>
    `;
  }
};
x.styles = S`
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
w([
  m({ attribute: !1 })
], x.prototype, "api", 2);
w([
  m({ attribute: !1 })
], x.prototype, "editing", 2);
w([
  f()
], x.prototype, "_name", 2);
w([
  f()
], x.prototype, "_source", 2);
w([
  f()
], x.prototype, "_severity", 2);
w([
  f()
], x.prototype, "_enabled", 2);
w([
  f()
], x.prototype, "_mappingText", 2);
w([
  f()
], x.prototype, "_error", 2);
w([
  f()
], x.prototype, "_saving", 2);
x = w([
  E("webhook-form")
], x);
var jt = Object.defineProperty, Ht = Object.getOwnPropertyDescriptor, j = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Ht(e, t) : e, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(e, t, r) : a(r)) || r);
  return i && r && jt(e, t, r), r;
};
let A = class extends $ {
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
  async _copyUrl(s) {
    const e = `${window.location.origin}/api/webhook/${s}`;
    try {
      await navigator.clipboard.writeText(e), this._showToast("URL kopiert");
    } catch {
      this._showToast("Kopieren fehlgeschlagen");
    }
  }
  async _delete(s) {
    this.api && window.confirm(`Webhook „${s.name}" wirklich loeschen?`) && (await this.api.deleteWebhook(s.webhook_id), this._showToast(`„${s.name}" geloescht`), await this._load());
  }
  async _toggle(s) {
    this.api && (await this.api.updateWebhook(s.webhook_id, { enabled: !s.enabled }), await this._load());
  }
  _onSaved(s) {
    this._showForm = !1, this._editing = null, this._showToast("Webhook gespeichert"), this._load();
  }
  _onCancel() {
    this._showForm = !1, this._editing = null;
  }
  _add() {
    this._editing = null, this._showForm = !0;
  }
  _edit(s) {
    this._editing = s, this._showForm = !0;
  }
  _showToast(s) {
    this._toast = s, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2400);
  }
  _renderEmpty() {
    return d`
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
  _renderItem(s) {
    const e = `${window.location.origin}/api/webhook/${s.webhook_id}`;
    return d`
      <div class=${`card ${s.enabled ? "" : "disabled"}`}>
        <header>
          <div class="title">
            <h4>${s.name}</h4>
            <span class=${`status ${s.enabled ? "ok" : "off"}`}>
              ${s.enabled ? "aktiv" : "deaktiviert"}
            </span>
          </div>
          <div class="actions">
            <button @click=${() => this._toggle(s)}>
              ${s.enabled ? "Deaktivieren" : "Aktivieren"}
            </button>
            <button @click=${() => this._edit(s)}>Bearbeiten</button>
            <button class="danger" @click=${() => this._delete(s)}>Loeschen</button>
          </div>
        </header>

        <dl>
          <dt>Default-Source</dt>
          <dd><code>${s.default_source}</code></dd>
          <dt>Default-Severity</dt>
          <dd><code>${s.default_severity}</code></dd>
          <dt>Webhook-URL</dt>
          <dd>
            <code class="url">${e}</code>
            <button class="link" @click=${() => this._copyUrl(s.webhook_id)}>
              kopieren
            </button>
          </dd>
          ${s.field_map ? d`<dt>JSONPath-Mapping</dt>
                <dd>
                  <pre><code>${JSON.stringify(s.field_map, null, 2)}</code></pre>
                </dd>` : null}
        </dl>
      </div>
    `;
  }
  render() {
    return d`
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
            ${this._items.length > 0 && !this._showForm ? d`<button class="primary" @click=${this._add}>+ Webhook anlegen</button>` : null}
          </header>

          ${this._showForm ? d`<webhook-form
                .api=${this.api}
                .editing=${this._editing}
                @saved=${this._onSaved}
                @cancel=${this._onCancel}
              ></webhook-form>` : null}

          ${this._loading ? d`<p class="status">lade…</p>` : this._items.length === 0 && !this._showForm ? this._renderEmpty() : d`<div class="grid">${this._items.map((s) => this._renderItem(s))}</div>`}
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

        ${this._toast ? d`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
};
A.styles = S`
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
j([
  m({ attribute: !1 })
], A.prototype, "api", 2);
j([
  f()
], A.prototype, "_items", 2);
j([
  f()
], A.prototype, "_loading", 2);
j([
  f()
], A.prototype, "_showForm", 2);
j([
  f()
], A.prototype, "_editing", 2);
j([
  f()
], A.prototype, "_toast", 2);
A = j([
  E("settings-view")
], A);
var It = Object.defineProperty, Lt = Object.getOwnPropertyDescriptor, Y = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Lt(e, t) : e, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(e, t, r) : a(r)) || r);
  return i && r && It(e, t, r), r;
};
const Rt = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
  debug: "Debug"
}, Ft = {
  error: "var(--error-color, #db4437)",
  warning: "var(--warning-color, #ff9800)",
  info: "var(--info-color, #03a9f4)",
  debug: "var(--secondary-text-color, #888)"
};
let D = class extends $ {
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
        const [s, e] = await Promise.all([
          this.api.getStats(),
          this.api.listSources()
        ]);
        this._stats = s, this._sources = e;
      } finally {
        this._loading = !1;
      }
    }
  }
  _renderSeverityBars() {
    if (!this._stats) return d``;
    const s = this._stats.severity_24h, e = Math.max(1, Object.values(s).reduce((i, r) => i + r, 0));
    return d`
      <div class="bars">
        ${["error", "warning", "info", "debug"].map((i) => {
      const r = s[i] ?? 0, o = r / e * 100;
      return d`
            <div class="bar-row">
              <span class="bar-label">${Rt[i] ?? i}</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  style=${`width: ${o}%; background: ${Ft[i]}`}
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
      return d`<div class="root"><p class="status">lade…</p></div>`;
    if (!this._stats)
      return d`<div class="root"><p class="status">Keine Daten verfuegbar.</p></div>`;
    const s = this._stats, e = Object.values(s.severity_24h).reduce((t, i) => t + i, 0);
    return d`
      <div class="root">
        <section>
          <h2>Live-Status</h2>
          <div class="kpis">
            <div class="kpi">
              <span class="kpi-label">Gesamt</span>
              <span class="kpi-value">${s.total.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">Nachrichten in der Datenbank</span>
            </div>
            <div class="kpi accent-info">
              <span class="kpi-label">Letzte 24h</span>
              <span class="kpi-value">${e.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">alle Severities</span>
            </div>
            <div class="kpi accent-error">
              <span class="kpi-label">Errors 24h</span>
              <span class="kpi-value">${s.severity_24h.error ?? 0}</span>
              <span class="kpi-hint">unbehoben + bestaetigt</span>
            </div>
            <div class="kpi accent-warning">
              <span class="kpi-label">Warnings 24h</span>
              <span class="kpi-value">${s.severity_24h.warning ?? 0}</span>
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
            ${this._sources.length === 0 ? d`<p class="status">
                  Noch keine Quellen erfasst. Sobald die erste Nachricht reinkommt,
                  erscheint sie hier.
                </p>` : d`<ul class="sources">
                  ${this._sources.map(
      (t) => d`<li><code>${t}</code></li>`
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
D.styles = S`
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
Y([
  m({ attribute: !1 })
], D.prototype, "api", 2);
Y([
  f()
], D.prototype, "_stats", 2);
Y([
  f()
], D.prototype, "_sources", 2);
Y([
  f()
], D.prototype, "_loading", 2);
D = Y([
  E("stats-view")
], D);
var Wt = Object.defineProperty, Bt = Object.getOwnPropertyDescriptor, y = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Bt(e, t) : e, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(e, t, r) : a(r)) || r);
  return i && r && Wt(e, t, r), r;
};
const Ue = "messagehub.filters", G = {
  severity: ["error", "warning", "info"],
  source: "",
  search: ""
};
let _ = class extends $ {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "messages", this._items = [], this._total = 0, this._loading = !1, this._selected = null, this._filters = this._loadFilters(), this._newCount = 0, this._testing = !1, this._toast = "", this._api = new pt(), this._onSeverityChange = (s) => {
      this._filters = { ...this._filters, severity: s.detail.severities }, this._persistFilters(), this._reload();
    }, this._onSourceChange = (s) => {
      this._filters = { ...this._filters, source: s.detail.source }, this._persistFilters(), this._reload();
    }, this._onTimeRange = (s) => {
      this._filters = { ...this._filters, fromIso: s.detail.fromIso, toIso: s.detail.toIso }, this._persistFilters(), this._reload();
    }, this._onSelect = (s) => {
      this._selected = s.detail.msg;
    }, this._onDelete = async (s) => {
      try {
        await this._api.deleteMessage(s.detail.id), this._items = this._items.filter((e) => e.id !== s.detail.id), this._total = Math.max(0, this._total - 1), this._selected = null, this._showToast("Nachricht geloescht");
      } catch (e) {
        this._showToast(`Loeschen fehlgeschlagen: ${e.message}`);
      }
    };
  }
  firstUpdated() {
    var s;
    (s = this.hass) != null && s.auth && this._api.setAuth(this.hass.auth.data.access_token), this._reload(), this._subscribeLive();
  }
  disconnectedCallback() {
    var s;
    super.disconnectedCallback(), (s = this._unsubLive) == null || s.call(this);
  }
  async _subscribeLive() {
    var s, e;
    (e = (s = this.hass) == null ? void 0 : s.connection) != null && e.subscribeEvents && (this._unsubLive = await this.hass.connection.subscribeEvents((t) => {
      const i = t.data;
      this._matchesFilters(i) && (this._items = [i, ...this._items].slice(0, 200), this._total += 1, this._newCount += 1, window.setTimeout(() => this._newCount = Math.max(0, this._newCount - 1), 4e3));
    }, "messagehub_message_added"));
  }
  _matchesFilters(s) {
    return !(this._filters.severity.length && !this._filters.severity.includes(s.severity) || this._filters.source && s.source !== this._filters.source || this._filters.search && !s.text.toLowerCase().includes(this._filters.search.toLowerCase()));
  }
  _loadFilters() {
    try {
      const s = localStorage.getItem(Ue);
      if (s) return { ...G, ...JSON.parse(s) };
    } catch {
    }
    return { ...G };
  }
  _persistFilters() {
    try {
      localStorage.setItem(Ue, JSON.stringify(this._filters));
    } catch {
    }
  }
  _resetFilters() {
    this._filters = { ...G }, this._persistFilters(), this._reload();
  }
  async _reload() {
    this._loading = !0;
    try {
      const s = await this._api.listMessages({
        severity: this._filters.severity,
        source: this._filters.source || void 0,
        search: this._filters.search || void 0,
        from: this._filters.fromIso,
        to: this._filters.toIso,
        limit: 100
      });
      this._items = s.items, this._total = s.total;
    } catch (s) {
      this._showToast(`Laden fehlgeschlagen: ${s.message}`);
    } finally {
      this._loading = !1;
    }
  }
  async _sendTestMessage() {
    var s;
    if (!((s = this.hass) != null && s.callService)) {
      this._showToast("Test nicht verfuegbar — hass.callService fehlt");
      return;
    }
    this._testing = !0;
    try {
      const e = ["info", "warning", "error", "info", "info"], t = ["pihole", "knx-bus", "backup-job", "test-script"], i = [
        "Demo-Nachricht aus dem Panel",
        "Test: DNS-Query erfolgreich",
        "Backup abgeschlossen, Dauer 12 min",
        "KNX 1/2/3 — Wohnzimmer Deckenlicht ein"
      ], r = (o) => Math.floor(Math.random() * o);
      await this.hass.callService("messagehub", "add_message", {
        severity: e[r(e.length)],
        source: t[r(t.length)],
        text: i[r(i.length)],
        metadata: { source_panel: !0, ts: (/* @__PURE__ */ new Date()).toISOString() }
      }), this._showToast("Test-Nachricht gesendet"), window.setTimeout(() => void this._reload(), 300);
    } catch (e) {
      this._showToast(`Service-Call fehlgeschlagen: ${e.message}`);
    } finally {
      this._testing = !1;
    }
  }
  _showToast(s) {
    this._toast = s, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  _debounceSearch(s) {
    this._debounceTimer && window.clearTimeout(this._debounceTimer), this._debounceTimer = window.setTimeout(() => {
      this._filters = { ...this._filters, search: s }, this._persistFilters(), this._reload();
    }, 300);
  }
  _hasActiveFilters() {
    return this._filters.severity.length !== G.severity.length || this._filters.source !== "" || this._filters.search !== "" || this._filters.fromIso !== void 0;
  }
  _renderEmptyMessages() {
    return d`
      <div class="empty">
        <h3>Noch keine Nachrichten ${this._hasActiveFilters() ? "fuer diese Filter" : ""}</h3>
        <p>
          ${this._hasActiveFilters() ? "Probiere weniger restriktive Filter oder setze sie zurueck." : "Sobald Nachrichten ueber Webhook, MQTT, Eventbus oder den Service messagehub.add_message reinkommen, erscheinen sie hier."}
        </p>
        <div class="empty-actions">
          ${this._hasActiveFilters() ? d`<button @click=${this._resetFilters}>Filter zuruecksetzen</button>` : null}
          <button class="primary" ?disabled=${this._testing} @click=${this._sendTestMessage}>
            ${this._testing ? "sende…" : "+ Test-Nachricht senden"}
          </button>
        </div>
      </div>
    `;
  }
  _renderMessages() {
    return d`
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
          @input=${(s) => {
      const e = s.target.value;
      this._debounceSearch(e);
    }}
        />
        <time-range-filter
          .fromIso=${this._filters.fromIso}
          .toIso=${this._filters.toIso}
          @change=${this._onTimeRange}
        ></time-range-filter>
        ${this._hasActiveFilters() ? d`<button class="filter-reset" @click=${this._resetFilters}>
              Filter loeschen
            </button>` : null}
      </div>

      <div class="status-bar">
        <span>
          ${this._loading ? "lade…" : `${this._items.length.toLocaleString("de-DE")} von ${this._total.toLocaleString("de-DE")}`}
          ${this._newCount > 0 ? d`<span class="new-badge"
                >+${this._newCount} neue</span
              >` : null}
        </span>
        <div class="status-actions">
          <button ?disabled=${this._testing} @click=${this._sendTestMessage}>
            ${this._testing ? "sende…" : "+ Test"}
          </button>
        </div>
      </div>

      ${this._items.length === 0 && !this._loading ? this._renderEmptyMessages() : d`<message-table
            .items=${this._items}
            @select=${this._onSelect}
          ></message-table>`}

      ${this._selected ? d`<detail-pane
            .msg=${this._selected}
            @close=${() => this._selected = null}
            @delete=${this._onDelete}
          ></detail-pane>` : null}
    `;
  }
  render() {
    return d`
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
          ${this._tab === "stats" ? d`<stats-view .api=${this._api}></stats-view>` : null}
          ${this._tab === "settings" ? d`<settings-view .api=${this._api}></settings-view>` : null}
        </main>

        ${this._toast ? d`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
};
_.styles = S`
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
y([
  m({ attribute: !1 })
], _.prototype, "hass", 2);
y([
  m({ type: Boolean })
], _.prototype, "narrow", 2);
y([
  m({ attribute: !1 })
], _.prototype, "panel", 2);
y([
  f()
], _.prototype, "_tab", 2);
y([
  f()
], _.prototype, "_items", 2);
y([
  f()
], _.prototype, "_total", 2);
y([
  f()
], _.prototype, "_loading", 2);
y([
  f()
], _.prototype, "_selected", 2);
y([
  f()
], _.prototype, "_filters", 2);
y([
  f()
], _.prototype, "_newCount", 2);
y([
  f()
], _.prototype, "_testing", 2);
y([
  f()
], _.prototype, "_toast", 2);
_ = y([
  E("messagehub-panel")
], _);
export {
  _ as MessageHubPanel
};
