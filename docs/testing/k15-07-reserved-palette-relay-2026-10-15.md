# K15-07 — dependance Claude, 15/10/2026

## Etat verifie
- Source courante: work/codex1/easystud-css-regressions-20261015.
- scss/components/_tooltips.scss consomme deja easyedu.popover-surface et les
  fleches/texte long du Kit; pas de reconnexion visuelle a inventer.
- Kit scss/easyedu/components/_tooltips.scss:65 definit encore ses couleurs
  classiques dans popover-surface (#183a59 -> #1f6b57, fleche #1b4e5a).
- amd/src/local/cm/group_card_controls.js:493 bindHoverPopovers(root) cree
  activeTip puis document.body.appendChild(activeTip), sans copie de la palette.
  Les variables de theme du workspace ne sont donc pas heritees par la bulle.
- La regle Kevin reserve amd/src/local/cm/* a Claude. Aucun changement K15-07
  applique dans ces sources, aucun contournement par un deuxieme observateur.

## Petit commit attendu de Claude
Dans showTip/bindHoverPopovers, relayer du root vers activeTip les roles de
palette que le Kit pourra consommer (primaire/accent choisis et forts), avec un
signal explicite de personnalisation reutilisant la configuration existante.
Fixer ce contrat avec N1 avant de nommer une nouvelle variable. Conserver
escapeHtml, les labels, le montage, la position, les evenements focus/hover,
le retrait au clic/scroll et les comportements clavier existants.
N1 fera ensuite le mixin Kit opt-in et son adoption sur les surfaces du plugin,
avec le vert classique conserve par defaut et la palette admin en personnalise.
Aucun changement de preferences/couleurs du site n'a ete fait pour ce diagnostic.

## Recette attendue
Focus clavier et survol: surface, texte et fleche dans la meme palette;
defaut vert classique, personnalise derive des couleurs admin; libelles longs,
SM/MI/admin1280 et390; aucun style EasyStud sur une page hors plugin.
Le rendu natif actuel des couleurs personnalisees n'est pas declare valide.

## Lots precedents servis
V2 bf594489, Claude jusque c84c1a36 servi69f060f4, lift final98dbcd99,
Kit0.4.211/49ef47e. V2 cartes/colonnes/MI/admin/horsplugin PASS scopes documentes.
Lift broad234938193Z-27992, edges desktop235351112Z-55364 (runglobalFAILED
mobile initial), mobile final235655488Z-15472PASS delta0. Complete desactivee,
rejeu metier et validation humaine restent ouverts. Penpot exclusivement Claude.
