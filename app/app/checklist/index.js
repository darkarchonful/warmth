import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';

export default function Checklist() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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
    await api.complete(id);
    load();
  }

  function renderItem({ item }) {
    const partner = item.partner_name || 'Partner';

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
        <View style={styles.itemHeader}>
          <Text style={styles.itemCategory}>{item.category_name}</Text>
          <Text style={[styles.status, styles[`status_${item.status}`]]}>
            {item.status === 'matched' ? 'Confirm' : 'Planned'}
          </Text>
        </View>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemTagline}>{item.tagline}</Text>

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
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Text style={[styles.back, { textAlign: 'left' }]}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Our Plans</Text>
        <View style={styles.headerSide} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No plans yet</Text>
          <Text style={styles.emptySubtext}>Swipe on ideas together to create plans</Text>
        </View>
      ) : (
        <FlatList
          data={items}
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
