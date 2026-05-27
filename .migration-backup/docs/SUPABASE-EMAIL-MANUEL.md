# Corriger l'email Supabase (lien + code) — 5 minutes

## Pourquoi ça bloque ?

1. **Lien `localhost:3000`** : Supabase envoie vers une mauvaise URL → ne marche pas sur téléphone.
2. **Pas de code visible** : le modèle email par défaut n'affiche que le lien, pas `{{ .Token }}`.
3. **`email rate limit exceeded`** : plan gratuit = **~4 emails/heure** avec l'envoi Supabase intégré.

---

## Étape A — Dashboard (obligatoire, 3 min)

Ouvrez : https://supabase.com/dashboard/project/gncrhhwiysqianavmpha/auth/url-configuration

| Champ | Valeur |
|-------|--------|
| **Site URL** | `http://127.0.0.1:5173` |
| **Redirect URLs** | `http://127.0.0.1:5173/**` |

Puis : **Authentication** → **Email Templates** → **Confirm signup**

Remplacez le corps par :

```html
<h2>Assistant Pédagogique GI</h2>
<p>Votre code (6 chiffres) :</p>
<h1 style="letter-spacing:6px">{{ .Token }}</h1>
<p>Sur votre PC, ouvrez : http://127.0.0.1:5173/register et saisissez ce code.</p>
```

Cliquez **Save**.

---

## Étape B — Limite d'emails (rate limit)

- **Attendez 1 heure** avant de réinscrire `amaseid00@gmail.com`
- **Ou** testez avec une **autre adresse** (ex. Gmail secondaire)
- **Ou** supprimez l'utilisateur : Dashboard → **Authentication** → **Users** → supprimer → réinscrire

---

## Étape C — Tester correctement

1. Sur le **PC** où l'app tourne : http://localhost:5173/register
2. Inscription → email → **code à 6 chiffres** (pas le lien sur téléphone)
3. Saisir le code dans l'app → Connexion

---

## Plan gratuit Supabase — est-ce suffisant ?

| Oui | Limites |
|-----|---------|
| Base 500 Mo, 68 matières | **~4 emails/heure** (SMTP Supabase) |
| Auth + confirmation email | Lien localhost **ne marche pas sur mobile** |
| 0 € | Après limite : `email rate limit exceeded` |

**Pour votre projet scolaire : oui**, tant que vous testez sur PC et peu d'inscriptions/heure.

Pour la production (beaucoup d'étudiants) : SMTP personnalisé (Gmail, SendGrid…) ou plan Pro plus tard.
