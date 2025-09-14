from datetime import datetime, timedelta, timezone
import bcrypt
from bson.errors import InvalidId
from bson.objectid import ObjectId
from flask_pymongo import PyMongo
from pymongo.errors import DuplicateKeyError

# Global PyMongo instance
mongo = None

# ---------------- DB INITIALIZATION ----------------
def init_db(app):
    """Initialize the database with the Flask app"""
    global mongo
    try:
        mongo = PyMongo(app)
        # Test the connection by listing collections
        with app.app_context():
            mongo.db.list_collection_names()
        print("MongoDB connection successful!")
    except Exception as e:
        print(f"MongoDB connection failed: {str(e)}")
        mongo = None

def get_db():
    """Get the database instance"""
    if mongo is None:
        raise RuntimeError("Database not initialized. Call init_db(app) first.")
    
    try:
        db = mongo.db
        if db is None:
            raise RuntimeError("Database connection failed - db is None")
        return db
    except Exception as e:
        print(f"Error getting database: {str(e)}")
        raise RuntimeError(f"Database connection failed: {str(e)}")

# ---------------- USER FUNCTIONS ----------------
def register_user(email, password_hash):
    """Register a new user (password must already be hashed)"""
    db = get_db()
    result = db.users.insert_one({
        'email': email,
        'password': password_hash  # stored as bytes
    })
    return {'_id': str(result.inserted_id), 'email': email}

def find_user(email):
    db = get_db()
    return db.users.find_one({'email': email})

def find_user_by_id(user_id):
    """Find a user by their ID"""
    db = get_db()
    try:
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if user:
            user['_id'] = str(user['_id'])
            user.pop('password', None)  # don’t leak password hash
        return user
    except InvalidId:
        return None
    except Exception as e:
        print(f"Error finding user by ID: {str(e)}")
        return None

def login_user(email, password):
    """Authenticate a user with email + password"""
    db = get_db()
    user = db.users.find_one({'email': email})

    if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return {'email': user['email'], '_id': str(user['_id'])}

    return None

# ---------------- TOKEN BLACKLIST ----------------
def blacklist_token(jti):
    db = get_db()
    try:
        db.blacklist.insert_one({
            'jti': jti,
            'date': datetime.now(timezone.utc)
        })
    except DuplicateKeyError:
        return {'error': 'Token already blacklisted'}, 409
    except Exception as e:
        return {'error': str(e)}, 500

def check_blacklist(jti):
    db = get_db()
    return db.blacklist.count_documents({'jti': jti}) > 0

def cleanup_expired_tokens():
    db = get_db()
    cutoff_time = datetime.now(timezone.utc) - timedelta(days=1)
    db.blacklist.delete_many({'date': {'$lt': cutoff_time}})

# ---------------- TODO FUNCTIONS ----------------
def get_all_todos_by_user(user_id):
    db = get_db()
    todos_cursor = db.todos.find({'user_id': user_id})
    todo_list = []
    for todo in todos_cursor:
        todo['_id'] = str(todo['_id'])
    return {'todos': list(todos_cursor), 'count': todos_cursor.count()}

def create_todo(todo):
    db = get_db()
    result = db.todos.insert_one(todo)
    todo['_id'] = str(result.inserted_id)
    return todo

def get_todo_by_id(todo_id):
    db = get_db()
    try:
        todo = db.todos.find_one({'_id': ObjectId(todo_id)})
        if todo:
            todo['_id'] = str(todo['_id'])
            return todo
        return {'error': 'Todo not found'}, 404
    except InvalidId:
        return {'error': 'Invalid todo_id format'}, 400

def update_todo(todo_id, data):
    db = get_db()
    try:
        result = db.todos.update_one({'_id': ObjectId(todo_id)}, {'$set': data})
        if result.modified_count == 1:
            return {'message': 'Todo updated successfully'}, 200
        return {'error': 'Todo not found or no changes made'}, 404
    except InvalidId:
        return {'error': 'Invalid todo_id format'}, 400

def delete_todo(todo_id):
    db = get_db()
    try:
        result = db.todos.delete_one({'_id': ObjectId(todo_id)})
        if result.deleted_count == 1:
            return {'message': 'Todo deleted successfully'}, 200
        return {'error': 'Todo not found'}, 404
    except InvalidId:
        return {'error': 'Invalid todo_id format'}, 400
    
def create_transaction(transaction):
    db = get_db()
    result = db.transactions.insert_one(transaction)
    # return the actual inserted document
    return db.transactions.find_one({"_id": result.inserted_id})


def get_all_transactions_by_user(user_id):
    db = get_db()
    transactions_cursor = db.transactions.find({'user_id': user_id})
    return list(transactions_cursor)


def get_transaction_by_id(transaction_id):
    db = get_db()
    try:
        transaction = db.transactions.find_one({'_id': ObjectId(transaction_id)})
        return transaction
    except InvalidId:
        return None


def update_transaction(transaction_id, data):
    db = get_db()
    try:
        result = db.transactions.update_one(
            {'_id': ObjectId(transaction_id)},
            {'$set': data}
        )
        return result.modified_count > 0
    except InvalidId:
        return False


def delete_transaction(transaction_id):
    db = get_db()
    try:
        result = db.transactions.delete_one({'_id': ObjectId(transaction_id)})
        return result.deleted_count > 0
    except InvalidId:
        return False