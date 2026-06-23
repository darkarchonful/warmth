import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/colors';
import { api, imageSource } from '../../lib/api';

// One scatter card: springs in (fade + scale-from-0.6 + tilt), staggered by
// index — same entrance as the Time-to-act scatter. Plays when the row scrolls
// into view (`active` goes true), and re-arms when it scrolls back out, so the
// entrance isn't wasted off-screen on a long list.
function AnimatedStackCard({ url, index, tilt, tx, active }) {
  const enter = useRef(new Animated.Value(0)).current;
  const played = useRef(false);
  useEffect(() => {
    if (active && !played.current) {
      played.current = true;
      enter.setValue(0);
      Animated.spring(enter, {
        toValue: 1, friction: 6, tension: 55, delay: index * 130, useNativeDriver: true,
      }).start();
    } else if (!active) {
      played.current = false; // re-arm so it animates again next time it enters
    }
  }, [active]);
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
function PhotoStack({ photos, active }) {
  const imgs = photos.slice(0, 2);
  // A single photo reads as a normal, upright thumbnail — only a pair scatters.
  if (imgs.length === 1) {
    return <Image source={imageSource(imgs[0].url)} style={styles.thumb} />;
  }
  return (
    <View style={styles.stackWrap}>
      <AnimatedStackCard url={imgs[0].url} index={0} tilt="-9deg" tx={-9} active={active} />
      <AnimatedStackCard url={imgs[1].url} index={1} tilt="8deg" tx={9} active={active} />
    </View>
  );
}

export default function Memories() {
  const router = useRouter();
  const [memories, setMemories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  // Which memory rows are currently on screen — drives the scatter entrance so
  // it plays as a card scrolls into view, not while it's off-screen. The
  // callback + config must be stable refs (RN forbids changing them on the fly).
  const [visibleIds, setVisibleIds] = useState(() => new Set());
  const onViewRef = useRef(({ viewableItems }) => {
    setVisibleIds(new Set(viewableItems.map((v) => v.item?.memory?.id).filter((x) => x != null)));
  });
  const viewConfigRef = useRef({ itemVisiblePercentThreshold: 45 });

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

  // Flatten into a single draggable list: a month-header row before each month
  // (only when the history spans 2+ months), then that month's memory rows.
  const { listData } = useMemo(() => {
    const now = new Date();
    const monthsSeen = new Set();
    for (const m of memories) {
      const d = new Date(m.completed_at);
      monthsSeen.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
    const multi = monthsSeen.size > 1;
    const rows = [];
    let last = null;
    for (const m of memories) {
      const d = new Date(m.completed_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (multi && key !== last) {
        last = key;
        const title = d.getFullYear() === now.getFullYear()
          ? d.toLocaleDateString('en-US', { month: 'long' })
          : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        rows.push({ type: 'header', key: `h-${key}`, title });
      }
      rows.push({ type: 'item', key: `m-${m.id}`, memory: m });
    }
    return { listData: rows, multiMonth: multi };
  }, [memories]);

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // After a drag, clamp items back into their real month (newest month first),
  // keeping the dragged sequence within each month, then persist that month's
  // new order. So you can shuffle a memory up/down within its month.
  const onDragEnd = useCallback(({ data, to }) => {
    const items = data.filter((r) => r.type === 'item').map((r) => r.memory);
    const byMonth = new Map();
    for (const m of items) {
      const d = new Date(m.completed_at);
      const k = d.getFullYear() * 100 + d.getMonth();
      if (!byMonth.has(k)) byMonth.set(k, []);
      byMonth.get(k).push(m);
    }
    const ordered = [...byMonth.keys()].sort((a, b) => b - a).flatMap((k) => byMonth.get(k));
    setMemories(ordered);
    const movedRow = data[to];
    const moved = movedRow?.type === 'item' ? movedRow.memory : null;
    if (moved) {
      const d = new Date(moved.completed_at);
      const k = d.getFullYear() * 100 + d.getMonth();
      api.reorderMemories(byMonth.get(k).map((m) => m.id)).catch(() => {});
    }
  }, []);

  const renderRow = useCallback(({ item: row, drag, isActive }) => {
    if (row.type === 'header') {
      return <Text style={styles.sectionHeader}>{row.title}</Text>;
    }
    const m = row.memory;
    const partner = m.partner_name || 'Partner';
    const ratingRow = (who, rating, note) => (
      <View style={styles.perUserRow}>
        <Text style={styles.whoLabel}>{who}</Text>
        <Text style={styles.rowRating}>{rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '—'}</Text>
        <Text style={styles.rowNote} numberOfLines={1}>{note || ''}</Text>
      </View>
    );
    return (
      <ScaleDecorator activeScale={1.04}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => { if (!isActive) router.push(`/memories/${m.id}`); }}
          onLongPress={drag}
          delayLongPress={180}
          disabled={isActive}
          style={[styles.item, (m.is_new || m.repeat_requested_by_partner) && styles.itemNew, isActive && styles.itemDragging]}
        >
          <View style={styles.topRow}>
            {m.photos && m.photos.length > 0 ? (
              <PhotoStack photos={m.photos} active={visibleIds.has(m.id)} />
            ) : m.image_url ? (
              <Image source={imageSource(m.image_url)} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <View style={styles.topText}>
              <Text style={styles.date}>{formatDate(m.completed_at)}</Text>
              <Text style={styles.itemTitle}>{m.title}</Text>
              <Text style={styles.itemTagline}>{m.tagline}</Text>
              <Text style={styles.category}>{m.category_name}</Text>
            </View>
          </View>
          {ratingRow('You', m.you_rating, m.you_note)}
          {ratingRow(partner, m.partner_rating, m.partner_note)}
          {m.repeat_requested_by_partner && (
            <Text style={styles.repeatFlag}>↻ {partner} wants to do this again</Text>
          )}
          {m.repeat_requested_by_you && (
            <Text style={styles.repeatPending}>↻ Waiting for {partner}</Text>
          )}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }, [visibleIds, router]);

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
        <DraggableFlatList
          data={listData}
          keyExtractor={(row) => row.key}
          renderItem={renderRow}
          onDragEnd={onDragEnd}
          activationDistance={12}
          containerStyle={{ flex: 1 }}
          extraData={visibleIds}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfigRef.current}
          contentContainerStyle={{ padding: 20, paddingBottom: 64 }}
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
  itemDragging: { shadowOpacity: 0.18, shadowRadius: 16, elevation: 8, borderColor: colors.accent },
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
