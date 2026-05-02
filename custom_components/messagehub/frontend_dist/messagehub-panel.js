/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Me = globalThis, et = Me.ShadowRoot && (Me.ShadyCSS === void 0 || Me.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, tt = Symbol(), dt = /* @__PURE__ */ new WeakMap();
let Lt = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== tt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (et && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = dt.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && dt.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Wt = (i) => new Lt(typeof i == "string" ? i : i + "", void 0, tt), _ = (i, ...e) => {
  const t = i.length === 1 ? i[0] : e.reduce((s, a, r) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + i[r + 1], i[0]);
  return new Lt(t, i, tt);
}, Vt = (i, e) => {
  if (et) i.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const s = document.createElement("style"), a = Me.litNonce;
    a !== void 0 && s.setAttribute("nonce", a), s.textContent = t.cssText, i.appendChild(s);
  }
}, ct = et ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return Wt(t);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: qt, defineProperty: Jt, getOwnPropertyDescriptor: Yt, getOwnPropertyNames: Qt, getOwnPropertySymbols: Xt, getPrototypeOf: Zt } = Object, j = globalThis, ht = j.trustedTypes, es = ht ? ht.emptyScript : "", Ge = j.reactiveElementPolyfillSupport, ye = (i, e) => i, je = { toAttribute(i, e) {
  switch (e) {
    case Boolean:
      i = i ? es : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, e) {
  let t = i;
  switch (e) {
    case Boolean:
      t = i !== null;
      break;
    case Number:
      t = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(i);
      } catch {
        t = null;
      }
  }
  return t;
} }, st = (i, e) => !qt(i, e), pt = { attribute: !0, type: String, converter: je, reflect: !1, useDefault: !1, hasChanged: st };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), j.litPropertyMetadata ?? (j.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let Q = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = pt) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), a = this.getPropertyDescriptor(e, s, t);
      a !== void 0 && Jt(this.prototype, e, a);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: a, set: r } = Yt(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: a, set(o) {
      const l = a == null ? void 0 : a.call(this);
      r == null || r.call(this, o), this.requestUpdate(e, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? pt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(ye("elementProperties"))) return;
    const e = Zt(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(ye("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(ye("properties"))) {
      const t = this.properties, s = [...Qt(t), ...Xt(t)];
      for (const a of s) this.createProperty(a, t[a]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [s, a] of t) this.elementProperties.set(s, a);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, s] of this.elementProperties) {
      const a = this._$Eu(t, s);
      a !== void 0 && this._$Eh.set(a, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const a of s) t.unshift(ct(a));
    } else e !== void 0 && t.push(ct(e));
    return t;
  }
  static _$Eu(e, t) {
    const s = t.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const s of t.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Vt(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var s;
      return (s = t.hostConnected) == null ? void 0 : s.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var s;
      return (s = t.hostDisconnected) == null ? void 0 : s.call(t);
    });
  }
  attributeChangedCallback(e, t, s) {
    this._$AK(e, s);
  }
  _$ET(e, t) {
    var r;
    const s = this.constructor.elementProperties.get(e), a = this.constructor._$Eu(e, s);
    if (a !== void 0 && s.reflect === !0) {
      const o = (((r = s.converter) == null ? void 0 : r.toAttribute) !== void 0 ? s.converter : je).toAttribute(t, s.type);
      this._$Em = e, o == null ? this.removeAttribute(a) : this.setAttribute(a, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var r, o;
    const s = this.constructor, a = s._$Eh.get(e);
    if (a !== void 0 && this._$Em !== a) {
      const l = s.getPropertyOptions(a), c = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((r = l.converter) == null ? void 0 : r.fromAttribute) !== void 0 ? l.converter : je;
      this._$Em = a;
      const p = c.fromAttribute(t, l.type);
      this[a] = p ?? ((o = this._$Ej) == null ? void 0 : o.get(a)) ?? p, this._$Em = null;
    }
  }
  requestUpdate(e, t, s, a = !1, r) {
    var o;
    if (e !== void 0) {
      const l = this.constructor;
      if (a === !1 && (r = this[e]), s ?? (s = l.getPropertyOptions(e)), !((s.hasChanged ?? st)(r, t) || s.useDefault && s.reflect && r === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(l._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: a, wrapped: r }, o) {
    s && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), r !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), a === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
    var s;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [r, o] of this._$Ep) this[r] = o;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [r, o] of a) {
        const { wrapped: l } = o, c = this[r];
        l !== !0 || this._$AL.has(r) || c === void 0 || this.C(r, void 0, o, c);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (s = this._$EO) == null || s.forEach((a) => {
        var r;
        return (r = a.hostUpdate) == null ? void 0 : r.call(a);
      }), this.update(t)) : this._$EM();
    } catch (a) {
      throw e = !1, this._$EM(), a;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((s) => {
      var a;
      return (a = s.hostUpdated) == null ? void 0 : a.call(s);
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
Q.elementStyles = [], Q.shadowRootOptions = { mode: "open" }, Q[ye("elementProperties")] = /* @__PURE__ */ new Map(), Q[ye("finalized")] = /* @__PURE__ */ new Map(), Ge == null || Ge({ ReactiveElement: Q }), (j.reactiveElementVersions ?? (j.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $e = globalThis, ut = (i) => i, Ne = $e.trustedTypes, mt = Ne ? Ne.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, Rt = "$lit$", M = `lit$${Math.random().toFixed(9).slice(2)}$`, Mt = "?" + M, ts = `<${Mt}>`, W = document, ke = () => W.createComment(""), Se = (i) => i === null || typeof i != "object" && typeof i != "function", at = Array.isArray, ss = (i) => at(i) || typeof (i == null ? void 0 : i[Symbol.iterator]) == "function", We = `[ 	
\f\r]`, xe = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, gt = /-->/g, vt = />/g, F = RegExp(`>|${We}(?:([^\\s"'>=/]+)(${We}*=${We}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ft = /'/g, bt = /"/g, jt = /^(?:script|style|textarea|title)$/i, as = (i) => (e, ...t) => ({ _$litType$: i, strings: e, values: t }), n = as(1), V = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), _t = /* @__PURE__ */ new WeakMap(), K = W.createTreeWalker(W, 129);
function Nt(i, e) {
  if (!at(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return mt !== void 0 ? mt.createHTML(e) : e;
}
const rs = (i, e) => {
  const t = i.length - 1, s = [];
  let a, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = xe;
  for (let l = 0; l < t; l++) {
    const c = i[l];
    let p, g, u = -1, v = 0;
    for (; v < c.length && (o.lastIndex = v, g = o.exec(c), g !== null); ) v = o.lastIndex, o === xe ? g[1] === "!--" ? o = gt : g[1] !== void 0 ? o = vt : g[2] !== void 0 ? (jt.test(g[2]) && (a = RegExp("</" + g[2], "g")), o = F) : g[3] !== void 0 && (o = F) : o === F ? g[0] === ">" ? (o = a ?? xe, u = -1) : g[1] === void 0 ? u = -2 : (u = o.lastIndex - g[2].length, p = g[1], o = g[3] === void 0 ? F : g[3] === '"' ? bt : ft) : o === bt || o === ft ? o = F : o === gt || o === vt ? o = xe : (o = F, a = void 0);
    const m = o === F && i[l + 1].startsWith("/>") ? " " : "";
    r += o === xe ? c + ts : u >= 0 ? (s.push(p), c.slice(0, u) + Rt + c.slice(u) + M + m) : c + M + (u === -2 ? l : m);
  }
  return [Nt(i, r + (i[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class Te {
  constructor({ strings: e, _$litType$: t }, s) {
    let a;
    this.parts = [];
    let r = 0, o = 0;
    const l = e.length - 1, c = this.parts, [p, g] = rs(e, t);
    if (this.el = Te.createElement(p, s), K.currentNode = this.el.content, t === 2 || t === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (a = K.nextNode()) !== null && c.length < l; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const u of a.getAttributeNames()) if (u.endsWith(Rt)) {
          const v = g[o++], m = a.getAttribute(u).split(M), x = /([.?@])?(.*)/.exec(v);
          c.push({ type: 1, index: r, name: x[2], strings: m, ctor: x[1] === "." ? os : x[1] === "?" ? ns : x[1] === "@" ? ls : Ue }), a.removeAttribute(u);
        } else u.startsWith(M) && (c.push({ type: 6, index: r }), a.removeAttribute(u));
        if (jt.test(a.tagName)) {
          const u = a.textContent.split(M), v = u.length - 1;
          if (v > 0) {
            a.textContent = Ne ? Ne.emptyScript : "";
            for (let m = 0; m < v; m++) a.append(u[m], ke()), K.nextNode(), c.push({ type: 2, index: ++r });
            a.append(u[v], ke());
          }
        }
      } else if (a.nodeType === 8) if (a.data === Mt) c.push({ type: 2, index: r });
      else {
        let u = -1;
        for (; (u = a.data.indexOf(M, u + 1)) !== -1; ) c.push({ type: 7, index: r }), u += M.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const s = W.createElement("template");
    return s.innerHTML = e, s;
  }
}
function ge(i, e, t = i, s) {
  var o, l;
  if (e === V) return e;
  let a = s !== void 0 ? (o = t._$Co) == null ? void 0 : o[s] : t._$Cl;
  const r = Se(e) ? void 0 : e._$litDirective$;
  return (a == null ? void 0 : a.constructor) !== r && ((l = a == null ? void 0 : a._$AO) == null || l.call(a, !1), r === void 0 ? a = void 0 : (a = new r(i), a._$AT(i, t, s)), s !== void 0 ? (t._$Co ?? (t._$Co = []))[s] = a : t._$Cl = a), a !== void 0 && (e = ge(i, a._$AS(i, e.values), a, s)), e;
}
class is {
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
    const { el: { content: t }, parts: s } = this._$AD, a = ((e == null ? void 0 : e.creationScope) ?? W).importNode(t, !0);
    K.currentNode = a;
    let r = K.nextNode(), o = 0, l = 0, c = s[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let p;
        c.type === 2 ? p = new _e(r, r.nextSibling, this, e) : c.type === 1 ? p = new c.ctor(r, c.name, c.strings, this, e) : c.type === 6 && (p = new ds(r, this, e)), this._$AV.push(p), c = s[++l];
      }
      o !== (c == null ? void 0 : c.index) && (r = K.nextNode(), o++);
    }
    return K.currentNode = W, a;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class _e {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, s, a) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = a, this._$Cv = (a == null ? void 0 : a.isConnected) ?? !0;
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
    e = ge(this, e, t), Se(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== V && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ss(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== h && Se(this._$AH) ? this._$AA.nextSibling.data = e : this.T(W.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var r;
    const { values: t, _$litType$: s } = e, a = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = Te.createElement(Nt(s.h, s.h[0]), this.options)), s);
    if (((r = this._$AH) == null ? void 0 : r._$AD) === a) this._$AH.p(t);
    else {
      const o = new is(a, this), l = o.u(this.options);
      o.p(t), this.T(l), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = _t.get(e.strings);
    return t === void 0 && _t.set(e.strings, t = new Te(e)), t;
  }
  k(e) {
    at(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, a = 0;
    for (const r of e) a === t.length ? t.push(s = new _e(this.O(ke()), this.O(ke()), this, this.options)) : s = t[a], s._$AI(r), a++;
    a < t.length && (this._$AR(s && s._$AB.nextSibling, a), t.length = a);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, t); e !== this._$AB; ) {
      const a = ut(e).nextSibling;
      ut(e).remove(), e = a;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class Ue {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, a, r) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = t, this._$AM = a, this.options = r, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = h;
  }
  _$AI(e, t = this, s, a) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) e = ge(this, e, t, 0), o = !Se(e) || e !== this._$AH && e !== V, o && (this._$AH = e);
    else {
      const l = e;
      let c, p;
      for (e = r[0], c = 0; c < r.length - 1; c++) p = ge(this, l[s + c], t, c), p === V && (p = this._$AH[c]), o || (o = !Se(p) || p !== this._$AH[c]), p === h ? e = h : e !== h && (e += (p ?? "") + r[c + 1]), this._$AH[c] = p;
    }
    o && !a && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class os extends Ue {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class ns extends Ue {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class ls extends Ue {
  constructor(e, t, s, a, r) {
    super(e, t, s, a, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = ge(this, e, t, 0) ?? h) === V) return;
    const s = this._$AH, a = e === h && s !== h || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, r = e !== h && (s === h || a);
    a && this.element.removeEventListener(this.name, this, s), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class ds {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    ge(this, e);
  }
}
const cs = { I: _e }, Ve = $e.litHtmlPolyfillSupport;
Ve == null || Ve(Te, _e), ($e.litHtmlVersions ?? ($e.litHtmlVersions = [])).push("3.3.2");
const hs = (i, e, t) => {
  const s = (t == null ? void 0 : t.renderBefore) ?? e;
  let a = s._$litPart$;
  if (a === void 0) {
    const r = (t == null ? void 0 : t.renderBefore) ?? null;
    s._$litPart$ = a = new _e(e.insertBefore(ke(), r), r, void 0, t ?? {});
  }
  return a._$AI(i), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const G = globalThis;
let b = class extends Q {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = hs(t, this.renderRoot, this.renderOptions);
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
    return V;
  }
};
var Ct;
b._$litElement$ = !0, b.finalized = !0, (Ct = G.litElementHydrateSupport) == null || Ct.call(G, { LitElement: b });
const qe = G.litElementPolyfillSupport;
qe == null || qe({ LitElement: b });
(G.litElementVersions ?? (G.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w = (i) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(i, e);
  }) : customElements.define(i, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ps = { attribute: !0, type: String, converter: je, reflect: !1, hasChanged: st }, us = (i = ps, e, t) => {
  const { kind: s, metadata: a } = t;
  let r = globalThis.litPropertyMetadata.get(a);
  if (r === void 0 && globalThis.litPropertyMetadata.set(a, r = /* @__PURE__ */ new Map()), s === "setter" && ((i = Object.create(i)).wrapped = !0), r.set(t.name, i), s === "accessor") {
    const { name: o } = t;
    return { set(l) {
      const c = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(o, c, i, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(o, void 0, i, l), l;
    } };
  }
  if (s === "setter") {
    const { name: o } = t;
    return function(l) {
      const c = this[o];
      e.call(this, l), this.requestUpdate(o, c, i, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function f(i) {
  return (e, t) => typeof t == "object" ? us(i, e, t) : ((s, a, r) => {
    const o = a.hasOwnProperty(r);
    return a.constructor.createProperty(r, s), o ? Object.getOwnPropertyDescriptor(a, r) : void 0;
  })(i, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function d(i) {
  return f({ ...i, state: !0, attribute: !1 });
}
class ms {
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
    var r;
    const t = new URLSearchParams();
    (r = e.severity) != null && r.length && t.set("severity", e.severity.join(",")), e.source && t.set("source", e.source), e.search && t.set("search", e.search), e.from && t.set("from", e.from), e.to && t.set("to", e.to), e.limit !== void 0 && t.set("limit", String(e.limit)), e.offset !== void 0 && t.set("offset", String(e.offset)), e.order && t.set("order", e.order);
    const s = `${this.baseUrl}/api/messagehub/messages?${t.toString()}`, a = await fetch(s, { headers: this.headers() });
    if (!a.ok)
      throw new Error(`HTTP ${a.status}`);
    return await a.json();
  }
  async getMessage(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}`, {
      headers: this.headers()
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
    return await t.json();
  }
  async deleteMessage(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
  }
  async setMessageStatus(e, t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/status`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ status: t })
    });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async setMessageSeverity(e, t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/severity`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ severity: t })
    });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async getMessageTags(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/tags`, {
      headers: this.headers()
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
    return (await t.json()).tags;
  }
  async addMessageTag(e, t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tag: t })
    });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}`);
    return (await s.json()).tags;
  }
  async removeMessageTag(e, t) {
    const s = `${this.baseUrl}/api/messagehub/messages/${e}/tags?tag=${encodeURIComponent(t)}`, a = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!a.ok)
      throw new Error(`HTTP ${a.status}`);
    return (await a.json()).tags;
  }
  async getRunbookForSource(e, t) {
    const s = t ? `?fingerprint=${encodeURIComponent(t)}` : "", a = await fetch(`${this.baseUrl}/api/messagehub/runbook/${encodeURIComponent(e)}${s}`, { headers: this.headers() });
    if (a.status === 404)
      return null;
    if (!a.ok)
      throw new Error(`HTTP ${a.status}`);
    return await a.json();
  }
  async listAudit(e = 200) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/audit?limit=${e}`, {
      headers: this.headers()
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
    return (await t.json()).items;
  }
  async discoverKnxFromProject() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/knx-discovery`, {
      headers: this.headers()
    });
    if (!e.ok)
      throw new Error(`HTTP ${e.status}`);
    return await e.json();
  }
  async listKnxAddresses() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      headers: this.headers()
    });
    if (!e.ok)
      throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async upsertKnxAddress(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}: ${await t.text()}`);
  }
  async listChannels() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/channels`, {
      headers: this.headers()
    });
    if (!e.ok)
      throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async createChannel(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/channels`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}: ${await t.text()}`);
  }
  async updateChannel(e, t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/channels/${e}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(t)
    });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async deleteChannel(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/channels/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
  }
  async listMqttTopics() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics`, {
      headers: this.headers()
    });
    if (!e.ok)
      throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async createMqttTopic(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}: ${await t.text()}`);
  }
  async deleteMqttTopic(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
  }
  async listRemediationHooks() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks`, {
      headers: this.headers()
    });
    if (!e.ok)
      throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async createRemediationHook(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}: ${await t.text()}`);
  }
  async deleteRemediationHook(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
  }
  async listHeartbeats() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      headers: this.headers()
    });
    if (!e.ok)
      throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async upsertHeartbeat(e, t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ source: e, expected_interval_seconds: t })
    });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}`);
  }
  async getStatsExtended(e = 30) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/stats-extended?days=${e}`, { headers: this.headers() });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
    return await t.json();
  }
  async deleteKnxAddress(e) {
    const t = `${this.baseUrl}/api/messagehub/knx-addresses/${encodeURIComponent(e)}`, s = await fetch(t, { method: "DELETE", headers: this.headers() });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}`);
  }
  async importKnxCsv(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ csv: e })
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
    return await t.json();
  }
  exportUrl(e) {
    var s;
    const t = new URLSearchParams();
    return (s = e.severity) != null && s.length && t.set("severity", e.severity.join(",")), e.source && t.set("source", e.source), e.search && t.set("search", e.search), e.from && t.set("from", e.from), e.to && t.set("to", e.to), t.set("format", e.format ?? "jsonl"), e.limit !== void 0 && t.set("limit", String(e.limit)), `${this.baseUrl}/api/messagehub/export?${t.toString()}`;
  }
  async deleteMessages(e = {}) {
    var o;
    const t = new URLSearchParams();
    (o = e.severity) != null && o.length && t.set("severity", e.severity.join(",")), e.source && t.set("source", e.source), e.search && t.set("search", e.search), e.from && t.set("from", e.from), e.to && t.set("to", e.to);
    const s = `${this.baseUrl}/api/messagehub/messages?${t.toString()}`, a = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!a.ok)
      throw new Error(`HTTP ${a.status}`);
    return (await a.json()).deleted;
  }
  async listSources() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/sources`, {
      headers: this.headers()
    });
    if (!e.ok)
      throw new Error(`HTTP ${e.status}`);
    return (await e.json()).sources;
  }
  async getStats() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/stats`, {
      headers: this.headers()
    });
    if (!e.ok)
      throw new Error(`HTTP ${e.status}`);
    return await e.json();
  }
  async listWebhooks() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/webhooks`, {
      headers: this.headers()
    });
    if (!e.ok)
      throw new Error(`HTTP ${e.status}`);
    return (await e.json()).webhooks;
  }
  async createWebhook(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/webhooks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}: ${await t.text()}`);
    return await t.json();
  }
  async updateWebhook(e, t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/webhooks/${e}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(t)
    });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async deleteWebhook(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/webhooks/${e}`, { method: "DELETE", headers: this.headers() });
    if (!t.ok)
      throw new Error(`HTTP ${t.status}`);
  }
  // --- KNX-Stats (Iter 6) ----------------------------------------------
  _knxStatsParams(e) {
    const t = new URLSearchParams();
    return e.from && t.set("from", e.from), e.to && t.set("to", e.to), e.limit !== void 0 && t.set("limit", String(e.limit)), e.minRate !== void 0 && t.set("min_rate", String(e.minRate)), e.includeAcknowledged === !1 && t.set("include_acknowledged", "false"), t;
  }
  async getKnxStatsSummary(e) {
    const t = `${this.baseUrl}/api/messagehub/knx-stats/summary?${this._knxStatsParams(e).toString()}`, s = await fetch(t, { headers: this.headers() });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async getKnxStatsTop(e) {
    const t = `${this.baseUrl}/api/messagehub/knx-stats/top?${this._knxStatsParams(e).toString()}`, s = await fetch(t, { headers: this.headers() });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async getKnxStatsTopBySource(e) {
    const t = `${this.baseUrl}/api/messagehub/knx-stats/top-by-source?${this._knxStatsParams(e).toString()}`, s = await fetch(t, { headers: this.headers() });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async getKnxStatsGaDetail(e, t) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/ga/${encodeURIComponent(e)}?${this._knxStatsParams(t).toString()}`, a = await fetch(s, { headers: this.headers() });
    if (!a.ok)
      throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsTimeline(e) {
    const t = this._knxStatsParams(e);
    t.set("gas", e.gas.join(",")), e.bucketMinutes !== void 0 && t.set("bucket", String(e.bucketMinutes));
    const s = `${this.baseUrl}/api/messagehub/knx-stats/timeline?${t.toString()}`, a = await fetch(s, { headers: this.headers() });
    if (!a.ok)
      throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async acknowledgeKnxGa(e, t = {}) {
    const s = { ga: e };
    t.note !== void 0 && (s.note = t.note), t.expiryDays !== void 0 && (s.expiry_days = t.expiryDays);
    const a = await fetch(`${this.baseUrl}/api/messagehub/knx-stats/acknowledge`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(s)
    });
    if (!a.ok)
      throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async getKnxStatsAlarms(e) {
    const t = `${this.baseUrl}/api/messagehub/knx-stats/alarms?${this._knxStatsParams(e).toString()}`, s = await fetch(t, { headers: this.headers() });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async getKnxStatsOrphans(e) {
    const t = `${this.baseUrl}/api/messagehub/knx-stats/orphans?${this._knxStatsParams(e).toString()}`, s = await fetch(t, { headers: this.headers() });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async getKnxStatsSilence(e) {
    const t = this._knxStatsParams(e);
    e.maxSilenceMinutes !== void 0 && t.set("max_silence_min", String(e.maxSilenceMinutes));
    const s = `${this.baseUrl}/api/messagehub/knx-stats/silence?${t.toString()}`, a = await fetch(s, { headers: this.headers() });
    if (!a.ok)
      throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsBusHealth(e) {
    const t = `${this.baseUrl}/api/messagehub/knx-stats/bus-health?${this._knxStatsParams(e).toString()}`, s = await fetch(t, { headers: this.headers() });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async unacknowledgeKnxGa(e) {
    const t = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge/${encodeURIComponent(e)}`, s = await fetch(t, { method: "DELETE", headers: this.headers() });
    if (!s.ok)
      throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
}
const O = _`
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
`, Pe = _`
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
`, Ht = _`
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
`, rt = _`
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
`, ze = _`
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
const gs = { CHILD: 2 }, vs = (i) => (...e) => ({ _$litDirective$: i, values: e });
let fs = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, s) {
    this._$Ct = e, this._$AM = t, this._$Ci = s;
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
const { I: bs } = cs, xt = (i) => i, wt = () => document.createComment(""), we = (i, e, t) => {
  var r;
  const s = i._$AA.parentNode, a = e === void 0 ? i._$AB : e._$AA;
  if (t === void 0) {
    const o = s.insertBefore(wt(), a), l = s.insertBefore(wt(), a);
    t = new bs(o, l, i, i.options);
  } else {
    const o = t._$AB.nextSibling, l = t._$AM, c = l !== i;
    if (c) {
      let p;
      (r = t._$AQ) == null || r.call(t, i), t._$AM = i, t._$AP !== void 0 && (p = i._$AU) !== l._$AU && t._$AP(p);
    }
    if (o !== a || c) {
      let p = t._$AA;
      for (; p !== o; ) {
        const g = xt(p).nextSibling;
        xt(s).insertBefore(p, a), p = g;
      }
    }
  }
  return t;
}, B = (i, e, t = i) => (i._$AI(e, t), i), _s = {}, xs = (i, e = _s) => i._$AH = e, ws = (i) => i._$AH, Je = (i) => {
  i._$AR(), i._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const yt = (i, e, t) => {
  const s = /* @__PURE__ */ new Map();
  for (let a = e; a <= t; a++) s.set(i[a], a);
  return s;
}, ys = vs(class extends fs {
  constructor(i) {
    if (super(i), i.type !== gs.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(i, e, t) {
    let s;
    t === void 0 ? t = e : e !== void 0 && (s = e);
    const a = [], r = [];
    let o = 0;
    for (const l of i) a[o] = s ? s(l, o) : o, r[o] = t(l, o), o++;
    return { values: r, keys: a };
  }
  render(i, e, t) {
    return this.dt(i, e, t).values;
  }
  update(i, [e, t, s]) {
    const a = ws(i), { values: r, keys: o } = this.dt(e, t, s);
    if (!Array.isArray(a)) return this.ut = o, r;
    const l = this.ut ?? (this.ut = []), c = [];
    let p, g, u = 0, v = a.length - 1, m = 0, x = r.length - 1;
    for (; u <= v && m <= x; ) if (a[u] === null) u++;
    else if (a[v] === null) v--;
    else if (l[u] === o[m]) c[m] = B(a[u], r[m]), u++, m++;
    else if (l[v] === o[x]) c[x] = B(a[v], r[x]), v--, x--;
    else if (l[u] === o[x]) c[x] = B(a[u], r[x]), we(i, c[x + 1], a[u]), u++, x--;
    else if (l[v] === o[m]) c[m] = B(a[v], r[m]), we(i, a[u], a[v]), v--, m++;
    else if (p === void 0 && (p = yt(o, m, x), g = yt(l, u, v)), p.has(l[u])) if (p.has(l[v])) {
      const C = g.get(o[m]), Ke = C !== void 0 ? a[C] : null;
      if (Ke === null) {
        const lt = we(i, a[u]);
        B(lt, r[m]), c[m] = lt;
      } else c[m] = B(Ke, r[m]), we(i, a[u], Ke), a[C] = null;
      m++;
    } else Je(a[v]), v--;
    else Je(a[u]), u++;
    for (; m <= x; ) {
      const C = we(i, c[x + 1]);
      B(C, r[m]), c[m++] = C;
    }
    for (; u <= v; ) {
      const C = a[u++];
      C !== null && Je(C);
    }
    return this.ut = o, xs(i, c), V;
  }
}), $s = new Intl.RelativeTimeFormat("de", { numeric: "auto" }), ks = [
  { unit: "year", seconds: 31536e3 },
  { unit: "month", seconds: 2592e3 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 }
];
function It(i, e = /* @__PURE__ */ new Date()) {
  const t = new Date(i);
  if (Number.isNaN(t.getTime()))
    return "—";
  const s = Math.round((t.getTime() - e.getTime()) / 1e3), a = Math.abs(s);
  if (a < 5)
    return "gerade eben";
  for (const { unit: r, seconds: o } of ks)
    if (a >= o) {
      const l = Math.round(s / o);
      return $s.format(l, r);
    }
  return "gerade eben";
}
function Ut(i, e = /* @__PURE__ */ new Date()) {
  const t = new Date(i);
  if (Number.isNaN(t.getTime()))
    return i;
  const s = t.getFullYear() === e.getFullYear() && t.getMonth() === e.getMonth() && t.getDate() === e.getDate(), a = t.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  return s ? a : `${t.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} ${a}`;
}
var Oe = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const $t = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·"
}, kt = {
  error: "Error",
  warning: "Warn",
  info: "Info",
  debug: "Debug"
}, Ss = ["error", "warning", "info", "debug"];
var X;
let ve = (X = class extends b {
  constructor() {
    super(...arguments), this.items = [], this._now = /* @__PURE__ */ new Date(), this._editSeverityFor = null, this._popoverPos = null, this._onClick = (e) => {
      this.dispatchEvent(new CustomEvent("select", { detail: { msg: e }, bubbles: !0, composed: !0 }));
    }, this._onKey = (e, t) => {
      (e.key === "Enter" || e.key === " ") && (e.preventDefault(), this._onClick(t));
    }, this._onSeverityClick = (e, t) => {
      if (e.stopPropagation(), e.preventDefault(), this._editSeverityFor === t.id) {
        this._closePopover();
        return;
      }
      const a = e.currentTarget.getBoundingClientRect(), r = 200, o = a.bottom + r < window.innerHeight;
      this._popoverPos = {
        top: o ? a.bottom + 4 : a.top - r - 4,
        left: a.left
      }, this._editSeverityFor = t.id;
    }, this._onSeverityPick = (e, t, s, a) => {
      e.stopPropagation(), this._closePopover(), a !== s && this.dispatchEvent(new CustomEvent("severity-change", {
        detail: { id: t, severity: a, previous: s },
        bubbles: !0,
        composed: !0
      }));
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
    const e = this.items.find((a) => a.id === this._editSeverityFor);
    if (!e)
      return n``;
    const t = e.severity ?? "info", s = e.id;
    return n`
      <div class="popover-backdrop" @click=${() => this._closePopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._popoverPos.top}px; left: ${this._popoverPos.left}px`}
        @click=${(a) => a.stopPropagation()}
      >
        ${Ss.map((a) => n`<button
            role="menuitemradio"
            aria-checked=${a === t}
            class=${`sev-option ${a === t ? "active" : ""}`}
            @click=${(r) => this._onSeverityPick(r, s, t, a)}
          >
            <span class=${`mh-pill mh-pill--${a}`}>
              <span class="sev-icon" aria-hidden="true">${$t[a]}</span>
              ${kt[a]}
            </span>
            ${a === t ? n`<span class="check" aria-hidden="true">✓</span>` : h}
          </button>`)}
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
          ${ys(this.items, (e) => e.id, (e) => {
      const t = e.severity ?? "info", s = kt[t] ?? t, a = $t[t] ?? "·", r = It(e.timestamp, this._now), o = Ut(e.timestamp, this._now);
      return n`
                <div
                  class=${`row sev-${t} ${this._editSeverityFor === e.id ? "row-active" : ""}`}
                  tabindex="0"
                  role="listitem button"
                  @click=${() => this._onClick(e)}
                  @keydown=${(l) => this._onKey(l, e)}
                >
                  <span class="col-sev">
                    <button
                      class=${`mh-pill mh-pill--${t} sev-trigger`}
                      title="Severity ändern"
                      aria-haspopup="menu"
                      aria-expanded=${this._editSeverityFor === e.id}
                      @click=${(l) => this._onSeverityClick(l, e)}
                    >
                      <span class="sev-icon" aria-hidden="true">${a}</span>
                      ${s}
                      <span class="caret" aria-hidden="true">▾</span>
                    </button>
                  </span>
                  <span class="col-ts ts" title=${o}>${r}</span>
                  <span class="col-src">
                    <span class="source-pill">${e.source}</span>
                  </span>
                  <span class="col-text text">${e.text}</span>
                </div>
              `;
    })}
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
}, X.styles = [
  O,
  ze,
  _`
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
], X);
Oe([
  f({ attribute: !1 })
], ve.prototype, "items", void 0);
Oe([
  d()
], ve.prototype, "_now", void 0);
Oe([
  d()
], ve.prototype, "_editSeverityFor", void 0);
Oe([
  d()
], ve.prototype, "_popoverPos", void 0);
ve = Oe([
  w("message-table")
], ve);
var Ft = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const St = ["error", "warning", "info", "debug"];
var Z;
let Qe = (Z = class extends b {
  constructor() {
    super(...arguments), this.selected = [...St];
  }
  _toggle(e) {
    const t = this.selected.includes(e) ? this.selected.filter((s) => s !== e) : [...this.selected, e];
    this.dispatchEvent(new CustomEvent("change", {
      detail: { severities: t },
      bubbles: !0,
      composed: !0
    }));
  }
  render() {
    return n`
      <div class="chips" role="group" aria-label="Severity-Filter">
        ${St.map((e) => {
      const t = this.selected.includes(e);
      return n`<button
            class=${`chip sev-${e} ${t ? "active" : ""}`}
            aria-pressed=${t}
            @click=${() => this._toggle(e)}
          >
            <span class="dot" aria-hidden="true"></span>
            ${e}
          </button>`;
    })}
      </div>
    `;
  }
}, Z.styles = [
  O,
  _`
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
], Z);
Ft([
  f({ attribute: !1 })
], Qe.prototype, "selected", void 0);
Qe = Ft([
  w("severity-filter")
], Qe);
var Fe = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
}, ee;
let Ae = (ee = class extends b {
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
  _onChange(e) {
    const t = e.target.value;
    this.dispatchEvent(new CustomEvent("change", {
      detail: { source: t },
      bubbles: !0,
      composed: !0
    }));
  }
  render() {
    return n`
      <select @change=${this._onChange} .value=${this.selected}>
        <option value="">Alle Quellen</option>
        ${this._sources.map((e) => n`<option value=${e}>${e}</option>`)}
      </select>
    `;
  }
}, ee.styles = _`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `, ee);
Fe([
  f({ attribute: !1 })
], Ae.prototype, "api", void 0);
Fe([
  f({ attribute: !1 })
], Ae.prototype, "selected", void 0);
Fe([
  d()
], Ae.prototype, "_sources", void 0);
Ae = Fe([
  w("source-filter")
], Ae);
var it = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
}, te;
let He = (te = class extends b {
  _set(e) {
    let t;
    const s = /* @__PURE__ */ new Date();
    e === "1h" ? t = new Date(s.getTime() - 36e5).toISOString() : e === "24h" ? t = new Date(s.getTime() - 864e5).toISOString() : e === "7d" ? t = new Date(s.getTime() - 7 * 864e5).toISOString() : t = void 0, this.dispatchEvent(new CustomEvent("change", {
      detail: { fromIso: t, toIso: void 0 },
      bubbles: !0,
      composed: !0
    }));
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
}, te.styles = _`
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
  `, te);
it([
  f({ attribute: !1 })
], He.prototype, "fromIso", void 0);
it([
  f({ attribute: !1 })
], He.prototype, "toIso", void 0);
He = it([
  w("time-range-filter")
], He);
var U = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
}, se;
let L = (se = class extends b {
  constructor() {
    super(...arguments), this._status = "new", this._tags = [], this._newTag = "", this._runbook = null, this._busy = !1;
  }
  willUpdate(e) {
    e.has("msg") && this.msg && (this._status = this.msg.status ?? "new", this._loadTags(), this._loadRunbook());
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
  async _setStatus(e) {
    if (this.api) {
      this._busy = !0;
      try {
        await this.api.setMessageStatus(this.msg.id, e), this._status = e, this.dispatchEvent(new CustomEvent("status-change", {
          detail: { id: this.msg.id, status: e },
          bubbles: !0,
          composed: !0
        }));
      } catch (t) {
        this.dispatchEvent(new CustomEvent("error", {
          detail: { message: t.message },
          bubbles: !0,
          composed: !0
        }));
      } finally {
        this._busy = !1;
      }
    }
  }
  async _addTag() {
    if (!this.api || !this._newTag.trim())
      return;
    const e = this._newTag.trim().toLowerCase().replaceAll(/[^a-z0-9._-]+/g, "-");
    try {
      this._tags = await this.api.addMessageTag(this.msg.id, e), this._newTag = "";
    } catch {
    }
  }
  async _removeTag(e) {
    if (this.api)
      try {
        this._tags = await this.api.removeMessageTag(this.msg.id, e);
      } catch {
      }
  }
  async _delete() {
    confirm(`Nachricht #${this.msg.id} endgültig löschen?`) && this.dispatchEvent(new CustomEvent("delete", {
      detail: { id: this.msg.id },
      bubbles: !0,
      composed: !0
    }));
  }
  _statusBadge() {
    const e = {
      new: "Neu",
      acknowledged: "Bestätigt",
      resolved: "Gelöst",
      expired: "Abgelaufen"
    };
    return n`<span class=${`status-badge status-${this._status}`}>
      ${e[this._status] ?? this._status}
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
          ${this._tags.length === 0 ? n`<span class="hint">keine Tags</span>` : this._tags.map((e) => n`
                  <span class="tag">
                    #${e}
                    <button
                      class="tag-remove"
                      aria-label=${`Tag ${e} entfernen`}
                      @click=${() => this._removeTag(e)}
                    >
                      ×
                    </button>
                  </span>
                `)}
        </div>
        <div class="tag-input">
          <input
            type="text"
            placeholder="neuer Tag"
            .value=${this._newTag}
            @input=${(e) => this._newTag = e.target.value}
            @keydown=${(e) => {
      e.key === "Enter" && this._addTag();
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
}, se.styles = _`
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
  `, se);
U([
  f({ attribute: !1 })
], L.prototype, "msg", void 0);
U([
  f({ attribute: !1 })
], L.prototype, "api", void 0);
U([
  d()
], L.prototype, "_status", void 0);
U([
  d()
], L.prototype, "_tags", void 0);
U([
  d()
], L.prototype, "_newTag", void 0);
U([
  d()
], L.prototype, "_runbook", void 0);
U([
  d()
], L.prototype, "_busy", void 0);
L = U([
  w("detail-pane")
], L);
var D = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const Ts = ["debug", "info", "warning", "error"], As = JSON.stringify({
  severity: "$.level",
  source: "$.app.name",
  text: "$.message",
  metadata: "$.extra"
}, null, 2), Ye = /^[a-z0-9._-]{1,64}$/;
function Es(i) {
  return i.toLowerCase().normalize("NFKD").replaceAll(/[äÄ]/g, "ae").replaceAll(/[öÖ]/g, "oe").replaceAll(/[üÜ]/g, "ue").replaceAll(/ß/g, "ss").replaceAll(/[\s/\\]+/g, "-").replaceAll(/[^a-z0-9._-]/g, "").slice(0, 64);
}
var ae;
let P = (ae = class extends b {
  constructor() {
    super(...arguments), this.editing = null, this._name = "", this._source = "", this._severity = "info", this._enabled = !0, this._mappingText = "", this._error = "", this._saving = !1;
  }
  willUpdate(e) {
    if (e.has("editing")) {
      const t = this.editing;
      this._name = (t == null ? void 0 : t.name) ?? "", this._source = (t == null ? void 0 : t.default_source) ?? "", this._severity = (t == null ? void 0 : t.default_severity) ?? "info", this._enabled = (t == null ? void 0 : t.enabled) ?? !0, this._mappingText = t != null && t.field_map ? JSON.stringify(t.field_map, null, 2) : "", this._error = "";
    }
  }
  _validateMapping() {
    if (!this._mappingText.trim())
      return null;
    try {
      const e = JSON.parse(this._mappingText);
      if (typeof e != "object" || Array.isArray(e))
        throw new Error("muss ein JSON-Objekt sein");
      return e;
    } catch (e) {
      throw new Error(`Mapping-JSON ungueltig: ${e.message}`);
    }
  }
  async _save() {
    if (this.api) {
      this._error = "", this._saving = !0;
      try {
        const e = this._validateMapping();
        if (!this._name.trim())
          throw new Error("Name darf nicht leer sein");
        if (!Ye.test(this._source))
          throw new Error("Source ist leer oder ungueltig.");
        let t;
        this.editing ? t = await this.api.updateWebhook(this.editing.webhook_id, {
          name: this._name.trim(),
          default_source: this._source,
          default_severity: this._severity,
          field_map: e,
          enabled: this._enabled
        }) : t = await this.api.createWebhook({
          name: this._name.trim(),
          default_source: this._source,
          default_severity: this._severity,
          field_map: e,
          enabled: this._enabled
        }), this.dispatchEvent(new CustomEvent("saved", {
          detail: { webhook: t },
          bubbles: !0,
          composed: !0
        }));
      } catch (e) {
        this._error = e.message;
      } finally {
        this._saving = !1;
      }
    }
  }
  _cancel() {
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: !0, composed: !0 }));
  }
  _useExample() {
    this._mappingText = As;
  }
  render() {
    const e = this.editing !== null;
    return n`
      <div class="card">
        <h3>${e ? "Webhook bearbeiten" : "Neuen Webhook anlegen"}</h3>

        <label>
          <span>Name</span>
          <input
            type="text"
            .value=${this._name}
            @input=${(t) => this._name = t.target.value}
            placeholder="z. B. Pi-hole Alerts"
          />
        </label>

        <div class="row-2">
          <label>
            <span>
              Default-Source
              ${this._source && Ye.test(this._source) ? n`<span class="ok-badge" title="ok">✓</span>` : null}
            </span>
            <input
              type="text"
              class=${this._source && !Ye.test(this._source) ? "invalid" : ""}
              .value=${this._source}
              @input=${(t) => {
      const s = t.target.value;
      this._source = Es(s);
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
              @change=${(t) => this._severity = t.target.value}
            >
              ${Ts.map((t) => n`<option value=${t} ?selected=${this._severity === t}>${t}</option>`)}
            </select>
          </label>
        </div>

        <label class="checkbox">
          <input
            type="checkbox"
            .checked=${this._enabled}
            @change=${(t) => this._enabled = t.target.checked}
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
            @input=${(t) => this._mappingText = t.target.value}
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
            ${this._saving ? "speichere…" : e ? "Speichern" : "Anlegen"}
          </button>
          <button @click=${this._cancel}>Abbrechen</button>
        </div>
      </div>
    `;
  }
}, ae.styles = _`
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
  `, ae);
D([
  f({ attribute: !1 })
], P.prototype, "api", void 0);
D([
  f({ attribute: !1 })
], P.prototype, "editing", void 0);
D([
  d()
], P.prototype, "_name", void 0);
D([
  d()
], P.prototype, "_source", void 0);
D([
  d()
], P.prototype, "_severity", void 0);
D([
  d()
], P.prototype, "_enabled", void 0);
D([
  d()
], P.prototype, "_mappingText", void 0);
D([
  d()
], P.prototype, "_error", void 0);
D([
  d()
], P.prototype, "_saving", void 0);
P = D([
  w("webhook-form")
], P);
var T = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const Ps = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/, Xe = ["debug", "info", "warning", "error"], Tt = [...Xe, "auto"];
var re;
let $ = (re = class extends b {
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
        const e = await this.api.discoverKnxFromProject();
        this._discovery = e.items, this._discoveryStatus = e.status;
      } catch (e) {
        this._discovery = [], this._discoveryStatus = `error: ${e.message}`;
      }
  }
  _renderDiscoveryStatus() {
    if (this._discoveryStatus === "ok" && this._discovery.length > 0)
      return null;
    const t = {
      loading: "🔄 Lade KNX-Projekt-Daten…",
      no_knx_integration: "ℹ️ Keine KNX-Integration in HA gefunden. Lege erst die KNX-Integration unter Einstellungen → Geräte & Dienste an, dann erscheinen die GAs hier automatisch.",
      no_project_loaded: "ℹ️ KNX-Integration ist da, aber kein ETS-Projekt hochgeladen. Lade dein .knxproj in der KNX-Integration unter Konfigurieren → Projekt hoch.",
      project_empty: "ℹ️ ETS-Projekt enthält keine Gruppenadressen — pruefe den Export."
    }[this._discoveryStatus] ?? `Status: ${this._discoveryStatus}`;
    return n`<div class="discovery-status">${t}</div>`;
  }
  _onAddressInput(e) {
    const t = e.target.value;
    this._newAddr = t;
    const s = this._discovery.find((a) => a.address === t);
    s && (this._newLabel.trim() || (this._newLabel = s.name), !this._newDpt.trim() && s.dpt && (this._newDpt = s.dpt));
  }
  async _bulkImportFromProject() {
    if (!this.api || this._discovery.length === 0)
      return;
    const e = new Set(this._items.map((a) => a.address)), t = this._discovery.filter((a) => !e.has(a.address));
    if (t.length === 0) {
      this._showToast("Alle Projekt-GAs sind bereits angelegt");
      return;
    }
    if (!window.confirm(`${t.length} fehlende Projekt-GAs anlegen? (Logging bleibt zunächst aus, Severity-Mapping kannst du danach pro Adresse setzen.)`))
      return;
    let s = 0;
    for (const a of t)
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
    if (this._error = "", !this.api)
      return;
    const e = this._newAddr.trim();
    if (!Ps.test(e)) {
      this._error = "Bitte Format N/N/N (z. B. 1/2/3)";
      return;
    }
    if (!this._newLabel.trim()) {
      this._error = "Label darf nicht leer sein";
      return;
    }
    try {
      await this.api.upsertKnxAddress({
        address: e,
        label: this._newLabel.trim(),
        dpt: this._newDpt.trim() || null,
        log_enabled: !1,
        log_severity: "info"
      }), this._newAddr = "", this._newLabel = "", this._newDpt = "", this._showToast(`${e} gespeichert`), await this._load();
    } catch (t) {
      this._error = t.message;
    }
  }
  async _toggleLog(e) {
    if (!this.api)
      return;
    const t = !e.log_enabled;
    try {
      await this.api.upsertKnxAddress({
        ...e,
        log_enabled: t
      }), await this._load();
      const s = this._items.find((r) => r.address === e.address), a = !!(s != null && s.log_enabled);
      s !== void 0 && a !== t ? this._showToast("Backend hat log_enabled nicht gesetzt — Browser-Cache leeren (Cmd+Shift+R) und HA-Container neu starten") : this._showToast(t ? `${e.address} im Protokoll aktiv` : `${e.address} aus Protokoll entfernt`);
    } catch (s) {
      this._showToast(s.message);
    }
  }
  async _delete(e) {
    if (this.api && window.confirm(`KNX-Adresse ${e} löschen?`))
      try {
        await this.api.deleteKnxAddress(e), this._showToast(`${e} gelöscht`), await this._load();
      } catch (t) {
        this._showToast(t.message);
      }
  }
  _closeSevPopover() {
    this._sevPopoverFor = null, this._sevPopoverPos = null;
  }
  _onSeverityTrigger(e, t) {
    if (e.stopPropagation(), e.preventDefault(), this._sevPopoverFor === t.address) {
      this._closeSevPopover();
      return;
    }
    const a = e.currentTarget.getBoundingClientRect(), r = 220, o = a.bottom + r < window.innerHeight;
    this._sevPopoverPos = {
      top: o ? a.bottom + 4 : a.top - r - 4,
      left: a.left
    }, this._sevPopoverFor = t.address;
  }
  async _onSeverityPick(e, t, s) {
    if (e.stopPropagation(), this._closeSevPopover(), s === t.log_severity || !this.api)
      return;
    const a = {
      address: t.address,
      log_severity: s
    };
    s === "auto" && (a.severity_on_true = t.severity_on_true ?? "warning", a.severity_on_false = t.severity_on_false ?? "info");
    const r = t.log_severity;
    this._items = this._items.map((o) => o.address === t.address ? {
      ...o,
      log_severity: s,
      severity_on_true: a.severity_on_true ?? o.severity_on_true,
      severity_on_false: a.severity_on_false ?? o.severity_on_false
    } : o);
    try {
      await this.api.upsertKnxAddress({ ...t, ...a }), this._showToast(`${t.address}: Severity ${r} → ${s}`);
    } catch (o) {
      this._items = this._items.map((l) => l.address === t.address ? { ...l, log_severity: r } : l), this._showToast(`Fehlgeschlagen: ${o.message}`);
    }
  }
  _renderSevPopover() {
    if (this._sevPopoverFor === null || this._sevPopoverPos === null)
      return h;
    const e = this._items.find((s) => s.address === this._sevPopoverFor);
    if (!e)
      return h;
    const t = e.log_severity;
    return n`
      <div class="sev-backdrop" @click=${() => this._closeSevPopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._sevPopoverPos.top}px; left: ${this._sevPopoverPos.left}px`}
        @click=${(s) => s.stopPropagation()}
      >
        ${Tt.map((s) => n`<button
            role="menuitemradio"
            aria-checked=${s === t}
            class=${`sev-option ${s === t ? "active" : ""}`}
            @click=${(a) => void this._onSeverityPick(a, e, s)}
          >
            <span
              class=${`mh-pill mh-pill--${s === "auto" ? "neutral" : s}`}
            >${s}</span>
            ${s === t ? n`<span class="sev-check" aria-hidden="true">✓</span>` : h}
          </button>`)}
      </div>
    `;
  }
  async _onCsvFile(e) {
    var a;
    const t = (a = e.target.files) == null ? void 0 : a[0];
    if (!t || !this.api)
      return;
    const s = await t.text();
    try {
      const r = await this.api.importKnxCsv(s);
      this._showToast(`Import: ${r.imported} angelegt, ${r.skipped} ueberlesen, ${r.errors} Fehler`), await this._load();
    } catch (r) {
      this._showToast(`Import fehlgeschlagen: ${r.message}`);
    } finally {
      e.target.value = "";
    }
  }
  _showToast(e) {
    this._toast = e, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  _filtered() {
    let e = this._items;
    this._onlyEnabled && (e = e.filter((s) => !!s.log_enabled));
    const t = this._filter.trim().toLowerCase();
    return t ? e.filter((s) => s.address.includes(t) || s.label.toLowerCase().includes(t) || (s.dpt ?? "").toLowerCase().includes(t)) : e;
  }
  _renderEditor() {
    if (!this._editing)
      return h;
    const e = this._editing, t = (s) => {
      this._editing = { ...e, ...s };
    };
    return n`
      <div class="modal-backdrop" @click=${() => this._editing = null}>
        <div class="modal" @click=${(s) => s.stopPropagation()}>
          <h3>${e.address} bearbeiten</h3>
          <label>
            <span>Label</span>
            <input
              type="text"
              .value=${e.label}
              @input=${(s) => t({ label: s.target.value })}
            />
          </label>
          <div class="row-2">
            <label>
              <span>DPT (z. B. 1.001, 5.001, 16.001)</span>
              <input
                type="text"
                .value=${e.dpt ?? ""}
                @input=${(s) => t({ dpt: s.target.value || null })}
              />
            </label>
            <label class="checkbox">
              <input
                type="checkbox"
                .checked=${e.log_enabled}
                @change=${(s) => t({ log_enabled: s.target.checked })}
              />
              <span>Im Protokoll erfassen</span>
            </label>
          </div>

          ${e.log_enabled ? n`
                <label>
                  <span>Severity</span>
                  <select
                    .value=${e.log_severity}
                    @change=${(s) => {
      const a = s.target.value;
      t({ log_severity: a });
    }}
                  >
                    ${Tt.map((s) => n`<option value=${s}>${s}</option>`)}
                  </select>
                  <small>
                    <code>auto</code> nutzt für Boolean-DPTs (1.x) die
                    Severity-Map unten — z. B. für Stör-Bits, die bei
                    <code>True</code> einen Fehler bedeuten.
                  </small>
                </label>
                ${e.log_severity === "auto" ? n`<div class="row-2">
                      <label>
                        <span>Severity bei <code>True</code></span>
                        <select
                          .value=${e.severity_on_true ?? "warning"}
                          @change=${(s) => t({
      severity_on_true: s.target.value
    })}
                        >
                          ${Xe.map((s) => n`<option value=${s}>${s}</option>`)}
                        </select>
                      </label>
                      <label>
                        <span>Severity bei <code>False</code></span>
                        <select
                          .value=${e.severity_on_false ?? "info"}
                          @change=${(s) => t({
      severity_on_false: s.target.value
    })}
                        >
                          ${Xe.map((s) => n`<option value=${s}>${s}</option>`)}
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
      } catch (e) {
        this._showToast(e.message);
      }
  }
  render() {
    const e = this._filtered(), t = this._items.filter((s) => s.log_enabled).length;
    return n`
      <section>
        <header class="head">
          <div>
            <h2>KNX-Gruppenadressen</h2>
            <p class="hint">
              ${this._items.length} Adressen,
              <strong>${t} im Protokoll aktiv</strong>. Voraussetzung
              für die Bus-Erfassung: HA-KNX-Integration mit IP-Tunneling/Routing
              ist eingerichtet — sie feuert das Event <code>knx_event</code>, das
              wir gegen diese Whitelist matchen. Nicht-aktivierte GAs werden
              ignoriert.
            </p>
          </div>
          <div class="header-actions">
            ${this._discovery.length > 0 ? n`<button
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
            ${this._discovery.map((s) => n`<option value=${s.address}>
                  ${s.name}${s.dpt ? ` (DPT ${s.dpt})` : ""}
                </option>`)}
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
          <span class="muted">${e.length} sichtbar</span>
        </div>

        ${this._loading ? n`<p class="muted">lade…</p>` : e.length === 0 ? n`<div class="empty">
                ${this._items.length === 0 ? n`<p>
                      Noch keine Adressen. Lege oben den ersten Eintrag an oder
                      importiere eine ETS-CSV.
                    </p>` : this._onlyEnabled && t === 0 ? n`<p>
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
                        ${t} davon aktiv).
                      </p>`}
              </div>` : n`
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
                      ${e.map((s) => n`
                          <tr class=${s.log_enabled ? "enabled" : ""}>
                            <td><code class="ga">${s.address}</code></td>
                            <td class="label-cell">${s.label}</td>
                            <td>
                              ${s.dpt ? n`<code class="dpt">${s.dpt}</code>` : n`<span class="muted">—</span>`}
                            </td>
                            <td>
                              ${s.log_enabled ? n`<button
                                    class=${`mh-pill mh-pill--${s.log_severity === "auto" ? "neutral" : s.log_severity} sev-trigger`}
                                    title="Severity ändern"
                                    aria-haspopup="menu"
                                    aria-expanded=${this._sevPopoverFor === s.address}
                                    @click=${(a) => this._onSeverityTrigger(a, s)}
                                  >
                                    <span class="mh-pill__dot"></span>
                                    ${s.log_severity}${s.log_severity === "auto" ? n` <small class="auto-detail"
                                          >T:${s.severity_on_true ?? "warning"}
                                          / F:${s.severity_on_false ?? "info"}</small
                                        >` : h}
                                    <span class="sev-caret" aria-hidden="true">▾</span>
                                  </button>` : n`<span class="muted">—</span>`}
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
                        `)}
                    </tbody>
                  </table>
                </div>
              `}

        ${this._renderEditor()}
        ${this._renderSevPopover()}
        ${this._toast ? n`<div class="toast">${this._toast}</div>` : h}
      </section>
    `;
  }
}, re.styles = [
  O,
  Pe,
  Ht,
  ze,
  _`
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
], re);
T([
  f({ attribute: !1 })
], $.prototype, "api", void 0);
T([
  d()
], $.prototype, "_items", void 0);
T([
  d()
], $.prototype, "_loading", void 0);
T([
  d()
], $.prototype, "_filter", void 0);
T([
  d()
], $.prototype, "_onlyEnabled", void 0);
T([
  d()
], $.prototype, "_newAddr", void 0);
T([
  d()
], $.prototype, "_newLabel", void 0);
T([
  d()
], $.prototype, "_newDpt", void 0);
T([
  d()
], $.prototype, "_sevPopoverFor", void 0);
T([
  d()
], $.prototype, "_sevPopoverPos", void 0);
T([
  d()
], $.prototype, "_discovery", void 0);
T([
  d()
], $.prototype, "_discoveryStatus", void 0);
T([
  d()
], $.prototype, "_editing", void 0);
T([
  d()
], $.prototype, "_toast", void 0);
T([
  d()
], $.prototype, "_error", void 0);
$ = T([
  w("knx-addresses-view")
], $);
var De = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const zs = ["telegram", "pushover", "ntfy", "signal", "notify"], Os = ["debug", "info", "warning", "error"];
var ie;
let fe = (ie = class extends b {
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
  _edit(e) {
    this._editing = { ...e };
  }
  async _save() {
    if (!(!this.api || !this._editing)) {
      try {
        this._editing.id == null ? await this.api.createChannel(this._editing) : await this.api.updateChannel(this._editing.id, this._editing), this._editing = null, this._toast = "gespeichert", await this._load();
      } catch (e) {
        this._toast = e.message;
      }
      window.setTimeout(() => this._toast = "", 2400);
    }
  }
  async _delete(e) {
    !this.api || e.id == null || window.confirm(`Channel '${e.name}' löschen?`) && (await this.api.deleteChannel(e.id), await this._load());
  }
  _renderTypeFields(e, t) {
    const s = e.config ?? {}, a = (r, o) => {
      t({ config: { ...s, [r]: o } });
    };
    return e.channel_type === "telegram" ? n`
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
      ` : e.channel_type === "pushover" ? n`
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
      ` : e.channel_type === "ntfy" ? n`
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
      ` : n`
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
    const e = this._editing, t = (s) => {
      this._editing = { ...e, ...s };
    };
    return n`
      <div class="modal-bg" @click=${() => this._editing = null}>
        <div class="modal" @click=${(s) => s.stopPropagation()}>
          <h3>${e.id == null ? "Neuen Channel anlegen" : `${e.name} bearbeiten`}</h3>
          <label
            ><span>Name</span
            ><input
              .value=${e.name}
              @input=${(s) => t({ name: s.target.value })}
          /></label>
          <label>
            <span>Typ</span>
            <select
              .value=${e.channel_type}
              @change=${(s) => {
      const a = s.target.value;
      t({ channel_type: a, config: {} });
    }}
            >
              ${zs.map((s) => n`<option value=${s}>${s}</option>`)}
            </select>
            <small>
              ${e.channel_type === "telegram" ? "Direkt an Telegram-Bot-API. Bot-Token + Chat-ID unten." : e.channel_type === "pushover" ? "Direkt an Pushover-API. App-Token + User-Key unten." : e.channel_type === "ntfy" ? "Direkt an ntfy-Server (ntfy.sh oder selbst-gehostet)." : e.channel_type === "signal" ? "Ueber HA-Service notify.<service>. Trag Namen unten ein." : "Ueber HA-Service notify.<service>."}
            </small>
          </label>

          ${this._renderTypeFields(e, t)}

          <div class="row-2">
            <label>
              <span>Severity-Schwelle</span>
              <select
                .value=${e.severity_threshold}
                @change=${(s) => {
      const a = s.target.value;
      t({ severity_threshold: a });
    }}
              >
                ${Os.map((s) => n`<option value=${s}>${s}</option>`)}
              </select>
            </label>
            <label>
              <span>Throttle (Sek. pro Source)</span>
              <input
                type="number"
                min="0"
                .value=${String(e.throttle_seconds)}
                @input=${(s) => t({ throttle_seconds: +s.target.value })}
              />
            </label>
          </div>

          <div class="row-2">
            <label>
              <span>Quiet Hours Start (HH:MM)</span>
              <input
                placeholder="22:00"
                .value=${e.quiet_start ?? ""}
                @input=${(s) => t({ quiet_start: s.target.value || null })}
              />
            </label>
            <label>
              <span>Quiet Hours Ende (HH:MM)</span>
              <input
                placeholder="07:00"
                .value=${e.quiet_end ?? ""}
                @input=${(s) => t({ quiet_end: s.target.value || null })}
              />
            </label>
          </div>

          <label class="checkbox">
            <input
              type="checkbox"
              .checked=${e.quiet_bypass_error}
              @change=${(s) => t({ quiet_bypass_error: s.target.checked })}
            /><span>Errors umgehen Quiet Hours</span>
          </label>
          <label class="checkbox">
            <input
              type="checkbox"
              .checked=${e.enabled}
              @change=${(s) => t({ enabled: s.target.checked })}
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
                ${this._items.map((e) => {
      var t, s, a, r, o;
      return n`<tr>
                    <td>${e.name}</td>
                    <td>
                      <code>${e.channel_type}</code>
                      ${e.channel_type === "telegram" ? n` → <small>${((t = e.config) == null ? void 0 : t.chat_id) ?? "?"}</small>` : e.channel_type === "pushover" ? n` → <small>${((a = (s = e.config) == null ? void 0 : s.user_key) == null ? void 0 : a.slice(0, 8)) ?? "?"}…</small>` : e.channel_type === "ntfy" ? n` → <small>${((r = e.config) == null ? void 0 : r.topic) ?? "?"}</small>` : (o = e.config) != null && o.service ? n` → <code>notify.${e.config.service}</code>` : n`<span class="muted">— unkonfiguriert</span>`}
                    </td>
                    <td>${e.severity_threshold}</td>
                    <td>
                      ${e.quiet_start && e.quiet_end ? n`${e.quiet_start}–${e.quiet_end}${e.quiet_bypass_error ? n` <small>(Err bypass)</small>` : ""}` : n`<span class="muted">—</span>`}
                    </td>
                    <td>${e.throttle_seconds}s</td>
                    <td>${e.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button @click=${() => this._edit(e)}>Edit</button>
                      <button class="danger" @click=${() => void this._delete(e)}>
                        Löschen
                      </button>
                    </td>
                  </tr>`;
    })}
              </tbody>
            </table>`}
        ${this._editing ? this._renderEditor() : null}
        ${this._toast ? n`<div class="toast">${this._toast}</div>` : null}
      </section>
    `;
  }
}, ie.styles = _`
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
  `, ie);
De([
  f({ attribute: !1 })
], fe.prototype, "api", void 0);
De([
  d()
], fe.prototype, "_items", void 0);
De([
  d()
], fe.prototype, "_editing", void 0);
De([
  d()
], fe.prototype, "_toast", void 0);
fe = De([
  w("channels-view")
], fe);
var y = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const ot = _`
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
var oe;
let q = (oe = class extends b {
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
  async _delete(e) {
    !this.api || e.id == null || window.confirm(`Subscription '${e.topic_pattern}' löschen?`) && (await this.api.deleteMqttTopic(e.id), await this._load());
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
            @input=${(e) => this._newPattern = e.target.value}
          />
          <input
            placeholder="Source (z. B. zigbee.health)"
            .value=${this._newSource}
            @input=${(e) => this._newSource = e.target.value}
          />
          <select
            .value=${this._newSeverity}
            @change=${(e) => {
      this._newSeverity = e.target.value;
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
                ${this._items.map((e) => n`<tr>
                    <td><code>${e.topic_pattern}</code></td>
                    <td>${e.source}</td>
                    <td>${e.severity}</td>
                    <td>${e.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button class="danger" @click=${() => void this._delete(e)}>
                        Löschen
                      </button>
                    </td>
                  </tr>`)}
              </tbody>
            </table>`}
      </section>
    `;
  }
}, oe.styles = ot, oe);
y([
  f({ attribute: !1 })
], q.prototype, "api", void 0);
y([
  d()
], q.prototype, "_items", void 0);
y([
  d()
], q.prototype, "_newPattern", void 0);
y([
  d()
], q.prototype, "_newSource", void 0);
y([
  d()
], q.prototype, "_newSeverity", void 0);
q = y([
  w("mqtt-topics-view")
], q);
var ne;
let be = (ne = class extends b {
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
            @input=${(e) => this._newSource = e.target.value}
          />
          <input
            type="number"
            min="60"
            placeholder="Intervall (Sek)"
            .value=${String(this._newInterval)}
            @input=${(e) => this._newInterval = +e.target.value}
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
                ${this._items.map((e) => n`<tr>
                    <td><code>${e.source}</code></td>
                    <td>${e.expected_interval_seconds}</td>
                    <td>${e.last_seen ?? n`<span class="muted">—</span>`}</td>
                    <td>
                      ${e.silent_alert_active ? n`<span class="alert">⚠ silent</span>` : n`<span class="ok">✓ ok</span>`}
                    </td>
                  </tr>`)}
              </tbody>
            </table>`}
      </section>
    `;
  }
}, ne.styles = ot, ne);
y([
  f({ attribute: !1 })
], be.prototype, "api", void 0);
y([
  d()
], be.prototype, "_items", void 0);
y([
  d()
], be.prototype, "_newSource", void 0);
y([
  d()
], be.prototype, "_newInterval", void 0);
be = y([
  w("heartbeats-view")
], be);
var le;
let N = (le = class extends b {
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
  async _delete(e) {
    !this.api || e.id == null || window.confirm(`Hook '${e.name}' löschen?`) && (await this.api.deleteRemediationHook(e.id), await this._load());
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
            @input=${(e) => this._newName = e.target.value}
          />
          <input
            placeholder="Source-Pattern (% erlaubt)"
            .value=${this._newSource}
            @input=${(e) => this._newSource = e.target.value}
          />
          <input
            placeholder="automation.foo / script.bar"
            .value=${this._newAutomation}
            @input=${(e) => this._newAutomation = e.target.value}
          />
          <label class="inline">
            <input
              type="checkbox"
              .checked=${this._newAuto}
              @change=${(e) => this._newAuto = e.target.checked}
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
                ${this._items.map((e) => n`<tr>
                    <td>${e.name}</td>
                    <td><code>${e.source_pattern}</code></td>
                    <td><code>${e.automation_id}</code></td>
                    <td>
                      ${e.confirm_required ? n`<span class="muted">Vorschlag</span>` : n`<span class="alert">Auto</span>`}
                    </td>
                    <td>${e.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button class="danger" @click=${() => void this._delete(e)}>
                        Löschen
                      </button>
                    </td>
                  </tr>`)}
              </tbody>
            </table>`}
      </section>
    `;
  }
}, le.styles = ot, le);
y([
  f({ attribute: !1 })
], N.prototype, "api", void 0);
y([
  d()
], N.prototype, "_items", void 0);
y([
  d()
], N.prototype, "_newName", void 0);
y([
  d()
], N.prototype, "_newSource", void 0);
y([
  d()
], N.prototype, "_newAutomation", void 0);
y([
  d()
], N.prototype, "_newAuto", void 0);
N = y([
  w("remediation-view")
], N);
var R = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const Bt = [
  { id: "webhooks", label: "Webhooks", icon: "🔗" },
  { id: "knx", label: "KNX-Bus", icon: "🏠" },
  { id: "channels", label: "Channels", icon: "📨" },
  { id: "mqtt", label: "MQTT", icon: "📡" },
  { id: "heartbeats", label: "Heartbeats", icon: "💓" },
  { id: "remediation", label: "Auto-Remediation", icon: "🔧" }
], Kt = "messagehub.settings.tab";
function Ds() {
  try {
    const i = localStorage.getItem(Kt);
    if (i && Bt.some((e) => e.id === i))
      return i;
  } catch {
  }
  return "webhooks";
}
var de;
let z = (de = class extends b {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._showForm = !1, this._editing = null, this._toast = "", this._menuOpenId = null, this._activeTab = Ds(), this._closeMenu = () => {
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
  async _copyUrl(e) {
    const t = `${window.location.origin}/api/webhook/${e}`;
    try {
      await navigator.clipboard.writeText(t), this._showToast("URL kopiert");
    } catch {
      this._showToast("Kopieren fehlgeschlagen");
    }
  }
  async _delete(e) {
    this.api && window.confirm(`Webhook „${e.name}" wirklich löschen?`) && (await this.api.deleteWebhook(e.webhook_id), this._showToast(`„${e.name}" gelöscht`), await this._load());
  }
  _toggleMenu(e) {
    this._menuOpenId = this._menuOpenId === e ? null : e;
  }
  async _toggle(e) {
    this.api && (await this.api.updateWebhook(e.webhook_id, { enabled: !e.enabled }), await this._load());
  }
  _onSaved(e) {
    this._showForm = !1, this._editing = null, this._showToast("Webhook gespeichert"), this._load();
  }
  _onCancel() {
    this._showForm = !1, this._editing = null;
  }
  _add() {
    this._editing = null, this._showForm = !0;
  }
  _edit(e) {
    this._editing = e, this._showForm = !0;
  }
  _showToast(e) {
    this._toast = e, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2400);
  }
  _selectTab(e) {
    this._activeTab = e;
    try {
      localStorage.setItem(Kt, e);
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
  _renderItem(e) {
    const t = `${window.location.origin}/api/webhook/${e.webhook_id}`, s = this._menuOpenId === e.webhook_id;
    return n`
      <div class=${`webhook-card ${e.enabled ? "" : "disabled"}`}>
        <header class="card-header">
          <div class="title">
            <span
              class=${`status-dot ${e.enabled ? "ok" : "off"}`}
              title=${e.enabled ? "Aktiv" : "Deaktiviert"}
              aria-hidden="true"
            ></span>
            <h4>${e.name}</h4>
            <span class=${`status-text ${e.enabled ? "ok" : "off"}`}>
              ${e.enabled ? "Aktiv" : "Deaktiviert"}
            </span>
          </div>
          <div class="card-actions" @click=${(a) => a.stopPropagation()}>
            <button
              class="mh-btn mh-btn--sm"
              title="Webhook bearbeiten"
              @click=${() => this._edit(e)}
            >
              <span aria-hidden="true">✎</span> Bearbeiten
            </button>
            <div class="overflow">
              <button
                class="mh-btn mh-btn--icon mh-btn--ghost"
                aria-label="Weitere Aktionen"
                aria-haspopup="menu"
                aria-expanded=${s}
                @click=${() => this._toggleMenu(e.webhook_id)}
              >
                ⋮
              </button>
              ${s ? n`<div class="overflow-menu" role="menu">
                    <button
                      role="menuitem"
                      class="overflow-item"
                      @click=${() => {
      this._menuOpenId = null, this._toggle(e);
    }}
                    >
                      ${e.enabled ? "Deaktivieren" : "Aktivieren"}
                    </button>
                    <hr />
                    <button
                      role="menuitem"
                      class="overflow-item danger"
                      @click=${() => {
      this._menuOpenId = null, this._delete(e);
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
            <code>${e.default_source}</code>
          </span>
          <span class="meta-pill">
            <span class="meta-key">Severity</span>
            <code>${e.default_severity}</code>
          </span>
        </div>

        <div class="url-row">
          <code class="url" title=${t}>${t}</code>
          <button
            class="mh-btn mh-btn--sm"
            @click=${() => this._copyUrl(e.webhook_id)}
            title="URL in Zwischenablage kopieren"
          >
            <span aria-hidden="true">⧉</span> Kopieren
          </button>
        </div>

        ${e.field_map ? n`<details class="mapping">
              <summary>JSONPath-Mapping anzeigen</summary>
              <pre><code>${JSON.stringify(e.field_map, null, 2)}</code></pre>
            </details>` : null}
      </div>
    `;
  }
  render() {
    return n`
      <div class="root" @click=${this._closeMenu}>
        <nav class="tabs" role="tablist" aria-label="Einstellungs-Bereiche">
          ${Bt.map((e) => n`<button
              role="tab"
              aria-selected=${this._activeTab === e.id}
              class=${`tab ${this._activeTab === e.id ? "active" : ""}`}
              title=${e.label}
              @click=${() => this._selectTab(e.id)}
            >
              <span class="tab-icon" aria-hidden="true">${e.icon}</span>
              <span>${e.label}</span>
            </button>`)}
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

        ${this._loading ? n`<p class="status">lade…</p>` : this._items.length === 0 && !this._showForm ? this._renderEmpty() : n`<div class="grid">${this._items.map((e) => this._renderItem(e))}</div>`}
      </section>
    `;
  }
}, de.styles = [
  O,
  Pe,
  rt,
  _`
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
], de);
R([
  f({ attribute: !1 })
], z.prototype, "api", void 0);
R([
  d()
], z.prototype, "_items", void 0);
R([
  d()
], z.prototype, "_loading", void 0);
R([
  d()
], z.prototype, "_showForm", void 0);
R([
  d()
], z.prototype, "_editing", void 0);
R([
  d()
], z.prototype, "_toast", void 0);
R([
  d()
], z.prototype, "_menuOpenId", void 0);
R([
  d()
], z.prototype, "_activeTab", void 0);
z = R([
  w("settings-view")
], z);
var J = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const At = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
  debug: "Debug"
}, Et = {
  error: "var(--mh-error)",
  warning: "var(--mh-warning)",
  info: "var(--mh-info)",
  debug: "var(--mh-debug)"
}, Pt = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], Cs = [1, 2, 3, 4, 5, 6, 0];
var ce;
let H = (ce = class extends b {
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
        const [e, t, s] = await Promise.all([
          this.api.getStats(),
          this.api.listSources(),
          this.api.getStatsExtended(30)
        ]);
        this._stats = e, this._sources = t, this._heatmap = s.heatmap, this._topSources = s.top_sources;
      } finally {
        this._loading = !1;
      }
    }
  }
  _renderHeatmap() {
    const e = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    let t = 0;
    for (const s of this._heatmap)
      s.weekday >= 0 && s.weekday < 7 && s.hour >= 0 && s.hour < 24 && (e[s.weekday][s.hour] = s.count, s.count > t && (t = s.count));
    return t === 0 ? n`<p class="muted">Keine Daten in den letzten 30 Tagen.</p>` : n`
      <div class="heatmap-wrap">
        <div class="heatmap">
          <div class="heatmap-header">
            <span></span>
            ${Array.from({ length: 24 }, (s, a) => n`<span class="hour-label">${a % 3 === 0 ? a : ""}</span>`)}
          </div>
          ${Cs.map((s, a) => {
      const r = e[s];
      return n`
              <div class="heatmap-row">
                <span class="day-label">${Pt[a]}</span>
                ${r.map((o, l) => {
        const c = o === 0 ? 0 : Math.max(0.15, o / t), p = o === 0 ? "transparent" : `color-mix(in srgb, var(--mh-accent) ${Math.round(c * 100)}%, transparent)`;
        return n`
                    <div
                      class=${`heatmap-cell ${o === 0 ? "empty" : ""}`}
                      style=${`background: ${p}`}
                      title=${`${Pt[a]} ${l}:00 — ${o} Nachricht${o === 1 ? "" : "en"}`}
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
          <span class="muted small">mehr (max ${t})</span>
        </div>
      </div>
    `;
  }
  _renderSeverityStack() {
    if (!this._stats)
      return n``;
    const e = this._stats.severity_24h, t = Object.values(e).reduce((a, r) => a + r, 0), s = ["error", "warning", "info", "debug"];
    return t === 0 ? n`<p class="muted">Keine Nachrichten in den letzten 24 Stunden.</p>` : n`
      <div class="stack-bar" role="img" aria-label="Severity-Verteilung der letzten 24 Stunden">
        ${s.map((a) => {
      const r = e[a] ?? 0;
      if (r === 0)
        return null;
      const o = r / t * 100;
      return n`
            <div
              class=${`stack-seg sev-${a}`}
              style=${`width: ${o}%; background: ${Et[a]}`}
              title=${`${At[a]}: ${r} (${o.toFixed(0)}%)`}
            ></div>
          `;
    })}
      </div>
      <ul class="legend">
        ${s.map((a) => {
      const r = e[a] ?? 0, o = t > 0 ? r / t * 100 : 0;
      return n`
            <li>
              <span class="legend-dot" style=${`background: ${Et[a]}`}></span>
              <span class="legend-label">${At[a]}</span>
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
      return n`<div class="root"><p class="status">lade…</p></div>`;
    if (!this._stats)
      return n`<div class="root"><p class="status">Keine Daten verfügbar.</p></div>`;
    const e = this._stats, t = Object.values(e.severity_24h).reduce((o, l) => o + l, 0), s = e.severity_24h.error ?? 0, a = e.severity_24h.warning ?? 0, r = t > 0 ? s / t * 100 : 0;
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
              <span class="kpi-value">${e.total.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">Nachrichten in der Datenbank</span>
            </div>
            <div class="kpi accent-info">
              <span class="kpi-label">Letzte 24 h</span>
              <span class="kpi-value">${t.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">alle Severities</span>
            </div>
            <div class="kpi accent-error">
              <span class="kpi-label">Errors 24 h</span>
              <span class="kpi-value">${s}</span>
              <span class="kpi-hint">
                ${t === 0 ? "—" : `${r.toFixed(1)} % Anteil`}
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
              <span class="muted small">${t.toLocaleString("de-DE")} Nachrichten</span>
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
                  ${this._sources.map((o) => n`<li class="source-pill">${o}</li>`)}
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
                  ${this._topSources.map((o, l) => {
      var g;
      const c = ((g = this._topSources[0]) == null ? void 0 : g.count) ?? 1, p = o.count / c * 100;
      return n`<li>
                      <span class="rank">${l + 1}</span>
                      <code class="source-name">${o.source}</code>
                      <span class="bar-track">
                        <span class="bar-fill" style=${`width: ${p}%`}></span>
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
}, ce.styles = [
  O,
  rt,
  ze,
  _`
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
], ce);
J([
  f({ attribute: !1 })
], H.prototype, "api", void 0);
J([
  d()
], H.prototype, "_stats", void 0);
J([
  d()
], H.prototype, "_sources", void 0);
J([
  d()
], H.prototype, "_heatmap", void 0);
J([
  d()
], H.prototype, "_topSources", void 0);
J([
  d()
], H.prototype, "_loading", void 0);
H = J([
  w("stats-live-view")
], H);
var Be = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const Ce = [
  "var(--mh-error)",
  "var(--mh-warning)",
  "var(--mh-info)",
  "var(--mh-accent)",
  "var(--mh-success)"
];
var he;
let Ee = (he = class extends b {
  constructor() {
    super(...arguments), this.items = [], this.width = 600, this.height = 120;
  }
  render() {
    if (this.items.length === 0)
      return n`<p class="muted">Keine Timeline-Daten.</p>`;
    const e = this._buildSeries(), t = this._allBuckets(), s = Math.max(1, ...this.items.map((p) => p.count)), a = { top: 8, right: 8, bottom: 18, left: 32 }, r = this.width - a.left - a.right, o = this.height - a.top - a.bottom, l = (p) => a.left + p / Math.max(1, t.length - 1) * r, c = (p) => a.top + (1 - p / s) * o;
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
        <text x="2" y=${a.top + 4} class="axis-label">${s}</text>
        <text x="2" y=${this.height - a.bottom + 4} class="axis-label">0</text>

        <!-- Series -->
        ${e.map((p, g) => {
      const u = p.values.map((m, x) => `${l(x)},${c(m)}`).join(" "), v = Ce[g % Ce.length];
      return n`<polyline
            points=${u}
            class="series"
            fill="none"
            stroke=${v}
            stroke-width="1.5"
          ><title>${p.ga}</title></polyline>`;
    })}
      </svg>
      <div class="legend">
        ${e.map((p, g) => n`<span class="legend-item">
            <span
              class="dot"
              style=${`background: ${Ce[g % Ce.length]}`}
            ></span>
            <code>${p.ga}</code>
          </span>`)}
      </div>
    `;
  }
  _allBuckets() {
    const e = /* @__PURE__ */ new Set();
    for (const t of this.items)
      e.add(t.bucket);
    return Array.from(e).sort();
  }
  _buildSeries() {
    const e = this._allBuckets(), t = new Map(e.map((a, r) => [a, r])), s = /* @__PURE__ */ new Map();
    for (const a of this.items) {
      let r = s.get(a.ga);
      r === void 0 && (r = new Array(e.length).fill(0), s.set(a.ga, r));
      const o = t.get(a.bucket);
      o !== void 0 && (r[o] = a.count);
    }
    return Array.from(s.entries()).map(([a, r]) => ({ ga: a, values: r }));
  }
}, he.styles = [
  O,
  _`
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
], he);
Be([
  f({ attribute: !1 })
], Ee.prototype, "items", void 0);
Be([
  f({ type: Number })
], Ee.prototype, "width", void 0);
Be([
  f({ type: Number })
], Ee.prototype, "height", void 0);
Ee = Be([
  w("knx-timeline-chart")
], Ee);
var A = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const Gt = "messagehub.knx-stats.filters", Ze = [
  { id: "1h", label: "1 Std", days: 1 / 24 },
  { id: "6h", label: "6 Std", days: 0.25 },
  { id: "24h", label: "24 Std", days: 1 },
  { id: "48h", label: "48 Std", days: 2 }
], Ls = [10, 25, 50, 100], zt = {
  periodId: "24h",
  topN: 50,
  minRate: 1,
  includeAck: !0
};
function Rs() {
  try {
    const i = localStorage.getItem(Gt);
    if (i) {
      const e = JSON.parse(i);
      return { ...zt, ...e };
    }
  } catch {
  }
  return { ...zt };
}
function Le(i) {
  try {
    localStorage.setItem(Gt, JSON.stringify(i));
  } catch {
  }
}
function Ms(i) {
  const e = Ze.find((a) => a.id === i) ?? Ze[2], t = /* @__PURE__ */ new Date();
  return { from: new Date(t.getTime() - e.days * 864e5).toISOString(), to: t.toISOString() };
}
var pe;
let k = (pe = class extends b {
  constructor() {
    super(...arguments), this._filters = Rs(), this._summary = null, this._busHealth = null, this._silence = null, this._orphans = null, this._alarms = null, this._top = [], this._timeline = null, this._selectedGa = null, this._detail = null, this._detailLoading = !1, this._loading = !1, this._error = "", this._toast = "";
  }
  async firstUpdated() {
    await this._load();
  }
  _apiFilters() {
    const { from: e, to: t } = Ms(this._filters.periodId);
    return {
      from: e,
      to: t,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck
    };
  }
  async _load() {
    if (this.api) {
      this._loading = !0, this._error = "";
      try {
        const e = this._apiFilters(), [t, s, a, r, o, l] = await Promise.all([
          this.api.getKnxStatsSummary(e),
          this.api.getKnxStatsTop(e),
          this.api.getKnxStatsBusHealth(e),
          this.api.getKnxStatsSilence({
            ...e,
            maxSilenceMinutes: this._suggestSilenceMinutes()
          }),
          this.api.getKnxStatsOrphans(e).catch(() => null),
          this.api.getKnxStatsAlarms(e).catch(() => null)
        ]);
        this._summary = t, this._top = s.items, this._busHealth = a, this._silence = r, this._orphans = o, this._alarms = l;
        const c = s.items.slice(0, 5).map((p) => p.ga);
        c.length > 0 ? this._timeline = await this.api.getKnxStatsTimeline({
          ...e,
          gas: c,
          bucketMinutes: this._suggestBucketMinutes()
        }) : this._timeline = null;
      } catch (e) {
        this._error = e.message, this._summary = null, this._top = [], this._timeline = null, this._busHealth = null, this._silence = null, this._orphans = null, this._alarms = null;
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
  async _loadDetail(e) {
    if (this.api) {
      this._detailLoading = !0, this._detail = null;
      try {
        const t = this._apiFilters();
        this._detail = await this.api.getKnxStatsGaDetail(e, t);
      } catch (t) {
        this._showToast(`Detail laden fehlgeschlagen: ${t.message}`);
      } finally {
        this._detailLoading = !1;
      }
    }
  }
  async _onSelectGa(e) {
    if (this._selectedGa === e) {
      this._selectedGa = null, this._detail = null;
      return;
    }
    this._selectedGa = e, await this._loadDetail(e);
  }
  async _ackGa(e) {
    if (!this.api)
      return;
    const t = window.prompt(`Notiz fuer ${e} (optional, leer = keine Notiz):`, "");
    if (t !== null)
      try {
        await this.api.acknowledgeKnxGa(e, { note: t || void 0 }), this._showToast(`${e} als bekannt markiert`), await this._load();
      } catch (s) {
        this._showToast(`Fehlgeschlagen: ${s.message}`);
      }
  }
  async _unackGa(e) {
    if (this.api)
      try {
        await this.api.unacknowledgeKnxGa(e), this._showToast(`${e}: Acknowledge entfernt`), await this._load();
      } catch (t) {
        this._showToast(`Fehlgeschlagen: ${t.message}`);
      }
  }
  _showToast(e) {
    this._toast = e, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  _onPeriod(e) {
    this._filters = { ...this._filters, periodId: e }, Le(this._filters), this._load();
  }
  _onTopN(e) {
    this._filters = { ...this._filters, topN: e }, Le(this._filters), this._load();
  }
  _onMinRate(e) {
    this._filters = { ...this._filters, minRate: Math.max(0, e) }, Le(this._filters), this._load();
  }
  _onAckToggle() {
    this._filters = { ...this._filters, includeAck: !this._filters.includeAck }, Le(this._filters), this._load();
  }
  _renderFilterBar() {
    return n`
      <div class="filters" role="toolbar" aria-label="KNX-Stats-Filter">
        <div class="filter-group">
          <span class="filter-label">Zeitraum</span>
          <div class="seg">
            ${Ze.map((e) => n`<button
                class=${`seg-btn ${this._filters.periodId === e.id ? "active" : ""}`}
                @click=${() => this._onPeriod(e.id)}
              >
                ${e.label}
              </button>`)}
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-label">Top-N</span>
          <div class="seg">
            ${Ls.map((e) => n`<button
                class=${`seg-btn ${this._filters.topN === e ? "active" : ""}`}
                @click=${() => this._onTopN(e)}
              >
                ${e}
              </button>`)}
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
            @change=${(e) => this._onMinRate(parseFloat(e.target.value) || 0)}
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
    const e = this._summary;
    if (e === null)
      return n`<p class="muted">Keine Daten verfuegbar.</p>`;
    const t = e.counts_by_severity, s = e.estimated_busload_pct >= 30 ? "danger" : e.estimated_busload_pct >= 20 ? "warning" : e.estimated_busload_pct >= 10 ? "elevated" : "ok";
    return n`
      <div class="kpis">
        <div class="kpi">
          <span class="kpi-label">Telegramme</span>
          <span class="kpi-value">${e.total_telegrams.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">im Zeitraum</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Aktive GAs</span>
          <span class="kpi-value">${e.active_gas.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">im Protokoll</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Aktive Geraete</span>
          <span class="kpi-value">${e.active_devices.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">Source-Adressen</span>
        </div>
        <div class=${`kpi busload busload--${s}`}>
          <span class="kpi-label">Geschaetzte Buslast</span>
          <span class="kpi-value">${e.estimated_busload_pct.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</span>
          <span class="kpi-hint">Ø ueber Zeitraum</span>
        </div>
      </div>
      <div class="severity-counts">
        ${["red", "orange", "yellow", "green"].map((a) => n`<span class=${`mh-pill mh-pill--${a === "red" ? "error" : a === "orange" ? "warning" : a === "yellow" ? "info" : "neutral"}`}>
            <span class="mh-pill__dot"></span>
            ${this._severityLabel(a)}: ${t[a] ?? 0}
          </span>`)}
      </div>
    `;
  }
  _severityLabel(e) {
    switch (e) {
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
        ${this._error ? n`<div class="error">${this._error}</div>` : h}
        ${this._alarms !== null && this._alarms.triggered_count > 0 ? this._renderAlarmBanner() : h}

        <section class="mh-card kpi-card">
          <header class="card-head">
            <h3>Uebersicht</h3>
            <span class="muted small">letzte ${this._filters.periodId}</span>
          </header>
          ${this._loading && this._summary === null ? n`<p class="muted">lade…</p>` : this._renderKpis()}
        </section>

        ${this._busHealth !== null && this._busHealth.summary.total > 0 ? this._renderBusHealth() : h}
        ${this._silence !== null && this._silence.alarm_count > 0 ? this._renderSilenceAlarms() : h}
        ${this._orphans !== null && (this._orphans.missing_in_log.length > 0 || this._orphans.extra_in_log.length > 0) ? this._renderOrphans() : h}

        <section class="mh-card">
          <header class="card-head">
            <h3>Top-Sender</h3>
            <span class="muted small">${this._top.length} sichtbar</span>
          </header>
          ${this._renderTopTable()}
        </section>

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

        ${this._detail !== null || this._detailLoading ? this._renderDetailPane() : h}
        ${this._toast ? n`<div class="toast">${this._toast}</div>` : h}
      </div>
    `;
  }
  _renderTopTable() {
    return this._loading && this._top.length === 0 ? n`<p class="muted">lade…</p>` : this._top.length === 0 ? n`<p class="muted">Keine Telegramme in diesem Zeitraum.</p>` : n`
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
            ${this._top.map((e, t) => n`<tr
                class=${`row-${e.severity} ${e.acknowledged ? "ack" : ""} ${this._selectedGa === e.ga ? "selected" : ""}`}
                @click=${() => void this._onSelectGa(e.ga)}
              >
                <td class="num muted">${t + 1}</td>
                <td><code class="ga">${e.ga}</code></td>
                <td class="label-cell" title=${e.label ?? ""}>
                  ${e.label ?? n`<span class="muted">—</span>`}
                </td>
                <td>
                  ${e.dpt ? n`<code class="dpt">${e.dpt}</code>` : n`<span class="muted">—</span>`}
                </td>
                <td class="num strong">${e.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td class="num muted">${e.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td>
                  <span class=${`mh-pill ${this._severityPillClass(e.severity)}`}>
                    <span class="mh-pill__dot"></span>
                    ${this._severityLabel(e.severity)}
                  </span>
                  ${e.acknowledged ? n`<span class="ack-pill" title="acknowledged">✓ bekannt</span>` : h}
                </td>
                <td class="actions">
                  ${e.acknowledged ? n`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(s) => {
      s.stopPropagation(), this._unackGa(e.ga);
    }}
                      >
                        ✗ Ack entfernen
                      </button>` : n`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(s) => {
      s.stopPropagation(), this._ackGa(e.ga);
    }}
                      >
                        ✓ Bekannt
                      </button>`}
                </td>
              </tr>`)}
          </tbody>
        </table>
      </div>
    `;
  }
  _renderDetailPane() {
    if (this._detailLoading && this._detail === null)
      return n`<section class="mh-card detail-pane">
        <p class="muted">lade Details…</p>
      </section>`;
    if (this._detail === null)
      return n``;
    const e = this._detail, t = e.recommendation;
    return n`
      <section class="mh-card detail-pane">
        <header class="card-head">
          <h3>${e.ga} — ${e.label ?? "Detail"}</h3>
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
            <strong>${e.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Tel/Min</strong>
          </div>
          <div class="detail-stat">
            <span class="muted small">Soll-Rate</span>
            <strong>${e.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Tel/Min</strong>
          </div>
          <div class="detail-stat">
            <span class="muted small">Verhaeltnis</span>
            <strong>${isFinite(t.ratio) ? t.ratio.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "x" : "∞"}</strong>
          </div>
          ${t.estimated_reduction_pct !== null ? n`<div class="detail-stat">
                <span class="muted small">Geschaetzte Reduktion</span>
                <strong>−${t.estimated_reduction_pct.toLocaleString("de-DE", { maximumFractionDigits: 0 })} %</strong>
              </div>` : h}
        </div>

        <div class=${`recommendation rec-${t.severity}`}>
          <strong>Empfehlung:</strong>
          <p>${t.text}</p>
        </div>

        ${e.findings.length > 0 ? n`<div class="findings">
              <strong>Erkannte Muster:</strong>
              <ul>
                ${e.findings.map((s) => n`<li class=${`finding-${s.severity}`}>
                    <span class=${`mh-pill ${this._severityPillClass(s.severity)}`}>
                      ${s.kind}
                    </span>
                    <span>${s.text}</span>
                  </li>`)}
              </ul>
            </div>` : h}
      </section>
    `;
  }
  _renderAlarmBanner() {
    const t = this._alarms.alarms.filter((s) => s.triggered);
    return n`
      <section class="alarm-banner">
        <strong>⚠ ${t.length} Alarm(e) aktiv</strong>
        <ul>
          ${t.map((s) => n`<li>
              <span class="alarm-rule">${s.rule}</span>
              <span class="alarm-msg">${s.message}</span>
            </li>`)}
        </ul>
      </section>
    `;
  }
  _renderOrphans() {
    const e = this._orphans;
    return n`
      <section class="mh-card">
        <header class="card-head">
          <h3>Verwaiste GAs (Projekt vs Realitaet)</h3>
          <span class="muted small">
            Projekt: ${e.project_total} • geloggt: ${e.log_total}
          </span>
        </header>
        <div class="orphans-grid">
          ${e.missing_in_log.length > 0 ? n`<div>
                <strong>Im Projekt, nie gesehen (${e.missing_in_log.length})</strong>
                <ul class="orphans-list muted-list">
                  ${e.missing_in_log.slice(0, 15).map((t) => n`<li>
                      <code>${t.address}</code>
                      <span>${t.name || "—"}</span>
                      ${t.dpt ? n`<code class="dpt">${t.dpt}</code>` : h}
                    </li>`)}
                </ul>
                ${e.missing_in_log.length > 15 ? n`<p class="muted small">
                      … und ${e.missing_in_log.length - 15} weitere
                    </p>` : h}
              </div>` : h}
          ${e.extra_in_log.length > 0 ? n`<div>
                <strong>Geloggt, nicht im Projekt (${e.extra_in_log.length})</strong>
                <ul class="orphans-list extra-list">
                  ${e.extra_in_log.slice(0, 15).map((t) => n`<li>
                      <code>${t.address}</code>
                      <span>${t.label ?? "—"}</span>
                      <span class="muted num">${t.count}</span>
                    </li>`)}
                </ul>
                ${e.extra_in_log.length > 15 ? n`<p class="muted small">
                      … und ${e.extra_in_log.length - 15} weitere
                    </p>` : h}
              </div>` : h}
        </div>
      </section>
    `;
  }
  _renderSilenceAlarms() {
    const e = this._silence, t = e.items.filter((s) => s.alarm);
    return t.length === 0 ? n`` : n`
      <section class="mh-card silence-card">
        <header class="card-head">
          <h3>Stille-Alarme (${e.alarm_count})</h3>
          <span class="muted small">
            Schwelle: &gt; ${e.max_silence_minutes} Min ohne Telegramm
          </span>
        </header>
        <ul class="silence-list">
          ${t.slice(0, 10).map((s) => n`<li>
              <code>${s.dev_source}</code>
              <span class="muted">
                seit ${this._formatSilence(s.silent_minutes)} stumm
              </span>
              <span class="muted small">last_seen ${this._formatTs(s.last_seen)}</span>
            </li>`)}
        </ul>
        ${e.alarm_count > 10 ? n`<p class="muted small">
              … und ${e.alarm_count - 10} weitere
            </p>` : h}
      </section>
    `;
  }
  _formatSilence(e) {
    return e >= 1440 ? `${Math.floor(e / 1440)} Tagen` : e >= 60 ? `${Math.floor(e / 60)} Std` : `${Math.round(e)} Min`;
  }
  _formatTs(e) {
    try {
      return new Date(e).toLocaleString("de-DE");
    } catch {
      return e;
    }
  }
  _renderBusHealth() {
    const e = this._busHealth, t = e.summary.ratio_pct, s = t >= 1 ? "danger" : t >= 0.5 ? "warning" : t > 0 ? "elevated" : "ok";
    return n`
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
            <span class="kpi-value">${t.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} %</span>
            <span class="kpi-hint">
              ${e.summary.repeated.toLocaleString("de-DE")} von
              ${e.summary.total.toLocaleString("de-DE")} Telegrammen
            </span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Schwelle gesund</span>
            <span class="kpi-value">&lt; 0,5 %</span>
            <span class="kpi-hint">Empfehlung KNX-Praxis</span>
          </div>
        </div>
        ${e.per_ga.length > 0 ? n`<div class="bus-health-list">
              <strong>Top-GAs mit Wiederholungen:</strong>
              <ul>
                ${e.per_ga.slice(0, 5).map((a) => n`<li>
                    <code>${a.ga}</code>
                    <span class="muted">${a.label ?? "—"}</span>
                    <span class="num">${a.repeated} / ${a.total}</span>
                    <span class="num">${a.ratio_pct.toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} %</span>
                  </li>`)}
              </ul>
            </div>` : h}
      </section>
    `;
  }
  _severityPillClass(e) {
    switch (e) {
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
}, pe.styles = [
  O,
  rt,
  ze,
  Pe,
  _`
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
], pe);
A([
  f({ attribute: !1 })
], k.prototype, "api", void 0);
A([
  d()
], k.prototype, "_filters", void 0);
A([
  d()
], k.prototype, "_summary", void 0);
A([
  d()
], k.prototype, "_busHealth", void 0);
A([
  d()
], k.prototype, "_silence", void 0);
A([
  d()
], k.prototype, "_orphans", void 0);
A([
  d()
], k.prototype, "_alarms", void 0);
A([
  d()
], k.prototype, "_top", void 0);
A([
  d()
], k.prototype, "_timeline", void 0);
A([
  d()
], k.prototype, "_selectedGa", void 0);
A([
  d()
], k.prototype, "_detail", void 0);
A([
  d()
], k.prototype, "_detailLoading", void 0);
A([
  d()
], k.prototype, "_loading", void 0);
A([
  d()
], k.prototype, "_error", void 0);
A([
  d()
], k.prototype, "_toast", void 0);
k = A([
  w("stats-knx-view")
], k);
var nt = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
const Ot = "messagehub.stats.subtab", js = /* @__PURE__ */ new Set(["live", "knx"]);
var ue;
let Ie = (ue = class extends b {
  constructor() {
    super(...arguments), this._tab = this._loadTab();
  }
  _loadTab() {
    try {
      const e = localStorage.getItem(Ot);
      if (e && js.has(e))
        return e;
    } catch {
    }
    return "live";
  }
  _setTab(e) {
    this._tab = e;
    try {
      localStorage.setItem(Ot, e);
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
    ].map((t) => n`<button
              role="tab"
              aria-selected=${this._tab === t.id}
              class=${`subtab ${this._tab === t.id ? "active" : ""}`}
              @click=${() => this._setTab(t.id)}
            >
              ${t.label}
            </button>`)}
        </nav>
        <div class="body">
          ${this._tab === "live" ? n`<stats-live-view .api=${this.api}></stats-live-view>` : h}
          ${this._tab === "knx" ? n`<stats-knx-view .api=${this.api}></stats-knx-view>` : h}
        </div>
      </div>
    `;
  }
}, ue.styles = [
  O,
  _`
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
], ue);
nt([
  f({ attribute: !1 })
], Ie.prototype, "api", void 0);
nt([
  d()
], Ie.prototype, "_tab", void 0);
Ie = nt([
  w("stats-view")
], Ie);
var Y = function(i, e, t, s) {
  var a = arguments.length, r = a < 3 ? e : s === null ? s = Object.getOwnPropertyDescriptor(e, t) : s, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(i, e, t, s);
  else for (var l = i.length - 1; l >= 0; l--) (o = i[l]) && (r = (a < 3 ? o(r) : a > 3 ? o(e, t, r) : o(e, t)) || r);
  return a > 3 && r && Object.defineProperty(e, t, r), r;
};
function Ns(i) {
  const e = i.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), t = new Set(e), s = (...a) => a.some((r) => t.has(r));
  return s("delete", "remove", "removed", "deleted") ? "delete" : s("upsert", "create", "created", "add", "added", "import", "imported") ? "create" : s("update", "updated", "edit", "edited", "set") ? "update" : s("status", "ack", "acknowledge", "toggle", "enable", "enabled", "disable", "disabled") ? "status" : "other";
}
var me;
let I = (me = class extends b {
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
        const e = await this.api.listAudit(200);
        this._items = e;
      } finally {
        this._loading = !1;
      }
    }
  }
  _toggle(e) {
    const t = new Set(this._expanded);
    t.has(e) ? t.delete(e) : t.add(e), this._expanded = t;
  }
  _filtered() {
    const e = this._filter.trim().toLowerCase();
    return e ? this._items.filter((t) => {
      const s = `${t.target_type ?? ""}${t.target_id ?? ""}`.toLowerCase(), a = t.details ? JSON.stringify(t.details).toLowerCase() : "";
      return (t.actor ?? "").toLowerCase().includes(e) || (t.action ?? "").toLowerCase().includes(e) || s.includes(e) || a.includes(e);
    }) : this._items;
  }
  _renderActionPill(e) {
    const t = Ns(e);
    return n`<span class=${`action-pill action-${t}`} title=${e}>${e}</span>`;
  }
  _renderDetails(e) {
    if (!e)
      return n`<span class="muted">—</span>`;
    if (typeof e == "object") {
      const t = Object.entries(e);
      return t.length === 0 ? n`<span class="muted">—</span>` : n`
        <dl class="kv">
          ${t.map(([s, a]) => n`
              <dt>${s}</dt>
              <dd>${typeof a == "object" ? JSON.stringify(a) : String(a)}</dd>
            `)}
        </dl>
      `;
    }
    return n`<code>${String(e)}</code>`;
  }
  _renderDetailsSummary(e) {
    if (!e || typeof e != "object")
      return n`<span class="muted">—</span>`;
    const t = e, s = typeof t.label == "string" ? t.label : typeof t.name == "string" ? t.name : null;
    if (s)
      return n`<span class="summary">${s}</span>`;
    const a = Object.keys(t).slice(0, 3).join(", ");
    return n`<span class="summary muted">{${a}${Object.keys(t).length > 3 ? ", …" : ""}}</span>`;
  }
  render() {
    const e = this._filtered();
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
          <button class="mh-btn" @click=${() => void this._load()}>↻ Aktualisieren</button>
        </header>

        <div class="filter-bar">
          <input
            type="search"
            class="mh-input"
            placeholder="Suche in Akteur, Aktion, Ziel oder Details…"
            .value=${this._filter}
            @input=${(t) => this._filter = t.target.value}
          />
          <span class="muted small"
            >${e.length} ${e.length === 1 ? "Eintrag" : "Einträge"}</span
          >
        </div>

        ${this._loading ? n`<p class="status">lade…</p>` : e.length === 0 ? n`<div class="empty">
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
                  ${e.map((t, s) => {
      const a = this._expanded.has(s), r = String(t.timestamp);
      return n`
                      <div class=${`table-row ${a ? "expanded" : ""}`}>
                        <button
                          class="row-toggle"
                          @click=${() => this._toggle(s)}
                          aria-expanded=${a}
                          aria-label=${a ? "Details verbergen" : "Details anzeigen"}
                        >
                          <span class="ts" title=${Ut(r, this._now)}>
                            ${It(r, this._now)}
                          </span>
                          <span class="actor">${t.actor}</span>
                          <span>${this._renderActionPill(t.action)}</span>
                          <span class="target">
                            <code class="target-type">${t.target_type}</code>
                            ${t.target_id !== null && t.target_id !== void 0 ? n`<code class="target-id">#${t.target_id}</code>` : h}
                          </span>
                          <span class="details-inline">
                            ${this._renderDetailsSummary(t.details)}
                            <span class="chevron" aria-hidden="true">${a ? "▾" : "▸"}</span>
                          </span>
                        </button>
                        ${a ? n`<div class="details-panel">
                              ${this._renderDetails(t.details)}
                            </div>` : h}
                      </div>
                    `;
    })}
                </div>
              `}
      </div>
    `;
  }
}, me.styles = [
  O,
  Pe,
  Ht,
  ze,
  _`
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
], me);
Y([
  f({ attribute: !1 })
], I.prototype, "api", void 0);
Y([
  d()
], I.prototype, "_items", void 0);
Y([
  d()
], I.prototype, "_loading", void 0);
Y([
  d()
], I.prototype, "_filter", void 0);
Y([
  d()
], I.prototype, "_expanded", void 0);
Y([
  d()
], I.prototype, "_now", void 0);
I = Y([
  w("audit-view")
], I);
var Hs = Object.defineProperty, Is = Object.getOwnPropertyDescriptor, E = (i, e, t, s) => {
  for (var a = s > 1 ? void 0 : s ? Is(e, t) : e, r = i.length - 1, o; r >= 0; r--)
    (o = i[r]) && (a = (s ? o(e, t, a) : o(a)) || a);
  return s && a && Hs(e, t, a), a;
};
const Dt = "messagehub.filters", Re = {
  severity: ["error", "warning", "info"],
  source: "",
  search: ""
};
let S = class extends b {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "messages", this._items = [], this._total = 0, this._loading = !1, this._selected = null, this._filters = this._loadFilters(), this._newCount = 0, this._testing = !1, this._toast = "", this._overflowOpen = !1, this._api = new ms(), this._onSeverityChange = (i) => {
      this._filters = { ...this._filters, severity: i.detail.severities }, this._persistFilters(), this._reload();
    }, this._onSourceChange = (i) => {
      this._filters = { ...this._filters, source: i.detail.source }, this._persistFilters(), this._reload();
    }, this._onTimeRange = (i) => {
      this._filters = { ...this._filters, fromIso: i.detail.fromIso, toIso: i.detail.toIso }, this._persistFilters(), this._reload();
    }, this._onSelect = (i) => {
      this._selected = i.detail.msg;
    }, this._onSeverityChangeMessage = async (i) => {
      var a, r;
      const { id: e, severity: t, previous: s } = i.detail;
      this._items = this._items.map(
        (o) => o.id === e ? { ...o, severity: t } : o
      ), ((a = this._selected) == null ? void 0 : a.id) === e && (this._selected = { ...this._selected, severity: t });
      try {
        await this._api.setMessageSeverity(e, t), this._showToast(`Severity geändert: ${s} → ${t}`);
      } catch (o) {
        this._items = this._items.map(
          (l) => l.id === e ? { ...l, severity: s } : l
        ), ((r = this._selected) == null ? void 0 : r.id) === e && (this._selected = {
          ...this._selected,
          severity: s
        }), this._showToast(`Änderung fehlgeschlagen: ${o.message}`);
      }
    }, this._onDelete = async (i) => {
      try {
        await this._api.deleteMessage(i.detail.id), this._items = this._items.filter((e) => e.id !== i.detail.id), this._total = Math.max(0, this._total - 1), this._selected = null, this._showToast("Nachricht gelöscht");
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
    var i;
    (i = this.hass) != null && i.auth && this._api.setAuth(this.hass.auth.data.access_token), this._reload(), this._subscribeLive();
  }
  disconnectedCallback() {
    var i;
    super.disconnectedCallback(), (i = this._unsubLive) == null || i.call(this);
  }
  async _subscribeLive() {
    var i, e;
    (e = (i = this.hass) == null ? void 0 : i.connection) != null && e.subscribeEvents && (this._unsubLive = await this.hass.connection.subscribeEvents((t) => {
      const s = t.data;
      this._matchesFilters(s) && (this._items = [s, ...this._items].slice(0, 200), this._total += 1, this._newCount += 1, window.setTimeout(() => this._newCount = Math.max(0, this._newCount - 1), 4e3));
    }, "messagehub_message_added"));
  }
  _matchesFilters(i) {
    return !(this._filters.severity.length && !this._filters.severity.includes(i.severity) || this._filters.source && i.source !== this._filters.source || this._filters.search && !i.text.toLowerCase().includes(this._filters.search.toLowerCase()));
  }
  _loadFilters() {
    try {
      const i = localStorage.getItem(Dt);
      if (i) return { ...Re, ...JSON.parse(i) };
    } catch {
    }
    return { ...Re };
  }
  _persistFilters() {
    try {
      localStorage.setItem(Dt, JSON.stringify(this._filters));
    } catch {
    }
  }
  _resetFilters() {
    this._filters = { ...Re }, this._persistFilters(), this._reload();
  }
  async _reload() {
    this._loading = !0;
    try {
      const i = await this._api.listMessages({
        severity: this._filters.severity,
        source: this._filters.source || void 0,
        search: this._filters.search || void 0,
        from: this._filters.fromIso,
        to: this._filters.toIso,
        limit: 100
      });
      this._items = i.items, this._total = i.total;
    } catch (i) {
      this._showToast(`Laden fehlgeschlagen: ${i.message}`);
    } finally {
      this._loading = !1;
    }
  }
  async _bulkDelete(i) {
    if (this._total === 0) return;
    const e = this._total, t = i === "all" ? `ALLE ${e} Nachrichten dauerhaft löschen?` : `Bis zu ${e} gefilterte Nachrichten dauerhaft löschen?`;
    if (window.confirm(t))
      try {
        const s = i === "all" ? {} : {
          severity: this._filters.severity,
          source: this._filters.source || void 0,
          search: this._filters.search || void 0,
          from: this._filters.fromIso,
          to: this._filters.toIso
        }, a = await this._api.deleteMessages(s);
        this._showToast(`${a} Nachrichten gelöscht`), this._selected = null, await this._reload();
      } catch (s) {
        this._showToast(`Löschen fehlgeschlagen: ${s.message}`);
      }
  }
  async _sendTestMessage() {
    var i;
    if (!((i = this.hass) != null && i.callService)) {
      this._showToast("Test nicht verfügbar — hass.callService fehlt");
      return;
    }
    this._testing = !0;
    try {
      const e = ["info", "warning", "error", "info", "info"], t = ["pihole", "knx-bus", "backup-job", "test-script"], s = [
        "Demo-Nachricht aus dem Panel",
        "Test: DNS-Query erfolgreich",
        "Backup abgeschlossen, Dauer 12 min",
        "KNX 1/2/3 — Wohnzimmer Deckenlicht ein"
      ], a = (r) => Math.floor(Math.random() * r);
      await this.hass.callService("messagehub", "add_message", {
        severity: e[a(e.length)],
        source: t[a(t.length)],
        text: s[a(s.length)],
        metadata: { source_panel: !0, ts: (/* @__PURE__ */ new Date()).toISOString() }
      }), this._showToast("Test-Nachricht gesendet"), window.setTimeout(() => void this._reload(), 300);
    } catch (e) {
      this._showToast(`Service-Call fehlgeschlagen: ${e.message}`);
    } finally {
      this._testing = !1;
    }
  }
  _showToast(i) {
    this._toast = i, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  _debounceSearch(i) {
    this._debounceTimer && window.clearTimeout(this._debounceTimer), this._debounceTimer = window.setTimeout(() => {
      this._filters = { ...this._filters, search: i }, this._persistFilters(), this._reload();
    }, 300);
  }
  _hasActiveFilters() {
    return this._filters.severity.length !== Re.severity.length || this._filters.source !== "" || this._filters.search !== "" || this._filters.fromIso !== void 0;
  }
  _exportUrl(i) {
    return this._api.exportUrl({
      severity: this._filters.severity,
      source: this._filters.source || void 0,
      search: this._filters.search || void 0,
      from: this._filters.fromIso,
      to: this._filters.toIso,
      limit: 1e4,
      format: i
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
          @input=${(i) => {
      const e = i.target.value;
      this._debounceSearch(e);
    }}
        />
        <time-range-filter
          .fromIso=${this._filters.fromIso}
          .toIso=${this._filters.toIso}
          @change=${this._onTimeRange}
        ></time-range-filter>
        ${this._hasActiveFilters() ? n`<button class="filter-reset" @click=${this._resetFilters}>
              Filter zurücksetzen
            </button>` : null}
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
          <div class="overflow" @click=${(i) => i.stopPropagation()}>
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
            @error=${(i) => this._showToast(i.detail.message)}
          ></detail-pane>` : null}
    `;
  }
  render() {
    const i = [
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
            ${i.map(
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
S.styles = [
  O,
  Pe,
  _`
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
], S.prototype, "hass", 2);
E([
  f({ type: Boolean })
], S.prototype, "narrow", 2);
E([
  f({ attribute: !1 })
], S.prototype, "panel", 2);
E([
  d()
], S.prototype, "_tab", 2);
E([
  d()
], S.prototype, "_items", 2);
E([
  d()
], S.prototype, "_total", 2);
E([
  d()
], S.prototype, "_loading", 2);
E([
  d()
], S.prototype, "_selected", 2);
E([
  d()
], S.prototype, "_filters", 2);
E([
  d()
], S.prototype, "_newCount", 2);
E([
  d()
], S.prototype, "_testing", 2);
E([
  d()
], S.prototype, "_toast", 2);
E([
  d()
], S.prototype, "_overflowOpen", 2);
S = E([
  w("messagehub-panel")
], S);
export {
  S as MessageHubPanel
};
