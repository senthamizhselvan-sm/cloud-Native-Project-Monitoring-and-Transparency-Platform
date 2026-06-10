from pymongo import MongoClient
import bcrypt

c = MongoClient('mongodb://localhost:27017')
db = c['government_monitoring']
new_hash = bcrypt.hashpw('TempPass!23'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
res = db.users.update_one({'email': 'officer@example.com'}, {'$set': {'hashed_password': new_hash}})
print('matched', res.matched_count, 'modified', res.modified_count)
print('new_hash', new_hash)
