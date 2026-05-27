"""
Filtrage strict : hors-sujet, mauvais niveau, salutations autorisées.
"""

import re
import unicodedata

from app.models.matiere import Matiere

REJECTION_MESSAGE = (
    "Désolé, je suis un assistant dédié exclusivement au cursus de Génie Informatique. "
    "Je ne suis pas autorisé à répondre à cette demande."
)

GREETING_REMINDER = (
    "Je suis votre assistante pédagogique dédiée au cursus de Génie Informatique. "
    "Je suis là pour vous aider à réviser et étudier vos cours. "
    "Merci de me poser des questions directement liées à vos matières au lieu de bavarder !"
)

GREETING_PATTERNS = [
    r"^bonjour\b",
    r"^bonsoir\b",
    r"^salut\b",
    r"^coucou\b",
    r"^hello\b",
    r"^hi\b",
    r"^hey\b",
    r"comment\s+(tu\s+)?vas",
    r"comment\s+allez",
    r"ca\s+va",
    r"ça\s+va",
    r"comment\s+cava",
    r"quoi\s+de\s+neuf",
    r"bien\s+le\s+bonjour",
]

OFF_TOPIC_KEYWORDS = [
    "cuisine", "recette", "repas", "restaurant", "pizza", "burger", "gateau",
    "gâteau", "football", "basket", "tennis", "sport", "match", "championnat",
    "musique", "chanson", "concert", "film", "cinema", "cinéma", "série", "serie",
    "netflix", "divertissement", "jeu video", "jeux video", "mode", "voyage",
    "vacances", "météo", "meteo", "politique", "actualité", "actualite",
    "amour", "relation", "santé", "sante", "médecine", "medecine",
    "jardinage", "bricolage", "voiture", "automobile", "immobilier",
    "crypto", "bitcoin", "trading", "instagram", "tiktok", "facebook",
]

PEDAGOGICAL_INTENT_KEYWORDS = [
    "plan de", "plan ", "révision", "revision", "réviser", "reviser",
    "expliqu", "définition", "definition", "définir", "definir",
    "cours", "notion", "exercice", "td ", " tp", "examen", "contrôle", "controle",
    "qcm", "différence", "difference", "résumé", "resume", "synthèse", "synthese",
    "méthode", "methode", "comprendre", "apprendre", "étudier", "etudier",
    "préparer", "preparer", "qu'est-ce", "quest ce", "c'est quoi", "cest quoi",
    "algorithm", "programm", "code", "logiciel", "donnée", "donnee", "réseau",
    "reseau", "base de", "système", "systeme", "objet", "java", "python",
    "sql", "web", "uml", "merise", "complexité", "complexite", "graphe",
    "cryptograph", "sécurité", "securite", "middleware", "distribu",
]

CS_GENERAL_KEYWORDS = [
    "informatique", "ordinateur", "logiciel", "programme", "algorithme",
    "données", "donnees", "réseau", "reseau", "serveur", "client", "api",
    "base de données", "bdd", "compilation", "mémoire", "memoire", "processeur",
    "fichier", "processus", "thread", "objet", "classe", "héritage", "heritage",
]


def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def is_greeting(question: str) -> bool:
    q = _normalize(question)
    q = re.sub(r"[^\w\sàâäéèêëïîôùûüç]", " ", q)
    q = re.sub(r"\s+", " ", q).strip()
    if len(q) > 80:
        return False
    return any(re.search(pat, q) for pat in GREETING_PATTERNS)


def _tokens_from_matiere(nom_matiere: str) -> set[str]:
    cleaned = re.sub(r"\([^)]*\)", "", nom_matiere)
    words = re.findall(r"[a-zA-ZàâäéèêëïîôùûüçÀ-ÿ]{4,}", cleaned.lower())
    stop = {"semestre", "atelier", "introduction", "analyse", "conception", "technique"}
    return {w for w in words if w not in stop}


def is_request_allowed(question: str, matiere: Matiere) -> bool:
    q = _normalize(question)

    if is_greeting(question):
        return True

    for kw in OFF_TOPIC_KEYWORDS:
        if kw in q:
            return False

    matiere_tokens = _tokens_from_matiere(matiere.nom_matiere)
    if any(tok in q for tok in matiere_tokens):
        return True

    if any(kw in q for kw in CS_GENERAL_KEYWORDS):
        return True

    if any(kw in q for kw in PEDAGOGICAL_INTENT_KEYWORDS):
        return True

    return False
