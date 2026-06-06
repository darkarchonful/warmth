import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Application from 'expo-application';
import { api, clearToken } from '../lib/api';
import { colors } from '../lib/colors';
import Paywall from '../components/Paywall';

export default function Settings() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    api.me()
      .then(data => { setMe(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const partnerName = me?.couple?.partner_name;
  const isPaired = !!(me?.couple && me.couple.user_b_id);
  const premium = !!me?.couple?.premium;
  const premiumExpires = me?.couple?.premium_expires_at;
  const memoriesCount = me?.couple?.memories_count ?? 0;
  const freeLimit = me?.couple?.free_memory_limit ?? 3;

  async function reloadMe() {
    try { setMe(await api.me()); } catch {}
  }

  async function handleRestore() {
    setWorking(true);
    try {
      const r = await api.restorePremium();
      if (r.premium) { await reloadMe(); Alert.alert('Restored', 'Premium is active for your couple.'); }
      else Alert.alert('Nothing to restore', 'No active subscription found for your couple.');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setWorking(false); }
  }

  async function handleMockCancel() {
    setWorking(true);
    try { await api.mockCancelPremium(); await reloadMe(); }
    catch (e) { Alert.alert('Error', e.message); }
    finally { setWorking(false); }
  }

  async function handleUnpair() {
    setWorking(true);
    try {
      await api.unpair();
      router.replace('/');
    } catch (e) {
      Alert.alert('Error', e.message);
      setWorking(false);
    }
  }

  function openNameEditor() {
    setNameDraft(me?.user?.name || '');
    setEditingName(true);
  }

  async function handleSaveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed) { Alert.alert('Name required', 'Please enter a name.'); return; }
    setSavingName(true);
    try {
      const data = await api.updateName(trimmed);
      setMe(prev => ({ ...prev, user: { ...prev.user, name: data.user.name } }));
      setEditingName(false);
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSavingName(false);
    }
  }

  async function handleLogout() {
    await clearToken();
    router.replace('/');
  }

  async function handleDelete() {
    setWorking(true);
    try {
      await api.deleteAccount();
      await clearToken();
      router.replace('/');
    } catch (e) {
      Alert.alert('Error', e.message);
      setWorking(false);
    }
  }

  if (showPaywall) {
    return (
      <Paywall
        onClose={() => setShowPaywall(false)}
        onSubscribed={async () => { setShowPaywall(false); await reloadMe(); }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} hitSlop={{ top: 18, bottom: 18, left: 14, right: 14 }} onPress={() => router.back()}>
          <Text style={[styles.back, { textAlign: 'left' }]}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSide} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.warmDark} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={openNameEditor} activeOpacity={0.6}>
              <Text style={styles.rowLabel}>Name</Text>
              <View style={styles.rowValueWrap}>
                <Text style={styles.rowValue}>{me?.user?.name || '—'}</Text>
                <Text style={styles.editHint}>Edit</Text>
              </View>
            </TouchableOpacity>
            <Row label="Email" value={me?.user?.email || '—'} last />
          </View>

          <Text style={styles.sectionLabel}>Pairing</Text>
          <View style={styles.card}>
            {isPaired ? (
              <>
                <Row label="Partner" value={partnerName} />
                <Action
                  label="Unpair"
                  sub="Ends the pairing and wipes shared data"
                  onPress={() => setConfirm('unpair')}
                  warn
                  disabled={working}
                  last
                />
              </>
            ) : (
              <Row value="Not paired" last />
            )}
          </View>

          {isPaired && (
            <>
              <Text style={styles.sectionLabel}>Premium</Text>
              <View style={styles.card}>
                {premium ? (
                  <>
                    <Row label="Status" value="Active 💛" />
                    {premiumExpires && (
                      <Row label="Renews" value={new Date(premiumExpires).toLocaleDateString()} />
                    )}
                    <Action
                      label="Cancel (test)"
                      sub="Mock — drops your couple back to free for testing"
                      onPress={handleMockCancel}
                      disabled={working}
                      last
                    />
                  </>
                ) : (
                  <>
                    <Row label="Memories" value={`${memoriesCount} / ${freeLimit} free`} />
                    <Action
                      label="Go Premium"
                      sub="Unlimited plans & memories — unlocks for both of you"
                      onPress={() => setShowPaywall(true)}
                      disabled={working}
                    />
                    <Action label="Restore purchase" onPress={handleRestore} disabled={working} last />
                  </>
                )}
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>Account actions</Text>
          <View style={styles.card}>
            <Action label="Log out" onPress={handleLogout} disabled={working} />
            <Action
              label="Delete account"
              sub="Permanently removes your account and all data"
              onPress={() => setConfirm('delete')}
              danger
              disabled={working}
              last
            />
          </View>

          <Text style={styles.footer}>
            Warmth · v{Application.nativeApplicationVersion || '1.0.0'}
          </Text>
        </ScrollView>
      )}

      {confirm === 'unpair' && (
        <ConfirmModal
          title="End pairing?"
          body={`This deletes your swipes, plans, and shared memories.${partnerName ? ` ${partnerName} will be notified.` : ''}`}
          confirmLabel="Yes, unpair"
          danger
          working={working}
          onConfirm={() => { setConfirm(null); handleUnpair(); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {editingName && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Your name</Text>
            <Text style={styles.modalBody}>This is how your partner sees you in the app.</Text>
            <TextInput
              style={styles.nameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={40}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => setEditingName(false)} style={[styles.modalBtn, styles.modalCancel]} disabled={savingName}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveName}
                style={[styles.modalBtn, styles.modalConfirm, savingName && styles.modalBtnDisabled]}
                disabled={savingName}
              >
                <Text style={styles.modalConfirmText}>{savingName ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {confirm === 'delete' && (
        <ConfirmModal
          title="Delete account?"
          body="This permanently removes your account, all swipes, plans, memories, and unpairs you. This cannot be undone."
          confirmLabel="Delete account"
          danger
          working={working}
          onConfirm={() => { setConfirm(null); handleDelete(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </View>
  );
}

function Row({ label, value, last }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      {label && <Text style={styles.rowLabel}>{label}</Text>}
      <Text style={[styles.rowValue, !label && { textAlign: 'left' }]}>{value}</Text>
    </View>
  );
}

function Action({ label, sub, onPress, warn, danger, disabled, last }) {
  const color = danger || warn ? '#B84040' : colors.text;
  return (
    <TouchableOpacity
      style={[styles.row, styles.rowAction, last && styles.rowLast]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.actionText, { color }]}>{label}</Text>
      {sub && <Text style={styles.rowSub}>{sub}</Text>}
    </TouchableOpacity>
  );
}

function ConfirmModal({ title, body, confirmLabel, danger, working, onConfirm, onCancel }) {
  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalBody}>{body}</Text>
        <View style={styles.modalRow}>
          <TouchableOpacity onPress={onCancel} style={[styles.modalBtn, styles.modalCancel]} disabled={working}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={[styles.modalBtn, danger ? styles.modalDanger : styles.modalConfirm, working && styles.modalBtnDisabled]}
            disabled={working}
          >
            <Text style={styles.modalConfirmText}>{working ? 'Working…' : confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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

  scroll: { padding: 20, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.textMuted,
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8DDD0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLast: { borderBottomWidth: 0 },
  rowAction: { flexDirection: 'column', alignItems: 'flex-start' },
  rowLabel: { fontSize: 15, color: colors.text },
  rowValue: { fontSize: 15, color: colors.textLight, textAlign: 'right', flexShrink: 1 },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  editHint: { fontSize: 13, color: colors.accent, fontWeight: '500', marginLeft: 10 },
  actionText: { fontSize: 16, fontWeight: '500' },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 28,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 22,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
  modalBody: { fontSize: 14, color: colors.textLight, lineHeight: 20, marginBottom: 18 },
  modalRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalBtn: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10 },
  modalCancel: { backgroundColor: '#EFE5D7' },
  modalCancelText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  modalConfirm: { backgroundColor: colors.accent },
  modalDanger: { backgroundColor: '#B84040' },
  modalBtnDisabled: { opacity: 0.5 },
  modalConfirmText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  nameInput: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DDD0',
  },
});
