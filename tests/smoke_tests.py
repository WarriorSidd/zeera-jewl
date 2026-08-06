import requests
import time
import json
from datetime import datetime

BASE = "http://127.0.0.1:8002/api/v1"
HEADERS = {"Content-Type": "application/json"}
report = {
    "start_time": datetime.utcnow().isoformat() + "Z",
    "passed": [],
    "failed": [],
    "warnings": [],
    "bugs": [],
}

def note_pass(name):
    print("PASS:", name)
    report['passed'].append(name)

def note_fail(name, msg):
    print("FAIL:", name, msg)
    report['failed'].append({"name": name, "msg": msg})

# helper
def post(path, data):
    try:
        r = requests.post(BASE + path, headers=HEADERS, json=data, timeout=10)
        return r
    except Exception as e:
        return None

def get(path):
    try:
        r = requests.get(BASE + path, headers=HEADERS, timeout=10)
        return r
    except Exception as e:
        return None

# 1. Health
r = get('/health')
if r and r.status_code == 200:
    note_pass('health')
else:
    note_fail('health', str(r.status_code) if r else 'no response')

# 2. Create ticket (CRUD)
created = None
data = {
    "title": "SMOKE: Test Ticket",
    "description": "Created by automated smoke tests",
    "priority": "High",
    "category": "Test",
}
r = post('/production-tickets', data)
if r is None:
    note_fail('create_ticket', 'no response')
else:
    if r.status_code in (200,201):
        try:
            created = r.json()
            ticket_id = created.get('id')
            note_pass('create_ticket')
        except Exception as e:
            note_fail('create_ticket', 'invalid json')
    else:
        note_fail('create_ticket', f'status {r.status_code} {r.text}')

# 3. Read ticket
if created and ticket_id:
    r = get(f'/production-tickets/{ticket_id}')
    if r and r.status_code == 200:
        note_pass('read_ticket')
    else:
        note_fail('read_ticket', str(r.status_code) if r else 'no response')
else:
    note_fail('read_ticket', 'no ticket created')

# 4. Update ticket
if created and ticket_id:
    r = requests.patch(BASE + f'/production-tickets/{ticket_id}', headers=HEADERS, json={"description": "Updated by smoke"})
    if r.status_code in (200, 204):
        note_pass('update_ticket')
    else:
        note_fail('update_ticket', f'{r.status_code} {r.text}')
else:
    note_fail('update_ticket', 'no ticket')

# 5. List tickets (search/filters)
r = get('/production-tickets')
if r and r.status_code == 200:
    note_pass('list_tickets')
else:
    note_fail('list_tickets', str(r.status_code) if r else 'no response')

# 6. Status workflow - valid transition: Draft -> Review
# Attempt to change status via endpoint /{id}/status
if created and ticket_id:
    r = requests.post(BASE + f'/production-tickets/{ticket_id}/status', headers=HEADERS, json={"new_status": "Review"})
    if r.status_code in (200,201):
        note_pass('status_transition_valid')
    else:
        note_fail('status_transition_valid', f'{r.status_code} {r.text}')
else:
    note_fail('status_transition_valid', 'no ticket')

# 7. Invalid transition: Review -> Quality Check (invalid from Review)
if created and ticket_id:
    r = requests.post(BASE + f'/production-tickets/{ticket_id}/status', headers=HEADERS, json={"new_status": "Quality Check"})
    if r is None:
        note_fail('status_transition_invalid', 'no response')
    else:
        if r.status_code == 400:
            note_pass('status_transition_invalid')
        else:
            # If API allows it, mark as warning
            report['warnings'].append('Invalid transition allowed or unexpected status code')
            note_fail('status_transition_invalid', f'{r.status_code} {r.text}')
else:
    note_fail('status_transition_invalid', 'no ticket')

# 8. Comments
comment_id = None
if created and ticket_id:
    r = post(f'/production-tickets/{ticket_id}/comments', {"content": "Smoke test comment"})
    if r and r.status_code in (200,201):
        try:
            cj = r.json()
            comment_id = cj.get('id')
            note_pass('create_comment')
        except:
            note_fail('create_comment', 'invalid json')
    else:
        note_fail('create_comment', str(r.status_code) if r else 'no response')
