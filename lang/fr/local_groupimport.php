<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Chaînes de langue françaises pour Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Import de groupes (CSV)';
$string['groupimport'] = 'Import de groupes (CSV)';

// Modèle et import de fichier.
$string['downloadtemplate'] = 'Télécharger le modèle CSV';
$string['importfile'] = 'Fichier d’import (CSV)';
$string['importfile_help'] = 'Importez un fichier CSV avec les colonnes : useridentifier;groupname;groupingname (groupingname est optionnel). Le séparateur peut être ";" ou ",". La colonne "useridentifier" est interprétée selon le champ d’identification choisi dans le formulaire (username, email, idnumber ou champ de profil personnalisé).';

// Boutons et sections.
$string['submitimport'] = 'Lancer l’import';
$string['importresults'] = 'Résultats de l’import';
$string['importsummary'] = 'Résumé de l’import';

// Messages de résultats.
$string['successheader'] = 'Lignes traitées avec succès';
$string['errorheader'] = 'Lignes en erreur';
$string['noresults'] = 'Aucun résultat à afficher pour le moment. Téléversez un fichier CSV pour lancer l’import.';

// Messages d’erreur.
$string['csvmissingcolumns'] = 'Le CSV ne contient pas toutes les colonnes requises : useridentifier, groupname (et éventuellement groupingname).';
$string['csvloaderror'] = 'Erreur lors de la lecture du fichier CSV : {$a}.';
$string['csvempty'] = 'Le fichier CSV est vide.';
$string['csvinvalidrowmissing'] = 'Ligne invalide : identifiant utilisateur ou nom du groupe manquant.';
$string['usernotfound'] = "Utilisateur '{$a}' introuvable.";
$string['usernotenrolled'] = "L'utilisateur '{$a}' n'est pas inscrit à ce cours.";
$string['usermultiplematches'] = "Plusieurs utilisateurs correspondent à '{$a->identifier}' pour le champ '{$a->field}'.";
$string['groupcreatefailed'] = "Impossible de créer le groupe '{$a->groupname}' pour l'utilisateur '{$a->identifier}'.";
$string['groupingcreatefailed'] = "Impossible de créer le groupement '{$a->groupingname}' pour le groupe '{$a->groupname}'.";
$string['useralreadyingroup'] = "L'utilisateur '{$a->identifier}' est déjà membre du groupe '{$a->groupname}'.";
$string['useraddedtogroup'] = "L'utilisateur '{$a->identifier}' a été ajouté au groupe '{$a->groupname}'.";

// Nom du fichier modèle.
$string['templatename'] = 'modele_import_groupes.csv';

// Navigation.
$string['backtocourse'] = 'Retour au cours';

// Confidentialité.
$string['privacy:metadata'] = 'Le plugin Local Group Import ne stocke aucune donnée personnelle. Il traite uniquement des informations d’inscription existantes au cours.';


// Catégorie : Paramètres d’administration.


// Champs d’identification autorisés.
$string['alloweduserfields'] = 'Champs utilisables pour identifier les utilisateurs';
$string['alloweduserfields_desc'] = 'Sélectionnez les champs pouvant être utilisés pour identifier les apprenants dans les fichiers CSV (username, email, idnumber ou champs de profil personnalisés).';

// Champ d’identification par défaut.
$string['defaultuserfield'] = 'Champ d’identification par défaut';
$string['defaultuserfield_desc'] = 'Ce champ sera présélectionné dans le formulaire d’import. Il doit faire partie des champs autorisés définis ci-dessus.';


// Catégorie : Formulaire : champ d’identification.


$string['userfield'] = 'Champ d’identification des utilisateurs';
$string['userfield_help'] = 'Cette option précise comment interpréter la colonne "useridentifier" du fichier CSV : par exemple comme un username, une adresse email, un idnumber, ou la valeur d’un champ de profil personnalisé.';


// Catégorie : sVisites guidées.


$string['tour_groupimport_teacher_name'] = 'Guide : Import de groupes (enseignants)';
$string['tour_groupimport_teacher_desc'] = 'Visite guidée pour importer des groupes et des inscriptions depuis un fichier CSV, avec contrôle d’existence des utilisateurs et d’inscription au cours.';

$string['tour_groupimport_step1_title'] = 'Importer des groupes depuis un CSV';
$string['tour_groupimport_step1_content'] = 'Cette page vous permet de créer des groupes et d’y inscrire des étudiants à partir d’un fichier CSV. Les utilisateurs inexistants ou non inscrits au cours ne seront pas ajoutés, et l’import continue même en cas d’erreurs.';

$string['tour_groupimport_step2_title'] = 'Télécharger le modèle CSV';
$string['tour_groupimport_step2_content'] = 'Commencez par télécharger le modèle afin de respecter les colonnes attendues (useridentifier, groupname et éventuellement groupingname).';

$string['tour_groupimport_step3_title'] = 'Téléverser votre fichier CSV';
$string['tour_groupimport_step3_content'] = 'Sélectionnez ensuite votre fichier CSV. Les séparateurs ";" et "," sont acceptés.';

$string['tour_groupimport_step4_title'] = 'Choisir le champ d’identification';
$string['tour_groupimport_step4_content'] = 'Choisissez comment identifier les utilisateurs (username, email, idnumber ou champ de profil personnalisé).';

$string['tour_groupimport_step5_title'] = 'Lancer l’import';
$string['tour_groupimport_step5_content'] = 'Cliquez sur le bouton pour démarrer l’import. Les inscriptions réussies et les erreurs seront listées dans le compte-rendu.';

$string['tour_groupimport_step6_title'] = 'Lire le compte-rendu';
$string['tour_groupimport_step6_content'] = 'Le compte-rendu détaille les inscriptions effectuées et les erreurs (utilisateur introuvable, non inscrit au cours, déjà membre du groupe, etc.).';

$string['tour_groupimport_coursehome_name'] = 'Astuce : trouver l’import de groupes dans le menu Plus';
$string['tour_groupimport_coursehome_desc'] = 'Sur la page d’accueil du cours, indique où trouver l’entrée d’import de groupes.';
$string['tour_groupimport_coursehome_step1_title'] = 'Où trouver l’import de groupes ?';
$string['tour_groupimport_coursehome_step1_content'] = 'Dans la navigation en haut du cours, ouvrez le menu « Plus ». Vous y trouverez l’entrée « Import de groupes » pour accéder à l’outil.';
