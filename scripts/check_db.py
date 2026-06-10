import os
from pymongo import MongoClient


def main():
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    db_name = os.environ.get('MONGO_DB_NAME', 'government_monitoring')
    print('Connecting to', mongo_uri, 'db:', db_name)
    client = MongoClient(mongo_uri)
    db = client[db_name]

    for col in ['users', 'projects']:
        if col in db.list_collection_names():
            coll = db[col]
            count = coll.count_documents({})
            print(f'Collection "{col}" found. Count =', count)
            doc = coll.find_one()
            print('Sample document:', doc)
        else:
            print(f'Collection "{col}" not found in database.')


if __name__ == '__main__':
    main()
