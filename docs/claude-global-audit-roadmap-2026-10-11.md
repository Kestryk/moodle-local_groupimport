# Lot AUD-CLAUDE-01 — audit global EasyStud et Kit

Demande utilisateur du 11 octobre 2026, ajoutée au programme EED-UI-2026-0073.
Statut : à confier à Claude après un checkpoint stable ; audit non réalisé.
Ce lot ne remplace aucun lot Guide/SM existant ni la checklist humaine différée.

Prompt prêt à transmettre : PROMPT-CLAUDE-GLOBAL-AUDIT-2026-10-11.md.
Ses chemins/SHA doivent être recontrôlés au démarrage réel de l'audit.

## Mission à transmettre

Lire tous les fichiers agent et instructions applicables des projets EasyStud
et UI Kit, ainsi que les contrats Platform référencés. Fournir un inventaire
des fichiers lus et signaler les contradictions ou instructions obsolètes.
Inspecter le code et les preuves disponibles avant de proposer des corrections.

Évaluer :

- Lisibilité, organisation, documentation, duplication et maintenabilité PHP,
  JavaScript/AMD, Mustache et SCSS ; optimisations justifiées par des exemples.
- Architecture du Kit, tokens/recettes/classes publiques, synchronisation et
  frontière entre styles génériques et logique métier du plugin ; détecter les
  surcouches privées, styles inline et exceptions de taille/couleur/espacement.
- Harmonisation graphique : typographie, hiérarchie, couleurs, états, icônes,
  alignements, espacements, responsive, modales, menus, loading et animations.
- Correspondance Kit -> Foundations -> Penpot produit -> preview, en distinguant
  inspection source, design sauvegardé, observation navigateur et validation humaine.
- Performance, accessibilité et risques de régression ; distinguer problèmes
  constatés, hypothèses à mesurer et améliorations facultatives.

## Livraison attendue et limites

Rapport global priorisé avec références fichier/ligne ou composant, preuves,
impact, proposition, effort indicatif et tests de non-régression. Relier chaque
constat aux lots existants pour éviter les doublons, et proposer des lots nouveaux
uniquement quand nécessaire. Préciser ce qui n'a pas pu être vérifié.

Audit en lecture seule, sans modifier code, worktrees, Penpot, caches, rôles,
préférences ou données Moodle. Aucun nettoyage/refactoring/commit automatique.
Réutiliser les checkpoints Source/Kit existants et vérifier HEAD/dirty avant
lecture ; respecter les propriétaires des fenêtres et canaux Penpot. L'accès
navigateur éventuel doit passer par la procédure et le lease appropriés.

Préparer un prompt de passation avec les chemins et SHA exacts au moment de
l'envoi. Le modèle Claude et sa fenêtre seront choisis par l'utilisateur ; ne
pas présenter un sous-agent Codex comme un audit Claude déjà effectué.

Après réception : trier les conclusions, conserver les désaccords argumentés,
intégrer les corrections retenues dans la roadmap puis vérifier leur rendu.
