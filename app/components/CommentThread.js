import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Keyboard, Platform, UIManager, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../lib/colors';
import { api } from '../lib/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
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
    <View style={{ flex: 1, paddingBottom: kbH }}>
      <FlatList
        ref={listRef}
        data={comments}
        keyExtractor={(c) => c.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 10 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header || null}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet — say something.</Text>}
        renderItem={({ item }) => {
          const mine = item.user_id === meId;
          const read = mine && partnerSeenAt && new Date(partnerSeenAt) >= new Date(item.created_at);
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              {!mine && <Text style={styles.bubbleAuthor}>{item.user_name}</Text>}
              <Text style={styles.bubbleText}>{item.text}</Text>
              {mine && (
                <Text style={styles.ticks}>{read ? '✓✓' : '✓'}</Text>
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
  ticks: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
    marginTop: 2,
    letterSpacing: -3,
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
    paddingTop: 8,
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
