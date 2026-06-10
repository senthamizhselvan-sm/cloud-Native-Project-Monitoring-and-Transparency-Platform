"""Insert a sample project document into the configured MongoDB.
Requires `pymongo` available in the Python environment.

Usage:
  python scripts/insert_sample_project.py
"""
import os
from datetime import datetime

from pymongo import MongoClient


def main():
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    db_name = os.environ.get('MONGO_DB_NAME', 'government_monitoring')

    client = MongoClient(mongo_uri)
    db = client[db_name]

    project = {
        'name': 'Village Water Tank',
        'department': 'Rural Development',
        'budget': 1500000,
        'start_date': datetime.utcnow(),
        'end_date': datetime.utcnow(),
        'location': 'Kumbakonam',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }

    result = db.projects.insert_one(project)
    print('Inserted project id:', result.inserted_id)


if __name__ == '__main__':
    main()
