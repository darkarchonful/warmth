import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/colors';
import { api, imageSource } from '../../lib/api';

// Inner content width of a page card = screen − scroll padding (20×2) − page
// padding (22×2). Multi-photo pages show each photo at 82% of that so the next
// one peeks in, signalling "swipe for more".
const { width: SCREEN_W } = Dimensions.get('window');
const CONTENT_W = SCREEN_W - 40 - 44;

// "Story" — the couple's memories composed as a little book: a cover, then one
// page per memory read oldest -> newest (the list screen is newest-first /
// drag-ordered; the story is chronological). Read-only recap built entirely
// from the existing memories payload; tapping a page opens that full memory.
export default function Story() {
  const router = useRouter();
  const [memories, setMemories] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [mem, meData] = await Promise.all([api.getMemories(), api.me()]);
        setMemories(Array.isArray(mem) ? mem : []);
        setMe(meData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const myName = me?.user?.name || 'You';
  const partnerName = me?.couple?.partner_name || memories.find((m) => m.partner_name)?.partner_name || 'Partner';
  // Chronological: a story reads front-to-back in time.
  const ordered = [...memories].sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
  const count = ordered.length;
  const firstDate = ordered[0]?.completed_at;
  const lastDate = ordered[count - 1]?.completed_at;

  const fmt = (s, opts = { month: 'long', day: 'numeric', year: 'numeric' }) =>
    s ? new Date(s).toLocaleDateString('en-US', opts) : '';
  const stars = (r) => (r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '');
  const span = () => {
    const a = fmt(firstDate, { month: 'short', year: 'numeric' });
    const b = fmt(lastDate, { month: 'short', year: 'numeric' });
    return a === b ? a : `${a} — ${b}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} hitSlop={{ top: 18, bottom: 18, left: 14, right: 14 }} onPress={() => router.back()}>
          <Text style={[styles.back, { textAlign: 'left' }]}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Story</Text>
        <View style={styles.headerSide} />
      </View>

      {loading ? (
        <View style={styles.empty}><ActivityIndicator color={colors.accent} /></View>
      ) : count === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your story starts soon</Text>
          <Text style={styles.emptySubtext}>Do something together and it becomes the first page here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.cover}>
            <Text style={styles.coverHeart}>💛</Text>
            <Text style={styles.coverNames}>{myName} & {partnerName}</Text>
            <Text style={styles.coverMeta}>{count} {count === 1 ? 'memory' : 'memories'}</Text>
            <Text style={styles.coverDates}>{span()}</Text>
          </View>

          {ordered.map((m, i) => {
            const photos = (m.photos && m.photos.length) ? m.photos : (m.image_url ? [{ url: m.image_url }] : []);
            const partner = m.partner_name || partnerName;
            const youHas = m.you_rating || m.you_note;
            const partnerHas = m.partner_rating || m.partner_note;
            return (
              <TouchableOpacity key={m.id} activeOpacity={0.92} onPress={() => router.push(`/memories/${m.id}`)} style={styles.page}>
                {photos.length === 1 ? (
                  <Image source={imageSource(photos[0].url)} style={styles.pagePhoto} resizeMode="cover" />
                ) : photos.length > 1 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.strip}
                    contentContainerStyle={styles.stripContent}
                  >
                    {photos.map((p, pi) => (
                      <Image key={p.id ?? `art-${pi}`} source={imageSource(p.url)} style={styles.stripPhoto} resizeMode="cover" />
                    ))}
                  </ScrollView>
                ) : null}
                <Text style={styles.pageDate}>{fmt(m.completed_at)}</Text>
                <Text style={styles.pageTitle}>{m.title}</Text>
                {m.tagline ? <Text style={styles.pageTagline}>{m.tagline}</Text> : null}
                {(youHas || partnerHas) && (
                  <View style={styles.notes}>
                    {youHas ? (
                      <View style={styles.noteRow}>
                        <Text style={styles.noteWho}>{myName}</Text>
                        {m.you_rating ? <Text style={styles.noteStars}>{stars(m.you_rating)}</Text> : null}
                        {m.you_note ? <Text style={styles.noteText} numberOfLines={3}>“{m.you_note}”</Text> : null}
                      </View>
                    ) : null}
                    {partnerHas ? (
                      <View style={styles.noteRow}>
                        <Text style={styles.noteWho}>{partner}</Text>
                        {m.partner_rating ? <Text style={styles.noteStars}>{stars(m.partner_rating)}</Text> : null}
                        {m.partner_note ? <Text style={styles.noteText} numberOfLines={3}>“{m.partner_note}”</Text> : null}
                      </View>
                    ) : null}
                  </View>
                )}
                <Text style={styles.pageNum}>{i + 1}</Text>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.end}>💛</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 80, paddingHorizontal: 20, paddingBottom: 10,
  },
  headerSide: { flex: 1 },
  back: { fontSize: 14, color: colors.accent, fontWeight: '500' },
  title: { flex: 1, fontSize: 18, color: colors.text, fontWeight: '300', textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 80 },

  cover: { alignItems: 'center', paddingVertical: 44, marginBottom: 8 },
  coverHeart: { fontSize: 44, marginBottom: 16 },
  coverNames: { fontSize: 30, color: colors.text, fontWeight: '300', textAlign: 'center', marginBottom: 12 },
  coverMeta: { fontSize: 15, color: colors.accent, letterSpacing: 1, marginBottom: 4 },
  coverDates: { fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2 },

  page: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  pagePhoto: { width: '100%', height: 240, borderRadius: 14, backgroundColor: colors.bg, marginBottom: 16 },
  strip: { marginBottom: 16 },
  stripContent: { gap: 10, paddingRight: 4 },
  stripPhoto: { width: CONTENT_W * 0.82, height: 220, borderRadius: 14, backgroundColor: colors.bg },
  pageDate: { fontSize: 12, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  pageTitle: { fontSize: 24, color: colors.text, fontWeight: '300', marginBottom: 6 },
  pageTagline: { fontSize: 15, color: colors.textLight, fontStyle: 'italic', marginBottom: 4 },
  notes: { marginTop: 14, gap: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
  noteWho: { fontSize: 13, color: colors.textLight, fontWeight: '600' },
  noteStars: { fontSize: 13, color: '#f5b041' },
  noteText: { flex: 1, fontSize: 14, color: colors.textLight, fontStyle: 'italic' },
  pageNum: { marginTop: 16, alignSelf: 'center', fontSize: 12, color: colors.textMuted },

  end: { textAlign: 'center', fontSize: 24, marginTop: 8, marginBottom: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 20, color: colors.text, fontWeight: '300', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: colors.textLight, textAlign: 'center', lineHeight: 20 },
});
