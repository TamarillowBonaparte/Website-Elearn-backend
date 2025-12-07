import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const updateFormData = (key, value) => {
    setFormData(prev => ({...prev, [key]: value}));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password) => {
    // Minimal 8 karakter, kombinasi huruf dan angka
    return password.length >= 8 && /(?=.*[a-zA-Z])(?=.*[0-9])/.test(password);
  };

  const handleRegister = async () => {
    const { fullName, email, phone, password, confirmPassword } = formData;

    // Validasi field kosong
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Mohon lengkapi semua field');
      return;
    }

    // Validasi nama minimal 2 kata
    if (fullName.trim().split(' ').length < 2) {
      Alert.alert('Error', 'Mohon masukkan nama lengkap (minimal 2 kata)');
      return;
    }

    // Validasi email
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    // Validasi nomor telepon
    if (!validatePhone(phone)) {
      Alert.alert('Error', 'Format nomor telepon tidak valid');
      return;
    }

    // Validasi password
    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password minimal 8 karakter dengan kombinasi huruf dan angka');
      return;
    }

    // Validasi konfirmasi password
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak sama');
      return;
    }

    // Validasi terms
    if (!acceptTerms) {
      Alert.alert('Error', 'Mohon setujui syarat dan ketentuan');
      return;
    }

    setIsLoading(true);
    
    // Simulasi registrasi
    setTimeout(() => {
      console.log("✅ Registrasi berhasil, pindah ke Login...");
      setIsLoading(false);
      Alert.alert(
        'Berhasil!', 
        'Akun Anda telah berhasil dibuat. Silakan login.',
        [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]
      );
    }, 2000);
  };

  const handleSocialRegister = (platform) => {
    Alert.alert('Info', `Registrasi dengan ${platform} belum tersedia`);
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (password.length === 0) return { strength: 0, text: '', color: '#E1E8ED' };
    if (password.length < 6) return { strength: 1, text: 'Lemah', color: '#E74C3C' };
    if (password.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return { strength: 2, text: 'Sedang', color: '#F39C12' };
    }
    return { strength: 3, text: 'Kuat', color: '#27AE60' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>✨</Text>
            </View>
            <Text style={styles.title}>Buat Akun Baru</Text>
            <Text style={styles.subtitle}>Bergabunglah dengan ribuan pengguna lainnya</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan nama lengkap Anda"
                  placeholderTextColor="#95A5A6"
                  value={formData.fullName}
                  onChangeText={(text) => updateFormData('fullName', text)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan alamat email Anda"
                  placeholderTextColor="#95A5A6"
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nomor Telepon</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 08123456789"
                  placeholderTextColor="#95A5A6"
                  value={formData.phone}
                  onChangeText={(text) => updateFormData('phone', text)}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor="#95A5A6"
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              
              {/* Password Strength Indicator */}
              {formData.password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View 
                      style={[
                        styles.passwordStrengthFill, 
                        { 
                          width: `${(passwordStrength.strength / 3) * 100}%`,
                          backgroundColor: passwordStrength.color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.text}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Konfirmasi Password</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ulangi password Anda"
                  placeholderTextColor="#95A5A6"
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateFormData('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                Saya setuju dengan{' '}
                <Text style={styles.termsLink}>Syarat & Ketentuan</Text>
                {' '}dan{' '}
                <Text style={styles.termsLink}>Kebijakan Privasi</Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]} 
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Membuat Akun...' : 'Daftar Sekarang'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau daftar dengan</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <TouchableOpacity 
              style={[styles.socialButton, styles.googleButton]} 
              onPress={() => handleSocialRegister('Google')}
            >
              <Text style={styles.socialButtonIcon}>🔍</Text>
              <Text style={[styles.socialButtonText, styles.googleText]}>Daftar dengan Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.socialButton, styles.facebookButton]} 
              onPress={() => handleSocialRegister('Facebook')}
            >
              <Text style={styles.socialButtonIcon}>📘</Text>
              <Text style={[styles.socialButtonText, styles.facebookText]}>Daftar dengan Facebook</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.loginLink}>Masuk di sini</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9B59B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    backgroundColor: '#FAFBFC',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 16,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E1E8ED',
    borderRadius: 2,
    marginRight: 12,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#9B59B6',
    borderColor: '#9B59B6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  termsLink: {
    color: '#9B59B6',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#9B59B6',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  registerButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E8ED',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#7F8C8D',
    fontSize: 14,
    fontWeight: '500',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  googleButton: {
    borderColor: '#DB4437',
  },
  facebookButton: {
    borderColor: '#4267B2',
  },
  socialButtonIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  googleText: {
    color: '#DB4437',
  },
  facebookText: {
    color: '#4267B2',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  loginText: {
    color: '#7F8C8D',
    fontSize: 14,
  },
  loginLink: {
    color: '#9B59B6',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;