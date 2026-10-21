# tools/release — barrières V2 et outillage

Ce dossier contient les scripts de recette et d'audit du plugin `local_groupimport`
(EasyStud). Il a grossi lot après lot (K16, A10, wave10, fiches K16, r10-23, …) :
**381 scripts en racine, une seule bibliothèque partagée**. Ce README et
`gates.json` servent de point d'entrée unique pour savoir quelles commandes
font réellement foi aujourd'hui.

## Barrières V2 actuelles

La liste vivante est dans [`gates.json`](./gates.json) (un objet par barrière,
avec sa commande exacte). Catégories couvertes, une barrière par domaine :

| Domaine | Script | Nécessite une copie du pool ? |
|---|---|---|
| Audit natif FR/EN | `audit-texts.cjs` | non (source statique) |
| Audit CSS | `audit-css.cjs` | non (source statique) |
| Contrat de transport | `test-initial-state-transport.cjs` (+ variante native) | non / oui pour la variante native |
| Recette Student Management | `verify-student-management.cjs` | non (compare aux commits approuvés) |
| Audit Mass Import | `audit-mass-import-semantic-palette.cjs` | non (DOM isolé, pas de Moodle) |
| Contrat Administration | `test-admin-settings-loading-contract.ps1` | non |

Tout ce qui n'est **pas** listé dans `gates.json` est soit une preuve
historique d'un lot clos (candidat à `archive/`), soit un script ponctuel pas
encore promu en barrière. Avant d'ajouter une barrière, vérifier qu'elle
correspond à un risque de régression réel sur la V2 (pas une preuve K
one-shot).

## Harnais commun (`lib/harness.cjs`)

Les scripts qui ont besoin d'une copie de test du pool (`:8052`, `:8054`,
`:8055`) doivent lire leur connexion, leur port et leur verrou depuis
l'environnement via `tools/release/lib/harness.cjs`, plutôt que de coder le
port en dur ou de relancer leur propre Chromium avec des options différentes.
Voir l'en-tête de ce fichier pour l'API. Les scripts existants ne sont pas
migrés automatiquement par ce lot — seuls les nouveaux scripts et les
migrations volontaires l'utilisent, pour ne rien casser.

## Bibliothèque de contrats partagée

`lib/current-presentation-contracts.cjs` reste la seule bibliothèque de
contrats CSS/markup partagée (utilisée par 7 scripts : sélection, tuiles,
tooltip, guide, filtres, capsule de filtre). Ne pas dupliquer ces contrats
dans un nouveau script : l'appeler avec le nom du contrat concerné.

## Archive (`archive/`)

Les scripts d'un lot K **clos** sont déplacés (jamais supprimés) vers
`tools/release/archive/` au fur et à mesure. Un script qui y figure reste
disponible pour relecture mais n'est plus une barrière V2. Premier lot migré
(2026-10-21) : scripts `test-k16-*`, `test-a10-*`, `test-wave10-*`,
`test-r10-23-*`, `test-fiches-k16-*` (13 fichiers).

## Règles

- Jamais de suppression de script, seulement un déplacement vers `archive/`.
- Un script qui lance son propre Chromium doit, pour les nouvelles
  contributions, passer par `lib/harness.cjs` (port/connexion/verrou depuis
  l'environnement, fenêtre maximisée, mode headless par défaut).
- Toute nouvelle barrière V2 doit être ajoutée à `gates.json` avec sa commande
  exacte et testée au moins une fois avant d'être documentée comme fiable.
