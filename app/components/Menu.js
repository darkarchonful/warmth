import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors } from '../lib/colors';

export default function Menu({ visible, onClose, partnerName, onUnpair, onLogout }) {
  const [confirmingUnpair, setConfirmingUnpair] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      setConfirmingUnpair(false);
      slide.setValue(0);
      backdrop.setValue(0);
    }
  }, [visible]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
      </TouchableWithoutFeedback>
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          {partnerName ? (
            <Text style={styles.header}>Paired with {partnerName}</Text>
          ) : (
            <Text style={styles.header}>Warmth</Text>
          )}

          {confirmingUnpair ? (
            <>
              <Text style={styles.confirmBody}>
                Ending the pairing deletes your swipes, plans, and shared memories. You two won't be able to re-pair for 48 hours.
              </Text>
              <TouchableOpacity
                style={[styles.row, styles.rowDestructive]}
                onPress={() => {
                  setConfirmingUnpair(false);
                  onUnpair();
                }}
              >
                <Text style={styles.rowTextDestructive}>Yes, unpair</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} onPress={() => setConfirmingUnpair(false)}>
                <Text style={styles.rowText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.row} onPress={() => setConfirmingUnpair(true)}>
                <Text style={[styles.rowText, styles.rowTextWarn]}>Unpair</Text>
                <Text style={styles.rowSub}>End the pairing and wipe shared data</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} onPress={onLogout}>
                <Text style={styles.rowText}>Log out</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.row, styles.rowLast]} onPress={onClose}>
                <Text style={[styles.rowText, styles.rowTextMuted]}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 18,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.textMuted,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowDestructive: {
    backgroundColor: '#FBEAE5',
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 0,
    alignItems: 'center',
  },
  rowText: {
    fontSize: 17,
    color: colors.text,
  },
  rowTextWarn: {
    color: '#B84040',
  },
  rowTextDestructive: {
    fontSize: 17,
    color: '#B84040',
    fontWeight: '500',
  },
  rowTextMuted: {
    color: colors.textLight,
    textAlign: 'center',
  },
  rowSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  confirmBody: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
});
