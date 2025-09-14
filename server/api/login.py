from flask import Blueprint, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    jwt_required,
    create_access_token
)
import bcrypt
from db import blacklist_token, find_user, register_user, login_user, find_user_by_id

login = Blueprint('login', __name__)
CORS(login)

# ---------------- REGISTER ----------------
@login.route('/register', methods=["POST"])
def register_user_api():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    if find_user(email):
        return jsonify({'message': 'User already exists'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user = register_user(email, hashed_password)

    token = create_access_token(identity=user['_id'])

    return jsonify({
        'message': 'User registered successfully',
        'user': user,
        'token': token
    }), 201

# ---------------- LOGIN ----------------
@login.route('/login', methods=["POST"])
def login_user_api():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = login_user(email, password)

    if user:
        token = create_access_token(identity=user['_id'])
        return jsonify({
            'token': token,   # matches frontend variable name
            'user': user
        }), 200

    return jsonify({'message': 'Invalid credentials'}), 401

# ---------------- LOGOUT ----------------
@login.route('/logout', methods=['POST'])
@jwt_required()
def logout_user(): 
    jti = get_jwt()['jti']  # JWT ID for blacklist
    blacklist_token(jti)

    return jsonify({'message': 'Logout complete'}), 200

# ---------------- PROFILE ----------------
@login.route('/profile', methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = find_user_by_id(user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({
        'email': user['email'],
        '_id': str(user['_id'])
    }), 200
