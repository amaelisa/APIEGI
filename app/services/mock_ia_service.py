"""
Moteur IA local — génération pédagogique structurée sans API externe.
"""

import re
import unicodedata
from typing import Tuple

from app.services.guardrail_service import REJECTION_MESSAGE, is_request_allowed
from app.models.matiere import Matiere


def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def _detect_intent(question: str) -> str:
    q = _normalize(question)
    if any(k in q for k in ("plan", "révision", "revision", "réviser", "reviser")):
        return "plan"
    if any(k in q for k in ("exercice", "td", "tp", "corrigé", "corrige", "qcm")):
        return "exercice"
    if any(k in q for k in ("différence", "difference", "comparer", "vs", "entre")):
        return "comparaison"
    if any(
        k in q
        for k in (
            "qu'est-ce", "quest ce", "c'est quoi", "cest quoi", "définition",
            "definition", "définir", "definir",
        )
    ):
        return "definition"
    if any(k in q for k in ("expliqu", "comprendre", "notion", "cours", "fondamental")):
        return "explication"
    if any(k in q for k in ("résumé", "resume", "synthèse", "synthese")):
        return "resume"
    return "general"


def _topic_blocks(matiere_nom: str, niveau: str) -> dict:
    nom = matiere_nom.lower()
    if "algorithm" in nom or "structure" in nom or "complexité" in nom or "graphe" in nom:
        return {
            "themes": [
                "Complexité asymptotique (O, Ω, Θ)",
                "Structures linéaires : listes, piles, files",
                "Arbres binaires et parcours (BFS, DFS)",
                "Tris (bulles, fusion, rapide) et recherche",
                "Récursivité et diviser pour régner",
            ],
            "exemple": "Pour trier un tableau de n éléments, le tri fusion garantit O(n log n) dans tous les cas.",
        }
    if "base" in nom and "donn" in nom or "bdd" in nom or "sql" in nom:
        return {
            "themes": [
                "Modèle relationnel : tables, clés primaires/étrangères",
                "Algèbre relationnelle et SQL (SELECT, JOIN)",
                "Normalisation (1FN, 2FN, 3FN)",
                "Transactions ACID et intégrité",
                "Index et optimisation de requêtes",
            ],
            "exemple": "Une clé étrangère garantit l'intégrité référentielle entre deux tables liées.",
        }
    if "réseau" in nom or "reseau" in nom or "tcp" in nom:
        return {
            "themes": [
                "Modèle OSI et TCP/IP",
                "Adressage IP, masques, sous-réseaux",
                "Protocoles TCP vs UDP",
                "DNS, DHCP, routage de base",
                "Sécurité réseau (pare-feu, VPN)",
            ],
            "exemple": "TCP assure une communication fiable avec accusé de réception ; UDP privilégie la rapidité.",
        }
    if "web" in nom or "internet" in nom:
        return {
            "themes": [
                "HTML5, CSS3, accessibilité",
                "JavaScript côté client et DOM",
                "HTTP/HTTPS, méthodes REST",
                "Architecture client-serveur",
                "Sécurité web (XSS, CSRF, sessions)",
            ],
            "exemple": "Une API REST expose des ressources via des verbes HTTP (GET, POST, PUT, DELETE).",
        }
    if "java" in nom or "objet" in nom or "logiciel" in nom:
        return {
            "themes": [
                "Classes, objets, encapsulation",
                "Héritage, polymorphisme, interfaces",
                "Cycle de vie et garbage collector",
                "Patrons de conception (MVC, Singleton)",
                "Tests unitaires et qualité logicielle",
            ],
            "exemple": "Le polymorphisme permet d'appeler la même méthode sur des sous-classes différentes.",
        }
    if "système" in nom or "systeme" in nom or "exploit" in nom:
        return {
            "themes": [
                "Processus, threads, planification CPU",
                "Gestion mémoire (pagination, segmentation)",
                "Systèmes de fichiers",
                "Synchronisation (mutex, sémaphores)",
                "Appels système et noyau",
            ],
            "exemple": "Un processus possède son propre espace mémoire ; un thread partage celui du processus.",
        }
    if "cryptograph" in nom or "sécurité" in nom or "securite" in nom:
        return {
            "themes": [
                "Chiffrement symétrique et asymétrique",
                "Hachage et signatures numériques",
                "Certificats SSL/TLS",
                "Authentification et contrôle d'accès",
                "Menaces courantes (MITM, phishing)",
            ],
            "exemple": "RSA repose sur la difficulté de factoriser de grands nombres premiers.",
        }
    return {
        "themes": [
            f"Fondamentaux du module « {matiere_nom} »",
            "Concepts clés du programme officiel GI",
            "Méthodologie de travail universitaire",
            "Liens avec les autres UE du niveau " + niveau,
            "Préparation aux évaluations (DS, examens)",
        ],
        "exemple": f"En {niveau}, cette UE prépare les compétences attendues du cursus Génie Informatique.",
    }


