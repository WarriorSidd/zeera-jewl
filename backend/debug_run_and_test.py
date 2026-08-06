import subprocess, time, requests, os, signal
uvicorn_cmd = ["python", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"]
print('Starting uvicorn...')
proc = subprocess.Popen(uvicorn_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
started = False
logs = []
try:
    start_time = time.time()
    # read lines until startup or timeout
    while True:
        line = proc.stdout.readline()
        if not line:
            if proc.poll() is not None:
                break
            time.sleep(0.1)
            if time.time() - start_time > 15:
                break
            continue
        print('UV:', line.strip())
        logs.append(line)
        if 'Application startup complete.' in line:
            started = True
            break
    if not started:
        print('Server did not start within timeout. Dumping logs and exiting.')
        print(''.join(logs))
    else:
        # perform test POST
        url = 'http://127.0.0.1:8001/api/v1/production-tickets'
        payload = {'title':'DEBUG: Test Ticket','description':'Created by debug script','priority':'High','category':'Test'}
        try:
            r = requests.post(url, json=payload, timeout=10)
            print('REQUEST STATUS', r.status_code)
            print('RESPONSE TEXT:', r.text)
        except Exception as e:
            print('REQUEST EXCEPTION', e)
        # give server a moment to log
        time.sleep(1)
        # read remaining stdout
        while True:
            line = proc.stdout.readline()
            if not line:
                break
            print('UV-', line.strip())
            logs.append(line)
finally:
    try:
        proc.terminate()
        time.sleep(0.5)
    except Exception:
        pass
    # print collected logs to a file
    with open('uvicorn_debug.log','w',encoding='utf-8') as f:
        f.write(''.join(logs))
    print('Saved uvicorn_debug.log')
