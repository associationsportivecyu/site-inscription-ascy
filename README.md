# Inscriptions AS CY

Site d'inscription aux compétitions universitaires de l'AS CY (CY Cergy Paris Université).

- **`index.html`** : la page publiée avec GitHub Pages.
- **`apps-script/`** : le code Google Apps Script qui enregistre les inscriptions dans une Google Sheet.

## Fonctionnement

1. L'étudiant renseigne son prénom, son nom, ses sports et indique s'il a payé sa cotisation.
2. L'inscription est enregistrée dans l'onglet **Inscriptions** de la Google Sheet.
3. Une personne ne peut s'inscrire qu'une seule fois (contrôle sur le nom, sans tenir compte des accents ni des majuscules).
4. S'il n'a pas payé sa cotisation, l'étudiant est redirigé vers HelloAsso.

## Mise en place

1. Crée une Google Sheet, puis va dans **Extensions → Apps Script**.
2. Colle `apps-script/Code.gs` dans `Code.gs`, puis ajoute un fichier HTML nommé `Index` avec le contenu de `apps-script/Index.html`.
3. Va dans **Déployer → Nouveau déploiement → Application Web**, avec « Exécuter en tant que : Moi » et « Accès : Tout le monde ».
4. Copie l'URL obtenue (`https://script.google.com/macros/s/.../exec`) dans `index.html`, à la ligne `APPS_SCRIPT_URL`.
5. Sur GitHub, va dans **Settings → Pages → Deploy from a branch → main / (root)**.

Après toute modification de `Code.gs`, va dans **Déployer → Gérer les déploiements → Modifier → Nouvelle version**. L'URL reste la même.
