import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/colors';
import { api, API_URL } from '../../lib/api';

function resolveImage(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

export default function Memories() {
  const router = useRouter();
  const [memories, setMemories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function renderItem({ item }) {
    const partner = item.partner_name || 'Partner';
    const row = (who, rating, note) => (
      <View style={styles.perUserRow}>
        <Text style={styles.whoLabel}>{who}</Text>
        <Text style={styles.rowRating}>{rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '—'}</Text>
        <Text style={styles.rowNote} numberOfLines={1}>{note || ''}</Text>
      </View>
    );
    return (
      <TouchableOpacity
        onPress={() => router.push(`/memories/${item.id}`)}
        style={[styles.item, (item.is_new || item.repeat_requested_by_partner) && styles.itemNew]}
      >
        <View style={styles.topRow}>
          {item.image_url ? (
            <Image source={{ uri: resolveImage(item.image_url) }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]} />
          )}
          <View style={styles.topText}>
            <Text style={styles.date}>{formatDate(item.completed_at)}</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemTagline}>{item.tagline}</Text>
            <Text style={styles.category}>{item.category_name}</Text>
          </View>
        </View>
        {row('You', item.you_rating, item.you_note)}
        {row(partner, item.partner_rating, item.partner_note)}
        {item.repeat_requested_by_partner && (
          <Text style={styles.repeatFlag}>↻ {partner} wants to do this again</Text>
        )}
        {item.repeat_requested_by_you && (
          <Text style={styles.repeatPending}>↻ Waiting for {partner}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} hitSlop={{ top: 18, bottom: 18, left: 14, right: 14 }} onPress={() => router.back()}>
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
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  topText: { flex: 1 },
  thumb: { width: 56, height: 72, borderRadius: 12, backgroundColor: colors.bg },
  thumbPlaceholder: { borderWidth: 1, borderColor: colors.line || '#eee' },
  repeatFlag: { marginTop: 10, fontSize: 13, color: colors.accent, fontWeight: '500' },
  repeatPending: { marginTop: 10, fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
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
  rowNote: { flex: 1, fontSize: 12, color: colors.textLight, fontStyle: 'italic' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 20, color: colors.text, fontWeight: '300', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: colors.textLight },
});
