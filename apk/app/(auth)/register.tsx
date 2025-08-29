import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/slices/authSlice";
import { useRegisterMutation } from "../../store/Api/authApi";
import { tokenUtils } from "../../store/Api/baseQuery";
import { registerSchema } from "../../validation/validationSchemas";
import { AuthStyles as styles } from "../../assets/styles/auth.styles";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterScreen() {
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" }
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      const result = await register(data).unwrap();
      
      // Store token and user
      if (result.token) {
        await tokenUtils.setToken(result.token);
        console.log("Token stored successfully");
      } else {
        console.warn("No token received from registration");
      }
      
      if (result.user) {
        await tokenUtils.setUser(result.user);
        console.log("User data stored successfully");
      } else {
        console.warn("No user data received from registration");
      }
      
      // Update Redux state
      dispatch(loginSuccess({
        user: result.user,
        token: result.token
      }));
      
      // Navigate to main app
      router.replace("/(tabs)");
      
    } catch (err: any) {
      setError(err.data?.message || "Registration failed. Please try again.");
      Alert.alert("Registration Error", err.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../../assets/images/react-logo.png")}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start organizing your tasks today</Text>

        {/* Name */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={value}
              onChangeText={onChange}
              editable={!isLoading}
            />
          )}
        />
        {errors.name && <Text style={{ color: "red", marginBottom: 10 }}>{errors.name.message}</Text>}

        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          )}
        />
        {errors.email && <Text style={{ color: "red", marginBottom: 10 }}>{errors.email.message}</Text>}

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          )}
        />
        {errors.password && <Text style={{ color: "red", marginBottom: 10 }}>{errors.password.message}</Text>}

        {/* Error Message */}
        {error && <Text style={{ color: "red", marginBottom: 10, textAlign: "center" }}>{error}</Text>}

        <TouchableOpacity 
          style={[styles.button, isLoading && { opacity: 0.7 }]} 
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomText}>
          <Text>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/")} disabled={isLoading}>
            <Text style={{ color: "#4F46E5", fontWeight: "bold" }}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
