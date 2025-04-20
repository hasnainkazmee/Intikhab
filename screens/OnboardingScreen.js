import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmail, signUpWithEmail, auth } from '../utils/firebaseConfig';
import { COLORS, FONTS, URDU_TEXT } from '../utils/constants';
import GlassmorphicCard from '../components/GlassmorphicCard';

const OnboardingScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) {
        navigation.replace('Main');
      }
    });

    return unsubscribe;
  }, [navigation]);

  const handleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const { user, error } = await signInWithEmail(email, password);
        if (error) throw error;
      } else {
        // Sign up
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        const { user, error } = await signUpWithEmail(email, password, username);
        if (error) throw error;
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <LinearGradient
      colors={COLORS.background}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.appName}>{URDU_TEXT.appName}</Text>
            <Text style={styles.tagline}>{URDU_TEXT.tagline}</Text>
          </View>

          <GlassmorphicCard style={styles.authCard}>
            <Text style={styles.authTitle}>
              {isLogin ? URDU_TEXT.login : URDU_TEXT.signUp}
            </Text>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{URDU_TEXT.username}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={URDU_TEXT.username}
                  placeholderTextColor="rgba(229, 229, 229, 0.5)"
                  value={username}
                  onChangeText={setUsername}
                  textAlign="right"
                  writingDirection="rtl"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{URDU_TEXT.email}</Text>
              <TextInput
                style={styles.input}
                placeholder={URDU_TEXT.email}
                placeholderTextColor="rgba(229, 229, 229, 0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{URDU_TEXT.password}</Text>
              <TextInput
                style={styles.input}
                placeholder={URDU_TEXT.password}
                placeholderTextColor="rgba(229, 229, 229, 0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <TouchableOpacity
              style={[styles.authButton, loading && styles.disabledButton]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Text style={styles.authButtonText}>
                  {isLogin ? URDU_TEXT.login : URDU_TEXT.signUp}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleAuthMode}
            >
              <Text style={styles.toggleButtonText}>
                {isLogin ? URDU_TEXT.signUp : URDU_TEXT.login}
              </Text>
            </TouchableOpacity>
          </GlassmorphicCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontFamily: FONTS.urdu,
    fontSize: 48,
    color: COLORS.accentGold,
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  tagline: {
    fontFamily: FONTS.urdu,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  authCard: {
    padding: 24,
  },
  authTitle: {
    fontFamily: FONTS.urdu,
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  errorText: {
    color: COLORS.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FONTS.urdu,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
  },
  authButton: {
    backgroundColor: COLORS.accentGold,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  authButtonText: {
    fontFamily: FONTS.urdu,
    color: '#000',
    fontSize: 16,
    writingDirection: 'rtl',
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontFamily: FONTS.urdu,
    color: COLORS.accentBlue,
    fontSize: 14,
    writingDirection: 'rtl',
  },
});

export default OnboardingScreen;