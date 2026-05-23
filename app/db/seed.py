"""
Peuplement officiel de la table matieres — programme GI (L1, L2, L3).
Réinitialise la liste à chaque seed pour éviter les doublons.
"""

from app.db.database import SessionLocal
from app.models.matiere import Matiere
from app.models.message import Message

MATIERES_OFFICIELLES: list[tuple[str, str]] = [
    # L1 — Semestre 1
    ("Architecture et Techno des Ordi (S1)", "L1"),
    ("Systèmes d'exploi 1 (Initiation) (S1)", "L1"),
    ("Algorithmique 1 (S1)", "L1"),
    ("Outils logiciels pour micro-ordi (S1)", "L1"),
    ("Analyse I (S1)", "L1"),
    ("Logique des Systèmes Numérique (S1)", "L1"),
    ("Statistique descriptive (S1)", "L1"),
    ("Electricité générale (S1)", "L1"),
    ("Mécanique générale (S1)", "L1"),
    ("Optique Géométrique (S1)", "L1"),
    ("Anglais 1 (S1)", "L1"),
    ("Arabe 1 (S1)", "L1"),
    ("Comptabilité Générale (S1)", "L1"),
    # L1 — Semestre 2
    ("Systèmes d'exploitation II (S2)", "L1"),
    ("Archi interne ordi (Maintenance) (S2)", "L1"),
    ("Structure des données (S2)", "L1"),
    ("Programmation modulaire en C (S2)", "L1"),
    ("Systèmes d'Information I (S2)", "L1"),
    ("Modèles et langages des bases de données (S2)", "L1"),
    ("Analyse II (S2)", "L1"),
    ("Algèbre (S2)", "L1"),
    ("Anglais II (S2)", "L1"),
    ("Arabe II (S2)", "L1"),
    ("Economie Générale (S2)", "L1"),
    ("Atelier de programmation 1 (S2)", "L1"),
    # L2 — Semestre 3
    ("Systèmes d'Information II: Analyse et conception (S3)", "L2"),
    ("Exploitation de bases de données relationnelles (S3)", "L2"),
    ("Génie logiciel (S3)", "L2"),
    ("Programmation orienté objet en Java (S3)", "L2"),
    ("Réseaux informatiques I (S3)", "L2"),
    ("Développement web I (S3)", "L2"),
    ("Programmation Linéaire (S3)", "L2"),
    ("Probabilité/Statistique (S3)", "L2"),
    ("Electronique (S3)", "L2"),
    ("Electronique numérique (S3)", "L2"),
    ("Technique d'Expression 1 (S3)", "L2"),
    ("Anglais 3 (S3)", "L2"),
    # L2 — Semestre 4
    ("Modélisation et conception de Base de Données objets (S4)", "L2"),
    ("Cryptographie et sécurité des Systèmes d'information (S4)", "L2"),
    ("Atelier de génie logiciel (S4)", "L2"),
    ("Programmation sur appareils mobiles (S4)", "L2"),
    ("Analyse et complexité des algorithmes (S4)", "L2"),
    ("Théorie des Graphes (S4)", "L2"),
    ("Analyse Numérique (S4)", "L2"),
    ("Développement web II (S4)", "L2"),
    ("Gestion et Administration Réseaux (S4)", "L2"),
    ("Technique d'Expression 2 (S4)", "L2"),
    ("Organisation et gestion des Entreprises (S4)", "L2"),
    ("Mini Projet d'intégration (S4)", "L2"),
    ("Stage Ouvrier (S4)", "L2"),
    # L3 — Semestre 5
    ("Interfaces et multimédia (S5)", "L3"),
    ("Systèmes Distribués / Systèmes informatiques répartis (S5)", "L3"),
    ("Base de Données Avancées (S5)", "L3"),
    ("Introduction à l'Analyse des Données (Datamining) (S5)", "L3"),
    ("Programmation système et réseaux (S5)", "L3"),
    ("Conception et implémentation d'applications objets (S5)", "L3"),
    ("Analyse des besoins et spécifications logiciels (S5)", "L3"),
    ("Laboratoire d'Internet (S5)", "L3"),
    ("Sécurité des réseaux Informatiques (S5)", "L3"),
    ("Droit de Travail (S5)", "L3"),
    ("Entrepreneuriat / Compétences Entrepreneuriales (S5)", "L3"),
    ("Gestion de Projet (S5)", "L3"),
    # L3 — Semestre 6
    ("Contrôle qualité et métrique du logiciel (S6)", "L3"),
    ("Génie logiciel orienté objet (S6)", "L3"),
    ("Développement web avancé (web services) (S6)", "L3"),
    ("Middleware (Intergiciel) et Client/serveur (S6)", "L3"),
    ("Projet professionnel et Personnel (S6)", "L3"),
    ("Stage de fin de formation (S6)", "L3"),
]


def seed_matieres(reset: bool = True) -> int:
    """
    Peuple la table matieres.
    Si reset=True (défaut), supprime les anciennes matières et messages liés.
    """
    db = SessionLocal()
    try:
        if reset:
            deleted_msgs = db.query(Message).delete()
            deleted_mat = db.query(Matiere).delete()
            db.commit()
            print(
                f"Reinitialisation : {deleted_mat} matiere(s) et "
                f"{deleted_msgs} message(s) supprimes."
            )

        for nom_matiere, niveau in MATIERES_OFFICIELLES:
            db.add(Matiere(nom_matiere=nom_matiere, niveau=niveau))

        db.commit()
        total = db.query(Matiere).count()
        print(f"Seed matieres : {len(MATIERES_OFFICIELLES)} inserees, {total} au total.")
        return len(MATIERES_OFFICIELLES)
    except Exception as e:
        db.rollback()
        print(f"Erreur seed matieres : {e}")
        raise
    finally:
        db.close()
