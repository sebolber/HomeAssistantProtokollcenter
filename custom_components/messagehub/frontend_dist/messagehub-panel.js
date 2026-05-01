/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis, ae = q.ShadowRoot && (q.ShadyCSS === void 0 || q.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, le = Symbol(), ue = /* @__PURE__ */ new WeakMap();
let ke = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== le) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (ae && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = ue.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && ue.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Re = (s) => new ke(typeof s == "string" ? s : s + "", void 0, le), k = (s, ...e) => {
  const t = s.length === 1 ? s[0] : e.reduce((i, r, n) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[n + 1], s[0]);
  return new ke(t, s, le);
}, Le = (s, e) => {
  if (ae) s.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), r = q.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = t.cssText, s.appendChild(i);
  }
}, fe = ae ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return Re(t);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ze, defineProperty: Be, getOwnPropertyDescriptor: Fe, getOwnPropertyNames: We, getOwnPropertySymbols: Ve, getPrototypeOf: qe } = Object, A = globalThis, _e = A.trustedTypes, Ke = _e ? _e.emptyScript : "", se = A.reactiveElementPolyfillSupport, L = (s, e) => s, K = { toAttribute(s, e) {
  switch (e) {
    case Boolean:
      s = s ? Ke : null;
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
} }, ce = (s, e) => !ze(s, e), $e = { attribute: !0, type: String, converter: K, reflect: !1, useDefault: !1, hasChanged: ce };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), A.litPropertyMetadata ?? (A.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let M = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = $e) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(e, i, t);
      r !== void 0 && Be(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: r, set: n } = Fe(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: r, set(o) {
      const l = r == null ? void 0 : r.call(this);
      n == null || n.call(this, o), this.requestUpdate(e, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? $e;
  }
  static _$Ei() {
    if (this.hasOwnProperty(L("elementProperties"))) return;
    const e = qe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(L("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(L("properties"))) {
      const t = this.properties, i = [...We(t), ...Ve(t)];
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
      for (const r of i) t.unshift(fe(r));
    } else e !== void 0 && t.push(fe(e));
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
    return Le(e, this.constructor.elementStyles), e;
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
    var n;
    const i = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, i);
    if (r !== void 0 && i.reflect === !0) {
      const o = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : K).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var n, o;
    const i = this.constructor, r = i._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const l = i.getPropertyOptions(r), a = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((n = l.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? l.converter : K;
      this._$Em = r;
      const h = a.fromAttribute(t, l.type);
      this[r] = h ?? ((o = this._$Ej) == null ? void 0 : o.get(r)) ?? h, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, r = !1, n) {
    var o;
    if (e !== void 0) {
      const l = this.constructor;
      if (r === !1 && (n = this[e]), i ?? (i = l.getPropertyOptions(e)), !((i.hasChanged ?? ce)(n, t) || i.useDefault && i.reflect && n === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(l._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: r, wrapped: n }, o) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), n !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
        for (const [n, o] of this._$Ep) this[n] = o;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [n, o] of r) {
        const { wrapped: l } = o, a = this[n];
        l !== !0 || this._$AL.has(n) || a === void 0 || this.C(n, void 0, o, a);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (i = this._$EO) == null || i.forEach((r) => {
        var n;
        return (n = r.hostUpdate) == null ? void 0 : n.call(r);
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
M.elementStyles = [], M.shadowRootOptions = { mode: "open" }, M[L("elementProperties")] = /* @__PURE__ */ new Map(), M[L("finalized")] = /* @__PURE__ */ new Map(), se == null || se({ ReactiveElement: M }), (A.reactiveElementVersions ?? (A.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const z = globalThis, ve = (s) => s, J = z.trustedTypes, ge = J ? J.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, Ue = "$lit$", x = `lit$${Math.random().toFixed(9).slice(2)}$`, Me = "?" + x, Je = `<${Me}>`, O = document, B = () => O.createComment(""), F = (s) => s === null || typeof s != "object" && typeof s != "function", he = Array.isArray, Ze = (s) => he(s) || typeof (s == null ? void 0 : s[Symbol.iterator]) == "function", re = `[ 	
\f\r]`, N = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, me = /-->/g, be = />/g, E = RegExp(`>|${re}(?:([^\\s"'>=/]+)(${re}*=${re}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ye = /'/g, we = /"/g, He = /^(?:script|style|textarea|title)$/i, Qe = (s) => (e, ...t) => ({ _$litType$: s, strings: e, values: t }), f = Qe(1), T = Symbol.for("lit-noChange"), $ = Symbol.for("lit-nothing"), xe = /* @__PURE__ */ new WeakMap(), P = O.createTreeWalker(O, 129);
function De(s, e) {
  if (!he(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ge !== void 0 ? ge.createHTML(e) : e;
}
const Ye = (s, e) => {
  const t = s.length - 1, i = [];
  let r, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = N;
  for (let l = 0; l < t; l++) {
    const a = s[l];
    let h, u, c = -1, p = 0;
    for (; p < a.length && (o.lastIndex = p, u = o.exec(a), u !== null); ) p = o.lastIndex, o === N ? u[1] === "!--" ? o = me : u[1] !== void 0 ? o = be : u[2] !== void 0 ? (He.test(u[2]) && (r = RegExp("</" + u[2], "g")), o = E) : u[3] !== void 0 && (o = E) : o === E ? u[0] === ">" ? (o = r ?? N, c = -1) : u[1] === void 0 ? c = -2 : (c = o.lastIndex - u[2].length, h = u[1], o = u[3] === void 0 ? E : u[3] === '"' ? we : ye) : o === we || o === ye ? o = E : o === me || o === be ? o = N : (o = E, r = void 0);
    const d = o === E && s[l + 1].startsWith("/>") ? " " : "";
    n += o === N ? a + Je : c >= 0 ? (i.push(h), a.slice(0, c) + Ue + a.slice(c) + x + d) : a + x + (c === -2 ? l : d);
  }
  return [De(s, n + (s[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class W {
  constructor({ strings: e, _$litType$: t }, i) {
    let r;
    this.parts = [];
    let n = 0, o = 0;
    const l = e.length - 1, a = this.parts, [h, u] = Ye(e, t);
    if (this.el = W.createElement(h, i), P.currentNode = this.el.content, t === 2 || t === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (r = P.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const c of r.getAttributeNames()) if (c.endsWith(Ue)) {
          const p = u[o++], d = r.getAttribute(c).split(x), _ = /([.?@])?(.*)/.exec(p);
          a.push({ type: 1, index: n, name: _[2], strings: d, ctor: _[1] === "." ? Xe : _[1] === "?" ? et : _[1] === "@" ? tt : G }), r.removeAttribute(c);
        } else c.startsWith(x) && (a.push({ type: 6, index: n }), r.removeAttribute(c));
        if (He.test(r.tagName)) {
          const c = r.textContent.split(x), p = c.length - 1;
          if (p > 0) {
            r.textContent = J ? J.emptyScript : "";
            for (let d = 0; d < p; d++) r.append(c[d], B()), P.nextNode(), a.push({ type: 2, index: ++n });
            r.append(c[p], B());
          }
        }
      } else if (r.nodeType === 8) if (r.data === Me) a.push({ type: 2, index: n });
      else {
        let c = -1;
        for (; (c = r.data.indexOf(x, c + 1)) !== -1; ) a.push({ type: 7, index: n }), c += x.length - 1;
      }
      n++;
    }
  }
  static createElement(e, t) {
    const i = O.createElement("template");
    return i.innerHTML = e, i;
  }
}
function H(s, e, t = s, i) {
  var o, l;
  if (e === T) return e;
  let r = i !== void 0 ? (o = t._$Co) == null ? void 0 : o[i] : t._$Cl;
  const n = F(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== n && ((l = r == null ? void 0 : r._$AO) == null || l.call(r, !1), n === void 0 ? r = void 0 : (r = new n(s), r._$AT(s, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = r : t._$Cl = r), r !== void 0 && (e = H(s, r._$AS(s, e.values), r, i)), e;
}
class Ge {
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
    const { el: { content: t }, parts: i } = this._$AD, r = ((e == null ? void 0 : e.creationScope) ?? O).importNode(t, !0);
    P.currentNode = r;
    let n = P.nextNode(), o = 0, l = 0, a = i[0];
    for (; a !== void 0; ) {
      if (o === a.index) {
        let h;
        a.type === 2 ? h = new I(n, n.nextSibling, this, e) : a.type === 1 ? h = new a.ctor(n, a.name, a.strings, this, e) : a.type === 6 && (h = new st(n, this, e)), this._$AV.push(h), a = i[++l];
      }
      o !== (a == null ? void 0 : a.index) && (n = P.nextNode(), o++);
    }
    return P.currentNode = O, r;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class I {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, i, r) {
    this.type = 2, this._$AH = $, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
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
    e = H(this, e, t), F(e) ? e === $ || e == null || e === "" ? (this._$AH !== $ && this._$AR(), this._$AH = $) : e !== this._$AH && e !== T && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ze(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== $ && F(this._$AH) ? this._$AA.nextSibling.data = e : this.T(O.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var n;
    const { values: t, _$litType$: i } = e, r = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = W.createElement(De(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === r) this._$AH.p(t);
    else {
      const o = new Ge(r, this), l = o.u(this.options);
      o.p(t), this.T(l), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = xe.get(e.strings);
    return t === void 0 && xe.set(e.strings, t = new W(e)), t;
  }
  k(e) {
    he(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, r = 0;
    for (const n of e) r === t.length ? t.push(i = new I(this.O(B()), this.O(B()), this, this.options)) : i = t[r], i._$AI(n), r++;
    r < t.length && (this._$AR(i && i._$AB.nextSibling, r), t.length = r);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, t); e !== this._$AB; ) {
      const r = ve(e).nextSibling;
      ve(e).remove(), e = r;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class G {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, r, n) {
    this.type = 1, this._$AH = $, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = $;
  }
  _$AI(e, t = this, i, r) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) e = H(this, e, t, 0), o = !F(e) || e !== this._$AH && e !== T, o && (this._$AH = e);
    else {
      const l = e;
      let a, h;
      for (e = n[0], a = 0; a < n.length - 1; a++) h = H(this, l[i + a], t, a), h === T && (h = this._$AH[a]), o || (o = !F(h) || h !== this._$AH[a]), h === $ ? e = $ : e !== $ && (e += (h ?? "") + n[a + 1]), this._$AH[a] = h;
    }
    o && !r && this.j(e);
  }
  j(e) {
    e === $ ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Xe extends G {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === $ ? void 0 : e;
  }
}
class et extends G {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== $);
  }
}
class tt extends G {
  constructor(e, t, i, r, n) {
    super(e, t, i, r, n), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = H(this, e, t, 0) ?? $) === T) return;
    const i = this._$AH, r = e === $ && i !== $ || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, n = e !== $ && (i === $ || r);
    r && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class st {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    H(this, e);
  }
}
const rt = { I }, ie = z.litHtmlPolyfillSupport;
ie == null || ie(W, I), (z.litHtmlVersions ?? (z.litHtmlVersions = [])).push("3.3.2");
const it = (s, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let r = i._$litPart$;
  if (r === void 0) {
    const n = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = r = new I(e.insertBefore(B(), n), n, void 0, t ?? {});
  }
  return r._$AI(s), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const C = globalThis;
let m = class extends M {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = it(t, this.renderRoot, this.renderOptions);
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
    return T;
  }
};
var Te;
m._$litElement$ = !0, m.finalized = !0, (Te = C.litElementHydrateSupport) == null || Te.call(C, { LitElement: m });
const oe = C.litElementPolyfillSupport;
oe == null || oe({ LitElement: m });
(C.litElementVersions ?? (C.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const U = (s) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(s, e);
  }) : customElements.define(s, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ot = { attribute: !0, type: String, converter: K, reflect: !1, hasChanged: ce }, nt = (s = ot, e, t) => {
  const { kind: i, metadata: r } = t;
  let n = globalThis.litPropertyMetadata.get(r);
  if (n === void 0 && globalThis.litPropertyMetadata.set(r, n = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), n.set(t.name, s), i === "accessor") {
    const { name: o } = t;
    return { set(l) {
      const a = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(o, a, s, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(o, void 0, s, l), l;
    } };
  }
  if (i === "setter") {
    const { name: o } = t;
    return function(l) {
      const a = this[o];
      e.call(this, l), this.requestUpdate(o, a, s, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function g(s) {
  return (e, t) => typeof t == "object" ? nt(s, e, t) : ((i, r, n) => {
    const o = r.hasOwnProperty(n);
    return r.constructor.createProperty(n, i), o ? Object.getOwnPropertyDescriptor(r, n) : void 0;
  })(s, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function w(s) {
  return g({ ...s, state: !0, attribute: !1 });
}
class at {
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
    var n;
    const t = new URLSearchParams();
    (n = e.severity) != null && n.length && t.set("severity", e.severity.join(",")), e.source && t.set("source", e.source), e.search && t.set("search", e.search), e.from && t.set("from", e.from), e.to && t.set("to", e.to), e.limit !== void 0 && t.set("limit", String(e.limit)), e.offset !== void 0 && t.set("offset", String(e.offset)), e.order && t.set("order", e.order);
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
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const lt = { CHILD: 2 }, ct = (s) => (...e) => ({ _$litDirective$: s, values: e });
let ht = class {
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
const { I: dt } = rt, Ae = (s) => s, Ee = () => document.createComment(""), R = (s, e, t) => {
  var n;
  const i = s._$AA.parentNode, r = e === void 0 ? s._$AB : e._$AA;
  if (t === void 0) {
    const o = i.insertBefore(Ee(), r), l = i.insertBefore(Ee(), r);
    t = new dt(o, l, s, s.options);
  } else {
    const o = t._$AB.nextSibling, l = t._$AM, a = l !== s;
    if (a) {
      let h;
      (n = t._$AQ) == null || n.call(t, s), t._$AM = s, t._$AP !== void 0 && (h = s._$AU) !== l._$AU && t._$AP(h);
    }
    if (o !== r || a) {
      let h = t._$AA;
      for (; h !== o; ) {
        const u = Ae(h).nextSibling;
        Ae(i).insertBefore(h, r), h = u;
      }
    }
  }
  return t;
}, S = (s, e, t = s) => (s._$AI(e, t), s), pt = {}, ut = (s, e = pt) => s._$AH = e, ft = (s) => s._$AH, ne = (s) => {
  s._$AR(), s._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Se = (s, e, t) => {
  const i = /* @__PURE__ */ new Map();
  for (let r = e; r <= t; r++) i.set(s[r], r);
  return i;
}, _t = ct(class extends ht {
  constructor(s) {
    if (super(s), s.type !== lt.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(s, e, t) {
    let i;
    t === void 0 ? t = e : e !== void 0 && (i = e);
    const r = [], n = [];
    let o = 0;
    for (const l of s) r[o] = i ? i(l, o) : o, n[o] = t(l, o), o++;
    return { values: n, keys: r };
  }
  render(s, e, t) {
    return this.dt(s, e, t).values;
  }
  update(s, [e, t, i]) {
    const r = ft(s), { values: n, keys: o } = this.dt(e, t, i);
    if (!Array.isArray(r)) return this.ut = o, n;
    const l = this.ut ?? (this.ut = []), a = [];
    let h, u, c = 0, p = r.length - 1, d = 0, _ = n.length - 1;
    for (; c <= p && d <= _; ) if (r[c] === null) c++;
    else if (r[p] === null) p--;
    else if (l[c] === o[d]) a[d] = S(r[c], n[d]), c++, d++;
    else if (l[p] === o[_]) a[_] = S(r[p], n[_]), p--, _--;
    else if (l[c] === o[_]) a[_] = S(r[c], n[_]), R(s, a[_ + 1], r[c]), c++, _--;
    else if (l[p] === o[d]) a[d] = S(r[p], n[d]), R(s, r[c], r[p]), p--, d++;
    else if (h === void 0 && (h = Se(o, d, _), u = Se(l, c, p)), h.has(l[c])) if (h.has(l[p])) {
      const y = u.get(o[d]), te = y !== void 0 ? r[y] : null;
      if (te === null) {
        const pe = R(s, r[c]);
        S(pe, n[d]), a[d] = pe;
      } else a[d] = S(te, n[d]), R(s, r[c], te), r[y] = null;
      d++;
    } else ne(r[p]), p--;
    else ne(r[c]), c++;
    for (; d <= _; ) {
      const y = R(s, a[_ + 1]);
      S(y, n[d]), a[d++] = y;
    }
    for (; c <= p; ) {
      const y = r[c++];
      y !== null && ne(y);
    }
    return this.ut = o, ut(s, a), T;
  }
});
var $t = Object.defineProperty, vt = Object.getOwnPropertyDescriptor, je = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? vt(e, t) : e, n = s.length - 1, o; n >= 0; n--)
    (o = s[n]) && (r = (i ? o(e, t, r) : o(r)) || r);
  return i && r && $t(e, t, r), r;
};
const gt = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·"
};
let Z = class extends m {
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
    return this.items.length ? f`
      <div class="scroll" role="list">
        ${_t(
      this.items,
      (s) => s.id,
      (s) => f`
            <div
              class=${`row sev-${s.severity}`}
              tabindex="0"
              role="listitem button"
              @click=${() => this._onClick(s)}
              @keydown=${(e) => this._onKey(e, s)}
            >
              <span class="icon" aria-hidden="true">
                ${gt[s.severity] ?? "·"}
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
    ` : f`<div class="empty">Keine Nachrichten</div>`;
  }
};
Z.styles = k`
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
je([
  g({ attribute: !1 })
], Z.prototype, "items", 2);
Z = je([
  U("message-table")
], Z);
var mt = Object.defineProperty, bt = Object.getOwnPropertyDescriptor, Ie = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? bt(e, t) : e, n = s.length - 1, o; n >= 0; n--)
    (o = s[n]) && (r = (i ? o(e, t, r) : o(r)) || r);
  return i && r && mt(e, t, r), r;
};
const Pe = ["error", "warning", "info", "debug"];
let Q = class extends m {
  constructor() {
    super(...arguments), this.selected = [...Pe];
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
    return f`
      <div class="chips">
        ${Pe.map(
      (s) => f`<button
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
Q.styles = k`
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
Ie([
  g({ attribute: !1 })
], Q.prototype, "selected", 2);
Q = Ie([
  U("severity-filter")
], Q);
var yt = Object.defineProperty, wt = Object.getOwnPropertyDescriptor, X = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? wt(e, t) : e, n = s.length - 1, o; n >= 0; n--)
    (o = s[n]) && (r = (i ? o(e, t, r) : o(r)) || r);
  return i && r && yt(e, t, r), r;
};
let D = class extends m {
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
    return f`
      <select @change=${this._onChange} .value=${this.selected}>
        <option value="">Alle Quellen</option>
        ${this._sources.map((s) => f`<option value=${s}>${s}</option>`)}
      </select>
    `;
  }
};
D.styles = k`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `;
X([
  g({ attribute: !1 })
], D.prototype, "api", 2);
X([
  g({ attribute: !1 })
], D.prototype, "selected", 2);
X([
  w()
], D.prototype, "_sources", 2);
D = X([
  U("source-filter")
], D);
var xt = Object.defineProperty, At = Object.getOwnPropertyDescriptor, de = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? At(e, t) : e, n = s.length - 1, o; n >= 0; n--)
    (o = s[n]) && (r = (i ? o(e, t, r) : o(r)) || r);
  return i && r && xt(e, t, r), r;
};
let V = class extends m {
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
    return f`
      <div class="presets">
        <button @click=${() => this._set("1h")}>1h</button>
        <button @click=${() => this._set("24h")}>24h</button>
        <button @click=${() => this._set("7d")}>7d</button>
        <button @click=${() => this._set("all")}>Alle</button>
      </div>
    `;
  }
};
V.styles = k`
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
de([
  g({ attribute: !1 })
], V.prototype, "fromIso", 2);
de([
  g({ attribute: !1 })
], V.prototype, "toIso", 2);
V = de([
  U("time-range-filter")
], V);
var Et = Object.defineProperty, St = Object.getOwnPropertyDescriptor, Ne = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? St(e, t) : e, n = s.length - 1, o; n >= 0; n--)
    (o = s[n]) && (r = (i ? o(e, t, r) : o(r)) || r);
  return i && r && Et(e, t, r), r;
};
let Y = class extends m {
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
    return f`
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
        ${this.msg.metadata ? f`<h3>Metadata</h3>
              <pre class="meta">${JSON.stringify(this.msg.metadata, null, 2)}</pre>` : null}
        <footer>
          <button class="del" @click=${this._delete}>Loeschen</button>
        </footer>
      </aside>
    `;
  }
};
Y.styles = k`
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
Ne([
  g({ attribute: !1 })
], Y.prototype, "msg", 2);
Y = Ne([
  U("detail-pane")
], Y);
var Pt = Object.defineProperty, Ct = Object.getOwnPropertyDescriptor, ee = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Ct(e, t) : e, n = s.length - 1, o; n >= 0; n--)
    (o = s[n]) && (r = (i ? o(e, t, r) : o(r)) || r);
  return i && r && Pt(e, t, r), r;
};
let j = class extends m {
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
        this._items = await this.api.listWebhooks();
      } finally {
        this._loading = !1;
      }
    }
  }
  _copyUrl(s) {
    const e = `${window.location.origin}/api/webhook/${s}`;
    navigator.clipboard.writeText(e);
  }
  render() {
    return this._loading ? f`<div class="status">lade...</div>` : this._items.length ? f`
      <ul>
        ${this._items.map(
      (s) => f`<li>
            <div class="row">
              <span class="name">${s.name}</span>
              <span class="src">${s.default_source}</span>
              <span class="sev">${s.default_severity}</span>
              <span class=${s.enabled ? "ok" : "off"}>
                ${s.enabled ? "aktiv" : "deaktiviert"}
              </span>
              <button @click=${() => this._copyUrl(s.webhook_id)}>URL kopieren</button>
            </div>
          </li>`
    )}
      </ul>
    ` : f`<div class="status">Keine Webhooks angelegt.</div>`;
  }
};
j.styles = k`
    :host {
      display: block;
      padding: 16px;
    }
    .status {
      color: var(--secondary-text-color, #666);
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 160px 80px 90px 130px;
      gap: 12px;
      padding: 8px;
      border-bottom: 1px solid var(--divider-color, #eee);
      align-items: center;
    }
    .ok {
      color: var(--success-color, #4caf50);
    }
    .off {
      color: var(--secondary-text-color, #999);
    }
    button {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
    }
  `;
ee([
  g({ attribute: !1 })
], j.prototype, "api", 2);
ee([
  w()
], j.prototype, "_items", 2);
ee([
  w()
], j.prototype, "_loading", 2);
j = ee([
  U("webhook-list")
], j);
var Ot = Object.defineProperty, Tt = Object.getOwnPropertyDescriptor, b = (s, e, t, i) => {
  for (var r = i > 1 ? void 0 : i ? Tt(e, t) : e, n = s.length - 1, o; n >= 0; n--)
    (o = s[n]) && (r = (i ? o(e, t, r) : o(r)) || r);
  return i && r && Ot(e, t, r), r;
};
const Ce = "messagehub.filters", Oe = {
  severity: ["error", "warning", "info"],
  source: "",
  search: ""
};
let v = class extends m {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "messages", this._items = [], this._total = 0, this._loading = !1, this._selected = null, this._filters = this._loadFilters(), this._api = new at(), this._onSeverityChange = (s) => {
      this._filters = { ...this._filters, severity: s.detail.severities }, this._persistFilters(), this._reload();
    }, this._onSourceChange = (s) => {
      this._filters = { ...this._filters, source: s.detail.source }, this._persistFilters(), this._reload();
    }, this._onTimeRange = (s) => {
      this._filters = { ...this._filters, fromIso: s.detail.fromIso, toIso: s.detail.toIso }, this._persistFilters(), this._reload();
    }, this._onSelect = (s) => {
      this._selected = s.detail.msg;
    }, this._onDelete = async (s) => {
      await this._api.deleteMessage(s.detail.id), this._items = this._items.filter((e) => e.id !== s.detail.id), this._selected = null;
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
      this._matchesFilters(i) && (this._items = [i, ...this._items].slice(0, 200), this._total += 1);
    }, "messagehub_message_added"));
  }
  _matchesFilters(s) {
    return !(this._filters.severity.length && !this._filters.severity.includes(s.severity) || this._filters.source && s.source !== this._filters.source || this._filters.search && !s.text.toLowerCase().includes(this._filters.search.toLowerCase()));
  }
  _loadFilters() {
    try {
      const s = localStorage.getItem(Ce);
      if (s) return { ...Oe, ...JSON.parse(s) };
    } catch {
    }
    return { ...Oe };
  }
  _persistFilters() {
    try {
      localStorage.setItem(Ce, JSON.stringify(this._filters));
    } catch {
    }
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
    } finally {
      this._loading = !1;
    }
  }
  _renderMessages() {
    return f`
      <div class="filter-bar">
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
          placeholder="Volltextsuche..."
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
      </div>
      <div class="status">
        ${this._loading ? "lade..." : `Anzeige: ${this._items.length} von ${this._total}`}
      </div>
      <message-table
        .items=${this._items}
        @select=${this._onSelect}
      ></message-table>
      ${this._selected ? f`<detail-pane
            .msg=${this._selected}
            @close=${() => this._selected = null}
            @delete=${this._onDelete}
          ></detail-pane>` : null}
    `;
  }
  _debounceSearch(s) {
    this._debounceTimer && window.clearTimeout(this._debounceTimer), this._debounceTimer = window.setTimeout(() => {
      this._filters = { ...this._filters, search: s }, this._persistFilters(), this._reload();
    }, 300);
  }
  _renderSettings() {
    return f`<webhook-list .api=${this._api}></webhook-list>`;
  }
  _renderStats() {
    return f`<div class="stats">Statistik-Dashboard (Iter 41)</div>`;
  }
  render() {
    return f`
      <div class="root">
        <header>
          <h1>Message Hub</h1>
          <nav>
            <button class=${this._tab === "messages" ? "active" : ""} @click=${() => this._tab = "messages"}>Nachrichten</button>
            <button class=${this._tab === "stats" ? "active" : ""} @click=${() => this._tab = "stats"}>Statistik</button>
            <button class=${this._tab === "settings" ? "active" : ""} @click=${() => this._tab = "settings"}>Einstellungen</button>
            <button @click=${() => this._reload()}>Aktualisieren</button>
          </nav>
        </header>
        <main>
          ${this._tab === "messages" ? this._renderMessages() : null}
          ${this._tab === "settings" ? this._renderSettings() : null}
          ${this._tab === "stats" ? this._renderStats() : null}
        </main>
      </div>
    `;
  }
};
v.styles = k`
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
      padding: 8px 16px;
      border-bottom: 1px solid var(--divider-color, #ddd);
      background: var(--app-header-background-color, var(--primary-color, #03a9f4));
      color: var(--app-header-text-color, white);
    }
    header h1 {
      font-size: 1.1em;
      margin: 0;
    }
    nav button {
      background: transparent;
      color: inherit;
      border: 1px solid currentColor;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      margin-left: 4px;
    }
    nav button.active {
      background: currentColor;
      color: var(--app-header-background-color, var(--primary-color, #03a9f4));
    }
    main {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--divider-color, #ddd);
      align-items: center;
    }
    input.search {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      min-width: 220px;
    }
    .status {
      padding: 4px 16px;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    .stats {
      padding: 24px;
    }
  `;
b([
  g({ attribute: !1 })
], v.prototype, "hass", 2);
b([
  g({ type: Boolean })
], v.prototype, "narrow", 2);
b([
  g({ attribute: !1 })
], v.prototype, "panel", 2);
b([
  w()
], v.prototype, "_tab", 2);
b([
  w()
], v.prototype, "_items", 2);
b([
  w()
], v.prototype, "_total", 2);
b([
  w()
], v.prototype, "_loading", 2);
b([
  w()
], v.prototype, "_selected", 2);
b([
  w()
], v.prototype, "_filters", 2);
v = b([
  U("messagehub-panel")
], v);
export {
  v as MessageHubPanel
};
