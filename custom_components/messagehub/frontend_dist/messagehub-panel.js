/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Se = globalThis, Ue = Se.ShadowRoot && (Se.ShadyCSS === void 0 || Se.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Re = Symbol(), Ye = /* @__PURE__ */ new WeakMap();
let St = class {
  constructor(e, s, r) {
    if (this._$cssResult$ = !0, r !== Re) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (Ue && e === void 0) {
      const r = s !== void 0 && s.length === 1;
      r && (e = Ye.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), r && Ye.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Ut = (t) => new St(typeof t == "string" ? t : t + "", void 0, Re), $ = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((r, a, i) => r + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + t[i + 1], t[0]);
  return new St(s, t, Re);
}, Rt = (t, e) => {
  if (Ue) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const r = document.createElement("style"), a = Se.litNonce;
    a !== void 0 && r.setAttribute("nonce", a), r.textContent = s.cssText, t.appendChild(r);
  }
}, Xe = Ue ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const r of e.cssRules) s += r.cssText;
  return Ut(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: jt, defineProperty: Kt, getOwnPropertyDescriptor: Gt, getOwnPropertyNames: Wt, getOwnPropertySymbols: Vt, getPrototypeOf: qt } = Object, U = globalThis, Ze = U.trustedTypes, Jt = Ze ? Ze.emptyScript : "", Ne = U.reactiveElementPolyfillSupport, pe = (t, e) => t, Te = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Jt : null;
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
} }, je = (t, e) => !jt(t, e), Qe = { attribute: !0, type: String, converter: Te, reflect: !1, useDefault: !1, hasChanged: je };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), U.litPropertyMetadata ?? (U.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let se = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = Qe) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const r = Symbol(), a = this.getPropertyDescriptor(e, r, s);
      a !== void 0 && Kt(this.prototype, e, a);
    }
  }
  static getPropertyDescriptor(e, s, r) {
    const { get: a, set: i } = Gt(this.prototype, e) ?? { get() {
      return this[s];
    }, set(o) {
      this[s] = o;
    } };
    return { get: a, set(o) {
      const d = a == null ? void 0 : a.call(this);
      i == null || i.call(this, o), this.requestUpdate(e, d, r);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Qe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(pe("elementProperties"))) return;
    const e = qt(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(pe("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(pe("properties"))) {
      const s = this.properties, r = [...Wt(s), ...Vt(s)];
      for (const a of r) this.createProperty(a, s[a]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const s = litPropertyMetadata.get(e);
      if (s !== void 0) for (const [r, a] of s) this.elementProperties.set(r, a);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, r] of this.elementProperties) {
      const a = this._$Eu(s, r);
      a !== void 0 && this._$Eh.set(a, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const s = [];
    if (Array.isArray(e)) {
      const r = new Set(e.flat(1 / 0).reverse());
      for (const a of r) s.unshift(Xe(a));
    } else e !== void 0 && s.push(Xe(e));
    return s;
  }
  static _$Eu(e, s) {
    const r = s.attribute;
    return r === !1 ? void 0 : typeof r == "string" ? r : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const r of s.keys()) this.hasOwnProperty(r) && (e.set(r, this[r]), delete this[r]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Rt(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((s) => {
      var r;
      return (r = s.hostConnected) == null ? void 0 : r.call(s);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((s) => {
      var r;
      return (r = s.hostDisconnected) == null ? void 0 : r.call(s);
    });
  }
  attributeChangedCallback(e, s, r) {
    this._$AK(e, r);
  }
  _$ET(e, s) {
    var i;
    const r = this.constructor.elementProperties.get(e), a = this.constructor._$Eu(e, r);
    if (a !== void 0 && r.reflect === !0) {
      const o = (((i = r.converter) == null ? void 0 : i.toAttribute) !== void 0 ? r.converter : Te).toAttribute(s, r.type);
      this._$Em = e, o == null ? this.removeAttribute(a) : this.setAttribute(a, o), this._$Em = null;
    }
  }
  _$AK(e, s) {
    var i, o;
    const r = this.constructor, a = r._$Eh.get(e);
    if (a !== void 0 && this._$Em !== a) {
      const d = r.getPropertyOptions(a), c = typeof d.converter == "function" ? { fromAttribute: d.converter } : ((i = d.converter) == null ? void 0 : i.fromAttribute) !== void 0 ? d.converter : Te;
      this._$Em = a;
      const m = c.fromAttribute(s, d.type);
      this[a] = m ?? ((o = this._$Ej) == null ? void 0 : o.get(a)) ?? m, this._$Em = null;
    }
  }
  requestUpdate(e, s, r, a = !1, i) {
    var o;
    if (e !== void 0) {
      const d = this.constructor;
      if (a === !1 && (i = this[e]), r ?? (r = d.getPropertyOptions(e)), !((r.hasChanged ?? je)(i, s) || r.useDefault && r.reflect && i === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(d._$Eu(e, r)))) return;
      this.C(e, s, r);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: r, reflect: a, wrapped: i }, o) {
    r && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, o ?? s ?? this[e]), i !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || r || (s = void 0), this._$AL.set(e, s)), a === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
    var r;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [i, o] of this._$Ep) this[i] = o;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [i, o] of a) {
        const { wrapped: d } = o, c = this[i];
        d !== !0 || this._$AL.has(i) || c === void 0 || this.C(i, void 0, o, c);
      }
    }
    let e = !1;
    const s = this._$AL;
    try {
      e = this.shouldUpdate(s), e ? (this.willUpdate(s), (r = this._$EO) == null || r.forEach((a) => {
        var i;
        return (i = a.hostUpdate) == null ? void 0 : i.call(a);
      }), this.update(s)) : this._$EM();
    } catch (a) {
      throw e = !1, this._$EM(), a;
    }
    e && this._$AE(s);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var s;
    (s = this._$EO) == null || s.forEach((r) => {
      var a;
      return (a = r.hostUpdated) == null ? void 0 : a.call(r);
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
se.elementStyles = [], se.shadowRootOptions = { mode: "open" }, se[pe("elementProperties")] = /* @__PURE__ */ new Map(), se[pe("finalized")] = /* @__PURE__ */ new Map(), Ne == null || Ne({ ReactiveElement: se }), (U.reactiveElementVersions ?? (U.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ue = globalThis, et = (t) => t, Ae = ue.trustedTypes, tt = Ae ? Ae.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Tt = "$lit$", M = `lit$${Math.random().toFixed(9).slice(2)}$`, At = "?" + M, Yt = `<${At}>`, q = document, me = () => q.createComment(""), ge = (t) => t === null || typeof t != "object" && typeof t != "function", Ke = Array.isArray, Xt = (t) => Ke(t) || typeof (t == null ? void 0 : t[Symbol.iterator]) == "function", Oe = `[ 	
\f\r]`, de = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, st = /-->/g, at = />/g, K = RegExp(`>|${Oe}(?:([^\\s"'>=/]+)(${Oe}*=${Oe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), rt = /'/g, it = /"/g, Pt = /^(?:script|style|textarea|title)$/i, Zt = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), n = Zt(1), J = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), nt = /* @__PURE__ */ new WeakMap(), W = q.createTreeWalker(q, 129);
function Et(t, e) {
  if (!Ke(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return tt !== void 0 ? tt.createHTML(e) : e;
}
const Qt = (t, e) => {
  const s = t.length - 1, r = [];
  let a, i = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = de;
  for (let d = 0; d < s; d++) {
    const c = t[d];
    let m, g, u = -1, p = 0;
    for (; p < c.length && (o.lastIndex = p, g = o.exec(c), g !== null); ) p = o.lastIndex, o === de ? g[1] === "!--" ? o = st : g[1] !== void 0 ? o = at : g[2] !== void 0 ? (Pt.test(g[2]) && (a = RegExp("</" + g[2], "g")), o = K) : g[3] !== void 0 && (o = K) : o === K ? g[0] === ">" ? (o = a ?? de, u = -1) : g[1] === void 0 ? u = -2 : (u = o.lastIndex - g[2].length, m = g[1], o = g[3] === void 0 ? K : g[3] === '"' ? it : rt) : o === it || o === rt ? o = K : o === st || o === at ? o = de : (o = K, a = void 0);
    const f = o === K && t[d + 1].startsWith("/>") ? " " : "";
    i += o === de ? c + Yt : u >= 0 ? (r.push(m), c.slice(0, u) + Tt + c.slice(u) + M + f) : c + M + (u === -2 ? d : f);
  }
  return [Et(t, i + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), r];
};
class ve {
  constructor({ strings: e, _$litType$: s }, r) {
    let a;
    this.parts = [];
    let i = 0, o = 0;
    const d = e.length - 1, c = this.parts, [m, g] = Qt(e, s);
    if (this.el = ve.createElement(m, r), W.currentNode = this.el.content, s === 2 || s === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (a = W.nextNode()) !== null && c.length < d; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const u of a.getAttributeNames()) if (u.endsWith(Tt)) {
          const p = g[o++], f = a.getAttribute(u).split(M), v = /([.?@])?(.*)/.exec(p);
          c.push({ type: 1, index: i, name: v[2], strings: f, ctor: v[1] === "." ? ts : v[1] === "?" ? ss : v[1] === "@" ? as : Ee }), a.removeAttribute(u);
        } else u.startsWith(M) && (c.push({ type: 6, index: i }), a.removeAttribute(u));
        if (Pt.test(a.tagName)) {
          const u = a.textContent.split(M), p = u.length - 1;
          if (p > 0) {
            a.textContent = Ae ? Ae.emptyScript : "";
            for (let f = 0; f < p; f++) a.append(u[f], me()), W.nextNode(), c.push({ type: 2, index: ++i });
            a.append(u[p], me());
          }
        }
      } else if (a.nodeType === 8) if (a.data === At) c.push({ type: 2, index: i });
      else {
        let u = -1;
        for (; (u = a.data.indexOf(M, u + 1)) !== -1; ) c.push({ type: 7, index: i }), u += M.length - 1;
      }
      i++;
    }
  }
  static createElement(e, s) {
    const r = q.createElement("template");
    return r.innerHTML = e, r;
  }
}
function ae(t, e, s = t, r) {
  var o, d;
  if (e === J) return e;
  let a = r !== void 0 ? (o = s._$Co) == null ? void 0 : o[r] : s._$Cl;
  const i = ge(e) ? void 0 : e._$litDirective$;
  return (a == null ? void 0 : a.constructor) !== i && ((d = a == null ? void 0 : a._$AO) == null || d.call(a, !1), i === void 0 ? a = void 0 : (a = new i(t), a._$AT(t, s, r)), r !== void 0 ? (s._$Co ?? (s._$Co = []))[r] = a : s._$Cl = a), a !== void 0 && (e = ae(t, a._$AS(t, e.values), a, r)), e;
}
class es {
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
    const { el: { content: s }, parts: r } = this._$AD, a = ((e == null ? void 0 : e.creationScope) ?? q).importNode(s, !0);
    W.currentNode = a;
    let i = W.nextNode(), o = 0, d = 0, c = r[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let m;
        c.type === 2 ? m = new oe(i, i.nextSibling, this, e) : c.type === 1 ? m = new c.ctor(i, c.name, c.strings, this, e) : c.type === 6 && (m = new rs(i, this, e)), this._$AV.push(m), c = r[++d];
      }
      o !== (c == null ? void 0 : c.index) && (i = W.nextNode(), o++);
    }
    return W.currentNode = q, a;
  }
  p(e) {
    let s = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(e, r, s), s += r.strings.length - 2) : r._$AI(e[s])), s++;
  }
}
class oe {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, s, r, a) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = r, this.options = a, this._$Cv = (a == null ? void 0 : a.isConnected) ?? !0;
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
    e = ae(this, e, s), ge(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== J && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Xt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== h && ge(this._$AH) ? this._$AA.nextSibling.data = e : this.T(q.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var i;
    const { values: s, _$litType$: r } = e, a = typeof r == "number" ? this._$AC(e) : (r.el === void 0 && (r.el = ve.createElement(Et(r.h, r.h[0]), this.options)), r);
    if (((i = this._$AH) == null ? void 0 : i._$AD) === a) this._$AH.p(s);
    else {
      const o = new es(a, this), d = o.u(this.options);
      o.p(s), this.T(d), this._$AH = o;
    }
  }
  _$AC(e) {
    let s = nt.get(e.strings);
    return s === void 0 && nt.set(e.strings, s = new ve(e)), s;
  }
  k(e) {
    Ke(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let r, a = 0;
    for (const i of e) a === s.length ? s.push(r = new oe(this.O(me()), this.O(me()), this, this.options)) : r = s[a], r._$AI(i), a++;
    a < s.length && (this._$AR(r && r._$AB.nextSibling, a), s.length = a);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    var r;
    for ((r = this._$AP) == null ? void 0 : r.call(this, !1, !0, s); e !== this._$AB; ) {
      const a = et(e).nextSibling;
      et(e).remove(), e = a;
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
  constructor(e, s, r, a, i) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = s, this._$AM = a, this.options = i, r.length > 2 || r[0] !== "" || r[1] !== "" ? (this._$AH = Array(r.length - 1).fill(new String()), this.strings = r) : this._$AH = h;
  }
  _$AI(e, s = this, r, a) {
    const i = this.strings;
    let o = !1;
    if (i === void 0) e = ae(this, e, s, 0), o = !ge(e) || e !== this._$AH && e !== J, o && (this._$AH = e);
    else {
      const d = e;
      let c, m;
      for (e = i[0], c = 0; c < i.length - 1; c++) m = ae(this, d[r + c], s, c), m === J && (m = this._$AH[c]), o || (o = !ge(m) || m !== this._$AH[c]), m === h ? e = h : e !== h && (e += (m ?? "") + i[c + 1]), this._$AH[c] = m;
    }
    o && !a && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ts extends Ee {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class ss extends Ee {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class as extends Ee {
  constructor(e, s, r, a, i) {
    super(e, s, r, a, i), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = ae(this, e, s, 0) ?? h) === J) return;
    const r = this._$AH, a = e === h && r !== h || e.capture !== r.capture || e.once !== r.once || e.passive !== r.passive, i = e !== h && (r === h || a);
    a && this.element.removeEventListener(this.name, this, r), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var s;
    typeof this._$AH == "function" ? this._$AH.call(((s = this.options) == null ? void 0 : s.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class rs {
  constructor(e, s, r) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = r;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    ae(this, e);
  }
}
const is = { I: oe }, Ce = ue.litHtmlPolyfillSupport;
Ce == null || Ce(ve, oe), (ue.litHtmlVersions ?? (ue.litHtmlVersions = [])).push("3.3.2");
const ns = (t, e, s) => {
  const r = (s == null ? void 0 : s.renderBefore) ?? e;
  let a = r._$litPart$;
  if (a === void 0) {
    const i = (s == null ? void 0 : s.renderBefore) ?? null;
    r._$litPart$ = a = new oe(e.insertBefore(me(), i), i, void 0, s ?? {});
  }
  return a._$AI(t), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const V = globalThis;
let w = class extends se {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ns(s, this.renderRoot, this.renderOptions);
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
    return J;
  }
};
var kt;
w._$litElement$ = !0, w.finalized = !0, (kt = V.litElementHydrateSupport) == null || kt.call(V, { LitElement: w });
const Fe = V.litElementPolyfillSupport;
Fe == null || Fe({ LitElement: w });
(V.litElementVersions ?? (V.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const os = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ls = { attribute: !0, type: String, converter: Te, reflect: !1, hasChanged: je }, ds = (t = ls, e, s) => {
  const { kind: r, metadata: a } = s;
  let i = globalThis.litPropertyMetadata.get(a);
  if (i === void 0 && globalThis.litPropertyMetadata.set(a, i = /* @__PURE__ */ new Map()), r === "setter" && ((t = Object.create(t)).wrapped = !0), i.set(s.name, t), r === "accessor") {
    const { name: o } = s;
    return { set(d) {
      const c = e.get.call(this);
      e.set.call(this, d), this.requestUpdate(o, c, t, !0, d);
    }, init(d) {
      return d !== void 0 && this.C(o, void 0, t, d), d;
    } };
  }
  if (r === "setter") {
    const { name: o } = s;
    return function(d) {
      const c = this[o];
      e.call(this, d), this.requestUpdate(o, c, t, !0, d);
    };
  }
  throw Error("Unsupported decorator location: " + r);
};
function x(t) {
  return (e, s) => typeof s == "object" ? ds(t, e, s) : ((r, a, i) => {
    const o = a.hasOwnProperty(i);
    return a.constructor.createProperty(i, r), o ? Object.getOwnPropertyDescriptor(a, i) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function l(t) {
  return x({ ...t, state: !0, attribute: !1 });
}
function T(t) {
  const e = os(t);
  return (s, r) => customElements.get(t) ? s : e(s, r);
}
class hs {
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
    (i = e.severity) != null && i.length && s.set("severity", e.severity.join(",")), e.source && s.set("source", e.source), e.search && s.set("search", e.search), e.from && s.set("from", e.from), e.to && s.set("to", e.to), e.limit !== void 0 && s.set("limit", String(e.limit)), e.offset !== void 0 && s.set("offset", String(e.offset)), e.order && s.set("order", e.order), e.hideKnxRead && s.set("hide_knx_read", "1");
    const r = `${this.baseUrl}/api/messagehub/messages?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return await a.json();
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
    const r = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/status`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ status: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async setMessageSeverity(e, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/severity`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ severity: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async getMessageTags(e) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/tags`, {
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return (await s.json()).tags;
  }
  async addMessageTag(e, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tag: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()).tags;
  }
  async removeMessageTag(e, s) {
    const r = `${this.baseUrl}/api/messagehub/messages/${e}/tags?tag=${encodeURIComponent(s)}`, a = await fetch(r, { method: "DELETE", headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return (await a.json()).tags;
  }
  async getRunbookForSource(e, s) {
    const r = s ? `?fingerprint=${encodeURIComponent(s)}` : "", a = await fetch(
      `${this.baseUrl}/api/messagehub/runbook/${encodeURIComponent(e)}${r}`,
      { headers: this.headers() }
    );
    if (a.status === 404) return null;
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return await a.json();
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
  // Iter 56: Bulk-Patch fuer mehrere KNX-GAs in einem Request.
  async bulkPatchKnxAddresses(e, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses/bulk`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ addresses: e, patch: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async syncKnxProject(e, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses/sync`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ items: e, apply: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
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
    const r = await fetch(`${this.baseUrl}/api/messagehub/channels/${e}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(s)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
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
    const r = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ source: e, expected_interval_seconds: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
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
    const s = `${this.baseUrl}/api/messagehub/knx-addresses/${encodeURIComponent(e)}`, r = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
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
    var r;
    const s = new URLSearchParams();
    return (r = e.severity) != null && r.length && s.set("severity", e.severity.join(",")), e.source && s.set("source", e.source), e.search && s.set("search", e.search), e.from && s.set("from", e.from), e.to && s.set("to", e.to), s.set("format", e.format ?? "jsonl"), e.limit !== void 0 && s.set("limit", String(e.limit)), `${this.baseUrl}/api/messagehub/export?${s.toString()}`;
  }
  async deleteMessages(e = {}) {
    var o;
    const s = new URLSearchParams();
    (o = e.severity) != null && o.length && s.set("severity", e.severity.join(",")), e.source && s.set("source", e.source), e.search && s.set("search", e.search), e.from && s.set("from", e.from), e.to && s.set("to", e.to);
    const r = `${this.baseUrl}/api/messagehub/messages?${s.toString()}`, a = await fetch(r, { method: "DELETE", headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return (await a.json()).deleted;
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
    const r = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${e}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(s)
      }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
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
    const s = `${this.baseUrl}/api/messagehub/knx-stats/summary?${this._knxStatsParams(e).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsTop(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/top?${this._knxStatsParams(e).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsTopBySource(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/top-by-source?${this._knxStatsParams(e).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsGaDetail(e, s) {
    const r = `${this.baseUrl}/api/messagehub/knx-stats/ga/${encodeURIComponent(e)}?${this._knxStatsParams(s).toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsTimeline(e) {
    const s = this._knxStatsParams(e);
    s.set("gas", e.gas.join(",")), e.bucketMinutes !== void 0 && s.set("bucket", String(e.bucketMinutes));
    const r = `${this.baseUrl}/api/messagehub/knx-stats/timeline?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async acknowledgeKnxGa(e, s = {}) {
    const r = { ga: e };
    s.note !== void 0 && (r.note = s.note), s.expiryDays !== void 0 && (r.expiry_days = s.expiryDays);
    const a = await fetch(`${this.baseUrl}/api/messagehub/knx-stats/acknowledge`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(r)
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async getKnxStatsAlarms(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/alarms?${this._knxStatsParams(e).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  /** Iter 92 / K1: Saved Filters listen. */
  async listSavedFilters(e) {
    const s = `${this.baseUrl}/api/messagehub/saved-filters?scope=${encodeURIComponent(e)}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return (await r.json()).items;
  }
  /** Iter 92 / K1: Saved Filter speichern (upsert). */
  async upsertSavedFilter(e, s, r) {
    const a = `${this.baseUrl}/api/messagehub/saved-filters`, i = await fetch(a, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ name: e, scope: s, filters: r })
    });
    if (!i.ok) throw new Error(`HTTP ${i.status}: ${await i.text()}`);
    return await i.json();
  }
  /** Iter 92 / K1: Saved Filter loeschen. */
  async deleteSavedFilter(e) {
    const s = `${this.baseUrl}/api/messagehub/saved-filters/${e}`, r = await fetch(s, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  /** Iter 91 / WR-G: GA-Heatmap (Top-N GAs x Zeit-Buckets). */
  async getKnxStatsHeatmap(e, s = 10, r = 60) {
    const a = this._knxStatsParams(e);
    a.set("top_n", String(s)), a.set("bucket", String(r));
    const i = `${this.baseUrl}/api/messagehub/knx-stats/heatmap?${a.toString()}`, o = await fetch(i, { headers: this.headers() });
    if (!o.ok) throw new Error(`HTTP ${o.status}: ${await o.text()}`);
    return await o.json();
  }
  /** Iter 67 / WR-I: Trend-Vergleich aktueller Periode vs. Vorperiode. */
  async getKnxStatsTrend(e, s = 5) {
    const r = this._knxStatsParams(e);
    r.set("top_n", String(s));
    const a = `${this.baseUrl}/api/messagehub/knx-stats/trend?${r.toString()}`, i = await fetch(a, { headers: this.headers() });
    if (!i.ok) throw new Error(`HTTP ${i.status}: ${await i.text()}`);
    return await i.json();
  }
  async getKnxStatsOrphans(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/orphans?${this._knxStatsParams(e).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsSilence(e) {
    const s = this._knxStatsParams(e);
    e.maxSilenceMinutes !== void 0 && s.set("max_silence_min", String(e.maxSilenceMinutes));
    const r = `${this.baseUrl}/api/messagehub/knx-stats/silence?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsBusHealth(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/bus-health?${this._knxStatsParams(e).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsBusload(e, s) {
    const r = this._knxStatsParams(e);
    s && Number.isFinite(s) && s > 0 && r.set("bucket_seconds", String(Math.trunc(s)));
    const a = `${this.baseUrl}/api/messagehub/knx-stats/busload?${r.toString()}`, i = await fetch(a, { headers: this.headers() });
    if (!i.ok) throw new Error(`HTTP ${i.status}: ${await i.text()}`);
    return await i.json();
  }
  async getKnxStatsHealthScore(e) {
    const s = this._knxStatsParams(e), r = `${this.baseUrl}/api/messagehub/knx-stats/health-score?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsLongTerm(e, s = "auto") {
    const r = this._knxStatsParams(e);
    s !== "auto" && r.set("bucket", s);
    const a = `${this.baseUrl}/api/messagehub/knx-stats/long-term?${r.toString()}`, i = await fetch(a, { headers: this.headers() });
    if (!i.ok) throw new Error(`HTTP ${i.status}: ${await i.text()}`);
    return await i.json();
  }
  async getKnxStatsBursts(e, s = {}) {
    const r = this._knxStatsParams(e);
    s.windowSeconds && Number.isFinite(s.windowSeconds) && r.set("window_seconds", String(Math.trunc(s.windowSeconds))), s.thresholdPct && Number.isFinite(s.thresholdPct) && r.set("threshold_pct", String(s.thresholdPct));
    const a = `${this.baseUrl}/api/messagehub/knx-stats/bursts?${r.toString()}`, i = await fetch(a, { headers: this.headers() });
    if (!i.ok) throw new Error(`HTTP ${i.status}: ${await i.text()}`);
    return await i.json();
  }
  async getKnxStatsSensitiveLog(e) {
    const s = this._knxStatsParams(e), r = `${this.baseUrl}/api/messagehub/knx-stats/sensitive-log?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async setKnxStatsSensitive(e, s) {
    const r = `${this.baseUrl}/api/messagehub/knx-stats/sensitive/${encodeURIComponent(e)}`, a = await fetch(r, {
      method: s ? "POST" : "DELETE",
      headers: this.headers()
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async unacknowledgeKnxGa(e) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge/${encodeURIComponent(e)}`, r = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async acknowledgeKnxBulk(e, s = {}) {
    const r = new URLSearchParams();
    s.from && r.set("from", s.from), s.to && r.set("to", s.to);
    const a = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge-bulk?${r.toString()}`, i = { dev_source: e };
    s.note !== void 0 && (i.note = s.note), s.expiryDays !== void 0 && (i.expiry_days = s.expiryDays);
    const o = await fetch(a, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(i)
    });
    if (!o.ok) throw new Error(`HTTP ${o.status}: ${await o.text()}`);
    return await o.json();
  }
}
const N = $`
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
    /* Iter 59 / B2: caution = gelb, separat von warning (orange). KNX-Stats
       braucht 4-stufige Ampel gruen/gelb/orange/rot, mh-pill hatte nur 3
       (success/warning/error). Fallback ohne CSS-var: GoldenRod-Ton. */
    --mh-caution: var(--caution-color, #ca8a04);
    --mh-caution-soft: color-mix(in srgb, var(--caution-color, #ca8a04) 16%, transparent);
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
`, _e = $`
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
    /* Iter 60 / U12: Icon-Buttons sichtbarer durch dezente Border, sonst
       waren sie als reine Ghost-Buttons in der Top-Bar leicht zu
       übersehen. Border bleibt subtil (divider statt accent), Hover hebt
       hervor. */
    border-color: var(--mh-divider);
    color: var(--mh-fg);
  }
  .mh-btn--icon.mh-btn--ghost:hover:not(:disabled) {
    border-color: var(--mh-fg-muted);
  }
  .mh-btn--sm {
    padding: 4px 10px;
    font-size: var(--mh-text-xs);
  }
`, zt = $`
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
`, Ge = $`
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
`, xe = $`
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
  .mh-pill--caution {
    background: var(--mh-caution-soft);
    color: var(--mh-caution);
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
const cs = { CHILD: 2 }, ps = (t) => (...e) => ({ _$litDirective$: t, values: e });
let us = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, s, r) {
    this._$Ct = e, this._$AM = s, this._$Ci = r;
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
const { I: ms } = is, ot = (t) => t, lt = () => document.createComment(""), he = (t, e, s) => {
  var i;
  const r = t._$AA.parentNode, a = e === void 0 ? t._$AB : e._$AA;
  if (s === void 0) {
    const o = r.insertBefore(lt(), a), d = r.insertBefore(lt(), a);
    s = new ms(o, d, t, t.options);
  } else {
    const o = s._$AB.nextSibling, d = s._$AM, c = d !== t;
    if (c) {
      let m;
      (i = s._$AQ) == null || i.call(s, t), s._$AM = t, s._$AP !== void 0 && (m = t._$AU) !== d._$AU && s._$AP(m);
    }
    if (o !== a || c) {
      let m = s._$AA;
      for (; m !== o; ) {
        const g = ot(m).nextSibling;
        ot(r).insertBefore(m, a), m = g;
      }
    }
  }
  return s;
}, G = (t, e, s = t) => (t._$AI(e, s), t), gs = {}, vs = (t, e = gs) => t._$AH = e, fs = (t) => t._$AH, Ie = (t) => {
  t._$AR(), t._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const dt = (t, e, s) => {
  const r = /* @__PURE__ */ new Map();
  for (let a = e; a <= s; a++) r.set(t[a], a);
  return r;
}, bs = ps(class extends us {
  constructor(t) {
    if (super(t), t.type !== cs.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(t, e, s) {
    let r;
    s === void 0 ? s = e : e !== void 0 && (r = e);
    const a = [], i = [];
    let o = 0;
    for (const d of t) a[o] = r ? r(d, o) : o, i[o] = s(d, o), o++;
    return { values: i, keys: a };
  }
  render(t, e, s) {
    return this.dt(t, e, s).values;
  }
  update(t, [e, s, r]) {
    const a = fs(t), { values: i, keys: o } = this.dt(e, s, r);
    if (!Array.isArray(a)) return this.ut = o, i;
    const d = this.ut ?? (this.ut = []), c = [];
    let m, g, u = 0, p = a.length - 1, f = 0, v = i.length - 1;
    for (; u <= p && f <= v; ) if (a[u] === null) u++;
    else if (a[p] === null) p--;
    else if (d[u] === o[f]) c[f] = G(a[u], i[f]), u++, f++;
    else if (d[p] === o[v]) c[v] = G(a[p], i[v]), p--, v--;
    else if (d[u] === o[v]) c[v] = G(a[u], i[v]), he(t, c[v + 1], a[u]), u++, v--;
    else if (d[p] === o[f]) c[f] = G(a[p], i[f]), he(t, a[u], a[p]), p--, f++;
    else if (m === void 0 && (m = dt(o, f, v), g = dt(d, u, p)), m.has(d[u])) if (m.has(d[p])) {
      const k = g.get(o[f]), le = k !== void 0 ? a[k] : null;
      if (le === null) {
        const $e = he(t, a[u]);
        G($e, i[f]), c[f] = $e;
      } else c[f] = G(le, i[f]), he(t, a[u], le), a[k] = null;
      f++;
    } else Ie(a[p]), p--;
    else Ie(a[u]), u++;
    for (; f <= v; ) {
      const k = he(t, c[v + 1]);
      G(k, i[f]), c[f++] = k;
    }
    for (; u <= p; ) {
      const k = a[u++];
      k !== null && Ie(k);
    }
    return this.ut = o, vs(t, c), J;
  }
}), _s = new Intl.RelativeTimeFormat("de", { numeric: "auto" }), xs = [
  { unit: "year", seconds: 31536e3 },
  { unit: "month", seconds: 2592e3 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 }
];
function Dt(t, e = /* @__PURE__ */ new Date()) {
  const s = new Date(t);
  if (Number.isNaN(s.getTime())) return "—";
  const r = Math.round((s.getTime() - e.getTime()) / 1e3), a = Math.abs(r);
  if (a < 5) return "gerade eben";
  for (const { unit: i, seconds: o } of xs)
    if (a >= o) {
      const d = Math.round(r / o);
      return _s.format(d, i);
    }
  return "gerade eben";
}
function Lt(t, e = /* @__PURE__ */ new Date()) {
  const s = new Date(t);
  if (Number.isNaN(s.getTime())) return t;
  const r = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate(), a = s.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  return r ? a : `${s.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} ${a}`;
}
var ws = Object.defineProperty, ys = Object.getOwnPropertyDescriptor, we = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? ys(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && ws(e, s, a), a;
};
const ht = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·"
}, ct = {
  error: "Error",
  warning: "Warn",
  info: "Info",
  debug: "Debug"
}, $s = ["error", "warning", "info", "debug"];
let Y = class extends w {
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
      const r = t.currentTarget.getBoundingClientRect(), a = 200, i = r.bottom + a < window.innerHeight;
      this._popoverPos = {
        top: i ? r.bottom + 4 : r.top - a - 4,
        left: r.left
      }, this._editSeverityFor = e.id;
    }, this._onSeverityPick = (t, e, s, r) => {
      t.stopPropagation(), this._closePopover(), r !== s && this.dispatchEvent(
        new CustomEvent("severity-change", {
          detail: { id: e, severity: r, previous: s },
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
      return n``;
    const t = this.items.find((r) => r.id === this._editSeverityFor);
    if (!t) return n``;
    const e = t.severity ?? "info", s = t.id;
    return n`
      <div class="popover-backdrop" @click=${() => this._closePopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._popoverPos.top}px; left: ${this._popoverPos.left}px`}
        @click=${(r) => r.stopPropagation()}
      >
        ${$s.map(
      (r) => n`<button
            role="menuitemradio"
            aria-checked=${r === e}
            class=${`sev-option ${r === e ? "active" : ""}`}
            @click=${(a) => this._onSeverityPick(a, s, e, r)}
          >
            <span class=${`mh-pill mh-pill--${r}`}>
              <span class="sev-icon" aria-hidden="true">${ht[r]}</span>
              ${ct[r]}
            </span>
            ${r === e ? n`<span class="check" aria-hidden="true">✓</span>` : h}
          </button>`
    )}
      </div>
    `;
  }
  _renderHeader() {
    return n`
      <div class="header" role="row">
        <span class="col-sev" role="columnheader">Severity</span>
        <span class="col-ts" role="columnheader">Zeit</span>
        <span class="col-src" role="columnheader">Quelle</span>
        <span class="col-text" role="columnheader">Nachricht</span>
      </div>
    `;
  }
  render() {
    return this.items.length ? n`
      <div class="root">
        ${this._renderHeader()}
        <div class="scroll" role="list">
          ${bs(
      this.items,
      (t) => t.id,
      (t) => {
        const e = t.severity ?? "info", s = ct[e] ?? e, r = ht[e] ?? "·", a = Dt(t.timestamp, this._now), i = Lt(t.timestamp, this._now);
        return n`
                <div
                  class=${`row sev-${e} ${this._editSeverityFor === t.id ? "row-active" : ""}`}
                  tabindex="0"
                  role="listitem button"
                  @click=${() => this._onClick(t)}
                  @keydown=${(o) => this._onKey(o, t)}
                >
                  <span class="col-sev">
                    <button
                      class=${`mh-pill mh-pill--${e} sev-trigger`}
                      title="Severity ändern"
                      aria-haspopup="menu"
                      aria-expanded=${this._editSeverityFor === t.id}
                      @click=${(o) => this._onSeverityClick(o, t)}
                    >
                      <span class="sev-icon" aria-hidden="true">${r}</span>
                      ${s}
                      <span class="caret" aria-hidden="true">▾</span>
                    </button>
                  </span>
                  <span class="col-ts ts" title=${i}>${a}</span>
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
    ` : n`
        <div class="root">
          ${this._renderHeader()}
          <div class="empty">Keine Nachrichten</div>
        </div>
      `;
  }
};
Y.styles = [
  N,
  xe,
  $`
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
we([
  x({ attribute: !1 })
], Y.prototype, "items", 2);
we([
  l()
], Y.prototype, "_now", 2);
we([
  l()
], Y.prototype, "_editSeverityFor", 2);
we([
  l()
], Y.prototype, "_popoverPos", 2);
Y = we([
  T("message-table")
], Y);
var ks = Object.defineProperty, Ss = Object.getOwnPropertyDescriptor, Nt = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Ss(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && ks(e, s, a), a;
};
const pt = ["error", "warning", "info", "debug"];
let Pe = class extends w {
  constructor() {
    super(...arguments), this.selected = [...pt];
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
    return n`
      <div class="chips" role="group" aria-label="Severity-Filter">
        ${pt.map((t) => {
      const e = this.selected.includes(t);
      return n`<button
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
Pe.styles = [
  N,
  $`
      .chips {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      /* Iter 61 / U9: Inactive vs. Active visuell deutlicher
         differenzieren. Vorher unterschieden sich die States nur durch
         Hintergrundfarbe — bei Severity-Pills mit ohnehin farbigen Dots
         wirkten alle "aktiv". Jetzt: Inactive = Outline-Style mit
         deutlich gedämpftem Dot und gestrichelter Border; Active =
         Filled-Style mit Hintergrund + farbiger Border + Dot voll. */
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: var(--mh-radius-pill);
        border: 1px dashed var(--mh-divider);
        background: transparent;
        cursor: pointer;
        font: inherit;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg-muted);
        text-transform: capitalize;
        opacity: 0.6;
        transition: background var(--mh-transition-fast), color var(--mh-transition-fast),
          border-color var(--mh-transition-fast), opacity var(--mh-transition-fast);
      }
      .chip:hover {
        opacity: 0.85;
        background: var(--mh-surface-2);
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
        opacity: 0.5;
      }
      .chip.active {
        opacity: 1;
        border-style: solid;
        font-weight: var(--mh-weight-semibold);
      }
      .chip.active .dot {
        opacity: 1;
      }
      .chip.sev-error.active {
        background: var(--mh-error-soft);
        color: var(--mh-error);
        border-color: var(--mh-error);
      }
      .chip.sev-warning.active {
        background: var(--mh-warning-soft);
        color: var(--mh-warning);
        border-color: var(--mh-warning);
      }
      .chip.sev-info.active {
        background: var(--mh-info-soft);
        color: var(--mh-info);
        border-color: var(--mh-info);
      }
      .chip.sev-debug.active {
        background: var(--mh-debug-soft);
        color: var(--mh-debug);
        border-color: var(--mh-debug);
      }
    `
];
Nt([
  x({ attribute: !1 })
], Pe.prototype, "selected", 2);
Pe = Nt([
  T("severity-filter")
], Pe);
var Ts = Object.defineProperty, As = Object.getOwnPropertyDescriptor, ze = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? As(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && Ts(e, s, a), a;
};
let re = class extends w {
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
    return n`
      <select @change=${this._onChange} .value=${this.selected}>
        <option value="">Alle Quellen</option>
        ${this._sources.map((t) => n`<option value=${t}>${t}</option>`)}
      </select>
    `;
  }
};
re.styles = $`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `;
ze([
  x({ attribute: !1 })
], re.prototype, "api", 2);
ze([
  x({ attribute: !1 })
], re.prototype, "selected", 2);
ze([
  l()
], re.prototype, "_sources", 2);
re = ze([
  T("source-filter")
], re);
var Ps = Object.defineProperty, Es = Object.getOwnPropertyDescriptor, We = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Es(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && Ps(e, s, a), a;
};
let fe = class extends w {
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
    return n`
      <div class="presets">
        <button @click=${() => this._set("1h")}>1h</button>
        <button @click=${() => this._set("24h")}>24h</button>
        <button @click=${() => this._set("7d")}>7d</button>
        <button @click=${() => this._set("all")}>Alle</button>
      </div>
    `;
  }
};
fe.styles = $`
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
We([
  x({ attribute: !1 })
], fe.prototype, "fromIso", 2);
We([
  x({ attribute: !1 })
], fe.prototype, "toIso", 2);
fe = We([
  T("time-range-filter")
], fe);
var zs = Object.defineProperty, Ds = Object.getOwnPropertyDescriptor, j = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Ds(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && zs(e, s, a), a;
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
    return n`<span class=${`status-badge status-${this._status}`}>
      ${t[this._status] ?? this._status}
    </span>`;
  }
  render() {
    return n`
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

        ${this.msg.metadata ? n`<h3>Metadata</h3>
              <pre class="meta">${JSON.stringify(this.msg.metadata, null, 2)}</pre>` : h}

        <h3>Tags</h3>
        <div class="tags">
          ${this._tags.length === 0 ? n`<span class="hint">keine Tags</span>` : this._tags.map(
      (t) => n`
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

        ${this._runbook ? n`<h3>Runbook: ${this._runbook.title}</h3>
              <pre class="runbook">${this._runbook.markdown}</pre>` : h}

        <footer>
          <button class="del" @click=${this._delete}>Löschen</button>
        </footer>
      </aside>
    `;
  }
};
O.styles = $`
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
j([
  x({ attribute: !1 })
], O.prototype, "msg", 2);
j([
  x({ attribute: !1 })
], O.prototype, "api", 2);
j([
  l()
], O.prototype, "_status", 2);
j([
  l()
], O.prototype, "_tags", 2);
j([
  l()
], O.prototype, "_newTag", 2);
j([
  l()
], O.prototype, "_runbook", 2);
j([
  l()
], O.prototype, "_busy", 2);
O = j([
  T("detail-pane")
], O);
var Ls = Object.defineProperty, Ns = Object.getOwnPropertyDescriptor, C = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Ns(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && Ls(e, s, a), a;
};
const Os = ["debug", "info", "warning", "error"], Cs = JSON.stringify(
  {
    severity: "$.level",
    source: "$.app.name",
    text: "$.message",
    metadata: "$.extra"
  },
  null,
  2
), Be = /^[a-z0-9._-]{1,64}$/;
function Fs(t) {
  return t.toLowerCase().normalize("NFKD").replaceAll(/[äÄ]/g, "ae").replaceAll(/[öÖ]/g, "oe").replaceAll(/[üÜ]/g, "ue").replaceAll(/ß/g, "ss").replaceAll(/[\s/\\]+/g, "-").replaceAll(/[^a-z0-9._-]/g, "").slice(0, 64);
}
let D = class extends w {
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
        if (!Be.test(this._source))
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
    this._mappingText = Cs;
  }
  render() {
    const t = this.editing !== null;
    return n`
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
              ${this._source && Be.test(this._source) ? n`<span class="ok-badge" title="ok">✓</span>` : null}
            </span>
            <input
              type="text"
              class=${this._source && !Be.test(this._source) ? "invalid" : ""}
              .value=${this._source}
              @input=${(e) => {
      const s = e.target.value;
      this._source = Fs(s);
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
              ${Os.map(
      (e) => n`<option value=${e} ?selected=${this._severity === e}>${e}</option>`
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

        ${this._error ? n`<div class="error">${this._error}</div>` : null}

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
D.styles = $`
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
  x({ attribute: !1 })
], D.prototype, "api", 2);
C([
  x({ attribute: !1 })
], D.prototype, "editing", 2);
C([
  l()
], D.prototype, "_name", 2);
C([
  l()
], D.prototype, "_source", 2);
C([
  l()
], D.prototype, "_severity", 2);
C([
  l()
], D.prototype, "_enabled", 2);
C([
  l()
], D.prototype, "_mappingText", 2);
C([
  l()
], D.prototype, "_error", 2);
C([
  l()
], D.prototype, "_saving", 2);
D = C([
  T("webhook-form")
], D);
var Is = Object.defineProperty, Bs = Object.getOwnPropertyDescriptor, S = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Bs(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && Is(e, s, a), a;
};
const Hs = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/, He = ["debug", "info", "warning", "error"], ut = [...He, "auto"], Ot = "messagehub.knx-addresses.only-enabled";
function Ms() {
  try {
    const t = localStorage.getItem(Ot);
    return t === null ? !0 : t === "1" || t === "true";
  } catch {
    return !0;
  }
}
const Us = /^[\s\-_=]*$/, ce = 200;
let y = class extends w {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._filter = "", this._onlyEnabled = Ms(), this._hidePlaceholders = !0, this._displayedCount = ce, this._selected = /* @__PURE__ */ new Set(), this._bulkSeverityValue = "warning", this._bulkActionRunning = !1, this._newAddr = "", this._newLabel = "", this._newDpt = "", this._sevPopoverFor = null, this._sevPopoverPos = null, this._discovery = [], this._discoveryStatus = "loading", this._editing = null, this._toast = "", this._error = "";
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
    return n`<div class="discovery-status">${e}</div>`;
  }
  _onAddressInput(t) {
    const e = t.target.value;
    this._newAddr = e;
    const s = this._discovery.find((r) => r.address === e);
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
    } catch (r) {
      this._showToast(r.message);
      return;
    }
    const e = t.counts;
    if (e.add === 0 && e.update === 0 && e.delete === 0) {
      this._showToast("Projekt ist bereits synchron — nichts zu tun");
      return;
    }
    const s = `Abgleich mit ETS-Projekt anwenden?

${e.add} neue Einträge anlegen
${e.update} Einträge aktualisieren (label/dpt geändert → Logging-Konfig wird zurückgesetzt)
${e.delete} Einträge löschen (in ETS nicht mehr vorhanden → Lauschen wird beendet)
${e.keep} unveränderte Einträge bleiben bestehen.`;
    if (window.confirm(s)) {
      try {
        const a = (await this.api.syncKnxProject(this._discovery, !0)).counts;
        this._showToast(
          `Synchronisiert: +${a.added} angelegt, ${a.updated} aktualisiert, ${a.deleted} gelöscht`
        );
      } catch (r) {
        this._showToast(`Fehler beim Anwenden: ${r.message}`);
      }
      await this._load();
    }
  }
  async _add() {
    if (this._error = "", !this.api) return;
    const t = this._newAddr.trim();
    if (!Hs.test(t)) {
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
    let s = t.log_severity;
    e && (s === "info" || !s) && (s = "warning");
    try {
      await this.api.upsertKnxAddress({
        ...t,
        log_enabled: e,
        log_severity: s
      }), await this._load();
      const r = this._items.find((i) => i.address === t.address), a = !!(r != null && r.log_enabled);
      r !== void 0 && a !== e ? this._showToast(
        "Backend hat log_enabled nicht gesetzt — Browser-Cache leeren (Cmd+Shift+R) und HA-Container neu starten"
      ) : this._showToast(
        e ? `${t.address} im Protokoll aktiv` : `${t.address} aus Protokoll entfernt`
      );
    } catch (r) {
      this._showToast(r.message);
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
    const r = t.currentTarget.getBoundingClientRect(), a = 220, i = r.bottom + a < window.innerHeight;
    this._sevPopoverPos = {
      top: i ? r.bottom + 4 : r.top - a - 4,
      left: r.left
    }, this._sevPopoverFor = e.address;
  }
  async _onSeverityPick(t, e, s) {
    if (t.stopPropagation(), this._closeSevPopover(), s === e.log_severity || !this.api) return;
    const r = {
      address: e.address,
      log_severity: s
    };
    s === "auto" && (r.severity_on_true = e.severity_on_true ?? "warning", r.severity_on_false = e.severity_on_false ?? "info");
    const a = e.log_severity;
    this._items = this._items.map(
      (i) => i.address === e.address ? {
        ...i,
        log_severity: s,
        severity_on_true: r.severity_on_true ?? i.severity_on_true,
        severity_on_false: r.severity_on_false ?? i.severity_on_false
      } : i
    );
    try {
      await this.api.upsertKnxAddress({ ...e, ...r }), this._showToast(`${e.address}: Severity ${a} → ${s}`);
    } catch (i) {
      this._items = this._items.map(
        (o) => o.address === e.address ? { ...o, log_severity: a } : o
      ), this._showToast(`Fehlgeschlagen: ${i.message}`);
    }
  }
  _renderSevPopover() {
    if (this._sevPopoverFor === null || this._sevPopoverPos === null) return h;
    const t = this._items.find((s) => s.address === this._sevPopoverFor);
    if (!t) return h;
    const e = t.log_severity;
    return n`
      <div class="sev-backdrop" @click=${() => this._closeSevPopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._sevPopoverPos.top}px; left: ${this._sevPopoverPos.left}px`}
        @click=${(s) => s.stopPropagation()}
      >
        ${ut.map(
      (s) => n`<button
            role="menuitemradio"
            aria-checked=${s === e}
            class=${`sev-option ${s === e ? "active" : ""}`}
            @click=${(r) => void this._onSeverityPick(r, t, s)}
          >
            <span
              class=${`mh-pill mh-pill--${s === "auto" ? "neutral" : s}`}
            >${s}</span>
            ${s === e ? n`<span class="sev-check" aria-hidden="true">✓</span>` : h}
          </button>`
    )}
      </div>
    `;
  }
  async _onCsvFile(t) {
    var r;
    const e = (r = t.target.files) == null ? void 0 : r[0];
    if (!e || !this.api) return;
    const s = await e.text();
    try {
      const a = await this.api.importKnxCsv(s);
      this._showToast(
        `Import: ${a.imported} angelegt, ${a.skipped} übersprungen, ${a.errors} Fehler`
      ), await this._load();
    } catch (a) {
      this._showToast(`Import fehlgeschlagen: ${a.message}`);
    } finally {
      t.target.value = "";
    }
  }
  _showToast(t) {
    this._toast = t, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  // Iter 56b: Bulk-Toolbar erscheint, sobald >=1 GA ausgewaehlt ist.
  // Drei Aktionen: Loggen an, Loggen aus, Severity setzen. Auswahl
  // wird nach Erfolg geleert; bei Fehlern bleibt sie damit der User
  // nochmal probieren kann.
  _renderBulkToolbar() {
    const t = this._selected.size;
    return n`
      <div class="bulk-toolbar" role="toolbar" aria-label="Bulk-Aktionen">
        <span class="bulk-toolbar__count">${t} ausgewaehlt</span>
        <button
          class="mh-btn mh-btn--sm"
          ?disabled=${this._bulkActionRunning}
          @click=${() => void this._bulkApply({ log_enabled: !0 })}
          title=${`${t} GAs zum Logging aktivieren`}
        >
          Loggen aktivieren
        </button>
        <button
          class="mh-btn mh-btn--sm"
          ?disabled=${this._bulkActionRunning}
          @click=${() => void this._bulkApply({ log_enabled: !1 })}
          title=${`${t} GAs vom Logging entfernen`}
        >
          Loggen deaktivieren
        </button>
        <label class="bulk-toolbar__sev">
          <span>Severity:</span>
          <select
            .value=${this._bulkSeverityValue}
            @change=${(e) => this._bulkSeverityValue = e.target.value}
          >
            <option value="debug">debug</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
            <option value="auto">auto (Bool-Mapping)</option>
          </select>
          <button
            class="mh-btn mh-btn--sm"
            ?disabled=${this._bulkActionRunning}
            @click=${() => void this._bulkApply({ log_severity: this._bulkSeverityValue })}
          >
            Setzen
          </button>
        </label>
        <button
          class="mh-btn mh-btn--sm mh-btn--ghost"
          @click=${() => this._clearSelection()}
        >
          Auswahl aufheben
        </button>
      </div>
    `;
  }
  // Iter 56b: Multi-Select-Helfer. Auswahl wird bewusst NICHT beim
  // Filter-Wechsel zurueckgesetzt — wer "warm" 50 GAs ausgewaehlt hat
  // und dann sucht, kann die Auswahl behalten.
  _toggleSelect(t) {
    const e = new Set(this._selected);
    e.has(t) ? e.delete(t) : e.add(t), this._selected = e;
  }
  _toggleSelectAllVisible(t) {
    const e = t.every((r) => this._selected.has(r)), s = new Set(this._selected);
    if (e)
      for (const r of t) s.delete(r);
    else
      for (const r of t) s.add(r);
    this._selected = s;
  }
  _clearSelection() {
    this._selected = /* @__PURE__ */ new Set();
  }
  async _bulkApply(t) {
    if (!this.api || this._selected.size === 0 || this._bulkActionRunning) return;
    const e = Array.from(this._selected);
    this._bulkActionRunning = !0;
    try {
      const s = await this.api.bulkPatchKnxAddresses(e, t);
      this._showToast(
        `${s.updated} von ${s.address_count} GAs aktualisiert`
      ), this._clearSelection(), await this._load();
    } catch (s) {
      this._showToast(`Bulk-Edit fehlgeschlagen: ${s.message}`);
    } finally {
      this._bulkActionRunning = !1;
    }
  }
  _filtered() {
    let t = this._items;
    this._onlyEnabled && (t = t.filter((s) => !!s.log_enabled)), this._hidePlaceholders && (t = t.filter(
      (s) => !!s.log_enabled || !Us.test(s.label || "")
    ));
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
    return n`
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

          ${t.log_enabled ? n`
                <label>
                  <span>Severity</span>
                  <select
                    .value=${t.log_severity}
                    @change=${(s) => {
      const r = s.target.value;
      e({ log_severity: r });
    }}
                  >
                    ${ut.map(
      (s) => n`<option value=${s}>${s}</option>`
    )}
                  </select>
                  <small>
                    <code>auto</code> nutzt für Boolean-DPTs (1.x) die
                    Severity-Map unten — z. B. für Stör-Bits, die bei
                    <code>True</code> einen Fehler bedeuten.
                  </small>
                </label>
                ${t.log_severity === "auto" ? n`<div class="row-2">
                      <label>
                        <span>Severity bei <code>True</code></span>
                        <select
                          .value=${t.severity_on_true ?? "warning"}
                          @change=${(s) => e({
      severity_on_true: s.target.value
    })}
                        >
                          ${He.map(
      (s) => n`<option value=${s}>${s}</option>`
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
      (s) => n`<option value=${s}>${s}</option>`
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
    const t = this._filtered(), e = t.slice(0, this._displayedCount), s = t.length > e.length, r = this._items.filter((a) => a.log_enabled).length;
    return n`
      <section>
        <header class="head">
          <div>
            <h2>KNX-Gruppenadressen</h2>
            <p class="hint">
              ${this._items.length} Adressen,
              <strong>${r} im Protokoll aktiv</strong>. Voraussetzung
              für die Bus-Erfassung: HA-KNX-Integration mit IP-Tunneling/Routing
              ist eingerichtet — sie feuert das Event <code>knx_event</code>, das
              wir gegen diese Whitelist matchen. Nicht-aktivierte GAs werden
              ignoriert.
            </p>
          </div>
          <div class="header-actions">
            ${this._discovery.length > 0 ? n`<button
                  class="mh-btn"
                  title=${`Intelligenter Abgleich: ${this._discovery.length} GAs aus ETS — neue anlegen, geänderte aktualisieren, fehlende löschen, unveränderte unangetastet`}
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
            @keydown=${(a) => {
      a.key === "Enter" && this._add();
    }}
          />
          <datalist id="knx-discovery-list">
            ${this._discovery.map(
      (a) => n`<option value=${a.address}>
                  ${a.name}${a.dpt ? ` (DPT ${a.dpt})` : ""}
                </option>`
    )}
          </datalist>
          <input
            type="text"
            class="mh-input"
            placeholder="Label (z. B. Störung Heizung Pumpe)"
            .value=${this._newLabel}
            @input=${(a) => this._newLabel = a.target.value}
            @keydown=${(a) => {
      a.key === "Enter" && this._add();
    }}
          />
          <input
            type="text"
            class="mh-input narrow"
            placeholder="DPT (z. B. 1.001)"
            .value=${this._newDpt}
            @input=${(a) => this._newDpt = a.target.value}
            @keydown=${(a) => {
      a.key === "Enter" && this._add();
    }}
          />
          <button class="mh-btn mh-btn--primary" @click=${this._add}>+ Hinzufügen</button>
        </div>
        ${this._discovery.length > 0 ? n`<p class="hint">
              💡 Tipp: Beim Tippen in das GA-Feld erscheinen Vorschläge aus dem
              ETS-Projekt — Label und DPT werden dann automatisch vorbefüllt.
            </p>` : null}
        ${this._renderDiscoveryStatus()}
        ${this._error ? n`<div class="error">${this._error}</div>` : h}

        <div class="filter-bar">
          <input
            type="search"
            class="mh-input"
            placeholder="Suche (GA / Label / DPT)…"
            .value=${this._filter}
            @input=${(a) => {
      this._filter = a.target.value, this._displayedCount = ce;
    }}
          />
          <label class="toggle">
            <input
              type="checkbox"
              .checked=${this._onlyEnabled}
              @change=${(a) => {
      this._onlyEnabled = a.target.checked, this._displayedCount = ce;
      try {
        localStorage.setItem(
          Ot,
          this._onlyEnabled ? "1" : "0"
        );
      } catch {
      }
    }}
            />
            <span>nur aktive</span>
          </label>
          <label class="toggle" title="ETS-Platzhalter ohne Label (z. B. '-----') ausblenden">
            <input
              type="checkbox"
              .checked=${this._hidePlaceholders}
              @change=${(a) => {
      this._hidePlaceholders = a.target.checked, this._displayedCount = ce;
    }}
            />
            <span>Platzhalter ausblenden</span>
          </label>
          <span class="muted">
            ${e.length} sichtbar${s ? n` von ${t.length}` : h}
          </span>
        </div>

        ${this._loading ? n`<p class="muted">lade…</p>` : e.length === 0 ? n`<div class="empty">
                ${this._items.length === 0 ? n`<p>
                      Noch keine Adressen. Lege oben den ersten Eintrag an oder
                      importiere eine ETS-CSV.
                    </p>` : this._onlyEnabled && r === 0 ? n`<p>
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
                        </p>` : n`<p>
                        Keine Treffer für aktuelle Filter
                        (${this._items.length} Adressen total,
                        ${r} davon aktiv).
                      </p>`}
              </div>` : n`
                ${this._selected.size > 0 ? this._renderBulkToolbar() : h}
                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th class="col-select">
                          <input
                            type="checkbox"
                            aria-label="Alle sichtbaren auswaehlen"
                            .checked=${e.length > 0 && e.every((a) => this._selected.has(a.address))}
                            @change=${() => this._toggleSelectAllVisible(
      e.map((a) => a.address)
    )}
                          />
                        </th>
                        <th>GA</th>
                        <th>Label</th>
                        <th>DPT</th>
                        <th>Severity</th>
                        <th class="col-toggle">Loggen</th>
                        <th class="col-actions"></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${e.map(
      (a) => n`
                          <tr class=${a.log_enabled ? "enabled" : ""}>
                            <td class="col-select">
                              <input
                                type="checkbox"
                                aria-label=${`${a.address} auswaehlen`}
                                .checked=${this._selected.has(a.address)}
                                @change=${() => this._toggleSelect(a.address)}
                              />
                            </td>
                            <td><code class="ga">${a.address}</code></td>
                            <td class="label-cell">${a.label}</td>
                            <td>
                              ${a.dpt ? n`<code class="dpt">${a.dpt}</code>` : n`<span class="muted">—</span>`}
                            </td>
                            <td>
                              ${a.log_enabled ? n`<button
                                    class=${`mh-pill mh-pill--${a.log_severity === "auto" ? "neutral" : a.log_severity} sev-trigger`}
                                    title="Severity ändern"
                                    aria-haspopup="menu"
                                    aria-expanded=${this._sevPopoverFor === a.address}
                                    @click=${(i) => this._onSeverityTrigger(i, a)}
                                  >
                                    <span class="mh-pill__dot"></span>
                                    ${a.log_severity}${a.log_severity === "auto" ? n` <small class="auto-detail"
                                          >T:${a.severity_on_true ?? "warning"}
                                          / F:${a.severity_on_false ?? "info"}</small
                                        >` : h}
                                    <span class="sev-caret" aria-hidden="true">▾</span>
                                  </button>` : n`<!-- Iter 60 / U8: bei inaktiven GAs
                                       Default-Severity in muted Pille
                                       statt nur "—". User sieht direkt,
                                       was beim Loggen-Aktivieren greifen
                                       würde. -->
                                  <span
                                    class="mh-pill mh-pill--neutral sev-pill--inactive"
                                    title="Severity beim Aktivieren (Loggen ist aus)"
                                    >${a.log_severity || "warning"}</span
                                  >`}
                            </td>
                            <td class="col-toggle">
                              <label class="switch" title=${a.log_enabled ? "Loggen deaktivieren" : "Loggen aktivieren"}>
                                <input
                                  type="checkbox"
                                  .checked=${a.log_enabled}
                                  @change=${() => void this._toggleLog(a)}
                                  aria-label=${a.log_enabled ? "Loggen deaktivieren" : "Loggen aktivieren"}
                                />
                                <span class="slider"></span>
                              </label>
                            </td>
                            <td class="col-actions">
                              <button
                                class="icon-btn"
                                title="Bearbeiten"
                                aria-label="Bearbeiten"
                                @click=${() => this._editing = a}
                              >
                                <span aria-hidden="true">✎</span>
                              </button>
                              <button
                                class="icon-btn danger"
                                title="Löschen"
                                aria-label="Löschen"
                                @click=${() => void this._delete(a.address)}
                              >
                                <span aria-hidden="true">🗑</span>
                              </button>
                            </td>
                          </tr>
                        `
    )}
                    </tbody>
                  </table>
                  ${s ? n`<div class="load-more">
                        <button
                          class="mh-btn"
                          @click=${() => this._displayedCount = Math.min(
      this._displayedCount + ce,
      t.length
    )}
                        >
                          Mehr laden (${t.length - e.length} weitere)
                        </button>
                        <button
                          class="mh-btn mh-btn--ghost"
                          @click=${() => this._displayedCount = t.length}
                        >
                          Alle ${t.length} zeigen
                        </button>
                      </div>` : h}
                </div>
              `}

        ${this._renderEditor()}
        ${this._renderSevPopover()}
        ${this._toast ? n`<div class="toast">${this._toast}</div>` : h}
      </section>
    `;
  }
};
y.styles = [
  N,
  _e,
  zt,
  xe,
  $`
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
      /* Iter 56b: Bulk-Toolbar + Select-Spalte */
      .bulk-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mh-space-2);
        padding: var(--mh-space-2) var(--mh-space-3);
        margin-bottom: var(--mh-space-2);
        background: var(--mh-info-soft, rgba(0, 120, 255, 0.08));
        border: 1px solid var(--mh-info);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
      }
      .bulk-toolbar__count {
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-info);
      }
      .bulk-toolbar__sev {
        display: inline-flex;
        align-items: center;
        gap: var(--mh-space-1);
      }
      .bulk-toolbar__sev select {
        padding: 4px 6px;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        background: var(--mh-bg);
        font-size: var(--mh-text-sm);
      }
      .col-select {
        width: 32px;
        text-align: center;
      }
      /* Iter 55: Load-more Footer fuer paginierte Liste */
      .load-more {
        display: flex;
        justify-content: center;
        gap: var(--mh-space-2);
        padding: var(--mh-space-3);
        border-top: 1px solid var(--mh-divider);
        background: var(--mh-bg);
      }
      .mh-btn--ghost {
        background: transparent;
        color: var(--mh-fg-muted);
      }
      .mh-btn--ghost:hover {
        color: var(--mh-fg);
        background: var(--mh-bg-hover, rgba(0, 0, 0, 0.04));
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
        /* Iter 57: Sentence-Case statt CAPS-Lock — leserlicher */
        letter-spacing: 0.02em;
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
      /* Iter 60 / U8: Default-Severity bei inaktiven GAs in muted Pille
         mit gestricheltem Border, damit sie als "noch nicht aktiv"
         erkennbar ist und sich klar von acked/active-Pills abhebt. */
      .sev-pill--inactive {
        opacity: 0.65;
        border: 1px dashed var(--mh-divider);
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
S([
  x({ attribute: !1 })
], y.prototype, "api", 2);
S([
  l()
], y.prototype, "_items", 2);
S([
  l()
], y.prototype, "_loading", 2);
S([
  l()
], y.prototype, "_filter", 2);
S([
  l()
], y.prototype, "_onlyEnabled", 2);
S([
  l()
], y.prototype, "_hidePlaceholders", 2);
S([
  l()
], y.prototype, "_displayedCount", 2);
S([
  l()
], y.prototype, "_selected", 2);
S([
  l()
], y.prototype, "_bulkSeverityValue", 2);
S([
  l()
], y.prototype, "_bulkActionRunning", 2);
S([
  l()
], y.prototype, "_newAddr", 2);
S([
  l()
], y.prototype, "_newLabel", 2);
S([
  l()
], y.prototype, "_newDpt", 2);
S([
  l()
], y.prototype, "_sevPopoverFor", 2);
S([
  l()
], y.prototype, "_sevPopoverPos", 2);
S([
  l()
], y.prototype, "_discovery", 2);
S([
  l()
], y.prototype, "_discoveryStatus", 2);
S([
  l()
], y.prototype, "_editing", 2);
S([
  l()
], y.prototype, "_toast", 2);
S([
  l()
], y.prototype, "_error", 2);
y = S([
  T("knx-addresses-view")
], y);
var Rs = Object.defineProperty, js = Object.getOwnPropertyDescriptor, ye = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? js(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && Rs(e, s, a), a;
};
const Ks = ["telegram", "pushover", "ntfy", "signal", "notify"], Gs = ["debug", "info", "warning", "error"];
let X = class extends w {
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
    const s = t.config ?? {}, r = (a, i) => {
      e({ config: { ...s, [a]: i } });
    };
    return t.channel_type === "telegram" ? n`
        <div class="row-2">
          <label>
            <span>Bot-Token</span>
            <input
              type="password"
              placeholder="123456:ABC..."
              .value=${s.bot_token ?? ""}
              @input=${(a) => r("bot_token", a.target.value)}
            />
            <small>Vom @BotFather erhalten.</small>
          </label>
          <label>
            <span>Chat-ID</span>
            <input
              placeholder="-100123456789 oder 12345678"
              .value=${s.chat_id ?? ""}
              @input=${(a) => r("chat_id", a.target.value)}
            />
            <small>An @userinfobot eine Nachricht senden, dort steht die ID.</small>
          </label>
        </div>
      ` : t.channel_type === "pushover" ? n`
        <div class="row-2">
          <label>
            <span>App-Token</span>
            <input
              type="password"
              placeholder="azGDORePK8gMaC0QOYAMyEEuzJnyUi"
              .value=${s.app_token ?? ""}
              @input=${(a) => r("app_token", a.target.value)}
            />
          </label>
          <label>
            <span>User-Key</span>
            <input
              .value=${s.user_key ?? ""}
              @input=${(a) => r("user_key", a.target.value)}
            />
          </label>
        </div>
        <label>
          <span>Gerät (optional)</span>
          <input
            placeholder="iphone, oder leer = alle Geräte"
            .value=${s.device ?? ""}
            @input=${(a) => r("device", a.target.value)}
          />
        </label>
      ` : t.channel_type === "ntfy" ? n`
        <div class="row-2">
          <label>
            <span>Server (Default ntfy.sh)</span>
            <input
              placeholder="https://ntfy.sh"
              .value=${s.base_url ?? ""}
              @input=${(a) => r("base_url", a.target.value)}
            />
          </label>
          <label>
            <span>Topic</span>
            <input
              placeholder="ha_alerts_dein_topic"
              .value=${s.topic ?? ""}
              @input=${(a) => r("topic", a.target.value)}
            />
          </label>
        </div>
        <label>
          <span>Auth-Token (optional, für geschützte Server)</span>
          <input
            type="password"
            .value=${s.token ?? ""}
            @input=${(a) => r("token", a.target.value)}
          />
        </label>
      ` : n`
      <label>
        <span>Notify-Service-Name (ohne <code>notify.</code>)</span>
        <input
          placeholder="z. B. mobile_app_iphone, signal_messenger"
          .value=${s.service ?? ""}
          @input=${(a) => r("service", a.target.value)}
        />
      </label>
    `;
  }
  _renderEditor() {
    const t = this._editing, e = (s) => {
      this._editing = { ...t, ...s };
    };
    return n`
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
      const r = s.target.value;
      e({ channel_type: r, config: {} });
    }}
            >
              ${Ks.map((s) => n`<option value=${s}>${s}</option>`)}
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
      const r = s.target.value;
      e({ severity_threshold: r });
    }}
              >
                ${Gs.map((s) => n`<option value=${s}>${s}</option>`)}
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
    return n`
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
        ${this._items.length === 0 ? n`<p class="empty">Noch kein Channel angelegt.</p>` : n`<table>
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
        var e, s, r, a, i;
        return n`<tr>
                    <td>${t.name}</td>
                    <td>
                      <code>${t.channel_type}</code>
                      ${t.channel_type === "telegram" ? n` → <small>${((e = t.config) == null ? void 0 : e.chat_id) ?? "?"}</small>` : t.channel_type === "pushover" ? n` → <small>${((r = (s = t.config) == null ? void 0 : s.user_key) == null ? void 0 : r.slice(0, 8)) ?? "?"}…</small>` : t.channel_type === "ntfy" ? n` → <small>${((a = t.config) == null ? void 0 : a.topic) ?? "?"}</small>` : (i = t.config) != null && i.service ? n` → <code>notify.${t.config.service}</code>` : n`<span class="muted">— unkonfiguriert</span>`}
                    </td>
                    <td>${t.severity_threshold}</td>
                    <td>
                      ${t.quiet_start && t.quiet_end ? n`${t.quiet_start}–${t.quiet_end}${t.quiet_bypass_error ? n` <small>(Err bypass)</small>` : ""}` : n`<span class="muted">—</span>`}
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
        ${this._toast ? n`<div class="toast">${this._toast}</div>` : null}
      </section>
    `;
  }
};
X.styles = $`
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
ye([
  x({ attribute: !1 })
], X.prototype, "api", 2);
ye([
  l()
], X.prototype, "_items", 2);
ye([
  l()
], X.prototype, "_editing", 2);
ye([
  l()
], X.prototype, "_toast", 2);
X = ye([
  T("channels-view")
], X);
var Ws = Object.defineProperty, Vs = Object.getOwnPropertyDescriptor, P = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Vs(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && Ws(e, s, a), a;
};
const Ve = $`
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
let R = class extends w {
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
    return n`
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

        ${this._items.length === 0 ? n`<p class="empty">Noch keine Topics abonniert.</p>` : n`<table>
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
      (t) => n`<tr>
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
R.styles = Ve;
P([
  x({ attribute: !1 })
], R.prototype, "api", 2);
P([
  l()
], R.prototype, "_items", 2);
P([
  l()
], R.prototype, "_newPattern", 2);
P([
  l()
], R.prototype, "_newSource", 2);
P([
  l()
], R.prototype, "_newSeverity", 2);
R = P([
  T("mqtt-topics-view")
], R);
let Z = class extends w {
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
    return n`
      <section>
        <header>
          <h2>Heartbeat-Quellen</h2>
          <p class="hint">
            Der Heartbeat-Job prüft alle 60 s. Wenn <code>last_seen + 1.5 ×
            interval</code> überschritten ist, generiert er eine Warning mit
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
        ${this._items.length === 0 ? n`<p class="empty">Noch keine Heartbeat-Quellen.</p>` : n`<table>
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
      (t) => n`<tr>
                    <td><code>${t.source}</code></td>
                    <td>${t.expected_interval_seconds}</td>
                    <td>${t.last_seen ?? n`<span class="muted">—</span>`}</td>
                    <td>
                      ${t.silent_alert_active ? n`<span class="alert">⚠ silent</span>` : n`<span class="ok">✓ ok</span>`}
                    </td>
                  </tr>`
    )}
              </tbody>
            </table>`}
      </section>
    `;
  }
};
Z.styles = Ve;
P([
  x({ attribute: !1 })
], Z.prototype, "api", 2);
P([
  l()
], Z.prototype, "_items", 2);
P([
  l()
], Z.prototype, "_newSource", 2);
P([
  l()
], Z.prototype, "_newInterval", 2);
Z = P([
  T("heartbeats-view")
], Z);
let F = class extends w {
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
    return n`
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
        ${this._items.length === 0 ? n`<p class="empty">Noch keine Hooks.</p>` : n`<table>
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
      (t) => n`<tr>
                    <td>${t.name}</td>
                    <td><code>${t.source_pattern}</code></td>
                    <td><code>${t.automation_id}</code></td>
                    <td>
                      ${t.confirm_required ? n`<span class="muted">Vorschlag</span>` : n`<span class="alert">Auto</span>`}
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
F.styles = Ve;
P([
  x({ attribute: !1 })
], F.prototype, "api", 2);
P([
  l()
], F.prototype, "_items", 2);
P([
  l()
], F.prototype, "_newName", 2);
P([
  l()
], F.prototype, "_newSource", 2);
P([
  l()
], F.prototype, "_newAutomation", 2);
P([
  l()
], F.prototype, "_newAuto", 2);
F = P([
  T("remediation-view")
], F);
var qs = Object.defineProperty, Js = Object.getOwnPropertyDescriptor, H = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Js(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && qs(e, s, a), a;
};
const Ct = [
  { id: "webhooks", label: "Webhooks" },
  { id: "knx", label: "KNX-Bus" },
  { id: "channels", label: "Channels" },
  { id: "mqtt", label: "MQTT" },
  { id: "heartbeats", label: "Heartbeats" },
  { id: "remediation", label: "Auto-Remediation" }
], Ft = "messagehub.settings.tab";
function Ys() {
  try {
    const t = localStorage.getItem(Ft);
    if (t && Ct.some((e) => e.id === t)) return t;
  } catch {
  }
  return "webhooks";
}
let L = class extends w {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._showForm = !1, this._editing = null, this._toast = "", this._menuOpenId = null, this._activeTab = Ys(), this._closeMenu = () => {
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
      localStorage.setItem(Ft, t);
    } catch {
    }
  }
  _renderEmpty() {
    return n`
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
    return n`
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
          <div class="card-actions" @click=${(r) => r.stopPropagation()}>
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
              ${s ? n`<div class="overflow-menu" role="menu">
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

        ${t.field_map ? n`<details class="mapping">
              <summary>JSONPath-Mapping anzeigen</summary>
              <pre><code>${JSON.stringify(t.field_map, null, 2)}</code></pre>
            </details>` : null}
      </div>
    `;
  }
  render() {
    return n`
      <div class="root" @click=${this._closeMenu}>
        <nav class="tabs" role="tablist" aria-label="Einstellungs-Bereiche">
          ${Ct.map(
      (t) => n`<button
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

        ${this._toast ? n`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
  _renderActiveTab() {
    switch (this._activeTab) {
      case "webhooks":
        return this._renderWebhooks();
      case "knx":
        return n`<knx-addresses-view .api=${this.api}></knx-addresses-view>`;
      case "channels":
        return n`<channels-view .api=${this.api}></channels-view>`;
      case "mqtt":
        return n`<mqtt-topics-view .api=${this.api}></mqtt-topics-view>`;
      case "heartbeats":
        return n`<heartbeats-view .api=${this.api}></heartbeats-view>`;
      case "remediation":
        return n`<remediation-view .api=${this.api}></remediation-view>`;
    }
  }
  _renderWebhooks() {
    return n`
      <section>
        <header class="section-head">
          <div>
            <h2>Webhooks</h2>
            <p class="hint">
              Eingehende Nachrichten via HTTP-POST. Pro Webhook eigene URL +
              optionales JSONPath-Mapping für beliebige Payload-Strukturen.
            </p>
          </div>
          ${this._items.length > 0 && !this._showForm ? n`<button class="mh-btn mh-btn--primary" @click=${this._add}>
                + Webhook anlegen
              </button>` : null}
        </header>

        ${this._showForm ? n`<webhook-form
              .api=${this.api}
              .editing=${this._editing}
              @saved=${this._onSaved}
              @cancel=${this._onCancel}
            ></webhook-form>` : null}

        ${this._loading ? n`<p class="status">lade…</p>` : this._items.length === 0 && !this._showForm ? this._renderEmpty() : n`<div class="grid">${this._items.map((t) => this._renderItem(t))}</div>`}
      </section>
    `;
  }
};
L.styles = [
  N,
  _e,
  Ge,
  $`
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
H([
  x({ attribute: !1 })
], L.prototype, "api", 2);
H([
  l()
], L.prototype, "_items", 2);
H([
  l()
], L.prototype, "_loading", 2);
H([
  l()
], L.prototype, "_showForm", 2);
H([
  l()
], L.prototype, "_editing", 2);
H([
  l()
], L.prototype, "_toast", 2);
H([
  l()
], L.prototype, "_menuOpenId", 2);
H([
  l()
], L.prototype, "_activeTab", 2);
L = H([
  T("settings-view")
], L);
var Xs = Object.defineProperty, Zs = Object.getOwnPropertyDescriptor, Q = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Zs(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && Xs(e, s, a), a;
};
const mt = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
  debug: "Debug"
}, gt = {
  error: "var(--mh-error)",
  warning: "var(--mh-warning)",
  info: "var(--mh-info)",
  debug: "var(--mh-debug)"
}, vt = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], Qs = [1, 2, 3, 4, 5, 6, 0];
let I = class extends w {
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
    return e === 0 ? n`<p class="muted">Keine Daten in den letzten 30 Tagen.</p>` : n`
      <div class="heatmap-wrap">
        <div class="heatmap">
          <div class="heatmap-header">
            <span></span>
            ${Array.from(
      { length: 24 },
      (s, r) => n`<span class="hour-label">${r % 3 === 0 ? r : ""}</span>`
    )}
          </div>
          ${Qs.map((s, r) => {
      const a = t[s];
      return n`
              <div class="heatmap-row">
                <span class="day-label">${vt[r]}</span>
                ${a.map((i, o) => {
        const d = i === 0 ? 0 : Math.max(0.15, i / e), c = i === 0 ? "transparent" : `color-mix(in srgb, var(--mh-accent) ${Math.round(
          d * 100
        )}%, transparent)`;
        return n`
                    <div
                      class=${`heatmap-cell ${i === 0 ? "empty" : ""}`}
                      style=${`background: ${c}`}
                      title=${`${vt[r]} ${o}:00 — ${i} Nachricht${i === 1 ? "" : "en"}`}
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
    if (!this._stats) return n``;
    const t = this._stats.severity_24h, e = Object.values(t).reduce((r, a) => r + a, 0), s = ["error", "warning", "info", "debug"];
    return e === 0 ? n`<p class="muted">Keine Nachrichten in den letzten 24 Stunden.</p>` : n`
      <div class="stack-bar" role="img" aria-label="Severity-Verteilung der letzten 24 Stunden">
        ${s.map((r) => {
      const a = t[r] ?? 0;
      if (a === 0) return null;
      const i = a / e * 100;
      return n`
            <div
              class=${`stack-seg sev-${r}`}
              style=${`width: ${i}%; background: ${gt[r]}`}
              title=${`${mt[r]}: ${a} (${i.toFixed(0)}%)`}
            ></div>
          `;
    })}
      </div>
      <ul class="legend">
        ${s.map((r) => {
      const a = t[r] ?? 0, i = e > 0 ? a / e * 100 : 0;
      return n`
            <li>
              <span class="legend-dot" style=${`background: ${gt[r]}`}></span>
              <span class="legend-label">${mt[r]}</span>
              <span class="legend-count">${a.toLocaleString("de-DE")}</span>
              <span class="legend-pct muted">${i.toFixed(0)}%</span>
            </li>
          `;
    })}
      </ul>
    `;
  }
  render() {
    if (this._loading && !this._stats)
      return n`<div class="root"><p class="status">lade…</p></div>`;
    if (!this._stats)
      return n`<div class="root"><p class="status">Keine Daten verfügbar.</p></div>`;
    const t = this._stats, e = Object.values(t.severity_24h).reduce((i, o) => i + o, 0), s = t.severity_24h.error ?? 0, r = t.severity_24h.warning ?? 0, a = e > 0 ? s / e * 100 : 0;
    return n`
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
                ${e === 0 ? "—" : `${a.toFixed(1)} % Anteil`}
              </span>
            </div>
            <div class="kpi accent-warning">
              <span class="kpi-label">Warnings 24 h</span>
              <span class="kpi-value">${r}</span>
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
            ${this._sources.length === 0 ? n`<p class="muted">
                  Noch keine Quellen erfasst. Sobald die erste Nachricht reinkommt,
                  erscheint sie hier.
                </p>` : n`<ul class="sources">
                  ${this._sources.map(
      (i) => n`<li class="source-pill">${i}</li>`
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
            ${this._topSources.length === 0 ? n`<p class="muted">Keine Daten.</p>` : n`<ul class="top-sources">
                  ${this._topSources.map((i, o) => {
      var m;
      const d = ((m = this._topSources[0]) == null ? void 0 : m.count) ?? 1, c = i.count / d * 100;
      return n`<li>
                      <span class="rank">${o + 1}</span>
                      <code class="source-name">${i.source}</code>
                      <span class="bar-track">
                        <span class="bar-fill" style=${`width: ${c}%`}></span>
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
I.styles = [
  N,
  Ge,
  xe,
  $`
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
Q([
  x({ attribute: !1 })
], I.prototype, "api", 2);
Q([
  l()
], I.prototype, "_stats", 2);
Q([
  l()
], I.prototype, "_sources", 2);
Q([
  l()
], I.prototype, "_heatmap", 2);
Q([
  l()
], I.prototype, "_topSources", 2);
Q([
  l()
], I.prototype, "_loading", 2);
I = Q([
  T("stats-live-view")
], I);
var ea = Object.defineProperty, ta = Object.getOwnPropertyDescriptor, De = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? ta(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && ea(e, s, a), a;
};
const ke = [
  "var(--mh-error)",
  "var(--mh-warning)",
  "var(--mh-info)",
  "var(--mh-accent)",
  "var(--mh-success)"
];
let ie = class extends w {
  constructor() {
    super(...arguments), this.items = [], this.width = 600, this.height = 120;
  }
  render() {
    if (this.items.length === 0)
      return n`<p class="muted">Keine Timeline-Daten.</p>`;
    if (this.items.reduce((g, u) => g + u.count, 0) === 0)
      return n`<p class="muted">Keine Telegramme im Zeitraum.</p>`;
    const e = this._buildSeries(), s = this._allBuckets(), r = Math.max(1, ...this.items.map((g) => g.count)), a = { top: 8, right: 8, bottom: 18, left: 32 }, i = this.width - a.left - a.right, o = this.height - a.top - a.bottom, d = s.length === 1, c = (g) => d ? a.left + i / 2 : a.left + g / (s.length - 1) * i, m = (g) => a.top + (1 - g / r) * o;
    return n`
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
        <text x="2" y=${a.top + 4} class="axis-label">${r}</text>
        <text x="2" y=${this.height - a.bottom + 4} class="axis-label">0</text>

        <!-- Series -->
        ${e.map((g, u) => {
      const p = ke[u % ke.length];
      if (d) {
        const v = m(g.values[0] ?? 0);
        return n`<g class="series">
              <line
                x1=${a.left} y1=${v}
                x2=${this.width - a.right} y2=${v}
                stroke=${p}
                stroke-width="2"
                vector-effect="non-scaling-stroke"
              ></line>
              <circle cx=${c(0)} cy=${v} r="2.5" fill=${p}>
                <title>${g.ga}: ${g.values[0]}</title>
              </circle>
            </g>`;
      }
      const f = g.values.map((v, k) => `${c(k)},${m(v)}`).join(" ");
      return n`<g class="series">
            <polyline
              points=${f}
              fill="none"
              stroke=${p}
              stroke-width="2"
              vector-effect="non-scaling-stroke"
            ><title>${g.ga}</title></polyline>
            ${g.values.map(
        (v, k) => n`<circle cx=${c(k)} cy=${m(v)} r="2" fill=${p}>
                <title>${g.ga}: ${v}</title>
              </circle>`
      )}
          </g>`;
    })}
      </svg>
      <div class="legend">
        ${e.map(
      (g, u) => n`<span class="legend-item">
            <span
              class="dot"
              style=${`background: ${ke[u % ke.length]}`}
            ></span>
            <code>${g.ga}</code>
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
    const t = this._allBuckets(), e = new Map(t.map((r, a) => [r, a])), s = /* @__PURE__ */ new Map();
    for (const r of this.items) {
      let a = s.get(r.ga);
      a === void 0 && (a = new Array(t.length).fill(0), s.set(r.ga, a));
      const i = e.get(r.bucket);
      i !== void 0 && (a[i] = r.count);
    }
    return Array.from(s.entries()).map(([r, a]) => ({ ga: r, values: a }));
  }
};
ie.styles = [
  N,
  $`
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
De([
  x({ attribute: !1 })
], ie.prototype, "items", 2);
De([
  x({ type: Number })
], ie.prototype, "width", 2);
De([
  x({ type: Number })
], ie.prototype, "height", 2);
ie = De([
  T("knx-timeline-chart")
], ie);
var sa = Object.defineProperty, aa = Object.getOwnPropertyDescriptor, Le = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? aa(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && sa(e, s, a), a;
};
function ra(t) {
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
let ne = class extends w {
  constructor() {
    super(...arguments), this.points = [], this.width = 600, this.height = 80;
  }
  render() {
    const t = this.points.map((v) => ({ ts: v.ts, value: ra(v.value) })).filter((v) => v.value !== null);
    if (t.length < 2)
      return n`<p class="muted">
        Wertverlauf: zu wenige numerische Datenpunkte
        (${t.length} von ${this.points.length}).
      </p>`;
    const e = t.map((v) => v.value), s = Math.min(...e), r = Math.max(...e), a = r - s || 1, i = { top: 8, right: 8, bottom: 18, left: 40 }, o = this.width - i.left - i.right, d = this.height - i.top - i.bottom, c = (v) => i.left + v / Math.max(1, t.length - 1) * o, m = (v) => i.top + (1 - (v - s) / a) * d, g = t.map((v, k) => `${c(k)},${m(v.value)}`).join(" "), p = [...e.slice(1).map((v, k) => Math.abs(v - e[k]))].sort((v, k) => v - k), f = p[Math.floor(p.length / 2)];
    return n`
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
          <text x="2" y=${i.top + 4} class="axis-label">${r.toFixed(1)}</text>
          <text x="2" y=${this.height - i.bottom + 4} class="axis-label">${s.toFixed(1)}</text>
          <polyline points=${g} class="series" fill="none"></polyline>
        </svg>
        <p class="muted small">
          ${t.length} Punkte • Min ${s.toFixed(1)} • Max ${r.toFixed(1)} •
          Median Δ ${f.toFixed(2)}
          ${f < 0.1 && a > 0 ? n` <span class="hint">→ enge Hysterese</span>` : ia}
        </p>
      </div>
    `;
  }
};
ne.styles = [
  N,
  $`
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
Le([
  x({ attribute: !1 })
], ne.prototype, "points", 2);
Le([
  x({ type: Number })
], ne.prototype, "width", 2);
Le([
  x({ type: Number })
], ne.prototype, "height", 2);
ne = Le([
  T("knx-value-sparkline")
], ne);
const ia = "";
var na = Object.defineProperty, oa = Object.getOwnPropertyDescriptor, _ = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? oa(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && na(e, s, a), a;
};
const It = "messagehub.knx-stats.filters", la = /^[\s\-_=]*$/;
function da(t, e) {
  const s = (e ?? "").trim();
  return !!(s === "" || la.test(s) || s === t);
}
const ha = 25, ca = 100, pa = 300, Me = [
  { id: "1h", label: "1 Std", days: 1 / 24 },
  { id: "6h", label: "6 Std", days: 0.25 },
  { id: "24h", label: "24 Std", days: 1 },
  { id: "48h", label: "48 Std", days: 2 },
  { id: "7d", label: "7 Tage", days: 7 },
  { id: "30d", label: "30 Tage", days: 30 },
  { id: "365d", label: "365 Tage", days: 365 }
], ua = /* @__PURE__ */ new Set(["7d", "30d", "365d"]), ma = [10, 25, 50, 100, 200], ft = {
  periodId: "24h",
  topN: 25,
  topNDevices: 25,
  topNAudit: 25,
  topNBursts: 25,
  topNLongTerm: 25,
  topNTrend: 25,
  topNOrphansMissing: 25,
  topNOrphansExtra: 25,
  topNSilence: 25,
  topNBusHealth: 25,
  minRate: 1,
  includeAck: !0
};
function ga() {
  try {
    const t = localStorage.getItem(It);
    if (t) {
      const e = JSON.parse(t);
      return { ...ft, ...e };
    }
  } catch {
  }
  return { ...ft };
}
function z(t) {
  try {
    localStorage.setItem(It, JSON.stringify(t));
  } catch {
  }
}
function bt(t) {
  const e = Me.find((a) => a.id === t) ?? Me[2], s = /* @__PURE__ */ new Date();
  return { from: new Date(s.getTime() - e.days * 864e5).toISOString(), to: s.toISOString() };
}
const va = 48;
function fa() {
  const t = /* @__PURE__ */ new Date();
  return { from: new Date(t.getTime() - va * 3600 * 1e3).toISOString(), to: t.toISOString() };
}
function _t(t) {
  switch (t) {
    case "red":
      return "mh-pill--error";
    case "orange":
      return "mh-pill--warning";
    case "yellow":
      return "mh-pill--caution";
    case "green":
      return "mh-pill--success";
  }
}
const xt = {
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3
};
function ba(t, e, s) {
  return [...t].sort((a, i) => {
    let o;
    switch (e) {
      case "ga":
        o = a.ga.localeCompare(i.ga);
        break;
      case "label": {
        const d = !a.label, c = !i.label;
        if (d && c) o = 0;
        else {
          if (d) return 1;
          if (c) return -1;
          o = a.label.localeCompare(i.label);
        }
        break;
      }
      case "rate_per_min":
        o = a.rate_per_min - i.rate_per_min;
        break;
      case "recommended_rate":
        o = a.recommended_rate - i.recommended_rate;
        break;
      case "severity":
        o = xt[a.severity] - xt[i.severity];
        break;
    }
    return s === "desc" ? -o : o;
  });
}
let b = class extends w {
  constructor() {
    super(...arguments), this._filters = ga(), this._summary = null, this._busHealth = null, this._busload = null, this._health = null, this._longTerm = null, this._bursts = null, this._sensitiveLog = null, this._trend = null, this._heatmap = null, this._busAnalysisEnabled = !0, this._busAnalysisLoaded = !1, this._devicesSortKey = "count", this._devicesSortDir = "desc", this._topSortKey = "rate_per_min", this._topSortDir = "desc", this._orphansMissingFilter = "", this._orphansExtraFilter = "", this._orphansHidePlaceholders = !0, this._apiErrors = /* @__PURE__ */ new Map(), this._apiErrorsDismissed = !1, this._silence = null, this._orphans = null, this._alarms = null, this._top = [], this._topBySource = [], this._timeline = null, this._selectedGa = null, this._detail = null, this._detailLoading = !1, this._loading = !1, this._error = "", this._toast = "", this._onWindowKeyDown = (t) => {
      t.key === "Escape" && (this._detail !== null || this._detailLoading) && this._closeDetail();
    };
  }
  async firstUpdated() {
    await Promise.all([this._loadBusAnalysisState(), this._load()]);
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("keydown", this._onWindowKeyDown);
  }
  disconnectedCallback() {
    window.removeEventListener("keydown", this._onWindowKeyDown), super.disconnectedCallback();
  }
  _closeDetail() {
    this._selectedGa = null, this._detail = null, this._detailLoading = !1;
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
      alarms: "Alarme",
      trend: "Trend-Vergleich",
      heatmap: "Aktivitäts-Heatmap"
    }, s = t.map((r) => e[r] || r).join(", ");
    return n`
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
      ([r, a]) => n`<li><code>${r}</code>: ${a}</li>`
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
    const { from: t, to: e } = bt(this._filters.periodId);
    return {
      from: t,
      to: e,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck
    };
  }
  _isLongTermMode() {
    return ua.has(this._filters.periodId);
  }
  // Im Long-Term-Modus laufen die Raw-Endpunkte auf die letzten 48h —
  // alles dahinter liegt in der Counter-Tabelle und wird ueber den
  // Long-Term-Endpoint geliefert.
  _liveFiltersForRaw() {
    if (!this._isLongTermMode()) return this._apiFilters();
    const { from: t, to: e } = fa();
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
    const t = /* @__PURE__ */ new Map(), e = (s, r) => r.catch((a) => (t.set(s, a.message), null));
    try {
      const s = this._isLongTermMode(), r = this._apiFilters(), a = this._liveFiltersForRaw(), i = { ...a, limit: this._filters.topNDevices }, [
        o,
        d,
        c,
        m,
        g,
        u,
        p,
        f,
        v,
        k,
        le,
        $e,
        Bt,
        Ht
      ] = await Promise.all([
        this.api.getKnxStatsSummary(a),
        this.api.getKnxStatsTop(a),
        this.api.getKnxStatsTopBySource(i),
        this.api.getKnxStatsBusHealth(a),
        this.api.getKnxStatsSilence({
          ...a,
          maxSilenceMinutes: this._suggestSilenceMinutes()
        }),
        e("orphans", this.api.getKnxStatsOrphans(a)),
        e("alarms", this.api.getKnxStatsAlarms(a)),
        e(
          "busload",
          this.api.getKnxStatsBusload(a, this._suggestBusloadBucketSeconds())
        ),
        e("health-score", this.api.getKnxStatsHealthScore(a)),
        s ? e("long-term", this.api.getKnxStatsLongTerm(r)) : Promise.resolve(null),
        e("bursts", this.api.getKnxStatsBursts(a)),
        e("sensitive-log", this.api.getKnxStatsSensitiveLog(a)),
        e("trend", this.api.getKnxStatsTrend(a, 5)),
        e(
          "heatmap",
          this.api.getKnxStatsHeatmap(a, 10, this._suggestHeatmapBucketMinutes())
        )
      ]);
      this._summary = o, this._top = d.items, this._topBySource = c.items, this._busHealth = m, this._silence = g, this._orphans = u, this._alarms = p, this._busload = f, this._health = v, this._longTerm = k, this._bursts = le, this._sensitiveLog = $e, this._trend = Bt, this._heatmap = Ht, this._apiErrors = t, this._apiErrorsDismissed = !1;
      const Je = d.items.slice(0, 5).map((Mt) => Mt.ga);
      Je.length > 0 ? this._timeline = await this.api.getKnxStatsTimeline({
        ...a,
        gas: Je,
        bucketMinutes: this._suggestBucketMinutes()
      }) : this._timeline = null;
    } catch (s) {
      this._error = s.message, this._summary = null, this._top = [], this._topBySource = [], this._timeline = null, this._busHealth = null, this._silence = null, this._orphans = null, this._alarms = null, this._busload = null, this._health = null, this._longTerm = null, this._bursts = null, this._sensitiveLog = null, this._trend = null, this._heatmap = null;
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
  // Iter aiohttp-error-ZU9UA / P1: Heatmap-Bucket je Periode. Vorher
  // immer 60 min — bei 1h-Periode resultierte das in nur 1-2 Spalten,
  // die Heatmap wirkte leer. Backend-Limit max 60 min.
  // 1h → 5 min (12 Spalten)
  // 6h → 15 min (24 Spalten)
  // 24h+ → 60 min (24-N Spalten, Default)
  _suggestHeatmapBucketMinutes() {
    switch (this._filters.periodId) {
      case "1h":
        return 5;
      case "6h":
        return 15;
      case "24h":
      case "48h":
      default:
        return 60;
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
      this._closeDetail();
      return;
    }
    this._selectedGa = t, await this._loadDetail(t);
  }
  async _ackGa(t) {
    if (!this.api) return;
    const e = window.prompt(
      `Notiz für ${t} (optional, leer = keine Notiz):`,
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
    this._filters = { ...this._filters, periodId: t }, z(this._filters), this._load();
  }
  _onTopN(t) {
    this._filters = { ...this._filters, topN: t }, z(this._filters), this._load();
  }
  _onTopNDevices(t) {
    this._filters = { ...this._filters, topNDevices: t }, z(this._filters), this._load();
  }
  // Iter aiohttp-error-ZU9UA: Anzahl-Filter pro Card. Ein gemeinsamer
  // Setter-Helfer waere DRYer, aber jeder Filter hat einen eigenen
  // Schluessel — dafuer pro Card eine 4-Zeilen-Methode, klar lesbar.
  // Diese Setter loesen kein _load() aus, weil die Daten fuer kleinere
  // Tabellen schon im Speicher liegen — wir slicen nur anders.
  _onTopNAudit(t) {
    this._filters = { ...this._filters, topNAudit: t }, z(this._filters), this.requestUpdate();
  }
  _onTopNBursts(t) {
    this._filters = { ...this._filters, topNBursts: t }, z(this._filters), this.requestUpdate();
  }
  _onTopNLongTerm(t) {
    this._filters = { ...this._filters, topNLongTerm: t }, z(this._filters), this.requestUpdate();
  }
  _onTopNTrend(t) {
    this._filters = { ...this._filters, topNTrend: t }, z(this._filters), this.requestUpdate();
  }
  _onTopNOrphansMissing(t) {
    this._filters = { ...this._filters, topNOrphansMissing: t }, z(this._filters), this.requestUpdate();
  }
  _onTopNOrphansExtra(t) {
    this._filters = { ...this._filters, topNOrphansExtra: t }, z(this._filters), this.requestUpdate();
  }
  _onTopNSilence(t) {
    this._filters = { ...this._filters, topNSilence: t }, z(this._filters), this.requestUpdate();
  }
  _onTopNBusHealth(t) {
    this._filters = { ...this._filters, topNBusHealth: t }, z(this._filters), this.requestUpdate();
  }
  _renderInlineTopN(t, e) {
    return n`
      <span class="inline-topn-wrap">
        <span class="inline-topn-label">zeige</span>
        <span class="inline-topn" role="group" aria-label="Anzahl Einträge">
          ${ma.map(
      (s) => n`<button
              class=${`inline-topn__btn ${t === s ? "active" : ""}`}
              @click=${() => e(s)}
            >
              ${s}
            </button>`
    )}
        </span>
      </span>
    `;
  }
  _onMinRate(t) {
    this._filters = { ...this._filters, minRate: Math.max(0, t) }, z(this._filters), this._load();
  }
  _onAckToggle() {
    this._filters = { ...this._filters, includeAck: !this._filters.includeAck }, z(this._filters), this._load();
  }
  _renderFilterBar() {
    return n`
      <div class="filters" role="toolbar" aria-label="KNX-Stats-Filter">
        <div class="filter-group">
          <span class="filter-label">Zeitraum</span>
          <div class="seg">
            ${Me.map(
      (t) => n`<button
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
          class="mh-btn mh-btn--primary filter-refresh-btn"
          @click=${() => void this._load()}
          ?disabled=${this._loading}
          title="Alle Cards neu vom Backend laden"
        >
          <span class=${this._loading ? "filter-refresh-btn__spin" : ""} aria-hidden="true">↻</span>
          ${this._loading ? "lade…" : "Aktualisieren"}
        </button>
      </div>
    `;
  }
  _renderKpis() {
    const t = this._summary;
    if (t === null)
      return n`<p class="muted">Keine Daten verfuegbar.</p>`;
    const e = t.counts_by_severity, s = this._busload, r = s !== null ? s.summary.max_pct : t.estimated_busload_pct, a = r >= 30 ? "danger" : r >= 20 ? "warning" : r >= 10 ? "elevated" : "ok", i = (o) => o.toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    return n`
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
          <span class="kpi-label">Aktive Geräte</span>
          <span class="kpi-value">${t.active_devices.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">Source-Adressen</span>
        </div>
        <div class=${`kpi busload busload--${a}`}>
          <span class="kpi-label">Buslast</span>
          ${s === null ? n`<span class="kpi-value">${i(t.estimated_busload_pct)} %</span>
                <span class="kpi-hint">Ø über Zeitraum</span>` : n`<span class="kpi-value">${i(s.summary.max_pct)} %</span>
                <span class="kpi-hint">
                  jetzt ${i(s.summary.current_pct)} % · Ø ${i(s.summary.avg_pct)} %
                  · Bucket ${this._formatBucket(s.bucket_seconds)}
                </span>`}
          <!-- Iter 60 / U7: 0–100 %-Verlaufs-Bar statt nur Schwellen-
               Sprung. Hintergrund mit linear-gradient gruen→gelb→orange→
               rot, Marker an Position min(refPct, 100). -->
          <div
            class="busload-bar"
            role="meter"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow=${r.toFixed(1)}
            title=${`Buslast ${i(r)} % auf Skala 0–100`}
          >
            <div
              class="busload-bar__marker"
              style=${`left: ${Math.min(100, Math.max(0, r)).toFixed(1)}%;`}
            ></div>
          </div>
        </div>
      </div>
      <div class="severity-counts">
        ${["red", "orange", "yellow", "green"].map(
      (o) => n`<span class=${`mh-pill ${_t(o)}`}>
            <span class="mh-pill__dot"></span>
            ${this._severityLabel(o)}: ${e[o] ?? 0}
          </span>`
    )}
      </div>
    `;
  }
  _renderHealthScore() {
    const t = this._health;
    return n`
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
      (e) => {
        const s = t.components[e], r = this._componentSeverity(s);
        return n`<div
                  class=${`health-score__badge health-score__badge--${r}`}
                  title=${`${this._componentLabel(e)}: ${s}/100 (${this._healthLabel(r)})`}
                >
                  <span class="health-score__badge-label">${this._componentLabel(e)}</span>
                  <span class="health-score__badge-value">${s}</span>
                </div>`;
      }
    )}
          </div>
          ${t.findings.length > 0 ? n`<ul class="health-score__findings">
                ${t.findings.map(
      (e) => n`<li class=${`health-finding health-finding--${e.severity}`}>
                    <span class="health-finding__dot"></span>
                    <span>${e.message}</span>
                  </li>`
    )}
              </ul>` : n`<p class="muted small">Alle Indikatoren im gruenen Bereich.</p>`}
        </div>
      </section>
    `;
  }
  _healthLabel(t) {
    switch (t) {
      case "green":
        return "gesund";
      case "yellow":
        return "leicht erhöht";
      case "orange":
        return "auffällig";
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
        return "stumme Geräte";
      case "alarms":
        return "offene Alarme";
    }
  }
  /**
   * Iter aiohttp-error-ZU9UA / P2: Component-Score → Ampel-Severity.
   * Vorher zeigten alle 4 Komponenten gruene Balken, auch wenn der
   * Wert nur 21 war — das hat den Health-Score-Wert (76 / "leicht
   * erhoeht") inkonsistent wirken lassen. Jetzt eigene Severity pro
   * Komponente.
   *   ≥ 80 → green   "gesund"
   *   ≥ 60 → yellow  "leicht erhoeht"
   *   ≥ 40 → orange  "auffaellig"
   *   <  40 → red    "kritisch"
   */
  _componentSeverity(t) {
    return t >= 80 ? "green" : t >= 60 ? "yellow" : t >= 40 ? "orange" : "red";
  }
  // Iter 42: Sicherheits-Audit-Card ---------------------------------------
  _renderSensitiveLog() {
    const t = this._sensitiveLog, e = (a) => this._formatTs(a), s = this._filters.topNAudit, r = t.telegrams.slice(0, s);
    return n`
      <section class="mh-card sensitive">
        <header class="card-head">
          <h3>Sicherheits-Audit</h3>
          <span class="muted small">
            ${t.addresses.length} markierte GAs · ${t.telegrams.length} Telegramme im Zeitraum
          </span>
          ${this._renderInlineTopN(this._filters.topNAudit, (a) => this._onTopNAudit(a))}
        </header>
        <div class="sensitive__addresses">
          <h4>Sensitive GAs</h4>
          <ul class="sensitive__addr-list">
            ${t.addresses.map(
      (a) => n`<li>
                <code>${a.ga}</code>
                ${a.label ? n`<span class="muted small">${a.label}</span>` : h}
                ${a.dpt ? n`<span class="mh-pill mh-pill--neutral">${a.dpt}</span>` : h}
              </li>`
    )}
          </ul>
        </div>
        <div class="sensitive__telegrams">
          <h4>Letzte Telegramme</h4>
          ${t.telegrams.length === 0 ? n`<p class="muted small">Keine Aktivitaet im Zeitraum.</p>` : n`<div class="table-wrap">
                <table class="sensitive__table">
                  <thead>
                    <tr>
                      <th>Zeit</th>
                      <th>GA</th>
                      <th>Gerät</th>
                      <th>Wert</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${r.map(
      (a) => n`<tr>
                        <td class="bursts__ts">${e(a.ts)}</td>
                        <td>
                          <code>${a.ga}</code>
                          ${a.label ? n`<span class="muted small">${a.label}</span>` : h}
                        </td>
                        <td><code>${a.dev_source}</code></td>
                        <td><code>${a.value ?? "—"}</code></td>
                      </tr>`
    )}
                  </tbody>
                </table>
              </div>
              ${t.telegrams.length > s ? n`<p class="muted small">… und ${t.telegrams.length - s} weitere</p>` : h}`}
        </div>
      </section>
    `;
  }
  // Iter 41: Burst-Detector-Card -----------------------------------------
  _renderBursts() {
    const t = this._bursts, e = (i) => i.toLocaleString("de-DE"), s = (i) => i.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), r = this._filters.topNBursts, a = t.bursts.slice(0, r);
    return n`
      <section class="mh-card bursts">
        <header class="card-head">
          <h3>Telegrammfluten (Bursts)</h3>
          <span class="muted small">
            ${t.bursts.length} Spitzen über ${s(t.threshold_pct)} % Buslast
            (${t.window_seconds}s-Fenster)
          </span>
          ${this._renderInlineTopN(this._filters.topNBursts, (i) => this._onTopNBursts(i))}
        </header>
        <div class="bursts__intro">
          <p class="muted small">
            Kurze Spitzen, die im Period-Avg untergehen — typisch für
            Sturm-Automatik, gleichzeitige Rolladen-Befehle oder Szene-Trigger.
            Spalte „GAs" zeigt die Anzahl unterschiedlicher Gruppenadressen,
            „Geräte" die Anzahl unterschiedlicher Source-Adressen.
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
                <th class="num">Geräte</th>
              </tr>
            </thead>
            <tbody>
              ${a.map(
      (i) => n`<tr>
                  <td class="bursts__ts">${this._formatTs(i.bucket)}</td>
                  <td class="num">${e(i.telegrams)}</td>
                  <td class="num bursts__pct">${s(i.busload_pct)} %</td>
                  <td class="num">${i.ga_count}</td>
                  <td class="num">${i.source_count}</td>
                </tr>`
    )}
            </tbody>
          </table>
        </div>
        ${t.bursts.length > r ? n`<p class="muted small">… und ${t.bursts.length - r} weitere</p>` : h}
      </section>
    `;
  }
  // Iter 39: Long-Term-Modus-Hinweis + Counter-Karte ----------------------
  _renderLongTermBanner() {
    return n`
      <div class="long-term-banner">
        <span class="long-term-banner__icon">⏳</span>
        <div>
          <strong>Long-Term-Modus aktiv</strong>
          <p class="muted small">
            Periode über 48 Std — die Counter-Tabelle liefert Telegramm-Counts pro
            Stunde/Tag, aber keine Source-Adressen, keine Werte und keine Repeats.
            Live-KPIs darunter zeigen die letzten 48 Std aus den Roh-Telegrammen.
          </p>
        </div>
      </div>
    `;
  }
  _renderLongTerm() {
    const t = this._longTerm, e = Math.max(1, ...t.series.map((a) => a.count)), s = (a) => a.toLocaleString("de-DE"), r = this._filters.topNLongTerm;
    return n`
      <section class="mh-card long-term">
        <header class="card-head">
          <h3>Long-Term-Sicht</h3>
          <span class="muted small">
            ${s(t.total)} Telegramme · ${t.bucket === "day" ? "Tages-Buckets" : "Stunden-Buckets"}
          </span>
          ${this._renderInlineTopN(
      this._filters.topNLongTerm,
      (a) => this._onTopNLongTerm(a)
    )}
        </header>
        <div class="long-term__body">
          <div class="long-term__chart">
            ${t.series.length === 0 ? n`<p class="muted">Keine Daten in der Counter-Tabelle.</p>` : n`<div class="long-term__bars">
                  ${t.series.map(
      (a) => n`<div
                      class="long-term__bar"
                      style=${`height: ${a.count / e * 100}%`}
                      title="${a.bucket} — ${s(a.count)}"
                    ></div>`
    )}
                </div>`}
          </div>
          <div class="long-term__top">
            <h4>Top-GAs in der Periode</h4>
            ${t.top_gas.length === 0 ? n`<p class="muted small">Keine GAs aktiv.</p>` : n`<ol class="long-term__top-list">
                  ${t.top_gas.slice(0, r).map(
      (a) => n`<li>
                      <code>${a.ga}</code>
                      ${a.label ? n`<span class="muted small">${a.label}</span>` : h}
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
        return "leicht erhöht";
      case "orange":
        return "auffällig";
      case "red":
        return "kritisch";
    }
  }
  render() {
    return n`
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
        ${this._busAnalysisLoaded && !this._busAnalysisEnabled ? n`<div class="bus-analysis-banner">
              <strong>Bus-Analyse ist aus.</strong>
              Es werden keine neuen Telegramme erfasst — bestehende Daten bleiben
              sichtbar, altern aber raus (Raw 48 h, Counter 365 Tage). Toggle in
              der Filter-Leiste oben rechts schaltet sie wieder ein.
            </div>` : h}
        ${this._error ? n`<div class="error">${this._error}</div>` : h}
        ${this._alarms !== null && this._alarms.triggered_count > 0 ? this._renderAlarmBanner() : h}

        ${this._isLongTermMode() ? this._renderLongTermBanner() : h}

        <!--
          Iter aiohttp-error-ZU9UA: Reihenfolge nach mentalem User-Modell:
          1. At-a-glance: Übersicht-KPIs + Health-Score
          2. Haupttabellen: Top-Sender / Top-Geräte (+ Detail-Pane direkt darunter)
          3. Visuelle Auswertungen: Tagesverlauf, Heatmap, Trend
          4. Anomalie-Cards: Bursts, Stille-Alarme, Bus-Gesundheit
          5. Audit / Diagnose-Listen: Sicherheits-Audit, Verwaiste GAs
          6. Long-Term-Sicht (cond.) ans Ende
        -->

        <section class="mh-card kpi-card">
          <header class="card-head">
            <h3>${this._isLongTermMode() ? "Live-Snapshot (letzte 48 Std)" : "Uebersicht"}</h3>
            <span class="muted small">letzte ${this._filters.periodId}</span>
          </header>
          ${this._loading && this._summary === null ? n`<p class="muted">lade…</p>` : this._renderKpis()}
        </section>

        ${this._health !== null ? this._renderHealthScore() : h}

        <section class="mh-card">
          <header class="card-head">
            <h3>Top-Sender (Gruppenadressen)</h3>
            <div class="card-head__meta">
              ${this._renderInlineTopN(this._filters.topN, (t) => this._onTopN(t))}
              <span class="muted small">
                Welche GA sendet am häufigsten? · ${this._top.length} sichtbar
              </span>
            </div>
          </header>
          ${this._renderTopTable()}
        </section>

        ${this._topBySource.length > 0 ? n`<section class="mh-card">
              <header class="card-head">
                <h3>Top-Geräte (Source-Adressen)</h3>
                <div class="card-head__meta">
                  ${this._renderInlineTopN(
      this._filters.topNDevices,
      (t) => this._onTopNDevices(t)
    )}
                  <span class="muted small">
                    Welches physische Gerät erzeugt am meisten Last?
                  </span>
                </div>
              </header>
              ${this._renderTopBySource()}
            </section>` : h}

        ${this._detail !== null || this._detailLoading ? this._renderDetailPane() : h}

        ${this._timeline !== null && this._timeline.items.length > 0 ? n`<section class="mh-card">
              <header class="card-head">
                <h3>Tagesverlauf (Top-5, ${this._timeline.bucket_minutes}-Min-Buckets)</h3>
              </header>
              <knx-timeline-chart
                .items=${this._timeline.items}
                .width=${800}
                .height=${140}
              ></knx-timeline-chart>
            </section>` : h}

        ${this._heatmap !== null && this._heatmap.gas.length > 0 ? this._renderHeatmap() : h}

        ${this._trend !== null && (this._trend.total_now > 0 || this._trend.total_prev > 0) ? this._renderTrend() : h}

        ${this._bursts !== null && this._bursts.bursts.length > 0 ? this._renderBursts() : h}
        ${this._silence !== null && this._silence.alarm_count > 0 ? this._renderSilenceAlarms() : h}
        ${this._busHealth !== null && this._busHealth.summary.total > 0 ? this._renderBusHealth() : h}

        ${this._sensitiveLog !== null && this._sensitiveLog.addresses.length > 0 ? this._renderSensitiveLog() : h}
        ${this._orphans !== null && (this._orphans.missing_in_log.length > 0 || this._orphans.extra_in_log.length > 0) ? this._renderOrphans() : h}

        ${this._longTerm !== null ? this._renderLongTerm() : h}

        ${this._toast ? n`<div class="toast">${this._toast}</div>` : h}
      </div>
    `;
  }
  _renderTopTable() {
    if (this._loading && this._top.length === 0)
      return n`<p class="muted">lade…</p>`;
    if (this._top.length === 0)
      return n`<p class="muted">Keine Telegramme in diesem Zeitraum.</p>`;
    const t = this._topSortKey, e = this._topSortDir, s = ba(this._top, t, e);
    return n`
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("ga")}
                title="Nach Gruppenadresse sortieren"
              >
                GA${this._sortArrow(t, "ga", e)}
              </th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("label")}
                title="Nach Label sortieren"
              >
                Label${this._sortArrow(t, "label", e)}
              </th>
              <th>DPT</th>
              <th
                class="num sortable"
                @click=${() => this._toggleTopSort("rate_per_min")}
                title="Nach Telegrammen/Min sortieren"
              >
                Tel/Min${this._sortArrow(t, "rate_per_min", e)}
              </th>
              <th
                class="num sortable"
                @click=${() => this._toggleTopSort("recommended_rate")}
                title="Nach Soll-Rate sortieren"
              >
                Soll${this._sortArrow(t, "recommended_rate", e)}
              </th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("severity")}
                title="Nach Schweregrad sortieren"
              >
                Status${this._sortArrow(t, "severity", e)}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${s.map(
      (r, a) => n`<tr
                class=${`row-${r.severity} ${r.acknowledged ? "ack" : ""} ${this._selectedGa === r.ga ? "selected" : ""}`}
                @click=${() => void this._onSelectGa(r.ga)}
              >
                <td class="num muted">${a + 1}</td>
                <td><code class="ga">${r.ga}</code></td>
                <td class="label-cell" title=${r.label ?? ""}>
                  ${r.label ?? n`<span class="muted">—</span>`}
                </td>
                <td>
                  ${r.dpt ? n`<code
                        class=${`dpt ${r.dpt_inferred ? "dpt--inferred" : ""}`}
                        title=${r.dpt_inferred ? "DPT geraten aus Werten (im ETS-Projekt nicht gepflegt)" : ""}
                        >${r.dpt}${r.dpt_inferred ? n`<span class="dpt__hint" aria-hidden="true">?</span>` : h}</code
                      >` : n`<span class="muted">—</span>`}
                </td>
                <td class="num strong">${r.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td class="num muted">${r.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td>${this._renderTopRowStatus(r)}</td>
                <td class="actions">
                  ${r.acknowledged ? n`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(i) => {
        i.stopPropagation(), this._unackGa(r.ga);
      }}
                      >
                        ✗ Ack entfernen
                      </button>` : n`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(i) => {
        i.stopPropagation(), this._ackGa(r.ga);
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
  // Iter aiohttp-error-ZU9UA / P1: Detail-Pane als Side-Drawer.
  // Vorher inline am Tabellenende (User musste runterscrollen, Tabelle
  // war beim Lesen weg). Jetzt: position: fixed rechts, Backdrop links,
  // Tabelle bleibt sichtbar — User kann zwischen Detail und Tabelle
  // springen. Schliessen via X / Backdrop-Klick / Escape.
  _renderDetailPane() {
    const t = this._detailLoading && this._detail === null ? n`<p class="muted">lade Details…</p>` : this._detail === null ? n`` : this._renderDetailBody(this._detail);
    return n`
      <div
        class="detail-backdrop"
        @click=${() => this._closeDetail()}
        aria-hidden="true"
      ></div>
      <aside
        class="mh-card detail-pane"
        role="dialog"
        aria-modal="true"
        aria-label=${this._detail ? `Detail ${this._detail.ga} — ${this._detail.label ?? ""}` : "Detail laedt"}
      >
        <header class="card-head detail-head">
          ${this._detail !== null ? n`<div class="detail-head-text">
                <h3>${this._detail.ga} — ${this._detail.label ?? "Detail"}</h3>
                <span class="muted small">
                  Gerät:
                  <code>${this._detail.dev_source || "?"}</code>
                  ${this._detail.dpt ? n` • DPT <code>${this._detail.dpt}</code>` : h}
                </span>
              </div>` : n`<div class="detail-head-text"><h3>Detail</h3></div>`}
          <button
            class="mh-btn mh-btn--sm mh-btn--ghost detail-close"
            title="Schliessen (Escape)"
            aria-label="Detail schliessen"
            @click=${() => this._closeDetail()}
          >
            ✕ Schliessen
          </button>
        </header>
        <div class="detail-body">${t}</div>
      </aside>
    `;
  }
  _renderDetailBody(t) {
    const e = t.recommendation;
    return n`

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
          ${e.estimated_reduction_pct !== null ? n`<div class="detail-stat">
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

        ${t.findings.length > 0 ? n`<div class="findings">
              <strong>Erkannte Muster:</strong>
              <ul>
                ${t.findings.map(
      (s) => n`<li class=${`finding-${s.severity}`}>
                    <span class=${`mh-pill ${this._severityPillClass(s.severity)}`}>
                      ${s.kind}
                    </span>
                    <span>${s.text}</span>
                  </li>`
    )}
              </ul>
            </div>` : h}

        ${t.value_history.length >= 2 ? n`<div class="value-history">
              <strong>Wertverlauf:</strong>
              <knx-value-sparkline
                .points=${t.value_history}
                .width=${800}
                .height=${100}
              ></knx-value-sparkline>
            </div>` : h}

        ${t.device || t.manufacturer_hints ? this._renderDeviceInfo(t) : h}

        ${t.sibling_gas.length > 0 ? this._renderSiblingGas(t) : h}

        ${this._renderHaKnxLinks(t)}
    `;
  }
  /**
   * Iter 64 / WR-P: Direktlinks aus dem Detail-Pane.
   * Iter 68 / WR-F: + Werteverlauf-Export-Links (CSV/JSON).
   *
   * Tab-Wechsel innerhalb messagehub (z. B. zu Settings → KNX-Adressen
   * mit GA-Filter vorbefüllt) wuerde Top-Level-State-Sharing brauchen
   * — bewusst NICHT hier verdrahtet, weil das mehr Refactor-Aufwand
   * waere als der Mehrwert. User kann den GA-Code copy-pasten.
   */
  _renderHaKnxLinks(t) {
    const e = `https://knx-user-forum.de/forum/search?searchword=${encodeURIComponent(
      t.ga
    )}`, s = this._apiFilters(), r = new URLSearchParams();
    s.from && r.set("from", s.from), s.to && r.set("to", s.to);
    const a = `/api/messagehub/knx-stats/ga/${encodeURIComponent(
      t.ga
    )}/export?${r.toString()}`, i = `${a}&format=csv`, o = `${a}&format=json`;
    return n`
      <div class="ha-links">
        <strong>Schnell-Aktionen:</strong>
        <ul class="ha-links__list">
          <li>
            <a
              href="/config/integrations/integration/knx"
              target="_top"
              title="HA-Integration KNX-Konfig öffnen"
              >HA-KNX-Konfig öffnen ↗</a
            >
          </li>
          <li>
            <a
              href=${e}
              target="_blank"
              rel="noopener noreferrer"
              title="KNX-User-Forum nach GA-Code durchsuchen"
              >Im KNX-User-Forum suchen ↗</a
            >
          </li>
          <li>
            <a
              href=${i}
              download
              title="Werteverlauf als CSV-Datei herunterladen (max 50.000 Samples)"
              >⤓ CSV-Export</a
            >
          </li>
          <li>
            <a
              href=${o}
              download
              title="Werteverlauf als JSON-Datei herunterladen (max 50.000 Samples)"
              >⤓ JSON-Export</a
            >
          </li>
        </ul>
      </div>
    `;
  }
  _renderDeviceInfo(t) {
    const e = t.device, s = t.manufacturer_hints;
    return n`
      <div class="device-info">
        ${e ? n`<strong>
              Gerät: ${e.manufacturer || "?"}
              ${e.name ? n` — ${e.name}` : h}
              ${e.product ? n`<span class="muted small">(${e.product})</span>` : h}
            </strong>` : n`<strong>Hersteller-Hinweise</strong>`}
        ${s && s.tips.length > 0 ? n`<ul class="hints">
              ${s.tips.map((r) => n`<li>${r}</li>`)}
            </ul>` : h}
        ${s != null && s.doc_url ? n`<p class="muted small">
              Hersteller-Doku:
              <a href=${s.doc_url} target="_blank" rel="noopener noreferrer">
                ${s.doc_url}
              </a>
            </p>` : h}
      </div>
    `;
  }
  _renderSiblingGas(t) {
    return n`
      <div class="siblings">
        <strong>Andere GAs des Geräts <code>${t.dev_source}</code>:</strong>
        <ul>
          ${t.sibling_gas.slice(0, 10).map(
      (e) => n`<li
              class="sibling-row"
              @click=${() => void this._onSelectGa(e.ga)}
              title="Detail-Pane für ${e.ga} öffnen"
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
        ${t.sibling_gas.length > 10 ? n`<p class="muted small">
              … und ${t.sibling_gas.length - 10} weitere
            </p>` : h}
      </div>
    `;
  }
  // Iter 57: Sortier-Klick toggelt Richtung bei gleichem Key, sonst
  // wechselt auf den neuen Key mit desc als Default (haeufigste Werte
  // oben — typisch fuer "Top-N"-Tabellen).
  _toggleDevicesSort(t) {
    this._devicesSortKey === t ? this._devicesSortDir = this._devicesSortDir === "desc" ? "asc" : "desc" : (this._devicesSortKey = t, this._devicesSortDir = t === "dev_source" ? "asc" : "desc");
  }
  // Iter 60 / U5: Sort-Toggle Top-Sender. Default-Direction asc fuer
  // String-Spalten (ga, label), desc fuer numerische und severity (red
  // top zeigt Probleme zuerst).
  _toggleTopSort(t) {
    this._topSortKey === t ? this._topSortDir = this._topSortDir === "desc" ? "asc" : "desc" : (this._topSortKey = t, this._topSortDir = t === "ga" || t === "label" ? "asc" : "desc");
  }
  _sortArrow(t, e, s) {
    return t !== e ? h : n`<span class="sort-arrow" aria-hidden="true">${s === "desc" ? "▼" : "▲"}</span>`;
  }
  _renderTopBySource() {
    const t = this._filters.topNDevices, e = this._devicesSortKey, s = this._devicesSortDir, r = [...this._topBySource].sort((a, i) => {
      let o;
      return e === "dev_source" ? o = a.dev_source.localeCompare(i.dev_source) : o = (a[e] || 0) - (i[e] || 0), s === "desc" ? -o : o;
    });
    return n`
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th
                class="sortable"
                @click=${() => this._toggleDevicesSort("dev_source")}
                title="Nach Source-Adresse sortieren"
              >
                Gerät (Source)${this._sortArrow(e, "dev_source", s)}
              </th>
              <th>Hersteller / Modell</th>
              <th
                class="num sortable"
                @click=${() => this._toggleDevicesSort("ga_count")}
                title="Nach GA-Anzahl sortieren"
              >
                GAs${this._sortArrow(e, "ga_count", s)}
              </th>
              <th
                class="num sortable"
                @click=${() => this._toggleDevicesSort("count")}
                title="Nach Telegramm-Anzahl sortieren"
              >
                Telegramme${this._sortArrow(e, "count", s)}
              </th>
              <th class="num">Anteil</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${r.slice(0, t).map((a, i) => {
      var u;
      const o = ((u = this._summary) == null ? void 0 : u.total_telegrams) ?? 0, d = o > 0 ? a.count / o * 100 : 0, c = a.manufacturer ?? "", m = a.device_name ?? "", g = c && m ? `${c} — ${m}` : c || m;
      return n`<tr>
                <td class="num muted">${i + 1}</td>
                <td><code class="ga">${a.dev_source}</code></td>
                <td class="device-cell">
                  ${g ? n`<span
                        class="muted small device-cell__text"
                        title=${g}
                        >${g}</span
                      >` : n`<span class="muted small">—</span>`}
                </td>
                <td class="num">${a.ga_count}</td>
                <td class="num strong">${a.count.toLocaleString("de-DE")}</td>
                <td class="num muted">
                  ${d.toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })} %
                </td>
                <td class="actions">
                  <button
                    class="mh-btn mh-btn--sm mh-btn--ghost"
                    title="Alle GAs dieses Geräts als bekannt markieren"
                    @click=${(p) => {
        p.stopPropagation(), this._ackBulk(a.dev_source);
      }}
                  >
                    ✓ Alle ${a.ga_count} bekannt
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
      `Alle GAs des Geräts ${t} als bekannt markieren?`
    ))
      return;
    const e = window.prompt(
      `Notiz für Bulk-Ack ${t} (optional):`,
      "akzeptiert nach Prüfung"
    );
    if (e !== null)
      try {
        const { from: s, to: r } = bt(this._filters.periodId), a = await this.api.acknowledgeKnxBulk(t, {
          note: e || void 0,
          from: s,
          to: r
        });
        this._showToast(
          `${t}: ${a.count} GAs als bekannt markiert`
        ), await this._load();
      } catch (s) {
        this._showToast(`Bulk-Ack fehlgeschlagen: ${s.message}`);
      }
  }
  _renderAlarmBanner() {
    const e = this._alarms.alarms.filter((s) => s.triggered);
    return n`
      <section class="alarm-banner">
        <strong>⚠ ${e.length} Alarm(e) aktiv</strong>
        <ul>
          ${e.map(
      (s) => n`<li>
              <span class="alarm-rule">${s.rule}</span>
              <span class="alarm-msg">${s.message}</span>
            </li>`
    )}
        </ul>
      </section>
    `;
  }
  // Iter 61 / U3: Filter-Helper case-insensitive auf address/label/dpt.
  _matchesOrphanFilter(t, e) {
    if (t === "") return !0;
    const s = t.toLowerCase();
    return e.some(
      (r) => typeof r == "string" && r.toLowerCase().includes(s)
    );
  }
  /**
   * Iter 67 / WR-I: Trend-Vergleich aktuelle Periode vs. Vorperiode.
   * Eine Card mit Total-Delta + Top-3 Anstiege + Top-3 Abnahmen.
   * Vorperiode hat dieselbe Laenge unmittelbar davor.
   */
  _renderTrend() {
    const t = this._trend, e = t.total_delta_pct !== null ? `${t.total_delta_pct > 0 ? "+" : ""}${t.total_delta_pct.toLocaleString(
      "de-DE",
      { minimumFractionDigits: 1, maximumFractionDigits: 1 }
    )} %` : "neu", s = (d) => d.delta_pct === null ? d.delta_abs > 0 ? "neu" : "verstummt" : `${d.delta_pct > 0 ? "+" : ""}${d.delta_pct.toLocaleString("de-DE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    })} %`, r = this._classifyTrendSeverity(t.total_delta_pct), a = this._filters.topNTrend, i = this._isShortTrendPeriod(), o = this._isLongRetentionGapPeriod() && t.total_prev === 0;
    return n`
      <section class=${`mh-card trend trend--${r}`}>
        <header class="card-head">
          <h3>Trend gegenüber Vorperiode</h3>
          <span class="muted small">
            Aktuell ${t.total_now.toLocaleString("de-DE")} Telegramme ·
            zuvor ${t.total_prev.toLocaleString("de-DE")} ·
            <strong>${e}</strong>
          </span>
          ${o ? h : this._renderInlineTopN(
      this._filters.topNTrend,
      (d) => this._onTopNTrend(d)
    )}
        </header>
        ${o ? n`<p class="trend-retention-hint muted small">
              Vergleich nicht verfuegbar fuer diese Periode — Raw-Telegramme
              werden nur 48 Stunden vorgehalten, die Vorperiode liegt
              ausserhalb. Fuer aussagekraeftige Trends 1 Std / 6 Std / 24 Std
              waehlen.
            </p>` : i ? n`<p class="trend-short-hint muted small">
                Hinweis: Bei kurzen Perioden vergleicht sich z. B. 04–05 Uhr mit
                03–04 Uhr — Tag/Nacht-Übergaenge und Automation-Trigger lassen
                die %-Werte oft 4-stellig wirken. Fuer aussagekraeftige Trends
                mind. 24 Std waehlen.
              </p>` : h}
        ${o ? h : n`<div class="trend-grid">
          <div class="trend-col">
            <strong>Größte Anstiege</strong>
            ${t.top_increase.length === 0 ? n`<p class="muted small">Keine signifikanten Anstiege.</p>` : n`<ul class="trend-list trend-list--up">
                  ${t.top_increase.slice(0, a).map(
      (d) => n`<li>
                      <code class="ga">${d.ga}</code>
                      <span class="trend-label muted"
                        >${d.label ?? "—"}</span
                      >
                      <span class="trend-delta trend-delta--up"
                        >+${d.delta_abs.toLocaleString("de-DE")} ·
                        ${s(d)}</span
                      >
                    </li>`
    )}
                </ul>`}
          </div>
          <div class="trend-col">
            <strong>Größte Rückgänge</strong>
            ${t.top_decrease.length === 0 ? n`<p class="muted small">Keine signifikanten Rückgänge.</p>` : n`<ul class="trend-list trend-list--down">
                  ${t.top_decrease.slice(0, a).map(
      (d) => n`<li>
                      <code class="ga">${d.ga}</code>
                      <span class="trend-label muted"
                        >${d.label ?? "—"}</span
                      >
                      <span class="trend-delta trend-delta--down"
                        >${d.delta_abs.toLocaleString("de-DE")} ·
                        ${s(d)}</span
                      >
                    </li>`
    )}
                </ul>`}
          </div>
        </div>`}
      </section>
    `;
  }
  /**
   * Iter 67: Ampel-Schwellen fuer den Total-Trend. Konservativ:
   * |delta| < 25 % = green (normales Atmen), 25-100 % = yellow,
   * 100-300 % = orange, > 300 % = red.
   *
   * Iter aiohttp-error-ZU9UA / P1: bei kurzen Perioden (1h/6h) wird die
   * Severity auf "green" gedeckelt. Ein 1h-vs-1h-Vergleich erwischt
   * regelmaessig Tag/Nacht-Uebergaenge oder Automation-Trigger und
   * produziert haeufig 4-stellige %-Spruenge — der rote Alarm-Look
   * verschreckt den User unnoetig. Stattdessen zeigt die Trend-Card
   * einen erklaerenden Hinweis (siehe `_renderTrend`).
   */
  _classifyTrendSeverity(t) {
    if (this._isShortTrendPeriod()) return "green";
    if (t === null) return "yellow";
    const e = Math.abs(t);
    return e < ha ? "green" : e < ca ? "yellow" : e < pa ? "orange" : "red";
  }
  _isShortTrendPeriod() {
    return this._filters.periodId === "1h" || this._filters.periodId === "6h";
  }
  /**
   * Iter aiohttp-error-ZU9UA / Trend-Fix A: Periode, deren Vorperiode
   * komplett ausserhalb der 48h-Raw-Retention liegt. compute_trend
   * liest aus knx_raw_telegrams (48h Cap), also ist total_prev fuer
   * diese Perioden zwangslaeufig 0 — der Vergleich ist sinnlos.
   *
   * 48h: Vorperiode 48-96h zurueck → ausserhalb
   * 7d / 30d / 365d: Vorperiode noch viel weiter zurueck → ausserhalb
   *
   * 24h ist Grenzfall (Vorperiode 24-48h, am Rand der Retention) — wir
   * lassen es noch durch und vertrauen auf die echten Daten.
   */
  _isLongRetentionGapPeriod() {
    return ["48h", "7d", "30d", "365d"].includes(this._filters.periodId);
  }
  /**
   * Iter 91 / WR-G: GA-Heatmap als CSS-Grid. Zeilen = Top-N GAs,
   * Spalten = Zeit-Buckets, Zellen = Telegramm-Counts mit Color-Intensity
   * relativ zum Maximum. SVG-frei (CSS-Grid + color-mix).
   */
  _renderHeatmap() {
    const t = this._heatmap;
    if (t.gas.length === 0 || t.buckets.length === 0) return n``;
    const e = t.matrix.flat().reduce((r, a) => a > r ? a : r, 1), s = (r) => r.slice(11, 16) || r;
    return n`
      <section class="mh-card heatmap-card">
        <header class="card-head">
          <h3>Aktivitäts-Heatmap</h3>
          <span class="muted small">
            Top-${t.gas.length} GAs × ${t.buckets.length} ${t.bucket_minutes}-Min-Buckets · Maximum ${e} Telegramme/Bucket
          </span>
        </header>
        <div class="heatmap-grid"
          style=${`--heatmap-cols: ${t.buckets.length};`}
        >
          <div class="heatmap-row heatmap-row--header">
            <div class="heatmap-cell heatmap-label"></div>
            ${t.buckets.map(
      (r) => n`<div
                class="heatmap-cell heatmap-cell--bucket"
                title=${r}
              >
                ${s(r)}
              </div>`
    )}
          </div>
          ${t.gas.map(
      (r, a) => n`<div class="heatmap-row">
              <div class="heatmap-cell heatmap-label" title=${r.label || ""}>
                <code>${r.ga}</code>
                <span class="muted small">${r.label ?? ""}</span>
              </div>
              ${t.matrix[a].map((i) => {
        const o = i === 0 ? 0 : Math.round(i / e * 100);
        return n`<div
                  class="heatmap-cell heatmap-cell--data"
                  style=${`background: color-mix(in srgb, var(--mh-warning) ${o}%, transparent);`}
                  title=${`${i} Telegramme`}
                >
                  ${i > 0 ? i : ""}
                </div>`;
      })}
            </div>`
    )}
        </div>
        <p class="muted small heatmap-legend">
          Intensität proportional zum Maximum (${e}). Klick auf
          GA-Code öffnet Detail-Pane.
        </p>
      </section>
    `;
  }
  _renderOrphans() {
    const t = this._orphans, e = (p, f) => this._orphansHidePlaceholders ? p.filter((v) => !da(v.address, f(v))) : p, s = e(t.missing_in_log, (p) => p.name), r = e(t.extra_in_log, (p) => p.label), a = s.filter(
      (p) => this._matchesOrphanFilter(this._orphansMissingFilter, [p.address, p.name, p.dpt])
    ), i = r.filter(
      (p) => this._matchesOrphanFilter(this._orphansExtraFilter, [p.address, p.label])
    ), o = this._filters.topNOrphansMissing, d = this._filters.topNOrphansExtra, c = a.slice(0, o), m = i.slice(0, d), g = t.missing_in_log.length - s.length, u = t.extra_in_log.length - r.length;
    return n`
      <section class="mh-card">
        <header class="card-head">
          <h3>Verwaiste GAs (Projekt vs Realität)</h3>
          <div class="card-head__meta">
            <label class="orphans-placeholder-toggle" title="ETS-Platzhalter ohne Label (z. B. '-----') ausblenden">
              <input
                type="checkbox"
                .checked=${this._orphansHidePlaceholders}
                @change=${(p) => {
      this._orphansHidePlaceholders = p.target.checked;
    }}
              />
              <span>Platzhalter ausblenden${this._orphansHidePlaceholders && g + u > 0 ? n` <span class="muted small">(${g + u})</span>` : h}</span>
            </label>
            <span class="muted small">
              Projekt: ${t.project_total} • geloggt: ${t.log_total}
            </span>
          </div>
        </header>
        <div class="orphans-grid">
          ${t.missing_in_log.length > 0 ? n`<div>
                <div class="orphans-col-head">
                  <strong
                    >Im Projekt, nie gesehen (${a.length}${this._orphansMissingFilter ? ` von ${t.missing_in_log.length}` : ""})</strong
                  >
                  ${this._renderInlineTopN(
      this._filters.topNOrphansMissing,
      (p) => this._onTopNOrphansMissing(p)
    )}
                </div>
                <input
                  class="mh-input orphans-search"
                  type="search"
                  placeholder="Filter nach GA / Label / DPT…"
                  .value=${this._orphansMissingFilter}
                  @input=${(p) => {
      this._orphansMissingFilter = p.target.value;
    }}
                />
                <ul class="orphans-list muted-list">
                  ${c.map(
      (p) => n`<li>
                      <code>${p.address}</code>
                      <span>${p.name || "—"}</span>
                      ${p.dpt ? n`<code class="dpt">${p.dpt}</code>` : h}
                    </li>`
    )}
                </ul>
                ${a.length > o ? n`<p class="muted small">
                      … und ${a.length - o} weitere
                    </p>` : h}
              </div>` : h}
          ${t.extra_in_log.length > 0 ? n`<div>
                <div class="orphans-col-head">
                  <strong
                    >Geloggt, nicht im Projekt (${i.length}${this._orphansExtraFilter ? ` von ${t.extra_in_log.length}` : ""})</strong
                  >
                  ${this._renderInlineTopN(
      this._filters.topNOrphansExtra,
      (p) => this._onTopNOrphansExtra(p)
    )}
                </div>
                <input
                  class="mh-input orphans-search"
                  type="search"
                  placeholder="Filter nach GA / Label…"
                  .value=${this._orphansExtraFilter}
                  @input=${(p) => {
      this._orphansExtraFilter = p.target.value;
    }}
                />
                <ul class="orphans-list extra-list">
                  ${m.map(
      (p) => n`<li>
                      <code>${p.address}</code>
                      <span>${p.label ?? "—"}</span>
                      <span class="muted num">${p.count}</span>
                    </li>`
    )}
                </ul>
                ${i.length > d ? n`<p class="muted small">
                      … und ${i.length - d} weitere
                    </p>` : h}
              </div>` : h}
        </div>
      </section>
    `;
  }
  _renderSilenceAlarms() {
    const t = this._silence, e = t.items.filter((r) => r.alarm);
    if (e.length === 0) return n``;
    const s = this._filters.topNSilence;
    return n`
      <section class="mh-card silence-card">
        <header class="card-head">
          <h3>Stille-Alarme (${t.alarm_count})</h3>
          <span class="muted small">
            Schwelle: &gt; ${t.max_silence_minutes} Min ohne Telegramm
          </span>
          ${this._renderInlineTopN(this._filters.topNSilence, (r) => this._onTopNSilence(r))}
        </header>
        <ul class="silence-list">
          ${e.slice(0, s).map(
      (r) => n`<li>
              <code>${r.dev_source}</code>
              <span class="muted">
                seit ${this._formatSilence(r.silent_minutes)} stumm
              </span>
              <span class="muted small">last_seen ${this._formatTs(r.last_seen)}</span>
            </li>`
    )}
        </ul>
        ${e.length > s ? n`<p class="muted small">
              … und ${e.length - s} weitere
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
    const t = this._busHealth, e = t.summary.ratio_pct, s = e >= 1 ? "danger" : e >= 0.5 ? "warning" : e > 0 ? "elevated" : "ok", r = this._filters.topNBusHealth;
    return n`
      <section class="mh-card">
        <header class="card-head">
          <h3>Bus-Gesundheit (Wiederholrate)</h3>
          <span class="muted small">
            xknx-Repeated-Flag — hoher Wert deutet auf Verkabelung/EMV
          </span>
          ${t.per_ga.length > 0 ? this._renderInlineTopN(
      this._filters.topNBusHealth,
      (a) => this._onTopNBusHealth(a)
    ) : h}
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
        ${t.per_ga.length > 0 ? n`<div class="bus-health-list">
              <strong>Top-GAs mit Wiederholungen:</strong>
              <ul>
                ${t.per_ga.slice(0, r).map(
      (a) => n`<li>
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
              ${t.per_ga.length > r ? n`<p class="muted small">
                    … und ${t.per_ga.length - r} weitere
                  </p>` : h}
            </div>` : h}
      </section>
    `;
  }
  _severityPillClass(t) {
    return _t(t);
  }
  /**
   * Iter aiohttp-error-ZU9UA / P2: konsolidierte Status-Spalte fuer
   * Top-Sender. Vorher 3 separate Pills uebereinander (Severity, ⚠
   * auffaellig, ✓ bekannt) — wirkten wie 3 Spalten und konnten sich
   * widersprechen ("OK" + "⚠ auffaellig"). Jetzt EIN Pill, der die
   * effektive Severity zeigt:
   *   - acknowledged ueberschreibt alles → "✓ Bekannt"
   *   - has_findings + green → escaliert auf yellow ("auffaellig")
   *     mit Findings-Icon
   *   - sonst Severity-Label wie gehabt
   */
  _renderTopRowStatus(t) {
    if (t.acknowledged)
      return n`<span class="mh-pill mh-pill--neutral ack-pill" title="acknowledged">
        ✓ Bekannt
      </span>`;
    const e = t.severity, s = t.has_findings && e === "green" ? "yellow" : e, r = t.has_findings && e === "green" ? "auffällig" : this._severityLabel(s);
    return n`<span
      class=${`mh-pill ${this._severityPillClass(s)}`}
      title=${t.has_findings ? "Anti-Pattern erkannt — Detail-Pane zeigt mehr (Konstant-Wert-Spam, Read-Burst, Heartbeat)" : ""}
    >
      <span class="mh-pill__dot"></span>
      ${t.has_findings ? n`<span aria-hidden="true">⚠</span> ` : h}
      ${r}
    </span>`;
  }
};
b.styles = [
  N,
  Ge,
  xe,
  _e,
  $`
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
        /* Iter aiohttp-error-ZU9UA: sticky beim Scrollen — User soll
           Periode/Filter aendern koennen, ohne hochscrollen zu muessen.
           z-index ueber dem Card-Stack, opaque background, damit der
           Inhalt darunter durchscrollt. */
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-4);
        align-items: flex-end;
        padding: var(--mh-space-3);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      }
      /* Iter aiohttp-error-ZU9UA / P2: Refresh-Button visuell
         hervorheben — vorher wirkte er trotz mh-btn--primary grau,
         weil HA-Themes manchmal --primary-color ueberschreiben.
         Eigene Klasse mit garantiertem Farbkontrast + Schatten. */
      .filter-refresh-btn {
        font-weight: var(--mh-weight-semibold, 600);
        padding: 8px 16px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        background: var(--mh-accent, var(--primary-color, #03a9f4));
        color: var(--mh-accent-fg, var(--text-primary-color, #fff));
      }
      .filter-refresh-btn:hover:not(:disabled) {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        transform: translateY(-1px);
      }
      .filter-refresh-btn:disabled {
        /* Wenn lade-aktiv: weniger Opacity-Drop als Default-Disabled,
           damit der Spinner-Glyph noch lesbar bleibt. */
        opacity: 0.7;
      }
      .filter-refresh-btn__spin {
        display: inline-block;
        animation: mh-spin 800ms linear infinite;
      }
      @keyframes mh-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .filter-refresh-btn__spin {
          animation: none;
        }
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
        /* Iter 57: Sentence-Case statt CAPS-Lock */
        letter-spacing: 0.02em;
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
      .inline-topn-wrap {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .inline-topn-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        text-transform: lowercase;
        letter-spacing: 0.02em;
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
        padding: 4px 10px;
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
        /* Iter 57: Sentence-Case statt CAPS-Lock */
        letter-spacing: 0.02em;
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
        /* Iter 60: gelb statt info-blau, konsistent mit Ampel-Mapping. */
        border-left: 3px solid var(--mh-caution);
      }
      .busload--warning {
        border-left: 3px solid var(--mh-warning);
      }
      .busload--danger {
        border-left: 3px solid var(--mh-error);
      }
      /* Iter 60 / U7: 0–100 %-Verlaufs-Bar unter dem Buslast-KPI-Wert.
         Gradient zeigt Skala (gruen → gelb → orange → rot), Marker
         visualisiert aktuellen Wert ohne Schwellen-Sprung. */
      .busload-bar {
        position: relative;
        height: 4px;
        margin-top: 6px;
        border-radius: 2px;
        background: linear-gradient(
          to right,
          var(--mh-success) 0%,
          var(--mh-caution) 33%,
          var(--mh-warning) 66%,
          var(--mh-error) 100%
        );
        opacity: 0.5;
      }
      .busload-bar__marker {
        position: absolute;
        top: -2px;
        bottom: -2px;
        width: 2px;
        background: var(--mh-fg);
        border-radius: 1px;
        transform: translateX(-1px);
      }
      /* Iter 37 (Feature K): Bus-Health-Score-Card */
      .health-score {
        border-left: 4px solid var(--mh-divider);
      }
      .health-score--green {
        border-left-color: var(--mh-success);
      }
      .health-score--yellow {
        /* Iter 60: gelb statt info-blau, konsistent mit B2-Mapping. */
        border-left-color: var(--mh-caution);
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
        color: var(--mh-caution);
      }
      .health-score--orange .health-score__label {
        color: var(--mh-warning);
      }
      .health-score--red .health-score__label {
        color: var(--mh-error);
      }
      /* Iter aiohttp-error-ZU9UA / P2: Component-Badges statt Balken.
         Vorher: 4 Reihen mit Label + Bar + Wert, alle Balken immer
         gruen (irrefuehrend bei niedrigen Werten). Jetzt Chips mit
         eigener Severity-Faerbung. */
      .health-score__components {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
      }
      .health-score__badge {
        display: inline-flex;
        flex-direction: column;
        gap: 2px;
        padding: var(--mh-space-2) var(--mh-space-3);
        border-radius: var(--mh-radius-md);
        border: 1px solid var(--mh-divider);
        background: var(--mh-surface);
        min-width: 110px;
        font-size: var(--mh-text-sm);
      }
      .health-score__badge-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      .health-score__badge-value {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        font-size: var(--mh-text-md);
        color: var(--mh-fg);
      }
      .health-score__badge--green {
        border-color: color-mix(in srgb, var(--mh-success) 40%, transparent);
        background: color-mix(in srgb, var(--mh-success) 10%, var(--mh-surface));
      }
      .health-score__badge--yellow {
        border-color: color-mix(in srgb, var(--mh-caution, var(--mh-warning)) 40%, transparent);
        background: color-mix(in srgb, var(--mh-caution, var(--mh-warning)) 10%, var(--mh-surface));
      }
      .health-score__badge--orange {
        border-color: color-mix(in srgb, var(--mh-warning) 40%, transparent);
        background: color-mix(in srgb, var(--mh-warning) 12%, var(--mh-surface));
      }
      .health-score__badge--red {
        border-color: color-mix(in srgb, var(--mh-error) 50%, transparent);
        background: color-mix(in srgb, var(--mh-error) 12%, var(--mh-surface));
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
        /* Iter 57: Sentence-Case statt uppercase — liest sich ruhiger
         * und harmoniert besser mit dem deutschen Label-Set. */
        letter-spacing: 0.02em;
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
        position: sticky;
        top: 0;
      }
      /* Iter 57: sortierbare Header — visueller Hint via Cursor + Sort-Pfeil */
      th.sortable {
        cursor: pointer;
        user-select: none;
      }
      th.sortable:hover {
        color: var(--mh-fg);
      }
      th.sortable .sort-arrow {
        margin-left: 4px;
        opacity: 0.6;
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
      /* Iter 62 / WR-T: Geraten-DPT visuell als gepunktet markieren,
         damit User auf einen Blick sieht "das ist nicht aus ETS". */
      code.dpt--inferred {
        font-style: italic;
        opacity: 0.85;
        border-bottom: 1px dotted var(--mh-fg-muted);
      }
      .dpt__hint {
        margin-left: 2px;
        font-size: 0.85em;
        color: var(--mh-fg-muted);
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
      /* Iter 91 / WR-G: GA-Heatmap als CSS-Grid. */
      .heatmap-grid {
        display: grid;
        grid-template-columns: minmax(180px, auto) repeat(var(--heatmap-cols, 24), 1fr);
        gap: 1px;
        background: var(--mh-divider);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        overflow: hidden;
        font-size: var(--mh-text-xs);
        margin-top: var(--mh-space-2);
      }
      .heatmap-row {
        display: contents;
      }
      .heatmap-cell {
        background: var(--mh-surface);
        padding: 2px 4px;
        text-align: center;
        min-height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-variant-numeric: tabular-nums;
      }
      .heatmap-cell--bucket {
        color: var(--mh-fg-muted);
        font-size: 10px;
        background: var(--mh-surface-2);
      }
      .heatmap-label {
        background: var(--mh-surface-2);
        text-align: left;
        padding: 4px 8px;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 2px;
        overflow: hidden;
      }
      .heatmap-label code {
        font-weight: var(--mh-weight-semibold);
      }
      .heatmap-label .small {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
      .heatmap-cell--data {
        font-size: 10px;
      }
      .heatmap-legend {
        margin-top: var(--mh-space-2);
      }
      /* Iter 67 / WR-I: Trend-Card. Color-Border je nach Total-Severity. */
      .trend {
        border-left: 3px solid var(--mh-divider);
      }
      .trend--green {
        border-left-color: var(--mh-success);
      }
      .trend--yellow {
        border-left-color: var(--mh-caution);
      }
      .trend--orange {
        border-left-color: var(--mh-warning);
      }
      .trend--red {
        border-left-color: var(--mh-error);
      }
      /* Iter aiohttp-error-ZU9UA / P1 + Trend-Fix A: Hinweistexte in
         der Trend-Card. -short-hint bei kurzen Perioden (1h/6h),
         -retention-hint bei langen Perioden (48h+) wo Vorperiode
         ausserhalb der Raw-Retention liegt. */
      .trend-short-hint,
      .trend-retention-hint {
        margin: var(--mh-space-2) 0 var(--mh-space-3) 0;
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-surface-soft, var(--mh-surface));
        border-left: 3px solid var(--mh-info, var(--mh-divider));
        border-radius: var(--mh-radius-sm);
      }
      .trend-retention-hint {
        border-left-color: var(--mh-warning, var(--mh-divider));
      }
      .trend-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--mh-space-4);
      }
      .trend-col strong {
        display: block;
        margin-bottom: var(--mh-space-2);
      }
      .trend-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .trend-list li {
        display: grid;
        grid-template-columns: minmax(70px, auto) 1fr auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .trend-list--up li {
        background: var(--mh-warning-soft);
      }
      .trend-list--down li {
        background: var(--mh-success-soft);
      }
      .trend-delta {
        font-weight: var(--mh-weight-semibold);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .trend-delta--up {
        color: var(--mh-warning);
      }
      .trend-delta--down {
        color: var(--mh-success);
      }
      .trend-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      /* Iter 64 / WR-P: Detail-Pane Schnell-Aktionen mit HA-Konfig +
         Forum-Link. Anchors als kompakte Liste, kein Button-Stil. */
      .ha-links {
        margin-top: var(--mh-space-3);
        padding-top: var(--mh-space-3);
        border-top: 1px solid var(--mh-divider);
      }
      .ha-links__list {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-3);
      }
      .ha-links__list a {
        color: var(--mh-accent);
        text-decoration: none;
        font-size: var(--mh-text-sm);
      }
      .ha-links__list a:hover {
        text-decoration: underline;
      }
      /* Iter 63 / U13: Auffaelligkeit-Badge in Top-Sender-Status-Spalte.
         Caution-Style (gelb), klein und neben der Severity-Pille. */
      .finding-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-left: 6px;
        padding: 1px 6px;
        border-radius: var(--mh-radius-pill);
        background: var(--mh-caution-soft);
        color: var(--mh-caution);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        cursor: help;
      }
      /* Iter 60 / U4: Acknowledge-Status als dezente Pille mit
         success-soft-Hintergrund. Vorher reiner muted Text — heute klar
         als positiver Status erkennbar, ohne aufdringlich zu sein. */
      .ack-pill {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-left: 6px;
        padding: 1px 6px;
        border-radius: var(--mh-radius-pill);
        background: var(--mh-success-soft);
        color: var(--mh-success);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }
      td.actions {
        text-align: right;
        white-space: nowrap;
      }

      /* Iter aiohttp-error-ZU9UA / P1: Detail-Pane als Side-Drawer.
         Vorher inline am Tabellenende. Backdrop dimmt den restlichen
         Inhalt subtil (rgba 0,0,0,0.25), Drawer-Card slidet von rechts. */
      .detail-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.25);
        z-index: 100;
        animation: mh-detail-backdrop-in 160ms ease-out;
      }
      .detail-pane {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: clamp(360px, 42vw, 640px);
        z-index: 101;
        margin: 0;
        border-radius: 0;
        border: none;
        border-left: 1px solid var(--mh-divider);
        box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: mh-detail-drawer-in 200ms ease-out;
      }
      .detail-head {
        flex: 0 0 auto;
        position: sticky;
        top: 0;
        background: var(--mh-surface);
        border-bottom: 1px solid var(--mh-divider);
        padding: var(--mh-space-3);
        z-index: 1;
      }
      .detail-body {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: var(--mh-space-3);
      }
      .detail-close {
        flex-shrink: 0;
      }
      @media (max-width: 720px) {
        .detail-pane {
          width: 100vw;
        }
      }
      @keyframes mh-detail-backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes mh-detail-drawer-in {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .detail-backdrop,
        .detail-pane {
          animation: none;
        }
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
      }
      /* Iter 60 / U11: Tooltip-fähig durch title-Attr auf dem inneren
         span. Truncation via inline-block + overflow:hidden, weil td
         direkt overflow:hidden nicht zuverlässig trimmt. */
      .device-cell__text {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
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
      /* Iter 61 / U3 + Iter aiohttp-error-ZU9UA: Such-Input + Inline-
         TopN im Spalten-Header. Pager wurde durch inline-topn ersetzt. */
      .orphans-col-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mh-space-2);
        flex-wrap: wrap;
      }
      .orphans-search {
        margin: var(--mh-space-2) 0;
        width: 100%;
        max-width: 320px;
      }
      .orphans-placeholder-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        user-select: none;
      }
      .orphans-placeholder-toggle input {
        cursor: pointer;
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
_([
  x({ attribute: !1 })
], b.prototype, "api", 2);
_([
  l()
], b.prototype, "_filters", 2);
_([
  l()
], b.prototype, "_summary", 2);
_([
  l()
], b.prototype, "_busHealth", 2);
_([
  l()
], b.prototype, "_busload", 2);
_([
  l()
], b.prototype, "_health", 2);
_([
  l()
], b.prototype, "_longTerm", 2);
_([
  l()
], b.prototype, "_bursts", 2);
_([
  l()
], b.prototype, "_sensitiveLog", 2);
_([
  l()
], b.prototype, "_trend", 2);
_([
  l()
], b.prototype, "_heatmap", 2);
_([
  l()
], b.prototype, "_busAnalysisEnabled", 2);
_([
  l()
], b.prototype, "_busAnalysisLoaded", 2);
_([
  l()
], b.prototype, "_devicesSortKey", 2);
_([
  l()
], b.prototype, "_devicesSortDir", 2);
_([
  l()
], b.prototype, "_topSortKey", 2);
_([
  l()
], b.prototype, "_topSortDir", 2);
_([
  l()
], b.prototype, "_orphansMissingFilter", 2);
_([
  l()
], b.prototype, "_orphansExtraFilter", 2);
_([
  l()
], b.prototype, "_orphansHidePlaceholders", 2);
_([
  l()
], b.prototype, "_apiErrors", 2);
_([
  l()
], b.prototype, "_apiErrorsDismissed", 2);
_([
  l()
], b.prototype, "_silence", 2);
_([
  l()
], b.prototype, "_orphans", 2);
_([
  l()
], b.prototype, "_alarms", 2);
_([
  l()
], b.prototype, "_top", 2);
_([
  l()
], b.prototype, "_topBySource", 2);
_([
  l()
], b.prototype, "_timeline", 2);
_([
  l()
], b.prototype, "_selectedGa", 2);
_([
  l()
], b.prototype, "_detail", 2);
_([
  l()
], b.prototype, "_detailLoading", 2);
_([
  l()
], b.prototype, "_loading", 2);
_([
  l()
], b.prototype, "_error", 2);
_([
  l()
], b.prototype, "_toast", 2);
b = _([
  T("stats-knx-view")
], b);
var _a = Object.defineProperty, xa = Object.getOwnPropertyDescriptor, qe = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? xa(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && _a(e, s, a), a;
};
const wt = "messagehub.stats.subtab", wa = /* @__PURE__ */ new Set(["live", "knx"]);
let be = class extends w {
  constructor() {
    super(...arguments), this._tab = this._loadTab();
  }
  _loadTab() {
    try {
      const t = localStorage.getItem(wt);
      if (t && wa.has(t)) return t;
    } catch {
    }
    return "live";
  }
  _setTab(t) {
    this._tab = t;
    try {
      localStorage.setItem(wt, t);
    } catch {
    }
  }
  render() {
    return n`
      <div class="root">
        <nav class="subtabs" role="tablist" aria-label="Statistik-Bereiche">
          ${[
      { id: "live", label: "Live-Status" },
      { id: "knx", label: "KNX-Bus-Analyse" }
    ].map(
      (e) => n`<button
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
          ${this._tab === "live" ? n`<stats-live-view .api=${this.api}></stats-live-view>` : h}
          ${this._tab === "knx" ? n`<stats-knx-view .api=${this.api}></stats-knx-view>` : h}
        </div>
      </div>
    `;
  }
};
be.styles = [
  N,
  $`
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
qe([
  x({ attribute: !1 })
], be.prototype, "api", 2);
qe([
  l()
], be.prototype, "_tab", 2);
be = qe([
  T("stats-view")
], be);
var ya = Object.defineProperty, $a = Object.getOwnPropertyDescriptor, ee = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? $a(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && ya(e, s, a), a;
};
function ka(t) {
  const e = t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), s = new Set(e), r = (...a) => a.some((i) => s.has(i));
  return r("delete", "remove", "removed", "deleted") ? "delete" : r("upsert", "create", "created", "add", "added", "import", "imported") ? "create" : r("update", "updated", "edit", "edited", "set") ? "update" : r("status", "ack", "acknowledge", "toggle", "enable", "enabled", "disable", "disabled") ? "status" : "other";
}
const yt = 60;
function Sa(t) {
  if (!t || typeof t != "object" || Array.isArray(t))
    return "";
  const e = t;
  if (typeof e.label == "string") return e.label;
  if (typeof e.name == "string") return e.name;
  const s = Object.entries(e);
  if (s.length === 1) {
    const [a, i] = s[0];
    if (typeof i == "string" || typeof i == "number" || typeof i == "boolean") {
      const o = String(i), d = o.length > yt ? `${o.slice(0, yt)}…` : o;
      return `${a}: ${d}`;
    }
    return `{${a}}`;
  }
  return `{${s.slice(0, 3).map(([a]) => a).join(", ")}${s.length > 3 ? ", …" : ""}}`;
}
let B = class extends w {
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
      `Wirklich ALLE Audit-Einträge löschen?

Diese Aktion kann nicht rückgängig gemacht werden. Ein neuer Eintrag 'audit_clear' wird vom Backend angelegt, damit der Lösch-Vorgang in den verbleibenden Logs nachvollziehbar bleibt.`
    )) {
      this._loading = !0;
      try {
        const t = await this.api.clearAuditLog();
        await this._load(), window.alert(`${t.deleted} Einträge gelöscht.`);
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
      const s = `${e.target_type ?? ""}${e.target_id ?? ""}`.toLowerCase(), r = e.details ? JSON.stringify(e.details).toLowerCase() : "";
      return (e.actor ?? "").toLowerCase().includes(t) || (e.action ?? "").toLowerCase().includes(t) || s.includes(t) || r.includes(t);
    }) : this._items;
  }
  _renderActionPill(t) {
    const e = ka(t);
    return n`<span class=${`action-pill action-${e}`} title=${t}>${t}</span>`;
  }
  _renderDetails(t) {
    if (!t) return n`<span class="muted">—</span>`;
    if (typeof t == "object") {
      const e = Object.entries(t);
      return e.length === 0 ? n`<span class="muted">—</span>` : n`
        <dl class="kv">
          ${e.map(
        ([s, r]) => n`
              <dt>${s}</dt>
              <dd>${typeof r == "object" ? JSON.stringify(r) : String(r)}</dd>
            `
      )}
        </dl>
      `;
    }
    return n`<code>${String(t)}</code>`;
  }
  _renderDetailsSummary(t) {
    const e = Sa(t);
    if (e === "") return n`<span class="muted">—</span>`;
    const s = typeof t == "object" && t !== null && (t.label !== void 0 || t.name !== void 0);
    return n`<span class=${`summary ${s ? "" : "muted"}`}
      >${e}</span
    >`;
  }
  render() {
    const t = this._filtered();
    return n`
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
              title="Alle Audit-Einträge löschen"
            >
              Alle löschen
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

        ${this._loading ? n`<p class="status">lade…</p>` : t.length === 0 ? n`<div class="empty">
                ${this._items.length === 0 ? "Noch keine Audit-Einträge." : "Keine Treffer für aktuelle Suche."}
              </div>` : n`
                <div class="table">
                  <div class="table-head">
                    <span>Zeit</span>
                    <span>Wer</span>
                    <span>Aktion</span>
                    <span>Ziel</span>
                    <span>Details</span>
                  </div>
                  ${t.map((e, s) => {
      const r = this._expanded.has(s), a = String(e.timestamp);
      return n`
                      <div class=${`table-row ${r ? "expanded" : ""}`}>
                        <button
                          class="row-toggle"
                          @click=${() => this._toggle(s)}
                          aria-expanded=${r}
                          aria-label=${r ? "Details verbergen" : "Details anzeigen"}
                        >
                          <span class="ts" title=${Lt(a, this._now)}>
                            ${Dt(a, this._now)}
                          </span>
                          <span class="actor">${e.actor}</span>
                          <span>${this._renderActionPill(e.action)}</span>
                          <span class="target">
                            <code class="target-type">${e.target_type}</code>
                            ${e.target_id !== null && e.target_id !== void 0 ? n`<code class="target-id">#${e.target_id}</code>` : h}
                          </span>
                          <span class="details-inline">
                            ${this._renderDetailsSummary(e.details)}
                            <span class="chevron" aria-hidden="true">${r ? "▾" : "▸"}</span>
                          </span>
                        </button>
                        ${r ? n`<div class="details-panel">
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
B.styles = [
  N,
  _e,
  zt,
  xe,
  $`
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
ee([
  x({ attribute: !1 })
], B.prototype, "api", 2);
ee([
  l()
], B.prototype, "_items", 2);
ee([
  l()
], B.prototype, "_loading", 2);
ee([
  l()
], B.prototype, "_filter", 2);
ee([
  l()
], B.prototype, "_expanded", 2);
ee([
  l()
], B.prototype, "_now", 2);
B = ee([
  T("audit-view")
], B);
var Ta = Object.defineProperty, Aa = Object.getOwnPropertyDescriptor, E = (t, e, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Aa(e, s) : e, i = t.length - 1, o; i >= 0; i--)
    (o = t[i]) && (a = (r ? o(e, s, a) : o(a)) || a);
  return r && a && Ta(e, s, a), a;
};
function Pa(t) {
  return t.source === "knx-bus" && t.text.includes("(GroupValueRead)");
}
const $t = "messagehub.filters", te = {
  severity: ["error", "warning", "info"],
  source: "",
  search: "",
  hideKnxRead: !1
};
let A = class extends w {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "messages", this._items = [], this._total = 0, this._loading = !1, this._selected = null, this._filters = this._loadFilters(), this._newCount = 0, this._testing = !1, this._toast = "", this._overflowOpen = !1, this._savedFilters = [], this._savedFiltersOpen = !1, this._api = new hs(), this._onSeverityChange = (t) => {
      this._filters = { ...this._filters, severity: t.detail.severities }, this._persistFilters(), this._reload();
    }, this._onSourceChange = (t) => {
      this._filters = { ...this._filters, source: t.detail.source }, this._persistFilters(), this._reload();
    }, this._onTimeRange = (t) => {
      this._filters = { ...this._filters, fromIso: t.detail.fromIso, toIso: t.detail.toIso }, this._persistFilters(), this._reload();
    }, this._onSelect = (t) => {
      this._selected = t.detail.msg;
    }, this._onSeverityChangeMessage = async (t) => {
      var a, i;
      const { id: e, severity: s, previous: r } = t.detail;
      this._items = this._items.map(
        (o) => o.id === e ? { ...o, severity: s } : o
      ), ((a = this._selected) == null ? void 0 : a.id) === e && (this._selected = { ...this._selected, severity: s });
      try {
        await this._api.setMessageSeverity(e, s), this._showToast(`Severity geändert: ${r} → ${s}`);
      } catch (o) {
        this._items = this._items.map(
          (d) => d.id === e ? { ...d, severity: r } : d
        ), ((i = this._selected) == null ? void 0 : i.id) === e && (this._selected = {
          ...this._selected,
          severity: r
        }), this._showToast(`Änderung fehlgeschlagen: ${o.message}`);
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
    (t = this.hass) != null && t.auth && this._api.setAuth(this.hass.auth.data.access_token), this._reload(), this._subscribeLive(), this._loadSavedFilters();
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._unsubLive) == null || t.call(this);
  }
  async _subscribeLive() {
    var t, e;
    (e = (t = this.hass) == null ? void 0 : t.connection) != null && e.subscribeEvents && (this._unsubLive = await this.hass.connection.subscribeEvents((s) => {
      const r = s.data;
      this._matchesFilters(r) && (this._items = [r, ...this._items].slice(0, 200), this._total += 1, this._newCount += 1, window.setTimeout(() => this._newCount = Math.max(0, this._newCount - 1), 4e3));
    }, "messagehub_message_added"));
  }
  _matchesFilters(t) {
    return !(this._filters.severity.length && !this._filters.severity.includes(t.severity) || this._filters.source && t.source !== this._filters.source || this._filters.search && !t.text.toLowerCase().includes(this._filters.search.toLowerCase()) || this._filters.hideKnxRead && Pa(t));
  }
  _loadFilters() {
    try {
      const t = localStorage.getItem($t);
      if (t) return { ...te, ...JSON.parse(t) };
    } catch {
    }
    return { ...te };
  }
  _persistFilters() {
    try {
      localStorage.setItem($t, JSON.stringify(this._filters));
    } catch {
    }
  }
  _resetFilters() {
    this._filters = { ...te }, this._persistFilters(), this._reload();
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
        hideKnxRead: this._filters.hideKnxRead,
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
        const r = t === "all" ? {} : {
          severity: this._filters.severity,
          source: this._filters.source || void 0,
          search: this._filters.search || void 0,
          from: this._filters.fromIso,
          to: this._filters.toIso
        }, a = await this._api.deleteMessages(r);
        this._showToast(`${a} Nachrichten gelöscht`), this._selected = null, await this._reload();
      } catch (r) {
        this._showToast(`Löschen fehlgeschlagen: ${r.message}`);
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
      const e = ["info", "warning", "error", "info", "info"], s = ["pihole", "knx-bus", "backup-job", "test-script"], r = [
        "Demo-Nachricht aus dem Panel",
        "Test: DNS-Query erfolgreich",
        "Backup abgeschlossen, Dauer 12 min",
        "KNX 1/2/3 — Wohnzimmer Deckenlicht ein"
      ], a = (i) => Math.floor(Math.random() * i);
      await this.hass.callService("messagehub", "add_message", {
        severity: e[a(e.length)],
        source: s[a(s.length)],
        text: r[a(r.length)],
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
  // Iter 93 / K1: Saved Filters laden (vom Server, scope=messages).
  async _loadSavedFilters() {
    try {
      this._savedFilters = await this._api.listSavedFilters("messages");
    } catch (t) {
      this._showToast(`Saved Filters konnten nicht geladen werden: ${t.message}`);
    }
  }
  async _saveCurrentFilter() {
    const t = window.prompt("Filter speichern als:");
    if (!(t === null || t.trim() === ""))
      try {
        await this._api.upsertSavedFilter(
          t.trim(),
          "messages",
          this._filters
        ), this._showToast(`Filter „${t.trim()}" gespeichert`), await this._loadSavedFilters();
      } catch (e) {
        this._showToast(`Speichern fehlgeschlagen: ${e.message}`);
      }
  }
  _applySavedFilter(t) {
    const e = t.filters;
    this._filters = { ...te, ...e }, this._persistFilters(), this._savedFiltersOpen = !1, this._reload(), this._showToast(`Filter „${t.name}" geladen`);
  }
  async _deleteSavedFilter(t, e) {
    if (e.stopPropagation(), !!window.confirm(`Filter „${t.name}" wirklich löschen?`))
      try {
        await this._api.deleteSavedFilter(t.id), await this._loadSavedFilters(), this._showToast("Filter gelöscht");
      } catch (s) {
        this._showToast(`Löschen fehlgeschlagen: ${s.message}`);
      }
  }
  _renderSavedFiltersDropdown() {
    return n`
      <div class="saved-filters">
        <button
          class="filter-reset"
          @click=${() => {
      this._savedFiltersOpen = !this._savedFiltersOpen;
    }}
          title="Saved Filters laden / verwalten"
        >
          📋 Filter ${this._savedFiltersOpen ? "▴" : "▾"}
        </button>
        ${this._savedFiltersOpen ? n`<div class="saved-filters-dropdown">
              ${this._savedFilters.length === 0 ? n`<p class="muted small">Keine gespeicherten Filter.</p>` : n`<ul>
                    ${this._savedFilters.map(
      (t) => n`<li
                        @click=${() => this._applySavedFilter(t)}
                        title="Klick: laden"
                      >
                        <span>${t.name}</span>
                        <button
                          class="filter-reset"
                          @click=${(e) => void this._deleteSavedFilter(t, e)}
                          title="Filter löschen"
                        >
                          ✕
                        </button>
                      </li>`
    )}
                  </ul>`}
              <button
                class="filter-reset"
                @click=${() => {
      this._savedFiltersOpen = !1, this._saveCurrentFilter();
    }}
              >
                + Aktuellen Filter speichern
              </button>
            </div>` : null}
      </div>
    `;
  }
  _hasActiveFilters() {
    return this._filters.severity.length !== te.severity.length || this._filters.source !== "" || this._filters.search !== "" || this._filters.fromIso !== void 0 || this._filters.hideKnxRead !== te.hideKnxRead;
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
    return n`
      <div class="empty">
        <h3>Noch keine Nachrichten ${this._hasActiveFilters() ? "für diese Filter" : ""}</h3>
        <p>
          ${this._hasActiveFilters() ? "Probiere weniger restriktive Filter oder setze sie zurück." : "Sobald Nachrichten über Webhook, MQTT, Eventbus oder den Service messagehub.add_message reinkommen, erscheinen sie hier."}
        </p>
        <div class="empty-actions">
          ${this._hasActiveFilters() ? n`<button class="mh-btn" @click=${this._resetFilters}>
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
    return n`
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
        <!-- Iter 61 / U15: Toggle, der KNX-GroupValueRead-Telegramme
             ausblendet. Polling-Spam reduzieren ohne Loggen-Konfig zu
             ändern. State persistiert in den Filter-LocalStorage. -->
        <label class="hide-knx-read" title="GroupValueRead-Telegramme (HA-Polling) ausblenden">
          <input
            type="checkbox"
            .checked=${this._filters.hideKnxRead}
            @change=${(t) => {
      this._filters = {
        ...this._filters,
        hideKnxRead: t.target.checked
      }, this._persistFilters(), this._reload();
    }}
          />
          <span>KNX-Reads ausblenden</span>
        </label>
        ${this._hasActiveFilters() ? n`<button class="filter-reset" @click=${this._resetFilters}>
              Filter zurücksetzen
            </button>` : null}
        ${this._renderSavedFiltersDropdown()}
      </div>

      <div class="status-bar">
        <span class="status-count">
          ${this._loading ? "lade…" : n`<strong>${this._items.length.toLocaleString("de-DE")}</strong>
                <span class="muted">von ${this._total.toLocaleString("de-DE")}</span>`}
          ${this._newCount > 0 ? n`<span class="new-badge">+${this._newCount} neu</span>` : null}
        </span>
        <div class="status-actions">
          ${this._total > 0 ? n`<a
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
          ${this._total > 0 && this._hasActiveFilters() ? n`<button
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
            ${this._overflowOpen ? n`<div class="overflow-menu" role="menu">
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

      ${this._items.length === 0 && !this._loading ? this._renderEmptyMessages() : n`<message-table
            .items=${this._items}
            @select=${this._onSelect}
            @severity-change=${this._onSeverityChangeMessage}
          ></message-table>`}

      ${this._selected ? n`<detail-pane
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
    return n`
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
      (e) => n`<button
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
          ${this._tab === "stats" ? n`<stats-view .api=${this._api}></stats-view>` : null}
          ${this._tab === "settings" ? n`<settings-view .api=${this._api}></settings-view>` : null}
          ${this._tab === "audit" ? n`<audit-view .api=${this._api}></audit-view>` : null}
        </main>

        ${this._toast ? n`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
};
A.styles = [
  N,
  _e,
  $`
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
      /* Iter 61 / U15: Hide-KNX-Read Toggle in der Filter-Bar. */
      .hide-knx-read {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        cursor: pointer;
        user-select: none;
      }
      .hide-knx-read:hover {
        background: var(--mh-surface-2);
        color: var(--mh-fg);
      }
      .hide-knx-read input {
        accent-color: var(--mh-accent);
      }
      /* Iter 93 / K1: Saved Filters Dropdown. */
      .saved-filters {
        position: relative;
        display: inline-block;
      }
      .saved-filters-dropdown {
        position: absolute;
        right: 0;
        top: 100%;
        z-index: 10;
        margin-top: 4px;
        min-width: 240px;
        max-width: 320px;
        padding: var(--mh-space-2);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .saved-filters-dropdown ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .saved-filters-dropdown li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--mh-space-2);
        padding: 4px 8px;
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
      }
      .saved-filters-dropdown li:hover {
        background: var(--mh-surface-2);
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
  x({ attribute: !1 })
], A.prototype, "hass", 2);
E([
  x({ type: Boolean })
], A.prototype, "narrow", 2);
E([
  x({ attribute: !1 })
], A.prototype, "panel", 2);
E([
  l()
], A.prototype, "_tab", 2);
E([
  l()
], A.prototype, "_items", 2);
E([
  l()
], A.prototype, "_total", 2);
E([
  l()
], A.prototype, "_loading", 2);
E([
  l()
], A.prototype, "_selected", 2);
E([
  l()
], A.prototype, "_filters", 2);
E([
  l()
], A.prototype, "_newCount", 2);
E([
  l()
], A.prototype, "_testing", 2);
E([
  l()
], A.prototype, "_toast", 2);
E([
  l()
], A.prototype, "_overflowOpen", 2);
E([
  l()
], A.prototype, "_savedFilters", 2);
E([
  l()
], A.prototype, "_savedFiltersOpen", 2);
A = E([
  T("messagehub-panel")
], A);
export {
  A as MessageHubPanel,
  Pa as isKnxReadMessage
};
