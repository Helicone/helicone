import psycopg2
from datetime import datetime, timedelta
import os

postgres_password = os.environ.get('POSTGRES_PASSWORD')
# Establish a connection to the database
conn = psycopg2.connect(
    dbname="postgres",
    user="postgres",
    password=postgres_password,
    host="db.bolqqmqbrciybnypvklh.supabase.co",
    port="5432"
)

# Create a cursor object
cur = conn.cursor()


time_increment = timedelta(hours=1)
end_date = datetime.now()
start_date = datetime.now() - timedelta(days=120)
next_date = end_date
# Loop over each time interval
while next_date > start_date:
    step_date = next_date - time_increment
    # Define the SQL query
    sql = """
BEGIN;

-- Set the timeout to infinite
SET LOCAL statement_timeout = 1800000;

UPDATE request
    SET helicone_org_id = (
        SELECT organization.id
        FROM request AS r
        INNER JOIN user_api_keys ON user_api_keys.api_key_hash = r.auth_hash
        INNER JOIN organization ON organization.owner = user_api_keys.user_id
        WHERE organization.is_personal = TRUE
        AND r.helicone_org_id IS NULL
        AND r.id = request.id
        LIMIT 1
    )
    WHERE request.helicone_org_id is NULL AND request.created_at >= %s AND request.created_at < %s;

-- Reset the timeout to default
SET LOCAL statement_timeout = DEFAULT;

-- Commit the transaction
COMMIT;
    
    """
    print("------")
    print(">=", step_date)
    print("=<", next_date)
    # print(sql)
    try:
        # Execute the SQL query
        cur.execute(sql, (step_date, next_date))

        # Commit the changes
        conn.commit()
    except KeyboardInterrupt:
        print("Interrupted by user, rolling back last transaction...")
        conn.rollback()
        break
    except Exception as e:
        print(f"Error occurred: {e}")
        conn.rollback()

    # Move to the next time interval
    next_date = step_date

    # break

# Close the cursor and the connection
cur.close()
conn.close()
