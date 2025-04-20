import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  StatusBar,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { firestore } from '../utils/firebaseConfig';
import { COLORS, FONTS, URDU_TEXT } from '../utils/constants';
import GlassmorphicCard from '../components/GlassmorphicCard';

const DiscoverScreen = () => {
  const navigation = useNavigation();
  const [trendingIntikhab, setTrendingIntikhab] = useState([]);
  const [trendingCouplets, setTrendingCouplets] = useState([]);
  const [loadingIntikhab, setLoadingIntikhab] = useState(true);
  const [loadingCouplets, setLoadingCouplets] = useState(true);

  useEffect(() => {
    // Fetch trending Intikhab collections
    const fetchTrendingIntikhab = async () => {
      try {
        // Query users collection to find Intikhab collections with most followers
        const usersSnapshot = await firestore()
          .collection('users')
          .orderBy('intikhab.Intikhab-e-username.followers.length', 'desc')
          .limit(5)
          .get();

        if (!usersSnapshot.empty) {
          const intikhabData = usersSnapshot.docs.map(doc => {
            const userData = doc.data();
            const intikhabName = Object.keys(userData.intikhab)[0];
            const intikhab = userData.intikhab[intikhabName];
            
            return {
              id: doc.id,
              username: userData.username,
              intikhabName,
              followersCount: intikhab.followers?.length || 0,
              itemsCount: intikhab.items?.length || 0,
              isPublic: intikhab.isPublic
            };
          });
          
          setTrendingIntikhab(intikhabData.filter(item => item.isPublic));
        }
      } catch (error) {
        console.error('Error fetching trending Intikhab:', error);
      } finally {
        setLoadingIntikhab(false);
      }
    };

    // Fetch trending couplets
    const fetchTrendingCouplets = async () => {
      try {
        const coupletsSnapshot = await firestore()
          .collection('couplets')
          .orderBy('intikhabCount', 'desc')
          .limit(5)
          .get();

        if (!coupletsSnapshot.empty) {
          const coupletPromises = coupletsSnapshot.docs.map(async doc => {
            const coupletData = doc.data();
            
            // Fetch the ghazal data to get poet name and ghazal title
            let poetName = coupletData.poet || '';
            let ghazalTitle = '';
            
            if (coupletData.ghazalId) {
              const ghazalDoc = await firestore()
                .collection('ghazals')
                .doc(coupletData.ghazalId)
                .get();
                
              if (ghazalDoc.exists) {
                const ghazalData = ghazalDoc.data();
                poetName = ghazalData.poet || poetName;
                ghazalTitle = ghazalData.title || '';
              }
            }
            
            return {
              id: doc.id,
              content: coupletData.content,
              intikhabCount: coupletData.intikhabCount || 0,
              poetName,
              ghazalTitle
            };
          });
          
          const couplets = await Promise.all(coupletPromises);
          setTrendingCouplets(couplets);
        }
      } catch (error) {
        console.error('Error fetching trending couplets:', error);
      } finally {
        setLoadingCouplets(false);
      }
    };

    fetchTrendingIntikhab();
    fetchTrendingCouplets();
  }, []);

  const navigateToIntikhab = (userId, intikhabName) => {
    navigation.navigate('Intikhab', { userId, intikhabName });
  };

  const navigateToCouplet = (couplet) => {
    // Navigate to a detailed view of the couplet or directly to the HomeScreen with this couplet
    navigation.navigate('Home', { selectedCouplet: couplet });
  };

  const renderIntikhabItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigateToIntikhab(item.id, item.intikhabName)}
      activeOpacity={0.8}
    >
      <GlassmorphicCard style={styles.intikhabCard}>
        <Text style={styles.intikhabName}>{item.intikhabName}</Text>
        <Text style={styles.username}>{item.username}</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {/* Followers count in Urdu */}
            فالوورز: {item.followersCount}
          </Text>
          <Text style={styles.statsText}>
            {/* Items count in Urdu */}
            اشعار: {item.itemsCount}
          </Text>
        </View>
      </GlassmorphicCard>
    </TouchableOpacity>
  );

  const renderCoupletItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigateToCouplet(item)}
      activeOpacity={0.8}
    >
      <GlassmorphicCard style={styles.coupletCard} withBorder>
        <Text style={styles.poetName}>{item.poetName}</Text>
        <Text style={styles.coupletPreview} numberOfLines={2}>
          {item.content}
        </Text>
        <Text style={styles.savedCount}>
          {/* Saved by count in Urdu */}
          محفوظ کیا گیا: {item.intikhabCount}
        </Text>
      </GlassmorphicCard>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={COLORS.background}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{URDU_TEXT.discover}</Text>
      </View>
      
      <FlatList
        data={[1]} // Just one item to render both sections
        keyExtractor={() => 'main'}
        renderItem={() => (
          <View style={styles.content}>
            {/* Trending Intikhab Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {/* Trending Intikhab in Urdu */}
                ٹرینڈنگ انتخاب
              </Text>
              
              {loadingIntikhab ? (
                <ActivityIndicator size="large" color={COLORS.accentGold} style={styles.loader} />
              ) : trendingIntikhab.length > 0 ? (
                <FlatList
                  data={trendingIntikhab}
                  renderItem={renderIntikhabItem}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              ) : (
                <Text style={styles.emptyText}>{URDU_TEXT.noItems}</Text>
              )}
            </View>
            
            {/* Trending Couplets Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {/* Trending Couplets in Urdu */}
                ٹرینڈنگ اشعار
              </Text>
              
              {loadingCouplets ? (
                <ActivityIndicator size="large" color={COLORS.accentGold} style={styles.loader} />
              ) : trendingCouplets.length > 0 ? (
                <FlatList
                  data={trendingCouplets}
                  renderItem={renderCoupletItem}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              ) : (
                <Text style={styles.emptyText}>{URDU_TEXT.noItems}</Text>
              )}
            </View>
          </View>
        )}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: FONTS.urdu,
    fontSize: 28,
    color: COLORS.accentGold,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  content: {
    padding: 16,
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
  horizontalList: {
    paddingRight: 16,
  },
  intikhabCard: {
    width: 200,
    height: 150,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  intikhabName: {
    fontFamily: FONTS.urdu,
    fontSize: 18,
    color: COLORS.accentGold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  username: {
    fontFamily: FONTS.urdu,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsText: {
    fontFamily: FONTS.urdu,
    fontSize: 12,
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  coupletCard: {
    width: 250,
    height: 180,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  poetName: {
    fontFamily: FONTS.urdu,
    fontSize: 16,
    color: COLORS.accentGold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  coupletPreview: {
    fontFamily: FONTS.urdu,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 30,
    flex: 1,
  },
  savedCount: {
    fontFamily: FONTS.urdu,
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  loader: {
    marginVertical: 20,
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

export default DiscoverScreen;