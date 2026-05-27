# Supabase + GitHub + Vercel — Guide gratuit

Ce guide accompagne la migration de **MySQL (XAMPP)** vers **Supabase (PostgreSQL)** pour l’Assistant Pédagogique IA-GI.

---

## Étape 1 — Créer votre compte Supabase (gratuit)

1. Ouvrez **https://supabase.com** et cliquez sur **Start your project**.
2. Connectez-vous avec **GitHub** (recommandé — utile pour la suite) ou Google / e-mail.
3. Aucune carte bancaire n’est demandée sur le plan **Free**.

---

## Étape 2 — Créer le projet base de données

1. Dans le dashboard : **New project**.
2. Renseignez :
   - **Name** : `assistant-pedagogique` (ou autre)
   - **Database Password** : générez un mot de passe **fort** et **sauvegardez-le** (Bloc-notes, gestionnaire de mots de passe).
   - **Region** : choisissez la plus proche (ex. `West EU (Paris)` si disponible, sinon `Central EU`).
3. Plan : laissez **Free** — ne passez pas à Pro.
4. Cliquez **Create new project** (attendre 1–2 minutes).

---

## Étape 3 — Créer toutes les tables + les 68 matières

1. Menu gauche : **SQL Editor** → **New query**.
2. Ouvrez le fichier du projet : `supabase/schema.sql`.
3. Copiez **tout** le contenu, collez dans l’éditeur Supabase, puis **Run**.
4. Vérifiez en bas : vous devez voir **68 lignes** réparties L1 / L2 / L3.

Alternative : **Table Editor** → vous verrez `matieres`, `utilisateurs`, `messages`.

---

## Étape 4 — Récupérer l’URL de connexion (pour le backend)

1. **Project Settings** (engrenage) → **Database**.
2. Section **Connection string** → onglet **URI**.
3. Choisissez **Session mode** (recommandé pour SQLAlchemy).
4. Copiez l’URL du type :

```
postgresql://postgres.[ref]:[MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

5. Remplacez `[MOT_DE_PASSE]` par le mot de passe de l’étape 2.

Dans votre `.env` local (on adaptera le code ensuite) :

```env
DATABASE_URL=postgresql://postgres.xxxx:VOTRE_MOT_DE_PASSE@....pooler.supabase.com:5432/postgres
```

**Important** : ne commitez **jamais** le `.env` sur GitHub. Seul `.env.example` sans secrets.

Clés utiles (Settings → **API**) :
- **anon key** : frontend / accès public limité
- **service_role key** : backend uniquement — **secrète**, jamais dans le navigateur

Pour notre app, l’auth JWT reste dans **FastAPI** ; Supabase sert surtout de **base PostgreSQL hébergée**.

---

## Plan gratuit Supabase — ce qu’il faut savoir (0 €)

| Ressource | Limite gratuite | Suffisant pour ce projet ? |
|-----------|-----------------|----------------------------|
| Prix | **0 € / mois** | Oui |
| Projets actifs | **2 max** par organisation | Oui (1 prod + 1 dev possible) |
| Taille base | **500 Mo** | Oui largement (texte + users) |
| Bande passante (egress) | **5 Go / mois** | Oui pour un usage étudiant / démo |
| Utilisateurs actifs (Auth Supabase) | 50 000 / mois | N/A si vous gardez JWT FastAPI |
| Stockage fichiers | **1 Go** | Oui si pas d’upload massif |
| Requêtes API | **Illimitées** | Oui |
| Sauvegardes | Quotidiennes, **7 jours** | OK pour projet scolaire |
| Inactivité | Projet **mis en pause après 7 jours** sans activité | Relance en 1 clic dans le dashboard |

### Ce qui peut vous poser problème (sans payer)

- Projet **en pause** : ouvrez le dashboard → **Restore project** (gratuit).
- Dépassement des quotas : e-mail d’avertissement, puis restrictions — peu probable pour ce chat.
- **Carte bancaire** : non requise tant que vous restez sur **Free** et n’upgradez pas.

Documentation officielle : https://supabase.com/pricing

---

## Utilisation de Supabase pour **notre** projet

| Fonction Supabase | On l’utilise ? |
|-------------------|----------------|
| PostgreSQL hébergé | **Oui** — tables `utilisateurs`, `matieres`, `messages` |
| SQL Editor | **Oui** — exécuter `schema.sql` |
| Supabase Auth | **Non** pour l’instant — JWT reste côté FastAPI |
| Storage (fichiers) | **Non** pour l’instant |
| Realtime | **Non** pour l’instant |

Flux : **React (Vercel)** → **API FastAPI** → **Supabase PostgreSQL**

---

## Étape 5 — GitHub (préparer le dépôt)

1. Compte **https://github.com** (gratuit).
2. **New repository** → nom ex. `assistant-pedagogique-ia-gi` → **Private** recommandé.
3. Sur votre PC (PowerShell, racine du projet) :

```powershell
git init
git add .
git commit -m "Initial commit - Assistant Pedagogique IA-GI"
git branch -M main
git remote add origin https://github.com/VOTRE_USER/VOTRE_REPO.git
git push -u origin main
```

Vérifiez que `.gitignore` exclut : `.env`, `venv/`, `node_modules/`, `*.db`.

---

## Étape 6 — Vercel (frontend)

1. **https://vercel.com** → connexion avec **GitHub**.
2. **Add New Project** → importez votre repo.
3. **Root Directory** : `frontend`
4. Variables d’environnement :
   - `VITE_API_URL` = URL de votre API backend en production (voir ci-dessous)

Build : `npm run build` — Output : `dist`

Plan gratuit Vercel : correct pour le frontend React.

---

## Backend FastAPI — où l’héberger ?

**Vercel** convient surtout au **frontend**. L’API Python FastAPI a besoin d’un autre hébergeur gratuit courant :

| Service | Gratuit | Note |
|---------|---------|------|
| **Render** | Oui (tier free) | Simple pour FastAPI + variables d’env |
| **Railway** | Crédit limité gratuit | Bon pour démo |
| **Fly.io** | Petit quota gratuit | Un peu plus technique |

Sur l’hébergeur API, définissez :
- `DATABASE_URL` (Supabase)
- `JWT_SECRET_KEY`
- `GEMINI_API_KEY`

Puis mettez à jour `VITE_API_URL` sur Vercel avec l’URL Render/Railway.

*(On pourra configurer Render ensemble à l’étape suivante.)*

---

## Checklist — dites-moi quand c’est fait

- [ ] Compte Supabase créé
- [ ] Projet `assistant-pedagogique` créé (plan Free)
- [ ] `schema.sql` exécuté → 68 matières visibles
- [ ] `DATABASE_URL` copiée dans un fichier local sécurisé (pas sur GitHub)
- [ ] (Optionnel) Repo GitHub créé

Quand vous avez fini l’**étape 3**, envoyez-moi (en message privé si besoin) :
- que les tables sont OK,
- et confirmez que vous avez la `DATABASE_URL` — **sans coller le mot de passe ici** si vous préférez.

Je modifierai alors le code Python (`database.py`, `config`, `requirements`) pour PostgreSQL + Supabase et on enchaînera GitHub + déploiement.
