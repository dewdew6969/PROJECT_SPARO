import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const registerSchema = yup.object().shape({
  fullName: yup.string().required('Nama lengkap wajib diisi'),
  username: yup.string().min(4, 'Username minimal 4 karakter').required('Username wajib diisi'),
  email: yup.string().email('Format email tidak valid').required('Email wajib diisi'),
  phone: yup.string().min(10, 'Nomor HP tidak valid').required('Nomor telepon wajib diisi'),
  password: yup.string().min(8, 'Password minimal 8 karakter').required('Password wajib diisi'),
});

export default function RegisterScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  const { control, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: { 
      fullName: '', 
      username: '', 
      email: '', 
      phone: '', 
      password: '' 
    },
    mode: 'onChange'
  });

  // Dummy data untuk simulasi pengecekan username
  const takenUsernames = ['@dewa_permana99', '@alex_sterling', '@johndoe'];

  const showAlert = (title, message) => {
    setAlertConfig({ visible: true, title, message });
  };

  const formatUsername = (text) => {
    let formattedText = text.toLowerCase().replace(/\s+/g, '_');
    if (formattedText.length > 0 && !formattedText.startsWith('@')) {
      formattedText = '@' + formattedText;
    }
    return formattedText.replace(/[^@a-z0-9_]/g, '');
  };

  const onSubmit = async (data) => {
    const { username, email, fullName, password, phone } = data;
    if (takenUsernames.includes(username)) {
      showAlert('Username Taken', `Sorry, the username ${username} is already taken. Please try another one.`);
      return;
    }
    
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      
      // 1. Kirim OTP dulu
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Gagal mengirim OTP');
      }

      // 2. Bawa semua data pendaftaran ke OTPScreen (belum disimpan ke DB)
      navigation.navigate('OTP', { 
        email, 
        username, 
        fullName, 
        password,
        phone
      });
    } catch (error) {
      showAlert('Registration Failed', error.message);
    }
  };

  return (
    <LinearGradient
      colors={['#0F1522', '#141E30']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Register</Text>

            <View style={styles.formContainer}>
              
              
              <Text style={styles.label}>Full Name</Text>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.fieldWrapper}>
                    <View style={[styles.inputContainer, errors.fullName && { borderColor: '#4A5568' }]}>
                      <Feather name="user" size={20} color="#8A95A5" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#5C677D"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    </View>
                    {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}
                  </View>
                )}
              />

              <Text style={styles.label}>Username</Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.fieldWrapper}>
                    <View style={[styles.inputContainer, errors.username && { borderColor: '#4A5568' }]}>
                      <Feather name="at-sign" size={20} color="#8A95A5" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="@username_baru"
                        placeholderTextColor="#5C677D"
                        onBlur={onBlur}
                        onChangeText={(text) => onChange(formatUsername(text))}
                        value={value}
                        autoCapitalize="none"
                      />
                    </View>
                    {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}
                  </View>
                )}
              />

              <Text style={styles.label}>Email Address</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.fieldWrapper}>
                    <View style={[styles.inputContainer, errors.email && { borderColor: '#4A5568' }]}>
                      <Feather name="mail" size={20} color="#8A95A5" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="athlete@sparo.ai"
                        placeholderTextColor="#5C677D"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                  </View>
                )}
              />

              <Text style={styles.label}>Phone Number</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.fieldWrapper}>
                    <View style={[styles.inputContainer, errors.phone && { borderColor: '#4A5568' }]}>
                      <Feather name="phone" size={20} color="#8A95A5" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="081234567890"
                        placeholderTextColor="#5C677D"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="phone-pad"
                      />
                    </View>
                    {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
                  </View>
                )}
              />

              <Text style={styles.label}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.fieldWrapper}>
                    <View style={[styles.inputContainer, errors.password && { borderColor: '#4A5568' }]}>
                      <Feather name="lock" size={20} color="#8A95A5" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#5C677D"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#8A95A5" />
                      </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
                  </View>
                )}
              />

              <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
                <Text style={styles.buttonText}>SEND OTP</Text>
                <Feather name="mail" size={20} color="#000000" style={{ marginLeft: 10, marginTop: 2 }} />
              </TouchableOpacity>

              
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1522'
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    color: '#8A95A5',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 18,
    marginLeft: 2,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2433',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3748',
    height: 56,
    paddingHorizontal: 15,
  },
  fieldWrapper: {
    marginBottom: 5,
  },
  errorText: {
    color: '#8A95A5',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
    fontStyle: 'italic'
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#D4FF00',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,
    shadowColor: '#D4FF00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 35,
  },
  footerText: {
    color: '#8A95A5',
    fontSize: 14,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
