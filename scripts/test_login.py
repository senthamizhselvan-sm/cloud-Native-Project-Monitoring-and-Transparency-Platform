import os
import bcrypt
from pymongo import MongoClient

def main():
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    client = MongoClient(mongo_uri)
    db = client['government_monitoring']
    
    print("Listing all users from MongoDB:")
    users = list(db.users.find())
    print(f"Found {len(users)} users.")
    
    test_pwd = "TempPass!23"
    
    for user in users[:5]:
        email = user.get('email')
        role = user.get('role')
        hashed = user.get('hashed_password')
        
        # Verify password locally
        is_match = False
        try:
            is_match = bcrypt.checkpw(test_pwd.encode('utf-8'), hashed.encode('utf-8'))
        except Exception as e:
            print(f"Error checking password for {email}: {e}")
            
        print(f"Email: {email} | Role: {role} | Hash: {hashed} | Match '{test_pwd}': {is_match}")

if __name__ == '__main__':
    main()