def _plan_response(matiere_nom: str, niveau: str, blocks: dict) -> str:
    themes = blocks["themes"]
    lines = [
        f"## Plan de révision — {matiere_nom} ({niveau})",
        "",
        "Voici un plan structuré sur **4 semaines** pour préparer efficacement cette UE :",
        "",
    ]
    for i, theme in enumerate(themes, 1):
        lines.append(f"### Semaine {i}")
        lines.append(f"- **Objectif** : maîtriser {theme}")
        lines.append("- Lundi–Mardi : cours magistraux + prise de notes actives")
        lines.append("- Mercredi : TD / exercices d'application")
        lines.append("- Jeudi : fiche de synthèse (1 page A4)")
        lines.append("- Vendredi : auto-évaluation (10 questions)")
        lines.append("")
    lines.extend(
        [
            "### Conseils méthodologiques",
            "- Alternez théorie (40 %) et pratique (60 %).",
            "- Refaites les TP sans regarder la correction avant 30 min d'effort.",
            "- Formez un groupe de 3–4 pour expliquer les notions à voix haute.",
            "",
            f"> **Exemple clé** : {blocks['exemple']}",
        ]
    )
    return "\n".join(lines)


def _explication_response(matiere_nom: str, niveau: str, blocks: dict) -> str:
    themes = "\n".join(f"- {t}" for t in blocks["themes"])
    return f"""## Explication de cours — {matiere_nom}

**Niveau** : {niveau} — Département Génie Informatique

### Introduction
La matière **{matiere_nom}** fait partie du cursus officiel. Elle vise à vous doter de compétences théoriques et pratiques directement mobilisables en TD, TP et examens.

### Notions fondamentales à maîtriser
{themes}

### Approche pédagogique recommandée
1. Lire le polycopié / support avant le TD.
2. Implémenter ou schématiser chaque notion (selon l'UE).
3. Relier la théorie aux cas concrets du métier d'ingénieur logiciel.

### Exemple illustratif
{blocks['exemple']}

### Pour aller plus loin
- Consultez les annales des sessions précédentes.
- Identifiez les prérequis manquants et révisez-les en amont.
- Posez des questions ciblées sur un chapitre précis pour une réponse plus détaillée.
"""


def _definition_response(matiere_nom: str, question: str, blocks: dict) -> str:
    return f"""## Définition et concepts — {matiere_nom}

Votre question : *« {question.strip()} »*

### Réponse pédagogique
Dans le contexte de **{matiere_nom}**, les termes techniques doivent être compris avec précision. Voici les éléments essentiels :

{chr(10).join(f'- **{t.split("：")[0].split(":")[0]}** : notion centrale du programme.' for t in blocks['themes'][:3])}

### Illustration
{blocks['exemple']}

### À retenir pour l'examen
- Définir clairement chaque terme.
- Donner au moins un exemple.
- Mentionner l'usage dans un cas réel (projet, TP, industrie).
"""


def _exercice_response(matiere_nom: str, blocks: dict) -> str:
    return f"""## Exercices type — {matiere_nom}

### Exercice 1 — Compréhension (facile)
Énoncez avec vos mots la notion principale vue en cours. Comparez votre réponse au cours officiel.

### Exercice 2 — Application (moyen)
À partir de l'exemple suivant, démontrez votre raisonnement étape par étape :
> {blocks['exemple']}

### Exercice 3 — Synthèse (difficile)
Rédigez une fiche d'une page reliant **toutes** les notions suivantes :
{chr(10).join(f'- {t}' for t in blocks['themes'])}

### Correction méthodologique
- Structurez : hypothèse → développement → conclusion.
- Justifiez chaque étape (pas de « évident » sans preuve).
- En cas de blocage, revenez aux définitions de base du chapitre 1.
"""


def _general_response(matiere_nom: str, niveau: str, question: str, blocks: dict) -> str:
    return f"""## Réponse — {matiere_nom} ({niveau})

Merci pour votre question sur **{matiere_nom}**.

### Analyse de votre demande
> {question.strip()}

### Points clés du programme
{chr(10).join(f'- {t}' for t in blocks['themes'])}

### Explication détaillée
En Génie Informatique, cette UE développe des compétences transversales : rigueur, modélisation, implémentation et validation. 
{blocks['exemple']}

### Prochaines étapes
- Demandez un **plan de révision** pour une organisation sur plusieurs semaines.
- Demandez une **explication** d'un chapitre précis.
- Demandez des **exercices** pour vous entraîner avant l'examen.
"""


async def generate_response(
    question: str,
    matiere: Matiere,
) -> Tuple[str, bool]:
    """
    Retourne (réponse, autorisé).
    Si refus guardrail : message exact du cahier des charges, autorisé=False.
    """
    if not is_request_allowed(question, matiere):
        return REJECTION_MESSAGE, False

    blocks = _topic_blocks(matiere.nom_matiere, matiere.niveau)
    intent = _detect_intent(question)

    if intent == "plan":
        text = _plan_response(matiere.nom_matiere, matiere.niveau, blocks)
    elif intent in ("explication", "resume"):
        text = _explication_response(matiere.nom_matiere, matiere.niveau, blocks)
    elif intent == "definition":
        text = _definition_response(matiere.nom_matiere, question, blocks)
    elif intent == "exercice":
        text = _exercice_response(matiere.nom_matiere, blocks)
    elif intent == "comparaison":
        text = _explication_response(matiere.nom_matiere, matiere.niveau, blocks)
        text = "## Comparaison de concepts\n\n" + text
    else:
        text = _general_response(
            matiere.nom_matiere, matiere.niveau, question, blocks
        )

    return text, True
