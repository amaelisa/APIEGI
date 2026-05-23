# Confirmation email Supabase — configuration

## Déjà fait automatiquement (via `DATABASE_URL`)

- Migration `supabase_id` sur `utilisateurs`
- 68 matières en base
- Politiques RLS lecture matières
- `SUPABASE_URL` dans `.env`
- Auth email gérée par **l'API FastAPI** (pas le navigateur)

## Une seule action manuelle (dashboard)

Je n'ai pas accès à votre compte Supabase sans connexion. Il reste **une clé** à copier :

1. Double-cliquez **`Configurer-Supabase.bat`** à la racine du projet
2. Connectez-vous à Supabase si demandé
3. Copiez la clé **anon public** (Settings → API)
4. Collez-la dans la fenêtre du script

Ou ajoutez dans `.env` :

```env
SUPABASE_ANON_KEY=eyJ...
```

Puis :

```powershell
.\venv\Scripts\python.exe scripts\complete_supabase_setup.py
```

## Activer la confirmation email (dashboard)

1. https://supabase.com/dashboard/project/gncrhhwiysqianavmpha/auth/providers
2. **Email** → activer **Confirm email**
3. Sauvegarder

## Option avancée (100 % script)

Créez un token : https://supabase.com/dashboard/account/tokens

Dans `.env` :

```env
SUPABASE_ACCESS_TOKEN=sbp_...
```

Relancez `scripts/complete_supabase_setup.py` → récupère la clé anon et active la confirmation email via l'API.
