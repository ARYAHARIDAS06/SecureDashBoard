#!/usr/bin/env bash

#!/usr/bin/env bash
set -o errexit


cd backend
pip install -r requirements.txt

# Go to frontend and build React
cd ../project
npm install
npm run build

# Back to backend
cd ../backendApi

# Django collectstatic and migrations
python manage.py collectstatic --no-input
python manage.py migrate
