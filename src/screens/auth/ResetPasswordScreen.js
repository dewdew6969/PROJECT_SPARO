import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const resetSchema = yup.object().shape({
  password: yup.string().min(8, 'Password minimal 8 karakter').required('Password wajib diisi'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Password tidak cocok')
    .required('Konfirmasi password wajib diisi'),
});

export default function ResetPasswordScreen({ navigation, route }) {
  const email = route.params?.email || '';
  const otpCode = route.params?.otp || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange'
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAlertConfig(prev => ({...prev, visible: false}));
    
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otp_code: otpCode, new_password: data.password })
      });
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error('Server tidak merespon dengan benar. Pastikan Anda sudah me-restart server Python di cPanel.');
      }
      
      if (!response.ok) {
        throw new Error(result.detail || 'Gagal mereset password');
      }
      
      setAlertConfig({ visible: true, title: 'Berhasil', message: 'Password Anda telah berhasil diubah! Silakan login kembali.' });
      setTimeout(() => {
        setAlertConfig(prev => ({...prev, visible: false}));
        navigation.replace('Login');
      }, 2000);
    } catch (error) {
      setAlertConfig({ visible: true, title: 'Error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F1522', '#141E30']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            <View style={styles.iconWrapper}>
              <Feather name="key" size={40} color="#D4FF00" />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Masukkan password baru untuk akun</Text>
            <Text style={styles.emailText}>{email}</Text>

            <View style={styles.formContainer}>
              <Text style={styles.label}>New Password</Text>
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

              <Text style={styles.label}>Confirm New Password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.fieldWrapper}>
                    <View style={[styles.inputContainer, errors.confirmPassword && { borderColor: '#4A5568' }]}>
                      <Feather name="check-circle" size={20} color="#8A95A5" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#5C677D"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                        <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#8A95A5" />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
                  </View>
                )}
              />

              <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading ? (<ActivityIndicator size="small" color="#000000" />) : (<Text style={styles.buttonText}>RESET PASSWORD</Text>)}
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
  container: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#0F1522' },
  keyboardView: { flex: 1 },
  backButton: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(28,36,51,0.5)', borderRadius: 12 },
  contentContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, marginTop: -40 },
  iconWrapper: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center', width: 80, height: 80, backgroundColor: '#1C2433', borderRadius: 40, borderWidth: 1, borderColor: '#2D3748', marginBottom: 20, shadowColor: '#D4FF00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 5 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#8A95A5', textAlign: 'center' },
  emailText: { fontSize: 15, fontWeight: 'bold', color: '#D4FF00', textAlign: 'center', marginBottom: 40, marginTop: 5 },
  formContainer: { width: '100%' },
  label: { color: '#8A95A5', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 15, marginLeft: 4, letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C2433', borderRadius: 12, borderWidth: 1, borderColor: '#2D3748', height: 56, paddingHorizontal: 15 },
  fieldWrapper: { marginBottom: 5 },
  errorText: { color: '#8A95A5', fontSize: 12, marginTop: 6, marginLeft: 4, fontWeight: '500', fontStyle: 'italic' },
  icon: { marginRight: 12 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 16 },
  eyeIcon: { padding: 5 },
  button: { backgroundColor: '#D4FF00', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 35, shadowColor: '#D4FF00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  buttonText: { color: '#000000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});
