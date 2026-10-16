# Recette native du soir — 16 octobre 2026

Source Claude lue sans modification : `C:/dev/worktrees/easystud-claude-regressions-20261015`, branche `work/claude/easystud-regressions-20261015`, HEAD `caa43774`. Copie **localhost:8051**, 286 fichiers produit vérifiés par SHA256, purge réussie. Aucun build ni changement de produit.

**Réserve de provenance corrigée** : la source a avancé pendant la préparation. Le manifeste de synchronisation indique `caa43774`, mais la comparaison aux objets Git identifie les 286 fichiers servis comme `44b33f2f` (fins de ligne normalisées pour les textes), descendant de `caa43774`, passe de formatage PHP K16-17. Aucun écart depuis la synchronisation. Les résultats ci-dessous concernent donc ce runtime réellement mesuré ; le libellé `source:caa43774` des JSON préliminaires est seulement la base demandée, pas une preuve de version. Le rapport de comparaison est `pin-source-differences.json`.

**7 lots PASS, 3 lots FAIL.** Contrôles effectifs : **159 PASS, 23 FAIL, 8 N/A**. Erreurs console : **0** ; erreurs de page : **0** ; écritures hors actions autorisées : **0**.

## Matrice par lot

| Lot | FR1600 | FR1280 | FR768 | FR390 | EN1600 | EN1280 | EN768 | EN390 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| K16-69 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| K16-13 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| K16-73 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| K16-70 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| K16-71 | N/A | N/A | PASS | PASS | N/A | N/A | PASS | PASS |
| K16-72 | N/A | N/A | PASS | PASS | N/A | N/A | PASS | PASS |
| K16-74 | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL |
| K16-65 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| K16-55 | PASS | FAIL | FAIL | FAIL | PASS | FAIL | FAIL | FAIL |
| K16-14 | PASS | PASS | FAIL | FAIL | PASS | PASS | PASS | PASS |

N/A pour les croix téléphone/tiroir en desktop : ces fenêtres ne sont pas proposées à 1600/1280. Elles sont testées à 768/390. Le navigateur utilise une souris aux quatre largeurs ; ce n’est pas une preuve sur un téléphone physique.

## Conditions et déroulé

- Nettoyage SQL vérifié après tous les passages : **8 fixtures**, zéro cours, groupe, groupement, utilisateur synthétique actif ou brouillon CSV restant ; option de vue complète restaurée.
- FR/EN × 1600/1280/768/390, hauteur1000 ; cours jetables dédiés avec **164 groupes,18 participants,12 groupements** chacun. Comptes `nologin` synthétiques ; aucune donnée de cours préexistante utilisée.
- Sélection des trois types, tris complets avec pagination et retour A → Z ; cartes vides ; dépliage/repliage ; surfaces sélectionnées ; icônes ; fermetures ; déplacement/copie ; Guide12 pages ; dépôt CSV et aperçu2 lignes sans confirmation de l’import.
- Vue complète initialement désactivée dans la configuration8051. Le contrôle ciblé active temporairement `showcompleteview` et restaure exactement la présence/valeur précédente au nettoyage. Il ouvre le groupement vide avant de mesurer son contenu.
- Survol : comparer l’état hors survol à l’état survolé, après Motion et après avoir quitté le focus de la carte. Cibler les boutons icônes `btn-link p-0`, pas le bouton-étiquette du groupement situé dans le même en-tête. Les mesures gardent également le hit-test au centre.
- Glisser : carte participant du catalogue vers un groupe vide en desktop, événement natif observé et preuve SQL. À768/390, le produit désactive volontairement le glisser : recette de l’équivalent natif « Ajouter à un groupe » par le menu de carte, sans présenter cette alternative comme un glisser tactile.
- K16-14 : décochée = retrait des deux origines sélectionnées ; cochée = conservation des origines, destination déjà membre sans doublon. Le contrôle ciblé complète par une copie fraîche (`added=1`) et une réouverture immédiate décochée, puis Annuler sans mutation. Appartenances SQL avant/après dans le JSON.

## Anomalies confirmées / contrôles non concluants

