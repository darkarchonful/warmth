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

export default function PlanDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [meId, setMeId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setMeId(me.user.id);
        const list = await api.getChecklist();
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
  const statusLabel = item.status === 'matched' ? 'Confirm' : item.status === 'approved' ? 'Planned' : 'Done';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan</Text>
        <View style={{ flex: 1 }} />
      </View>

      <View style={styles.headerCard}>
        {item.image_url && (
          <Image source={{ uri: resolveImage(item.image_url) }} style={styles.image} resizeMode="cover" />
        )}
        <View style={styles.meta}>
          <Text style={styles.category}>{item.category_name}  ·  {statusLabel}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.tagline} numberOfLines={1}>{item.tagline}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={{ flex: 1 }}>
        <CommentThread parentType="plan" parentId={item.id} meId={meId} />
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
  category: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
  title: { fontSize: 22, color: colors.text, fontWeight: '500', marginBottom: 6 },
  tagline: { fontSize: 14, color: colors.textLight, marginBottom: 10 },
  stateLine: { fontSize: 13, color: colors.textLight },
  divider: { height: 1, backgroundColor: colors.line || '#eee' },
});
