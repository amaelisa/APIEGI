-- Migration : liaison Supabase Auth + suppression obligation niveau étudiant
-- Exécuter dans Supabase → SQL Editor si la table utilisateurs existe déjà

ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS supabase_id UUID UNIQUE;

ALTER TABLE utilisateurs
    ALTER COLUMN niveau DROP NOT NULL;

ALTER TABLE utilisateurs
    ALTER COLUMN mot_de_passe_hash DROP NOT NULL;

ALTER TABLE utilisateurs
    DROP CONSTRAINT IF EXISTS chk_user_niveau;
