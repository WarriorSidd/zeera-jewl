from app.database import sync_engine, engine
print('sync_engine url:', sync_engine.url)
print('async engine url:', engine.url)
