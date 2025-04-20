import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { firestore, auth } from '../utils/firebaseConfig';
import { COLORS, FONTS, URDU_TEXT, ADMIN_UID } from '../utils/constants';
import GlassmorphicCard from '../components/GlassmorphicCard';

const PoetVerificationScreen = () => {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Check if current user is admin
  const isAdmin = auth().currentUser?.uid === ADMIN_UID;

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to access this page.',
        [
          { 
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      return;
    }
    
    const fetchRequests = async () => {
      try {
        const requestsSnapshot = await firestore()
          .collection('poetVerificationRequests')
          .where('status', '==', 'pending')
          .orderBy('submittedAt', 'desc')
          .get();
          
        if (!requestsSnapshot.empty) {
          const requestsData = requestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            submittedAt: doc.data().submittedAt?.toDate().toLocaleDateString('ur-PK') || ''
          }));
          setRequests(requestsData);
        }
      } catch (error) {
        console.error('Error fetching verification requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [isAdmin, navigation]);

  const handleApprove = async (request) => {
    try {
      // Update request status
      await firestore()
        .collection('poetVerificationRequests')
        .doc(request.id)
        .update({
          status: 'approved'
        });
      
      // Update user's account type
      await firestore()
        .collection('users')
        .doc(request.userId)
        .update({
          accountType: 'poet'
        });
      
      // Update UI
      setRequests(requests.filter(r => r.id !== request.id));
      
      Alert.alert(
        'Success',
        'Poet verification request approved.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert(
        'Error',
        'Failed to approve request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleReject = async (request) => {
    try {
      await firestore()
        .collection('poetVerificationRequests')
        .doc(request.id)
        .update({
          status: 'rejected'
        });
      
      // Update UI
      setRequests(requests.filter(r => r.id !== request.id));
      
      Alert.alert(
        'Success',
        'Poet verification request rejected.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert(
        'Error',
        'Failed to reject request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderRequestItem = ({ item }) => (
    <GlassmorphicCard style={styles.requestCard}>
      <Text style={styles.fullName}>{item.fullName}</Text>
      <Text style={styles.submittedAt}>{item.submittedAt}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{URDU_TEXT.bio}</Text>
        <Text style={styles.bioText}>{item.bio}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{URDU_TEXT.sampleGhazal}</Text>
        <Text style={styles.ghazalText}>{item.sampleGhazal}</Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item)}
        >
          <Text style={styles.actionButtonText}>
            {/* Reject in Urdu */}
            مسترد کریں
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item)}
        >
          <Text style={styles.actionButtonText}>
            {/* Approve in Urdu */}
            منظور کریں
          </Text>
        </TouchableOpacity>
      </View>
    </GlassmorphicCard>
  );

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <LinearGradient
        colors={COLORS.background}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color={COLORS.accentGold} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={COLORS.background}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {/* Poet Verification Requests in Urdu */}
          شاعر کی تصدیق کی درخواستیں
        </Text>
      </View>
      
      {requests.length > 0 ? (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.requestsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {/* No pending requests in Urdu */}
            کوئی زیر التواء درخواست نہیں
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: FONTS.urdu,
    fontSize: 22,
    color: COLORS.accentGold,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  requestsList: {
    padding: 16,
  },
  requestCard: {
    padding: 16,
    marginBottom: 16,
  },
  fullName: {
    fontFamily: FONTS.urdu,
    fontSize: 20,
    color: COLORS.accentGold,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  submittedAt: {
    fontFamily: FONTS.urdu,
    fontSize: 14,
    color: 'rgba(229, 229, 229, 0.7)',
    textAlign: 'right',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  bioText: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  ghazalText: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 28,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: COLORS.success,
    marginLeft: 8,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
    marginRight: 8,
  },
  actionButtonText: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: FONTS.urdu,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});

export default PoetVerificationScreen;