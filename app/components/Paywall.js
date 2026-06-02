import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../lib/colors';
import { api } from '../lib/api';

// Couple-level paywall. Shown after the free memory limit is reached. Either
// partner subscribing unlocks both. Uses the mock subscribe endpoint for now;
// real StoreKit replaces api.mockSubscribe at the App Store launch.
const PLANS = [
  { id: 'yearly', label: 'Yearly', price: '$39.99 / year', sub: 'Best value · ~$3.33/mo', highlight: true },
  { id: 'monthly', label: 'Monthly', price: '$4.99 / month', sub: 'Cancel anytime', highlight: false },
];

export default function Paywall({ onSubscribed, onClose }) {
  const [busy, setBusy] = useState(null); // plan id or 'restore'

  async function subscribe(plan) {
    setBusy(plan);
    try {
      await api.mockSubscribe(plan);
      onSubscribed?.();
    } catch (e) {
      Alert.alert('Could not subscribe', e.message);
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    setBusy('restore');
    try {
      const r = await api.restorePremium();
      if (r.premium) onSubscribed?.();
      else Alert.alert('Nothing to restore', 'No active subscription found for your couple.');
    } catch (e) {
      Alert.alert('Could not restore', e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.emoji}>💛</Text>
        <Text style={styles.title}>You've made 3 memories together</Text>
        <Text style={styles.subtitle}>
          Go Premium to keep making plans and memories — with no limits.
        </Text>

        {PLANS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.plan, p.highlight && styles.planHighlight]}
            onPress={() => subscribe(p.id)}
            disabled={!!busy}
          >
            {busy === p.id ? (
              <ActivityIndicator color={p.highlight ? '#fff' : colors.accent} />
            ) : (
              <>
                <View>
                  <Text style={[styles.planLabel, p.highlight && styles.planLabelH]}>{p.label}</Text>
                  <Text style={[styles.planSub, p.highlight && styles.planSubH]}>{p.sub}</Text>
                </View>
                <Text style={[styles.planPrice, p.highlight && styles.planLabelH]}>{p.price}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}

        <Text style={styles.note}>Only one of you needs to subscribe — it unlocks for both.</Text>

        <TouchableOpacity onPress={restore} disabled={!!busy} style={{ marginTop: 18 }}>
          <Text style={styles.restore}>{busy === 'restore' ? 'Restoring…' : 'Restore purchase'}</Text>
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity onPress={onClose} disabled={!!busy} style={{ marginTop: 14 }}>
            <Text style={styles.notNow}>Not now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 24, color: colors.text, fontWeight: '500', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: colors.textLight, textAlign: 'center', marginBottom: 28, lineHeight: 21 },
  plan: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 64,
  },
  planHighlight: { backgroundColor: colors.accent, borderColor: colors.accent },
  planLabel: { fontSize: 17, color: colors.text, fontWeight: '600' },
  planLabelH: { color: '#fff' },
  planSub: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  planSubH: { color: 'rgba(255,255,255,0.85)' },
  planPrice: { fontSize: 15, color: colors.text, fontWeight: '500' },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  restore: { fontSize: 14, color: colors.accent, fontWeight: '500' },
  notNow: { fontSize: 14, color: colors.textLight },
});
