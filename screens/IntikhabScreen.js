import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { firestore, auth } from '../utils/firebaseConfig';
import { COLORS, FONTS, URDU_TEXT } from '../utils/constants';
import CoupletCarousel from '../components/CoupletCarousel';
import CommentSection from '../components/CommentSection';

const IntikhabScreen = () => {
  const route = useRoute();
  const { userId, intikhabName } = route.params;
  const [userData, setUserData] = useState(null);
  const [couplets, setCouplets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const currentUser = auth().currentUser;

  useEffect(() => {
    const fetchIntikhabData = async () => {
      try {
        // Fetch user data
        const userDoc = await firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
          throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        setUserData(userData);
        
        // Check if current user is following this Intikhab
        if (currentUser) {
          const currentUserDoc = await firestore().collection('users').doc(currentUser.uid).get();
          const currentUserData = currentUserDoc.data();
          setFollowing(currentUserData.followedIntikhab?.includes(userId) || false);
        }
        
        // Fetch couplets in the Intikhab collection
        const intikhabItems = userData.intikhab[intikhabName]?.items || [];
        
        if (intikhabItems.length > 0) {
          const coupletPromises = intikhabItems.map(async item => {
            if (item.type === 'couplet') {
              const coupletDoc = await firestore().collection('couplets').doc(item.id).get();
              if (coupletDoc.exists) {
                return {
                  id: coupletDoc.id,
                  ...coupletDoc.data()
                };
              }
            }
            return null;
          });
          
          const loadedCouplets = (await Promise.all(coupletPromises)).filter(Boolean);
          setCouplets(loadedCouplets);
        }
      } catch (error) {
        console.error('Error fetching Intikhab data:', error);
        Alert.alert(
          'Error',
          'Failed to load Intikhab collection. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchIntikhabData();
  }, [userId, intikhabName]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to follow this Intikhab collection.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      const batch = firestore().batch();
      
      // Update current user's followedIntikhab array
      const currentUserRef = firestore().collection('users').doc(currentUser.uid);
      if (following) {
        batch.update(currentUserRef, {
          followedIntikhab: firestore.FieldValue.arrayRemove(userId)
        });
      } else {
        batch.update(currentUserRef, {
          followedIntikhab: firestore.FieldValue.arrayUnion(userId)
        });
      }
      
      // Update target user's followers array
      const targetUserRef = firestore().collection('users').doc(userId);
      if (following) {
        batch.update(targetUserRef, {
          [`intikhab.${intikhabName}.followers`]: firestore.FieldValue.arrayRemove(currentUser.uid)
        });
      } else {
        batch.update(targetUserRef, {
          [`intikhab.${intikhabName}.followers`]: firestore.FieldValue.arrayUnion(currentUser.uid)
        });
      }
      
      await batch.commit();
      
      // Update UI state
      setFollowing(!following);
      
      Alert.alert(
        'Success',
        following ? 'Unfollowed successfully' : 'Following successfully',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert(
        'Error',
        'Failed to update follow status. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

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
        <Text style={styles.headerTitle}>{intikhabName}</Text>
        <Text style={styles.headerSubtitle}>{userData?.username}</Text>
        
        {currentUser && currentUser.uid !== userId && (
          <TouchableOpacity
            style={[
              styles.followButton,
              following ? styles.followingButton : {}
            ]}
            onPress={handleFollowToggle}
          >
            <Text style={styles.followButtonText}>
              {following ? URDU_TEXT.unfollow : URDU_TEXT.follow}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        {couplets.length > 0 ? (
          <View style={styles.carouselContainer}>
            <CoupletCarousel couplets={couplets} />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{URDU_TEXT.noItems}</Text>
          </View>
        )}
        
        <CommentSection userId={userId} intikhabName={intikhabName} />
      </View>
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
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.urdu,
    fontSize: 24,
    color: COLORS.accentGold,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  followButton: {
    backgroundColor: COLORS.accentGold,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.accentGold,
  },
  followButtonText: {
    fontFamily: FONTS.urdu,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  content: {
    flex: 1,
  },
  carouselContainer: {
    flex: 1,
    maxHeight: 400,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});

export default IntikhabScreen;