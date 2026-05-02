# HA-Brand-Icon eintragen

Home Assistant lädt Integrations-Icons in der Settings-UI **nicht** aus
diesem Repo, sondern zentral aus
[home-assistant/brands](https://github.com/home-assistant/brands). Solange
`messagehub` da nicht eingetragen ist, zeigt HA „icon not available".

Das HACS-Icon (in der HACS-Liste) und das Panel-Header-Icon kommen aus
`custom_components/messagehub/icon.png` bzw. dem Frontend-Bundle — nur
das HA-Core-Settings-UI nutzt brands.

## Vorbereitete Assets

Im Repo unter `assets/brands/messagehub/` liegen die fertigen PNGs in
genau dem Format, das brands erwartet:

| Datei | Größe | Was |
|---|---|---|
| `icon.png` | 256 × 256 | Sidebar-/Settings-Icon |
| `icon@2x.png` | 512 × 512 | High-DPI |
| `logo.png` | 480 × 256 | Wortmarke + Icon |
| `logo@2x.png` | 960 × 512 | High-DPI Wortmarke |

## PR-Workflow

### Variante A — über die Web-UI (empfohlen, 5 Min)

1. **Fork erstellen:** https://github.com/home-assistant/brands → oben
   rechts **„Fork"** klicken
2. Im Fork den Pfad **`custom_integrations/messagehub/`** öffnen — falls
   nicht vorhanden, wird er beim ersten Datei-Upload automatisch angelegt
3. **Vier Files hochladen** über **„Add file → Upload files"**:
   - `assets/brands/messagehub/icon.png`
   - `assets/brands/messagehub/icon@2x.png`
   - `assets/brands/messagehub/logo.png`
   - `assets/brands/messagehub/logo@2x.png`
4. Commit-Message: `Add icons for messagehub` (englisch, knapp)
5. **„Create pull request"** zurück nach `home-assistant/brands:master`
6. PR-Title: **`Add icons for messagehub`**, Body kann leer bleiben
7. Auto-Linter im PR prüft Bildgrößen und Domain-Naming. Wenn rot
   wird, kommt eine konkrete Fehlermeldung (z. B. „icon must be
   exactly 256x256") — die Assets hier sind aber bereits passend.

### Variante B — lokal mit gh CLI

```bash
# einmalig
gh repo fork home-assistant/brands --clone --remote
cd brands

# Files reinkopieren (Pfad zu deinem messagehub-Repo anpassen)
mkdir -p custom_integrations/messagehub
cp ~/HomeAssistantProtokollcenter/assets/brands/messagehub/*.png \
   custom_integrations/messagehub/

# Branch + Push + PR
git checkout -b add-messagehub-icons
git add custom_integrations/messagehub/
git commit -m "Add icons for messagehub"
git push origin add-messagehub-icons
gh pr create --base master --title "Add icons for messagehub" \
             --body "Custom integration icons for the messagehub HACS integration."
```

## Review-Dauer

Übliche Lead-Time: **1–3 Tage**. Maintainer mergen routinemäßig, der
PR-Linter macht 90 % der Arbeit. Falls etwas nachzubessern ist,
kommt das als konkrete Fail-Message im PR.

## Was nach dem Merge passiert

1. **CDN-Cache:** brands.home-assistant.io aktualisiert sich innerhalb
   von ~10 Minuten (Cloudflare).
2. **HA-Browser-Cache:** der Browser des Endnutzers cached das Icon
   24 h. Ein Hard-Refresh oder ein HA-Restart holt es früher.
3. Ab dann zeigt HA in **Settings → Geräte & Dienste → Message Hub** das
   echte Icon statt „icon not available".

## Custom-Integration vs. Core-Integration

`custom_integrations/` ist der richtige Pfad — `messagehub` ist eine
HACS-Custom-Integration, **kein** Bestandteil von HA-Core. Wenn du sie
irgendwann offiziell ins HA-Core-Repo bringst (Code-Review, Pflege-
Garantie, mehrere Maintainer), wandert das Icon nach
`core_integrations/messagehub/`.
