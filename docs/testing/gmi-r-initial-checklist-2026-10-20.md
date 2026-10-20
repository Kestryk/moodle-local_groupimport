# GMI-R-FIX — supprimer le recouvrement initial

Base `48ed6808`, incluant GMI-C4-FINITIONS `d1f80214`. Preuve native initiale :
`RECETTE-GMI-R-2026-10-20.md`, intersection 326 × 72 px à t0, absente à 1/5 s.

## Cause et correction

`renderChecklist` enlève `hidden`, remplit la liste et place par défaut à droite.
Le bouton de démarrage appelle ce rendu avant `closeModal(...).then(...)` ;
`highlightChecklistStep` attend ensuite les éventuelles actions d'ouverture.
Ce n'est que dans `scrollToTarget` que `dockChecklistAwayFromTarget` lit la
cible et son `avoidCompanion`. Le navigateur peut donc peindre plusieurs frames
à droite avant ce callback. Les rafraîchissements ultérieurs expliquent le
PASS stabilisé ; attendre une seconde dans la recette ne corrige pas ce défaut.

Le rendu appelle maintenant les mêmes résolveurs et la même primitive de
placement après la construction du contenu et de l'étape active, synchroniquement
avant de rendre la main. Le changement d'étape fait de même après son message.
Aucune duplication de règle, aucun délai, masque temporaire ou changement de
focus, de cible, de parcours, de stockage ou de niveau Motion. Les appels de
placement ultérieurs sont conservés pour les changements réels du DOM.

## Vérification headless

Le test versionné `test-gmi-initial-checklist.cjs` exécute les vrais corps de
fonctions de rendu, résolution, changement d'étape et placement de la base puis
du candidat sur la vraie feuille CSS. Les services de stockage, progression,
message et focus sont des doubles : ce test ne constitue pas une nouvelle
recette Moodle authentifiée ni une validation de tous les parcours.

FR/EN × full/reduced/minimal à 1600 : six cas. L'ancien rendu recouvre bien
l'avertissement immédiatement ; le nouveau a une intersection nulle dès la
sortie de `renderChecklist`, à chaque frame échantillonnée pendant 350 ms et
après changement d'étape. Les mesures à 1 s et 5 s conservent également zéro
intersection ; l'appel tardif du surlignage résout l'ancien cas comme dans la
preuve native initiale. Aucun timer produit ajouté. Les sondes de préparation
dont la racine CSS n'était pas complète sont conservées séparément.

K20-03 : huit cas sur le vrai module notification compilé, FR/EN × 1600/390 ×
court/long, 72/90 px et fermeture 44 × 44 px, centre du glyphe 0 px, aucune
erreur console. Cette vérification responsive est distincte du test de
placement desktop à l'origine du défaut GMI-R ; le parcours Mass Import natif
à 768/390 reste à rejouer par l'intégrateur.

## Portes et synchronisation

- Guide AMD/map reconstruits avec Node 22.11.0 ; syntaxe et échappement/filtres
  PASS. Aucun autre AMD n'est reconstruit.
- MoodleCS PHP complet du plugin : **0 erreur, 27 avertissements hérités**.
  Aucun PHP touché. Le runner officiel local_codechecker configure PHPCS pour
  PHP uniquement ; ce zéro ne transforme pas le JavaScript en code sans dette.
- ESLint Moodle, CRLF normalisés de façon identique avant/après :
  **41 erreurs / 475 avertissements → 41 / 475**, aucune augmentation.
- T037 et T038 : PASS. Canonique et miroir du moteur Guide sont reconstruits
  fidèlement depuis le corps runtime, en gardant imports, exports et valeurs
  par défaut du Kit. Cela reporte aussi les changements runtime GMI-C4 déjà
  présents dans la base et absents du miroir, sans les réappliquer au plugin.
- La partie aller-retour AMD du test passe après ce report. La porte complète
  reste en échec sur la bulle héritée (ligne 44) ; le contrôle sync signale aussi
  des dérives héritées de gabarits. Ces fichiers ne sont pas écrasés. L'échec
  d'avant correction et la liste exacte sont dans les preuves externes.

Aucun accès/runtime modifié, publication, service redémarré, CCB ou Penpot.
Preuves : `C:/dev/artifacts/k20-03-gmir-fix-20261020/`.
Report Penpot : K20-03 seulement, rythme 8 px, lignes 12/20/18 et Close44.
GMI-R-FIX ne change pas la composition finale ; il la rend correcte dès t0.
