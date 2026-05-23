import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Clé API Gemini: {api_key[:10]}..." if api_key else "Clé API Gemini: NON CONFIGURÉE")

if api_key:
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        # Tester différents modèles
        models_to_test = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro-latest"]
        
        for model_name in models_to_test:
            print(f"\nTest du modèle: {model_name}")
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Bonjour")
                print(f"✓ Succès avec {model_name}: {response.text[:50]}...")
                break
            except Exception as e:
                print(f"✗ Erreur avec {model_name}: {str(e)[:100]}")
    except Exception as e:
        print(f"Erreur d'initialisation: {e}")
