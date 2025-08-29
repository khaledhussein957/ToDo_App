import { StyleSheet } from "react-native";

export const AuthStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F3F4F6"
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center"
  },
  image: { 
    width: "100%", 
    height: 200, 
    marginBottom: 20 
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "#111827", 
    marginBottom: 5 
  },
  subtitle: { 
    fontSize: 16, 
    color: "#6B7280", 
    marginBottom: 20 
  },
  input: { 
    backgroundColor: "#FFFFFF", 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15, 
    fontSize: 16 
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeButton: {
    padding: 15,
  },
  button: { 
    backgroundColor: "#8B593E", 
    padding: 15, 
    borderRadius: 10, 
    alignItems: "center", 
    marginTop: 10 
  },
  buttonText: { 
    color: "#FFFFFF", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  bottomText: { 
    flexDirection: "row", 
    justifyContent: "center", 
    marginTop: 20 
  },
});
