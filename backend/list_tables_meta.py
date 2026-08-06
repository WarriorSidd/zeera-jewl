from app.database import Base
import app.production.models as models
print('Registered tables:', list(Base.metadata.tables.keys()))
