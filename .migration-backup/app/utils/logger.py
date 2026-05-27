"""
Utilitaire de logging
Fournit des fonctions pour la journalisation des événements de l'application
"""

import logging
from datetime import datetime


def setup_logger(name: str = "ia_gi") -> logging.Logger:
    """
    Configure et retourne un logger pour l'application
    
    Args:
        name: Nom du logger (par défaut: ia_gi)
        
    Returns:
        Instance de logger configurée
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Configuration du format des logs
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Handler pour la console
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    
    # Ajout du handler si pas déjà présent
    if not logger.handlers:
        logger.addHandler(console_handler)
    
    return logger


# Logger global de l'application
logger = setup_logger()
