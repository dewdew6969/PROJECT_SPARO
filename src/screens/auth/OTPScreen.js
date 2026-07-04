import React, { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';

export default function OTPScreen({ navigation, route }) {
  const email = route.params?.email || 'your email';
  const isResetting = route.params?.isResetting || false;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });
  const [isResending, setIsResending] = useState(false);

  const showAlert = (title, message) => {
    setAlertConfig({ visible: true, title, message });
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const endpoint = isResetting ? '/api/auth/forgot-password/send-otp' : '/api/auth/send-otp';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch(e) {
        throw new Error('Server tidak merespon dengan benar.');
      }

      if (!response.ok) {
        throw new Error(result.detail || 'Gagal mengirim ulang OTP');
      }
      
      showAlert('Terkirim', 'Kode OTP baru telah dikirimkan ke email Anda.');
    } catch (error) {
      showAlert('Gagal Mengirim', error.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      showAlert('Invalid Code', 'Please enter the 6-digit OTP code.');
      return;
    }
    
    if (isResetting) {
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, otp_code: otpString })
        });
        
        const text = await response.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch (e) {
          throw new Error('Server tidak merespon dengan benar. Pastikan Anda sudah me-restart server Python di cPanel.');
        }
        
        if (!response.ok) {
          throw new Error(result.detail || 'OTP tidak valid');
        }
        
        showAlert('Berhasil', 'OTP Terverifikasi! Silakan buat password baru Anda.');
        setTimeout(() => {
          setAlertConfig(prev => ({...prev, visible: false}));
          navigation.replace('ResetPassword', { email: email, otp: otpString });
        }, 1500);
      } catch (error) {
        showAlert('Verifikasi Gagal', error.message);
      }
    } else {
      // Registration Verification & User Creation
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        const response = await fetch(`${API_URL}/users/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: route.params.username,
            full_name: route.params.fullName,
            email: email,
            password: route.params.password,
            otp_code: otpString
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Verifikasi OTP gagal');
        }

        showAlert('Success', 'Account verified successfully! You can login now.');
        setTimeout(() => {
          setAlertConfig(prev => ({...prev, visible: false}));
          navigation.replace('Login');
        }, 2000);
      } catch (error) {
        showAlert('Verification Failed', error.message);
      }
    }
  };

  return (
    <LinearGradient
      colors={['#0F1522', '#141E30']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <View style={styles.iconWrapper}>
            <Feather name="shield" size={42} color="#D4FF00" />
          </View>
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
          <Text style={styles.emailText}>{email}</Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                style={styles.otpInput}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                ref={(input) => (inputs.current[index] = input)}
                selectionColor="#D4FF00"
              />
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleVerify}>
            <Text style={styles.buttonText}>VERIFY OTP</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn&apos;t receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              <Text style={[styles.resendText, isResending && { opacity: 0.5 }]}>
                {isResending ? 'Sending...' : 'Resend'}
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 30,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 90,
    height: 90,
    backgroundColor: '#1C2433',
    borderRadius: 45,
    borderWidth: 1,
    borderColor: '#2D3748',
    marginBottom: 25,
    marginTop: -50,
    shadowColor: '#D4FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#8A95A5',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D4FF00',
    textAlign: 'center',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpInput: {
    backgroundColor: '#1C2433',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 10,
    width: 45,
    height: 55,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#D4FF00',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  resendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
