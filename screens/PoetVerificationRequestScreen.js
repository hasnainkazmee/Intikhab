import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { firestore, auth } from '../utils/firebaseConfig';
import { COLORS, FONTS, URDU_TEXT } from '../utils/constants';
import GlassmorphicCard from '../components/GlassmorphicCard';

const PoetVerificationRequestScreen = () => {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [sampleGhazal, setSampleGhazal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim() || !bio.trim() || !sampleGhazal.trim()) {
      Alert.alert(
        'Error',
        'Please fill in all fields',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSubmitting(true);
    
    try {
      const userId = auth().currentUser.uid;
      
      await firestore().collection('poetVerificationRequests').add({
        userId,
        fullName,
        bio,
        sampleGhazal,
        status: 'pending',
        submittedAt: firestore.FieldValue.serverTimestamp()
      });
      
      Alert.alert(
        'Success',
        'Your poet verification request has been submitted. We will review it shortly.',
        [
          { 
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting poet verification request:', error);
      Alert.alert(
        'Error',
        'Failed to submit request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={COLORS.background}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.headerTitle}>{URDU_TEXT.poetVerification}</Text>
          
          <GlassmorphicCard style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{URDU_TEXT.fullName}</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder={URDU_TEXT.fullName}
                placeholderTextColor="rgba(229, 229, 229, 0.5)"
                textAlign="right"
                writingDirection="rtl"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{URDU_TEXT.bio}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder={URDU_TEXT.bio}
                placeholderTextColor="rgba(229, 229, 229, 0.5)"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                textAlign="right"
                writingDirection="rtl"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{URDU_TEXT.sampleGhazal}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={sampleGhazal}
                onChangeText={setSampleGhazal}
                placeholder={URDU_TEXT.sampleGhazal}
                placeholderTextColor="rgba(229, 229, 229, 0.5)"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                textAlign="right"
                writingDirection="rtl"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Text style={styles.submitButtonText}>{URDU_TEXT.submit}</Text>
              )}
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
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  headerTitle: {
    fontFamily: FONTS.urdu,
    fontSize: 24,
    color: COLORS.accentGold,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginVertical: 20,
  },
  formCard: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
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
    fontFamily: FONTS.urdu,
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: COLORS.accentGold,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: '#000',
    writingDirection: 'rtl',
  },
});

export default PoetVerificationRequestScreen;