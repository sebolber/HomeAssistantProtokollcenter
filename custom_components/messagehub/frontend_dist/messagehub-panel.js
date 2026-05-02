/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ke = globalThis, Fe = ke.ShadowRoot && (ke.ShadyCSS === void 0 || ke.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, je = Symbol(), Je = /* @__PURE__ */ new WeakMap();
let wt = class {
  constructor(e, s, a) {
    if (this._$cssResult$ = !0, a !== je) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (Fe && e === void 0) {
      const a = s !== void 0 && s.length === 1;
      a && (e = Je.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), a && Je.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Ct = (t) => new wt(typeof t == "string" ? t : t + "", void 0, je), y = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((a, r, o) => a + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + t[o + 1], t[0]);
  return new wt(s, t, je);
}, Mt = (t, e) => {
  if (Fe) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const a = document.createElement("style"), r = ke.litNonce;
    r !== void 0 && a.setAttribute("nonce", r), a.textContent = s.cssText, t.appendChild(a);
  }
}, Ye = Fe ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const a of e.cssRules) s += a.cssText;
  return Ct(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Nt, defineProperty: Ht, getOwnPropertyDescriptor: It, getOwnPropertyNames: Bt, getOwnPropertySymbols: Ft, getPrototypeOf: jt } = Object, F = globalThis, Qe = F.trustedTypes, Ut = Qe ? Qe.emptyScript : "", Le = F.reactiveElementPolyfillSupport, he = (t, e) => t, Se = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Ut : null;
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
} }, Ue = (t, e) => !Nt(t, e), Ze = { attribute: !0, type: String, converter: Se, reflect: !1, useDefault: !1, hasChanged: Ue };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), F.litPropertyMetadata ?? (F.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let ee = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = Ze) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const a = Symbol(), r = this.getPropertyDescriptor(e, a, s);
      r !== void 0 && Ht(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, s, a) {
    const { get: r, set: o } = It(this.prototype, e) ?? { get() {
      return this[s];
    }, set(n) {
      this[s] = n;
    } };
    return { get: r, set(n) {
      const d = r == null ? void 0 : r.call(this);
      o == null || o.call(this, n), this.requestUpdate(e, d, a);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Ze;
  }
  static _$Ei() {
    if (this.hasOwnProperty(he("elementProperties"))) return;
    const e = jt(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(he("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(he("properties"))) {
      const s = this.properties, a = [...Bt(s), ...Ft(s)];
      for (const r of a) this.createProperty(r, s[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const s = litPropertyMetadata.get(e);
      if (s !== void 0) for (const [a, r] of s) this.elementProperties.set(a, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, a] of this.elementProperties) {
      const r = this._$Eu(s, a);
      r !== void 0 && this._$Eh.set(r, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const s = [];
    if (Array.isArray(e)) {
      const a = new Set(e.flat(1 / 0).reverse());
      for (const r of a) s.unshift(Ye(r));
    } else e !== void 0 && s.push(Ye(e));
    return s;
  }
  static _$Eu(e, s) {
    const a = s.attribute;
    return a === !1 ? void 0 : typeof a == "string" ? a : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const a of s.keys()) this.hasOwnProperty(a) && (e.set(a, this[a]), delete this[a]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Mt(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((s) => {
      var a;
      return (a = s.hostConnected) == null ? void 0 : a.call(s);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((s) => {
      var a;
      return (a = s.hostDisconnected) == null ? void 0 : a.call(s);
    });
  }
  attributeChangedCallback(e, s, a) {
    this._$AK(e, a);
  }
  _$ET(e, s) {
    var o;
    const a = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, a);
    if (r !== void 0 && a.reflect === !0) {
      const n = (((o = a.converter) == null ? void 0 : o.toAttribute) !== void 0 ? a.converter : Se).toAttribute(s, a.type);
      this._$Em = e, n == null ? this.removeAttribute(r) : this.setAttribute(r, n), this._$Em = null;
    }
  }
  _$AK(e, s) {
    var o, n;
    const a = this.constructor, r = a._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const d = a.getPropertyOptions(r), c = typeof d.converter == "function" ? { fromAttribute: d.converter } : ((o = d.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? d.converter : Se;
      this._$Em = r;
      const p = c.fromAttribute(s, d.type);
      this[r] = p ?? ((n = this._$Ej) == null ? void 0 : n.get(r)) ?? p, this._$Em = null;
    }
  }
  requestUpdate(e, s, a, r = !1, o) {
    var n;
    if (e !== void 0) {
      const d = this.constructor;
      if (r === !1 && (o = this[e]), a ?? (a = d.getPropertyOptions(e)), !((a.hasChanged ?? Ue)(o, s) || a.useDefault && a.reflect && o === ((n = this._$Ej) == null ? void 0 : n.get(e)) && !this.hasAttribute(d._$Eu(e, a)))) return;
      this.C(e, s, a);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: a, reflect: r, wrapped: o }, n) {
    a && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, n ?? s ?? this[e]), o !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || a || (s = void 0), this._$AL.set(e, s)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
    var a;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [o, n] of this._$Ep) this[o] = n;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [o, n] of r) {
        const { wrapped: d } = n, c = this[o];
        d !== !0 || this._$AL.has(o) || c === void 0 || this.C(o, void 0, n, c);
      }
    }
    let e = !1;
    const s = this._$AL;
    try {
      e = this.shouldUpdate(s), e ? (this.willUpdate(s), (a = this._$EO) == null || a.forEach((r) => {
        var o;
        return (o = r.hostUpdate) == null ? void 0 : o.call(r);
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
    (s = this._$EO) == null || s.forEach((a) => {
      var r;
      return (r = a.hostUpdated) == null ? void 0 : r.call(a);
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
ee.elementStyles = [], ee.shadowRootOptions = { mode: "open" }, ee[he("elementProperties")] = /* @__PURE__ */ new Map(), ee[he("finalized")] = /* @__PURE__ */ new Map(), Le == null || Le({ ReactiveElement: ee }), (F.reactiveElementVersions ?? (F.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ce = globalThis, Xe = (t) => t, Te = ce.trustedTypes, et = Te ? Te.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, yt = "$lit$", B = `lit$${Math.random().toFixed(9).slice(2)}$`, $t = "?" + B, Rt = `<${$t}>`, V = document, pe = () => V.createComment(""), me = (t) => t === null || typeof t != "object" && typeof t != "function", Re = Array.isArray, Kt = (t) => Re(t) || typeof (t == null ? void 0 : t[Symbol.iterator]) == "function", Oe = `[ 	
\f\r]`, ne = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, tt = /-->/g, st = />/g, R = RegExp(`>|${Oe}(?:([^\\s"'>=/]+)(${Oe}*=${Oe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), at = /'/g, rt = /"/g, kt = /^(?:script|style|textarea|title)$/i, Gt = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), i = Gt(1), q = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), it = /* @__PURE__ */ new WeakMap(), G = V.createTreeWalker(V, 129);
function St(t, e) {
  if (!Re(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return et !== void 0 ? et.createHTML(e) : e;
}
const Wt = (t, e) => {
  const s = t.length - 1, a = [];
  let r, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = ne;
  for (let d = 0; d < s; d++) {
    const c = t[d];
    let p, b, m = -1, v = 0;
    for (; v < c.length && (n.lastIndex = v, b = n.exec(c), b !== null); ) v = n.lastIndex, n === ne ? b[1] === "!--" ? n = tt : b[1] !== void 0 ? n = st : b[2] !== void 0 ? (kt.test(b[2]) && (r = RegExp("</" + b[2], "g")), n = R) : b[3] !== void 0 && (n = R) : n === R ? b[0] === ">" ? (n = r ?? ne, m = -1) : b[1] === void 0 ? m = -2 : (m = n.lastIndex - b[2].length, p = b[1], n = b[3] === void 0 ? R : b[3] === '"' ? rt : at) : n === rt || n === at ? n = R : n === tt || n === st ? n = ne : (n = R, r = void 0);
    const u = n === R && t[d + 1].startsWith("/>") ? " " : "";
    o += n === ne ? c + Rt : m >= 0 ? (a.push(p), c.slice(0, m) + yt + c.slice(m) + B + u) : c + B + (m === -2 ? d : u);
  }
  return [St(t, o + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), a];
};
class ue {
  constructor({ strings: e, _$litType$: s }, a) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const d = e.length - 1, c = this.parts, [p, b] = Wt(e, s);
    if (this.el = ue.createElement(p, a), G.currentNode = this.el.content, s === 2 || s === 3) {
      const m = this.el.content.firstChild;
      m.replaceWith(...m.childNodes);
    }
    for (; (r = G.nextNode()) !== null && c.length < d; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const m of r.getAttributeNames()) if (m.endsWith(yt)) {
          const v = b[n++], u = r.getAttribute(m).split(B), g = /([.?@])?(.*)/.exec(v);
          c.push({ type: 1, index: o, name: g[2], strings: u, ctor: g[1] === "." ? qt : g[1] === "?" ? Jt : g[1] === "@" ? Yt : Ee }), r.removeAttribute(m);
        } else m.startsWith(B) && (c.push({ type: 6, index: o }), r.removeAttribute(m));
        if (kt.test(r.tagName)) {
          const m = r.textContent.split(B), v = m.length - 1;
          if (v > 0) {
            r.textContent = Te ? Te.emptyScript : "";
            for (let u = 0; u < v; u++) r.append(m[u], pe()), G.nextNode(), c.push({ type: 2, index: ++o });
            r.append(m[v], pe());
          }
        }
      } else if (r.nodeType === 8) if (r.data === $t) c.push({ type: 2, index: o });
      else {
        let m = -1;
        for (; (m = r.data.indexOf(B, m + 1)) !== -1; ) c.push({ type: 7, index: o }), m += B.length - 1;
      }
      o++;
    }
  }
  static createElement(e, s) {
    const a = V.createElement("template");
    return a.innerHTML = e, a;
  }
}
function te(t, e, s = t, a) {
  var n, d;
  if (e === q) return e;
  let r = a !== void 0 ? (n = s._$Co) == null ? void 0 : n[a] : s._$Cl;
  const o = me(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== o && ((d = r == null ? void 0 : r._$AO) == null || d.call(r, !1), o === void 0 ? r = void 0 : (r = new o(t), r._$AT(t, s, a)), a !== void 0 ? (s._$Co ?? (s._$Co = []))[a] = r : s._$Cl = r), r !== void 0 && (e = te(t, r._$AS(t, e.values), r, a)), e;
}
class Vt {
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
    const { el: { content: s }, parts: a } = this._$AD, r = ((e == null ? void 0 : e.creationScope) ?? V).importNode(s, !0);
    G.currentNode = r;
    let o = G.nextNode(), n = 0, d = 0, c = a[0];
    for (; c !== void 0; ) {
      if (n === c.index) {
        let p;
        c.type === 2 ? p = new ie(o, o.nextSibling, this, e) : c.type === 1 ? p = new c.ctor(o, c.name, c.strings, this, e) : c.type === 6 && (p = new Qt(o, this, e)), this._$AV.push(p), c = a[++d];
      }
      n !== (c == null ? void 0 : c.index) && (o = G.nextNode(), n++);
    }
    return G.currentNode = V, r;
  }
  p(e) {
    let s = 0;
    for (const a of this._$AV) a !== void 0 && (a.strings !== void 0 ? (a._$AI(e, a, s), s += a.strings.length - 2) : a._$AI(e[s])), s++;
  }
}
class ie {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, s, a, r) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = a, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
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
    e = te(this, e, s), me(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== q && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Kt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== h && me(this._$AH) ? this._$AA.nextSibling.data = e : this.T(V.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var o;
    const { values: s, _$litType$: a } = e, r = typeof a == "number" ? this._$AC(e) : (a.el === void 0 && (a.el = ue.createElement(St(a.h, a.h[0]), this.options)), a);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === r) this._$AH.p(s);
    else {
      const n = new Vt(r, this), d = n.u(this.options);
      n.p(s), this.T(d), this._$AH = n;
    }
  }
  _$AC(e) {
    let s = it.get(e.strings);
    return s === void 0 && it.set(e.strings, s = new ue(e)), s;
  }
  k(e) {
    Re(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let a, r = 0;
    for (const o of e) r === s.length ? s.push(a = new ie(this.O(pe()), this.O(pe()), this, this.options)) : a = s[r], a._$AI(o), r++;
    r < s.length && (this._$AR(a && a._$AB.nextSibling, r), s.length = r);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    var a;
    for ((a = this._$AP) == null ? void 0 : a.call(this, !1, !0, s); e !== this._$AB; ) {
      const r = Xe(e).nextSibling;
      Xe(e).remove(), e = r;
    }
  }
  setConnected(e) {
    var s;
    this._$AM === void 0 && (this._$Cv = e, (s = this._$AP) == null || s.call(this, e));
  }
}
class Ee {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, s, a, r, o) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = s, this._$AM = r, this.options = o, a.length > 2 || a[0] !== "" || a[1] !== "" ? (this._$AH = Array(a.length - 1).fill(new String()), this.strings = a) : this._$AH = h;
  }
  _$AI(e, s = this, a, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = te(this, e, s, 0), n = !me(e) || e !== this._$AH && e !== q, n && (this._$AH = e);
    else {
      const d = e;
      let c, p;
      for (e = o[0], c = 0; c < o.length - 1; c++) p = te(this, d[a + c], s, c), p === q && (p = this._$AH[c]), n || (n = !me(p) || p !== this._$AH[c]), p === h ? e = h : e !== h && (e += (p ?? "") + o[c + 1]), this._$AH[c] = p;
    }
    n && !r && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class qt extends Ee {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class Jt extends Ee {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class Yt extends Ee {
  constructor(e, s, a, r, o) {
    super(e, s, a, r, o), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = te(this, e, s, 0) ?? h) === q) return;
    const a = this._$AH, r = e === h && a !== h || e.capture !== a.capture || e.once !== a.once || e.passive !== a.passive, o = e !== h && (a === h || r);
    r && this.element.removeEventListener(this.name, this, a), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var s;
    typeof this._$AH == "function" ? this._$AH.call(((s = this.options) == null ? void 0 : s.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Qt {
  constructor(e, s, a) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = a;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    te(this, e);
  }
}
const Zt = { I: ie }, Ce = ce.litHtmlPolyfillSupport;
Ce == null || Ce(ue, ie), (ce.litHtmlVersions ?? (ce.litHtmlVersions = [])).push("3.3.2");
const Xt = (t, e, s) => {
  const a = (s == null ? void 0 : s.renderBefore) ?? e;
  let r = a._$litPart$;
  if (r === void 0) {
    const o = (s == null ? void 0 : s.renderBefore) ?? null;
    a._$litPart$ = r = new ie(e.insertBefore(pe(), o), o, void 0, s ?? {});
  }
  return r._$AI(t), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const W = globalThis;
let w = class extends ee {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Xt(s, this.renderRoot, this.renderOptions);
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
    return q;
  }
};
var xt;
w._$litElement$ = !0, w.finalized = !0, (xt = W.litElementHydrateSupport) == null || xt.call(W, { LitElement: w });
const Me = W.litElementPolyfillSupport;
Me == null || Me({ LitElement: w });
(W.litElementVersions ?? (W.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const es = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ts = { attribute: !0, type: String, converter: Se, reflect: !1, hasChanged: Ue }, ss = (t = ts, e, s) => {
  const { kind: a, metadata: r } = s;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), a === "setter" && ((t = Object.create(t)).wrapped = !0), o.set(s.name, t), a === "accessor") {
    const { name: n } = s;
    return { set(d) {
      const c = e.get.call(this);
      e.set.call(this, d), this.requestUpdate(n, c, t, !0, d);
    }, init(d) {
      return d !== void 0 && this.C(n, void 0, t, d), d;
    } };
  }
  if (a === "setter") {
    const { name: n } = s;
    return function(d) {
      const c = this[n];
      e.call(this, d), this.requestUpdate(n, c, t, !0, d);
    };
  }
  throw Error("Unsupported decorator location: " + a);
};
function f(t) {
  return (e, s) => typeof s == "object" ? ss(t, e, s) : ((a, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, a), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function l(t) {
  return f({ ...t, state: !0, attribute: !1 });
}
function $(t) {
  const e = es(t);
  return (s, a) => customElements.get(t) ? s : e(s, a);
}
class as {
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
    const s = new URLSearchParams();
    (o = e.severity) != null && o.length && s.set("severity", e.severity.join(",")), e.source && s.set("source", e.source), e.search && s.set("search", e.search), e.from && s.set("from", e.from), e.to && s.set("to", e.to), e.limit !== void 0 && s.set("limit", String(e.limit)), e.offset !== void 0 && s.set("offset", String(e.offset)), e.order && s.set("order", e.order);
    const a = `${this.baseUrl}/api/messagehub/messages?${s.toString()}`, r = await fetch(a, { headers: this.headers() });
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
    const a = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/status`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ status: s })
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async setMessageSeverity(e, s) {
    const a = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/severity`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ severity: s })
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async getMessageTags(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/tags`, {
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return (await s.json()).tags;
  }
  async addMessageTag(e, s) {
    const a = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tag: s })
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return (await a.json()).tags;
  }
  async removeMessageTag(e, s) {
    const a = `${this.baseUrl}/api/messagehub/messages/${e}/tags?tag=${encodeURIComponent(s)}`, r = await fetch(a, { method: "DELETE", headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()).tags;
  }
  async getRunbookForSource(e, s) {
    const a = s ? `?fingerprint=${encodeURIComponent(s)}` : "", r = await fetch(
      `${this.baseUrl}/api/messagehub/runbook/${encodeURIComponent(e)}${a}`,
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
  async getKnxBusAnalysisState() {
    const e = await fetch(
      `${this.baseUrl}/api/messagehub/knx-stats/bus-analysis-state`,
      { headers: this.headers() }
    );
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return await e.json();
  }
  async setKnxBusAnalysisState(e) {
    const s = await fetch(
      `${this.baseUrl}/api/messagehub/knx-stats/bus-analysis-state`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({ enabled: e })
      }
    );
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async clearAuditLog() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/audit`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}: ${await e.text()}`);
    return await e.json();
  }
  async discoverKnxFromProject() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/knx-discovery`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return await e.json();
  }
  // Iter 47 (N4): intelligenter Abgleich mit Vorschau (apply=false) +
  // Anwendung (apply=true). Aenderungen siehe Backend-Doc-String.
  async syncKnxProject(e, s) {
    const a = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses/sync`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ items: e, apply: s })
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async listKnxAddresses() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async upsertKnxAddress(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async listChannels() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/channels`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async createChannel(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/channels`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async updateChannel(e, s) {
    const a = await fetch(`${this.baseUrl}/api/messagehub/channels/${e}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(s)
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async deleteChannel(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/channels/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  async listMqttTopics() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async createMqttTopic(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async deleteMqttTopic(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  async listRemediationHooks() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async createRemediationHook(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async deleteRemediationHook(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  async listHeartbeats() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async upsertHeartbeat(e, s) {
    const a = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ source: e, expected_interval_seconds: s })
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
  }
  async getStatsExtended(e = 30) {
    const s = await fetch(
      `${this.baseUrl}/api/messagehub/stats-extended?days=${e}`,
      { headers: this.headers() }
    );
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return await s.json();
  }
  async deleteKnxAddress(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-addresses/${encodeURIComponent(e)}`, a = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
  }
  async importKnxCsv(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ csv: e })
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return await s.json();
  }
  exportUrl(e) {
    var a;
    const s = new URLSearchParams();
    return (a = e.severity) != null && a.length && s.set("severity", e.severity.join(",")), e.source && s.set("source", e.source), e.search && s.set("search", e.search), e.from && s.set("from", e.from), e.to && s.set("to", e.to), s.set("format", e.format ?? "jsonl"), e.limit !== void 0 && s.set("limit", String(e.limit)), `${this.baseUrl}/api/messagehub/export?${s.toString()}`;
  }
  async deleteMessages(e = {}) {
    var n;
    const s = new URLSearchParams();
    (n = e.severity) != null && n.length && s.set("severity", e.severity.join(",")), e.source && s.set("source", e.source), e.search && s.set("search", e.search), e.from && s.set("from", e.from), e.to && s.set("to", e.to);
    const a = `${this.baseUrl}/api/messagehub/messages?${s.toString()}`, r = await fetch(a, { method: "DELETE", headers: this.headers() });
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
    const a = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${e}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(s)
      }
    );
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async deleteWebhook(e) {
    const s = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${e}`,
      { method: "DELETE", headers: this.headers() }
    );
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  // --- KNX-Stats (Iter 6) ----------------------------------------------
  _knxStatsParams(e) {
    const s = new URLSearchParams();
    return e.from && s.set("from", e.from), e.to && s.set("to", e.to), e.limit !== void 0 && s.set("limit", String(e.limit)), e.minRate !== void 0 && s.set("min_rate", String(e.minRate)), e.includeAcknowledged === !1 && s.set("include_acknowledged", "false"), s;
  }
  async getKnxStatsSummary(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/summary?${this._knxStatsParams(e).toString()}`, a = await fetch(s, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsTop(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/top?${this._knxStatsParams(e).toString()}`, a = await fetch(s, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsTopBySource(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/top-by-source?${this._knxStatsParams(e).toString()}`, a = await fetch(s, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsGaDetail(e, s) {
    const a = `${this.baseUrl}/api/messagehub/knx-stats/ga/${encodeURIComponent(e)}?${this._knxStatsParams(s).toString()}`, r = await fetch(a, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsTimeline(e) {
    const s = this._knxStatsParams(e);
    s.set("gas", e.gas.join(",")), e.bucketMinutes !== void 0 && s.set("bucket", String(e.bucketMinutes));
    const a = `${this.baseUrl}/api/messagehub/knx-stats/timeline?${s.toString()}`, r = await fetch(a, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async acknowledgeKnxGa(e, s = {}) {
    const a = { ga: e };
    s.note !== void 0 && (a.note = s.note), s.expiryDays !== void 0 && (a.expiry_days = s.expiryDays);
    const r = await fetch(`${this.baseUrl}/api/messagehub/knx-stats/acknowledge`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(a)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async getKnxStatsAlarms(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/alarms?${this._knxStatsParams(e).toString()}`, a = await fetch(s, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsOrphans(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/orphans?${this._knxStatsParams(e).toString()}`, a = await fetch(s, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsSilence(e) {
    const s = this._knxStatsParams(e);
    e.maxSilenceMinutes !== void 0 && s.set("max_silence_min", String(e.maxSilenceMinutes));
    const a = `${this.baseUrl}/api/messagehub/knx-stats/silence?${s.toString()}`, r = await fetch(a, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsBusHealth(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/bus-health?${this._knxStatsParams(e).toString()}`, a = await fetch(s, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsBusload(e, s) {
    const a = this._knxStatsParams(e);
    s && Number.isFinite(s) && s > 0 && a.set("bucket_seconds", String(Math.trunc(s)));
    const r = `${this.baseUrl}/api/messagehub/knx-stats/busload?${a.toString()}`, o = await fetch(r, { headers: this.headers() });
    if (!o.ok) throw new Error(`HTTP ${o.status}: ${await o.text()}`);
    return await o.json();
  }
  async getKnxStatsHealthScore(e) {
    const s = this._knxStatsParams(e), a = `${this.baseUrl}/api/messagehub/knx-stats/health-score?${s.toString()}`, r = await fetch(a, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsLongTerm(e, s = "auto") {
    const a = this._knxStatsParams(e);
    s !== "auto" && a.set("bucket", s);
    const r = `${this.baseUrl}/api/messagehub/knx-stats/long-term?${a.toString()}`, o = await fetch(r, { headers: this.headers() });
    if (!o.ok) throw new Error(`HTTP ${o.status}: ${await o.text()}`);
    return await o.json();
  }
  async getKnxStatsBursts(e, s = {}) {
    const a = this._knxStatsParams(e);
    s.windowSeconds && Number.isFinite(s.windowSeconds) && a.set("window_seconds", String(Math.trunc(s.windowSeconds))), s.thresholdPct && Number.isFinite(s.thresholdPct) && a.set("threshold_pct", String(s.thresholdPct));
    const r = `${this.baseUrl}/api/messagehub/knx-stats/bursts?${a.toString()}`, o = await fetch(r, { headers: this.headers() });
    if (!o.ok) throw new Error(`HTTP ${o.status}: ${await o.text()}`);
    return await o.json();
  }
  async getKnxStatsSensitiveLog(e) {
    const s = this._knxStatsParams(e), a = `${this.baseUrl}/api/messagehub/knx-stats/sensitive-log?${s.toString()}`, r = await fetch(a, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async setKnxStatsSensitive(e, s) {
    const a = `${this.baseUrl}/api/messagehub/knx-stats/sensitive/${encodeURIComponent(e)}`, r = await fetch(a, {
      method: s ? "POST" : "DELETE",
      headers: this.headers()
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async unacknowledgeKnxGa(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge/${encodeURIComponent(e)}`, a = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async acknowledgeKnxBulk(e, s = {}) {
    const a = new URLSearchParams();
    s.from && a.set("from", s.from), s.to && a.set("to", s.to);
    const r = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge-bulk?${a.toString()}`, o = { dev_source: e };
    s.note !== void 0 && (o.note = s.note), s.expiryDays !== void 0 && (o.expiry_days = s.expiryDays);
    const n = await fetch(r, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(o)
    });
    if (!n.ok) throw new Error(`HTTP ${n.status}: ${await n.text()}`);
    return await n.json();
  }
}
const L = y`
  :host {
    /* Spacing-Skala (4-px-Grid) */
    --mh-space-1: 4px;
    --mh-space-2: 8px;
    --mh-space-3: 12px;
    --mh-space-4: 16px;
    --mh-space-5: 24px;
    --mh-space-6: 32px;
    --mh-space-7: 48px;

    /* Radius */
    --mh-radius-sm: 6px;
    --mh-radius-md: 10px;
    --mh-radius-lg: 14px;
    --mh-radius-pill: 999px;

    /* Schatten (subtil) */
    --mh-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06);
    --mh-shadow-2: 0 2px 4px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08);
    --mh-shadow-3: 0 8px 24px rgba(0, 0, 0, 0.12);

    /* Typo-Skala */
    --mh-text-xs: 0.72rem;
    --mh-text-sm: 0.82rem;
    --mh-text-md: 0.92rem;
    --mh-text-lg: 1.05rem;
    --mh-text-xl: 1.25rem;
    --mh-text-2xl: 1.5rem;
    --mh-text-3xl: 2rem;

    --mh-weight-regular: 400;
    --mh-weight-medium: 500;
    --mh-weight-semibold: 600;
    --mh-weight-bold: 700;

    /* Farben — alle ueber HA-Theme-Variablen */
    --mh-bg: var(--primary-background-color, #f6f7f9);
    --mh-surface: var(--card-background-color, #ffffff);
    --mh-surface-2: var(--secondary-background-color, #f1f3f5);
    --mh-fg: var(--primary-text-color, #1f2329);
    --mh-fg-muted: var(--secondary-text-color, #5f6470);
    --mh-fg-subtle: color-mix(in srgb, var(--secondary-text-color, #5f6470) 70%, transparent);
    --mh-divider: var(--divider-color, #e3e6eb);
    --mh-divider-strong: color-mix(in srgb, var(--divider-color, #e3e6eb) 70%, var(--primary-text-color, #1f2329) 30%);

    --mh-accent: var(--primary-color, #03a9f4);
    --mh-accent-fg: var(--text-primary-color, #ffffff);
    --mh-accent-soft: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, transparent);

    /* Semantische Severity-Farben */
    --mh-error: var(--error-color, #db4437);
    --mh-error-soft: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent);
    --mh-warning: var(--warning-color, #f59e0b);
    --mh-warning-soft: color-mix(in srgb, var(--warning-color, #f59e0b) 16%, transparent);
    --mh-info: var(--info-color, #03a9f4);
    --mh-info-soft: color-mix(in srgb, var(--info-color, #03a9f4) 14%, transparent);
    --mh-success: var(--success-color, #16a34a);
    --mh-success-soft: color-mix(in srgb, var(--success-color, #16a34a) 14%, transparent);
    --mh-debug: var(--secondary-text-color, #6b7280);
    --mh-debug-soft: color-mix(in srgb, var(--secondary-text-color, #6b7280) 12%, transparent);

    /* Aktionen-Farben fuer Audit / Generic */
    --mh-action-create: var(--success-color, #16a34a);
    --mh-action-update: var(--info-color, #2563eb);
    --mh-action-delete: var(--error-color, #db4437);
    --mh-action-status: var(--warning-color, #f59e0b);

    /* Fokus-Outline */
    --mh-focus-ring: 2px solid color-mix(in srgb, var(--primary-color, #03a9f4) 70%, transparent);
    --mh-focus-offset: 2px;

    /* Transitions */
    --mh-transition-fast: 120ms ease-out;
    --mh-transition-med: 200ms ease-out;
  }
`, fe = y`
  .mh-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--mh-space-2);
    padding: 7px 14px;
    border: 1px solid var(--mh-divider);
    border-radius: var(--mh-radius-sm);
    background: var(--mh-surface);
    color: var(--mh-fg);
    font: inherit;
    font-size: var(--mh-text-sm);
    font-weight: var(--mh-weight-medium);
    cursor: pointer;
    transition: background var(--mh-transition-fast), border-color var(--mh-transition-fast),
      color var(--mh-transition-fast), transform var(--mh-transition-fast);
    line-height: 1.2;
    white-space: nowrap;
  }
  .mh-btn:hover:not(:disabled) {
    background: var(--mh-surface-2);
    border-color: var(--mh-divider-strong);
  }
  .mh-btn:active:not(:disabled) {
    transform: translateY(1px);
  }
  .mh-btn:focus-visible {
    outline: var(--mh-focus-ring);
    outline-offset: var(--mh-focus-offset);
  }
  .mh-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .mh-btn--primary {
    background: var(--mh-accent);
    color: var(--mh-accent-fg);
    border-color: transparent;
  }
  .mh-btn--primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--mh-accent) 88%, black);
    border-color: transparent;
  }
  .mh-btn--danger {
    color: var(--mh-error);
    border-color: color-mix(in srgb, var(--mh-error) 40%, var(--mh-divider));
  }
  .mh-btn--danger:hover:not(:disabled) {
    background: var(--mh-error-soft);
    border-color: var(--mh-error);
  }
  .mh-btn--ghost {
    background: transparent;
    border-color: transparent;
    color: var(--mh-fg-muted);
  }
  .mh-btn--ghost:hover:not(:disabled) {
    background: var(--mh-surface-2);
    color: var(--mh-fg);
  }
  .mh-btn--icon {
    padding: 7px;
    width: 34px;
    height: 34px;
    justify-content: center;
  }
  .mh-btn--sm {
    padding: 4px 10px;
    font-size: var(--mh-text-xs);
  }
`, Tt = y`
  .mh-input,
  .mh-select {
    padding: 8px 12px;
    border: 1px solid var(--mh-divider);
    border-radius: var(--mh-radius-sm);
    background: var(--mh-surface);
    color: var(--mh-fg);
    font: inherit;
    font-size: var(--mh-text-sm);
    line-height: 1.3;
    transition: border-color var(--mh-transition-fast), box-shadow var(--mh-transition-fast);
  }
  .mh-input:focus-visible,
  .mh-select:focus-visible {
    outline: none;
    border-color: var(--mh-accent);
    box-shadow: 0 0 0 3px var(--mh-accent-soft);
  }
  .mh-input::placeholder {
    color: var(--mh-fg-subtle);
  }
`, Ke = y`
  .mh-card {
    background: var(--mh-surface);
    border: 1px solid var(--mh-divider);
    border-radius: var(--mh-radius-md);
    padding: var(--mh-space-4);
    box-shadow: var(--mh-shadow-1);
  }
  .mh-card--flat {
    box-shadow: none;
  }
  .mh-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--mh-space-3);
    margin-bottom: var(--mh-space-3);
  }
  .mh-card__title {
    margin: 0;
    font-size: var(--mh-text-lg);
    font-weight: var(--mh-weight-semibold);
    color: var(--mh-fg);
  }
`, be = y`
  .mh-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--mh-radius-pill);
    font-size: var(--mh-text-xs);
    font-weight: var(--mh-weight-semibold);
    line-height: 1.6;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .mh-pill--error {
    background: var(--mh-error-soft);
    color: var(--mh-error);
  }
  .mh-pill--warning {
    background: var(--mh-warning-soft);
    color: var(--mh-warning);
  }
  .mh-pill--info {
    background: var(--mh-info-soft);
    color: var(--mh-info);
  }
  .mh-pill--debug {
    background: var(--mh-debug-soft);
    color: var(--mh-debug);
  }
  .mh-pill--success {
    background: var(--mh-success-soft);
    color: var(--mh-success);
  }
  .mh-pill--neutral {
    background: var(--mh-surface-2);
    color: var(--mh-fg-muted);
  }
  .mh-pill__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
`;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const rs = { CHILD: 2 }, is = (t) => (...e) => ({ _$litDirective$: t, values: e });
let os = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, s, a) {
    this._$Ct = e, this._$AM = s, this._$Ci = a;
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
const { I: ns } = Zt, ot = (t) => t, nt = () => document.createComment(""), le = (t, e, s) => {
  var o;
  const a = t._$AA.parentNode, r = e === void 0 ? t._$AB : e._$AA;
  if (s === void 0) {
    const n = a.insertBefore(nt(), r), d = a.insertBefore(nt(), r);
    s = new ns(n, d, t, t.options);
  } else {
    const n = s._$AB.nextSibling, d = s._$AM, c = d !== t;
    if (c) {
      let p;
      (o = s._$AQ) == null || o.call(s, t), s._$AM = t, s._$AP !== void 0 && (p = t._$AU) !== d._$AU && s._$AP(p);
    }
    if (n !== r || c) {
      let p = s._$AA;
      for (; p !== n; ) {
        const b = ot(p).nextSibling;
        ot(a).insertBefore(p, r), p = b;
      }
    }
  }
  return s;
}, K = (t, e, s = t) => (t._$AI(e, s), t), ls = {}, ds = (t, e = ls) => t._$AH = e, hs = (t) => t._$AH, Ne = (t) => {
  t._$AR(), t._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const lt = (t, e, s) => {
  const a = /* @__PURE__ */ new Map();
  for (let r = e; r <= s; r++) a.set(t[r], r);
  return a;
}, cs = is(class extends os {
  constructor(t) {
    if (super(t), t.type !== rs.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(t, e, s) {
    let a;
    s === void 0 ? s = e : e !== void 0 && (a = e);
    const r = [], o = [];
    let n = 0;
    for (const d of t) r[n] = a ? a(d, n) : n, o[n] = s(d, n), n++;
    return { values: o, keys: r };
  }
  render(t, e, s) {
    return this.dt(t, e, s).values;
  }
  update(t, [e, s, a]) {
    const r = hs(t), { values: o, keys: n } = this.dt(e, s, a);
    if (!Array.isArray(r)) return this.ut = n, o;
    const d = this.ut ?? (this.ut = []), c = [];
    let p, b, m = 0, v = r.length - 1, u = 0, g = o.length - 1;
    for (; m <= v && u <= g; ) if (r[m] === null) m++;
    else if (r[v] === null) v--;
    else if (d[m] === n[u]) c[u] = K(r[m], o[u]), m++, u++;
    else if (d[v] === n[g]) c[g] = K(r[v], o[g]), v--, g--;
    else if (d[m] === n[g]) c[g] = K(r[m], o[g]), le(t, c[g + 1], r[m]), m++, g--;
    else if (d[v] === n[u]) c[u] = K(r[v], o[u]), le(t, r[m], r[v]), v--, u++;
    else if (p === void 0 && (p = lt(n, u, g), b = lt(d, m, v)), p.has(d[m])) if (p.has(d[v])) {
      const T = b.get(n[u]), oe = T !== void 0 ? r[T] : null;
      if (oe === null) {
        const we = le(t, r[m]);
        K(we, o[u]), c[u] = we;
      } else c[u] = K(oe, o[u]), le(t, r[m], oe), r[T] = null;
      u++;
    } else Ne(r[v]), v--;
    else Ne(r[m]), m++;
    for (; u <= g; ) {
      const T = le(t, c[g + 1]);
      K(T, o[u]), c[u++] = T;
    }
    for (; m <= v; ) {
      const T = r[m++];
      T !== null && Ne(T);
    }
    return this.ut = n, ds(t, c), q;
  }
}), ps = new Intl.RelativeTimeFormat("de", { numeric: "auto" }), ms = [
  { unit: "year", seconds: 31536e3 },
  { unit: "month", seconds: 2592e3 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 }
];
function At(t, e = /* @__PURE__ */ new Date()) {
  const s = new Date(t);
  if (Number.isNaN(s.getTime())) return "—";
  const a = Math.round((s.getTime() - e.getTime()) / 1e3), r = Math.abs(a);
  if (r < 5) return "gerade eben";
  for (const { unit: o, seconds: n } of ms)
    if (r >= n) {
      const d = Math.round(a / n);
      return ps.format(d, o);
    }
  return "gerade eben";
}
function Et(t, e = /* @__PURE__ */ new Date()) {
  const s = new Date(t);
  if (Number.isNaN(s.getTime())) return t;
  const a = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate(), r = s.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  return a ? r : `${s.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} ${r}`;
}
var us = Object.defineProperty, gs = Object.getOwnPropertyDescriptor, _e = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? gs(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && us(e, s, r), r;
};
const dt = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·"
}, ht = {
  error: "Error",
  warning: "Warn",
  info: "Info",
  debug: "Debug"
}, vs = ["error", "warning", "info", "debug"];
let J = class extends w {
  constructor() {
    super(...arguments), this.items = [], this._now = /* @__PURE__ */ new Date(), this._editSeverityFor = null, this._popoverPos = null, this._onClick = (t) => {
      this.dispatchEvent(
        new CustomEvent("select", { detail: { msg: t }, bubbles: !0, composed: !0 })
      );
    }, this._onKey = (t, e) => {
      (t.key === "Enter" || t.key === " ") && (t.preventDefault(), this._onClick(e));
    }, this._onSeverityClick = (t, e) => {
      if (t.stopPropagation(), t.preventDefault(), this._editSeverityFor === e.id) {
        this._closePopover();
        return;
      }
      const a = t.currentTarget.getBoundingClientRect(), r = 200, o = a.bottom + r < window.innerHeight;
      this._popoverPos = {
        top: o ? a.bottom + 4 : a.top - r - 4,
        left: a.left
      }, this._editSeverityFor = e.id;
    }, this._onSeverityPick = (t, e, s, a) => {
      t.stopPropagation(), this._closePopover(), a !== s && this.dispatchEvent(
        new CustomEvent("severity-change", {
          detail: { id: e, severity: a, previous: s },
          bubbles: !0,
          composed: !0
        })
      );
    };
  }
  connectedCallback() {
    super.connectedCallback(), this._tickerId = window.setInterval(() => this._now = /* @__PURE__ */ new Date(), 3e4);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._tickerId && window.clearInterval(this._tickerId);
  }
  _closePopover() {
    this._editSeverityFor = null, this._popoverPos = null;
  }
  _renderPopover() {
    if (this._editSeverityFor === null || this._popoverPos === null)
      return i``;
    const t = this.items.find((a) => a.id === this._editSeverityFor);
    if (!t) return i``;
    const e = t.severity ?? "info", s = t.id;
    return i`
      <div class="popover-backdrop" @click=${() => this._closePopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._popoverPos.top}px; left: ${this._popoverPos.left}px`}
        @click=${(a) => a.stopPropagation()}
      >
        ${vs.map(
      (a) => i`<button
            role="menuitemradio"
            aria-checked=${a === e}
            class=${`sev-option ${a === e ? "active" : ""}`}
            @click=${(r) => this._onSeverityPick(r, s, e, a)}
          >
            <span class=${`mh-pill mh-pill--${a}`}>
              <span class="sev-icon" aria-hidden="true">${dt[a]}</span>
              ${ht[a]}
            </span>
            ${a === e ? i`<span class="check" aria-hidden="true">✓</span>` : h}
          </button>`
    )}
      </div>
    `;
  }
  _renderHeader() {
    return i`
      <div class="header" role="row">
        <span class="col-sev" role="columnheader">Severity</span>
        <span class="col-ts" role="columnheader">Zeit</span>
        <span class="col-src" role="columnheader">Quelle</span>
        <span class="col-text" role="columnheader">Nachricht</span>
      </div>
    `;
  }
  render() {
    return this.items.length ? i`
      <div class="root">
        ${this._renderHeader()}
        <div class="scroll" role="list">
          ${cs(
      this.items,
      (t) => t.id,
      (t) => {
        const e = t.severity ?? "info", s = ht[e] ?? e, a = dt[e] ?? "·", r = At(t.timestamp, this._now), o = Et(t.timestamp, this._now);
        return i`
                <div
                  class=${`row sev-${e} ${this._editSeverityFor === t.id ? "row-active" : ""}`}
                  tabindex="0"
                  role="listitem button"
                  @click=${() => this._onClick(t)}
                  @keydown=${(n) => this._onKey(n, t)}
                >
                  <span class="col-sev">
                    <button
                      class=${`mh-pill mh-pill--${e} sev-trigger`}
                      title="Severity ändern"
                      aria-haspopup="menu"
                      aria-expanded=${this._editSeverityFor === t.id}
                      @click=${(n) => this._onSeverityClick(n, t)}
                    >
                      <span class="sev-icon" aria-hidden="true">${a}</span>
                      ${s}
                      <span class="caret" aria-hidden="true">▾</span>
                    </button>
                  </span>
                  <span class="col-ts ts" title=${o}>${r}</span>
                  <span class="col-src">
                    <span class="source-pill">${t.source}</span>
                  </span>
                  <span class="col-text text">${t.text}</span>
                </div>
              `;
      }
    )}
        </div>
        ${this._renderPopover()}
      </div>
    ` : i`
        <div class="root">
          ${this._renderHeader()}
          <div class="empty">Keine Nachrichten</div>
        </div>
      `;
  }
};
J.styles = [
  L,
  be,
  y`
      :host {
        display: block;
        flex: 1;
        overflow: hidden;
      }
      .root {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--mh-surface);
      }
      .header,
      .row {
        display: grid;
        grid-template-columns: 110px 110px 140px 1fr;
        gap: var(--mh-space-3);
        padding: 10px var(--mh-space-5);
        align-items: center;
      }
      .header {
        background: var(--mh-bg);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--mh-fg-muted);
        padding-top: var(--mh-space-2);
        padding-bottom: var(--mh-space-2);
        position: sticky;
        top: 0;
        z-index: 1;
      }
      .scroll {
        flex: 1;
        overflow: auto;
      }
      .row {
        border-bottom: 1px solid var(--mh-divider);
        cursor: pointer;
        transition: background var(--mh-transition-fast);
      }
      .row:hover {
        background: var(--mh-surface-2);
      }
      .row:focus-visible {
        background: var(--mh-surface-2);
        outline: var(--mh-focus-ring);
        outline-offset: -2px;
      }
      .row:last-child {
        border-bottom: 0;
      }

      .sev-icon {
        display: inline-flex;
        width: 14px;
        text-align: center;
        font-weight: var(--mh-weight-bold);
      }
      button.sev-trigger {
        appearance: none;
        border: 0;
        cursor: pointer;
        font: inherit;
        padding: 2px 8px;
        gap: 4px;
        transition: filter var(--mh-transition-fast), box-shadow var(--mh-transition-fast);
      }
      button.sev-trigger:hover {
        filter: brightness(0.95);
        box-shadow: 0 0 0 2px var(--mh-divider);
      }
      button.sev-trigger:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: 2px;
      }
      .caret {
        font-size: 0.7em;
        opacity: 0.65;
        margin-left: 2px;
      }
      .row.row-active {
        background: var(--mh-surface-2);
      }
      .popover-backdrop {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: transparent;
      }
      .sev-popover {
        position: fixed;
        z-index: 70;
        min-width: 180px;
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        animation: pop-in 120ms ease-out;
      }
      @keyframes pop-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      button.sev-option {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 6px 8px;
        border-radius: var(--mh-radius-sm);
        cursor: pointer;
        font: inherit;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--mh-space-2);
      }
      button.sev-option:hover {
        background: var(--mh-surface-2);
      }
      button.sev-option.active {
        background: var(--mh-surface-2);
      }
      button.sev-option:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: -2px;
      }
      .check {
        color: var(--mh-success);
        font-weight: var(--mh-weight-bold);
      }

      .ts {
        font-variant-numeric: tabular-nums;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        white-space: nowrap;
      }

      .source-pill {
        display: inline-block;
        padding: 2px 8px;
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-medium);
        max-width: 130px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }

      .text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
      }
      .empty {
        padding: var(--mh-space-7);
        text-align: center;
        color: var(--mh-fg-muted);
      }

      @media (max-width: 720px) {
        .header,
        .row {
          grid-template-columns: 90px 90px 1fr;
          gap: var(--mh-space-2);
          padding: var(--mh-space-2) var(--mh-space-3);
        }
        .col-src {
          display: none;
        }
      }
    `
];
_e([
  f({ attribute: !1 })
], J.prototype, "items", 2);
_e([
  l()
], J.prototype, "_now", 2);
_e([
  l()
], J.prototype, "_editSeverityFor", 2);
_e([
  l()
], J.prototype, "_popoverPos", 2);
J = _e([
  $("message-table")
], J);
var fs = Object.defineProperty, bs = Object.getOwnPropertyDescriptor, Pt = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? bs(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && fs(e, s, r), r;
};
const ct = ["error", "warning", "info", "debug"];
let Ae = class extends w {
  constructor() {
    super(...arguments), this.selected = [...ct];
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
    return i`
      <div class="chips" role="group" aria-label="Severity-Filter">
        ${ct.map((t) => {
      const e = this.selected.includes(t);
      return i`<button
            class=${`chip sev-${t} ${e ? "active" : ""}`}
            aria-pressed=${e}
            @click=${() => this._toggle(t)}
          >
            <span class="dot" aria-hidden="true"></span>
            ${t}
          </button>`;
    })}
      </div>
    `;
  }
};
Ae.styles = [
  L,
  y`
      .chips {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: var(--mh-radius-pill);
        border: 1px solid var(--mh-divider);
        background: var(--mh-surface);
        cursor: pointer;
        font: inherit;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg-muted);
        text-transform: capitalize;
        transition: background var(--mh-transition-fast), color var(--mh-transition-fast),
          border-color var(--mh-transition-fast);
      }
      .chip:hover {
        background: var(--mh-surface-2);
        color: var(--mh-fg);
      }
      .chip:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: var(--mh-focus-offset);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.6;
      }
      .chip.active {
        color: var(--mh-fg);
        border-color: transparent;
        font-weight: var(--mh-weight-semibold);
      }
      .chip.sev-error .dot {
        color: var(--mh-error);
        opacity: 1;
      }
      .chip.sev-error.active {
        background: var(--mh-error-soft);
        color: var(--mh-error);
      }
      .chip.sev-warning .dot {
        color: var(--mh-warning);
        opacity: 1;
      }
      .chip.sev-warning.active {
        background: var(--mh-warning-soft);
        color: var(--mh-warning);
      }
      .chip.sev-info .dot {
        color: var(--mh-info);
        opacity: 1;
      }
      .chip.sev-info.active {
        background: var(--mh-info-soft);
        color: var(--mh-info);
      }
      .chip.sev-debug .dot {
        color: var(--mh-debug);
        opacity: 1;
      }
      .chip.sev-debug.active {
        background: var(--mh-debug-soft);
        color: var(--mh-debug);
      }
    `
];
Pt([
  f({ attribute: !1 })
], Ae.prototype, "selected", 2);
Ae = Pt([
  $("severity-filter")
], Ae);
var _s = Object.defineProperty, xs = Object.getOwnPropertyDescriptor, Pe = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? xs(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && _s(e, s, r), r;
};
let se = class extends w {
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
    return i`
      <select @change=${this._onChange} .value=${this.selected}>
        <option value="">Alle Quellen</option>
        ${this._sources.map((t) => i`<option value=${t}>${t}</option>`)}
      </select>
    `;
  }
};
se.styles = y`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `;
Pe([
  f({ attribute: !1 })
], se.prototype, "api", 2);
Pe([
  f({ attribute: !1 })
], se.prototype, "selected", 2);
Pe([
  l()
], se.prototype, "_sources", 2);
se = Pe([
  $("source-filter")
], se);
var ws = Object.defineProperty, ys = Object.getOwnPropertyDescriptor, Ge = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? ys(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && ws(e, s, r), r;
};
let ge = class extends w {
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
    return i`
      <div class="presets">
        <button @click=${() => this._set("1h")}>1h</button>
        <button @click=${() => this._set("24h")}>24h</button>
        <button @click=${() => this._set("7d")}>7d</button>
        <button @click=${() => this._set("all")}>Alle</button>
      </div>
    `;
  }
};
ge.styles = y`
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
Ge([
  f({ attribute: !1 })
], ge.prototype, "fromIso", 2);
Ge([
  f({ attribute: !1 })
], ge.prototype, "toIso", 2);
ge = Ge([
  $("time-range-filter")
], ge);
var $s = Object.defineProperty, ks = Object.getOwnPropertyDescriptor, U = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? ks(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && $s(e, s, r), r;
};
let O = class extends w {
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
    const t = this._newTag.trim().toLowerCase().replaceAll(/[^a-z0-9._-]+/g, "-");
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
    confirm(`Nachricht #${this.msg.id} endgültig löschen?`) && this.dispatchEvent(
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
    return i`<span class=${`status-badge status-${this._status}`}>
      ${t[this._status] ?? this._status}
    </span>`;
  }
  render() {
    return i`
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

        ${this.msg.metadata ? i`<h3>Metadata</h3>
              <pre class="meta">${JSON.stringify(this.msg.metadata, null, 2)}</pre>` : h}

        <h3>Tags</h3>
        <div class="tags">
          ${this._tags.length === 0 ? i`<span class="hint">keine Tags</span>` : this._tags.map(
      (t) => i`
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

        ${this._runbook ? i`<h3>Runbook: ${this._runbook.title}</h3>
              <pre class="runbook">${this._runbook.markdown}</pre>` : h}

        <footer>
          <button class="del" @click=${this._delete}>Löschen</button>
        </footer>
      </aside>
    `;
  }
};
O.styles = y`
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
U([
  f({ attribute: !1 })
], O.prototype, "msg", 2);
U([
  f({ attribute: !1 })
], O.prototype, "api", 2);
U([
  l()
], O.prototype, "_status", 2);
U([
  l()
], O.prototype, "_tags", 2);
U([
  l()
], O.prototype, "_newTag", 2);
U([
  l()
], O.prototype, "_runbook", 2);
U([
  l()
], O.prototype, "_busy", 2);
O = U([
  $("detail-pane")
], O);
var Ss = Object.defineProperty, Ts = Object.getOwnPropertyDescriptor, C = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Ts(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Ss(e, s, r), r;
};
const As = ["debug", "info", "warning", "error"], Es = JSON.stringify(
  {
    severity: "$.level",
    source: "$.app.name",
    text: "$.message",
    metadata: "$.extra"
  },
  null,
  2
), He = /^[a-z0-9._-]{1,64}$/;
function Ps(t) {
  return t.toLowerCase().normalize("NFKD").replaceAll(/[äÄ]/g, "ae").replaceAll(/[öÖ]/g, "oe").replaceAll(/[üÜ]/g, "ue").replaceAll(/ß/g, "ss").replaceAll(/[\s/\\]+/g, "-").replaceAll(/[^a-z0-9._-]/g, "").slice(0, 64);
}
let z = class extends w {
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
        if (!He.test(this._source))
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
    this._mappingText = Es;
  }
  render() {
    const t = this.editing !== null;
    return i`
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
              ${this._source && He.test(this._source) ? i`<span class="ok-badge" title="ok">✓</span>` : null}
            </span>
            <input
              type="text"
              class=${this._source && !He.test(this._source) ? "invalid" : ""}
              .value=${this._source}
              @input=${(e) => {
      const s = e.target.value;
      this._source = Ps(s);
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
              ${As.map(
      (e) => i`<option value=${e} ?selected=${this._severity === e}>${e}</option>`
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
              Beispiel einfügen
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
            Leer lassen für 1:1-Mapping (severity/source/text/metadata in der
            Top-Level-Payload).
          </small>
        </div>

        ${this._error ? i`<div class="error">${this._error}</div>` : null}

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
z.styles = y`
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
C([
  f({ attribute: !1 })
], z.prototype, "api", 2);
C([
  f({ attribute: !1 })
], z.prototype, "editing", 2);
C([
  l()
], z.prototype, "_name", 2);
C([
  l()
], z.prototype, "_source", 2);
C([
  l()
], z.prototype, "_severity", 2);
C([
  l()
], z.prototype, "_enabled", 2);
C([
  l()
], z.prototype, "_mappingText", 2);
C([
  l()
], z.prototype, "_error", 2);
C([
  l()
], z.prototype, "_saving", 2);
z = C([
  $("webhook-form")
], z);
var zs = Object.defineProperty, Ds = Object.getOwnPropertyDescriptor, E = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Ds(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && zs(e, s, r), r;
};
const Ls = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/, Ie = ["debug", "info", "warning", "error"], pt = [...Ie, "auto"];
let k = class extends w {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._filter = "", this._onlyEnabled = !1, this._newAddr = "", this._newLabel = "", this._newDpt = "", this._sevPopoverFor = null, this._sevPopoverPos = null, this._discovery = [], this._discoveryStatus = "loading", this._editing = null, this._toast = "", this._error = "";
  }
  async firstUpdated() {
    await this._load(), await this._loadDiscovery();
  }
  async _load() {
    if (this.api) {
      this._loading = !0;
      try {
        this._items = await this.api.listKnxAddresses();
      } finally {
        this._loading = !1;
      }
    }
  }
  async _loadDiscovery() {
    if (this.api)
      try {
        const t = await this.api.discoverKnxFromProject();
        this._discovery = t.items, this._discoveryStatus = t.status;
      } catch (t) {
        this._discovery = [], this._discoveryStatus = `error: ${t.message}`;
      }
  }
  _renderDiscoveryStatus() {
    if (this._discoveryStatus === "ok" && this._discovery.length > 0) return null;
    const e = {
      loading: "🔄 Lade KNX-Projekt-Daten…",
      no_knx_integration: "ℹ️ Keine KNX-Integration in HA gefunden. Lege erst die KNX-Integration unter Einstellungen → Geräte & Dienste an, dann erscheinen die GAs hier automatisch.",
      no_project_loaded: "ℹ️ KNX-Integration ist da, aber kein ETS-Projekt hochgeladen. Lade dein .knxproj in der KNX-Integration unter Konfigurieren → Projekt hoch.",
      project_empty: "ℹ️ ETS-Projekt enthält keine Gruppenadressen — pruefe den Export."
    }[this._discoveryStatus] ?? `Status: ${this._discoveryStatus}`;
    return i`<div class="discovery-status">${e}</div>`;
  }
  _onAddressInput(t) {
    const e = t.target.value;
    this._newAddr = e;
    const s = this._discovery.find((a) => a.address === e);
    s && (this._newLabel.trim() || (this._newLabel = s.name), !this._newDpt.trim() && s.dpt && (this._newDpt = s.dpt));
  }
  // Iter 47 (N4): Smart-Sync statt Wipe-and-Replace.
  // Schritt 1: Backend rechnet den Plan (apply=false) — keine Mutation.
  // Schritt 2: User bekommt eine Zusammenfassung (add/update/delete/keep).
  // Schritt 3: Bei Bestaetigung wird der Plan angewendet (apply=true).
  // Bei "update" wird die User-Config zurueckgesetzt, bei "delete" wird
  // die Zeile entfernt — das wird im Confirm-Dialog explizit erklaert.
  async _syncFromProject() {
    if (!this.api || this._discovery.length === 0) return;
    let t;
    try {
      t = await this.api.syncKnxProject(this._discovery, !1);
    } catch (a) {
      this._showToast(a.message);
      return;
    }
    const e = t.counts;
    if (e.add === 0 && e.update === 0 && e.delete === 0) {
      this._showToast("Projekt ist bereits synchron — nichts zu tun");
      return;
    }
    const s = `Abgleich mit ETS-Projekt anwenden?

${e.add} neue Eintraege anlegen
${e.update} Eintraege aktualisieren (label/dpt geaendert -> Logging-Konfig wird zurueckgesetzt)
${e.delete} Eintraege loeschen (in ETS nicht mehr vorhanden -> Lauschen wird beendet)
${e.keep} unveraenderte Eintraege bleiben bestehen.`;
    if (window.confirm(s)) {
      try {
        const r = (await this.api.syncKnxProject(this._discovery, !0)).counts;
        this._showToast(
          `Synchronisiert: +${r.added} angelegt, ${r.updated} aktualisiert, ${r.deleted} geloescht`
        );
      } catch (a) {
        this._showToast(`Fehler beim Anwenden: ${a.message}`);
      }
      await this._load();
    }
  }
  async _add() {
    if (this._error = "", !this.api) return;
    const t = this._newAddr.trim();
    if (!Ls.test(t)) {
      this._error = "Bitte Format N/N/N (z. B. 1/2/3)";
      return;
    }
    if (!this._newLabel.trim()) {
      this._error = "Label darf nicht leer sein";
      return;
    }
    try {
      await this.api.upsertKnxAddress({
        address: t,
        label: this._newLabel.trim(),
        dpt: this._newDpt.trim() || null,
        log_enabled: !1,
        // Iter 44 (N2): Default-Severity Warning fuer neue Eintraege.
        log_severity: "warning"
      }), this._newAddr = "", this._newLabel = "", this._newDpt = "", this._showToast(`${t} gespeichert`), await this._load();
    } catch (e) {
      this._error = e.message;
    }
  }
  async _toggleLog(t) {
    if (!this.api) return;
    const e = !t.log_enabled;
    try {
      await this.api.upsertKnxAddress({
        ...t,
        log_enabled: e
      }), await this._load();
      const s = this._items.find((r) => r.address === t.address), a = !!(s != null && s.log_enabled);
      s !== void 0 && a !== e ? this._showToast(
        "Backend hat log_enabled nicht gesetzt — Browser-Cache leeren (Cmd+Shift+R) und HA-Container neu starten"
      ) : this._showToast(
        e ? `${t.address} im Protokoll aktiv` : `${t.address} aus Protokoll entfernt`
      );
    } catch (s) {
      this._showToast(s.message);
    }
  }
  async _delete(t) {
    if (this.api && window.confirm(`KNX-Adresse ${t} löschen?`))
      try {
        await this.api.deleteKnxAddress(t), this._showToast(`${t} gelöscht`), await this._load();
      } catch (e) {
        this._showToast(e.message);
      }
  }
  _closeSevPopover() {
    this._sevPopoverFor = null, this._sevPopoverPos = null;
  }
  _onSeverityTrigger(t, e) {
    if (t.stopPropagation(), t.preventDefault(), this._sevPopoverFor === e.address) {
      this._closeSevPopover();
      return;
    }
    const a = t.currentTarget.getBoundingClientRect(), r = 220, o = a.bottom + r < window.innerHeight;
    this._sevPopoverPos = {
      top: o ? a.bottom + 4 : a.top - r - 4,
      left: a.left
    }, this._sevPopoverFor = e.address;
  }
  async _onSeverityPick(t, e, s) {
    if (t.stopPropagation(), this._closeSevPopover(), s === e.log_severity || !this.api) return;
    const a = {
      address: e.address,
      log_severity: s
    };
    s === "auto" && (a.severity_on_true = e.severity_on_true ?? "warning", a.severity_on_false = e.severity_on_false ?? "info");
    const r = e.log_severity;
    this._items = this._items.map(
      (o) => o.address === e.address ? {
        ...o,
        log_severity: s,
        severity_on_true: a.severity_on_true ?? o.severity_on_true,
        severity_on_false: a.severity_on_false ?? o.severity_on_false
      } : o
    );
    try {
      await this.api.upsertKnxAddress({ ...e, ...a }), this._showToast(`${e.address}: Severity ${r} → ${s}`);
    } catch (o) {
      this._items = this._items.map(
        (n) => n.address === e.address ? { ...n, log_severity: r } : n
      ), this._showToast(`Fehlgeschlagen: ${o.message}`);
    }
  }
  _renderSevPopover() {
    if (this._sevPopoverFor === null || this._sevPopoverPos === null) return h;
    const t = this._items.find((s) => s.address === this._sevPopoverFor);
    if (!t) return h;
    const e = t.log_severity;
    return i`
      <div class="sev-backdrop" @click=${() => this._closeSevPopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._sevPopoverPos.top}px; left: ${this._sevPopoverPos.left}px`}
        @click=${(s) => s.stopPropagation()}
      >
        ${pt.map(
      (s) => i`<button
            role="menuitemradio"
            aria-checked=${s === e}
            class=${`sev-option ${s === e ? "active" : ""}`}
            @click=${(a) => void this._onSeverityPick(a, t, s)}
          >
            <span
              class=${`mh-pill mh-pill--${s === "auto" ? "neutral" : s}`}
            >${s}</span>
            ${s === e ? i`<span class="sev-check" aria-hidden="true">✓</span>` : h}
          </button>`
    )}
      </div>
    `;
  }
  async _onCsvFile(t) {
    var a;
    const e = (a = t.target.files) == null ? void 0 : a[0];
    if (!e || !this.api) return;
    const s = await e.text();
    try {
      const r = await this.api.importKnxCsv(s);
      this._showToast(
        `Import: ${r.imported} angelegt, ${r.skipped} ueberlesen, ${r.errors} Fehler`
      ), await this._load();
    } catch (r) {
      this._showToast(`Import fehlgeschlagen: ${r.message}`);
    } finally {
      t.target.value = "";
    }
  }
  _showToast(t) {
    this._toast = t, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  _filtered() {
    let t = this._items;
    this._onlyEnabled && (t = t.filter((s) => !!s.log_enabled));
    const e = this._filter.trim().toLowerCase();
    return e ? t.filter(
      (s) => s.address.includes(e) || s.label.toLowerCase().includes(e) || (s.dpt ?? "").toLowerCase().includes(e)
    ) : t;
  }
  _renderEditor() {
    if (!this._editing) return h;
    const t = this._editing, e = (s) => {
      this._editing = { ...t, ...s };
    };
    return i`
      <div class="modal-backdrop" @click=${() => this._editing = null}>
        <div class="modal" @click=${(s) => s.stopPropagation()}>
          <h3>${t.address} bearbeiten</h3>
          <label>
            <span>Label</span>
            <input
              type="text"
              .value=${t.label}
              @input=${(s) => e({ label: s.target.value })}
            />
          </label>
          <div class="row-2">
            <label>
              <span>DPT (z. B. 1.001, 5.001, 16.001)</span>
              <input
                type="text"
                .value=${t.dpt ?? ""}
                @input=${(s) => e({ dpt: s.target.value || null })}
              />
            </label>
            <label class="checkbox">
              <input
                type="checkbox"
                .checked=${t.log_enabled}
                @change=${(s) => e({ log_enabled: s.target.checked })}
              />
              <span>Im Protokoll erfassen</span>
            </label>
          </div>

          ${t.log_enabled ? i`
                <label>
                  <span>Severity</span>
                  <select
                    .value=${t.log_severity}
                    @change=${(s) => {
      const a = s.target.value;
      e({ log_severity: a });
    }}
                  >
                    ${pt.map(
      (s) => i`<option value=${s}>${s}</option>`
    )}
                  </select>
                  <small>
                    <code>auto</code> nutzt für Boolean-DPTs (1.x) die
                    Severity-Map unten — z. B. für Stör-Bits, die bei
                    <code>True</code> einen Fehler bedeuten.
                  </small>
                </label>
                ${t.log_severity === "auto" ? i`<div class="row-2">
                      <label>
                        <span>Severity bei <code>True</code></span>
                        <select
                          .value=${t.severity_on_true ?? "warning"}
                          @change=${(s) => e({
      severity_on_true: s.target.value
    })}
                        >
                          ${Ie.map(
      (s) => i`<option value=${s}>${s}</option>`
    )}
                        </select>
                      </label>
                      <label>
                        <span>Severity bei <code>False</code></span>
                        <select
                          .value=${t.severity_on_false ?? "info"}
                          @change=${(s) => e({
      severity_on_false: s.target.value
    })}
                        >
                          ${Ie.map(
      (s) => i`<option value=${s}>${s}</option>`
    )}
                        </select>
                      </label>
                    </div>` : h}
              ` : h}

          <div class="modal-actions">
            <button class="mh-btn" @click=${() => this._editing = null}>Abbrechen</button>
            <button class="mh-btn mh-btn--primary" @click=${() => void this._saveEdit()}>
              Speichern
            </button>
          </div>
        </div>
      </div>
    `;
  }
  async _saveEdit() {
    if (!(!this.api || !this._editing))
      try {
        await this.api.upsertKnxAddress({
          address: this._editing.address,
          label: this._editing.label,
          dpt: this._editing.dpt,
          description: this._editing.description,
          log_enabled: this._editing.log_enabled,
          log_severity: this._editing.log_severity,
          severity_on_true: this._editing.severity_on_true,
          severity_on_false: this._editing.severity_on_false
        }), this._showToast("gespeichert"), this._editing = null, await this._load();
      } catch (t) {
        this._showToast(t.message);
      }
  }
  render() {
    const t = this._filtered(), e = this._items.filter((s) => s.log_enabled).length;
    return i`
      <section>
        <header class="head">
          <div>
            <h2>KNX-Gruppenadressen</h2>
            <p class="hint">
              ${this._items.length} Adressen,
              <strong>${e} im Protokoll aktiv</strong>. Voraussetzung
              für die Bus-Erfassung: HA-KNX-Integration mit IP-Tunneling/Routing
              ist eingerichtet — sie feuert das Event <code>knx_event</code>, das
              wir gegen diese Whitelist matchen. Nicht-aktivierte GAs werden
              ignoriert.
            </p>
          </div>
          <div class="header-actions">
            ${this._discovery.length > 0 ? i`<button
                  class="mh-btn mh-btn--primary"
                  title=${`Intelligenter Abgleich: ${this._discovery.length} GAs aus ETS — neue anlegen, geaenderte aktualisieren, fehlende loeschen, unveraenderte unangetastet`}
                  @click=${() => void this._syncFromProject()}
                >
                  Mit ETS-Projekt synchronisieren
                </button>` : null}
            <label class="mh-btn csv-upload">
              <input type="file" accept=".csv,text/csv" @change=${this._onCsvFile} />
              <span>📂 ETS-CSV importieren</span>
            </label>
          </div>
        </header>

        <div class="add-form">
          <input
            type="text"
            class="mh-input"
            list="knx-discovery-list"
            placeholder="${this._discovery.length > 0 ? `GA aus Projekt wählen (${this._discovery.length} verfügbar)` : "GA (z. B. 1/2/3)"}"
            .value=${this._newAddr}
            @input=${this._onAddressInput}
            @keydown=${(s) => {
      s.key === "Enter" && this._add();
    }}
          />
          <datalist id="knx-discovery-list">
            ${this._discovery.map(
      (s) => i`<option value=${s.address}>
                  ${s.name}${s.dpt ? ` (DPT ${s.dpt})` : ""}
                </option>`
    )}
          </datalist>
          <input
            type="text"
            class="mh-input"
            placeholder="Label (z. B. Störung Heizung Pumpe)"
            .value=${this._newLabel}
            @input=${(s) => this._newLabel = s.target.value}
            @keydown=${(s) => {
      s.key === "Enter" && this._add();
    }}
          />
          <input
            type="text"
            class="mh-input narrow"
            placeholder="DPT (z. B. 1.001)"
            .value=${this._newDpt}
            @input=${(s) => this._newDpt = s.target.value}
            @keydown=${(s) => {
      s.key === "Enter" && this._add();
    }}
          />
          <button class="mh-btn mh-btn--primary" @click=${this._add}>+ Hinzufügen</button>
        </div>
        ${this._discovery.length > 0 ? i`<p class="hint">
              💡 Tipp: Beim Tippen in das GA-Feld erscheinen Vorschläge aus dem
              ETS-Projekt — Label und DPT werden dann automatisch vorbefüllt.
            </p>` : null}
        ${this._renderDiscoveryStatus()}
        ${this._error ? i`<div class="error">${this._error}</div>` : h}

        <div class="filter-bar">
          <input
            type="search"
            class="mh-input"
            placeholder="Suche (GA / Label / DPT)…"
            .value=${this._filter}
            @input=${(s) => this._filter = s.target.value}
          />
          <label class="toggle">
            <input
              type="checkbox"
              .checked=${this._onlyEnabled}
              @change=${(s) => this._onlyEnabled = s.target.checked}
            />
            <span>nur aktive</span>
          </label>
          <span class="muted">${t.length} sichtbar</span>
        </div>

        ${this._loading ? i`<p class="muted">lade…</p>` : t.length === 0 ? i`<div class="empty">
                ${this._items.length === 0 ? i`<p>
                      Noch keine Adressen. Lege oben den ersten Eintrag an oder
                      importiere eine ETS-CSV.
                    </p>` : this._onlyEnabled && e === 0 ? i`<p>
                          <strong>Keine Adresse ist im Protokoll aktiv.</strong>
                        </p>
                        <p>
                          So aktivierst du eine: in der Liste den
                          <strong>Loggen-Switch</strong> einer Adresse umlegen
                          — oder im Edit-Dialog „Im Protokoll erfassen"
                          anhaken und speichern.
                        </p>
                        <p class="muted small">
                          Falls du gerade aktiviert hast und es trotzdem nicht
                          erscheint: <strong>Browser-Cache leeren</strong>
                          (Cmd+Shift+R) — sonst liegt evtl. der alte Bundle
                          mit dem API-Bug vom 2026-05-01 vor 21:14 vor.
                        </p>` : i`<p>
                        Keine Treffer für aktuelle Filter
                        (${this._items.length} Adressen total,
                        ${e} davon aktiv).
                      </p>`}
              </div>` : i`
                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>GA</th>
                        <th>Label</th>
                        <th>DPT</th>
                        <th>Severity</th>
                        <th class="col-toggle">Loggen</th>
                        <th class="col-actions"></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${t.map(
      (s) => i`
                          <tr class=${s.log_enabled ? "enabled" : ""}>
                            <td><code class="ga">${s.address}</code></td>
                            <td class="label-cell">${s.label}</td>
                            <td>
                              ${s.dpt ? i`<code class="dpt">${s.dpt}</code>` : i`<span class="muted">—</span>`}
                            </td>
                            <td>
                              ${s.log_enabled ? i`<button
                                    class=${`mh-pill mh-pill--${s.log_severity === "auto" ? "neutral" : s.log_severity} sev-trigger`}
                                    title="Severity ändern"
                                    aria-haspopup="menu"
                                    aria-expanded=${this._sevPopoverFor === s.address}
                                    @click=${(a) => this._onSeverityTrigger(a, s)}
                                  >
                                    <span class="mh-pill__dot"></span>
                                    ${s.log_severity}${s.log_severity === "auto" ? i` <small class="auto-detail"
                                          >T:${s.severity_on_true ?? "warning"}
                                          / F:${s.severity_on_false ?? "info"}</small
                                        >` : h}
                                    <span class="sev-caret" aria-hidden="true">▾</span>
                                  </button>` : i`<span class="muted">—</span>`}
                            </td>
                            <td class="col-toggle">
                              <label class="switch" title=${s.log_enabled ? "Loggen deaktivieren" : "Loggen aktivieren"}>
                                <input
                                  type="checkbox"
                                  .checked=${s.log_enabled}
                                  @change=${() => void this._toggleLog(s)}
                                  aria-label=${s.log_enabled ? "Loggen deaktivieren" : "Loggen aktivieren"}
                                />
                                <span class="slider"></span>
                              </label>
                            </td>
                            <td class="col-actions">
                              <button
                                class="icon-btn"
                                title="Bearbeiten"
                                aria-label="Bearbeiten"
                                @click=${() => this._editing = s}
                              >
                                <span aria-hidden="true">✎</span>
                              </button>
                              <button
                                class="icon-btn danger"
                                title="Löschen"
                                aria-label="Löschen"
                                @click=${() => void this._delete(s.address)}
                              >
                                <span aria-hidden="true">🗑</span>
                              </button>
                            </td>
                          </tr>
                        `
    )}
                    </tbody>
                  </table>
                </div>
              `}

        ${this._renderEditor()}
        ${this._renderSevPopover()}
        ${this._toast ? i`<div class="toast">${this._toast}</div>` : h}
      </section>
    `;
  }
};
k.styles = [
  L,
  fe,
  Tt,
  be,
  y`
      section {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
      }
      .head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: var(--mh-space-4);
        flex-wrap: wrap;
      }
      h2 {
        margin: 0;
        font-size: var(--mh-text-xl);
        font-weight: var(--mh-weight-semibold);
        letter-spacing: -0.01em;
      }
      h3 {
        margin: 0 0 var(--mh-space-2) 0;
      }
      .hint {
        margin: 4px 0 0 0;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        line-height: 1.5;
      }
      .header-actions {
        display: flex;
        gap: var(--mh-space-2);
        align-items: center;
        flex-wrap: wrap;
      }
      .csv-upload {
        cursor: pointer;
      }
      .csv-upload input[type="file"] {
        display: none;
      }
      .discovery-status {
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-warning-soft);
        border-left: 3px solid var(--mh-warning);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
        line-height: 1.5;
      }

      /* Add-Form */
      .add-form {
        display: grid;
        grid-template-columns: 140px 1fr 130px auto;
        gap: var(--mh-space-2);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-3);
      }
      @media (max-width: 720px) {
        .add-form {
          grid-template-columns: 1fr 1fr;
        }
      }
      .narrow {
        max-width: 130px;
      }

      /* Filter-Bar */
      .filter-bar {
        display: flex;
        gap: var(--mh-space-3);
        align-items: center;
        flex-wrap: wrap;
      }
      .filter-bar .mh-input {
        flex: 1;
        min-width: 200px;
        max-width: 320px;
      }
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: var(--mh-space-1);
        font-size: var(--mh-text-sm);
        cursor: pointer;
        color: var(--mh-fg-muted);
      }
      .muted {
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }

      /* Tabelle */
      .table-wrap {
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        overflow: hidden;
        box-shadow: var(--mh-shadow-1);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 8px var(--mh-space-3);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-sm);
      }
      tr:last-child td {
        border-bottom: 0;
      }
      th {
        background: var(--mh-bg);
        font-size: var(--mh-text-xs);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
        position: sticky;
        top: 0;
        z-index: 1;
      }
      tr {
        transition: background var(--mh-transition-fast);
      }
      tbody tr:hover {
        background: var(--mh-surface-2);
      }
      tr.enabled {
        background: color-mix(in srgb, var(--mh-success) 4%, transparent);
      }
      .col-toggle {
        text-align: center;
        width: 60px;
      }
      .col-actions {
        text-align: right;
        white-space: nowrap;
        width: 80px;
      }
      .col-actions button + button {
        margin-left: 4px;
      }
      code.ga {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg);
      }
      code.dpt {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        background: var(--mh-surface-2);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
      }
      .label-cell {
        max-width: 360px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .auto-detail {
        font-size: 0.78em;
        font-weight: var(--mh-weight-regular);
        opacity: 0.75;
        margin-left: 4px;
      }

      /* Switch */
      .switch {
        position: relative;
        display: inline-block;
        width: 36px;
        height: 20px;
        cursor: pointer;
      }
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .slider {
        position: absolute;
        inset: 0;
        background: var(--mh-divider);
        border-radius: var(--mh-radius-pill);
        transition: background var(--mh-transition-fast);
      }
      .slider::before {
        content: "";
        position: absolute;
        height: 14px;
        width: 14px;
        left: 3px;
        top: 3px;
        background: white;
        border-radius: 50%;
        transition: transform var(--mh-transition-fast);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }
      .switch input:checked + .slider {
        background: var(--mh-success);
      }
      .switch input:checked + .slider::before {
        transform: translateX(16px);
      }
      .switch input:focus-visible + .slider {
        outline: var(--mh-focus-ring);
        outline-offset: 2px;
      }

      /* Icon-Buttons */
      .icon-btn {
        appearance: none;
        background: transparent;
        border: 1px solid transparent;
        width: 28px;
        height: 28px;
        border-radius: var(--mh-radius-sm);
        cursor: pointer;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background var(--mh-transition-fast), color var(--mh-transition-fast);
      }
      .icon-btn:hover {
        background: var(--mh-surface-2);
        color: var(--mh-fg);
      }
      .icon-btn.danger:hover {
        background: var(--mh-error-soft);
        color: var(--mh-error);
      }
      .icon-btn:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: 2px;
      }

      /* Empty / Error */
      .empty {
        padding: var(--mh-space-5);
        text-align: center;
        color: var(--mh-fg-muted);
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
        line-height: 1.5;
      }
      .error {
        color: var(--mh-error);
        font-size: var(--mh-text-sm);
        padding: 6px var(--mh-space-2);
        background: var(--mh-error-soft);
        border-left: 3px solid var(--mh-error);
        border-radius: 2px;
      }

      /* Toast */
      .toast {
        position: fixed;
        bottom: var(--mh-space-5);
        right: var(--mh-space-5);
        background: var(--mh-fg);
        color: var(--mh-bg);
        padding: var(--mh-space-3) var(--mh-space-4);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        font-size: var(--mh-text-sm);
        z-index: 100;
      }

      /* Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 60;
      }
      .modal {
        background: var(--mh-surface);
        border-radius: var(--mh-radius-lg);
        padding: var(--mh-space-5);
        width: min(560px, 92vw);
        max-height: 90vh;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
        box-shadow: var(--mh-shadow-3);
      }
      .modal label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .modal label > span {
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg);
      }
      .modal label.checkbox {
        flex-direction: row;
        align-items: center;
        gap: 6px;
      }
      .modal input[type="text"],
      .modal select {
        padding: 8px 12px;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        font: inherit;
        font-size: var(--mh-text-sm);
        background: var(--mh-surface);
        color: var(--mh-fg);
      }
      .modal input[type="text"]:focus-visible,
      .modal select:focus-visible {
        outline: none;
        border-color: var(--mh-accent);
        box-shadow: 0 0 0 3px var(--mh-accent-soft);
      }
      .modal small {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      .modal small code {
        background: var(--mh-surface-2);
        padding: 1px 4px;
        border-radius: 3px;
      }
      .row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--mh-space-3);
      }
      @media (max-width: 600px) {
        .row-2 {
          grid-template-columns: 1fr;
        }
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--mh-space-2);
        margin-top: var(--mh-space-2);
      }
      .modal-actions .mh-btn {
        font-size: var(--mh-text-sm);
      }

      /* Severity-Inline-Popover (Pille als klickbarer Trigger) */
      button.sev-trigger {
        appearance: none;
        cursor: pointer;
        font: inherit;
        border: 0;
        gap: 4px;
        transition: filter var(--mh-transition-fast), box-shadow var(--mh-transition-fast);
      }
      button.sev-trigger:hover {
        filter: brightness(0.95);
        box-shadow: 0 0 0 2px var(--mh-divider);
      }
      button.sev-trigger:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: 2px;
      }
      .sev-caret {
        font-size: 0.7em;
        opacity: 0.65;
        margin-left: 2px;
      }
      .sev-backdrop {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: transparent;
      }
      .sev-popover {
        position: fixed;
        z-index: 70;
        min-width: 200px;
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        animation: sev-pop-in 120ms ease-out;
      }
      @keyframes sev-pop-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      button.sev-option {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 6px 8px;
        border-radius: var(--mh-radius-sm);
        cursor: pointer;
        font: inherit;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--mh-space-2);
      }
      button.sev-option:hover {
        background: var(--mh-surface-2);
      }
      button.sev-option.active {
        background: var(--mh-surface-2);
      }
      button.sev-option:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: -2px;
      }
      .sev-check {
        color: var(--mh-success);
        font-weight: var(--mh-weight-bold);
      }
    `
];
E([
  f({ attribute: !1 })
], k.prototype, "api", 2);
E([
  l()
], k.prototype, "_items", 2);
E([
  l()
], k.prototype, "_loading", 2);
E([
  l()
], k.prototype, "_filter", 2);
E([
  l()
], k.prototype, "_onlyEnabled", 2);
E([
  l()
], k.prototype, "_newAddr", 2);
E([
  l()
], k.prototype, "_newLabel", 2);
E([
  l()
], k.prototype, "_newDpt", 2);
E([
  l()
], k.prototype, "_sevPopoverFor", 2);
E([
  l()
], k.prototype, "_sevPopoverPos", 2);
E([
  l()
], k.prototype, "_discovery", 2);
E([
  l()
], k.prototype, "_discoveryStatus", 2);
E([
  l()
], k.prototype, "_editing", 2);
E([
  l()
], k.prototype, "_toast", 2);
E([
  l()
], k.prototype, "_error", 2);
k = E([
  $("knx-addresses-view")
], k);
var Os = Object.defineProperty, Cs = Object.getOwnPropertyDescriptor, xe = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Cs(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Os(e, s, r), r;
};
const Ms = ["telegram", "pushover", "ntfy", "signal", "notify"], Ns = ["debug", "info", "warning", "error"];
let Y = class extends w {
  constructor() {
    super(...arguments), this._items = [], this._editing = null, this._toast = "";
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    this.api && (this._items = await this.api.listChannels());
  }
  _new() {
    this._editing = {
      id: null,
      name: "",
      channel_type: "notify",
      enabled: !0,
      severity_threshold: "warning",
      quiet_start: null,
      quiet_end: null,
      quiet_bypass_error: !0,
      throttle_seconds: 600,
      config: { service: "" }
    };
  }
  _edit(t) {
    this._editing = { ...t };
  }
  async _save() {
    if (!(!this.api || !this._editing)) {
      try {
        this._editing.id == null ? await this.api.createChannel(this._editing) : await this.api.updateChannel(this._editing.id, this._editing), this._editing = null, this._toast = "gespeichert", await this._load();
      } catch (t) {
        this._toast = t.message;
      }
      window.setTimeout(() => this._toast = "", 2400);
    }
  }
  async _delete(t) {
    !this.api || t.id == null || window.confirm(`Channel '${t.name}' löschen?`) && (await this.api.deleteChannel(t.id), await this._load());
  }
  _renderTypeFields(t, e) {
    const s = t.config ?? {}, a = (r, o) => {
      e({ config: { ...s, [r]: o } });
    };
    return t.channel_type === "telegram" ? i`
        <div class="row-2">
          <label>
            <span>Bot-Token</span>
            <input
              type="password"
              placeholder="123456:ABC..."
              .value=${s.bot_token ?? ""}
              @input=${(r) => a("bot_token", r.target.value)}
            />
            <small>Vom @BotFather erhalten.</small>
          </label>
          <label>
            <span>Chat-ID</span>
            <input
              placeholder="-100123456789 oder 12345678"
              .value=${s.chat_id ?? ""}
              @input=${(r) => a("chat_id", r.target.value)}
            />
            <small>An @userinfobot eine Nachricht senden, dort steht die ID.</small>
          </label>
        </div>
      ` : t.channel_type === "pushover" ? i`
        <div class="row-2">
          <label>
            <span>App-Token</span>
            <input
              type="password"
              placeholder="azGDORePK8gMaC0QOYAMyEEuzJnyUi"
              .value=${s.app_token ?? ""}
              @input=${(r) => a("app_token", r.target.value)}
            />
          </label>
          <label>
            <span>User-Key</span>
            <input
              .value=${s.user_key ?? ""}
              @input=${(r) => a("user_key", r.target.value)}
            />
          </label>
        </div>
        <label>
          <span>Gerät (optional)</span>
          <input
            placeholder="iphone, oder leer = alle Geräte"
            .value=${s.device ?? ""}
            @input=${(r) => a("device", r.target.value)}
          />
        </label>
      ` : t.channel_type === "ntfy" ? i`
        <div class="row-2">
          <label>
            <span>Server (Default ntfy.sh)</span>
            <input
              placeholder="https://ntfy.sh"
              .value=${s.base_url ?? ""}
              @input=${(r) => a("base_url", r.target.value)}
            />
          </label>
          <label>
            <span>Topic</span>
            <input
              placeholder="ha_alerts_dein_topic"
              .value=${s.topic ?? ""}
              @input=${(r) => a("topic", r.target.value)}
            />
          </label>
        </div>
        <label>
          <span>Auth-Token (optional, für geschützte Server)</span>
          <input
            type="password"
            .value=${s.token ?? ""}
            @input=${(r) => a("token", r.target.value)}
          />
        </label>
      ` : i`
      <label>
        <span>Notify-Service-Name (ohne <code>notify.</code>)</span>
        <input
          placeholder="z. B. mobile_app_iphone, signal_messenger"
          .value=${s.service ?? ""}
          @input=${(r) => a("service", r.target.value)}
        />
      </label>
    `;
  }
  _renderEditor() {
    const t = this._editing, e = (s) => {
      this._editing = { ...t, ...s };
    };
    return i`
      <div class="modal-bg" @click=${() => this._editing = null}>
        <div class="modal" @click=${(s) => s.stopPropagation()}>
          <h3>${t.id == null ? "Neuen Channel anlegen" : `${t.name} bearbeiten`}</h3>
          <label
            ><span>Name</span
            ><input
              .value=${t.name}
              @input=${(s) => e({ name: s.target.value })}
          /></label>
          <label>
            <span>Typ</span>
            <select
              .value=${t.channel_type}
              @change=${(s) => {
      const a = s.target.value;
      e({ channel_type: a, config: {} });
    }}
            >
              ${Ms.map((s) => i`<option value=${s}>${s}</option>`)}
            </select>
            <small>
              ${t.channel_type === "telegram" ? "Direkt an Telegram-Bot-API. Bot-Token + Chat-ID unten." : t.channel_type === "pushover" ? "Direkt an Pushover-API. App-Token + User-Key unten." : t.channel_type === "ntfy" ? "Direkt an ntfy-Server (ntfy.sh oder selbst-gehostet)." : t.channel_type === "signal" ? "Ueber HA-Service notify.<service>. Trag Namen unten ein." : "Ueber HA-Service notify.<service>."}
            </small>
          </label>

          ${this._renderTypeFields(t, e)}

          <div class="row-2">
            <label>
              <span>Severity-Schwelle</span>
              <select
                .value=${t.severity_threshold}
                @change=${(s) => {
      const a = s.target.value;
      e({ severity_threshold: a });
    }}
              >
                ${Ns.map((s) => i`<option value=${s}>${s}</option>`)}
              </select>
            </label>
            <label>
              <span>Throttle (Sek. pro Source)</span>
              <input
                type="number"
                min="0"
                .value=${String(t.throttle_seconds)}
                @input=${(s) => e({ throttle_seconds: +s.target.value })}
              />
            </label>
          </div>

          <div class="row-2">
            <label>
              <span>Quiet Hours Start (HH:MM)</span>
              <input
                placeholder="22:00"
                .value=${t.quiet_start ?? ""}
                @input=${(s) => e({ quiet_start: s.target.value || null })}
              />
            </label>
            <label>
              <span>Quiet Hours Ende (HH:MM)</span>
              <input
                placeholder="07:00"
                .value=${t.quiet_end ?? ""}
                @input=${(s) => e({ quiet_end: s.target.value || null })}
              />
            </label>
          </div>

          <label class="checkbox">
            <input
              type="checkbox"
              .checked=${t.quiet_bypass_error}
              @change=${(s) => e({ quiet_bypass_error: s.target.checked })}
            /><span>Errors umgehen Quiet Hours</span>
          </label>
          <label class="checkbox">
            <input
              type="checkbox"
              .checked=${t.enabled}
              @change=${(s) => e({ enabled: s.target.checked })}
            /><span>aktiv</span>
          </label>

          <div class="actions">
            <button @click=${() => this._editing = null}>Abbrechen</button>
            <button class="primary" @click=${() => void this._save()}>Speichern</button>
          </div>
        </div>
      </div>
    `;
  }
  render() {
    return i`
      <section>
        <header>
          <div>
            <h2>Notification-Channels</h2>
            <p class="hint">
              Pro Nachricht oberhalb der Severity-Schwelle wird
              <code>notify.&lt;service&gt;</code> aufgerufen. Quiet Hours +
              Throttling pro Source verhindern Spam.
            </p>
          </div>
          <button class="primary" @click=${this._new}>+ Channel</button>
        </header>
        ${this._items.length === 0 ? i`<p class="empty">Noch kein Channel angelegt.</p>` : i`<table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Typ / Service</th>
                  <th>Schwelle</th>
                  <th>Quiet</th>
                  <th>Throttle</th>
                  <th>Aktiv</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._items.map(
      (t) => {
        var e, s, a, r, o;
        return i`<tr>
                    <td>${t.name}</td>
                    <td>
                      <code>${t.channel_type}</code>
                      ${t.channel_type === "telegram" ? i` → <small>${((e = t.config) == null ? void 0 : e.chat_id) ?? "?"}</small>` : t.channel_type === "pushover" ? i` → <small>${((a = (s = t.config) == null ? void 0 : s.user_key) == null ? void 0 : a.slice(0, 8)) ?? "?"}…</small>` : t.channel_type === "ntfy" ? i` → <small>${((r = t.config) == null ? void 0 : r.topic) ?? "?"}</small>` : (o = t.config) != null && o.service ? i` → <code>notify.${t.config.service}</code>` : i`<span class="muted">— unkonfiguriert</span>`}
                    </td>
                    <td>${t.severity_threshold}</td>
                    <td>
                      ${t.quiet_start && t.quiet_end ? i`${t.quiet_start}–${t.quiet_end}${t.quiet_bypass_error ? i` <small>(Err bypass)</small>` : ""}` : i`<span class="muted">—</span>`}
                    </td>
                    <td>${t.throttle_seconds}s</td>
                    <td>${t.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button @click=${() => this._edit(t)}>Edit</button>
                      <button class="danger" @click=${() => void this._delete(t)}>
                        Löschen
                      </button>
                    </td>
                  </tr>`;
      }
    )}
              </tbody>
            </table>`}
        ${this._editing ? this._renderEditor() : null}
        ${this._toast ? i`<div class="toast">${this._toast}</div>` : null}
      </section>
    `;
  }
};
Y.styles = y`
    section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
    }
    h2 {
      margin: 0;
      font-size: 1.2em;
    }
    h3 {
      margin: 0;
    }
    .hint {
      margin: 4px 0 0 0;
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
    button.primary {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
    }
    button.danger {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
    }
    th,
    td {
      text-align: left;
      padding: 6px 12px;
      border-bottom: 1px solid var(--divider-color, #eee);
      font-size: 0.9em;
    }
    th {
      background: var(--secondary-background-color, #f3f3f3);
      font-size: 0.78em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color, #666);
    }
    td.actions {
      text-align: right;
      white-space: nowrap;
    }
    td.actions button + button {
      margin-left: 4px;
    }
    .muted {
      color: var(--secondary-text-color, #888);
      font-size: 0.85em;
    }
    .empty {
      padding: 24px;
      text-align: center;
      background: var(--card-background-color, white);
      border: 1px dashed var(--divider-color, #ccc);
      border-radius: 8px;
      color: var(--secondary-text-color, #666);
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 1px 5px;
      border-radius: 3px;
    }
    .modal-bg {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 60;
    }
    .modal {
      background: var(--card-background-color, white);
      border-radius: 8px;
      padding: 20px;
      width: min(560px, 92vw);
      max-height: 90vh;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
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
    label.checkbox {
      flex-direction: row;
      align-items: center;
      gap: 6px;
    }
    input,
    select {
      padding: 8px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font: inherit;
      background: var(--card-background-color, white);
      color: var(--primary-text-color, #222);
    }
    .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .row-2 {
        grid-template-columns: 1fr;
      }
    }
    small {
      font-size: 0.78em;
      color: var(--secondary-text-color, #888);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
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
    }
  `;
xe([
  f({ attribute: !1 })
], Y.prototype, "api", 2);
xe([
  l()
], Y.prototype, "_items", 2);
xe([
  l()
], Y.prototype, "_editing", 2);
xe([
  l()
], Y.prototype, "_toast", 2);
Y = xe([
  $("channels-view")
], Y);
var Hs = Object.defineProperty, Is = Object.getOwnPropertyDescriptor, S = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Is(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Hs(e, s, r), r;
};
const We = y`
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 1.2em;
  }
  .hint {
    margin: 4px 0 0 0;
    font-size: 0.9em;
    color: var(--secondary-text-color, #666);
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    background: var(--card-background-color, white);
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 8px;
    padding: 12px;
  }
  .add > input,
  .add > select {
    flex: 1;
    min-width: 140px;
    padding: 6px 10px;
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 4px;
    font: inherit;
    background: var(--card-background-color, white);
    color: var(--primary-text-color, #222);
  }
  label.inline {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85em;
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
  button.primary {
    background: var(--primary-color, #03a9f4);
    color: white;
    border-color: var(--primary-color, #03a9f4);
  }
  button.danger {
    color: var(--error-color, #db4437);
    border-color: var(--error-color, #db4437);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--card-background-color, white);
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 8px;
    overflow: hidden;
  }
  th,
  td {
    text-align: left;
    padding: 6px 12px;
    border-bottom: 1px solid var(--divider-color, #eee);
    font-size: 0.9em;
  }
  th {
    background: var(--secondary-background-color, #f3f3f3);
    font-size: 0.78em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--secondary-text-color, #666);
  }
  td.actions {
    text-align: right;
    white-space: nowrap;
  }
  .muted {
    color: var(--secondary-text-color, #888);
  }
  .ok {
    color: var(--success-color, #4caf50);
  }
  .alert {
    color: var(--warning-color, #ff9800);
    font-weight: 600;
  }
  code {
    font-family: var(--ha-font-family-code, monospace);
    font-size: 0.85em;
    background: var(--secondary-background-color, #f5f5f5);
    padding: 1px 5px;
    border-radius: 3px;
  }
  .empty {
    padding: 24px;
    text-align: center;
    background: var(--card-background-color, white);
    border: 1px dashed var(--divider-color, #ccc);
    border-radius: 8px;
    color: var(--secondary-text-color, #666);
  }
`;
let j = class extends w {
  constructor() {
    super(...arguments), this._items = [], this._newPattern = "", this._newSource = "", this._newSeverity = "info";
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    this.api && (this._items = await this.api.listMqttTopics());
  }
  async _add() {
    !this.api || !this._newPattern.trim() || !this._newSource.trim() || (await this.api.createMqttTopic({
      topic_pattern: this._newPattern.trim(),
      source: this._newSource.trim(),
      severity: this._newSeverity,
      enabled: !0
    }), this._newPattern = "", this._newSource = "", await this._load());
  }
  async _delete(t) {
    !this.api || t.id == null || window.confirm(`Subscription '${t.topic_pattern}' löschen?`) && (await this.api.deleteMqttTopic(t.id), await this._load());
  }
  render() {
    return i`
      <section>
        <header>
          <h2>MQTT-Topic-Subscriptions</h2>
          <p class="hint">
            Wildcards <code>+</code> (ein Segment) und <code>#</code>
            (Subtree) werden direkt von HA-MQTT aufgelöst. Subscriptions
            werden nach Restart neu gesetzt.
          </p>
        </header>

        <div class="add">
          <input
            placeholder="Topic-Pattern (z. B. zigbee2mqtt/+/availability)"
            .value=${this._newPattern}
            @input=${(t) => this._newPattern = t.target.value}
          />
          <input
            placeholder="Source (z. B. zigbee.health)"
            .value=${this._newSource}
            @input=${(t) => this._newSource = t.target.value}
          />
          <select
            .value=${this._newSeverity}
            @change=${(t) => {
      this._newSeverity = t.target.value;
    }}
          >
            <option value="debug">debug</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
          </select>
          <button class="primary" @click=${this._add}>+ Hinzufügen</button>
        </div>

        ${this._items.length === 0 ? i`<p class="empty">Noch keine Topics abonniert.</p>` : i`<table>
              <thead>
                <tr>
                  <th>Topic-Pattern</th>
                  <th>Source</th>
                  <th>Severity</th>
                  <th>Aktiv</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._items.map(
      (t) => i`<tr>
                    <td><code>${t.topic_pattern}</code></td>
                    <td>${t.source}</td>
                    <td>${t.severity}</td>
                    <td>${t.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button class="danger" @click=${() => void this._delete(t)}>
                        Löschen
                      </button>
                    </td>
                  </tr>`
    )}
              </tbody>
            </table>`}
      </section>
    `;
  }
};
j.styles = We;
S([
  f({ attribute: !1 })
], j.prototype, "api", 2);
S([
  l()
], j.prototype, "_items", 2);
S([
  l()
], j.prototype, "_newPattern", 2);
S([
  l()
], j.prototype, "_newSource", 2);
S([
  l()
], j.prototype, "_newSeverity", 2);
j = S([
  $("mqtt-topics-view")
], j);
let Q = class extends w {
  constructor() {
    super(...arguments), this._items = [], this._newSource = "", this._newInterval = 3600;
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    this.api && (this._items = await this.api.listHeartbeats());
  }
  async _add() {
    !this.api || !this._newSource.trim() || (await this.api.upsertHeartbeat(this._newSource.trim(), this._newInterval), this._newSource = "", await this._load());
  }
  render() {
    return i`
      <section>
        <header>
          <h2>Heartbeat-Quellen</h2>
          <p class="hint">
            Der Heartbeat-Job prueft alle 60 s. Wenn <code>last_seen + 1.5 ×
            interval</code> ueberschritten ist, generiert er eine Warning mit
            Source <code>messagehub.heartbeat</code>. Der Status reset sich,
            wenn die Quelle wieder sendet.
          </p>
        </header>
        <div class="add">
          <input
            placeholder="Source (z. B. raspi-keller)"
            .value=${this._newSource}
            @input=${(t) => this._newSource = t.target.value}
          />
          <input
            type="number"
            min="60"
            placeholder="Intervall (Sek)"
            .value=${String(this._newInterval)}
            @input=${(t) => this._newInterval = +t.target.value}
          />
          <button class="primary" @click=${this._add}>+ Hinzufügen</button>
        </div>
        ${this._items.length === 0 ? i`<p class="empty">Noch keine Heartbeat-Quellen.</p>` : i`<table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Intervall (s)</th>
                  <th>Letzte Sichtung</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${this._items.map(
      (t) => i`<tr>
                    <td><code>${t.source}</code></td>
                    <td>${t.expected_interval_seconds}</td>
                    <td>${t.last_seen ?? i`<span class="muted">—</span>`}</td>
                    <td>
                      ${t.silent_alert_active ? i`<span class="alert">⚠ silent</span>` : i`<span class="ok">✓ ok</span>`}
                    </td>
                  </tr>`
    )}
              </tbody>
            </table>`}
      </section>
    `;
  }
};
Q.styles = We;
S([
  f({ attribute: !1 })
], Q.prototype, "api", 2);
S([
  l()
], Q.prototype, "_items", 2);
S([
  l()
], Q.prototype, "_newSource", 2);
S([
  l()
], Q.prototype, "_newInterval", 2);
Q = S([
  $("heartbeats-view")
], Q);
let M = class extends w {
  constructor() {
    super(...arguments), this._items = [], this._newName = "", this._newSource = "", this._newAutomation = "", this._newAuto = !1;
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    this.api && (this._items = await this.api.listRemediationHooks());
  }
  async _add() {
    this.api && (await this.api.createRemediationHook({
      name: this._newName.trim(),
      source_pattern: this._newSource.trim(),
      automation_id: this._newAutomation.trim(),
      confirm_required: !this._newAuto,
      enabled: !0
    }), this._newName = "", this._newSource = "", this._newAutomation = "", await this._load());
  }
  async _delete(t) {
    !this.api || t.id == null || window.confirm(`Hook '${t.name}' löschen?`) && (await this.api.deleteRemediationHook(t.id), await this._load());
  }
  render() {
    return i`
      <section>
        <header>
          <h2>Auto-Remediation</h2>
          <p class="hint">
            Wenn eine Source-Pattern matcht (auch SQL-Wildcard <code>%</code>),
            ruft messagehub die <code>script.</code>- oder
            <code>automation.</code>-Entity auf. Modus
            <strong>Vorschlag</strong>: nur Log-Eintrag.
            <strong>Auto</strong>: direkter Service-Call. Audit-Eintrag pro
            Ausfuehrung.
          </p>
        </header>
        <div class="add">
          <input
            placeholder="Name (z. B. AP-Restart)"
            .value=${this._newName}
            @input=${(t) => this._newName = t.target.value}
          />
          <input
            placeholder="Source-Pattern (% erlaubt)"
            .value=${this._newSource}
            @input=${(t) => this._newSource = t.target.value}
          />
          <input
            placeholder="automation.foo / script.bar"
            .value=${this._newAutomation}
            @input=${(t) => this._newAutomation = t.target.value}
          />
          <label class="inline">
            <input
              type="checkbox"
              .checked=${this._newAuto}
              @change=${(t) => this._newAuto = t.target.checked}
            />
            <span>Auto</span>
          </label>
          <button class="primary" @click=${this._add}>+ Hinzufügen</button>
        </div>
        ${this._items.length === 0 ? i`<p class="empty">Noch keine Hooks.</p>` : i`<table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Source-Pattern</th>
                  <th>Automation</th>
                  <th>Modus</th>
                  <th>Aktiv</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._items.map(
      (t) => i`<tr>
                    <td>${t.name}</td>
                    <td><code>${t.source_pattern}</code></td>
                    <td><code>${t.automation_id}</code></td>
                    <td>
                      ${t.confirm_required ? i`<span class="muted">Vorschlag</span>` : i`<span class="alert">Auto</span>`}
                    </td>
                    <td>${t.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button class="danger" @click=${() => void this._delete(t)}>
                        Löschen
                      </button>
                    </td>
                  </tr>`
    )}
              </tbody>
            </table>`}
      </section>
    `;
  }
};
M.styles = We;
S([
  f({ attribute: !1 })
], M.prototype, "api", 2);
S([
  l()
], M.prototype, "_items", 2);
S([
  l()
], M.prototype, "_newName", 2);
S([
  l()
], M.prototype, "_newSource", 2);
S([
  l()
], M.prototype, "_newAutomation", 2);
S([
  l()
], M.prototype, "_newAuto", 2);
M = S([
  $("remediation-view")
], M);
var Bs = Object.defineProperty, Fs = Object.getOwnPropertyDescriptor, I = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Fs(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Bs(e, s, r), r;
};
const zt = [
  { id: "webhooks", label: "Webhooks" },
  { id: "knx", label: "KNX-Bus" },
  { id: "channels", label: "Channels" },
  { id: "mqtt", label: "MQTT" },
  { id: "heartbeats", label: "Heartbeats" },
  { id: "remediation", label: "Auto-Remediation" }
], Dt = "messagehub.settings.tab";
function js() {
  try {
    const t = localStorage.getItem(Dt);
    if (t && zt.some((e) => e.id === t)) return t;
  } catch {
  }
  return "webhooks";
}
let D = class extends w {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._showForm = !1, this._editing = null, this._toast = "", this._menuOpenId = null, this._activeTab = js(), this._closeMenu = () => {
      this._menuOpenId !== null && (this._menuOpenId = null);
    };
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
    this.api && window.confirm(`Webhook „${t.name}" wirklich löschen?`) && (await this.api.deleteWebhook(t.webhook_id), this._showToast(`„${t.name}" gelöscht`), await this._load());
  }
  _toggleMenu(t) {
    this._menuOpenId = this._menuOpenId === t ? null : t;
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
  _selectTab(t) {
    this._activeTab = t;
    try {
      localStorage.setItem(Dt, t);
    } catch {
    }
  }
  _renderEmpty() {
    return i`
      <div class="empty">
        <h3>Noch keine Webhooks</h3>
        <p>
          Lege deinen ersten Webhook an, um Nachrichten von externen Quellen
          (Pi-hole, Grafana, Skripte, IoT-Geräte) zu empfangen. Jeder Webhook
          bekommt eine eigene Geheim-URL nach
          <code>https://&lt;ha-host&gt;/api/webhook/&lt;id&gt;</code>.
        </p>
        <button class="mh-btn mh-btn--primary" @click=${this._add}>+ Webhook anlegen</button>
      </div>
    `;
  }
  _renderItem(t) {
    const e = `${window.location.origin}/api/webhook/${t.webhook_id}`, s = this._menuOpenId === t.webhook_id;
    return i`
      <div class=${`webhook-card ${t.enabled ? "" : "disabled"}`}>
        <header class="card-header">
          <div class="title">
            <span
              class=${`status-dot ${t.enabled ? "ok" : "off"}`}
              title=${t.enabled ? "Aktiv" : "Deaktiviert"}
              aria-hidden="true"
            ></span>
            <h4>${t.name}</h4>
            <span class=${`status-text ${t.enabled ? "ok" : "off"}`}>
              ${t.enabled ? "Aktiv" : "Deaktiviert"}
            </span>
          </div>
          <div class="card-actions" @click=${(a) => a.stopPropagation()}>
            <button
              class="mh-btn mh-btn--sm"
              title="Webhook bearbeiten"
              @click=${() => this._edit(t)}
            >
              <span aria-hidden="true">✎</span> Bearbeiten
            </button>
            <div class="overflow">
              <button
                class="mh-btn mh-btn--icon mh-btn--ghost"
                aria-label="Weitere Aktionen"
                aria-haspopup="menu"
                aria-expanded=${s}
                @click=${() => this._toggleMenu(t.webhook_id)}
              >
                ⋮
              </button>
              ${s ? i`<div class="overflow-menu" role="menu">
                    <button
                      role="menuitem"
                      class="overflow-item"
                      @click=${() => {
      this._menuOpenId = null, this._toggle(t);
    }}
                    >
                      ${t.enabled ? "Deaktivieren" : "Aktivieren"}
                    </button>
                    <hr />
                    <button
                      role="menuitem"
                      class="overflow-item danger"
                      @click=${() => {
      this._menuOpenId = null, this._delete(t);
    }}
                    >
                      Löschen
                    </button>
                  </div>` : null}
            </div>
          </div>
        </header>

        <div class="meta">
          <span class="meta-pill">
            <span class="meta-key">Source</span>
            <code>${t.default_source}</code>
          </span>
          <span class="meta-pill">
            <span class="meta-key">Severity</span>
            <code>${t.default_severity}</code>
          </span>
        </div>

        <div class="url-row">
          <code class="url" title=${e}>${e}</code>
          <button
            class="mh-btn mh-btn--sm"
            @click=${() => this._copyUrl(t.webhook_id)}
            title="URL in Zwischenablage kopieren"
          >
            <span aria-hidden="true">⧉</span> Kopieren
          </button>
        </div>

        ${t.field_map ? i`<details class="mapping">
              <summary>JSONPath-Mapping anzeigen</summary>
              <pre><code>${JSON.stringify(t.field_map, null, 2)}</code></pre>
            </details>` : null}
      </div>
    `;
  }
  render() {
    return i`
      <div class="root" @click=${this._closeMenu}>
        <nav class="tabs" role="tablist" aria-label="Einstellungs-Bereiche">
          ${zt.map(
      (t) => i`<button
              role="tab"
              aria-selected=${this._activeTab === t.id}
              class=${`tab ${this._activeTab === t.id ? "active" : ""}`}
              title=${t.label}
              @click=${() => this._selectTab(t.id)}
            >
              <span>${t.label}</span>
            </button>`
    )}
        </nav>

        <div class="tab-panel" role="tabpanel">
          ${this._renderActiveTab()}
        </div>

        ${this._toast ? i`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
  _renderActiveTab() {
    switch (this._activeTab) {
      case "webhooks":
        return this._renderWebhooks();
      case "knx":
        return i`<knx-addresses-view .api=${this.api}></knx-addresses-view>`;
      case "channels":
        return i`<channels-view .api=${this.api}></channels-view>`;
      case "mqtt":
        return i`<mqtt-topics-view .api=${this.api}></mqtt-topics-view>`;
      case "heartbeats":
        return i`<heartbeats-view .api=${this.api}></heartbeats-view>`;
      case "remediation":
        return i`<remediation-view .api=${this.api}></remediation-view>`;
    }
  }
  _renderWebhooks() {
    return i`
      <section>
        <header class="section-head">
          <div>
            <h2>Webhooks</h2>
            <p class="hint">
              Eingehende Nachrichten via HTTP-POST. Pro Webhook eigene URL +
              optionales JSONPath-Mapping für beliebige Payload-Strukturen.
            </p>
          </div>
          ${this._items.length > 0 && !this._showForm ? i`<button class="mh-btn mh-btn--primary" @click=${this._add}>
                + Webhook anlegen
              </button>` : null}
        </header>

        ${this._showForm ? i`<webhook-form
              .api=${this.api}
              .editing=${this._editing}
              @saved=${this._onSaved}
              @cancel=${this._onCancel}
            ></webhook-form>` : null}

        ${this._loading ? i`<p class="status">lade…</p>` : this._items.length === 0 && !this._showForm ? this._renderEmpty() : i`<div class="grid">${this._items.map((t) => this._renderItem(t))}</div>`}
      </section>
    `;
  }
};
D.styles = [
  L,
  fe,
  Ke,
  y`
      :host {
        display: block;
        overflow-y: auto;
        height: 100%;
        background: var(--mh-bg);
      }
      .root {
        max-width: 1024px;
        margin: 0 auto;
        padding: var(--mh-space-5);
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-4);
      }

      /* Sub-Tabs: segmented Tab-Bar im Material-Style, mit Icons */
      nav.tabs {
        display: flex;
        gap: 4px;
        background: var(--mh-surface-2);
        padding: 4px;
        border-radius: var(--mh-radius-md);
        overflow-x: auto;
        scrollbar-width: thin;
      }
      .tab {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 8px 14px;
        font: inherit;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg-muted);
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
        transition: background var(--mh-transition-fast),
          color var(--mh-transition-fast);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }
      .tab:hover {
        color: var(--mh-fg);
      }
      .tab:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: var(--mh-focus-offset);
      }
      .tab.active {
        background: var(--mh-surface);
        color: var(--mh-fg);
        font-weight: var(--mh-weight-semibold);
        box-shadow: var(--mh-shadow-1);
      }
      .tab-panel {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
      }
      @media (max-width: 720px) {
        .tab {
          padding: 8px 10px;
          font-size: var(--mh-text-xs);
        }
      }

      section {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: var(--mh-space-4);
        flex-wrap: wrap;
      }
      h2 {
        margin: 0;
        font-size: var(--mh-text-xl);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg);
        letter-spacing: -0.01em;
      }
      .hint {
        margin: 4px 0 0 0;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        line-height: 1.5;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--mh-space-3);
      }

      /* Webhook-Card */
      .webhook-card {
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-4);
        box-shadow: var(--mh-shadow-1);
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
        transition: opacity var(--mh-transition-fast);
      }
      .webhook-card.disabled {
        opacity: 0.6;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .card-actions {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .title {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      h4 {
        margin: 0;
        font-size: var(--mh-text-md);
        font-weight: var(--mh-weight-semibold);
      }
      .status-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
      }
      .status-dot.ok {
        background: var(--mh-success);
        box-shadow: 0 0 0 3px var(--mh-success-soft);
      }
      .status-dot.off {
        background: var(--mh-divider-strong);
      }
      .status-text {
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-medium);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .status-text.ok {
        color: var(--mh-success);
      }
      .status-text.off {
        color: var(--mh-fg-muted);
      }

      /* Meta-Pills */
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
      }
      .meta-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-pill);
        padding: 3px 10px;
        font-size: var(--mh-text-xs);
      }
      .meta-key {
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-medium);
      }
      .meta-pill code {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        background: transparent;
        color: var(--mh-fg);
        font-weight: var(--mh-weight-semibold);
      }

      /* URL-Zeile */
      .url-row {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
        background: var(--mh-bg);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        padding: 6px 10px;
      }
      code.url {
        flex: 1;
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        background: transparent;
        padding: 0;
      }

      /* Mapping-Details */
      .mapping {
        font-size: var(--mh-text-sm);
      }
      .mapping summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-medium);
        padding: 4px 0;
      }
      .mapping summary:hover {
        color: var(--mh-fg);
      }
      .mapping pre {
        margin: var(--mh-space-2) 0 0 0;
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-bg);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        overflow: auto;
        max-width: 100%;
        font-size: var(--mh-text-xs);
      }
      .mapping pre code {
        background: transparent;
        padding: 0;
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
      }

      /* Overflow-Menu */
      .overflow {
        position: relative;
      }
      .overflow-menu {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        z-index: 50;
        min-width: 180px;
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        padding: 4px;
      }
      .overflow-menu hr {
        border: none;
        border-top: 1px solid var(--mh-divider);
        margin: 4px 0;
      }
      .overflow-item {
        display: block;
        width: 100%;
        text-align: left;
        background: transparent;
        border: 0;
        padding: 8px 12px;
        border-radius: var(--mh-radius-sm);
        font: inherit;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
        cursor: pointer;
      }
      .overflow-item:hover:not(:disabled) {
        background: var(--mh-surface-2);
      }
      .overflow-item.danger {
        color: var(--mh-error);
      }
      .overflow-item.danger:hover:not(:disabled) {
        background: var(--mh-error-soft);
      }

      /* Empty / Placeholder */
      .empty {
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-6);
        text-align: center;
      }
      .empty h3 {
        margin: 0 0 var(--mh-space-2) 0;
        color: var(--mh-fg);
      }
      .empty p {
        margin: 0 0 var(--mh-space-4) 0;
        color: var(--mh-fg-muted);
        max-width: 460px;
        margin-inline: auto;
        line-height: 1.5;
      }
      .empty code {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        background: var(--mh-surface-2);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-xs);
      }
      .placeholder {
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-4);
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
      .placeholder p {
        margin: 0;
      }

      .status {
        color: var(--mh-fg-muted);
        padding: var(--mh-space-2) 0;
      }

      /* Toast */
      .toast {
        position: fixed;
        bottom: var(--mh-space-5);
        right: var(--mh-space-5);
        background: var(--mh-fg);
        color: var(--mh-bg);
        padding: var(--mh-space-3) var(--mh-space-4);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        font-size: var(--mh-text-sm);
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
    `
];
I([
  f({ attribute: !1 })
], D.prototype, "api", 2);
I([
  l()
], D.prototype, "_items", 2);
I([
  l()
], D.prototype, "_loading", 2);
I([
  l()
], D.prototype, "_showForm", 2);
I([
  l()
], D.prototype, "_editing", 2);
I([
  l()
], D.prototype, "_toast", 2);
I([
  l()
], D.prototype, "_menuOpenId", 2);
I([
  l()
], D.prototype, "_activeTab", 2);
D = I([
  $("settings-view")
], D);
var Us = Object.defineProperty, Rs = Object.getOwnPropertyDescriptor, Z = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Rs(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Us(e, s, r), r;
};
const mt = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
  debug: "Debug"
}, ut = {
  error: "var(--mh-error)",
  warning: "var(--mh-warning)",
  info: "var(--mh-info)",
  debug: "var(--mh-debug)"
}, gt = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], Ks = [1, 2, 3, 4, 5, 6, 0];
let N = class extends w {
  constructor() {
    super(...arguments), this._stats = null, this._sources = [], this._heatmap = [], this._topSources = [], this._loading = !1;
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    if (this.api) {
      this._loading = !0;
      try {
        const [t, e, s] = await Promise.all([
          this.api.getStats(),
          this.api.listSources(),
          this.api.getStatsExtended(30)
        ]);
        this._stats = t, this._sources = e, this._heatmap = s.heatmap, this._topSources = s.top_sources;
      } finally {
        this._loading = !1;
      }
    }
  }
  _renderHeatmap() {
    const t = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    let e = 0;
    for (const s of this._heatmap)
      s.weekday >= 0 && s.weekday < 7 && s.hour >= 0 && s.hour < 24 && (t[s.weekday][s.hour] = s.count, s.count > e && (e = s.count));
    return e === 0 ? i`<p class="muted">Keine Daten in den letzten 30 Tagen.</p>` : i`
      <div class="heatmap-wrap">
        <div class="heatmap">
          <div class="heatmap-header">
            <span></span>
            ${Array.from(
      { length: 24 },
      (s, a) => i`<span class="hour-label">${a % 3 === 0 ? a : ""}</span>`
    )}
          </div>
          ${Ks.map((s, a) => {
      const r = t[s];
      return i`
              <div class="heatmap-row">
                <span class="day-label">${gt[a]}</span>
                ${r.map((o, n) => {
        const d = o === 0 ? 0 : Math.max(0.15, o / e), c = o === 0 ? "transparent" : `color-mix(in srgb, var(--mh-accent) ${Math.round(
          d * 100
        )}%, transparent)`;
        return i`
                    <div
                      class=${`heatmap-cell ${o === 0 ? "empty" : ""}`}
                      style=${`background: ${c}`}
                      title=${`${gt[a]} ${n}:00 — ${o} Nachricht${o === 1 ? "" : "en"}`}
                    ></div>
                  `;
      })}
              </div>
            `;
    })}
        </div>
        <div class="heatmap-legend">
          <span class="muted small">weniger</span>
          <span class="legend-cell" style="background: transparent; border: 1px solid var(--mh-divider)"></span>
          <span class="legend-cell" style="background: color-mix(in srgb, var(--mh-accent) 25%, transparent)"></span>
          <span class="legend-cell" style="background: color-mix(in srgb, var(--mh-accent) 50%, transparent)"></span>
          <span class="legend-cell" style="background: color-mix(in srgb, var(--mh-accent) 75%, transparent)"></span>
          <span class="legend-cell" style="background: var(--mh-accent)"></span>
          <span class="muted small">mehr (max ${e})</span>
        </div>
      </div>
    `;
  }
  _renderSeverityStack() {
    if (!this._stats) return i``;
    const t = this._stats.severity_24h, e = Object.values(t).reduce((a, r) => a + r, 0), s = ["error", "warning", "info", "debug"];
    return e === 0 ? i`<p class="muted">Keine Nachrichten in den letzten 24 Stunden.</p>` : i`
      <div class="stack-bar" role="img" aria-label="Severity-Verteilung der letzten 24 Stunden">
        ${s.map((a) => {
      const r = t[a] ?? 0;
      if (r === 0) return null;
      const o = r / e * 100;
      return i`
            <div
              class=${`stack-seg sev-${a}`}
              style=${`width: ${o}%; background: ${ut[a]}`}
              title=${`${mt[a]}: ${r} (${o.toFixed(0)}%)`}
            ></div>
          `;
    })}
      </div>
      <ul class="legend">
        ${s.map((a) => {
      const r = t[a] ?? 0, o = e > 0 ? r / e * 100 : 0;
      return i`
            <li>
              <span class="legend-dot" style=${`background: ${ut[a]}`}></span>
              <span class="legend-label">${mt[a]}</span>
              <span class="legend-count">${r.toLocaleString("de-DE")}</span>
              <span class="legend-pct muted">${o.toFixed(0)}%</span>
            </li>
          `;
    })}
      </ul>
    `;
  }
  render() {
    if (this._loading && !this._stats)
      return i`<div class="root"><p class="status">lade…</p></div>`;
    if (!this._stats)
      return i`<div class="root"><p class="status">Keine Daten verfügbar.</p></div>`;
    const t = this._stats, e = Object.values(t.severity_24h).reduce((o, n) => o + n, 0), s = t.severity_24h.error ?? 0, a = t.severity_24h.warning ?? 0, r = e > 0 ? s / e * 100 : 0;
    return i`
      <div class="root">
        <section>
          <header class="section-head">
            <h2>Live-Status</h2>
            <button class="mh-btn-mini" @click=${() => void this._load()}>
              ↻ Aktualisieren
            </button>
          </header>
          <div class="kpis">
            <div class="kpi">
              <span class="kpi-label">Gesamt</span>
              <span class="kpi-value">${t.total.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">Nachrichten in der Datenbank</span>
            </div>
            <div class="kpi accent-info">
              <span class="kpi-label">Letzte 24 h</span>
              <span class="kpi-value">${e.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">alle Severities</span>
            </div>
            <div class="kpi accent-error">
              <span class="kpi-label">Errors 24 h</span>
              <span class="kpi-value">${s}</span>
              <span class="kpi-hint">
                ${e === 0 ? "—" : `${r.toFixed(1)} % Anteil`}
              </span>
            </div>
            <div class="kpi accent-warning">
              <span class="kpi-label">Warnings 24 h</span>
              <span class="kpi-value">${a}</span>
              <span class="kpi-hint">letzte 24 Stunden</span>
            </div>
          </div>
        </section>

        <section>
          <div class="mh-card">
            <div class="mh-card__header">
              <h3 class="mh-card__title">Severity-Verteilung (24 h)</h3>
              <span class="muted small">${e.toLocaleString("de-DE")} Nachrichten</span>
            </div>
            ${this._renderSeverityStack()}
          </div>
        </section>

        <section>
          <div class="mh-card">
            <div class="mh-card__header">
              <h3 class="mh-card__title">Aktive Quellen</h3>
              <span class="muted small">${this._sources.length}</span>
            </div>
            ${this._sources.length === 0 ? i`<p class="muted">
                  Noch keine Quellen erfasst. Sobald die erste Nachricht reinkommt,
                  erscheint sie hier.
                </p>` : i`<ul class="sources">
                  ${this._sources.map(
      (o) => i`<li class="source-pill">${o}</li>`
    )}
                </ul>`}
          </div>
        </section>

        <section>
          <div class="mh-card">
            <div class="mh-card__header">
              <h3 class="mh-card__title">Heatmap (Stunde × Wochentag, 30 Tage)</h3>
            </div>
            ${this._renderHeatmap()}
          </div>
        </section>

        <section>
          <div class="mh-card">
            <div class="mh-card__header">
              <h3 class="mh-card__title">Top-10 Quellen (30 Tage)</h3>
            </div>
            ${this._topSources.length === 0 ? i`<p class="muted">Keine Daten.</p>` : i`<ul class="top-sources">
                  ${this._topSources.map((o, n) => {
      var p;
      const d = ((p = this._topSources[0]) == null ? void 0 : p.count) ?? 1, c = o.count / d * 100;
      return i`<li>
                      <span class="rank">${n + 1}</span>
                      <code class="source-name">${o.source}</code>
                      <span class="bar-track">
                        <span class="bar-fill" style=${`width: ${c}%`}></span>
                      </span>
                      <span class="bar-count">${o.count.toLocaleString("de-DE")}</span>
                    </li>`;
    })}
                </ul>`}
          </div>
        </section>
      </div>
    `;
  }
};
N.styles = [
  L,
  Ke,
  be,
  y`
      :host { display: block; height: 100%; overflow-y: auto; background: var(--mh-bg); }
      .root {
        max-width: 1024px; margin: 0 auto;
        padding: var(--mh-space-5);
        display: flex; flex-direction: column; gap: var(--mh-space-5);
      }
      section { display: flex; flex-direction: column; gap: var(--mh-space-3); }
      .section-head { display: flex; justify-content: space-between; align-items: center; gap: var(--mh-space-3); }
      h2 { margin: 0; font-size: var(--mh-text-lg); font-weight: var(--mh-weight-semibold); color: var(--mh-fg); letter-spacing: -0.01em; }
      h3.mh-card__title { font-size: var(--mh-text-md); }
      .mh-btn-mini {
        font: inherit; font-size: var(--mh-text-xs); padding: 4px 10px;
        border: 1px solid var(--mh-divider); background: var(--mh-surface);
        color: var(--mh-fg-muted); border-radius: var(--mh-radius-sm); cursor: pointer;
        transition: background var(--mh-transition-fast);
      }
      .mh-btn-mini:hover { background: var(--mh-surface-2); color: var(--mh-fg); }
      .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--mh-space-3); }
      .kpi {
        background: var(--mh-surface); border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md); padding: var(--mh-space-4);
        display: flex; flex-direction: column; gap: 2px;
        position: relative; overflow: hidden; box-shadow: var(--mh-shadow-1);
      }
      .kpi::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--mh-divider); }
      .kpi.accent-info::before { background: var(--mh-info); }
      .kpi.accent-error::before { background: var(--mh-error); }
      .kpi.accent-warning::before { background: var(--mh-warning); }
      .kpi-label { font-size: var(--mh-text-xs); color: var(--mh-fg-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: var(--mh-weight-semibold); }
      .kpi-value { font-size: var(--mh-text-3xl); font-weight: var(--mh-weight-bold); color: var(--mh-fg); line-height: 1.1; margin: 4px 0; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
      .kpi-hint { font-size: var(--mh-text-xs); color: var(--mh-fg-muted); }
      .stack-bar { display: flex; height: 14px; border-radius: var(--mh-radius-pill); overflow: hidden; background: var(--mh-surface-2); }
      .stack-seg { height: 100%; transition: width var(--mh-transition-med); min-width: 2px; }
      .legend { list-style: none; padding: 0; margin: var(--mh-space-3) 0 0 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--mh-space-2) var(--mh-space-4); }
      .legend li { display: grid; grid-template-columns: 12px 1fr auto auto; gap: var(--mh-space-2); align-items: center; font-size: var(--mh-text-sm); }
      .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
      .legend-label { color: var(--mh-fg); }
      .legend-count { font-variant-numeric: tabular-nums; font-weight: var(--mh-weight-semibold); color: var(--mh-fg); }
      .legend-pct { font-size: var(--mh-text-xs); font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }
      .sources { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
      .source-pill { padding: 4px 10px; background: var(--mh-surface-2); border-radius: var(--mh-radius-sm); font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace); font-size: var(--mh-text-xs); color: var(--mh-fg-muted); font-weight: var(--mh-weight-medium); }
      .top-sources { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
      .top-sources li { display: grid; grid-template-columns: 24px 1fr 1fr auto; gap: var(--mh-space-3); align-items: center; font-size: var(--mh-text-sm); }
      .rank { font-variant-numeric: tabular-nums; font-weight: var(--mh-weight-semibold); color: var(--mh-fg-muted); font-size: var(--mh-text-xs); text-align: right; }
      .source-name { font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace); font-size: var(--mh-text-xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--mh-fg); }
      .bar-track { position: relative; height: 6px; background: var(--mh-surface-2); border-radius: var(--mh-radius-pill); overflow: hidden; }
      .bar-fill { position: absolute; inset: 0; background: var(--mh-accent); opacity: 0.7; border-radius: inherit; }
      .bar-count { font-variant-numeric: tabular-nums; font-weight: var(--mh-weight-semibold); color: var(--mh-fg); min-width: 40px; text-align: right; }
      .heatmap-wrap { display: flex; flex-direction: column; gap: var(--mh-space-3); }
      .heatmap { display: flex; flex-direction: column; gap: 3px; overflow-x: auto; }
      .heatmap-header, .heatmap-row { display: grid; grid-template-columns: 32px repeat(24, minmax(18px, 1fr)); gap: 3px; align-items: center; min-width: 600px; }
      .day-label, .hour-label { font-size: var(--mh-text-xs); color: var(--mh-fg-muted); text-align: center; font-weight: var(--mh-weight-medium); }
      .day-label { text-align: right; padding-right: 6px; }
      .heatmap-cell { aspect-ratio: 1; border-radius: 3px; min-height: 18px; transition: transform var(--mh-transition-fast); cursor: default; }
      .heatmap-cell.empty { border: 1px solid var(--mh-divider); }
      .heatmap-cell:hover { transform: scale(1.18); outline: 1px solid var(--mh-fg); }
      .heatmap-legend { display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
      .legend-cell { width: 14px; height: 14px; border-radius: 3px; }
      .muted { color: var(--mh-fg-muted); }
      .small { font-size: var(--mh-text-xs); }
      .status { color: var(--mh-fg-muted); padding: var(--mh-space-2) 0; margin: 0; }
    `
];
Z([
  f({ attribute: !1 })
], N.prototype, "api", 2);
Z([
  l()
], N.prototype, "_stats", 2);
Z([
  l()
], N.prototype, "_sources", 2);
Z([
  l()
], N.prototype, "_heatmap", 2);
Z([
  l()
], N.prototype, "_topSources", 2);
Z([
  l()
], N.prototype, "_loading", 2);
N = Z([
  $("stats-live-view")
], N);
var Gs = Object.defineProperty, Ws = Object.getOwnPropertyDescriptor, ze = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Ws(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Gs(e, s, r), r;
};
const ye = [
  "var(--mh-error)",
  "var(--mh-warning)",
  "var(--mh-info)",
  "var(--mh-accent)",
  "var(--mh-success)"
];
let ae = class extends w {
  constructor() {
    super(...arguments), this.items = [], this.width = 600, this.height = 120;
  }
  render() {
    if (this.items.length === 0)
      return i`<p class="muted">Keine Timeline-Daten.</p>`;
    const t = this._buildSeries(), e = this._allBuckets(), s = Math.max(1, ...this.items.map((p) => p.count)), a = { top: 8, right: 8, bottom: 18, left: 32 }, r = this.width - a.left - a.right, o = this.height - a.top - a.bottom, n = e.length === 1, d = (p) => n ? a.left + r / 2 : a.left + p / (e.length - 1) * r, c = (p) => a.top + (1 - p / s) * o;
    return i`
      <svg
        viewBox=${`0 0 ${this.width} ${this.height}`}
        role="img"
        aria-label="Telegrammrate Timeline"
        preserveAspectRatio="none"
      >
        <!-- Grid: horizontale Linien bei 0, max -->
        <line
          x1=${a.left} y1=${a.top}
          x2=${this.width - a.right} y2=${a.top}
          class="grid"
        ></line>
        <line
          x1=${a.left} y1=${this.height - a.bottom}
          x2=${this.width - a.right} y2=${this.height - a.bottom}
          class="grid"
        ></line>
        <!-- Y-Achse Labels -->
        <text x="2" y=${a.top + 4} class="axis-label">${s}</text>
        <text x="2" y=${this.height - a.bottom + 4} class="axis-label">0</text>

        <!-- Series -->
        ${t.map((p, b) => {
      const m = ye[b % ye.length];
      if (n) {
        const u = c(p.values[0] ?? 0);
        return i`<g class="series">
              <line
                x1=${a.left} y1=${u}
                x2=${this.width - a.right} y2=${u}
                stroke=${m}
                stroke-width="1.5"
              ></line>
              <circle cx=${d(0)} cy=${u} r="2.5" fill=${m}>
                <title>${p.ga}: ${p.values[0]}</title>
              </circle>
            </g>`;
      }
      const v = p.values.map((u, g) => `${d(g)},${c(u)}`).join(" ");
      return i`<g class="series">
            <polyline
              points=${v}
              fill="none"
              stroke=${m}
              stroke-width="1.5"
            ><title>${p.ga}</title></polyline>
            ${p.values.map(
        (u, g) => i`<circle cx=${d(g)} cy=${c(u)} r="1.8" fill=${m}>
                <title>${p.ga}: ${u}</title>
              </circle>`
      )}
          </g>`;
    })}
      </svg>
      <div class="legend">
        ${t.map(
      (p, b) => i`<span class="legend-item">
            <span
              class="dot"
              style=${`background: ${ye[b % ye.length]}`}
            ></span>
            <code>${p.ga}</code>
          </span>`
    )}
      </div>
    `;
  }
  _allBuckets() {
    const t = /* @__PURE__ */ new Set();
    for (const e of this.items) t.add(e.bucket);
    return Array.from(t).sort();
  }
  _buildSeries() {
    const t = this._allBuckets(), e = new Map(t.map((a, r) => [a, r])), s = /* @__PURE__ */ new Map();
    for (const a of this.items) {
      let r = s.get(a.ga);
      r === void 0 && (r = new Array(t.length).fill(0), s.set(a.ga, r));
      const o = e.get(a.bucket);
      o !== void 0 && (r[o] = a.count);
    }
    return Array.from(s.entries()).map(([a, r]) => ({ ga: a, values: r }));
  }
};
ae.styles = [
  L,
  y`
      :host {
        display: block;
      }
      svg {
        width: 100%;
        height: auto;
        max-height: 160px;
        background: var(--mh-bg);
        border-radius: var(--mh-radius-sm);
      }
      .grid {
        stroke: var(--mh-divider);
        stroke-width: 0.5;
      }
      .axis-label {
        font-size: 10px;
        fill: var(--mh-fg-muted);
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
        margin-top: var(--mh-space-2);
        font-size: var(--mh-text-xs);
      }
      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        color: var(--mh-fg-muted);
      }
      .muted {
        margin: 0;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
    `
];
ze([
  f({ attribute: !1 })
], ae.prototype, "items", 2);
ze([
  f({ type: Number })
], ae.prototype, "width", 2);
ze([
  f({ type: Number })
], ae.prototype, "height", 2);
ae = ze([
  $("knx-timeline-chart")
], ae);
var Vs = Object.defineProperty, qs = Object.getOwnPropertyDescriptor, De = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? qs(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Vs(e, s, r), r;
};
function Js(t) {
  if (typeof t == "number" && Number.isFinite(t)) return t;
  if (typeof t == "boolean") return t ? 1 : 0;
  if (typeof t == "string") {
    const e = t.trim().toLowerCase();
    if (e === "true" || e === "on") return 1;
    if (e === "false" || e === "off") return 0;
    const s = parseFloat(e);
    if (Number.isFinite(s)) return s;
  }
  return null;
}
let re = class extends w {
  constructor() {
    super(...arguments), this.points = [], this.width = 600, this.height = 80;
  }
  render() {
    const t = this.points.map((g) => ({ ts: g.ts, value: Js(g.value) })).filter((g) => g.value !== null);
    if (t.length < 2)
      return i`<p class="muted">
        Wertverlauf: zu wenige numerische Datenpunkte
        (${t.length} von ${this.points.length}).
      </p>`;
    const e = t.map((g) => g.value), s = Math.min(...e), a = Math.max(...e), r = a - s || 1, o = { top: 8, right: 8, bottom: 18, left: 40 }, n = this.width - o.left - o.right, d = this.height - o.top - o.bottom, c = (g) => o.left + g / Math.max(1, t.length - 1) * n, p = (g) => o.top + (1 - (g - s) / r) * d, b = t.map((g, T) => `${c(T)},${p(g.value)}`).join(" "), v = [...e.slice(1).map((g, T) => Math.abs(g - e[T]))].sort((g, T) => g - T), u = v[Math.floor(v.length / 2)];
    return i`
      <div class="wrap">
        <svg
          viewBox=${`0 0 ${this.width} ${this.height}`}
          role="img"
          aria-label="Wertverlauf-Sparkline"
          preserveAspectRatio="none"
        >
          <line
            x1=${o.left} y1=${o.top}
            x2=${this.width - o.right} y2=${o.top}
            class="grid"
          ></line>
          <line
            x1=${o.left} y1=${this.height - o.bottom}
            x2=${this.width - o.right} y2=${this.height - o.bottom}
            class="grid"
          ></line>
          <text x="2" y=${o.top + 4} class="axis-label">${a.toFixed(1)}</text>
          <text x="2" y=${this.height - o.bottom + 4} class="axis-label">${s.toFixed(1)}</text>
          <polyline points=${b} class="series" fill="none"></polyline>
        </svg>
        <p class="muted small">
          ${t.length} Punkte • Min ${s.toFixed(1)} • Max ${a.toFixed(1)} •
          Median Δ ${u.toFixed(2)}
          ${u < 0.1 && r > 0 ? i` <span class="hint">→ enge Hysterese</span>` : Ys}
        </p>
      </div>
    `;
  }
};
re.styles = [
  L,
  y`
      :host {
        display: block;
      }
      svg {
        width: 100%;
        height: auto;
        max-height: 100px;
        background: var(--mh-bg);
        border-radius: var(--mh-radius-sm);
      }
      .grid {
        stroke: var(--mh-divider);
        stroke-width: 0.5;
      }
      .axis-label {
        font-size: 10px;
        fill: var(--mh-fg-muted);
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
      }
      .series {
        stroke: var(--mh-accent);
        stroke-width: 1.5;
      }
      .muted {
        margin: 4px 0 0 0;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-xs);
      }
      .small {
        font-size: var(--mh-text-xs);
      }
      .hint {
        color: var(--mh-warning);
        font-weight: var(--mh-weight-semibold);
      }
    `
];
De([
  f({ attribute: !1 })
], re.prototype, "points", 2);
De([
  f({ type: Number })
], re.prototype, "width", 2);
De([
  f({ type: Number })
], re.prototype, "height", 2);
re = De([
  $("knx-value-sparkline")
], re);
const Ys = "";
var Qs = Object.defineProperty, Zs = Object.getOwnPropertyDescriptor, x = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Zs(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Qs(e, s, r), r;
};
const Lt = "messagehub.knx-stats.filters", Be = [
  { id: "1h", label: "1 Std", days: 1 / 24 },
  { id: "6h", label: "6 Std", days: 0.25 },
  { id: "24h", label: "24 Std", days: 1 },
  { id: "48h", label: "48 Std", days: 2 },
  { id: "7d", label: "7 Tage", days: 7 },
  { id: "30d", label: "30 Tage", days: 30 },
  { id: "365d", label: "365 Tage", days: 365 }
], Xs = /* @__PURE__ */ new Set(["7d", "30d", "365d"]), ea = [10, 25, 50, 100], vt = {
  periodId: "24h",
  topN: 50,
  topNDevices: 25,
  minRate: 1,
  includeAck: !0
};
function ta() {
  try {
    const t = localStorage.getItem(Lt);
    if (t) {
      const e = JSON.parse(t);
      return { ...vt, ...e };
    }
  } catch {
  }
  return { ...vt };
}
function de(t) {
  try {
    localStorage.setItem(Lt, JSON.stringify(t));
  } catch {
  }
}
function ft(t) {
  const e = Be.find((r) => r.id === t) ?? Be[2], s = /* @__PURE__ */ new Date();
  return { from: new Date(s.getTime() - e.days * 864e5).toISOString(), to: s.toISOString() };
}
const sa = 48;
function aa() {
  const t = /* @__PURE__ */ new Date();
  return { from: new Date(t.getTime() - sa * 3600 * 1e3).toISOString(), to: t.toISOString() };
}
let _ = class extends w {
  constructor() {
    super(...arguments), this._filters = ta(), this._summary = null, this._busHealth = null, this._busload = null, this._health = null, this._longTerm = null, this._bursts = null, this._sensitiveLog = null, this._busAnalysisEnabled = !0, this._busAnalysisLoaded = !1, this._apiErrors = /* @__PURE__ */ new Map(), this._apiErrorsDismissed = !1, this._silence = null, this._orphans = null, this._alarms = null, this._top = [], this._topBySource = [], this._timeline = null, this._selectedGa = null, this._detail = null, this._detailLoading = !1, this._loading = !1, this._error = "", this._toast = "";
  }
  async firstUpdated() {
    await Promise.all([this._loadBusAnalysisState(), this._load()]);
  }
  async _loadBusAnalysisState() {
    if (this.api)
      try {
        const t = await this.api.getKnxBusAnalysisState();
        this._busAnalysisEnabled = t.enabled;
      } catch {
      } finally {
        this._busAnalysisLoaded = !0;
      }
  }
  // Iter 51: zeigt einen warnenden Banner ueber gefailte Endpunkte +
  // Hinweise zu typischen Ursachen. Banner ist dismissable (per Klick),
  // aber kommt beim naechsten _load() wieder, falls die Endpoints noch
  // immer failen. So bleibt der User nicht im Dunkeln, kann aber kurz
  // wegklicken um die anderen Cards sauber zu sehen.
  _renderApiErrorBanner() {
    const t = Array.from(this._apiErrors.keys()).sort(), e = {
      "health-score": "Bus-Health-Score",
      busload: "Buslast-KPI",
      "long-term": "Long-Term-Sicht",
      bursts: "Burst-Detector",
      "sensitive-log": "Sicherheits-Audit",
      orphans: "Verwaiste GAs",
      alarms: "Alarme"
    }, s = t.map((a) => e[a] || a).join(", ");
    return i`
      <div class="api-error-banner" role="alert">
        <div class="api-error-banner__head">
          <strong>Folgende Statistik-Bereiche sind nicht erreichbar:</strong>
          <button
            class="api-error-banner__dismiss"
            @click=${() => this._apiErrorsDismissed = !0}
            title="Banner schliessen"
            aria-label="Banner schliessen"
          >×</button>
        </div>
        <p class="api-error-banner__list">${s}</p>
        <details class="api-error-banner__details">
          <summary>Moegliche Ursachen + Diagnose</summary>
          <ul>
            <li>HACS-Update wurde noch nicht installiert (Backend kennt die neuen Endpunkte nicht).</li>
            <li>Home-Assistant wurde nach dem Update nicht neu gestartet.</li>
            <li>Browser-Cache haelt das alte Bundle vor — harter Reload (Strg+Shift+R) probieren.</li>
            <li>Der HA-User hat keine Admin-Rechte (alle KNX-Stats-Endpoints sind Admin-only).</li>
          </ul>
          <p class="muted small">Original-Fehlermeldungen:</p>
          <ul class="api-error-banner__raw">
            ${Array.from(this._apiErrors.entries()).map(
      ([a, r]) => i`<li><code>${a}</code>: ${r}</li>`
    )}
          </ul>
        </details>
      </div>
    `;
  }
  async _toggleBusAnalysis() {
    if (!this.api) return;
    const t = !this._busAnalysisEnabled;
    if (!(!t && !window.confirm(
      `Bus-Analyse deaktivieren?

Solange aus, schreibt das Plugin keine neuen Telegramme mehr in die Raw- oder Counter-Tabelle. Bestehende Daten bleiben sichtbar, altern aber nach 48 h (Raw) bzw. 365 Tagen (Counter).`
    )))
      try {
        const e = await this.api.setKnxBusAnalysisState(t);
        this._busAnalysisEnabled = e.enabled;
      } catch (e) {
        window.alert(`Fehler: ${e.message}`);
      }
  }
  _apiFilters() {
    const { from: t, to: e } = ft(this._filters.periodId);
    return {
      from: t,
      to: e,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck
    };
  }
  _isLongTermMode() {
    return Xs.has(this._filters.periodId);
  }
  // Im Long-Term-Modus laufen die Raw-Endpunkte auf die letzten 48h —
  // alles dahinter liegt in der Counter-Tabelle und wird ueber den
  // Long-Term-Endpoint geliefert.
  _liveFiltersForRaw() {
    if (!this._isLongTermMode()) return this._apiFilters();
    const { from: t, to: e } = aa();
    return {
      from: t,
      to: e,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck
    };
  }
  async _load() {
    if (!this.api) return;
    this._loading = !0, this._error = "";
    const t = /* @__PURE__ */ new Map(), e = (s, a) => a.catch((r) => (t.set(s, r.message), null));
    try {
      const s = this._isLongTermMode(), a = this._apiFilters(), r = this._liveFiltersForRaw(), o = { ...r, limit: this._filters.topNDevices }, [
        n,
        d,
        c,
        p,
        b,
        m,
        v,
        u,
        g,
        T,
        oe,
        we
      ] = await Promise.all([
        this.api.getKnxStatsSummary(r),
        this.api.getKnxStatsTop(r),
        this.api.getKnxStatsTopBySource(o),
        this.api.getKnxStatsBusHealth(r),
        this.api.getKnxStatsSilence({
          ...r,
          maxSilenceMinutes: this._suggestSilenceMinutes()
        }),
        e("orphans", this.api.getKnxStatsOrphans(r)),
        e("alarms", this.api.getKnxStatsAlarms(r)),
        e(
          "busload",
          this.api.getKnxStatsBusload(r, this._suggestBusloadBucketSeconds())
        ),
        e("health-score", this.api.getKnxStatsHealthScore(r)),
        s ? e("long-term", this.api.getKnxStatsLongTerm(a)) : Promise.resolve(null),
        e("bursts", this.api.getKnxStatsBursts(r)),
        e("sensitive-log", this.api.getKnxStatsSensitiveLog(r))
      ]);
      this._summary = n, this._top = d.items, this._topBySource = c.items, this._busHealth = p, this._silence = b, this._orphans = m, this._alarms = v, this._busload = u, this._health = g, this._longTerm = T, this._bursts = oe, this._sensitiveLog = we, this._apiErrors = t, this._apiErrorsDismissed = !1;
      const qe = d.items.slice(0, 5).map((Ot) => Ot.ga);
      qe.length > 0 ? this._timeline = await this.api.getKnxStatsTimeline({
        ...r,
        gas: qe,
        bucketMinutes: this._suggestBucketMinutes()
      }) : this._timeline = null;
    } catch (s) {
      this._error = s.message, this._summary = null, this._top = [], this._topBySource = [], this._timeline = null, this._busHealth = null, this._silence = null, this._orphans = null, this._alarms = null, this._busload = null, this._health = null, this._longTerm = null, this._bursts = null, this._sensitiveLog = null;
    } finally {
      this._loading = !1;
    }
  }
  _suggestBucketMinutes() {
    switch (this._filters.periodId) {
      case "1h":
        return 1;
      case "6h":
        return 5;
      case "24h":
        return 10;
      case "48h":
      default:
        return 30;
    }
  }
  // Iter 36 (Feature A): pro Periode passende Bucket-Groesse fuer Buslast-%
  // damit das Frontend bei laengeren Perioden nicht 17280 Buckets bekommt.
  // 1h -> 10s (ETS-Standard, 360 Punkte)
  // 6h -> 60s (360 Punkte)
  // 24h -> 5min (288 Punkte)
  // 48h -> 10min (288 Punkte)
  _suggestBusloadBucketSeconds() {
    switch (this._filters.periodId) {
      case "1h":
        return 10;
      case "6h":
        return 60;
      case "24h":
        return 300;
      case "48h":
      default:
        return 600;
    }
  }
  _suggestSilenceMinutes() {
    switch (this._filters.periodId) {
      case "1h":
        return 30;
      case "6h":
        return 120;
      case "24h":
        return 360;
      case "48h":
      default:
        return 720;
    }
  }
  async _loadDetail(t) {
    if (this.api) {
      this._detailLoading = !0, this._detail = null;
      try {
        const e = this._apiFilters();
        this._detail = await this.api.getKnxStatsGaDetail(t, e);
      } catch (e) {
        this._showToast(`Detail laden fehlgeschlagen: ${e.message}`);
      } finally {
        this._detailLoading = !1;
      }
    }
  }
  async _onSelectGa(t) {
    if (this._selectedGa === t) {
      this._selectedGa = null, this._detail = null;
      return;
    }
    this._selectedGa = t, await this._loadDetail(t);
  }
  async _ackGa(t) {
    if (!this.api) return;
    const e = window.prompt(
      `Notiz fuer ${t} (optional, leer = keine Notiz):`,
      ""
    );
    if (e !== null)
      try {
        await this.api.acknowledgeKnxGa(t, { note: e || void 0 }), this._showToast(`${t} als bekannt markiert`), await this._load();
      } catch (s) {
        this._showToast(`Fehlgeschlagen: ${s.message}`);
      }
  }
  async _unackGa(t) {
    if (this.api)
      try {
        await this.api.unacknowledgeKnxGa(t), this._showToast(`${t}: Acknowledge entfernt`), await this._load();
      } catch (e) {
        this._showToast(`Fehlgeschlagen: ${e.message}`);
      }
  }
  _showToast(t) {
    this._toast = t, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  _onPeriod(t) {
    this._filters = { ...this._filters, periodId: t }, de(this._filters), this._load();
  }
  _onTopN(t) {
    this._filters = { ...this._filters, topN: t }, de(this._filters), this._load();
  }
  _onTopNDevices(t) {
    this._filters = { ...this._filters, topNDevices: t }, de(this._filters), this._load();
  }
  _renderInlineTopN(t, e) {
    return i`
      <span class="inline-topn" role="group" aria-label="Anzahl Eintraege">
        ${ea.map(
      (s) => i`<button
            class=${`inline-topn__btn ${t === s ? "active" : ""}`}
            @click=${() => e(s)}
          >
            ${s}
          </button>`
    )}
      </span>
    `;
  }
  _onMinRate(t) {
    this._filters = { ...this._filters, minRate: Math.max(0, t) }, de(this._filters), this._load();
  }
  _onAckToggle() {
    this._filters = { ...this._filters, includeAck: !this._filters.includeAck }, de(this._filters), this._load();
  }
  _renderFilterBar() {
    return i`
      <div class="filters" role="toolbar" aria-label="KNX-Stats-Filter">
        <div class="filter-group">
          <span class="filter-label">Zeitraum</span>
          <div class="seg">
            ${Be.map(
      (t) => i`<button
                class=${`seg-btn ${this._filters.periodId === t.id ? "active" : ""}`}
                @click=${() => this._onPeriod(t.id)}
              >
                ${t.label}
              </button>`
    )}
          </div>
        </div>

        <label class="filter-group">
          <span class="filter-label">Min. Tel/Min</span>
          <input
            type="number"
            min="0"
            step="0.5"
            class="mh-input narrow"
            .value=${String(this._filters.minRate)}
            @change=${(t) => this._onMinRate(parseFloat(t.target.value) || 0)}
          />
        </label>

        <label class="filter-group toggle">
          <input
            type="checkbox"
            ?checked=${!this._filters.includeAck}
            @change=${this._onAckToggle}
          />
          <span>Bekannte ausblenden</span>
        </label>

        <label class="filter-group toggle">
          <input
            type="checkbox"
            ?checked=${this._busAnalysisEnabled}
            ?disabled=${!this._busAnalysisLoaded}
            @change=${() => void this._toggleBusAnalysis()}
          />
          <span title="Schaltet die bus-weite Erfassung der Telegramme">Bus-Analyse aktiv</span>
        </label>

        <button
          class="mh-btn mh-btn--sm"
          @click=${() => void this._load()}
          ?disabled=${this._loading}
        >
          ${this._loading ? "lade…" : "↻ Aktualisieren"}
        </button>
      </div>
    `;
  }
  _renderKpis() {
    const t = this._summary;
    if (t === null)
      return i`<p class="muted">Keine Daten verfuegbar.</p>`;
    const e = t.counts_by_severity, s = this._busload, a = s !== null ? s.summary.max_pct : t.estimated_busload_pct, r = a >= 30 ? "danger" : a >= 20 ? "warning" : a >= 10 ? "elevated" : "ok", o = (n) => n.toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    return i`
      <div class="kpis">
        <div class="kpi">
          <span class="kpi-label">Telegramme</span>
          <span class="kpi-value">${t.total_telegrams.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">im Zeitraum</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Aktive GAs</span>
          <span class="kpi-value">${t.active_gas.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">im Protokoll</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Aktive Geraete</span>
          <span class="kpi-value">${t.active_devices.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">Source-Adressen</span>
        </div>
        <div class=${`kpi busload busload--${r}`}>
          <span class="kpi-label">Buslast</span>
          ${s === null ? i`<span class="kpi-value">${o(t.estimated_busload_pct)} %</span>
                <span class="kpi-hint">Ø ueber Zeitraum</span>` : i`<span class="kpi-value">${o(s.summary.max_pct)} %</span>
                <span class="kpi-hint">
                  jetzt ${o(s.summary.current_pct)} % · Ø ${o(s.summary.avg_pct)} %
                  · Bucket ${this._formatBucket(s.bucket_seconds)}
                </span>`}
        </div>
      </div>
      <div class="severity-counts">
        ${["red", "orange", "yellow", "green"].map(
      (n) => i`<span class=${`mh-pill mh-pill--${n === "red" ? "error" : n === "orange" ? "warning" : n === "yellow" ? "info" : "neutral"}`}>
            <span class="mh-pill__dot"></span>
            ${this._severityLabel(n)}: ${e[n] ?? 0}
          </span>`
    )}
      </div>
    `;
  }
  _renderHealthScore() {
    const t = this._health;
    return i`
      <section class=${`mh-card health-score health-score--${t.severity}`}>
        <header class="card-head">
          <h3>Bus-Health-Score</h3>
          <span class="muted small">aggregiert aus 4 KPIs · letzte ${this._filters.periodId}</span>
        </header>
        <div class="health-score__body">
          <div class="health-score__big">
            <span class="health-score__value">${t.score}</span>
            <span class="health-score__unit">/ 100</span>
            <span class="health-score__label">${this._healthLabel(t.severity)}</span>
          </div>
          <div class="health-score__components">
            ${["repeat", "busload", "silence", "alarms"].map(
      (e) => i`<div class="health-score__component">
                <span class="health-score__component-label">${this._componentLabel(e)}</span>
                <div class="health-score__bar">
                  <div
                    class="health-score__bar-fill"
                    style=${`width: ${t.components[e]}%`}
                  ></div>
                </div>
                <span class="health-score__component-value">${t.components[e]}</span>
              </div>`
    )}
          </div>
          ${t.findings.length > 0 ? i`<ul class="health-score__findings">
                ${t.findings.map(
      (e) => i`<li class=${`health-finding health-finding--${e.severity}`}>
                    <span class="health-finding__dot"></span>
                    <span>${e.message}</span>
                  </li>`
    )}
              </ul>` : i`<p class="muted small">Alle Indikatoren im gruenen Bereich.</p>`}
        </div>
      </section>
    `;
  }
  _healthLabel(t) {
    switch (t) {
      case "green":
        return "gesund";
      case "yellow":
        return "leicht erhoeht";
      case "orange":
        return "auffaellig";
      case "red":
        return "kritisch";
    }
  }
  _componentLabel(t) {
    switch (t) {
      case "repeat":
        return "Wiederholungen";
      case "busload":
        return "Buslast-Spitze";
      case "silence":
        return "stumme Geraete";
      case "alarms":
        return "offene Alarme";
    }
  }
  // Iter 42: Sicherheits-Audit-Card ---------------------------------------
  _renderSensitiveLog() {
    const t = this._sensitiveLog, e = (s) => this._formatTs(s);
    return i`
      <section class="mh-card sensitive">
        <header class="card-head">
          <h3>Sicherheits-Audit</h3>
          <span class="muted small">
            ${t.addresses.length} markierte GAs · ${t.telegrams.length} Telegramme im Zeitraum
          </span>
        </header>
        <div class="sensitive__addresses">
          <h4>Sensitive GAs</h4>
          <ul class="sensitive__addr-list">
            ${t.addresses.map(
      (s) => i`<li>
                <code>${s.ga}</code>
                ${s.label ? i`<span class="muted small">${s.label}</span>` : h}
                ${s.dpt ? i`<span class="mh-pill mh-pill--neutral">${s.dpt}</span>` : h}
              </li>`
    )}
          </ul>
        </div>
        <div class="sensitive__telegrams">
          <h4>Letzte Telegramme</h4>
          ${t.telegrams.length === 0 ? i`<p class="muted small">Keine Aktivitaet im Zeitraum.</p>` : i`<div class="table-wrap">
                <table class="sensitive__table">
                  <thead>
                    <tr>
                      <th>Zeit</th>
                      <th>GA</th>
                      <th>Geraet</th>
                      <th>Wert</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${t.telegrams.slice(0, 50).map(
      (s) => i`<tr>
                        <td class="bursts__ts">${e(s.ts)}</td>
                        <td>
                          <code>${s.ga}</code>
                          ${s.label ? i`<span class="muted small">${s.label}</span>` : h}
                        </td>
                        <td><code>${s.dev_source}</code></td>
                        <td><code>${s.value ?? "—"}</code></td>
                      </tr>`
    )}
                  </tbody>
                </table>
              </div>
              ${t.telegrams.length > 50 ? i`<p class="muted small">… und ${t.telegrams.length - 50} weitere</p>` : h}`}
        </div>
      </section>
    `;
  }
  // Iter 41: Burst-Detector-Card -----------------------------------------
  _renderBursts() {
    const t = this._bursts, e = (a) => a.toLocaleString("de-DE"), s = (a) => a.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return i`
      <section class="mh-card bursts">
        <header class="card-head">
          <h3>Telegrammfluten (Bursts)</h3>
          <span class="muted small">
            ${t.bursts.length} Spitzen ueber ${s(t.threshold_pct)} % Buslast
            (${t.window_seconds}s-Fenster)
          </span>
        </header>
        <div class="bursts__intro">
          <p class="muted small">
            Kurze Spitzen, die im Period-Avg untergehen — typisch fuer
            Sturm-Automatik, gleichzeitige Rolladen-Befehle oder Szene-Trigger.
            Spalte „GAs" zeigt die Anzahl unterschiedlicher Gruppenadressen,
            „Geraete" die Anzahl unterschiedlicher Source-Adressen.
          </p>
        </div>
        <div class="table-wrap">
          <table class="bursts__table">
            <thead>
              <tr>
                <th>Zeit</th>
                <th class="num">Tel</th>
                <th class="num">Buslast</th>
                <th class="num">GAs</th>
                <th class="num">Geraete</th>
              </tr>
            </thead>
            <tbody>
              ${t.bursts.slice(0, 20).map(
      (a) => i`<tr>
                  <td class="bursts__ts">${this._formatTs(a.bucket)}</td>
                  <td class="num">${e(a.telegrams)}</td>
                  <td class="num bursts__pct">${s(a.busload_pct)} %</td>
                  <td class="num">${a.ga_count}</td>
                  <td class="num">${a.source_count}</td>
                </tr>`
    )}
            </tbody>
          </table>
        </div>
        ${t.bursts.length > 20 ? i`<p class="muted small">… und ${t.bursts.length - 20} weitere</p>` : h}
      </section>
    `;
  }
  // Iter 39: Long-Term-Modus-Hinweis + Counter-Karte ----------------------
  _renderLongTermBanner() {
    return i`
      <div class="long-term-banner">
        <span class="long-term-banner__icon">⏳</span>
        <div>
          <strong>Long-Term-Modus aktiv</strong>
          <p class="muted small">
            Periode ueber 48 Std — die Counter-Tabelle liefert Telegramm-Counts pro
            Stunde/Tag, aber keine Source-Adressen, keine Werte und keine Repeats.
            Live-KPIs darunter zeigen die letzten 48 Std aus den Roh-Telegrammen.
          </p>
        </div>
      </div>
    `;
  }
  _renderLongTerm() {
    const t = this._longTerm, e = Math.max(1, ...t.series.map((a) => a.count)), s = (a) => a.toLocaleString("de-DE");
    return i`
      <section class="mh-card long-term">
        <header class="card-head">
          <h3>Long-Term-Sicht</h3>
          <span class="muted small">
            ${s(t.total)} Telegramme · ${t.bucket === "day" ? "Tages-Buckets" : "Stunden-Buckets"}
          </span>
        </header>
        <div class="long-term__body">
          <div class="long-term__chart">
            ${t.series.length === 0 ? i`<p class="muted">Keine Daten in der Counter-Tabelle.</p>` : i`<div class="long-term__bars">
                  ${t.series.map(
      (a) => i`<div
                      class="long-term__bar"
                      style=${`height: ${a.count / e * 100}%`}
                      title="${a.bucket} — ${s(a.count)}"
                    ></div>`
    )}
                </div>`}
          </div>
          <div class="long-term__top">
            <h4>Top-GAs in der Periode</h4>
            ${t.top_gas.length === 0 ? i`<p class="muted small">Keine GAs aktiv.</p>` : i`<ol class="long-term__top-list">
                  ${t.top_gas.slice(0, 10).map(
      (a) => i`<li>
                      <code>${a.ga}</code>
                      ${a.label ? i`<span class="muted small">${a.label}</span>` : h}
                      <span class="long-term__top-count">${s(a.count)}</span>
                    </li>`
    )}
                </ol>`}
          </div>
        </div>
      </section>
    `;
  }
  _formatBucket(t) {
    return t < 60 ? `${t}s` : t < 3600 ? `${Math.round(t / 60)}min` : `${Math.round(t / 3600)}h`;
  }
  _severityLabel(t) {
    switch (t) {
      case "green":
        return "OK";
      case "yellow":
        return "leicht erhoeht";
      case "orange":
        return "auffaellig";
      case "red":
        return "kritisch";
    }
  }
  render() {
    return i`
      <div class="root">
        <div class="info-banner">
          <strong>Bus-weite Auswertung:</strong>
          alle Telegramme aus dem Gruppenmonitor werden 48 h vorgehalten —
          unabhaengig davon, ob die GA in der Whitelist (Einstellungen →
          KNX-Adressen) als „Loggen aktiv" markiert ist. Whitelisted GAs
          landen zusaetzlich im Logbuch (Tab „Nachrichten").
        </div>
        ${this._renderFilterBar()}
        ${this._apiErrors.size > 0 && !this._apiErrorsDismissed ? this._renderApiErrorBanner() : h}
        ${this._busAnalysisLoaded && !this._busAnalysisEnabled ? i`<div class="bus-analysis-banner">
              <strong>Bus-Analyse ist aus.</strong>
              Es werden keine neuen Telegramme erfasst — bestehende Daten bleiben
              sichtbar, altern aber raus (Raw 48 h, Counter 365 Tage). Toggle in
              der Filter-Leiste oben rechts schaltet sie wieder ein.
            </div>` : h}
        ${this._error ? i`<div class="error">${this._error}</div>` : h}
        ${this._alarms !== null && this._alarms.triggered_count > 0 ? this._renderAlarmBanner() : h}

        ${this._isLongTermMode() ? this._renderLongTermBanner() : h}
        ${this._health !== null ? this._renderHealthScore() : h}
        ${this._longTerm !== null ? this._renderLongTerm() : h}
        ${this._bursts !== null && this._bursts.bursts.length > 0 ? this._renderBursts() : h}
        ${this._sensitiveLog !== null && this._sensitiveLog.addresses.length > 0 ? this._renderSensitiveLog() : h}

        <section class="mh-card kpi-card">
          <header class="card-head">
            <h3>${this._isLongTermMode() ? "Live-Snapshot (letzte 48 Std)" : "Uebersicht"}</h3>
            <span class="muted small">letzte ${this._filters.periodId}</span>
          </header>
          ${this._loading && this._summary === null ? i`<p class="muted">lade…</p>` : this._renderKpis()}
        </section>

        ${this._busHealth !== null && this._busHealth.summary.total > 0 ? this._renderBusHealth() : h}
        ${this._silence !== null && this._silence.alarm_count > 0 ? this._renderSilenceAlarms() : h}
        ${this._orphans !== null && (this._orphans.missing_in_log.length > 0 || this._orphans.extra_in_log.length > 0) ? this._renderOrphans() : h}

        <section class="mh-card">
          <header class="card-head">
            <h3>Top-Sender (Gruppenadressen)</h3>
            <div class="card-head__meta">
              ${this._renderInlineTopN(this._filters.topN, (t) => this._onTopN(t))}
              <span class="muted small">${this._top.length} sichtbar</span>
            </div>
          </header>
          ${this._renderTopTable()}
        </section>

        ${this._topBySource.length > 0 ? i`<section class="mh-card">
              <header class="card-head">
                <h3>Top-Geraete (Source-Adressen)</h3>
                <div class="card-head__meta">
                  ${this._renderInlineTopN(
      this._filters.topNDevices,
      (t) => this._onTopNDevices(t)
    )}
                  <span class="muted small">
                    Welches physische Geraet erzeugt am meisten Last?
                  </span>
                </div>
              </header>
              ${this._renderTopBySource()}
            </section>` : h}

        ${this._timeline !== null && this._timeline.items.length > 0 ? i`<section class="mh-card">
              <header class="card-head">
                <h3>Tagesverlauf (Top-5, ${this._timeline.bucket_minutes}-Min-Buckets)</h3>
              </header>
              <knx-timeline-chart
                .items=${this._timeline.items}
                .width=${800}
                .height=${140}
              ></knx-timeline-chart>
            </section>` : h}

        ${this._detail !== null || this._detailLoading ? this._renderDetailPane() : h}
        ${this._toast ? i`<div class="toast">${this._toast}</div>` : h}
      </div>
    `;
  }
  _renderTopTable() {
    return this._loading && this._top.length === 0 ? i`<p class="muted">lade…</p>` : this._top.length === 0 ? i`<p class="muted">Keine Telegramme in diesem Zeitraum.</p>` : i`
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>GA</th>
              <th>Label</th>
              <th>DPT</th>
              <th class="num">Tel/Min</th>
              <th class="num">Soll</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${this._top.map(
      (t, e) => i`<tr
                class=${`row-${t.severity} ${t.acknowledged ? "ack" : ""} ${this._selectedGa === t.ga ? "selected" : ""}`}
                @click=${() => void this._onSelectGa(t.ga)}
              >
                <td class="num muted">${e + 1}</td>
                <td><code class="ga">${t.ga}</code></td>
                <td class="label-cell" title=${t.label ?? ""}>
                  ${t.label ?? i`<span class="muted">—</span>`}
                </td>
                <td>
                  ${t.dpt ? i`<code class="dpt">${t.dpt}</code>` : i`<span class="muted">—</span>`}
                </td>
                <td class="num strong">${t.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td class="num muted">${t.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td>
                  <span class=${`mh-pill ${this._severityPillClass(t.severity)}`}>
                    <span class="mh-pill__dot"></span>
                    ${this._severityLabel(t.severity)}
                  </span>
                  ${t.acknowledged ? i`<span class="ack-pill" title="acknowledged">✓ bekannt</span>` : h}
                </td>
                <td class="actions">
                  ${t.acknowledged ? i`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(s) => {
        s.stopPropagation(), this._unackGa(t.ga);
      }}
                      >
                        ✗ Ack entfernen
                      </button>` : i`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(s) => {
        s.stopPropagation(), this._ackGa(t.ga);
      }}
                      >
                        ✓ Bekannt
                      </button>`}
                </td>
              </tr>`
    )}
          </tbody>
        </table>
      </div>
    `;
  }
  _renderDetailPane() {
    if (this._detailLoading && this._detail === null)
      return i`<section class="mh-card detail-pane">
        <p class="muted">lade Details…</p>
      </section>`;
    if (this._detail === null) return i``;
    const t = this._detail, e = t.recommendation;
    return i`
      <section class="mh-card detail-pane">
        <header class="card-head">
          <div class="detail-head-text">
            <h3>${t.ga} — ${t.label ?? "Detail"}</h3>
            <span class="muted small">
              Geraet:
              <code>${t.dev_source || "?"}</code>
              ${t.dpt ? i` • DPT <code>${t.dpt}</code>` : h}
            </span>
          </div>
          <button
            class="mh-btn mh-btn--sm mh-btn--ghost"
            @click=${() => {
      this._selectedGa = null, this._detail = null;
    }}
          >
            ✕ Schliessen
          </button>
        </header>

        <div class="detail-stats">
          <div class="detail-stat">
            <span class="muted small">Ist-Rate</span>
            <strong>${t.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Tel/Min</strong>
          </div>
          <div class="detail-stat">
            <span class="muted small">Soll-Rate</span>
            <strong>${t.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Tel/Min</strong>
          </div>
          <div class="detail-stat">
            <span class="muted small">Verhaeltnis</span>
            <strong>${isFinite(e.ratio) ? e.ratio.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "x" : "∞"}</strong>
          </div>
          ${e.estimated_reduction_pct !== null ? i`<div class="detail-stat">
                <span class="muted small">Geschaetzte Reduktion</span>
                <strong>−${e.estimated_reduction_pct.toLocaleString(
      "de-DE",
      { maximumFractionDigits: 0 }
    )} %</strong>
              </div>` : h}
        </div>

        <div class=${`recommendation rec-${e.severity}`}>
          <strong>Empfehlung:</strong>
          <p>${e.text}</p>
        </div>

        ${t.findings.length > 0 ? i`<div class="findings">
              <strong>Erkannte Muster:</strong>
              <ul>
                ${t.findings.map(
      (s) => i`<li class=${`finding-${s.severity}`}>
                    <span class=${`mh-pill ${this._severityPillClass(s.severity)}`}>
                      ${s.kind}
                    </span>
                    <span>${s.text}</span>
                  </li>`
    )}
              </ul>
            </div>` : h}

        ${t.value_history.length >= 2 ? i`<div class="value-history">
              <strong>Wertverlauf:</strong>
              <knx-value-sparkline
                .points=${t.value_history}
                .width=${800}
                .height=${100}
              ></knx-value-sparkline>
            </div>` : h}

        ${t.device || t.manufacturer_hints ? this._renderDeviceInfo(t) : h}

        ${t.sibling_gas.length > 0 ? this._renderSiblingGas(t) : h}
      </section>
    `;
  }
  _renderDeviceInfo(t) {
    const e = t.device, s = t.manufacturer_hints;
    return i`
      <div class="device-info">
        ${e ? i`<strong>
              Geraet: ${e.manufacturer || "?"}
              ${e.name ? i` — ${e.name}` : h}
              ${e.product ? i`<span class="muted small">(${e.product})</span>` : h}
            </strong>` : i`<strong>Hersteller-Hinweise</strong>`}
        ${s && s.tips.length > 0 ? i`<ul class="hints">
              ${s.tips.map((a) => i`<li>${a}</li>`)}
            </ul>` : h}
        ${s != null && s.doc_url ? i`<p class="muted small">
              Hersteller-Doku:
              <a href=${s.doc_url} target="_blank" rel="noopener noreferrer">
                ${s.doc_url}
              </a>
            </p>` : h}
      </div>
    `;
  }
  _renderSiblingGas(t) {
    return i`
      <div class="siblings">
        <strong>Andere GAs des Geraets <code>${t.dev_source}</code>:</strong>
        <ul>
          ${t.sibling_gas.slice(0, 10).map(
      (e) => i`<li
              class="sibling-row"
              @click=${() => void this._onSelectGa(e.ga)}
              title="Detail-Pane fuer ${e.ga} oeffnen"
            >
              <code class="ga">${e.ga}</code>
              <span class="muted">${e.label ?? "—"}</span>
              <span class="num">
                ${e.rate_per_min.toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })} Tel/Min
              </span>
              <span class="num muted">${e.count}</span>
            </li>`
    )}
        </ul>
        ${t.sibling_gas.length > 10 ? i`<p class="muted small">
              … und ${t.sibling_gas.length - 10} weitere
            </p>` : h}
      </div>
    `;
  }
  _renderTopBySource() {
    const t = this._filters.topNDevices;
    return i`
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Geraet (Source)</th>
              <th>Hersteller / Modell</th>
              <th class="num">GAs</th>
              <th class="num">Telegramme</th>
              <th class="num">Anteil</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${this._topBySource.slice(0, t).map((e, s) => {
      var d;
      const a = ((d = this._summary) == null ? void 0 : d.total_telegrams) ?? 0, r = a > 0 ? e.count / a * 100 : 0, o = e.manufacturer ?? "", n = e.device_name ?? "";
      return i`<tr>
                <td class="num muted">${s + 1}</td>
                <td><code class="ga">${e.dev_source}</code></td>
                <td class="device-cell">
                  ${o || n ? i`<span class="muted small"
                        >${o}${o && n ? " — " : ""}${n}</span
                      >` : i`<span class="muted small">—</span>`}
                </td>
                <td class="num">${e.ga_count}</td>
                <td class="num strong">${e.count.toLocaleString("de-DE")}</td>
                <td class="num muted">
                  ${r.toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })} %
                </td>
                <td class="actions">
                  <button
                    class="mh-btn mh-btn--sm mh-btn--ghost"
                    title="Alle GAs dieses Geraets als bekannt markieren"
                    @click=${(c) => {
        c.stopPropagation(), this._ackBulk(e.dev_source);
      }}
                  >
                    ✓ Alle ${e.ga_count} bekannt
                  </button>
                </td>
              </tr>`;
    })}
          </tbody>
        </table>
      </div>
    `;
  }
  async _ackBulk(t) {
    if (!this.api || !window.confirm(
      `Alle GAs des Geraets ${t} als bekannt markieren?`
    ))
      return;
    const e = window.prompt(
      `Notiz fuer Bulk-Ack ${t} (optional):`,
      "akzeptiert nach Pruefung"
    );
    if (e !== null)
      try {
        const { from: s, to: a } = ft(this._filters.periodId), r = await this.api.acknowledgeKnxBulk(t, {
          note: e || void 0,
          from: s,
          to: a
        });
        this._showToast(
          `${t}: ${r.count} GAs als bekannt markiert`
        ), await this._load();
      } catch (s) {
        this._showToast(`Bulk-Ack fehlgeschlagen: ${s.message}`);
      }
  }
  _renderAlarmBanner() {
    const e = this._alarms.alarms.filter((s) => s.triggered);
    return i`
      <section class="alarm-banner">
        <strong>⚠ ${e.length} Alarm(e) aktiv</strong>
        <ul>
          ${e.map(
      (s) => i`<li>
              <span class="alarm-rule">${s.rule}</span>
              <span class="alarm-msg">${s.message}</span>
            </li>`
    )}
        </ul>
      </section>
    `;
  }
  _renderOrphans() {
    const t = this._orphans;
    return i`
      <section class="mh-card">
        <header class="card-head">
          <h3>Verwaiste GAs (Projekt vs Realitaet)</h3>
          <span class="muted small">
            Projekt: ${t.project_total} • geloggt: ${t.log_total}
          </span>
        </header>
        <div class="orphans-grid">
          ${t.missing_in_log.length > 0 ? i`<div>
                <strong>Im Projekt, nie gesehen (${t.missing_in_log.length})</strong>
                <ul class="orphans-list muted-list">
                  ${t.missing_in_log.slice(0, 15).map(
      (e) => i`<li>
                      <code>${e.address}</code>
                      <span>${e.name || "—"}</span>
                      ${e.dpt ? i`<code class="dpt">${e.dpt}</code>` : h}
                    </li>`
    )}
                </ul>
                ${t.missing_in_log.length > 15 ? i`<p class="muted small">
                      … und ${t.missing_in_log.length - 15} weitere
                    </p>` : h}
              </div>` : h}
          ${t.extra_in_log.length > 0 ? i`<div>
                <strong>Geloggt, nicht im Projekt (${t.extra_in_log.length})</strong>
                <ul class="orphans-list extra-list">
                  ${t.extra_in_log.slice(0, 15).map(
      (e) => i`<li>
                      <code>${e.address}</code>
                      <span>${e.label ?? "—"}</span>
                      <span class="muted num">${e.count}</span>
                    </li>`
    )}
                </ul>
                ${t.extra_in_log.length > 15 ? i`<p class="muted small">
                      … und ${t.extra_in_log.length - 15} weitere
                    </p>` : h}
              </div>` : h}
        </div>
      </section>
    `;
  }
  _renderSilenceAlarms() {
    const t = this._silence, e = t.items.filter((s) => s.alarm);
    return e.length === 0 ? i`` : i`
      <section class="mh-card silence-card">
        <header class="card-head">
          <h3>Stille-Alarme (${t.alarm_count})</h3>
          <span class="muted small">
            Schwelle: &gt; ${t.max_silence_minutes} Min ohne Telegramm
          </span>
        </header>
        <ul class="silence-list">
          ${e.slice(0, 10).map(
      (s) => i`<li>
              <code>${s.dev_source}</code>
              <span class="muted">
                seit ${this._formatSilence(s.silent_minutes)} stumm
              </span>
              <span class="muted small">last_seen ${this._formatTs(s.last_seen)}</span>
            </li>`
    )}
        </ul>
        ${t.alarm_count > 10 ? i`<p class="muted small">
              … und ${t.alarm_count - 10} weitere
            </p>` : h}
      </section>
    `;
  }
  _formatSilence(t) {
    return t >= 1440 ? `${Math.floor(t / 1440)} Tagen` : t >= 60 ? `${Math.floor(t / 60)} Std` : `${Math.round(t)} Min`;
  }
  _formatTs(t) {
    try {
      return new Date(t).toLocaleString("de-DE");
    } catch {
      return t;
    }
  }
  _renderBusHealth() {
    const t = this._busHealth, e = t.summary.ratio_pct, s = e >= 1 ? "danger" : e >= 0.5 ? "warning" : e > 0 ? "elevated" : "ok";
    return i`
      <section class="mh-card">
        <header class="card-head">
          <h3>Bus-Gesundheit (Wiederholrate)</h3>
          <span class="muted small">
            xknx-Repeated-Flag — hoher Wert deutet auf Verkabelung/EMV
          </span>
        </header>
        <div class="kpis">
          <div class=${`kpi busload busload--${s}`}>
            <span class="kpi-label">Wiederhol-Quote</span>
            <span class="kpi-value">${e.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} %</span>
            <span class="kpi-hint">
              ${t.summary.repeated.toLocaleString("de-DE")} von
              ${t.summary.total.toLocaleString("de-DE")} Telegrammen
            </span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Schwelle gesund</span>
            <span class="kpi-value">&lt; 0,5 %</span>
            <span class="kpi-hint">Empfehlung KNX-Praxis</span>
          </div>
        </div>
        ${t.per_ga.length > 0 ? i`<div class="bus-health-list">
              <strong>Top-GAs mit Wiederholungen:</strong>
              <ul>
                ${t.per_ga.slice(0, 5).map(
      (a) => i`<li>
                    <code>${a.ga}</code>
                    <span class="muted">${a.label ?? "—"}</span>
                    <span class="num">${a.repeated} / ${a.total}</span>
                    <span class="num">${a.ratio_pct.toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })} %</span>
                  </li>`
    )}
              </ul>
            </div>` : h}
      </section>
    `;
  }
  _severityPillClass(t) {
    switch (t) {
      case "red":
        return "mh-pill--error";
      case "orange":
        return "mh-pill--warning";
      case "yellow":
        return "mh-pill--info";
      case "green":
        return "mh-pill--neutral";
    }
  }
};
_.styles = [
  L,
  Ke,
  be,
  fe,
  y`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
        background: var(--mh-bg);
      }
      .root {
        max-width: 1024px;
        margin: 0 auto;
        padding: var(--mh-space-5);
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-4);
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-4);
        align-items: flex-end;
        padding: var(--mh-space-3);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .filter-group.toggle {
        flex-direction: row;
        align-items: center;
        gap: 6px;
      }
      .filter-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: var(--mh-weight-semibold);
      }
      .seg {
        display: inline-flex;
        gap: 1px;
        background: var(--mh-surface-2);
        padding: 2px;
        border-radius: var(--mh-radius-sm);
      }
      .seg-btn {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 4px 10px;
        font: inherit;
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
      }
      .seg-btn:hover {
        color: var(--mh-fg);
      }
      .seg-btn.active {
        background: var(--mh-surface);
        color: var(--mh-fg);
        font-weight: var(--mh-weight-semibold);
        box-shadow: var(--mh-shadow-1);
      }
      .mh-input.narrow {
        max-width: 100px;
        padding: 5px 10px;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        font: inherit;
        font-size: var(--mh-text-sm);
        background: var(--mh-surface);
        color: var(--mh-fg);
      }
      .card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--mh-space-3);
        margin-bottom: var(--mh-space-3);
        flex-wrap: wrap;
      }
      /* Iter 45 (N6): Inline-Top-N-Selektor in Card-Headern */
      .card-head__meta {
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        flex-wrap: wrap;
      }
      .inline-topn {
        display: inline-flex;
        gap: 0;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        overflow: hidden;
      }
      .inline-topn__btn {
        background: transparent;
        border: 0;
        padding: 2px 8px;
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        cursor: pointer;
        font-variant-numeric: tabular-nums;
      }
      .inline-topn__btn:hover {
        background: var(--mh-bg-hover, rgba(0, 0, 0, 0.04));
      }
      .inline-topn__btn.active {
        background: var(--mh-primary);
        color: var(--mh-on-primary, white);
        font-weight: var(--mh-weight-semibold);
      }
      h3 {
        margin: 0;
        font-size: var(--mh-text-md);
        font-weight: var(--mh-weight-semibold);
      }
      .small {
        font-size: var(--mh-text-xs);
      }
      .muted {
        color: var(--mh-fg-muted);
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--mh-space-3);
      }
      .kpi {
        background: var(--mh-bg);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-4);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .kpi-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: var(--mh-weight-semibold);
      }
      .kpi-value {
        font-size: var(--mh-text-2xl);
        font-weight: var(--mh-weight-bold);
        color: var(--mh-fg);
        line-height: 1.1;
        margin: 4px 0;
        font-variant-numeric: tabular-nums;
      }
      .kpi-hint {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      .busload--ok {
        border-left: 3px solid var(--mh-success);
      }
      .busload--elevated {
        border-left: 3px solid var(--mh-info);
      }
      .busload--warning {
        border-left: 3px solid var(--mh-warning);
      }
      .busload--danger {
        border-left: 3px solid var(--mh-error);
      }
      /* Iter 37 (Feature K): Bus-Health-Score-Card */
      .health-score {
        border-left: 4px solid var(--mh-divider);
      }
      .health-score--green {
        border-left-color: var(--mh-success);
      }
      .health-score--yellow {
        border-left-color: var(--mh-info);
      }
      .health-score--orange {
        border-left-color: var(--mh-warning);
      }
      .health-score--red {
        border-left-color: var(--mh-error);
      }
      .health-score__body {
        display: grid;
        grid-template-columns: minmax(140px, 200px) 1fr;
        gap: var(--mh-space-4);
        align-items: start;
      }
      @media (max-width: 640px) {
        .health-score__body {
          grid-template-columns: 1fr;
        }
      }
      .health-score__big {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .health-score__value {
        font-size: 3rem;
        font-weight: var(--mh-weight-bold);
        line-height: 1;
        color: var(--mh-fg);
        font-variant-numeric: tabular-nums;
      }
      .health-score__unit {
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .health-score__label {
        margin-top: var(--mh-space-2);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .health-score--green .health-score__label {
        color: var(--mh-success);
      }
      .health-score--yellow .health-score__label {
        color: var(--mh-info);
      }
      .health-score--orange .health-score__label {
        color: var(--mh-warning);
      }
      .health-score--red .health-score__label {
        color: var(--mh-error);
      }
      .health-score__components {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
      }
      .health-score__component {
        display: grid;
        grid-template-columns: 130px 1fr 30px;
        align-items: center;
        gap: var(--mh-space-2);
        font-size: var(--mh-text-sm);
      }
      .health-score__component-label {
        color: var(--mh-fg-muted);
      }
      .health-score__bar {
        height: 6px;
        background: var(--mh-divider);
        border-radius: 3px;
        overflow: hidden;
      }
      .health-score__bar-fill {
        height: 100%;
        background: var(--mh-success);
        transition: width 0.2s ease;
      }
      .health-score__component-value {
        text-align: right;
        font-variant-numeric: tabular-nums;
        color: var(--mh-fg);
      }
      .health-score__findings {
        grid-column: 1 / -1;
        list-style: none;
        margin: var(--mh-space-3) 0 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .health-finding {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
      }
      .health-finding__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--mh-info);
      }
      .health-finding--warn .health-finding__dot {
        background: var(--mh-warning);
      }
      .health-finding--critical .health-finding__dot {
        background: var(--mh-error);
      }
      /* Iter 51: API-Error-Banner — gefailte Endpoints + Diagnose */
      .api-error-banner {
        padding: var(--mh-space-3) var(--mh-space-4);
        background: var(--mh-warning-soft, rgba(255, 165, 0, 0.12));
        border-left: 3px solid var(--mh-warning);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
        margin-bottom: var(--mh-space-3);
      }
      .api-error-banner__head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--mh-space-3);
      }
      .api-error-banner__dismiss {
        background: transparent;
        border: 0;
        font-size: 1.4em;
        line-height: 1;
        color: var(--mh-fg-muted);
        cursor: pointer;
        padding: 0 4px;
      }
      .api-error-banner__dismiss:hover {
        color: var(--mh-fg);
      }
      .api-error-banner__list {
        margin: var(--mh-space-2) 0 0 0;
        font-weight: var(--mh-weight-semibold);
      }
      .api-error-banner__details {
        margin-top: var(--mh-space-2);
      }
      .api-error-banner__details summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
      }
      .api-error-banner__details ul {
        margin: var(--mh-space-2) 0;
        padding-left: var(--mh-space-4);
      }
      .api-error-banner__raw code {
        font-family: var(--mh-font-mono, monospace);
      }
      /* Iter 49 (N1): Bus-Analyse-Toggle-Banner, sichtbar wenn aus */
      .bus-analysis-banner {
        padding: var(--mh-space-3) var(--mh-space-4);
        background: var(--mh-warning-soft, rgba(255, 165, 0, 0.12));
        border-left: 3px solid var(--mh-warning);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
        margin-bottom: var(--mh-space-3);
      }
      .bus-analysis-banner strong {
        margin-right: var(--mh-space-2);
      }
      /* Iter 39: Long-Term-Modus */
      .long-term-banner {
        display: flex;
        align-items: flex-start;
        gap: var(--mh-space-3);
        padding: var(--mh-space-3) var(--mh-space-4);
        background: var(--mh-info-soft, rgba(0, 120, 255, 0.08));
        border-left: 3px solid var(--mh-info);
        border-radius: var(--mh-radius-md);
      }
      .long-term-banner__icon {
        font-size: 1.5em;
        line-height: 1;
      }
      .long-term__body {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: var(--mh-space-4);
      }
      @media (max-width: 768px) {
        .long-term__body {
          grid-template-columns: 1fr;
        }
      }
      .long-term__chart {
        min-height: 120px;
      }
      .long-term__bars {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 120px;
        padding: var(--mh-space-2) 0;
      }
      .long-term__bar {
        flex: 1;
        min-height: 2px;
        background: var(--mh-info);
        border-radius: 2px 2px 0 0;
        transition: opacity 0.2s ease;
      }
      .long-term__bar:hover {
        opacity: 0.7;
      }
      .long-term__top h4 {
        margin: 0 0 var(--mh-space-2) 0;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .long-term__top-list {
        margin: 0;
        padding-left: var(--mh-space-4);
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: var(--mh-text-sm);
      }
      .long-term__top-list li {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .long-term__top-list code {
        font-family: var(--mh-font-mono, monospace);
      }
      .long-term__top-count {
        margin-left: auto;
        font-variant-numeric: tabular-nums;
        color: var(--mh-fg-muted);
      }
      /* Iter 41: Burst-Detector-Card */
      .bursts__intro {
        margin-bottom: var(--mh-space-2);
      }
      .bursts__table {
        width: 100%;
        border-collapse: collapse;
      }
      .bursts__table th,
      .bursts__table td {
        padding: var(--mh-space-1) var(--mh-space-2);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-sm);
      }
      .bursts__table th {
        text-align: left;
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
      }
      .bursts__table .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .bursts__ts {
        font-family: var(--mh-font-mono, monospace);
        white-space: nowrap;
      }
      .bursts__pct {
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-warning);
      }
      /* Iter 42: Sensitive-Log-Card */
      .sensitive {
        border-left: 4px solid var(--mh-error);
      }
      .sensitive h4 {
        margin: var(--mh-space-3) 0 var(--mh-space-2) 0;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .sensitive__addr-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
      }
      .sensitive__addr-list li {
        display: inline-flex;
        align-items: center;
        gap: var(--mh-space-1);
        padding: var(--mh-space-1) var(--mh-space-2);
        background: var(--mh-bg-subtle, rgba(0, 0, 0, 0.04));
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }
      .sensitive__table {
        width: 100%;
        border-collapse: collapse;
      }
      .sensitive__table th,
      .sensitive__table td {
        padding: var(--mh-space-1) var(--mh-space-2);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-sm);
        text-align: left;
      }
      .sensitive__table th {
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
      }
      .severity-counts {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
        margin-top: var(--mh-space-3);
      }
      .error {
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-error-soft);
        border-left: 3px solid var(--mh-error);
        color: var(--mh-error);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }
      .info-banner {
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-surface);
        border-left: 3px solid var(--mh-info);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        line-height: 1.5;
      }
      .info-banner strong {
        color: var(--mh-fg);
      }

      /* Top-Tabelle */
      .table-wrap {
        overflow-x: auto;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        background: var(--mh-bg);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mh-text-sm);
      }
      th,
      td {
        padding: 8px var(--mh-space-3);
        border-bottom: 1px solid var(--mh-divider);
        text-align: left;
        vertical-align: middle;
      }
      tr:last-child td {
        border-bottom: 0;
      }
      th {
        background: var(--mh-surface);
        font-size: var(--mh-text-xs);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
        position: sticky;
        top: 0;
      }
      tbody tr {
        cursor: pointer;
        transition: background var(--mh-transition-fast);
      }
      tbody tr:hover {
        background: var(--mh-surface-2);
      }
      tbody tr.selected {
        background: var(--mh-accent-soft);
      }
      tbody tr.ack td {
        opacity: 0.6;
      }
      .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .strong {
        font-weight: var(--mh-weight-semibold);
      }
      code.ga {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg);
      }
      code.dpt {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        background: var(--mh-surface-2);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
      }
      .label-cell {
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ack-pill {
        display: inline-block;
        margin-left: 6px;
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      td.actions {
        text-align: right;
        white-space: nowrap;
      }

      /* Detail-Pane */
      .detail-pane {
        border: 1px solid var(--mh-accent-soft);
      }
      .detail-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--mh-space-3);
        margin-bottom: var(--mh-space-3);
      }
      .detail-stat {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .detail-stat strong {
        font-size: var(--mh-text-md);
        color: var(--mh-fg);
        font-variant-numeric: tabular-nums;
      }
      .recommendation {
        padding: var(--mh-space-3);
        border-left: 3px solid var(--mh-divider);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
      }
      .recommendation p {
        margin: 4px 0 0 0;
        line-height: 1.5;
      }
      .rec-red {
        border-left-color: var(--mh-error);
      }
      .rec-orange {
        border-left-color: var(--mh-warning);
      }
      .rec-yellow {
        border-left-color: var(--mh-info);
      }
      .rec-green {
        border-left-color: var(--mh-success);
      }

      .findings {
        margin-top: var(--mh-space-3);
      }
      .findings ul {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
      }
      .findings li {
        display: flex;
        align-items: flex-start;
        gap: var(--mh-space-2);
        padding: var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }

      /* Detail-Pane: Sibling-GAs (Iter 30) */
      .detail-head-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .detail-head-text code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        background: var(--mh-surface-2);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
        color: var(--mh-fg);
      }
      .siblings {
        margin-top: var(--mh-space-3);
      }
      .siblings ul {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .sibling-row {
        display: grid;
        grid-template-columns: 80px 1fr auto auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
        cursor: pointer;
        transition: background var(--mh-transition-fast);
      }
      .sibling-row:hover {
        background: var(--mh-accent-soft);
      }
      .sibling-row code.ga {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Hersteller-Info (Iter 34) */
      .device-info {
        margin-top: var(--mh-space-3);
        padding: var(--mh-space-3);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
      }
      .device-info ul.hints {
        list-style: disc;
        margin: var(--mh-space-2) 0 0 var(--mh-space-4);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: var(--mh-text-sm);
      }
      .device-info a {
        color: var(--mh-accent);
        text-decoration: none;
      }
      .device-info a:hover {
        text-decoration: underline;
      }
      .device-cell {
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Alarm-Banner */
      .alarm-banner {
        padding: var(--mh-space-3);
        background: var(--mh-error-soft);
        border-left: 4px solid var(--mh-error);
        border-radius: var(--mh-radius-sm);
      }
      .alarm-banner strong {
        color: var(--mh-error);
        display: block;
        margin-bottom: var(--mh-space-2);
      }
      .alarm-banner ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .alarm-banner li {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: var(--mh-space-2);
        font-size: var(--mh-text-sm);
      }
      .alarm-rule {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-error);
      }

      /* Orphans-Card */
      .orphans-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--mh-space-4);
      }
      .orphans-list {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .orphans-list li {
        display: grid;
        grid-template-columns: 80px 1fr auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .orphans-list.muted-list li {
        background: var(--mh-surface-2);
      }
      .orphans-list.extra-list li {
        background: color-mix(in srgb, var(--mh-warning) 8%, transparent);
      }
      .orphans-list code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Silence-Card */
      .silence-card {
        border-left: 3px solid var(--mh-error);
      }
      .silence-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .silence-list li {
        display: grid;
        grid-template-columns: 80px 1fr auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-error-soft);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .silence-list code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Bus-Health-Liste */
      .bus-health-list {
        margin-top: var(--mh-space-3);
      }
      .bus-health-list ul {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .bus-health-list li {
        display: grid;
        grid-template-columns: 80px 1fr auto auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .bus-health-list li code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Toast */
      .toast {
        position: fixed;
        bottom: var(--mh-space-5);
        right: var(--mh-space-5);
        background: var(--mh-fg);
        color: var(--mh-bg);
        padding: var(--mh-space-3) var(--mh-space-4);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        font-size: var(--mh-text-sm);
        z-index: 100;
      }
    `
];
x([
  f({ attribute: !1 })
], _.prototype, "api", 2);
x([
  l()
], _.prototype, "_filters", 2);
x([
  l()
], _.prototype, "_summary", 2);
x([
  l()
], _.prototype, "_busHealth", 2);
x([
  l()
], _.prototype, "_busload", 2);
x([
  l()
], _.prototype, "_health", 2);
x([
  l()
], _.prototype, "_longTerm", 2);
x([
  l()
], _.prototype, "_bursts", 2);
x([
  l()
], _.prototype, "_sensitiveLog", 2);
x([
  l()
], _.prototype, "_busAnalysisEnabled", 2);
x([
  l()
], _.prototype, "_busAnalysisLoaded", 2);
x([
  l()
], _.prototype, "_apiErrors", 2);
x([
  l()
], _.prototype, "_apiErrorsDismissed", 2);
x([
  l()
], _.prototype, "_silence", 2);
x([
  l()
], _.prototype, "_orphans", 2);
x([
  l()
], _.prototype, "_alarms", 2);
x([
  l()
], _.prototype, "_top", 2);
x([
  l()
], _.prototype, "_topBySource", 2);
x([
  l()
], _.prototype, "_timeline", 2);
x([
  l()
], _.prototype, "_selectedGa", 2);
x([
  l()
], _.prototype, "_detail", 2);
x([
  l()
], _.prototype, "_detailLoading", 2);
x([
  l()
], _.prototype, "_loading", 2);
x([
  l()
], _.prototype, "_error", 2);
x([
  l()
], _.prototype, "_toast", 2);
_ = x([
  $("stats-knx-view")
], _);
var ra = Object.defineProperty, ia = Object.getOwnPropertyDescriptor, Ve = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? ia(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && ra(e, s, r), r;
};
const bt = "messagehub.stats.subtab", oa = /* @__PURE__ */ new Set(["live", "knx"]);
let ve = class extends w {
  constructor() {
    super(...arguments), this._tab = this._loadTab();
  }
  _loadTab() {
    try {
      const t = localStorage.getItem(bt);
      if (t && oa.has(t)) return t;
    } catch {
    }
    return "live";
  }
  _setTab(t) {
    this._tab = t;
    try {
      localStorage.setItem(bt, t);
    } catch {
    }
  }
  render() {
    return i`
      <div class="root">
        <nav class="subtabs" role="tablist" aria-label="Statistik-Bereiche">
          ${[
      { id: "live", label: "Live-Status" },
      { id: "knx", label: "KNX-Bus-Analyse" }
    ].map(
      (e) => i`<button
              role="tab"
              aria-selected=${this._tab === e.id}
              class=${`subtab ${this._tab === e.id ? "active" : ""}`}
              @click=${() => this._setTab(e.id)}
            >
              ${e.label}
            </button>`
    )}
        </nav>
        <div class="body">
          ${this._tab === "live" ? i`<stats-live-view .api=${this.api}></stats-live-view>` : h}
          ${this._tab === "knx" ? i`<stats-knx-view .api=${this.api}></stats-knx-view>` : h}
        </div>
      </div>
    `;
  }
};
ve.styles = [
  L,
  y`
      :host {
        display: block;
        height: 100%;
        background: var(--mh-bg);
      }
      .root {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .subtabs {
        display: inline-flex;
        gap: 2px;
        background: var(--mh-surface-2);
        padding: 4px;
        border-radius: var(--mh-radius-md);
        margin: var(--mh-space-3) auto;
        align-self: center;
      }
      .subtab {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 5px 12px;
        font: inherit;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg-muted);
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
        transition: background var(--mh-transition-fast),
          color var(--mh-transition-fast);
      }
      .subtab:hover {
        color: var(--mh-fg);
      }
      .subtab:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: var(--mh-focus-offset);
      }
      .subtab.active {
        background: var(--mh-surface);
        color: var(--mh-fg);
        font-weight: var(--mh-weight-semibold);
        box-shadow: var(--mh-shadow-1);
      }
      .body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
    `
];
Ve([
  f({ attribute: !1 })
], ve.prototype, "api", 2);
Ve([
  l()
], ve.prototype, "_tab", 2);
ve = Ve([
  $("stats-view")
], ve);
var na = Object.defineProperty, la = Object.getOwnPropertyDescriptor, X = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? la(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && na(e, s, r), r;
};
function da(t) {
  const e = t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), s = new Set(e), a = (...r) => r.some((o) => s.has(o));
  return a("delete", "remove", "removed", "deleted") ? "delete" : a("upsert", "create", "created", "add", "added", "import", "imported") ? "create" : a("update", "updated", "edit", "edited", "set") ? "update" : a("status", "ack", "acknowledge", "toggle", "enable", "enabled", "disable", "disabled") ? "status" : "other";
}
let H = class extends w {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._filter = "", this._expanded = /* @__PURE__ */ new Set(), this._now = /* @__PURE__ */ new Date();
  }
  connectedCallback() {
    super.connectedCallback(), this._tickerId = window.setInterval(() => this._now = /* @__PURE__ */ new Date(), 3e4);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._tickerId && window.clearInterval(this._tickerId);
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    if (this.api) {
      this._loading = !0;
      try {
        const t = await this.api.listAudit(200);
        this._items = t;
      } finally {
        this._loading = !1;
      }
    }
  }
  // Iter 44 (N5): Audit-Log loeschen mit Confirm-Dialog. Nach dem
  // Clear bleibt genau 1 neuer Eintrag uebrig (audit_clear), den der
  // Backend selbst geschrieben hat — wir laden danach neu.
  async _clearAll() {
    if (this.api && window.confirm(
      `Wirklich ALLE Audit-Eintraege loeschen?

Diese Aktion kann nicht rueckgaengig gemacht werden. Ein neuer Eintrag 'audit_clear' wird vom Backend angelegt, damit der Loesch-Vorgang in den verbleibenden Logs nachvollziehbar bleibt.`
    )) {
      this._loading = !0;
      try {
        const t = await this.api.clearAuditLog();
        await this._load(), window.alert(`${t.deleted} Eintraege geloescht.`);
      } catch (t) {
        window.alert(`Fehler: ${t.message}`);
      } finally {
        this._loading = !1;
      }
    }
  }
  _toggle(t) {
    const e = new Set(this._expanded);
    e.has(t) ? e.delete(t) : e.add(t), this._expanded = e;
  }
  _filtered() {
    const t = this._filter.trim().toLowerCase();
    return t ? this._items.filter((e) => {
      const s = `${e.target_type ?? ""}${e.target_id ?? ""}`.toLowerCase(), a = e.details ? JSON.stringify(e.details).toLowerCase() : "";
      return (e.actor ?? "").toLowerCase().includes(t) || (e.action ?? "").toLowerCase().includes(t) || s.includes(t) || a.includes(t);
    }) : this._items;
  }
  _renderActionPill(t) {
    const e = da(t);
    return i`<span class=${`action-pill action-${e}`} title=${t}>${t}</span>`;
  }
  _renderDetails(t) {
    if (!t) return i`<span class="muted">—</span>`;
    if (typeof t == "object") {
      const e = Object.entries(t);
      return e.length === 0 ? i`<span class="muted">—</span>` : i`
        <dl class="kv">
          ${e.map(
        ([s, a]) => i`
              <dt>${s}</dt>
              <dd>${typeof a == "object" ? JSON.stringify(a) : String(a)}</dd>
            `
      )}
        </dl>
      `;
    }
    return i`<code>${String(t)}</code>`;
  }
  _renderDetailsSummary(t) {
    if (!t || typeof t != "object") return i`<span class="muted">—</span>`;
    const e = t, s = typeof e.label == "string" ? e.label : typeof e.name == "string" ? e.name : null;
    if (s) return i`<span class="summary">${s}</span>`;
    const a = Object.keys(e).slice(0, 3).join(", ");
    return i`<span class="summary muted">{${a}${Object.keys(e).length > 3 ? ", …" : ""}}</span>`;
  }
  render() {
    const t = this._filtered();
    return i`
      <div class="root">
        <header class="page-head">
          <div>
            <h2>Audit-Log</h2>
            <p class="hint">
              Letzte 200 administrativen Aktionen: Löschen, Status-Änderungen,
              Webhook-CRUD. Einträge sind unveränderlich.
            </p>
          </div>
          <div class="head-actions">
            <button class="mh-btn" @click=${() => void this._load()}>
              ↻ Aktualisieren
            </button>
            <button
              class="mh-btn mh-btn--danger"
              ?disabled=${this._items.length === 0 || this._loading}
              @click=${() => void this._clearAll()}
              title="Alle Audit-Eintraege loeschen"
            >
              Alle loeschen
            </button>
          </div>
        </header>

        <div class="filter-bar">
          <input
            type="search"
            class="mh-input"
            placeholder="Suche in Akteur, Aktion, Ziel oder Details…"
            .value=${this._filter}
            @input=${(e) => this._filter = e.target.value}
          />
          <span class="muted small"
            >${t.length} ${t.length === 1 ? "Eintrag" : "Einträge"}</span
          >
        </div>

        ${this._loading ? i`<p class="status">lade…</p>` : t.length === 0 ? i`<div class="empty">
                ${this._items.length === 0 ? "Noch keine Audit-Einträge." : "Keine Treffer für aktuelle Suche."}
              </div>` : i`
                <div class="table">
                  <div class="table-head">
                    <span>Zeit</span>
                    <span>Wer</span>
                    <span>Aktion</span>
                    <span>Ziel</span>
                    <span>Details</span>
                  </div>
                  ${t.map((e, s) => {
      const a = this._expanded.has(s), r = String(e.timestamp);
      return i`
                      <div class=${`table-row ${a ? "expanded" : ""}`}>
                        <button
                          class="row-toggle"
                          @click=${() => this._toggle(s)}
                          aria-expanded=${a}
                          aria-label=${a ? "Details verbergen" : "Details anzeigen"}
                        >
                          <span class="ts" title=${Et(r, this._now)}>
                            ${At(r, this._now)}
                          </span>
                          <span class="actor">${e.actor}</span>
                          <span>${this._renderActionPill(e.action)}</span>
                          <span class="target">
                            <code class="target-type">${e.target_type}</code>
                            ${e.target_id !== null && e.target_id !== void 0 ? i`<code class="target-id">#${e.target_id}</code>` : h}
                          </span>
                          <span class="details-inline">
                            ${this._renderDetailsSummary(e.details)}
                            <span class="chevron" aria-hidden="true">${a ? "▾" : "▸"}</span>
                          </span>
                        </button>
                        ${a ? i`<div class="details-panel">
                              ${this._renderDetails(e.details)}
                            </div>` : h}
                      </div>
                    `;
    })}
                </div>
              `}
      </div>
    `;
  }
};
H.styles = [
  L,
  fe,
  Tt,
  be,
  y`
      :host {
        display: block;
        overflow-y: auto;
        height: 100%;
        background: var(--mh-bg);
      }
      .root {
        max-width: 1100px;
        margin: 0 auto;
        padding: var(--mh-space-5);
      }
      .page-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--mh-space-4);
        margin-bottom: var(--mh-space-3);
      }
      .head-actions {
        display: flex;
        gap: var(--mh-space-2);
        flex-shrink: 0;
      }
      h2 {
        margin: 0;
        font-size: var(--mh-text-xl);
        font-weight: var(--mh-weight-semibold);
        letter-spacing: -0.01em;
      }
      .hint {
        margin: 4px 0 0 0;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .filter-bar {
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        margin-bottom: var(--mh-space-3);
        flex-wrap: wrap;
      }
      .filter-bar .mh-input {
        flex: 1;
        min-width: 240px;
        max-width: 480px;
      }

      .table {
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        overflow: hidden;
        box-shadow: var(--mh-shadow-1);
      }
      .table-head {
        display: grid;
        grid-template-columns: 130px 130px 160px 1fr 1.2fr;
        gap: var(--mh-space-3);
        padding: 10px var(--mh-space-4);
        background: var(--mh-bg);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--mh-fg-muted);
        position: sticky;
        top: 0;
      }
      .table-row {
        border-bottom: 1px solid var(--mh-divider);
      }
      .table-row:last-child {
        border-bottom: 0;
      }
      .row-toggle {
        all: unset;
        display: grid;
        grid-template-columns: 130px 130px 160px 1fr 1.2fr;
        gap: var(--mh-space-3);
        padding: 10px var(--mh-space-4);
        align-items: center;
        cursor: pointer;
        width: 100%;
        box-sizing: border-box;
        transition: background var(--mh-transition-fast);
      }
      .row-toggle:hover {
        background: var(--mh-surface-2);
      }
      .row-toggle:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: -2px;
      }
      .table-row.expanded .row-toggle {
        background: var(--mh-surface-2);
      }
      .ts {
        font-variant-numeric: tabular-nums;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        white-space: nowrap;
      }
      .actor {
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
        font-weight: var(--mh-weight-medium);
      }
      .target {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
        font-size: var(--mh-text-sm);
      }
      .target-type,
      .target-id {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
        color: var(--mh-fg);
      }
      .target-id {
        color: var(--mh-fg-muted);
      }
      .details-inline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mh-space-2);
        font-size: var(--mh-text-sm);
        overflow: hidden;
      }
      .summary {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .chevron {
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-xs);
        flex-shrink: 0;
      }

      /* Action-Pills (semantisch) */
      .action-pill {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: var(--mh-radius-pill);
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        letter-spacing: 0.02em;
      }
      .action-create {
        background: var(--mh-success-soft);
        color: var(--mh-success);
      }
      .action-update {
        background: var(--mh-info-soft);
        color: var(--mh-info);
      }
      .action-delete {
        background: var(--mh-error-soft);
        color: var(--mh-error);
      }
      .action-status {
        background: var(--mh-warning-soft);
        color: var(--mh-warning);
      }
      .action-other {
        background: var(--mh-surface-2);
        color: var(--mh-fg-muted);
      }

      .details-panel {
        padding: var(--mh-space-3) var(--mh-space-4) var(--mh-space-4);
        background: var(--mh-bg);
        border-top: 1px dashed var(--mh-divider);
      }
      dl.kv {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 6px var(--mh-space-3);
        margin: 0;
        font-size: var(--mh-text-sm);
      }
      dl.kv dt {
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-medium);
      }
      dl.kv dd {
        margin: 0;
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg);
        word-break: break-word;
      }

      .empty,
      .status {
        padding: var(--mh-space-6);
        text-align: center;
        color: var(--mh-fg-muted);
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
      }

      .muted {
        color: var(--mh-fg-muted);
      }
      .small {
        font-size: var(--mh-text-xs);
      }

      @media (max-width: 720px) {
        .table-head,
        .row-toggle {
          grid-template-columns: 100px 100px 1fr;
        }
        .table-head > :nth-child(4),
        .table-head > :nth-child(5),
        .row-toggle > :nth-child(4),
        .row-toggle > :nth-child(5) {
          display: none;
        }
        dl.kv {
          grid-template-columns: 1fr;
        }
        dl.kv dd {
          margin-bottom: 4px;
        }
      }
    `
];
X([
  f({ attribute: !1 })
], H.prototype, "api", 2);
X([
  l()
], H.prototype, "_items", 2);
X([
  l()
], H.prototype, "_loading", 2);
X([
  l()
], H.prototype, "_filter", 2);
X([
  l()
], H.prototype, "_expanded", 2);
X([
  l()
], H.prototype, "_now", 2);
H = X([
  $("audit-view")
], H);
var ha = Object.defineProperty, ca = Object.getOwnPropertyDescriptor, P = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? ca(e, s) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && ha(e, s, r), r;
};
const _t = "messagehub.filters", $e = {
  severity: ["error", "warning", "info"],
  source: "",
  search: ""
};
let A = class extends w {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "messages", this._items = [], this._total = 0, this._loading = !1, this._selected = null, this._filters = this._loadFilters(), this._newCount = 0, this._testing = !1, this._toast = "", this._overflowOpen = !1, this._api = new as(), this._onSeverityChange = (t) => {
      this._filters = { ...this._filters, severity: t.detail.severities }, this._persistFilters(), this._reload();
    }, this._onSourceChange = (t) => {
      this._filters = { ...this._filters, source: t.detail.source }, this._persistFilters(), this._reload();
    }, this._onTimeRange = (t) => {
      this._filters = { ...this._filters, fromIso: t.detail.fromIso, toIso: t.detail.toIso }, this._persistFilters(), this._reload();
    }, this._onSelect = (t) => {
      this._selected = t.detail.msg;
    }, this._onSeverityChangeMessage = async (t) => {
      var r, o;
      const { id: e, severity: s, previous: a } = t.detail;
      this._items = this._items.map(
        (n) => n.id === e ? { ...n, severity: s } : n
      ), ((r = this._selected) == null ? void 0 : r.id) === e && (this._selected = { ...this._selected, severity: s });
      try {
        await this._api.setMessageSeverity(e, s), this._showToast(`Severity geändert: ${a} → ${s}`);
      } catch (n) {
        this._items = this._items.map(
          (d) => d.id === e ? { ...d, severity: a } : d
        ), ((o = this._selected) == null ? void 0 : o.id) === e && (this._selected = {
          ...this._selected,
          severity: a
        }), this._showToast(`Änderung fehlgeschlagen: ${n.message}`);
      }
    }, this._onDelete = async (t) => {
      try {
        await this._api.deleteMessage(t.detail.id), this._items = this._items.filter((e) => e.id !== t.detail.id), this._total = Math.max(0, this._total - 1), this._selected = null, this._showToast("Nachricht gelöscht");
      } catch (e) {
        this._showToast(`Löschen fehlgeschlagen: ${e.message}`);
      }
    }, this._toggleOverflow = () => {
      this._overflowOpen = !this._overflowOpen;
    }, this._closeOverflow = () => {
      this._overflowOpen && (this._overflowOpen = !1);
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
      const a = s.data;
      this._matchesFilters(a) && (this._items = [a, ...this._items].slice(0, 200), this._total += 1, this._newCount += 1, window.setTimeout(() => this._newCount = Math.max(0, this._newCount - 1), 4e3));
    }, "messagehub_message_added"));
  }
  _matchesFilters(t) {
    return !(this._filters.severity.length && !this._filters.severity.includes(t.severity) || this._filters.source && t.source !== this._filters.source || this._filters.search && !t.text.toLowerCase().includes(this._filters.search.toLowerCase()));
  }
  _loadFilters() {
    try {
      const t = localStorage.getItem(_t);
      if (t) return { ...$e, ...JSON.parse(t) };
    } catch {
    }
    return { ...$e };
  }
  _persistFilters() {
    try {
      localStorage.setItem(_t, JSON.stringify(this._filters));
    } catch {
    }
  }
  _resetFilters() {
    this._filters = { ...$e }, this._persistFilters(), this._reload();
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
    const e = this._total, s = t === "all" ? `ALLE ${e} Nachrichten dauerhaft löschen?` : `Bis zu ${e} gefilterte Nachrichten dauerhaft löschen?`;
    if (window.confirm(s))
      try {
        const a = t === "all" ? {} : {
          severity: this._filters.severity,
          source: this._filters.source || void 0,
          search: this._filters.search || void 0,
          from: this._filters.fromIso,
          to: this._filters.toIso
        }, r = await this._api.deleteMessages(a);
        this._showToast(`${r} Nachrichten gelöscht`), this._selected = null, await this._reload();
      } catch (a) {
        this._showToast(`Löschen fehlgeschlagen: ${a.message}`);
      }
  }
  async _sendTestMessage() {
    var t;
    if (!((t = this.hass) != null && t.callService)) {
      this._showToast("Test nicht verfügbar — hass.callService fehlt");
      return;
    }
    this._testing = !0;
    try {
      const e = ["info", "warning", "error", "info", "info"], s = ["pihole", "knx-bus", "backup-job", "test-script"], a = [
        "Demo-Nachricht aus dem Panel",
        "Test: DNS-Query erfolgreich",
        "Backup abgeschlossen, Dauer 12 min",
        "KNX 1/2/3 — Wohnzimmer Deckenlicht ein"
      ], r = (o) => Math.floor(Math.random() * o);
      await this.hass.callService("messagehub", "add_message", {
        severity: e[r(e.length)],
        source: s[r(s.length)],
        text: a[r(a.length)],
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
    return this._filters.severity.length !== $e.severity.length || this._filters.source !== "" || this._filters.search !== "" || this._filters.fromIso !== void 0;
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
    return i`
      <div class="empty">
        <h3>Noch keine Nachrichten ${this._hasActiveFilters() ? "für diese Filter" : ""}</h3>
        <p>
          ${this._hasActiveFilters() ? "Probiere weniger restriktive Filter oder setze sie zurück." : "Sobald Nachrichten über Webhook, MQTT, Eventbus oder den Service messagehub.add_message reinkommen, erscheinen sie hier."}
        </p>
        <div class="empty-actions">
          ${this._hasActiveFilters() ? i`<button class="mh-btn" @click=${this._resetFilters}>
                Filter zurücksetzen
              </button>` : null}
          <button
            class="mh-btn mh-btn--primary"
            ?disabled=${this._testing}
            @click=${this._sendTestMessage}
          >
            ${this._testing ? "sende…" : "+ Test-Nachricht senden"}
          </button>
        </div>
      </div>
    `;
  }
  _renderMessages() {
    return i`
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
        ${this._hasActiveFilters() ? i`<button class="filter-reset" @click=${this._resetFilters}>
              Filter zurücksetzen
            </button>` : null}
      </div>

      <div class="status-bar">
        <span class="status-count">
          ${this._loading ? "lade…" : i`<strong>${this._items.length.toLocaleString("de-DE")}</strong>
                <span class="muted">von ${this._total.toLocaleString("de-DE")}</span>`}
          ${this._newCount > 0 ? i`<span class="new-badge">+${this._newCount} neu</span>` : null}
        </span>
        <div class="status-actions">
          ${this._total > 0 ? i`<a
                  class="mh-btn mh-btn--sm"
                  href=${this._exportUrl("jsonl")}
                  download="messagehub-export.jsonl"
                  title="Als JSONL exportieren"
                  >↓ JSONL</a
                >
                <a
                  class="mh-btn mh-btn--sm"
                  href=${this._exportUrl("csv")}
                  download="messagehub-export.csv"
                  title="Als CSV exportieren"
                  >↓ CSV</a
                >` : null}
          ${this._total > 0 && this._hasActiveFilters() ? i`<button
                class="mh-btn mh-btn--sm mh-btn--danger"
                @click=${() => this._bulkDelete("filter")}
              >
                Gefilterte löschen
              </button>` : null}
          <button
            class="mh-btn mh-btn--sm"
            ?disabled=${this._testing}
            @click=${this._sendTestMessage}
          >
            ${this._testing ? "sende…" : "+ Testnachricht"}
          </button>
          <div class="overflow" @click=${(t) => t.stopPropagation()}>
            <button
              class="mh-btn mh-btn--sm mh-btn--icon mh-btn--ghost"
              aria-label="Weitere Aktionen"
              aria-haspopup="menu"
              aria-expanded=${this._overflowOpen}
              @click=${this._toggleOverflow}
            >
              ⋯
            </button>
            ${this._overflowOpen ? i`<div class="overflow-menu" role="menu">
                  <button
                    role="menuitem"
                    class="overflow-item danger"
                    ?disabled=${this._total === 0}
                    @click=${() => {
      this._overflowOpen = !1, this._bulkDelete("all");
    }}
                  >
                    🗑 Alle ${this._total} Nachrichten löschen
                  </button>
                </div>` : null}
          </div>
        </div>
      </div>

      ${this._items.length === 0 && !this._loading ? this._renderEmptyMessages() : i`<message-table
            .items=${this._items}
            @select=${this._onSelect}
            @severity-change=${this._onSeverityChangeMessage}
          ></message-table>`}

      ${this._selected ? i`<detail-pane
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
    const t = [
      { id: "messages", label: "Nachrichten" },
      { id: "stats", label: "Statistik" },
      { id: "settings", label: "Einstellungen" },
      { id: "audit", label: "Audit" }
    ];
    return i`
      <div class="root" @click=${this._closeOverflow}>
        <header>
          <div class="brand">
            <span class="logo" aria-hidden="true">
              <svg viewBox="0 0 512 512" width="28" height="28">
                <rect x="0" y="0" width="512" height="512" rx="112" ry="112" fill="var(--mh-accent)"/>
                <path d="M 112 232 L 168 232 L 200 280 L 312 280 L 344 232 L 400 232 L 400 384 Q 400 400 384 400 L 128 400 Q 112 400 112 384 Z" fill="#fff"/>
                <path d="M 112 232 L 168 168 L 344 168 L 400 232 L 344 232 L 312 280 L 200 280 L 168 232 Z" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>
                <circle cx="180" cy="112" r="22" fill="#ef5350"/>
                <circle cx="256" cy="92" r="22" fill="#ffb300"/>
                <circle cx="332" cy="112" r="22" fill="#66bb6a"/>
              </svg>
            </span>
            <h1>Message Hub</h1>
          </div>
          <nav role="tablist" class="tabs">
            ${t.map(
      (e) => i`<button
                role="tab"
                aria-selected=${this._tab === e.id}
                class=${`tab ${this._tab === e.id ? "active" : ""}`}
                @click=${() => this._tab = e.id}
              >
                ${e.label}
              </button>`
    )}
          </nav>
          <div class="header-actions">
            <button
              class="mh-btn mh-btn--icon mh-btn--ghost"
              aria-label="Aktualisieren"
              title="Aktualisieren"
              @click=${() => void this._reload()}
            >
              <span aria-hidden="true">↻</span>
            </button>
          </div>
        </header>

        <main>
          ${this._tab === "messages" ? this._renderMessages() : null}
          ${this._tab === "stats" ? i`<stats-view .api=${this._api}></stats-view>` : null}
          ${this._tab === "settings" ? i`<settings-view .api=${this._api}></settings-view>` : null}
          ${this._tab === "audit" ? i`<audit-view .api=${this._api}></audit-view>` : null}
        </main>

        ${this._toast ? i`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
};
A.styles = [
  L,
  fe,
  y`
      :host {
        display: block;
        height: 100vh;
        background: var(--mh-bg);
        color: var(--mh-fg);
        font-family: var(--ha-font-family-body, "Inter", system-ui, -apple-system, "Segoe UI",
          Roboto, sans-serif);
        font-size: var(--mh-text-md);
      }
      .root {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      /* Top-Header: ruhig, neutral, mit dezenter Bottom-Border */
      header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--mh-space-4);
        padding: var(--mh-space-3) var(--mh-space-5);
        background: var(--mh-surface);
        border-bottom: 1px solid var(--mh-divider);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .logo {
        display: inline-flex;
        align-items: center;
        line-height: 0;
      }
      .logo svg {
        border-radius: 6px;
      }
      h1 {
        font-size: var(--mh-text-lg);
        margin: 0;
        font-weight: var(--mh-weight-semibold);
        letter-spacing: -0.01em;
      }

      /* Segmented Tabs: ein gemeinsamer Container, klare aktiv/inaktiv-States */
      .tabs {
        display: inline-flex;
        gap: 2px;
        background: var(--mh-surface-2);
        padding: 4px;
        border-radius: var(--mh-radius-md);
        justify-self: center;
      }
      .tab {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 6px 14px;
        font: inherit;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg-muted);
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
        transition: background var(--mh-transition-fast), color var(--mh-transition-fast);
      }
      .tab:hover {
        color: var(--mh-fg);
      }
      .tab:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: var(--mh-focus-offset);
      }
      .tab.active {
        background: var(--mh-surface);
        color: var(--mh-fg);
        font-weight: var(--mh-weight-semibold);
        box-shadow: var(--mh-shadow-1);
      }
      .header-actions {
        display: flex;
        gap: var(--mh-space-2);
        align-items: center;
        justify-self: end;
      }
      @media (max-width: 720px) {
        header {
          grid-template-columns: 1fr auto;
          row-gap: var(--mh-space-2);
        }
        .tabs {
          grid-column: 1 / -1;
          justify-self: stretch;
          overflow-x: auto;
        }
      }

      main {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Filter-Bar */
      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
        padding: var(--mh-space-3) var(--mh-space-5);
        border-bottom: 1px solid var(--mh-divider);
        background: var(--mh-surface);
        align-items: center;
      }
      @media (max-width: 600px) {
        .filter-bar {
          padding: var(--mh-space-2);
        }
        .filter-bar > * {
          flex: 1 1 auto;
        }
      }
      input.search {
        padding: 7px 12px;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        min-width: 200px;
        flex: 1;
        max-width: 320px;
        font: inherit;
        font-size: var(--mh-text-sm);
        background: var(--mh-surface);
        color: var(--mh-fg);
        transition: border-color var(--mh-transition-fast), box-shadow var(--mh-transition-fast);
      }
      input.search:focus-visible {
        outline: none;
        border-color: var(--mh-accent);
        box-shadow: 0 0 0 3px var(--mh-accent-soft);
      }
      .filter-reset {
        padding: 6px 12px;
        border: 1px solid var(--mh-divider);
        background: transparent;
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
        color: var(--mh-fg-muted);
        font: inherit;
        font-size: var(--mh-text-xs);
      }
      .filter-reset:hover {
        background: var(--mh-surface-2);
        color: var(--mh-fg);
      }

      /* Status-Bar */
      .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--mh-space-2) var(--mh-space-5);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        background: var(--mh-bg);
        border-bottom: 1px solid var(--mh-divider);
      }
      .status-count {
        display: inline-flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .status-count strong {
        color: var(--mh-fg);
        font-variant-numeric: tabular-nums;
      }
      .status-count .muted {
        color: var(--mh-fg-muted);
      }
      .new-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: var(--mh-accent);
        color: var(--mh-accent-fg);
        border-radius: var(--mh-radius-pill);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        animation: pulse 1.4s ease-in-out infinite alternate;
      }
      @keyframes pulse {
        from {
          opacity: 0.65;
        }
        to {
          opacity: 1;
        }
      }
      .status-actions {
        display: flex;
        gap: var(--mh-space-2);
        flex-wrap: wrap;
        align-items: center;
      }
      a.mh-btn {
        text-decoration: none;
      }

      /* Overflow-Menu */
      .overflow {
        position: relative;
      }
      .overflow-menu {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        z-index: 50;
        min-width: 240px;
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        padding: 4px;
        animation: menu-in 120ms ease-out;
      }
      @keyframes menu-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .overflow-item {
        display: block;
        width: 100%;
        text-align: left;
        background: transparent;
        border: 0;
        padding: 8px 12px;
        border-radius: var(--mh-radius-sm);
        font: inherit;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
        cursor: pointer;
      }
      .overflow-item:hover:not(:disabled) {
        background: var(--mh-surface-2);
      }
      .overflow-item:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .overflow-item.danger {
        color: var(--mh-error);
      }
      .overflow-item.danger:hover:not(:disabled) {
        background: var(--mh-error-soft);
      }

      /* Empty-State */
      .empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--mh-space-7) var(--mh-space-5);
        text-align: center;
        color: var(--mh-fg-muted);
      }
      .empty h3 {
        margin: 0 0 var(--mh-space-2) 0;
        color: var(--mh-fg);
        font-size: var(--mh-text-lg);
      }
      .empty p {
        margin: 0 0 var(--mh-space-5) 0;
        max-width: 460px;
        line-height: 1.5;
      }
      .empty-actions {
        display: flex;
        gap: var(--mh-space-2);
        flex-wrap: wrap;
        justify-content: center;
      }

      /* Toast */
      .toast {
        position: fixed;
        bottom: var(--mh-space-5);
        right: var(--mh-space-5);
        background: var(--mh-fg);
        color: var(--mh-bg);
        padding: var(--mh-space-3) var(--mh-space-4);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        font-size: var(--mh-text-sm);
        z-index: 100;
        animation: slidein 200ms ease-out;
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
    `
];
P([
  f({ attribute: !1 })
], A.prototype, "hass", 2);
P([
  f({ type: Boolean })
], A.prototype, "narrow", 2);
P([
  f({ attribute: !1 })
], A.prototype, "panel", 2);
P([
  l()
], A.prototype, "_tab", 2);
P([
  l()
], A.prototype, "_items", 2);
P([
  l()
], A.prototype, "_total", 2);
P([
  l()
], A.prototype, "_loading", 2);
P([
  l()
], A.prototype, "_selected", 2);
P([
  l()
], A.prototype, "_filters", 2);
P([
  l()
], A.prototype, "_newCount", 2);
P([
  l()
], A.prototype, "_testing", 2);
P([
  l()
], A.prototype, "_toast", 2);
P([
  l()
], A.prototype, "_overflowOpen", 2);
A = P([
  $("messagehub-panel")
], A);
export {
  A as MessageHubPanel
};
