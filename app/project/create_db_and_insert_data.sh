#!/bin/bash
RUN_ON_POSTGRES="psql -h $(hostname -i) -U user -p 5432 db"
$RUN_ON_POSTGRES << PSQL
CREATE TABLE todos (id SERIAL PRIMARY KEY, text VARCHAR(140));
INSERT INTO todos VALUES (DEFAULT, 'Bash script todo value');
PSQL

if [ $? -eq 0 ]; then
    echo "Success! DBs, Users, and PWs created."
else
    echo "Stopped due to an error. Try again."
fi