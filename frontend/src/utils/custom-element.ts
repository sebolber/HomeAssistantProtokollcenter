// Idempotenter Wrapper um Lit's `@customElement`-Decorator.
//
// Warum: HA laedt das Panel-Bundle beim Hot-Reload manchmal mehrfach
// (Service-Worker / scoped-custom-element-registry / aelteres
// gecachtes Bundle parallel). Lit's nativer Decorator ruft direkt
// customElements.define() — beim zweiten Mal wirft das einen
// "name '...' has already been used"-Fehler, der das Panel komplett
// killt (siehe Safari-26.4-Issue 2026-05-02).
//
// Loesung: vor dem Define pruefen, ob das Tag bereits registriert ist.
// Wir uebernehmen die alte Registrierung (= no-op) — der zweite Lit-
// Build hat die selben Tag-Namen, also keine Funktionsdivergenz.

import { customElement as litCustomElement } from "lit/decorators.js";

type LitDecorator = ReturnType<typeof litCustomElement>;

export function customElement(tagName: string): LitDecorator {
  const litDec = litCustomElement(tagName);
  // Wir wickeln den Lit-Decorator. Bei bereits registrierten Tags
  // skippen wir den Define-Call — alle anderen Schritte (Lit-Internals
  // wie Class-Setup) macht Lit beim ersten Bundle-Load.
  return ((cls: unknown, context?: unknown): unknown => {
    if (customElements.get(tagName)) {
      return cls;
    }
    // Lit's Decorator unterstuetzt sowohl Legacy- als auch Standard-
    // Decorator-Signatur — wir leiten beide weiter.
    return (litDec as (...args: unknown[]) => unknown)(cls, context);
  }) as LitDecorator;
}
