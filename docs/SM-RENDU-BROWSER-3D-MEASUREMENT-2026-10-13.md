# SM-RENDU 3d — mesure navigateur à l’échelle

Date : 13 octobre 2026. Mesure native supervisée uniquement, sur
`http://localhost:8051` / `moodle51perf`. Ce document ne constitue ni une
validation visuelle, ni une intégration produit de T054.

## Périmètre reproductible

- Snapshot déployé : `3be2f6ba66ef481a2a954aed8bc9c52021f38c4d` sur la copie
  Perf, incluant SM-RENDU 3c et 3d de Claude ; `version.php` inchangé.
- Une même fixture par taille : 800 / 80 groupes / 16 groupements, puis
  3 000 / 300 / 60 ; trois appartenances par participant.
- Une exécution Chrome FR 1280 par mode : `Current` puis `On demand`.
- État utilisable : `data-easystud-manager-initialised="1"` en Current,
  `data-easystud-sm-ready="1"` en On demand. Après chaque interaction, la
  mesure attend dix images `requestAnimationFrame` consécutives sous 60 ms.

## Résultats initiaux

| Participants | Mode | Utilisable | HTML décodé | Éléments DOM | Tâches longues cumulées |
| ---: | --- | ---: | ---: | ---: | ---: |
| 800 | Current | 205,86 s | 43,51 Mo | 136 180 | 207,13 s |
| 800 | On demand | 24,43 s | 1,22 Mo | 10 483 | 15,58 s |
| 3 000 | Current | 1 229,26 s | 143,13 Mo | 437 460 | 1 256,30 s |
| 3 000 | On demand | 16,51 s | 1,57 Mo | 14 543 | 16,11 s |

À 800, On demand réduit le HTML de 97,2 %, le DOM de 92,3 % et le temps
d’utilisabilité de 88,1 %. À 3 000, les écarts sont respectivement de 98,9 %,
96,7 % et 98,7 %. La mesure Current à 3 000 a dépassé la fenêtre
d’observation de 240 s ; le marqueur est arrivé tardivement à 1 229,26 s et
est conservé comme tel, sans succès SLA artificiel.

## Interactions à 3 000

| Interaction | Current synchrone / calme | On demand synchrone / calme |
| --- | ---: | ---: |
| Page suivante participants | 463 / 10 528 ms | 17 / 2 514 ms |
| Recherche `perf user 001` | 519 / 12 772 ms | 21 / 3 066 ms |
| Effacement de la recherche | 469 / 8 104 ms | 15 / 2 889 ms |
| Vue Structure | 1 027 / 18 624 ms | 37 / 8 003 ms |
| Page suivante du catalogue | 252 / 9 267 ms | 10 / 5 323 ms |

Les cinq actions ont abouti dans les deux modes. Le coût « calme » inclut
l’observation CDP/Playwright : il ne représente pas un temps isolé de
composant.

## Preuve et nettoyage

- Données brutes 800 :
  `C:/dev/artifacts/easystud-sm-rendu-browser-3d-20261013/measure-800/`.
- Données brutes 3 000 :
  `C:/dev/artifacts/easystud-sm-rendu-browser-3d-20261013/measure-3000/`.
- Le runner navigateur est passé sans erreur ; le statut métier de la mesure
  reste négatif car les délais de Current, et à 800 celui d’On demand,
  excèdent la cible du protocole.
- Le réglage `renderingmode` absent avant l’essai a été restauré ; la fixture
  est nettoyée, ses relations préexistantes sont inchangées, et l’inspection
  finale rapporte 0 utilisateur et 0 cours de fixture actifs.

## Limites et suite

La machine, Apache et MySQL sont partagés : les valeurs sont des mesures de
comparaison, pas un budget produit figé. T054 reste sous ownership de Claude
pour le code et de Codex n°1 pour l’intégration ; l’acceptation humaine reste
ouverte.
