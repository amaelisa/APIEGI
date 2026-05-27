"""
Service Google Gemini — assistante pédagogique par matière.
Modèle : gemini-2.5-flash (modèle moderne).
"""

import asyncio
from functools import partial
from typing import Optional, Tuple

from app.core.config import settings
from app.models.matiere import Matiere

GEMINI_MODEL = "gemini-2.5-flash"

MSG_CLE_MANQUANTE = (
    "Le service d'intelligence artificielle n'est pas activé.\n\n"
    "Ajoutez `GEMINI_API_KEY` dans le fichier `.env` à la racine du projet, "
    "puis redémarrez le backend."
)


def _build_system_instruction(matiere_nom: str) -> str:
    return (
        "Tu es un Assistant Pédagogique Intelligent, un tuteur académique personnalisé et un professeur expert du cursus de Génie Informatique, dédié actuellement à la matière : {nom_matiere}.\n"
        "\n"
        "Ton rôle fondamental est de transformer l'apprentissage passif en un apprentissage actif et interactif pour l'étudiant. L'application étant multiplateforme (PC et Mobile), tes réponses doivent respecter les 5 piliers suivants :\n"
        "\n"
        "1. GUIDER ET EXPLIQUER : Vulgarise les concepts complexes (comme les matrices en algèbre, les structures de données ou les algorithmes) en termes simples et imagés. Adapte tes explications si l'étudiant te demande de reformuler.\n"
        "2. ACCOMPAGNER LA PRATIQUE : Ne donne pas seulement des définitions théoriques. Génère des exemples concrets, des exercices corrigés, des cas pratiques et des morceaux de code propres pour permettre à l'étudiant de s'entraîner. Aide-le également à concevoir des plans d'étude pour ses examens.\n"
        "3. ADAPTATION ET FORMATAGE MOBILE : L'étudiant utilise souvent son smartphone pour réviser. Tu DOIS formater tes réponses pour qu'elles soient ultra-lisibles sur petit écran :\n"
        "   - Fais des phrases courtes et des paragraphes aérés.\n"
        "   - Utilise le gras pour mettre en valeur les mots-clés importants.\n"
        "   - Structure tes réponses avec des listes à puces claires plutôt que de gros blocs de texte.\n"
        "   - Rends le code source concis et facile à lire sans défilement horizontal infini.\n"
        "4. CONTINUITÉ DE L'APPRENTISSAGE : Agis en sachant que l'étudiant est dans un contexte de révision structuré par matière. Tes réponses doivent être académiques, précises et encourageantes.\n"
        "5. CADRE STRICT ET FOCALISÉ (Garde-fou) :\n"
        "   - Si la question concerne la matière sélectionnée ({nom_matiere}) ou toute notion scientifique, mathématique, technique ou informatique liée à l'ingénierie, tu DOIS y répondre pleinement.\n"
        "   - Si et seulement si la question n'a absolument AUCUN rapport avec le cursus (ex: cuisine, santé, divertissement, sport, bavardage inutile), refuse poliment en répondant EXACTEMENT et UNIQUEMENT : \"Désolé, je suis un assistant dédié exclusivement au cursus de Génie Informatique. Je ne suis pas autorisé à répondre à cette demande.\"\n"
        "\n"
        "COMPÉTENCE LIENS YOUTUBE ET RECOMMANDATIONS :\n"
        "Si l'étudiant fournit un lien de vidéo YouTube ou demande des tutoriels pour mieux comprendre un chapitre de la matière, tu DOIS structurer ta réponse pour :\n"
        "- Lui fournir des conseils académiques précis basés sur le sujet de la vidéo (ou du chapitre).\n"
        "- Lui recommander des formats de recherche de tutoriels pertinents sur YouTube (ex: termes de recherche spécifiques comme \"Tutoriel Merise conception MCD\", chaînes éducatives recommandées ou méthodologies de recherche visuelle).\n"
        "- Intégrer ces conseils de manière claire et aérée, parfaitement lisible sur écran de smartphone.\n"
        "\n"
        "RÈGLE DES SALUTATIONS : Si l'étudiant te dit \"Bonjour\", \"Salut\" ou te salue, réponds poliment en adaptant ton accueil, mais rappelle-lui brièvement que tu es son assistante pédagogique dédiée au Génie Informatique pour l'aider à réviser ses cours."
    ).replace("{nom_matiere}", matiere_nom)


def _build_user_prompt(question: str, matiere_nom: str, niveau: str) -> str:
    return (
        f"Matière active : {matiere_nom} ({niveau}).\n"
        f"Question de l'étudiant :\n{question}"
    )


class GeminiService:
    def __init__(self) -> None:
        self._init_error: Optional[str] = None
        self._ready = False

    def _ensure_configured(self) -> None:
        if self._ready:
            return
        self._ready = True

        key = (settings.GEMINI_API_KEY or "").strip()
        if not key or key.startswith("votre_"):
            self._init_error = MSG_CLE_MANQUANTE
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=key)
        except Exception as e:
            self._init_error = (
                f"Impossible d'initialiser Gemini. Vérifiez la clé API.\n({e})"
            )

    def _generate_sync(
        self, question: str, matiere_nom: str, niveau: str, pdf_text: Optional[str] = None
    ) -> Tuple[str, bool]:
        self._ensure_configured()
        if self._init_error:
            return self._init_error, False

        try:
            import google.generativeai as genai

            print(f"DEBUG: Utilisation du modèle Gemini: {GEMINI_MODEL}")
            model = genai.GenerativeModel(
                GEMINI_MODEL,
                system_instruction=_build_system_instruction(matiere_nom),
            )

            # Build custom user prompt if PDF content is uploaded
            user_prompt = _build_user_prompt(question, matiere_nom, niveau)
            if pdf_text:
                user_prompt = (
                    f"Matière active : {matiere_nom} ({niveau}).\n\n"
                    f"[CONTENU DU DOCUMENT PDF IMPORTÉ PAR L'ÉTUDIANT] :\n"
                    f"\"\"\"\n{pdf_text}\n\"\"\"\n\n"
                    f"Question de l'étudiant à propos de ce document ou du cours :\n{question}"
                )

            response = model.generate_content(user_prompt)
            text = (response.text or "").strip() or "Je n'ai pas pu générer de réponse."

            # Check if Gemini returned the exact rejection phrase
            clean_text = text.strip().replace('"', '').replace("'", "")
            expected_rejection = "Désolé, je suis un assistant dédié exclusivement au cursus de Génie Informatique. Je ne suis pas autorisé à répondre à cette demande."
            clean_expected = expected_rejection.replace('"', '').replace("'", "")
            is_rejected = clean_text == clean_expected
            return text, not is_rejected

        except Exception as e:
            err = str(e)
            print(f"DEBUG: Erreur Gemini: {err}")
            if "429" in err or "quota" in err.lower():
                return (
                    "Le quota gratuit de l'API Gemini est temporairement dépassé. "
                    "Réessayez dans quelques minutes.",
                    False,
                )
            return (
                f"Erreur lors de la génération de la réponse.\n({e})",
                False,
            )

    async def generate_response(
        self,
        question: str,
        matiere: Matiere,
        pdf_text: Optional[str] = None,
    ) -> Tuple[str, bool]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            partial(
                self._generate_sync,
                question,
                matiere.nom_matiere,
                matiere.niveau,
                pdf_text,
            ),
        )


gemini_service = GeminiService()
