#!/bin/bash
set -e

USER="db_user"
PASS="db_password"
DB="ddc_db"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER $USER WITH ENCRYPTED PASSWORD '$PASS';
    \c $POSTGRES_DB;
    GRANT ALL PRIVILEGES ON DATABASE demonstrator_db TO $USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $USER;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $USER;
    
    -- Change ownership
    ALTER DATABASE $POSTGRES_DB OWNER TO $USER;
    SELECT format ('ALTER TABLE %I OWNER TO $USER', table_name) FROM information_schema.tables WHERE table_schema = 'public' \gexec
    SELECT format ('ALTER SEQUENCE %I OWNER TO $USER', sequence_name) FROM information_schema.sequences WHERE sequence_schema = 'public' \gexec
EOSQL
