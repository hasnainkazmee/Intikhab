import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  StatusBar,
  Alert,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { firestore, auth, signOut } from '../utils/firebaseConfig';
import { COLORS, FONTS, URDU_TEXT, ADMIN_UID } from '../utils/constants';
import GlassmorphicCard from '../components/GlassmorphicCard';
import CoupletCarousel from '../components/CoupletCarousel';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [userCouplets, setUserCouplets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [intikhabName, setIntikhabName] = useState('');
  const [followedIntikhab, setFollowedIntikhab] = useState([]);
  const [followedPoets, setFollowedPoets] = useState([]);
  const [loadingFollowed, setLoadingFollowed] = useState(true);
  const [adminMode, setAdminMode] = useState(false);

  // Check if current user is admin
  const isAdmin = auth().currentUser?.uid === ADMIN_UID;

  // Fetch user data and their Intikhab collection
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const userId = auth().currentUser.uid;
      const userDoc = await firestore().collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        const data = userDoc.data();
        setUserData(data);
        
        // Get the user's Intikhab collection name
        const intikhabKey = Object.keys(data.intikhab)[0];
        setIntikhabName(intikhabKey);
        
        // Fetch couplets in the user's Intikhab collection
        const intikhabItems = data.intikhab[intikhabKey].items || [];
        
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
          
          const couplets = (await Promise.all(coupletPromises)).filter(Boolean);
          setUserCouplets(couplets);
        } else {
          setUserCouplets([]);
        }
        
        // Fetch followed Intikhab collections
        if (data.followedIntikhab && data.followedIntikhab.length > 0) {
          const followedPromises = data.followedIntikhab.map(async followedId => {
            const followedDoc = await firestore().collection('users').doc(followedId).get();
            if (followedDoc.exists) {
              const followedData = followedDoc.data();
              const followedIntikhabName = Object.keys(followedData.intikhab)[0];
              
              return {
                id: followedId,
                username: followedData.username,
                intikhabName: followedIntikhabName
              };
            }
            return null;
          });
          
          const followed = (await Promise.all(followedPromises)).filter(Boolean);
          setFollowedIntikhab(followed);
        }
        
        // Set followed poets
        setFollowedPoets(data.followedPoets || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setLoadingFollowed(false);
    }
  };

  // Fetch data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  // Handle removing a couplet from Intikhab
  const handleRemoveCouplet = async (couplet) => {
    try {
      const userId = auth().currentUser.uid;
      
      // Update user's Intikhab collection
      await firestore().collection('users').doc(userId).update({
        [`intikhab.${intikhabName}.items`]: firestore.FieldValue.arrayRemove({
          type: 'couplet',
          id: couplet.id,
          poet: couplet.poet
        })
      });
      
      // Update couplet's savedBy and intikhabCount
      await firestore().collection('couplets').doc(couplet.id).update({
        savedBy: firestore.FieldValue.arrayRemove(userId),
        intikhabCount: firestore.FieldValue.increment(-1)
      });
      
      // Update UI
      setUserCouplets(userCouplets.filter(c => c.id !== couplet.id));
      
      Alert.alert(
        'Success',
        'Couplet removed from your Intikhab collection',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error removing couplet:', error);
      Alert.alert(
        'Error',
        'Failed to remove couplet. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert(
        'Error',
        'Failed to sign out. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle long press for admin mode
  const handleLongPress = () => {
    if (isAdmin) {
      setAdminMode(!adminMode);
      if (!adminMode) {
        Alert.alert(
          'Admin Mode',
          'Admin mode activated. You can now access poet verification requests.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Navigate to poet verification requests
  const navigateToPoetVerification = () => {
    if (isAdmin && adminMode) {
      navigation.navigate('PoetVerification');
    }
  };

  // Navigate to Intikhab collection
  const navigateToIntikhab = (userId, intikhabName) => {
    navigation.navigate('Intikhab', { userId, intikhabName });
  };

  // Navigate to poet page
  const navigateToPoet = (poetId) => {
    navigation.navigate('Poet', { poetId });
  };

  // Render followed Intikhab item
  const renderFollowedIntikhabItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigateToIntikhab(item.id, item.intikhabName)}
      style={styles.followedItem}
    >
      <Text style={styles.followedText}>{item.intikhabName}</Text>
      <Text style={styles.followedSubtext}>{item.username}</Text>
    </TouchableOpacity>
  );

  // Render followed poet item
  const renderFollowedPoetItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigateToPoet(item)}
      style={styles.followedItem}
    >
      <Text style={styles.followedText}>{item}</Text>
    </TouchableOpacity>
  );

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
        <Text 
          style={styles.headerTitle}
          onLongPress={handleLongPress}
        >
          {URDU_TEXT.profile}
        </Text>
        
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Info */}
        <GlassmorphicCard style={styles.userCard}>
          <Text style={styles.username}>{userData?.username}</Text>
          <Text style={styles.email}>{userData?.email}</Text>
          <Text style={styles.accountType}>
            {userData?.accountType === 'poet' ? 'شاعر' : 'کیوریٹر'}
          </Text>
          
          {userData?.accountType !== 'poet' && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => navigation.navigate('PoetVerificationRequest')}
            >
              <Text style={styles.verifyButtonText}>
                {/* Request poet verification in Urdu */}
                شاعر کی تصدیق کی درخواست دیں
              </Text>
            </TouchableOpacity>
          )}
        </GlassmorphicCard>
        
        {/* User's Intikhab Collection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{intikhabName}</Text>
            <TouchableOpacity
              onPress={() => navigateToIntikhab(userData.id, intikhabName)}
            >
              <Text style={styles.viewAllText}>
                {/* View all in Urdu */}
                سب دیکھیں
              </Text>
            </TouchableOpacity>
          </View>
          
          {userCouplets.length > 0 ? (
            <View style={styles.carouselContainer}>
              <CoupletCarousel 
                couplets={userCouplets} 
                miniView={true}
                onSave={handleRemoveCouplet}
              />
            </View>
          ) : (
            <Text style={styles.emptyText}>{URDU_TEXT.noItems}</Text>
          )}
        </View>
        
        {/* Followed Intikhab Collections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{URDU_TEXT.followedIntikhab}</Text>
          
          {loadingFollowed ? (
            <ActivityIndicator size="small" color={COLORS.accentGold} style={styles.loader} />
          ) : followedIntikhab.length > 0 ? (
            <FlatList
              data={followedIntikhab}
              renderItem={renderFollowedIntikhabItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>{URDU_TEXT.noItems}</Text>
          )}
        </View>
        
        {/* Followed Poets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{URDU_TEXT.followedPoets}</Text>
          
          {loadingFollowed ? (
            <ActivityIndicator size="small" color={COLORS.accentGold} style={styles.loader} />
          ) : followedPoets.length > 0 ? (
            <FlatList
              data={followedPoets}
              renderItem={renderFollowedPoetItem}
              keyExtractor={item => item}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>{URDU_TEXT.noItems}</Text>
          )}
        </View>
        
        {/* Admin Panel (only visible in admin mode) */}
        {isAdmin && adminMode && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={navigateToPoetVerification}
          >
            <Text style={styles.adminButtonText}>
              {/* Poet Verification Requests in Urdu */}
              شاعر کی تصدیق کی درخواستیں
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.urdu,
    fontSize: 28,
    color: COLORS.accentGold,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  signOutButton: {
    position: 'absolute',
    right: 20,
  },
  scrollContent: {
    padding: 16,
  },
  userCard: {
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  username: {
    fontFamily: FONTS.urdu,
    fontSize: 24,
    color: COLORS.accentGold,
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  email: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  accountType: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  verifyButton: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verifyButtonText: {
    fontFamily: FONTS.urdu,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.urdu,
    fontSize: 20,
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  viewAllText: {
    fontFamily: FONTS.urdu,
    fontSize: 14,
    color: COLORS.accentBlue,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  carouselContainer: {
    height: 200,
  },
  followedItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  followedText: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  followedSubtext: {
    fontFamily: FONTS.urdu,
    fontSize: 12,
    color: 'rgba(229, 229, 229, 0.7)',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptyText: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginVertical: 20,
  },
  loader: {
    marginVertical: 20,
  },
  adminButton: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  adminButtonText: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});

export default ProfileScreen;