### 1. K16-74 — FR1600 — flat card and zero lift on hover

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
groupings hover transform delta

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 0.5
Received:    1
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "kind": "groups",
    "before": {
      "x": 103,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 725.34375,
      "height": 106.28125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "LI",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    },
    "hover": {
      "x": 103,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 725.34375,
      "height": 106.28125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "LI",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    }
  },
  {
    "kind": "participants",
    "before": {
      "x": 103,
      "y": 507.984375,
      "documentY": 507.984375,
      "width": 587.640625,
      "height": 43.78125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    },
    "hover": {
      "x": 103,
      "y": 507.984375,
      "documentY": 507.984375,
      "width": 587.640625,
      "height": 43.78125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    }
  },
  {
    "kind": "groupings",
    "before": {
      "x": 884.34375,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 587.65625,
      "height": 123.015625,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    },
    "hover": {
      "x": 884.34375,
      "y": 503.140625,
      "documentY": 503.140625,
      "width": 587.65625,
      "height": 123.015625,
      "translateY": -1,
      "translateX": 0,
      "background": "rgba(0, 0, 0, 0)",
      "image": "linear-gradient(rgb(255, 255, 255) 0%, rgb(242, 246, 249) 100%)",
      "shadow": "rgba(75, 96, 116, 0.12) 0px 7.68px 16px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    }
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup\easystud\authenticated\easystud-authenticated-20261016T210921754Z-40876\playwright-output\recette-soir-followup-nati-edfe9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 2. MASS-IMPORT — FR1600 — opening and native editable preview

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
expect(locator).toContainText(expected) failed

Locator: locator('#local-groupimport-import').locator('.filepicker-filename a')
Expected substring: "recette-soir-188-fr-1600.csv"
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 60000ms
  - waiting for locator('#local-groupimport-import').locator('.filepicker-filename a')

```

Qualification : Assertion non satisfaite ; distinguer défaut produit, délai de la recette et prérequis à partir des mesures conservées.

Capture de ce contrôle : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\native\easystud\authenticated\easystud-authenticated-20261016T204905264Z-34872\playwright-output\recette-soir-native-Evenin-bbae5--caa43774-FR-EN-four-widths\failure-6-MASS-IMPORT-fr-1600.png`.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\native\easystud\authenticated\easystud-authenticated-20261016T204905264Z-34872\playwright-output\recette-soir-native-Evenin-bbae5--caa43774-FR-EN-four-widths\recette-soir.json`. Aucun correctif produit appliqué.

### 3. K16-74 — FR1280 — flat card and zero lift on hover

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
groupings hover transform delta

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 0.5
Received:    1
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "kind": "groups",
    "before": {
      "x": 103,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 496.5,
      "height": 106.28125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "LI",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host is-groupings-summary-hidden"
    },
    "hover": {
      "x": 103,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 496.5,
      "height": 106.28125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "LI",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host is-groupings-summary-hidden"
    }
  },
  {
    "kind": "participants",
    "before": {
      "x": 103,
      "y": 507.984375,
      "documentY": 507.984375,
      "width": 496.5,
      "height": 43.78125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    },
    "hover": {
      "x": 103,
      "y": 507.984375,
      "documentY": 507.984375,
      "width": 496.5,
      "height": 43.78125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    }
  },
  {
    "kind": "groupings",
    "before": {
      "x": 655.5,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 496.5,
      "height": 123.015625,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    },
    "hover": {
      "x": 655.5,
      "y": 503.140625,
      "documentY": 503.140625,
      "width": 496.5,
      "height": 123.015625,
      "translateY": -1,
      "translateX": 0,
      "background": "rgba(0, 0, 0, 0)",
      "image": "linear-gradient(rgb(255, 255, 255) 0%, rgb(242, 246, 249) 100%)",
      "shadow": "rgba(75, 96, 116, 0.12) 0px 7.68px 16px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    }
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup\easystud\authenticated\easystud-authenticated-20261016T210921754Z-40876\playwright-output\recette-soir-followup-nati-edfe9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 4. K16-55 — FR1280 — header icon hover disc

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
Plus d’actions

expect(received).toContain(expected) // indexOf

Expected substring: "radial-gradient"
Received string:    "none"
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "x": 422.25,
    "y": 759.625,
    "documentY": 759.625,
    "width": 32,
    "height": 32,
    "translateY": 0,
    "translateX": 0,
    "background": "rgba(0, 0, 0, 0)",
    "image": "radial-gradient(circle, color(srgb 0.905882 0.942353 0.974902) 0px, color(srgb 0.905882 0.942353 0.974902) 12px, rgba(0, 0, 0, 0) 12.6px)",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 999,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "Rechercher des participants",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__member-search-button"
  },
  {
    "x": 463.515625,
    "y": 759.625,
    "documentY": 759.625,
    "width": 32,
    "height": 32,
    "translateY": 0,
    "translateX": 0,
    "background": "rgba(0, 0, 0, 0)",
    "image": "radial-gradient(circle, color(srgb 0.905882 0.942353 0.974902) 0px, color(srgb 0.905882 0.942353 0.974902) 12px, rgba(0, 0, 0, 0) 12.6px)",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 999,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "Ajouter des étudiants par identifiant",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__mail-button"
  },
  {
    "x": 504.78125,
    "y": 759.625,
    "documentY": 759.625,
    "width": 32,
    "height": 32,
    "translateY": 0,
    "translateX": 0,
    "background": "rgba(0, 0, 0, 0)",
    "image": "radial-gradient(circle, color(srgb 0.905882 0.942353 0.974902) 0px, color(srgb 0.905882 0.942353 0.974902) 12px, rgba(0, 0, 0, 0) 12.6px)",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 999,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "Dupliquer",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__duplicate-button"
  },
  {
    "x": 555.3125,
    "y": 759.625,
    "documentY": 759.625,
    "width": 32,
    "height": 32,
    "translateY": 0,
    "translateX": 0,
    "background": "rgb(247, 251, 255)",
    "image": "none",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 6.4,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "Plus d’actions",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__actions-toggle local-groupimport-easystud-card-menu"
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup\easystud\authenticated\easystud-authenticated-20261016T210921754Z-40876\playwright-output\recette-soir-followup-nati-edfe9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 5. K16-14 — FR768 — move removes selected original memberships

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
expect(locator).toBeVisible() failed

Locator: locator('[role="status"]:visible,[role="alert"]:visible,.toast:visible').filter({ hasText: 'Appartenances d’origine déplacées' }).last()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[role="status"]:visible,[role="alert"]:visible,.toast:visible').filter({ hasText: 'Appartenances d’origine déplacées' }).last()

```

Qualification : Assertion non satisfaite ; distinguer défaut produit, délai de la recette et prérequis à partir des mesures conservées.

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\remainder3\easystud\authenticated\easystud-authenticated-20261016T212827455Z-20804\playwright-output\recette-soir-remainder2-na-24d00-3774-FR-EN-remaining-widths\recette-soir-remainder.json`. Aucun correctif produit appliqué.

### 6. SEARCH — FR768 — group catalogue search visibility

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

Qualification : Hors lot : seuls les champs inline et Plus de filtres sont observés ; accès par le menu Rechercher non testé. Aucune preuve d’inaccessibilité globale.

Mesures :

```json
{
  "before": [
    {
      "field": "participants",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud-participant-groups"
    },
    {
      "field": "structure",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud__search-field local-groupimport-easystud__search-field--structure easyedu-search-field"
    }
  ],
  "withFiltersOpen": [
    {
      "field": "participants",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud-participant-groups"
    },
    {
      "field": "structure",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud__search-field local-groupimport-easystud__search-field--structure easyedu-search-field"
    }
  ]
}
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 7. K16-74 — FR768 — flat card and zero lift on hover

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
groupings hover transform delta

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 0.5
Received:    1
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "kind": "groups",
    "before": {
      "x": 87,
      "y": 881.203125,
      "documentY": 881.203125,
      "width": 569,
      "height": 118.796875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    },
    "hover": {
      "x": 87,
      "y": 881.203125,
      "documentY": 881.203125,
      "width": 569,
      "height": 118.796875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    }
  },
  {
    "kind": "participants",
    "before": {
      "x": 87,
      "y": 893.359375,
      "documentY": 893.359375,
      "width": 569,
      "height": 95.6875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    },
    "hover": {
      "x": 87,
      "y": 893.359375,
      "documentY": 893.359375,
      "width": 569,
      "height": 95.6875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    }
  },
  {
    "kind": "groupings",
    "before": {
      "x": 87,
      "y": 856.203125,
      "documentY": 856.203125,
      "width": 569,
      "height": 143.96875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    },
    "hover": {
      "x": 87,
      "y": 855.203125,
      "documentY": 855.203125,
      "width": 569,
      "height": 143.96875,
      "translateY": -1,
      "translateX": 0,
      "background": "rgba(0, 0, 0, 0)",
      "image": "linear-gradient(rgb(255, 255, 255) 0%, rgb(242, 246, 249) 100%)",
      "shadow": "rgba(75, 96, 116, 0.12) 0px 7.68px 16px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    }
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 8. K16-55 — FR768 — header icon hover disc

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
Plus d’actions

expect(received).toContain(expected) // indexOf

Expected substring: "radial-gradient"
Received string:    "none"
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "x": 592.9375,
    "y": 507.640625,
    "documentY": 507.640625,
    "width": 44,
    "height": 44,
    "translateY": -22,
    "translateX": 0,
    "background": "rgb(248, 250, 252)",
    "image": "none",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 6.4,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "Plus d’actions",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__actions-toggle local-groupimport-easystud-card-menu"
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 9. SEARCH — FR390 — group catalogue search visibility

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

Qualification : Hors lot : seuls les champs inline et Plus de filtres sont observés ; accès par le menu Rechercher non testé. Aucune preuve d’inaccessibilité globale.

Mesures :

```json
{
  "before": [
    {
      "field": "participants",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud-participant-groups"
    },
    {
      "field": "structure",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud__search-field local-groupimport-easystud__search-field--structure easyedu-search-field"
    }
  ],
  "withFiltersOpen": [
    {
      "field": "participants",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud-participant-groups"
    },
    {
      "field": "structure",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud__search-field local-groupimport-easystud__search-field--structure easyedu-search-field"
    }
  ]
}
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 10. K16-74 — FR390 — flat card and zero lift on hover

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
groupings hover transform delta

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 0.5
Received:    1
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "kind": "groups",
    "before": {
      "x": 48,
      "y": 547.375,
      "documentY": 547.375,
      "width": 293,
      "height": 118.796875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    },
    "hover": {
      "x": 48,
      "y": 547.375,
      "documentY": 547.375,
      "width": 293,
      "height": 118.796875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    }
  },
  {
    "kind": "participants",
    "before": {
      "x": 48,
      "y": 559.53125,
      "documentY": 559.53125,
      "width": 293,
      "height": 95.6875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    },
    "hover": {
      "x": 48,
      "y": 559.53125,
      "documentY": 559.53125,
      "width": 293,
      "height": 95.6875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    }
  },
  {
    "kind": "groupings",
    "before": {
      "x": 48,
      "y": 547.375,
      "documentY": 547.375,
      "width": 293,
      "height": 182.96875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    },
    "hover": {
      "x": 48,
      "y": 546.375,
      "documentY": 546.375,
      "width": 293,
      "height": 182.96875,
      "translateY": -1,
      "translateX": 0,
      "background": "rgba(0, 0, 0, 0)",
      "image": "linear-gradient(rgb(255, 255, 255) 0%, rgb(242, 246, 249) 100%)",
      "shadow": "rgba(75, 96, 116, 0.12) 0px 7.68px 16px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    }
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 11. K16-55 — FR390 — header icon hover disc

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
Plus d’actions

expect(received).toContain(expected) // indexOf

Expected substring: "radial-gradient"
Received string:    "none"
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "x": 277.9375,
    "y": 852.3125,
    "documentY": 852.3125,
    "width": 44,
    "height": 44,
    "translateY": -22,
    "translateX": 0,
    "background": "rgb(248, 250, 252)",
    "image": "none",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 6.4,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "Plus d’actions",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__actions-toggle local-groupimport-easystud-card-menu"
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 12. DRAG — FR390 — supported participant transfer to empty group

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
expect(locator).toBeHidden() failed

Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-move-modal]')
Expected: hidden
Received: visible
Timeout:  5000ms

Call log:
  - Expect "toBeHidden" with timeout 5000ms
  - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-move-modal]')
    13 × locator resolved to <div role="dialog" aria-modal="true" data-easystud-move-modal="1" id="yui_3_18_1_1_1792186227501_49" data-easystud-move-context="participant" aria-labelledby="local-groupimport-easystud-move-title" class="local-groupimport-easystud-modal easyedu-modal-layer">…</div>
       - unexpected value "visible"

```

Qualification : Assertion non satisfaite ; distinguer défaut produit, délai de la recette et prérequis à partir des mesures conservées.

Mesures :

```json
{
  "before": {
    "courseId": 192,
    "userId": 36279,
    "groupIds": [
      6491,
      6492,
      6493,
      6494,
      6495,
      6496,
      6497,
      6498,
      6499,
      6500,
      6501,
      6502,
      6503,
      6504,
      6505,
      6506,
      6507,
      6508,
      6509,
      6510,
      6511,
      6512,
      6513,
      6514,
      6515,
      6516,
      6517,
      6518,
      6519,
      6520,
      6521,
      6522,
      6523,
      6524,
      6525,
      6526,
      6527,
      6528,
      6529,
      6530,
      6531,
      6532,
      6533,
      6534,
      6535,
      6536,
      6537,
      6538,
      6539,
      6540,
      6541,
      6542,
      6543,
      6544,
      6545,
      6546,
      6547,
      6548,
      6549,
      6550,
      6551,
      6552,
      6553,
      6554,
      6555,
      6556,
      6557,
      6558,
      6559,
      6560,
      6561,
      6562,
      6563,
      6564,
      6565,
      6566,
      6567,
      6568,
      6569,
      6570,
      6571,
      6572,
      6573,
      6574,
      6575,
      6576,
      6577,
      6578,
      6579,
      6580,
      6581,
      6582,
      6583,
      6584,
      6585,
      6586,
      6587,
      6588,
      6589,
      6590,
      6591,
      6592,
      6593,
      6594,
      6595,
      6596,
      6597,
      6598,
      6599,
      6600,
      6601,
      6602,
      6603,
      6604,
      6605,
      6606,
      6607,
      6608,
      6609,
      6610,
      6611,
      6612,
      6613,
      6614,
      6615,
      6616,
      6617,
      6618,
      6619,
      6620,
      6621,
      6622,
      6623,
      6624,
      6625,
      6626,
      6627,
      6628,
      6629,
      6630,
      6631,
      6632,
      6633,
      6634,
      6635,
      6636,
      6637,
      6638,
      6639,
      6640,
      6641,
      6642,
      6643,
      6644,
      6645,
      6646,
      6647,
      6648,
      6649,
      6650,
      6651,
      6652,
      6653,
      6654
    ],
    "rows": [
      {
        "id": "104834",
        "groupid": "6491",
        "userid": "36279"
      }
    ]
  },
  "compactAlternative": "Add to group (native drag intentionally suppressed)"
}
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 13. K16-14 — FR390 — fresh copy and unchecked on immediate reopening

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 1

  Array [
    6491,
    6492,
+   6493,
  ]
```

Qualification : Séquence contaminée par le transfert compact précédent resté en attente : Gamma apparaît entre les snapshots, tandis que la copie vers Beta répond added=1. Ce contrôle ne prouve pas un défaut de copie ; réouverture/Annuler non atteints.

Mesures :

```json
{
  "before": {
    "courseId": 192,
    "userId": 36279,
    "groupIds": [
      6491,
      6492,
      6493,
      6494,
      6495,
      6496,
      6497,
      6498,
      6499,
      6500,
      6501,
      6502,
      6503,
      6504,
      6505,
      6506,
      6507,
      6508,
      6509,
      6510,
      6511,
      6512,
      6513,
      6514,
      6515,
      6516,
      6517,
      6518,
      6519,
      6520,
      6521,
      6522,
      6523,
      6524,
      6525,
      6526,
      6527,
      6528,
      6529,
      6530,
      6531,
      6532,
      6533,
      6534,
      6535,
      6536,
      6537,
      6538,
      6539,
      6540,
      6541,
      6542,
      6543,
      6544,
      6545,
      6546,
      6547,
      6548,
      6549,
      6550,
      6551,
      6552,
      6553,
      6554,
      6555,
      6556,
      6557,
      6558,
      6559,
      6560,
      6561,
      6562,
      6563,
      6564,
      6565,
      6566,
      6567,
      6568,
      6569,
      6570,
      6571,
      6572,
      6573,
      6574,
      6575,
      6576,
      6577,
      6578,
      6579,
      6580,
      6581,
      6582,
      6583,
      6584,
      6585,
      6586,
      6587,
      6588,
      6589,
      6590,
      6591,
      6592,
      6593,
      6594,
      6595,
      6596,
      6597,
      6598,
      6599,
      6600,
      6601,
      6602,
      6603,
      6604,
      6605,
      6606,
      6607,
      6608,
      6609,
      6610,
      6611,
      6612,
      6613,
      6614,
      6615,
      6616,
      6617,
      6618,
      6619,
      6620,
      6621,
      6622,
      6623,
      6624,
      6625,
      6626,
      6627,
      6628,
      6629,
      6630,
      6631,
      6632,
      6633,
      6634,
      6635,
      6636,
      6637,
      6638,
      6639,
      6640,
      6641,
      6642,
      6643,
      6644,
      6645,
      6646,
      6647,
      6648,
      6649,
      6650,
      6651,
      6652,
      6653,
      6654
    ],
    "rows": [
      {
        "id": "104834",
        "groupid": "6491",
        "userid": "36279"
      }
    ]
  },
  "response": {
    "success": true,
    "added": 1,
    "existing": 0,
    "message": "Participants ajoutés : 1 ; déjà présents dans ce groupe : 0."
  },
  "after": {
    "courseId": 192,
    "userId": 36279,
    "groupIds": [
      6491,
      6492,
      6493,
      6494,
      6495,
      6496,
      6497,
      6498,
      6499,
      6500,
      6501,
      6502,
      6503,
      6504,
      6505,
      6506,
      6507,
      6508,
      6509,
      6510,
      6511,
      6512,
      6513,
      6514,
      6515,
      6516,
      6517,
      6518,
      6519,
      6520,
      6521,
      6522,
      6523,
      6524,
      6525,
      6526,
      6527,
      6528,
      6529,
      6530,
      6531,
      6532,
      6533,
      6534,
      6535,
      6536,
      6537,
      6538,
      6539,
      6540,
      6541,
      6542,
      6543,
      6544,
      6545,
      6546,
      6547,
      6548,
      6549,
      6550,
      6551,
      6552,
      6553,
      6554,
      6555,
      6556,
      6557,
      6558,
      6559,
      6560,
      6561,
      6562,
      6563,
      6564,
      6565,
      6566,
      6567,
      6568,
      6569,
      6570,
      6571,
      6572,
      6573,
      6574,
      6575,
      6576,
      6577,
      6578,
      6579,
      6580,
      6581,
      6582,
      6583,
      6584,
      6585,
      6586,
      6587,
      6588,
      6589,
      6590,
      6591,
      6592,
      6593,
      6594,
      6595,
      6596,
      6597,
      6598,
      6599,
      6600,
      6601,
      6602,
      6603,
      6604,
      6605,
      6606,
      6607,
      6608,
      6609,
      6610,
      6611,
      6612,
      6613,
      6614,
      6615,
      6616,
      6617,
      6618,
      6619,
      6620,
      6621,
      6622,
      6623,
      6624,
      6625,
      6626,
      6627,
      6628,
      6629,
      6630,
      6631,
      6632,
      6633,
      6634,
      6635,
      6636,
      6637,
      6638,
      6639,
      6640,
      6641,
      6642,
      6643,
      6644,
      6645,
      6646,
      6647,
      6648,
      6649,
      6650,
      6651,
      6652,
      6653,
      6654
    ],
    "rows": [
      {
        "id": "104834",
        "groupid": "6491",
        "userid": "36279"
      },
      {
        "id": "104854",
        "groupid": "6492",
        "userid": "36279"
      },
      {
        "id": "104853",
        "groupid": "6493",
        "userid": "36279"
      }
    ]
  }
}
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 14. K16-74 — EN1600 — flat card and zero lift on hover

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
groupings hover transform delta

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 0.5
Received:    1
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "kind": "groups",
    "before": {
      "x": 103,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 725.34375,
      "height": 106.28125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "LI",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    },
    "hover": {
      "x": 103,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 725.34375,
      "height": 106.28125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "LI",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    }
  },
  {
    "kind": "participants",
    "before": {
      "x": 103,
      "y": 507.984375,
      "documentY": 507.984375,
      "width": 587.640625,
      "height": 43.78125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    },
    "hover": {
      "x": 103,
      "y": 507.984375,
      "documentY": 507.984375,
      "width": 587.640625,
      "height": 43.78125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    }
  },
  {
    "kind": "groupings",
    "before": {
      "x": 884.34375,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 587.65625,
      "height": 123.015625,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    },
    "hover": {
      "x": 884.34375,
      "y": 503.140625,
      "documentY": 503.140625,
      "width": 587.65625,
      "height": 123.015625,
      "translateY": -1,
      "translateX": 0,
      "background": "rgba(0, 0, 0, 0)",
      "image": "linear-gradient(rgb(255, 255, 255) 0%, rgb(242, 246, 249) 100%)",
      "shadow": "rgba(75, 96, 116, 0.12) 0px 7.68px 16px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    }
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 15. K16-74 — EN1280 — flat card and zero lift on hover

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
groupings hover transform delta

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 0.5
Received:    1
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "kind": "groups",
    "before": {
      "x": 103,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 496.5,
      "height": 106.28125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "LI",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host is-groupings-summary-hidden"
    },
    "hover": {
      "x": 103,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 496.5,
      "height": 106.28125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "LI",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host is-groupings-summary-hidden"
    }
  },
  {
    "kind": "participants",
    "before": {
      "x": 103,
      "y": 507.984375,
      "documentY": 507.984375,
      "width": 496.5,
      "height": 43.78125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    },
    "hover": {
      "x": 103,
      "y": 507.984375,
      "documentY": 507.984375,
      "width": 496.5,
      "height": 43.78125,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    }
  },
  {
    "kind": "groupings",
    "before": {
      "x": 655.5,
      "y": 504.140625,
      "documentY": 504.140625,
      "width": 496.5,
      "height": 123.015625,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 1px 2px 0px",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    },
    "hover": {
      "x": 655.5,
      "y": 503.140625,
      "documentY": 503.140625,
      "width": 496.5,
      "height": 123.015625,
      "translateY": -1,
      "translateX": 0,
      "background": "rgba(0, 0, 0, 0)",
      "image": "linear-gradient(rgb(255, 255, 255) 0%, rgb(242, 246, 249) 100%)",
      "shadow": "rgba(75, 96, 116, 0.12) 0px 7.68px 16px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    }
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 16. K16-55 — EN1280 — header icon hover disc

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
More actions

expect(received).toContain(expected) // indexOf

Expected substring: "radial-gradient"
Received string:    "none"
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "x": 422.25,
    "y": 759.625,
    "documentY": 759.625,
    "width": 32,
    "height": 32,
    "translateY": 0,
    "translateX": 0,
    "background": "rgba(0, 0, 0, 0)",
    "image": "radial-gradient(circle, color(srgb 0.905882 0.942353 0.974902) 0px, color(srgb 0.905882 0.942353 0.974902) 12px, rgba(0, 0, 0, 0) 12.6px)",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 999,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "Search participants",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__member-search-button"
  },
  {
    "x": 463.515625,
    "y": 759.625,
    "documentY": 759.625,
    "width": 32,
    "height": 32,
    "translateY": 0,
    "translateX": 0,
    "background": "rgba(0, 0, 0, 0)",
    "image": "radial-gradient(circle, color(srgb 0.905882 0.942353 0.974902) 0px, color(srgb 0.905882 0.942353 0.974902) 12px, rgba(0, 0, 0, 0) 12.6px)",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 999,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "Add students by identifier",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__mail-button"
  },
  {
    "x": 504.78125,
    "y": 759.625,
    "documentY": 759.625,
    "width": 32,
    "height": 32,
    "translateY": 0,
    "translateX": 0,
    "background": "rgba(0, 0, 0, 0)",
    "image": "radial-gradient(circle, color(srgb 0.905882 0.942353 0.974902) 0px, color(srgb 0.905882 0.942353 0.974902) 12px, rgba(0, 0, 0, 0) 12.6px)",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 999,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "Duplicate",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__duplicate-button"
  },
  {
    "x": 555.3125,
    "y": 759.625,
    "documentY": 759.625,
    "width": 32,
    "height": 32,
    "translateY": 0,
    "translateX": 0,
    "background": "rgb(247, 251, 255)",
    "image": "none",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 6.4,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "More actions",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__actions-toggle local-groupimport-easystud-card-menu"
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 17. SEARCH — EN768 — group catalogue search visibility

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

Qualification : Hors lot : seuls les champs inline et Plus de filtres sont observés ; accès par le menu Rechercher non testé. Aucune preuve d’inaccessibilité globale.

Mesures :

```json
{
  "before": [
    {
      "field": "participants",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud-participant-groups"
    },
    {
      "field": "structure",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud__search-field local-groupimport-easystud__search-field--structure easyedu-search-field"
    }
  ],
  "withFiltersOpen": [
    {
      "field": "participants",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud-participant-groups"
    },
    {
      "field": "structure",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud__search-field local-groupimport-easystud__search-field--structure easyedu-search-field"
    }
  ]
}
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 18. K16-74 — EN768 — flat card and zero lift on hover

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
groupings hover transform delta

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 0.5
Received:    1
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "kind": "groups",
    "before": {
      "x": 87,
      "y": 880.921875,
      "documentY": 880.921875,
      "width": 569,
      "height": 118.796875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    },
    "hover": {
      "x": 87,
      "y": 880.921875,
      "documentY": 880.921875,
      "width": 569,
      "height": 118.796875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    }
  },
  {
    "kind": "participants",
    "before": {
      "x": 87,
      "y": 893.078125,
      "documentY": 893.078125,
      "width": 569,
      "height": 95.6875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    },
    "hover": {
      "x": 87,
      "y": 893.078125,
      "documentY": 893.078125,
      "width": 569,
      "height": 95.6875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    }
  },
  {
    "kind": "groupings",
    "before": {
      "x": 87,
      "y": 855.921875,
      "documentY": 855.921875,
      "width": 569,
      "height": 143.96875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    },
    "hover": {
      "x": 87,
      "y": 854.921875,
      "documentY": 854.921875,
      "width": 569,
      "height": 143.96875,
      "translateY": -1,
      "translateX": 0,
      "background": "rgba(0, 0, 0, 0)",
      "image": "linear-gradient(rgb(255, 255, 255) 0%, rgb(242, 246, 249) 100%)",
      "shadow": "rgba(75, 96, 116, 0.12) 0px 7.68px 16px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    }
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 19. K16-55 — EN768 — header icon hover disc

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
More actions

expect(received).toContain(expected) // indexOf

Expected substring: "radial-gradient"
Received string:    "none"
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "x": 592.9375,
    "y": 508.359375,
    "documentY": 508.359375,
    "width": 44,
    "height": 44,
    "translateY": -22,
    "translateX": 0,
    "background": "rgb(248, 250, 252)",
    "image": "none",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 6.4,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "More actions",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__actions-toggle local-groupimport-easystud-card-menu"
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 20. DRAG — EN768 — supported participant transfer to empty group

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
expect(locator).toBeHidden() failed

Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-move-modal]')
Expected: hidden
Received: visible
Timeout:  5000ms

Call log:
  - Expect "toBeHidden" with timeout 5000ms
  - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-move-modal]')
    13 × locator resolved to <div role="dialog" aria-modal="true" data-easystud-move-modal="1" id="yui_3_18_1_1_1792186482316_49" data-easystud-move-context="participant" aria-labelledby="local-groupimport-easystud-move-title" class="local-groupimport-easystud-modal easyedu-modal-layer">…</div>
       - unexpected value "visible"

```

Qualification : Assertion non satisfaite ; distinguer défaut produit, délai de la recette et prérequis à partir des mesures conservées.

Mesures :

```json
{
  "before": {
    "courseId": 192,
    "userId": 36279,
    "groupIds": [
      6491,
      6492,
      6493,
      6494,
      6495,
      6496,
      6497,
      6498,
      6499,
      6500,
      6501,
      6502,
      6503,
      6504,
      6505,
      6506,
      6507,
      6508,
      6509,
      6510,
      6511,
      6512,
      6513,
      6514,
      6515,
      6516,
      6517,
      6518,
      6519,
      6520,
      6521,
      6522,
      6523,
      6524,
      6525,
      6526,
      6527,
      6528,
      6529,
      6530,
      6531,
      6532,
      6533,
      6534,
      6535,
      6536,
      6537,
      6538,
      6539,
      6540,
      6541,
      6542,
      6543,
      6544,
      6545,
      6546,
      6547,
      6548,
      6549,
      6550,
      6551,
      6552,
      6553,
      6554,
      6555,
      6556,
      6557,
      6558,
      6559,
      6560,
      6561,
      6562,
      6563,
      6564,
      6565,
      6566,
      6567,
      6568,
      6569,
      6570,
      6571,
      6572,
      6573,
      6574,
      6575,
      6576,
      6577,
      6578,
      6579,
      6580,
      6581,
      6582,
      6583,
      6584,
      6585,
      6586,
      6587,
      6588,
      6589,
      6590,
      6591,
      6592,
      6593,
      6594,
      6595,
      6596,
      6597,
      6598,
      6599,
      6600,
      6601,
      6602,
      6603,
      6604,
      6605,
      6606,
      6607,
      6608,
      6609,
      6610,
      6611,
      6612,
      6613,
      6614,
      6615,
      6616,
      6617,
      6618,
      6619,
      6620,
      6621,
      6622,
      6623,
      6624,
      6625,
      6626,
      6627,
      6628,
      6629,
      6630,
      6631,
      6632,
      6633,
      6634,
      6635,
      6636,
      6637,
      6638,
      6639,
      6640,
      6641,
      6642,
      6643,
      6644,
      6645,
      6646,
      6647,
      6648,
      6649,
      6650,
      6651,
      6652,
      6653,
      6654
    ],
    "rows": [
      {
        "id": "104897",
        "groupid": "6491",
        "userid": "36279"
      }
    ]
  },
  "compactAlternative": "Add to group (native drag intentionally suppressed)"
}
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 21. SEARCH — EN390 — group catalogue search visibility

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

Qualification : Hors lot : seuls les champs inline et Plus de filtres sont observés ; accès par le menu Rechercher non testé. Aucune preuve d’inaccessibilité globale.

Mesures :

```json
{
  "before": [
    {
      "field": "participants",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud-participant-groups"
    },
    {
      "field": "structure",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud__search-field local-groupimport-easystud__search-field--structure easyedu-search-field"
    }
  ],
  "withFiltersOpen": [
    {
      "field": "participants",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud-participant-groups"
    },
    {
      "field": "structure",
      "width": 0,
      "height": 0,
      "visible": false,
      "hiddenAncestor": "local-groupimport-easystud__search-field local-groupimport-easystud__search-field--structure easyedu-search-field"
    }
  ]
}
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 22. K16-74 — EN390 — flat card and zero lift on hover

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
groupings hover transform delta

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 0.5
Received:    1
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "kind": "groups",
    "before": {
      "x": 48,
      "y": 881.09375,
      "documentY": 881.09375,
      "width": 293,
      "height": 118.796875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    },
    "hover": {
      "x": 48,
      "y": 881.09375,
      "documentY": 881.09375,
      "width": 293,
      "height": 118.796875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(247, 249, 252)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-group local-groupimport-easystud-group--catalog easyedu-card-accent-host"
    }
  },
  {
    "kind": "participants",
    "before": {
      "x": 48,
      "y": 893.25,
      "documentY": 893.25,
      "width": 293,
      "height": 95.6875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    },
    "hover": {
      "x": 48,
      "y": 893.25,
      "documentY": 893.25,
      "width": 293,
      "height": 95.6875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "rgba(31, 42, 55, 0.05) 0px 4px 12.8px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "SPAN",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-user easyedu-card-accent-host"
    }
  },
  {
    "kind": "groupings",
    "before": {
      "x": 48,
      "y": 836.09375,
      "documentY": 836.09375,
      "width": 293,
      "height": 163.46875,
      "translateY": 0,
      "translateX": 0,
      "background": "rgb(255, 255, 255)",
      "image": "none",
      "shadow": "none",
      "hover": false,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    },
    "hover": {
      "x": 48,
      "y": 835.09375,
      "documentY": 835.09375,
      "width": 293,
      "height": 163.46875,
      "translateY": -1,
      "translateX": 0,
      "background": "rgba(0, 0, 0, 0)",
      "image": "linear-gradient(rgb(255, 255, 255) 0%, rgb(242, 246, 249) 100%)",
      "shadow": "rgba(75, 96, 116, 0.12) 0px 7.68px 16px 0px",
      "hover": true,
      "focusWithin": false,
      "radius": 12.8,
      "overflow": 0,
      "hit": "DIV",
      "centerInside": true,
      "label": null,
      "class": "local-groupimport-easystud-tree__section easyedu-card-accent-host is-expanded"
    }
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

### 23. K16-55 — EN390 — header icon hover disc

Étapes : charger le cours jetable dans cette langue/largeur, puis exécuter le point nommé dans la spec associée au fichier de preuve. Le JSON conserve les états intermédiaires et les rectangles lorsqu’ils ont été obtenus.

Constat natif :

```text
More actions

expect(received).toContain(expected) // indexOf

Expected substring: "radial-gradient"
Received string:    "none"
```

Qualification : Différence de style mesurée ; comparer au périmètre exact du composant.

Mesures :

```json
[
  {
    "x": 277.9375,
    "y": 507.53125,
    "documentY": 507.53125,
    "width": 44,
    "height": 44,
    "translateY": -22,
    "translateX": 0,
    "background": "rgb(248, 250, 252)",
    "image": "none",
    "shadow": "none",
    "hover": true,
    "focusWithin": false,
    "radius": 6.4,
    "overflow": 0,
    "hit": "SPAN",
    "centerInside": true,
    "label": "More actions",
    "class": "btn btn-link p-0 local-groupimport-easystud-group__actions-toggle local-groupimport-easystud-card-menu"
  }
]
```

Pas de nouvelle capture de ce contrôle : plafond global de six atteint ; ne pas réattribuer une capture prise sur une autre cible. Mesures DOM et erreurs conservées dans le JSON.

Preuve détaillée : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\followup3\easystud\authenticated\easystud-authenticated-20261016T212649679Z-34952\playwright-output\recette-soir-followup2-nat-d1cc9-rted-drag-FR-EN-four-widths\recette-soir-followup.json`. Aucun correctif produit appliqué.

## PASS/FAIL par point

| Cellule | Lot | Point | Résultat | Mesure courte |
| --- | --- | --- | --- | --- |
| FR1600 | GLOBAL | initial containment | PASS | débordement page 0 px |
| FR1600 | K16-69 | columns, action menus and complete-view round trip | PASS |  |
| FR1600 | SELECTION | participants | PASS |  |
| FR1600 | K16-13 | participants alpha / descending / alpha | PASS | 18 éléments ; QA Guided AAA One → QA Guided Member 16 |
| FR1600 | SELECTION | groups | PASS |  |
| FR1600 | K16-13 | groups alpha / descending / alpha | PASS | 164 éléments ; QA Audit Destination Beta → QA Group 10 |
| FR1600 | SELECTION | groupings | PASS |  |
| FR1600 | K16-13 | groupings alpha / descending / alpha | PASS | 12 éléments ; QA Activity Destination → QA Source Structure |
| FR1600 | K16-73 | empty group and grouping slots | PASS |  |
| FR1600 | K16-70 | 18-member label, expand and reduce | PASS |  |
| FR1600 | K16-74 | flat card and zero lift on hover | FAIL | Received:    1 |
| FR1600 | K16-65 | selected group member surface | PASS |  |
| FR1600 | K16-55 | header icon hover disc | PASS |  |
| FR1600 | K16-71 | phone action-menu close | N/A |  |
| FR1600 | K16-72 | navigation drawer close | N/A |  |
| FR1600 | K16-14 | move removes selected original memberships | PASS | SQL 4 → 2 appartenances |
| FR1600 | K16-14 | copy with original memberships | PASS | SQL 4 → 4 appartenances |
| FR1600 | GUIDE | slides 1 through 12 | PASS | 12 pages ; scrollLeft0 |
| FR1600 | MASS-IMPORT | opening and native editable preview | FAIL | Voir mesures/anomalie |
| FR1600 | GLOBAL | console and final containment | PASS | débordement page 0 px |
| FR1280 | GLOBAL | initial containment | PASS | débordement page 0 px |
| FR1280 | K16-69 | columns, action menus and complete-view round trip | PASS |  |
| FR1280 | SELECTION | participants | PASS |  |
| FR1280 | K16-13 | participants alpha / descending / alpha | PASS | 18 éléments ; QA Guided AAA One → QA Guided Member 16 |
| FR1280 | SELECTION | groups | PASS |  |
| FR1280 | K16-13 | groups alpha / descending / alpha | PASS | 164 éléments ; QA Audit Destination Beta → QA Group 10 |
| FR1280 | SELECTION | groupings | PASS |  |
| FR1280 | K16-13 | groupings alpha / descending / alpha | PASS | 12 éléments ; QA Activity Destination → QA Source Structure |
| FR1280 | K16-73 | empty group and grouping slots | PASS |  |
| FR1280 | K16-70 | 18-member label, expand and reduce | PASS |  |
| FR1280 | K16-74 | flat card and zero lift on hover | FAIL | Received:    1 |
| FR1280 | K16-65 | selected group member surface | PASS |  |
| FR1280 | K16-55 | header icon hover disc | FAIL | Voir mesures/anomalie |
| FR1280 | K16-71 | phone action-menu close | N/A |  |
| FR1280 | K16-72 | navigation drawer close | N/A |  |
| FR1280 | K16-14 | move removes selected original memberships | PASS | SQL 4 → 2 appartenances |
| FR1280 | K16-14 | copy with original memberships | PASS | SQL 4 → 4 appartenances |
| FR1280 | GUIDE | slides 1 through 12 | PASS | 12 pages ; scrollLeft0 |
| FR1280 | MASS-IMPORT | opening and native editable preview | PASS | 2 lignes ; import non appliqué |
| FR1280 | GLOBAL | console and final containment | PASS | débordement page 0 px |
| FR768 | GLOBAL | initial containment | PASS | débordement page 0 px |
| FR768 | K16-69 | columns, action menus and complete-view round trip | PASS |  |
| FR768 | SELECTION | participants | PASS |  |
| FR768 | K16-13 | participants alpha / descending / alpha | PASS | 18 éléments ; QA Guided AAA One → QA Guided Member 16 |
| FR768 | SELECTION | groups | PASS |  |
| FR768 | K16-13 | groups alpha / descending / alpha | PASS | 164 éléments ; QA Audit Destination Beta → QA Group 10 |
| FR768 | SELECTION | groupings | PASS |  |
| FR768 | K16-13 | groupings alpha / descending / alpha | PASS | 12 éléments ; QA Activity Destination → QA Source Structure |
| FR768 | K16-70 | 18-member label, expand and reduce | PASS |  |
| FR768 | K16-65 | selected group member surface | PASS |  |
| FR768 | K16-71 | phone action-menu close | PASS | 30.390625 × 30.390625 px ; rayon 11.52 |
| FR768 | K16-72 | navigation drawer close | PASS | 30.390625 × 30.390625 px ; rayon 11.52 |
| FR768 | K16-14 | move removes selected original memberships | FAIL | Voir mesures/anomalie |
| FR768 | K16-14 | copy with original memberships | PASS | SQL 4 → 4 appartenances |
| FR768 | GUIDE | slides 1 through 12 | PASS | 12 pages ; scrollLeft0 |
| FR768 | MASS-IMPORT | opening and native editable preview | PASS | 2 lignes ; import non appliqué |
| FR768 | GLOBAL | console and final containment | PASS | débordement page 0 px |
| FR390 | GLOBAL | initial containment | PASS | débordement page 0 px |
| FR390 | SELECTION | participants | PASS |  |
| FR390 | K16-13 | participants alpha / descending / alpha | PASS | 18 éléments ; QA Guided AAA One → QA Guided Member 16 |
| FR390 | SELECTION | groups | PASS |  |
| FR390 | K16-13 | groups alpha / descending / alpha | PASS | 164 éléments ; QA Audit Destination Beta → QA Group 10 |
| FR390 | SELECTION | groupings | PASS |  |
| FR390 | K16-13 | groupings alpha / descending / alpha | PASS | 12 éléments ; QA Activity Destination → QA Source Structure |
| FR390 | K16-70 | 18-member label, expand and reduce | PASS |  |
| FR390 | K16-65 | selected group member surface | PASS |  |
| FR390 | K16-71 | phone action-menu close | PASS | 30.390625 × 30.390625 px ; rayon 11.52 |
| FR390 | K16-72 | navigation drawer close | PASS | 30.390625 × 30.390625 px ; rayon 11.52 |
| FR390 | K16-14 | move removes selected original memberships | PASS | SQL 4 → 2 appartenances |
| FR390 | K16-14 | copy with original memberships | PASS | SQL 4 → 4 appartenances |
| FR390 | GUIDE | slides 1 through 12 | PASS | 12 pages ; scrollLeft0 |
| FR390 | MASS-IMPORT | opening and native editable preview | PASS | 2 lignes ; import non appliqué |
| FR390 | GLOBAL | console and final containment | PASS | débordement page 0 px |
| EN1600 | GLOBAL | initial containment | PASS | débordement page 0 px |
| EN1600 | SELECTION | participants | PASS |  |
| EN1600 | K16-13 | participants alpha / descending / alpha | PASS | 18 éléments ; QA Guided AAA One → QA Guided Member 16 |
| EN1600 | SELECTION | groups | PASS |  |
| EN1600 | K16-13 | groups alpha / descending / alpha | PASS | 164 éléments ; QA Audit Destination Beta → QA Group 10 |
| EN1600 | SELECTION | groupings | PASS |  |
| EN1600 | K16-13 | groupings alpha / descending / alpha | PASS | 12 éléments ; QA Activity Destination → QA Source Structure |
| EN1600 | K16-70 | 18-member label, expand and reduce | PASS |  |
| EN1600 | K16-65 | selected group member surface | PASS |  |
| EN1600 | K16-71 | phone action-menu close | N/A |  |
| EN1600 | K16-72 | navigation drawer close | N/A |  |
| EN1600 | K16-14 | move removes selected original memberships | PASS | SQL 4 → 2 appartenances |
| EN1600 | K16-14 | copy with original memberships | PASS | SQL 4 → 4 appartenances |
| EN1600 | GUIDE | slides 1 through 12 | PASS | 12 pages ; scrollLeft0 |
| EN1600 | MASS-IMPORT | opening and native editable preview | PASS | 2 lignes ; import non appliqué |
| EN1600 | GLOBAL | console and final containment | PASS | débordement page 0 px |
| EN1280 | GLOBAL | initial containment | PASS | débordement page 0 px |
| EN1280 | SELECTION | participants | PASS |  |
| EN1280 | K16-13 | participants alpha / descending / alpha | PASS | 18 éléments ; QA Guided AAA One → QA Guided Member 16 |
| EN1280 | SELECTION | groups | PASS |  |
| EN1280 | K16-13 | groups alpha / descending / alpha | PASS | 164 éléments ; QA Audit Destination Beta → QA Group 10 |
| EN1280 | SELECTION | groupings | PASS |  |
| EN1280 | K16-13 | groupings alpha / descending / alpha | PASS | 12 éléments ; QA Activity Destination → QA Source Structure |
| EN1280 | K16-70 | 18-member label, expand and reduce | PASS |  |
| EN1280 | K16-65 | selected group member surface | PASS |  |
| EN1280 | K16-71 | phone action-menu close | N/A |  |
| EN1280 | K16-72 | navigation drawer close | N/A |  |
| EN1280 | K16-14 | move removes selected original memberships | PASS | SQL 4 → 2 appartenances |
| EN1280 | K16-14 | copy with original memberships | PASS | SQL 4 → 4 appartenances |
| EN1280 | GUIDE | slides 1 through 12 | PASS | 12 pages ; scrollLeft0 |
| EN1280 | MASS-IMPORT | opening and native editable preview | PASS | 2 lignes ; import non appliqué |
| EN1280 | GLOBAL | console and final containment | PASS | débordement page 0 px |
| EN768 | GLOBAL | initial containment | PASS | débordement page 0 px |
| EN768 | SELECTION | participants | PASS |  |
| EN768 | K16-13 | participants alpha / descending / alpha | PASS | 18 éléments ; QA Guided AAA One → QA Guided Member 16 |
| EN768 | SELECTION | groups | PASS |  |
| EN768 | K16-13 | groups alpha / descending / alpha | PASS | 164 éléments ; QA Audit Destination Beta → QA Group 10 |
| EN768 | SELECTION | groupings | PASS |  |
| EN768 | K16-13 | groupings alpha / descending / alpha | PASS | 12 éléments ; QA Activity Destination → QA Source Structure |
| EN768 | K16-70 | 18-member label, expand and reduce | PASS |  |
| EN768 | K16-65 | selected group member surface | PASS |  |
| EN768 | K16-71 | phone action-menu close | PASS | 30.390625 × 30.390625 px ; rayon 11.52 |
| EN768 | K16-72 | navigation drawer close | PASS | 30.390625 × 30.390625 px ; rayon 11.52 |
| EN768 | K16-14 | move removes selected original memberships | PASS | SQL 4 → 2 appartenances |
| EN768 | K16-14 | copy with original memberships | PASS | SQL 4 → 4 appartenances |
| EN768 | GUIDE | slides 1 through 12 | PASS | 12 pages ; scrollLeft0 |
| EN768 | MASS-IMPORT | opening and native editable preview | PASS | 2 lignes ; import non appliqué |
| EN768 | GLOBAL | console and final containment | PASS | débordement page 0 px |
| EN390 | GLOBAL | initial containment | PASS | débordement page 0 px |
| EN390 | SELECTION | participants | PASS |  |
| EN390 | K16-13 | participants alpha / descending / alpha | PASS | 18 éléments ; QA Guided AAA One → QA Guided Member 16 |
| EN390 | SELECTION | groups | PASS |  |
| EN390 | K16-13 | groups alpha / descending / alpha | PASS | 164 éléments ; QA Audit Destination Beta → QA Group 10 |
| EN390 | SELECTION | groupings | PASS |  |
| EN390 | K16-13 | groupings alpha / descending / alpha | PASS | 12 éléments ; QA Activity Destination → QA Source Structure |
| EN390 | K16-70 | 18-member label, expand and reduce | PASS |  |
| EN390 | K16-65 | selected group member surface | PASS |  |
| EN390 | K16-71 | phone action-menu close | PASS | 30.390625 × 30.390625 px ; rayon 11.52 |
| EN390 | K16-72 | navigation drawer close | PASS | 30.390625 × 30.390625 px ; rayon 11.52 |
| EN390 | K16-14 | move removes selected original memberships | PASS | SQL 4 → 2 appartenances |
| EN390 | K16-14 | copy with original memberships | PASS | SQL 4 → 4 appartenances |
| EN390 | GUIDE | slides 1 through 12 | PASS | 12 pages ; scrollLeft0 |
| EN390 | MASS-IMPORT | opening and native editable preview | PASS | 2 lignes ; import non appliqué |
| EN390 | GLOBAL | console and final containment | PASS | débordement page 0 px |
| FR1600 | DRAG | supported participant transfer to empty group | PASS |  |
| FR1600 | K16-14 | fresh copy and unchecked on immediate reopening | PASS | SQL 2 → 3 appartenances |
| FR1600 | GLOBAL | follow-up console and horizontal containment | PASS |  |
| FR1280 | DRAG | supported participant transfer to empty group | PASS |  |
| FR1280 | K16-14 | fresh copy and unchecked on immediate reopening | PASS | SQL 2 → 3 appartenances |
| FR1280 | GLOBAL | follow-up console and horizontal containment | PASS |  |
| FR768 | SEARCH | group catalogue search visibility | FAIL | Received: false |
| FR768 | K16-73 | empty group and grouping slots | PASS |  |
| FR768 | K16-74 | flat card and zero lift on hover | FAIL | Received:    1 |
| FR768 | K16-55 | header icon hover disc | FAIL | Voir mesures/anomalie |
| FR768 | DRAG | supported participant transfer to empty group | PASS |  |
| FR768 | K16-14 | fresh copy and unchecked on immediate reopening | PASS | SQL 2 → 3 appartenances |
| FR768 | GLOBAL | follow-up console and horizontal containment | PASS |  |
| FR390 | K16-69 | columns, action menus and complete-view round trip | PASS |  |
| FR390 | SEARCH | group catalogue search visibility | FAIL | Received: false |
| FR390 | K16-73 | empty group and grouping slots | PASS |  |
| FR390 | K16-74 | flat card and zero lift on hover | FAIL | Received:    1 |
| FR390 | K16-55 | header icon hover disc | FAIL | Voir mesures/anomalie |
| FR390 | DRAG | supported participant transfer to empty group | FAIL | Received: visible |
| FR390 | K16-14 | fresh copy and unchecked on immediate reopening | FAIL | SQL 1 → 3 appartenances |
| FR390 | GLOBAL | follow-up console and horizontal containment | PASS |  |
| EN1600 | K16-69 | columns, action menus and complete-view round trip | PASS |  |
| EN1600 | SEARCH | group catalogue search visibility | PASS |  |
| EN1600 | K16-73 | empty group and grouping slots | PASS |  |
| EN1600 | K16-74 | flat card and zero lift on hover | FAIL | Received:    1 |
| EN1600 | K16-55 | header icon hover disc | PASS |  |
| EN1600 | DRAG | supported participant transfer to empty group | PASS |  |
| EN1600 | K16-14 | fresh copy and unchecked on immediate reopening | PASS | SQL 2 → 3 appartenances |
| EN1600 | GLOBAL | follow-up console and horizontal containment | PASS |  |
| EN1280 | K16-69 | columns, action menus and complete-view round trip | PASS |  |
| EN1280 | SEARCH | group catalogue search visibility | PASS |  |
| EN1280 | K16-73 | empty group and grouping slots | PASS |  |
| EN1280 | K16-74 | flat card and zero lift on hover | FAIL | Received:    1 |
| EN1280 | K16-55 | header icon hover disc | FAIL | Voir mesures/anomalie |
| EN1280 | DRAG | supported participant transfer to empty group | PASS |  |
| EN1280 | K16-14 | fresh copy and unchecked on immediate reopening | PASS | SQL 2 → 3 appartenances |
| EN1280 | GLOBAL | follow-up console and horizontal containment | PASS |  |
| EN768 | K16-69 | columns, action menus and complete-view round trip | PASS |  |
| EN768 | SEARCH | group catalogue search visibility | FAIL | Received: false |
| EN768 | K16-73 | empty group and grouping slots | PASS |  |
| EN768 | K16-74 | flat card and zero lift on hover | FAIL | Received:    1 |
| EN768 | K16-55 | header icon hover disc | FAIL | Voir mesures/anomalie |
| EN768 | DRAG | supported participant transfer to empty group | FAIL | Received: visible |
| EN768 | K16-14 | fresh copy and unchecked on immediate reopening | PASS | SQL 2 → 3 appartenances |
| EN768 | GLOBAL | follow-up console and horizontal containment | PASS |  |
| EN390 | K16-69 | columns, action menus and complete-view round trip | PASS |  |
| EN390 | SEARCH | group catalogue search visibility | FAIL | Received: false |
| EN390 | K16-73 | empty group and grouping slots | PASS |  |
| EN390 | K16-74 | flat card and zero lift on hover | FAIL | Received:    1 |
| EN390 | K16-55 | header icon hover disc | FAIL | Voir mesures/anomalie |
| EN390 | DRAG | supported participant transfer to empty group | PASS |  |
| EN390 | K16-14 | fresh copy and unchecked on immediate reopening | PASS | SQL 2 → 3 appartenances |
| EN390 | GLOBAL | follow-up console and horizontal containment | PASS |  |

## Preuves et limites

JSON complet : `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\measurements.json`. Il contient toutes les assertions effectives, les passages remplacés, les mesures, les appartenances SQL et les sorties de nettoyage. Les résultats de recette viennent de ces assertions ; un code de sortie0 du superviseur signifie seulement que la collecte est terminée.

Mesures versionnées : [recette-soir-16-10-2026.json](recette-soir-16-10-2026.json), sans les diffs de provenance ni les sorties détaillées du superviseur.

Captures : **6/6** au maximum ; aucun média dans Git.

- `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\native\easystud\authenticated\easystud-authenticated-20261016T204905264Z-34872\playwright-output\recette-soir-native-Evenin-bbae5--caa43774-FR-EN-four-widths\failure-1-K16-69-fr-1600.png`
- `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\native\easystud\authenticated\easystud-authenticated-20261016T204905264Z-34872\playwright-output\recette-soir-native-Evenin-bbae5--caa43774-FR-EN-four-widths\failure-2-K16-73-fr-1600.png`
- `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\native\easystud\authenticated\easystud-authenticated-20261016T204905264Z-34872\playwright-output\recette-soir-native-Evenin-bbae5--caa43774-FR-EN-four-widths\failure-3-K16-74-fr-1600.png`
- `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\native\easystud\authenticated\easystud-authenticated-20261016T204905264Z-34872\playwright-output\recette-soir-native-Evenin-bbae5--caa43774-FR-EN-four-widths\failure-4-K16-55-fr-1600.png`
- `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\native\easystud\authenticated\easystud-authenticated-20261016T204905264Z-34872\playwright-output\recette-soir-native-Evenin-bbae5--caa43774-FR-EN-four-widths\failure-5-DRAG-fr-1600.png`
- `C:\dev\Moodle 51 Perf\moodle\local\recette-soir-20261016\native\easystud\authenticated\easystud-authenticated-20261016T204905264Z-34872\playwright-output\recette-soir-native-Evenin-bbae5--caa43774-FR-EN-four-widths\failure-6-MASS-IMPORT-fr-1600.png`

Passages préliminaires conservés : vue complète absente car désactivée ; recherche d’un contenu de groupement encore replié ; survol comparé à un focus déjà actif ; mauvais bouton d’en-tête (étiquette) ; geste sur une ligne de membre au lieu d’une carte participant. Ils ne sont pas assimilés à des défauts produit lorsque le contrôle ciblé les remplace. Aucune assertion produit n’a été supprimée pour masquer un échec ; la cible et le prérequis sont explicités.

- `easystud-authenticated-20261016T204905264Z-34872` : superviseur failed, cours/comptes nettoyés=true, bail libéré=true, navigateur propriétaire fermé=true.
- `easystud-authenticated-20261016T210816621Z-17824` : superviseur failed, cours/comptes nettoyés=true, bail libéré=true, navigateur propriétaire fermé=true.
- `easystud-authenticated-20261016T211832149Z-47848` : superviseur interrupted-no-supervisor-result. Interruption externe : nettoyage manuel et preuve SQL séparée dans remainder2-post-cleanup.json ; aucun rapport de supervision reconstitué.
- `easystud-authenticated-20261016T212827455Z-20804` : superviseur passed, cours/comptes nettoyés=true, bail libéré=true, navigateur propriétaire fermé=true.
- `easystud-authenticated-20261016T210921754Z-40876` : superviseur failed, cours/comptes nettoyés=true, bail libéré=true, navigateur propriétaire fermé=true.
- `easystud-authenticated-20261016T212649679Z-34952` : superviseur passed, cours/comptes nettoyés=true, bail libéré=true, navigateur propriétaire fermé=true.
- `easystud-authenticated-20261016T213323991Z-42480` : superviseur passed, cours/comptes nettoyés=true, bail libéré=true, navigateur propriétaire fermé=true.
- `easystud-authenticated-20261016T220158617Z-3400` : superviseur passed, cours/comptes nettoyés=true, bail libéré=true, navigateur propriétaire fermé=true.

Les styles et scripts produit servis restent identiques à la base. Pas de publication sur localhost:80,8052,8054 ou8055 ; pas de redémarrage de service. Aucun correctif appliqué. Recette automatique native distincte de l’acceptation visuelle de Kevin ; le JSON permet de conserver toute réserve de couverture.
