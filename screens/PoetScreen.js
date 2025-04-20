import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  StatusBar,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { firestore, auth } from '../utils/firebaseConfig';
import { COLORS, FONTS, URDU_TEXT, VERIFIED_POETS } from '../utils/constants';
import GlassmorphicCard from '../components/GlassmorphicCard';

const PoetScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { poetId } = route.params;
  const [poetData, setPoetData] = useState(null);
  const [ghazals, setGhazals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const currentUser = auth().currentUser;
  
  // Check if poet is verified
  const isVerified = VERIFIED_POETS.includes(poetId);

  // Hardcoded poet bios for now
  const poetBios = {
    'mirza-ghalib': 'مرزا اسداللہ بیگ خان، جنہیں مرزا غالب کے نام سے جانا جاتا ہے، اردو اور فارسی کے عظیم شاعر تھے۔ انہیں اردو شاعری کا سب سے بڑا شاعر مانا جاتا ہے۔',
    'ahmad-faraz': 'احمد فراز پاکستان کے مشہور اردو شاعر تھے۔ انہیں ان کی رومانی اور انقلابی شاعری کے لیے جانا جاتا ہے۔',
    'faiz-ahmad-faiz': 'فیض احمد فیض پاکستان کے مشہور شاعر، دانشور اور صحافی تھے۔ انہیں بیسویں صدی کے سب سے اہم اردو شعراء میں شمار کیا جاتا ہے۔',
    'allama-iqbal': 'علامہ محمد اقبال برصغیر پاک و ہند کے عظیم شاعر، فلسفی اور سیاستدان تھے۔ انہیں پاکستان کا روحانی بانی کہا جاتا ہے۔'
  };

  useEffect(() => {
    const fetchPoetData = async () => {
      try {
        // Check if current user is following this poet
        if (currentUser) {
          const currentUserDoc = await firestore().collection('users').doc(currentUser.uid).get();
          const currentUserData = currentUserDoc.data();
          setFollowing(currentUserData.followedPoets?.includes(poetId) || false);
        }
        
        // Set poet data (using hardcoded bio for now)
        setPoetData({
          id: poetId,
          name: poetId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          bio: poetBios[poetId] || 'اس شاعر کا تعارف دستیاب نہیں ہے۔'
        });
        
        // Fetch ghazals by this poet
        const ghazalsSnapshot = await firestore()
          .collection('ghazals')
          .where('poet', '==', poetId)
          .limit(10)
          .get();
          
        if (!ghazalsSnapshot.empty) {
          const ghazalsData = ghazalsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setGhazals(ghazalsData);
        }
      } catch (error) {
        console.error('Error fetching poet data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPoetData();
  }, [poetId]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigation.navigate('Onboarding');
      return;
    }
    
    try {
      const userRef = firestore().collection('users').doc(currentUser.uid);
      
      if (following) {
        await userRef.update({
          followedPoets: firestore.FieldValue.arrayRemove(poetId)
        });
      } else {
        await userRef.update({
          followedPoets: firestore.FieldValue.arrayUnion(poetId)
        });
      }
      
      setFollowing(!following);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const navigateToGhazal = (ghazal) => {
    navigation.navigate('Ghazal', { ghazalId: ghazal.id });
  };

  const renderGhazalItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigateToGhazal(item)}
      activeOpacity={0.8}
    >
      <GlassmorphicCard style={styles.ghazalCard} withBorder>
        <Text style={styles.ghazalTitle}>{item.title}</Text>
        <Text style={styles.ghazalPreview} numberOfLines={3}>
          {item.content?.split('\n').slice(0, 2).join('\n')}
        </Text>
        <View style={styles.ghazalFooter}>
          <Text style={styles.savedCount}>
            {/* Saved count in Urdu */}
            محفوظ کیا گیا: {item.intikhabCount || 0}
          </Text>
        </View>
      </GlassmorphicCard>
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
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Poet Bio */}
        <GlassmorphicCard style={styles.bioCard}>
          <View style={styles.poetHeader}>
            <Text style={styles.poetName}>
              {poetData?.name}
              {isVerified && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.accentBlue} style={styles.verifiedIcon} />
              )}
            </Text>
            
            {currentUser && (
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
          
          <Text style={styles.poetBio}>{poetData?.bio}</Text>
        </GlassmorphicCard>
        
        {/* Ghazals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {/* Ghazals in Urdu */}
            غزلیات
          </Text>
          
          {ghazals.length > 0 ? (
            <FlatList
              data={ghazals}
              renderItem={renderGhazalItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.ghazalsList}
            />
          ) : (
            <Text style={styles.emptyText}>{URDU_TEXT.noItems}</Text>
          )}
        </View>
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
  scrollContent: {
    padding: 16,
  },
  bioCard: {
    padding: 20,
    marginBottom: 24,
  },
  poetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  poetName: {
    fontFamily: FONTS.urdu,
    fontSize: 24,
    color: COLORS.accentGold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  followButton: {
    backgroundColor: COLORS.accentGold,
    paddingHorizontal: 16,
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
  poetBio: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.urdu,
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ghazalsList: {
    paddingBottom: 16,
  },
  ghazalCard: {
    marginBottom: 16,
    padding: 16,
  },
  ghazalTitle: {
    fontFamily: FONTS.urdu,
    fontSize: 18,
    color: COLORS.accentGold,
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ghazalPreview: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 28,
    marginBottom: 12,
  },
  ghazalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  savedCount: {
    fontFamily: FONTS.urdu,
    fontSize: 14,
    color: COLORS.text,
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
});

export default PoetScreen;