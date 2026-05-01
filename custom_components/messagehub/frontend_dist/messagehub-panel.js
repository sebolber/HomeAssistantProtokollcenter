/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const de = globalThis, Se = de.ShadowRoot && (de.ShadyCSS === void 0 || de.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Te = Symbol(), Oe = /* @__PURE__ */ new WeakMap();
let Ge = class {
  constructor(e, t, a) {
    if (this._$cssResult$ = !0, a !== Te) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Se && e === void 0) {
      const a = t !== void 0 && t.length === 1;
      a && (e = Oe.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), a && Oe.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const st = (r) => new Ge(typeof r == "string" ? r : r + "", void 0, Te), k = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce((a, s, i) => a + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + r[i + 1], r[0]);
  return new Ge(t, r, Te);
}, at = (r, e) => {
  if (Se) r.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const a = document.createElement("style"), s = de.litNonce;
    s !== void 0 && a.setAttribute("nonce", s), a.textContent = t.cssText, r.appendChild(a);
  }
}, Ne = Se ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const a of e.cssRules) t += a.cssText;
  return st(t);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: it, defineProperty: ot, getOwnPropertyDescriptor: nt, getOwnPropertyNames: lt, getOwnPropertySymbols: dt, getPrototypeOf: ct } = Object, H = globalThis, Ue = H.trustedTypes, ht = Ue ? Ue.emptyScript : "", ve = H.reactiveElementPolyfillSupport, te = (r, e) => r, ce = { toAttribute(r, e) {
  switch (e) {
    case Boolean:
      r = r ? ht : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, e) {
  let t = r;
  switch (e) {
    case Boolean:
      t = r !== null;
      break;
    case Number:
      t = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(r);
      } catch {
        t = null;
      }
  }
  return t;
} }, Ae = (r, e) => !it(r, e), He = { attribute: !0, type: String, converter: ce, reflect: !1, useDefault: !1, hasChanged: Ae };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), H.litPropertyMetadata ?? (H.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let J = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = He) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const a = Symbol(), s = this.getPropertyDescriptor(e, a, t);
      s !== void 0 && ot(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, a) {
    const { get: s, set: i } = nt(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: s, set(o) {
      const c = s == null ? void 0 : s.call(this);
      i == null || i.call(this, o), this.requestUpdate(e, c, a);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? He;
  }
  static _$Ei() {
    if (this.hasOwnProperty(te("elementProperties"))) return;
    const e = ct(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(te("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(te("properties"))) {
      const t = this.properties, a = [...lt(t), ...dt(t)];
      for (const s of a) this.createProperty(s, t[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [a, s] of t) this.elementProperties.set(a, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, a] of this.elementProperties) {
      const s = this._$Eu(t, a);
      s !== void 0 && this._$Eh.set(s, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const a = new Set(e.flat(1 / 0).reverse());
      for (const s of a) t.unshift(Ne(s));
    } else e !== void 0 && t.push(Ne(e));
    return t;
  }
  static _$Eu(e, t) {
    const a = t.attribute;
    return a === !1 ? void 0 : typeof a == "string" ? a : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const a of t.keys()) this.hasOwnProperty(a) && (e.set(a, this[a]), delete this[a]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return at(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var a;
      return (a = t.hostConnected) == null ? void 0 : a.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var a;
      return (a = t.hostDisconnected) == null ? void 0 : a.call(t);
    });
  }
  attributeChangedCallback(e, t, a) {
    this._$AK(e, a);
  }
  _$ET(e, t) {
    var i;
    const a = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, a);
    if (s !== void 0 && a.reflect === !0) {
      const o = (((i = a.converter) == null ? void 0 : i.toAttribute) !== void 0 ? a.converter : ce).toAttribute(t, a.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var i, o;
    const a = this.constructor, s = a._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const c = a.getPropertyOptions(s), l = typeof c.converter == "function" ? { fromAttribute: c.converter } : ((i = c.converter) == null ? void 0 : i.fromAttribute) !== void 0 ? c.converter : ce;
      this._$Em = s;
      const p = l.fromAttribute(t, c.type);
      this[s] = p ?? ((o = this._$Ej) == null ? void 0 : o.get(s)) ?? p, this._$Em = null;
    }
  }
  requestUpdate(e, t, a, s = !1, i) {
    var o;
    if (e !== void 0) {
      const c = this.constructor;
      if (s === !1 && (i = this[e]), a ?? (a = c.getPropertyOptions(e)), !((a.hasChanged ?? Ae)(i, t) || a.useDefault && a.reflect && i === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(c._$Eu(e, a)))) return;
      this.C(e, t, a);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: a, reflect: s, wrapped: i }, o) {
    a && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), i !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || a || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
    var a;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [i, o] of this._$Ep) this[i] = o;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [i, o] of s) {
        const { wrapped: c } = o, l = this[i];
        c !== !0 || this._$AL.has(i) || l === void 0 || this.C(i, void 0, o, l);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (a = this._$EO) == null || a.forEach((s) => {
        var i;
        return (i = s.hostUpdate) == null ? void 0 : i.call(s);
      }), this.update(t)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((a) => {
      var s;
      return (s = a.hostUpdated) == null ? void 0 : s.call(a);
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
J.elementStyles = [], J.shadowRootOptions = { mode: "open" }, J[te("elementProperties")] = /* @__PURE__ */ new Map(), J[te("finalized")] = /* @__PURE__ */ new Map(), ve == null || ve({ ReactiveElement: J }), (H.reactiveElementVersions ?? (H.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const re = globalThis, De = (r) => r, he = re.trustedTypes, Me = he ? he.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, Ye = "$lit$", U = `lit$${Math.random().toFixed(9).slice(2)}$`, Ze = "?" + U, pt = `<${Ze}>`, F = document, se = () => F.createComment(""), ae = (r) => r === null || typeof r != "object" && typeof r != "function", Ee = Array.isArray, ut = (r) => Ee(r) || typeof (r == null ? void 0 : r[Symbol.iterator]) == "function", _e = `[ 	
\f\r]`, X = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Le = /-->/g, je = />/g, L = RegExp(`>|${_e}(?:([^\\s"'>=/]+)(${_e}*=${_e}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ie = /'/g, Re = /"/g, Xe = /^(?:script|style|textarea|title)$/i, gt = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), n = gt(1), B = Symbol.for("lit-noChange"), g = Symbol.for("lit-nothing"), Fe = /* @__PURE__ */ new WeakMap(), I = F.createTreeWalker(F, 129);
function et(r, e) {
  if (!Ee(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Me !== void 0 ? Me.createHTML(e) : e;
}
const ft = (r, e) => {
  const t = r.length - 1, a = [];
  let s, i = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = X;
  for (let c = 0; c < t; c++) {
    const l = r[c];
    let p, m, h = -1, f = 0;
    for (; f < l.length && (o.lastIndex = f, m = o.exec(l), m !== null); ) f = o.lastIndex, o === X ? m[1] === "!--" ? o = Le : m[1] !== void 0 ? o = je : m[2] !== void 0 ? (Xe.test(m[2]) && (s = RegExp("</" + m[2], "g")), o = L) : m[3] !== void 0 && (o = L) : o === L ? m[0] === ">" ? (o = s ?? X, h = -1) : m[1] === void 0 ? h = -2 : (h = o.lastIndex - m[2].length, p = m[1], o = m[3] === void 0 ? L : m[3] === '"' ? Re : Ie) : o === Re || o === Ie ? o = L : o === Le || o === je ? o = X : (o = L, s = void 0);
    const u = o === L && r[c + 1].startsWith("/>") ? " " : "";
    i += o === X ? l + pt : h >= 0 ? (a.push(p), l.slice(0, h) + Ye + l.slice(h) + U + u) : l + U + (h === -2 ? c : u);
  }
  return [et(r, i + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), a];
};
class ie {
  constructor({ strings: e, _$litType$: t }, a) {
    let s;
    this.parts = [];
    let i = 0, o = 0;
    const c = e.length - 1, l = this.parts, [p, m] = ft(e, t);
    if (this.el = ie.createElement(p, a), I.currentNode = this.el.content, t === 2 || t === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (s = I.nextNode()) !== null && l.length < c; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const h of s.getAttributeNames()) if (h.endsWith(Ye)) {
          const f = m[o++], u = s.getAttribute(h).split(U), _ = /([.?@])?(.*)/.exec(f);
          l.push({ type: 1, index: i, name: _[2], strings: u, ctor: _[1] === "." ? mt : _[1] === "?" ? vt : _[1] === "@" ? _t : ge }), s.removeAttribute(h);
        } else h.startsWith(U) && (l.push({ type: 6, index: i }), s.removeAttribute(h));
        if (Xe.test(s.tagName)) {
          const h = s.textContent.split(U), f = h.length - 1;
          if (f > 0) {
            s.textContent = he ? he.emptyScript : "";
            for (let u = 0; u < f; u++) s.append(h[u], se()), I.nextNode(), l.push({ type: 2, index: ++i });
            s.append(h[f], se());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Ze) l.push({ type: 2, index: i });
      else {
        let h = -1;
        for (; (h = s.data.indexOf(U, h + 1)) !== -1; ) l.push({ type: 7, index: i }), h += U.length - 1;
      }
      i++;
    }
  }
  static createElement(e, t) {
    const a = F.createElement("template");
    return a.innerHTML = e, a;
  }
}
function Q(r, e, t = r, a) {
  var o, c;
  if (e === B) return e;
  let s = a !== void 0 ? (o = t._$Co) == null ? void 0 : o[a] : t._$Cl;
  const i = ae(e) ? void 0 : e._$litDirective$;
  return (s == null ? void 0 : s.constructor) !== i && ((c = s == null ? void 0 : s._$AO) == null || c.call(s, !1), i === void 0 ? s = void 0 : (s = new i(r), s._$AT(r, t, a)), a !== void 0 ? (t._$Co ?? (t._$Co = []))[a] = s : t._$Cl = s), s !== void 0 && (e = Q(r, s._$AS(r, e.values), s, a)), e;
}
class bt {
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
    const { el: { content: t }, parts: a } = this._$AD, s = ((e == null ? void 0 : e.creationScope) ?? F).importNode(t, !0);
    I.currentNode = s;
    let i = I.nextNode(), o = 0, c = 0, l = a[0];
    for (; l !== void 0; ) {
      if (o === l.index) {
        let p;
        l.type === 2 ? p = new Z(i, i.nextSibling, this, e) : l.type === 1 ? p = new l.ctor(i, l.name, l.strings, this, e) : l.type === 6 && (p = new yt(i, this, e)), this._$AV.push(p), l = a[++c];
      }
      o !== (l == null ? void 0 : l.index) && (i = I.nextNode(), o++);
    }
    return I.currentNode = F, s;
  }
  p(e) {
    let t = 0;
    for (const a of this._$AV) a !== void 0 && (a.strings !== void 0 ? (a._$AI(e, a, t), t += a.strings.length - 2) : a._$AI(e[t])), t++;
  }
}
class Z {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, a, s) {
    this.type = 2, this._$AH = g, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = a, this.options = s, this._$Cv = (s == null ? void 0 : s.isConnected) ?? !0;
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
    e = Q(this, e, t), ae(e) ? e === g || e == null || e === "" ? (this._$AH !== g && this._$AR(), this._$AH = g) : e !== this._$AH && e !== B && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ut(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== g && ae(this._$AH) ? this._$AA.nextSibling.data = e : this.T(F.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var i;
    const { values: t, _$litType$: a } = e, s = typeof a == "number" ? this._$AC(e) : (a.el === void 0 && (a.el = ie.createElement(et(a.h, a.h[0]), this.options)), a);
    if (((i = this._$AH) == null ? void 0 : i._$AD) === s) this._$AH.p(t);
    else {
      const o = new bt(s, this), c = o.u(this.options);
      o.p(t), this.T(c), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Fe.get(e.strings);
    return t === void 0 && Fe.set(e.strings, t = new ie(e)), t;
  }
  k(e) {
    Ee(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let a, s = 0;
    for (const i of e) s === t.length ? t.push(a = new Z(this.O(se()), this.O(se()), this, this.options)) : a = t[s], a._$AI(i), s++;
    s < t.length && (this._$AR(a && a._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var a;
    for ((a = this._$AP) == null ? void 0 : a.call(this, !1, !0, t); e !== this._$AB; ) {
      const s = De(e).nextSibling;
      De(e).remove(), e = s;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class ge {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, a, s, i) {
    this.type = 1, this._$AH = g, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = i, a.length > 2 || a[0] !== "" || a[1] !== "" ? (this._$AH = Array(a.length - 1).fill(new String()), this.strings = a) : this._$AH = g;
  }
  _$AI(e, t = this, a, s) {
    const i = this.strings;
    let o = !1;
    if (i === void 0) e = Q(this, e, t, 0), o = !ae(e) || e !== this._$AH && e !== B, o && (this._$AH = e);
    else {
      const c = e;
      let l, p;
      for (e = i[0], l = 0; l < i.length - 1; l++) p = Q(this, c[a + l], t, l), p === B && (p = this._$AH[l]), o || (o = !ae(p) || p !== this._$AH[l]), p === g ? e = g : e !== g && (e += (p ?? "") + i[l + 1]), this._$AH[l] = p;
    }
    o && !s && this.j(e);
  }
  j(e) {
    e === g ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class mt extends ge {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === g ? void 0 : e;
  }
}
class vt extends ge {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== g);
  }
}
class _t extends ge {
  constructor(e, t, a, s, i) {
    super(e, t, a, s, i), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = Q(this, e, t, 0) ?? g) === B) return;
    const a = this._$AH, s = e === g && a !== g || e.capture !== a.capture || e.once !== a.once || e.passive !== a.passive, i = e !== g && (a === g || s);
    s && this.element.removeEventListener(this.name, this, a), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class yt {
  constructor(e, t, a) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = a;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    Q(this, e);
  }
}
const xt = { I: Z }, ye = re.litHtmlPolyfillSupport;
ye == null || ye(ie, Z), (re.litHtmlVersions ?? (re.litHtmlVersions = [])).push("3.3.2");
const $t = (r, e, t) => {
  const a = (t == null ? void 0 : t.renderBefore) ?? e;
  let s = a._$litPart$;
  if (s === void 0) {
    const i = (t == null ? void 0 : t.renderBefore) ?? null;
    a._$litPart$ = s = new Z(e.insertBefore(se(), i), i, void 0, t ?? {});
  }
  return s._$AI(r), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const R = globalThis;
let v = class extends J {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = $t(t, this.renderRoot, this.renderOptions);
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
    return B;
  }
};
var Qe;
v._$litElement$ = !0, v.finalized = !0, (Qe = R.litElementHydrateSupport) == null || Qe.call(R, { LitElement: v });
const xe = R.litElementPolyfillSupport;
xe == null || xe({ LitElement: v });
(R.litElementVersions ?? (R.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $ = (r) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(r, e);
  }) : customElements.define(r, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const wt = { attribute: !0, type: String, converter: ce, reflect: !1, hasChanged: Ae }, kt = (r = wt, e, t) => {
  const { kind: a, metadata: s } = t;
  let i = globalThis.litPropertyMetadata.get(s);
  if (i === void 0 && globalThis.litPropertyMetadata.set(s, i = /* @__PURE__ */ new Map()), a === "setter" && ((r = Object.create(r)).wrapped = !0), i.set(t.name, r), a === "accessor") {
    const { name: o } = t;
    return { set(c) {
      const l = e.get.call(this);
      e.set.call(this, c), this.requestUpdate(o, l, r, !0, c);
    }, init(c) {
      return c !== void 0 && this.C(o, void 0, r, c), c;
    } };
  }
  if (a === "setter") {
    const { name: o } = t;
    return function(c) {
      const l = this[o];
      e.call(this, c), this.requestUpdate(o, l, r, !0, c);
    };
  }
  throw Error("Unsupported decorator location: " + a);
};
function b(r) {
  return (e, t) => typeof t == "object" ? kt(r, e, t) : ((a, s, i) => {
    const o = s.hasOwnProperty(i);
    return s.constructor.createProperty(i, a), o ? Object.getOwnPropertyDescriptor(s, i) : void 0;
  })(r, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function d(r) {
  return b({ ...r, state: !0, attribute: !1 });
}
class St {
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
    const t = new URLSearchParams();
    (i = e.severity) != null && i.length && t.set("severity", e.severity.join(",")), e.source && t.set("source", e.source), e.search && t.set("search", e.search), e.from && t.set("from", e.from), e.to && t.set("to", e.to), e.limit !== void 0 && t.set("limit", String(e.limit)), e.offset !== void 0 && t.set("offset", String(e.offset)), e.order && t.set("order", e.order);
    const a = `${this.baseUrl}/api/messagehub/messages?${t.toString()}`, s = await fetch(a, { headers: this.headers() });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return await s.json();
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
  async setMessageStatus(e, t) {
    const a = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/status`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ status: t })
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async getMessageTags(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/tags`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return (await t.json()).tags;
  }
  async addMessageTag(e, t) {
    const a = await fetch(`${this.baseUrl}/api/messagehub/messages/${e}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tag: t })
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return (await a.json()).tags;
  }
  async removeMessageTag(e, t) {
    const a = `${this.baseUrl}/api/messagehub/messages/${e}/tags?tag=${encodeURIComponent(t)}`, s = await fetch(a, { method: "DELETE", headers: this.headers() });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return (await s.json()).tags;
  }
  async getRunbookForSource(e, t) {
    const a = t ? `?fingerprint=${encodeURIComponent(t)}` : "", s = await fetch(
      `${this.baseUrl}/api/messagehub/runbook/${encodeURIComponent(e)}${a}`,
      { headers: this.headers() }
    );
    if (s.status === 404) return null;
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return await s.json();
  }
  async listAudit(e = 200) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/audit?limit=${e}`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return (await t.json()).items;
  }
  async listKnxAddresses() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async upsertKnxAddress(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}: ${await t.text()}`);
  }
  async listChannels() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/channels`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async createChannel(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/channels`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}: ${await t.text()}`);
  }
  async updateChannel(e, t) {
    const a = await fetch(`${this.baseUrl}/api/messagehub/channels/${e}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(t)
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async deleteChannel(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/channels/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
  }
  async listMqttTopics() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async createMqttTopic(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}: ${await t.text()}`);
  }
  async deleteMqttTopic(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
  }
  async listRemediationHooks() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async createRemediationHook(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(e)
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}: ${await t.text()}`);
  }
  async deleteRemediationHook(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks/${e}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
  }
  async listHeartbeats() {
    const e = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return (await e.json()).items;
  }
  async upsertHeartbeat(e, t) {
    const a = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ source: e, expected_interval_seconds: t })
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
  }
  async getStatsExtended(e = 30) {
    const t = await fetch(
      `${this.baseUrl}/api/messagehub/stats-extended?days=${e}`,
      { headers: this.headers() }
    );
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return await t.json();
  }
  async deleteKnxAddress(e) {
    const t = `${this.baseUrl}/api/messagehub/knx-addresses/${encodeURIComponent(e)}`, a = await fetch(t, { method: "DELETE", headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
  }
  async importKnxCsv(e) {
    const t = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ csv: e })
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return await t.json();
  }
  exportUrl(e) {
    var a;
    const t = new URLSearchParams();
    return (a = e.severity) != null && a.length && t.set("severity", e.severity.join(",")), e.source && t.set("source", e.source), e.search && t.set("search", e.search), e.from && t.set("from", e.from), e.to && t.set("to", e.to), t.set("format", e.format ?? "jsonl"), e.limit !== void 0 && t.set("limit", String(e.limit)), `${this.baseUrl}/api/messagehub/export?${t.toString()}`;
  }
  async deleteMessages(e = {}) {
    var o;
    const t = new URLSearchParams();
    (o = e.severity) != null && o.length && t.set("severity", e.severity.join(",")), e.source && t.set("source", e.source), e.search && t.set("search", e.search), e.from && t.set("from", e.from), e.to && t.set("to", e.to);
    const a = `${this.baseUrl}/api/messagehub/messages?${t.toString()}`, s = await fetch(a, { method: "DELETE", headers: this.headers() });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return (await s.json()).deleted;
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
    const a = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${e}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(t)
      }
    );
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
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
const Tt = { CHILD: 2 }, At = (r) => (...e) => ({ _$litDirective$: r, values: e });
let Et = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, a) {
    this._$Ct = e, this._$AM = t, this._$Ci = a;
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
const { I: Pt } = xt, Be = (r) => r, We = () => document.createComment(""), ee = (r, e, t) => {
  var i;
  const a = r._$AA.parentNode, s = e === void 0 ? r._$AB : e._$AA;
  if (t === void 0) {
    const o = a.insertBefore(We(), s), c = a.insertBefore(We(), s);
    t = new Pt(o, c, r, r.options);
  } else {
    const o = t._$AB.nextSibling, c = t._$AM, l = c !== r;
    if (l) {
      let p;
      (i = t._$AQ) == null || i.call(t, r), t._$AM = r, t._$AP !== void 0 && (p = r._$AU) !== c._$AU && t._$AP(p);
    }
    if (o !== s || l) {
      let p = t._$AA;
      for (; p !== o; ) {
        const m = Be(p).nextSibling;
        Be(a).insertBefore(p, s), p = m;
      }
    }
  }
  return t;
}, j = (r, e, t = r) => (r._$AI(e, t), r), zt = {}, Ct = (r, e = zt) => r._$AH = e, Ot = (r) => r._$AH, $e = (r) => {
  r._$AR(), r._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const qe = (r, e, t) => {
  const a = /* @__PURE__ */ new Map();
  for (let s = e; s <= t; s++) a.set(r[s], s);
  return a;
}, Nt = At(class extends Et {
  constructor(r) {
    if (super(r), r.type !== Tt.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(r, e, t) {
    let a;
    t === void 0 ? t = e : e !== void 0 && (a = e);
    const s = [], i = [];
    let o = 0;
    for (const c of r) s[o] = a ? a(c, o) : o, i[o] = t(c, o), o++;
    return { values: i, keys: s };
  }
  render(r, e, t) {
    return this.dt(r, e, t).values;
  }
  update(r, [e, t, a]) {
    const s = Ot(r), { values: i, keys: o } = this.dt(e, t, a);
    if (!Array.isArray(s)) return this.ut = o, i;
    const c = this.ut ?? (this.ut = []), l = [];
    let p, m, h = 0, f = s.length - 1, u = 0, _ = i.length - 1;
    for (; h <= f && u <= _; ) if (s[h] === null) h++;
    else if (s[f] === null) f--;
    else if (c[h] === o[u]) l[u] = j(s[h], i[u]), h++, u++;
    else if (c[f] === o[_]) l[_] = j(s[f], i[_]), f--, _--;
    else if (c[h] === o[_]) l[_] = j(s[h], i[_]), ee(r, l[_ + 1], s[h]), h++, _--;
    else if (c[f] === o[u]) l[u] = j(s[f], i[u]), ee(r, s[h], s[f]), f--, u++;
    else if (p === void 0 && (p = qe(o, u, _), m = qe(c, h, f)), p.has(c[h])) if (p.has(c[f])) {
      const z = m.get(o[u]), me = z !== void 0 ? s[z] : null;
      if (me === null) {
        const Ce = ee(r, s[h]);
        j(Ce, i[u]), l[u] = Ce;
      } else l[u] = j(me, i[u]), ee(r, s[h], me), s[z] = null;
      u++;
    } else $e(s[f]), f--;
    else $e(s[h]), h++;
    for (; u <= _; ) {
      const z = ee(r, l[_ + 1]);
      j(z, i[u]), l[u++] = z;
    }
    for (; h <= f; ) {
      const z = s[h++];
      z !== null && $e(z);
    }
    return this.ut = o, Ct(r, l), B;
  }
});
var Ut = Object.defineProperty, Ht = Object.getOwnPropertyDescriptor, tt = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? Ht(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && Ut(e, t, s), s;
};
const Dt = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·"
}, Ve = {
  error: "Error",
  warning: "Warning",
  info: "Info",
  debug: "Debug"
};
let pe = class extends v {
  constructor() {
    super(...arguments), this.items = [], this._onClick = (r) => {
      this.dispatchEvent(
        new CustomEvent("select", { detail: { msg: r }, bubbles: !0, composed: !0 })
      );
    }, this._onKey = (r, e) => {
      (r.key === "Enter" || r.key === " ") && (r.preventDefault(), this._onClick(e));
    };
  }
  _renderHeader() {
    return n`
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
    return this.items.length ? n`
      <div class="root">
        ${this._renderHeader()}
        <div class="scroll" role="list">
          ${Nt(
      this.items,
      (r) => r.id,
      (r) => n`
              <div
                class=${`row sev-${r.severity}`}
                tabindex="0"
                role="listitem button"
                @click=${() => this._onClick(r)}
                @keydown=${(e) => this._onKey(e, r)}
              >
                <span
                  class="col-icon icon"
                  aria-label=${Ve[r.severity] ?? r.severity}
                  title=${Ve[r.severity] ?? r.severity}
                >
                  ${Dt[r.severity] ?? "·"}
                </span>
                <span class="col-ts ts">
                  ${r.timestamp.replace("T", " ").replace(/\+00:00$/, "Z")}
                </span>
                <span class="col-src src">${r.source}</span>
                <span class="col-text text">${r.text}</span>
              </div>
            `
    )}
        </div>
      </div>
    ` : n`
        <div class="root">
          ${this._renderHeader()}
          <div class="empty">Keine Nachrichten</div>
        </div>
      `;
  }
};
pe.styles = k`
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
tt([
  b({ attribute: !1 })
], pe.prototype, "items", 2);
pe = tt([
  $("message-table")
], pe);
var Mt = Object.defineProperty, Lt = Object.getOwnPropertyDescriptor, rt = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? Lt(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && Mt(e, t, s), s;
};
const Ke = ["error", "warning", "info", "debug"];
let ue = class extends v {
  constructor() {
    super(...arguments), this.selected = [...Ke];
  }
  _toggle(r) {
    const e = this.selected.includes(r) ? this.selected.filter((t) => t !== r) : [...this.selected, r];
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
      <div class="chips">
        ${Ke.map(
      (r) => n`<button
            class=${`chip sev-${r} ${this.selected.includes(r) ? "active" : ""}`}
            @click=${() => this._toggle(r)}
          >
            ${r}
          </button>`
    )}
      </div>
    `;
  }
};
ue.styles = k`
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
rt([
  b({ attribute: !1 })
], ue.prototype, "selected", 2);
ue = rt([
  $("severity-filter")
], ue);
var jt = Object.defineProperty, It = Object.getOwnPropertyDescriptor, fe = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? It(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && jt(e, t, s), s;
};
let G = class extends v {
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
  _onChange(r) {
    const e = r.target.value;
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
        ${this._sources.map((r) => n`<option value=${r}>${r}</option>`)}
      </select>
    `;
  }
};
G.styles = k`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `;
fe([
  b({ attribute: !1 })
], G.prototype, "api", 2);
fe([
  b({ attribute: !1 })
], G.prototype, "selected", 2);
fe([
  d()
], G.prototype, "_sources", 2);
G = fe([
  $("source-filter")
], G);
var Rt = Object.defineProperty, Ft = Object.getOwnPropertyDescriptor, Pe = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? Ft(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && Rt(e, t, s), s;
};
let oe = class extends v {
  _set(r) {
    let e;
    const t = /* @__PURE__ */ new Date();
    r === "1h" ? e = new Date(t.getTime() - 36e5).toISOString() : r === "24h" ? e = new Date(t.getTime() - 864e5).toISOString() : r === "7d" ? e = new Date(t.getTime() - 7 * 864e5).toISOString() : e = void 0, this.dispatchEvent(
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
oe.styles = k`
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
Pe([
  b({ attribute: !1 })
], oe.prototype, "fromIso", 2);
Pe([
  b({ attribute: !1 })
], oe.prototype, "toIso", 2);
oe = Pe([
  $("time-range-filter")
], oe);
var Bt = Object.defineProperty, Wt = Object.getOwnPropertyDescriptor, M = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? Wt(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && Bt(e, t, s), s;
};
let E = class extends v {
  constructor() {
    super(...arguments), this._status = "new", this._tags = [], this._newTag = "", this._runbook = null, this._busy = !1;
  }
  willUpdate(r) {
    r.has("msg") && this.msg && (this._status = this.msg.status ?? "new", this._loadTags(), this._loadRunbook());
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
  async _setStatus(r) {
    if (this.api) {
      this._busy = !0;
      try {
        await this.api.setMessageStatus(this.msg.id, r), this._status = r, this.dispatchEvent(
          new CustomEvent("status-change", {
            detail: { id: this.msg.id, status: r },
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
    const r = this._newTag.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    try {
      this._tags = await this.api.addMessageTag(this.msg.id, r), this._newTag = "";
    } catch {
    }
  }
  async _removeTag(r) {
    if (this.api)
      try {
        this._tags = await this.api.removeMessageTag(this.msg.id, r);
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
    const r = {
      new: "Neu",
      acknowledged: "Bestätigt",
      resolved: "Gelöst",
      expired: "Abgelaufen"
    };
    return n`<span class=${`status-badge status-${this._status}`}>
      ${r[this._status] ?? this._status}
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
              <pre class="meta">${JSON.stringify(this.msg.metadata, null, 2)}</pre>` : g}

        <h3>Tags</h3>
        <div class="tags">
          ${this._tags.length === 0 ? n`<span class="hint">keine Tags</span>` : this._tags.map(
      (r) => n`
                  <span class="tag">
                    #${r}
                    <button
                      class="tag-remove"
                      aria-label=${`Tag ${r} entfernen`}
                      @click=${() => this._removeTag(r)}
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
            @input=${(r) => this._newTag = r.target.value}
            @keydown=${(r) => {
      r.key === "Enter" && this._addTag();
    }}
          />
          <button @click=${this._addTag} ?disabled=${!this._newTag.trim()}>+ Hinzufügen</button>
        </div>

        ${this._runbook ? n`<h3>Runbook: ${this._runbook.title}</h3>
              <pre class="runbook">${this._runbook.markdown}</pre>` : g}

        <footer>
          <button class="del" @click=${this._delete}>Löschen</button>
        </footer>
      </aside>
    `;
  }
};
E.styles = k`
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
M([
  b({ attribute: !1 })
], E.prototype, "msg", 2);
M([
  b({ attribute: !1 })
], E.prototype, "api", 2);
M([
  d()
], E.prototype, "_status", 2);
M([
  d()
], E.prototype, "_tags", 2);
M([
  d()
], E.prototype, "_newTag", 2);
M([
  d()
], E.prototype, "_runbook", 2);
M([
  d()
], E.prototype, "_busy", 2);
E = M([
  $("detail-pane")
], E);
var qt = Object.defineProperty, Vt = Object.getOwnPropertyDescriptor, P = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? Vt(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && qt(e, t, s), s;
};
const Kt = ["debug", "info", "warning", "error"], Jt = JSON.stringify(
  {
    severity: "$.level",
    source: "$.app.name",
    text: "$.message",
    metadata: "$.extra"
  },
  null,
  2
), we = /^[a-z0-9._-]{1,64}$/;
function Qt(r) {
  return r.toLowerCase().normalize("NFKD").replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss").replace(/[\s/\\]+/g, "-").replace(/[^a-z0-9._-]/g, "").slice(0, 64);
}
let T = class extends v {
  constructor() {
    super(...arguments), this.editing = null, this._name = "", this._source = "", this._severity = "info", this._enabled = !0, this._mappingText = "", this._error = "", this._saving = !1;
  }
  willUpdate(r) {
    if (r.has("editing")) {
      const e = this.editing;
      this._name = (e == null ? void 0 : e.name) ?? "", this._source = (e == null ? void 0 : e.default_source) ?? "", this._severity = (e == null ? void 0 : e.default_severity) ?? "info", this._enabled = (e == null ? void 0 : e.enabled) ?? !0, this._mappingText = e != null && e.field_map ? JSON.stringify(e.field_map, null, 2) : "", this._error = "";
    }
  }
  _validateMapping() {
    if (!this._mappingText.trim()) return null;
    try {
      const r = JSON.parse(this._mappingText);
      if (typeof r != "object" || Array.isArray(r))
        throw new Error("muss ein JSON-Objekt sein");
      return r;
    } catch (r) {
      throw new Error(`Mapping-JSON ungueltig: ${r.message}`);
    }
  }
  async _save() {
    if (this.api) {
      this._error = "", this._saving = !0;
      try {
        const r = this._validateMapping();
        if (!this._name.trim()) throw new Error("Name darf nicht leer sein");
        if (!we.test(this._source))
          throw new Error("Source ist leer oder ungueltig.");
        let e;
        this.editing ? e = await this.api.updateWebhook(this.editing.webhook_id, {
          name: this._name.trim(),
          default_source: this._source,
          default_severity: this._severity,
          field_map: r,
          enabled: this._enabled
        }) : e = await this.api.createWebhook({
          name: this._name.trim(),
          default_source: this._source,
          default_severity: this._severity,
          field_map: r,
          enabled: this._enabled
        }), this.dispatchEvent(
          new CustomEvent("saved", {
            detail: { webhook: e },
            bubbles: !0,
            composed: !0
          })
        );
      } catch (r) {
        this._error = r.message;
      } finally {
        this._saving = !1;
      }
    }
  }
  _cancel() {
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: !0, composed: !0 }));
  }
  _useExample() {
    this._mappingText = Jt;
  }
  render() {
    const r = this.editing !== null;
    return n`
      <div class="card">
        <h3>${r ? "Webhook bearbeiten" : "Neuen Webhook anlegen"}</h3>

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
              ${this._source && we.test(this._source) ? n`<span class="ok-badge" title="ok">✓</span>` : null}
            </span>
            <input
              type="text"
              class=${this._source && !we.test(this._source) ? "invalid" : ""}
              .value=${this._source}
              @input=${(e) => {
      const t = e.target.value;
      this._source = Qt(t);
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
              ${Kt.map(
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

        ${this._error ? n`<div class="error">${this._error}</div>` : null}

        <div class="actions">
          <button class="primary" ?disabled=${this._saving} @click=${this._save}>
            ${this._saving ? "speichere…" : r ? "Speichern" : "Anlegen"}
          </button>
          <button @click=${this._cancel}>Abbrechen</button>
        </div>
      </div>
    `;
  }
};
T.styles = k`
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
P([
  b({ attribute: !1 })
], T.prototype, "api", 2);
P([
  b({ attribute: !1 })
], T.prototype, "editing", 2);
P([
  d()
], T.prototype, "_name", 2);
P([
  d()
], T.prototype, "_source", 2);
P([
  d()
], T.prototype, "_severity", 2);
P([
  d()
], T.prototype, "_enabled", 2);
P([
  d()
], T.prototype, "_mappingText", 2);
P([
  d()
], T.prototype, "_error", 2);
P([
  d()
], T.prototype, "_saving", 2);
T = P([
  $("webhook-form")
], T);
var Gt = Object.defineProperty, Yt = Object.getOwnPropertyDescriptor, A = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? Yt(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && Gt(e, t, s), s;
};
const Zt = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/, ke = ["debug", "info", "warning", "error"], Xt = [...ke, "auto"];
let w = class extends v {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._filter = "", this._onlyEnabled = !1, this._newAddr = "", this._newLabel = "", this._newDpt = "", this._editing = null, this._toast = "", this._error = "";
  }
  async firstUpdated() {
    await this._load();
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
  async _add() {
    if (this._error = "", !this.api) return;
    const r = this._newAddr.trim();
    if (!Zt.test(r)) {
      this._error = "Bitte Format N/N/N (z. B. 1/2/3)";
      return;
    }
    if (!this._newLabel.trim()) {
      this._error = "Label darf nicht leer sein";
      return;
    }
    try {
      await this.api.upsertKnxAddress({
        address: r,
        label: this._newLabel.trim(),
        dpt: this._newDpt.trim() || null,
        log_enabled: !1,
        log_severity: "info"
      }), this._newAddr = "", this._newLabel = "", this._newDpt = "", this._showToast(`${r} gespeichert`), await this._load();
    } catch (e) {
      this._error = e.message;
    }
  }
  async _toggleLog(r) {
    if (this.api)
      try {
        await this.api.upsertKnxAddress({
          ...r,
          log_enabled: !r.log_enabled
        }), await this._load();
      } catch (e) {
        this._showToast(e.message);
      }
  }
  async _delete(r) {
    if (this.api && window.confirm(`KNX-Adresse ${r} loeschen?`))
      try {
        await this.api.deleteKnxAddress(r), this._showToast(`${r} geloescht`), await this._load();
      } catch (e) {
        this._showToast(e.message);
      }
  }
  async _onCsvFile(r) {
    var a;
    const e = (a = r.target.files) == null ? void 0 : a[0];
    if (!e || !this.api) return;
    const t = await e.text();
    try {
      const s = await this.api.importKnxCsv(t);
      this._showToast(
        `Import: ${s.imported} angelegt, ${s.skipped} ueberlesen, ${s.errors} Fehler`
      ), await this._load();
    } catch (s) {
      this._showToast(`Import fehlgeschlagen: ${s.message}`);
    } finally {
      r.target.value = "";
    }
  }
  _showToast(r) {
    this._toast = r, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  _filtered() {
    let r = this._items;
    this._onlyEnabled && (r = r.filter((t) => t.log_enabled));
    const e = this._filter.trim().toLowerCase();
    return e ? r.filter(
      (t) => t.address.includes(e) || t.label.toLowerCase().includes(e) || (t.dpt ?? "").toLowerCase().includes(e)
    ) : r;
  }
  _renderEditor() {
    if (!this._editing) return g;
    const r = this._editing, e = (t) => {
      this._editing = { ...r, ...t };
    };
    return n`
      <div class="modal-backdrop" @click=${() => this._editing = null}>
        <div class="modal" @click=${(t) => t.stopPropagation()}>
          <h3>${r.address} bearbeiten</h3>
          <label>
            <span>Label</span>
            <input
              type="text"
              .value=${r.label}
              @input=${(t) => e({ label: t.target.value })}
            />
          </label>
          <div class="row-2">
            <label>
              <span>DPT (z. B. 1.001, 5.001, 16.001)</span>
              <input
                type="text"
                .value=${r.dpt ?? ""}
                @input=${(t) => e({ dpt: t.target.value || null })}
              />
            </label>
            <label class="checkbox">
              <input
                type="checkbox"
                .checked=${r.log_enabled}
                @change=${(t) => e({ log_enabled: t.target.checked })}
              />
              <span>Im Protokoll erfassen</span>
            </label>
          </div>

          ${r.log_enabled ? n`
                <label>
                  <span>Severity</span>
                  <select
                    .value=${r.log_severity}
                    @change=${(t) => {
      const a = t.target.value;
      e({ log_severity: a });
    }}
                  >
                    ${Xt.map(
      (t) => n`<option value=${t}>${t}</option>`
    )}
                  </select>
                  <small>
                    <code>auto</code> nutzt fuer Boolean-DPTs (1.x) die
                    Severity-Map unten — z. B. fuer Stoer-Bits, die bei
                    <code>True</code> einen Fehler bedeuten.
                  </small>
                </label>
                ${r.log_severity === "auto" ? n`<div class="row-2">
                      <label>
                        <span>Severity bei <code>True</code></span>
                        <select
                          .value=${r.severity_on_true ?? "warning"}
                          @change=${(t) => e({
      severity_on_true: t.target.value
    })}
                        >
                          ${ke.map(
      (t) => n`<option value=${t}>${t}</option>`
    )}
                        </select>
                      </label>
                      <label>
                        <span>Severity bei <code>False</code></span>
                        <select
                          .value=${r.severity_on_false ?? "info"}
                          @change=${(t) => e({
      severity_on_false: t.target.value
    })}
                        >
                          ${ke.map(
      (t) => n`<option value=${t}>${t}</option>`
    )}
                        </select>
                      </label>
                    </div>` : g}
              ` : g}

          <div class="modal-actions">
            <button @click=${() => this._editing = null}>Abbrechen</button>
            <button class="primary" @click=${() => void this._saveEdit()}>
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
      } catch (r) {
        this._showToast(r.message);
      }
  }
  render() {
    const r = this._filtered(), e = this._items.filter((t) => t.log_enabled).length;
    return n`
      <section>
        <header class="head">
          <div>
            <h2>KNX-Gruppenadressen</h2>
            <p class="hint">
              ${this._items.length} Adressen,
              <strong>${e} im Protokoll aktiv</strong>. Voraussetzung
              fuer die Bus-Erfassung: HA-KNX-Integration mit IP-Tunneling/Routing
              ist eingerichtet — sie feuert das Event <code>knx_event</code>, das
              wir gegen diese Whitelist matchen. Nicht-aktivierte GAs werden
              ignoriert.
            </p>
          </div>
          <label class="csv-upload">
            <input type="file" accept=".csv,text/csv" @change=${this._onCsvFile} />
            <span>📂 ETS-CSV importieren</span>
          </label>
        </header>

        <div class="add-form">
          <input
            type="text"
            placeholder="GA (z. B. 1/2/3)"
            .value=${this._newAddr}
            @input=${(t) => this._newAddr = t.target.value}
            @keydown=${(t) => {
      t.key === "Enter" && this._add();
    }}
          />
          <input
            type="text"
            placeholder="Label (z. B. Stoerung Heizung Pumpe)"
            .value=${this._newLabel}
            @input=${(t) => this._newLabel = t.target.value}
            @keydown=${(t) => {
      t.key === "Enter" && this._add();
    }}
          />
          <input
            type="text"
            class="narrow"
            placeholder="DPT (z. B. 1.001)"
            .value=${this._newDpt}
            @input=${(t) => this._newDpt = t.target.value}
            @keydown=${(t) => {
      t.key === "Enter" && this._add();
    }}
          />
          <button class="primary" @click=${this._add}>+ Hinzufuegen</button>
        </div>
        ${this._error ? n`<div class="error">${this._error}</div>` : g}

        <div class="filter-bar">
          <input
            type="search"
            placeholder="Suche (GA / Label / DPT)…"
            .value=${this._filter}
            @input=${(t) => this._filter = t.target.value}
          />
          <label class="toggle">
            <input
              type="checkbox"
              .checked=${this._onlyEnabled}
              @change=${(t) => this._onlyEnabled = t.target.checked}
            />
            <span>nur aktive</span>
          </label>
          <span class="muted">${r.length} sichtbar</span>
        </div>

        ${this._loading ? n`<p class="muted">lade…</p>` : r.length === 0 ? n`<p class="empty">
                ${this._items.length === 0 ? "Noch keine Adressen. Lege oben den ersten Eintrag an oder importiere eine ETS-CSV." : "Keine Treffer fuer aktuelle Filter."}
              </p>` : n`
                <table>
                  <thead>
                    <tr>
                      <th>GA</th>
                      <th>Label</th>
                      <th>DPT</th>
                      <th>Severity</th>
                      <th class="col-toggle">📝 Loggen</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${r.map(
      (t) => n`
                        <tr class=${t.log_enabled ? "enabled" : ""}>
                          <td><code>${t.address}</code></td>
                          <td>${t.label}</td>
                          <td>${t.dpt ?? n`<span class="muted">—</span>`}</td>
                          <td>
                            ${t.log_enabled ? n`<span class=${`sev sev-${t.log_severity}`}>
                                  ${t.log_severity}${t.log_severity === "auto" ? n`<small>
                                        T:${t.severity_on_true ?? "warning"}/F:${t.severity_on_false ?? "info"}
                                      </small>` : g}
                                </span>` : n`<span class="muted">—</span>`}
                          </td>
                          <td class="col-toggle">
                            <button
                              class=${`toggle-btn ${t.log_enabled ? "on" : "off"}`}
                              @click=${() => void this._toggleLog(t)}
                              title=${t.log_enabled ? "Loggen deaktivieren" : "Loggen aktivieren"}
                            >
                              ${t.log_enabled ? "✓ ON" : "OFF"}
                            </button>
                          </td>
                          <td class="actions">
                            <button @click=${() => this._editing = t}>Edit</button>
                            <button
                              class="danger"
                              @click=${() => void this._delete(t.address)}
                            >
                              Loeschen
                            </button>
                          </td>
                        </tr>
                      `
    )}
                  </tbody>
                </table>
              `}

        ${this._renderEditor()}
        ${this._toast ? n`<div class="toast">${this._toast}</div>` : g}
      </section>
    `;
  }
};
w.styles = k`
    section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }
    h2 {
      margin: 0;
      font-size: 1.2em;
    }
    h3 {
      margin: 0 0 8px 0;
    }
    .hint {
      margin: 4px 0 0 0;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    .csv-upload {
      cursor: pointer;
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font-size: 0.85em;
      background: var(--card-background-color, white);
    }
    .csv-upload input[type="file"] {
      display: none;
    }
    .csv-upload:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .add-form {
      display: grid;
      grid-template-columns: 130px 1fr 130px auto;
      gap: 8px;
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 12px;
    }
    @media (max-width: 720px) {
      .add-form {
        grid-template-columns: 1fr 1fr;
      }
    }
    input[type="text"],
    input[type="search"],
    select {
      padding: 8px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font: inherit;
      background: var(--card-background-color, white);
      color: var(--primary-text-color, #222);
    }
    input.narrow {
      max-width: 130px;
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
    button.primary:hover {
      filter: brightness(0.9);
    }
    button.danger {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    button.toggle-btn {
      min-width: 56px;
      font-weight: 600;
    }
    button.toggle-btn.on {
      background: var(--success-color, #4caf50);
      color: white;
      border-color: var(--success-color, #4caf50);
    }
    button.toggle-btn.off {
      color: var(--secondary-text-color, #666);
    }
    .filter-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.9em;
      cursor: pointer;
    }
    .muted {
      color: var(--secondary-text-color, #888);
      font-size: 0.85em;
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
    .col-toggle {
      text-align: center;
    }
    td.actions {
      text-align: right;
      white-space: nowrap;
    }
    td.actions button + button {
      margin-left: 4px;
    }
    tr.enabled {
      background: rgba(76, 175, 80, 0.04);
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.9em;
    }
    .sev {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 8px;
      font-size: 0.78em;
      font-weight: 600;
      text-transform: uppercase;
    }
    .sev small {
      display: block;
      font-size: 0.85em;
      font-weight: 400;
      text-transform: none;
      opacity: 0.85;
    }
    .sev-debug {
      background: rgba(0, 0, 0, 0.06);
      color: var(--secondary-text-color, #666);
    }
    .sev-info {
      background: rgba(3, 169, 244, 0.12);
      color: var(--info-color, #03a9f4);
    }
    .sev-warning {
      background: rgba(255, 152, 0, 0.15);
      color: var(--warning-color, #ff9800);
    }
    .sev-error {
      background: rgba(219, 68, 55, 0.15);
      color: var(--error-color, #db4437);
    }
    .sev-auto {
      background: rgba(156, 39, 176, 0.12);
      color: #6a1b9a;
    }
    .empty {
      padding: 24px;
      text-align: center;
      color: var(--secondary-text-color, #666);
      background: var(--card-background-color, white);
      border: 1px dashed var(--divider-color, #ccc);
      border-radius: 8px;
    }
    .error {
      color: var(--error-color, #db4437);
      font-size: 0.9em;
      padding: 6px 8px;
      background: rgba(219, 68, 55, 0.08);
      border-left: 3px solid var(--error-color, #db4437);
      border-radius: 2px;
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
    .modal-backdrop {
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
      width: min(520px, 92vw);
      max-height: 90vh;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .modal label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    .modal label > span {
      font-weight: 500;
      color: var(--primary-text-color, #222);
    }
    .modal label.checkbox {
      flex-direction: row;
      align-items: center;
      gap: 6px;
    }
    .modal small {
      font-size: 0.78em;
      color: var(--secondary-text-color, #888);
    }
    .modal small code {
      background: var(--secondary-background-color, #f5f5f5);
      padding: 1px 4px;
      border-radius: 3px;
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
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
  `;
A([
  b({ attribute: !1 })
], w.prototype, "api", 2);
A([
  d()
], w.prototype, "_items", 2);
A([
  d()
], w.prototype, "_loading", 2);
A([
  d()
], w.prototype, "_filter", 2);
A([
  d()
], w.prototype, "_onlyEnabled", 2);
A([
  d()
], w.prototype, "_newAddr", 2);
A([
  d()
], w.prototype, "_newLabel", 2);
A([
  d()
], w.prototype, "_newDpt", 2);
A([
  d()
], w.prototype, "_editing", 2);
A([
  d()
], w.prototype, "_toast", 2);
A([
  d()
], w.prototype, "_error", 2);
w = A([
  $("knx-addresses-view")
], w);
var er = Object.defineProperty, tr = Object.getOwnPropertyDescriptor, ne = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? tr(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && er(e, t, s), s;
};
const rr = ["telegram", "pushover", "ntfy", "signal", "notify"], sr = ["debug", "info", "warning", "error"];
let W = class extends v {
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
  _edit(r) {
    this._editing = { ...r };
  }
  async _save() {
    if (!(!this.api || !this._editing)) {
      try {
        this._editing.id == null ? await this.api.createChannel(this._editing) : await this.api.updateChannel(this._editing.id, this._editing), this._editing = null, this._toast = "gespeichert", await this._load();
      } catch (r) {
        this._toast = r.message;
      }
      window.setTimeout(() => this._toast = "", 2400);
    }
  }
  async _delete(r) {
    !this.api || r.id == null || window.confirm(`Channel '${r.name}' loeschen?`) && (await this.api.deleteChannel(r.id), await this._load());
  }
  _renderTypeFields(r, e) {
    const t = r.config ?? {}, a = (s, i) => {
      e({ config: { ...t, [s]: i } });
    };
    return r.channel_type === "telegram" ? n`
        <div class="row-2">
          <label>
            <span>Bot-Token</span>
            <input
              type="password"
              placeholder="123456:ABC..."
              .value=${t.bot_token ?? ""}
              @input=${(s) => a("bot_token", s.target.value)}
            />
            <small>Vom @BotFather erhalten.</small>
          </label>
          <label>
            <span>Chat-ID</span>
            <input
              placeholder="-100123456789 oder 12345678"
              .value=${t.chat_id ?? ""}
              @input=${(s) => a("chat_id", s.target.value)}
            />
            <small>An @userinfobot eine Nachricht senden, dort steht die ID.</small>
          </label>
        </div>
      ` : r.channel_type === "pushover" ? n`
        <div class="row-2">
          <label>
            <span>App-Token</span>
            <input
              type="password"
              placeholder="azGDORePK8gMaC0QOYAMyEEuzJnyUi"
              .value=${t.app_token ?? ""}
              @input=${(s) => a("app_token", s.target.value)}
            />
          </label>
          <label>
            <span>User-Key</span>
            <input
              .value=${t.user_key ?? ""}
              @input=${(s) => a("user_key", s.target.value)}
            />
          </label>
        </div>
        <label>
          <span>Geraet (optional)</span>
          <input
            placeholder="iphone, oder leer = alle Geraete"
            .value=${t.device ?? ""}
            @input=${(s) => a("device", s.target.value)}
          />
        </label>
      ` : r.channel_type === "ntfy" ? n`
        <div class="row-2">
          <label>
            <span>Server (Default ntfy.sh)</span>
            <input
              placeholder="https://ntfy.sh"
              .value=${t.base_url ?? ""}
              @input=${(s) => a("base_url", s.target.value)}
            />
          </label>
          <label>
            <span>Topic</span>
            <input
              placeholder="ha_alerts_dein_topic"
              .value=${t.topic ?? ""}
              @input=${(s) => a("topic", s.target.value)}
            />
          </label>
        </div>
        <label>
          <span>Auth-Token (optional, fuer geschuetzte Server)</span>
          <input
            type="password"
            .value=${t.token ?? ""}
            @input=${(s) => a("token", s.target.value)}
          />
        </label>
      ` : n`
      <label>
        <span>Notify-Service-Name (ohne <code>notify.</code>)</span>
        <input
          placeholder="z. B. mobile_app_iphone, signal_messenger"
          .value=${t.service ?? ""}
          @input=${(s) => a("service", s.target.value)}
        />
      </label>
    `;
  }
  _renderEditor() {
    const r = this._editing, e = (t) => {
      this._editing = { ...r, ...t };
    };
    return n`
      <div class="modal-bg" @click=${() => this._editing = null}>
        <div class="modal" @click=${(t) => t.stopPropagation()}>
          <h3>${r.id == null ? "Neuen Channel anlegen" : `${r.name} bearbeiten`}</h3>
          <label
            ><span>Name</span
            ><input
              .value=${r.name}
              @input=${(t) => e({ name: t.target.value })}
          /></label>
          <label>
            <span>Typ</span>
            <select
              .value=${r.channel_type}
              @change=${(t) => {
      const a = t.target.value;
      e({ channel_type: a, config: {} });
    }}
            >
              ${rr.map((t) => n`<option value=${t}>${t}</option>`)}
            </select>
            <small>
              ${r.channel_type === "telegram" ? "Direkt an Telegram-Bot-API. Bot-Token + Chat-ID unten." : r.channel_type === "pushover" ? "Direkt an Pushover-API. App-Token + User-Key unten." : r.channel_type === "ntfy" ? "Direkt an ntfy-Server (ntfy.sh oder selbst-gehostet)." : r.channel_type === "signal" ? "Ueber HA-Service notify.<service>. Trag Namen unten ein." : "Ueber HA-Service notify.<service>."}
            </small>
          </label>

          ${this._renderTypeFields(r, e)}

          <div class="row-2">
            <label>
              <span>Severity-Schwelle</span>
              <select
                .value=${r.severity_threshold}
                @change=${(t) => {
      const a = t.target.value;
      e({ severity_threshold: a });
    }}
              >
                ${sr.map((t) => n`<option value=${t}>${t}</option>`)}
              </select>
            </label>
            <label>
              <span>Throttle (Sek. pro Source)</span>
              <input
                type="number"
                min="0"
                .value=${String(r.throttle_seconds)}
                @input=${(t) => e({ throttle_seconds: +t.target.value })}
              />
            </label>
          </div>

          <div class="row-2">
            <label>
              <span>Quiet Hours Start (HH:MM)</span>
              <input
                placeholder="22:00"
                .value=${r.quiet_start ?? ""}
                @input=${(t) => e({ quiet_start: t.target.value || null })}
              />
            </label>
            <label>
              <span>Quiet Hours Ende (HH:MM)</span>
              <input
                placeholder="07:00"
                .value=${r.quiet_end ?? ""}
                @input=${(t) => e({ quiet_end: t.target.value || null })}
              />
            </label>
          </div>

          <label class="checkbox">
            <input
              type="checkbox"
              .checked=${r.quiet_bypass_error}
              @change=${(t) => e({ quiet_bypass_error: t.target.checked })}
            /><span>Errors umgehen Quiet Hours</span>
          </label>
          <label class="checkbox">
            <input
              type="checkbox"
              .checked=${r.enabled}
              @change=${(t) => e({ enabled: t.target.checked })}
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
      (r) => {
        var e, t, a, s, i;
        return n`<tr>
                    <td>${r.name}</td>
                    <td>
                      <code>${r.channel_type}</code>
                      ${r.channel_type === "telegram" ? n` → <small>${((e = r.config) == null ? void 0 : e.chat_id) ?? "?"}</small>` : r.channel_type === "pushover" ? n` → <small>${((a = (t = r.config) == null ? void 0 : t.user_key) == null ? void 0 : a.slice(0, 8)) ?? "?"}…</small>` : r.channel_type === "ntfy" ? n` → <small>${((s = r.config) == null ? void 0 : s.topic) ?? "?"}</small>` : (i = r.config) != null && i.service ? n` → <code>notify.${r.config.service}</code>` : n`<span class="muted">— unkonfiguriert</span>`}
                    </td>
                    <td>${r.severity_threshold}</td>
                    <td>
                      ${r.quiet_start && r.quiet_end ? n`${r.quiet_start}–${r.quiet_end}${r.quiet_bypass_error ? n` <small>(Err bypass)</small>` : ""}` : n`<span class="muted">—</span>`}
                    </td>
                    <td>${r.throttle_seconds}s</td>
                    <td>${r.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button @click=${() => this._edit(r)}>Edit</button>
                      <button class="danger" @click=${() => void this._delete(r)}>
                        Loeschen
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
W.styles = k`
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
ne([
  b({ attribute: !1 })
], W.prototype, "api", 2);
ne([
  d()
], W.prototype, "_items", 2);
ne([
  d()
], W.prototype, "_editing", 2);
ne([
  d()
], W.prototype, "_toast", 2);
W = ne([
  $("channels-view")
], W);
var ar = Object.defineProperty, ir = Object.getOwnPropertyDescriptor, y = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? ir(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && ar(e, t, s), s;
};
const ze = k`
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
let D = class extends v {
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
  async _delete(r) {
    !this.api || r.id == null || window.confirm(`Subscription '${r.topic_pattern}' loeschen?`) && (await this.api.deleteMqttTopic(r.id), await this._load());
  }
  render() {
    return n`
      <section>
        <header>
          <h2>MQTT-Topic-Subscriptions</h2>
          <p class="hint">
            Wildcards <code>+</code> (ein Segment) und <code>#</code>
            (Subtree) werden direkt von HA-MQTT aufgeloest. Subscriptions
            werden nach Restart neu gesetzt.
          </p>
        </header>

        <div class="add">
          <input
            placeholder="Topic-Pattern (z. B. zigbee2mqtt/+/availability)"
            .value=${this._newPattern}
            @input=${(r) => this._newPattern = r.target.value}
          />
          <input
            placeholder="Source (z. B. zigbee.health)"
            .value=${this._newSource}
            @input=${(r) => this._newSource = r.target.value}
          />
          <select
            .value=${this._newSeverity}
            @change=${(r) => {
      this._newSeverity = r.target.value;
    }}
          >
            <option value="debug">debug</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
          </select>
          <button class="primary" @click=${this._add}>+ Hinzufuegen</button>
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
      (r) => n`<tr>
                    <td><code>${r.topic_pattern}</code></td>
                    <td>${r.source}</td>
                    <td>${r.severity}</td>
                    <td>${r.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button class="danger" @click=${() => void this._delete(r)}>
                        Loeschen
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
D.styles = ze;
y([
  b({ attribute: !1 })
], D.prototype, "api", 2);
y([
  d()
], D.prototype, "_items", 2);
y([
  d()
], D.prototype, "_newPattern", 2);
y([
  d()
], D.prototype, "_newSource", 2);
y([
  d()
], D.prototype, "_newSeverity", 2);
D = y([
  $("mqtt-topics-view")
], D);
let q = class extends v {
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
            @input=${(r) => this._newSource = r.target.value}
          />
          <input
            type="number"
            min="60"
            placeholder="Intervall (Sek)"
            .value=${String(this._newInterval)}
            @input=${(r) => this._newInterval = +r.target.value}
          />
          <button class="primary" @click=${this._add}>+ Hinzufuegen</button>
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
      (r) => n`<tr>
                    <td><code>${r.source}</code></td>
                    <td>${r.expected_interval_seconds}</td>
                    <td>${r.last_seen ?? n`<span class="muted">—</span>`}</td>
                    <td>
                      ${r.silent_alert_active ? n`<span class="alert">⚠ silent</span>` : n`<span class="ok">✓ ok</span>`}
                    </td>
                  </tr>`
    )}
              </tbody>
            </table>`}
      </section>
    `;
  }
};
q.styles = ze;
y([
  b({ attribute: !1 })
], q.prototype, "api", 2);
y([
  d()
], q.prototype, "_items", 2);
y([
  d()
], q.prototype, "_newSource", 2);
y([
  d()
], q.prototype, "_newInterval", 2);
q = y([
  $("heartbeats-view")
], q);
let C = class extends v {
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
  async _delete(r) {
    !this.api || r.id == null || window.confirm(`Hook '${r.name}' loeschen?`) && (await this.api.deleteRemediationHook(r.id), await this._load());
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
            @input=${(r) => this._newName = r.target.value}
          />
          <input
            placeholder="Source-Pattern (% erlaubt)"
            .value=${this._newSource}
            @input=${(r) => this._newSource = r.target.value}
          />
          <input
            placeholder="automation.foo / script.bar"
            .value=${this._newAutomation}
            @input=${(r) => this._newAutomation = r.target.value}
          />
          <label class="inline">
            <input
              type="checkbox"
              .checked=${this._newAuto}
              @change=${(r) => this._newAuto = r.target.checked}
            />
            <span>Auto</span>
          </label>
          <button class="primary" @click=${this._add}>+ Hinzufuegen</button>
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
      (r) => n`<tr>
                    <td>${r.name}</td>
                    <td><code>${r.source_pattern}</code></td>
                    <td><code>${r.automation_id}</code></td>
                    <td>
                      ${r.confirm_required ? n`<span class="muted">Vorschlag</span>` : n`<span class="alert">Auto</span>`}
                    </td>
                    <td>${r.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button class="danger" @click=${() => void this._delete(r)}>
                        Loeschen
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
C.styles = ze;
y([
  b({ attribute: !1 })
], C.prototype, "api", 2);
y([
  d()
], C.prototype, "_items", 2);
y([
  d()
], C.prototype, "_newName", 2);
y([
  d()
], C.prototype, "_newSource", 2);
y([
  d()
], C.prototype, "_newAutomation", 2);
y([
  d()
], C.prototype, "_newAuto", 2);
C = y([
  $("remediation-view")
], C);
var or = Object.defineProperty, nr = Object.getOwnPropertyDescriptor, V = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? nr(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && or(e, t, s), s;
};
let O = class extends v {
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
  async _copyUrl(r) {
    const e = `${window.location.origin}/api/webhook/${r}`;
    try {
      await navigator.clipboard.writeText(e), this._showToast("URL kopiert");
    } catch {
      this._showToast("Kopieren fehlgeschlagen");
    }
  }
  async _delete(r) {
    this.api && window.confirm(`Webhook „${r.name}" wirklich loeschen?`) && (await this.api.deleteWebhook(r.webhook_id), this._showToast(`„${r.name}" geloescht`), await this._load());
  }
  async _toggle(r) {
    this.api && (await this.api.updateWebhook(r.webhook_id, { enabled: !r.enabled }), await this._load());
  }
  _onSaved(r) {
    this._showForm = !1, this._editing = null, this._showToast("Webhook gespeichert"), this._load();
  }
  _onCancel() {
    this._showForm = !1, this._editing = null;
  }
  _add() {
    this._editing = null, this._showForm = !0;
  }
  _edit(r) {
    this._editing = r, this._showForm = !0;
  }
  _showToast(r) {
    this._toast = r, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2400);
  }
  _renderEmpty() {
    return n`
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
  _renderItem(r) {
    const e = `${window.location.origin}/api/webhook/${r.webhook_id}`;
    return n`
      <div class=${`card ${r.enabled ? "" : "disabled"}`}>
        <header>
          <div class="title">
            <h4>${r.name}</h4>
            <span class=${`status ${r.enabled ? "ok" : "off"}`}>
              ${r.enabled ? "aktiv" : "deaktiviert"}
            </span>
          </div>
          <div class="actions">
            <button @click=${() => this._toggle(r)}>
              ${r.enabled ? "Deaktivieren" : "Aktivieren"}
            </button>
            <button @click=${() => this._edit(r)}>Bearbeiten</button>
            <button class="danger" @click=${() => this._delete(r)}>Loeschen</button>
          </div>
        </header>

        <dl>
          <dt>Default-Source</dt>
          <dd><code>${r.default_source}</code></dd>
          <dt>Default-Severity</dt>
          <dd><code>${r.default_severity}</code></dd>
          <dt>Webhook-URL</dt>
          <dd>
            <code class="url">${e}</code>
            <button class="link" @click=${() => this._copyUrl(r.webhook_id)}>
              kopieren
            </button>
          </dd>
          ${r.field_map ? n`<dt>JSONPath-Mapping</dt>
                <dd>
                  <pre><code>${JSON.stringify(r.field_map, null, 2)}</code></pre>
                </dd>` : null}
        </dl>
      </div>
    `;
  }
  render() {
    return n`
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
            ${this._items.length > 0 && !this._showForm ? n`<button class="primary" @click=${this._add}>+ Webhook anlegen</button>` : null}
          </header>

          ${this._showForm ? n`<webhook-form
                .api=${this.api}
                .editing=${this._editing}
                @saved=${this._onSaved}
                @cancel=${this._onCancel}
              ></webhook-form>` : null}

          ${this._loading ? n`<p class="status">lade…</p>` : this._items.length === 0 && !this._showForm ? this._renderEmpty() : n`<div class="grid">${this._items.map((r) => this._renderItem(r))}</div>`}
        </section>

        <knx-addresses-view .api=${this.api}></knx-addresses-view>

        <channels-view .api=${this.api}></channels-view>

        <mqtt-topics-view .api=${this.api}></mqtt-topics-view>

        <heartbeats-view .api=${this.api}></heartbeats-view>

        <remediation-view .api=${this.api}></remediation-view>

        <section style="display:none;">
          <header class="section-head">
            <div>
              <h2>Alt-Notification-Channels</h2>
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
              <p class="hint">
                Stille Quellen erkennen und alarmieren — Backend-Job laeuft 60s,
                UI-Editor folgt in v0.2 (REST-Endpoint
                <code>/api/messagehub/heartbeats</code> ist da).
              </p>
            </div>
          </header>
        </section>

        ${this._toast ? n`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
};
O.styles = k`
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
V([
  b({ attribute: !1 })
], O.prototype, "api", 2);
V([
  d()
], O.prototype, "_items", 2);
V([
  d()
], O.prototype, "_loading", 2);
V([
  d()
], O.prototype, "_showForm", 2);
V([
  d()
], O.prototype, "_editing", 2);
V([
  d()
], O.prototype, "_toast", 2);
O = V([
  $("settings-view")
], O);
var lr = Object.defineProperty, dr = Object.getOwnPropertyDescriptor, K = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? dr(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && lr(e, t, s), s;
};
const cr = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
  debug: "Debug"
}, hr = {
  error: "var(--error-color, #db4437)",
  warning: "var(--warning-color, #ff9800)",
  info: "var(--info-color, #03a9f4)",
  debug: "var(--secondary-text-color, #888)"
};
let N = class extends v {
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
        const [r, e, t] = await Promise.all([
          this.api.getStats(),
          this.api.listSources(),
          this.api.getStatsExtended(30)
        ]);
        this._stats = r, this._sources = e, this._heatmap = t.heatmap, this._topSources = t.top_sources;
      } finally {
        this._loading = !1;
      }
    }
  }
  _renderHeatmap() {
    const r = Array.from({ length: 7 }, () => Array(24).fill(0));
    let e = 0;
    for (const a of this._heatmap)
      a.weekday >= 0 && a.weekday < 7 && a.hour >= 0 && a.hour < 24 && (r[a.weekday][a.hour] = a.count, a.count > e && (e = a.count));
    if (e === 0)
      return n`<p class="muted">Keine Daten in den letzten 30 Tagen.</p>`;
    const t = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    return n`
      <div class="heatmap">
        <div class="heatmap-header">
          <span></span>
          ${Array.from(
      { length: 24 },
      (a, s) => n`<span class="hour-label">${s % 3 === 0 ? s : ""}</span>`
    )}
        </div>
        ${r.map(
      (a, s) => n`
            <div class="heatmap-row">
              <span class="day-label">${t[s]}</span>
              ${a.map((i) => {
        const o = i === 0 ? 0 : Math.max(0.1, i / e);
        return n`
                  <div
                    class="heatmap-cell"
                    style=${`background: rgba(3, 169, 244, ${o})`}
                    title=${`${t[s]} ${a.indexOf(i)}:00 — ${i} msg`}
                  ></div>
                `;
      })}
            </div>
          `
    )}
      </div>
      <p class="muted small">Helligkeit ∝ Nachrichtenanzahl (max: ${e}).</p>
    `;
  }
  _renderSeverityBars() {
    if (!this._stats) return n``;
    const r = this._stats.severity_24h, e = Math.max(1, Object.values(r).reduce((a, s) => a + s, 0));
    return n`
      <div class="bars">
        ${["error", "warning", "info", "debug"].map((a) => {
      const s = r[a] ?? 0, i = s / e * 100;
      return n`
            <div class="bar-row">
              <span class="bar-label">${cr[a] ?? a}</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  style=${`width: ${i}%; background: ${hr[a]}`}
                ></div>
              </div>
              <span class="bar-count">${s}</span>
            </div>
          `;
    })}
      </div>
    `;
  }
  render() {
    if (this._loading && !this._stats)
      return n`<div class="root"><p class="status">lade…</p></div>`;
    if (!this._stats)
      return n`<div class="root"><p class="status">Keine Daten verfuegbar.</p></div>`;
    const r = this._stats, e = Object.values(r.severity_24h).reduce((t, a) => t + a, 0);
    return n`
      <div class="root">
        <section>
          <h2>Live-Status</h2>
          <div class="kpis">
            <div class="kpi">
              <span class="kpi-label">Gesamt</span>
              <span class="kpi-value">${r.total.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">Nachrichten in der Datenbank</span>
            </div>
            <div class="kpi accent-info">
              <span class="kpi-label">Letzte 24h</span>
              <span class="kpi-value">${e.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">alle Severities</span>
            </div>
            <div class="kpi accent-error">
              <span class="kpi-label">Errors 24h</span>
              <span class="kpi-value">${r.severity_24h.error ?? 0}</span>
              <span class="kpi-hint">unbehoben + bestaetigt</span>
            </div>
            <div class="kpi accent-warning">
              <span class="kpi-label">Warnings 24h</span>
              <span class="kpi-value">${r.severity_24h.warning ?? 0}</span>
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
            ${this._sources.length === 0 ? n`<p class="status">
                  Noch keine Quellen erfasst. Sobald die erste Nachricht reinkommt,
                  erscheint sie hier.
                </p>` : n`<ul class="sources">
                  ${this._sources.map(
      (t) => n`<li><code>${t}</code></li>`
    )}
                </ul>`}
          </div>
        </section>

        <section>
          <h2>Heatmap (Stunde × Wochentag, letzte 30 Tage)</h2>
          <div class="card">${this._renderHeatmap()}</div>
        </section>

        <section>
          <h2>Top-10 Quellen (30 Tage)</h2>
          <div class="card">
            ${this._topSources.length === 0 ? n`<p class="muted">Keine Daten.</p>` : n`<table class="top">
                  <thead>
                    <tr><th>Source</th><th>Nachrichten</th></tr>
                  </thead>
                  <tbody>
                    ${this._topSources.map(
      (t) => n`<tr>
                        <td><code>${t.source}</code></td>
                        <td>${t.count.toLocaleString("de-DE")}</td>
                      </tr>`
    )}
                  </tbody>
                </table>`}
          </div>
        </section>
      </div>
    `;
  }
};
N.styles = k`
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
    .heatmap {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-x: auto;
    }
    .heatmap-header,
    .heatmap-row {
      display: grid;
      grid-template-columns: 30px repeat(24, 1fr);
      gap: 2px;
      align-items: center;
      min-width: 540px;
    }
    .day-label,
    .hour-label {
      font-size: 0.7em;
      color: var(--secondary-text-color, #888);
      text-align: center;
    }
    .heatmap-cell {
      aspect-ratio: 1;
      border-radius: 2px;
      background: var(--secondary-background-color, #f3f3f3);
      min-height: 14px;
    }
    .top {
      width: 100%;
      border-collapse: collapse;
    }
    .top th,
    .top td {
      text-align: left;
      padding: 6px 8px;
      border-bottom: 1px solid var(--divider-color, #eee);
      font-size: 0.9em;
    }
    .top th {
      font-size: 0.78em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color, #666);
    }
    .small {
      font-size: 0.78em;
    }
    .status {
      color: var(--secondary-text-color, #666);
      padding: 8px 0;
      margin: 0;
    }
  `;
K([
  b({ attribute: !1 })
], N.prototype, "api", 2);
K([
  d()
], N.prototype, "_stats", 2);
K([
  d()
], N.prototype, "_sources", 2);
K([
  d()
], N.prototype, "_heatmap", 2);
K([
  d()
], N.prototype, "_topSources", 2);
K([
  d()
], N.prototype, "_loading", 2);
N = K([
  $("stats-view")
], N);
var pr = Object.defineProperty, ur = Object.getOwnPropertyDescriptor, be = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? ur(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && pr(e, t, s), s;
};
let Y = class extends v {
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
    return n`
      <div class="root">
        <header>
          <h2>Audit-Log</h2>
          <button @click=${() => void this._load()}>↻ Aktualisieren</button>
        </header>
        <p class="hint">
          Letzte 200 administrativen Aktionen: Loeschen, Status-Aenderungen,
          Webhook-CRUD. Eintraege sind unveraenderlich.
        </p>
        ${this._loading ? n`<p class="status">lade…</p>` : this._items.length === 0 ? n`<p class="status">Noch keine Audit-Eintraege.</p>` : n`<table>
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
      (r) => n`<tr>
                      <td class="ts">${String(r.timestamp).replace("T", " ").replace(/\+00:00$/, "")}</td>
                      <td>${r.actor}</td>
                      <td><code>${r.action}</code></td>
                      <td>
                        ${r.target_type}${r.target_id ? n` #${r.target_id}` : ""}
                      </td>
                      <td>
                        ${r.details ? n`<code>${JSON.stringify(r.details)}</code>` : ""}
                      </td>
                    </tr>`
    )}
                </tbody>
              </table>`}
      </div>
    `;
  }
};
Y.styles = k`
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
be([
  b({ attribute: !1 })
], Y.prototype, "api", 2);
be([
  d()
], Y.prototype, "_items", 2);
be([
  d()
], Y.prototype, "_loading", 2);
Y = be([
  $("audit-view")
], Y);
var gr = Object.defineProperty, fr = Object.getOwnPropertyDescriptor, S = (r, e, t, a) => {
  for (var s = a > 1 ? void 0 : a ? fr(e, t) : e, i = r.length - 1, o; i >= 0; i--)
    (o = r[i]) && (s = (a ? o(e, t, s) : o(s)) || s);
  return a && s && gr(e, t, s), s;
};
const Je = "messagehub.filters", le = {
  severity: ["error", "warning", "info"],
  source: "",
  search: ""
};
let x = class extends v {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "messages", this._items = [], this._total = 0, this._loading = !1, this._selected = null, this._filters = this._loadFilters(), this._newCount = 0, this._testing = !1, this._toast = "", this._api = new St(), this._onSeverityChange = (r) => {
      this._filters = { ...this._filters, severity: r.detail.severities }, this._persistFilters(), this._reload();
    }, this._onSourceChange = (r) => {
      this._filters = { ...this._filters, source: r.detail.source }, this._persistFilters(), this._reload();
    }, this._onTimeRange = (r) => {
      this._filters = { ...this._filters, fromIso: r.detail.fromIso, toIso: r.detail.toIso }, this._persistFilters(), this._reload();
    }, this._onSelect = (r) => {
      this._selected = r.detail.msg;
    }, this._onDelete = async (r) => {
      try {
        await this._api.deleteMessage(r.detail.id), this._items = this._items.filter((e) => e.id !== r.detail.id), this._total = Math.max(0, this._total - 1), this._selected = null, this._showToast("Nachricht geloescht");
      } catch (e) {
        this._showToast(`Loeschen fehlgeschlagen: ${e.message}`);
      }
    };
  }
  firstUpdated() {
    var r;
    (r = this.hass) != null && r.auth && this._api.setAuth(this.hass.auth.data.access_token), this._reload(), this._subscribeLive();
  }
  disconnectedCallback() {
    var r;
    super.disconnectedCallback(), (r = this._unsubLive) == null || r.call(this);
  }
  async _subscribeLive() {
    var r, e;
    (e = (r = this.hass) == null ? void 0 : r.connection) != null && e.subscribeEvents && (this._unsubLive = await this.hass.connection.subscribeEvents((t) => {
      const a = t.data;
      this._matchesFilters(a) && (this._items = [a, ...this._items].slice(0, 200), this._total += 1, this._newCount += 1, window.setTimeout(() => this._newCount = Math.max(0, this._newCount - 1), 4e3));
    }, "messagehub_message_added"));
  }
  _matchesFilters(r) {
    return !(this._filters.severity.length && !this._filters.severity.includes(r.severity) || this._filters.source && r.source !== this._filters.source || this._filters.search && !r.text.toLowerCase().includes(this._filters.search.toLowerCase()));
  }
  _loadFilters() {
    try {
      const r = localStorage.getItem(Je);
      if (r) return { ...le, ...JSON.parse(r) };
    } catch {
    }
    return { ...le };
  }
  _persistFilters() {
    try {
      localStorage.setItem(Je, JSON.stringify(this._filters));
    } catch {
    }
  }
  _resetFilters() {
    this._filters = { ...le }, this._persistFilters(), this._reload();
  }
  async _reload() {
    this._loading = !0;
    try {
      const r = await this._api.listMessages({
        severity: this._filters.severity,
        source: this._filters.source || void 0,
        search: this._filters.search || void 0,
        from: this._filters.fromIso,
        to: this._filters.toIso,
        limit: 100
      });
      this._items = r.items, this._total = r.total;
    } catch (r) {
      this._showToast(`Laden fehlgeschlagen: ${r.message}`);
    } finally {
      this._loading = !1;
    }
  }
  async _bulkDelete(r) {
    if (this._total === 0) return;
    const e = r === "all" ? this._total : this._total, t = r === "all" ? `ALLE ${e} Nachrichten dauerhaft loeschen?` : `${e} gefilterte Nachrichten dauerhaft loeschen?`;
    if (window.confirm(t))
      try {
        const a = r === "all" ? {} : {
          severity: this._filters.severity,
          source: this._filters.source || void 0,
          search: this._filters.search || void 0,
          from: this._filters.fromIso,
          to: this._filters.toIso
        }, s = await this._api.deleteMessages(a);
        this._showToast(`${s} Nachrichten geloescht`), this._selected = null, await this._reload();
      } catch (a) {
        this._showToast(`Loeschen fehlgeschlagen: ${a.message}`);
      }
  }
  async _sendTestMessage() {
    var r;
    if (!((r = this.hass) != null && r.callService)) {
      this._showToast("Test nicht verfuegbar — hass.callService fehlt");
      return;
    }
    this._testing = !0;
    try {
      const e = ["info", "warning", "error", "info", "info"], t = ["pihole", "knx-bus", "backup-job", "test-script"], a = [
        "Demo-Nachricht aus dem Panel",
        "Test: DNS-Query erfolgreich",
        "Backup abgeschlossen, Dauer 12 min",
        "KNX 1/2/3 — Wohnzimmer Deckenlicht ein"
      ], s = (i) => Math.floor(Math.random() * i);
      await this.hass.callService("messagehub", "add_message", {
        severity: e[s(e.length)],
        source: t[s(t.length)],
        text: a[s(a.length)],
        metadata: { source_panel: !0, ts: (/* @__PURE__ */ new Date()).toISOString() }
      }), this._showToast("Test-Nachricht gesendet"), window.setTimeout(() => void this._reload(), 300);
    } catch (e) {
      this._showToast(`Service-Call fehlgeschlagen: ${e.message}`);
    } finally {
      this._testing = !1;
    }
  }
  _showToast(r) {
    this._toast = r, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  _debounceSearch(r) {
    this._debounceTimer && window.clearTimeout(this._debounceTimer), this._debounceTimer = window.setTimeout(() => {
      this._filters = { ...this._filters, search: r }, this._persistFilters(), this._reload();
    }, 300);
  }
  _hasActiveFilters() {
    return this._filters.severity.length !== le.severity.length || this._filters.source !== "" || this._filters.search !== "" || this._filters.fromIso !== void 0;
  }
  _exportUrl(r) {
    return this._api.exportUrl({
      severity: this._filters.severity,
      source: this._filters.source || void 0,
      search: this._filters.search || void 0,
      from: this._filters.fromIso,
      to: this._filters.toIso,
      limit: 1e4,
      format: r
    });
  }
  _renderEmptyMessages() {
    return n`
      <div class="empty">
        <h3>Noch keine Nachrichten ${this._hasActiveFilters() ? "fuer diese Filter" : ""}</h3>
        <p>
          ${this._hasActiveFilters() ? "Probiere weniger restriktive Filter oder setze sie zurueck." : "Sobald Nachrichten ueber Webhook, MQTT, Eventbus oder den Service messagehub.add_message reinkommen, erscheinen sie hier."}
        </p>
        <div class="empty-actions">
          ${this._hasActiveFilters() ? n`<button @click=${this._resetFilters}>Filter zuruecksetzen</button>` : null}
          <button class="primary" ?disabled=${this._testing} @click=${this._sendTestMessage}>
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
          @input=${(r) => {
      const e = r.target.value;
      this._debounceSearch(e);
    }}
        />
        <time-range-filter
          .fromIso=${this._filters.fromIso}
          .toIso=${this._filters.toIso}
          @change=${this._onTimeRange}
        ></time-range-filter>
        ${this._hasActiveFilters() ? n`<button class="filter-reset" @click=${this._resetFilters}>
              Filter loeschen
            </button>` : null}
      </div>

      <div class="status-bar">
        <span>
          ${this._loading ? "lade…" : `${this._items.length.toLocaleString("de-DE")} von ${this._total.toLocaleString("de-DE")}`}
          ${this._newCount > 0 ? n`<span class="new-badge"
                >+${this._newCount} neue</span
              >` : null}
        </span>
        <div class="status-actions">
          ${this._total > 0 ? n`<a
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
          ${this._total > 0 && this._hasActiveFilters() ? n`<button class="danger" @click=${() => this._bulkDelete("filter")}>
                Gefilterte loeschen
              </button>` : null}
          <button ?disabled=${this._testing} @click=${this._sendTestMessage}>
            ${this._testing ? "sende…" : "+ Test"}
          </button>
        </div>
      </div>

      ${this._items.length === 0 && !this._loading ? this._renderEmptyMessages() : n`<message-table
            .items=${this._items}
            @select=${this._onSelect}
          ></message-table>`}

      ${this._selected ? n`<detail-pane
            .msg=${this._selected}
            .api=${this._api}
            @close=${() => this._selected = null}
            @delete=${this._onDelete}
            @status-change=${() => void this._reload()}
            @error=${(r) => this._showToast(r.detail.message)}
          ></detail-pane>` : null}
    `;
  }
  render() {
    return n`
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
            ${this._tab === "messages" ? n`<button
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
          ${this._tab === "stats" ? n`<stats-view .api=${this._api}></stats-view>` : null}
          ${this._tab === "settings" ? n`<settings-view .api=${this._api}></settings-view>` : null}
          ${this._tab === "audit" ? n`<audit-view .api=${this._api}></audit-view>` : null}
        </main>

        ${this._toast ? n`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
};
x.styles = k`
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
S([
  b({ attribute: !1 })
], x.prototype, "hass", 2);
S([
  b({ type: Boolean })
], x.prototype, "narrow", 2);
S([
  b({ attribute: !1 })
], x.prototype, "panel", 2);
S([
  d()
], x.prototype, "_tab", 2);
S([
  d()
], x.prototype, "_items", 2);
S([
  d()
], x.prototype, "_total", 2);
S([
  d()
], x.prototype, "_loading", 2);
S([
  d()
], x.prototype, "_selected", 2);
S([
  d()
], x.prototype, "_filters", 2);
S([
  d()
], x.prototype, "_newCount", 2);
S([
  d()
], x.prototype, "_testing", 2);
S([
  d()
], x.prototype, "_toast", 2);
x = S([
  $("messagehub-panel")
], x);
export {
  x as MessageHubPanel
};
