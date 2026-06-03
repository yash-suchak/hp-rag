import logging
import os
from datetime import datetime

os.makedirs("../logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(f"../logs/app.log"),
        logging.StreamHandler()  # also prints to terminal
    ]
)

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)