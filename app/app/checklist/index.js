import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/colors';
import { api, API_URL } from '../../lib/api';
import Paywall from '../../components/Paywall';
import CoachCard from '../../components/CoachCard';

function resolveImage(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

export default function Checklist() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addingFor, setAddingFor] = useState(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customTagline, setCustomTagline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [coachDone, setCoachDone] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setRefreshing(true);
    try {
      const data = await api.getChecklist();
      setItems(data);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleApprove(id) {
    await api.approve(id);
    load();
  }

  async function handleComplete(id) {
    try {
      const result = await api.complete(id);
      if (result?.first_completion) setCoachDone(true);
      load();
    } catch (e) {
      if (e.premiumRequired) { setShowPaywall(true); return; }
      Alert.alert('Could not complete', e.message);
    }
  }

  function openAdder(parentId) {
    setAddingFor(parentId);
    setCustomTitle('');
    setCustomTagline('');
  }

  function cancelAdder() {
    setAddingFor(null);
    setCustomTitle('');
    setCustomTagline('');
  }

  async function submitCustom(parentId) {
    const title = customTitle.trim();
    if (!title) return;
    setSubmitting(true);
    try {
      await api.addCustomSubstep(parentId, title, customTagline.trim() || null);
      cancelAdder();
      await load();
    } catch (e) {
      Alert.alert('Could not add step', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Group subs under their parent. Top-level = items without a parent.
  const { topLevel, subsByParent } = useMemo(() => {
    const subs = {};
    const top = [];
    for (const it of items) {
      if (it.parent_checklist_id) {
        (subs[it.parent_checklist_id] ||= []).push(it);
      } else {
        top.push(it);
      }
    }
    return { topLevel: top, subsByParent: subs };
  }, [items]);

  function renderSub(sub) {
    const done = sub.you_completed && sub.partner_completed;
    const toggleLabel = sub.you_completed ? (sub.partner_completed ? '✓' : '✓ (waiting)') : 'Mark done';
    return (
      <View key={sub.id} style={styles.subRow}>
        <View style={styles.subTextWrap}>
          <Text style={[styles.subTitle, done && styles.subTitleDone]} numberOfLines={1}>
            {sub.title}
          </Text>
          {sub.tagline ? <Text style={styles.subTagline} numberOfLines={1}>{sub.tagline}</Text> : null}
        </View>
        {done ? (
          <Text style={styles.subDone}>✓</Text>
        ) : (
          <TouchableOpacity onPress={() => handleComplete(sub.id)} style={styles.subBtn}>
            <Text style={styles.subBtnText}>{toggleLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function renderItem({ item }) {
    const partner = item.partner_name || 'Partner';
    const subs = subsByParent[item.id] || [];
    const subsDoneCount = subs.filter(s => s.you_completed && s.partner_completed).length;

    const stateRow = (youDone, partnerDone) => (
      <Text style={styles.approvalLine}>
        <Text style={youDone ? styles.stateDone : styles.statePending}>
          You {youDone ? '✓' : 'pending'}
        </Text>
        {'   ·   '}
        <Text style={partnerDone ? styles.stateDone : styles.statePending}>
          {partner} {partnerDone ? '✓' : 'pending'}
        </Text>
      </Text>
    );

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/checklist/${item.id}`)}
        style={[styles.item, item.is_new && styles.itemNew]}
      >
        <View style={styles.topRow}>
          {item.image_url ? (
            <Image source={{ uri: resolveImage(item.image_url) }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]} />
          )}
          <View style={styles.topText}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemCategory} numberOfLines={1}>
                {item.is_journey ? 'JOURNEY · ' : ''}{item.category_name}
              </Text>
              <Text style={[styles.status, styles[`status_${item.status}`]]}>
                {item.status === 'matched' ? 'Confirm' : 'Planned'}
              </Text>
            </View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemTagline}>{item.tagline}</Text>
          </View>
        </View>

        {item.status === 'matched' && (
          <>
            {stateRow(item.you_approved, item.partner_approved)}
            {!item.you_approved && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleApprove(item.id)}>
                <Text style={styles.actionText}>Approve this plan</Text>
              </TouchableOpacity>
            )}
            {item.you_approved && !item.partner_approved && (
              <Text style={styles.waitingLine}>Waiting for {partner}</Text>
            )}
          </>
        )}

        {item.status === 'approved' && (
          <>
            {stateRow(item.you_completed, item.partner_completed)}
            {!item.you_completed && (
              <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={() => handleComplete(item.id)}>
                <Text style={styles.actionText}>We did it!</Text>
              </TouchableOpacity>
            )}
            {item.you_completed && !item.partner_completed && (
              <Text style={styles.waitingLine}>Waiting for {partner}</Text>
            )}
          </>
        )}

        {item.is_journey && (subs.length > 0 || item.status === 'approved') && (
          <View style={styles.journeySection}>
            <Text style={styles.journeyLabel}>Steps · {subsDoneCount} of {subs.length} done</Text>
            {subs.map(renderSub)}
            {item.status === 'approved' && (addingFor === item.id ? (
              <View style={styles.addForm}>
                <TextInput
                  style={styles.addInput}
                  placeholder="Step title"
                  placeholderTextColor={colors.textLight}
                  value={customTitle}
                  onChangeText={setCustomTitle}
                  maxLength={80}
                  autoFocus
                />
                <TextInput
                  style={styles.addInput}
                  placeholder="Hint (optional)"
                  placeholderTextColor={colors.textLight}
                  value={customTagline}
                  onChangeText={setCustomTagline}
                  maxLength={120}
                />
                <View style={styles.addBtnRow}>
                  <TouchableOpacity onPress={cancelAdder} style={[styles.addBtn, styles.addBtnCancel]} disabled={submitting}>
                    <Text style={styles.addBtnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => submitCustom(item.id)}
                    style={[styles.addBtn, (!customTitle.trim() || submitting) && styles.addBtnDisabled]}
                    disabled={!customTitle.trim() || submitting}
                  >
                    <Text style={styles.addBtnText}>{submitting ? 'Saving…' : 'Add step'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => openAdder(item.id)} style={styles.addStepBtn}>
                <Text style={styles.addStepText}>+ Add a step</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (showPaywall) {
    return (
      <Paywall
        onClose={() => setShowPaywall(false)}
        onSubscribed={() => { setShowPaywall(false); load(); }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CoachCard
        visible={coachDone}
        emoji="✨"
        title="Your first memory!"
        body="Nice — done together. It just moved to Memories, where you can rate it ⭐ and look back anytime."
        cta="See Memories"
        onPress={() => { setCoachDone(false); router.push('/memories'); }}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} hitSlop={{ top: 18, bottom: 18, left: 14, right: 14 }} onPress={() => router.back()}>
          <Text style={[styles.back, { textAlign: 'left' }]}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Our Plans</Text>
        <View style={styles.headerSide} />
      </View>

      {topLevel.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No plans yet</Text>
          <Text style={styles.emptySubtext}>Swipe on ideas together to create plans</Text>
        </View>
      ) : (
        <FlatList
          data={topLevel}
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
  headerSide: {
    flex: 1,
  },
  back: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  title: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    fontWeight: '300',
    textAlign: 'center',
  },
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
  itemNew: {
    borderColor: colors.accent,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  topText: {
    flex: 1,
  },
  thumb: {
    width: 56,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.bg,
  },
  thumbPlaceholder: {
    borderWidth: 1,
    borderColor: colors.line || '#eee',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemCategory: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  status_matched: { color: colors.accent },
  status_approved: { color: colors.success },
  itemTitle: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  itemTagline: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  approvalLine: {
    fontSize: 13,
    marginBottom: 10,
  },
  stateDone: {
    color: colors.success,
    fontWeight: '600',
  },
  statePending: {
    color: colors.textLight,
  },
  waitingLine: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  completeBtn: {
    backgroundColor: colors.success,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  journeySection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line || '#eee',
  },
  journeyLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  subTextWrap: { flex: 1, paddingRight: 10 },
  subTitle: { fontSize: 14, color: colors.text },
  subTitleDone: { color: colors.success, fontWeight: '500' },
  subTagline: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  subBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  subBtnText: { fontSize: 12, color: colors.accent, fontWeight: '500' },
  subDone: {
    fontSize: 18,
    color: colors.success,
    paddingHorizontal: 10,
  },
  addStepBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addStepText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },
  addForm: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line || '#eee',
  },
  addInput: {
    borderWidth: 1,
    borderColor: colors.line || '#eee',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    backgroundColor: colors.bg,
  },
  addBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  addBtnCancel: {
    backgroundColor: 'transparent',
  },
  addBtnCancelText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '300',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
  },
});
