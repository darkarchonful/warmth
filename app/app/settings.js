import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Application from 'expo-application';
import { api, clearToken } from '../lib/api';
import { colors } from '../lib/colors';

export default function Settings() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    api.me()
      .then(data => { setMe(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const partnerName = me?.couple?.partner_name;
  const isPaired = !!(me?.couple && me.couple.user_b_id);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
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
            <Row label="Name" value={me?.user?.name || '—'} />
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
});
