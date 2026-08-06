#!/usr/bin/env python
"""Quick import test to validate backend setup."""
import sys

try:
    print("Testing imports...")
    from backend.app.production.models import ProductionTicket, TicketTag, TicketDependency
    print("OK: Models imported successfully")
    
    from backend.app.production.schemas import PTCreate, PTRead
    print("OK: Schemas imported successfully")
    
    from backend.app.production.repository import ProductionTicketRepository
    print("OK: Repository imported successfully")
    
    from backend.app.production.service import ProductionTicketService
    print("OK: Service imported successfully")
    
    from backend.app.production.router import router
    print("OK: Router imported successfully")
    
    print("\nOK: All imports successful!")
    sys.exit(0)
except Exception as e:
    print(f"ERROR: Import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
