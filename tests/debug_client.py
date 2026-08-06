import sys, os, traceback
# Ensure backend package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from fastapi.testclient import TestClient

try:
    from app.main import app
except Exception as e:
    traceback.print_exc()
    sys.exit(1)

client = TestClient(app)

resp = client.post('/api/v1/production-tickets', json={
    'title': 'DEBUG: Test Ticket',
    'description': 'Created by debug client',
    'priority': 'High',
    'category': 'Test'
})
print('STATUS', resp.status_code)
print('BODY', resp.text)

# Also try list
r = client.get('/api/v1/production-tickets')
print('LIST STATUS', r.status_code)
print(r.text)
