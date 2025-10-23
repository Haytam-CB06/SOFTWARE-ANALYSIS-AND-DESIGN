import psycopg

# Connection to the default postgres database
conn = psycopg.connect(
    "dbname=postgres user=postgres password=postgres host=localhost port=5432",
    autocommit=True
)

with conn.cursor() as cur:
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'smartstudy_dev'")
    if cur.fetchone() is None:
        cur.execute("CREATE DATABASE smartstudy_dev")
        print("✅ Created database smartstudy_dev")
    else:
        print("ℹ️ Database smartstudy_dev already exists")

conn.close()
