import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback, Share } from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../lib/colors';
import { api, API_URL, loadToken, saveToken, clearToken } from '../lib/api';
import { registerForPush } from '../lib/push';
import Toast from '../components/Toast';

WebBrowser.maybeCompleteAuthSession();

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState(false);
  const [user, setUser] = useState(null);
  const [couple, setCouple] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [myInvite, setMyInvite] = useState('');
  const [error, setError] = useState('');
  const [waitingDots, setWaitingDots] = useState('');

  const [, googleResp, promptGoogle] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResp?.type !== 'success') return;
    const idToken = googleResp.params?.id_token || googleResp.authentication?.idToken;
    if (!idToken) return;
    (async () => {
      try {
        const data = await api.authGoogle(idToken);
        await saveToken(data.token);
        const me = await api.me();
        setUser(me.user);
        setCouple(me.couple);
        setError('');
        registerForPush();
        if (me.couple?.paired_at) router.replace('/swipe');
      } catch (e) {
        setError('Google sign-in failed: ' + e.message);
      }
    })();
  }, [googleResp]);

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

  // Load /me, retrying transient failures. Only a 401 means the token is
  // actually invalid — anything else (no connectivity, a 5xx, a timeout) is a
  // temporary hiccup and must NOT be treated as "logged out".
  async function loadMe(retries = 2) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await api.me();
      } catch (e) {
        lastErr = e;
        if (e.status === 401) throw e; // genuine — don't retry, don't keep session
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        }
      }
    }
    throw lastErr;
  }

  async function init() {
    const token = await loadToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await loadMe();
      setConnError(false);
      setUser(data.user);
      setCouple(data.couple);
      registerForPush();
      if (data.couple?.paired_at) {
        router.replace('/swipe');
      }
    } catch (e) {
      if (e.status === 401) {
        // Token really is expired/invalid — clear it so the login screen shows.
        await clearToken();
      } else {
        // Couldn't reach the backend. Keep the token; offer a retry instead of
        // silently dropping the user to the login screen.
        setConnError(true);
      }
    }
    setLoading(false);
  }

  function retryInit() {
    setConnError(false);
    setLoading(true);
    init();
  }

  async function signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // fullName is only populated on the very first sign-in.
      const data = await api.authApple(credential.identityToken, credential.fullName);
      await saveToken(data.token);
      const me = await api.me();
      setUser(me.user);
      setCouple(me.couple);
      setError('');
      registerForPush();
      if (me.couple?.paired_at) router.replace('/swipe');
    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') return; // user dismissed the sheet
      setError('Apple sign-in failed: ' + e.message);
    }
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
      registerForPush();
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

  // Token is valid but we couldn't reach the backend — don't log the user out,
  // let them retry.
  if (connError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Warmth</Text>
        <Text style={styles.subtitle}>Couldn't connect — check your connection</Text>
        <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={retryInit}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
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

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptGoogle()}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={25}
            style={styles.appleButton}
            onPress={signInWithApple}
          />
        )}

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
            <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '500' }}>Logout</Text>
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
  googleButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#444',
    fontSize: 16,
    fontWeight: '500',
  },
  appleButton: {
    width: 260,
    height: 48,
    marginBottom: 20,
  },
});
