"""
Seed script that registers sample users and creates a sample project by calling the running services.
Requires: `requests` (pip install requests)

Run:
  python scripts/seed_db.py

It reads `API_BASE` from env or defaults to http://localhost:8001/api/v1 (auth service).
This script will register an Officer user, login, then create a sample project on the project service.
"""
import os
import time
import logging
import requests


API_BASE = os.environ.get('API_BASE', 'http://localhost:8001/api/v1')
PROJECT_API = os.environ.get('PROJECT_API', 'http://localhost:8002/api/v1')

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')


def register_user(full_name, email, password, role='Citizen'):
    url = f"{API_BASE}/auth/register"
    resp = requests.post(url, json={
        'full_name': full_name,
        'email': email,
        'password': password,
        'role': role,
    })
    resp.raise_for_status()
    return resp.json()


def login(email, password):
    url = f"{API_BASE}/auth/login"
    resp = requests.post(url, json={'email': email, 'password': password})
    resp.raise_for_status()
    return resp.json()['access_token']


def create_project(token, project):
    url = f"{PROJECT_API}/projects"
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.post(url, json=project, headers=headers)
    resp.raise_for_status()
    return resp.json()


def main():
    logging.info('Seeding sample data...')

    officer_email = os.environ.get('OFFICER_EMAIL', 'officer@example.com')
    officer_password = os.environ.get('OFFICER_PASSWORD')

    if not officer_password:
        raise SystemExit('OFFICER_PASSWORD environment variable not set. Aborting seed to avoid hardcoded credentials.')

    try:
        logging.info('Registering officer...')
        register_user('Chief Officer', officer_email, officer_password, role='Officer')
    except requests.HTTPError as exc:
        logging.info('Officer may already exist: %s', exc)

    token = login(officer_email, officer_password)
    logging.info('Logged in as officer, token length: %d', len(token))

    project = {
        'name': 'Village Water Tank',
        'department': 'Rural Development',
        'budget': 1500000,
        'start_date': '2026-06-01T00:00:00Z',
        'end_date': '2026-12-01T00:00:00Z',
        'location': 'Kumbakonam',
    }
    logging.info('Creating sample project...')
    created = create_project(token, project)
    logging.info('Created project: %s', created.get('id'))


if __name__ == '__main__':
    main()
