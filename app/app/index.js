import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../lib/colors';
import { api, API_URL, loadToken, saveToken, clearToken } from '../lib/api';
import Toast from '../components/Toast';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [couple, setCouple] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [myInvite, setMyInvite] = useState('');
  const [error, setError] = useState('');
  const [waitingDots, setWaitingDots] = useState('');

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!myInvite) return;
    const id = setInterval(async () => {
      try {
        const data = await api.me();
        if (data.couple?.paired_at) {
          clearInterval(id);
          router.replace('/swipe');
        }
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, [myInvite]);

  useEffect(() => {
    if (!myInvite) { setWaitingDots(''); return; }
    const id = setInterval(() => {
      setWaitingDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(id);
  }, [myInvite]);

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
    setError('Logging in...');
    try {
      const res = await fetch(`${API_URL}/auth/dev`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      await saveToken(data.token);
      const me = await api.me();
      setUser(me.user);
      setCouple(me.couple);
      setError('');
      if (me.couple?.paired_at) router.replace('/swipe');
    } catch (e) {
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Toast message={error} onHide={() => setError('')} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Hi, {user.name}</Text>
          <Text style={styles.subtitle}>Pair with your partner</Text>

          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20 }}
            onPress={async () => { await clearToken(); setUser(null); setCouple(null); setMyInvite(''); }}
          >
            <Text style={{ color: colors.textLight, fontSize: 14 }}>Logout</Text>
          </TouchableOpacity>

          {myInvite ? (
            <View style={styles.inviteBox}>
              <Text style={styles.inviteLabel}>Share this code:</Text>
              <Text style={styles.inviteCode}>{myInvite}</Text>
              <TouchableOpacity
                style={[styles.button, { marginTop: 12, paddingVertical: 10, paddingHorizontal: 24 }]}
                onPress={async () => {
                  try {
                    await Share.share({
                      message: `Let's pair on Warmth — use this code: ${myInvite}`,
                    });
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                <Text style={styles.buttonText}>Share</Text>
              </TouchableOpacity>
              <Text style={styles.waitingLine}>Waiting for partner{waitingDots}</Text>
              <TouchableOpacity
                style={{ marginTop: 16 }}
                onPress={async () => {
                  try {
                    await api.unpair();
                    setMyInvite('');
                  } catch {}
                }}
              >
                <Text style={styles.cancelLine}>Cancel invite</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={createCouple}>
                <Text style={styles.buttonText}>Create Invite</Text>
              </TouchableOpacity>

              <Text style={[styles.subtitle, { marginTop: 30 }]}>Or join with a code:</Text>
              <TextInput
                style={styles.input}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Enter invite code"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.button} onPress={joinCouple}>
                <Text style={styles.buttonText}>Join</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    paddingBottom: 80,
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
  waitingLine: {
    marginTop: 14,
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  cancelLine: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: 'underline',
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
