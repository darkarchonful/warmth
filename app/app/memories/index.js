import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';

const MOODS = ['😍', '🥰', '😊', '🙂', '😐', '😬', '😅', '🌧️', '🔥', '⭐'];

export default function Memories() {
  const router = useRouter();
  const [memories, setMemories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setRefreshing(true);
    try {
      const data = await api.getMemories();
      setMemories(data);
    } finally {
      setRefreshing(false);
    }
  }

  function openEditor(item) {
    setEditing(item);
    setNoteDraft(item.you_note || '');
  }

  async function saveField(patch) {
    if (!editing) return;
    const next = { ...editing, ...patch };
    setEditing(next);
    setMemories(prev => prev.map(m => m.id === editing.id ? next : m));
    try { await api.updateMemory(editing.id, patch); } catch {}
  }

  async function saveNote() {
    await saveField({ note: noteDraft });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function renderItem({ item }) {
    const partner = item.partner_name || 'Partner';
    const row = (who, rating, mood, note) => (
      <View style={styles.perUserRow}>
        <Text style={styles.whoLabel}>{who}</Text>
        <Text style={styles.rowRating}>{rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '—'}</Text>
        <Text style={styles.rowMood}>{mood || ''}</Text>
        <Text style={styles.rowNote} numberOfLines={1}>{note || ''}</Text>
      </View>
    );
    return (
      <TouchableOpacity
        onPress={() => router.push(`/memories/${item.id}`)}
        onLongPress={() => openEditor(item)}
        style={[styles.item, item.is_new && styles.itemNew]}
      >
        <Text style={styles.date}>{formatDate(item.completed_at)}</Text>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemTagline}>{item.tagline}</Text>
        <Text style={styles.category}>{item.category_name}</Text>
        {row('You', item.you_rating, item.you_mood, item.you_note)}
        {row(partner, item.partner_rating, item.partner_mood, item.partner_note)}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Text style={[styles.back, { textAlign: 'left' }]}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Our Memories</Text>
        <View style={styles.headerSide} />
      </View>

      {memories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No memories yet</Text>
          <Text style={styles.emptySubtext}>Complete an activity together to save it here</Text>
        </View>
      ) : (
        <FlatList
          data={memories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshing={refreshing}
          onRefresh={load}
        />
      )}

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <Pressable style={styles.modalBackdrop} onPress={() => { saveNote(); setEditing(null); }} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing?.title}</Text>

            {(editing?.partner_rating || editing?.partner_mood || editing?.partner_note) ? (
              <View style={styles.partnerPanel}>
                <Text style={styles.partnerLabel}>{editing?.partner_name || 'Partner'} said</Text>
                {editing?.partner_rating ? <Text style={styles.partnerRating}>{'★'.repeat(editing.partner_rating)}{'☆'.repeat(5 - editing.partner_rating)}</Text> : null}
                {editing?.partner_mood ? <Text style={styles.partnerMood}>{editing.partner_mood}</Text> : null}
                {editing?.partner_note ? <Text style={styles.partnerNote}>"{editing.partner_note}"</Text> : null}
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>Your rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => saveField({ rating: editing?.you_rating === n ? null : n })}>
                  <Text style={styles.star}>{(editing?.you_rating || 0) >= n ? '★' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Your mood</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity key={m} onPress={() => saveField({ mood: editing?.you_mood === m ? null : m })}>
                  <Text style={[styles.moodOption, editing?.you_mood === m && styles.moodOptionActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Your note</Text>
            <TextInput
              style={styles.noteInput}
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Remember this one..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <TouchableOpacity style={styles.closeBtn} onPress={() => { saveNote(); setEditing(null); }}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerSide: { flex: 1 },
  back: { fontSize: 14, color: colors.accent, fontWeight: '500' },
  title: { flex: 1, fontSize: 18, color: colors.text, fontWeight: '300', textAlign: 'center' },
  item: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemNew: { borderColor: colors.accent },
  date: { fontSize: 12, color: colors.accent, marginBottom: 6 },
  itemTitle: { fontSize: 18, color: colors.text, marginBottom: 4 },
  itemTagline: { fontSize: 14, color: colors.textLight, marginBottom: 8 },
  category: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  perUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  whoLabel: { fontSize: 12, color: colors.textLight, width: 60 },
  rowRating: { color: '#f5b041', fontSize: 13, width: 80 },
  rowMood: { fontSize: 16, width: 24 },
  rowNote: { flex: 1, fontSize: 12, color: colors.textLight, fontStyle: 'italic' },
  partnerPanel: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  partnerLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  partnerRating: { color: '#f5b041', fontSize: 16 },
  partnerMood: { fontSize: 22, marginTop: 4 },
  partnerNote: { fontSize: 14, color: colors.text, marginTop: 4, fontStyle: 'italic' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 20, color: colors.text, fontWeight: '300', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: colors.textLight },
  modalBg: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { fontSize: 20, color: colors.text, marginBottom: 16 },
  sectionLabel: { fontSize: 13, color: colors.textLight, marginTop: 12, marginBottom: 8 },
  starsRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 32, color: '#f5b041' },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodOption: { fontSize: 28, opacity: 0.5, padding: 4 },
  moodOptionActive: { opacity: 1 },
  noteInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    color: colors.text,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  closeBtn: {
    backgroundColor: colors.accent,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});
