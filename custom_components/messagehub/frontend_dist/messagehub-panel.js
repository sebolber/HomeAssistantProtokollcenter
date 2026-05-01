/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const tt = globalThis, yt = tt.ShadowRoot && (tt.ShadyCSS === void 0 || tt.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, bt = Symbol(), At = /* @__PURE__ */ new WeakMap();
let qt = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== bt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (yt && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = At.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && At.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const oe = (i) => new qt(typeof i == "string" ? i : i + "", void 0, bt), k = (i, ...t) => {
  const e = i.length === 1 ? i[0] : t.reduce((s, r, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + i[o + 1], i[0]);
  return new qt(e, i, bt);
}, ne = (i, t) => {
  if (yt) i.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), r = tt.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = e.cssText, i.appendChild(s);
  }
}, xt = yt ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return oe(e);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: le, defineProperty: ae, getOwnPropertyDescriptor: he, getOwnPropertyNames: ce, getOwnPropertySymbols: de, getPrototypeOf: ue } = Object, S = globalThis, Ct = S.trustedTypes, _e = Ct ? Ct.emptyScript : "", _t = S.reactiveElementPolyfillSupport, B = (i, t) => i, et = { toAttribute(i, t) {
  switch (t) {
    case Boolean:
      i = i ? _e : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, t) {
  let e = i;
  switch (t) {
    case Boolean:
      e = i !== null;
      break;
    case Number:
      e = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(i);
      } catch {
        e = null;
      }
  }
  return e;
} }, $t = (i, t) => !le(i, t), Tt = { attribute: !0, type: String, converter: et, reflect: !1, useDefault: !1, hasChanged: $t };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), S.litPropertyMetadata ?? (S.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let z = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = Tt) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const s = Symbol(), r = this.getPropertyDescriptor(t, s, e);
      r !== void 0 && ae(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, s) {
    const { get: r, set: o } = he(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: r, set(n) {
      const l = r == null ? void 0 : r.call(this);
      o == null || o.call(this, n), this.requestUpdate(t, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Tt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(B("elementProperties"))) return;
    const t = ue(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(B("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(B("properties"))) {
      const e = this.properties, s = [...ce(e), ...de(e)];
      for (const r of s) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [s, r] of e) this.elementProperties.set(s, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, s] of this.elementProperties) {
      const r = this._$Eu(e, s);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const r of s) e.unshift(xt(r));
    } else t !== void 0 && e.push(xt(t));
    return e;
  }
  static _$Eu(t, e) {
    const s = e.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const s of e.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ne(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var s;
      return (s = e.hostConnected) == null ? void 0 : s.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var s;
      return (s = e.hostDisconnected) == null ? void 0 : s.call(e);
    });
  }
  attributeChangedCallback(t, e, s) {
    this._$AK(t, s);
  }
  _$ET(t, e) {
    var o;
    const s = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, s);
    if (r !== void 0 && s.reflect === !0) {
      const n = (((o = s.converter) == null ? void 0 : o.toAttribute) !== void 0 ? s.converter : et).toAttribute(e, s.type);
      this._$Em = t, n == null ? this.removeAttribute(r) : this.setAttribute(r, n), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var o, n;
    const s = this.constructor, r = s._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const l = s.getPropertyOptions(r), a = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((o = l.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? l.converter : et;
      this._$Em = r;
      const h = a.fromAttribute(e, l.type);
      this[r] = h ?? ((n = this._$Ej) == null ? void 0 : n.get(r)) ?? h, this._$Em = null;
    }
  }
  requestUpdate(t, e, s, r = !1, o) {
    var n;
    if (t !== void 0) {
      const l = this.constructor;
      if (r === !1 && (o = this[t]), s ?? (s = l.getPropertyOptions(t)), !((s.hasChanged ?? $t)(o, e) || s.useDefault && s.reflect && o === ((n = this._$Ej) == null ? void 0 : n.get(t)) && !this.hasAttribute(l._$Eu(t, s)))) return;
      this.C(t, e, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: s, reflect: r, wrapped: o }, n) {
    s && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var s;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [o, n] of this._$Ep) this[o] = n;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [o, n] of r) {
        const { wrapped: l } = n, a = this[o];
        l !== !0 || this._$AL.has(o) || a === void 0 || this.C(o, void 0, n, a);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (s = this._$EO) == null || s.forEach((r) => {
        var o;
        return (o = r.hostUpdate) == null ? void 0 : o.call(r);
      }), this.update(e)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((s) => {
      var r;
      return (r = s.hostUpdated) == null ? void 0 : r.call(s);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
z.elementStyles = [], z.shadowRootOptions = { mode: "open" }, z[B("elementProperties")] = /* @__PURE__ */ new Map(), z[B("finalized")] = /* @__PURE__ */ new Map(), _t == null || _t({ ReactiveElement: z }), (S.reactiveElementVersions ?? (S.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const F = globalThis, Ot = (i) => i, st = F.trustedTypes, Pt = st ? st.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, Kt = "$lit$", E = `lit$${Math.random().toFixed(9).slice(2)}$`, Jt = "?" + E, pe = `<${Jt}>`, P = document, q = () => P.createComment(""), K = (i) => i === null || typeof i != "object" && typeof i != "function", wt = Array.isArray, fe = (i) => wt(i) || typeof (i == null ? void 0 : i[Symbol.iterator]) == "function", pt = `[ 	
\f\r]`, V = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, kt = /-->/g, Lt = />/g, x = RegExp(`>|${pt}(?:([^\\s"'>=/]+)(${pt}*=${pt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Mt = /'/g, zt = /"/g, Zt = /^(?:script|style|textarea|title)$/i, me = (i) => (t, ...e) => ({ _$litType$: i, strings: t, values: e }), p = me(1), A = Symbol.for("lit-noChange"), m = Symbol.for("lit-nothing"), Rt = /* @__PURE__ */ new WeakMap(), T = P.createTreeWalker(P, 129);
function Qt(i, t) {
  if (!wt(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Pt !== void 0 ? Pt.createHTML(t) : t;
}
const ge = (i, t) => {
  const e = i.length - 1, s = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = V;
  for (let l = 0; l < e; l++) {
    const a = i[l];
    let h, _, c = -1, u = 0;
    for (; u < a.length && (n.lastIndex = u, _ = n.exec(a), _ !== null); ) u = n.lastIndex, n === V ? _[1] === "!--" ? n = kt : _[1] !== void 0 ? n = Lt : _[2] !== void 0 ? (Zt.test(_[2]) && (r = RegExp("</" + _[2], "g")), n = x) : _[3] !== void 0 && (n = x) : n === x ? _[0] === ">" ? (n = r ?? V, c = -1) : _[1] === void 0 ? c = -2 : (c = n.lastIndex - _[2].length, h = _[1], n = _[3] === void 0 ? x : _[3] === '"' ? zt : Mt) : n === zt || n === Mt ? n = x : n === kt || n === Lt ? n = V : (n = x, r = void 0);
    const d = n === x && i[l + 1].startsWith("/>") ? " " : "";
    o += n === V ? a + pe : c >= 0 ? (s.push(h), a.slice(0, c) + Kt + a.slice(c) + E + d) : a + E + (c === -2 ? l : d);
  }
  return [Qt(i, o + (i[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class J {
  constructor({ strings: t, _$litType$: e }, s) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const l = t.length - 1, a = this.parts, [h, _] = ge(t, e);
    if (this.el = J.createElement(h, s), T.currentNode = this.el.content, e === 2 || e === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (r = T.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const c of r.getAttributeNames()) if (c.endsWith(Kt)) {
          const u = _[n++], d = r.getAttribute(c).split(E), f = /([.?@])?(.*)/.exec(u);
          a.push({ type: 1, index: o, name: f[2], strings: d, ctor: f[1] === "." ? ye : f[1] === "?" ? be : f[1] === "@" ? $e : lt }), r.removeAttribute(c);
        } else c.startsWith(E) && (a.push({ type: 6, index: o }), r.removeAttribute(c));
        if (Zt.test(r.tagName)) {
          const c = r.textContent.split(E), u = c.length - 1;
          if (u > 0) {
            r.textContent = st ? st.emptyScript : "";
            for (let d = 0; d < u; d++) r.append(c[d], q()), T.nextNode(), a.push({ type: 2, index: ++o });
            r.append(c[u], q());
          }
        }
      } else if (r.nodeType === 8) if (r.data === Jt) a.push({ type: 2, index: o });
      else {
        let c = -1;
        for (; (c = r.data.indexOf(E, c + 1)) !== -1; ) a.push({ type: 7, index: o }), c += E.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const s = P.createElement("template");
    return s.innerHTML = t, s;
  }
}
function R(i, t, e = i, s) {
  var n, l;
  if (t === A) return t;
  let r = s !== void 0 ? (n = e._$Co) == null ? void 0 : n[s] : e._$Cl;
  const o = K(t) ? void 0 : t._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== o && ((l = r == null ? void 0 : r._$AO) == null || l.call(r, !1), o === void 0 ? r = void 0 : (r = new o(i), r._$AT(i, e, s)), s !== void 0 ? (e._$Co ?? (e._$Co = []))[s] = r : e._$Cl = r), r !== void 0 && (t = R(i, r._$AS(i, t.values), r, s)), t;
}
class ve {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: s } = this._$AD, r = ((t == null ? void 0 : t.creationScope) ?? P).importNode(e, !0);
    T.currentNode = r;
    let o = T.nextNode(), n = 0, l = 0, a = s[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let h;
        a.type === 2 ? h = new U(o, o.nextSibling, this, t) : a.type === 1 ? h = new a.ctor(o, a.name, a.strings, this, t) : a.type === 6 && (h = new we(o, this, t)), this._$AV.push(h), a = s[++l];
      }
      n !== (a == null ? void 0 : a.index) && (o = T.nextNode(), n++);
    }
    return T.currentNode = P, r;
  }
  p(t) {
    let e = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
  }
}
class U {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, s, r) {
    this.type = 2, this._$AH = m, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = s, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = R(this, t, e), K(t) ? t === m || t == null || t === "" ? (this._$AH !== m && this._$AR(), this._$AH = m) : t !== this._$AH && t !== A && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : fe(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== m && K(this._$AH) ? this._$AA.nextSibling.data = t : this.T(P.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var o;
    const { values: e, _$litType$: s } = t, r = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = J.createElement(Qt(s.h, s.h[0]), this.options)), s);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === r) this._$AH.p(e);
    else {
      const n = new ve(r, this), l = n.u(this.options);
      n.p(e), this.T(l), this._$AH = n;
    }
  }
  _$AC(t) {
    let e = Rt.get(t.strings);
    return e === void 0 && Rt.set(t.strings, e = new J(t)), e;
  }
  k(t) {
    wt(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, r = 0;
    for (const o of t) r === e.length ? e.push(s = new U(this.O(q()), this.O(q()), this, this.options)) : s = e[r], s._$AI(o), r++;
    r < e.length && (this._$AR(s && s._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, e); t !== this._$AB; ) {
      const r = Ot(t).nextSibling;
      Ot(t).remove(), t = r;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class lt {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, r, o) {
    this.type = 1, this._$AH = m, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = m;
  }
  _$AI(t, e = this, s, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = R(this, t, e, 0), n = !K(t) || t !== this._$AH && t !== A, n && (this._$AH = t);
    else {
      const l = t;
      let a, h;
      for (t = o[0], a = 0; a < o.length - 1; a++) h = R(this, l[s + a], e, a), h === A && (h = this._$AH[a]), n || (n = !K(h) || h !== this._$AH[a]), h === m ? t = m : t !== m && (t += (h ?? "") + o[a + 1]), this._$AH[a] = h;
    }
    n && !r && this.j(t);
  }
  j(t) {
    t === m ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class ye extends lt {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === m ? void 0 : t;
  }
}
class be extends lt {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== m);
  }
}
class $e extends lt {
  constructor(t, e, s, r, o) {
    super(t, e, s, r, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = R(this, t, e, 0) ?? m) === A) return;
    const s = this._$AH, r = t === m && s !== m || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, o = t !== m && (s === m || r);
    r && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class we {
  constructor(t, e, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    R(this, t);
  }
}
const Ee = { I: U }, ft = F.litHtmlPolyfillSupport;
ft == null || ft(J, U), (F.litHtmlVersions ?? (F.litHtmlVersions = [])).push("3.3.2");
const Se = (i, t, e) => {
  const s = (e == null ? void 0 : e.renderBefore) ?? t;
  let r = s._$litPart$;
  if (r === void 0) {
    const o = (e == null ? void 0 : e.renderBefore) ?? null;
    s._$litPart$ = r = new U(t.insertBefore(q(), o), o, void 0, e ?? {});
  }
  return r._$AI(i), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const O = globalThis;
let v = class extends z {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Se(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return A;
  }
};
var Wt;
v._$litElement$ = !0, v.finalized = !0, (Wt = O.litElementHydrateSupport) == null || Wt.call(O, { LitElement: v });
const mt = O.litElementPolyfillSupport;
mt == null || mt({ LitElement: v });
(O.litElementVersions ?? (O.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const L = (i) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(i, t);
  }) : customElements.define(i, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ae = { attribute: !0, type: String, converter: et, reflect: !1, hasChanged: $t }, xe = (i = Ae, t, e) => {
  const { kind: s, metadata: r } = e;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), s === "setter" && ((i = Object.create(i)).wrapped = !0), o.set(e.name, i), s === "accessor") {
    const { name: n } = e;
    return { set(l) {
      const a = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(n, a, i, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, i, l), l;
    } };
  }
  if (s === "setter") {
    const { name: n } = e;
    return function(l) {
      const a = this[n];
      t.call(this, l), this.requestUpdate(n, a, i, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function g(i) {
  return (t, e) => typeof e == "object" ? xe(i, t, e) : ((s, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, s), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(i, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function w(i) {
  return g({ ...i, state: !0, attribute: !1 });
}
class Ce {
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
    var o;
    const e = new URLSearchParams();
    (o = t.severity) != null && o.length && e.set("severity", t.severity.join(",")), t.source && e.set("source", t.source), t.search && e.set("search", t.search), t.from && e.set("from", t.from), t.to && e.set("to", t.to), t.limit !== void 0 && e.set("limit", String(t.limit)), t.offset !== void 0 && e.set("offset", String(t.offset)), t.order && e.set("order", t.order);
    const s = `${this.baseUrl}/api/messagehub/messages?${e.toString()}`, r = await fetch(s, { headers: this.headers() });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }
  async getMessage(t) {
    const e = await fetch(`${this.baseUrl}/api/messagehub/messages/${t}`, {
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    return await e.json();
  }
  async deleteMessage(t) {
    const e = await fetch(`${this.baseUrl}/api/messagehub/messages/${t}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
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
}
function Q(i, t, e, s) {
  var r = arguments.length, o = r < 3 ? t : s === null ? s = Object.getOwnPropertyDescriptor(t, e) : s, n;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") o = Reflect.decorate(i, t, e, s);
  else for (var l = i.length - 1; l >= 0; l--) (n = i[l]) && (o = (r < 3 ? n(o) : r > 3 ? n(t, e, o) : n(t, e)) || o);
  return r > 3 && o && Object.defineProperty(t, e, o), o;
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Et = { CHILD: 2 }, Yt = (i) => (...t) => ({ _$litDirective$: i, values: t });
let Gt = class {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, s) {
    this._$Ct = t, this._$AM = e, this._$Ci = s;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: Te } = Ee, It = (i) => i, Oe = (i) => i.strings === void 0, Nt = () => document.createComment(""), j = (i, t, e) => {
  var o;
  const s = i._$AA.parentNode, r = t === void 0 ? i._$AB : t._$AA;
  if (e === void 0) {
    const n = s.insertBefore(Nt(), r), l = s.insertBefore(Nt(), r);
    e = new Te(n, l, i, i.options);
  } else {
    const n = e._$AB.nextSibling, l = e._$AM, a = l !== i;
    if (a) {
      let h;
      (o = e._$AQ) == null || o.call(e, i), e._$AM = i, e._$AP !== void 0 && (h = i._$AU) !== l._$AU && e._$AP(h);
    }
    if (n !== r || a) {
      let h = e._$AA;
      for (; h !== n; ) {
        const _ = It(h).nextSibling;
        It(s).insertBefore(h, r), h = _;
      }
    }
  }
  return e;
}, C = (i, t, e = i) => (i._$AI(t, e), i), Pe = {}, ke = (i, t = Pe) => i._$AH = t, Le = (i) => i._$AH, gt = (i) => {
  i._$AR(), i._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const W = (i, t) => {
  var s;
  const e = i._$AN;
  if (e === void 0) return !1;
  for (const r of e) (s = r._$AO) == null || s.call(r, t, !1), W(r, t);
  return !0;
}, it = (i) => {
  let t, e;
  do {
    if ((t = i._$AM) === void 0) break;
    e = t._$AN, e.delete(i), i = t;
  } while ((e == null ? void 0 : e.size) === 0);
}, Xt = (i) => {
  for (let t; t = i._$AM; i = t) {
    let e = t._$AN;
    if (e === void 0) t._$AN = e = /* @__PURE__ */ new Set();
    else if (e.has(i)) break;
    e.add(i), Re(t);
  }
};
function Me(i) {
  this._$AN !== void 0 ? (it(this), this._$AM = i, Xt(this)) : this._$AM = i;
}
function ze(i, t = !1, e = 0) {
  const s = this._$AH, r = this._$AN;
  if (r !== void 0 && r.size !== 0) if (t) if (Array.isArray(s)) for (let o = e; o < s.length; o++) W(s[o], !1), it(s[o]);
  else s != null && (W(s, !1), it(s));
  else W(this, i);
}
const Re = (i) => {
  i.type == Et.CHILD && (i._$AP ?? (i._$AP = ze), i._$AQ ?? (i._$AQ = Me));
};
class Ie extends Gt {
  constructor() {
    super(...arguments), this._$AN = void 0;
  }
  _$AT(t, e, s) {
    super._$AT(t, e, s), Xt(this), this.isConnected = t._$AU;
  }
  _$AO(t, e = !0) {
    var s, r;
    t !== this.isConnected && (this.isConnected = t, t ? (s = this.reconnected) == null || s.call(this) : (r = this.disconnected) == null || r.call(this)), e && (W(this, t), it(this));
  }
  setValue(t) {
    if (Oe(this._$Ct)) this._$Ct._$AI(t, this);
    else {
      const e = [...this._$Ct._$AH];
      e[this._$Ci] = t, this._$Ct._$AI(e, this, 0);
    }
  }
  disconnected() {
  }
  reconnected() {
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ut = (i, t, e) => {
  const s = /* @__PURE__ */ new Map();
  for (let r = t; r <= e; r++) s.set(i[r], r);
  return s;
}, Ne = Yt(class extends Gt {
  constructor(i) {
    if (super(i), i.type !== Et.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(i, t, e) {
    let s;
    e === void 0 ? e = t : t !== void 0 && (s = t);
    const r = [], o = [];
    let n = 0;
    for (const l of i) r[n] = s ? s(l, n) : n, o[n] = e(l, n), n++;
    return { values: o, keys: r };
  }
  render(i, t, e) {
    return this.dt(i, t, e).values;
  }
  update(i, [t, e, s]) {
    const r = Le(i), { values: o, keys: n } = this.dt(t, e, s);
    if (!Array.isArray(r)) return this.ut = n, o;
    const l = this.ut ?? (this.ut = []), a = [];
    let h, _, c = 0, u = r.length - 1, d = 0, f = o.length - 1;
    for (; c <= u && d <= f; ) if (r[c] === null) c++;
    else if (r[u] === null) u--;
    else if (l[c] === n[d]) a[d] = C(r[c], o[d]), c++, d++;
    else if (l[u] === n[f]) a[f] = C(r[u], o[f]), u--, f--;
    else if (l[c] === n[f]) a[f] = C(r[c], o[f]), j(i, a[f + 1], r[c]), c++, f--;
    else if (l[u] === n[d]) a[d] = C(r[u], o[d]), j(i, r[c], r[u]), u--, d++;
    else if (h === void 0 && (h = Ut(n, d, f), _ = Ut(l, c, u)), h.has(l[c])) if (h.has(l[u])) {
      const b = _.get(n[d]), D = b !== void 0 ? r[b] : null;
      if (D === null) {
        const Y = j(i, r[c]);
        C(Y, o[d]), a[d] = Y;
      } else a[d] = C(D, o[d]), j(i, r[c], D), r[b] = null;
      d++;
    } else gt(r[u]), u--;
    else gt(r[c]), c++;
    for (; d <= f; ) {
      const b = j(i, a[f + 1]);
      C(b, o[d]), a[d++] = b;
    }
    for (; c <= u; ) {
      const b = r[c++];
      b !== null && gt(b);
    }
    return this.ut = n, ke(i, a), A;
  }
});
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class at extends Event {
  constructor(t) {
    super(at.eventName, { bubbles: !1 }), this.first = t.first, this.last = t.last;
  }
}
at.eventName = "rangeChanged";
class ht extends Event {
  constructor(t) {
    super(ht.eventName, { bubbles: !1 }), this.first = t.first, this.last = t.last;
  }
}
ht.eventName = "visibilityChanged";
class ct extends Event {
  constructor() {
    super(ct.eventName, { bubbles: !1 });
  }
}
ct.eventName = "unpinned";
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class Ue {
  constructor(t) {
    this._element = null;
    const e = t ?? window;
    this._node = e, t && (this._element = t);
  }
  get element() {
    return this._element || document.scrollingElement || document.documentElement;
  }
  get scrollTop() {
    return this.element.scrollTop || window.scrollY;
  }
  get scrollLeft() {
    return this.element.scrollLeft || window.scrollX;
  }
  get scrollHeight() {
    return this.element.scrollHeight;
  }
  get scrollWidth() {
    return this.element.scrollWidth;
  }
  get viewportHeight() {
    return this._element ? this._element.getBoundingClientRect().height : window.innerHeight;
  }
  get viewportWidth() {
    return this._element ? this._element.getBoundingClientRect().width : window.innerWidth;
  }
  get maxScrollTop() {
    return this.scrollHeight - this.viewportHeight;
  }
  get maxScrollLeft() {
    return this.scrollWidth - this.viewportWidth;
  }
}
class He extends Ue {
  constructor(t, e) {
    super(e), this._clients = /* @__PURE__ */ new Set(), this._retarget = null, this._end = null, this.__destination = null, this.correctingScrollError = !1, this._checkForArrival = this._checkForArrival.bind(this), this._updateManagedScrollTo = this._updateManagedScrollTo.bind(this), this.scrollTo = this.scrollTo.bind(this), this.scrollBy = this.scrollBy.bind(this);
    const s = this._node;
    this._originalScrollTo = s.scrollTo, this._originalScrollBy = s.scrollBy, this._originalScroll = s.scroll, this._attach(t);
  }
  get _destination() {
    return this.__destination;
  }
  get scrolling() {
    return this._destination !== null;
  }
  scrollTo(t, e) {
    const s = typeof t == "number" && typeof e == "number" ? { left: t, top: e } : t;
    this._scrollTo(s);
  }
  scrollBy(t, e) {
    const s = typeof t == "number" && typeof e == "number" ? { left: t, top: e } : t;
    s.top !== void 0 && (s.top += this.scrollTop), s.left !== void 0 && (s.left += this.scrollLeft), this._scrollTo(s);
  }
  _nativeScrollTo(t) {
    this._originalScrollTo.bind(this._element || window)(t);
  }
  _scrollTo(t, e = null, s = null) {
    this._end !== null && this._end(), t.behavior === "smooth" ? (this._setDestination(t), this._retarget = e, this._end = s) : this._resetScrollState(), this._nativeScrollTo(t);
  }
  _setDestination(t) {
    let { top: e, left: s } = t;
    return e = e === void 0 ? void 0 : Math.max(0, Math.min(e, this.maxScrollTop)), s = s === void 0 ? void 0 : Math.max(0, Math.min(s, this.maxScrollLeft)), this._destination !== null && s === this._destination.left && e === this._destination.top ? !1 : (this.__destination = { top: e, left: s, behavior: "smooth" }, !0);
  }
  _resetScrollState() {
    this.__destination = null, this._retarget = null, this._end = null;
  }
  _updateManagedScrollTo(t) {
    this._destination && this._setDestination(t) && this._nativeScrollTo(this._destination);
  }
  managedScrollTo(t, e, s) {
    return this._scrollTo(t, e, s), this._updateManagedScrollTo;
  }
  correctScrollError(t) {
    this.correctingScrollError = !0, requestAnimationFrame(() => requestAnimationFrame(() => this.correctingScrollError = !1)), this._nativeScrollTo(t), this._retarget && this._setDestination(this._retarget()), this._destination && this._nativeScrollTo(this._destination);
  }
  _checkForArrival() {
    if (this._destination !== null) {
      const { scrollTop: t, scrollLeft: e } = this;
      let { top: s, left: r } = this._destination;
      s = Math.min(s || 0, this.maxScrollTop), r = Math.min(r || 0, this.maxScrollLeft);
      const o = Math.abs(s - t), n = Math.abs(r - e);
      o < 1 && n < 1 && (this._end && this._end(), this._resetScrollState());
    }
  }
  detach(t) {
    return this._clients.delete(t), this._clients.size === 0 && (this._node.scrollTo = this._originalScrollTo, this._node.scrollBy = this._originalScrollBy, this._node.scroll = this._originalScroll, this._node.removeEventListener("scroll", this._checkForArrival)), null;
  }
  _attach(t) {
    this._clients.add(t), this._clients.size === 1 && (this._node.scrollTo = this.scrollTo, this._node.scrollBy = this.scrollBy, this._node.scroll = this.scrollTo, this._node.addEventListener("scroll", this._checkForArrival));
  }
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let Ht = typeof window < "u" ? window.ResizeObserver : void 0;
const vt = Symbol("virtualizerRef"), G = "virtualizer-sizer";
let Dt;
class De {
  constructor(t) {
    if (this._benchmarkStart = null, this._layout = null, this._clippingAncestors = [], this._scrollSize = null, this._scrollError = null, this._childrenPos = null, this._childMeasurements = null, this._toBeMeasured = /* @__PURE__ */ new Map(), this._rangeChanged = !0, this._itemsChanged = !0, this._visibilityChanged = !0, this._scrollerController = null, this._isScroller = !1, this._sizer = null, this._hostElementRO = null, this._childrenRO = null, this._mutationObserver = null, this._scrollEventListeners = [], this._scrollEventListenerOptions = {
      passive: !0
    }, this._loadListener = this._childLoaded.bind(this), this._scrollIntoViewTarget = null, this._updateScrollIntoViewCoordinates = null, this._items = [], this._first = -1, this._last = -1, this._firstVisible = -1, this._lastVisible = -1, this._scheduled = /* @__PURE__ */ new WeakSet(), this._measureCallback = null, this._measureChildOverride = null, this._layoutCompletePromise = null, this._layoutCompleteResolver = null, this._layoutCompleteRejecter = null, this._pendingLayoutComplete = null, this._layoutInitialized = null, this._connected = !1, !t)
      throw new Error("Virtualizer constructor requires a configuration object");
    if (t.hostElement)
      this._init(t);
    else
      throw new Error('Virtualizer configuration requires the "hostElement" property');
  }
  set items(t) {
    Array.isArray(t) && t !== this._items && (this._itemsChanged = !0, this._items = t, this._schedule(this._updateLayout));
  }
  _init(t) {
    this._isScroller = !!t.scroller, this._initHostElement(t);
    const e = t.layout || {};
    this._layoutInitialized = this._initLayout(e);
  }
  _initObservers() {
    this._mutationObserver = new MutationObserver(this._finishDOMUpdate.bind(this)), this._hostElementRO = new Ht(() => this._hostElementSizeChanged()), this._childrenRO = new Ht(this._childrenSizeChanged.bind(this));
  }
  _initHostElement(t) {
    const e = this._hostElement = t.hostElement;
    this._applyVirtualizerStyles(), e[vt] = this;
  }
  connected() {
    this._initObservers();
    const t = this._isScroller;
    this._clippingAncestors = Be(this._hostElement, t), this._scrollerController = new He(this, this._clippingAncestors[0]), this._schedule(this._updateLayout), this._observeAndListen(), this._connected = !0;
  }
  _observeAndListen() {
    this._mutationObserver.observe(this._hostElement, { childList: !0 }), this._hostElementRO.observe(this._hostElement), this._scrollEventListeners.push(window), window.addEventListener("scroll", this, this._scrollEventListenerOptions), this._clippingAncestors.forEach((t) => {
      t.addEventListener("scroll", this, this._scrollEventListenerOptions), this._scrollEventListeners.push(t), this._hostElementRO.observe(t);
    }), this._hostElementRO.observe(this._scrollerController.element), this._children.forEach((t) => this._childrenRO.observe(t)), this._scrollEventListeners.forEach((t) => t.addEventListener("scroll", this, this._scrollEventListenerOptions));
  }
  disconnected() {
    var t, e, s, r;
    this._scrollEventListeners.forEach((o) => o.removeEventListener("scroll", this, this._scrollEventListenerOptions)), this._scrollEventListeners = [], this._clippingAncestors = [], (t = this._scrollerController) == null || t.detach(this), this._scrollerController = null, (e = this._mutationObserver) == null || e.disconnect(), this._mutationObserver = null, (s = this._hostElementRO) == null || s.disconnect(), this._hostElementRO = null, (r = this._childrenRO) == null || r.disconnect(), this._childrenRO = null, this._rejectLayoutCompletePromise("disconnected"), this._connected = !1;
  }
  _applyVirtualizerStyles() {
    const e = this._hostElement.style;
    e.display = e.display || "block", e.position = e.position || "relative", e.contain = e.contain || "size layout", this._isScroller && (e.overflow = e.overflow || "auto", e.minHeight = e.minHeight || "150px");
  }
  _getSizer() {
    const t = this._hostElement;
    if (!this._sizer) {
      let e = t.querySelector(`[${G}]`);
      e || (e = document.createElement("div"), e.setAttribute(G, ""), t.appendChild(e)), Object.assign(e.style, {
        position: "absolute",
        margin: "-2px 0 0 0",
        padding: 0,
        visibility: "hidden",
        fontSize: "2px"
      }), e.textContent = "&nbsp;", e.setAttribute(G, ""), this._sizer = e;
    }
    return this._sizer;
  }
  async updateLayoutConfig(t) {
    await this._layoutInitialized;
    const e = t.type || // The new config is compatible with the current layout,
    // so we update the config and return true to indicate
    // a successful update
    Dt;
    if (typeof e == "function" && this._layout instanceof e) {
      const s = { ...t };
      return delete s.type, this._layout.config = s, !0;
    }
    return !1;
  }
  async _initLayout(t) {
    let e, s;
    if (typeof t.type == "function") {
      s = t.type;
      const r = { ...t };
      delete r.type, e = r;
    } else
      e = t;
    s === void 0 && (Dt = s = (await import("./flow-D-0MTYCm.js")).FlowLayout), this._layout = new s((r) => this._handleLayoutMessage(r), e), this._layout.measureChildren && typeof this._layout.updateItemSizes == "function" && (typeof this._layout.measureChildren == "function" && (this._measureChildOverride = this._layout.measureChildren), this._measureCallback = this._layout.updateItemSizes.bind(this._layout)), this._layout.listenForChildLoadEvents && this._hostElement.addEventListener("load", this._loadListener, !0), this._schedule(this._updateLayout);
  }
  // TODO (graynorton): Rework benchmarking so that it has no API and
  // instead is always on except in production builds
  startBenchmarking() {
    this._benchmarkStart === null && (this._benchmarkStart = window.performance.now());
  }
  stopBenchmarking() {
    if (this._benchmarkStart !== null) {
      const t = window.performance.now(), e = t - this._benchmarkStart, r = performance.getEntriesByName("uv-virtualizing", "measure").filter((o) => o.startTime >= this._benchmarkStart && o.startTime < t).reduce((o, n) => o + n.duration, 0);
      return this._benchmarkStart = null, { timeElapsed: e, virtualizationTime: r };
    }
    return null;
  }
  _measureChildren() {
    const t = {}, e = this._children, s = this._measureChildOverride || this._measureChild;
    for (let r = 0; r < e.length; r++) {
      const o = e[r], n = this._first + r;
      (this._itemsChanged || this._toBeMeasured.has(o)) && (t[n] = s.call(this, o, this._items[n]));
    }
    this._childMeasurements = t, this._schedule(this._updateLayout), this._toBeMeasured.clear();
  }
  /**
   * Returns the width, height, and margins of the given child.
   */
  _measureChild(t) {
    const { width: e, height: s } = t.getBoundingClientRect();
    return Object.assign({ width: e, height: s }, Ve(t));
  }
  async _schedule(t) {
    this._scheduled.has(t) || (this._scheduled.add(t), await Promise.resolve(), this._scheduled.delete(t), t.call(this));
  }
  async _updateDOM(t) {
    this._scrollSize = t.scrollSize, this._adjustRange(t.range), this._childrenPos = t.childPositions, this._scrollError = t.scrollError || null;
    const { _rangeChanged: e, _itemsChanged: s } = this;
    this._visibilityChanged && (this._notifyVisibility(), this._visibilityChanged = !1), (e || s) && (this._notifyRange(), this._rangeChanged = !1), this._finishDOMUpdate();
  }
  _finishDOMUpdate() {
    this._connected && (this._children.forEach((t) => this._childrenRO.observe(t)), this._checkScrollIntoViewTarget(this._childrenPos), this._positionChildren(this._childrenPos), this._sizeHostElement(this._scrollSize), this._correctScrollError(), this._benchmarkStart && "mark" in window.performance && window.performance.mark("uv-end"));
  }
  _updateLayout() {
    this._layout && this._connected && (this._layout.items = this._items, this._updateView(), this._childMeasurements !== null && (this._measureCallback && this._measureCallback(this._childMeasurements), this._childMeasurements = null), this._layout.reflowIfNeeded(), this._benchmarkStart && "mark" in window.performance && window.performance.mark("uv-end"));
  }
  _handleScrollEvent() {
    var t;
    if (this._benchmarkStart && "mark" in window.performance) {
      try {
        window.performance.measure("uv-virtualizing", "uv-start", "uv-end");
      } catch (e) {
        console.warn("Error measuring performance data: ", e);
      }
      window.performance.mark("uv-start");
    }
    this._scrollerController.correctingScrollError === !1 && ((t = this._layout) == null || t.unpin()), this._schedule(this._updateLayout);
  }
  handleEvent(t) {
    switch (t.type) {
      case "scroll":
        (t.currentTarget === window || this._clippingAncestors.includes(t.currentTarget)) && this._handleScrollEvent();
        break;
      default:
        console.warn("event not handled", t);
    }
  }
  _handleLayoutMessage(t) {
    t.type === "stateChanged" ? this._updateDOM(t) : t.type === "visibilityChanged" ? (this._firstVisible = t.firstVisible, this._lastVisible = t.lastVisible, this._notifyVisibility()) : t.type === "unpinned" && this._hostElement.dispatchEvent(new ct());
  }
  get _children() {
    const t = [];
    let e = this._hostElement.firstElementChild;
    for (; e; )
      e.hasAttribute(G) || t.push(e), e = e.nextElementSibling;
    return t;
  }
  _updateView() {
    var r;
    const t = this._hostElement, e = (r = this._scrollerController) == null ? void 0 : r.element, s = this._layout;
    if (t && e && s) {
      let o, n, l, a;
      const h = t.getBoundingClientRect();
      o = 0, n = 0, l = window.innerHeight, a = window.innerWidth;
      const _ = this._clippingAncestors.map((M) => M.getBoundingClientRect());
      _.unshift(h);
      for (const M of _)
        o = Math.max(o, M.top), n = Math.max(n, M.left), l = Math.min(l, M.bottom), a = Math.min(a, M.right);
      const c = e.getBoundingClientRect(), u = {
        left: h.left - c.left,
        top: h.top - c.top
      }, d = {
        width: e.scrollWidth,
        height: e.scrollHeight
      }, f = o - h.top + t.scrollTop, b = n - h.left + t.scrollLeft, D = Math.max(0, l - o), Y = Math.max(0, a - n);
      s.viewportSize = { width: Y, height: D }, s.viewportScroll = { top: f, left: b }, s.totalScrollSize = d, s.offsetWithinScroller = u;
    }
  }
  /**
   * Styles the host element so that its size reflects the
   * total size of all items.
   */
  _sizeHostElement(t) {
    const s = t && t.width !== null ? Math.min(82e5, t.width) : 0, r = t && t.height !== null ? Math.min(82e5, t.height) : 0;
    if (this._isScroller)
      this._getSizer().style.transform = `translate(${s}px, ${r}px)`;
    else {
      const o = this._hostElement.style;
      o.minWidth = s ? `${s}px` : "100%", o.minHeight = r ? `${r}px` : "100%";
    }
  }
  /**
   * Sets the top and left transform style of the children from the values in
   * pos.
   */
  _positionChildren(t) {
    t && t.forEach(({ top: e, left: s, width: r, height: o, xOffset: n, yOffset: l }, a) => {
      const h = this._children[a - this._first];
      h && (h.style.position = "absolute", h.style.boxSizing = "border-box", h.style.transform = `translate(${s}px, ${e}px)`, r !== void 0 && (h.style.width = r + "px"), o !== void 0 && (h.style.height = o + "px"), h.style.left = n === void 0 ? null : n + "px", h.style.top = l === void 0 ? null : l + "px");
    });
  }
  async _adjustRange(t) {
    const { _first: e, _last: s, _firstVisible: r, _lastVisible: o } = this;
    this._first = t.first, this._last = t.last, this._firstVisible = t.firstVisible, this._lastVisible = t.lastVisible, this._rangeChanged = this._rangeChanged || this._first !== e || this._last !== s, this._visibilityChanged = this._visibilityChanged || this._firstVisible !== r || this._lastVisible !== o;
  }
  _correctScrollError() {
    if (this._scrollError) {
      const { scrollTop: t, scrollLeft: e } = this._scrollerController, { top: s, left: r } = this._scrollError;
      this._scrollError = null, this._scrollerController.correctScrollError({
        top: t - s,
        left: e - r
      });
    }
  }
  element(t) {
    var e;
    return t === 1 / 0 && (t = this._items.length - 1), ((e = this._items) == null ? void 0 : e[t]) === void 0 ? void 0 : {
      scrollIntoView: (s = {}) => this._scrollElementIntoView({ ...s, index: t })
    };
  }
  _scrollElementIntoView(t) {
    if (t.index >= this._first && t.index <= this._last)
      this._children[t.index - this._first].scrollIntoView(t);
    else if (t.index = Math.min(t.index, this._items.length - 1), t.behavior === "smooth") {
      const e = this._layout.getScrollIntoViewCoordinates(t), { behavior: s } = t;
      this._updateScrollIntoViewCoordinates = this._scrollerController.managedScrollTo(Object.assign(e, { behavior: s }), () => this._layout.getScrollIntoViewCoordinates(t), () => this._scrollIntoViewTarget = null), this._scrollIntoViewTarget = t;
    } else
      this._layout.pin = t;
  }
  /**
   * If we are smoothly scrolling to an element and the target element
   * is in the DOM, we update our target coordinates as needed
   */
  _checkScrollIntoViewTarget(t) {
    const { index: e } = this._scrollIntoViewTarget || {};
    e && (t != null && t.has(e)) && this._updateScrollIntoViewCoordinates(this._layout.getScrollIntoViewCoordinates(this._scrollIntoViewTarget));
  }
  /**
   * Emits a rangechange event with the current first, last, firstVisible, and
   * lastVisible.
   */
  _notifyRange() {
    this._hostElement.dispatchEvent(new at({ first: this._first, last: this._last }));
  }
  _notifyVisibility() {
    this._hostElement.dispatchEvent(new ht({
      first: this._firstVisible,
      last: this._lastVisible
    }));
  }
  get layoutComplete() {
    return this._layoutCompletePromise || (this._layoutCompletePromise = new Promise((t, e) => {
      this._layoutCompleteResolver = t, this._layoutCompleteRejecter = e;
    })), this._layoutCompletePromise;
  }
  _rejectLayoutCompletePromise(t) {
    this._layoutCompleteRejecter !== null && this._layoutCompleteRejecter(t), this._resetLayoutCompleteState();
  }
  _scheduleLayoutComplete() {
    this._layoutCompletePromise && this._pendingLayoutComplete === null && (this._pendingLayoutComplete = requestAnimationFrame(() => requestAnimationFrame(() => this._resolveLayoutCompletePromise())));
  }
  _resolveLayoutCompletePromise() {
    this._layoutCompleteResolver !== null && this._layoutCompleteResolver(), this._resetLayoutCompleteState();
  }
  _resetLayoutCompleteState() {
    this._layoutCompletePromise = null, this._layoutCompleteResolver = null, this._layoutCompleteRejecter = null, this._pendingLayoutComplete = null;
  }
  /**
   * Render and update the view at the next opportunity with the given
   * hostElement size.
   */
  _hostElementSizeChanged() {
    this._schedule(this._updateLayout);
  }
  // TODO (graynorton): Rethink how this works. Probably child loading is too specific
  // to have dedicated support for; might want some more generic lifecycle hooks for
  // layouts to use. Possibly handle measurement this way, too, or maybe that remains
  // a first-class feature?
  _childLoaded() {
  }
  // This is the callback for the ResizeObserver that watches the
  // virtualizer's children. We land here at the end of every virtualizer
  // update cycle that results in changes to physical items, and we also
  // end up here if one or more children change size independently of
  // the virtualizer update cycle.
  _childrenSizeChanged(t) {
    var e;
    if ((e = this._layout) != null && e.measureChildren) {
      for (const s of t)
        this._toBeMeasured.set(s.target, s.contentRect);
      this._measureChildren();
    }
    this._scheduleLayoutComplete(), this._itemsChanged = !1, this._rangeChanged = !1;
  }
}
function Ve(i) {
  const t = window.getComputedStyle(i);
  return {
    marginTop: X(t.marginTop),
    marginRight: X(t.marginRight),
    marginBottom: X(t.marginBottom),
    marginLeft: X(t.marginLeft)
  };
}
function X(i) {
  const t = i ? parseFloat(i) : NaN;
  return Number.isNaN(t) ? 0 : t;
}
function Vt(i) {
  if (i.assignedSlot !== null)
    return i.assignedSlot;
  if (i.parentElement !== null)
    return i.parentElement;
  const t = i.parentNode;
  return t && t.nodeType === Node.DOCUMENT_FRAGMENT_NODE && t.host || null;
}
function je(i, t = !1) {
  const e = [];
  let s = t ? i : Vt(i);
  for (; s !== null; )
    e.push(s), s = Vt(s);
  return e;
}
function Be(i, t = !1) {
  let e = !1;
  return je(i, t).filter((s) => {
    if (e)
      return !1;
    const r = getComputedStyle(s);
    return e = r.position === "fixed", r.overflow !== "visible";
  });
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const te = (i) => i, ee = (i, t) => p`${t}: ${JSON.stringify(i, null, 2)}`;
class Fe extends Ie {
  constructor(t) {
    if (super(t), this._virtualizer = null, this._first = 0, this._last = -1, this._renderItem = (e, s) => ee(e, s + this._first), this._keyFunction = (e, s) => te(e, s + this._first), this._items = [], t.type !== Et.CHILD)
      throw new Error("The virtualize directive can only be used in child expressions");
  }
  render(t) {
    t && this._setFunctions(t);
    const e = [];
    if (this._first >= 0 && this._last >= this._first)
      for (let s = this._first; s <= this._last; s++)
        e.push(this._items[s]);
    return Ne(e, this._keyFunction, this._renderItem);
  }
  update(t, [e]) {
    this._setFunctions(e);
    const s = this._items !== e.items;
    return this._items = e.items || [], this._virtualizer ? this._updateVirtualizerConfig(t, e) : this._initialize(t, e), s ? A : this.render();
  }
  async _updateVirtualizerConfig(t, e) {
    if (!await this._virtualizer.updateLayoutConfig(e.layout || {})) {
      const r = t.parentNode;
      this._makeVirtualizer(r, e);
    }
    this._virtualizer.items = this._items;
  }
  _setFunctions(t) {
    const { renderItem: e, keyFunction: s } = t;
    e && (this._renderItem = (r, o) => e(r, o + this._first)), s && (this._keyFunction = (r, o) => s(r, o + this._first));
  }
  _makeVirtualizer(t, e) {
    this._virtualizer && this._virtualizer.disconnected();
    const { layout: s, scroller: r, items: o } = e;
    this._virtualizer = new De({ hostElement: t, layout: s, scroller: r }), this._virtualizer.items = o, this._virtualizer.connected();
  }
  _initialize(t, e) {
    const s = t.parentNode;
    s && s.nodeType === 1 && (s.addEventListener("rangeChanged", (r) => {
      this._first = r.first, this._last = r.last, this.setValue(this.render());
    }), this._makeVirtualizer(s, e));
  }
  disconnected() {
    var t;
    (t = this._virtualizer) == null || t.disconnected();
  }
  reconnected() {
    var t;
    (t = this._virtualizer) == null || t.connected();
  }
}
const We = Yt(Fe);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class H extends v {
  constructor() {
    super(...arguments), this.items = [], this.renderItem = ee, this.keyFunction = te, this.layout = {}, this.scroller = !1;
  }
  createRenderRoot() {
    return this;
  }
  render() {
    const { items: t, renderItem: e, keyFunction: s, layout: r, scroller: o } = this;
    return p`${We({
      items: t,
      renderItem: e,
      keyFunction: s,
      layout: r,
      scroller: o
    })}`;
  }
  element(t) {
    var e;
    return (e = this[vt]) == null ? void 0 : e.element(t);
  }
  get layoutComplete() {
    var t;
    return (t = this[vt]) == null ? void 0 : t.layoutComplete;
  }
  /**
   * This scrollToIndex() shim is here to provide backwards compatibility with other 0.x versions of
   * lit-virtualizer. It is deprecated and will likely be removed in the 1.0.0 release.
   */
  scrollToIndex(t, e = "start") {
    var s;
    (s = this.element(t)) == null || s.scrollIntoView({ block: e });
  }
}
Q([
  g({ attribute: !1 })
], H.prototype, "items", void 0);
Q([
  g()
], H.prototype, "renderItem", void 0);
Q([
  g()
], H.prototype, "keyFunction", void 0);
Q([
  g({ attribute: !1 })
], H.prototype, "layout", void 0);
Q([
  g({ reflect: !0, type: Boolean })
], H.prototype, "scroller", void 0);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
customElements.define("lit-virtualizer", H);
var qe = Object.defineProperty, Ke = Object.getOwnPropertyDescriptor, se = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? Ke(t, e) : t, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(t, e, r) : n(r)) || r);
  return s && r && qe(t, e, r), r;
};
const Je = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·"
};
let rt = class extends v {
  constructor() {
    super(...arguments), this.items = [], this._onClick = (i) => {
      this.dispatchEvent(
        new CustomEvent("select", { detail: { msg: i }, bubbles: !0, composed: !0 })
      );
    }, this._onKey = (i, t) => {
      (i.key === "Enter" || i.key === " ") && (i.preventDefault(), this._onClick(t));
    };
  }
  render() {
    return this.items.length ? p`
      <lit-virtualizer
        .items=${this.items}
        .renderItem=${(i) => p`
          <div
            class=${`row sev-${i.severity}`}
            tabindex="0"
            role="button"
            @click=${() => this._onClick(i)}
            @keydown=${(t) => this._onKey(t, i)}
          >
            <span class="icon">${Je[i.severity] ?? "·"}</span>
            <span class="ts">${i.timestamp.replace("T", " ").replace(/\+00:00$/, "Z")}</span>
            <span class="src">${i.source}</span>
            <span class="text">${i.text}</span>
          </div>
        `}
      ></lit-virtualizer>
    ` : p`<div class="empty">Keine Nachrichten</div>`;
  }
};
rt.styles = k`
    :host {
      display: block;
      flex: 1;
      overflow: auto;
    }
    lit-virtualizer {
      height: 100%;
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
    .row:focus,
    .row:hover {
      background: var(--secondary-background-color, #f3f3f3);
      outline: none;
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
se([
  g({ attribute: !1 })
], rt.prototype, "items", 2);
rt = se([
  L("message-table")
], rt);
var Ze = Object.defineProperty, Qe = Object.getOwnPropertyDescriptor, ie = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? Qe(t, e) : t, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(t, e, r) : n(r)) || r);
  return s && r && Ze(t, e, r), r;
};
const jt = ["error", "warning", "info", "debug"];
let ot = class extends v {
  constructor() {
    super(...arguments), this.selected = [...jt];
  }
  _toggle(i) {
    const t = this.selected.includes(i) ? this.selected.filter((e) => e !== i) : [...this.selected, i];
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { severities: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return p`
      <div class="chips">
        ${jt.map(
      (i) => p`<button
            class=${`chip sev-${i} ${this.selected.includes(i) ? "active" : ""}`}
            @click=${() => this._toggle(i)}
          >
            ${i}
          </button>`
    )}
      </div>
    `;
  }
};
ot.styles = k`
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
ie([
  g({ attribute: !1 })
], ot.prototype, "selected", 2);
ot = ie([
  L("severity-filter")
], ot);
var Ye = Object.defineProperty, Ge = Object.getOwnPropertyDescriptor, dt = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? Ge(t, e) : t, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(t, e, r) : n(r)) || r);
  return s && r && Ye(t, e, r), r;
};
let I = class extends v {
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
  _onChange(i) {
    const t = i.target.value;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { source: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return p`
      <select @change=${this._onChange} .value=${this.selected}>
        <option value="">Alle Quellen</option>
        ${this._sources.map((i) => p`<option value=${i}>${i}</option>`)}
      </select>
    `;
  }
};
I.styles = k`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `;
dt([
  g({ attribute: !1 })
], I.prototype, "api", 2);
dt([
  g({ attribute: !1 })
], I.prototype, "selected", 2);
dt([
  w()
], I.prototype, "_sources", 2);
I = dt([
  L("source-filter")
], I);
var Xe = Object.defineProperty, ts = Object.getOwnPropertyDescriptor, St = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? ts(t, e) : t, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(t, e, r) : n(r)) || r);
  return s && r && Xe(t, e, r), r;
};
let Z = class extends v {
  _set(i) {
    let t;
    const e = /* @__PURE__ */ new Date();
    i === "1h" ? t = new Date(e.getTime() - 36e5).toISOString() : i === "24h" ? t = new Date(e.getTime() - 864e5).toISOString() : i === "7d" ? t = new Date(e.getTime() - 7 * 864e5).toISOString() : t = void 0, this.dispatchEvent(
      new CustomEvent("change", {
        detail: { fromIso: t, toIso: void 0 },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    return p`
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
St([
  g({ attribute: !1 })
], Z.prototype, "fromIso", 2);
St([
  g({ attribute: !1 })
], Z.prototype, "toIso", 2);
Z = St([
  L("time-range-filter")
], Z);
var es = Object.defineProperty, ss = Object.getOwnPropertyDescriptor, re = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? ss(t, e) : t, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(t, e, r) : n(r)) || r);
  return s && r && es(t, e, r), r;
};
let nt = class extends v {
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
    return p`
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
        ${this.msg.metadata ? p`<h3>Metadata</h3>
              <pre class="meta">${JSON.stringify(this.msg.metadata, null, 2)}</pre>` : null}
        <footer>
          <button class="del" @click=${this._delete}>Loeschen</button>
        </footer>
      </aside>
    `;
  }
};
nt.styles = k`
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
re([
  g({ attribute: !1 })
], nt.prototype, "msg", 2);
nt = re([
  L("detail-pane")
], nt);
var is = Object.defineProperty, rs = Object.getOwnPropertyDescriptor, ut = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? rs(t, e) : t, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(t, e, r) : n(r)) || r);
  return s && r && is(t, e, r), r;
};
let N = class extends v {
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
  _copyUrl(i) {
    const t = `${window.location.origin}/api/webhook/${i}`;
    navigator.clipboard.writeText(t);
  }
  render() {
    return this._loading ? p`<div class="status">lade...</div>` : this._items.length ? p`
      <ul>
        ${this._items.map(
      (i) => p`<li>
            <div class="row">
              <span class="name">${i.name}</span>
              <span class="src">${i.default_source}</span>
              <span class="sev">${i.default_severity}</span>
              <span class=${i.enabled ? "ok" : "off"}>
                ${i.enabled ? "aktiv" : "deaktiviert"}
              </span>
              <button @click=${() => this._copyUrl(i.webhook_id)}>URL kopieren</button>
            </div>
          </li>`
    )}
      </ul>
    ` : p`<div class="status">Keine Webhooks angelegt.</div>`;
  }
};
N.styles = k`
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
ut([
  g({ attribute: !1 })
], N.prototype, "api", 2);
ut([
  w()
], N.prototype, "_items", 2);
ut([
  w()
], N.prototype, "_loading", 2);
N = ut([
  L("webhook-list")
], N);
var os = Object.defineProperty, ns = Object.getOwnPropertyDescriptor, $ = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? ns(t, e) : t, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(t, e, r) : n(r)) || r);
  return s && r && os(t, e, r), r;
};
const Bt = "messagehub.filters", Ft = {
  severity: ["error", "warning", "info"],
  source: "",
  search: ""
};
let y = class extends v {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "messages", this._items = [], this._total = 0, this._loading = !1, this._selected = null, this._filters = this._loadFilters(), this._api = new Ce(), this._onSeverityChange = (i) => {
      this._filters = { ...this._filters, severity: i.detail.severities }, this._persistFilters(), this._reload();
    }, this._onSourceChange = (i) => {
      this._filters = { ...this._filters, source: i.detail.source }, this._persistFilters(), this._reload();
    }, this._onTimeRange = (i) => {
      this._filters = { ...this._filters, fromIso: i.detail.fromIso, toIso: i.detail.toIso }, this._persistFilters(), this._reload();
    }, this._onSelect = (i) => {
      this._selected = i.detail.msg;
    }, this._onDelete = async (i) => {
      await this._api.deleteMessage(i.detail.id), this._items = this._items.filter((t) => t.id !== i.detail.id), this._selected = null;
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
    var i, t;
    (t = (i = this.hass) == null ? void 0 : i.connection) != null && t.subscribeEvents && (this._unsubLive = await this.hass.connection.subscribeEvents((e) => {
      const s = e.data;
      this._matchesFilters(s) && (this._items = [s, ...this._items].slice(0, 200), this._total += 1);
    }, "messagehub_message_added"));
  }
  _matchesFilters(i) {
    return !(this._filters.severity.length && !this._filters.severity.includes(i.severity) || this._filters.source && i.source !== this._filters.source || this._filters.search && !i.text.toLowerCase().includes(this._filters.search.toLowerCase()));
  }
  _loadFilters() {
    try {
      const i = localStorage.getItem(Bt);
      if (i) return { ...Ft, ...JSON.parse(i) };
    } catch {
    }
    return { ...Ft };
  }
  _persistFilters() {
    try {
      localStorage.setItem(Bt, JSON.stringify(this._filters));
    } catch {
    }
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
    } finally {
      this._loading = !1;
    }
  }
  _renderMessages() {
    return p`
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
          @input=${(i) => {
      const t = i.target.value;
      this._debounceSearch(t);
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
      ${this._selected ? p`<detail-pane
            .msg=${this._selected}
            @close=${() => this._selected = null}
            @delete=${this._onDelete}
          ></detail-pane>` : null}
    `;
  }
  _debounceSearch(i) {
    this._debounceTimer && window.clearTimeout(this._debounceTimer), this._debounceTimer = window.setTimeout(() => {
      this._filters = { ...this._filters, search: i }, this._persistFilters(), this._reload();
    }, 300);
  }
  _renderSettings() {
    return p`<webhook-list .api=${this._api}></webhook-list>`;
  }
  _renderStats() {
    return p`<div class="stats">Statistik-Dashboard (Iter 41)</div>`;
  }
  render() {
    return p`
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
y.styles = k`
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
$([
  g({ attribute: !1 })
], y.prototype, "hass", 2);
$([
  g({ type: Boolean })
], y.prototype, "narrow", 2);
$([
  g({ attribute: !1 })
], y.prototype, "panel", 2);
$([
  w()
], y.prototype, "_tab", 2);
$([
  w()
], y.prototype, "_items", 2);
$([
  w()
], y.prototype, "_total", 2);
$([
  w()
], y.prototype, "_loading", 2);
$([
  w()
], y.prototype, "_selected", 2);
$([
  w()
], y.prototype, "_filters", 2);
y = $([
  L("messagehub-panel")
], y);
export {
  y as MessageHubPanel
};
