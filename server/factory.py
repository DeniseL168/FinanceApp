# factory.py
import os
import json
import configparser
from datetime import datetime, timedelta
from flask import Flask, jsonify
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from bson import ObjectId, json_util

from api.login import login
from api.todos import todos
from api.finance import transactions
from api.ai import ai
from db import init_db

def create_app():
    app = Flask(__name__)

    # JWT
    app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this-in-production'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    jwt = JWTManager(app)

    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_payload):
        from db import check_blacklist
        return check_blacklist(jwt_payload['jti'])

    # Read config
    config = configparser.ConfigParser()
    config.read(os.path.join(os.path.dirname(__file__), ".ini"))
    app.config['MONGO_URI'] = config['PROD']['DB_URI']

    CORS(app)

    # Init DB
    init_db(app)

    # Register blueprints
    app.register_blueprint(login)
    app.register_blueprint(todos)
    app.register_blueprint(transactions)
    app.register_blueprint(ai)

    @app.route('/')
    def index():
        return jsonify({'message': 'Database online'})

    # Custom JSON Provider
    class MongoJSONProvider(DefaultJSONProvider):
        def default(self, obj):
            if isinstance(obj, datetime):
                return obj.strftime("%Y-%m-%d %H:%M:%S")
            if isinstance(obj, ObjectId):
                return str(obj)
            try:
                return json_util.default(obj)
            except TypeError:
                return super().default(obj)

    app.json = MongoJSONProvider(app)
    return app
