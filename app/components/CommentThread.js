import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Keyboard, Platform, UIManager, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../lib/colors';
import { api } from '../lib/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Telegram-style delivery ticks: a single check when delivered, an overlapping
// double-check when the partner has read it (the second ✓ is pulled left so the
// two overlap like Telegram's, not two spaced-out ✓✓). Deep green, which reads
// clearly on the warm/tan outgoing bubble.
const TICK_COLOR = '#15803D';
function Ticks({ read }) {
  if (!read) return <Text style={[styles.tick, styles.tickSolo]}>✓</Text>;
  return (
    <View style={styles.ticksWrap}>
      <Text style={styles.tick}>✓</Text>
      <Text style={[styles.tick, styles.tickOverlap]}>✓</Text>
    </View>
  );
}

export default function CommentThread({ parentType, parentId, meId, header }) {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState([]);
  const [partnerSeenAt, setPartnerSeenAt] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const [kbH, setKbH] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => {
      // scheduleLayoutAnimation uses the keyboard event's exact duration and
      // curve — the layout change rides the same native animation as the keyboard.
      Keyboard.scheduleLayoutAnimation(e);
      setKbH(e.endCoordinates?.height ?? 0);
      // Jump to the newest message so the conversation + input sit above the
      // keyboard. The memory/plan card is a tall list header, so without this
      // you'd still be staring at the header when you start typing.
      //
      // The list shrinks from the bottom as the keyboard rises, so a single
      // scroll fired mid-animation under-shoots and leaves the last message
      // tucked behind the input. Scroll once immediately and again once the
      // keyboard's own animation has settled (its exact duration) so we land
      // on the true bottom regardless of timing.
      const dur = e.duration ?? 250;
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 60);
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: false }), dur + 40);
    };
    const onHide = (e) => {
      Keyboard.scheduleLayoutAnimation(e);
      setKbH(0);
    };
    const s = Keyboard.addListener(showEvt, onShow);
    const h = Keyboard.addListener(hideEvt, onHide);
    return () => { s.remove(); h.remove(); };
  }, []);

  useEffect(() => {
    load();
  }, [parentType, parentId]);

  async function load() {
    try {
      const data = await api.getComments(parentType, parentId);
      setComments(data.comments || []);
      setPartnerSeenAt(data.partner_last_seen_at || null);
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: false }), 50);
    } catch {}
  }

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      await api.addComment(parentType, parentId, trimmed);
      await load();
    } catch (e) {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={{ flex: 1, paddingBottom: kbH > 0 ? kbH + 14 : 0 }}>
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        // When the keyboard opens the list frame shrinks; re-pin to the bottom
        // on that relayout so the last message keeps its gap above the input
        // instead of hiding behind it (no manual scroll needed).
        onLayout={() => { if (kbH > 0) listRef.current?.scrollToEnd?.({ animated: false }); }}
        data={comments}
        keyExtractor={(c) => c.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header || null}
        // The header carries live state (rating stars, note, photos). It's a
        // fresh element each parent render, but FlatList won't re-render the
        // header on that alone — extraData forces it so taps reflect at once.
        extraData={header}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet — say something.</Text>}
        renderItem={({ item }) => {
          const mine = item.user_id === meId;
          const read = mine && partnerSeenAt && new Date(partnerSeenAt) >= new Date(item.created_at);
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              {!mine && <Text style={styles.bubbleAuthor}>{item.user_name}</Text>}
              <Text style={styles.bubbleText}>{item.text}</Text>
              {mine && (
                <Ticks read={read} />
              )}
            </View>
          );
        }}
      />
      <View style={[styles.inputRow, { paddingBottom: kbH > 0 ? 6 : Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          onFocus={() => setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 60)}
          placeholder="Write a message..."
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending || !text.trim()}>
          <Text style={[styles.sendText, (!text.trim() || sending) && { opacity: 0.4 }]}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '78%',
  },
  mine: {
    backgroundColor: colors.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirs: {
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleAuthor: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 3,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  ticksWrap: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  tick: {
    fontSize: 13,
    fontWeight: '700',
    color: TICK_COLOR,
  },
  tickSolo: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  tickOverlap: {
    marginLeft: -6,
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.line || '#eee',
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 20,
    fontSize: 15,
    color: colors.text,
  },
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 15,
  },
});
