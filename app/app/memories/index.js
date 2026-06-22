import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Image, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors } from '../../lib/colors';
import { api, imageSource } from '../../lib/api';

// One scatter card: springs in (fade + scale-from-0.6 + tilt), staggered by
// index — same entrance as the Time-to-act scatter. Re-plays whenever `nonce`
// changes (i.e. each time the screen is focused), without remounting the image.
function AnimatedStackCard({ url, index, tilt, tx, nonce }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    enter.setValue(0);
    Animated.spring(enter, {
      toValue: 1, friction: 6, tension: 55, delay: index * 130, useNativeDriver: true,
    }).start();
  }, [nonce]);
  return (
    <Animated.Image
      source={imageSource(url)}
      style={[styles.stackCard, {
        opacity: enter,
        zIndex: index,
        transform: [
          { translateX: tx },
          { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
          { rotate: tilt },
        ],
      }]}
    />
  );
}

// Each partner's own photo, shown as a small tilted stack (Time-to-act style).
// One photo -> static upright thumbnail; two -> animated overlapping pair.
function PhotoStack({ photos, nonce }) {
  const imgs = photos.slice(0, 2);
  // A single photo reads as a normal, upright thumbnail — only a pair scatters.
  if (imgs.length === 1) {
    return <Image source={imageSource(imgs[0].url)} style={styles.thumb} />;
  }
  return (
    <View style={styles.stackWrap}>
      <AnimatedStackCard url={imgs[0].url} index={0} tilt="-9deg" tx={-9} nonce={nonce} />
      <AnimatedStackCard url={imgs[1].url} index={1} tilt="8deg" tx={9} nonce={nonce} />
    </View>
  );
}

export default function Memories() {
  const router = useRouter();
  const [memories, setMemories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  // Bumped on every screen focus so the photo scatter re-plays its entrance
  // each time you land here (cards animate on mount too). Skips the very first
  // focus, which coincides with mount.
  const [stackNonce, setStackNonce] = useState(0);
  const firstFocus = useRef(true);

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(useCallback(() => {
    if (firstFocus.current) { firstFocus.current = false; return; }
    setStackNonce((n) => n + 1);
  }, []));

  async function load() {
    setRefreshing(true);
    try {
      const data = await api.getMemories();
      setMemories(data);
    } finally {
      setRefreshing(false);
    }
  }

  // Group memories into month sections. The API already returns them
  // completed_at DESC, so months come newest-first and each month's cards
  // stay newest-first — keeps a long history readable instead of one endless
  // flat list. Year is shown only for past years.
  const sections = useMemo(() => {
    const now = new Date();
    const groups = [];
    const byKey = {};
    for (const m of memories) {
      const d = new Date(m.completed_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!(key in byKey)) {
        byKey[key] = groups.length;
        const title = d.getFullYear() === now.getFullYear()
          ? d.toLocaleDateString('en-US', { month: 'long' })
          : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        groups.push({ title, data: [] });
      }
      groups[byKey[key]].data.push(m);
    }
    return groups;
  }, [memories]);

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
          {item.photos && item.photos.length > 0 ? (
            <PhotoStack photos={item.photos} nonce={stackNonce} />
          ) : item.image_url ? (
            <Image source={imageSource(item.image_url)} style={styles.thumb} />
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
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            // Only label months once the history actually spans more than one —
            // a single-month list stays a plain list, no header noise.
            sections.length > 1 ? <Text style={styles.sectionHeader}>{section.title}</Text> : null
          )}
          keyExtractor={(item) => item.id.toString()}
          extraData={stackNonce}
          contentContainerStyle={{ padding: 20 }}
          stickySectionHeadersEnabled={false}
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
  sectionHeader: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  topText: { flex: 1 },
  thumb: { width: 96, height: 110, borderRadius: 12, backgroundColor: colors.bg },
  thumbPlaceholder: { borderWidth: 1, borderColor: colors.line || '#eee' },
  stackWrap: { width: 96, height: 110, alignItems: 'center', justifyContent: 'center' },
  stackCard: {
    position: 'absolute',
    width: 62, height: 80, borderRadius: 10,
    borderWidth: 2, borderColor: '#fff', backgroundColor: colors.bg,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
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
