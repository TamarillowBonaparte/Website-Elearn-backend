import sys
import os
import logging

# Configure logging to see what's happening
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

sys.path.append(os.getcwd())

print("--- STARTING VERIFICATION ---")

try:
    print("1. Testing NotificationService initialization...")
    from app.services.notification_service import notification_service
    print(f"   Service Active: {notification_service.active}")
    
    print("2. Importing main app...")
    from main import app
    print("   Main app imported successfully.")
    
    print("--- VERIFICATION SUCCESSFUL ---")
except Exception as e:
    print("\n!!! ERROR DETECTED !!!")
    print(str(e))
    import traceback
    traceback.print_exc()
    sys.exit(1)
