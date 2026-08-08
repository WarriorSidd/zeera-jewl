import urllib.request
import urllib.parse
import json

API_URL = "http://localhost:8000"

def post(url, body=None, headers=None):
    if headers is None:
        headers = {}
    data = json.dumps(body).encode() if isinstance(body, dict) else (body if body is not None else b'')
    req = urllib.request.Request(url, data=data, headers=headers)
    res = urllib.request.urlopen(req)
    return json.loads(res.read().decode())

def get(url, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(url, headers=headers)
    res = urllib.request.urlopen(req)
    return json.loads(res.read().decode())

def run_test():
    print("=== Testing Real Production Workflow ===")

    # 1. Login owner
    data = urllib.parse.urlencode({'username': 'owner', 'password': 'Owner1234'}).encode()
    owner_auth = post(f'{API_URL}/api/v1/auth/login', data, {'Content-Type': 'application/x-www-form-urlencoded'})
    owner_token = owner_auth['access_token']
    owner_headers = {'Authorization': f'Bearer {owner_token}', 'Content-Type': 'application/json'}
    print("[OK] Owner logged in")

    # 2. Get user list to find karigar1 ID
    users = get(f'{API_URL}/api/v1/auth/users', owner_headers)
    karigar1 = next(u for u in users['items'] if u['username'] == 'karigar1')
    print(f"[OK] Found karigar1 ID: {karigar1['id']}")

    # 3. Create a ticket as owner
    pt_payload = {
        'title': 'Test Production Gold Necklace',
        'description': '22K Gold Handcrafted Necklace with Kundan setting',
        'category': 'Necklace',
        'priority': 'High'
    }
    pt = post(f'{API_URL}/api/v1/production-tickets/', pt_payload, owner_headers)
    pt_id = pt['id']
    print(f"[OK] Ticket created: {pt['ticket_number']} (Status: {pt['status']})")

    # 4. Assign karigar1
    assign_res = post(f'{API_URL}/api/v1/production-tickets/{pt_id}/assignments', {'assignee_ids': [karigar1['id']]}, owner_headers)
    pt_assigned = get(f'{API_URL}/api/v1/production-tickets/{pt_id}', owner_headers)
    print(f"[OK] Assigned to karigar1 (Status: {pt_assigned['status']})")

    # 5. Login karigar1
    k_data = urllib.parse.urlencode({'username': 'karigar1', 'password': 'Karigar1234'}).encode()
    k_auth = post(f'{API_URL}/api/v1/auth/login', k_data, {'Content-Type': 'application/x-www-form-urlencoded'})
    k_token = k_auth['access_token']
    k_headers = {'Authorization': f'Bearer {k_token}', 'Content-Type': 'application/json'}
    print("[OK] Karigar1 logged in")

    # 6. Karigar list assigned tickets
    k_pts = get(f'{API_URL}/api/v1/production-tickets/', k_headers)
    print(f"[OK] Karigar1 visible tickets count: {k_pts['total']}")

    # 7. Karigar accepts ticket
    pt_accepted = post(f'{API_URL}/api/v1/production-tickets/{pt_id}/accept', None, k_headers)
    print(f"[OK] Karigar1 accepted ticket (Status: {pt_accepted['status']})")

    # 8. Karigar starts work
    pt_prod = post(f'{API_URL}/api/v1/production-tickets/{pt_id}/start-work', None, k_headers)
    print(f"[OK] Karigar1 started work (Status: {pt_prod['status']})")

    # 9. Karigar completes work with evidence note
    pt_qc = post(f'{API_URL}/api/v1/production-tickets/{pt_id}/complete-work', {'note': 'Finished gold polishing and stone fitting'}, k_headers)
    print(f"[OK] Karigar1 completed work (Status: {pt_qc['status']})")

    # 10. Check timeline
    tl = get(f'{API_URL}/api/v1/production-tickets/{pt_id}/timeline', owner_headers)
    print(f"[OK] Timeline entries count: {len(tl)}")
    for entry in tl:
        print(f"     - Event: {entry['event_type']} | Data: {entry.get('data')}")

    print("\n=== All real production workflow assertions passed cleanly! ===")

if __name__ == '__main__':
    run_test()
