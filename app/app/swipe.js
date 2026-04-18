import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, PanResponder, Image, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors } from '../lib/colors';
import { api, API_URL, clearToken } from '../lib/api';

function resolveImage(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.25;

export default function Swipe() {
  const router = useRouter();
  const [activity, setActivity] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [matchPopup, setMatchPopup] = useState(null);
  const [done, setDone] = useState(false);
  const [backendVersion, setBackendVersion] = useState('');
  const [unread, setUnread] = useState(0);
  const [unreadMem, setUnreadMem] = useState(0);

  const pan = useRef(new Animated.ValueXY()).current;
  const activityRef = useRef(null);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    api.health().then(d => setBackendVersion(d.version || '?')).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    loadNext();
    const tick = () => api.me().then(d => {
      setUnread(d.unreadCount || 0);
      setUnreadMem(d.unreadMemories || 0);
    }).catch(() => {});
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []));

  async function loadNext() {
    try {
      const data = await api.nextActivity();
      if (data.error && /not in a couple/i.test(data.error)) {
        router.replace('/');
        return;
      }
      if (data.blocked) {
        setBlocked(true);
        setBlockMessage(data.message);
        return;
      }
      if (data.done) {
        setBlocked(false);
        setDone(true);
        return;
      }
      setBlocked(false);
      setDone(false);
      pan.setValue({ x: 0, y: 0 });
      setActivity(data);
    } catch (e) {
      if (/not in a couple/i.test(e.message || '')) {
        router.replace('/');
        return;
      }
      console.error(e);
    }
  }

  async function handleSwipe(liked) {
    const current = activityRef.current;
    if (!current) return;
    try {
      const result = await api.swipe(current.id, liked);
      if (result.match) {
        setMatchPopup(current.title);
        setTimeout(() => {
          setMatchPopup(null);
          loadNext();
        }, 2500);
      } else {
        loadNext();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function flyOff(liked) {
    Animated.timing(pan, {
      toValue: { x: liked ? SCREEN_W * 1.5 : -SCREEN_W * 1.5, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handleSwipe(liked);
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          flyOff(true);
        } else if (g.dx < -SWIPE_THRESHOLD) {
          flyOff(false);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    }),
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ['-15deg', '0deg', '15deg'],
  });
  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (blocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.blockedEmoji}>✨</Text>
        <Text style={styles.blockedTitle}>Time to act</Text>
        <Text style={styles.blockedText}>{blockMessage}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/checklist')}
        >
          <Text style={styles.buttonText}>View plans</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.container}>
        <Text style={styles.blockedTitle}>You've seen everything</Text>
        <Text style={styles.blockedText}>New ideas coming soon</Text>
      </View>
    );
  }

  if (matchPopup) {
    return (
      <View style={styles.container}>
        <Text style={styles.matchEmoji}>💛</Text>
        <Text style={styles.matchTitle}>You both want this!</Text>
        <Text style={styles.matchActivity}>{matchPopup}</Text>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text style={styles.blockedText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navSide} onPress={() => router.push('/checklist')}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.navItem, { textAlign: 'left' }]}>Plans</Text>
            {unread > 0 && <View style={styles.unreadDot} />}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navSide} onLongPress={() => {
          Alert.alert('Warmth', '', [
            { text: 'Unpair', style: 'destructive', onPress: () => {
              Alert.alert('Unpair?', 'This will end the pairing and delete your swipes and shared plans. Your partner will see the app as unpaired.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Unpair', style: 'destructive', onPress: async () => {
                  try { await api.unpair(); router.replace('/'); } catch (e) { Alert.alert('Error', e.message); }
                } },
              ]);
            } },
            { text: 'Log out', onPress: async () => { await clearToken(); router.replace('/'); } },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }}>
          <Text style={styles.navTitle}>Warmth {backendVersion ? `· ${backendVersion}` : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navSide} onPress={() => router.push('/memories')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text style={[styles.navItem, { textAlign: 'right' }]}>Memories</Text>
            {unreadMem > 0 && <View style={styles.unreadDot} />}
          </View>
        </TouchableOpacity>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
        ]}
      >
        {activity.image_url ? (
          <Image source={{ uri: resolveImage(activity.image_url) }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImage}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(activity.category_name)}</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.category}>{activity.category_name}</Text>
          <Text style={styles.cardTitle}>{activity.title}</Text>
          <Text style={styles.cardTagline}>{activity.tagline}</Text>
        </View>

        <Animated.View style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}>
          <Text style={styles.likeText}>LOVE</Text>
        </Animated.View>
        <Animated.View style={[styles.overlay, styles.skipOverlay, { opacity: skipOpacity }]}>
          <Text style={styles.skipOverlayText}>SKIP</Text>
        </Animated.View>
      </Animated.View>

      <Text style={styles.swipeHint}>Swipe right if it warms you,{'\n'}left if not for now</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.swipeBtn, styles.skipBtn]}
          onPress={() => flyOff(false)}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeBtn, styles.loveBtn]}
          onPress={() => flyOff(true)}
        >
          <Text style={styles.loveText}>Love this</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getCategoryIcon(category) {
  const icons = {
    Adventures: '🏔',
    Chill: '☕',
    Creative: '🎨',
    Travel: '✈️',
    Daily: '☀️',
    Romance: '💐',
    Seasonal: '❄️',
    Food: '🍷',
    Sporty: '🚴',
  };
  return icons[category] || '✨';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 80,
    paddingBottom: 10,
    position: 'absolute',
    top: 0,
    paddingHorizontal: 20,
  },
  navSide: {
    flex: 1,
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    fontWeight: '300',
    textAlign: 'center',
  },
  navItem: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginLeft: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardImage: {
    height: 280,
    width: '100%',
    backgroundColor: colors.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 80,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardTagline: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 30,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeOverlay: {
    right: 24,
    borderColor: colors.accent,
  },
  skipOverlay: {
    left: 24,
    borderColor: '#888',
  },
  likeText: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  skipOverlayText: {
    color: '#888',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  swipeHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    lineHeight: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: 20,
  },
  swipeBtn: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  skipBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  loveBtn: {
    backgroundColor: colors.accent,
  },
  skipText: {
    color: colors.textLight,
    fontSize: 18,
  },
  loveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  blockedEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  blockedTitle: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '300',
    marginBottom: 10,
  },
  blockedText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  matchEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  matchTitle: {
    fontSize: 26,
    color: colors.text,
    fontWeight: '300',
    marginBottom: 10,
  },
  matchActivity: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: '500',
  },
});
