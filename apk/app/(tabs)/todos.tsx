import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TodosTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todos</Text>
      <Text style={styles.subtitle}>Your todo list will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F3F4F6",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});