else:
    note_fail('create_comment', 'no ticket')

# 9. Attachments
attach_id = None
if created and ticket_id:
    try:
        payload = {"filename": "smoke.txt", "url": "https://example.com/smoke.txt", "mime_type": "text/plain"}
        r = requests.post(BASE + f'/production-tickets/{ticket_id}/attachments', headers=HEADERS, json=payload)
        if r.status_code in (200,201):
            try:
                aj = r.json()
                attach_id = aj.get('id')
                note_pass('upload_attachment')
            except:
                note_fail('upload_attachment', 'invalid json')
        else:
            note_fail('upload_attachment', f'{r.status_code} {r.text}')
    except Exception as e:
        note_fail('upload_attachment', str(e))
else:
    note_fail('upload_attachment', 'no ticket')

# 10. Timeline generation
r = get(f'/production-tickets/{ticket_id}/timeline') if created and ticket_id else None
if r and r.status_code == 200:
    try:
        t = r.json()
        if isinstance(t, list) and len(t) >= 1:
            note_pass('timeline')
        else:
            note_fail('timeline', 'empty or invalid')
    except:
        note_fail('timeline', 'invalid json')
else:
    note_fail('timeline', str(r.status_code) if r else 'no response')

# 11. Activity / history
r = get(f'/production-tickets/{ticket_id}/history') if created and ticket_id else None
if r and r.status_code == 200:
    try:
        h = r.json()
        note_pass('history')
    except:
        note_fail('history', 'invalid json')
else:
    note_fail('history', str(r.status_code) if r else 'no response')

# 12. Tags
if created and ticket_id:
    r = post(f'/production-tickets/{ticket_id}/tags', {"name": "smoke"})
    if r and r.status_code in (200,201):
        note_pass('add_tag')
    else:
        note_fail('add_tag', str(r.status_code) if r else 'no response')
else:
    note_fail('add_tag', 'no ticket')

# 13. Watchers
if created and ticket_id:
    r = post(f'/production-tickets/{ticket_id}/watchers', {"user_id": "user-smoke"})
    if r and r.status_code in (200,201):
        note_pass('add_watcher')
    else:
        note_fail('add_watcher', str(r.status_code) if r else 'no response')
else:
    note_fail('add_watcher', 'no ticket')

# 14. Dependencies
if created and ticket_id:
    r = post(f'/production-tickets/{ticket_id}/dependencies', {"depends_on_id": ticket_id})
    if r and r.status_code in (200,201):
        note_pass('add_dependency')
    else:
        note_fail('add_dependency', str(r.status_code) if r else 'no response')
else:
    note_fail('add_dependency', 'no ticket')

# 15. Subtasks (create child)
child_id = None
if created and ticket_id:
    r = post('/production-tickets', {"title": "SMOKE child", "parent_id": ticket_id})
    if r and r.status_code in (200,201):
        try:
            cj = r.json(); child_id = cj.get('id'); note_pass('create_subtask')
        except:
            note_fail('create_subtask','invalid json')
    else:
        note_fail('create_subtask', str(r.status_code) if r else 'no response')
else:
    note_fail('create_subtask','no ticket')

# 16. Assignment history
if created and ticket_id:
    r = post(f'/production-tickets/{ticket_id}/assignments', {"assignee_ids": ["karigar-1"]})
    if r and r.status_code in (200,201):
        note_pass('assign_ticket')
    else:
        note_fail('assign_ticket', str(r.status_code) if r else 'no response')
else:
    note_fail('assign_ticket','no ticket')

# 17. Delete ticket
if created and ticket_id:
    r = requests.delete(BASE + f'/production-tickets/{ticket_id}')
    if r.status_code in (200,204):
        note_pass('delete_ticket')
    else:
        note_fail('delete_ticket', f'{r.status_code} {r.text}')

# finish
report['end_time'] = datetime.utcnow().isoformat() + 'Z'
with open('TEST_REPORT.md', 'w', encoding='utf-8') as f:
    f.write('# Smoke Test Report\n\n')
    f.write(json.dumps(report, indent=2))

print('\nReport written to TEST_REPORT.md')
