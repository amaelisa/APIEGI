# Comment lancer l'application

## URLs

| Service | URL |
|---------|-----|
| Application (interface) | http://127.0.0.1:5173 |
| API + documentation | http://127.0.0.1:8000/docs |
| Santé API | http://127.0.0.1:8000/health |

---

## Méthode 1 — VS Code / Cursor (recommandé)

### Option A — Tâches (2 terminaux automatiques)

1. Ouvrez le dossier du projet dans VS Code.
2. Menu **Terminal** → **Exécuter la tâche…** (ou `Ctrl+Shift+P` → `Tasks: Run Task`)
3. Choisissez **Lancer tout (Backend + Frontend)**.

### Option B — Débogage

1. Onglet **Exécuter et déboguer** (`Ctrl+Shift+D`)
2. Liste déroulante : **Application complète**
3. **F5**

### Option C — Un seul service

Tâches disponibles :
- **Backend: API FastAPI**
- **Frontend: Vite React**
- **Tester connexion Supabase**

---

## Méthode 2 — Fichiers `.bat` (double-clic)

Depuis l’Explorateur Windows :

- `start-backend.bat` — API sur le port 8000
- `start-frontend.bat` — interface sur le port 5173

---

## Méthode 3 — Terminal PowerShell (sans `activate`)

PowerShell bloque souvent `Activate.ps1`. Utilisez directement le Python du venv :

**Terminal 1 — Backend :**

```powershell
cd "C:\Users\ama_pc\OneDrive\Desktop\ASSISTANT PEDAGOGIQUE"
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend :**

```powershell
cd "C:\Users\ama_pc\OneDrive\Desktop\ASSISTANT PEDAGOGIQUE\frontend"
npm run dev
```

---

## Erreur fréquente : port 8000 déjà utilisé

Message : `WinError 10013` ou « socket interdit ».

**Cause :** le backend tourne déjà (ancien terminal).

**Solutions :**

1. **Utiliser l’API déjà lancée** — ouvrez http://127.0.0.1:8000/health (si `ok`, inutile de relancer le backend).
2. **Arrêter l’ancien processus :**

```powershell
netstat -ano | findstr ":8000"
taskkill /F /PID <numero_PID>
```

Puis relancez le backend.

---

## Erreur : `Activate.ps1` désactivé

Ne pas utiliser `.\venv\Scripts\activate` dans PowerShell.

Utilisez plutôt :
- `.\venv\Scripts\python.exe`
- ou les tâches VS Code / les fichiers `.bat`

Pour autoriser `activate` (optionnel) :

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## Vérifier Supabase avant de lancer

```powershell
.\venv\Scripts\python.exe -c "from app.db.database import test_connection; test_connection()"
```

Réponse attendue : `Connexion Supabase (PostgreSQL) reussie.`
