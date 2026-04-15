import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../lib/colors';
import { api, loadToken, saveToken } from '../lib/api';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [couple, setCouple] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [myInvite, setMyInvite] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const token = await loadToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setUser(data.user);
      setCouple(data.couple);
      if (data.couple?.paired_at) {
        router.replace('/swipe');
      }
    } catch {
      // token expired
    }
    setLoading(false);
  }

  // Dev login (skip Google for now)
  async function devLogin(name, email) {
    console.log('[devLogin] start', name);
    setError('Logging in...');
    try {
      const res = await fetch('http://81.200.154.252:3001/auth/dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      console.log('[devLogin] response', res.status);
      const data = await res.json();
      console.log('[devLogin] data', data);
      await saveToken(data.token);
      setUser(data.user);
      setError('');
    } catch (e) {
      console.log('[devLogin] error', e.message);
      setError('Error: ' + e.message);
    }
  }

  async function createCouple() {
    try {
      const data = await api.createCouple();
      setMyInvite(data.invite_code);
    } catch (e) {
      setError(e.message);
    }
  }

  async function joinCouple() {
    try {
      await api.joinCouple(inviteCode);
      router.replace('/swipe');
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Warmth</Text>
      </View>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Warmth</Text>
        <Text style={styles.subtitle}>Small gestures, real closeness</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.devBox}>
          <Text style={styles.devLabel}>Dev Login</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => devLogin('Alice', 'alice@test.com')}
          >
            <Text style={styles.buttonText}>Login as Alice</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { marginTop: 10 }]}
            onPress={() => devLogin('Bob', 'bob@test.com')}
          >
            <Text style={styles.buttonText}>Login as Bob</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Logged in but no couple
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hi, {user.name}</Text>
      <Text style={styles.subtitle}>Pair with your partner</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={createCouple}>
        <Text style={styles.buttonText}>Create Invite</Text>
      </TouchableOpacity>

      {myInvite ? (
        <View style={styles.inviteBox}>
          <Text style={styles.inviteLabel}>Share this code:</Text>
          <Text style={styles.inviteCode}>{myInvite}</Text>
        </View>
      ) : null}

      <Text style={[styles.subtitle, { marginTop: 30 }]}>Or join with a code:</Text>
      <TextInput
        style={styles.input}
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="Enter invite code"
        placeholderTextColor={colors.textMuted}
      />
      <TouchableOpacity style={styles.button} onPress={joinCouple}>
        <Text style={styles.buttonText}>Join</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 36,
    color: colors.text,
    fontWeight: '300',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 30,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  devBox: {
    marginTop: 20,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  devLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  inviteBox: {
    marginTop: 20,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  inviteCode: {
    fontSize: 28,
    color: colors.accent,
    fontWeight: '600',
    letterSpacing: 3,
  },
  input: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
    width: '100%',
    textAlign: 'center',
    marginBottom: 16,
  },
  error: {
    color: '#c44',
    marginBottom: 16,
  },
});
