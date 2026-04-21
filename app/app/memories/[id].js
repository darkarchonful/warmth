import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
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
  const [busy, setBusy] = useState(false);

  async function reload() {
    const list = await api.getMemories();
    setItem(list.find(x => x.id.toString() === id));
  }

  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setMeId(me.user.id);
        await reload();
      } catch {}
    })();
  }, [id]);

  async function handleRequestRepeat() {
    setBusy(true);
    try { await api.requestRepeat(item.id); await reload(); } catch (e) { Alert.alert('Could not request', e.message); }
    setBusy(false);
  }

  async function handleCancelRepeat() {
    setBusy(true);
    try { await api.cancelRepeat(item.id); await reload(); } catch {}
    setBusy(false);
  }

  async function handleAcceptRepeat() {
    setBusy(true);
    try {
      await api.acceptRepeat(item.id);
      Alert.alert('Added to Plans', 'This one is back on your list.');
      await reload();
    } catch (e) { Alert.alert('Could not accept', e.message); }
    setBusy(false);
  }

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

      {item.repeat_requested_by_partner && (
        <View style={styles.repeatBanner}>
          <Text style={styles.repeatBannerText}>{partner} wants to do this again</Text>
          <View style={styles.repeatBannerRow}>
            <TouchableOpacity style={[styles.repeatBtn, styles.repeatAcceptBtn]} onPress={handleAcceptRepeat} disabled={busy}>
              <Text style={styles.repeatAcceptText}>Yes, let's</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.repeatBtn, styles.repeatDeclineBtn]} onPress={handleCancelRepeat} disabled={busy}>
              <Text style={styles.repeatDeclineText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {item.repeat_requested_by_you && (
        <View style={styles.repeatPending}>
          <Text style={styles.repeatPendingText}>Waiting for {partner} to accept the repeat</Text>
          <TouchableOpacity onPress={handleCancelRepeat} disabled={busy}>
            <Text style={styles.repeatCancelLink}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {!item.repeat_requested_by_you && !item.repeat_requested_by_partner && (
        <TouchableOpacity style={styles.repeatCta} onPress={handleRequestRepeat} disabled={busy}>
          <Text style={styles.repeatCtaText}>Do this again</Text>
        </TouchableOpacity>
      )}

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
  repeatCta: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  repeatCtaText: { color: colors.accent, fontSize: 14, fontWeight: '500' },
  repeatBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.warm || '#fff5ee',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  repeatBannerText: { fontSize: 14, color: colors.text, marginBottom: 10 },
  repeatBannerRow: { flexDirection: 'row', gap: 8 },
  repeatBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  repeatAcceptBtn: { backgroundColor: colors.accent },
  repeatAcceptText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  repeatDeclineBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.textLight },
  repeatDeclineText: { color: colors.textLight, fontSize: 14, fontWeight: '500' },
  repeatPending: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repeatPendingText: { fontSize: 13, color: colors.textLight, fontStyle: 'italic', flex: 1 },
  repeatCancelLink: { color: colors.accent, fontSize: 13, fontWeight: '500', marginLeft: 8 },
});
