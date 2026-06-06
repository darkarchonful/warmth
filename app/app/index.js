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
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [emailMode, setEmailMode] = useState(null); // null | 'email' | 'code'
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

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

  // Seed the name field once when a freshly-registered user needs to confirm
  // their name — pre-filled with whatever we derived (often from their email).
  useEffect(() => {
    if (user && !user.name_confirmed) setNameDraft(user.name || '');
  }, [user?.id, user?.name_confirmed]);

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

  async function requestEmailCode() {
    const e = emailInput.trim().toLowerCase();
    if (!e) { setError('Enter your email'); return; }
    setEmailBusy(true);
    try {
      await api.requestEmailCode(e);
      setCodeInput('');
      setEmailMode('code');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setEmailBusy(false);
    }
  }

  async function verifyEmailCode() {
    const c = codeInput.trim();
    if (c.length !== 6) { setError('Enter the 6-digit code'); return; }
    setEmailBusy(true);
    try {
      const data = await api.verifyEmailCode(emailInput.trim().toLowerCase(), c);
      await saveToken(data.token);
      const me = await api.me();
      setUser(me.user);
      setCouple(me.couple);
      setEmailMode(null);
      setError('');
      registerForPush();
      if (me.couple?.paired_at) router.replace('/swipe');
    } catch (err) {
      setError(err.message);
    } finally {
      setEmailBusy(false);
    }
  }

  function exitEmailLogin() {
    setEmailMode(null);
    setEmailInput('');
    setCodeInput('');
    setError('');
  }

  async function saveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed) { setError('Please enter a name'); return; }
    setSavingName(true);
    try {
      const data = await api.updateName(trimmed);
      setUser(data.user);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingName(false);
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

  // Not logged in — email-login sub-flow (enter email, then the code).
  if (!user && emailMode) {
    const onCode = emailMode === 'code';
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <Text style={styles.title}>Warmth</Text>
            <Text style={styles.subtitle}>
              {onCode ? `Enter the code we sent to\n${emailInput.trim().toLowerCase()}` : 'Sign in with your email'}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {onCode ? (
              <>
                <TextInput
                  style={[styles.input, { letterSpacing: 8, textAlign: 'center', fontSize: 24 }]}
                  value={codeInput}
                  onChangeText={(t) => setCodeInput(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={verifyEmailCode}
                />
                <TouchableOpacity
                  style={[styles.button, emailBusy && { opacity: 0.6 }]}
                  onPress={verifyEmailCode}
                  disabled={emailBusy}
                >
                  <Text style={styles.buttonText}>{emailBusy ? 'Verifying…' : 'Verify'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 18 }} onPress={requestEmailCode} disabled={emailBusy}>
                  <Text style={styles.cancelLine}>Resend code</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={requestEmailCode}
                />
                <TouchableOpacity
                  style={[styles.button, emailBusy && { opacity: 0.6 }]}
                  onPress={requestEmailCode}
                  disabled={emailBusy}
                >
                  <Text style={styles.buttonText}>{emailBusy ? 'Sending…' : 'Send code'}</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={{ marginTop: 24 }} onPress={exitEmailLogin} disabled={emailBusy}>
              <Text style={styles.cancelLine}>Back to all sign-in options</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  // Not logged in — sign-in options.
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

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => { setError(''); setEmailMode('email'); }}
        >
          <Text style={styles.googleButtonText}>Continue with email</Text>
        </TouchableOpacity>

        {__DEV__ && (
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
        )}
      </View>
    );
  }

  // Logged in but hasn't confirmed their display name yet (new sign-up). The
  // name we have is often derived from their email — let them set a real one.
  if (!user.name_confirmed) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>This is how your partner will see you</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextInput
              style={styles.input}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <TouchableOpacity
              style={[styles.button, savingName && { opacity: 0.6 }]}
              onPress={saveName}
              disabled={savingName}
            >
              <Text style={styles.buttonText}>{savingName ? 'Saving…' : 'Continue'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
            style={{ position: 'absolute', top: 76, right: 20, justifyContent: 'center' }}
            hitSlop={{ top: 18, bottom: 18, left: 14, right: 14 }}
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
    width: 260,
    height: 48,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
