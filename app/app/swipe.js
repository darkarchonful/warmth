import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../lib/colors';
import { api } from '../lib/api';

export default function Swipe() {
  const router = useRouter();
  const [activity, setActivity] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [matchPopup, setMatchPopup] = useState(null);
  const [done, setDone] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadNext();
  }, []);

  async function loadNext() {
    try {
      const data = await api.nextActivity();
      if (data.blocked) {
        setBlocked(true);
        setBlockMessage(data.message);
        return;
      }
      if (data.done) {
        setDone(true);
        return;
      }
      fadeAnim.setValue(0);
      setActivity(data);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSwipe(liked) {
    if (!activity) return;
    try {
      const result = await api.swipe(activity.id, liked);
      if (result.match) {
        setMatchPopup(activity.title);
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
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.push('/checklist')}>
          <Text style={styles.navItem}>Plans</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Warmth</Text>
        <TouchableOpacity onPress={() => router.push('/memories')}>
          <Text style={styles.navItem}>Memories</Text>
        </TouchableOpacity>
      </View>

      {/* Card */}
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.cardImage}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(activity.category_name)}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.category}>{activity.category_name}</Text>
          <Text style={styles.cardTitle}>{activity.title}</Text>
          <Text style={styles.cardTagline}>{activity.tagline}</Text>
        </View>
      </Animated.View>

      {/* Swipe hint */}
      <Text style={styles.swipeHint}>Swipe with care — if it's a match,{'\n'}your partner is hoping you'll make it happen</Text>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.swipeBtn, styles.skipBtn]}
          onPress={() => handleSwipe(false)}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeBtn, styles.loveBtn]}
          onPress={() => handleSwipe(true)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 50,
    paddingBottom: 10,
    position: 'absolute',
    top: 0,
    paddingHorizontal: 20,
  },
  navTitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '300',
  },
  navItem: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
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
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 25,
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
    fontSize: 16,
  },
  loveText: {
    color: '#fff',
    fontSize: 16,
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
