# T058 — accès menu et synchronisation History

La réconciliation produit est annoncée dans `a667f7df` et `9dd156b4`.
Lors du contrôle de cette reprise, la copie :8051 ne contient toujours pas le
branchement `focusMoveModal` dans son contrôleur source. Aucun nouveau test
navigateur n'est lancé contre ce prérequis absent ; publication par Codex1.

`tools/playwright/t058-modal-focus-native-successor.spec.js` reprend la spec
de `9dd156b4` sous un nouveau nom pour préserver les mesures historiques.

- Group/Grouping : détecte le bouton direct dans l'en-tête ; lorsqu'il est
  masqué à 1280, ouvre le menu natif de cette carte puis son action réglages.
  Le retour attendu est le bouton du menu, pas son action devenue cachée.
- History : attend `data-local-groupimport-history-bound=1` sur la fenêtre
  et, pour le chemin compact, sur l'action de navigation.
- Après ouverture : attend la fermeture effective du panneau de navigation
  (`aria-hidden`), les animations finies du document, puis le focus natif
  dans la fenêtre. Le panneau se ferme via un callback différé du produit.
- Après fermeture : attend le focus effectif sur le déclencheur prévu avant
  la lecture du résultat. Aucun focus initial forcé, délai fixe, retry de test,
  changement Motion ou affaiblissement des assertions existantes.

Validation N0 : syntaxe Node, diff-check, découverte ciblée FR1280 et FR390
PASS (exactement un test pour chacun). **Stabilisation native non acquise** :
le scénario History alternait PASS/FAIL avant cette modification ; seules les
attentes sont préparées, pas encore éprouvées sur la version réconciliée.

Reprise : vérifier la publication :8051, lancer ce successeur aux deux tailles
et la sonde T058 restante, puis compléter T059. Conserver les deux modes comme
dimensions explicites de la preuve ; pas de matrice générale ni de T060.
Aucun fichier produit/Kit modifié. Ce rapport, l'intake et le changelog portent
le contrat local de test ; le contrat Kit et AGENTS restent inchangés.
