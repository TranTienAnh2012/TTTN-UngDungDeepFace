import mysql.connector

try:
    conn = mysql.connector.connect(host='127.0.0.1', port=3306, user='root', password='rootpassword')
    cursor = conn.cursor()
    cursor.execute("CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'rootpassword';")
    cursor.execute("GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;")
    cursor.execute("ALTER USER 'root'@'localhost' IDENTIFIED BY 'rootpassword';")
    cursor.execute("FLUSH PRIVILEGES;")
    conn.commit()
    print("ALL ROOT PERMISSIONS AND PASSWORDS UPDATED!")
    conn.close()
except Exception as e:
    print("Error:", e)
