# api/ai.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import os
from db import get_all_transactions_by_user

ai = Blueprint("ai", __name__)

DEEPSEEK_API_KEY= "sk-f351d56f430746d5b1f9d34e2f20cd15"
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

def call_deepseek_api(prompt: str):
    if not DEEPSEEK_API_KEY:
        return False, "API key not configured"
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "system", "content": "You are a helpful financial assistant."},
                     {"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    try:
        res = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers)
        res.raise_for_status()
        data = res.json()
        if "choices" in data and len(data["choices"]) > 0:
            return True, data["choices"][0]["message"]["content"]
        return False, "No response from AI"
    except Exception as e:
        return False, str(e)

@ai.route("/ai_chat", methods=["POST"])
@jwt_required()
def ai_chat():
    user_id = get_jwt_identity()
    data = request.get_json()
    user_message = data.get("message", "")
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    txs = get_all_transactions_by_user(user_id)
    income = sum(float(t["amount"]) for t in txs if t["type"] == "income")
    expense = sum(float(t["amount"]) for t in txs if t["type"] == "expense")
    balance = income - expense

    context = f"User Finance Data:\nIncome: ${income}\nExpense: ${expense}\nBalance: ${balance}\nTransactions: {txs}\nUser question: {user_message}"

    success, ai_response = call_deepseek_api(context)
    if success:
        return jsonify({"response": ai_response}), 200
    return jsonify({"error": ai_response}), 500
