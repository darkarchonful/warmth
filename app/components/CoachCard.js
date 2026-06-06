import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../lib/colors';

// One-time onboarding coach overlay. Shown at the two "aha" moments (first
// match, first completion) so a new couple understands the loop. The button IS
// the next step — there's no separate dismiss; tapping it routes them where
// they should go (Plans / Memories) and closes the card.
export default function CoachCard({ visible, emoji, title, body, cta, onPress }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onPress}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.85}>
            <Text style={styles.btnText}>{cta}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(61,44,44,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 16, lineHeight: 23, color: colors.textLight, textAlign: 'center', marginBottom: 24 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
