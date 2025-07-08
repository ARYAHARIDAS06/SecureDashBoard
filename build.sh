#!/usr/bin/env bash

set -o errexit
pip install -r requirements.txt

echo "🧱 Running Django migrations..."
python backend/manage.py migrate

python backend/manage.py collectstatic --noinput
