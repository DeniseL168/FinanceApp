# api/finance.py
from flask import Blueprint, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import create_transaction, delete_transaction, get_all_transactions_by_user

transactions = Blueprint("transactions", __name__)
CORS(transactions)

def normalize_tx(tx):
    return {
        "id": str(tx["_id"]),
        "description": tx.get("description") or tx.get("desc", ""),
        "amount": float(tx["amount"]),
        "type": tx["type"],
        "category": tx.get("category", ""),
        "date": tx.get("date", ""),
        "user_id": tx.get("user_id"),
    }

@transactions.route("/transactions", methods=["GET"])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    txs = get_all_transactions_by_user(user_id)
    return jsonify({"transactions": [normalize_tx(t) for t in txs]}), 200

@transactions.route("/transaction", methods=["POST", "DELETE"])
@jwt_required()
def transaction_route():
    user_id = get_jwt_identity()
    if request.method == "POST":
        data = request.get_json()
        for field in ["amount", "description", "type", "category", "date"]:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400
        data["user_id"] = user_id
        tx = create_transaction(data)
        return jsonify({"transaction": normalize_tx(tx)}), 200

    if request.method == "DELETE":
        transaction_id = request.args.get("transaction_id")
        if not transaction_id:
            return jsonify({"error": "transaction_id is required"}), 400
        success = delete_transaction(transaction_id)
        if not success:
            return jsonify({"error": "Transaction not found"}), 404
        return jsonify({"success": True}), 200
