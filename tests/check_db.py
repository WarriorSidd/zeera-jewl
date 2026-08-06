import sqlite3
paths=[r'C:/Users/siddp/Desktop/mehul-project/mehul.db', r'C:/Users/siddp/Desktop/mehul-project/backend/mehul.db']
for p in paths:
    try:
        conn=sqlite3.connect(p)
        c=conn.cursor()
        c.execute('SELECT name FROM sqlite_master WHERE type="table"')
        print(p, c.fetchall())
        conn.close()
    except Exception as e:
        print('ERR',p,e)
