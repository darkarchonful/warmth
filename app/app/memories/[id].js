import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator, Modal, FlatList, ScrollView, Dimensions, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors } from '../../lib/colors';
import { api, imageSource } from '../../lib/api';
import CommentThread from '../../components/CommentThread';

const SCREEN_W = Dimensions.get('window').width;

// A rating star that pops on tap — instant tactile feedback, independent of
// the state round-trip that fills it in.
function AnimatedStar({ filled, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  function handle() {
    scale.setValue(1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.45, useNativeDriver: true, speed: 50, bounciness: 16 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 12 }),
    ]).start();
    onPress();
  }
  return (
    <TouchableOpacity onPress={handle} activeOpacity={0.7}>
      <Animated.Text style={[styles.star, { transform: [{ scale }] }]}>
        {filled ? '★' : '☆'}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export default function MemoryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [meId, setMeId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);

  async function reload() {
    const list = await api.getMemories();
    const found = list.find(x => x.id.toString() === id) || null;
    setItem(found);
    if (found) setNoteDraft(found.you_note || '');
  }

  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setMeId(me.user.id);
        await reload();
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  async function saveField(patch) {
    if (!item) return;
    const localPatch = {};
    if ('rating' in patch) localPatch.you_rating = patch.rating;
    if ('note' in patch) localPatch.you_note = patch.note;
    setItem({ ...item, ...localPatch });
    try { await api.updateMemory(item.id, patch); } catch {}
  }

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

  // Pick a photo from the library, resize/compress it on-device, and upload it
  // as this memory's couple photo (replaces the activity art for both partners).
  async function pickAndUpload() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photo access needed', 'Allow photo access in Settings to add your own picture.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
      if (picked.canceled || !picked.assets?.length) return;
      setPhotoBusy(true);
      const manip = await ImageManipulator.manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      await api.uploadMemoryPhoto(item.id, manip.uri, manip.width, manip.height);
      await reload();
    } catch (e) {
      Alert.alert('Could not add photo', e.message);
    } finally {
      setPhotoBusy(false);
    }
  }

  function deletePhoto(photoId) {
    Alert.alert('Remove this photo?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          setPhotoBusy(true);
          try { await api.deleteMemoryPhoto(item.id, photoId); await reload(); }
          catch (e) { Alert.alert('Could not remove', e.message); }
          finally { setPhotoBusy(false); }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // Not in the memories list: removed, or a stale deep link (e.g. a notification
  // for a memory from an old pairing). Don't dead-end on a blank screen.
  if (!item) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.back()}><Text style={styles.back}>Back</Text></TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.goneTitle}>This memory isn't here anymore</Text>
          <Text style={styles.goneBody}>It may have been removed.</Text>
          <TouchableOpacity style={styles.goneBtn} onPress={() => router.replace('/swipe')}>
            <Text style={styles.goneBtnText}>Back to your deck</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const partner = item.partner_name || 'Partner';
  const hasPartnerReaction = item.partner_rating || item.partner_note;
  // All photos for this memory (yours first, then partner's). Each person can
  // add up to 2 of their own; you can delete only yours. Falls back to the
  // activity art when no one has added a photo yet.
  const photos = item.photos || [];
  const youCount = photos.filter(p => p.mine).length;
  const canAdd = youCount < 2;
  const cards = photos.length
    ? photos.map(p => ({ id: p.id, url: p.url, label: p.mine ? 'You' : partner, mine: p.mine }))
    : (item.image_url ? [{ id: null, url: item.image_url, label: '', mine: false }] : []);

  function openGallery(i) {
    setGalleryStart(i);
    setViewerOpen(true);
  }

  const headerContent = (
    <View>
      <View style={styles.headerCard}>
        {cards.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
            {cards.map((c, i) => (
              <View key={c.id != null ? `p${c.id}` : `art${i}`} style={styles.photoCardWrap}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => openGallery(i)}>
                  <Image source={imageSource(c.url)} style={styles.photoCard} resizeMode="cover" />
                  {c.label ? <Text style={styles.photoCardLabel}>{c.label}</Text> : null}
                </TouchableOpacity>
                {c.mine && c.id != null && !photoBusy && (
                  <TouchableOpacity style={styles.photoDelBtn} onPress={() => deletePhoto(c.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.photoDelText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        )}
        <View style={styles.meta}>
          <Text style={styles.title}>{item.title}</Text>
          {item.tagline ? <Text style={styles.tagline}>{item.tagline}</Text> : null}
        </View>
      </View>

      <View style={styles.photoCtaRow}>
        {canAdd ? (
          <TouchableOpacity onPress={pickAndUpload} disabled={photoBusy} style={styles.photoCtaBtn}>
            <Text style={styles.photoCtaText}>{photoBusy ? 'Working…' : '📷 Add a photo'}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.photoCtaMax}>You've added your 2 photos</Text>
        )}
      </View>

      {item.journey_steps && item.journey_steps.length > 0 && (
        <View style={styles.journeyCard}>
          <Text style={styles.journeyLabel}>What you did</Text>
          {item.journey_steps.map((step, idx) => (
            <Text key={idx} style={styles.journeyStep}>✓ {step}</Text>
          ))}
        </View>
      )}

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

      <View style={styles.editorCard}>
        <Text style={styles.sectionLabel}>Your rating</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <AnimatedStar
              key={n}
              filled={(item.you_rating || 0) >= n}
              onPress={() => saveField({ rating: item.you_rating === n ? null : n })}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Your note</Text>
        <TextInput
          style={styles.noteInput}
          value={noteDraft}
          onChangeText={setNoteDraft}
          onBlur={() => { if (noteDraft !== (item.you_note || '')) saveField({ note: noteDraft }); }}
          placeholder="Remember this one..."
          placeholderTextColor={colors.textMuted}
          multiline
        />
      </View>

      {hasPartnerReaction && (
        <View style={styles.partnerPanel}>
          <Text style={styles.partnerLabel}>{partner} said</Text>
          {item.partner_rating ? <Text style={styles.partnerRating}>{'★'.repeat(item.partner_rating)}{'☆'.repeat(5 - item.partner_rating)}</Text> : null}
          {item.partner_note ? <Text style={styles.partnerNote}>"{item.partner_note}"</Text> : null}
        </View>
      )}

      <View style={styles.divider} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory</Text>
        <View style={{ flex: 1 }} />
      </View>

      <View style={{ flex: 1 }}>
        <CommentThread parentType="memory" parentId={item.id} meId={meId} header={headerContent} />
      </View>

      {cards.length > 0 && (
        <Modal
          visible={viewerOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setViewerOpen(false)}
        >
          <View style={styles.viewerBackdrop}>
            <FlatList
              data={cards}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={Math.min(galleryStart, cards.length - 1)}
              getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item: g }) => (
                <TouchableOpacity activeOpacity={1} style={styles.viewerPage} onPress={() => setViewerOpen(false)}>
                  <Image source={imageSource(g.url)} style={styles.viewerImage} resizeMode="contain" />
                  {g.label ? <Text style={styles.viewerLabel}>{g.label}</Text> : null}
                </TouchableOpacity>
              )}
            />
          </View>
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setViewerOpen(false)}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
        </Modal>
      )}
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
  headerCard: { paddingHorizontal: 20, paddingBottom: 12 },
  photoStrip: { flexDirection: 'row', gap: 10, marginBottom: 12, paddingRight: 20 },
  photoCardWrap: { width: 150 },
  photoCard: { width: 150, height: 190, borderRadius: 14, backgroundColor: colors.warm },
  photoCardLabel: {
    position: 'absolute', left: 8, bottom: 8,
    color: '#fff', fontSize: 12, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    overflow: 'hidden',
  },
  photoDelBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  photoDelText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  photoCtaMax: { color: colors.textMuted, fontSize: 13, paddingVertical: 10 },
  meta: { justifyContent: 'center' },
  title: { fontSize: 22, color: colors.text, fontWeight: '500', marginBottom: 6 },
  tagline: { fontSize: 14, color: colors.textLight, marginBottom: 10 },
  editorCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  sectionLabel: { fontSize: 13, color: colors.textLight, marginTop: 6, marginBottom: 8 },
  starsRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 32, color: '#f5b041' },
  noteInput: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    color: colors.text,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  partnerPanel: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    backgroundColor: colors.warm || '#fff5ee',
    borderRadius: 14,
  },
  partnerLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  partnerRating: { color: '#f5b041', fontSize: 16 },
  partnerNote: { fontSize: 14, color: colors.text, marginTop: 4, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: colors.line || '#eee', marginHorizontal: 20, marginVertical: 10 },
  journeyCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 14,
  },
  journeyLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  journeyStep: { fontSize: 14, color: colors.text, marginBottom: 4 },
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
  photoCtaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14, gap: 10 },
  photoCtaBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  photoCtaText: { color: colors.accent, fontSize: 14, fontWeight: '500' },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' },
  viewerPage: { width: SCREEN_W, height: '100%', alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: SCREEN_W, height: '82%' },
  viewerLabel: { position: 'absolute', bottom: 70, color: '#fff', fontSize: 14, fontWeight: '500', opacity: 0.85 },
  viewerClose: { position: 'absolute', top: 60, right: 24 },
  viewerCloseText: { color: '#fff', fontSize: 30, fontWeight: '300' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  goneTitle: { fontSize: 18, color: colors.text, fontWeight: '500', textAlign: 'center', marginBottom: 8 },
  goneBody: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginBottom: 24 },
  goneBtn: { backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  goneBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
