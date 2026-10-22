# K16-15 — sélection et focus dans la fiche groupe, 17 octobre 2026

Branche `work/codex1/easystud-k16-15-fixes-20261017`, base74323514. Source produit modifiée : **amd/src/local/cm/advanced_settings.js uniquement**, plus son AMD et sa map régénérés. Aucun SCSS, classe, template, chaîne ni composant visuel changé ; entity_dialog.js n'a pas besoin de modification.

## Diagnostic et correction

En compact, le menu de la carte sélectionne le groupe. Le handler de case membre refusait ensuite la sélection car getActiveSelectionType renvoyait group, incompatible avec member. Traces natives : input/change se déclenchent, modèle utilisateur chargé, sélection active group ; ce n'est pas une cible tactile inerte. L'action explicite sur la case commence désormais la sélection des membres en appelant **clearSelectionState**, puis la même autorité **setItemSelected** et updateSelectionActions. Une sélection de membres compatible est conservée ; aucun second modèle de sélection n'est ajouté.

Après suppression, la ligne qui détient le focus disparaît. Le handler clavier de la fiche n'est alors plus dans la chaîne de propagation de la touche Échap. Le focus revient au bouton Fermer existant quand la suppression a fait tomber le focus sur body. Le remplacement différé de la section membres préserve aussi le focus dans la fiche s'il détenait un contrôle de cette section. La garde is-closing empêche de reprendre le focus pendant la fermeture ; aucun listener global ajouté et aucun changement de Motion/commande métier.

## Preuves

Le scénario source est `tools/playwright/v2-entity-member-native.spec.js` de Codex n°2. Le successeur versionné garde ses six oracles FR/EN ×1600/768/390, et ajoute le toucher réel, une assertion de focus dans la fiche avant Échap, le contrôle de la réponse native et l'absence réelle de l'adhésion. Aucun force-click ni simulation de suppression.

Copie8052 acquise par mkdir atomique du premier verrou libre ; contenus d'origine sauvegardés. Fixture : groupe isolé nommé codex1-k16-15 dans le cours71, avec un utilisateur déjà inscrit ; une adhésion retirée par la vraie commande et rétablie entre les cas. Le nettoyage final supprime uniquement ce groupe et compare toutes les adhésions originales de cet utilisateur. Le formulaire, les traductions, l'état ready et les listes sont natifs ; la bulle d'accueil est neutralisée via le cycle public du Guide, sans CSS.

La recette avant correction reproduit les six échecs : focus perdu à1600, cases refusées à768/390 en FR/EN. Le diagnostic instrumenté du modèle est conservé séparément ; le candidat utilise le scénario non instrumenté, inchangé pendant son exécution. Résultat final : **6/6 PASS**, FR/EN ×1600/768/390, clic et toucher ; focus sur le Fermer stable avant Échap ; réponse métier success et adhésion absente confirmées. **0 erreur console, 0 exception navigateur**. Détail par cas dans le JSON joint. Le groupe de fixture est supprimé et toutes les adhésions originales sont restaurées. La copie de fichiers d’origine est restaurée byte à byte, puis caches purgés et verrou libéré (preuve externe).

Tests : escaping, moteur de filtres, focus modal et sélection de groupe replié PASS. Nouveau test VM exécute les vrais handlers de membre : choix incompatible, choix compatible sans effacer ses pairs, retrait final et garde de fermeture PASS. php-l fixture PASS. SM/CM AMD PASS ; seul AMD advanced_settings et sa map ont un vrai diff. Pas de build CSS requis.

ESLint sur le même nom de fichier/config Moodle, entrées normalisées LF :5erreurs/3avertissements avant et après, aucune hausse. Le comptage brut de la sortie de travail CRLF donne1108erreurs contre5pour le blob Git LF :1103fins de ligne, pas de nouveau diagnostic de logique. Les bytes hérités du fichier sont conservés, y compris un octet de ponctuation déjà non UTF-8 ; aucune conversion globale cachée.

Éléments concernés : fiche groupe, ligne membre/case Kit et Fermer existants ; états sélection/retrait final/rafraîchissement, largeurs1600/768/390, FR/EN. Aucune évolution visuelle à reporter dans Penpot. Aucune publication sur localhost:80 ; Claude intègre/publie après revue.

Les six erreurs MoodleCS sont documentées dans PRE-AUDIT-CODECHECKER-2026-10-17.md sans correction de politique. Le plan Kit est KIT-SYNC-PLAN-2026-10-17.md : aucune écriture sur main. Preuves détaillées et manifestes : <workspace>/artifacts/k16-15-fixes-20261017/ et <workspace>/artifacts/kit-sync-plan-20261017/.
