import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import main...")
    from main import app
    print("Backend import successful!")
except Exception as e:
    print(f"Backend import failed: {e}")
    import traceback
    traceback.print_exc()
