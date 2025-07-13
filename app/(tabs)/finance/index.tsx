import React, { useState } from "react";
import {
  Button,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Transaction {
  id: number;
  desc: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({
    desc: "",
    amount: "",
    type: "income",
    category: "",
    date: "",
  });
  const [summary, setSummary] = useState<null | {
    income: number;
    expense: number;
    categories: { [key: string]: number };
    period: string;
  }>(null);
  const [idCounter, setIdCounter] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addTransaction = () => {
    if (!form.desc || !form.amount || !form.category || !form.date) return;

    const newTx: Transaction = {
      id: idCounter,
      desc: form.desc,
      amount: parseFloat(form.amount),
      type: form.type as "income" | "expense",
      category: form.category,
      date: form.date,
    };

    setTransactions((txs) => [...txs, newTx]);
    setIdCounter((c) => c + 1);
    setForm({ desc: "", amount: "", type: "income", category: "", date: "" });
    setSummary(null);
  };

  const deleteTransaction = (id: number) => {
    setTransactions((txs) => txs.filter((tx) => tx.id !== id));
    setSummary(null);
  };

  const getBalance = () => {
    return transactions.reduce((acc, tx) => {
      return tx.type === "income" ? acc + tx.amount : acc - tx.amount;
    }, 0);
  };

  const getSummary = (period: string) => {
    const now = new Date();
    const filtered = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      if (period === "weekly") {
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7 && diffDays >= 0;
      } else if (period === "monthly") {
        return (
          txDate.getFullYear() === now.getFullYear() &&
          txDate.getMonth() === now.getMonth()
        );
      }
      return false;
    });

    const income = filtered
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = filtered
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const categories: { [key: string]: number } = {};
    filtered
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
      });

    setSummary({ income, expense, categories, period });
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Personal Finance Tracker</Text>

      <TextInput
        style={styles.input}
        placeholder="Description"
        value={form.desc}
        onChangeText={(val) => handleChange("desc", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={form.amount}
        keyboardType="numeric"
        onChangeText={(val) => handleChange("amount", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Type (income or expense)"
        value={form.type}
        onChangeText={(val) => handleChange("type", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Category"
        value={form.category}
        onChangeText={(val) => handleChange("category", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={form.date}
        onChangeText={(val) => handleChange("date", val)}
      />
      <Button title="Add Transaction" onPress={addTransaction} />

      <Text style={styles.balance}>Balance: ${getBalance().toFixed(2)}</Text>

      <View style={styles.buttonRow}>
        <Button title="Weekly Summary" onPress={() => getSummary("weekly")} />
        <Button title="Monthly Summary" onPress={() => getSummary("monthly")} />
      </View>

      {summary && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>
            {summary.period.charAt(0).toUpperCase() + summary.period.slice(1)} Summary
          </Text>
          <Text>Income: ${summary.income.toFixed(2)}</Text>
          <Text>Expenses: ${summary.expense.toFixed(2)}</Text>
          <Text>Expenses by Category:</Text>
          {Object.entries(summary.categories).map(([cat, amt]) => (
            <Text key={cat}>
              {cat}: ${amt.toFixed(2)}
            </Text>
          ))}
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Search description..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <TextInput
        style={styles.input}
        placeholder="Filter (all, income, expense)"
        value={filterType}
        onChangeText={setFilterType}
      />

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.transactionRow}>
            <Text>
              {item.desc} - ${item.amount.toFixed(2)} - {item.type} -{" "}
              {item.category} - {item.date}
            </Text>
            <TouchableOpacity onPress={() => deleteTransaction(item.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </ScrollView>
  );
}

export default Home;

export const options = {
  title: "Finance App",
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
  },
  balance: {
    fontSize: 18,
    marginVertical: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  summaryTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  transactionRow: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteText: {
    color: "red",
    fontWeight: "bold",
  },
});
