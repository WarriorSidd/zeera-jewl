import asyncio
import sys
import traceback
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database import Base, DATABASE_URL
from app.production.models import ProductionTicket
from app.production.service import ProductionTicketService
from app.production.schemas import PTCreate

async def test_create():
    # Create async engine and session
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            print("Creating service...")
            svc = ProductionTicketService(session)
            
            print("Creating payload...")
            payload = PTCreate(
                title="Debug Test Ticket",
                description="Testing create_ticket directly",
                priority="High",
                category="Test",
                expected_delivery=None,
                parent_id=None,
                tags=[]
            )
            
            print("Calling create_ticket...")
            result = await svc.create_ticket(payload)
            print(f"SUCCESS! Created ticket: {result.id}, {result.ticket_number}")
            return result
        except Exception as e:
            print("ERROR!")
            print(f"Exception type: {type(e).__name__}")
            print(f"Exception message: {str(e)}")
            traceback.print_exc()
            return None
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_create())
