import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Switch,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { logout } from "../../store/slices/authSlice";
import { tokenUtils } from "../../store/Api/baseQuery";
import { RootState } from "../../store";
import { useGetAllCategoriesQuery } from "../../store/Api/categoryApi";
import { 
  useGetUserQuery, 
  useUpdateUserMutation, 
  useUpdatePasswordMutation, 
  useDeleteUserMutation 
} from "../../store/Api/userApi";
import SafeScreen from "../../components/SafeArea";
import { updatePasswordSchema } from "../../validation/validationSchemas";
import { profileStyles } from "../../assets/styles/profile.style";

export default function ProfileTab() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: userData, refetch: refetchUser } = useGetUserQuery();
  
  const [updateUser] = useUpdateUserMutation();
  const [updatePassword] = useUpdatePasswordMutation();
  const [deleteUser] = useDeleteUserMutation();
  
  const [userFromStorage, setUserFromStorage] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Load user data from storage on component mount
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await tokenUtils.getUser();
        if (storedUser) {
          setUserFromStorage(storedUser);
        }
      } catch (error) {
        console.log("Error loading user from storage:", error);
      }
    };

    loadUserFromStorage();
  }, []);

  // Use user from API if available, then storage, then Redux state
  const currentUser = userData?.user || userFromStorage || user;

  const getJoinedDate = () => {
    // Use actual user creation date if available
    if (currentUser?.createdAt) {
      const date = new Date(currentUser.createdAt);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    // Fallback to mock date
    const date = new Date("2024-01-01");
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getUserCategories = () => {
    return categoriesData?.categories?.slice(0, 3) || [];
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            tokenUtils.removeToken();
            tokenUtils.removeUser();
            dispatch(logout());
            router.replace("/(auth)");
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setEditForm({
      name: currentUser?.name || "",
      email: currentUser?.email || ""
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      Alert.alert("Error", "Name and email are required");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const result = await updateUser({
        name: editForm.name.trim(),
        email: editForm.email.trim()
      }).unwrap();
      
      if (result.success) {
        Alert.alert("Success", "Profile updated successfully!");
        setEditModalVisible(false);
        refetchUser(); // Refresh user data
      }
    } catch (error: any) {
      Alert.alert("Error", error?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditForm({
      name: "",
      email: ""
    });
  };

  const handleChangePassword = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordModalVisible(true);
  };

  const handleSavePassword = async () => {
    if (!passwordForm.currentPassword.trim() || !passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    // Validate using the schema
    try {
      const validationData = {
        currentPassword: passwordForm.currentPassword.trim(),
        newPassword: passwordForm.newPassword.trim(),
      };
      
      updatePasswordSchema.parse(validationData);
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        Alert.alert("Validation Error", error.errors[0].message);
      } else {
        Alert.alert("Validation Error", "Invalid password format");
      }
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await updatePassword({
        currentPassword: passwordForm.currentPassword.trim(),
        newPassword: passwordForm.newPassword.trim(),
      }).unwrap();
      
      if (result.success) {
        Alert.alert("Success", "Password updated successfully!");
        setPasswordModalVisible(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (error: any) {
      Alert.alert("Error", error?.data?.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCancelPassword = () => {
    setPasswordModalVisible(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleUploadPhoto = () => {
    setUploadModalVisible(true);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first.');
      return;
    }

    setIsUploading(true);
    try {
      // Create FormData for image upload
      const formData = new FormData();
      formData.append('avatar', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'profile-photo.jpg',
      } as any);

      const result = await updateUser(formData).unwrap();
      
      if (result.success) {
        Alert.alert('Success', 'Profile photo updated successfully!');
        setUploadModalVisible(false);
        setSelectedImage(null);
        refetchUser(); // Refresh user data
      }
    } catch (error: any) {
      Alert.alert('Error', error?.data?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setUploadModalVisible(false);
    setSelectedImage(null);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              const result = await deleteUser().unwrap();
              if (result.success) {
                Alert.alert("Account Deleted", "Your account has been deleted successfully.");
                // Logout after account deletion
                tokenUtils.removeToken();
                tokenUtils.removeUser();
                dispatch(logout());
                router.replace("/(auth)");
              }
            } catch (error: any) {
              Alert.alert("Error", error?.data?.message || "Failed to delete account");
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: string, 
    title: string, 
    subtitle?: string, 
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity 
      style={profileStyles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={profileStyles.settingLeft}>
        <View style={profileStyles.settingIcon}>
          <Ionicons name={icon as any} size={20} color="#8B593E" />
        </View>
        <View style={profileStyles.settingContent}>
          <Text style={profileStyles.settingTitle}>{title}</Text>
          {subtitle && <Text style={profileStyles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeScreen>
      <ScrollView style={profileStyles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={profileStyles.profileHeader}>
          <TouchableOpacity style={profileStyles.profileImageContainer} onPress={handleUploadPhoto}>
            {currentUser?.avatar ? (
              <Image source={{ uri: currentUser.avatar }} style={profileStyles.profileImage} />
            ) : (
              <View style={profileStyles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color="#8B593E" />
              </View>
            )}
            <View style={profileStyles.editPhotoButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={profileStyles.userName}>{currentUser?.name || "User Name"}</Text>
          <Text style={profileStyles.userEmail}>{currentUser?.email || "user@example.com"}</Text>
          
          <TouchableOpacity style={profileStyles.editProfileButton} onPress={handleEditProfile}>
            <Text style={profileStyles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* User Info Section */}
        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionTitle}>User Information</Text>
          
          <View style={profileStyles.infoItem}>
            <Text style={profileStyles.infoLabel}>Full Name</Text>
            <Text style={profileStyles.infoValue}>{currentUser?.name || "Not available"}</Text>
          </View>
          
          <View style={profileStyles.infoItem}>
            <Text style={profileStyles.infoLabel}>Email</Text>
            <Text style={profileStyles.infoValue}>{currentUser?.email || "Not available"}</Text>
          </View>
          
          <View style={profileStyles.infoItem}>
            <Text style={profileStyles.infoLabel}>Joined</Text>
            <Text style={profileStyles.infoValue}>{getJoinedDate()}</Text>
          </View>
          
          {getUserCategories().length > 0 && (
            <View style={profileStyles.infoItem}>
              <Text style={profileStyles.infoLabel}>Categories</Text>
              <View style={profileStyles.categoriesContainer}>
                {getUserCategories().map((category, index) => (
                  <View key={category._id} style={profileStyles.categoryTag}>
                    <Text style={profileStyles.categoryTagText}>{category.name}</Text>
                  </View>
                ))}
                {categoriesData?.categories && categoriesData.categories.length > 3 && (
                  <Text style={profileStyles.moreCategoriesText}>
                    +{(categoriesData?.categories?.length || 0) - 3} more
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Settings Section */}
        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionTitle}>Settings</Text>
          
          {renderSettingItem(
            "person-outline", 
            "Edit Profile", 
            "Change your name and profile picture",
            handleEditProfile
          )}
          
          {renderSettingItem(
            "lock-closed-outline", 
            "Change Password", 
            "Update your account password",
            handleChangePassword
          )}
          
          {renderSettingItem(
            "language-outline", 
            "Language", 
            "English (US)",
            () => Alert.alert("Language", "Language selection coming soon!")
          )}
          
                     {renderSettingItem(
             "trash-outline", 
             "Delete Account", 
             isDeletingAccount ? "Deleting account..." : "Permanently delete your account",
             isDeletingAccount ? undefined : handleDeleteAccount,
             isDeletingAccount && (
               <View style={profileStyles.loadingIndicator}>
                 <Text style={profileStyles.loadingText}>Deleting...</Text>
               </View>
             )
           )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={profileStyles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={profileStyles.logoutText}>Logout</Text>
        </TouchableOpacity>

                                  <View style={profileStyles.bottomSpacing} />
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancelEdit}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={profileStyles.modalOverlay}
          >
            <View style={profileStyles.modalContainer}>
              <View style={profileStyles.modalHeader}>
                <Text style={profileStyles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleCancelEdit} style={profileStyles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={profileStyles.modalContent}>
                <View style={profileStyles.inputGroup}>
                  <Text style={profileStyles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={profileStyles.textInput}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={profileStyles.inputGroup}>
                  <Text style={profileStyles.inputLabel}>Email</Text>
                  <TextInput
                    style={profileStyles.textInput}
                    value={editForm.email}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={profileStyles.modalButtons}>
                  <TouchableOpacity 
                    style={profileStyles.cancelButton} 
                    onPress={handleCancelEdit}
                  >
                    <Text style={profileStyles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                                     <TouchableOpacity 
                     style={[profileStyles.saveButton, isUpdatingProfile && profileStyles.disabledButton]} 
                     onPress={handleSaveProfile}
                     disabled={isUpdatingProfile}
                   >
                     <Text style={profileStyles.saveButtonText}>
                       {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                     </Text>
                   </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={passwordModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancelPassword}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={profileStyles.modalOverlay}
          >
            <View style={profileStyles.modalContainer}>
              <View style={profileStyles.modalHeader}>
                <Text style={profileStyles.modalTitle}>Change Password</Text>
                <TouchableOpacity onPress={handleCancelPassword} style={profileStyles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={profileStyles.modalContent}>
                                 <View style={profileStyles.inputGroup}>
                   <Text style={profileStyles.inputLabel}>Current Password</Text>
                   <View style={profileStyles.passwordInputContainer}>
                     <TextInput
                       style={profileStyles.passwordInput}
                       value={passwordForm.currentPassword}
                       onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                       placeholder="Enter your current password"
                       placeholderTextColor="#9CA3AF"
                       secureTextEntry={!showCurrentPassword}
                     />
                     <TouchableOpacity
                       style={profileStyles.eyeButton}
                       onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                     >
                       <Ionicons
                         name={showCurrentPassword ? "eye-off" : "eye"}
                         size={20}
                         color="#6B7280"
                       />
                     </TouchableOpacity>
                   </View>
                 </View>

                 <View style={profileStyles.inputGroup}>
                   <Text style={profileStyles.inputLabel}>New Password</Text>
                   <View style={profileStyles.passwordInputContainer}>
                     <TextInput
                       style={profileStyles.passwordInput}
                       value={passwordForm.newPassword}
                       onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                       placeholder="Enter your new password"
                       placeholderTextColor="#9CA3AF"
                       secureTextEntry={!showNewPassword}
                     />
                     <TouchableOpacity
                       style={profileStyles.eyeButton}
                       onPress={() => setShowNewPassword(!showNewPassword)}
                     >
                       <Ionicons
                         name={showNewPassword ? "eye-off" : "eye"}
                         size={20}
                         color="#6B7280"
                       />
                     </TouchableOpacity>
                   </View>
                 </View>

                 <View style={profileStyles.inputGroup}>
                   <Text style={profileStyles.inputLabel}>Confirm New Password</Text>
                   <View style={profileStyles.passwordInputContainer}>
                     <TextInput
                       style={profileStyles.passwordInput}
                       value={passwordForm.confirmPassword}
                       onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                       placeholder="Confirm your new password"
                       placeholderTextColor="#9CA3AF"
                       secureTextEntry={!showConfirmPassword}
                     />
                     <TouchableOpacity
                       style={profileStyles.eyeButton}
                       onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                     >
                       <Ionicons
                         name={showConfirmPassword ? "eye-off" : "eye"}
                         size={20}
                         color="#6B7280"
                       />
                     </TouchableOpacity>
                   </View>
                 </View>

                <View style={profileStyles.modalButtons}>
                  <TouchableOpacity 
                    style={profileStyles.cancelButton} 
                    onPress={handleCancelPassword}
                  >
                    <Text style={profileStyles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                                     <TouchableOpacity 
                     style={[profileStyles.saveButton, isUpdatingPassword && profileStyles.disabledButton]} 
                     onPress={handleSavePassword}
                     disabled={isUpdatingPassword}
                   >
                     <Text style={profileStyles.saveButtonText}>
                       {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                     </Text>
                   </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Upload Photo Modal */}
        <Modal
          visible={uploadModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancelUpload}
        >
          <View style={profileStyles.modalOverlay}>
            <View style={profileStyles.modalContainer}>
              <View style={profileStyles.modalHeader}>
                <Text style={profileStyles.modalTitle}>Upload Photo</Text>
                <TouchableOpacity onPress={handleCancelUpload} style={profileStyles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={profileStyles.modalContent}>
                {selectedImage ? (
                  <View style={profileStyles.imagePreviewContainer}>
                    <Image source={{ uri: selectedImage }} style={profileStyles.imagePreview} />
                    <TouchableOpacity 
                      style={profileStyles.changeImageButton}
                      onPress={() => setSelectedImage(null)}
                    >
                      <Text style={profileStyles.changeImageText}>Change Image</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={profileStyles.uploadOptions}>
                    <TouchableOpacity style={profileStyles.uploadOption} onPress={pickImage}>
                      <View style={profileStyles.uploadIcon}>
                        <Ionicons name="images-outline" size={40} color="#8B593E" />
                      </View>
                      <Text style={profileStyles.uploadOptionText}>Choose from Gallery</Text>
                      <Text style={profileStyles.uploadOptionSubtext}>Select an existing photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={profileStyles.uploadOption} onPress={takePhoto}>
                      <View style={profileStyles.uploadIcon}>
                        <Ionicons name="camera-outline" size={40} color="#8B593E" />
                      </View>
                      <Text style={profileStyles.uploadOptionText}>Take Photo</Text>
                      <Text style={profileStyles.uploadOptionSubtext}>Use camera to take a new photo</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedImage && (
                  <View style={profileStyles.modalButtons}>
                    <TouchableOpacity 
                      style={profileStyles.cancelButton} 
                      onPress={handleCancelUpload}
                    >
                      <Text style={profileStyles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[profileStyles.saveButton, isUploading && profileStyles.disabledButton]} 
                      onPress={uploadImage}
                      disabled={isUploading}
                    >
                      <Text style={profileStyles.saveButtonText}>
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </SafeScreen>
    );
}
