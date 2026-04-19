import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../lib/colors';
import { api, API_URL } from '../../lib/api';
import CommentThread from '../../components/CommentThread';

function resolveImage(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

export default function MemoryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [meId, setMeId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setMeId(me.user.id);
        const list = await api.getMemories();
        setItem(list.find(x => x.id.toString() === id));
      } catch {}
    })();
  }, [id]);

  if (!item) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>Back</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  const partner = item.partner_name || 'Partner';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory</Text>
        <View style={{ flex: 1 }} />
      </View>

      <View style={styles.headerCard}>
        {item.image_url && (
          <Image source={{ uri: resolveImage(item.image_url) }} style={styles.image} resizeMode="cover" />
        )}
        <View style={styles.meta}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.stateLine} numberOfLines={1}>
            You {item.you_mood || ''} {item.you_rating ? '★'.repeat(item.you_rating) : ''}
            {'  ·  '}
            {partner} {item.partner_mood || ''} {item.partner_rating ? '★'.repeat(item.partner_rating) : ''}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={{ flex: 1 }}>
        <CommentThread parentType="memory" parentId={item.id} meId={meId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  back: { color: colors.accent, fontSize: 15, fontWeight: '500' },
  headerTitle: { flex: 2, fontSize: 18, color: colors.text, fontWeight: '300', textAlign: 'center' },
  headerCard: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12 },
  image: { width: 80, height: 80, borderRadius: 12, backgroundColor: colors.warm, marginRight: 14 },
  meta: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 22, color: colors.text, fontWeight: '500', marginBottom: 6 },
  tagline: { fontSize: 14, color: colors.textLight, marginBottom: 10 },
  stateLine: { fontSize: 13, color: colors.textLight, marginBottom: 8 },
  note: { fontSize: 14, color: colors.text, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.line || '#eee' },
});
