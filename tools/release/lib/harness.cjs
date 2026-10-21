'use strict';
/**
 * Harnais commun pour les scripts tools/release qui ont besoin d'une copie de
 * test du pool Moodle 5.1 (:8052, :8054, :8055) ou de la copie de mesure
 * Codex (:8051).
 *
 * Objectif (I16) : arreter de coder le port/la connexion/le verrou en dur
 * dans chaque script (83 scripts lancent leur propre Chromium, 25
 * reecrivent leur propre connexion). Les scripts existants ne sont PAS migres
 * automatiquement par ce lot : seuls les nouveaux scripts et les migrations
 * volontaires appellent ce module.
 *
 * Tout est lu depuis l'environnement, jamais code en dur ici :
 *   EASYSTUD_LEASE_FILE   chemin vers le lease.json de la copie attribuee
 *                          (contient au moins { port, lock } ; lock = dossier
 *                          verrou mkdir, voir moodle51-test-pool)
 *   EASYSTUD_PASSWORD_FILE chemin vers le fichier de mot de passe (jamais en
 *                          dur dans un script ou ce fichier)
 *   EASYSTUD_PORT          port explicite si aucun lease.json n'est utilise
 *                          (doit faire partie de ALLOWED_PORTS)
 *   EASYSTUD_HEADLESS      "0" pour desactiver le headless (jamais en usage
 *                          normal sur ce poste partage) ; headless par defaut
 *
 * Usage :
 *   const {resolveConnection, launch} = require('./lib/harness.cjs');
 *   const conn = resolveConnection();          // { port, baseUrl, lock, owner }
 *   const {browser, context, page} = await launch(playwrightModulePath, conn);
 *   // ... test ...
 *   await browser.close();
 */

const fs = require('node:fs');
const path = require('node:path');

// Ports valides du pool local (voir reference_moodle51_perf_copy /
// reference_moodle51_claude_copy dans la memoire du projet). Codex garde
// 8051 pour ses mesures ; 8052/8054/8055 sont le pool Claude ; 8053 est le
// Moodle 5.3 de compatibilite.
const ALLOWED_PORTS = [8051, 8052, 8053, 8054, 8055];

/**
 * Resout la connexion a utiliser : priorite au lease.json explicite
 * (EASYSTUD_LEASE_FILE), sinon EASYSTUD_PORT seul (pas de verrou verifie
 * dans ce cas, a l'appelant de s'assurer qu'il a le droit d'utiliser ce
 * port).
 */
function resolveConnection(options = {}) {
    const leaseFile = options.leaseFile || process.env.EASYSTUD_LEASE_FILE;
    if (leaseFile) {
        const lease = JSON.parse(fs.readFileSync(path.resolve(leaseFile), 'utf8'));
        if (!ALLOWED_PORTS.includes(lease.port)) {
            throw new Error('harness: port hors pool autorise dans le lease: ' + lease.port);
        }
        if (lease.lock && !fs.existsSync(lease.lock)) {
            throw new Error('harness: verrou absent pour le bail fourni: ' + lease.lock);
        }
        return {
            port: lease.port,
            baseUrl: 'http://localhost:' + lease.port,
            lock: lease.lock || null,
            owner: lease.owner || null,
            passwordFile: options.passwordFile || process.env.EASYSTUD_PASSWORD_FILE || null,
        };
    }

    const envPort = options.port || process.env.EASYSTUD_PORT;
    if (envPort) {
        const port = Number(envPort);
        if (!ALLOWED_PORTS.includes(port)) {
            throw new Error('harness: port hors pool autorise: ' + port);
        }
        return {
            port,
            baseUrl: 'http://localhost:' + port,
            lock: null,
            owner: null,
            passwordFile: options.passwordFile || process.env.EASYSTUD_PASSWORD_FILE || null,
        };
    }

    throw new Error('harness: aucune connexion resolue (ni EASYSTUD_LEASE_FILE, ni EASYSTUD_PORT/--port)');
}

function isHeadless() {
    // Headless par defaut : jamais de fenetre visible sur ce poste partage,
    // sauf desactivation explicite et volontaire (jamais en usage normal).
    return process.env.EASYSTUD_HEADLESS !== '0';
}

/**
 * Lance un navigateur Playwright configure pour ce poste : headless par
 * defaut, fenetre maximisee si une fenetre existe. playwrightModulePath est
 * le chemin vers le module playwright a charger (chaque copie/outillage a
 * son propre node_modules), passe explicitement par l'appelant (jamais
 * suppose).
 */
async function launch(playwrightModulePath, connection, launchOptions = {}) {
    const {chromium} = require(path.resolve(playwrightModulePath));
    const headless = isHeadless();
    const browser = await chromium.launch(Object.assign({
        headless,
        args: headless ? [] : ['--start-maximized'],
    }, launchOptions));
    const context = await browser.newContext(Object.assign(
        headless ? {viewport: {width: 1920, height: 1080}} : {viewport: null},
        launchOptions.contextOptions || {}
    ));
    const page = await context.newPage();
    return {browser, context, page, baseUrl: connection.baseUrl};
}

module.exports = {ALLOWED_PORTS, resolveConnection, isHeadless, launch};
