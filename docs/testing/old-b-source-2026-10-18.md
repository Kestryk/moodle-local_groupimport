# OLD-B — temps1, sources seulement

Base `fa16784f`, branche `work/codex1/easystud-old-b-20261018`.
Kit dédié depuis `afcacdd4`, descendant de `0428c2a` :
`work/codex1/easyedu-kit-old-b-20261018`, commit `fa6d0fbee9750b704957eeeb0e30d866cbfb977f`.
Référence : `PENPOT-PASSE/OLD-B-PENPOT-2026-10-18.md`.

## Changements source

- K16-67 : recette unique `related-person-remove`, cible32/44px, trait12×1.5px
  centré, sans carré peint. La visibilité au survol/focus bureau appartient au
  Kit; la règle locale correspondante est retirée. Le retrait reste visible
  au toucher. Même classe sur carte et fiche; nom accessible avec membre ET
  groupe, bulle Kit « Retirer du groupe », aucune modification du retrait.
- R13 : `buttons.secondary-action` sert à Annuler et Réinitialiser. Hauteur
  minimale37.6/44px, police14.08px/1.2 à600, padding horizontal12px, rayon11.52px,
  surface blanche, bord#C8D6E3, texte#1F2A37 via les jetons Kit existants.
  Les quatre Reset des panneaux sont raccordés à cette recette. Les boutons
  « Tout désélectionner » conservent leur recette de récupération distincte.
- K16-46 : variante Kit `filter-toggle--standalone`, cible44px sans texte
  d'état visible, même piste36×20 et pouce14. Les deux cases d'administration
  utilisent une sous-classe de présentation de `admin_setting_configcheckbox`.
  Stockage, validation, valeurs, désactivation et défauts restent hérités.
  Le nom du réglage reste visible et accessible. `role=switch` expose l'état
  checked natif; pas d'attribut aria-checked redondant et périmé sans JavaScript.
- K16-64 : aucune modification du compteur ou de sa police10px.

Le Kit reçoit les mêmes définitions et un gabarit canonique de contrôle
d'administration; le consommateur ne change que son namespace. Le miroir des
sources est `scss/easyedu`; les documents Kit sont reportés dans
`easyedu-kit-docs`. Le miroir Guide `easyedu-guide-kit` n'a aucun delta OLD-B.
Différences antérieures entre `afcacdd4` et `fa16784f` dans trois fichiers :
variantes responsives des cartes, helpers de filtres, adaptateur field-peer.
Seuls les blocs OLD-B sont reportés : aucun écrasement d'autres définitions.

## Contrôles autorisés au temps1

- `php -l` : PASS sur les cinq PHP ajoutés/modifiés (`manage.php`, `settings.php`,
  classe de présentation et langues FR/EN).
- MoodleCS standard `moodle`, ces cinq fichiers :0erreur /0avertissement.
  Aucun zéro global revendiqué : les14erreurs de base sont traitées séparément
  par le prérequis `34787045`, absent volontairement de cette branche.
- PHP isolé :18cas de contexte d'administration (trois valeurs actuelles ×
  trois défauts × lecture seule ou non), formatter natif et stockage hérité.
  Simulation du rendu, sans chargement Moodle ni preuve d'accessibilité native.
- Parité source PHP : sept mixins uniques identiques Kit/consommateur,
  gabarit identique après adaptation de namespace et normalisation CRLF/LF,
  placeholders FR/EN conservés. La première comparaison du gabarit, sensible
  aux fins de ligne, est conservée séparément dans les preuves.
- `git diff --check` : PASS. Aucun fichier généré AMD/CSS modifié.

Preuves : `C:/dev/artifacts/old-b-20261018/`, rapports `phpcs-touched.json`,
`source-check.json`, `switch-check.json`, sondes PHP isolées et patches de
report Kit. Ces contrôles ne compilent pas le Sass et ne valident pas le JS.

## Temps2 — en attente de « créneau terminé »

Ne pas intégrer/publier ce candidat source seul : gabarits, nouveaux libellés
et sources AMD doivent être construits et recettés ensemble après le feu vert.
Build styles conservative et AMD des modules modifiés en Node22.11.0/Sass1.79.1,
contrôles JS et Guide/Kit appropriés, puis matrice native FR/EN1600/1280/768/390.
Comparer aux planches : tailles32/44, trait12×1.5 et centres±0.5px, hauteurs
Annuler/Reset égales et37.6/44, texte14.08, padding12, rayon11.52, couleurs,
cibles44 des switches, état accessible à chaque bascule/reset, help/focus,
contenance des lignes de membres,0erreur console. Réserver les vrais résultats
au temps2. Aucune mesure native, build, copie/purge Moodle ou publication ici.

Pour Penpot : composant Member remove (bureau/tactile, cartes/fiches),
Secondary/M et Touch (Annuler/Reset, panneaux), Filter toggle standalone
(administration, On/Off/disabled/focus). Les constantes ci-dessus sont des
cibles de source, pas des mesures d'acceptation.
