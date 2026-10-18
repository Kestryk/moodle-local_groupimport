# Candidats K16-80 sur ac80d103

Ces recettes de mesures natives sont conservées comme candidats CI, pas comme
tests exécutables en l’état. Chaque JSON contient les sources par lignes ; leur
concaténation reconstitue exactement la version paramétrée et son SHA-256.
Seuls les chemins de machine et les fins de ligne sont normalisés. Aucune
assertion métier, mesure ou tolérance n’est modifiée. Les preuves complètes et
les prédécesseurs échoués restent hors Git ; aucun média ni secret n’est inclus.

Avant adoption : brancher le runner authentifié partagé, les credentials locaux
process-only, les baux runtime/fixture et un répertoire d’artefacts externe.
Découvrir un seul cas avant tout accès. Ne jamais prendre localhost:80 par défaut.
Conserver les locales, largeurs, attentes de vrais états, mesures et finally de
restauration. Une adaptation Docker/CI nécessite une nouvelle recette dédiée.
