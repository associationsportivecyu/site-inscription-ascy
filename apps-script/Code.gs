/**
 * Inscriptions AS CY — compétitions universitaires FFSU
 * Site Google Apps Script relié à une Google Sheet.
 * La liste des inscrits est dans l'onglet « Inscriptions » de la Sheet (visible par toi seul).
 */

// ====== À PERSONNALISER ======
const HELLOASSO_URL = 'https://www.helloasso.com/associations/as-cy-cergy-paris-universite/evenements/cotisation-as-cy-2026-2027';

const SPORTS = [
  { categorie: 'Sports collectifs', sports: ['Basketball F', 'Basketball M', 'Football F', 'Football M', 'Futsal', 'Rugby', 'Volleyball F', 'Volleyball M', 'Handball F', 'Handball M'] },
  { categorie: 'Sports de combat', sports: ['Escrime', 'Judo', 'Pancrace', 'Kickboxing', 'Boxe anglaise', 'Lutte', 'Taekwondo', 'Karaté'] },
  { categorie: 'Sports de raquettes', sports: ['Badminton', 'Tennis', 'Tennis de table', 'Squash'] },
  { categorie: 'Sports athlétiques', sports: ['Athlétisme indoor', 'Athlétisme estival', 'Cross'] },
  { categorie: 'Sports de pleine nature', sports: ['Escalade', 'Golf', 'Course d\'orientation', 'Run and Bike'] },
  { categorie: 'Sport aquatique', sports: ['Natation'] },
  { categorie: 'Activité de la forme', sports: ['Force athlétique'] }
];
// =============================

const FEUILLE = 'Inscriptions';
const COL_CLE = 7;

function doGet() {
  const t = HtmlService.createTemplateFromFile('Index');
  t.helloasso = HELLOASSO_URL;
  t.categories = SPORTS;
  return t.evaluate()
    .setTitle('Inscription AS CY')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Appelée par la page hébergée sur GitHub Pages (requête POST en JSON). */
function doPost(e) {
  let reponse;
  try {
    reponse = inscrire(JSON.parse(e.postData.contents));
  } catch (err) {
    reponse = { ok: false, erreur: 'Requête invalide.' };
  }
  return ContentService.createTextOutput(JSON.stringify(reponse))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Appelée par le formulaire. */
function inscrire(form) {
  form = form || {};
  const nom = nettoyer_(form.nom);
  const prenom = nettoyer_(form.prenom);
  const paye = form.paye === 'oui';

  if (!nom || !prenom) {
    return { ok: false, erreur: 'Indique ton nom et ton prénom.' };
  }
  if (!/^[\p{L}][\p{L}' -]*$/u.test(nom) || !/^[\p{L}][\p{L}' -]*$/u.test(prenom)) {
    return { ok: false, erreur: 'Le nom et le prénom ne peuvent contenir que des lettres, des espaces, des tirets ou des apostrophes.' };
  }

  const autorises = [].concat.apply([], SPORTS.map(function (c) { return c.sports; }));
  const choisis = (Array.isArray(form.sports) ? form.sports : []).filter(function (s) {
    return autorises.indexOf(s) !== -1;
  });
  if (choisis.length === 0) {
    return { ok: false, erreur: 'Choisis au moins un sport.' };
  }
  if (form.paye !== 'oui' && form.paye !== 'non') {
    return { ok: false, erreur: 'Indique si tu as payé ta cotisation.' };
  }

  const cle = normaliser_(prenom) + '|' + normaliser_(nom);
  const cleInversee = normaliser_(nom) + '|' + normaliser_(prenom);

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = feuille_();
    const derniere = sh.getLastRow();
    if (derniere > 1) {
      const cles = sh.getRange(2, COL_CLE, derniere - 1, 1).getValues().map(function (r) { return r[0]; });
      if (cles.indexOf(cle) !== -1 || cles.indexOf(cleInversee) !== -1) {
        return {
          ok: false,
          doublon: true,
          erreur: prenom + ' ' + nom.toUpperCase() + ' est déjà inscrit(e). On ne peut s\'inscrire qu\'une seule fois. Pour modifier tes sports, contacte l\'AS.'
        };
      }
    }
    sh.appendRow([
      new Date(),
      nom.toUpperCase(),
      prenom,
      prenom + ' ' + nom.toUpperCase(),
      choisis.join(', '),
      paye ? 'Oui' : 'Non',
      cle
    ]);
    return { ok: true, paye: paye, prenom: prenom, sports: choisis };
  } finally {
    lock.releaseLock();
  }
}

/** Crée l'onglet au premier usage. */
function feuille_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(FEUILLE);
  if (!sh) {
    sh = ss.insertSheet(FEUILLE);
    sh.appendRow(['Date', 'Nom', 'Prénom', 'Nom complet', 'Sports', 'Cotisation payée (déclarée)', 'Clé (ne pas modifier)']);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COL_CLE).setFontWeight('bold');
    sh.hideColumns(COL_CLE);
  }
  return sh;
}

function nettoyer_(s) {
  return String(s || '').trim().replace(/\s+/g, ' ').slice(0, 60);
}

/** « Jean-Marc », « jean marc », « JÉAN MARC » → « jeanmarc » */
function normaliser_(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
}
