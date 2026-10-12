# Retour à Claude / Kevin — T012 et conservation de la recette Guide

Le récapitulatif de fin est désormais réellement repliable, ouvert par défaut,
avec le contrôle commun et Motion `disclosePanel`, pas une animation privée.
Le Guide reste disponible sur `http://localhost/local/groupimport/manage.php?id=5`.
Les aperçus T014 et les corrections T015 précédentes restent dans cette preview.

## Pins des assets vérifiés

| Dépôt | Branche | Commit des assets |
| --- | --- | --- |
| Kit | `work/port4719pg3/eed-ui-2026-0073-kit-phase0-mass-admin` | `bfaf05940c173d8f62aef945188c1900c9651007`,0.4.184 |
| Source | `work/port4719pg3/easystud-foundations-student-management-20260928` | `6e6f90ec9768f8824db80f042ad94cc41158840b` |
| Runtime local | `preview/moodle51/easystud-phase0-mass-admin` | `7b6aef7111cffc34bfd4a9ed30931a7ee41932fd` |

Les commits documentaires suivants ne modifient pas ces assets. Le runtime
ne se pousse pas ; Source/Kit utilisent leurs seules branches privées existantes.
La sauvegarde/handoff vérifie les derniers HEAD séparément des pins testés.
CSS Gitblob partagé Source/runtime : `96a100026140a2c245d3ec3c8489ea5f0a2b19e6`.

## Vérifications effectuées

-12 cas isolés réels AMD/template et12 cas isolés policy/destroy : Enter,
  inversion de repli, Reset, effets et styles nettoyés, policy/reduced.
- Native12160 :60 cas EN/FR,1280/768/390, normal/reduced, quatre scènes,
  Add/Move, default-open, repli/réouverture/clavier et tous les lifecycles T015.
- Régression26880 :12 scènes,1336 observations250ms, six changements de taille,
  zéro texte de dialogue débordant ou violation de cible répétée.
- Clavier48596 :12 routes Tab/Shift-Tab, Home/End, Enter, nested/typing Escape
  et focus de retour. Zéro erreur/commande métier ; cleanup des trois wrappers complet.
- Source/Standard Foundations huit états sauvegardés, quatre états produit liés,
  text bounds/Inter et rasters inspectés. Anciennes preuves/diagnostics conservés.
- Moteur complet hors branche recap, CSS/template hors recap, PHP/lang/business/
  curriculum/Motion inchangés. Nommage AMD vérifié par exécution des exports.

Preuve structurée : `testing/guide-t012-recap-disclosure-2026-10-12.json`.
Scénarios versionnés candidats local-supervised, pas de CI/Docker revendiqué.
Artefacts manifestés hors Git ; rétention dry-run sans suppression.

## Suite et réserves conservées

- **T037**, aération/lecture :42rem paragraphes, hiérarchie des explications,
  légendes, rappel des points importants. Préflight versionné avant toute activation.
- La copie de fin semble reprendre le type-body ordinaire dans le header,
  malgré l'état vert : mesurer/corriger l'accent/gras dans ce successeur, sans
  confondre cette réserve de paint avec le PASS de fonctionnement T012.
- GS3/libellés courts et les autres décisions du Guide restent séparés. La
  ligne dédiée Voir dans l'interface reste celle validée par Kevin.
- Couloirs Student T017/18/19/21/36 conservés. A2 est maintenant approuvé :
  proportions suivant la vraie largeur utile du panneau. CSS-only inchangé,
  pagination réellement disabled nécessitant une autorisation fonctionnelle distincte.
- Les61 scopes de Claude et les lots successifs utilisateur ne sont pas remplacés.
- La checklist humaine reste **ouverte**. Aucune action nécessaire maintenant ;
  revue regroupée plus tard. Aucun cours/utilisateur déplacé pour ces contrôles.

Rollback : commit inverse borné Kit/Source, rebuild et promotion sous bail,
pas de reset d'un worktree ni suppression des anciennes preuves.
