import asyncio, traceback, sys, os
sys.path.insert(0, os.path.abspath('.'))
from app.database import async_session
from app.production.service import ProductionTicketService
from app.production.schemas import PTCreate

async def main():
    async with async_session() as session:
        svc = ProductionTicketService(session)
        payload = PTCreate(title='DIRECT TEST', description='direct create', priority='High', category='Test')
        try:
            pt = await svc.create_ticket(payload)
            print('Created', pt.id, pt.ticket_number)
        except Exception as e:
            traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
