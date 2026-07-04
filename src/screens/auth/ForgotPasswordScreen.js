import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const forgotSchema = yup.object().shape({
  email: yup.string().email('Format email tidak valid').required('Email wajib diisi'),
});

export default function ForgotPasswordScreen({ navigation }) {
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(forgotSchema),
    defaultValues: { email: '' },
    mode: 'onChange'
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAlertConfig(prev => ({...prev, visible: false}));
    
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${API_URL}/api/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email.toLowerCase() })
      });
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error('Server tidak merespon dengan benar. Pastikan Anda sudah me-restart server Python di cPanel.');
      }
      
      if (!response.ok) {
        throw new Error(result.detail || 'Gagal mengirim OTP');
      }
      
      navigation.navigate('OTP', { email: data.email.toLowerCase(), isResetting: true });
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
              <Feather name="mail" size={40} color="#D4FF00" />
            </View>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Account recovery via Email</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Enter Email Address</Text>
              <Text style={styles.cardDesc}>We will send a 6-digit OTP code to your registered email address.</Text>

              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.fieldWrapper}>
                    <View style={[styles.inputContainer, errors.email && { borderColor: '#FF4B4B' }]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Example: alex@sparo.ai"
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

              <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#0F1522" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>SEND OTP</Text>
                    <Feather name="mail" size={18} color="#0F1522" style={{ marginLeft: 8 }} />
                  </>
                )}
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
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  keyboardView: { flex: 1 },
  backButton: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(28,36,51,0.5)', borderRadius: 12 },
  contentContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, marginTop: -40 },
  iconWrapper: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center', width: 80, height: 80, backgroundColor: '#1C2433', borderRadius: 40, borderWidth: 1, borderColor: '#2D3748', marginBottom: 20, shadowColor: '#D4FF00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 5 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#8A95A5', textAlign: 'center', marginBottom: 40 },
  
  card: { backgroundColor: '#161C26', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#2D3748', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  cardDesc: { fontSize: 13, color: '#8A95A5', lineHeight: 20, marginBottom: 25, textAlign: 'center' },
  
  label: { color: '#8A95A5', fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C2433', borderRadius: 12, borderWidth: 1, borderColor: '#2D3748', height: 56, paddingHorizontal: 15 },
  fieldWrapper: { marginBottom: 30 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 15 },
  errorText: { color: '#FF4B4B', fontSize: 12, marginTop: 6, fontWeight: '500' },
  
  button: { backgroundColor: '#D4FF00', flexDirection: 'row', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#D4FF00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  buttonText: { color: '#0F1522', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
});
