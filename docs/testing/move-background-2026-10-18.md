# MOVE-BG / K18-24 et note K18-25

Base : `d241e83a`. Branche : `work/codex1/easystud-move-bg-20261018`.
**Candidat non publiable en l’état : numéro de mise à niveau demandé, non reçu ; critère HTTP global < 2 s non atteint sur la copie test.**

## Implémentation

- Jusqu’à 500 appartenances : service natif et transaction directe conservés. Au-delà : tâche adhoc Moodle `background_move`, progression durable et transactions natives de 500 appartenances. Le curseur et les mutations de chaque lot sont validés ensemble.
- Validation du cours, des droits, inscriptions, origines, destination et restrictions des appartenances gérées avant mise en file ; contrôles natifs rejoués par lot sous l’identité de l’auteur. Plafond configurable existant de Mass Import réutilisé.
- Token d’action unique et empreinte de la sélection ; une requête répétée ne crée pas de deuxième travail. État et progression visibles uniquement à l’auteur autorisé dans le cours. Une sélection JSON évite `max_input_vars` sans changer les anciennes requêtes directes.
- Une panne annule le lot courant, conserve les lots précédents, expose l’état de reprise et laisse Moodle réessayer la tâche. La notification native de fin est enregistrée une seule fois. Les erreurs des processeurs après commit ne tentent pas de rollback d’une transaction déjà terminée.
- Le suivi ne passe pas par le gestionnaire d’action bloquante et ne recharge pas l’état du cours à chaque sondage. Il restaure les travaux actifs après une visite et rafraîchit le cours à la fin. Bandeau `easyedu-notice`, région `status`, aucun nouveau style ou gabarit.
- Privacy : export limité au sujet ; effacement d’un travail contenant ce sujet sous le même verrou que le worker ; conservation selon le réglage existant d’historique. Un effacement ne modifie pas les appartenances Moodle déjà validées.
- K18-25 : texte FR/EN du devoir restreint au groupement corrigé. Le Guide et le Kit reçoivent cette valeur depuis `lang/` : aucune copie du texte en dur dans le miroir ou le Kit canonique, aucune modification concurrente du gabarit GMI-C2.

## Migration requise avant intégration

`db/install.xml` décrit `local_groupimport_moves`, et `db/messages.php` déclare `movecomplete`.
`version.php` et `db/upgrade.php` restent volontairement inchangés : ne pas intégrer avant attribution du numéro par Claude/Kevin et ajout de l’étape XMLDB correspondante. L’incrément permettra aussi à Moodle de mettre à jour les fournisseurs de notification et leurs préférences.
La recette a créé puis supprimé ce schéma temporaire sous bail ; elle ne constitue pas une recette d’installation/mise à niveau.

## Contrôles statiques

- Huit cas isolés : annulation du lot courant, curseur à 500, reprise à 800, absence de double mutation, droits révoqués, projection des personnes, échec de processeur après commit, absence de double notification.
- Privacy : 49 assertions ; porte isolée de livraison : 13 contrôles ; escaping, moteur de filtres et transfert natif isolé passent.
- PHP lint et MoodleCS : zéro erreur sur les fichiers touchés ; huit avertissements de garde `MOODLE_INTERNAL` dans les doubles sans effets de bord, conservés pour leur confinement.
- Autres fichiers : contrôles officiels `local_codechecker` sans runtime, zéro erreur et zéro avertissement. ESLint du module : 1 erreur et 7 avertissements hérités, sans augmentation.
- Builds SM et CM : Node 22.11.0. Seuls les deux fichiers générés du module `move_modal` ont un diff de contenu.
- Guide/Kit : T037 (17), T038 (49), aller-retour du miroir PASS avec le Kit `5085c6b` ; aucun changement de valeur visuelle.

## Recette native isolée sur :8051

Preuves : `C:/dev/artifacts/move-bg-20261018/native-v7.json` et `http-profile-result.json`, phases dans `http-phases.jsonl`.
Session Moodle réelle par Playwright `APIRequestContext`, pas de simulation de l’API métier ; worker natif exécuté manuellement, pas découverte par cron d’une installation mise à niveau. Jeu synthétique de 3 000 comptes, cours dédié, tâche et fournisseur temporaires ; données, schéma, préférences, notifications, route et bail restitués.

| Appartenances | Voie | HTTP | Worker | Résultat |
|---|---|---:|---:|---|
| 400 | directe | 23,703 s | — | 400 à destination, 2 600 à l’origine |
| 800 | adhoc | 11,820 s | 39,088 s | 800 à destination, notification ; doublon coalescé |
| 3 000 | adhoc | 4,640 s | 218,737 s | 3 000 à destination, notification ; doublon coalescé |

Pic mémoire des workers : 40 Mio. Équivalence des appartenances et idempotence PASS. **Temps web < 2 s : FAIL.**
Un second passage instrumenté, sans exécuter les mutations : lecture de statut 3,992 s, mise en file de 3 000 membres 3,563 s. Le bootstrap Moodle termine à 3,399 s ; accès à 3,415 s ; validation complète à 3,458 s ; queue/commit à 3,528 s ; réponse à 3,531 s. Le travail propre à l’envoi en tâche prend environ 0,113 s après les contrôles d’accès. Aucune configuration du serveur n’a été modifiée pour masquer le délai.

## Limites de recette à reprendre

- Migration numérotée, installation et vrai lancement par cron, puis validation native Moodle 4.5.
- FR/EN dans l’interface, progression visible aux deux largeurs, zéro erreur console : non certifiés par le test API. Les essais navigateur antérieurs ne valent pas cette matrice (un passage interrompu par `ERR_NETWORK_IO_SUSPENDED`).
- Seuil HTTP global à remesurer sur un runtime dont le bootstrap tient sous 2 s.
- Validation humaine du bandeau Kit et report Penpot : état en cours / reprise / terminé, aucune variante nouvelle.

Les échecs antérieurs et leurs nettoyages sont conservés : v4 (préférences de notification manquantes dans le harnais), v5 (courriel local invalide et cleanup TEXT réconcilié), v6 (réseau Chrome suspendu). Leurs preuves ne sont pas remplacées par des PASS.
