# Protocole — Guide refondu, 17 octobre 2026

Base immuable : `d44585d838ceb7b8e659c18c7ab3415741bcd7e5`. Le worktree
Claude contient des builds non commités ; ils ne sont jamais copiés. La copie
:8051 reçoit les objets du commit dans le worktree de recette, dont le nouveau
`templates/guide_simplecreate.mustache`, puis une purge sous les réservations
du runtime et de son cache. Le rapport final vérifie les 287 fichiers contre
les objets Git. Aucun build ni correctif produit.

Matrice : FR/EN × 1600/1280/768/390 × Complètes/Réduites/Minimales. Le contexte
390 utilise `hasTouch` et `isMobile`. Les niveaux passent par l’API publique
Motion, sans écrire une préférence utilisateur. Cette recette ne certifie pas
la migration M1 ou la priorité préférence/admin. Les contextes de démonstration
ne partagent que leurs cookies de session, en mémoire ; aucun état
d’authentification n’est enregistré.

Chaque diapositive est ouverte par sa pastille native. Les observations portent
sur le titre18/24, l’interligne1,5, la mesure38rem, le débordement, les
conteneurs qui défilent, les pastilles et les flèches. Les scènes avec un bouton
Démarrer sont jouées entièrement ; Ajouter et Déplacer sont deux démos
distinctes. L’échantillonnage100ms conserve texte, phase, pointeur souris/doigt,
onde, animations et géométrie des panneaux. Les pauses ne sont pas raccourcies.
La tolérance d’observation de durée est250ms ; la cible annoncée reste22–26s.
Le rapport utilise la première observation `finished=true` horodatée dans le
navigateur avec `performance.now()` ; le délai externe de Playwright reste
enregistré séparément. Le pilote FR390/Complètes est isolé. Dans les autres
cellules, les trois niveaux sont joués dans trois contextes simultanés ; ces
conditions de charge accompagnent les mesures de durée et ne démontrent pas,
à elles seules, une cause de régression dans le code.

Trois parcours réels : réglages du groupe, réglages du groupement et essayer
les actions. Le démarrage résout l’identité du parcours dans la diapositive
rendue, indépendamment de l’insertion du chapitreCréer. L’enseignant clique les
champs et Annuler ; aucune sauvegarde de réglages. Le parcours d’action utilise
Ajouter à un groupe en compact et le glisser natif sur bureau, puis sélection
et menu contextuel. Les coches et le message de fin doivent être natifs.

La surbrillance doit rejoindre sa cible avec un écart maximal2px ; les mesures
du centre peint et du chevauchement sont conservées. Les changements de côté
de la checklist sont des observations pour Kevin. Une cible réellement
recouverte n’est pas cliquée avec `force` pour masquer une anomalie.

Le cours et les deux comptes sont synthétiques et supprimés après chaque
supervision. Le rétablissement du premier participant entre cas vérifie le
préfixe de propriété du cours, du compte et les groupes de la fixture. Les
appartenances avant/après sont enregistrées ; aucune requête métier hors du
cours et de l’ajout autorisé ne passe. Aucune complétion du Guide n’est injectée.

Les prérequis de chargement sont séparés des défauts du Guide. Les pilotes
interrompus restent immuables. Le JSON versionné conserve des agrégats et les
chemins des échantillons bruts externes, sans médias ni secrets. Six captures
maximum. Le résultat automatique ne constitue pas l’acceptation visuelle de
Kevin. Aucun changement d’API, de style ou de contrat produit n’est introduit.

Deux sondes ont une limite documentée : le rectangle du parent du pointeur
tactile est nul car le disque enfant est en position absolue ; le successeur
`guide-refonte-pointer-native.spec.js` observe donc le disque peint et sa
distance à la première cible de chaque démo, sans rejouer leur durée entière.
Les échantillons de durée initiaux restent inchangés. Le parcours d’actions
sur bureau utilisait le premier titre de colonne, qui peut être masqué selon
la vue ; le successeur v3 prend le premier titre réellement visible. Les
erreurs de ces sondes ne sont pas présentées comme des défauts produit.

Le relevé de géométrie conserve aussi son oracle initial trop large à768 :
il demandait deux colonnes au conteneur des six spécimens de la première
diapositive. Le contrat source réserve explicitement cette disposition aux
explications `--lesson-reading` et conserve l’anatomie de la première planche
(`_guide-discovery.scss`, section C-G2). Le JSON garde toutes les mesures ;
la synthèse distingue cette exception documentée des leçons en deux colonnes.

La première sonde mesurait le disque peint, mais cherchait ensuite un bouton
Reset absent de la nouvelle scène Créer.
Cette sonde interrompue est exclue ; v2 quitte et rouvre la diapositive par
les pastilles natives. Le successeur v4 des actions reprend uniquement les
cellules ayant perdu le sous-nœud avatar avant le glisser : il utilise le
padding non interactif de la carte native, sans injecter d’événement métier.

Le JSON versionné déduplique les données communes : chaque assertion donne
un `measureRef`, à résoudre dans `measurements`. Les statuts bruts et les
sondes remplacées restent accessibles séparément ; les médias et échantillons
continus volumineux restent dans les répertoires supervisés externes.

Le contrôle C-G3 exige aussi le texte court, au-delà de la simple permutation
CSS des spans : « Exemple » / « Example », conformément au commentaire C-G3
du composant. Le helper v5 du dernier diagnostic compact relève le contenu
et le rectangle du badge FR390 avant de démarrer le parcours. Les cinq autres
cellules390 disposent déjà des textes DOM dans les relevés v4. Le contrôle
ne corrige pas les traductions : `discovery_simulation_short` contient encore
la phrase longue dans les deux langues.

Le format v2 écrit une assertion ou un relevé compact par ligne. Les états
détaillés, ancêtres DOM et erreurs complètes restent dans `full-receipt.json`
externe, lié par SHA256 dans le JSON versionné. Aucun statut ni mesure de
référence n’est recalculé à partir d’une capture pour remplacer un échec.
