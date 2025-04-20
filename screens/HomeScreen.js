import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  RefreshControl,
  ScrollView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { firestore } from '../utils/firebaseConfig';
import { COLORS, FONTS, URDU_TEXT } from '../utils/constants';
import CoupletCarousel from '../components/CoupletCarousel';

const HomeScreen = ({ navigation }) => {
  const [couplets, setCouplets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const batchSize = 10;

  const fetchCouplets = async (refresh = false) => {
    if (loading && !refresh) return;
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let query = firestore().collection('couplets').orderBy('intikhabCount', 'desc').limit(batchSize);
      
      if (!refresh && lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible);

      const newCouplets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (refresh) {
        setCouplets(newCouplets);
      } else {
        setCouplets(prevCouplets => [...prevCouplets, ...newCouplets]);
      }
    } catch (error) {
      console.error('Error fetching couplets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCouplets(true);
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCouplets(true);
    }, [])
  );

  const handleRefresh = () => {
    setHasMore(true);
    fetchCouplets(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchCouplets();
    }
  };

  return (
    <LinearGradient
      colors={COLORS.background}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{URDU_TEXT.appName}</Text>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accentGold}
            colors={[COLORS.accentGold]}
          />
        }
        onScrollEndDrag={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            handleLoadMore();
          }
        }}
      >
        <View style={styles.carouselContainer}>
          <CoupletCarousel couplets={couplets} />
        </View>
        
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accentGold} />
          </View>
        )}
        
        {!hasMore && couplets.length > 0 && (
          <Text style={styles.endText}>
            {/* End of couplets message in Urdu */}
            آپ نے تمام اشعار دیکھ لیے ہیں
          </Text>
        )}
      </ScrollView>
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
  scrollView: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  carouselContainer: {
    flex: 1,
    marginTop: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  endText: {
    fontFamily: FONTS.urdu,
    color: COLORS.text,
    textAlign: 'center',
    padding: 20,
    writingDirection: 'rtl',
  },
});

export default HomeScreen;