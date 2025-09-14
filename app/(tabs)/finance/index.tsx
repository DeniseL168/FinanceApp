// FinancePage.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Transaction {
  id: string;
  desc: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

const API_URL = "http://127.0.0.1:5000"; // <-- Replace with your PC LAN IP

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({
    desc: "",
    amount: "",
    type: "income",
    category: "",
    date: "",
  });
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        Alert.alert("Error", "No auth token. Please login.");
        return;
      }
      setAuthToken(token);
      fetchTransactions(token);
    };
    loadToken();
  }, []);

  const normalizeTx = (t: any): Transaction => ({
    id: t.id,
    desc: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.date,
  });

  const fetchTransactions = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const normalized = (data.transactions || []).map(normalizeTx);
        setTransactions(normalized);
        calculateSummary(normalized);
      } else {
        console.error(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculateSummary = (txs: Transaction[]) => {
    const income = txs
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = txs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    setSummary({ income, expense });
  };

  const addTransaction = async () => {
    if (!form.desc || !form.amount || !form.category || !form.date) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    if (!authToken) {
      Alert.alert("Error", "No auth token. Please login.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          description: form.desc,
          amount: parseFloat(form.amount),
          type: form.type,
          category: form.category,
          date: form.date,
        }),
      });
      const data: { transaction?: any; error?: string } = await res.json();
      if (res.ok && data.transaction) {
        const newTx = normalizeTx(data.transaction);
        const updated = [...transactions, newTx];
        setTransactions(updated);
        calculateSummary(updated);
        setForm({ desc: "", amount: "", type: "income", category: "", date: "" });
      } else {
        Alert.alert("Error", data.error || "Failed to add transaction");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network or server error");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/transaction?transaction_id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data: { success?: boolean; error?: string } = await res.json();
      if (res.ok && data.success) {
        const updated = transactions.filter((t) => t.id !== id);
        setTransactions(updated);
        calculateSummary(updated);
      } else {
        Alert.alert("Error", data.error || "Failed to delete transaction");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    if (!authToken) {
      Alert.alert("Error", "No auth token. Please login.");
      return;
    }

    const userMsg = { role: "user" as const, text: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    try {
      const res = await fetch(`${API_URL}/ai_chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data: { response?: string; error?: string } = await res.json();
      const aiMsg = {
        role: "ai" as const,
        text: res.ok && data.response ? data.response : (data.error || "AI Error"),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [...prev, { role: "ai", text: "Network error" }]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Finance Tracker</Text>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          placeholder="Description"
          value={form.desc}
          onChangeText={(val) => setForm({ ...form, desc: val })}
          style={styles.input}
        />
        <TextInput
          placeholder="Amount"
          value={form.amount}
          keyboardType="numeric"
          onChangeText={(val) => setForm({ ...form, amount: val })}
          style={styles.input}
        />
        <TextInput
          placeholder="Category"
          value={form.category}
          onChangeText={(val) => setForm({ ...form, category: val })}
          style={styles.input}
        />
        <TextInput
          placeholder="Date (YYYY-MM-DD)"
          value={form.date}
          onChangeText={(val) => setForm({ ...form, date: val })}
          style={styles.input}
        />
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.typeBtn, form.type === "income" && styles.activeType]}
            onPress={() => setForm({ ...form, type: "income" })}
          >
            <Text>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, form.type === "expense" && styles.activeType]}
            onPress={() => setForm({ ...form, type: "expense" })}
          >
            <Text>Expense</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={addTransaction}>
          <Text style={styles.buttonText}>Add Transaction</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Income: ${summary.income}</Text>
        <Text style={styles.summaryText}>Expense: ${summary.expense}</Text>
        <Text style={styles.summaryText}>Balance: ${summary.income - summary.expense}</Text>
      </View>

      {/* Transactions */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View>
              <Text style={styles.txDesc}>{item.desc}</Text>
              <Text style={styles.txMeta}>
                {item.category} • {item.date}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={item.type === "income" ? styles.income : styles.expense}>
                {item.type === "income" ? "+" : "-"}${item.amount}
              </Text>
              <TouchableOpacity onPress={() => deleteTransaction(item.id)}>
                <Text style={styles.delete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.chatContainer}>
        <Text style={styles.chatHeading}> AI Finance Assistant</Text>
        <FlatList
          data={chatMessages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={[styles.msgBubble, item.role === "user" ? styles.userMsg : styles.aiMsg]}>
              <Text style={styles.msgText}>{item.text}</Text>
            </View>
          )}
        />
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Ask me anything about your finances..."
          />
          <TouchableOpacity style={styles.chatSendBtn} onPress={sendChatMessage}>
            <Text style={{ color: "#fff" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 40 },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  form: { marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 10, borderRadius: 5 },
  button: { backgroundColor: "#007bff", padding: 10, borderRadius: 5, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  row: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  typeBtn: { padding: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 5 },
  activeType: { backgroundColor: "#cce5ff" },
  summary: { padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5, marginBottom: 20 },
  summaryText: { fontWeight: "bold", fontSize: 16 },
  txRow: { flexDirection: "row", justifyContent: "space-between", padding: 10, borderBottomWidth: 1, borderColor: "#ccc" },
  txDesc: { fontWeight: "bold" },
  txMeta: { fontSize: 12, color: "#555" },
  income: { color: "green", fontWeight: "bold" },
  expense: { color: "red", fontWeight: "bold" },
  delete: { color: "red", marginTop: 5, fontSize: 12 },

  chatContainer: { marginTop: 20, padding: 10, backgroundColor: "#f9f9f9", borderRadius: 10, borderWidth: 1, borderColor: "#ddd" },
  chatHeading: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  msgBubble: { padding: 10, borderRadius: 10, marginVertical: 4, maxWidth: "80%" },
  userMsg: { backgroundColor: "#cce5ff", alignSelf: "flex-end" },
  aiMsg: { backgroundColor: "#e6e6e6", alignSelf: "flex-start" },
  msgText: { fontSize: 16 },
  chatInputRow: { flexDirection: "row", marginTop: 10 },
  chatInput: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 8, marginRight: 5 },
  chatSendBtn: { backgroundColor: "#007bff", paddingHorizontal: 15, justifyContent: "center", borderRadius: 5 },
});
