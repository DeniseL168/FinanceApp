from bson import ObjectId
from flask import Blueprint, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity

from db import create_todo, delete_todo, get_all_todos_by_user, get_todo_by_id, update_todo


todos = Blueprint('todos', __name__)

CORS(todos)

@todos.route('/todos', methods=["GET"])
@jwt_required()
def get_todos():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        todos = get_all_todos_by_user(user_id)
        return jsonify({'message': 'Get Todos Complete', 'todos': todos}), 200
    except Exception as e:
        print(f"Error in get_todos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@todos.route('/todo', methods=['GET', 'POST'])
@jwt_required()
def todo_route():
    try:
        user_id = get_jwt_identity()
        todo = request.json if request.method == 'POST' else None
        if request.method == 'POST':
            if not todo or 'title' not in todo:
                return jsonify({'error': 'Invalid todo data'}), 400
            todo['user_id'] = user_id
            todo['completed'] = False
            todo = create_todo(todo)
            return jsonify({'message': 'Create Todo Complete', 'todo': todo})
        else:
            todo_id = request.args.get('todo_id')
            if todo_id:
                todo = get_todo_by_id(todo_id)
                return jsonify({'message': 'Get Todo by ID Complete', 'todo': todo})
            return jsonify({'message': 'Get Todo Complete'})
    except Exception as e:
        print(f"Error in todo_route: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@todos.route('/todo', methods=['PUT'])
@jwt_required()
def update_todo_api():
    todo_id = request.args.get('todo_id')
    if not todo_id:
        return jsonify({'error': 'todo_id parameter is required'}), 400
    
    data = request.get_json()
    if not data or 'title' not in data or 'completed' not in data:
        return jsonify({'error': 'Invalid todo data'}), 400
        
    result = update_todo(todo_id, data)
    if result is None:
        return jsonify({'error': 'Todo not found'}), 404

    return jsonify(result), 200

@todos.route('/todo', methods=['DELETE'])
@jwt_required()
def delete_todo_api():
    todo_id = request.args.get('todo_id')
    if not todo_id:
        return jsonify({'error': 'todo_id parameter is required'}), 400
    try:
        result = delete_todo(todo_id)
        if result is None:
            return jsonify({'error': 'Todo not found'}), 404
        return jsonify(result), 200
    except Exception as e:
        print(f"Error in delete_todo_api: {str(e)}")
        return jsonify({'error': str(e)}), 500