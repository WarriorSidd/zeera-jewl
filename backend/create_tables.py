from app.database import sync_engine, Base
# import models so they are registered
import app.production.models as models

print('Creating tables...')
Base.metadata.create_all(bind=sync_engine)
print('Done')
