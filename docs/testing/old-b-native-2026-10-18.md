# OLD-B — temps2, validation native

Base39377a9b ; source rebasée9ba7043e, branche
`work/codex1/easystud-old-b-native-20261018`. L'ancienne branche a64cc783
et le premier Kitfa6d0fb restent disponibles. Aucun force-push.

## Résultats FR/EN

| Langue | Largeur | Retirer | Ligne membre | Centre du trait X/Y | Reset / Annuler hauteur | Centre texte Y Reset / Annuler | Cibles des deux switches |
|---|---:|---|---:|---|---|---|---|
| FR | 1600 | 32 × 32 | 40 | 0 / 0 | 37.59375 / 37.59375 | 0 / 0 | 44×44, 44×44 |
| FR | 1280 | 32 × 32 | 40 | 0 / 0 | 37.59375 / 37.59375 | 0 / 0 | 44×44, 44×44 |
| FR | 768 | 44 × 44 | 45 | 0 / 0 | 44 / 44 | 0 / 0 | 44×44, 44×44 |
| FR | 390 | 44 × 44 | 45 | 0 / 0 | 44 / 44 | 0 / 0 | 44×44, 44×44 |
| EN | 1600 | 32 × 32 | 40 | 0 / 0 | 37.59375 / 37.59375 | 0 / 0 | 44×44, 44×44 |
| EN | 1280 | 32 × 32 | 40 | 0 / 0 | 37.59375 / 37.59375 | 0 / 0 | 44×44, 44×44 |
| EN | 768 | 44 × 44 | 45 | 0 / 0 | 44 / 44 | 0 / 0 | 44×44, 44×44 |
| EN | 390 | 44 × 44 | 45 | 0 / 0 | 44 / 44 | 0 / 0 | 44×44, 44×44 |

Police14.08px, padding horizontal12px, rayon11.52px. Traits12×1.5px sans
fond/bord/ombre. Débordements verticaux/horizontaux maximaux :
0px.
Les quatre contrôles de retrait carte/fiche, Reset et Annuler suivent leur
recette commune. Le retrait est masqué au repos à la souris, révélé au survol
et au focus, et toujours visible au toucher. Aucune appartenance modifiée.

Comparaison de base39377a9b : retrait23.1875px, Reset30.390625px,
Annuler37.59375px même au toucher ; contrôle admin natif précédent.
Les largeurs textuelles restent intrinsèques : le pied de fiche conserve
son minimum de96px pour Annuler ; aucun rétrécissement ad hoc de la police.

## Corrections révélées par la recette

1. Le plafond compact2.35rem et son minimum40px laissaient dépasser de1.5px
   la cible44. La recette Kit related-person-row-compact-frame prend une
   hauteur automatique ; minimum préservé, ligne native tactile45px.
2. Le texte de Reset était0.953125px trop haut. secondary-action reprend
   les métriques de ligne naturelles d'Annuler ; taille14.08 et cadre
   inchangés. Centres de boîtes de texte mesurés0/0 ; ce choix de leading
   diffère du1.2 déclaré dans le brouillon source/Penpot et doit être reporté.

## Accessibilité et garde-fous

Les deux réglages exposent un nom traduit non vide, role=switch et checked
natif correct avant/après clic/tap. Cibles44, piste36×20, centres0/0, aucun
texte d'état visible. Chaque valeur initiale est remise dans le DOM sans
validation du formulaire. Aucun test de synthèse vocale NVDA/VoiceOver réalisé.
Le nom du retrait contient membre et groupe ; la bulle est localisée.
K16-64 reste exclu. Aucun changement de logique de retrait/stockage.

## Vérifications

- Node22.11.0 / Sass1.79.1 : SM AMD, CM AMD, styles conservative PASS.
- php-lint5PHP PASS ; MoodleCS complet0erreur/19avertissements historiques.
- ESLint Moodle sans hausse : advanced_settings5erreurs/3avertissements
  historiques, entity_dialog0/0, groups0/1. CRLF normalisés pour comparaison
  seulement, fichiers source conservés.
- Tests escaping, moteur de filtres,18contextes de switch : PASS.
- Huit mixins uniques identiques Kit/consommateur et template adapté : PASS.
- T037, T038 et aller-retour Guide avec le Kit OLD-B : PASS.
- Matrice finale8cas PASS,0erreur console/page. Styles globaux sans règle.

Les premières passes sont conservées : débordement1.5px réel ; sonde ESLint
initialement sensible CRLF ; select natif masqué par le Kit ; deux exceptions
Moodle core (GlobalDebugPanel/message_drawer) lors de navigation précoce.
Le scénario final attend load, puis les initialisations Moodle et les
animations finies ; les écouteurs d'erreur restent actifs pendant tout le cas.
Les états actif, focus et tactile restent assertés, sans filtre d'erreur.

Preuves : <workspace>/artifacts/old-b-native-20261018/final-candidate.json,
baseline-pilot.json, phpcs-full.json, eslint.json, source-parity-final.json.
Copie du pool réservée par verrou atomique, jamais localhost:80. La copie
n'est pas une publication ; Claude intégrera après revue.

## Report Penpot

Member remove32/44 et trait12×1.5, ligne compacte automatique45 native ;
Secondary/M et Touch37.6/44 avec leading naturel et centres texte0/0 ;
Filter toggle standalone44, piste36×20 On/Off et nom accessible.
Écrans : cartes/fiches groupe et filtres Participants, réglages admin ;
états repos/survol/focus/actif/tactile, FR/EN1600/1280/768/390.

Kit final : cff748730597e7782b05fc3350fe1e80528c2c96. Pin ajouté sans modifier les entrées antérieures.

Rejeu du candidat natif (copie du pool verrouillée uniquement) :

```text
node tools/release/test-old-b-controls-native.cjs <playwright-module> <pool.json> <admin-secret-file> <artifact-directory> candidate --final
```

Le corps des assertions est identique au scénario recetté ; seuls les chemins
locaux deviennent des arguments, avec allowlist des trois copies du pool.
