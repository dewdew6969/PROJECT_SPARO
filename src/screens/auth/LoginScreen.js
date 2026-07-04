import React, { useState, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import useAppStore from '../../store/useAppStore';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Validation Schema
const loginSchema = yup.object().shape({
  email: yup.string().email('Format email tidak valid').required('Email wajib diisi'),
  password: yup.string().min(8, 'Password minimal 8 karakter').required('Password wajib diisi'),
});

export default function LoginScreen({ navigation }) {
  const { loginAsUser } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, getValues } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange'
  });

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const onSubmit = async (data) => {
    const { email, password } = data;
    setIsLoading(true);
    
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      
      const formData = new URLSearchParams();
      formData.append('username', email); // backend uses username for both username/email
      formData.append('password', password);

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!response.ok) {
        throw new Error('Email atau password salah');
      }

      const result = await response.json();
      loginAsUser(result.user, result.access_token);
      
      const registerForPushNotificationsAsync = useAppStore.getState().registerForPushNotificationsAsync;
      if (registerForPushNotificationsAsync) {
        registerForPushNotificationsAsync(result.user.id);
      }
      
      setAlertConfig(prev => ({...prev, visible: false}));
      navigation.replace('Main');
      
    } catch (error) {
      setAlertConfig({ visible: true, title: 'Login Gagal', message: error.message });
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0F1522', '#141E30']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <Text style={styles.title}>Login</Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Email Address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.fieldWrapper}>
                  <View style={[styles.inputContainer, errors.email && { borderColor: '#4A5568' }]}>
                    <Feather name="at-sign" size={20} color="#8A95A5" style={styles.icon} />
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

            <View style={styles.passwordHeader}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
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

            <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? (<ActivityIndicator size="small" color="#000000" />) : (<Text style={styles.buttonText}>LOGIN</Text>)}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: -40,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    color: '#8A95A5',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 2,
    letterSpacing: 0.5,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  forgotText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
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
  registerText: {
    color: '#D4FF00',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
