/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ye = globalThis, Ie = ye.ShadowRoot && (ye.ShadyCSS === void 0 || ye.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Fe = Symbol(), qe = /* @__PURE__ */ new WeakMap();
let xt = class {
  constructor(e, s, a) {
    if (this._$cssResult$ = !0, a !== Fe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (Ie && e === void 0) {
      const a = s !== void 0 && s.length === 1;
      a && (e = qe.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), a && qe.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Ot = (t) => new xt(typeof t == "string" ? t : t + "", void 0, Fe), x = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((a, r, i) => a + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + t[i + 1], t[0]);
  return new xt(s, t, Fe);
}, Ct = (t, e) => {
  if (Ie) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const a = document.createElement("style"), r = ye.litNonce;
    r !== void 0 && a.setAttribute("nonce", r), a.textContent = s.cssText, t.appendChild(a);
  }
}, Je = Ie ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const a of e.cssRules) s += a.cssText;
  return Ot(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Mt, defineProperty: Lt, getOwnPropertyDescriptor: Nt, getOwnPropertyNames: Ht, getOwnPropertySymbols: jt, getPrototypeOf: It } = Object, F = globalThis, Ye = F.trustedTypes, Ft = Ye ? Ye.emptyScript : "", De = F.reactiveElementPolyfillSupport, le = (t, e) => t, $e = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Ft : null;
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
} }, Ue = (t, e) => !Mt(t, e), Qe = { attribute: !0, type: String, converter: $e, reflect: !1, useDefault: !1, hasChanged: Ue };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), F.litPropertyMetadata ?? (F.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let ee = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = Qe) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const a = Symbol(), r = this.getPropertyDescriptor(e, a, s);
      r !== void 0 && Lt(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, s, a) {
    const { get: r, set: i } = Nt(this.prototype, e) ?? { get() {
      return this[s];
    }, set(n) {
      this[s] = n;
    } };
    return { get: r, set(n) {
      const c = r == null ? void 0 : r.call(this);
      i == null || i.call(this, n), this.requestUpdate(e, c, a);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Qe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(le("elementProperties"))) return;
    const e = It(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(le("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(le("properties"))) {
      const s = this.properties, a = [...Ht(s), ...jt(s)];
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
      for (const r of a) s.unshift(Je(r));
    } else e !== void 0 && s.push(Je(e));
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
    return Ct(e, this.constructor.elementStyles), e;
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
    var i;
    const a = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, a);
    if (r !== void 0 && a.reflect === !0) {
      const n = (((i = a.converter) == null ? void 0 : i.toAttribute) !== void 0 ? a.converter : $e).toAttribute(s, a.type);
      this._$Em = e, n == null ? this.removeAttribute(r) : this.setAttribute(r, n), this._$Em = null;
    }
  }
  _$AK(e, s) {
    var i, n;
    const a = this.constructor, r = a._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const c = a.getPropertyOptions(r), d = typeof c.converter == "function" ? { fromAttribute: c.converter } : ((i = c.converter) == null ? void 0 : i.fromAttribute) !== void 0 ? c.converter : $e;
      this._$Em = r;
      const u = d.fromAttribute(s, c.type);
      this[r] = u ?? ((n = this._$Ej) == null ? void 0 : n.get(r)) ?? u, this._$Em = null;
    }
  }
  requestUpdate(e, s, a, r = !1, i) {
    var n;
    if (e !== void 0) {
      const c = this.constructor;
      if (r === !1 && (i = this[e]), a ?? (a = c.getPropertyOptions(e)), !((a.hasChanged ?? Ue)(i, s) || a.useDefault && a.reflect && i === ((n = this._$Ej) == null ? void 0 : n.get(e)) && !this.hasAttribute(c._$Eu(e, a)))) return;
      this.C(e, s, a);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: a, reflect: r, wrapped: i }, n) {
    a && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, n ?? s ?? this[e]), i !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || a || (s = void 0), this._$AL.set(e, s)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
        for (const [i, n] of this._$Ep) this[i] = n;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [i, n] of r) {
        const { wrapped: c } = n, d = this[i];
        c !== !0 || this._$AL.has(i) || d === void 0 || this.C(i, void 0, n, d);
      }
    }
    let e = !1;
    const s = this._$AL;
    try {
      e = this.shouldUpdate(s), e ? (this.willUpdate(s), (a = this._$EO) == null || a.forEach((r) => {
        var i;
        return (i = r.hostUpdate) == null ? void 0 : i.call(r);
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
ee.elementStyles = [], ee.shadowRootOptions = { mode: "open" }, ee[le("elementProperties")] = /* @__PURE__ */ new Map(), ee[le("finalized")] = /* @__PURE__ */ new Map(), De == null || De({ ReactiveElement: ee }), (F.reactiveElementVersions ?? (F.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const de = globalThis, Xe = (t) => t, ke = de.trustedTypes, Ze = ke ? ke.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, wt = "$lit$", I = `lit$${Math.random().toFixed(9).slice(2)}$`, yt = "?" + I, Ut = `<${yt}>`, V = document, ce = () => V.createComment(""), he = (t) => t === null || typeof t != "object" && typeof t != "function", Re = Array.isArray, Rt = (t) => Re(t) || typeof (t == null ? void 0 : t[Symbol.iterator]) == "function", Oe = `[ 	
\f\r]`, oe = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, et = /-->/g, tt = />/g, B = RegExp(`>|${Oe}(?:([^\\s"'>=/]+)(${Oe}*=${Oe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), st = /'/g, at = /"/g, $t = /^(?:script|style|textarea|title)$/i, Bt = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), o = Bt(1), q = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), rt = /* @__PURE__ */ new WeakMap(), G = V.createTreeWalker(V, 129);
function kt(t, e) {
  if (!Re(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ze !== void 0 ? Ze.createHTML(e) : e;
}
const Kt = (t, e) => {
  const s = t.length - 1, a = [];
  let r, i = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = oe;
  for (let c = 0; c < s; c++) {
    const d = t[c];
    let u, b, p = -1, v = 0;
    for (; v < d.length && (n.lastIndex = v, b = n.exec(d), b !== null); ) v = n.lastIndex, n === oe ? b[1] === "!--" ? n = et : b[1] !== void 0 ? n = tt : b[2] !== void 0 ? ($t.test(b[2]) && (r = RegExp("</" + b[2], "g")), n = B) : b[3] !== void 0 && (n = B) : n === B ? b[0] === ">" ? (n = r ?? oe, p = -1) : b[1] === void 0 ? p = -2 : (p = n.lastIndex - b[2].length, u = b[1], n = b[3] === void 0 ? B : b[3] === '"' ? at : st) : n === at || n === st ? n = B : n === et || n === tt ? n = oe : (n = B, r = void 0);
    const g = n === B && t[c + 1].startsWith("/>") ? " " : "";
    i += n === oe ? d + Ut : p >= 0 ? (a.push(u), d.slice(0, p) + wt + d.slice(p) + I + g) : d + I + (p === -2 ? c : g);
  }
  return [kt(t, i + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), a];
};
class pe {
  constructor({ strings: e, _$litType$: s }, a) {
    let r;
    this.parts = [];
    let i = 0, n = 0;
    const c = e.length - 1, d = this.parts, [u, b] = Kt(e, s);
    if (this.el = pe.createElement(u, a), G.currentNode = this.el.content, s === 2 || s === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (r = G.nextNode()) !== null && d.length < c; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const p of r.getAttributeNames()) if (p.endsWith(wt)) {
          const v = b[n++], g = r.getAttribute(p).split(I), m = /([.?@])?(.*)/.exec(v);
          d.push({ type: 1, index: i, name: m[2], strings: g, ctor: m[1] === "." ? Wt : m[1] === "?" ? Vt : m[1] === "@" ? qt : Te }), r.removeAttribute(p);
        } else p.startsWith(I) && (d.push({ type: 6, index: i }), r.removeAttribute(p));
        if ($t.test(r.tagName)) {
          const p = r.textContent.split(I), v = p.length - 1;
          if (v > 0) {
            r.textContent = ke ? ke.emptyScript : "";
            for (let g = 0; g < v; g++) r.append(p[g], ce()), G.nextNode(), d.push({ type: 2, index: ++i });
            r.append(p[v], ce());
          }
        }
      } else if (r.nodeType === 8) if (r.data === yt) d.push({ type: 2, index: i });
      else {
        let p = -1;
        for (; (p = r.data.indexOf(I, p + 1)) !== -1; ) d.push({ type: 7, index: i }), p += I.length - 1;
      }
      i++;
    }
  }
  static createElement(e, s) {
    const a = V.createElement("template");
    return a.innerHTML = e, a;
  }
}
function te(t, e, s = t, a) {
  var n, c;
  if (e === q) return e;
  let r = a !== void 0 ? (n = s._$Co) == null ? void 0 : n[a] : s._$Cl;
  const i = he(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== i && ((c = r == null ? void 0 : r._$AO) == null || c.call(r, !1), i === void 0 ? r = void 0 : (r = new i(t), r._$AT(t, s, a)), a !== void 0 ? (s._$Co ?? (s._$Co = []))[a] = r : s._$Cl = r), r !== void 0 && (e = te(t, r._$AS(t, e.values), r, a)), e;
}
class Gt {
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
    let i = G.nextNode(), n = 0, c = 0, d = a[0];
    for (; d !== void 0; ) {
      if (n === d.index) {
        let u;
        d.type === 2 ? u = new ie(i, i.nextSibling, this, e) : d.type === 1 ? u = new d.ctor(i, d.name, d.strings, this, e) : d.type === 6 && (u = new Jt(i, this, e)), this._$AV.push(u), d = a[++c];
      }
      n !== (d == null ? void 0 : d.index) && (i = G.nextNode(), n++);
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
    e = te(this, e, s), he(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== q && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Rt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== h && he(this._$AH) ? this._$AA.nextSibling.data = e : this.T(V.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var i;
    const { values: s, _$litType$: a } = e, r = typeof a == "number" ? this._$AC(e) : (a.el === void 0 && (a.el = pe.createElement(kt(a.h, a.h[0]), this.options)), a);
    if (((i = this._$AH) == null ? void 0 : i._$AD) === r) this._$AH.p(s);
    else {
      const n = new Gt(r, this), c = n.u(this.options);
      n.p(s), this.T(c), this._$AH = n;
    }
  }
  _$AC(e) {
    let s = rt.get(e.strings);
    return s === void 0 && rt.set(e.strings, s = new pe(e)), s;
  }
  k(e) {
    Re(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let a, r = 0;
    for (const i of e) r === s.length ? s.push(a = new ie(this.O(ce()), this.O(ce()), this, this.options)) : a = s[r], a._$AI(i), r++;
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
class Te {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, s, a, r, i) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = s, this._$AM = r, this.options = i, a.length > 2 || a[0] !== "" || a[1] !== "" ? (this._$AH = Array(a.length - 1).fill(new String()), this.strings = a) : this._$AH = h;
  }
  _$AI(e, s = this, a, r) {
    const i = this.strings;
    let n = !1;
    if (i === void 0) e = te(this, e, s, 0), n = !he(e) || e !== this._$AH && e !== q, n && (this._$AH = e);
    else {
      const c = e;
      let d, u;
      for (e = i[0], d = 0; d < i.length - 1; d++) u = te(this, c[a + d], s, d), u === q && (u = this._$AH[d]), n || (n = !he(u) || u !== this._$AH[d]), u === h ? e = h : e !== h && (e += (u ?? "") + i[d + 1]), this._$AH[d] = u;
    }
    n && !r && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Wt extends Te {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class Vt extends Te {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class qt extends Te {
  constructor(e, s, a, r, i) {
    super(e, s, a, r, i), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = te(this, e, s, 0) ?? h) === q) return;
    const a = this._$AH, r = e === h && a !== h || e.capture !== a.capture || e.once !== a.once || e.passive !== a.passive, i = e !== h && (a === h || r);
    r && this.element.removeEventListener(this.name, this, a), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var s;
    typeof this._$AH == "function" ? this._$AH.call(((s = this.options) == null ? void 0 : s.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Jt {
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
const Yt = { I: ie }, Ce = de.litHtmlPolyfillSupport;
Ce == null || Ce(pe, ie), (de.litHtmlVersions ?? (de.litHtmlVersions = [])).push("3.3.2");
const Qt = (t, e, s) => {
  const a = (s == null ? void 0 : s.renderBefore) ?? e;
  let r = a._$litPart$;
  if (r === void 0) {
    const i = (s == null ? void 0 : s.renderBefore) ?? null;
    a._$litPart$ = r = new ie(e.insertBefore(ce(), i), i, void 0, s ?? {});
  }
  return r._$AI(t), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const W = globalThis;
let _ = class extends ee {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Qt(s, this.renderRoot, this.renderOptions);
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
var _t;
_._$litElement$ = !0, _.finalized = !0, (_t = W.litElementHydrateSupport) == null || _t.call(W, { LitElement: _ });
const Me = W.litElementPolyfillSupport;
Me == null || Me({ LitElement: _ });
(W.litElementVersions ?? (W.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Xt = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Zt = { attribute: !0, type: String, converter: $e, reflect: !1, hasChanged: Ue }, es = (t = Zt, e, s) => {
  const { kind: a, metadata: r } = s;
  let i = globalThis.litPropertyMetadata.get(r);
  if (i === void 0 && globalThis.litPropertyMetadata.set(r, i = /* @__PURE__ */ new Map()), a === "setter" && ((t = Object.create(t)).wrapped = !0), i.set(s.name, t), a === "accessor") {
    const { name: n } = s;
    return { set(c) {
      const d = e.get.call(this);
      e.set.call(this, c), this.requestUpdate(n, d, t, !0, c);
    }, init(c) {
      return c !== void 0 && this.C(n, void 0, t, c), c;
    } };
  }
  if (a === "setter") {
    const { name: n } = s;
    return function(c) {
      const d = this[n];
      e.call(this, c), this.requestUpdate(n, d, t, !0, c);
    };
  }
  throw Error("Unsupported decorator location: " + a);
};
function f(t) {
  return (e, s) => typeof s == "object" ? es(t, e, s) : ((a, r, i) => {
    const n = r.hasOwnProperty(i);
    return r.constructor.createProperty(i, a), n ? Object.getOwnPropertyDescriptor(r, i) : void 0;
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
function y(t) {
  const e = Xt(t);
  return (s, a) => customElements.get(t) ? s : e(s, a);
}
class ts {
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
    var i;
    const s = new URLSearchParams();
    (i = e.severity) != null && i.length && s.set("severity", e.severity.join(",")), e.source && s.set("source", e.source), e.search && s.set("search", e.search), e.from && s.set("from", e.from), e.to && s.set("to", e.to), e.limit !== void 0 && s.set("limit", String(e.limit)), e.offset !== void 0 && s.set("offset", String(e.offset)), e.order && s.set("order", e.order);
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
  async discoverKnxFromProject() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/knx-discovery`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return await e.json();
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
  async unacknowledgeKnxGa(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge/${encodeURIComponent(e)}`, a = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async acknowledgeKnxBulk(e, s = {}) {
    const a = new URLSearchParams();
    s.from && a.set("from", s.from), s.to && a.set("to", s.to);
    const r = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge-bulk?${a.toString()}`, i = { dev_source: e };
    s.note !== void 0 && (i.note = s.note), s.expiryDays !== void 0 && (i.expiry_days = s.expiryDays);
    const n = await fetch(r, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(i)
    });
    if (!n.ok) throw new Error(`HTTP ${n.status}: ${await n.text()}`);
    return await n.json();
  }
}
const O = x`
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
`, ge = x`
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
`, St = x`
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
`, Be = x`
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
`, ve = x`
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
const ss = { CHILD: 2 }, as = (t) => (...e) => ({ _$litDirective$: t, values: e });
let rs = class {
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
const { I: is } = Yt, it = (t) => t, ot = () => document.createComment(""), ne = (t, e, s) => {
  var i;
  const a = t._$AA.parentNode, r = e === void 0 ? t._$AB : e._$AA;
  if (s === void 0) {
    const n = a.insertBefore(ot(), r), c = a.insertBefore(ot(), r);
    s = new is(n, c, t, t.options);
  } else {
    const n = s._$AB.nextSibling, c = s._$AM, d = c !== t;
    if (d) {
      let u;
      (i = s._$AQ) == null || i.call(s, t), s._$AM = t, s._$AP !== void 0 && (u = t._$AU) !== c._$AU && s._$AP(u);
    }
    if (n !== r || d) {
      let u = s._$AA;
      for (; u !== n; ) {
        const b = it(u).nextSibling;
        it(a).insertBefore(u, r), u = b;
      }
    }
  }
  return s;
}, K = (t, e, s = t) => (t._$AI(e, s), t), os = {}, ns = (t, e = os) => t._$AH = e, ls = (t) => t._$AH, Le = (t) => {
  t._$AR(), t._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const nt = (t, e, s) => {
  const a = /* @__PURE__ */ new Map();
  for (let r = e; r <= s; r++) a.set(t[r], r);
  return a;
}, ds = as(class extends rs {
  constructor(t) {
    if (super(t), t.type !== ss.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(t, e, s) {
    let a;
    s === void 0 ? s = e : e !== void 0 && (a = e);
    const r = [], i = [];
    let n = 0;
    for (const c of t) r[n] = a ? a(c, n) : n, i[n] = s(c, n), n++;
    return { values: i, keys: r };
  }
  render(t, e, s) {
    return this.dt(t, e, s).values;
  }
  update(t, [e, s, a]) {
    const r = ls(t), { values: i, keys: n } = this.dt(e, s, a);
    if (!Array.isArray(r)) return this.ut = n, i;
    const c = this.ut ?? (this.ut = []), d = [];
    let u, b, p = 0, v = r.length - 1, g = 0, m = i.length - 1;
    for (; p <= v && g <= m; ) if (r[p] === null) p++;
    else if (r[v] === null) v--;
    else if (c[p] === n[g]) d[g] = K(r[p], i[g]), p++, g++;
    else if (c[v] === n[m]) d[m] = K(r[v], i[m]), v--, m--;
    else if (c[p] === n[m]) d[m] = K(r[p], i[m]), ne(t, d[m + 1], r[p]), p++, m--;
    else if (c[v] === n[g]) d[g] = K(r[v], i[g]), ne(t, r[p], r[v]), v--, g++;
    else if (u === void 0 && (u = nt(n, g, m), b = nt(c, p, v)), u.has(c[p])) if (u.has(c[v])) {
      const P = b.get(n[g]), ze = P !== void 0 ? r[P] : null;
      if (ze === null) {
        const Ve = ne(t, r[p]);
        K(Ve, i[g]), d[g] = Ve;
      } else d[g] = K(ze, i[g]), ne(t, r[p], ze), r[P] = null;
      g++;
    } else Le(r[v]), v--;
    else Le(r[p]), p++;
    for (; g <= m; ) {
      const P = ne(t, d[m + 1]);
      K(P, i[g]), d[g++] = P;
    }
    for (; p <= v; ) {
      const P = r[p++];
      P !== null && Le(P);
    }
    return this.ut = n, ns(t, d), q;
  }
}), cs = new Intl.RelativeTimeFormat("de", { numeric: "auto" }), hs = [
  { unit: "year", seconds: 31536e3 },
  { unit: "month", seconds: 2592e3 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 }
];
function Tt(t, e = /* @__PURE__ */ new Date()) {
  const s = new Date(t);
  if (Number.isNaN(s.getTime())) return "—";
  const a = Math.round((s.getTime() - e.getTime()) / 1e3), r = Math.abs(a);
  if (r < 5) return "gerade eben";
  for (const { unit: i, seconds: n } of hs)
    if (r >= n) {
      const c = Math.round(a / n);
      return cs.format(c, i);
    }
  return "gerade eben";
}
function At(t, e = /* @__PURE__ */ new Date()) {
  const s = new Date(t);
  if (Number.isNaN(s.getTime())) return t;
  const a = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate(), r = s.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  return a ? r : `${s.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} ${r}`;
}
var ps = Object.defineProperty, us = Object.getOwnPropertyDescriptor, fe = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? us(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && ps(e, s, r), r;
};
const lt = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·"
}, dt = {
  error: "Error",
  warning: "Warn",
  info: "Info",
  debug: "Debug"
}, ms = ["error", "warning", "info", "debug"];
let J = class extends _ {
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
      const a = t.currentTarget.getBoundingClientRect(), r = 200, i = a.bottom + r < window.innerHeight;
      this._popoverPos = {
        top: i ? a.bottom + 4 : a.top - r - 4,
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
      return o``;
    const t = this.items.find((a) => a.id === this._editSeverityFor);
    if (!t) return o``;
    const e = t.severity ?? "info", s = t.id;
    return o`
      <div class="popover-backdrop" @click=${() => this._closePopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._popoverPos.top}px; left: ${this._popoverPos.left}px`}
        @click=${(a) => a.stopPropagation()}
      >
        ${ms.map(
      (a) => o`<button
            role="menuitemradio"
            aria-checked=${a === e}
            class=${`sev-option ${a === e ? "active" : ""}`}
            @click=${(r) => this._onSeverityPick(r, s, e, a)}
          >
            <span class=${`mh-pill mh-pill--${a}`}>
              <span class="sev-icon" aria-hidden="true">${lt[a]}</span>
              ${dt[a]}
            </span>
            ${a === e ? o`<span class="check" aria-hidden="true">✓</span>` : h}
          </button>`
    )}
      </div>
    `;
  }
  _renderHeader() {
    return o`
      <div class="header" role="row">
        <span class="col-sev" role="columnheader">Severity</span>
        <span class="col-ts" role="columnheader">Zeit</span>
        <span class="col-src" role="columnheader">Quelle</span>
        <span class="col-text" role="columnheader">Nachricht</span>
      </div>
    `;
  }
  render() {
    return this.items.length ? o`
      <div class="root">
        ${this._renderHeader()}
        <div class="scroll" role="list">
          ${ds(
      this.items,
      (t) => t.id,
      (t) => {
        const e = t.severity ?? "info", s = dt[e] ?? e, a = lt[e] ?? "·", r = Tt(t.timestamp, this._now), i = At(t.timestamp, this._now);
        return o`
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
                  <span class="col-ts ts" title=${i}>${r}</span>
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
    ` : o`
        <div class="root">
          ${this._renderHeader()}
          <div class="empty">Keine Nachrichten</div>
        </div>
      `;
  }
};
J.styles = [
  O,
  ve,
  x`
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
fe([
  f({ attribute: !1 })
], J.prototype, "items", 2);
fe([
  l()
], J.prototype, "_now", 2);
fe([
  l()
], J.prototype, "_editSeverityFor", 2);
fe([
  l()
], J.prototype, "_popoverPos", 2);
J = fe([
  y("message-table")
], J);
var gs = Object.defineProperty, vs = Object.getOwnPropertyDescriptor, Pt = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? vs(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && gs(e, s, r), r;
};
const ct = ["error", "warning", "info", "debug"];
let Se = class extends _ {
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
    return o`
      <div class="chips" role="group" aria-label="Severity-Filter">
        ${ct.map((t) => {
      const e = this.selected.includes(t);
      return o`<button
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
Se.styles = [
  O,
  x`
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
], Se.prototype, "selected", 2);
Se = Pt([
  y("severity-filter")
], Se);
var fs = Object.defineProperty, bs = Object.getOwnPropertyDescriptor, Ae = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? bs(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && fs(e, s, r), r;
};
let se = class extends _ {
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
    return o`
      <select @change=${this._onChange} .value=${this.selected}>
        <option value="">Alle Quellen</option>
        ${this._sources.map((t) => o`<option value=${t}>${t}</option>`)}
      </select>
    `;
  }
};
se.styles = x`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `;
Ae([
  f({ attribute: !1 })
], se.prototype, "api", 2);
Ae([
  f({ attribute: !1 })
], se.prototype, "selected", 2);
Ae([
  l()
], se.prototype, "_sources", 2);
se = Ae([
  y("source-filter")
], se);
var _s = Object.defineProperty, xs = Object.getOwnPropertyDescriptor, Ke = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? xs(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && _s(e, s, r), r;
};
let ue = class extends _ {
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
    return o`
      <div class="presets">
        <button @click=${() => this._set("1h")}>1h</button>
        <button @click=${() => this._set("24h")}>24h</button>
        <button @click=${() => this._set("7d")}>7d</button>
        <button @click=${() => this._set("all")}>Alle</button>
      </div>
    `;
  }
};
ue.styles = x`
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
Ke([
  f({ attribute: !1 })
], ue.prototype, "fromIso", 2);
Ke([
  f({ attribute: !1 })
], ue.prototype, "toIso", 2);
ue = Ke([
  y("time-range-filter")
], ue);
var ws = Object.defineProperty, ys = Object.getOwnPropertyDescriptor, R = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? ys(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && ws(e, s, r), r;
};
let C = class extends _ {
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
    return o`<span class=${`status-badge status-${this._status}`}>
      ${t[this._status] ?? this._status}
    </span>`;
  }
  render() {
    return o`
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

        ${this.msg.metadata ? o`<h3>Metadata</h3>
              <pre class="meta">${JSON.stringify(this.msg.metadata, null, 2)}</pre>` : h}

        <h3>Tags</h3>
        <div class="tags">
          ${this._tags.length === 0 ? o`<span class="hint">keine Tags</span>` : this._tags.map(
      (t) => o`
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

        ${this._runbook ? o`<h3>Runbook: ${this._runbook.title}</h3>
              <pre class="runbook">${this._runbook.markdown}</pre>` : h}

        <footer>
          <button class="del" @click=${this._delete}>Löschen</button>
        </footer>
      </aside>
    `;
  }
};
C.styles = x`
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
R([
  f({ attribute: !1 })
], C.prototype, "msg", 2);
R([
  f({ attribute: !1 })
], C.prototype, "api", 2);
R([
  l()
], C.prototype, "_status", 2);
R([
  l()
], C.prototype, "_tags", 2);
R([
  l()
], C.prototype, "_newTag", 2);
R([
  l()
], C.prototype, "_runbook", 2);
R([
  l()
], C.prototype, "_busy", 2);
C = R([
  y("detail-pane")
], C);
var $s = Object.defineProperty, ks = Object.getOwnPropertyDescriptor, M = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? ks(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && $s(e, s, r), r;
};
const Ss = ["debug", "info", "warning", "error"], Ts = JSON.stringify(
  {
    severity: "$.level",
    source: "$.app.name",
    text: "$.message",
    metadata: "$.extra"
  },
  null,
  2
), Ne = /^[a-z0-9._-]{1,64}$/;
function As(t) {
  return t.toLowerCase().normalize("NFKD").replaceAll(/[äÄ]/g, "ae").replaceAll(/[öÖ]/g, "oe").replaceAll(/[üÜ]/g, "ue").replaceAll(/ß/g, "ss").replaceAll(/[\s/\\]+/g, "-").replaceAll(/[^a-z0-9._-]/g, "").slice(0, 64);
}
let z = class extends _ {
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
        if (!Ne.test(this._source))
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
    this._mappingText = Ts;
  }
  render() {
    const t = this.editing !== null;
    return o`
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
              ${this._source && Ne.test(this._source) ? o`<span class="ok-badge" title="ok">✓</span>` : null}
            </span>
            <input
              type="text"
              class=${this._source && !Ne.test(this._source) ? "invalid" : ""}
              .value=${this._source}
              @input=${(e) => {
      const s = e.target.value;
      this._source = As(s);
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
              ${Ss.map(
      (e) => o`<option value=${e} ?selected=${this._severity === e}>${e}</option>`
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

        ${this._error ? o`<div class="error">${this._error}</div>` : null}

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
z.styles = x`
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
M([
  f({ attribute: !1 })
], z.prototype, "api", 2);
M([
  f({ attribute: !1 })
], z.prototype, "editing", 2);
M([
  l()
], z.prototype, "_name", 2);
M([
  l()
], z.prototype, "_source", 2);
M([
  l()
], z.prototype, "_severity", 2);
M([
  l()
], z.prototype, "_enabled", 2);
M([
  l()
], z.prototype, "_mappingText", 2);
M([
  l()
], z.prototype, "_error", 2);
M([
  l()
], z.prototype, "_saving", 2);
z = M([
  y("webhook-form")
], z);
var Ps = Object.defineProperty, Es = Object.getOwnPropertyDescriptor, A = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Es(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Ps(e, s, r), r;
};
const zs = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/, He = ["debug", "info", "warning", "error"], ht = [...He, "auto"];
let $ = class extends _ {
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
    return o`<div class="discovery-status">${e}</div>`;
  }
  _onAddressInput(t) {
    const e = t.target.value;
    this._newAddr = e;
    const s = this._discovery.find((a) => a.address === e);
    s && (this._newLabel.trim() || (this._newLabel = s.name), !this._newDpt.trim() && s.dpt && (this._newDpt = s.dpt));
  }
  async _bulkImportFromProject() {
    if (!this.api || this._discovery.length === 0) return;
    const t = new Set(this._items.map((a) => a.address)), e = this._discovery.filter((a) => !t.has(a.address));
    if (e.length === 0) {
      this._showToast("Alle Projekt-GAs sind bereits angelegt");
      return;
    }
    if (!window.confirm(
      `${e.length} fehlende Projekt-GAs anlegen? (Logging bleibt zunächst aus, Severity-Mapping kannst du danach pro Adresse setzen.)`
    ))
      return;
    let s = 0;
    for (const a of e)
      try {
        await this.api.upsertKnxAddress({
          address: a.address,
          label: a.name || a.address,
          dpt: a.dpt,
          log_enabled: !1,
          log_severity: "info"
        }), s += 1;
      } catch {
      }
    this._showToast(`${s} aus ETS-Projekt übernommen`), await this._load();
  }
  async _add() {
    if (this._error = "", !this.api) return;
    const t = this._newAddr.trim();
    if (!zs.test(t)) {
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
        log_severity: "info"
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
    const a = t.currentTarget.getBoundingClientRect(), r = 220, i = a.bottom + r < window.innerHeight;
    this._sevPopoverPos = {
      top: i ? a.bottom + 4 : a.top - r - 4,
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
      (i) => i.address === e.address ? {
        ...i,
        log_severity: s,
        severity_on_true: a.severity_on_true ?? i.severity_on_true,
        severity_on_false: a.severity_on_false ?? i.severity_on_false
      } : i
    );
    try {
      await this.api.upsertKnxAddress({ ...e, ...a }), this._showToast(`${e.address}: Severity ${r} → ${s}`);
    } catch (i) {
      this._items = this._items.map(
        (n) => n.address === e.address ? { ...n, log_severity: r } : n
      ), this._showToast(`Fehlgeschlagen: ${i.message}`);
    }
  }
  _renderSevPopover() {
    if (this._sevPopoverFor === null || this._sevPopoverPos === null) return h;
    const t = this._items.find((s) => s.address === this._sevPopoverFor);
    if (!t) return h;
    const e = t.log_severity;
    return o`
      <div class="sev-backdrop" @click=${() => this._closeSevPopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._sevPopoverPos.top}px; left: ${this._sevPopoverPos.left}px`}
        @click=${(s) => s.stopPropagation()}
      >
        ${ht.map(
      (s) => o`<button
            role="menuitemradio"
            aria-checked=${s === e}
            class=${`sev-option ${s === e ? "active" : ""}`}
            @click=${(a) => void this._onSeverityPick(a, t, s)}
          >
            <span
              class=${`mh-pill mh-pill--${s === "auto" ? "neutral" : s}`}
            >${s}</span>
            ${s === e ? o`<span class="sev-check" aria-hidden="true">✓</span>` : h}
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
    return o`
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

          ${t.log_enabled ? o`
                <label>
                  <span>Severity</span>
                  <select
                    .value=${t.log_severity}
                    @change=${(s) => {
      const a = s.target.value;
      e({ log_severity: a });
    }}
                  >
                    ${ht.map(
      (s) => o`<option value=${s}>${s}</option>`
    )}
                  </select>
                  <small>
                    <code>auto</code> nutzt für Boolean-DPTs (1.x) die
                    Severity-Map unten — z. B. für Stör-Bits, die bei
                    <code>True</code> einen Fehler bedeuten.
                  </small>
                </label>
                ${t.log_severity === "auto" ? o`<div class="row-2">
                      <label>
                        <span>Severity bei <code>True</code></span>
                        <select
                          .value=${t.severity_on_true ?? "warning"}
                          @change=${(s) => e({
      severity_on_true: s.target.value
    })}
                        >
                          ${He.map(
      (s) => o`<option value=${s}>${s}</option>`
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
                          ${He.map(
      (s) => o`<option value=${s}>${s}</option>`
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
    return o`
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
            ${this._discovery.length > 0 ? o`<button
                  class="mh-btn mh-btn--primary"
                  title=${`${this._discovery.length} GAs aus dem in HA hinterlegten ETS-Projekt`}
                  @click=${() => void this._bulkImportFromProject()}
                >
                  ✨ ${this._discovery.length} aus HA-KNX-Projekt übernehmen
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
      (s) => o`<option value=${s.address}>
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
        ${this._discovery.length > 0 ? o`<p class="hint">
              💡 Tipp: Beim Tippen in das GA-Feld erscheinen Vorschläge aus dem
              ETS-Projekt — Label und DPT werden dann automatisch vorbefüllt.
            </p>` : null}
        ${this._renderDiscoveryStatus()}
        ${this._error ? o`<div class="error">${this._error}</div>` : h}

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

        ${this._loading ? o`<p class="muted">lade…</p>` : t.length === 0 ? o`<div class="empty">
                ${this._items.length === 0 ? o`<p>
                      Noch keine Adressen. Lege oben den ersten Eintrag an oder
                      importiere eine ETS-CSV.
                    </p>` : this._onlyEnabled && e === 0 ? o`<p>
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
                        </p>` : o`<p>
                        Keine Treffer für aktuelle Filter
                        (${this._items.length} Adressen total,
                        ${e} davon aktiv).
                      </p>`}
              </div>` : o`
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
      (s) => o`
                          <tr class=${s.log_enabled ? "enabled" : ""}>
                            <td><code class="ga">${s.address}</code></td>
                            <td class="label-cell">${s.label}</td>
                            <td>
                              ${s.dpt ? o`<code class="dpt">${s.dpt}</code>` : o`<span class="muted">—</span>`}
                            </td>
                            <td>
                              ${s.log_enabled ? o`<button
                                    class=${`mh-pill mh-pill--${s.log_severity === "auto" ? "neutral" : s.log_severity} sev-trigger`}
                                    title="Severity ändern"
                                    aria-haspopup="menu"
                                    aria-expanded=${this._sevPopoverFor === s.address}
                                    @click=${(a) => this._onSeverityTrigger(a, s)}
                                  >
                                    <span class="mh-pill__dot"></span>
                                    ${s.log_severity}${s.log_severity === "auto" ? o` <small class="auto-detail"
                                          >T:${s.severity_on_true ?? "warning"}
                                          / F:${s.severity_on_false ?? "info"}</small
                                        >` : h}
                                    <span class="sev-caret" aria-hidden="true">▾</span>
                                  </button>` : o`<span class="muted">—</span>`}
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
        ${this._toast ? o`<div class="toast">${this._toast}</div>` : h}
      </section>
    `;
  }
};
$.styles = [
  O,
  ge,
  St,
  ve,
  x`
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
A([
  f({ attribute: !1 })
], $.prototype, "api", 2);
A([
  l()
], $.prototype, "_items", 2);
A([
  l()
], $.prototype, "_loading", 2);
A([
  l()
], $.prototype, "_filter", 2);
A([
  l()
], $.prototype, "_onlyEnabled", 2);
A([
  l()
], $.prototype, "_newAddr", 2);
A([
  l()
], $.prototype, "_newLabel", 2);
A([
  l()
], $.prototype, "_newDpt", 2);
A([
  l()
], $.prototype, "_sevPopoverFor", 2);
A([
  l()
], $.prototype, "_sevPopoverPos", 2);
A([
  l()
], $.prototype, "_discovery", 2);
A([
  l()
], $.prototype, "_discoveryStatus", 2);
A([
  l()
], $.prototype, "_editing", 2);
A([
  l()
], $.prototype, "_toast", 2);
A([
  l()
], $.prototype, "_error", 2);
$ = A([
  y("knx-addresses-view")
], $);
var Ds = Object.defineProperty, Os = Object.getOwnPropertyDescriptor, be = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Os(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Ds(e, s, r), r;
};
const Cs = ["telegram", "pushover", "ntfy", "signal", "notify"], Ms = ["debug", "info", "warning", "error"];
let Y = class extends _ {
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
    const s = t.config ?? {}, a = (r, i) => {
      e({ config: { ...s, [r]: i } });
    };
    return t.channel_type === "telegram" ? o`
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
      ` : t.channel_type === "pushover" ? o`
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
      ` : t.channel_type === "ntfy" ? o`
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
      ` : o`
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
    return o`
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
              ${Cs.map((s) => o`<option value=${s}>${s}</option>`)}
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
                ${Ms.map((s) => o`<option value=${s}>${s}</option>`)}
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
    return o`
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
        ${this._items.length === 0 ? o`<p class="empty">Noch kein Channel angelegt.</p>` : o`<table>
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
        var e, s, a, r, i;
        return o`<tr>
                    <td>${t.name}</td>
                    <td>
                      <code>${t.channel_type}</code>
                      ${t.channel_type === "telegram" ? o` → <small>${((e = t.config) == null ? void 0 : e.chat_id) ?? "?"}</small>` : t.channel_type === "pushover" ? o` → <small>${((a = (s = t.config) == null ? void 0 : s.user_key) == null ? void 0 : a.slice(0, 8)) ?? "?"}…</small>` : t.channel_type === "ntfy" ? o` → <small>${((r = t.config) == null ? void 0 : r.topic) ?? "?"}</small>` : (i = t.config) != null && i.service ? o` → <code>notify.${t.config.service}</code>` : o`<span class="muted">— unkonfiguriert</span>`}
                    </td>
                    <td>${t.severity_threshold}</td>
                    <td>
                      ${t.quiet_start && t.quiet_end ? o`${t.quiet_start}–${t.quiet_end}${t.quiet_bypass_error ? o` <small>(Err bypass)</small>` : ""}` : o`<span class="muted">—</span>`}
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
        ${this._toast ? o`<div class="toast">${this._toast}</div>` : null}
      </section>
    `;
  }
};
Y.styles = x`
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
be([
  f({ attribute: !1 })
], Y.prototype, "api", 2);
be([
  l()
], Y.prototype, "_items", 2);
be([
  l()
], Y.prototype, "_editing", 2);
be([
  l()
], Y.prototype, "_toast", 2);
Y = be([
  y("channels-view")
], Y);
var Ls = Object.defineProperty, Ns = Object.getOwnPropertyDescriptor, k = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Ns(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Ls(e, s, r), r;
};
const Ge = x`
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
let U = class extends _ {
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
    return o`
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

        ${this._items.length === 0 ? o`<p class="empty">Noch keine Topics abonniert.</p>` : o`<table>
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
      (t) => o`<tr>
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
U.styles = Ge;
k([
  f({ attribute: !1 })
], U.prototype, "api", 2);
k([
  l()
], U.prototype, "_items", 2);
k([
  l()
], U.prototype, "_newPattern", 2);
k([
  l()
], U.prototype, "_newSource", 2);
k([
  l()
], U.prototype, "_newSeverity", 2);
U = k([
  y("mqtt-topics-view")
], U);
let Q = class extends _ {
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
    return o`
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
        ${this._items.length === 0 ? o`<p class="empty">Noch keine Heartbeat-Quellen.</p>` : o`<table>
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
      (t) => o`<tr>
                    <td><code>${t.source}</code></td>
                    <td>${t.expected_interval_seconds}</td>
                    <td>${t.last_seen ?? o`<span class="muted">—</span>`}</td>
                    <td>
                      ${t.silent_alert_active ? o`<span class="alert">⚠ silent</span>` : o`<span class="ok">✓ ok</span>`}
                    </td>
                  </tr>`
    )}
              </tbody>
            </table>`}
      </section>
    `;
  }
};
Q.styles = Ge;
k([
  f({ attribute: !1 })
], Q.prototype, "api", 2);
k([
  l()
], Q.prototype, "_items", 2);
k([
  l()
], Q.prototype, "_newSource", 2);
k([
  l()
], Q.prototype, "_newInterval", 2);
Q = k([
  y("heartbeats-view")
], Q);
let L = class extends _ {
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
    return o`
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
        ${this._items.length === 0 ? o`<p class="empty">Noch keine Hooks.</p>` : o`<table>
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
      (t) => o`<tr>
                    <td>${t.name}</td>
                    <td><code>${t.source_pattern}</code></td>
                    <td><code>${t.automation_id}</code></td>
                    <td>
                      ${t.confirm_required ? o`<span class="muted">Vorschlag</span>` : o`<span class="alert">Auto</span>`}
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
L.styles = Ge;
k([
  f({ attribute: !1 })
], L.prototype, "api", 2);
k([
  l()
], L.prototype, "_items", 2);
k([
  l()
], L.prototype, "_newName", 2);
k([
  l()
], L.prototype, "_newSource", 2);
k([
  l()
], L.prototype, "_newAutomation", 2);
k([
  l()
], L.prototype, "_newAuto", 2);
L = k([
  y("remediation-view")
], L);
var Hs = Object.defineProperty, js = Object.getOwnPropertyDescriptor, j = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? js(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Hs(e, s, r), r;
};
const Et = [
  { id: "webhooks", label: "Webhooks", icon: "🔗" },
  { id: "knx", label: "KNX-Bus", icon: "🏠" },
  { id: "channels", label: "Channels", icon: "📨" },
  { id: "mqtt", label: "MQTT", icon: "📡" },
  { id: "heartbeats", label: "Heartbeats", icon: "💓" },
  { id: "remediation", label: "Auto-Remediation", icon: "🔧" }
], zt = "messagehub.settings.tab";
function Is() {
  try {
    const t = localStorage.getItem(zt);
    if (t && Et.some((e) => e.id === t)) return t;
  } catch {
  }
  return "webhooks";
}
let D = class extends _ {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._showForm = !1, this._editing = null, this._toast = "", this._menuOpenId = null, this._activeTab = Is(), this._closeMenu = () => {
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
      localStorage.setItem(zt, t);
    } catch {
    }
  }
  _renderEmpty() {
    return o`
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
    return o`
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
              ${s ? o`<div class="overflow-menu" role="menu">
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

        ${t.field_map ? o`<details class="mapping">
              <summary>JSONPath-Mapping anzeigen</summary>
              <pre><code>${JSON.stringify(t.field_map, null, 2)}</code></pre>
            </details>` : null}
      </div>
    `;
  }
  render() {
    return o`
      <div class="root" @click=${this._closeMenu}>
        <nav class="tabs" role="tablist" aria-label="Einstellungs-Bereiche">
          ${Et.map(
      (t) => o`<button
              role="tab"
              aria-selected=${this._activeTab === t.id}
              class=${`tab ${this._activeTab === t.id ? "active" : ""}`}
              title=${t.label}
              @click=${() => this._selectTab(t.id)}
            >
              <span class="tab-icon" aria-hidden="true">${t.icon}</span>
              <span>${t.label}</span>
            </button>`
    )}
        </nav>

        <div class="tab-panel" role="tabpanel">
          ${this._renderActiveTab()}
        </div>

        ${this._toast ? o`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
  _renderActiveTab() {
    switch (this._activeTab) {
      case "webhooks":
        return this._renderWebhooks();
      case "knx":
        return o`<knx-addresses-view .api=${this.api}></knx-addresses-view>`;
      case "channels":
        return o`<channels-view .api=${this.api}></channels-view>`;
      case "mqtt":
        return o`<mqtt-topics-view .api=${this.api}></mqtt-topics-view>`;
      case "heartbeats":
        return o`<heartbeats-view .api=${this.api}></heartbeats-view>`;
      case "remediation":
        return o`<remediation-view .api=${this.api}></remediation-view>`;
    }
  }
  _renderWebhooks() {
    return o`
      <section>
        <header class="section-head">
          <div>
            <h2>Webhooks</h2>
            <p class="hint">
              Eingehende Nachrichten via HTTP-POST. Pro Webhook eigene URL +
              optionales JSONPath-Mapping für beliebige Payload-Strukturen.
            </p>
          </div>
          ${this._items.length > 0 && !this._showForm ? o`<button class="mh-btn mh-btn--primary" @click=${this._add}>
                + Webhook anlegen
              </button>` : null}
        </header>

        ${this._showForm ? o`<webhook-form
              .api=${this.api}
              .editing=${this._editing}
              @saved=${this._onSaved}
              @cancel=${this._onCancel}
            ></webhook-form>` : null}

        ${this._loading ? o`<p class="status">lade…</p>` : this._items.length === 0 && !this._showForm ? this._renderEmpty() : o`<div class="grid">${this._items.map((t) => this._renderItem(t))}</div>`}
      </section>
    `;
  }
};
D.styles = [
  O,
  ge,
  Be,
  x`
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
      .tab-icon {
        font-size: 1.05em;
      }
      .tab-panel {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
      }
      @media (max-width: 720px) {
        .tab {
          padding: 8px 10px;
        }
        .tab span:not(.tab-icon) {
          /* nur Icon auf Mobile, Label im title-Tooltip */
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
j([
  f({ attribute: !1 })
], D.prototype, "api", 2);
j([
  l()
], D.prototype, "_items", 2);
j([
  l()
], D.prototype, "_loading", 2);
j([
  l()
], D.prototype, "_showForm", 2);
j([
  l()
], D.prototype, "_editing", 2);
j([
  l()
], D.prototype, "_toast", 2);
j([
  l()
], D.prototype, "_menuOpenId", 2);
j([
  l()
], D.prototype, "_activeTab", 2);
D = j([
  y("settings-view")
], D);
var Fs = Object.defineProperty, Us = Object.getOwnPropertyDescriptor, X = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Us(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Fs(e, s, r), r;
};
const pt = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
  debug: "Debug"
}, ut = {
  error: "var(--mh-error)",
  warning: "var(--mh-warning)",
  info: "var(--mh-info)",
  debug: "var(--mh-debug)"
}, mt = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], Rs = [1, 2, 3, 4, 5, 6, 0];
let N = class extends _ {
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
    return e === 0 ? o`<p class="muted">Keine Daten in den letzten 30 Tagen.</p>` : o`
      <div class="heatmap-wrap">
        <div class="heatmap">
          <div class="heatmap-header">
            <span></span>
            ${Array.from(
      { length: 24 },
      (s, a) => o`<span class="hour-label">${a % 3 === 0 ? a : ""}</span>`
    )}
          </div>
          ${Rs.map((s, a) => {
      const r = t[s];
      return o`
              <div class="heatmap-row">
                <span class="day-label">${mt[a]}</span>
                ${r.map((i, n) => {
        const c = i === 0 ? 0 : Math.max(0.15, i / e), d = i === 0 ? "transparent" : `color-mix(in srgb, var(--mh-accent) ${Math.round(
          c * 100
        )}%, transparent)`;
        return o`
                    <div
                      class=${`heatmap-cell ${i === 0 ? "empty" : ""}`}
                      style=${`background: ${d}`}
                      title=${`${mt[a]} ${n}:00 — ${i} Nachricht${i === 1 ? "" : "en"}`}
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
    if (!this._stats) return o``;
    const t = this._stats.severity_24h, e = Object.values(t).reduce((a, r) => a + r, 0), s = ["error", "warning", "info", "debug"];
    return e === 0 ? o`<p class="muted">Keine Nachrichten in den letzten 24 Stunden.</p>` : o`
      <div class="stack-bar" role="img" aria-label="Severity-Verteilung der letzten 24 Stunden">
        ${s.map((a) => {
      const r = t[a] ?? 0;
      if (r === 0) return null;
      const i = r / e * 100;
      return o`
            <div
              class=${`stack-seg sev-${a}`}
              style=${`width: ${i}%; background: ${ut[a]}`}
              title=${`${pt[a]}: ${r} (${i.toFixed(0)}%)`}
            ></div>
          `;
    })}
      </div>
      <ul class="legend">
        ${s.map((a) => {
      const r = t[a] ?? 0, i = e > 0 ? r / e * 100 : 0;
      return o`
            <li>
              <span class="legend-dot" style=${`background: ${ut[a]}`}></span>
              <span class="legend-label">${pt[a]}</span>
              <span class="legend-count">${r.toLocaleString("de-DE")}</span>
              <span class="legend-pct muted">${i.toFixed(0)}%</span>
            </li>
          `;
    })}
      </ul>
    `;
  }
  render() {
    if (this._loading && !this._stats)
      return o`<div class="root"><p class="status">lade…</p></div>`;
    if (!this._stats)
      return o`<div class="root"><p class="status">Keine Daten verfügbar.</p></div>`;
    const t = this._stats, e = Object.values(t.severity_24h).reduce((i, n) => i + n, 0), s = t.severity_24h.error ?? 0, a = t.severity_24h.warning ?? 0, r = e > 0 ? s / e * 100 : 0;
    return o`
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
            ${this._sources.length === 0 ? o`<p class="muted">
                  Noch keine Quellen erfasst. Sobald die erste Nachricht reinkommt,
                  erscheint sie hier.
                </p>` : o`<ul class="sources">
                  ${this._sources.map(
      (i) => o`<li class="source-pill">${i}</li>`
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
            ${this._topSources.length === 0 ? o`<p class="muted">Keine Daten.</p>` : o`<ul class="top-sources">
                  ${this._topSources.map((i, n) => {
      var u;
      const c = ((u = this._topSources[0]) == null ? void 0 : u.count) ?? 1, d = i.count / c * 100;
      return o`<li>
                      <span class="rank">${n + 1}</span>
                      <code class="source-name">${i.source}</code>
                      <span class="bar-track">
                        <span class="bar-fill" style=${`width: ${d}%`}></span>
                      </span>
                      <span class="bar-count">${i.count.toLocaleString("de-DE")}</span>
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
  O,
  Be,
  ve,
  x`
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
X([
  f({ attribute: !1 })
], N.prototype, "api", 2);
X([
  l()
], N.prototype, "_stats", 2);
X([
  l()
], N.prototype, "_sources", 2);
X([
  l()
], N.prototype, "_heatmap", 2);
X([
  l()
], N.prototype, "_topSources", 2);
X([
  l()
], N.prototype, "_loading", 2);
N = X([
  y("stats-live-view")
], N);
var Bs = Object.defineProperty, Ks = Object.getOwnPropertyDescriptor, Pe = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Ks(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Bs(e, s, r), r;
};
const _e = [
  "var(--mh-error)",
  "var(--mh-warning)",
  "var(--mh-info)",
  "var(--mh-accent)",
  "var(--mh-success)"
];
let ae = class extends _ {
  constructor() {
    super(...arguments), this.items = [], this.width = 600, this.height = 120;
  }
  render() {
    if (this.items.length === 0)
      return o`<p class="muted">Keine Timeline-Daten.</p>`;
    const t = this._buildSeries(), e = this._allBuckets(), s = Math.max(1, ...this.items.map((d) => d.count)), a = { top: 8, right: 8, bottom: 18, left: 32 }, r = this.width - a.left - a.right, i = this.height - a.top - a.bottom, n = (d) => a.left + d / Math.max(1, e.length - 1) * r, c = (d) => a.top + (1 - d / s) * i;
    return o`
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
        ${t.map((d, u) => {
      const b = d.values.map(
        (v, g) => `${n(g)},${c(v)}`
      ).join(" "), p = _e[u % _e.length];
      return o`<polyline
            points=${b}
            class="series"
            fill="none"
            stroke=${p}
            stroke-width="1.5"
          ><title>${d.ga}</title></polyline>`;
    })}
      </svg>
      <div class="legend">
        ${t.map(
      (d, u) => o`<span class="legend-item">
            <span
              class="dot"
              style=${`background: ${_e[u % _e.length]}`}
            ></span>
            <code>${d.ga}</code>
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
      const i = e.get(a.bucket);
      i !== void 0 && (r[i] = a.count);
    }
    return Array.from(s.entries()).map(([a, r]) => ({ ga: a, values: r }));
  }
};
ae.styles = [
  O,
  x`
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
Pe([
  f({ attribute: !1 })
], ae.prototype, "items", 2);
Pe([
  f({ type: Number })
], ae.prototype, "width", 2);
Pe([
  f({ type: Number })
], ae.prototype, "height", 2);
ae = Pe([
  y("knx-timeline-chart")
], ae);
var Gs = Object.defineProperty, Ws = Object.getOwnPropertyDescriptor, Ee = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Ws(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Gs(e, s, r), r;
};
function Vs(t) {
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
let re = class extends _ {
  constructor() {
    super(...arguments), this.points = [], this.width = 600, this.height = 80;
  }
  render() {
    const t = this.points.map((m) => ({ ts: m.ts, value: Vs(m.value) })).filter((m) => m.value !== null);
    if (t.length < 2)
      return o`<p class="muted">
        Wertverlauf: zu wenige numerische Datenpunkte
        (${t.length} von ${this.points.length}).
      </p>`;
    const e = t.map((m) => m.value), s = Math.min(...e), a = Math.max(...e), r = a - s || 1, i = { top: 8, right: 8, bottom: 18, left: 40 }, n = this.width - i.left - i.right, c = this.height - i.top - i.bottom, d = (m) => i.left + m / Math.max(1, t.length - 1) * n, u = (m) => i.top + (1 - (m - s) / r) * c, b = t.map((m, P) => `${d(P)},${u(m.value)}`).join(" "), v = [...e.slice(1).map((m, P) => Math.abs(m - e[P]))].sort((m, P) => m - P), g = v[Math.floor(v.length / 2)];
    return o`
      <div class="wrap">
        <svg
          viewBox=${`0 0 ${this.width} ${this.height}`}
          role="img"
          aria-label="Wertverlauf-Sparkline"
          preserveAspectRatio="none"
        >
          <line
            x1=${i.left} y1=${i.top}
            x2=${this.width - i.right} y2=${i.top}
            class="grid"
          ></line>
          <line
            x1=${i.left} y1=${this.height - i.bottom}
            x2=${this.width - i.right} y2=${this.height - i.bottom}
            class="grid"
          ></line>
          <text x="2" y=${i.top + 4} class="axis-label">${a.toFixed(1)}</text>
          <text x="2" y=${this.height - i.bottom + 4} class="axis-label">${s.toFixed(1)}</text>
          <polyline points=${b} class="series" fill="none"></polyline>
        </svg>
        <p class="muted small">
          ${t.length} Punkte • Min ${s.toFixed(1)} • Max ${a.toFixed(1)} •
          Median Δ ${g.toFixed(2)}
          ${g < 0.1 && r > 0 ? o` <span class="hint">→ enge Hysterese</span>` : qs}
        </p>
      </div>
    `;
  }
};
re.styles = [
  O,
  x`
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
Ee([
  f({ attribute: !1 })
], re.prototype, "points", 2);
Ee([
  f({ type: Number })
], re.prototype, "width", 2);
Ee([
  f({ type: Number })
], re.prototype, "height", 2);
re = Ee([
  y("knx-value-sparkline")
], re);
const qs = "";
var Js = Object.defineProperty, Ys = Object.getOwnPropertyDescriptor, S = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? Ys(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Js(e, s, r), r;
};
const Dt = "messagehub.knx-stats.filters", je = [
  { id: "1h", label: "1 Std", days: 1 / 24 },
  { id: "6h", label: "6 Std", days: 0.25 },
  { id: "24h", label: "24 Std", days: 1 },
  { id: "48h", label: "48 Std", days: 2 }
], Qs = [10, 25, 50, 100], gt = {
  periodId: "24h",
  topN: 50,
  minRate: 1,
  includeAck: !0
};
function Xs() {
  try {
    const t = localStorage.getItem(Dt);
    if (t) {
      const e = JSON.parse(t);
      return { ...gt, ...e };
    }
  } catch {
  }
  return { ...gt };
}
function xe(t) {
  try {
    localStorage.setItem(Dt, JSON.stringify(t));
  } catch {
  }
}
function vt(t) {
  const e = je.find((r) => r.id === t) ?? je[2], s = /* @__PURE__ */ new Date();
  return { from: new Date(s.getTime() - e.days * 864e5).toISOString(), to: s.toISOString() };
}
let w = class extends _ {
  constructor() {
    super(...arguments), this._filters = Xs(), this._summary = null, this._busHealth = null, this._silence = null, this._orphans = null, this._alarms = null, this._top = [], this._topBySource = [], this._timeline = null, this._selectedGa = null, this._detail = null, this._detailLoading = !1, this._loading = !1, this._error = "", this._toast = "";
  }
  async firstUpdated() {
    await this._load();
  }
  _apiFilters() {
    const { from: t, to: e } = vt(this._filters.periodId);
    return {
      from: t,
      to: e,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck
    };
  }
  async _load() {
    if (this.api) {
      this._loading = !0, this._error = "";
      try {
        const t = this._apiFilters(), [e, s, a, r, i, n, c] = await Promise.all([
          this.api.getKnxStatsSummary(t),
          this.api.getKnxStatsTop(t),
          this.api.getKnxStatsTopBySource(t),
          this.api.getKnxStatsBusHealth(t),
          this.api.getKnxStatsSilence({
            ...t,
            maxSilenceMinutes: this._suggestSilenceMinutes()
          }),
          this.api.getKnxStatsOrphans(t).catch(() => null),
          this.api.getKnxStatsAlarms(t).catch(() => null)
        ]);
        this._summary = e, this._top = s.items, this._topBySource = a.items, this._busHealth = r, this._silence = i, this._orphans = n, this._alarms = c;
        const d = s.items.slice(0, 5).map((u) => u.ga);
        d.length > 0 ? this._timeline = await this.api.getKnxStatsTimeline({
          ...t,
          gas: d,
          bucketMinutes: this._suggestBucketMinutes()
        }) : this._timeline = null;
      } catch (t) {
        this._error = t.message, this._summary = null, this._top = [], this._topBySource = [], this._timeline = null, this._busHealth = null, this._silence = null, this._orphans = null, this._alarms = null;
      } finally {
        this._loading = !1;
      }
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
    this._filters = { ...this._filters, periodId: t }, xe(this._filters), this._load();
  }
  _onTopN(t) {
    this._filters = { ...this._filters, topN: t }, xe(this._filters), this._load();
  }
  _onMinRate(t) {
    this._filters = { ...this._filters, minRate: Math.max(0, t) }, xe(this._filters), this._load();
  }
  _onAckToggle() {
    this._filters = { ...this._filters, includeAck: !this._filters.includeAck }, xe(this._filters), this._load();
  }
  _renderFilterBar() {
    return o`
      <div class="filters" role="toolbar" aria-label="KNX-Stats-Filter">
        <div class="filter-group">
          <span class="filter-label">Zeitraum</span>
          <div class="seg">
            ${je.map(
      (t) => o`<button
                class=${`seg-btn ${this._filters.periodId === t.id ? "active" : ""}`}
                @click=${() => this._onPeriod(t.id)}
              >
                ${t.label}
              </button>`
    )}
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-label">Top-N</span>
          <div class="seg">
            ${Qs.map(
      (t) => o`<button
                class=${`seg-btn ${this._filters.topN === t ? "active" : ""}`}
                @click=${() => this._onTopN(t)}
              >
                ${t}
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
      return o`<p class="muted">Keine Daten verfuegbar.</p>`;
    const e = t.counts_by_severity, s = t.estimated_busload_pct >= 30 ? "danger" : t.estimated_busload_pct >= 20 ? "warning" : t.estimated_busload_pct >= 10 ? "elevated" : "ok";
    return o`
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
        <div class=${`kpi busload busload--${s}`}>
          <span class="kpi-label">Geschaetzte Buslast</span>
          <span class="kpi-value">${t.estimated_busload_pct.toLocaleString(
      "de-DE",
      { minimumFractionDigits: 1, maximumFractionDigits: 1 }
    )} %</span>
          <span class="kpi-hint">Ø ueber Zeitraum</span>
        </div>
      </div>
      <div class="severity-counts">
        ${["red", "orange", "yellow", "green"].map(
      (a) => o`<span class=${`mh-pill mh-pill--${a === "red" ? "error" : a === "orange" ? "warning" : a === "yellow" ? "info" : "neutral"}`}>
            <span class="mh-pill__dot"></span>
            ${this._severityLabel(a)}: ${e[a] ?? 0}
          </span>`
    )}
      </div>
    `;
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
    return o`
      <div class="root">
        <div class="info-banner">
          <strong>Bus-weite Auswertung:</strong>
          alle Telegramme aus dem Gruppenmonitor werden 48 h vorgehalten —
          unabhaengig davon, ob die GA in der Whitelist (Einstellungen →
          KNX-Adressen) als „Loggen aktiv" markiert ist. Whitelisted GAs
          landen zusaetzlich im Logbuch (Tab „Nachrichten").
        </div>
        ${this._renderFilterBar()}
        ${this._error ? o`<div class="error">${this._error}</div>` : h}
        ${this._alarms !== null && this._alarms.triggered_count > 0 ? this._renderAlarmBanner() : h}

        <section class="mh-card kpi-card">
          <header class="card-head">
            <h3>Uebersicht</h3>
            <span class="muted small">letzte ${this._filters.periodId}</span>
          </header>
          ${this._loading && this._summary === null ? o`<p class="muted">lade…</p>` : this._renderKpis()}
        </section>

        ${this._busHealth !== null && this._busHealth.summary.total > 0 ? this._renderBusHealth() : h}
        ${this._silence !== null && this._silence.alarm_count > 0 ? this._renderSilenceAlarms() : h}
        ${this._orphans !== null && (this._orphans.missing_in_log.length > 0 || this._orphans.extra_in_log.length > 0) ? this._renderOrphans() : h}

        <section class="mh-card">
          <header class="card-head">
            <h3>Top-Sender (Gruppenadressen)</h3>
            <span class="muted small">${this._top.length} sichtbar</span>
          </header>
          ${this._renderTopTable()}
        </section>

        ${this._topBySource.length > 0 ? o`<section class="mh-card">
              <header class="card-head">
                <h3>Top-Geraete (Source-Adressen)</h3>
                <span class="muted small">
                  Welches physische Geraet erzeugt am meisten Last?
                </span>
              </header>
              ${this._renderTopBySource()}
            </section>` : h}

        ${this._timeline !== null && this._timeline.items.length > 0 ? o`<section class="mh-card">
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
        ${this._toast ? o`<div class="toast">${this._toast}</div>` : h}
      </div>
    `;
  }
  _renderTopTable() {
    return this._loading && this._top.length === 0 ? o`<p class="muted">lade…</p>` : this._top.length === 0 ? o`<p class="muted">Keine Telegramme in diesem Zeitraum.</p>` : o`
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
      (t, e) => o`<tr
                class=${`row-${t.severity} ${t.acknowledged ? "ack" : ""} ${this._selectedGa === t.ga ? "selected" : ""}`}
                @click=${() => void this._onSelectGa(t.ga)}
              >
                <td class="num muted">${e + 1}</td>
                <td><code class="ga">${t.ga}</code></td>
                <td class="label-cell" title=${t.label ?? ""}>
                  ${t.label ?? o`<span class="muted">—</span>`}
                </td>
                <td>
                  ${t.dpt ? o`<code class="dpt">${t.dpt}</code>` : o`<span class="muted">—</span>`}
                </td>
                <td class="num strong">${t.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td class="num muted">${t.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td>
                  <span class=${`mh-pill ${this._severityPillClass(t.severity)}`}>
                    <span class="mh-pill__dot"></span>
                    ${this._severityLabel(t.severity)}
                  </span>
                  ${t.acknowledged ? o`<span class="ack-pill" title="acknowledged">✓ bekannt</span>` : h}
                </td>
                <td class="actions">
                  ${t.acknowledged ? o`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(s) => {
        s.stopPropagation(), this._unackGa(t.ga);
      }}
                      >
                        ✗ Ack entfernen
                      </button>` : o`<button
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
      return o`<section class="mh-card detail-pane">
        <p class="muted">lade Details…</p>
      </section>`;
    if (this._detail === null) return o``;
    const t = this._detail, e = t.recommendation;
    return o`
      <section class="mh-card detail-pane">
        <header class="card-head">
          <div class="detail-head-text">
            <h3>${t.ga} — ${t.label ?? "Detail"}</h3>
            <span class="muted small">
              Geraet:
              <code>${t.dev_source || "?"}</code>
              ${t.dpt ? o` • DPT <code>${t.dpt}</code>` : h}
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
          ${e.estimated_reduction_pct !== null ? o`<div class="detail-stat">
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

        ${t.findings.length > 0 ? o`<div class="findings">
              <strong>Erkannte Muster:</strong>
              <ul>
                ${t.findings.map(
      (s) => o`<li class=${`finding-${s.severity}`}>
                    <span class=${`mh-pill ${this._severityPillClass(s.severity)}`}>
                      ${s.kind}
                    </span>
                    <span>${s.text}</span>
                  </li>`
    )}
              </ul>
            </div>` : h}

        ${t.value_history.length >= 2 ? o`<div class="value-history">
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
    return o`
      <div class="device-info">
        ${e ? o`<strong>
              Geraet: ${e.manufacturer || "?"}
              ${e.name ? o` — ${e.name}` : h}
              ${e.product ? o`<span class="muted small">(${e.product})</span>` : h}
            </strong>` : o`<strong>Hersteller-Hinweise</strong>`}
        ${s && s.tips.length > 0 ? o`<ul class="hints">
              ${s.tips.map((a) => o`<li>${a}</li>`)}
            </ul>` : h}
        ${s != null && s.doc_url ? o`<p class="muted small">
              Hersteller-Doku:
              <a href=${s.doc_url} target="_blank" rel="noopener noreferrer">
                ${s.doc_url}
              </a>
            </p>` : h}
      </div>
    `;
  }
  _renderSiblingGas(t) {
    return o`
      <div class="siblings">
        <strong>Andere GAs des Geraets <code>${t.dev_source}</code>:</strong>
        <ul>
          ${t.sibling_gas.slice(0, 10).map(
      (e) => o`<li
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
        ${t.sibling_gas.length > 10 ? o`<p class="muted small">
              … und ${t.sibling_gas.length - 10} weitere
            </p>` : h}
      </div>
    `;
  }
  _renderTopBySource() {
    return o`
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
            ${this._topBySource.slice(0, 25).map((t, e) => {
      var n;
      const s = ((n = this._summary) == null ? void 0 : n.total_telegrams) ?? 0, a = s > 0 ? t.count / s * 100 : 0, r = t.manufacturer ?? "", i = t.device_name ?? "";
      return o`<tr>
                <td class="num muted">${e + 1}</td>
                <td><code class="ga">${t.dev_source}</code></td>
                <td class="device-cell">
                  ${r || i ? o`<span class="muted small"
                        >${r}${r && i ? " — " : ""}${i}</span
                      >` : o`<span class="muted small">—</span>`}
                </td>
                <td class="num">${t.ga_count}</td>
                <td class="num strong">${t.count.toLocaleString("de-DE")}</td>
                <td class="num muted">
                  ${a.toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })} %
                </td>
                <td class="actions">
                  <button
                    class="mh-btn mh-btn--sm mh-btn--ghost"
                    title="Alle GAs dieses Geraets als bekannt markieren"
                    @click=${(c) => {
        c.stopPropagation(), this._ackBulk(t.dev_source);
      }}
                  >
                    ✓ Alle ${t.ga_count} bekannt
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
        const { from: s, to: a } = vt(this._filters.periodId), r = await this.api.acknowledgeKnxBulk(t, {
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
    return o`
      <section class="alarm-banner">
        <strong>⚠ ${e.length} Alarm(e) aktiv</strong>
        <ul>
          ${e.map(
      (s) => o`<li>
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
    return o`
      <section class="mh-card">
        <header class="card-head">
          <h3>Verwaiste GAs (Projekt vs Realitaet)</h3>
          <span class="muted small">
            Projekt: ${t.project_total} • geloggt: ${t.log_total}
          </span>
        </header>
        <div class="orphans-grid">
          ${t.missing_in_log.length > 0 ? o`<div>
                <strong>Im Projekt, nie gesehen (${t.missing_in_log.length})</strong>
                <ul class="orphans-list muted-list">
                  ${t.missing_in_log.slice(0, 15).map(
      (e) => o`<li>
                      <code>${e.address}</code>
                      <span>${e.name || "—"}</span>
                      ${e.dpt ? o`<code class="dpt">${e.dpt}</code>` : h}
                    </li>`
    )}
                </ul>
                ${t.missing_in_log.length > 15 ? o`<p class="muted small">
                      … und ${t.missing_in_log.length - 15} weitere
                    </p>` : h}
              </div>` : h}
          ${t.extra_in_log.length > 0 ? o`<div>
                <strong>Geloggt, nicht im Projekt (${t.extra_in_log.length})</strong>
                <ul class="orphans-list extra-list">
                  ${t.extra_in_log.slice(0, 15).map(
      (e) => o`<li>
                      <code>${e.address}</code>
                      <span>${e.label ?? "—"}</span>
                      <span class="muted num">${e.count}</span>
                    </li>`
    )}
                </ul>
                ${t.extra_in_log.length > 15 ? o`<p class="muted small">
                      … und ${t.extra_in_log.length - 15} weitere
                    </p>` : h}
              </div>` : h}
        </div>
      </section>
    `;
  }
  _renderSilenceAlarms() {
    const t = this._silence, e = t.items.filter((s) => s.alarm);
    return e.length === 0 ? o`` : o`
      <section class="mh-card silence-card">
        <header class="card-head">
          <h3>Stille-Alarme (${t.alarm_count})</h3>
          <span class="muted small">
            Schwelle: &gt; ${t.max_silence_minutes} Min ohne Telegramm
          </span>
        </header>
        <ul class="silence-list">
          ${e.slice(0, 10).map(
      (s) => o`<li>
              <code>${s.dev_source}</code>
              <span class="muted">
                seit ${this._formatSilence(s.silent_minutes)} stumm
              </span>
              <span class="muted small">last_seen ${this._formatTs(s.last_seen)}</span>
            </li>`
    )}
        </ul>
        ${t.alarm_count > 10 ? o`<p class="muted small">
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
    return o`
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
        ${t.per_ga.length > 0 ? o`<div class="bus-health-list">
              <strong>Top-GAs mit Wiederholungen:</strong>
              <ul>
                ${t.per_ga.slice(0, 5).map(
      (a) => o`<li>
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
w.styles = [
  O,
  Be,
  ve,
  ge,
  x`
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
S([
  f({ attribute: !1 })
], w.prototype, "api", 2);
S([
  l()
], w.prototype, "_filters", 2);
S([
  l()
], w.prototype, "_summary", 2);
S([
  l()
], w.prototype, "_busHealth", 2);
S([
  l()
], w.prototype, "_silence", 2);
S([
  l()
], w.prototype, "_orphans", 2);
S([
  l()
], w.prototype, "_alarms", 2);
S([
  l()
], w.prototype, "_top", 2);
S([
  l()
], w.prototype, "_topBySource", 2);
S([
  l()
], w.prototype, "_timeline", 2);
S([
  l()
], w.prototype, "_selectedGa", 2);
S([
  l()
], w.prototype, "_detail", 2);
S([
  l()
], w.prototype, "_detailLoading", 2);
S([
  l()
], w.prototype, "_loading", 2);
S([
  l()
], w.prototype, "_error", 2);
S([
  l()
], w.prototype, "_toast", 2);
w = S([
  y("stats-knx-view")
], w);
var Zs = Object.defineProperty, ea = Object.getOwnPropertyDescriptor, We = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? ea(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && Zs(e, s, r), r;
};
const ft = "messagehub.stats.subtab", ta = /* @__PURE__ */ new Set(["live", "knx"]);
let me = class extends _ {
  constructor() {
    super(...arguments), this._tab = this._loadTab();
  }
  _loadTab() {
    try {
      const t = localStorage.getItem(ft);
      if (t && ta.has(t)) return t;
    } catch {
    }
    return "live";
  }
  _setTab(t) {
    this._tab = t;
    try {
      localStorage.setItem(ft, t);
    } catch {
    }
  }
  render() {
    return o`
      <div class="root">
        <nav class="subtabs" role="tablist" aria-label="Statistik-Bereiche">
          ${[
      { id: "live", label: "Live-Status" },
      { id: "knx", label: "KNX-Bus-Analyse" }
    ].map(
      (e) => o`<button
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
          ${this._tab === "live" ? o`<stats-live-view .api=${this.api}></stats-live-view>` : h}
          ${this._tab === "knx" ? o`<stats-knx-view .api=${this.api}></stats-knx-view>` : h}
        </div>
      </div>
    `;
  }
};
me.styles = [
  O,
  x`
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
We([
  f({ attribute: !1 })
], me.prototype, "api", 2);
We([
  l()
], me.prototype, "_tab", 2);
me = We([
  y("stats-view")
], me);
var sa = Object.defineProperty, aa = Object.getOwnPropertyDescriptor, Z = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? aa(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && sa(e, s, r), r;
};
function ra(t) {
  const e = t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), s = new Set(e), a = (...r) => r.some((i) => s.has(i));
  return a("delete", "remove", "removed", "deleted") ? "delete" : a("upsert", "create", "created", "add", "added", "import", "imported") ? "create" : a("update", "updated", "edit", "edited", "set") ? "update" : a("status", "ack", "acknowledge", "toggle", "enable", "enabled", "disable", "disabled") ? "status" : "other";
}
let H = class extends _ {
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
    const e = ra(t);
    return o`<span class=${`action-pill action-${e}`} title=${t}>${t}</span>`;
  }
  _renderDetails(t) {
    if (!t) return o`<span class="muted">—</span>`;
    if (typeof t == "object") {
      const e = Object.entries(t);
      return e.length === 0 ? o`<span class="muted">—</span>` : o`
        <dl class="kv">
          ${e.map(
        ([s, a]) => o`
              <dt>${s}</dt>
              <dd>${typeof a == "object" ? JSON.stringify(a) : String(a)}</dd>
            `
      )}
        </dl>
      `;
    }
    return o`<code>${String(t)}</code>`;
  }
  _renderDetailsSummary(t) {
    if (!t || typeof t != "object") return o`<span class="muted">—</span>`;
    const e = t, s = typeof e.label == "string" ? e.label : typeof e.name == "string" ? e.name : null;
    if (s) return o`<span class="summary">${s}</span>`;
    const a = Object.keys(e).slice(0, 3).join(", ");
    return o`<span class="summary muted">{${a}${Object.keys(e).length > 3 ? ", …" : ""}}</span>`;
  }
  render() {
    const t = this._filtered();
    return o`
      <div class="root">
        <header class="page-head">
          <div>
            <h2>Audit-Log</h2>
            <p class="hint">
              Letzte 200 administrativen Aktionen: Löschen, Status-Änderungen,
              Webhook-CRUD. Einträge sind unveränderlich.
            </p>
          </div>
          <button class="mh-btn" @click=${() => void this._load()}>↻ Aktualisieren</button>
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

        ${this._loading ? o`<p class="status">lade…</p>` : t.length === 0 ? o`<div class="empty">
                ${this._items.length === 0 ? "Noch keine Audit-Einträge." : "Keine Treffer für aktuelle Suche."}
              </div>` : o`
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
      return o`
                      <div class=${`table-row ${a ? "expanded" : ""}`}>
                        <button
                          class="row-toggle"
                          @click=${() => this._toggle(s)}
                          aria-expanded=${a}
                          aria-label=${a ? "Details verbergen" : "Details anzeigen"}
                        >
                          <span class="ts" title=${At(r, this._now)}>
                            ${Tt(r, this._now)}
                          </span>
                          <span class="actor">${e.actor}</span>
                          <span>${this._renderActionPill(e.action)}</span>
                          <span class="target">
                            <code class="target-type">${e.target_type}</code>
                            ${e.target_id !== null && e.target_id !== void 0 ? o`<code class="target-id">#${e.target_id}</code>` : h}
                          </span>
                          <span class="details-inline">
                            ${this._renderDetailsSummary(e.details)}
                            <span class="chevron" aria-hidden="true">${a ? "▾" : "▸"}</span>
                          </span>
                        </button>
                        ${a ? o`<div class="details-panel">
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
  O,
  ge,
  St,
  ve,
  x`
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
Z([
  f({ attribute: !1 })
], H.prototype, "api", 2);
Z([
  l()
], H.prototype, "_items", 2);
Z([
  l()
], H.prototype, "_loading", 2);
Z([
  l()
], H.prototype, "_filter", 2);
Z([
  l()
], H.prototype, "_expanded", 2);
Z([
  l()
], H.prototype, "_now", 2);
H = Z([
  y("audit-view")
], H);
var ia = Object.defineProperty, oa = Object.getOwnPropertyDescriptor, E = (t, e, s, a) => {
  for (var r = a > 1 ? void 0 : a ? oa(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (r = (a ? n(e, s, r) : n(r)) || r);
  return a && r && ia(e, s, r), r;
};
const bt = "messagehub.filters", we = {
  severity: ["error", "warning", "info"],
  source: "",
  search: ""
};
let T = class extends _ {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "messages", this._items = [], this._total = 0, this._loading = !1, this._selected = null, this._filters = this._loadFilters(), this._newCount = 0, this._testing = !1, this._toast = "", this._overflowOpen = !1, this._api = new ts(), this._onSeverityChange = (t) => {
      this._filters = { ...this._filters, severity: t.detail.severities }, this._persistFilters(), this._reload();
    }, this._onSourceChange = (t) => {
      this._filters = { ...this._filters, source: t.detail.source }, this._persistFilters(), this._reload();
    }, this._onTimeRange = (t) => {
      this._filters = { ...this._filters, fromIso: t.detail.fromIso, toIso: t.detail.toIso }, this._persistFilters(), this._reload();
    }, this._onSelect = (t) => {
      this._selected = t.detail.msg;
    }, this._onSeverityChangeMessage = async (t) => {
      var r, i;
      const { id: e, severity: s, previous: a } = t.detail;
      this._items = this._items.map(
        (n) => n.id === e ? { ...n, severity: s } : n
      ), ((r = this._selected) == null ? void 0 : r.id) === e && (this._selected = { ...this._selected, severity: s });
      try {
        await this._api.setMessageSeverity(e, s), this._showToast(`Severity geändert: ${a} → ${s}`);
      } catch (n) {
        this._items = this._items.map(
          (c) => c.id === e ? { ...c, severity: a } : c
        ), ((i = this._selected) == null ? void 0 : i.id) === e && (this._selected = {
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
      const t = localStorage.getItem(bt);
      if (t) return { ...we, ...JSON.parse(t) };
    } catch {
    }
    return { ...we };
  }
  _persistFilters() {
    try {
      localStorage.setItem(bt, JSON.stringify(this._filters));
    } catch {
    }
  }
  _resetFilters() {
    this._filters = { ...we }, this._persistFilters(), this._reload();
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
      ], r = (i) => Math.floor(Math.random() * i);
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
    return this._filters.severity.length !== we.severity.length || this._filters.source !== "" || this._filters.search !== "" || this._filters.fromIso !== void 0;
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
    return o`
      <div class="empty">
        <h3>Noch keine Nachrichten ${this._hasActiveFilters() ? "für diese Filter" : ""}</h3>
        <p>
          ${this._hasActiveFilters() ? "Probiere weniger restriktive Filter oder setze sie zurück." : "Sobald Nachrichten über Webhook, MQTT, Eventbus oder den Service messagehub.add_message reinkommen, erscheinen sie hier."}
        </p>
        <div class="empty-actions">
          ${this._hasActiveFilters() ? o`<button class="mh-btn" @click=${this._resetFilters}>
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
    return o`
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
        ${this._hasActiveFilters() ? o`<button class="filter-reset" @click=${this._resetFilters}>
              Filter zurücksetzen
            </button>` : null}
      </div>

      <div class="status-bar">
        <span class="status-count">
          ${this._loading ? "lade…" : o`<strong>${this._items.length.toLocaleString("de-DE")}</strong>
                <span class="muted">von ${this._total.toLocaleString("de-DE")}</span>`}
          ${this._newCount > 0 ? o`<span class="new-badge">+${this._newCount} neu</span>` : null}
        </span>
        <div class="status-actions">
          ${this._total > 0 ? o`<a
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
          ${this._total > 0 && this._hasActiveFilters() ? o`<button
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
            ${this._overflowOpen ? o`<div class="overflow-menu" role="menu">
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

      ${this._items.length === 0 && !this._loading ? this._renderEmptyMessages() : o`<message-table
            .items=${this._items}
            @select=${this._onSelect}
            @severity-change=${this._onSeverityChangeMessage}
          ></message-table>`}

      ${this._selected ? o`<detail-pane
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
    return o`
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
      (e) => o`<button
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
          ${this._tab === "stats" ? o`<stats-view .api=${this._api}></stats-view>` : null}
          ${this._tab === "settings" ? o`<settings-view .api=${this._api}></settings-view>` : null}
          ${this._tab === "audit" ? o`<audit-view .api=${this._api}></audit-view>` : null}
        </main>

        ${this._toast ? o`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
};
T.styles = [
  O,
  ge,
  x`
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
E([
  f({ attribute: !1 })
], T.prototype, "hass", 2);
E([
  f({ type: Boolean })
], T.prototype, "narrow", 2);
E([
  f({ attribute: !1 })
], T.prototype, "panel", 2);
E([
  l()
], T.prototype, "_tab", 2);
E([
  l()
], T.prototype, "_items", 2);
E([
  l()
], T.prototype, "_total", 2);
E([
  l()
], T.prototype, "_loading", 2);
E([
  l()
], T.prototype, "_selected", 2);
E([
  l()
], T.prototype, "_filters", 2);
E([
  l()
], T.prototype, "_newCount", 2);
E([
  l()
], T.prototype, "_testing", 2);
E([
  l()
], T.prototype, "_toast", 2);
E([
  l()
], T.prototype, "_overflowOpen", 2);
T = E([
  y("messagehub-panel")
], T);
export {
  T as MessageHubPanel
};
