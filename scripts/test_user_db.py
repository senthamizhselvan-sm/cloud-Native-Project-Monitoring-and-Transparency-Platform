import os
from pymongo import MongoClient

def main():
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    client = MongoClient(mongo_uri)
    db = client['government_monitoring']
    
    user_doc = db.users.find_one({'email': 'officer@example.com'})
    print("Raw User Document in DB:")
    print(user_doc)

if __name__ == '__main__':
    main()
