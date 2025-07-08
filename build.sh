#!/usr/bin/env bash

# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies and build static files
cd project
npm install
npm run build
cd ..

# Collect static files for Django (make sure STATIC_ROOT is set in settings.py)
python manage.py collectstatic --no-input

# Run migrations (optional, for db setup)
python manage.py migrate
