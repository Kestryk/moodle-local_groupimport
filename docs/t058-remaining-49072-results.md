# T058 complément — 49072e22 sur :8051

`t058-remaining-49072.spec.js` échoue **ligne 43 dans les deux modes** :
Rollback ne rend pas le focus au bouton Restaurer d'History après Échap.
Tab et Maj+Tab sortent également de Rollback. Focus initial dedans, Échap
ferme et History redevient visible. Aucun import restauré ni message envoyé.

La sonde restreinte `t058-rollback-evidence-49072.spec.js:50` confirme en legacy
que Tab depuis le dernier contrôle se déplace sur le bouton d'aide du pied de
page Moodle. Après Échap, le focus y reste. La capture montre History ouvert
et le focus sur ce bouton extérieur ; ce n'est pas un simple retour à un proxy
valide de la fenêtre.

- Matrice principale : `C:/dev/artifacts/es-t058-rest-49072/after/matrix.json`.
- Capture : `C:/dev/artifacts/es-rollback-49072/after/legacy-0/easystud/authenticated/easystud-authenticated-20261013T203600764Z-40372/playwright-output/t058-rollback-evidence-490-5facb-ure-evidence-FR1280-reduced/rollback-return-focus.png`.
- La capture complémentaire reactive a été interrompue avant navigation ;
  aucun résultat ni capture reactive inventé. Propriétaire PID50184 absent,
  réservation exacte libérée ; mode/préférence restaurés et purge effectuée.

Message, Move et Guide passent leurs six cycles normal/réduit dans chaque mode
(12 cycles). Durées CSS réduites échantillonnées : `1e-06s`, soit 0,001 ms.
La sélection Espace puis l'ouverture Move au clavier passent ; découverte
séquentielle complète et confirmation d'un transfert restent non certifiées.
More Filters reste ouvert après Échap ; le premier Tab quitte son déclencheur
sans entrer dans le panneau. C'est un panneau non modal, aucune boucle Tab
n'est exigée ; le contrat de fermeture reste à qualifier.

Axe ne détecte aucune violation de contraste sur la page initiale de cette
révision, mais retourne des checks `color-contrast` incomplets. Cela ne ferme
pas toutes les palettes, fenêtres ou combinaisons. Zéro écriture bloquée et
zéro erreur de page dans les deux parcours. Aucun correctif produit ici ;
Rollback appartient à `csv_import.js`, hors nouveau lot SCSS autorisé.
