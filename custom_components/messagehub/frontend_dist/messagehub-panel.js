/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Le = globalThis, Ze = Le.ShadowRoot && (Le.ShadyCSS === void 0 || Le.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Qe = Symbol(), lt = /* @__PURE__ */ new WeakMap();
let Bt = class {
  constructor(t, s, r) {
    if (this._$cssResult$ = !0, r !== Qe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = s;
  }
  get styleSheet() {
    let t = this.o;
    const s = this.t;
    if (Ze && t === void 0) {
      const r = s !== void 0 && s.length === 1;
      r && (t = lt.get(s)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), r && lt.set(s, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const as = (e) => new Bt(typeof e == "string" ? e : e + "", void 0, Qe), x = (e, ...t) => {
  const s = e.length === 1 ? e[0] : t.reduce((r, a, n) => r + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + e[n + 1], e[0]);
  return new Bt(s, e, Qe);
}, is = (e, t) => {
  if (Ze) e.adoptedStyleSheets = t.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of t) {
    const r = document.createElement("style"), a = Le.litNonce;
    a !== void 0 && r.setAttribute("nonce", a), r.textContent = s.cssText, e.appendChild(r);
  }
}, dt = Ze ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let s = "";
  for (const r of t.cssRules) s += r.cssText;
  return as(s);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ns, defineProperty: os, getOwnPropertyDescriptor: ls, getOwnPropertyNames: ds, getOwnPropertySymbols: cs, getPrototypeOf: hs } = Object, Ie = globalThis, ct = Ie.trustedTypes, ps = ct ? ct.emptyScript : "", us = Ie.reactiveElementPolyfillSupport, ye = (e, t) => e, ze = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? ps : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let s = e;
  switch (t) {
    case Boolean:
      s = e !== null;
      break;
    case Number:
      s = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        s = JSON.parse(e);
      } catch {
        s = null;
      }
  }
  return s;
} }, et = (e, t) => !ns(e, t), ht = { attribute: !0, type: String, converter: ze, reflect: !1, useDefault: !1, hasChanged: et };
Symbol.metadata ??= Symbol("metadata"), Ie.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let le = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, s = ht) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
      const r = Symbol(), a = this.getPropertyDescriptor(t, r, s);
      a !== void 0 && os(this.prototype, t, a);
    }
  }
  static getPropertyDescriptor(t, s, r) {
    const { get: a, set: n } = ls(this.prototype, t) ?? { get() {
      return this[s];
    }, set(o) {
      this[s] = o;
    } };
    return { get: a, set(o) {
      const c = a?.call(this);
      n?.call(this, o), this.requestUpdate(t, c, r);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? ht;
  }
  static _$Ei() {
    if (this.hasOwnProperty(ye("elementProperties"))) return;
    const t = hs(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(ye("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(ye("properties"))) {
      const s = this.properties, r = [...ds(s), ...cs(s)];
      for (const a of r) this.createProperty(a, s[a]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const s = litPropertyMetadata.get(t);
      if (s !== void 0) for (const [r, a] of s) this.elementProperties.set(r, a);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, r] of this.elementProperties) {
      const a = this._$Eu(s, r);
      a !== void 0 && this._$Eh.set(a, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const s = [];
    if (Array.isArray(t)) {
      const r = new Set(t.flat(1 / 0).reverse());
      for (const a of r) s.unshift(dt(a));
    } else t !== void 0 && s.push(dt(t));
    return s;
  }
  static _$Eu(t, s) {
    const r = s.attribute;
    return r === !1 ? void 0 : typeof r == "string" ? r : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
    for (const r of s.keys()) this.hasOwnProperty(r) && (t.set(r, this[r]), delete this[r]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return is(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, s, r) {
    this._$AK(t, r);
  }
  _$ET(t, s) {
    const r = this.constructor.elementProperties.get(t), a = this.constructor._$Eu(t, r);
    if (a !== void 0 && r.reflect === !0) {
      const n = (r.converter?.toAttribute !== void 0 ? r.converter : ze).toAttribute(s, r.type);
      this._$Em = t, n == null ? this.removeAttribute(a) : this.setAttribute(a, n), this._$Em = null;
    }
  }
  _$AK(t, s) {
    const r = this.constructor, a = r._$Eh.get(t);
    if (a !== void 0 && this._$Em !== a) {
      const n = r.getPropertyOptions(a), o = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : ze;
      this._$Em = a;
      const c = o.fromAttribute(s, n.type);
      this[a] = c ?? this._$Ej?.get(a) ?? c, this._$Em = null;
    }
  }
  requestUpdate(t, s, r, a = !1, n) {
    if (t !== void 0) {
      const o = this.constructor;
      if (a === !1 && (n = this[t]), r ??= o.getPropertyOptions(t), !((r.hasChanged ?? et)(n, s) || r.useDefault && r.reflect && n === this._$Ej?.get(t) && !this.hasAttribute(o._$Eu(t, r)))) return;
      this.C(t, s, r);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, s, { useDefault: r, reflect: a, wrapped: n }, o) {
    r && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, o ?? s ?? this[t]), n !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || r || (s = void 0), this._$AL.set(t, s)), a === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (s) {
      Promise.reject(s);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [a, n] of this._$Ep) this[a] = n;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [a, n] of r) {
        const { wrapped: o } = n, c = this[a];
        o !== !0 || this._$AL.has(a) || c === void 0 || this.C(a, void 0, n, c);
      }
    }
    let t = !1;
    const s = this._$AL;
    try {
      t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((r) => r.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(s);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((s) => s.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((s) => this._$ET(s, this[s])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
le.elementStyles = [], le.shadowRootOptions = { mode: "open" }, le[ye("elementProperties")] = /* @__PURE__ */ new Map(), le[ye("finalized")] = /* @__PURE__ */ new Map(), us?.({ ReactiveElement: le }), (Ie.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const tt = globalThis, pt = (e) => e, Oe = tt.trustedTypes, ut = Oe ? Oe.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Gt = "$lit$", K = `lit$${Math.random().toFixed(9).slice(2)}$`, jt = "?" + K, ms = `<${jt}>`, Z = document, xe = () => Z.createComment(""), $e = (e) => e === null || typeof e != "object" && typeof e != "function", st = Array.isArray, gs = (e) => st(e) || typeof e?.[Symbol.iterator] == "function", Ke = `[ 	
\f\r]`, _e = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, mt = /-->/g, gt = />/g, X = RegExp(`>|${Ke}(?:([^\\s"'>=/]+)(${Ke}*=${Ke}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ft = /'/g, vt = /"/g, Kt = /^(?:script|style|textarea|title)$/i, fs = (e) => (t, ...s) => ({ _$litType$: e, strings: t, values: s }), i = fs(1), Q = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), _t = /* @__PURE__ */ new WeakMap(), Y = Z.createTreeWalker(Z, 129);
function Vt(e, t) {
  if (!st(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ut !== void 0 ? ut.createHTML(t) : t;
}
const vs = (e, t) => {
  const s = e.length - 1, r = [];
  let a, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = _e;
  for (let c = 0; c < s; c++) {
    const h = e[c];
    let v, f, u = -1, p = 0;
    for (; p < h.length && (o.lastIndex = p, f = o.exec(h), f !== null); ) p = o.lastIndex, o === _e ? f[1] === "!--" ? o = mt : f[1] !== void 0 ? o = gt : f[2] !== void 0 ? (Kt.test(f[2]) && (a = RegExp("</" + f[2], "g")), o = X) : f[3] !== void 0 && (o = X) : o === X ? f[0] === ">" ? (o = a ?? _e, u = -1) : f[1] === void 0 ? u = -2 : (u = o.lastIndex - f[2].length, v = f[1], o = f[3] === void 0 ? X : f[3] === '"' ? vt : ft) : o === vt || o === ft ? o = X : o === mt || o === gt ? o = _e : (o = X, a = void 0);
    const w = o === X && e[c + 1].startsWith("/>") ? " " : "";
    n += o === _e ? h + ms : u >= 0 ? (r.push(v), h.slice(0, u) + Gt + h.slice(u) + K + w) : h + K + (u === -2 ? c : w);
  }
  return [Vt(e, n + (e[s] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
};
class ke {
  constructor({ strings: t, _$litType$: s }, r) {
    let a;
    this.parts = [];
    let n = 0, o = 0;
    const c = t.length - 1, h = this.parts, [v, f] = vs(t, s);
    if (this.el = ke.createElement(v, r), Y.currentNode = this.el.content, s === 2 || s === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (a = Y.nextNode()) !== null && h.length < c; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const u of a.getAttributeNames()) if (u.endsWith(Gt)) {
          const p = f[o++], w = a.getAttribute(u).split(K), m = /([.?@])?(.*)/.exec(p);
          h.push({ type: 1, index: n, name: m[2], strings: w, ctor: m[1] === "." ? bs : m[1] === "?" ? ws : m[1] === "@" ? ys : Fe }), a.removeAttribute(u);
        } else u.startsWith(K) && (h.push({ type: 6, index: n }), a.removeAttribute(u));
        if (Kt.test(a.tagName)) {
          const u = a.textContent.split(K), p = u.length - 1;
          if (p > 0) {
            a.textContent = Oe ? Oe.emptyScript : "";
            for (let w = 0; w < p; w++) a.append(u[w], xe()), Y.nextNode(), h.push({ type: 2, index: ++n });
            a.append(u[p], xe());
          }
        }
      } else if (a.nodeType === 8) if (a.data === jt) h.push({ type: 2, index: n });
      else {
        let u = -1;
        for (; (u = a.data.indexOf(K, u + 1)) !== -1; ) h.push({ type: 7, index: n }), u += K.length - 1;
      }
      n++;
    }
  }
  static createElement(t, s) {
    const r = Z.createElement("template");
    return r.innerHTML = t, r;
  }
}
function de(e, t, s = e, r) {
  if (t === Q) return t;
  let a = r !== void 0 ? s._$Co?.[r] : s._$Cl;
  const n = $e(t) ? void 0 : t._$litDirective$;
  return a?.constructor !== n && (a?._$AO?.(!1), n === void 0 ? a = void 0 : (a = new n(e), a._$AT(e, s, r)), r !== void 0 ? (s._$Co ??= [])[r] = a : s._$Cl = a), a !== void 0 && (t = de(e, a._$AS(e, t.values), a, r)), t;
}
class _s {
  constructor(t, s) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = s;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: s }, parts: r } = this._$AD, a = (t?.creationScope ?? Z).importNode(s, !0);
    Y.currentNode = a;
    let n = Y.nextNode(), o = 0, c = 0, h = r[0];
    for (; h !== void 0; ) {
      if (o === h.index) {
        let v;
        h.type === 2 ? v = new me(n, n.nextSibling, this, t) : h.type === 1 ? v = new h.ctor(n, h.name, h.strings, this, t) : h.type === 6 && (v = new xs(n, this, t)), this._$AV.push(v), h = r[++c];
      }
      o !== h?.index && (n = Y.nextNode(), o++);
    }
    return Y.currentNode = Z, a;
  }
  p(t) {
    let s = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(t, r, s), s += r.strings.length - 2) : r._$AI(t[s])), s++;
  }
}
class me {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, s, r, a) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = t, this._$AB = s, this._$AM = r, this.options = a, this._$Cv = a?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const s = this._$AM;
    return s !== void 0 && t?.nodeType === 11 && (t = s.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, s = this) {
    t = de(this, t, s), $e(t) ? t === d || t == null || t === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : t !== this._$AH && t !== Q && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : gs(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== d && $e(this._$AH) ? this._$AA.nextSibling.data = t : this.T(Z.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: s, _$litType$: r } = t, a = typeof r == "number" ? this._$AC(t) : (r.el === void 0 && (r.el = ke.createElement(Vt(r.h, r.h[0]), this.options)), r);
    if (this._$AH?._$AD === a) this._$AH.p(s);
    else {
      const n = new _s(a, this), o = n.u(this.options);
      n.p(s), this.T(o), this._$AH = n;
    }
  }
  _$AC(t) {
    let s = _t.get(t.strings);
    return s === void 0 && _t.set(t.strings, s = new ke(t)), s;
  }
  k(t) {
    st(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let r, a = 0;
    for (const n of t) a === s.length ? s.push(r = new me(this.O(xe()), this.O(xe()), this, this.options)) : r = s[a], r._$AI(n), a++;
    a < s.length && (this._$AR(r && r._$AB.nextSibling, a), s.length = a);
  }
  _$AR(t = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); t !== this._$AB; ) {
      const r = pt(t).nextSibling;
      pt(t).remove(), t = r;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class Fe {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, s, r, a, n) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = t, this.name = s, this._$AM = a, this.options = n, r.length > 2 || r[0] !== "" || r[1] !== "" ? (this._$AH = Array(r.length - 1).fill(new String()), this.strings = r) : this._$AH = d;
  }
  _$AI(t, s = this, r, a) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) t = de(this, t, s, 0), o = !$e(t) || t !== this._$AH && t !== Q, o && (this._$AH = t);
    else {
      const c = t;
      let h, v;
      for (t = n[0], h = 0; h < n.length - 1; h++) v = de(this, c[r + h], s, h), v === Q && (v = this._$AH[h]), o ||= !$e(v) || v !== this._$AH[h], v === d ? t = d : t !== d && (t += (v ?? "") + n[h + 1]), this._$AH[h] = v;
    }
    o && !a && this.j(t);
  }
  j(t) {
    t === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class bs extends Fe {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === d ? void 0 : t;
  }
}
class ws extends Fe {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== d);
  }
}
class ys extends Fe {
  constructor(t, s, r, a, n) {
    super(t, s, r, a, n), this.type = 5;
  }
  _$AI(t, s = this) {
    if ((t = de(this, t, s, 0) ?? d) === Q) return;
    const r = this._$AH, a = t === d && r !== d || t.capture !== r.capture || t.once !== r.once || t.passive !== r.passive, n = t !== d && (r === d || a);
    a && this.element.removeEventListener(this.name, this, r), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class xs {
  constructor(t, s, r) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = r;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    de(this, t);
  }
}
const $s = { I: me }, ks = tt.litHtmlPolyfillSupport;
ks?.(ke, me), (tt.litHtmlVersions ??= []).push("3.3.2");
const Ss = (e, t, s) => {
  const r = s?.renderBefore ?? t;
  let a = r._$litPart$;
  if (a === void 0) {
    const n = s?.renderBefore ?? null;
    r._$litPart$ = a = new me(t.insertBefore(xe(), n), n, void 0, s ?? {});
  }
  return a._$AI(e), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const rt = globalThis;
let y = class extends le {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Ss(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return Q;
  }
};
y._$litElement$ = !0, y.finalized = !0, rt.litElementHydrateSupport?.({ LitElement: y });
const Ts = rt.litElementPolyfillSupport;
Ts?.({ LitElement: y });
(rt.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Es = (e) => (t, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const As = { attribute: !0, type: String, converter: ze, reflect: !1, hasChanged: et }, Ps = (e = As, t, s) => {
  const { kind: r, metadata: a } = s;
  let n = globalThis.litPropertyMetadata.get(a);
  if (n === void 0 && globalThis.litPropertyMetadata.set(a, n = /* @__PURE__ */ new Map()), r === "setter" && ((e = Object.create(e)).wrapped = !0), n.set(s.name, e), r === "accessor") {
    const { name: o } = s;
    return { set(c) {
      const h = t.get.call(this);
      t.set.call(this, c), this.requestUpdate(o, h, e, !0, c);
    }, init(c) {
      return c !== void 0 && this.C(o, void 0, e, c), c;
    } };
  }
  if (r === "setter") {
    const { name: o } = s;
    return function(c) {
      const h = this[o];
      t.call(this, c), this.requestUpdate(o, h, e, !0, c);
    };
  }
  throw Error("Unsupported decorator location: " + r);
};
function b(e) {
  return (t, s) => typeof s == "object" ? Ps(e, t, s) : ((r, a, n) => {
    const o = a.hasOwnProperty(n);
    return a.constructor.createProperty(n, r), o ? Object.getOwnPropertyDescriptor(a, n) : void 0;
  })(e, t, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function l(e) {
  return b({ ...e, state: !0, attribute: !1 });
}
function k(e) {
  const t = Es(e);
  return (s, r) => customElements.get(e) ? s : t(s, r);
}
class Ds {
  constructor(t = "") {
    this.baseUrl = t, this.auth = null;
  }
  setAuth(t) {
    this.auth = { token: t };
  }
  headers() {
    const t = { "Content-Type": "application/json" };
    return this.auth && (t.Authorization = `Bearer ${this.auth.token}`), t;
  }
  async listMessages(t = {}) {
    const s = new URLSearchParams();
    t.severity?.length && s.set("severity", t.severity.join(",")), t.source && s.set("source", t.source), t.search && s.set("search", t.search), t.from && s.set("from", t.from), t.to && s.set("to", t.to), t.limit !== void 0 && s.set("limit", String(t.limit)), t.offset !== void 0 && s.set("offset", String(t.offset)), t.order && s.set("order", t.order), t.hideKnxRead && s.set("hide_knx_read", "1");
    const r = `${this.baseUrl}/api/messagehub/messages?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return await a.json();
  }
  async getMessage(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${t}`, {
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return await s.json();
  }
  async deleteMessage(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${t}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  async setMessageStatus(t, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/messages/${t}/status`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ status: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async setMessageSeverity(t, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/messages/${t}/severity`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ severity: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async getMessageTags(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/messages/${t}/tags`, {
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return (await s.json()).tags;
  }
  async addMessageTag(t, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/messages/${t}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tag: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()).tags;
  }
  async removeMessageTag(t, s) {
    const r = `${this.baseUrl}/api/messagehub/messages/${t}/tags?tag=${encodeURIComponent(s)}`, a = await fetch(r, { method: "DELETE", headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return (await a.json()).tags;
  }
  async getRunbookForSource(t, s) {
    const r = s ? `?fingerprint=${encodeURIComponent(s)}` : "", a = await fetch(
      `${this.baseUrl}/api/messagehub/runbook/${encodeURIComponent(t)}${r}`,
      { headers: this.headers() }
    );
    if (a.status === 404) return null;
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return await a.json();
  }
  async listAudit(t = 200) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/audit?limit=${t}`, {
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return (await s.json()).items;
  }
  async getKnxBusAnalysisState() {
    const t = await fetch(
      `${this.baseUrl}/api/messagehub/knx-stats/bus-analysis-state`,
      { headers: this.headers() }
    );
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return await t.json();
  }
  async setKnxBusAnalysisState(t) {
    const s = await fetch(
      `${this.baseUrl}/api/messagehub/knx-stats/bus-analysis-state`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({ enabled: t })
      }
    );
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async clearAuditLog() {
    const t = await fetch(`${this.baseUrl}/api/messagehub/audit`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}: ${await t.text()}`);
    return await t.json();
  }
  async discoverKnxFromProject() {
    const t = await fetch(`${this.baseUrl}/api/messagehub/knx-discovery`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return await t.json();
  }
  // Iter 47 (N4): intelligenter Abgleich mit Vorschau (apply=false) +
  // Anwendung (apply=true). Aenderungen siehe Backend-Doc-String.
  // Iter 56: Bulk-Patch fuer mehrere KNX-GAs in einem Request.
  // Iter G2: Frontend-seitiger Hard-Cap (200) + Auto-Chunking. Bei
  // sehr grossen Listen (z. B. ETS-Reimport) hatte ein einzelner POST
  // einen Body in der Megabyte-Region geschickt; HA-aiohttp sperrt
  // das ab und der Bulk-Edit wirkt nur teilweise. Backend-Cap liegt
  // bei 500 (BULK_MAX_ADDRESSES); wir gehen mit 200 vorsichtshalber
  // darunter, damit es zukunftssicher ist und der Server nie blockiert.
  async bulkPatchKnxAddresses(t, s) {
    let a = 0, n = 0;
    for (let o = 0; o < t.length; o += 200) {
      const c = t.slice(o, o + 200), h = await fetch(
        `${this.baseUrl}/api/messagehub/knx-addresses/bulk`,
        {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({ addresses: c, patch: s })
        }
      );
      if (!h.ok) throw new Error(`HTTP ${h.status}: ${await h.text()}`);
      const v = await h.json();
      a += v.updated, n += v.address_count;
    }
    return { updated: a, address_count: n };
  }
  async syncKnxProject(t, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses/sync`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ items: t, apply: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async listKnxAddresses() {
    const t = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return (await t.json()).items;
  }
  async upsertKnxAddress(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(t)
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async listChannels() {
    const t = await fetch(`${this.baseUrl}/api/messagehub/channels`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return (await t.json()).items;
  }
  async createChannel(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/channels`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(t)
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async updateChannel(t, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/channels/${t}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(s)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async deleteChannel(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/channels/${t}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  /**
   * F-001: Sendet eine Test-Nachricht ueber einen konfigurierten Channel.
   * Backend ist rate-limited (3 Versuche/Min/Channel; HTTP 429 bei Burst).
   */
  async testChannel(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/channels/${t}/test`, {
      method: "POST",
      headers: this.headers()
    });
    if (!s.ok) {
      const r = await s.text();
      throw new Error(`HTTP ${s.status}: ${r}`);
    }
    return await s.json();
  }
  async listMqttTopics() {
    const t = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return (await t.json()).items;
  }
  async createMqttTopic(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(t)
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async deleteMqttTopic(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics/${t}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  /**
   * F-002: MQTT-Topic ID-stabil aktualisieren. Backend-Endpoint
   * (Iter 83 / CR-4) stand seit langem bereit, Frontend-Methode
   * fehlte. Ohne Update-Pfad mussten User Loeschen + Neu-Anlegen,
   * was die ID veraenderte und Audit-/Findings-Bezuege brach.
   */
  async updateMqttTopic(t, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics/${t}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(s)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async listRemediationHooks() {
    const t = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return (await t.json()).items;
  }
  async createRemediationHook(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(t)
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
  }
  async deleteRemediationHook(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks/${t}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  /**
   * F-006: ID-stabiles Update eines Remediation-Hooks.
   * Erfordert vollstaendigen Payload (name, source_pattern, automation_id);
   * optionale Felder duerfen weggelassen werden.
   */
  async updateRemediationHook(t, s) {
    const r = await fetch(
      `${this.baseUrl}/api/messagehub/remediation-hooks/${t}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(s)
      }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async listHeartbeats() {
    const t = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return (await t.json()).items;
  }
  async upsertHeartbeat(t, s) {
    const r = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ source: t, expected_interval_seconds: s })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  }
  /**
   * F-005: Entfernt einen Heartbeat-Eintrag dauerhaft.
   * 404, wenn die Source nicht (mehr) existiert.
   */
  async deleteHeartbeat(t) {
    const s = await fetch(
      `${this.baseUrl}/api/messagehub/heartbeats/${encodeURIComponent(t)}`,
      { method: "DELETE", headers: this.headers() }
    );
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  /**
   * F-005: Pausiert/aktiviert das Tracking ohne den Eintrag zu loeschen.
   * False -> Heartbeat-Job ueberspringt diese Source.
   */
  async setHeartbeatEnabled(t, s) {
    const r = await fetch(
      `${this.baseUrl}/api/messagehub/heartbeats/${encodeURIComponent(t)}`,
      {
        method: "PATCH",
        headers: this.headers(),
        body: JSON.stringify({ enabled: s })
      }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  async getStatsExtended(t = 30) {
    const s = await fetch(
      `${this.baseUrl}/api/messagehub/stats-extended?days=${t}`,
      { headers: this.headers() }
    );
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return await s.json();
  }
  async deleteKnxAddress(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-addresses/${encodeURIComponent(t)}`, r = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  }
  async importKnxCsv(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ csv: t })
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return await s.json();
  }
  /**
   * F-011: Typisierter URL-Helfer fuer KNX-GA-Telegramm-Export.
   * Vorher hat stats-knx-view die URL inline zusammengebaut, was bei
   * GA-Adressen mit Slashes (1/2/3) ohne URL-Encoding einen 404
   * produziert haette. Diese Methode kapselt das encodeURIComponent
   * sicher und ist Vitest-getestet.
   */
  knxStatsGaExportUrl(t, s, r = {}) {
    const a = new URLSearchParams();
    return r.from && a.set("from", r.from), r.to && a.set("to", r.to), a.set("format", s), `${this.baseUrl}/api/messagehub/knx-stats/ga/${encodeURIComponent(t)}/export?${a.toString()}`;
  }
  exportUrl(t) {
    const s = new URLSearchParams();
    return t.severity?.length && s.set("severity", t.severity.join(",")), t.source && s.set("source", t.source), t.search && s.set("search", t.search), t.from && s.set("from", t.from), t.to && s.set("to", t.to), s.set("format", t.format ?? "jsonl"), t.limit !== void 0 && s.set("limit", String(t.limit)), `${this.baseUrl}/api/messagehub/export?${s.toString()}`;
  }
  async deleteMessages(t = {}) {
    const s = new URLSearchParams();
    t.severity?.length && s.set("severity", t.severity.join(",")), t.source && s.set("source", t.source), t.search && s.set("search", t.search), t.from && s.set("from", t.from), t.to && s.set("to", t.to);
    const r = `${this.baseUrl}/api/messagehub/messages?${s.toString()}`, a = await fetch(r, { method: "DELETE", headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return (await a.json()).deleted;
  }
  async listSources() {
    const t = await fetch(`${this.baseUrl}/api/messagehub/sources`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return (await t.json()).sources;
  }
  async getStats() {
    const t = await fetch(`${this.baseUrl}/api/messagehub/stats`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return await t.json();
  }
  async listWebhooks() {
    const t = await fetch(`${this.baseUrl}/api/messagehub/webhooks`, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return (await t.json()).webhooks;
  }
  async createWebhook(t) {
    const s = await fetch(`${this.baseUrl}/api/messagehub/webhooks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(t)
    });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  async updateWebhook(t, s) {
    const r = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${t}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(s)
      }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async deleteWebhook(t) {
    const s = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${t}`,
      { method: "DELETE", headers: this.headers() }
    );
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
  }
  // --- KNX-Stats (Iter 6) ----------------------------------------------
  _knxStatsParams(t) {
    const s = new URLSearchParams();
    return t.from && s.set("from", t.from), t.to && s.set("to", t.to), t.limit !== void 0 && s.set("limit", String(t.limit)), t.minRate !== void 0 && s.set("min_rate", String(t.minRate)), t.includeAcknowledged === !1 && s.set("include_acknowledged", "false"), s;
  }
  async getKnxStatsSummary(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/summary?${this._knxStatsParams(t).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsTop(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/top?${this._knxStatsParams(t).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsTopBySource(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/top-by-source?${this._knxStatsParams(t).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsGaDetail(t, s) {
    const r = `${this.baseUrl}/api/messagehub/knx-stats/ga/${encodeURIComponent(t)}?${this._knxStatsParams(s).toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsSourceDetail(t, s) {
    const r = `${this.baseUrl}/api/messagehub/knx-stats/source/${encodeURIComponent(t)}?${this._knxStatsParams(s).toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  /** Iter L1.3 (Sprint Recommendations): Geraete-Empfehlung. */
  async getKnxStatsSourceRecommendation(t, s) {
    const r = `${this.baseUrl}/api/messagehub/knx-stats/source/${encodeURIComponent(t)}/recommendation?${this._knxStatsParams(s).toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  /** Iter L2.4: Geraete-Profil pflegen. */
  async getKnxDevice(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-devices/${encodeURIComponent(t)}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async putKnxDevice(t, s) {
    const r = `${this.baseUrl}/api/messagehub/knx-devices/${encodeURIComponent(t)}`, a = await fetch(r, {
      method: "PUT",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify(s)
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async deleteKnxDevice(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-devices/${encodeURIComponent(t)}`, r = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!r.ok && r.status !== 404)
      throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  /** Iter L4.3: LLM-Settings lesen. */
  async getKnxRecommendLlmSettings() {
    const t = `${this.baseUrl}/api/messagehub/knx-recommend/llm-settings`, s = await fetch(t, { headers: this.headers() });
    if (!s.ok) throw new Error(`HTTP ${s.status}: ${await s.text()}`);
    return await s.json();
  }
  /** Iter L4.3: LLM-Settings speichern. */
  async putKnxRecommendLlmSettings(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-recommend/llm-settings`, r = await fetch(s, {
      method: "PUT",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify(t)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  /** Iter UX-4: LLM-Provider-Verbindungstest. */
  async testKnxRecommendLlm(t = {}) {
    const s = `${this.baseUrl}/api/messagehub/knx-recommend/llm-test`, r = await fetch(s, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify(t)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsTimeline(t) {
    const s = this._knxStatsParams(t);
    s.set("gas", t.gas.join(",")), t.bucketMinutes !== void 0 && s.set("bucket", String(t.bucketMinutes));
    const r = `${this.baseUrl}/api/messagehub/knx-stats/timeline?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async acknowledgeKnxGa(t, s = {}) {
    const r = { ga: t };
    s.note !== void 0 && (r.note = s.note), s.expiryDays !== void 0 && (r.expiry_days = s.expiryDays);
    const a = await fetch(`${this.baseUrl}/api/messagehub/knx-stats/acknowledge`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(r)
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async getKnxStatsAlarms(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/alarms?${this._knxStatsParams(t).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  /** Iter 92 / K1: Saved Filters listen. */
  async listSavedFilters(t) {
    const s = `${this.baseUrl}/api/messagehub/saved-filters?scope=${encodeURIComponent(t)}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return (await r.json()).items;
  }
  /** Iter 92 / K1: Saved Filter speichern (upsert). */
  async upsertSavedFilter(t, s, r) {
    const a = `${this.baseUrl}/api/messagehub/saved-filters`, n = await fetch(a, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ name: t, scope: s, filters: r })
    });
    if (!n.ok) throw new Error(`HTTP ${n.status}: ${await n.text()}`);
    return await n.json();
  }
  /** Iter 92 / K1: Saved Filter loeschen. */
  async deleteSavedFilter(t) {
    const s = `${this.baseUrl}/api/messagehub/saved-filters/${t}`, r = await fetch(s, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  /** Iter 91 / WR-G: GA-Heatmap (Top-N GAs x Zeit-Buckets). */
  async getKnxStatsHeatmap(t, s = 10, r = 60) {
    const a = this._knxStatsParams(t);
    a.set("top_n", String(s)), a.set("bucket", String(r));
    const n = `${this.baseUrl}/api/messagehub/knx-stats/heatmap?${a.toString()}`, o = await fetch(n, { headers: this.headers() });
    if (!o.ok) throw new Error(`HTTP ${o.status}: ${await o.text()}`);
    return await o.json();
  }
  /** Iter 67 / WR-I: Trend-Vergleich aktueller Periode vs. Vorperiode. */
  async getKnxStatsTrend(t, s = 5) {
    const r = this._knxStatsParams(t);
    r.set("top_n", String(s));
    const a = `${this.baseUrl}/api/messagehub/knx-stats/trend?${r.toString()}`, n = await fetch(a, { headers: this.headers() });
    if (!n.ok) throw new Error(`HTTP ${n.status}: ${await n.text()}`);
    return await n.json();
  }
  async getKnxStatsOrphans(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/orphans?${this._knxStatsParams(t).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsSilence(t) {
    const s = this._knxStatsParams(t);
    t.maxSilenceMinutes !== void 0 && s.set("max_silence_min", String(t.maxSilenceMinutes));
    const r = `${this.baseUrl}/api/messagehub/knx-stats/silence?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsBusHealth(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/bus-health?${this._knxStatsParams(t).toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async getKnxStatsBusload(t, s) {
    const r = this._knxStatsParams(t);
    s && Number.isFinite(s) && s > 0 && r.set("bucket_seconds", String(Math.trunc(s)));
    const a = `${this.baseUrl}/api/messagehub/knx-stats/busload?${r.toString()}`, n = await fetch(a, { headers: this.headers() });
    if (!n.ok) throw new Error(`HTTP ${n.status}: ${await n.text()}`);
    return await n.json();
  }
  async getKnxStatsHealthScore(t) {
    const s = this._knxStatsParams(t), r = `${this.baseUrl}/api/messagehub/knx-stats/health-score?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async getKnxStatsLongTerm(t, s = "auto") {
    const r = this._knxStatsParams(t);
    s !== "auto" && r.set("bucket", s);
    const a = `${this.baseUrl}/api/messagehub/knx-stats/long-term?${r.toString()}`, n = await fetch(a, { headers: this.headers() });
    if (!n.ok) throw new Error(`HTTP ${n.status}: ${await n.text()}`);
    return await n.json();
  }
  async getKnxStatsBursts(t, s = {}) {
    const r = this._knxStatsParams(t);
    s.windowSeconds && Number.isFinite(s.windowSeconds) && r.set("window_seconds", String(Math.trunc(s.windowSeconds))), s.thresholdPct && Number.isFinite(s.thresholdPct) && r.set("threshold_pct", String(s.thresholdPct));
    const a = `${this.baseUrl}/api/messagehub/knx-stats/bursts?${r.toString()}`, n = await fetch(a, { headers: this.headers() });
    if (!n.ok) throw new Error(`HTTP ${n.status}: ${await n.text()}`);
    return await n.json();
  }
  async getKnxStatsSensitiveLog(t) {
    const s = this._knxStatsParams(t), r = `${this.baseUrl}/api/messagehub/knx-stats/sensitive-log?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async setKnxStatsSensitive(t, s) {
    const r = `${this.baseUrl}/api/messagehub/knx-stats/sensitive/${encodeURIComponent(t)}`, a = await fetch(r, {
      method: s ? "POST" : "DELETE",
      headers: this.headers()
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
  }
  async unacknowledgeKnxGa(t) {
    const s = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge/${encodeURIComponent(t)}`, r = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  }
  // ----- Iter 6/7/8 (knx-findings): Findings-Endpoints --------------------
  async listFindings(t = {}) {
    const s = new URLSearchParams();
    t.code && s.set("code", t.code), t.ga && s.set("ga", t.ga), t.severity && s.set("severity", t.severity), t.source && s.set("source", t.source), t.limit !== void 0 && s.set("limit", String(t.limit)), t.offset !== void 0 && s.set("offset", String(t.offset));
    const r = `${this.baseUrl}/api/messagehub/findings?${s.toString()}`, a = await fetch(r, { headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return await a.json();
  }
  async acknowledgeFinding(t) {
    const s = `${this.baseUrl}/api/messagehub/findings/ack`, r = await fetch(s, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(t)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async unacknowledgeFinding(t, s) {
    const r = `${this.baseUrl}/api/messagehub/findings/ack/${encodeURIComponent(t)}/${encodeURIComponent(s)}`, a = await fetch(r, { method: "DELETE", headers: this.headers() });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async listSeverityOverrides() {
    const t = `${this.baseUrl}/api/messagehub/findings/severity-overrides`, s = await fetch(t, { headers: this.headers() });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return await s.json();
  }
  async setSeverityOverride(t, s, r) {
    const a = `${this.baseUrl}/api/messagehub/findings/severity-overrides/${encodeURIComponent(t)}`, n = { severity: s };
    r !== void 0 && (n.note = r);
    const o = await fetch(a, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(n)
    });
    if (!o.ok) throw new Error(`HTTP ${o.status}: ${await o.text()}`);
    return await o.json();
  }
  async clearSeverityOverride(t) {
    const s = `${this.baseUrl}/api/messagehub/findings/severity-overrides/${encodeURIComponent(t)}`, r = await fetch(s, { method: "DELETE", headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return await r.json();
  }
  async exportFindingsMarkdown() {
    const t = `${this.baseUrl}/api/messagehub/findings/export.md`, s = await fetch(t, { headers: this.headers() });
    if (!s.ok) throw new Error(`HTTP ${s.status}`);
    return await s.text();
  }
  async refreshFindings(t, s = 7) {
    const r = `${this.baseUrl}/api/messagehub/findings/refresh`, a = await fetch(r, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ ga: t, period_days: s })
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}: ${await a.text()}`);
    return await a.json();
  }
  async acknowledgeKnxBulk(t, s = {}) {
    const r = new URLSearchParams();
    s.from && r.set("from", s.from), s.to && r.set("to", s.to);
    const a = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge-bulk?${r.toString()}`, n = { dev_source: t };
    s.note !== void 0 && (n.note = s.note), s.expiryDays !== void 0 && (n.expiry_days = s.expiryDays);
    const o = await fetch(a, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(n)
    });
    if (!o.ok) throw new Error(`HTTP ${o.status}: ${await o.text()}`);
    return await o.json();
  }
}
const L = x`
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
`, W = x`
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
`, Me = x`
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
`, ge = x`
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
`, ae = x`
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
class Ls {
  constructor(t, s, r) {
    this._conn = t, this._eventType = s, this._onEvent = r, this._unsub = null, this._stopped = !1, this._readyHandler = null, this._resubscribing = !1;
  }
  async start() {
    this._stopped || (await this._subscribeNow(), typeof this._conn.addEventListener == "function" && (this._readyHandler = (t) => {
      t !== "ready" && t !== void 0 || this._stopped || this._resubscribing || this._resubscribe();
    }, this._conn.addEventListener("ready", this._readyHandler)));
  }
  async stop() {
    if (this._stopped = !0, this._readyHandler !== null && typeof this._conn.removeEventListener == "function" && this._conn.removeEventListener("ready", this._readyHandler), this._readyHandler = null, this._unsub !== null) {
      try {
        this._unsub();
      } catch {
      }
      this._unsub = null;
    }
  }
  async _subscribeNow() {
    if (this._conn.subscribeEvents !== void 0)
      try {
        const t = await this._conn.subscribeEvents(
          this._onEvent,
          this._eventType
        );
        this._unsub = t;
      } catch (t) {
        console.warn("LiveSubscription subscribe failed", t);
      }
  }
  async _resubscribe() {
    this._resubscribing = !0;
    try {
      if (this._unsub !== null) {
        try {
          this._unsub();
        } catch {
        }
        this._unsub = null;
      }
      await this._subscribeNow();
    } finally {
      this._resubscribing = !1;
    }
  }
}
function zs(e) {
  const { key: t, versionKey: s, currentVersion: r, defaults: a, migrate: n } = e;
  let o = null, c = null;
  try {
    const v = localStorage.getItem(t);
    v && (o = JSON.parse(v)), c = localStorage.getItem(s);
  } catch {
    return { ...a };
  }
  if (o === null)
    return { ...a };
  let h = o;
  if (n && c !== r) {
    h = n(o, c);
    try {
      localStorage.setItem(t, JSON.stringify({ ...a, ...h })), localStorage.setItem(s, r);
    } catch {
    }
  } else if (c !== r)
    try {
      localStorage.setItem(s, r);
    } catch {
    }
  return { ...a, ...h };
}
function Os(e, t) {
  const { key: s, versionKey: r, currentVersion: a } = e;
  try {
    localStorage.setItem(s, JSON.stringify(t)), localStorage.setItem(r, a);
  } catch {
  }
}
const Ns = /* @__PURE__ */ new Set([
  "messages",
  "settings",
  "stats",
  "audit"
]), Rs = /* @__PURE__ */ new Map([
  // Backwards-Compat: ``#findings`` ist Alias fuer ``#stats/findings``.
  ["findings", { top: "stats", sub: "findings" }]
]);
function Wt(e) {
  const t = e.startsWith("#") ? e.slice(1) : e, s = t.indexOf("?"), r = s === -1 ? t : t.slice(0, s), a = s === -1 ? "" : t.slice(s + 1), n = new URLSearchParams(a), o = Rs.get(r);
  if (o !== void 0)
    return { top: o.top, sub: o.sub, query: n };
  const c = r.indexOf("/"), h = c === -1 ? r : r.slice(0, c), v = c === -1 ? "" : r.slice(c + 1);
  return Ns.has(h) ? { top: h, sub: v, query: n } : { top: "messages", sub: "", query: n };
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Cs = { CHILD: 2 }, Is = (e) => (...t) => ({ _$litDirective$: e, values: t });
let Fs = class {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, s, r) {
    this._$Ct = t, this._$AM = s, this._$Ci = r;
  }
  _$AS(t, s) {
    return this.update(t, s);
  }
  update(t, s) {
    return this.render(...s);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: Ms } = $s, bt = (e) => e, wt = () => document.createComment(""), be = (e, t, s) => {
  const r = e._$AA.parentNode, a = t === void 0 ? e._$AB : t._$AA;
  if (s === void 0) {
    const n = r.insertBefore(wt(), a), o = r.insertBefore(wt(), a);
    s = new Ms(n, o, e, e.options);
  } else {
    const n = s._$AB.nextSibling, o = s._$AM, c = o !== e;
    if (c) {
      let h;
      s._$AQ?.(e), s._$AM = e, s._$AP !== void 0 && (h = e._$AU) !== o._$AU && s._$AP(h);
    }
    if (n !== a || c) {
      let h = s._$AA;
      for (; h !== n; ) {
        const v = bt(h).nextSibling;
        bt(r).insertBefore(h, a), h = v;
      }
    }
  }
  return s;
}, J = (e, t, s = e) => (e._$AI(t, s), e), Hs = {}, Us = (e, t = Hs) => e._$AH = t, Bs = (e) => e._$AH, Ve = (e) => {
  e._$AR(), e._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const yt = (e, t, s) => {
  const r = /* @__PURE__ */ new Map();
  for (let a = t; a <= s; a++) r.set(e[a], a);
  return r;
}, Gs = Is(class extends Fs {
  constructor(e) {
    if (super(e), e.type !== Cs.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(e, t, s) {
    let r;
    s === void 0 ? s = t : t !== void 0 && (r = t);
    const a = [], n = [];
    let o = 0;
    for (const c of e) a[o] = r ? r(c, o) : o, n[o] = s(c, o), o++;
    return { values: n, keys: a };
  }
  render(e, t, s) {
    return this.dt(e, t, s).values;
  }
  update(e, [t, s, r]) {
    const a = Bs(e), { values: n, keys: o } = this.dt(t, s, r);
    if (!Array.isArray(a)) return this.ut = o, n;
    const c = this.ut ??= [], h = [];
    let v, f, u = 0, p = a.length - 1, w = 0, m = n.length - 1;
    for (; u <= p && w <= m; ) if (a[u] === null) u++;
    else if (a[p] === null) p--;
    else if (c[u] === o[w]) h[w] = J(a[u], n[w]), u++, w++;
    else if (c[p] === o[m]) h[m] = J(a[p], n[m]), p--, m--;
    else if (c[u] === o[m]) h[m] = J(a[u], n[m]), be(e, h[m + 1], a[u]), u++, m--;
    else if (c[p] === o[w]) h[w] = J(a[p], n[w]), be(e, a[u], a[p]), p--, w++;
    else if (v === void 0 && (v = yt(o, w, m), f = yt(c, u, p)), v.has(c[u])) if (v.has(c[p])) {
      const T = f.get(o[w]), ve = T !== void 0 ? a[T] : null;
      if (ve === null) {
        const Pe = be(e, a[u]);
        J(Pe, n[w]), h[w] = Pe;
      } else h[w] = J(ve, n[w]), be(e, a[u], ve), a[T] = null;
      w++;
    } else Ve(a[p]), p--;
    else Ve(a[u]), u++;
    for (; w <= m; ) {
      const T = be(e, h[m + 1]);
      J(T, n[w]), h[w++] = T;
    }
    for (; u <= p; ) {
      const T = a[u++];
      T !== null && Ve(T);
    }
    return this.ut = o, Us(e, h), Q;
  }
}), js = new Intl.RelativeTimeFormat("de", { numeric: "auto" }), Ks = [
  { unit: "year", seconds: 31536e3 },
  { unit: "month", seconds: 2592e3 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 }
];
function qt(e, t = /* @__PURE__ */ new Date()) {
  const s = new Date(e);
  if (Number.isNaN(s.getTime())) return "—";
  const r = Math.round((s.getTime() - t.getTime()) / 1e3), a = Math.abs(r);
  if (a < 5) return "gerade eben";
  for (const { unit: n, seconds: o } of Ks)
    if (a >= o) {
      const c = Math.round(r / o);
      return js.format(c, n);
    }
  return "gerade eben";
}
function Xt(e, t = /* @__PURE__ */ new Date()) {
  const s = new Date(e);
  if (Number.isNaN(s.getTime())) return e;
  const r = s.getFullYear() === t.getFullYear() && s.getMonth() === t.getMonth() && s.getDate() === t.getDate(), a = s.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  return r ? a : `${s.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} ${a}`;
}
var Vs = Object.defineProperty, Ws = Object.getOwnPropertyDescriptor, Te = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Ws(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && Vs(t, s, a), a;
};
const xt = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·"
}, $t = {
  error: "Error",
  warning: "Warn",
  info: "Info",
  debug: "Debug"
}, qs = ["error", "warning", "info", "debug"];
let ee = class extends y {
  constructor() {
    super(...arguments), this.items = [], this._now = /* @__PURE__ */ new Date(), this._editSeverityFor = null, this._popoverPos = null, this._onClick = (e) => {
      this.dispatchEvent(
        new CustomEvent("select", { detail: { msg: e }, bubbles: !0, composed: !0 })
      );
    }, this._onKey = (e, t) => {
      (e.key === "Enter" || e.key === " ") && (e.preventDefault(), this._onClick(t));
    }, this._onSeverityClick = (e, t) => {
      if (e.stopPropagation(), e.preventDefault(), this._editSeverityFor === t.id) {
        this._closePopover();
        return;
      }
      const r = e.currentTarget.getBoundingClientRect(), a = 200, n = r.bottom + a < window.innerHeight;
      this._popoverPos = {
        top: n ? r.bottom + 4 : r.top - a - 4,
        left: r.left
      }, this._editSeverityFor = t.id;
    }, this._onSeverityPick = (e, t, s, r) => {
      e.stopPropagation(), this._closePopover(), r !== s && this.dispatchEvent(
        new CustomEvent("severity-change", {
          detail: { id: t, severity: r, previous: s },
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
    const e = this.items.find((r) => r.id === this._editSeverityFor);
    if (!e) return i``;
    const t = e.severity ?? "info", s = e.id;
    return i`
      <div class="popover-backdrop" @click=${() => this._closePopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._popoverPos.top}px; left: ${this._popoverPos.left}px`}
        @click=${(r) => r.stopPropagation()}
      >
        ${qs.map(
      (r) => i`<button
            role="menuitemradio"
            aria-checked=${r === t}
            class=${`sev-option ${r === t ? "active" : ""}`}
            @click=${(a) => this._onSeverityPick(a, s, t, r)}
          >
            <span class=${`mh-pill mh-pill--${r}`}>
              <span class="sev-icon" aria-hidden="true">${xt[r]}</span>
              ${$t[r]}
            </span>
            ${r === t ? i`<span class="check" aria-hidden="true">✓</span>` : d}
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
          ${Gs(
      this.items,
      (e) => e.id,
      (e) => {
        const t = e.severity ?? "info", s = $t[t] ?? t, r = xt[t] ?? "·", a = qt(e.timestamp, this._now), n = Xt(e.timestamp, this._now);
        return i`
                <div
                  class=${`row sev-${t} ${this._editSeverityFor === e.id ? "row-active" : ""}`}
                  tabindex="0"
                  role="listitem button"
                  @click=${() => this._onClick(e)}
                  @keydown=${(o) => this._onKey(o, e)}
                >
                  <span class="col-sev">
                    <button
                      class=${`mh-pill mh-pill--${t} sev-trigger`}
                      title="Severity ändern"
                      aria-haspopup="menu"
                      aria-expanded=${this._editSeverityFor === e.id}
                      @click=${(o) => this._onSeverityClick(o, e)}
                    >
                      <span class="sev-icon" aria-hidden="true">${r}</span>
                      ${s}
                      <span class="caret" aria-hidden="true">▾</span>
                    </button>
                  </span>
                  <span class="col-ts ts" title=${n}>${a}</span>
                  <span class="col-src">
                    <span class="source-pill">${e.source}</span>
                  </span>
                  <span class="col-text text">${e.text}</span>
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
ee.styles = [
  L,
  ae,
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
Te([
  b({ attribute: !1 })
], ee.prototype, "items", 2);
Te([
  l()
], ee.prototype, "_now", 2);
Te([
  l()
], ee.prototype, "_editSeverityFor", 2);
Te([
  l()
], ee.prototype, "_popoverPos", 2);
ee = Te([
  k("message-table")
], ee);
var Xs = Object.defineProperty, Js = Object.getOwnPropertyDescriptor, Jt = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Js(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && Xs(t, s, a), a;
};
const kt = ["error", "warning", "info", "debug"];
let Ne = class extends y {
  constructor() {
    super(...arguments), this.selected = [...kt];
  }
  _toggle(e) {
    const t = this.selected.includes(e) ? this.selected.filter((s) => s !== e) : [...this.selected, e];
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { severities: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return i`
      <div class="chips" role="group" aria-label="Severity-Filter">
        ${kt.map((e) => {
      const t = this.selected.includes(e);
      return i`<button
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
};
Ne.styles = [
  L,
  x`
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
Jt([
  b({ attribute: !1 })
], Ne.prototype, "selected", 2);
Ne = Jt([
  k("severity-filter")
], Ne);
var Ys = Object.defineProperty, Zs = Object.getOwnPropertyDescriptor, He = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Zs(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && Ys(t, s, a), a;
};
let ce = class extends y {
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
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { source: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return i`
      <select @change=${this._onChange} .value=${this.selected}>
        <option value="">Alle Quellen</option>
        ${this._sources.map((e) => i`<option value=${e}>${e}</option>`)}
      </select>
    `;
  }
};
ce.styles = x`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `;
He([
  b({ attribute: !1 })
], ce.prototype, "api", 2);
He([
  b({ attribute: !1 })
], ce.prototype, "selected", 2);
He([
  l()
], ce.prototype, "_sources", 2);
ce = He([
  k("source-filter")
], ce);
var Qs = Object.defineProperty, er = Object.getOwnPropertyDescriptor, at = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? er(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && Qs(t, s, a), a;
};
let Se = class extends y {
  _set(e) {
    let t;
    const s = /* @__PURE__ */ new Date();
    e === "1h" ? t = new Date(s.getTime() - 36e5).toISOString() : e === "24h" ? t = new Date(s.getTime() - 864e5).toISOString() : e === "7d" ? t = new Date(s.getTime() - 7 * 864e5).toISOString() : t = void 0, this.dispatchEvent(
      new CustomEvent("change", {
        detail: { fromIso: t, toIso: void 0 },
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
Se.styles = x`
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
at([
  b({ attribute: !1 })
], Se.prototype, "fromIso", 2);
at([
  b({ attribute: !1 })
], Se.prototype, "toIso", 2);
Se = at([
  k("time-range-filter")
], Se);
var tr = Object.defineProperty, sr = Object.getOwnPropertyDescriptor, q = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? sr(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && tr(t, s, a), a;
};
let M = class extends y {
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
        await this.api.setMessageStatus(this.msg.id, e), this._status = e;
        try {
          const t = await this.api.getMessage(this.msg.id);
          this.msg = t, this.dispatchEvent(
            new CustomEvent("message-updated", {
              detail: { msg: t },
              bubbles: !0,
              composed: !0
            })
          );
        } catch (t) {
          this.dispatchEvent(
            new CustomEvent("error", {
              detail: { message: t.message },
              bubbles: !0,
              composed: !0
            })
          );
        }
        this.dispatchEvent(
          new CustomEvent("status-change", {
            detail: { id: this.msg.id, status: e },
            bubbles: !0,
            composed: !0
          })
        );
      } catch (t) {
        this.dispatchEvent(
          new CustomEvent("error", {
            detail: { message: t.message },
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
    confirm(`Nachricht #${this.msg.id} endgültig löschen?`) && this.dispatchEvent(
      new CustomEvent("delete", {
        detail: { id: this.msg.id },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _statusBadge() {
    const e = {
      new: "Neu",
      acknowledged: "Bestätigt",
      resolved: "Gelöst",
      expired: "Abgelaufen"
    };
    return i`<span class=${`status-badge status-${this._status}`}>
      ${e[this._status] ?? this._status}
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
              <pre class="meta">${JSON.stringify(this.msg.metadata, null, 2)}</pre>` : d}

        <h3>Tags</h3>
        <div class="tags">
          ${this._tags.length === 0 ? i`<span class="hint">keine Tags</span>` : this._tags.map(
      (e) => i`
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
                `
    )}
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

        ${this._runbook ? i`<h3>Runbook: ${this._runbook.title}</h3>
              <pre class="runbook">${this._runbook.markdown}</pre>` : d}

        <footer>
          <button class="del" @click=${this._delete}>Löschen</button>
        </footer>
      </aside>
    `;
  }
};
M.styles = x`
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
q([
  b({ attribute: !1 })
], M.prototype, "msg", 2);
q([
  b({ attribute: !1 })
], M.prototype, "api", 2);
q([
  l()
], M.prototype, "_status", 2);
q([
  l()
], M.prototype, "_tags", 2);
q([
  l()
], M.prototype, "_newTag", 2);
q([
  l()
], M.prototype, "_runbook", 2);
q([
  l()
], M.prototype, "_busy", 2);
M = q([
  k("detail-pane")
], M);
var rr = Object.defineProperty, ar = Object.getOwnPropertyDescriptor, U = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? ar(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && rr(t, s, a), a;
};
const ir = ["debug", "info", "warning", "error"], nr = JSON.stringify(
  {
    severity: "$.level",
    source: "$.app.name",
    text: "$.message",
    metadata: "$.extra"
  },
  null,
  2
), We = /^[a-z0-9._-]{1,64}$/;
function or(e) {
  return e.toLowerCase().normalize("NFKD").replaceAll(/[äÄ]/g, "ae").replaceAll(/[öÖ]/g, "oe").replaceAll(/[üÜ]/g, "ue").replaceAll(/ß/g, "ss").replaceAll(/[\s/\\]+/g, "-").replaceAll(/[^a-z0-9._-]/g, "").slice(0, 64);
}
let N = class extends y {
  constructor() {
    super(...arguments), this.editing = null, this._name = "", this._source = "", this._severity = "info", this._enabled = !0, this._mappingText = "", this._error = "", this._saving = !1;
  }
  willUpdate(e) {
    if (e.has("editing")) {
      const t = this.editing;
      this._name = t?.name ?? "", this._source = t?.default_source ?? "", this._severity = t?.default_severity ?? "info", this._enabled = t?.enabled ?? !0, this._mappingText = t?.field_map ? JSON.stringify(t.field_map, null, 2) : "", this._error = "";
    }
  }
  _validateMapping() {
    if (!this._mappingText.trim()) return null;
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
        if (!this._name.trim()) throw new Error("Name darf nicht leer sein");
        if (!We.test(this._source))
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
        }), this.dispatchEvent(
          new CustomEvent("saved", {
            detail: { webhook: t },
            bubbles: !0,
            composed: !0
          })
        );
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
    this._mappingText = nr;
  }
  render() {
    const e = this.editing !== null;
    return i`
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
              ${this._source && We.test(this._source) ? i`<span class="ok-badge" title="ok">✓</span>` : null}
            </span>
            <input
              type="text"
              class=${this._source && !We.test(this._source) ? "invalid" : ""}
              .value=${this._source}
              @input=${(t) => {
      const s = t.target.value;
      this._source = or(s);
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
              ${ir.map(
      (t) => i`<option value=${t} ?selected=${this._severity === t}>${t}</option>`
    )}
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

        ${this._error ? i`<div class="error">${this._error}</div>` : null}

        <div class="actions">
          <button class="primary" ?disabled=${this._saving} @click=${this._save}>
            ${this._saving ? "speichere…" : e ? "Speichern" : "Anlegen"}
          </button>
          <button @click=${this._cancel}>Abbrechen</button>
        </div>
      </div>
    `;
  }
};
N.styles = x`
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
U([
  b({ attribute: !1 })
], N.prototype, "api", 2);
U([
  b({ attribute: !1 })
], N.prototype, "editing", 2);
U([
  l()
], N.prototype, "_name", 2);
U([
  l()
], N.prototype, "_source", 2);
U([
  l()
], N.prototype, "_severity", 2);
U([
  l()
], N.prototype, "_enabled", 2);
U([
  l()
], N.prototype, "_mappingText", 2);
U([
  l()
], N.prototype, "_error", 2);
U([
  l()
], N.prototype, "_saving", 2);
N = U([
  k("webhook-form")
], N);
var lr = Object.defineProperty, dr = Object.getOwnPropertyDescriptor, E = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? dr(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && lr(t, s, a), a;
};
const cr = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/, Xe = ["debug", "info", "warning", "error"], St = [...Xe, "auto"], Yt = "messagehub.knx-addresses.only-enabled";
function hr() {
  try {
    const e = localStorage.getItem(Yt);
    return e === null ? !0 : e === "1" || e === "true";
  } catch {
    return !0;
  }
}
const pr = /^[\s\-_=]*$/, we = 200;
let $ = class extends y {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._filter = "", this._onlyEnabled = hr(), this._hidePlaceholders = !0, this._displayedCount = we, this._selected = /* @__PURE__ */ new Set(), this._bulkSeverityValue = "warning", this._bulkActionRunning = !1, this._newAddr = "", this._newLabel = "", this._newDpt = "", this._sevPopoverFor = null, this._sevPopoverPos = null, this._discovery = [], this._discoveryStatus = "loading", this._editing = null, this._toast = "", this._error = "";
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
    if (this._discoveryStatus === "ok" && this._discovery.length > 0) return null;
    const t = {
      loading: "🔄 Lade KNX-Projekt-Daten…",
      no_knx_integration: "ℹ️ Keine KNX-Integration in HA gefunden. Lege erst die KNX-Integration unter Einstellungen → Geräte & Dienste an, dann erscheinen die GAs hier automatisch.",
      no_project_loaded: "ℹ️ KNX-Integration ist da, aber kein ETS-Projekt hochgeladen. Lade dein .knxproj in der KNX-Integration unter Konfigurieren → Projekt hoch.",
      project_empty: "ℹ️ ETS-Projekt enthält keine Gruppenadressen — pruefe den Export."
    }[this._discoveryStatus] ?? `Status: ${this._discoveryStatus}`;
    return i`<div class="discovery-status">${t}</div>`;
  }
  _onAddressInput(e) {
    const t = e.target.value;
    this._newAddr = t;
    const s = this._discovery.find((r) => r.address === t);
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
    let e;
    try {
      e = await this.api.syncKnxProject(this._discovery, !1);
    } catch (r) {
      this._showToast(r.message);
      return;
    }
    const t = e.counts;
    if (t.add === 0 && t.update === 0 && t.delete === 0) {
      this._showToast("Projekt ist bereits synchron — nichts zu tun");
      return;
    }
    const s = `Abgleich mit ETS-Projekt anwenden?

${t.add} neue Einträge anlegen
${t.update} Einträge aktualisieren (label/dpt geändert → Logging-Konfig wird zurückgesetzt)
${t.delete} Einträge löschen (in ETS nicht mehr vorhanden → Lauschen wird beendet)
${t.keep} unveränderte Einträge bleiben bestehen.`;
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
    const e = this._newAddr.trim();
    if (!cr.test(e)) {
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
        // Iter 44 (N2): Default-Severity Warning fuer neue Eintraege.
        log_severity: "warning"
      }), this._newAddr = "", this._newLabel = "", this._newDpt = "", this._showToast(`${e} gespeichert`), await this._load();
    } catch (t) {
      this._error = t.message;
    }
  }
  async _toggleLog(e) {
    if (!this.api) return;
    const t = !e.log_enabled;
    let s = e.log_severity;
    t && (s === "info" || !s) && (s = "warning");
    try {
      await this.api.upsertKnxAddress({
        ...e,
        log_enabled: t,
        log_severity: s
      }), await this._load();
      const r = this._items.find((n) => n.address === e.address), a = !!r?.log_enabled;
      r !== void 0 && a !== t ? this._showToast(
        "Backend hat log_enabled nicht gesetzt — Browser-Cache leeren (Cmd+Shift+R) und HA-Container neu starten"
      ) : this._showToast(
        t ? `${e.address} im Protokoll aktiv` : `${e.address} aus Protokoll entfernt`
      );
    } catch (r) {
      this._showToast(r.message);
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
    const r = e.currentTarget.getBoundingClientRect(), a = 220, n = r.bottom + a < window.innerHeight;
    this._sevPopoverPos = {
      top: n ? r.bottom + 4 : r.top - a - 4,
      left: r.left
    }, this._sevPopoverFor = t.address;
  }
  async _onSeverityPick(e, t, s) {
    if (e.stopPropagation(), this._closeSevPopover(), s === t.log_severity || !this.api) return;
    const r = {
      address: t.address,
      log_severity: s
    };
    s === "auto" && (r.severity_on_true = t.severity_on_true ?? "warning", r.severity_on_false = t.severity_on_false ?? "info");
    const a = t.log_severity;
    this._items = this._items.map(
      (n) => n.address === t.address ? {
        ...n,
        log_severity: s,
        severity_on_true: r.severity_on_true ?? n.severity_on_true,
        severity_on_false: r.severity_on_false ?? n.severity_on_false
      } : n
    );
    try {
      await this.api.upsertKnxAddress({ ...t, ...r }), this._showToast(`${t.address}: Severity ${a} → ${s}`);
    } catch (n) {
      this._items = this._items.map(
        (o) => o.address === t.address ? { ...o, log_severity: a } : o
      ), this._showToast(`Fehlgeschlagen: ${n.message}`);
    }
  }
  _renderSevPopover() {
    if (this._sevPopoverFor === null || this._sevPopoverPos === null) return d;
    const e = this._items.find((s) => s.address === this._sevPopoverFor);
    if (!e) return d;
    const t = e.log_severity;
    return i`
      <div class="sev-backdrop" @click=${() => this._closeSevPopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._sevPopoverPos.top}px; left: ${this._sevPopoverPos.left}px`}
        @click=${(s) => s.stopPropagation()}
      >
        ${St.map(
      (s) => i`<button
            role="menuitemradio"
            aria-checked=${s === t}
            class=${`sev-option ${s === t ? "active" : ""}`}
            @click=${(r) => void this._onSeverityPick(r, e, s)}
          >
            <span
              class=${`mh-pill mh-pill--${s === "auto" ? "neutral" : s}`}
            >${s}</span>
            ${s === t ? i`<span class="sev-check" aria-hidden="true">✓</span>` : d}
          </button>`
    )}
      </div>
    `;
  }
  async _onCsvFile(e) {
    const t = e.target.files?.[0];
    if (!t || !this.api) return;
    const s = await t.text();
    try {
      const r = await this.api.importKnxCsv(s);
      this._showToast(
        `Import: ${r.imported} angelegt, ${r.skipped} übersprungen, ${r.errors} Fehler`
      ), await this._load();
    } catch (r) {
      this._showToast(`Import fehlgeschlagen: ${r.message}`);
    } finally {
      e.target.value = "";
    }
  }
  _showToast(e) {
    this._toast = e, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  // Iter 56b: Bulk-Toolbar erscheint, sobald >=1 GA ausgewaehlt ist.
  // Drei Aktionen: Loggen an, Loggen aus, Severity setzen. Auswahl
  // wird nach Erfolg geleert; bei Fehlern bleibt sie damit der User
  // nochmal probieren kann.
  _renderBulkToolbar() {
    const e = this._selected.size;
    return i`
      <div class="bulk-toolbar" role="toolbar" aria-label="Bulk-Aktionen">
        <span class="bulk-toolbar__count">${e} ausgewaehlt</span>
        <button
          class="mh-btn mh-btn--sm"
          ?disabled=${this._bulkActionRunning}
          @click=${() => void this._bulkApply({ log_enabled: !0 })}
          title=${`${e} GAs zum Logging aktivieren`}
        >
          Loggen aktivieren
        </button>
        <button
          class="mh-btn mh-btn--sm"
          ?disabled=${this._bulkActionRunning}
          @click=${() => void this._bulkApply({ log_enabled: !1 })}
          title=${`${e} GAs vom Logging entfernen`}
        >
          Loggen deaktivieren
        </button>
        <label class="bulk-toolbar__sev">
          <span>Severity:</span>
          <select
            .value=${this._bulkSeverityValue}
            @change=${(t) => this._bulkSeverityValue = t.target.value}
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
  _toggleSelect(e) {
    const t = new Set(this._selected);
    t.has(e) ? t.delete(e) : t.add(e), this._selected = t;
  }
  _toggleSelectAllVisible(e) {
    const t = e.every((r) => this._selected.has(r)), s = new Set(this._selected);
    if (t)
      for (const r of e) s.delete(r);
    else
      for (const r of e) s.add(r);
    this._selected = s;
  }
  _clearSelection() {
    this._selected = /* @__PURE__ */ new Set();
  }
  async _bulkApply(e) {
    if (!this.api || this._selected.size === 0 || this._bulkActionRunning) return;
    const t = Array.from(this._selected);
    this._bulkActionRunning = !0;
    try {
      const s = await this.api.bulkPatchKnxAddresses(t, e);
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
    let e = this._items;
    this._onlyEnabled && (e = e.filter((s) => !!s.log_enabled)), this._hidePlaceholders && (e = e.filter(
      (s) => !!s.log_enabled || !pr.test(s.label || "")
    ));
    const t = this._filter.trim().toLowerCase();
    return t ? e.filter(
      (s) => s.address.includes(t) || s.label.toLowerCase().includes(t) || (s.dpt ?? "").toLowerCase().includes(t)
    ) : e;
  }
  _renderEditor() {
    if (!this._editing) return d;
    const e = this._editing, t = (s) => {
      this._editing = { ...e, ...s };
    };
    return i`
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

          ${e.log_enabled ? i`
                <label>
                  <span>Severity</span>
                  <select
                    .value=${e.log_severity}
                    @change=${(s) => {
      const r = s.target.value;
      t({ log_severity: r });
    }}
                  >
                    ${St.map(
      (s) => i`<option value=${s}>${s}</option>`
    )}
                  </select>
                  <small>
                    <code>auto</code> nutzt für Boolean-DPTs (1.x) die
                    Severity-Map unten — z. B. für Stör-Bits, die bei
                    <code>True</code> einen Fehler bedeuten.
                  </small>
                </label>
                ${e.log_severity === "auto" ? i`<div class="row-2">
                      <label>
                        <span>Severity bei <code>True</code></span>
                        <select
                          .value=${e.severity_on_true ?? "warning"}
                          @change=${(s) => t({
      severity_on_true: s.target.value
    })}
                        >
                          ${Xe.map(
      (s) => i`<option value=${s}>${s}</option>`
    )}
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
                          ${Xe.map(
      (s) => i`<option value=${s}>${s}</option>`
    )}
                        </select>
                      </label>
                    </div>` : d}
              ` : d}

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
    const e = this._filtered(), t = e.slice(0, this._displayedCount), s = e.length > t.length, r = this._items.filter((a) => a.log_enabled).length;
    return i`
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
            ${this._discovery.length > 0 ? i`<button
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
      (a) => i`<option value=${a.address}>
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
        ${this._discovery.length > 0 ? i`<p class="hint">
              💡 Tipp: Beim Tippen in das GA-Feld erscheinen Vorschläge aus dem
              ETS-Projekt — Label und DPT werden dann automatisch vorbefüllt.
            </p>` : null}
        ${this._renderDiscoveryStatus()}
        ${this._error ? i`<div class="error">${this._error}</div>` : d}

        <div class="filter-bar">
          <input
            type="search"
            class="mh-input"
            placeholder="Suche (GA / Label / DPT)…"
            .value=${this._filter}
            @input=${(a) => {
      this._filter = a.target.value, this._displayedCount = we;
    }}
          />
          <label class="toggle">
            <input
              type="checkbox"
              .checked=${this._onlyEnabled}
              @change=${(a) => {
      this._onlyEnabled = a.target.checked, this._displayedCount = we;
      try {
        localStorage.setItem(
          Yt,
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
      this._hidePlaceholders = a.target.checked, this._displayedCount = we;
    }}
            />
            <span>Platzhalter ausblenden</span>
          </label>
          <span class="muted">
            ${t.length} sichtbar${s ? i` von ${e.length}` : d}
          </span>
        </div>

        ${this._loading ? i`<p class="muted">lade…</p>` : t.length === 0 ? i`<div class="empty">
                ${this._items.length === 0 ? i`<p>
                      Noch keine Adressen. Lege oben den ersten Eintrag an oder
                      importiere eine ETS-CSV.
                    </p>` : this._onlyEnabled && r === 0 ? i`<p>
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
                        ${r} davon aktiv).
                      </p>`}
              </div>` : i`
                ${this._selected.size > 0 ? this._renderBulkToolbar() : d}
                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th class="col-select">
                          <input
                            type="checkbox"
                            aria-label="Alle sichtbaren auswaehlen"
                            .checked=${t.length > 0 && t.every((a) => this._selected.has(a.address))}
                            @change=${() => this._toggleSelectAllVisible(
      t.map((a) => a.address)
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
                      ${t.map(
      (a) => i`
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
                              ${a.dpt ? i`<code class="dpt">${a.dpt}</code>` : i`<span class="muted">—</span>`}
                            </td>
                            <td>
                              ${a.log_enabled ? i`<button
                                    class=${`mh-pill mh-pill--${a.log_severity === "auto" ? "neutral" : a.log_severity} sev-trigger`}
                                    title="Severity ändern"
                                    aria-haspopup="menu"
                                    aria-expanded=${this._sevPopoverFor === a.address}
                                    @click=${(n) => this._onSeverityTrigger(n, a)}
                                  >
                                    <span class="mh-pill__dot"></span>
                                    ${a.log_severity}${a.log_severity === "auto" ? i` <small class="auto-detail"
                                          >T:${a.severity_on_true ?? "warning"}
                                          / F:${a.severity_on_false ?? "info"}</small
                                        >` : d}
                                    <span class="sev-caret" aria-hidden="true">▾</span>
                                  </button>` : i`<!-- Iter 60 / U8: bei inaktiven GAs
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
                  ${s ? i`<div class="load-more">
                        <button
                          class="mh-btn"
                          @click=${() => this._displayedCount = Math.min(
      this._displayedCount + we,
      e.length
    )}
                        >
                          Mehr laden (${e.length - t.length} weitere)
                        </button>
                        <button
                          class="mh-btn mh-btn--ghost"
                          @click=${() => this._displayedCount = e.length}
                        >
                          Alle ${e.length} zeigen
                        </button>
                      </div>` : d}
                </div>
              `}

        ${this._renderEditor()}
        ${this._renderSevPopover()}
        ${this._toast ? i`<div class="toast">${this._toast}</div>` : d}
      </section>
    `;
  }
};
$.styles = [
  L,
  W,
  Me,
  ae,
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
E([
  b({ attribute: !1 })
], $.prototype, "api", 2);
E([
  l()
], $.prototype, "_items", 2);
E([
  l()
], $.prototype, "_loading", 2);
E([
  l()
], $.prototype, "_filter", 2);
E([
  l()
], $.prototype, "_onlyEnabled", 2);
E([
  l()
], $.prototype, "_hidePlaceholders", 2);
E([
  l()
], $.prototype, "_displayedCount", 2);
E([
  l()
], $.prototype, "_selected", 2);
E([
  l()
], $.prototype, "_bulkSeverityValue", 2);
E([
  l()
], $.prototype, "_bulkActionRunning", 2);
E([
  l()
], $.prototype, "_newAddr", 2);
E([
  l()
], $.prototype, "_newLabel", 2);
E([
  l()
], $.prototype, "_newDpt", 2);
E([
  l()
], $.prototype, "_sevPopoverFor", 2);
E([
  l()
], $.prototype, "_sevPopoverPos", 2);
E([
  l()
], $.prototype, "_discovery", 2);
E([
  l()
], $.prototype, "_discoveryStatus", 2);
E([
  l()
], $.prototype, "_editing", 2);
E([
  l()
], $.prototype, "_toast", 2);
E([
  l()
], $.prototype, "_error", 2);
$ = E([
  k("knx-addresses-view")
], $);
var ur = Object.defineProperty, mr = Object.getOwnPropertyDescriptor, R = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? mr(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && ur(t, s, a), a;
};
let z = class extends y {
  constructor() {
    super(...arguments), this._settings = null, this._loading = !0, this._saving = !1, this._error = "", this._draft = {
      enabled: !1,
      base_url: "",
      model: ""
    }, this._apiKeyEdit = !1, this._info = "", this._testing = !1, this._testResult = null, this._testError = "";
  }
  async firstUpdated() {
    await this._reload();
  }
  async _reload() {
    if (!this.api) {
      this._error = "API-Client fehlt", this._loading = !1;
      return;
    }
    this._loading = !0, this._error = "";
    try {
      this._settings = await this.api.getKnxRecommendLlmSettings(), this._draft = {
        enabled: this._settings.enabled,
        base_url: this._settings.base_url,
        model: this._settings.model,
        timeout_s: this._settings.timeout_s,
        max_tokens: this._settings.max_tokens,
        system_prompt_override: this._effectiveSystemPrompt(this._settings)
      }, this._apiKeyEdit = !this._settings.api_key_set;
    } catch (e) {
      this._error = e.message;
    } finally {
      this._loading = !1;
    }
  }
  // Iter UX-7: Wenn der User noch keinen Override gespeichert hat, das
  // Editor-Feld mit dem Default-Prompt vom Backend vorbefuellen — damit
  // hat der User einen Startpunkt zum Anpassen, statt vor leerer Box
  // sitzen zu muessen.
  _effectiveSystemPrompt(e) {
    const t = e.system_prompt_override ?? "";
    return t.trim() ? t : e.default_system_prompt ?? "";
  }
  // Iter UX-7: Reset-Knopf — verwirft die Edits am System-Prompt und
  // setzt das Textfeld auf den Default zurueck. Speichern muss der
  // User selbst (UI-only Operation).
  _resetSystemPrompt() {
    this._settings && (this._draft = {
      ...this._draft,
      system_prompt_override: this._settings.default_system_prompt ?? ""
    });
  }
  async _save() {
    if (this.api) {
      this._saving = !0, this._error = "", this._info = "";
      try {
        const e = {
          enabled: this._draft.enabled,
          base_url: this._draft.base_url,
          model: this._draft.model,
          timeout_s: this._draft.timeout_s,
          max_tokens: this._draft.max_tokens,
          system_prompt_override: this._draft.system_prompt_override
        };
        this._apiKeyEdit && (e.api_key = this._draft.api_key ?? ""), this._settings = await this.api.putKnxRecommendLlmSettings(e), this._draft = {
          enabled: this._settings.enabled,
          base_url: this._settings.base_url,
          model: this._settings.model,
          timeout_s: this._settings.timeout_s,
          max_tokens: this._settings.max_tokens,
          system_prompt_override: this._effectiveSystemPrompt(this._settings)
        }, this._apiKeyEdit = !1, this._info = "Einstellungen gespeichert.";
      } catch (e) {
        this._error = e.message;
      } finally {
        this._saving = !1;
      }
    }
  }
  _setDraft(e, t) {
    this._draft = { ...this._draft, [e]: t };
  }
  // Iter UX-4: Test-Aufruf gegen den konfigurierten Provider — der
  // Endpoint persistiert nichts, der Test laeuft auch ohne zuvor
  // gespeicherte Werte.
  async _testConnection() {
    if (!this.api || this._testing) return;
    this._testing = !0, this._testResult = null, this._testError = "";
    const e = {
      base_url: this._draft.base_url,
      model: this._draft.model,
      timeout_s: this._draft.timeout_s,
      max_tokens: this._draft.max_tokens,
      system_prompt_override: this._draft.system_prompt_override
    };
    this._apiKeyEdit && (e.api_key = this._draft.api_key ?? "");
    try {
      this._testResult = await this.api.testKnxRecommendLlm(e);
    } catch (t) {
      this._testError = t.message;
    } finally {
      this._testing = !1;
    }
  }
  // Iter UX-6: Legende unter dem System-Prompt-Override — User sieht
  // genau welche Variablen ihm im Prompt zur Verfuegung stehen und
  // welches Antwort-Schema der Service erwartet. Kein Hover-Tooltip,
  // sondern ein dauerhaft sichtbarer Reference-Block.
  _renderPromptLegend() {
    return i`
      <details class="llm-legend" data-test="llm-prompt-legend">
        <summary>
          <strong>Legende:</strong> uebergebene Werte &amp; erwartetes
          Antwort-Schema
        </summary>
        <div class="llm-legend__cols">
          <section>
            <h4>Eingabe an das LLM</h4>
            <p class="muted small">
              Diese Felder werden bei jedem Call mitgesendet
              (Whitelist-sanitiert, max 80 Zeichen pro String):
            </p>
            <dl>
              <dt><code>DPT</code></dt>
              <dd>KNX-Datapoint-Type, z. B. <code>9.001</code></dd>
              <dt><code>Hersteller</code></dt>
              <dd>aus ETS-Discovery oder User-Override</dd>
              <dt><code>Modell</code></dt>
              <dd>aus ETS-Discovery oder User-Override</dd>
              <dt><code>observed_mode</code></dt>
              <dd>
                <code>cyclic</code> / <code>on_change</code> /
                <code>hybrid</code> (runtime-Klassifikation)
              </dd>
              <dt><code>median_interval_minutes</code></dt>
              <dd>Median-Sendeintervall der GA, numerisch</dd>
              <dt><code>sample_count</code></dt>
              <dd>Anzahl Telegramme im Beobachtungsfenster</dd>
            </dl>
            <p class="muted small">
              <strong>Nicht uebermittelt:</strong> GA-Adresse,
              Source-IA, Telegramm-Werte, GA-Bezeichnung, Last-Seen.
            </p>
          </section>

          <section>
            <h4>Erwartete Antwort (JSON)</h4>
            <p class="muted small">
              Antwort-Schema bleibt zwingend, auch beim Override —
              sonst wird die Antwort verworfen.
            </p>
            <pre><code>{
  "mode": "on_change" | "cyclic" | "hybrid",
  "cycle_minutes_min": null | int,
  "cycle_minutes_max": null | int,
  "hysteresis": null | string,
  "max_rate_per_min": float,
  "rationale": string
}</code></pre>
            <dl>
              <dt><code>mode</code></dt>
              <dd>empfohlener Sende-Modus (Pflicht)</dd>
              <dt><code>cycle_minutes_min</code> / <code>_max</code></dt>
              <dd>
                Heartbeat-Korridor in Minuten;
                <code>null</code> bei reinem <code>on_change</code>
              </dd>
              <dt><code>hysteresis</code></dt>
              <dd>
                menschen-lesbarer Hinweis (z. B.
                <code>"&gt;= 0.5 K"</code>); <code>null</code> bei
                Boolean-DPTs
              </dd>
              <dt><code>max_rate_per_min</code></dt>
              <dd>Sanity-Cap fuer die Telegrammrate</dd>
              <dt><code>rationale</code></dt>
              <dd>kurze WHY-Begruendung (max 2 Saetze)</dd>
            </dl>
          </section>
        </div>
      </details>
    `;
  }
  _renderTestResult() {
    if (this._testing)
      return i`<p class="muted small">Teste Verbindung…</p>`;
    if (this._testError !== "")
      return i`<p class="mh-error">${this._testError}</p>`;
    const e = this._testResult;
    if (e === null) return i``;
    if (e.ok && e.response !== null) {
      const t = e.response.cycle_minutes_min !== null && e.response.cycle_minutes_max !== null ? `${e.response.cycle_minutes_min}–${e.response.cycle_minutes_max} Min` : "—";
      return i`<div class="llm-test-result llm-test-result--ok">
        <strong>✓ Verbindung erfolgreich</strong>
        <span class="muted small">Latenz: ${e.latency_ms} ms</span>
        <details>
          <summary>Antwort des Modells</summary>
          <dl>
            <dt>Modus</dt>
            <dd>${e.response.mode}</dd>
            <dt>Sendezyklus</dt>
            <dd>${t}</dd>
            <dt>Hysterese</dt>
            <dd>${e.response.hysteresis ?? "—"}</dd>
            <dt>Max-Rate</dt>
            <dd>${e.response.max_rate_per_min} /Min</dd>
            <dt>Begründung</dt>
            <dd>${e.response.rationale}</dd>
          </dl>
        </details>
      </div>`;
    }
    return i`<div class="llm-test-result llm-test-result--err">
      <strong>✗ Test fehlgeschlagen</strong>
      ${e.error ? i`<p>${e.error}</p>` : i`<p>Keine Antwort vom Provider.</p>`}
      ${e.error_category ? i`<p class="muted small">Kategorie: ${e.error_category}</p>` : d}
    </div>`;
  }
  _applyPreset(e) {
    const t = {
      openai: {
        base_url: "https://api.openai.com/v1",
        model: "gpt-4o-mini"
      },
      azure: {
        base_url: "https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT",
        model: "gpt-4o-mini"
      },
      ollama: {
        base_url: "http://localhost:11434/v1",
        model: "llama3.2"
      },
      groq: {
        base_url: "https://api.groq.com/openai/v1",
        model: "llama-3.3-70b-versatile"
      }
    };
    this._draft = { ...this._draft, ...t[e] };
  }
  render() {
    return this._loading ? i`<p class="muted">Lade Einstellungen…</p>` : i`
      <section class="llm-section mh-card">
        <header>
          <h2>KI-Empfehlungen (Layer 4)</h2>
          <p class="muted">
            Optional: ein externes LLM gibt Sende-Modus-Empfehlungen
            fuer Geraete, deren DPT/Modell die Empfehlungs-Engine
            nicht kennt. <strong>Default: deaktiviert.</strong>
            Funktioniert mit allen OpenAI-Chat-Completions-kompatiblen
            Anbietern (OpenAI, Azure, Ollama, Groq, LiteLLM-Gateway, …).
          </p>
        </header>

        ${this._error ? i`<p class="mh-error">${this._error}</p>` : d}
        ${this._info ? i`<p class="muted small">${this._info}</p>` : d}

        <div class="llm-form">
          <div class="toggle-row">
            <input
              type="checkbox"
              id="llm-enabled"
              .checked=${this._draft.enabled}
              ?disabled=${this._saving}
              @change=${(e) => this._setDraft(
      "enabled",
      e.target.checked
    )}
            />
            <label for="llm-enabled">
              <strong>KI-Empfehlungen aktivieren</strong>
            </label>
          </div>

          ${this._draft.enabled ? i`<div class="llm-warning">
                Bei jedem geoeffneten Source-Detail-Drawer kann der
                Provider angefragt werden — das verursacht Kosten +
                Latenz. Cache (30 Tage TTL) reduziert wiederholte Calls.
              </div>` : d}

          <div class="llm-presets">
            <span class="help">Voreinstellung:</span>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving}
              @click=${() => this._applyPreset("openai")}
            >OpenAI</button>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving}
              @click=${() => this._applyPreset("azure")}
            >Azure</button>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving}
              @click=${() => this._applyPreset("ollama")}
            >Ollama (lokal)</button>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving}
              @click=${() => this._applyPreset("groq")}
            >Groq</button>
          </div>

          <label>
            <span>Base URL</span>
            <input
              type="url"
              placeholder="https://api.openai.com/v1"
              .value=${this._draft.base_url}
              ?disabled=${this._saving}
              @input=${(e) => this._setDraft(
      "base_url",
      e.target.value
    )}
            />
            <span class="help">
              Endpoint des Providers ohne <code>/chat/completions</code>.
              Erlaubt sind <code>http://</code> und <code>https://</code>.
            </span>
          </label>

          <label>
            <span>Modell</span>
            <input
              type="text"
              placeholder="gpt-4o-mini"
              .value=${this._draft.model}
              ?disabled=${this._saving}
              @input=${(e) => this._setDraft(
      "model",
      e.target.value
    )}
            />
            <span class="help">
              Modellname laut Provider-Dokumentation
              (z. B. <code>gpt-4o-mini</code>, <code>llama3.2</code>).
            </span>
          </label>

          <label>
            <span>API-Key</span>
            <div class="api-key-row">
              ${this._apiKeyEdit ? i`<input
                    type="password"
                    placeholder="sk-..."
                    .value=${this._draft.api_key ?? ""}
                    ?disabled=${this._saving}
                    @input=${(e) => this._setDraft(
      "api_key",
      e.target.value
    )}
                  />` : i`<input
                    type="text"
                    disabled
                    .value=${this._settings?.api_key_set ? '[Schluessel gespeichert — unveraendert lassen oder "Aendern" klicken]' : "[kein Schluessel]"}
                  />`}
              <button
                type="button"
                class="mh-button mh-button--ghost"
                ?disabled=${this._saving}
                @click=${() => {
      this._apiKeyEdit = !this._apiKeyEdit, this._apiKeyEdit || (this._draft = { ...this._draft, api_key: void 0 });
    }}
              >
                ${this._apiKeyEdit ? "Abbrechen" : "Aendern"}
              </button>
            </div>
            <span class="help">
              Wird nur als Authorization-Header gesendet, niemals
              im Audit-Log oder in den Antworten ausgegeben.
            </span>
          </label>

          <label>
            <span>Timeout (Sekunden)</span>
            <input
              type="number"
              min="1"
              max="120"
              step="1"
              .value=${String(this._draft.timeout_s ?? 15)}
              ?disabled=${this._saving}
              @input=${(e) => this._setDraft(
      "timeout_s",
      Number(e.target.value)
    )}
            />
          </label>

          <label>
            <span>Max Tokens</span>
            <input
              type="number"
              min="100"
              max="4000"
              step="50"
              .value=${String(this._draft.max_tokens ?? 800)}
              ?disabled=${this._saving}
              @input=${(e) => this._setDraft(
      "max_tokens",
      Number(e.target.value)
    )}
            />
            <span class="help">Cap auf die Antwort-Tokens (Cost-Schutz).</span>
          </label>

          <label>
            <span>System-Prompt</span>
            <textarea
              .value=${this._draft.system_prompt_override ?? ""}
              ?disabled=${this._saving}
              @input=${(e) => this._setDraft(
      "system_prompt_override",
      e.target.value
    )}
            ></textarea>
            <div class="llm-prompt-actions">
              <button
                type="button"
                class="mh-button mh-button--ghost"
                ?disabled=${this._saving || this._draft.system_prompt_override === (this._settings?.default_system_prompt ?? "")}
                title="Setzt das Textfeld auf den Default-Prompt zurueck. Speichern muss der User selbst."
                @click=${() => this._resetSystemPrompt()}
              >
                Auf Default zuruecksetzen
              </button>
            </div>
            <span class="help">
              Vorbefuellt mit dem Default-Prompt. Anpassbar — gespeichert wird,
              was hier steht. Antwort-Schema bleibt zwingend (siehe "Erwartete
              Antwort" unten), sonst kann der Service die Antwort nicht parsen.
            </span>
          </label>

          ${this._renderPromptLegend()}

          <div class="llm-actions">
            <button
              type="button"
              class="mh-button"
              ?disabled=${this._saving}
              @click=${() => void this._save()}
            >
              ${this._saving ? "Speichere…" : "Speichern"}
            </button>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving || this._testing}
              title="Schickt einen kleinen Test-Request an den Provider — kostet ~1 LLM-Call. Speichert nichts."
              @click=${() => void this._testConnection()}
            >
              ${this._testing ? "Teste…" : "Verbindung testen"}
            </button>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving}
              @click=${() => void this._reload()}
            >
              Verwerfen
            </button>
          </div>
          ${this._renderTestResult()}
        </div>
      </section>
    `;
  }
};
z.styles = [
  L,
  ge,
  W,
  x`
      .llm-section {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
        max-width: 720px;
      }
      .llm-section h2 {
        margin: 0;
      }
      .llm-section p.muted {
        margin: 0;
      }
      .llm-form {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
      }
      .llm-form label {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .llm-form input,
      .llm-form textarea {
        padding: var(--mh-space-1) var(--mh-space-2);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm, 4px);
        background: var(--mh-surface-2);
        color: var(--mh-fg-default);
        font: inherit;
      }
      .llm-form textarea {
        min-height: 6em;
        resize: vertical;
      }
      .llm-form .toggle-row {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .llm-form .help {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      .llm-presets {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-1);
      }
      .llm-actions,
      .llm-prompt-actions {
        display: flex;
        gap: var(--mh-space-2);
      }
      .api-key-row {
        display: flex;
        gap: var(--mh-space-2);
        align-items: center;
      }
      .api-key-row input {
        flex: 1;
      }
      .llm-warning {
        background: var(--mh-warning-soft);
        color: var(--mh-warning);
        padding: var(--mh-space-2);
        border-radius: var(--mh-radius-sm, 4px);
      }
      /* Iter UX-4 — Test-Result-Anzeige */
      .llm-test-result {
        margin-top: var(--mh-space-2);
        padding: var(--mh-space-2);
        border-radius: var(--mh-radius-sm, 4px);
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .llm-test-result--ok {
        background: var(--mh-success-soft);
        color: var(--mh-success);
      }
      .llm-test-result--err {
        background: var(--mh-error-soft);
        color: var(--mh-error);
      }
      .llm-test-result details {
        margin-top: var(--mh-space-1);
        color: var(--mh-fg-default);
      }
      .llm-test-result dl {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: var(--mh-space-1) var(--mh-space-2);
        margin: var(--mh-space-1) 0 0;
        font-size: var(--mh-text-sm);
      }
      .llm-test-result dt {
        color: var(--mh-fg-muted);
      }
      .llm-test-result dd {
        margin: 0;
      }
      /* Iter UX-6 — Legende unter System-Prompt-Override */
      .llm-legend {
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm, 4px);
        padding: var(--mh-space-2);
      }
      .llm-legend > summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
      .llm-legend__cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--mh-space-3);
        margin-top: var(--mh-space-2);
      }
      .llm-legend section h4 {
        margin: 0 0 var(--mh-space-1) 0;
        font-size: var(--mh-text-sm);
      }
      .llm-legend dl {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: var(--mh-space-1) var(--mh-space-2);
        margin: var(--mh-space-1) 0;
        font-size: var(--mh-text-xs);
      }
      .llm-legend dt {
        color: var(--mh-fg-muted);
      }
      .llm-legend dd {
        margin: 0;
      }
      .llm-legend pre {
        background: var(--mh-surface);
        border-radius: var(--mh-radius-sm, 4px);
        padding: var(--mh-space-2);
        overflow-x: auto;
        font-size: var(--mh-text-xs);
        margin: var(--mh-space-1) 0;
      }
    `
];
R([
  b({ attribute: !1 })
], z.prototype, "api", 2);
R([
  l()
], z.prototype, "_settings", 2);
R([
  l()
], z.prototype, "_loading", 2);
R([
  l()
], z.prototype, "_saving", 2);
R([
  l()
], z.prototype, "_error", 2);
R([
  l()
], z.prototype, "_draft", 2);
R([
  l()
], z.prototype, "_apiKeyEdit", 2);
R([
  l()
], z.prototype, "_info", 2);
R([
  l()
], z.prototype, "_testing", 2);
R([
  l()
], z.prototype, "_testResult", 2);
R([
  l()
], z.prototype, "_testError", 2);
z = R([
  k("knx-recommend-llm-view")
], z);
var gr = Object.defineProperty, fr = Object.getOwnPropertyDescriptor, fe = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? fr(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && gr(t, s, a), a;
};
const vr = ["telegram", "pushover", "ntfy", "signal", "notify"], _r = ["debug", "info", "warning", "error"];
let V = class extends y {
  constructor() {
    super(...arguments), this._items = [], this._editing = null, this._toast = "", this._testingIds = /* @__PURE__ */ new Set();
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    this.api && (this._items = await this.api.listChannels());
  }
  _showToast(e) {
    this._toast = e, window.setTimeout(() => this._toast = "", 3e3);
  }
  // F-001: Test-Knopf — sendet Test-Nachricht und zeigt Resultat als Toast.
  // Backend ist rate-limited (3/Min/Channel; 429 -> spezifische Fehlermeldung).
  async _test(e) {
    if (!(!this.api || e.id == null) && !this._testingIds.has(e.id)) {
      this._testingIds = /* @__PURE__ */ new Set([...this._testingIds, e.id]);
      try {
        const t = await this.api.testChannel(e.id);
        t.delivered ? this._showToast(`Test-Nachricht zugestellt an „${t.channel}"`) : this._showToast(`Test fuer „${t.channel}" fehlgeschlagen — Provider lieferte nicht aus.`);
      } catch (t) {
        const s = t.message;
        s.includes("429") ? this._showToast(`Zu viele Test-Versuche fuer „${e.name}" — bitte ~20 s warten.`) : this._showToast(`Test fehlgeschlagen: ${s}`);
      } finally {
        const t = new Set(this._testingIds);
        t.delete(e.id), this._testingIds = t;
      }
    }
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
    if (!(!this.api || !this._editing))
      try {
        this._editing.id == null ? await this.api.createChannel(this._editing) : await this.api.updateChannel(this._editing.id, this._editing), this._editing = null, await this._load(), this._showToast("gespeichert");
      } catch (e) {
        this._showToast(e.message);
      }
  }
  async _delete(e) {
    !this.api || e.id == null || window.confirm(`Channel '${e.name}' löschen?`) && (await this.api.deleteChannel(e.id), await this._load());
  }
  _renderTypeFields(e, t) {
    const s = e.config ?? {}, r = (a, n) => {
      t({ config: { ...s, [a]: n } });
    };
    return e.channel_type === "telegram" ? i`
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
      ` : e.channel_type === "pushover" ? i`
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
      ` : e.channel_type === "ntfy" ? i`
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
      ` : i`
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
    const e = this._editing, t = (s) => {
      this._editing = { ...e, ...s };
    };
    return i`
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
      const r = s.target.value;
      t({ channel_type: r, config: {} });
    }}
            >
              ${vr.map((s) => i`<option value=${s}>${s}</option>`)}
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
      const r = s.target.value;
      t({ severity_threshold: r });
    }}
              >
                ${_r.map((s) => i`<option value=${s}>${s}</option>`)}
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
  // Iter 04-Refactor: Row-Rendering aus render() extrahiert. Vorher
  // hatte render() CC=19 (Sonar-Limit 15) durch verschachtelte Ternaries
  // ueber Channel-Typ, Quiet-Hours, Test-Button-Status. Aufgeteilt in:
  // _renderRow / _renderTypeDetail / _renderQuiet / _renderTestButton.
  _renderTypeDetail(e) {
    const t = e.config;
    if (e.channel_type === "telegram")
      return i` → <small>${t?.chat_id ?? "?"}</small>`;
    if (e.channel_type === "pushover") {
      const s = t?.user_key?.slice(0, 8) ?? "?";
      return i` → <small>${s}…</small>`;
    }
    return e.channel_type === "ntfy" ? i` → <small>${t?.topic ?? "?"}</small>` : t?.service ? i` → <code>notify.${t.service}</code>` : i`<span class="muted">— unkonfiguriert</span>`;
  }
  _renderQuiet(e) {
    if (!(e.quiet_start && e.quiet_end))
      return i`<span class="muted">—</span>`;
    const t = e.quiet_bypass_error ? i` <small>(Err bypass)</small>` : "";
    return i`${e.quiet_start}–${e.quiet_end}${t}`;
  }
  _renderTestButton(e) {
    const t = e.id != null && this._testingIds.has(e.id), s = e.enabled ? "Sendet Test-Nachricht ueber diesen Channel" : "Channel ist deaktiviert — Test sendet trotzdem (ignoriert Quiet/Threshold)";
    return i`
      <button ?disabled=${t} title=${s} @click=${() => void this._test(e)}>
        ${t ? "…" : "Test"}
      </button>
    `;
  }
  _renderRow(e) {
    return i`<tr>
      <td>${e.name}</td>
      <td><code>${e.channel_type}</code>${this._renderTypeDetail(e)}</td>
      <td>${e.severity_threshold}</td>
      <td>${this._renderQuiet(e)}</td>
      <td>${e.throttle_seconds}s</td>
      <td>${e.enabled ? "✓" : "—"}</td>
      <td class="actions">
        ${this._renderTestButton(e)}
        <button @click=${() => this._edit(e)}>Edit</button>
        <button class="danger" @click=${() => void this._delete(e)}>Löschen</button>
      </td>
    </tr>`;
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
                ${this._items.map((e) => this._renderRow(e))}
              </tbody>
            </table>`}
        ${this._editing ? this._renderEditor() : null}
        ${this._toast ? i`<div class="toast">${this._toast}</div>` : null}
      </section>
    `;
  }
};
V.styles = x`
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
fe([
  b({ attribute: !1 })
], V.prototype, "api", 2);
fe([
  l()
], V.prototype, "_items", 2);
fe([
  l()
], V.prototype, "_editing", 2);
fe([
  l()
], V.prototype, "_toast", 2);
fe([
  l()
], V.prototype, "_testingIds", 2);
V = fe([
  k("channels-view")
], V);
var br = Object.defineProperty, wr = Object.getOwnPropertyDescriptor, S = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? wr(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && br(t, s, a), a;
};
const it = x`
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
let H = class extends y {
  constructor() {
    super(...arguments), this._items = [], this._newPattern = "", this._newSource = "", this._newSeverity = "info", this._editId = null, this._editDraft = null;
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
  // F-002: Edit-Modus aktivieren — Draft mit aktuellem Item befuellen.
  _startEdit(e) {
    e.id != null && (this._editId = e.id, this._editDraft = { ...e });
  }
  _cancelEdit() {
    this._editId = null, this._editDraft = null;
  }
  async _saveEdit() {
    if (!this.api || this._editId == null || !this._editDraft) return;
    const e = this._editDraft;
    !e.topic_pattern.trim() || !e.source.trim() || (await this.api.updateMqttTopic(this._editId, {
      topic_pattern: e.topic_pattern.trim(),
      source: e.source.trim(),
      severity: e.severity,
      enabled: e.enabled
    }), this._cancelEdit(), await this._load());
  }
  _patchDraft(e) {
    this._editDraft && (this._editDraft = { ...this._editDraft, ...e });
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
                ${this._items.map((e) => this._renderRow(e))}
              </tbody>
            </table>`}
      </section>
    `;
  }
  _renderRow(e) {
    if (e.id != null && e.id === this._editId && this._editDraft) {
      const s = this._editDraft;
      return i`<tr>
        <td>
          <input
            .value=${s.topic_pattern}
            @input=${(r) => this._patchDraft({ topic_pattern: r.target.value })}
          />
        </td>
        <td>
          <input
            .value=${s.source}
            @input=${(r) => this._patchDraft({ source: r.target.value })}
          />
        </td>
        <td>
          <select
            .value=${s.severity}
            @change=${(r) => this._patchDraft({
        severity: r.target.value
      })}
          >
            <option value="debug">debug</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
          </select>
        </td>
        <td>
          <input
            type="checkbox"
            .checked=${s.enabled}
            @change=${(r) => this._patchDraft({ enabled: r.target.checked })}
          />
        </td>
        <td class="actions">
          <button class="primary" @click=${() => void this._saveEdit()}>Speichern</button>
          <button @click=${() => this._cancelEdit()}>Abbrechen</button>
        </td>
      </tr>`;
    }
    return i`<tr>
      <td><code>${e.topic_pattern}</code></td>
      <td>${e.source}</td>
      <td>${e.severity}</td>
      <td>${e.enabled ? "✓" : "—"}</td>
      <td class="actions">
        <button @click=${() => this._startEdit(e)}>Bearbeiten</button>
        <button class="danger" @click=${() => void this._delete(e)}>Löschen</button>
      </td>
    </tr>`;
  }
};
H.styles = it;
S([
  b({ attribute: !1 })
], H.prototype, "api", 2);
S([
  l()
], H.prototype, "_items", 2);
S([
  l()
], H.prototype, "_newPattern", 2);
S([
  l()
], H.prototype, "_newSource", 2);
S([
  l()
], H.prototype, "_newSeverity", 2);
S([
  l()
], H.prototype, "_editId", 2);
S([
  l()
], H.prototype, "_editDraft", 2);
H = S([
  k("mqtt-topics-view")
], H);
let te = class extends y {
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
  // F-005: Loescht eine Source — destruktiv, daher Confirm-Dialog.
  async _delete(e) {
    this.api && window.confirm(`Heartbeat '${e.source}' loeschen?`) && (await this.api.deleteHeartbeat(e.source), await this._load());
  }
  // F-005: Pause/Aktivieren — non-destruktiv, kein Confirm.
  async _toggleEnabled(e) {
    this.api && (await this.api.setHeartbeatEnabled(e.source, !e.enabled), await this._load());
  }
  render() {
    return i`
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
        ${this._items.length === 0 ? i`<p class="empty">Noch keine Heartbeat-Quellen.</p>` : i`<table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Intervall (s)</th>
                  <th>Letzte Sichtung</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._items.map(
      (e) => i`<tr>
                    <td><code>${e.source}</code></td>
                    <td>${e.expected_interval_seconds}</td>
                    <td>${e.last_seen ?? i`<span class="muted">—</span>`}</td>
                    <td>
                      ${e.enabled ? e.silent_alert_active ? i`<span class="alert">⚠ silent</span>` : i`<span class="ok">✓ ok</span>` : i`<span class="muted">paused</span>`}
                    </td>
                    <td class="actions">
                      <button @click=${() => void this._toggleEnabled(e)}>
                        ${e.enabled ? "Pause" : "Aktivieren"}
                      </button>
                      <button class="danger" @click=${() => void this._delete(e)}>
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
te.styles = it;
S([
  b({ attribute: !1 })
], te.prototype, "api", 2);
S([
  l()
], te.prototype, "_items", 2);
S([
  l()
], te.prototype, "_newSource", 2);
S([
  l()
], te.prototype, "_newInterval", 2);
te = S([
  k("heartbeats-view")
], te);
let I = class extends y {
  constructor() {
    super(...arguments), this._items = [], this._newName = "", this._newSource = "", this._newAutomation = "", this._newAuto = !1, this._editId = null, this._editDraft = null;
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
  // F-006: Edit-Modus aktivieren.
  _startEdit(e) {
    e.id != null && (this._editId = e.id, this._editDraft = { ...e });
  }
  _cancelEdit() {
    this._editId = null, this._editDraft = null;
  }
  async _saveEdit() {
    if (!this.api || this._editId == null || !this._editDraft) return;
    const e = this._editDraft;
    !e.name.trim() || !e.source_pattern.trim() || !e.automation_id.trim() || (await this.api.updateRemediationHook(this._editId, {
      name: e.name.trim(),
      source_pattern: e.source_pattern.trim(),
      automation_id: e.automation_id.trim(),
      fingerprint: e.fingerprint,
      confirm_required: e.confirm_required,
      enabled: e.enabled
    }), this._cancelEdit(), await this._load());
  }
  _patchDraft(e) {
    this._editDraft && (this._editDraft = { ...this._editDraft, ...e });
  }
  // F-006: Toggle aktiv/inaktiv ohne Edit-Modus, kein Confirm.
  async _toggleEnabled(e) {
    !this.api || e.id == null || (await this.api.updateRemediationHook(e.id, {
      name: e.name,
      source_pattern: e.source_pattern,
      automation_id: e.automation_id,
      fingerprint: e.fingerprint,
      confirm_required: e.confirm_required,
      enabled: !e.enabled
    }), await this._load());
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
                ${this._items.map((e) => this._renderRow(e))}
              </tbody>
            </table>`}
      </section>
    `;
  }
  _renderRow(e) {
    if (e.id != null && e.id === this._editId && this._editDraft) {
      const s = this._editDraft;
      return i`<tr>
        <td>
          <input
            .value=${s.name}
            @input=${(r) => this._patchDraft({ name: r.target.value })}
          />
        </td>
        <td>
          <input
            .value=${s.source_pattern}
            @input=${(r) => this._patchDraft({ source_pattern: r.target.value })}
          />
        </td>
        <td>
          <input
            .value=${s.automation_id}
            @input=${(r) => this._patchDraft({ automation_id: r.target.value })}
          />
        </td>
        <td>
          <label class="inline">
            <input
              type="checkbox"
              .checked=${!s.confirm_required}
              @change=${(r) => this._patchDraft({
        confirm_required: !r.target.checked
      })}
            />
            <span>Auto</span>
          </label>
        </td>
        <td>
          <input
            type="checkbox"
            .checked=${s.enabled}
            @change=${(r) => this._patchDraft({ enabled: r.target.checked })}
          />
        </td>
        <td class="actions">
          <button class="primary" @click=${() => void this._saveEdit()}>Speichern</button>
          <button @click=${() => this._cancelEdit()}>Abbrechen</button>
        </td>
      </tr>`;
    }
    return i`<tr>
      <td>${e.name}</td>
      <td><code>${e.source_pattern}</code></td>
      <td><code>${e.automation_id}</code></td>
      <td>
        ${e.confirm_required ? i`<span class="muted">Vorschlag</span>` : i`<span class="alert">Auto</span>`}
      </td>
      <td>${e.enabled ? "✓" : "—"}</td>
      <td class="actions">
        <button @click=${() => this._startEdit(e)}>Bearbeiten</button>
        <button @click=${() => void this._toggleEnabled(e)}>
          ${e.enabled ? "Pause" : "Aktivieren"}
        </button>
        <button class="danger" @click=${() => void this._delete(e)}>Löschen</button>
      </td>
    </tr>`;
  }
};
I.styles = it;
S([
  b({ attribute: !1 })
], I.prototype, "api", 2);
S([
  l()
], I.prototype, "_items", 2);
S([
  l()
], I.prototype, "_newName", 2);
S([
  l()
], I.prototype, "_newSource", 2);
S([
  l()
], I.prototype, "_newAutomation", 2);
S([
  l()
], I.prototype, "_newAuto", 2);
S([
  l()
], I.prototype, "_editId", 2);
S([
  l()
], I.prototype, "_editDraft", 2);
I = S([
  k("remediation-view")
], I);
var yr = Object.defineProperty, xr = Object.getOwnPropertyDescriptor, j = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? xr(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && yr(t, s, a), a;
};
const Re = [
  { id: "webhooks", label: "Webhooks" },
  { id: "knx", label: "KNX-Bus" },
  { id: "channels", label: "Channels" },
  { id: "mqtt", label: "MQTT" },
  { id: "heartbeats", label: "Heartbeats" },
  { id: "remediation", label: "Auto-Remediation" },
  { id: "recommend-llm", label: "KI-Empfehlungen" }
], Zt = "messagehub.settings.tab";
function $r() {
  if (typeof window < "u" && window.location?.hash) {
    const e = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    if (e.startsWith("settings/")) {
      const t = e.slice(9);
      if (Re.some((s) => s.id === t)) return t;
    }
  }
  try {
    const e = localStorage.getItem(Zt);
    if (e && Re.some((t) => t.id === e)) return e;
  } catch {
  }
  return "webhooks";
}
let F = class extends y {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._showForm = !1, this._editing = null, this._toast = "", this._menuOpenId = null, this._activeTab = $r(), this._closeMenu = () => {
      this._menuOpenId !== null && (this._menuOpenId = null);
    }, this._onHashChange = () => {
      const e = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      if (!e.startsWith("settings/")) return;
      const t = e.slice(9);
      Re.some((s) => s.id === t) && t !== this._activeTab && (this._activeTab = t);
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
      localStorage.setItem(Zt, e);
    } catch {
    }
    if (typeof window < "u" && window.history) {
      const t = `#settings/${e}`;
      window.location.hash !== t && window.history.replaceState(null, "", t);
    }
  }
  connectedCallback() {
    super.connectedCallback(), typeof window < "u" && window.addEventListener("hashchange", this._onHashChange);
  }
  disconnectedCallback() {
    typeof window < "u" && window.removeEventListener("hashchange", this._onHashChange), super.disconnectedCallback();
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
  _renderItem(e) {
    const t = `${window.location.origin}/api/webhook/${e.webhook_id}`, s = this._menuOpenId === e.webhook_id;
    return i`
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
          <div class="card-actions" @click=${(r) => r.stopPropagation()}>
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
              ${s ? i`<div class="overflow-menu" role="menu">
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

        ${e.field_map ? i`<details class="mapping">
              <summary>JSONPath-Mapping anzeigen</summary>
              <pre><code>${JSON.stringify(e.field_map, null, 2)}</code></pre>
            </details>` : null}
      </div>
    `;
  }
  render() {
    return i`
      <div class="root" @click=${this._closeMenu}>
        <nav class="tabs" role="tablist" aria-label="Einstellungs-Bereiche">
          ${Re.map(
      (e) => i`<button
              role="tab"
              aria-selected=${this._activeTab === e.id}
              class=${`tab ${this._activeTab === e.id ? "active" : ""}`}
              title=${e.label}
              @click=${() => this._selectTab(e.id)}
            >
              <span>${e.label}</span>
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
      case "recommend-llm":
        return i`<knx-recommend-llm-view .api=${this.api}></knx-recommend-llm-view>`;
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

        ${this._loading ? i`<p class="status">lade…</p>` : this._items.length === 0 && !this._showForm ? this._renderEmpty() : i`<div class="grid">${this._items.map((e) => this._renderItem(e))}</div>`}
      </section>
    `;
  }
};
F.styles = [
  L,
  W,
  ge,
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
j([
  b({ attribute: !1 })
], F.prototype, "api", 2);
j([
  l()
], F.prototype, "_items", 2);
j([
  l()
], F.prototype, "_loading", 2);
j([
  l()
], F.prototype, "_showForm", 2);
j([
  l()
], F.prototype, "_editing", 2);
j([
  l()
], F.prototype, "_toast", 2);
j([
  l()
], F.prototype, "_menuOpenId", 2);
j([
  l()
], F.prototype, "_activeTab", 2);
F = j([
  k("settings-view")
], F);
var kr = Object.defineProperty, Sr = Object.getOwnPropertyDescriptor, ie = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Sr(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && kr(t, s, a), a;
};
const Tt = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
  debug: "Debug"
}, Et = {
  error: "var(--mh-error)",
  warning: "var(--mh-warning)",
  info: "var(--mh-info)",
  debug: "var(--mh-debug)"
}, At = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], Tr = [1, 2, 3, 4, 5, 6, 0];
let B = class extends y {
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
    return t === 0 ? i`<p class="muted">Keine Daten in den letzten 30 Tagen.</p>` : i`
      <div class="heatmap-wrap">
        <div class="heatmap">
          <div class="heatmap-header">
            <span></span>
            ${Array.from(
      { length: 24 },
      (s, r) => i`<span class="hour-label">${r % 3 === 0 ? r : ""}</span>`
    )}
          </div>
          ${Tr.map((s, r) => {
      const a = e[s];
      return i`
              <div class="heatmap-row">
                <span class="day-label">${At[r]}</span>
                ${a.map((n, o) => {
        const c = n === 0 ? 0 : Math.max(0.15, n / t), h = n === 0 ? "transparent" : `color-mix(in srgb, var(--mh-accent) ${Math.round(
          c * 100
        )}%, transparent)`;
        return i`
                    <div
                      class=${`heatmap-cell ${n === 0 ? "empty" : ""}`}
                      style=${`background: ${h}`}
                      title=${`${At[r]} ${o}:00 — ${n} Nachricht${n === 1 ? "" : "en"}`}
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
    if (!this._stats) return i``;
    const e = this._stats.severity_24h, t = Object.values(e).reduce((r, a) => r + a, 0), s = ["error", "warning", "info", "debug"];
    return t === 0 ? i`<p class="muted">Keine Nachrichten in den letzten 24 Stunden.</p>` : i`
      <div class="stack-bar" role="img" aria-label="Severity-Verteilung der letzten 24 Stunden">
        ${s.map((r) => {
      const a = e[r] ?? 0;
      if (a === 0) return null;
      const n = a / t * 100;
      return i`
            <div
              class=${`stack-seg sev-${r}`}
              style=${`width: ${n}%; background: ${Et[r]}`}
              title=${`${Tt[r]}: ${a} (${n.toFixed(0)}%)`}
            ></div>
          `;
    })}
      </div>
      <ul class="legend">
        ${s.map((r) => {
      const a = e[r] ?? 0, n = t > 0 ? a / t * 100 : 0;
      return i`
            <li>
              <span class="legend-dot" style=${`background: ${Et[r]}`}></span>
              <span class="legend-label">${Tt[r]}</span>
              <span class="legend-count">${a.toLocaleString("de-DE")}</span>
              <span class="legend-pct muted">${n.toFixed(0)}%</span>
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
    const e = this._stats, t = Object.values(e.severity_24h).reduce((n, o) => n + o, 0), s = e.severity_24h.error ?? 0, r = e.severity_24h.warning ?? 0, a = t > 0 ? s / t * 100 : 0;
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
                ${t === 0 ? "—" : `${a.toFixed(1)} % Anteil`}
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
            ${this._sources.length === 0 ? i`<p class="muted">
                  Noch keine Quellen erfasst. Sobald die erste Nachricht reinkommt,
                  erscheint sie hier.
                </p>` : i`<ul class="sources">
                  ${this._sources.map(
      (n) => i`<li class="source-pill">${n}</li>`
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
                  ${this._topSources.map((n, o) => {
      const c = this._topSources[0]?.count ?? 1, h = n.count / c * 100;
      return i`<li>
                      <span class="rank">${o + 1}</span>
                      <code class="source-name">${n.source}</code>
                      <span class="bar-track">
                        <span class="bar-fill" style=${`width: ${h}%`}></span>
                      </span>
                      <span class="bar-count">${n.count.toLocaleString("de-DE")}</span>
                    </li>`;
    })}
                </ul>`}
          </div>
        </section>
      </div>
    `;
  }
};
B.styles = [
  L,
  ge,
  ae,
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
ie([
  b({ attribute: !1 })
], B.prototype, "api", 2);
ie([
  l()
], B.prototype, "_stats", 2);
ie([
  l()
], B.prototype, "_sources", 2);
ie([
  l()
], B.prototype, "_heatmap", 2);
ie([
  l()
], B.prototype, "_topSources", 2);
ie([
  l()
], B.prototype, "_loading", 2);
B = ie([
  k("stats-live-view")
], B);
const Er = {
  cyclic: "zyklisch",
  on_change: "bei Änderung",
  hybrid: "hybrid",
  silent: "stumm",
  insufficient: "zu wenig Daten"
}, Ar = {
  cyclic: "mh-pill--info",
  on_change: "mh-pill--info",
  hybrid: "mh-pill--caution",
  silent: "mh-pill--neutral",
  insufficient: "mh-pill--neutral"
};
function Pr(e) {
  return i`<span class=${`mh-pill ${Ar[e]}`}
    >${Er[e]}</span
  >`;
}
const Dr = {
  high: "hohe Konfidenz",
  medium: "mittlere Konfidenz",
  low: "niedrige Konfidenz"
}, Lr = {
  high: "mh-pill--neutral",
  medium: "mh-pill--neutral",
  low: "mh-pill--caution"
};
function zr(e) {
  return i`<span class=${`mh-pill ${Lr[e]}`}
    >${Dr[e]}</span
  >`;
}
const Or = {
  dpt_standard: "DPT",
  device_model: "Modell",
  llm: "KI"
}, Nr = {
  dpt_standard: "Quelle: DPT-Standard-Tabelle (Layer 1)",
  device_model: "Quelle: Modell-Override (Layer 2)",
  llm: "Quelle: LLM-Vorschlag (Layer 4) — bitte manuell pruefen"
}, Rr = {
  dpt_standard: "mh-pill--neutral",
  device_model: "mh-pill--info",
  llm: "mh-pill--caution"
};
function Cr(e) {
  return e == null ? i`` : i`<span
    class=${`mh-pill ${Rr[e]} recommendation-source-pill`}
    title=${Nr[e]}
    >${Or[e]}</span
  >`;
}
const Ir = {
  ok: "ok",
  info: "info",
  warn: "abweichend",
  deviation: "Abweichung"
}, Fr = {
  ok: "mh-pill--success",
  info: "mh-pill--neutral",
  warn: "mh-pill--caution",
  deviation: "mh-pill--error"
};
function Mr(e) {
  return i`<span class=${`mh-pill ${Fr[e]}`}
    >${Ir[e]}</span
  >`;
}
function Hr(e) {
  const t = e.recommended_cycle_minutes, s = e.recommended_mode;
  if (s === null) return i`<span class="muted">—</span>`;
  if (s === "on_change")
    return i`<span class="muted small">
      nur bei Aenderung — kein Heartbeat
    </span>`;
  if (t === null)
    return s === "cyclic" ? i`<span class="muted small">zyklisch (Intervall offen)</span>` : i`<span class="muted small">
          bei Aenderung + Heartbeat (Intervall offen)
        </span>`;
  const [r, a] = t, n = r === a ? `${r} Min` : `${r}–${a} Min`;
  return s === "cyclic" ? i`<strong>${n}</strong>
      <span class="muted small">zyklisch</span>` : i`<strong>${n}</strong>
    <span class="muted small">Heartbeat (zusaetzlich zu Aenderung)</span>`;
}
var Ur = Object.defineProperty, Br = Object.getOwnPropertyDescriptor, Ue = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Br(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && Ur(t, s, a), a;
};
const De = [
  "var(--mh-error)",
  "var(--mh-warning)",
  "var(--mh-info)",
  "var(--mh-accent)",
  "var(--mh-success)"
];
let he = class extends y {
  constructor() {
    super(...arguments), this.items = [], this.width = 600, this.height = 120;
  }
  render() {
    if (this.items.length === 0)
      return i`<p class="muted">Keine Timeline-Daten.</p>`;
    if (this.items.reduce((f, u) => f + u.count, 0) === 0)
      return i`<p class="muted">Keine Telegramme im Zeitraum.</p>`;
    const t = this._buildSeries(), s = this._allBuckets(), r = Math.max(1, ...this.items.map((f) => f.count)), a = { top: 8, right: 8, bottom: 18, left: 32 }, n = this.width - a.left - a.right, o = this.height - a.top - a.bottom, c = s.length === 1, h = (f) => c ? a.left + n / 2 : a.left + f / (s.length - 1) * n, v = (f) => a.top + (1 - f / r) * o;
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
        <text x="2" y=${a.top + 4} class="axis-label">${r}</text>
        <text x="2" y=${this.height - a.bottom + 4} class="axis-label">0</text>

        <!-- Series -->
        ${t.map((f, u) => {
      const p = De[u % De.length];
      if (c) {
        const m = v(f.values[0] ?? 0);
        return i`<g class="series">
              <line
                x1=${a.left} y1=${m}
                x2=${this.width - a.right} y2=${m}
                stroke=${p}
                stroke-width="2"
                vector-effect="non-scaling-stroke"
              ></line>
              <circle cx=${h(0)} cy=${m} r="2.5" fill=${p}>
                <title>${f.ga}: ${f.values[0]}</title>
              </circle>
            </g>`;
      }
      const w = f.values.map((m, T) => `${h(T)},${v(m)}`).join(" ");
      return i`<g class="series">
            <polyline
              points=${w}
              fill="none"
              stroke=${p}
              stroke-width="2"
              vector-effect="non-scaling-stroke"
            ><title>${f.ga}</title></polyline>
            ${f.values.map(
        (m, T) => i`<circle cx=${h(T)} cy=${v(m)} r="2" fill=${p}>
                <title>${f.ga}: ${m}</title>
              </circle>`
      )}
          </g>`;
    })}
      </svg>
      <div class="legend">
        ${t.map(
      (f, u) => i`<span class="legend-item">
            <span
              class="dot"
              style=${`background: ${De[u % De.length]}`}
            ></span>
            <code>${f.ga}</code>
          </span>`
    )}
      </div>
    `;
  }
  _allBuckets() {
    const e = /* @__PURE__ */ new Set();
    for (const t of this.items) e.add(t.bucket);
    return Array.from(e).sort((t, s) => t.localeCompare(s));
  }
  _buildSeries() {
    const e = this._allBuckets(), t = new Map(e.map((r, a) => [r, a])), s = /* @__PURE__ */ new Map();
    for (const r of this.items) {
      let a = s.get(r.ga);
      a === void 0 && (a = new Array(e.length).fill(0), s.set(r.ga, a));
      const n = t.get(r.bucket);
      n !== void 0 && (a[n] = r.count);
    }
    return Array.from(s.entries()).map(([r, a]) => ({ ga: r, values: a }));
  }
};
he.styles = [
  L,
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
Ue([
  b({ attribute: !1 })
], he.prototype, "items", 2);
Ue([
  b({ type: Number })
], he.prototype, "width", 2);
Ue([
  b({ type: Number })
], he.prototype, "height", 2);
he = Ue([
  k("knx-timeline-chart")
], he);
var Gr = Object.defineProperty, jr = Object.getOwnPropertyDescriptor, Be = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? jr(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && Gr(t, s, a), a;
};
function Kr(e) {
  if (typeof e == "number" && Number.isFinite(e)) return e;
  if (typeof e == "boolean") return e ? 1 : 0;
  if (typeof e == "string") {
    const t = e.trim().toLowerCase();
    if (t === "true" || t === "on") return 1;
    if (t === "false" || t === "off") return 0;
    const s = parseFloat(t);
    if (Number.isFinite(s)) return s;
  }
  return null;
}
let pe = class extends y {
  constructor() {
    super(...arguments), this.points = [], this.width = 600, this.height = 80;
  }
  render() {
    const e = this.points.map((m) => ({ ts: m.ts, value: Kr(m.value) })).filter((m) => m.value !== null);
    if (e.length < 2)
      return i`<p class="muted">
        Wertverlauf: zu wenige numerische Datenpunkte
        (${e.length} von ${this.points.length}).
      </p>`;
    const t = e.map((m) => m.value), s = Math.min(...t), r = Math.max(...t), a = r - s || 1, n = { top: 8, right: 8, bottom: 18, left: 40 }, o = this.width - n.left - n.right, c = this.height - n.top - n.bottom, h = (m) => n.left + m / Math.max(1, e.length - 1) * o, v = (m) => n.top + (1 - (m - s) / a) * c, f = e.map((m, T) => `${h(T)},${v(m.value)}`).join(" "), p = [...t.slice(1).map((m, T) => Math.abs(m - t[T]))].sort((m, T) => m - T), w = p[Math.floor(p.length / 2)];
    return i`
      <div class="wrap">
        <svg
          viewBox=${`0 0 ${this.width} ${this.height}`}
          role="img"
          aria-label="Wertverlauf-Sparkline"
          preserveAspectRatio="none"
        >
          <line
            x1=${n.left} y1=${n.top}
            x2=${this.width - n.right} y2=${n.top}
            class="grid"
          ></line>
          <line
            x1=${n.left} y1=${this.height - n.bottom}
            x2=${this.width - n.right} y2=${this.height - n.bottom}
            class="grid"
          ></line>
          <text x="2" y=${n.top + 4} class="axis-label">${r.toFixed(1)}</text>
          <text x="2" y=${this.height - n.bottom + 4} class="axis-label">${s.toFixed(1)}</text>
          <polyline points=${f} class="series" fill="none"></polyline>
        </svg>
        <p class="muted small">
          ${e.length} Punkte • Min ${s.toFixed(1)} • Max ${r.toFixed(1)} •
          Median Δ ${w.toFixed(2)}
          ${w < 0.1 && a > 0 ? i` <span class="hint">→ enge Hysterese</span>` : Vr}
        </p>
      </div>
    `;
  }
};
pe.styles = [
  L,
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
Be([
  b({ attribute: !1 })
], pe.prototype, "points", 2);
Be([
  b({ type: Number })
], pe.prototype, "width", 2);
Be([
  b({ type: Number })
], pe.prototype, "height", 2);
pe = Be([
  k("knx-value-sparkline")
], pe);
const Vr = "";
var Wr = Object.defineProperty, qr = Object.getOwnPropertyDescriptor, _ = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? qr(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && Wr(t, s, a), a;
};
const Qt = "messagehub.knx-stats.filters", Pt = "messagehub.knx-stats.filters.defaults-version", Dt = "v3", Xr = 1, Jr = 25, Yr = /^[\s\-_=]*$/;
function Zr(e, t) {
  const s = (t ?? "").trim();
  return !!(s === "" || Yr.test(s) || s === e);
}
const Lt = 25, zt = 100, Ot = 300, Je = [
  { id: "1h", label: "1 Std", days: 1 / 24 },
  { id: "6h", label: "6 Std", days: 0.25 },
  { id: "24h", label: "24 Std", days: 1 },
  { id: "48h", label: "48 Std", days: 2 },
  { id: "7d", label: "7 Tage", days: 7 },
  { id: "30d", label: "30 Tage", days: 30 },
  { id: "365d", label: "365 Tage", days: 365 }
], Qr = /* @__PURE__ */ new Set(["7d", "30d", "365d"]), ea = {
  "health-score": "Bus-Health-Score",
  busload: "Buslast-KPI",
  "long-term": "Long-Term-Sicht",
  bursts: "Burst-Detector",
  "sensitive-log": "Sicherheits-Audit",
  orphans: "Verwaiste GAs",
  alarms: "Alarme",
  trend: "Trend-Vergleich",
  heatmap: "Aktivitäts-Heatmap"
};
function ta(e) {
  return ea[e] ?? e;
}
const sa = [10, 25, 50, 100, 200], ra = [10, 15, 20, 25, 30], Ce = {
  periodId: "24h",
  topN: 10,
  topNDevices: 10,
  topNAudit: 10,
  topNBursts: 10,
  topNLongTerm: 10,
  topNTrend: 10,
  topNOrphansMissing: 10,
  topNOrphansExtra: 10,
  topNSilence: 10,
  topNBusHealth: 10,
  topNHeatmap: 10,
  topNSiblings: 10,
  topNSourceDetailGas: 10,
  topNSourceDetailFindings: 10,
  topNGaFindings: 10,
  minRate: 0,
  includeAck: !0
}, aa = [
  "topN",
  "topNDevices",
  "topNAudit",
  "topNBursts",
  "topNLongTerm",
  "topNTrend",
  "topNOrphansMissing",
  "topNOrphansExtra",
  "topNSilence",
  "topNBusHealth",
  "topNSiblings"
];
function ia() {
  let e = null;
  try {
    const s = localStorage.getItem(Qt);
    s && (e = JSON.parse(s));
  } catch {
  }
  const t = e ? { ...Ce, ...e } : { ...Ce };
  return na(t, e);
}
function na(e, t) {
  let s = !1;
  try {
    s = localStorage.getItem(Pt) === Dt;
  } catch {
  }
  if (s)
    return e;
  let r = e, a = !1;
  if (t !== null && t.minRate === Xr && (r = { ...r, minRate: Ce.minRate }, a = !0), t !== null) {
    const n = {};
    for (const o of aa)
      t[o] === Jr && (n[o] = Ce[o]);
    Object.keys(n).length > 0 && (r = { ...r, ...n }, a = !0);
  }
  a && A(r);
  try {
    localStorage.setItem(Pt, Dt);
  } catch {
  }
  return r;
}
function A(e) {
  try {
    localStorage.setItem(Qt, JSON.stringify(e));
  } catch {
  }
}
function Nt(e) {
  const t = Je.find((a) => a.id === e) ?? Je[2], s = /* @__PURE__ */ new Date();
  return { from: new Date(s.getTime() - t.days * 864e5).toISOString(), to: s.toISOString() };
}
const oa = 48;
function la() {
  const e = /* @__PURE__ */ new Date();
  return { from: new Date(e.getTime() - oa * 3600 * 1e3).toISOString(), to: e.toISOString() };
}
function Rt(e) {
  switch (e) {
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
const Ct = {
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3
};
function da(e, t, s) {
  return [...e].sort((a, n) => {
    let o;
    switch (t) {
      case "ga":
        o = a.ga.localeCompare(n.ga);
        break;
      case "label": {
        const c = !a.label, h = !n.label;
        if (c && h) o = 0;
        else {
          if (c) return 1;
          if (h) return -1;
          o = a.label.localeCompare(n.label);
        }
        break;
      }
      case "rate_per_min":
        o = a.rate_per_min - n.rate_per_min;
        break;
      case "recommended_rate":
        o = a.recommended_rate - n.recommended_rate;
        break;
      case "severity":
        o = Ct[a.severity] - Ct[n.severity];
        break;
    }
    return s === "desc" ? -o : o;
  });
}
let g = class extends y {
  constructor() {
    super(...arguments), this._filters = ia(), this._summary = null, this._busHealth = null, this._busload = null, this._health = null, this._longTerm = null, this._bursts = null, this._sensitiveLog = null, this._trend = null, this._heatmap = null, this._busAnalysisEnabled = !0, this._busAnalysisLoaded = !1, this._devicesSortKey = "count", this._devicesSortDir = "desc", this._topSortKey = "rate_per_min", this._topSortDir = "desc", this._orphansMissingFilter = "", this._orphansExtraFilter = "", this._orphansHidePlaceholders = !0, this._apiErrors = /* @__PURE__ */ new Map(), this._apiErrorsDismissed = !1, this._silence = null, this._orphans = null, this._alarms = null, this._top = [], this._topBySource = [], this._timeline = null, this._selectedGa = null, this._detail = null, this._detailLoading = !1, this._selectedSource = null, this._sourceDetail = null, this._sourceDetailLoading = !1, this._recommendation = null, this._recommendationLoading = !1, this._recommendationError = "", this._recommendationExpanded = !1, this._device = null, this._deviceEditing = !1, this._deviceSaving = !1, this._deviceError = "", this._deviceDraft = {}, this._loading = !1, this._error = "", this._toast = "", this._loadToken = 0, this._onWindowKeyDown = (e) => {
      if (e.key === "Escape") {
        if (this._detail !== null || this._detailLoading) {
          this._closeDetail();
          return;
        }
        (this._sourceDetail !== null || this._sourceDetailLoading) && this._closeSourceDetail();
      }
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
  // Iter D.2 (knx-detail-panes): pendant zu _closeDetail fuer das
  // Source-Detail-Pane.
  _closeSourceDetail() {
    this._selectedSource = null, this._sourceDetail = null, this._sourceDetailLoading = !1, this._recommendation = null, this._recommendationLoading = !1, this._recommendationError = "", this._recommendationExpanded = !1, this._device = null, this._deviceEditing = !1, this._deviceSaving = !1, this._deviceError = "", this._deviceDraft = {};
  }
  async _loadBusAnalysisState() {
    if (this.api)
      try {
        const e = await this.api.getKnxBusAnalysisState();
        this._busAnalysisEnabled = e.enabled;
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
    const t = Array.from(this._apiErrors.keys()).sort(
      (s, r) => s.localeCompare(r)
    ).map((s) => ta(s)).join(", ");
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
        <p class="api-error-banner__list">${t}</p>
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
      ([s, r]) => i`<li><code>${s}</code>: ${r}</li>`
    )}
          </ul>
        </details>
      </div>
    `;
  }
  async _toggleBusAnalysis() {
    if (!this.api) return;
    const e = !this._busAnalysisEnabled;
    if (!(!e && !window.confirm(
      `Bus-Analyse deaktivieren?

Solange aus, schreibt das Plugin keine neuen Telegramme mehr in die Raw- oder Counter-Tabelle. Bestehende Daten bleiben sichtbar, altern aber nach 48 h (Raw) bzw. 365 Tagen (Counter).`
    )))
      try {
        const t = await this.api.setKnxBusAnalysisState(e);
        this._busAnalysisEnabled = t.enabled;
      } catch (t) {
        window.alert(`Fehler: ${t.message}`);
      }
  }
  _apiFilters() {
    const { from: e, to: t } = Nt(this._filters.periodId);
    return {
      from: e,
      to: t,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck
    };
  }
  _isLongTermMode() {
    return Qr.has(this._filters.periodId);
  }
  // Im Long-Term-Modus laufen die Raw-Endpunkte auf die letzten 48h —
  // alles dahinter liegt in der Counter-Tabelle und wird ueber den
  // Long-Term-Endpoint geliefert.
  _liveFiltersForRaw() {
    if (!this._isLongTermMode()) return this._apiFilters();
    const { from: e, to: t } = la();
    return {
      from: e,
      to: t,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck
    };
  }
  async _load() {
    if (!this.api) return;
    const e = ++this._loadToken;
    this._loading = !0, this._error = "";
    const t = /* @__PURE__ */ new Map(), s = (r, a) => a.catch((n) => (t.set(r, n.message), null));
    try {
      const r = this._isLongTermMode(), a = this._apiFilters(), n = this._liveFiltersForRaw(), o = { ...n, limit: this._filters.topNDevices }, [
        c,
        h,
        v,
        f,
        u,
        p,
        w,
        m,
        T,
        ve,
        Pe,
        ts,
        ss,
        rs
      ] = await Promise.all([
        this.api.getKnxStatsSummary(n),
        this.api.getKnxStatsTop(n),
        this.api.getKnxStatsTopBySource(o),
        // Iter topn-3: topNBusHealth durchreichen — Backend liest jetzt
        // limit aus der Query (Default 20, Max 500). Vorher hardcoded 20.
        this.api.getKnxStatsBusHealth({
          ...n,
          limit: this._filters.topNBusHealth
        }),
        this.api.getKnxStatsSilence({
          ...n,
          maxSilenceMinutes: this._suggestSilenceMinutes()
        }),
        s("orphans", this.api.getKnxStatsOrphans(n)),
        s("alarms", this.api.getKnxStatsAlarms(n)),
        s(
          "busload",
          this.api.getKnxStatsBusload(n, this._suggestBusloadBucketSeconds())
        ),
        s("health-score", this.api.getKnxStatsHealthScore(n)),
        r ? s(
          "long-term",
          this.api.getKnxStatsLongTerm({
            ...a,
            limit: this._filters.topNLongTerm
          })
        ) : Promise.resolve(null),
        // Iter topn-2: jeder Card-spezifische Call ueberschreibt das von
        // _liveFiltersForRaw geerbte Master-`limit` (= topN) mit dem
        // eigenen Top-N — sonst greift das Backend auf seine Defaults
        // zurueck und der Card-Selektor wirkt nur kosmetisch.
        s(
          "bursts",
          this.api.getKnxStatsBursts({
            ...n,
            limit: this._filters.topNBursts
          })
        ),
        s(
          "sensitive-log",
          this.api.getKnxStatsSensitiveLog({
            ...n,
            limit: this._filters.topNAudit
          })
        ),
        // Iter aiohttp-error-ZU9UA / Trend-Fix B+C: bei langen Perioden
        // den vollen Zeitraum (fLongTerm) statt der 48h-Live-Slice
        // (fRaw) senden — Backend liest dann aus knx_telegram_counters.
        // Iter topn-1: top_n folgt dem Card-Selektor (this._filters.topNTrend),
        // vorher hardcoded 5 → User-Auswahl > 5 ohne Effekt.
        s(
          "trend",
          this.api.getKnxStatsTrend(
            r ? a : n,
            this._filters.topNTrend
          )
        ),
        // Iter topn-4: Heatmap nutzt jetzt einen eigenen UI-Selektor
        // (default 10, max 30 wegen CSS-Grid-Lesbarkeit). Vorher
        // hardcoded 10.
        s(
          "heatmap",
          this.api.getKnxStatsHeatmap(
            n,
            this._filters.topNHeatmap,
            this._suggestHeatmapBucketMinutes()
          )
        )
      ]);
      if (e !== this._loadToken)
        return;
      this._summary = c, this._top = h.items, this._topBySource = v.items, this._busHealth = f, this._silence = u, this._orphans = p, this._alarms = w, this._busload = m, this._health = T, this._longTerm = ve, this._bursts = Pe, this._sensitiveLog = ts, this._trend = ss, this._heatmap = rs, this._apiErrors = t, this._apiErrorsDismissed = !1;
      const ot = h.items.slice(0, 5).map((je) => je.ga);
      if (ot.length > 0) {
        const je = await this.api.getKnxStatsTimeline({
          ...n,
          gas: ot,
          bucketMinutes: this._suggestBucketMinutes()
        });
        e === this._loadToken && (this._timeline = je);
      } else e === this._loadToken && (this._timeline = null);
    } catch (r) {
      if (e !== this._loadToken)
        return;
      this._error = r.message, this._summary = null, this._top = [], this._topBySource = [], this._timeline = null, this._busHealth = null, this._silence = null, this._orphans = null, this._alarms = null, this._busload = null, this._health = null, this._longTerm = null, this._bursts = null, this._sensitiveLog = null, this._trend = null, this._heatmap = null;
    } finally {
      e === this._loadToken && (this._loading = !1);
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
  // Iter D.2 (knx-detail-panes): Source-Detail laden. Schliesst ein
  // offenes GA-Detail (Toggle zwischen den beiden Drawer-Inhalten),
  // analog _loadDetail.
  async _loadSourceDetail(e) {
    if (this.api) {
      this._closeDetail(), this._selectedSource = e, this._sourceDetailLoading = !0, this._sourceDetail = null, this._recommendation = null, this._recommendationLoading = !1, this._recommendationError = "", this._recommendationExpanded = !1, this._device = null, this._deviceEditing = !1, this._deviceSaving = !1, this._deviceError = "", this._deviceDraft = {};
      try {
        const t = this._apiFilters();
        this._sourceDetail = await this.api.getKnxStatsSourceDetail(
          e,
          t
        );
      } catch (t) {
        this._showToast(
          `Source-Detail laden fehlgeschlagen: ${t.message}`
        );
      } finally {
        this._sourceDetailLoading = !1;
      }
    }
  }
  // Iter L1.4: Lazy-Loader fuer die Recommendation-Card. Wird durch
  // den Aufklappen-Klick angestossen.
  async _loadRecommendation(e) {
    if (this.api) {
      this._recommendationLoading = !0, this._recommendationError = "";
      try {
        const t = this._apiFilters();
        this._recommendation = await this.api.getKnxStatsSourceRecommendation(
          e,
          t
        );
      } catch (t) {
        const s = t.message;
        s.includes("HTTP 404") ? (this._recommendation = null, this._recommendationError = "") : this._recommendationError = s;
      } finally {
        this._recommendationLoading = !1;
      }
    }
  }
  _toggleRecommendation() {
    this._selectedSource && (this._recommendationExpanded = !this._recommendationExpanded, this._recommendationExpanded && this._recommendation === null && !this._recommendationLoading && this._recommendationError === "" && (this._loadRecommendation(this._selectedSource), this._loadDevice(this._selectedSource)));
  }
  // Iter L2.4: Geraete-Profil laden + Inline-Edit.
  async _loadDevice(e) {
    if (this.api)
      try {
        this._device = await this.api.getKnxDevice(e);
      } catch (t) {
        this._device = null, this._deviceError = t.message;
      }
  }
  _startEditDevice() {
    this._deviceEditing = !0, this._deviceError = "", this._deviceDraft = {
      manufacturer: this._device?.manufacturer ?? "",
      model: this._device?.model ?? "",
      notes: this._device?.notes ?? ""
    };
  }
  _cancelEditDevice() {
    this._deviceEditing = !1, this._deviceError = "", this._deviceDraft = {};
  }
  async _saveDevice() {
    if (!(!this.api || !this._selectedSource)) {
      this._deviceSaving = !0, this._deviceError = "";
      try {
        this._device = await this.api.putKnxDevice(
          this._selectedSource,
          this._deviceDraft
        ), this._deviceEditing = !1, this._deviceDraft = {}, this._recommendation = null, this._recommendationExpanded && this._loadRecommendation(this._selectedSource);
      } catch (e) {
        this._deviceError = e.message;
      } finally {
        this._deviceSaving = !1;
      }
    }
  }
  _onDeviceDraftChange(e, t) {
    this._deviceDraft = { ...this._deviceDraft, [e]: t };
  }
  async _onSelectGa(e) {
    if (this._selectedGa === e) {
      this._closeDetail();
      return;
    }
    this._selectedGa = e, await this._loadDetail(e);
  }
  async _ackGa(e) {
    if (!this.api) return;
    const t = window.prompt(
      `Notiz für ${e} (optional, leer = keine Notiz):`,
      ""
    );
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
    this._filters = { ...this._filters, periodId: e }, A(this._filters), this._load();
  }
  _onTopN(e) {
    this._filters = { ...this._filters, topN: e }, A(this._filters), this._load();
  }
  _onTopNDevices(e) {
    this._filters = { ...this._filters, topNDevices: e }, A(this._filters), this._load();
  }
  // Iter aiohttp-error-ZU9UA: Anzahl-Filter pro Card. Ein gemeinsamer
  // Setter-Helfer waere DRYer, aber jeder Filter hat einen eigenen
  // Schluessel — dafuer pro Card eine 4-Zeilen-Methode, klar lesbar.
  // Diese Setter loesen kein _load() aus, weil die Daten fuer kleinere
  // Tabellen schon im Speicher liegen — wir slicen nur anders.
  _onTopNAudit(e) {
    this._filters = { ...this._filters, topNAudit: e }, A(this._filters), this.requestUpdate();
  }
  _onTopNBursts(e) {
    this._filters = { ...this._filters, topNBursts: e }, A(this._filters), this.requestUpdate();
  }
  _onTopNLongTerm(e) {
    this._filters = { ...this._filters, topNLongTerm: e }, A(this._filters), this.requestUpdate();
  }
  _onTopNTrend(e) {
    this._filters = { ...this._filters, topNTrend: e }, A(this._filters), this.requestUpdate();
  }
  _onTopNOrphansMissing(e) {
    this._filters = { ...this._filters, topNOrphansMissing: e }, A(this._filters), this.requestUpdate();
  }
  _onTopNOrphansExtra(e) {
    this._filters = { ...this._filters, topNOrphansExtra: e }, A(this._filters), this.requestUpdate();
  }
  _onTopNSilence(e) {
    this._filters = { ...this._filters, topNSilence: e }, A(this._filters), this.requestUpdate();
  }
  _onTopNBusHealth(e) {
    this._filters = { ...this._filters, topNBusHealth: e }, A(this._filters), this.requestUpdate();
  }
  // Iter topn-4: Heatmap-Selektor muss `_load()` ausloesen, weil das
  // Backend die Top-N-GAs serverseitig auswaehlt (gas[], matrix[][]
  // im Response sind direkt CSS-Grid-Material, kein clientseitiges
  // Slicing moeglich).
  _onTopNHeatmap(e) {
    this._filters = { ...this._filters, topNHeatmap: e }, A(this._filters), this._load();
  }
  _onTopNSiblings(e) {
    this._filters = { ...this._filters, topNSiblings: e }, A(this._filters), this.requestUpdate();
  }
  // Iter detail-topn: Source-Detail-Pane bekommt eigene TopN-Selektoren
  // fuer GA-Liste und Findings-Liste. Vorher wurden beide ohne Limit
  // gerendert, was bei groesseren Geraeten (>20 GAs / >10 Findings)
  // den Detail-Drawer endlos scrollen liess.
  _onTopNSourceDetailGas(e) {
    this._filters = { ...this._filters, topNSourceDetailGas: e }, A(this._filters), this.requestUpdate();
  }
  _onTopNSourceDetailFindings(e) {
    this._filters = { ...this._filters, topNSourceDetailFindings: e }, A(this._filters), this.requestUpdate();
  }
  _onTopNGaFindings(e) {
    this._filters = { ...this._filters, topNGaFindings: e }, A(this._filters), this.requestUpdate();
  }
  _renderInlineTopN(e, t, s = sa) {
    return i`
      <span class="inline-topn-wrap">
        <span class="inline-topn-label">zeige</span>
        <span class="inline-topn" role="group" aria-label="Anzahl Einträge">
          ${s.map(
      (r) => i`<button
              class=${`inline-topn__btn ${e === r ? "active" : ""}`}
              @click=${() => t(r)}
            >
              ${r}
            </button>`
    )}
        </span>
      </span>
    `;
  }
  _onMinRate(e) {
    this._filters = { ...this._filters, minRate: Math.max(0, e) }, A(this._filters), this._load();
  }
  _onAckToggle() {
    this._filters = { ...this._filters, includeAck: !this._filters.includeAck }, A(this._filters), this._load();
  }
  _renderFilterBar() {
    return i`
      <div class="filters" role="toolbar" aria-label="KNX-Stats-Filter">
        <div class="filter-group">
          <span class="filter-label">Zeitraum</span>
          <div class="seg">
            ${Je.map(
      (e) => i`<button
                class=${`seg-btn ${this._filters.periodId === e.id ? "active" : ""}`}
                @click=${() => this._onPeriod(e.id)}
              >
                ${e.label}
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
    const e = this._summary;
    if (e === null)
      return i`<p class="muted">Keine Daten verfuegbar.</p>`;
    const t = e.counts_by_severity, s = this._busload, r = s !== null ? s.summary.max_pct : e.estimated_busload_pct, a = r >= 30 ? "danger" : r >= 20 ? "warning" : r >= 10 ? "elevated" : "ok", n = (o) => o.toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    return i`
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
          <span class="kpi-label">Aktive Geräte</span>
          <span class="kpi-value">${e.active_devices.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">Source-Adressen</span>
        </div>
        <div class=${`kpi busload busload--${a}`}>
          <span class="kpi-label">Buslast</span>
          ${s === null ? i`<span class="kpi-value">${n(e.estimated_busload_pct)} %</span>
                <span class="kpi-hint">Ø über Zeitraum</span>` : i`<span class="kpi-value">${n(s.summary.max_pct)} %</span>
                <span class="kpi-hint">
                  jetzt ${n(s.summary.current_pct)} % · Ø ${n(s.summary.avg_pct)} %
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
            title=${`Buslast ${n(r)} % auf Skala 0–100`}
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
      (o) => i`<span class=${`mh-pill ${Rt(o)}`}>
            <span class="mh-pill__dot"></span>
            ${this._severityLabel(o)}: ${t[o] ?? 0}
          </span>`
    )}
      </div>
    `;
  }
  _renderHealthScore() {
    const e = this._health;
    return i`
      <section class=${`mh-card health-score health-score--${e.severity}`}>
        <header class="card-head">
          <h3>Bus-Health-Score</h3>
          <span class="muted small">aggregiert aus 4 KPIs · letzte ${this._filters.periodId}</span>
        </header>
        <div class="health-score__body">
          <div class="health-score__big">
            <span class="health-score__value">${e.score}</span>
            <span class="health-score__unit">/ 100</span>
            <span class="health-score__label">${this._healthLabel(e.severity)}</span>
          </div>
          <div class="health-score__components">
            ${["repeat", "busload", "silence", "alarms"].map(
      (t) => {
        const s = e.components[t], r = this._componentSeverity(s), a = t === "repeat" && e.repeat_approximate === !0, n = this._componentLabel(t), o = a ? `${n} *` : n, c = a ? `${n}: ${s}/100 (${this._healthLabel(r)}) — Approximation: xknx liefert das Repeat-Bit nicht zuverlaessig (BL-D blocked)` : `${n}: ${s}/100 (${this._healthLabel(r)})`;
        return i`<div
                  class=${`health-score__badge health-score__badge--${r}`}
                  title=${c}
                  data-test="health-component"
                  data-key=${t}
                  data-approximate=${a ? "true" : "false"}
                >
                  <span class="health-score__badge-label">${o}</span>
                  <span class="health-score__badge-value">${s}</span>
                </div>`;
      }
    )}
          </div>
          ${e.findings.length > 0 ? i`<ul class="health-score__findings">
                ${e.findings.map(
      (t) => i`<li class=${`health-finding health-finding--${t.severity}`}>
                    <span class="health-finding__dot"></span>
                    <span>${t.message}</span>
                  </li>`
    )}
              </ul>` : i`<p class="muted small">Alle Indikatoren im gruenen Bereich.</p>`}
        </div>
      </section>
    `;
  }
  _healthLabel(e) {
    switch (e) {
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
  _componentLabel(e) {
    switch (e) {
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
  _componentSeverity(e) {
    return e >= 80 ? "green" : e >= 60 ? "yellow" : e >= 40 ? "orange" : "red";
  }
  // Iter 42: Sicherheits-Audit-Card ---------------------------------------
  _renderSensitiveLog() {
    const e = this._sensitiveLog, t = (a) => this._formatTs(a), s = this._filters.topNAudit, r = e.telegrams.slice(0, s);
    return i`
      <section class="mh-card sensitive">
        <header class="card-head">
          <h3>Sicherheits-Audit</h3>
          <div class="card-head__meta">
            ${this._renderInlineTopN(this._filters.topNAudit, (a) => this._onTopNAudit(a))}
            <span class="muted small">
              ${e.addresses.length} markierte GAs · ${e.telegrams.length} Telegramme im Zeitraum
            </span>
          </div>
        </header>
        <div class="sensitive__addresses">
          <h4>Sensitive GAs</h4>
          <ul class="sensitive__addr-list">
            ${e.addresses.map(
      (a) => i`<li>
                <code>${a.ga}</code>
                ${a.label ? i`<span class="muted small">${a.label}</span>` : d}
                ${a.dpt ? i`<span class="mh-pill mh-pill--neutral">${a.dpt}</span>` : d}
              </li>`
    )}
          </ul>
        </div>
        <div class="sensitive__telegrams">
          <h4>Letzte Telegramme</h4>
          ${e.telegrams.length === 0 ? i`<p class="muted small">Keine Aktivitaet im Zeitraum.</p>` : i`<div class="table-wrap">
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
      (a) => i`<tr>
                        <td class="bursts__ts">${t(a.ts)}</td>
                        <td>
                          <code>${a.ga}</code>
                          ${a.label ? i`<span class="muted small">${a.label}</span>` : d}
                        </td>
                        <td><code>${a.dev_source}</code></td>
                        <td><code>${a.value ?? "—"}</code></td>
                      </tr>`
    )}
                  </tbody>
                </table>
              </div>
              ${e.telegrams.length > s ? i`<p class="muted small">… und ${e.telegrams.length - s} weitere</p>` : d}`}
        </div>
      </section>
    `;
  }
  // Iter 41: Burst-Detector-Card -----------------------------------------
  _renderBursts() {
    const e = this._bursts, t = (n) => n.toLocaleString("de-DE"), s = (n) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), r = this._filters.topNBursts, a = e.bursts.slice(0, r);
    return i`
      <section class="mh-card bursts">
        <header class="card-head">
          <h3>Telegrammfluten (Bursts)</h3>
          <div class="card-head__meta">
            ${this._renderInlineTopN(this._filters.topNBursts, (n) => this._onTopNBursts(n))}
            <span class="muted small">
              ${e.bursts.length} Spitzen über ${s(e.threshold_pct)} % Buslast
              (${e.window_seconds}s-Fenster)
            </span>
          </div>
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
      (n) => i`<tr>
                  <td class="bursts__ts">${this._formatTs(n.bucket)}</td>
                  <td class="num">${t(n.telegrams)}</td>
                  <td class="num bursts__pct">${s(n.busload_pct)} %</td>
                  <td class="num">${n.ga_count}</td>
                  <td class="num">${n.source_count}</td>
                </tr>`
    )}
            </tbody>
          </table>
        </div>
        ${e.bursts.length > r ? i`<p class="muted small">… und ${e.bursts.length - r} weitere</p>` : d}
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
            Periode über 48 Std — die Counter-Tabelle liefert Telegramm-Counts pro
            Stunde/Tag, aber keine Source-Adressen, keine Werte und keine Repeats.
            Live-KPIs darunter zeigen die letzten 48 Std aus den Roh-Telegrammen.
          </p>
        </div>
      </div>
    `;
  }
  _renderLongTerm() {
    const e = this._longTerm, t = Math.max(1, ...e.series.map((a) => a.count)), s = (a) => a.toLocaleString("de-DE"), r = this._filters.topNLongTerm;
    return i`
      <section class="mh-card long-term">
        <header class="card-head">
          <h3>Long-Term-Sicht</h3>
          <div class="card-head__meta">
            ${this._renderInlineTopN(
      this._filters.topNLongTerm,
      (a) => this._onTopNLongTerm(a)
    )}
            <span class="muted small">
              ${s(e.total)} Telegramme · ${e.bucket === "day" ? "Tages-Buckets" : "Stunden-Buckets"}
            </span>
          </div>
        </header>
        <div class="long-term__body">
          <div class="long-term__chart">
            ${e.series.length === 0 ? i`<p class="muted">Keine Daten in der Counter-Tabelle.</p>` : i`<div class="long-term__bars">
                  ${e.series.map(
      (a) => i`<div
                      class="long-term__bar"
                      style=${`height: ${a.count / t * 100}%`}
                      title="${a.bucket} — ${s(a.count)}"
                    ></div>`
    )}
                </div>`}
          </div>
          <div class="long-term__top">
            <h4>Top-GAs in der Periode</h4>
            ${e.top_gas.length === 0 ? i`<p class="muted small">Keine GAs aktiv.</p>` : i`<ol class="long-term__top-list">
                  ${e.top_gas.slice(0, r).map(
      (a) => i`<li>
                      <code>${a.ga}</code>
                      ${a.label ? i`<span class="muted small">${a.label}</span>` : d}
                      <span class="long-term__top-count">${s(a.count)}</span>
                    </li>`
    )}
                </ol>`}
          </div>
        </div>
      </section>
    `;
  }
  _formatBucket(e) {
    return e < 60 ? `${e}s` : e < 3600 ? `${Math.round(e / 60)}min` : `${Math.round(e / 3600)}h`;
  }
  _severityLabel(e) {
    switch (e) {
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
        ${this._apiErrors.size > 0 && !this._apiErrorsDismissed ? this._renderApiErrorBanner() : d}
        ${this._busAnalysisLoaded && !this._busAnalysisEnabled ? i`<div class="bus-analysis-banner">
              <strong>Bus-Analyse ist aus.</strong>
              Es werden keine neuen Telegramme erfasst — bestehende Daten bleiben
              sichtbar, altern aber raus (Raw 48 h, Counter 365 Tage). Toggle in
              der Filter-Leiste oben rechts schaltet sie wieder ein.
            </div>` : d}
        ${this._error ? i`<div class="error">${this._error}</div>` : d}
        ${this._alarms !== null && this._alarms.triggered_count > 0 ? this._renderAlarmBanner() : d}

        ${this._isLongTermMode() ? this._renderLongTermBanner() : d}

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
          ${this._loading && this._summary === null ? i`<p class="muted">lade…</p>` : this._renderKpis()}
        </section>

        ${this._health !== null ? this._renderHealthScore() : d}

        <section class="mh-card">
          <header class="card-head">
            <h3>Top-Sender (Gruppenadressen)</h3>
            <div class="card-head__meta">
              ${this._renderInlineTopN(this._filters.topN, (e) => this._onTopN(e))}
              <span class="muted small">
                Welche GA sendet am häufigsten? · ${this._top.length} sichtbar
              </span>
            </div>
          </header>
          ${this._renderTopTable()}
        </section>

        ${this._topBySource.length > 0 ? i`<section class="mh-card">
              <header class="card-head">
                <h3>Top-Geräte (Source-Adressen)</h3>
                <div class="card-head__meta">
                  ${this._renderInlineTopN(
      this._filters.topNDevices,
      (e) => this._onTopNDevices(e)
    )}
                  <span class="muted small">
                    Welches physische Gerät erzeugt am meisten Last?
                  </span>
                </div>
              </header>
              ${this._renderTopBySource()}
            </section>` : d}

        ${this._detail !== null || this._detailLoading || this._sourceDetail !== null || this._sourceDetailLoading ? this._renderDetailPane() : d}

        ${this._timeline !== null && this._timeline.items.length > 0 ? i`<section class="mh-card">
              <header class="card-head">
                <h3>Tagesverlauf (Top-5, ${this._timeline.bucket_minutes}-Min-Buckets)</h3>
              </header>
              <knx-timeline-chart
                .items=${this._timeline.items}
                .width=${800}
                .height=${140}
              ></knx-timeline-chart>
            </section>` : d}

        ${this._heatmap !== null && this._heatmap.gas.length > 0 ? this._renderHeatmap() : d}

        ${this._trend !== null && (this._trend.total_now > 0 || this._trend.total_prev > 0) ? this._renderTrend() : d}

        ${this._bursts !== null && this._bursts.bursts.length > 0 ? this._renderBursts() : d}
        ${this._silence !== null && this._silence.alarm_count > 0 ? this._renderSilenceAlarms() : d}
        ${this._busHealth !== null && this._busHealth.summary.total > 0 ? this._renderBusHealth() : d}

        ${this._sensitiveLog !== null && this._sensitiveLog.addresses.length > 0 ? this._renderSensitiveLog() : d}
        ${this._orphans !== null && (this._orphans.missing_in_log.length > 0 || this._orphans.extra_in_log.length > 0) ? this._renderOrphans() : d}

        ${this._longTerm !== null ? this._renderLongTerm() : d}

        ${this._toast ? i`<div class="toast">${this._toast}</div>` : d}
      </div>
    `;
  }
  _renderTopTable() {
    if (this._loading && this._top.length === 0)
      return i`<p class="muted">lade…</p>`;
    if (this._top.length === 0)
      return i`<p class="muted">Keine Telegramme in diesem Zeitraum.</p>`;
    const e = this._topSortKey, t = this._topSortDir, s = da(this._top, e, t), a = e !== "rate_per_min" || t !== "desc" ? i`<p
          class="muted small"
          data-test="sort-hint"
          title="Top-N wird vom Backend nach Tel/Min ausgewaehlt — die Sortierung wirkt nur auf diese Auswahl, nicht auf alle GAs."
        >
          ⓘ Sortierung wirkt nur auf die Top-${this._filters.topN} nach
          Tel/Min — andere GAs sind nicht in der Liste.
        </p>` : null;
    return i`
      ${a}
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
                GA${this._sortArrow(e, "ga", t)}
              </th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("label")}
                title="Nach Label sortieren"
              >
                Label${this._sortArrow(e, "label", t)}
              </th>
              <th>DPT</th>
              <th
                class="num sortable"
                @click=${() => this._toggleTopSort("rate_per_min")}
                title="Nach Telegrammen/Min sortieren"
              >
                Tel/Min${this._sortArrow(e, "rate_per_min", t)}
              </th>
              <th
                class="num sortable"
                @click=${() => this._toggleTopSort("recommended_rate")}
                title="Nach Soll-Rate sortieren"
              >
                Soll${this._sortArrow(e, "recommended_rate", t)}
              </th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("severity")}
                title="Nach Schweregrad sortieren"
              >
                Status${this._sortArrow(e, "severity", t)}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${s.map(
      (n, o) => i`<tr
                class=${`row-${n.severity} ${n.acknowledged ? "ack" : ""} ${this._selectedGa === n.ga ? "selected" : ""}`}
                @click=${() => void this._onSelectGa(n.ga)}
              >
                <td class="num muted">${o + 1}</td>
                <td><code class="ga">${n.ga}</code></td>
                <td class="label-cell" title=${n.label ?? ""}>
                  ${n.label ?? i`<span class="muted">—</span>`}
                </td>
                <td>
                  ${n.dpt ? i`<code
                        class=${`dpt ${n.dpt_inferred ? "dpt--inferred" : ""}`}
                        title=${n.dpt_inferred ? "DPT geraten aus Werten (im ETS-Projekt nicht gepflegt)" : ""}
                        >${n.dpt}${n.dpt_inferred ? i`<span class="dpt__hint" aria-hidden="true">?</span>` : d}</code
                      >` : i`<span class="muted">—</span>`}
                </td>
                <td class="num strong">${n.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td class="num muted">${n.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td>${this._renderTopRowStatus(n)}</td>
                <td class="actions">
                  ${n.acknowledged ? i`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(c) => {
        c.stopPropagation(), this._unackGa(n.ga);
      }}
                      >
                        ✗ Ack entfernen
                      </button>` : i`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(c) => {
        c.stopPropagation(), this._ackGa(n.ga);
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
    const e = this._detail !== null || this._detailLoading, t = () => e ? this._closeDetail() : this._closeSourceDetail();
    return i`
      <div
        class="detail-backdrop"
        @click=${t}
        aria-hidden="true"
      ></div>
      <aside
        class="mh-card detail-pane"
        role="dialog"
        aria-modal="true"
        aria-label=${this._detailPaneAriaLabel()}
      >
        <header class="card-head detail-head">
          ${this._renderDetailHead()}
          <button
            class="mh-btn mh-btn--sm mh-btn--ghost detail-close"
            title="Schliessen (Escape)"
            aria-label="Detail schliessen"
            @click=${t}
          >
            ✕ Schliessen
          </button>
        </header>
        <div class="detail-body">${this._renderDetailInner()}</div>
      </aside>
    `;
  }
  _detailPaneAriaLabel() {
    return this._detail !== null ? `Detail ${this._detail.ga} — ${this._detail.label ?? ""}` : this._sourceDetail !== null ? `Geraete-Detail ${this._sourceDetail.dev_source}` : "Detail laedt";
  }
  _renderDetailHead() {
    if (this._detail !== null)
      return i`<div class="detail-head-text">
        <h3>${this._detail.ga} — ${this._detail.label ?? "Detail"}</h3>
        <span class="muted small">
          Gerät:
          <code>${this._detail.dev_source || "?"}</code>
          ${this._detail.dpt ? i` • DPT <code>${this._detail.dpt}</code>` : d}
        </span>
      </div>`;
    if (this._sourceDetail !== null) {
      const e = this._sourceDetail, t = () => {
        this._selectedSource !== null && this._loadSourceDetail(this._selectedSource);
      };
      return i`<div class="detail-head-text">
        <h3>
          Gerät <code>${e.dev_source}</code>
          <button
            class="mh-btn mh-btn--sm mh-btn--ghost source-detail-reload"
            title="Geraete-Detail neu laden"
            aria-label="Geraete-Detail neu laden"
            @click=${t}
          >
            ⟳
          </button>
        </h3>
        <span class="muted small">
          ${e.total_count.toLocaleString("de-DE")} Telegramme ·
          ${e.ga_count} GAs
        </span>
      </div>`;
    }
    return i`<div class="detail-head-text"><h3>Detail</h3></div>`;
  }
  _renderDetailInner() {
    return this._detail !== null ? this._renderDetailBody(this._detail) : this._detailLoading ? i`<p class="muted">lade Details…</p>` : this._sourceDetail !== null ? this._renderSourceDetailBody(this._sourceDetail) : this._sourceDetailLoading ? i`<p class="muted">lade Geräte-Details…</p>` : i``;
  }
  _renderDetailBody(e) {
    const t = e.recommendation;
    return i`

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
          ${t.estimated_reduction_pct !== null ? i`<div class="detail-stat">
                <span class="muted small">Geschaetzte Reduktion</span>
                <strong>−${t.estimated_reduction_pct.toLocaleString(
      "de-DE",
      { maximumFractionDigits: 0 }
    )} %</strong>
              </div>` : d}
        </div>

        <div class=${`recommendation rec-${t.severity}`}>
          <strong>Empfehlung:</strong>
          <p>${t.text}</p>
        </div>

        ${e.findings.length > 0 ? this._renderGaDetailFindings(e.findings) : d}

        ${e.value_history.length >= 2 ? i`<div class="value-history">
              <strong>Wertverlauf:</strong>
              <knx-value-sparkline
                .points=${e.value_history}
                .width=${800}
                .height=${100}
              ></knx-value-sparkline>
            </div>` : d}

        ${e.device || e.manufacturer_hints ? this._renderDeviceInfo(e) : d}

        ${e.sibling_gas.length > 0 ? this._renderSiblingGas(e) : d}

        ${this._renderHaKnxLinks(e)}
    `;
  }
  // Iter detail-topn: GA-Detail-Findings ("Erkannte Muster") jetzt mit
  // TopN-Selektor (Default 10) + "und N weitere"-Hinweis. Vorher wurde
  // die Liste komplett gerendert — bei findingsreichen GAs (DPT-Mismatch
  // mit vielen unterschiedlichen Mustern) war der Detail-Drawer
  // entsprechend lang.
  _renderGaDetailFindings(e) {
    const t = this._filters.topNGaFindings, s = e.slice(0, t), r = e.length - s.length;
    return i`<div class="findings">
      <div class="source-detail-section-head">
        <strong>Erkannte Muster (${e.length}):</strong>
        ${this._renderInlineTopN(
      t,
      (a) => this._onTopNGaFindings(a)
    )}
      </div>
      <ul>
        ${s.map(
      (a) => i`<li class=${`finding-${a.severity}`}>
            <span class=${`mh-pill ${this._severityPillClass(a.severity)}`}>
              ${a.kind}
            </span>
            <span>${a.text}</span>
          </li>`
    )}
      </ul>
      ${r > 0 ? i`<p class="muted small">… und ${r} weitere</p>` : d}
    </div>`;
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
  _renderHaKnxLinks(e) {
    const t = `https://knx-user-forum.de/forum/search?searchword=${encodeURIComponent(
      e.ga
    )}`, s = this._apiFilters(), r = { from: s.from, to: s.to }, a = this.api?.knxStatsGaExportUrl(e.ga, "csv", r) ?? "", n = this.api?.knxStatsGaExportUrl(e.ga, "json", r) ?? "";
    return i`
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
              href=${t}
              target="_blank"
              rel="noopener noreferrer"
              title="KNX-User-Forum nach GA-Code durchsuchen"
              >Im KNX-User-Forum suchen ↗</a
            >
          </li>
          <li>
            <a
              href=${a}
              download
              title="Werteverlauf als CSV-Datei herunterladen (max 50.000 Samples)"
              >⤓ CSV-Export</a
            >
          </li>
          <li>
            <a
              href=${n}
              download
              title="Werteverlauf als JSON-Datei herunterladen (max 50.000 Samples)"
              >⤓ JSON-Export</a
            >
          </li>
        </ul>
      </div>
    `;
  }
  _renderDeviceInfo(e) {
    const t = e.device, s = e.manufacturer_hints;
    return i`
      <div class="device-info">
        ${t ? i`<strong>
              Gerät: ${t.manufacturer || "?"}
              ${t.name ? i` — ${t.name}` : d}
              ${t.product ? i`<span class="muted small">(${t.product})</span>` : d}
            </strong>` : i`<strong>Hersteller-Hinweise</strong>`}
        ${s && s.tips.length > 0 ? i`<ul class="hints">
              ${s.tips.map((r) => i`<li>${r}</li>`)}
            </ul>` : d}
        ${s?.doc_url ? i`<p class="muted small">
              Hersteller-Doku:
              <a href=${s.doc_url} target="_blank" rel="noopener noreferrer">
                ${s.doc_url}
              </a>
            </p>` : d}
      </div>
    `;
  }
  // ===================================================================
  // Iter D.2 (knx-detail-panes): Source-Detail-Body.
  // ===================================================================
  //
  // Aufbau analog zum GA-Detail-Body (siehe `_renderDetailBody`):
  // - KPI-Reihe (Total / GAs / Bus-Anteil / Wiederhol-Quote)
  // - Stille-Status (prominent wenn silent_alarm)
  // - GA-Liste sortiert nach count desc, jede Zeile klickbar -> oeffnet
  //   GA-Detail (kein zweites Modal, Architektur-Entscheid aus
  //   knx_detail_panes_konzept.md)
  // - Geraete-Info (device + manufacturer_hints) wie im GA-Detail
  //
  // Zukuenftige Erweiterungen: Findings-Liste (Iter H), Trend-Compare
  // (Iter I) als zusaetzliche Sektionen.
  _renderSourceDetailBody(e) {
    return i`
      <div class="source-detail-kpis">
        ${this._renderSourceDetailKpi(
      "Telegramme gesamt",
      e.total_count.toLocaleString("de-DE")
    )}
        ${this._renderSourceDetailKpi(
      "Aktive GAs",
      String(e.ga_count)
    )}
        ${this._renderSourceDetailKpi(
      "Bus-Anteil",
      `${e.share_pct.toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })} %`
    )}
        ${this._renderSourceDetailKpi(
      "Wiederhol-Quote",
      `${e.repeat_ratio_pct.toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })} %`
    )}
      </div>

      ${this._renderSourceDetailSilent(e)}

      ${this._renderSourceDetailTrend(e)}

      ${this._renderSourceDetailGas(e)}

      ${this._renderSourceDetailFindings(e)}

      ${this._renderRecommendationCard()}

      ${e.device || e.manufacturer_hints ? this._renderDeviceInfo({
      device: e.device,
      manufacturer_hints: e.manufacturer_hints
    }) : d}
    `;
  }
  // Iter L1.4: Recommendation-Card. Default: collapsed; aufklappen
  // triggert API-Call + Anzeige. Headline (Mode-Pill + Empfehlung)
  // ist immer sichtbar, sobald der API-Call fertig ist.
  _renderRecommendationCard() {
    return this._selectedSource === null ? i`` : i`
      <section class="mh-card recommendation-card">
        <header class="card-head recommendation-card__head">
          <button
            type="button"
            class="recommendation-card__toggle"
            @click=${() => this._toggleRecommendation()}
            aria-expanded=${this._recommendationExpanded ? "true" : "false"}
          >
            <span class="recommendation-card__caret">
              ${this._recommendationExpanded ? "▾" : "▸"}
            </span>
            <h3>Sende-Modus &amp; Empfehlung</h3>
          </button>
          ${this._renderRecommendationHeadline()}
        </header>
        ${this._recommendationExpanded ? this._renderRecommendationBody() : d}
      </section>
    `;
  }
  _renderRecommendationHeadline() {
    if (this._recommendationLoading)
      return i`<span class="muted small">Lade Empfehlung...</span>`;
    if (this._recommendationError !== "")
      return i`<span class="mh-pill mh-pill--error">Fehler</span>`;
    const e = this._recommendation;
    if (e === null)
      return i`<span class="muted small">Klicken zum Laden</span>`;
    const t = this._renderRecommendationModePill(e.headline_mode), s = this._renderRecommendationConfidencePill(e.confidence);
    return i`<span class="recommendation-card__pills">${t} ${s}</span>`;
  }
  // Iter R6: Pill-Render in pure ``recommendation-pills`` ausgelagert.
  // Diese Wrapper bleiben als private Methoden erhalten, weil Subviews
  // (Headline, GA-Tabelle) die gleichen Aufrufstellen nutzen — der
  // Bezug zur ``KnxStatsSourceRecommendationDto``-Typisierung bleibt
  // hier zentral.
  _renderRecommendationModePill(e) {
    return Pr(e);
  }
  _renderRecommendationConfidencePill(e) {
    return zr(e);
  }
  _renderRecommendationBody() {
    if (this._recommendationLoading)
      return i`<p class="muted">Berechne Empfehlung — kann ein paar Sekunden dauern...</p>`;
    if (this._recommendationError !== "")
      return i`<div class="recommendation-card__error">
        <p class="mh-error">${this._recommendationError}</p>
        <button
          type="button"
          class="mh-button"
          @click=${() => {
        this._selectedSource && this._loadRecommendation(this._selectedSource);
      }}
        >
          Erneut versuchen
        </button>
      </div>`;
    const e = this._recommendation;
    return e === null ? i`<p class="muted">
        Geraet hat im aktuellen Zeitraum keine Telegramme — keine
        Empfehlung verfuegbar.
      </p>` : i`
      <p class="recommendation-card__headline">${e.headline_recommendation}</p>
      ${e.reasoning.length > 0 ? i`<details class="recommendation-card__reasoning">
            <summary>Begründung (${e.reasoning.length})</summary>
            <ul>
              ${e.reasoning.map(
      (t) => i`<li>${t}</li>`
    )}
            </ul>
          </details>` : d}
      ${this._renderDeviceProfileEditor()}
      ${this._renderRecommendationGaTable(e)}
      <p class="muted small recommendation-card__footer">
        Berechnet am ${e.generated_at} fuer Geraet
        <code>${e.dev_source}</code>.
      </p>
    `;
  }
  // Iter L2.4 / L2.5: Geraete-Profil-Anzeige.
  // ETS-Discovery liefert Hersteller + Modell automatisch — Anzeige
  // ohne User-Pflegeaufwand. `knx_devices`-Eintrag (User-Override)
  // hat Vorrang, wenn gepflegt.
  _renderDeviceProfileEditor() {
    const e = this._device;
    if (this._deviceEditing)
      return this._renderDeviceProfileForm();
    const t = e?.manufacturer ?? null, s = e?.model ?? null, r = e?.ets ?? null, a = !!(t || s), n = !!(r?.manufacturer || r?.model);
    let o;
    return a ? o = i`<span>
        ${t ?? "—"}${s ? i` / ${s}` : d}
        <span class="muted small">(User-Override)</span>
      </span>` : n ? o = i`<span>
        ${r.manufacturer ?? "—"}${r.model ? i` / ${r.model}` : d}
        <span class="muted small">(aus ETS-Projekt)</span>
      </span>` : o = i`<span class="muted">
        kein Geraete-Profil verfuegbar (weder ETS noch Override)
      </span>`, i`
      <div class="recommendation-card__device-profile">
        <strong>Geraet:</strong>
        ${o}
        ${e?.notes ? i`<span class="muted small">"${e.notes}"</span>` : d}
        <button
          type="button"
          class="mh-button mh-button--ghost"
          @click=${() => this._startEditDevice()}
        >
          ${a ? "Override bearbeiten" : "Override anlegen"}
        </button>
      </div>
    `;
  }
  _renderDeviceProfileForm() {
    return i`
      <div class="recommendation-card__device-form">
        <label>
          <span class="muted small">Hersteller</span>
          <input
            type="text"
            .value=${this._deviceDraft.manufacturer ?? ""}
            ?disabled=${this._deviceSaving}
            @input=${(e) => this._onDeviceDraftChange(
      "manufacturer",
      e.target.value
    )}
          />
        </label>
        <label>
          <span class="muted small">Modell</span>
          <input
            type="text"
            .value=${this._deviceDraft.model ?? ""}
            ?disabled=${this._deviceSaving}
            @input=${(e) => this._onDeviceDraftChange(
      "model",
      e.target.value
    )}
          />
        </label>
        <label>
          <span class="muted small">Notiz (optional)</span>
          <input
            type="text"
            .value=${this._deviceDraft.notes ?? ""}
            ?disabled=${this._deviceSaving}
            @input=${(e) => this._onDeviceDraftChange(
      "notes",
      e.target.value
    )}
          />
        </label>
        ${this._deviceError ? i`<p class="mh-error">${this._deviceError}</p>` : d}
        <div class="recommendation-card__device-form-actions">
          <button
            type="button"
            class="mh-button"
            ?disabled=${this._deviceSaving}
            @click=${() => void this._saveDevice()}
          >
            ${this._deviceSaving ? "Speichere..." : "Speichern"}
          </button>
          <button
            type="button"
            class="mh-button mh-button--ghost"
            ?disabled=${this._deviceSaving}
            @click=${() => this._cancelEditDevice()}
          >
            Abbrechen
          </button>
        </div>
      </div>
    `;
  }
  _renderRecommendationGaTable(e) {
    return e.ga_recommendations.length === 0 ? i`` : i`
      <table class="recommendation-card__table">
        <thead>
          <tr>
            <th>GA</th>
            <th>DPT</th>
            <th>aktuell</th>
            <th>empfohlen</th>
            <th>Sendezyklus</th>
            <th>Hysterese</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          ${e.ga_recommendations.map(
      (t) => i`<tr
              class=${`recommendation-card__row recommendation-card__row--${t.severity}`}
              title=${t.rationale ?? ""}
            >
              <td><code>${t.ga}</code> ${t.label ? i`<span class="muted small">${t.label}</span>` : d}</td>
              <td>${t.dpt ?? "—"}</td>
              <td>${this._renderRecommendationModePill(t.observed.mode)}</td>
              <td>${t.recommended_mode === null ? i`<span class="muted">—</span>` : i`${this._renderRecommendationModePill(t.recommended_mode)}
                  ${this._renderRecommendationSourcePill(t.source ?? null)}`}</td>
              <td class="recommendation-cycle">
                ${this._renderRecommendationCycle(t)}
              </td>
              <td>${t.recommended_hysteresis ?? "—"}</td>
              <td>${this._renderRecommendationSeverityPill(t.severity)}</td>
            </tr>`
    )}
        </tbody>
      </table>
    `;
  }
  // Iter UX-5: Sendezyklus-Spalte mit klarer, modus-abhaengiger
  // Beschriftung. Vorher stand nur "(5–30 Min)" hinter dem Modus-Pill —
  // ohne Kontext, was die Zahl bedeutet (Heartbeat? Maximalrate?
  // Periode?).
  _renderRecommendationCycle(e) {
    return Hr(e);
  }
  _renderRecommendationSourcePill(e) {
    return Cr(e ?? null);
  }
  _renderRecommendationSeverityPill(e) {
    return Mr(e);
  }
  // Iter I (knx-detail-panes): Trend-Compare-Block. Severity-Klassi-
  // fikation analog zur globalen Trend-Card (`_classifyTrendSeverity`).
  // Bei kurzen Perioden liefert der Backend trend=null — kein Render.
  _renderSourceDetailTrend(e) {
    const t = e.trend ?? null;
    if (t === null)
      return i``;
    const s = this._classifySourceTrendSeverity(t.delta_pct), r = t.delta_pct === null ? "neu" : `${t.delta_pct > 0 ? "+" : ""}${t.delta_pct.toLocaleString(
      "de-DE",
      { minimumFractionDigits: 1, maximumFractionDigits: 1 }
    )} %`;
    return i`<div
      class=${`source-detail-trend source-detail-trend--${s}`}
    >
      <strong>Trend gegenüber Vorperiode:</strong>
      <span class="muted small">
        jetzt ${t.count_now.toLocaleString("de-DE")} ·
        zuvor ${t.count_prev.toLocaleString("de-DE")} ·
        <strong>${r}</strong>
      </span>
    </div>`;
  }
  // Iter I: Ampel-Schwellen wie globale Trend-Card. delta_pct=null
  // => yellow ("neu" bei leerer Vorperiode). 1h/6h-Sonderbehandlung
  // entfaellt — Backend liefert bei kurzen Perioden trend=null.
  _classifySourceTrendSeverity(e) {
    if (e === null) return "yellow";
    const t = Math.abs(e);
    return t < Lt ? "green" : t < zt ? "yellow" : t < Ot ? "orange" : "red";
  }
  // Iter H (knx-detail-panes): Findings dieses Geraets. Klick auf
  // Code-Link setzt window.location.hash auf
  // "#findings?source=<dev_source>" — messagehub-panel.ts liest den
  // Hash beim Tab-Switch und aktiviert den Findings-Tab mit
  // vorbefuelltem Source-Filter.
  _renderSourceDetailFindings(e) {
    const t = e.findings ?? [];
    if (t.length === 0)
      return i``;
    const s = this._filters.topNSourceDetailFindings, r = t.slice(0, s), a = t.length - r.length;
    return i`<div class="source-detail-findings">
      <div class="source-detail-section-head">
        <strong>Findings dieses Geräts (${t.length}):</strong>
        ${this._renderInlineTopN(
      s,
      (n) => this._onTopNSourceDetailFindings(n)
    )}
      </div>
      <ul class="source-detail-findings__list">
        ${r.map((n) => this._renderSourceDetailFinding(n, e.dev_source))}
      </ul>
      ${a > 0 ? i`<p class="muted small">… und ${a} weitere</p>` : d}
    </div>`;
  }
  _renderSourceDetailFinding(e, t) {
    return i`<li class=${`source-detail-finding finding-${e.severity}`}>
      <span class=${`mh-pill ${this._findingPillClass(e.severity)}`}>
        ${e.severity}
      </span>
      <a
        href="#findings?source=${encodeURIComponent(t)}"
        class="source-detail-finding__link"
        @click=${(s) => this._onSourceDetailFindingClick(s, t)}
        title="Findings-Tab oeffnen, gefiltert auf diese Source"
      >
        <code>${e.code}</code>
      </a>
      <span class="source-detail-finding__title">
        ${e.title || e.description || ""}
      </span>
      <span class="muted small source-detail-finding__count">
        ${e.occurrence_count}×
      </span>
    </li>`;
  }
  _findingPillClass(e) {
    switch (e) {
      case "error":
        return "mh-pill--error";
      case "warning":
        return "mh-pill--warning";
      case "info":
        return "mh-pill--info";
      case "debug":
      default:
        return "mh-pill--neutral";
    }
  }
  // Iter H: Klick auf einen Finding-Code-Link. window.location.hash
  // setzen reicht — der Findings-Tab des messagehub-panels reagiert
  // auf den hashchange. Default-Anchor-Verhalten verhindern wir
  // bewusst NICHT, weil das Setzen des Hash bereits den hashchange
  // feuert und der Browser sonst kein Routing macht.
  _onSourceDetailFindingClick(e, t) {
    e.preventDefault(), window.location.hash = `findings?source=${encodeURIComponent(t)}`;
  }
  _renderSourceDetailKpi(e, t) {
    return i`<div class="source-detail-kpi">
      <span class="muted small">${e}</span>
      <strong>${t}</strong>
    </div>`;
  }
  _renderSourceDetailSilent(e) {
    if (e.silent_alarm) {
      const t = e.silent_minutes ?? 0;
      return i`<div
        class="source-detail-silent-alarm"
        role="status"
        aria-live="polite"
      >
        <strong>⚠ Gerät ist stumm</strong>
        <p class="muted small">
          Letzter Trafik vor ${this._formatSilence(t)} —
          ueberschreitet die konfigurierte Stille-Schwelle.
        </p>
      </div>`;
    }
    return e.silent_minutes !== null ? i`<p class="source-detail-silent muted small">
        Letzter Trafik vor ${this._formatSilence(e.silent_minutes)}.
      </p>` : i``;
  }
  _renderSourceDetailGas(e) {
    if (e.gas.length === 0)
      return i`<p class="muted small">Keine GAs in diesem Zeitraum.</p>`;
    const t = this._filters.topNSourceDetailGas, s = e.gas.slice(0, t), r = e.gas.length - s.length;
    return i`<div class="source-detail-ga-list">
      <div class="source-detail-section-head">
        <strong>GAs dieses Geräts (${e.ga_count}):</strong>
        ${this._renderInlineTopN(
      t,
      (a) => this._onTopNSourceDetailGas(a)
    )}
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>GA</th>
              <th>Label</th>
              <th>DPT</th>
              <th class="num">Tel/Min</th>
              <th class="num">Soll</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${s.map((a) => this._renderSourceDetailGaRow(a))}
          </tbody>
        </table>
      </div>
      ${r > 0 ? i`<p class="muted small">… und ${r} weitere</p>` : d}
    </div>`;
  }
  _renderSourceDetailGaRow(e) {
    const t = e.acknowledged ? "mh-pill--neutral" : this._severityPillClass(e.severity), s = e.acknowledged ? "✓ Bekannt" : this._severityLabel(e.severity);
    return i`<tr
      class=${`source-ga-row row-${e.severity} ${e.acknowledged ? "ack" : ""}`}
      @click=${() => void this._onSelectGa(e.ga)}
      title="GA-Detail oeffnen"
    >
      <td><code class="ga">${e.ga}</code></td>
      <td>${e.label ?? i`<span class="muted">—</span>`}</td>
      <td>
        ${e.dpt ? i`<code class="dpt">${e.dpt}</code>` : i`<span class="muted">—</span>`}
      </td>
      <td class="num strong">
        ${e.rate_per_min.toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}
      </td>
      <td class="num muted">
        ${e.recommended_rate.toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}
      </td>
      <td>
        <span class=${`mh-pill ${t}`}>${s}</span>
      </td>
    </tr>`;
  }
  _renderSiblingGas(e) {
    const t = this._filters.topNSiblings;
    return i`
      <div class="siblings">
        <div class="siblings__head">
          <strong>Andere GAs des Geräts <code>${e.dev_source}</code>:</strong>
          ${this._renderInlineTopN(
      this._filters.topNSiblings,
      (s) => this._onTopNSiblings(s)
    )}
        </div>
        <ul>
          ${e.sibling_gas.slice(0, t).map(
      (s) => i`<li
              class="sibling-row"
              @click=${() => void this._onSelectGa(s.ga)}
              title="Detail-Pane für ${s.ga} öffnen"
            >
              <code class="ga">${s.ga}</code>
              <span class="muted">${s.label ?? "—"}</span>
              <span class="num">
                ${s.rate_per_min.toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })} Tel/Min
              </span>
              <span class="num muted">${s.count}</span>
            </li>`
    )}
        </ul>
        ${e.sibling_gas.length > t ? i`<p class="muted small">
              … und ${e.sibling_gas.length - t} weitere
            </p>` : d}
      </div>
    `;
  }
  // Iter 57: Sortier-Klick toggelt Richtung bei gleichem Key, sonst
  // wechselt auf den neuen Key mit desc als Default (haeufigste Werte
  // oben — typisch fuer "Top-N"-Tabellen).
  _toggleDevicesSort(e) {
    this._devicesSortKey === e ? this._devicesSortDir = this._devicesSortDir === "desc" ? "asc" : "desc" : (this._devicesSortKey = e, this._devicesSortDir = e === "dev_source" ? "asc" : "desc");
  }
  // Iter 60 / U5: Sort-Toggle Top-Sender. Default-Direction asc fuer
  // String-Spalten (ga, label), desc fuer numerische und severity (red
  // top zeigt Probleme zuerst).
  _toggleTopSort(e) {
    this._topSortKey === e ? this._topSortDir = this._topSortDir === "desc" ? "asc" : "desc" : (this._topSortKey = e, this._topSortDir = e === "ga" || e === "label" ? "asc" : "desc");
  }
  _sortArrow(e, t, s) {
    return e !== t ? d : i`<span class="sort-arrow" aria-hidden="true">${s === "desc" ? "▼" : "▲"}</span>`;
  }
  _renderTopBySource() {
    const e = this._filters.topNDevices, t = this._devicesSortKey, s = this._devicesSortDir, r = [...this._topBySource].sort((a, n) => {
      let o;
      return t === "dev_source" ? o = a.dev_source.localeCompare(n.dev_source) : o = (a[t] || 0) - (n[t] || 0), s === "desc" ? -o : o;
    });
    return i`
      <div class="table-wrap">
        <table data-test="top-devices-table">
          <thead>
            <tr>
              <th>#</th>
              <th
                class="sortable"
                @click=${() => this._toggleDevicesSort("dev_source")}
                title="Nach Source-Adresse sortieren"
              >
                Gerät (Source)${this._sortArrow(t, "dev_source", s)}
              </th>
              <th>Hersteller / Modell</th>
              <th
                class="num sortable"
                @click=${() => this._toggleDevicesSort("ga_count")}
                title="Nach GA-Anzahl sortieren"
              >
                GAs${this._sortArrow(t, "ga_count", s)}
              </th>
              <th
                class="num sortable"
                @click=${() => this._toggleDevicesSort("count")}
                title="Nach Telegramm-Anzahl sortieren"
              >
                Telegramme${this._sortArrow(t, "count", s)}
              </th>
              <th class="num">Anteil</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${r.slice(0, e).map((a, n) => {
      const o = this._summary?.total_telegrams ?? 0, c = o > 0 ? a.count / o * 100 : 0, h = a.manufacturer ?? "", v = a.device_name ?? "", f = h && v ? `${h} — ${v}` : h || v, u = this._selectedSource === a.dev_source;
      return i`<tr
                class=${`top-device-row ${u ? "selected" : ""}`}
                @click=${() => void this._loadSourceDetail(a.dev_source)}
                title="Geraete-Detail oeffnen"
              >
                <td class="num muted">${n + 1}</td>
                <td><code class="ga">${a.dev_source}</code></td>
                <td class="device-cell">
                  ${f ? i`<span
                        class="muted small device-cell__text"
                        title=${f}
                        >${f}</span
                      >` : i`<span class="muted small">—</span>`}
                </td>
                <td class="num">${a.ga_count}</td>
                <td class="num strong">${a.count.toLocaleString("de-DE")}</td>
                <td class="num muted">
                  ${c.toLocaleString("de-DE", {
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
  async _ackBulk(e) {
    if (!this.api || !window.confirm(
      `Alle GAs des Geräts ${e} als bekannt markieren?`
    ))
      return;
    const t = window.prompt(
      `Notiz für Bulk-Ack ${e} (optional):`,
      "akzeptiert nach Prüfung"
    );
    if (t !== null)
      try {
        const { from: s, to: r } = Nt(this._filters.periodId), a = await this.api.acknowledgeKnxBulk(e, {
          note: t || void 0,
          from: s,
          to: r
        });
        this._showToast(
          `${e}: ${a.count} GAs als bekannt markiert`
        ), await this._load();
      } catch (s) {
        this._showToast(`Bulk-Ack fehlgeschlagen: ${s.message}`);
      }
  }
  _renderAlarmBanner() {
    const t = this._alarms.alarms.filter((s) => s.triggered);
    return i`
      <section class="alarm-banner">
        <strong>⚠ ${t.length} Alarm(e) aktiv</strong>
        <ul>
          ${t.map(
      (s) => i`<li>
              <span class="alarm-rule">${s.rule}</span>
              <span class="alarm-msg">${s.message}</span>
              ${this._renderAlarmDetails(s)}
            </li>`
    )}
        </ul>
      </section>
    `;
  }
  // Iter UX-1.0: silence_alarm bekommt aufklappbare Geraete-Liste mit
  // Hersteller + Name + GAs (zum Aufklappen pro Geraet).
  _renderAlarmDetails(e) {
    if (e.rule !== "silence_alarm") return i``;
    const t = e.details?.devices ?? [];
    return t.length === 0 ? i`` : i`
      <details class="alarm-details">
        <summary>Betroffene Geräte (${t.length})</summary>
        <ul class="alarm-details__devices">
          ${t.map((s) => {
      const r = s.manufacturer && s.device_name ? `${s.manufacturer} — ${s.device_name}` : s.manufacturer || s.device_name || "";
      return i`<li class="alarm-device">
              <details class="alarm-device__inner">
                <summary>
                  <code class="ga">${s.dev_source}</code>
                  ${r ? i`<span class="muted small">${r}</span>` : d}
                  <span class="muted small">
                    · stumm seit ${this._formatSilence(s.silent_minutes)}
                    · ${s.ga_count} GA${s.ga_count === 1 ? "" : "s"}
                  </span>
                </summary>
                ${s.gas.length > 0 ? i`<table class="alarm-device__gas">
                      <thead>
                        <tr>
                          <th>GA</th>
                          <th>Bezeichnung</th>
                          <th>DPT</th>
                          <th class="num">Telegramme</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${s.gas.map(
        (a) => i`<tr>
                            <td><code>${a.ga}</code></td>
                            <td>${a.label ?? "—"}</td>
                            <td>${a.dpt ?? "—"}</td>
                            <td class="num">${a.count}</td>
                          </tr>`
      )}
                      </tbody>
                    </table>` : i`<p class="muted small">
                      Keine GA-Telegramme im Auswertezeitraum.
                    </p>`}
              </details>
            </li>`;
    })}
        </ul>
      </details>
    `;
  }
  // Iter 61 / U3: Filter-Helper case-insensitive auf address/label/dpt.
  _matchesOrphanFilter(e, t) {
    if (e === "") return !0;
    const s = e.toLowerCase();
    return t.some(
      (r) => typeof r == "string" && r.toLowerCase().includes(s)
    );
  }
  /**
   * Iter 67 / WR-I: Trend-Vergleich aktuelle Periode vs. Vorperiode.
   * Eine Card mit Total-Delta + Top-3 Anstiege + Top-3 Abnahmen.
   * Vorperiode hat dieselbe Laenge unmittelbar davor.
   */
  _renderTrend() {
    const e = this._trend, t = e.total_delta_pct !== null ? `${e.total_delta_pct > 0 ? "+" : ""}${e.total_delta_pct.toLocaleString(
      "de-DE",
      { minimumFractionDigits: 1, maximumFractionDigits: 1 }
    )} %` : "neu", s = (c) => c.delta_pct === null ? c.delta_abs > 0 ? "neu" : "verstummt" : `${c.delta_pct > 0 ? "+" : ""}${c.delta_pct.toLocaleString("de-DE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    })} %`, r = this._classifyTrendSeverity(e.total_delta_pct), a = this._filters.topNTrend, n = this._isShortTrendPeriod(), o = this._isLongRetentionGapPeriod() && e.total_prev === 0;
    return i`
      <section class=${`mh-card trend trend--${r}`}>
        <header class="card-head">
          <h3>Trend gegenüber Vorperiode</h3>
          <div class="card-head__meta">
            ${o ? d : this._renderInlineTopN(
      this._filters.topNTrend,
      (c) => this._onTopNTrend(c)
    )}
            <span class="muted small">
              Aktuell ${e.total_now.toLocaleString("de-DE")} Telegramme ·
              zuvor ${e.total_prev.toLocaleString("de-DE")} ·
              <strong>${t}</strong>
            </span>
          </div>
        </header>
        ${o ? i`<p class="trend-retention-hint muted small">
              Vergleich nicht verfuegbar — keine Telegramme im
              Vorperioden-Zeitraum vorhanden. Bei einer frischen
              Installation laeuft der Counter erst voll, wenn genug
              Zeit verstrichen ist. Bei kurzen Perioden 1 Std / 6 Std
              probieren.
            </p>` : n ? i`<p class="trend-short-hint muted small">
                Hinweis: Bei kurzen Perioden vergleicht sich z. B. 04–05 Uhr mit
                03–04 Uhr — Tag/Nacht-Übergaenge und Automation-Trigger lassen
                die %-Werte oft 4-stellig wirken. Fuer aussagekraeftige Trends
                mind. 24 Std waehlen.
              </p>` : d}
        ${o ? d : i`<div class="trend-grid">
          <div class="trend-col">
            <strong>Größte Anstiege</strong>
            ${e.top_increase.length === 0 ? i`<p class="muted small">Keine signifikanten Anstiege.</p>` : i`<ul class="trend-list trend-list--up">
                  ${e.top_increase.slice(0, a).map(
      (c) => i`<li
                      class=${`trend-row ${this._selectedGa === c.ga ? "selected" : ""}`}
                      @click=${() => void this._onSelectGa(c.ga)}
                      title="GA-Detail oeffnen"
                    >
                      <code class="ga">${c.ga}</code>
                      <span class="trend-label muted"
                        >${c.label ?? "—"}</span
                      >
                      <span class="trend-delta trend-delta--up"
                        >+${c.delta_abs.toLocaleString("de-DE")} ·
                        ${s(c)}</span
                      >
                    </li>`
    )}
                </ul>`}
          </div>
          <div class="trend-col">
            <strong>Größte Rückgänge</strong>
            ${e.top_decrease.length === 0 ? i`<p class="muted small">Keine signifikanten Rückgänge.</p>` : i`<ul class="trend-list trend-list--down">
                  ${e.top_decrease.slice(0, a).map(
      (c) => i`<li
                      class=${`trend-row ${this._selectedGa === c.ga ? "selected" : ""}`}
                      @click=${() => void this._onSelectGa(c.ga)}
                      title="GA-Detail oeffnen"
                    >
                      <code class="ga">${c.ga}</code>
                      <span class="trend-label muted"
                        >${c.label ?? "—"}</span
                      >
                      <span class="trend-delta trend-delta--down"
                        >${c.delta_abs.toLocaleString("de-DE")} ·
                        ${s(c)}</span
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
  _classifyTrendSeverity(e) {
    if (this._isShortTrendPeriod()) return "green";
    if (e === null) return "yellow";
    const t = Math.abs(e);
    return t < Lt ? "green" : t < zt ? "yellow" : t < Ot ? "orange" : "red";
  }
  _isShortTrendPeriod() {
    return this._filters.periodId === "1h" || this._filters.periodId === "6h";
  }
  /**
   * Iter aiohttp-error-ZU9UA / Trend-Fix A + UX-P3.6: Perioden, bei
   * denen ein leeres total_prev "keine Vergleichsdaten" bedeutet
   * (statt eines echten Trends).
   *
   * Vor Iter 6 (Backend Trend-Counter): nur Raw-Source, also alles >=
   * 48h leer wenn Vorperiode ausserhalb 48h-Retention.
   *
   * Nach Iter 6: 24h+ liest aus Counter (365d-Retention). Wenn die
   * Counter-Tabelle aber bei langer Periode noch leer ist (frische
   * Installation, gerade erst eingeschaltet), zeigen wir trotzdem den
   * "kein Vergleich verfuegbar"-Hinweis statt einer leeren Card.
   *
   * 1h/6h sind ausgenommen — die brauchen Raw und sind in Retention.
   */
  _isLongRetentionGapPeriod() {
    return ["24h", "48h", "7d", "30d", "365d"].includes(
      this._filters.periodId
    );
  }
  /**
   * Iter 91 / WR-G: GA-Heatmap als CSS-Grid. Zeilen = Top-N GAs,
   * Spalten = Zeit-Buckets, Zellen = Telegramm-Counts mit Color-Intensity
   * relativ zum Maximum. SVG-frei (CSS-Grid + color-mix).
   */
  _renderHeatmap() {
    const e = this._heatmap;
    if (e.gas.length === 0 || e.buckets.length === 0) return i``;
    const t = e.matrix.flat().reduce((r, a) => a > r ? a : r, 1), s = (r) => r.slice(11, 16) || r;
    return i`
      <section class="mh-card heatmap-card">
        <header class="card-head">
          <h3>Aktivitäts-Heatmap</h3>
          <div class="card-head__meta">
            ${this._renderInlineTopN(
      this._filters.topNHeatmap,
      (r) => this._onTopNHeatmap(r),
      ra
    )}
            <span class="muted small">
              Top-${e.gas.length} GAs × ${e.buckets.length} ${e.bucket_minutes}-Min-Buckets · Maximum ${t} Telegramme/Bucket
            </span>
          </div>
        </header>
        <div class="heatmap-grid"
          style=${`--heatmap-cols: ${e.buckets.length};`}
        >
          <div class="heatmap-row heatmap-row--header">
            <div class="heatmap-cell heatmap-label"></div>
            ${e.buckets.map(
      (r) => i`<div
                class="heatmap-cell heatmap-cell--bucket"
                title=${r}
              >
                ${s(r)}
              </div>`
    )}
          </div>
          ${e.gas.map(
      (r, a) => i`<div class="heatmap-row">
              <div class="heatmap-cell heatmap-label" title=${r.label || ""}>
                <code>${r.ga}</code>
                <span class="muted small">${r.label ?? ""}</span>
              </div>
              ${e.matrix[a].map((n) => {
        const o = n === 0 ? 0 : Math.round(n / t * 100);
        return i`<div
                  class="heatmap-cell heatmap-cell--data"
                  style=${`background: color-mix(in srgb, var(--mh-warning) ${o}%, transparent);`}
                  title=${`${n} Telegramme`}
                >
                  ${n > 0 ? n : ""}
                </div>`;
      })}
            </div>`
    )}
        </div>
        <p class="muted small heatmap-legend">
          Intensität proportional zum Maximum (${t}). Klick auf
          GA-Code öffnet Detail-Pane.
        </p>
      </section>
    `;
  }
  _renderOrphans() {
    const e = this._orphans, t = (p, w) => this._orphansHidePlaceholders ? p.filter((m) => !Zr(m.address, w(m))) : p, s = t(e.missing_in_log, (p) => p.name), r = t(e.extra_in_log, (p) => p.label), a = s.filter(
      (p) => this._matchesOrphanFilter(this._orphansMissingFilter, [p.address, p.name, p.dpt])
    ), n = r.filter(
      (p) => this._matchesOrphanFilter(this._orphansExtraFilter, [p.address, p.label])
    ), o = this._filters.topNOrphansMissing, c = this._filters.topNOrphansExtra, h = a.slice(0, o), v = n.slice(0, c), f = e.missing_in_log.length - s.length, u = e.extra_in_log.length - r.length;
    return i`
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
              <span>Platzhalter ausblenden${this._orphansHidePlaceholders && f + u > 0 ? i` <span class="muted small">(${f + u})</span>` : d}</span>
            </label>
            <span class="muted small">
              Projekt: ${e.project_total} • geloggt: ${e.log_total}
            </span>
          </div>
        </header>
        <div class="orphans-grid">
          ${e.missing_in_log.length > 0 ? i`<div>
                <div class="orphans-col-head">
                  <strong
                    >Im Projekt, nie gesehen (${a.length}${this._orphansMissingFilter ? ` von ${e.missing_in_log.length}` : ""})</strong
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
                  ${h.map(
      (p) => i`<li>
                      <code>${p.address}</code>
                      <span>${p.name || "—"}</span>
                      ${p.dpt ? i`<code class="dpt">${p.dpt}</code>` : d}
                    </li>`
    )}
                </ul>
                ${a.length > o ? i`<p class="muted small">
                      … und ${a.length - o} weitere
                    </p>` : d}
              </div>` : d}
          ${e.extra_in_log.length > 0 ? i`<div>
                <div class="orphans-col-head">
                  <strong
                    >Geloggt, nicht im Projekt (${n.length}${this._orphansExtraFilter ? ` von ${e.extra_in_log.length}` : ""})</strong
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
                  ${v.map(
      (p) => i`<li>
                      <code>${p.address}</code>
                      <span>${p.label ?? "—"}</span>
                      <span class="muted num">${p.count}</span>
                    </li>`
    )}
                </ul>
                ${n.length > c ? i`<p class="muted small">
                      … und ${n.length - c} weitere
                    </p>` : d}
              </div>` : d}
        </div>
      </section>
    `;
  }
  _renderSilenceAlarms() {
    const e = this._silence, t = e.items.filter((r) => r.alarm);
    if (t.length === 0) return i``;
    const s = this._filters.topNSilence;
    return i`
      <section class="mh-card silence-card">
        <header class="card-head">
          <h3>Stille-Alarme (${e.alarm_count})</h3>
          <div class="card-head__meta">
            ${this._renderInlineTopN(this._filters.topNSilence, (r) => this._onTopNSilence(r))}
            <span class="muted small">
              Schwelle: &gt; ${e.max_silence_minutes} Min ohne Telegramm
            </span>
          </div>
        </header>
        <div class="table-wrap">
          <table data-test="silence-alarms-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Gerät (Source)</th>
                <th>Hersteller / Modell</th>
                <th class="num">GAs</th>
                <th class="num">Stumm seit</th>
                <th>Letzter Trafik</th>
              </tr>
            </thead>
            <tbody>
              ${t.slice(0, s).map((r, a) => {
      const n = r.manufacturer && r.device_name ? `${r.manufacturer} — ${r.device_name}` : r.manufacturer || r.device_name || "", o = this._selectedSource === r.dev_source;
      return i`<tr
                  class=${`silence-row ${o ? "selected" : ""}`}
                  @click=${() => void this._loadSourceDetail(r.dev_source)}
                  title="Geraete-Detail oeffnen"
                >
                  <td class="num muted">${a + 1}</td>
                  <td><code class="ga">${r.dev_source}</code></td>
                  <td class="device-cell">
                    ${n ? i`<span
                          class="muted small device-cell__text"
                          title=${n}
                          >${n}</span
                        >` : i`<span class="muted small">—</span>`}
                  </td>
                  <td class="num">${r.ga_count ?? 0}</td>
                  <td class="num strong">
                    ${this._formatSilence(r.silent_minutes)}
                  </td>
                  <td class="muted small">${this._formatTs(r.last_seen)}</td>
                </tr>`;
    })}
            </tbody>
          </table>
        </div>
        ${t.length > s ? i`<p class="muted small">
              … und ${t.length - s} weitere
            </p>` : d}
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
    const e = this._busHealth, t = e.summary.ratio_pct, s = t >= 1 ? "danger" : t >= 0.5 ? "warning" : t > 0 ? "elevated" : "ok", r = this._filters.topNBusHealth;
    return i`
      <section class="mh-card">
        <header class="card-head">
          <h3>Bus-Gesundheit (Wiederholrate)</h3>
          <div class="card-head__meta">
            ${e.per_ga.length > 0 ? this._renderInlineTopN(
      this._filters.topNBusHealth,
      (a) => this._onTopNBusHealth(a)
    ) : d}
            <span class="muted small">
              xknx-Repeated-Flag — hoher Wert deutet auf Verkabelung/EMV
            </span>
          </div>
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
        ${e.per_ga.length > 0 ? i`<div class="bus-health-list">
              <strong>Top-GAs mit Wiederholungen:</strong>
              <ul>
                ${e.per_ga.slice(0, r).map(
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
              ${e.per_ga.length > r ? i`<p class="muted small">
                    … und ${e.per_ga.length - r} weitere
                  </p>` : d}
            </div>` : d}
      </section>
    `;
  }
  _severityPillClass(e) {
    return Rt(e);
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
  _renderTopRowStatus(e) {
    if (e.acknowledged)
      return i`<span class="mh-pill mh-pill--neutral ack-pill" title="acknowledged">
        ✓ Bekannt
      </span>`;
    const t = e.severity, s = e.has_findings && t === "green" ? "yellow" : t, r = e.has_findings && t === "green" ? "auffällig" : this._severityLabel(s);
    return i`<span
      class=${`mh-pill ${this._severityPillClass(s)}`}
      title=${e.has_findings ? "Anti-Pattern erkannt — Detail-Pane zeigt mehr (Konstant-Wert-Spam, Read-Burst, Heartbeat)" : ""}
    >
      <span class="mh-pill__dot"></span>
      ${e.has_findings ? i`<span aria-hidden="true">⚠</span> ` : d}
      ${r}
    </span>`;
  }
};
g.styles = [
  L,
  ge,
  ae,
  W,
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

      /* Iter aiohttp-error-ZU9UA / UX-P3.4: Mobile-Responsive
         Filter-Bar. Default ist Zeile mit flex-wrap; auf < 640px
         legen sich die Filter-Groups untereinander, die Periode-Pills
         duerfen umbrechen und der Aktualisieren-Knopf wird full-width. */
      @media (max-width: 640px) {
        .filters {
          flex-direction: column;
          align-items: stretch;
          gap: var(--mh-space-3);
        }
        .filter-group {
          width: 100%;
        }
        .filter-group.toggle {
          width: auto;
        }
        .filters .seg {
          flex-wrap: wrap;
        }
        .filter-refresh-btn {
          width: 100%;
          justify-content: center;
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
        /* Iter detail-topn: vorher griff diese Regel auf undefinierte
           Tokens, deren Default-color "white" auf hellen HA-Themes
           weisse Schrift auf weissem Hintergrund erzeugte. Jetzt die
           definierten Accent-Tokens (siehe styles/tokens.ts), identisch
           zu .mh-btn--primary. */
        background: var(--mh-accent);
        color: var(--mh-accent-fg);
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
      /* Iter L1.4 — Recommendation-Card */
      .recommendation-card__head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .recommendation-card__toggle {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--mh-space-1);
        color: var(--mh-fg-default);
        font: inherit;
      }
      .recommendation-card__toggle h3 {
        margin: 0;
      }
      .recommendation-card__caret {
        font-size: 0.9em;
        line-height: 1;
        color: var(--mh-fg-muted);
      }
      .recommendation-card__pills {
        margin-left: auto;
        display: inline-flex;
        gap: var(--mh-space-1);
      }
      .recommendation-card__headline {
        margin: var(--mh-space-2) 0;
        font-weight: var(--mh-weight-semibold);
      }
      .recommendation-card__reasoning {
        margin: var(--mh-space-2) 0;
      }
      .recommendation-card__reasoning summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
      }
      .recommendation-card__reasoning ul {
        margin: var(--mh-space-1) 0 0 0;
        padding-left: var(--mh-space-4);
      }
      .recommendation-card__table {
        width: 100%;
        border-collapse: collapse;
        margin-top: var(--mh-space-2);
        font-size: var(--mh-text-sm);
      }
      .recommendation-card__table th,
      .recommendation-card__table td {
        text-align: left;
        padding: var(--mh-space-1) var(--mh-space-2);
        border-bottom: 1px solid var(--mh-divider);
        vertical-align: top;
      }
      .recommendation-card__row--deviation {
        background: var(--mh-error-soft);
      }
      .recommendation-card__row--warn {
        background: var(--mh-caution-soft);
      }
      /* Iter UX-5 — Sendezyklus-Spalte: Zahl gross, Beschreibung
         klein darunter. */
      .recommendation-cycle {
        white-space: nowrap;
      }
      .recommendation-cycle strong {
        display: block;
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
      }
      .recommendation-cycle .muted {
        white-space: normal;
      }
      /* Iter UX-6 — Source-Pill in der Empfohlen-Spalte */
      .recommendation-source-pill {
        margin-left: var(--mh-space-1);
        font-size: var(--mh-text-xs);
      }
      .recommendation-card__error {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
        align-items: flex-start;
      }
      .recommendation-card__footer {
        margin-top: var(--mh-space-3);
      }
      /* Iter L2.4 — Geraete-Profil-Editor */
      .recommendation-card__device-profile {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mh-space-2);
        margin: var(--mh-space-2) 0;
        padding: var(--mh-space-2);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm, 4px);
      }
      .recommendation-card__device-form {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
        margin: var(--mh-space-2) 0;
        padding: var(--mh-space-2);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm, 4px);
      }
      .recommendation-card__device-form label {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .recommendation-card__device-form input {
        padding: var(--mh-space-1) var(--mh-space-2);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm, 4px);
        background: var(--mh-surface-2);
        color: var(--mh-fg-default);
      }
      .recommendation-card__device-form-actions {
        display: flex;
        gap: var(--mh-space-2);
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
      /* Iter G (knx-detail-panes): klickbare Trend-Zeile.
         GA-Klick wechselt zum GA-Detail-Pane (Trend zeigt GAs, nicht
         Sources — siehe knx_detail_panes_konzept.md). */
      .trend-list .trend-row {
        cursor: pointer;
      }
      .trend-list .trend-row:hover {
        filter: brightness(1.05);
      }
      .trend-list .trend-row.selected {
        box-shadow: inset 3px 0 0 var(--mh-primary);
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
      /* Iter aiohttp-error-ZU9UA / UX-P3.3: Header mit Titel links,
         TopN-Selektor rechts. Wrappt bei schmalen Drawer-Breiten. */
      .siblings__head,
      /* Iter detail-topn: gleiche Layout-Logik fuer Source-Detail-
         GA-Tabelle, Source-Detail-Findings und GA-Detail-Findings. */
      .source-detail-section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mh-space-2);
        flex-wrap: wrap;
        margin-bottom: var(--mh-space-2);
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
      /* Iter UX-1.0 — Aufklappbare Geraete-Details fuer silence_alarm */
      .alarm-details {
        grid-column: 1 / -1;
        margin-top: var(--mh-space-1);
        width: 100%;
      }
      .alarm-details summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-xs);
      }
      .alarm-details__devices {
        list-style: none;
        margin: var(--mh-space-2) 0 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
        width: 100%;
      }
      .alarm-device {
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm, 4px);
        padding: var(--mh-space-1) var(--mh-space-2);
        width: 100%;
        box-sizing: border-box;
      }
      .alarm-device__inner {
        width: 100%;
      }
      .alarm-device__inner > summary {
        display: flex;
        align-items: center;
        gap: var(--mh-space-1);
        flex-wrap: wrap;
      }
      /* Iter UX-3 — Tabelle stretcht ueber die volle Card-Breite.
         Vorher schrumpfte <table> auf shrink-to-fit, weil weder
         alarm-device noch der innere <details>-Block eine explizite
         width hatten. Jetzt: alle Container 100% + table-layout fixed
         mit auto-Spalten + box-sizing border-box, damit das Padding
         nicht aus dem Banner austritt. */
      .alarm-device__gas {
        width: 100%;
        margin-top: var(--mh-space-2);
        border-collapse: collapse;
        font-size: var(--mh-text-xs);
        table-layout: auto;
      }
      .alarm-device__gas th,
      .alarm-device__gas td {
        text-align: left;
        padding: var(--mh-space-1);
        border-bottom: 1px solid var(--mh-divider);
      }
      .alarm-device__gas td.num,
      .alarm-device__gas th.num {
        text-align: right;
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
      /* Iter F (knx-detail-panes): klickbare Stille-Alarm-Zeile.
         Hover etwas verstaerkt, Selection-Highlight wie .top-device-row. */
      .silence-list .silence-row {
        cursor: pointer;
      }
      .silence-list .silence-row:hover {
        filter: brightness(1.05);
      }
      .silence-list .silence-row.selected {
        box-shadow: inset 3px 0 0 var(--mh-primary);
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

      /* Iter D.2 (knx-detail-panes): Source-Detail-Pane.
         KPI-Reihe analog detail-stats, Stille-Alarm prominent rot,
         GA-Liste klickbar mit Cursor-Pointer. */
      .source-detail-kpis {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-4);
        margin-bottom: var(--mh-space-3);
      }
      .source-detail-kpi {
        display: flex;
        flex-direction: column;
        min-width: 100px;
      }
      .source-detail-kpi strong {
        font-size: var(--mh-text-md);
      }
      .source-detail-silent-alarm {
        margin: var(--mh-space-2) 0 var(--mh-space-3) 0;
        padding: var(--mh-space-3);
        background: var(--mh-error-soft);
        border-left: 4px solid var(--mh-error);
        border-radius: var(--mh-radius-sm);
      }
      .source-detail-silent-alarm strong {
        color: var(--mh-error);
        display: block;
        margin-bottom: var(--mh-space-1);
      }
      .source-detail-silent {
        margin: var(--mh-space-2) 0;
      }
      .source-detail-ga-list {
        margin: var(--mh-space-3) 0;
      }
      .source-detail-ga-list table {
        margin-top: var(--mh-space-2);
      }
      .source-ga-row {
        cursor: pointer;
      }
      .source-ga-row:hover {
        background: var(--mh-bg-hover, rgba(0, 0, 0, 0.04));
      }

      /* Iter I (knx-detail-panes): Trend-Block im Source-Detail.
         Severity-Variante als Border-Left, analog zur Stille-Card. */
      .source-detail-trend {
        margin: var(--mh-space-3) 0;
        padding: var(--mh-space-2) var(--mh-space-3);
        border-radius: var(--mh-radius-sm);
        background: var(--mh-surface-2);
        border-left: 3px solid var(--mh-fg-muted);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .source-detail-trend--green {
        border-left-color: var(--mh-success);
      }
      .source-detail-trend--yellow {
        border-left-color: var(--mh-caution);
      }
      .source-detail-trend--orange {
        border-left-color: var(--mh-warning);
      }
      .source-detail-trend--red {
        border-left-color: var(--mh-error);
      }

      /* Iter H (knx-detail-panes): Findings-Liste im Source-Detail. */
      .source-detail-findings {
        margin: var(--mh-space-3) 0;
      }
      .source-detail-findings__list {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .source-detail-finding {
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .source-detail-finding__link {
        color: var(--mh-accent);
        text-decoration: none;
      }
      .source-detail-finding__link:hover {
        text-decoration: underline;
      }
      .source-detail-finding__title {
        color: var(--mh-fg-muted);
      }
      .source-detail-finding__count {
        font-variant-numeric: tabular-nums;
      }

      /* Iter E (knx-detail-panes): klickbare Top-Geraete-Zeile.
         Selection-Highlight nutzt selben Stil wie die GA-Top-Sender-
         Tabelle (.row-... .selected) — Konsistenz beim Source-Detail-
         Wechsel zwischen den beiden Drawer-Inhalten. */
      .top-device-row {
        cursor: pointer;
      }
      .top-device-row:hover {
        background: var(--mh-bg-hover, rgba(0, 0, 0, 0.04));
      }
      .top-device-row.selected {
        background: color-mix(in srgb, var(--mh-primary) 12%, transparent);
        box-shadow: inset 3px 0 0 var(--mh-primary);
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
  b({ attribute: !1 })
], g.prototype, "api", 2);
_([
  l()
], g.prototype, "_filters", 2);
_([
  l()
], g.prototype, "_summary", 2);
_([
  l()
], g.prototype, "_busHealth", 2);
_([
  l()
], g.prototype, "_busload", 2);
_([
  l()
], g.prototype, "_health", 2);
_([
  l()
], g.prototype, "_longTerm", 2);
_([
  l()
], g.prototype, "_bursts", 2);
_([
  l()
], g.prototype, "_sensitiveLog", 2);
_([
  l()
], g.prototype, "_trend", 2);
_([
  l()
], g.prototype, "_heatmap", 2);
_([
  l()
], g.prototype, "_busAnalysisEnabled", 2);
_([
  l()
], g.prototype, "_busAnalysisLoaded", 2);
_([
  l()
], g.prototype, "_devicesSortKey", 2);
_([
  l()
], g.prototype, "_devicesSortDir", 2);
_([
  l()
], g.prototype, "_topSortKey", 2);
_([
  l()
], g.prototype, "_topSortDir", 2);
_([
  l()
], g.prototype, "_orphansMissingFilter", 2);
_([
  l()
], g.prototype, "_orphansExtraFilter", 2);
_([
  l()
], g.prototype, "_orphansHidePlaceholders", 2);
_([
  l()
], g.prototype, "_apiErrors", 2);
_([
  l()
], g.prototype, "_apiErrorsDismissed", 2);
_([
  l()
], g.prototype, "_silence", 2);
_([
  l()
], g.prototype, "_orphans", 2);
_([
  l()
], g.prototype, "_alarms", 2);
_([
  l()
], g.prototype, "_top", 2);
_([
  l()
], g.prototype, "_topBySource", 2);
_([
  l()
], g.prototype, "_timeline", 2);
_([
  l()
], g.prototype, "_selectedGa", 2);
_([
  l()
], g.prototype, "_detail", 2);
_([
  l()
], g.prototype, "_detailLoading", 2);
_([
  l()
], g.prototype, "_selectedSource", 2);
_([
  l()
], g.prototype, "_sourceDetail", 2);
_([
  l()
], g.prototype, "_sourceDetailLoading", 2);
_([
  l()
], g.prototype, "_recommendation", 2);
_([
  l()
], g.prototype, "_recommendationLoading", 2);
_([
  l()
], g.prototype, "_recommendationError", 2);
_([
  l()
], g.prototype, "_recommendationExpanded", 2);
_([
  l()
], g.prototype, "_device", 2);
_([
  l()
], g.prototype, "_deviceEditing", 2);
_([
  l()
], g.prototype, "_deviceSaving", 2);
_([
  l()
], g.prototype, "_deviceError", 2);
_([
  l()
], g.prototype, "_deviceDraft", 2);
_([
  l()
], g.prototype, "_loading", 2);
_([
  l()
], g.prototype, "_error", 2);
_([
  l()
], g.prototype, "_toast", 2);
g = _([
  k("stats-knx-view")
], g);
const ca = {
  de: {
    DPT_MISMATCH: {
      title: "Erkannter Datentyp widerspricht Projekt-DPT",
      description: "Auto-Erkenner liefert {inferred_dpt} aus {samples} Stichproben (Confidence {confidence}). Projekt-DPT ist {project_dpt}. Werte werden moeglicherweise falsch dekodiert — bitte ETS-Projekt pruefen. Hinweis: bei Stellantrieben (DPT 5.001), die nur 0% und 100% senden, kann der Auto-Erkenner faelschlich 1.001 vermuten — in dem Fall den Severity-Override auf 'info' setzen.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    VALUE_OUT_OF_RANGE: {
      title: "Wert ausserhalb des erlaubten DPT-Bereichs",
      description: "Wert {value} liegt ausserhalb des fuer DPT {dpt} erlaubten Bereichs [{range_min}, {range_max}]. Wahrscheinlich falscher DPT oder fehlerhafte Sensorik.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001133744-Datapoint-Type"
    },
    MULTI_RESPONDER: {
      title: "Mehrere Aktoren antworten auf gleicher GA",
      description: "{count} Quellen antworten innerhalb {window_ms} ms: {responding_sources}. Wahrscheinlich mehrere Aktoren mit gesetztem L-Flag — kann beabsichtigt sein bei parallelen Aktoren, sonst ETS-Topologie pruefen.",
      help_url: "https://knx-blogger.de/knx-flags-einfach-erklaert/"
    },
    READ_NO_RESPONSE: {
      title: "GroupValueRead bleibt ohne Antwort",
      description: "Read um {read_at} hat innerhalb von {timeout_sec} s keine Antwort erhalten. Empfaenger fehlt, ist offline oder das L-Flag ist nicht gesetzt.",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    TOGGLE_LOOP: {
      title: "Schaltschleife auf DPT 1.001",
      description: "GA wechselt zyklisch zwischen 0 und 1 (Periode {period_ms} ms, {cycles} Wertwechsel). Vermutung: gleiche GA wird sendend und hoerend gleichzeitig genutzt.",
      help_url: "https://community.openhab.org/t/loops-on-knx-bus/22185"
    },
    MULTI_TIME_MASTER: {
      title: "Mehrere Zeit-Master auf gleicher GA",
      description: "{sources} schreiben gemeinsam auf eine GA mit DPT {clock_dpt}. Doppelte Zeitquellen erzeugen Drift — nur ein Geraet als Time-Master konfigurieren.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    RECONNECT_STORM: {
      title: "Reconnect-Sturm nach Bus-Stille",
      description: "Nach einer Stille bis {silence_until} feuerte die Quelle einen Burst: {burst_count} Telegramme im 30-s-Fenster (Schnitt sonst {normal_avg}, Faktor {factor}). Typisch fuer Reconnect-Floods nach Bus-Spannungsausfall.",
      help_url: "https://github.com/home-assistant/core/issues/69328"
    },
    SEND_CYCLE_DRIFT: {
      title: "Sendezyklus deutlich verkuerzt",
      description: "Median-Δt der letzten Periode {recent_median_dt} s vs. Vergleichszeitraum {baseline_median_dt} s — Verhaeltnis {ratio}. Sendezyklus halbiert; vermutlich Hysterese verstellt oder Sensorik defekt.",
      help_url: "https://knx-blogger.de/was-ist-auf-deinem-knx-bus-los/"
    },
    REPEAT_APPROXIMATION: {
      title: "Vermutete Telegrammwiederholungen",
      description: "{total_repeats} identische Folge-Telegramme mit Δt < 100 ms ueber {period_days} Tage (~ {repeats_per_day}/Tag). Approximation des Repeat-Bits — bestaetigen via xknx-Tracer (BL-D), wenn verfuegbar.",
      help_url: "https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1611435-unbest%C3%A4tigte-telegramme-telegrammwiederholung"
    },
    ORPHAN_GA: {
      title: "GA in Projekt-Whitelist, aber stumm",
      description: "Im Auswertezeitraum {period_from} bis {period_to} kein einziges Telegramm gesehen. ETS-Projekt enthaelt diese GA — entweder loeschen oder Empfaenger pruefen.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    STALE_GA: {
      title: "GA seit Tagen tot",
      description: "Letztes Telegramm am {last_seen}, seit {days_silent} Tagen keine weitere Aktivitaet. Sensorik defekt oder Linie unterbrochen?",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    SEND_TO_NOWHERE: {
      title: "Schalt-Telegramm ohne Status-Echo",
      description: "Write um {write_at} blieb {status_window_ms} ms ohne Status-Echo auf derselben GA. Aktor moeglicherweise offline, unprogrammiert oder Status liegt auf separater GA (False-Positive moeglich).",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    ANALYSIS_DISABLED: {
      title: "Bus-Analyse ist deaktiviert",
      description: "Der Bus-Analyse-Toggle ist aus — der Listener schreibt keine Telegramme mehr in die Raw- oder Counter-Tabelle. Alle anderen Findings sind deshalb unterdrueckt, damit dieser Tab keinen falschen 'alles OK'-Eindruck erweckt. Aktiviere den Toggle im KNX-Bus-Analyse-Tab oben rechts, um Telegramme wieder zu erfassen.",
      help_url: ""
    }
  },
  en: {
    DPT_MISMATCH: {
      title: "Inferred datapoint type contradicts project DPT",
      description: "Auto-detector inferred {inferred_dpt} from {samples} samples (confidence {confidence}). Project DPT is {project_dpt}. Values may be decoded incorrectly — please verify the ETS project. Note: actuators (DPT 5.001) that only send 0% and 100% can be mis-inferred as 1.001 — set the severity override to 'info' if that matches your case.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    VALUE_OUT_OF_RANGE: {
      title: "Value outside allowed DPT range",
      description: "Value {value} is outside the allowed range [{range_min}, {range_max}] for DPT {dpt}. Likely wrong DPT or faulty sensor.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001133744-Datapoint-Type"
    },
    MULTI_RESPONDER: {
      title: "Multiple actuators respond on same group address",
      description: "{count} sources answered within {window_ms} ms: {responding_sources}. Likely multiple actuators with the L-flag set — may be intentional for parallel actuators, otherwise verify the ETS topology.",
      help_url: "https://knx-blogger.de/knx-flags-einfach-erklaert/"
    },
    READ_NO_RESPONSE: {
      title: "GroupValueRead without response",
      description: "Read at {read_at} received no response within {timeout_sec} s. Receiver missing, offline, or L-flag not set.",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    TOGGLE_LOOP: {
      title: "Switching loop on DPT 1.001",
      description: "Group address alternates between 0 and 1 (period {period_ms} ms, {cycles} value changes). Likely the same GA is used both sending and listening.",
      help_url: "https://community.openhab.org/t/loops-on-knx-bus/22185"
    },
    MULTI_TIME_MASTER: {
      title: "Multiple time masters on same group address",
      description: "{sources} both write to a GA with DPT {clock_dpt}. Duplicate time sources cause drift — configure only one device as time master.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    RECONNECT_STORM: {
      title: "Reconnect storm after bus silence",
      description: "After silence until {silence_until} the source produced a burst: {burst_count} telegrams in the 30s window (normal {normal_avg}, factor {factor}). Typical for reconnect floods after bus power loss.",
      help_url: "https://github.com/home-assistant/core/issues/69328"
    },
    SEND_CYCLE_DRIFT: {
      title: "Send cycle significantly shortened",
      description: "Recent median Δt {recent_median_dt} s vs. baseline {baseline_median_dt} s — ratio {ratio}. Send cycle halved; likely a changed hysteresis or faulty sensor.",
      help_url: "https://knx-blogger.de/was-ist-auf-deinem-knx-bus-los/"
    },
    REPEAT_APPROXIMATION: {
      title: "Suspected telegram repeats",
      description: "{total_repeats} identical follow-up telegrams with Δt < 100 ms across {period_days} days (~ {repeats_per_day}/day). Approximation of the repeat bit — confirm via xknx tracer (BL-D) when available.",
      help_url: "https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1611435-unbest%C3%A4tigte-telegramme-telegrammwiederholung"
    },
    ORPHAN_GA: {
      title: "GA in project whitelist but silent",
      description: "No telegrams observed in the period from {period_from} to {period_to}. The ETS project lists this GA — remove it or check the receiver.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    STALE_GA: {
      title: "GA gone silent",
      description: "Last telegram at {last_seen}, no activity for {days_silent} days. Sensor faulty or line interrupted?",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    SEND_TO_NOWHERE: {
      title: "Switching telegram without status echo",
      description: "Write at {write_at} received no status echo within {status_window_ms} ms on the same GA. Actuator possibly offline, not programmed, or status lives on a separate GA (false positive possible).",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    ANALYSIS_DISABLED: {
      title: "Bus analysis is disabled",
      description: "The bus analysis toggle is off — the listener no longer records telegrams to the raw or counter tables. All other findings are suppressed so this tab does not create a false 'all good' impression. Enable the toggle in the KNX bus analysis tab to resume telegram capture.",
      help_url: ""
    }
  },
  es: {
    DPT_MISMATCH: {
      title: "Tipo de datos detectado contradice el DPT del proyecto",
      description: "El auto-detector infirio {inferred_dpt} de {samples} muestras (confianza {confidence}). DPT del proyecto: {project_dpt}. Los valores podrian decodificarse incorrectamente — verifica el proyecto ETS. Nota: actuadores (DPT 5.001) que solo envian 0% y 100% pueden inferirse erroneamente como 1.001 — establece el override de severity en 'info' si es ese el caso.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    VALUE_OUT_OF_RANGE: {
      title: "Valor fuera del rango permitido del DPT",
      description: "El valor {value} está fuera del rango permitido [{range_min}, {range_max}] para el DPT {dpt}. Probablemente DPT incorrecto o sensor defectuoso.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001133744-Datapoint-Type"
    },
    MULTI_RESPONDER: {
      title: "Múltiples actuadores responden en la misma dirección de grupo",
      description: "{count} fuentes respondieron en {window_ms} ms: {responding_sources}. Probablemente varios actuadores con el L-flag activo — puede ser intencional para actuadores paralelos, en caso contrario verifica la topología ETS.",
      help_url: "https://knx-blogger.de/knx-flags-einfach-erklaert/"
    },
    READ_NO_RESPONSE: {
      title: "GroupValueRead sin respuesta",
      description: "Read en {read_at} no recibió respuesta en {timeout_sec} s. Receptor ausente, desconectado o L-flag no configurado.",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    TOGGLE_LOOP: {
      title: "Bucle de conmutación en DPT 1.001",
      description: "La dirección de grupo alterna entre 0 y 1 (período {period_ms} ms, {cycles} cambios de valor). Probablemente la misma GA se usa para enviar y escuchar simultáneamente.",
      help_url: "https://community.openhab.org/t/loops-on-knx-bus/22185"
    },
    MULTI_TIME_MASTER: {
      title: "Múltiples maestros de tiempo en la misma dirección de grupo",
      description: "{sources} escriben en una GA con DPT {clock_dpt}. Fuentes de tiempo duplicadas causan deriva — configura solo un dispositivo como maestro de tiempo.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    RECONNECT_STORM: {
      title: "Tormenta de reconexión tras silencio del bus",
      description: "Tras silencio hasta {silence_until} la fuente produjo una ráfaga: {burst_count} telegramas en la ventana de 30 s (normal {normal_avg}, factor {factor}). Típico de inundaciones de reconexión tras corte de alimentación.",
      help_url: "https://github.com/home-assistant/core/issues/69328"
    },
    SEND_CYCLE_DRIFT: {
      title: "Ciclo de envío notablemente acortado",
      description: "Mediana Δt reciente {recent_median_dt} s frente a referencia {baseline_median_dt} s — proporción {ratio}. Ciclo de envío reducido a la mitad; probablemente histeresis modificada o sensor defectuoso.",
      help_url: "https://knx-blogger.de/was-ist-auf-deinem-knx-bus-los/"
    },
    REPEAT_APPROXIMATION: {
      title: "Repeticiones de telegrama supuestas",
      description: "{total_repeats} telegramas consecutivos idénticos con Δt < 100 ms durante {period_days} días (~ {repeats_per_day}/día). Aproximación del bit de repetición — confirmar mediante el rastreador xknx (BL-D) cuando esté disponible.",
      help_url: "https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1611435-unbest%C3%A4tigte-telegramme-telegrammwiederholung"
    },
    ORPHAN_GA: {
      title: "GA en lista del proyecto pero silenciosa",
      description: "No se observaron telegramas en el período del {period_from} al {period_to}. El proyecto ETS contiene esta GA — elimínala o verifica el receptor.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    STALE_GA: {
      title: "GA en silencio desde hace días",
      description: "Último telegrama el {last_seen}, sin actividad durante {days_silent} días. ¿Sensor defectuoso o línea interrumpida?",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    SEND_TO_NOWHERE: {
      title: "Telegrama sin eco de estado",
      description: "El Write a las {write_at} no recibió eco de estado en {status_window_ms} ms en la misma GA. Actuador posiblemente offline, no programado o el estado vive en una GA separada (posible falso positivo).",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    ANALYSIS_DISABLED: {
      title: "El analisis del bus esta desactivado",
      description: "El interruptor de analisis del bus esta apagado — el listener ya no registra telegramas en las tablas raw ni counter. Los demas hallazgos estan suprimidos para que esta pestana no de la falsa impresion de 'todo bien'. Activa el interruptor en la pestana de analisis del bus KNX para reanudar la captura de telegramas.",
      help_url: ""
    }
  },
  fr: {
    DPT_MISMATCH: {
      title: "Type de données détecté contredit le DPT du projet",
      description: "Le detecteur a infere {inferred_dpt} a partir de {samples} echantillons (confiance {confidence}). DPT du projet: {project_dpt}. Les valeurs sont peut-etre mal decodees — verifie le projet ETS. Note: les actionneurs (DPT 5.001) qui n'envoient que 0% et 100% peuvent etre identifies a tort comme 1.001 — definis l'override de severite sur 'info' si c'est ton cas.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    VALUE_OUT_OF_RANGE: {
      title: "Valeur hors de la plage autorisée du DPT",
      description: "La valeur {value} est en dehors de la plage autorisée [{range_min}, {range_max}] pour le DPT {dpt}. Probablement DPT incorrect ou capteur défectueux.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001133744-Datapoint-Type"
    },
    MULTI_RESPONDER: {
      title: "Plusieurs actionneurs répondent sur la même adresse de groupe",
      description: "{count} sources ont répondu en {window_ms} ms : {responding_sources}. Probablement plusieurs actionneurs avec le L-flag actif — peut être intentionnel pour des actionneurs parallèles, sinon vérifiez la topologie ETS.",
      help_url: "https://knx-blogger.de/knx-flags-einfach-erklaert/"
    },
    READ_NO_RESPONSE: {
      title: "GroupValueRead sans réponse",
      description: "Le Read à {read_at} n'a reçu aucune réponse en {timeout_sec} s. Récepteur absent, hors ligne ou L-flag non configuré.",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    TOGGLE_LOOP: {
      title: "Boucle de commutation sur DPT 1.001",
      description: "L'adresse de groupe alterne entre 0 et 1 (période {period_ms} ms, {cycles} changements de valeur). Probablement la même GA est utilisée pour émettre et écouter simultanément.",
      help_url: "https://community.openhab.org/t/loops-on-knx-bus/22185"
    },
    MULTI_TIME_MASTER: {
      title: "Plusieurs maîtres de temps sur la même adresse de groupe",
      description: "{sources} écrivent ensemble sur une GA avec DPT {clock_dpt}. Sources de temps doubles provoquent une dérive — configurer un seul appareil en tant que maître de temps.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    RECONNECT_STORM: {
      title: "Tempête de reconnexion après silence du bus",
      description: "Après un silence jusqu'à {silence_until} la source a généré une rafale : {burst_count} télégrammes dans la fenêtre de 30 s (normal {normal_avg}, facteur {factor}). Typique d'inondations de reconnexion après coupure d'alimentation.",
      help_url: "https://github.com/home-assistant/core/issues/69328"
    },
    SEND_CYCLE_DRIFT: {
      title: "Cycle d'envoi nettement raccourci",
      description: "Médiane Δt récente {recent_median_dt} s vs. référence {baseline_median_dt} s — ratio {ratio}. Cycle d'envoi divisé par deux ; hystérésis probablement modifiée ou capteur défectueux.",
      help_url: "https://knx-blogger.de/was-ist-auf-deinem-knx-bus-los/"
    },
    REPEAT_APPROXIMATION: {
      title: "Répétitions de télégramme suspectées",
      description: "{total_repeats} télégrammes consécutifs identiques avec Δt < 100 ms sur {period_days} jours (~ {repeats_per_day}/jour). Approximation du bit de répétition — confirmer via le traceur xknx (BL-D) lorsqu'il est disponible.",
      help_url: "https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1611435-unbest%C3%A4tigte-telegramme-telegrammwiederholung"
    },
    ORPHAN_GA: {
      title: "GA dans la liste du projet mais silencieuse",
      description: "Aucun télégramme observé entre {period_from} et {period_to}. Le projet ETS contient cette GA — supprimez-la ou vérifiez le récepteur.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    STALE_GA: {
      title: "GA silencieuse depuis plusieurs jours",
      description: "Dernier télégramme le {last_seen}, aucune activité depuis {days_silent} jours. Capteur défectueux ou ligne interrompue ?",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    SEND_TO_NOWHERE: {
      title: "Télégramme sans écho de statut",
      description: "Le Write à {write_at} n'a reçu aucun écho de statut dans {status_window_ms} ms sur la même GA. Actionneur peut-être hors ligne, non programmé ou statut sur une GA séparée (faux positif possible).",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    ANALYSIS_DISABLED: {
      title: "L'analyse du bus est desactivee",
      description: "Le bouton d'analyse du bus est desactive — le listener n'enregistre plus de telegrammes dans les tables raw ou counter. Tous les autres findings sont supprimes afin que cet onglet ne donne pas une fausse impression de 'tout va bien'. Activez le bouton dans l'onglet d'analyse du bus KNX pour reprendre la capture des telegrammes.",
      help_url: ""
    }
  },
  it: {
    DPT_MISMATCH: {
      title: "Tipo di dato rilevato contraddice il DPT del progetto",
      description: "Il rilevatore automatico ha inferito {inferred_dpt} da {samples} campioni (confidenza {confidence}). DPT progetto: {project_dpt}. I valori potrebbero essere decodificati in modo errato — verifica il progetto ETS. Nota: gli attuatori (DPT 5.001) che inviano solo 0% e 100% possono essere erroneamente identificati come 1.001 — imposta l'override di severita su 'info' se e questo il caso.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    VALUE_OUT_OF_RANGE: {
      title: "Valore fuori dall'intervallo consentito del DPT",
      description: "Il valore {value} è fuori dall'intervallo consentito [{range_min}, {range_max}] per il DPT {dpt}. Probabilmente DPT errato o sensore difettoso.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001133744-Datapoint-Type"
    },
    MULTI_RESPONDER: {
      title: "Più attuatori rispondono sullo stesso indirizzo di gruppo",
      description: "{count} sorgenti hanno risposto in {window_ms} ms: {responding_sources}. Probabilmente più attuatori con L-flag impostato — può essere intenzionale per attuatori paralleli, altrimenti verifica la topologia ETS.",
      help_url: "https://knx-blogger.de/knx-flags-einfach-erklaert/"
    },
    READ_NO_RESPONSE: {
      title: "GroupValueRead senza risposta",
      description: "Read a {read_at} non ha ricevuto risposta entro {timeout_sec} s. Ricevitore assente, offline o L-flag non impostato.",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    TOGGLE_LOOP: {
      title: "Anello di commutazione su DPT 1.001",
      description: "L'indirizzo di gruppo alterna tra 0 e 1 (periodo {period_ms} ms, {cycles} cambi di valore). Probabilmente la stessa GA è usata per inviare e ascoltare contemporaneamente.",
      help_url: "https://community.openhab.org/t/loops-on-knx-bus/22185"
    },
    MULTI_TIME_MASTER: {
      title: "Più master di tempo sullo stesso indirizzo di gruppo",
      description: "{sources} scrivono insieme su una GA con DPT {clock_dpt}. Sorgenti di tempo duplicate causano deriva — configura un solo dispositivo come master del tempo.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    RECONNECT_STORM: {
      title: "Tempesta di riconnessione dopo silenzio del bus",
      description: "Dopo silenzio fino a {silence_until} la sorgente ha prodotto una raffica: {burst_count} telegrammi nella finestra di 30 s (normale {normal_avg}, fattore {factor}). Tipico di flooding di riconnessione dopo perdita di alimentazione.",
      help_url: "https://github.com/home-assistant/core/issues/69328"
    },
    SEND_CYCLE_DRIFT: {
      title: "Ciclo di invio notevolmente abbreviato",
      description: "Mediana Δt recente {recent_median_dt} s vs. baseline {baseline_median_dt} s — rapporto {ratio}. Ciclo di invio dimezzato; probabilmente isteresi modificata o sensore difettoso.",
      help_url: "https://knx-blogger.de/was-ist-auf-deinem-knx-bus-los/"
    },
    REPEAT_APPROXIMATION: {
      title: "Sospette ripetizioni di telegramma",
      description: "{total_repeats} telegrammi consecutivi identici con Δt < 100 ms su {period_days} giorni (~ {repeats_per_day}/giorno). Approssimazione del bit di ripetizione — confermare tramite tracer xknx (BL-D) quando disponibile.",
      help_url: "https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1611435-unbest%C3%A4tigte-telegramme-telegrammwiederholung"
    },
    ORPHAN_GA: {
      title: "GA nella whitelist del progetto ma silenziosa",
      description: "Nessun telegramma osservato nel periodo {period_from} - {period_to}. Il progetto ETS contiene questa GA — rimuovila o verifica il ricevitore.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    STALE_GA: {
      title: "GA inattiva da giorni",
      description: "Ultimo telegramma il {last_seen}, nessuna attività da {days_silent} giorni. Sensore difettoso o linea interrotta?",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    SEND_TO_NOWHERE: {
      title: "Telegramma di commutazione senza eco di stato",
      description: "Il Write alle {write_at} non ha ricevuto eco di stato entro {status_window_ms} ms sulla stessa GA. Attuatore possibilmente offline, non programmato o stato su GA separata (possibile falso positivo).",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    ANALYSIS_DISABLED: {
      title: "L'analisi del bus e disattivata",
      description: "L'interruttore di analisi del bus e spento — il listener non registra piu telegrammi nelle tabelle raw o counter. Tutti gli altri findings sono soppressi affinche questa scheda non dia una falsa impressione di 'tutto OK'. Attiva l'interruttore nella scheda di analisi del bus KNX per riprendere la cattura dei telegrammi.",
      help_url: ""
    }
  },
  nl: {
    DPT_MISMATCH: {
      title: "Gedetecteerd datatype komt niet overeen met project-DPT",
      description: "Auto-detector concludeerde {inferred_dpt} uit {samples} samples (zekerheid {confidence}). Project-DPT is {project_dpt}. Waarden worden mogelijk verkeerd gedecodeerd — controleer het ETS-project. Let op: actuatoren (DPT 5.001) die alleen 0% en 100% verzenden kunnen verkeerdelijk als 1.001 worden geinterpreteerd — zet de severity-override op 'info' als dat van toepassing is.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    VALUE_OUT_OF_RANGE: {
      title: "Waarde buiten het toegestane DPT-bereik",
      description: "Waarde {value} ligt buiten het toegestane bereik [{range_min}, {range_max}] voor DPT {dpt}. Waarschijnlijk verkeerd DPT of defecte sensor.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001133744-Datapoint-Type"
    },
    MULTI_RESPONDER: {
      title: "Meerdere actuatoren reageren op hetzelfde groepsadres",
      description: "{count} bronnen antwoordden binnen {window_ms} ms: {responding_sources}. Waarschijnlijk meerdere actuatoren met L-flag actief — kan opzettelijk zijn bij parallelle actuatoren, anders ETS-topologie controleren.",
      help_url: "https://knx-blogger.de/knx-flags-einfach-erklaert/"
    },
    READ_NO_RESPONSE: {
      title: "GroupValueRead zonder antwoord",
      description: "Read om {read_at} heeft binnen {timeout_sec} s geen antwoord ontvangen. Ontvanger ontbreekt, is offline of L-flag is niet ingesteld.",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    TOGGLE_LOOP: {
      title: "Schakellus op DPT 1.001",
      description: "Groepsadres wisselt cyclisch tussen 0 en 1 (periode {period_ms} ms, {cycles} waardewisselingen). Waarschijnlijk wordt dezelfde GA tegelijk verzendend en luisterend gebruikt.",
      help_url: "https://community.openhab.org/t/loops-on-knx-bus/22185"
    },
    MULTI_TIME_MASTER: {
      title: "Meerdere tijdmasters op hetzelfde groepsadres",
      description: "{sources} schrijven samen op een GA met DPT {clock_dpt}. Dubbele tijdbronnen veroorzaken drift — configureer slechts één apparaat als tijdmaster.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types"
    },
    RECONNECT_STORM: {
      title: "Reconnect-storm na busstilte",
      description: "Na stilte tot {silence_until} produceerde de bron een burst: {burst_count} telegrammen in het 30-s-venster (normaal {normal_avg}, factor {factor}). Typisch voor reconnect-floods na bus-spanningsverlies.",
      help_url: "https://github.com/home-assistant/core/issues/69328"
    },
    SEND_CYCLE_DRIFT: {
      title: "Verzendcyclus aanzienlijk verkort",
      description: "Recente mediaan Δt {recent_median_dt} s vs. baseline {baseline_median_dt} s — verhouding {ratio}. Verzendcyclus gehalveerd; waarschijnlijk hysterese aangepast of sensor defect.",
      help_url: "https://knx-blogger.de/was-ist-auf-deinem-knx-bus-los/"
    },
    REPEAT_APPROXIMATION: {
      title: "Vermoedelijke telegram-herhalingen",
      description: "{total_repeats} identieke opeenvolgende telegrammen met Δt < 100 ms over {period_days} dagen (~ {repeats_per_day}/dag). Benadering van de repeat-bit — bevestig via xknx-tracer (BL-D) indien beschikbaar.",
      help_url: "https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1611435-unbest%C3%A4tigte-telegramme-telegrammwiederholung"
    },
    ORPHAN_GA: {
      title: "GA in projectlijst maar stil",
      description: "Geen telegrammen waargenomen in de periode {period_from} tot {period_to}. Het ETS-project bevat deze GA — verwijder hem of controleer de ontvanger.",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    STALE_GA: {
      title: "GA al dagen stil",
      description: "Laatste telegram op {last_seen}, geen activiteit sinds {days_silent} dagen. Sensor defect of lijn onderbroken?",
      help_url: "https://support.knx.org/hc/en-us/articles/115001822790-Project-Check"
    },
    SEND_TO_NOWHERE: {
      title: "Schakelttelegram zonder status-echo",
      description: "Write om {write_at} kreeg geen status-echo binnen {status_window_ms} ms op dezelfde GA. Actuator mogelijk offline, niet geprogrammeerd of status op aparte GA (mogelijk vals positief).",
      help_url: "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics"
    },
    ANALYSIS_DISABLED: {
      title: "Busanalyse is uitgeschakeld",
      description: "De busanalyse-schakelaar staat uit — de listener registreert geen telegrammen meer in de raw- of counter-tabellen. Alle andere findings zijn onderdrukt zodat dit tabblad geen valse 'alles OK'-indruk wekt. Activeer de schakelaar in het tabblad KNX-busanalyse om de telegramopname te hervatten.",
      help_url: ""
    }
  }
}, ha = ["de", "en", "es", "fr", "it", "nl"], nt = ca, pa = /* @__PURE__ */ new Set([
  "DPT_MISMATCH",
  "ORPHAN_GA",
  "STALE_GA"
]);
function ua(e) {
  return pa.has(e);
}
function es(e) {
  const t = (e || "").toLowerCase();
  for (const s of ha)
    if (t === s || t.startsWith(s + "-"))
      return s;
  return "en";
}
function Ye(e, t) {
  return nt[es(t)][e]?.title ?? "";
}
function ma(e) {
  return nt.en[e]?.help_url ?? "";
}
function ga(e, t, s) {
  const r = nt[es(t)][e];
  return r === void 0 ? "" : fa(r.description, s);
}
function fa(e, t) {
  return e.replace(/\{(\w+)\}/g, (s, r) => r in t ? String(t[r]) : s);
}
var va = Object.defineProperty, _a = Object.getOwnPropertyDescriptor, Ee = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? _a(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && va(t, s, a), a;
};
const ba = [
  "debug",
  "info",
  "warning",
  "error"
];
let se = class extends y {
  constructor() {
    super(...arguments), this._items = [], this._loading = !1, this._error = null;
  }
  async firstUpdated() {
    await this._load();
  }
  async _load() {
    if (this.api) {
      this._loading = !0, this._error = null;
      try {
        const e = await this.api.listSeverityOverrides();
        this._items = e.items;
      } catch (e) {
        this._error = e.message ?? "Unbekannter Fehler";
      } finally {
        this._loading = !1;
      }
    }
  }
  async _setOverride(e, t) {
    if (this.api)
      try {
        await this.api.setSeverityOverride(e, t), await this._load();
      } catch (s) {
        this._error = s.message ?? "Override konnte nicht gesetzt werden";
      }
  }
  async _clearOverride(e) {
    if (this.api)
      try {
        await this.api.clearSeverityOverride(e), await this._load();
      } catch (t) {
        this._error = t.message ?? "Override konnte nicht entfernt werden";
      }
  }
  _onSelectChange(e, t) {
    const r = e.target.value;
    r === "_default" ? this._clearOverride(t) : this._setOverride(t, r);
  }
  _lang() {
    return typeof document < "u" && document.documentElement.lang ? document.documentElement.lang : "en";
  }
  render() {
    return this._error ? i`<div class="error" data-test="override-error">
        Fehler: ${this._error}
      </div>` : this._loading && this._items.length === 0 ? i`<div class="loading">Wird geladen…</div>` : i`
      <table class="overrides" data-test="severity-overrides-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Default</th>
            <th>Override</th>
          </tr>
        </thead>
        <tbody>
          ${this._items.map((e) => this._renderRow(e))}
        </tbody>
      </table>
    `;
  }
  _renderRow(e) {
    const t = this._lang(), s = Ye(e.code, t) || e.code, r = e.override_severity ?? "_default";
    return i`
      <tr data-test="override-row" data-code=${e.code}>
        <td class="code">
          <span class="code-text" title=${e.code}>${s}</span>
        </td>
        <td>
          <span class=${`mh-pill mh-pill--${e.default_severity}`}>
            ${e.default_severity}
          </span>
        </td>
        <td>
          <select
            class="mh-select"
            data-test="override-select"
            .value=${r}
            @change=${(a) => this._onSelectChange(a, e.code)}
          >
            <option value="_default">— Default —</option>
            ${ba.map(
      (a) => i`<option value=${a}>${a}</option>`
    )}
          </select>
        </td>
      </tr>
    `;
  }
};
se.styles = [
  L,
  W,
  Me,
  ae,
  ge,
  x`
      :host {
        display: block;
      }
      .error {
        padding: var(--mh-space-3);
        background: var(--mh-error-soft);
        color: var(--mh-error);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }
      .loading {
        padding: var(--mh-space-4);
        text-align: center;
        color: var(--mh-fg-muted);
      }
      .overrides {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mh-text-sm);
      }
      .overrides th,
      .overrides td {
        padding: var(--mh-space-2) var(--mh-space-3);
        text-align: left;
        border-bottom: 1px solid var(--mh-divider);
      }
      .overrides th {
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg-muted);
        background: var(--mh-surface-2);
      }
      .code-text {
        font-family: var(--code-font-family, monospace);
      }
    `
];
Ee([
  b({ attribute: !1 })
], se.prototype, "api", 2);
Ee([
  l()
], se.prototype, "_items", 2);
Ee([
  l()
], se.prototype, "_loading", 2);
Ee([
  l()
], se.prototype, "_error", 2);
se = Ee([
  k("severity-override-form")
], se);
var wa = Object.defineProperty, ya = Object.getOwnPropertyDescriptor, Ge = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? ya(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && wa(t, s, a), a;
};
let ue = class extends y {
  constructor() {
    super(...arguments), this.open = !1, this.label = "", this.dataTestId = "", this._onKeydown = (e) => {
      this.open && e.key === "Escape" && this._close();
    };
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("keydown", this._onKeydown);
  }
  disconnectedCallback() {
    window.removeEventListener("keydown", this._onKeydown), super.disconnectedCallback();
  }
  _close() {
    this.dispatchEvent(
      new CustomEvent("mh-drawer-close", { bubbles: !0, composed: !0 })
    );
  }
  render() {
    return this.open ? i`
      <div
        class="backdrop"
        @click=${this._close}
        aria-hidden="true"
        data-test="mh-drawer-backdrop"
      ></div>
      <aside
        class="drawer"
        role="dialog"
        aria-modal="true"
        aria-label=${this.label || "Detail"}
        data-test="mh-drawer"
        data-test-id=${this.dataTestId}
      >
        <header class="drawer-header">
          <slot name="header"></slot>
          <button
            class="drawer-close"
            type="button"
            @click=${this._close}
            aria-label="Schliessen"
            title="Schliessen (Escape)"
            data-test="mh-drawer-close-btn"
          >
            ✕
          </button>
        </header>
        <div class="drawer-body">
          <slot></slot>
        </div>
      </aside>
    ` : d;
  }
};
ue.styles = [
  L,
  x`
      :host {
        display: contents;
      }
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.25);
        z-index: 100;
        animation: mh-drawer-backdrop-in 160ms ease-out;
      }
      .drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: clamp(360px, 42vw, 640px);
        z-index: 101;
        margin: 0;
        background: var(--mh-surface);
        border: none;
        border-left: 1px solid var(--mh-divider);
        box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: mh-drawer-in 200ms ease-out;
      }
      .drawer-header {
        flex: 0 0 auto;
        position: sticky;
        top: 0;
        background: var(--mh-surface);
        border-bottom: 1px solid var(--mh-divider);
        padding: var(--mh-space-3);
        z-index: 1;
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        margin: 0;
      }
      .drawer-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin-left: auto;
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--mh-radius-sm);
        color: var(--mh-fg-muted);
        cursor: pointer;
        font-size: var(--mh-text-md);
        transition:
          background var(--mh-transition-fast),
          border-color var(--mh-transition-fast),
          color var(--mh-transition-fast);
      }
      .drawer-close:hover {
        background: var(--mh-surface-2);
        border-color: var(--mh-divider);
        color: var(--mh-fg);
      }
      .drawer-close:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: var(--mh-focus-offset);
      }
      .drawer-body {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: var(--mh-space-3);
      }
      @media (max-width: 720px) {
        .drawer {
          width: 100vw;
        }
      }
      @keyframes mh-drawer-backdrop-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes mh-drawer-in {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .backdrop,
        .drawer {
          animation: none;
        }
      }
    `
];
Ge([
  b({ type: Boolean })
], ue.prototype, "open", 2);
Ge([
  b({ type: String })
], ue.prototype, "label", 2);
Ge([
  b({ type: String, attribute: "data-test-id" })
], ue.prototype, "dataTestId", 2);
ue = Ge([
  k("mh-drawer")
], ue);
var xa = Object.defineProperty, $a = Object.getOwnPropertyDescriptor, C = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? $a(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && xa(t, s, a), a;
};
const ka = [
  { value: "", label: "Alle Severities" },
  { value: "error", label: "Error" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "debug", label: "Debug" }
], It = {
  error: "mh-pill mh-pill--error",
  warning: "mh-pill mh-pill--warning",
  info: "mh-pill mh-pill--info",
  debug: "mh-pill mh-pill--debug"
};
let O = class extends y {
  constructor() {
    super(...arguments), this.sourceFilter = null, this._items = [], this._total = 0, this._loading = !1, this._error = null, this._severityFilter = "", this._projectOnly = !1, this._selectedKey = null, this._showOverrides = !1, this._onDrawerClose = () => {
      this._selectedKey = null;
    };
  }
  async firstUpdated() {
    await this._load();
  }
  // Iter D2: Escape-Handling laeuft jetzt im <mh-drawer>; eigener
  // window-Listener entfaellt.
  updated(e) {
    e.has("sourceFilter") && e.get("sourceFilter") !== void 0 && this._load();
  }
  async _load() {
    if (this.api) {
      this._loading = !0, this._error = null;
      try {
        const e = await this.api.listFindings({
          severity: this._severityFilter || void 0,
          source: this.sourceFilter || void 0
        });
        this._items = e.items, this._total = e.total;
      } catch (e) {
        this._error = e.message ?? "Unbekannter Fehler";
      } finally {
        this._loading = !1;
      }
    }
  }
  _onSeverityChange(e) {
    const t = e.target;
    this._severityFilter = t.value, this._load();
  }
  _onProjectOnlyChange(e) {
    const t = e.target;
    this._projectOnly = t.checked;
  }
  _filteredItems() {
    return this._projectOnly ? this._items.filter((e) => ua(e.code)) : this._items;
  }
  _itemKey(e) {
    return `${e.code}::${e.ga ?? ""}::${e.source ?? ""}::${e.first_seen}`;
  }
  _onSelect(e) {
    const t = this._itemKey(e);
    this._selectedKey = this._selectedKey === t ? null : t;
  }
  async _exportMarkdown() {
    if (this.api)
      try {
        const e = await this.api.exportFindingsMarkdown();
        if (navigator.clipboard && typeof navigator.clipboard.writeText == "function")
          await navigator.clipboard.writeText(e);
        else {
          const t = new Blob([e], { type: "text/markdown" }), s = document.createElement("a");
          s.href = URL.createObjectURL(t), s.download = "findings.md", s.click(), URL.revokeObjectURL(s.href);
        }
      } catch (e) {
        this._error = e.message ?? "Export fehlgeschlagen";
      }
  }
  async _refreshAll() {
    if (!this.api) return;
    const e = Array.from(
      new Set(
        this._items.map((t) => t.ga).filter((t) => typeof t == "string" && t.length > 0)
      )
    );
    if (e.length === 0) {
      this._error = "Keine GA mit Findings im aktuellen Filter — der Per-GA-Lauf braucht eine Auswahl.";
      return;
    }
    this._loading = !0, this._error = null;
    try {
      const s = this.api, r = [...e], a = [], n = async () => {
        for (; r.length > 0; ) {
          const o = r.shift();
          if (o === void 0) return;
          try {
            await s.refreshFindings(o);
          } catch (c) {
            a.push(`${o}: ${c.message}`);
          }
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(5, e.length) }, () => n())
      ), a.length > 0 && (this._error = `${a.length} GA(s) konnten nicht aktualisiert werden: ` + a.slice(0, 3).join("; ")), await this._load();
    } catch (t) {
      this._error = t.message ?? "Refresh fehlgeschlagen";
    } finally {
      this._loading = !1;
    }
  }
  async _ackSelected() {
    const e = this._currentSelection();
    if (!(!e || !this.api)) {
      if (e.ga === null) {
        this._error = "Bus-weite Findings koennen (noch) nicht akknowledged werden.";
        return;
      }
      this._loading = !0, this._error = null;
      try {
        await this.api.acknowledgeFinding({
          ga: e.ga,
          code: e.code
        }), await this._load(), this._selectedKey = null;
      } catch (t) {
        this._error = t.message ?? "Ack fehlgeschlagen";
      } finally {
        this._loading = !1;
      }
    }
  }
  // F-004: Ack zuruecknehmen — bisher fehlte die UI-Anbindung. ApiClient-
  // Methode unacknowledgeFinding existierte ungenutzt, kein Knopf verband
  // beides.
  async _unackSelected() {
    const e = this._currentSelection();
    if (!(!e || !this.api) && e.ga !== null) {
      this._loading = !0, this._error = null;
      try {
        await this.api.unacknowledgeFinding(e.ga, e.code), await this._load(), this._selectedKey = null;
      } catch (t) {
        this._error = t.message ?? "Unack fehlgeschlagen";
      } finally {
        this._loading = !1;
      }
    }
  }
  _currentSelection() {
    return this._selectedKey === null ? null : this._items.find((e) => this._itemKey(e) === this._selectedKey) ?? null;
  }
  render() {
    return i`
      <section class="root">
        <header class="header" data-test="findings-header">
          <div class="header-row">
            <h2 class="mh-card__title">Konfigurations-Check</h2>
            <div class="header-actions">
              <button
                type="button"
                class="mh-btn mh-btn--primary mh-btn--sm"
                data-test="findings-refresh-btn"
                title="Per-GA-Detector-Runner manuell ausloesen (DPT_MISMATCH, VALUE_OUT_OF_RANGE, MULTI_RESPONDER, READ_NO_RESPONSE, TOGGLE_LOOP, REPEAT_APPROXIMATION, PATTERN_*)"
                ?disabled=${this._loading}
                @click=${this._refreshAll}
              >
                Aktualisieren
              </button>
              <button
                type="button"
                class="mh-btn mh-btn--ghost mh-btn--sm"
                data-test="findings-export-md"
                title="Markdown-Liste fuer ETS-Notiz in die Zwischenablage kopieren"
                @click=${this._exportMarkdown}
              >
                MD-Export
              </button>
              <button
                type="button"
                class="mh-btn mh-btn--ghost mh-btn--sm"
                data-test="findings-show-overrides"
                @click=${() => this._showOverrides = !this._showOverrides}
              >
                ${this._showOverrides ? "Severity-Defaults schliessen" : "Severity-Defaults"}
              </button>
            </div>
          </div>
          <p class="subtitle">
            Erkannte KNX-Konfigurations-Anomalien aus dem Telegrammverkehr.
          </p>
        </header>

        ${this._showOverrides ? i`<section class="overrides-pane mh-card" data-test="findings-overrides-pane">
              <h3 class="mh-card__title">Severity-Defaults pro Code</h3>
              <p class="overrides-help">
                Default-Severity ist Eigenschaft der Finding-Definition.
                Hier kannst du sie fuer deine Anlage ueberschreiben — der
                Default greift wieder, sobald du auf "— Default —" wechselst.
              </p>
              <severity-override-form .api=${this.api}></severity-override-form>
            </section>` : d}

        <div class="filters mh-card mh-card--flat" data-test="findings-filters">
          <label class="filter-label">
            Severity:
            <select
              class="mh-select"
              data-test="findings-severity-filter"
              .value=${this._severityFilter}
              @change=${this._onSeverityChange}
            >
              ${ka.map(
      (e) => i`<option value=${e.value}>${e.label}</option>`
    )}
            </select>
          </label>
          <label class="filter-label" data-test="findings-project-only-label">
            <input
              type="checkbox"
              data-test="findings-project-only-toggle"
              .checked=${this._projectOnly}
              @change=${this._onProjectOnlyChange}
            />
            Nur Projekt-Befunde
          </label>
          <span class="total" data-test="findings-total"
            >${this._filteredItems().length} / ${this._total} Findings</span
          >
        </div>

        <div class="body" data-test="findings-table">
          ${this._renderBody()}
        </div>

        ${this._renderDetailPane()}
      </section>
    `;
  }
  _renderBody() {
    if (this._error)
      return i`<div class="empty error" data-test="findings-error">
        Fehler: ${this._error}
      </div>`;
    if (this._loading)
      return i`<div class="empty">Wird geladen…</div>`;
    const e = this._filteredItems();
    return e.length === 0 ? i`<div class="empty" data-test="findings-empty">
        Keine Findings im aktuellen Filter — die Konfiguration sieht
        unauffaellig aus.
      </div>` : i`<ul class="items" data-test="findings-items">
      ${e.map((t) => this._renderItem(t))}
    </ul>`;
  }
  _renderItem(e) {
    const t = this._itemKey(e), s = this._selectedKey === t, r = Ye(e.code, this._lang()) || e.code, a = e.acknowledged === !0;
    return i`
      <li
        class=${`item ${s ? "item--selected" : ""} ${a ? "item--acked" : ""}`}
        data-test="findings-item"
        @click=${() => this._onSelect(e)}
      >
        <span
          class=${It[e.severity]}
          data-test="item-severity"
        >
          ${e.severity}
        </span>
        <span class="code" data-test="item-code" title=${e.code}>${r}</span>
        <span class="ga" data-test="item-ga">${e.ga ?? "(global)"}</span>
        <span class="source" data-test="item-source"
          >${e.source ?? ""}</span
        >
        <span class="last-seen" data-test="item-last-seen"
          >${this._formatTimestamp(e.last_seen)}</span
        >
        <span class="count" data-test="item-count" title="Occurrence count"
          >×${e.occurrence_count}</span
        >
        ${a ? i`<span
              class="acked-marker"
              data-test="item-acked-marker"
              title="Bereits acknowledged"
              >✓ acked</span
            >` : d}
      </li>
    `;
  }
  _lang() {
    const e = this.hass?.locale?.language;
    return typeof e == "string" && e.length > 0 ? e : typeof document < "u" && document.documentElement.lang ? document.documentElement.lang : typeof navigator < "u" && navigator.language ? navigator.language : "en";
  }
  _renderDetailPane() {
    const e = this._currentSelection(), t = this._lang();
    if (!(e !== null))
      return i`<mh-drawer
        .open=${!1}
        @mh-drawer-close=${this._onDrawerClose}
      ></mh-drawer>`;
    const r = Ye(e.code, t) || e.code, a = ga(
      e.code,
      t,
      e.evidence
    ), n = ma(e.code);
    return i`
      <mh-drawer
        .open=${!0}
        .label=${r}
        data-test-id="findings-detail"
        @mh-drawer-close=${this._onDrawerClose}
      >
        <span slot="header" class="drawer-header-content">
          <span class=${It[e.severity]}>
            ${e.severity}
          </span>
          <span class="detail-code" title=${e.code}>${r}</span>
        </span>
        <div data-test="findings-detail">
          ${a ? i`<p
                class="detail-description"
                data-test="findings-detail-description"
              >
                ${a}
              </p>` : d}
          ${n ? i`<a
                class="detail-help"
                href=${n}
                target="_blank"
                rel="noopener"
                >Hilfe / Doku ↗</a
              >` : d}
          <dl class="detail-evidence">
            <dt>Code</dt>
            <dd>${e.code}</dd>
            <dt>GA</dt>
            <dd>${e.ga ?? "(global)"}</dd>
            <dt>Source</dt>
            <dd>${e.source ?? "—"}</dd>
            <dt>First-Seen</dt>
            <dd>${this._formatTimestamp(e.first_seen)}</dd>
            <dt>Last-Seen</dt>
            <dd>${this._formatTimestamp(e.last_seen)}</dd>
            <dt>Occurrences</dt>
            <dd>${e.occurrence_count}</dd>
            <dt>Detector</dt>
            <dd>${e.detector_version}</dd>
            ${this._renderEvidenceEntries(e.evidence)}
          </dl>
          <div class="detail-actions">
            ${e.acknowledged ? i`<button
                  class="mh-btn mh-btn--ghost"
                  type="button"
                  data-test="findings-unack-btn"
                  ?disabled=${e.ga === null || this._loading}
                  title="Akzeptanz zurueckziehen — Finding erscheint wieder als ungesehen."
                  @click=${this._unackSelected}
                >
                  Ack zuruecknehmen
                </button>` : i`<button
                  class="mh-btn mh-btn--primary"
                  type="button"
                  data-test="findings-ack-btn"
                  ?disabled=${e.ga === null || this._loading}
                  @click=${this._ackSelected}
                >
                  Ack
                </button>`}
          </div>
        </div>
      </mh-drawer>
    `;
  }
  _renderEvidenceEntries(e) {
    return Object.entries(e).map(
      ([t, s]) => i`
        <dt>${t}</dt>
        <dd>${typeof s == "object" ? JSON.stringify(s) : String(s)}</dd>
      `
    );
  }
  _formatTimestamp(e) {
    try {
      const t = new Date(e);
      return `${t.toLocaleDateString()} ${t.toLocaleTimeString()}`;
    } catch {
      return e;
    }
  }
};
O.styles = [
  L,
  W,
  Me,
  ae,
  ge,
  x`
      :host {
        display: block;
        height: 100%;
      }
      .root {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
        padding: var(--mh-space-4);
        height: 100%;
        overflow: auto;
      }
      .header {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mh-space-3);
      }
      .header-actions {
        display: flex;
        gap: var(--mh-space-2);
      }
      .overrides-pane {
        margin-bottom: var(--mh-space-3);
      }
      .overrides-help {
        margin: 0 0 var(--mh-space-3);
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
      .subtitle {
        margin: 0;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
      .filters {
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        flex-wrap: wrap;
      }
      .filter-label {
        display: flex;
        gap: var(--mh-space-2);
        align-items: center;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .total {
        margin-left: auto;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .body {
        flex: 1;
        min-height: 0;
      }
      .empty {
        padding: var(--mh-space-6);
        text-align: center;
        color: var(--mh-fg-muted);
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
      }
      .empty.error {
        color: var(--mh-error);
        border-color: var(--mh-error);
        background: var(--mh-error-soft);
      }
      .items {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
      }
      .item {
        display: grid;
        grid-template-columns: auto auto 1fr auto auto auto;
        align-items: center;
        gap: var(--mh-space-3);
        padding: var(--mh-space-3);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        cursor: pointer;
        transition:
          background var(--mh-transition-fast),
          border-color var(--mh-transition-fast);
      }
      .item:hover {
        background: var(--mh-surface-2);
      }
      .item--selected {
        border-color: var(--mh-accent);
        background: var(--mh-accent-soft);
      }
      .item--acked {
        opacity: 0.7;
      }
      .acked-marker {
        font-size: var(--mh-text-xs);
        color: var(--mh-success, var(--mh-fg-muted));
        font-weight: var(--mh-weight-semibold);
        padding-left: var(--mh-space-2);
      }
      .code {
        font-family: var(--code-font-family, monospace);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
      }
      .ga,
      .source {
        font-family: var(--code-font-family, monospace);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .last-seen {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        white-space: nowrap;
      }
      .count {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      /* Iter UX-2: rechts-fixed Drawer (analog stats-knx-view).
         Vorher inline am Listenende. */
      .detail-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.25);
        z-index: 100;
        animation: mh-findings-detail-backdrop-in 160ms ease-out;
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
        animation: mh-findings-detail-drawer-in 200ms ease-out;
        background: var(--mh-surface);
      }
      .detail-pane .detail-body {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: var(--mh-space-3);
      }
      @media (max-width: 720px) {
        .detail-pane {
          width: 100vw;
        }
      }
      @keyframes mh-findings-detail-backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes mh-findings-detail-drawer-in {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .detail-backdrop,
        .detail-pane {
          animation: none;
        }
      }
      .detail-header {
        flex: 0 0 auto;
        position: sticky;
        top: 0;
        background: var(--mh-surface);
        border-bottom: 1px solid var(--mh-divider);
        padding: var(--mh-space-3);
        z-index: 1;
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        margin: 0;
      }
      .detail-code {
        font-family: var(--code-font-family, monospace);
        font-weight: var(--mh-weight-semibold);
        flex: 1;
      }
      .detail-description {
        margin: 0 0 var(--mh-space-3);
        color: var(--mh-fg);
        line-height: 1.5;
        font-size: var(--mh-text-sm);
      }
      .detail-help {
        display: inline-block;
        margin-bottom: var(--mh-space-3);
        color: var(--mh-accent);
        font-size: var(--mh-text-sm);
        text-decoration: none;
      }
      .detail-help:hover {
        text-decoration: underline;
      }
      .detail-evidence {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: var(--mh-space-2) var(--mh-space-3);
        margin: 0 0 var(--mh-space-3);
        font-size: var(--mh-text-sm);
      }
      .detail-evidence dt {
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-medium);
      }
      .detail-evidence dd {
        margin: 0;
        font-family: var(--code-font-family, monospace);
        word-break: break-word;
      }
      .detail-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--mh-space-2);
      }
    `
];
C([
  b({ attribute: !1 })
], O.prototype, "api", 2);
C([
  b({ attribute: !1 })
], O.prototype, "sourceFilter", 2);
C([
  b({ attribute: !1 })
], O.prototype, "hass", 2);
C([
  l()
], O.prototype, "_items", 2);
C([
  l()
], O.prototype, "_total", 2);
C([
  l()
], O.prototype, "_loading", 2);
C([
  l()
], O.prototype, "_error", 2);
C([
  l()
], O.prototype, "_severityFilter", 2);
C([
  l()
], O.prototype, "_projectOnly", 2);
C([
  l()
], O.prototype, "_selectedKey", 2);
C([
  l()
], O.prototype, "_showOverrides", 2);
O = C([
  k("findings-view")
], O);
var Sa = Object.defineProperty, Ta = Object.getOwnPropertyDescriptor, Ae = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Ta(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && Sa(t, s, a), a;
};
const Ft = "messagehub.stats.subtab", Ea = /* @__PURE__ */ new Set(["live", "knx", "findings"]);
let re = class extends y {
  constructor() {
    super(...arguments), this._tab = this._loadTab(), this._findingsSourceFilter = null, this._onHashChange = () => {
      this._handleHash(window.location.hash);
    };
  }
  _loadTab() {
    try {
      const e = localStorage.getItem(Ft);
      if (e && Ea.has(e)) return e;
    } catch {
    }
    return "live";
  }
  _setTab(e) {
    this._tab = e;
    try {
      localStorage.setItem(Ft, e);
    } catch {
    }
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("hashchange", this._onHashChange), this._handleHash(window.location.hash);
  }
  disconnectedCallback() {
    window.removeEventListener("hashchange", this._onHashChange), super.disconnectedCallback();
  }
  // F-010: Hash-basierte Tab-Navigation (Iter H + Iter +11).
  // Akzeptierte Formate:
  //   #findings              -> Findings-Tab (Backwards-Compat)
  //   #findings?source=X     -> Findings-Tab, Source-Filter
  //   #stats/live            -> Live-Status-Tab
  //   #stats/knx             -> KNX-Bus-Analyse-Tab
  //   #stats/findings        -> Findings-Tab
  //   #stats/findings?source=X.Y.Z  -> Findings + Source-Filter
  // Andere Hashes bleiben unbeachtet (#settings/... gehoert zu
  // settings-view, nicht zu uns).
  _handleHash(e) {
    const t = Wt(e);
    if (t.top !== "stats") return;
    const s = t.sub;
    if ((s === "live" || s === "knx" || s === "findings") && this._setTab(s), s === "findings") {
      const r = t.query.get("source");
      this._findingsSourceFilter = r && r.length > 0 ? r : null;
    } else
      this._findingsSourceFilter = null;
  }
  render() {
    return i`
      <div class="root">
        <nav class="subtabs" role="tablist" aria-label="Statistik-Bereiche">
          ${[
      { id: "live", label: "Live-Status" },
      { id: "knx", label: "KNX-Bus-Analyse" },
      // Iter 9 (knx-findings): Konfigurations-Check als 3. Sub-Tab.
      { id: "findings", label: "Konfigurations-Check" }
    ].map(
      (t) => i`<button
              role="tab"
              aria-selected=${this._tab === t.id}
              class=${`subtab ${this._tab === t.id ? "active" : ""}`}
              @click=${() => this._setTab(t.id)}
            >
              ${t.label}
            </button>`
    )}
        </nav>
        <div class="body">
          ${this._tab === "live" ? i`<stats-live-view .api=${this.api}></stats-live-view>` : d}
          ${this._tab === "knx" ? i`<stats-knx-view .api=${this.api}></stats-knx-view>` : d}
          ${this._tab === "findings" ? i`<findings-view
                .api=${this.api}
                .hass=${this.hass}
                .sourceFilter=${this._findingsSourceFilter}
              ></findings-view>` : d}
        </div>
      </div>
    `;
  }
};
re.styles = [
  L,
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
Ae([
  b({ attribute: !1 })
], re.prototype, "api", 2);
Ae([
  b({ attribute: !1 })
], re.prototype, "hass", 2);
Ae([
  l()
], re.prototype, "_tab", 2);
Ae([
  l()
], re.prototype, "_findingsSourceFilter", 2);
re = Ae([
  k("stats-view")
], re);
var Aa = Object.defineProperty, Pa = Object.getOwnPropertyDescriptor, ne = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Pa(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && Aa(t, s, a), a;
};
function Da(e) {
  const t = e.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), s = new Set(t), r = (...a) => a.some((n) => s.has(n));
  return r("delete", "remove", "removed", "deleted") ? "delete" : r("upsert", "create", "created", "add", "added", "import", "imported") ? "create" : r("update", "updated", "edit", "edited", "set") ? "update" : r("status", "ack", "acknowledge", "toggle", "enable", "enabled", "disable", "disabled") ? "status" : "other";
}
const Mt = 60;
function La(e) {
  if (!e || typeof e != "object" || Array.isArray(e))
    return "";
  const t = e;
  if (typeof t.label == "string") return t.label;
  if (typeof t.name == "string") return t.name;
  const s = Object.entries(t);
  if (s.length === 1) {
    const [a, n] = s[0];
    if (typeof n == "string" || typeof n == "number" || typeof n == "boolean") {
      const o = String(n), c = o.length > Mt ? `${o.slice(0, Mt)}…` : o;
      return `${a}: ${c}`;
    }
    return `{${a}}`;
  }
  return `{${s.slice(0, 3).map(([a]) => a).join(", ")}${s.length > 3 ? ", …" : ""}}`;
}
let G = class extends y {
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
        const e = await this.api.clearAuditLog();
        await this._load(), window.alert(`${e.deleted} Einträge gelöscht.`);
      } catch (e) {
        window.alert(`Fehler: ${e.message}`);
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
      const s = `${t.target_type ?? ""}${t.target_id ?? ""}`.toLowerCase(), r = t.details ? JSON.stringify(t.details).toLowerCase() : "";
      return (t.actor ?? "").toLowerCase().includes(e) || (t.action ?? "").toLowerCase().includes(e) || s.includes(e) || r.includes(e);
    }) : this._items;
  }
  _renderActionPill(e) {
    const t = Da(e);
    return i`<span class=${`action-pill action-${t}`} title=${e}>${e}</span>`;
  }
  _renderDetails(e) {
    if (!e) return i`<span class="muted">—</span>`;
    if (typeof e == "object") {
      const t = Object.entries(e);
      return t.length === 0 ? i`<span class="muted">—</span>` : i`
        <dl class="kv">
          ${t.map(
        ([s, r]) => i`
              <dt>${s}</dt>
              <dd>${typeof r == "object" ? JSON.stringify(r) : String(r)}</dd>
            `
      )}
        </dl>
      `;
    }
    return i`<code>${String(e)}</code>`;
  }
  _renderDetailsSummary(e) {
    const t = La(e);
    if (t === "") return i`<span class="muted">—</span>`;
    const s = typeof e == "object" && e !== null && (e.label !== void 0 || e.name !== void 0);
    return i`<span class=${`summary ${s ? "" : "muted"}`}
      >${t}</span
    >`;
  }
  render() {
    const e = this._filtered();
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
            @input=${(t) => this._filter = t.target.value}
          />
          <span class="muted small"
            >${e.length} ${e.length === 1 ? "Eintrag" : "Einträge"}</span
          >
        </div>

        ${this._loading ? i`<p class="status">lade…</p>` : e.length === 0 ? i`<div class="empty">
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
                  ${e.map((t, s) => {
      const r = this._expanded.has(s), a = String(t.timestamp);
      return i`
                      <div class=${`table-row ${r ? "expanded" : ""}`}>
                        <button
                          class="row-toggle"
                          @click=${() => this._toggle(s)}
                          aria-expanded=${r}
                          aria-label=${r ? "Details verbergen" : "Details anzeigen"}
                        >
                          <span class="ts" title=${Xt(a, this._now)}>
                            ${qt(a, this._now)}
                          </span>
                          <span class="actor">${t.actor}</span>
                          <span>${this._renderActionPill(t.action)}</span>
                          <span class="target">
                            <code class="target-type">${t.target_type}</code>
                            ${t.target_id !== null && t.target_id !== void 0 ? i`<code class="target-id">#${t.target_id}</code>` : d}
                          </span>
                          <span class="details-inline">
                            ${this._renderDetailsSummary(t.details)}
                            <span class="chevron" aria-hidden="true">${r ? "▾" : "▸"}</span>
                          </span>
                        </button>
                        ${r ? i`<div class="details-panel">
                              ${this._renderDetails(t.details)}
                            </div>` : d}
                      </div>
                    `;
    })}
                </div>
              `}
      </div>
    `;
  }
};
G.styles = [
  L,
  W,
  Me,
  ae,
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
ne([
  b({ attribute: !1 })
], G.prototype, "api", 2);
ne([
  l()
], G.prototype, "_items", 2);
ne([
  l()
], G.prototype, "_loading", 2);
ne([
  l()
], G.prototype, "_filter", 2);
ne([
  l()
], G.prototype, "_expanded", 2);
ne([
  l()
], G.prototype, "_now", 2);
G = ne([
  k("audit-view")
], G);
var za = Object.defineProperty, Oa = Object.getOwnPropertyDescriptor, D = (e, t, s, r) => {
  for (var a = r > 1 ? void 0 : r ? Oa(t, s) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (r ? o(t, s, a) : o(a)) || a);
  return r && a && za(t, s, a), a;
};
function Na(e) {
  return e.source === "knx-bus" && e.text.includes("(GroupValueRead)");
}
const Ht = "messagehub.filters", Ut = "messagehub.filters.version", qe = "v1", oe = {
  severity: ["error", "warning", "info"],
  source: "",
  search: "",
  hideKnxRead: !1
};
let P = class extends y {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = this._initialTabFromHash(), this._items = [], this._total = 0, this._loading = !1, this._selected = null, this._filters = this._loadFilters(), this._newCount = 0, this._testing = !1, this._toast = "", this._overflowOpen = !1, this._savedFilters = [], this._savedFiltersOpen = !1, this._api = new Ds(), this._initialized = !1, this._onHashChange = () => {
      const e = this._initialTabFromHash();
      e !== this._tab && (this._tab = e);
    }, this._liveBuffer = [], this._liveFlushScheduled = !1, this._flushLiveBuffer = () => {
      if (this._liveFlushScheduled = !1, this._liveBuffer.length === 0) return;
      const e = this._liveBuffer;
      this._liveBuffer = [];
      const t = [...e.reverse(), ...this._items].slice(0, 200);
      this._items = t, this._total += e.length, this._newCount += e.length;
      const s = 4e3, r = e.length;
      window.setTimeout(
        () => this._newCount = Math.max(0, this._newCount - r),
        s
      );
    }, this._onSeverityChange = (e) => {
      this._filters = { ...this._filters, severity: e.detail.severities }, this._persistFilters(), this._reload();
    }, this._onSourceChange = (e) => {
      this._filters = { ...this._filters, source: e.detail.source }, this._persistFilters(), this._reload();
    }, this._onTimeRange = (e) => {
      this._filters = { ...this._filters, fromIso: e.detail.fromIso, toIso: e.detail.toIso }, this._persistFilters(), this._reload();
    }, this._onSelect = (e) => {
      this._selected = e.detail.msg;
    }, this._onMessageUpdated = (e) => {
      const t = e.detail.msg;
      this._items = this._items.map((s) => s.id === t.id ? t : s), this._selected?.id === t.id && (this._selected = t);
    }, this._onSeverityChangeMessage = async (e) => {
      const { id: t, severity: s, previous: r } = e.detail;
      this._items = this._items.map(
        (a) => a.id === t ? { ...a, severity: s } : a
      ), this._selected?.id === t && (this._selected = { ...this._selected, severity: s });
      try {
        await this._api.setMessageSeverity(t, s), this._showToast(`Severity geändert: ${r} → ${s}`);
      } catch (a) {
        this._items = this._items.map(
          (n) => n.id === t ? { ...n, severity: r } : n
        ), this._selected?.id === t && (this._selected = {
          ...this._selected,
          severity: r
        }), this._showToast(`Änderung fehlgeschlagen: ${a.message}`);
      }
    }, this._onDelete = async (e) => {
      try {
        await this._api.deleteMessage(e.detail.id), this._items = this._items.filter((t) => t.id !== e.detail.id), this._total = Math.max(0, this._total - 1), this._selected = null, this._showToast("Nachricht gelöscht");
      } catch (t) {
        this._showToast(`Löschen fehlgeschlagen: ${t.message}`);
      }
    }, this._toggleOverflow = () => {
      this._overflowOpen = !this._overflowOpen;
    }, this._closeOverflow = () => {
      this._overflowOpen && (this._overflowOpen = !1);
    };
  }
  firstUpdated() {
    this._tryInitialize();
  }
  updated(e) {
    e.has("hass") && this._tryInitialize();
  }
  _tryInitialize() {
    this._initialized || this.hass?.auth?.data?.access_token && (this._initialized = !0, this._api.setAuth(this.hass.auth.data.access_token), this._reload(), this._subscribeLive(), this._loadSavedFilters());
  }
  connectedCallback() {
    super.connectedCallback(), typeof window < "u" && window.addEventListener("hashchange", this._onHashChange);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._liveSub?.stop(), this._liveSub = void 0, typeof window < "u" && window.removeEventListener("hashchange", this._onHashChange);
  }
  // F-010: Mappt einen URL-Hash-Path auf einen der 4 Top-Tabs.
  // Akzeptierte Praefixe: messages | stats | settings | audit. Der
  // Sub-Path (z. B. settings/mqtt) wird von der jeweiligen Sub-View
  // selbst geparst — wir aendern hier nur den Top-Tab.
  _initialTabFromHash() {
    return typeof window > "u" || !window.location?.hash ? "messages" : Wt(window.location.hash).top;
  }
  // F-010: Tab-Klick aktualisiert den URL-Hash, damit Browser-Back/
  // Forward funktioniert und Bookmarks gezielt sind.
  _switchTab(e) {
    if (this._tab = e, typeof window < "u" && window.history) {
      const t = `#${e}`;
      window.location.hash !== t && window.history.replaceState(null, "", t);
    }
  }
  _scheduleLiveFlush() {
    this._liveFlushScheduled || (this._liveFlushScheduled = !0, typeof window < "u" && window.requestAnimationFrame ? window.requestAnimationFrame(this._flushLiveBuffer) : window.setTimeout(this._flushLiveBuffer, 0));
  }
  async _subscribeLive() {
    this.hass?.connection?.subscribeEvents && (this._liveSub = new Ls(
      this.hass.connection,
      "messagehub_message_added",
      (e) => {
        const t = e.data;
        this._matchesFilters(t) && (this._liveBuffer.push(t), this._scheduleLiveFlush());
      }
    ), await this._liveSub.start());
  }
  _matchesFilters(e) {
    return !(this._filters.severity.length && !this._filters.severity.includes(e.severity) || this._filters.source && e.source !== this._filters.source || this._filters.search && !e.text.toLowerCase().includes(this._filters.search.toLowerCase()) || this._filters.hideKnxRead && Na(e));
  }
  _loadFilters() {
    return zs({
      key: Ht,
      versionKey: Ut,
      currentVersion: qe,
      defaults: oe
    });
  }
  _persistFilters() {
    Os(
      {
        key: Ht,
        versionKey: Ut,
        currentVersion: qe
      },
      this._filters
    );
  }
  _resetFilters() {
    this._filters = { ...oe }, this._persistFilters(), this._reload();
  }
  async _reload() {
    this._loading = !0;
    try {
      const e = await this._api.listMessages({
        severity: this._filters.severity,
        source: this._filters.source || void 0,
        search: this._filters.search || void 0,
        from: this._filters.fromIso,
        to: this._filters.toIso,
        hideKnxRead: this._filters.hideKnxRead,
        limit: 100
      });
      this._items = e.items, this._total = e.total;
    } catch (e) {
      this._showToast(`Laden fehlgeschlagen: ${e.message}`);
    } finally {
      this._loading = !1;
    }
  }
  async _bulkDelete(e) {
    if (this._total === 0) return;
    const t = this._total, s = e === "all" ? `ALLE ${t} Nachrichten dauerhaft löschen?` : `Bis zu ${t} gefilterte Nachrichten dauerhaft löschen?`;
    if (window.confirm(s))
      try {
        const r = e === "all" ? {} : {
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
    if (!this.hass?.callService) {
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
      ], r = (a) => Math.floor(Math.random() * a);
      await this.hass.callService("messagehub", "add_message", {
        severity: e[r(e.length)],
        source: t[r(t.length)],
        text: s[r(s.length)],
        metadata: { source_panel: !0, ts: (/* @__PURE__ */ new Date()).toISOString() }
      }), this._showToast("Test-Nachricht gesendet"), window.setTimeout(() => void this._reload(), 300);
    } catch (e) {
      this._showToast(`Service-Call fehlgeschlagen: ${e.message}`);
    } finally {
      this._testing = !1;
    }
  }
  _showToast(e) {
    this._toast = e, this._toastTimer && window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 2800);
  }
  _debounceSearch(e) {
    this._debounceTimer && window.clearTimeout(this._debounceTimer), this._debounceTimer = window.setTimeout(() => {
      this._filters = { ...this._filters, search: e }, this._persistFilters(), this._reload();
    }, 300);
  }
  // Iter 93 / K1: Saved Filters laden (vom Server, scope=messages).
  async _loadSavedFilters() {
    try {
      this._savedFilters = await this._api.listSavedFilters("messages");
    } catch (e) {
      this._showToast(`Saved Filters konnten nicht geladen werden: ${e.message}`);
    }
  }
  async _saveCurrentFilter() {
    const e = window.prompt("Filter speichern als:");
    if (!(e === null || e.trim() === ""))
      try {
        const t = {
          ...this._filters,
          schema_version: qe
        };
        await this._api.upsertSavedFilter(e.trim(), "messages", t), this._showToast(`Filter „${e.trim()}" gespeichert`), await this._loadSavedFilters();
      } catch (t) {
        this._showToast(`Speichern fehlgeschlagen: ${t.message}`);
      }
  }
  _applySavedFilter(e) {
    const t = e.filters, s = {};
    for (const r of Object.keys(oe))
      r in t && (s[r] = t[r]);
    this._filters = { ...oe, ...s }, this._persistFilters(), this._savedFiltersOpen = !1, this._reload(), this._showToast(`Filter „${e.name}" geladen`);
  }
  async _deleteSavedFilter(e, t) {
    if (t.stopPropagation(), !!window.confirm(`Filter „${e.name}" wirklich löschen?`))
      try {
        await this._api.deleteSavedFilter(e.id), await this._loadSavedFilters(), this._showToast("Filter gelöscht");
      } catch (s) {
        this._showToast(`Löschen fehlgeschlagen: ${s.message}`);
      }
  }
  _renderSavedFiltersDropdown() {
    return i`
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
        ${this._savedFiltersOpen ? i`<div class="saved-filters-dropdown">
              ${this._savedFilters.length === 0 ? i`<p class="muted small">Keine gespeicherten Filter.</p>` : i`<ul>
                    ${this._savedFilters.map(
      (e) => i`<li
                        @click=${() => this._applySavedFilter(e)}
                        title="Klick: laden"
                      >
                        <span>${e.name}</span>
                        <button
                          class="filter-reset"
                          @click=${(t) => void this._deleteSavedFilter(e, t)}
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
    return this._filters.severity.length !== oe.severity.length || this._filters.source !== "" || this._filters.search !== "" || this._filters.fromIso !== void 0 || this._filters.hideKnxRead !== oe.hideKnxRead;
  }
  _exportUrl(e) {
    return this._api.exportUrl({
      severity: this._filters.severity,
      source: this._filters.source || void 0,
      search: this._filters.search || void 0,
      from: this._filters.fromIso,
      to: this._filters.toIso,
      limit: 1e4,
      format: e
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
          @input=${(e) => {
      const t = e.target.value;
      this._debounceSearch(t);
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
            @change=${(e) => {
      this._filters = {
        ...this._filters,
        hideKnxRead: e.target.checked
      }, this._persistFilters(), this._reload();
    }}
          />
          <span>KNX-Reads ausblenden</span>
        </label>
        ${this._hasActiveFilters() ? i`<button class="filter-reset" @click=${this._resetFilters}>
              Filter zurücksetzen
            </button>` : null}
        ${this._renderSavedFiltersDropdown()}
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
          <div class="overflow" @click=${(e) => e.stopPropagation()}>
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
            @message-updated=${this._onMessageUpdated}
            @error=${(e) => this._showToast(e.detail.message)}
          ></detail-pane>` : null}
    `;
  }
  render() {
    const e = [
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
            ${e.map(
      (t) => i`<button
                role="tab"
                aria-selected=${this._tab === t.id}
                class=${`tab ${this._tab === t.id ? "active" : ""}`}
                @click=${() => this._switchTab(t.id)}
              >
                ${t.label}
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
          ${this._tab === "stats" ? i`<stats-view .api=${this._api} .hass=${this.hass}></stats-view>` : null}
          ${this._tab === "settings" ? i`<settings-view .api=${this._api}></settings-view>` : null}
          ${this._tab === "audit" ? i`<audit-view .api=${this._api}></audit-view>` : null}
        </main>

        ${this._toast ? i`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }
};
P.styles = [
  L,
  W,
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
D([
  b({ attribute: !1 })
], P.prototype, "hass", 2);
D([
  b({ type: Boolean })
], P.prototype, "narrow", 2);
D([
  b({ attribute: !1 })
], P.prototype, "panel", 2);
D([
  l()
], P.prototype, "_tab", 2);
D([
  l()
], P.prototype, "_items", 2);
D([
  l()
], P.prototype, "_total", 2);
D([
  l()
], P.prototype, "_loading", 2);
D([
  l()
], P.prototype, "_selected", 2);
D([
  l()
], P.prototype, "_filters", 2);
D([
  l()
], P.prototype, "_newCount", 2);
D([
  l()
], P.prototype, "_testing", 2);
D([
  l()
], P.prototype, "_toast", 2);
D([
  l()
], P.prototype, "_overflowOpen", 2);
D([
  l()
], P.prototype, "_savedFilters", 2);
D([
  l()
], P.prototype, "_savedFiltersOpen", 2);
P = D([
  k("messagehub-panel")
], P);
export {
  P as MessageHubPanel,
  Na as isKnxReadMessage
};
