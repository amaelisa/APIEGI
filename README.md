# Assistant Pédagogique Intelligent — IA-GI

Application web pour le **Génie Informatique** : inscription avec **confirmation par email (Supabase Auth)**, **68 matières** classées L1/L2/L3, chat pédagogique **Gemini 1.5 Flash**, interface dark mode.

## Architecture

```
React (Vite)  →  API FastAPI  →  Supabase PostgreSQL
                    ↑
              Supabase Auth (email + code OTP)
```

- **Base de données** : tables `matieres`, `utilisateurs`, `messages` sur Supabase
- **Authentification** : Supabase envoie un **code par email** à l'inscription ; l'étudiant le saisit dans l'app
- **Matières** : tout étudiant connecté peut consulter **L1, L2 et L3** (onglets dans la sidebar)

## Prérequis

- **Python 3.10 – 3.14**
- **Node.js 18+**
- Projet **Supabase** (plan gratuit)
- **Clé API Gemini** : https://aistudio.google.com/apikey

---

## 1. Configuration Supabase

### Base de données

1. Exécuter `supabase/schema.sql` dans **SQL Editor** (tables + 68 matières).
2. Si la table `utilisateurs` existait déjà : exécuter aussi `supabase/migrations/002_utilisateurs_supabase_auth.sql`.

### Confirmation email (obligatoire)

Dans le dashboard Supabase :

1. **Authentication** → **Providers** → **Email** → activer **Confirm email**
2. **Authentication** → **Email Templates** : vérifier le template de confirmation
3. Pour un **code à 6 chiffres** : **Authentication** → **Settings** → activer l'OTP email si proposé (sinon le lien de confirmation fonctionne aussi ; l'app attend un code via `verifyOtp`)

### Clés à copier

| Variable | Où la trouver |
|----------|----------------|
| `DATABASE_URL` | Connect → Session pooler → URI |
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Project Settings → API → **anon public** (obligatoire pour l'email) |

**Script automatique** (base + RLS) :

```powershell
.\venv\Scripts\python.exe scripts\complete_supabase_setup.py
```

**Assistant configuration** (ouvre le dashboard + enregistre la clé anon) :

```text
Configurer-Supabase.bat
```

---

## 2. Fichiers `.env`

### Racine du projet (`.env`)

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://gncrhhwiysqianavmpha.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...   # cle anon public
GEMINI_API_KEY=...
JWT_SECRET_KEY=...
```

L'authentification email passe par **l'API backend** (pas besoin de clés dans `frontend/.env`).
`frontend/.env` : seulement `VITE_API_URL=` (vide en local).

---

## 3. Installation

```powershell
cd "C:\Users\ama_pc\OneDrive\Desktop\ASSISTANT PEDAGOGIQUE"
.\venv\Scripts\pip.exe install -r requirements.txt
cd frontend
npm install
```

---

## 4. Lancer l'application

Voir **`docs/LANCER-L-APPLICATION.md`** ou dans VS Code : tâche **Lancer tout (Backend + Frontend)**.

**Backend :**

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend :**

```powershell
cd frontend
npm run dev
```

- App : http://127.0.0.1:5173  
- API : http://127.0.0.1:8000/docs  

---

## 5. Parcours utilisateur

1. **Inscription** : nom, email, mot de passe (sans choix de niveau)
2. **Email** : réception d'un code / lien Supabase
3. **Saisie du code** à 6 chiffres sur l'écran de confirmation
4. **Connexion** puis accès au chat
5. **Onglets L1 / L2 / L3** : toutes les matières du niveau choisi

---

## 6. Fonctionnalités

- Auth Supabase + profil synchronisé en base (`/api/auth/sync`)
- 68 matières officielles GI
- Chat Gemini avec guardrails (hors-sujet, salutations)
- UI dark mode, sidebar responsive

---

## 7. Déploiement (à venir)

- **GitHub** : code source
- **Vercel** : frontend (`frontend/`)
- **Render** (ou similaire) : API FastAPI + variables d'environnement Supabase

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Matières vides | Backend démarré ? Connecté ? Vérifier http://127.0.0.1:8000/docs → GET `/api/matieres?niveau=L1` |
| `Profil non synchronisé` | Se reconnecter après confirmation ; vérifier `SUPABASE_ANON_KEY` |
| `SUPABASE_ANON_KEY manquant` | Lancer `Configurer-Supabase.bat` ou copier la clé anon dans `.env` |
| Pas de code email | Vérifier spam ; activer Confirm email dans Supabase |
| Port 8000 occupé | `netstat -ano \| findstr :8000` puis `taskkill /F /PID ...` |

---

## Scripts

- `start-backend.bat` / `start-frontend.bat`
- `python seed.py` — réinsère les matières (si table vide)
