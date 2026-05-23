-- =============================================================================
-- Assistant Pédagogique IA-GI — Schéma PostgreSQL pour Supabase
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- Extensions utiles (déjà activées sur Supabase, sans danger si déjà présentes)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Table : matieres (68 matières officielles GI)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matieres (
    id          SERIAL PRIMARY KEY,
    nom_matiere VARCHAR(255) NOT NULL UNIQUE,
    niveau      VARCHAR(2)  NOT NULL,
    CONSTRAINT chk_matiere_niveau CHECK (niveau IN ('L1', 'L2', 'L3'))
);

CREATE INDEX IF NOT EXISTS idx_matieres_niveau ON matieres (niveau);

-- -----------------------------------------------------------------------------
-- Table : utilisateurs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilisateurs (
    id                  SERIAL PRIMARY KEY,
    supabase_id         UUID UNIQUE,
    nom                 VARCHAR(120) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe_hash   VARCHAR(255),
    niveau              VARCHAR(2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs (email);

-- -----------------------------------------------------------------------------
-- Table : messages (historique de chat)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id              SERIAL PRIMARY KEY,
    utilisateur_id  INTEGER NOT NULL REFERENCES utilisateurs (id) ON DELETE CASCADE,
    matiere_id      INTEGER NOT NULL REFERENCES matieres (id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,
    contenu         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_message_role CHECK (role IN ('user', 'assistant'))
);

CREATE INDEX IF NOT EXISTS idx_messages_utilisateur ON messages (utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_messages_matiere ON messages (matiere_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);

-- -----------------------------------------------------------------------------
-- Sécurité Row Level Security (RLS) — désactivé pour l’API FastAPI backend
-- L’auth JWT est gérée par votre backend Python, pas par Supabase Auth.
-- -----------------------------------------------------------------------------
ALTER TABLE matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politique : le rôle "service_role" / connexion directe backend bypass RLS
-- Pour le dev avec clé anon, on autorise lecture matières publiques :
CREATE POLICY "Lecture matieres publique"
    ON matieres FOR SELECT
    USING (true);

-- Les écritures passent par le backend avec DATABASE_URL (service role recommandé en prod)

-- -----------------------------------------------------------------------------
-- Données initiales : 68 matières officielles
-- (réexécuter uniquement sur base vide — sinon supprimer d’abord les lignes)
-- -----------------------------------------------------------------------------
TRUNCATE TABLE messages, matieres, utilisateurs RESTART IDENTITY CASCADE;

INSERT INTO matieres (nom_matiere, niveau) VALUES
    ('Architecture et Techno des Ordi (S1)', 'L1'),
    ('Systèmes d''exploi 1 (Initiation) (S1)', 'L1'),
    ('Algorithmique 1 (S1)', 'L1'),
    ('Outils logiciels pour micro-ordi (S1)', 'L1'),
    ('Analyse I (S1)', 'L1'),
    ('Logique des Systèmes Numérique (S1)', 'L1'),
    ('Statistique descriptive (S1)', 'L1'),
    ('Electricité générale (S1)', 'L1'),
    ('Mécanique générale (S1)', 'L1'),
    ('Optique Géométrique (S1)', 'L1'),
    ('Anglais 1 (S1)', 'L1'),
    ('Arabe 1 (S1)', 'L1'),
    ('Comptabilité Générale (S1)', 'L1'),
    ('Systèmes d''exploitation II (S2)', 'L1'),
    ('Archi interne ordi (Maintenance) (S2)', 'L1'),
    ('Structure des données (S2)', 'L1'),
    ('Programmation modulaire en C (S2)', 'L1'),
    ('Systèmes d''Information I (S2)', 'L1'),
    ('Modèles et langages des bases de données (S2)', 'L1'),
    ('Analyse II (S2)', 'L1'),
    ('Algèbre (S2)', 'L1'),
    ('Anglais II (S2)', 'L1'),
    ('Arabe II (S2)', 'L1'),
    ('Economie Générale (S2)', 'L1'),
    ('Atelier de programmation 1 (S2)', 'L1'),
    ('Systèmes d''Information II: Analyse et conception (S3)', 'L2'),
    ('Exploitation de bases de données relationnelles (S3)', 'L2'),
    ('Génie logiciel (S3)', 'L2'),
    ('Programmation orienté objet en Java (S3)', 'L2'),
    ('Réseaux informatiques I (S3)', 'L2'),
    ('Développement web I (S3)', 'L2'),
    ('Programmation Linéaire (S3)', 'L2'),
    ('Probabilité/Statistique (S3)', 'L2'),
    ('Electronique (S3)', 'L2'),
    ('Electronique numérique (S3)', 'L2'),
    ('Technique d''Expression 1 (S3)', 'L2'),
    ('Anglais 3 (S3)', 'L2'),
    ('Modélisation et conception de Base de Données objets (S4)', 'L2'),
    ('Cryptographie et sécurité des Systèmes d''information (S4)', 'L2'),
    ('Atelier de génie logiciel (S4)', 'L2'),
    ('Programmation sur appareils mobiles (S4)', 'L2'),
    ('Analyse et complexité des algorithmes (S4)', 'L2'),
    ('Théorie des Graphes (S4)', 'L2'),
    ('Analyse Numérique (S4)', 'L2'),
    ('Développement web II (S4)', 'L2'),
    ('Gestion et Administration Réseaux (S4)', 'L2'),
    ('Technique d''Expression 2 (S4)', 'L2'),
    ('Organisation et gestion des Entreprises (S4)', 'L2'),
    ('Mini Projet d''intégration (S4)', 'L2'),
    ('Stage Ouvrier (S4)', 'L2'),
    ('Interfaces et multimédia (S5)', 'L3'),
    ('Systèmes Distribués / Systèmes informatiques répartis (S5)', 'L3'),
    ('Base de Données Avancées (S5)', 'L3'),
    ('Introduction à l''Analyse des Données (Datamining) (S5)', 'L3'),
    ('Programmation système et réseaux (S5)', 'L3'),
    ('Conception et implémentation d''applications objets (S5)', 'L3'),
    ('Analyse des besoins et spécifications logiciels (S5)', 'L3'),
    ('Laboratoire d''Internet (S5)', 'L3'),
    ('Sécurité des réseaux Informatiques (S5)', 'L3'),
    ('Droit de Travail (S5)', 'L3'),
    ('Entrepreneuriat / Compétences Entrepreneuriales (S5)', 'L3'),
    ('Gestion de Projet (S5)', 'L3'),
    ('Contrôle qualité et métrique du logiciel (S6)', 'L3'),
    ('Génie logiciel orienté objet (S6)', 'L3'),
    ('Développement web avancé (web services) (S6)', 'L3'),
    ('Middleware (Intergiciel) et Client/serveur (S6)', 'L3'),
    ('Projet professionnel et Personnel (S6)', 'L3'),
    ('Stage de fin de formation (S6)', 'L3');

-- Vérification
SELECT niveau, COUNT(*) AS total FROM matieres GROUP BY niveau ORDER BY niveau;
