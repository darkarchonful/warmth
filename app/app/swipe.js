import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, PanResponder, Image, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors } from '../lib/colors';
import { api, API_URL } from '../lib/api';
import CoachCard from '../components/CoachCard';

function resolveImage(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ]));
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);
  return <Animated.View style={[styles.unreadDot, { transform: [{ scale }], opacity }]} />;
}

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.25;

const ONBOARDING_EXAMPLES = [
  'Sunday pancakes',
  'The walk in the rain',
  'Movie + popcorn night',
  'A long talk before bed',
  'Cooking together with music',
];
const RECURRING_EXAMPLES = [
  'Saturday market run',
  'Pizza Friday',
  'Read together for 20 min',
  'A trip to a new neighborhood',
  'Sunset coffee on the balcony',
];

export default function Swipe() {
  const router = useRouter();
  const [activity, setActivity] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [planImages, setPlanImages] = useState([]);
  // Bumped on every screen focus so the Time-to-act scatter remounts and
  // re-plays its entrance each time the user lands here (not just on app open).
  const [focusNonce, setFocusNonce] = useState(0);
  const [matchPopup, setMatchPopup] = useState(null);
  const [coachMatch, setCoachMatch] = useState(false);
  const introHandledRef = useRef(false);
  const bootedRef = useRef(false);
  const [done, setDone] = useState(false);
  const [unread, setUnread] = useState(0);
  const [unreadMem, setUnreadMem] = useState(0);
  const [partnerName, setPartnerName] = useState('');
  const [customFormVisible, setCustomFormVisible] = useState(false);
  const [customMode, setCustomMode] = useState('recurring');
  const [customTitle, setCustomTitle] = useState('');
  const [customTagline, setCustomTagline] = useState('');
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [customPlaceholder, setCustomPlaceholder] = useState('');
  const [customSent, setCustomSent] = useState(false);
  const customTitleRef = useRef(null);

  useEffect(() => {
    if (customFormVisible) {
      const t = setTimeout(() => customTitleRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [customFormVisible]);

  function openCustomForm(mode) {
    const examples = mode === 'onboarding' ? ONBOARDING_EXAMPLES : RECURRING_EXAMPLES;
    setCustomMode(mode);
    setCustomTitle('');
    setCustomTagline('');
    setCustomPlaceholder(examples[Math.floor(Math.random() * examples.length)]);
    setCustomFormVisible(true);
  }

  const pan = useRef(new Animated.ValueXY()).current;
  const activityRef = useRef(null);
  const queueRef = useRef([]);
  const titleScale = useRef(new Animated.Value(1)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activity) return;
    revealOpacity.setValue(0);
    Animated.timing(revealOpacity, { toValue: 1, duration: 2500, useNativeDriver: true }).start();
  }, [activity?.id]);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  function prefetchUpcoming() {
    queueRef.current.slice(0, 3).forEach(a => {
      if (a.image_url) Image.prefetch(resolveImage(a.image_url));
    });
  }

  useFocusEffect(useCallback(() => {
    bootedRef.current = false;
    setFocusNonce((n) => n + 1);
    const tick = () => api.me().then(d => {
      setUnread(d.unreadCount || 0);
      setUnreadMem(d.unreadMemories || 0);
      setPartnerName(d.couple?.partner_name || '');
      // First /me of this focus decides what the deck opens with. A brand-new
      // paired user (intro_seen === false) gets a one-time intro card injected
      // at the front — swiped right to reveal the real deck. introHandledRef is
      // never reset, so a late poll (before the server flag round-trips) can't
      // re-show it.
      if (!bootedRef.current) {
        bootedRef.current = true;
        if (!introHandledRef.current && d.user && d.user.intro_seen === false) {
          introHandledRef.current = true;
          pan.setValue({ x: 0, y: 0 });
          setBlocked(false);
          setDone(false);
          setActivity({ __intro: true, id: 'intro-' + Date.now() });
        } else {
          loadNext();
        }
      }
    }).catch(() => {
      // If /me fails on boot, don't strand the screen — load the deck anyway.
      if (!bootedRef.current) { bootedRef.current = true; loadNext(); }
    });
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []));

  async function loadNext() {
    if (queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      setBlocked(false);
      setDone(false);
      pan.setValue({ x: 0, y: 0 });
      setActivity(next);
      prefetchUpcoming();
      if (queueRef.current.length <= 2) refillQueue();
      return;
    }
    await refillQueue({ setFirst: true });
  }

  async function refillQueue({ setFirst = false } = {}) {
    try {
      const data = await api.nextActivity();
      if (data.error && /not in a couple/i.test(data.error)) {
        router.replace('/');
        return;
      }
      if (data.blocked) {
        setBlocked(true);
        setBlockMessage(data.message);
        setPreviewImages(data.preview_images || []);
        setPlanImages(data.plan_images || []);
        return;
      }
      if (data.done) {
        setBlocked(false);
        setDone(true);
        return;
      }
      // Server can return a synthetic "write your own card" prompt instead
      // of an activity. Inject it as a non-DB card; handleSwipe short-circuits
      // for these so no /swipe call is made.
      if (data.prompt === 'custom') {
        const promptCard = { __prompt: true, id: 'prompt-' + Date.now(), mode: data.mode };
        queueRef.current.unshift(promptCard);
        if (setFirst) {
          const first = queueRef.current.shift();
          setBlocked(false);
          setDone(false);
          pan.setValue({ x: 0, y: 0 });
          setActivity(first);
        }
        return;
      }
      if (data.nudge) {
        const n = data.nudge;
        const nudgeCard = {
          __nudge: true,
          id: 'nudge-' + n.id,
          memory_id: n.id,
          title: n.activity_title,
          tagline: n.activity_tagline,
          image_url: n.activity_image_url,
          category_name: n.activity_category,
          days_ago: n.days_ago,
        };
        queueRef.current.unshift(nudgeCard);
        if (setFirst) {
          const first = queueRef.current.shift();
          setBlocked(false);
          setDone(false);
          pan.setValue({ x: 0, y: 0 });
          setActivity(first);
        }
        return;
      }
      const incoming = Array.isArray(data.queue) ? data.queue : [data];
      const existing = new Set(queueRef.current.map(a => a.id));
      if (activityRef.current?.id) existing.add(activityRef.current.id);
      queueRef.current.push(...incoming.filter(a => !existing.has(a.id)));
      if (setFirst && queueRef.current.length > 0) {
        const first = queueRef.current.shift();
        setBlocked(false);
        setDone(false);
        pan.setValue({ x: 0, y: 0 });
        setActivity(first);
      }
      prefetchUpcoming();
    } catch (e) {
      if (/not in a couple/i.test(e.message || '')) {
        router.replace('/');
        return;
      }
      console.error(e);
    }
  }

  async function handleSwipe(liked) {
    const current = activityRef.current;
    if (!current) return;
    if (current.__intro) {
      // Intro card: a right swipe (or the Start button) dismisses it, records
      // the per-user flag, and pulls in the first real activity.
      api.markIntroSeen().catch(() => {});
      loadNext();
      return;
    }
    if (current.__prompt) {
      // Prompt cards are non-swipeable; user interacts via the on-card button
      // or the Skip link. This branch should not normally be hit.
      return;
    }
    if (current.__nudge) {
      try {
        const result = await api.nudgeSwipe(current.memory_id, liked);
        if (result.match) {
          queueRef.current = [];   // new plan — re-check the deck gate on the next card
          if (result.first_match) { setCoachMatch(true); loadNext(); }
          else {
            setMatchPopup(current.title);
            setTimeout(() => { setMatchPopup(null); loadNext(); }, 2500);
          }
        } else {
          loadNext();
        }
      } catch (e) {
        console.error(e);
      }
      return;
    }
    try {
      const result = await api.swipe(current.id, liked);
      if (result.match) {
        // A new plan was just created. Drop the locally cached deck so the next
        // card forces a fresh /activities/next — that's where the 3-plan gate is
        // evaluated, so "Time to act" appears right after the match instead of a
        // few cached cards later.
        queueRef.current = [];
        if (result.first_match) { setCoachMatch(true); loadNext(); }
        else {
          setMatchPopup(current.title);
          setTimeout(() => {
            setMatchPopup(null);
            loadNext();
          }, 2500);
        }
      } else {
        loadNext();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function submitCustom() {
    const title = customTitle.trim();
    if (!title) return;
    setCustomSubmitting(true);
    try {
      await api.createCustom({ title, tagline: customTagline.trim() || null, difficulty: 1 });
      setCustomFormVisible(false);
      setCustomTitle('');
      setCustomTagline('');
      setCustomSent(true);
      setTimeout(() => {
        setCustomSent(false);
        loadNext();
      }, 1500);
    } catch (e) {
      Alert.alert('Could not save card', e.message);
    } finally {
      setCustomSubmitting(false);
    }
  }

  function cancelCustomForm() {
    setCustomFormVisible(false);
    setCustomTitle('');
    setCustomTagline('');
    loadNext();
  }

  function flyOff(liked) {
    Animated.timing(pan, {
      toValue: { x: liked ? SCREEN_W * 1.5 : -SCREEN_W * 1.5, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handleSwipe(liked);
    });
  }

  const pinchScale = useRef(new Animated.Value(1)).current;
  const zoomTx = useRef(new Animated.Value(0)).current;
  const zoomTy = useRef(new Animated.Value(0)).current;
  const [zooming, setZooming] = useState(false);
  const pinchRef = useRef();
  const zoomPanRef = useRef();

  const onPinchEvent = Animated.event([{ nativeEvent: { scale: pinchScale } }], { useNativeDriver: true });
  const onZoomPanEvent = Animated.event(
    [{ nativeEvent: { translationX: zoomTx, translationY: zoomTy } }],
    { useNativeDriver: true },
  );

  const resetZoom = () => {
    Animated.parallel([
      Animated.spring(pinchScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.spring(zoomTx, { toValue: 0, useNativeDriver: true, friction: 5 }),
      Animated.spring(zoomTy, { toValue: 0, useNativeDriver: true, friction: 5 }),
    ]).start(() => setZooming(false));
  };

  const onPinchStateChange = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) setZooming(true);
    if (event.nativeEvent.oldState === State.ACTIVE) resetZoom();
  };
  const onZoomPanStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) resetZoom();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length < 2 && !activityRef.current?.__prompt,
      onMoveShouldSetPanResponder: (e, g) => e.nativeEvent.touches.length < 2 && !activityRef.current?.__prompt && Math.abs(g.dx) > 5,
      onPanResponderTerminationRequest: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        // Intro card only goes one way — right means "begin". A left drag has
        // nothing to skip, so it springs back.
        const isIntro = activityRef.current?.__intro;
        if (g.dx > SWIPE_THRESHOLD) {
          flyOff(true);
        } else if (g.dx < -SWIPE_THRESHOLD && !isIntro) {
          flyOff(false);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    }),
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ['-15deg', '0deg', '15deg'],
  });
  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Top navigation bar — shared between the live deck and the terminal states
  // (blocked / "Time to act") so the user is never trapped with only one exit.
  const navBar = (
    <View style={styles.nav}>
      <TouchableOpacity style={styles.navSide} hitSlop={{ top: 18, bottom: 18, left: 14, right: 14 }} onPress={() => router.push('/checklist')}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.navItem, { textAlign: 'left' }]}>Plans</Text>
          {unread > 0 && <PulsingDot />}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navCenter}
        activeOpacity={0.7}
        onPressIn={() => {
          Animated.timing(titleScale, { toValue: 0.96, duration: 120, useNativeDriver: true }).start();
        }}
        onPressOut={() => {
          Animated.spring(titleScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
        }}
        onPress={() => router.push('/settings')}
      >
        <Animated.View style={[styles.navPill, { transform: [{ scale: titleScale }] }]}>
          <Text style={styles.navTitle}>Warmth</Text>
          <Text style={styles.navTitleCaret}>⌄</Text>
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navSide} hitSlop={{ top: 18, bottom: 18, left: 14, right: 14 }} onPress={() => router.push('/memories')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Text style={[styles.navItem, { textAlign: 'right' }]}>Memories</Text>
          {unreadMem > 0 && <PulsingDot />}
        </View>
      </TouchableOpacity>
    </View>
  );

  if (blocked) {
    const isComeBack = previewImages.length > 0;
    return (
      <View style={[styles.matchContainer, { paddingTop: 80 }]}>
        {navBar}
        <View style={styles.matchCenter}>
          {isComeBack ? (
            <>
              <View style={styles.previewRow}>
                {previewImages.map((url, i) => (
                  <AnimatedPreviewCard key={i} url={resolveImage(url)} index={i} />
                ))}
              </View>
              <Text style={styles.matchEmoji}>🌙</Text>
            </>
          ) : planImages.length > 0 ? (
            <PlanScatter key={focusNonce} images={planImages.map(resolveImage)} />
          ) : (
            <Text style={styles.matchEmoji}>✨</Text>
          )}
          <Text style={styles.matchTitle}>{isComeBack ? 'That\'s enough for today' : 'Time to act'}</Text>
          <Text style={styles.matchFooter}>{blockMessage}</Text>
          <TouchableOpacity
            style={[styles.button, { marginTop: 24 }]}
            onPress={() => router.push('/checklist')}
          >
            <Text style={styles.buttonText}>View plans</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.matchContainer}>
        <View style={styles.matchCenter}>
          <Text style={styles.matchEmoji}>✨</Text>
          <Text style={styles.matchTitle}>You've seen everything</Text>
          <Text style={styles.matchFooter}>New ideas coming soon</Text>
        </View>
      </View>
    );
  }

  if (coachMatch) {
    return (
      <View style={styles.matchContainer}>
        <CoachCard
          visible
          emoji="🎉"
          title="It's a match!"
          body="You both picked this — it's now in Plans. Head there, do it together, then tick it off. That's the whole game."
          cta="Open Plans"
          onPress={() => { setCoachMatch(false); router.push('/checklist'); }}
        />
      </View>
    );
  }

  if (matchPopup) {
    return (
      <View style={styles.matchContainer}>
        <View style={styles.matchCenter}>
          <Text style={styles.matchEmoji}>💛</Text>
          <Text style={styles.matchTitle}>You both want this!</Text>
          <Text style={styles.matchActivity}>{matchPopup}</Text>
          <Text style={styles.matchFooter}>It's now in your Plans</Text>
        </View>
      </View>
    );
  }

  if (customSent) {
    return (
      <View style={styles.matchContainer}>
        <View style={styles.matchCenter}>
          <Text style={styles.matchEmoji}>💛</Text>
          <Text style={styles.matchTitle}>
            Sent to {partnerName || 'your partner'}'s deck
          </Text>
          <Text style={styles.matchFooter}>They'll see it next time they swipe</Text>
        </View>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text style={styles.blockedText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {navBar}

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          (activity.__prompt || activity.__intro) && styles.promptCard,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
        ]}
      >
        {activity.__intro ? (
          <View style={styles.promptInner}>
            <Text style={styles.promptHeart}>💛</Text>
            <Text style={styles.promptTitle}>Find what you both love</Text>
            <Text style={styles.promptTagline}>
              Little things to do together. When you both pick the same one, it
              becomes a shared plan — something to actually go do.
            </Text>
            <Text style={styles.introHint}>Swipe right to begin →</Text>
          </View>
        ) : activity.__prompt ? (
          <View style={styles.promptInner}>
            <Text style={styles.promptHeart}>💛</Text>
            <Text style={styles.promptTitle}>
              {activity.mode === 'onboarding' ? 'Write something just yours' : 'Your turn'}
            </Text>
            <Text style={styles.promptTagline}>
              {activity.mode === 'onboarding'
                ? 'A moment, a tradition, an inside joke — anything you’d both want again.'
                : 'Add another one — something specific to you two.'}
            </Text>
            <TouchableOpacity
              style={styles.promptButton}
              onPress={() => openCustomForm(activity.mode || 'recurring')}
              activeOpacity={0.85}
            >
              <Text style={styles.promptButtonText}>
                {activity.mode === 'onboarding' ? 'Write your first card' : 'Write a card'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <PinchGestureHandler
              ref={pinchRef}
              simultaneousHandlers={zoomPanRef}
              onGestureEvent={onPinchEvent}
              onHandlerStateChange={onPinchStateChange}
            >
              <Animated.View style={[styles.cardImage, zooming && { zIndex: 100, elevation: 20, overflow: 'visible' }]}>
                <PanGestureHandler
                  ref={zoomPanRef}
                  simultaneousHandlers={pinchRef}
                  minPointers={2}
                  onGestureEvent={onZoomPanEvent}
                  onHandlerStateChange={onZoomPanStateChange}
                >
                  {activity.image_url ? (
                    <Animated.Image
                      key={activity.id}
                      source={{ uri: resolveImage(activity.image_url) }}
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          opacity: revealOpacity,
                          transform: [
                            { translateX: zoomTx },
                            { translateY: zoomTy },
                            { scale: pinchScale },
                          ],
                        },
                      ]}
                      resizeMode="cover"
                    />
                  ) : (
                    <Animated.Text key={activity.id} style={[styles.categoryIcon, { opacity: revealOpacity }]}>
                      {getCategoryIcon(activity.category_name)}
                    </Animated.Text>
                  )}
                </PanGestureHandler>
              </Animated.View>
            </PinchGestureHandler>
            <View style={styles.cardContent}>
              {activity.__nudge && (
                <View style={styles.nudgeBadge}>
                  <Text style={styles.nudgeBadgeText}>
                    💛 Loved {activity.days_ago === 0 ? 'today' : activity.days_ago === 1 ? 'yesterday' : `${activity.days_ago} days ago`} · again?
                  </Text>
                </View>
              )}
              <Text style={styles.category}>{activity.category_name}</Text>
              <Text style={styles.cardTitle}>{activity.title}</Text>
              <Animated.Text style={[styles.cardTagline, { opacity: revealOpacity }]}>{activity.tagline}</Animated.Text>
            </View>
          </>
        )}

        {!activity.__prompt && (
          <>
            <Animated.View style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}>
              <Text style={styles.likeText}>{activity.__intro ? "LET'S GO" : 'LOVE'}</Text>
            </Animated.View>
            {!activity.__intro && (
              <Animated.View style={[styles.overlay, styles.skipOverlay, { opacity: skipOpacity }]}>
                <Text style={styles.skipOverlayText}>SKIP</Text>
              </Animated.View>
            )}
          </>
        )}
      </Animated.View>

      {activity.__intro ? (
        // Intro is swipe-only — no button. The on-card "Swipe right to begin"
        // hint is the prompt. Empty spacer keeps the card vertically centered.
        <View style={styles.buttons} />
      ) : activity.__prompt ? (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.promptSkipLink}
            onPress={() => loadNext()}
            activeOpacity={0.6}
          >
            <Text style={styles.promptSkipLinkText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.swipeBtn, styles.skipBtn]}
            onPress={() => flyOff(false)}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.swipeBtn, styles.loveBtn]}
            onPress={() => flyOff(true)}
          >
            <Text style={styles.loveText}>Love this</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={customFormVisible} transparent animationType="slide" onRequestClose={cancelCustomForm}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {customMode === 'onboarding' ? 'Your first one' : 'Write a card'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {customMode === 'onboarding'
                ? 'Just a name — something the two of you would want to do again.'
                : 'Something personal — a tradition, a tiny ritual, an idea you keep coming back to.'}
            </Text>
            <TextInput
              ref={customTitleRef}
              style={styles.modalInput}
              placeholder={customPlaceholder || 'Sunday pancakes'}
              placeholderTextColor={colors.textLight}
              value={customTitle}
              onChangeText={setCustomTitle}
              maxLength={80}
            />
            {customMode !== 'onboarding' && (
              <TextInput
                style={styles.modalInput}
                placeholder="Hint (optional)"
                placeholderTextColor={colors.textLight}
                value={customTagline}
                onChangeText={setCustomTagline}
                maxLength={120}
              />
            )}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={cancelCustomForm} style={[styles.modalBtn, styles.modalCancel]} disabled={customSubmitting}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitCustom}
                style={[styles.modalBtn, (!customTitle.trim() || customSubmitting) && styles.modalBtnDisabled]}
                disabled={!customTitle.trim() || customSubmitting}
              >
                <Text style={styles.modalSaveText}>{customSubmitting ? 'Saving…' : 'Save card'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// "Time to act" hero: the couple's open plans dealt out like a handful of
// tossed photos — each card tilted at its own angle AND nudged up or down a
// little so the pile looks scattered rather than lined up. Overlapping, with a
// staggered spring-in. Replaces the bare ✨ when we have plan art to show.
const SCATTER_LAYOUT = [
  { tilt: '-10deg', dy: 12 },
  { tilt: '8deg', dy: -14 },
  { tilt: '-5deg', dy: 6 },
  { tilt: '9deg', dy: -8 },
];

function ScatterCard({ url, index, tilt, dy, w, h, overlap }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1, friction: 6, tension: 55, delay: index * 110, useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.Image
      source={{ uri: url }}
      style={[styles.scatterCard, {
        width: w,
        height: h,
        marginHorizontal: -overlap / 2,
        opacity: enter,
        zIndex: index,
        transform: [
          { translateY: dy },
          { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
          { rotate: tilt },
        ],
      }]}
      resizeMode="cover"
    />
  );
}

// Size the cards to the actual count so they fill the free width in proportion:
// the gate fires at 3 open plans, so there are usually only 2–3 cards and they
// get large; a rare 4th just shrinks them to stay on-screen. Cards overlap ~30%
// and the width is derived from SCREEN_W, so it scales across phone sizes.
function PlanScatter({ images }) {
  const items = images.filter(Boolean).slice(0, SCATTER_LAYOUT.length);
  const n = items.length;
  if (n === 0) return <Text style={styles.matchEmoji}>✨</Text>;
  const usable = SCREEN_W - 56;                  // screen minus container padding + breathing room
  const overlapRatio = 0.3;
  const span = n - (n - 1) * overlapRatio;       // total footprint in card-widths
  const cardW = Math.min(180, usable / span);    // cap so 1–2 cards don't get oversized
  const cardH = Math.round(cardW * 1.28);
  const overlap = cardW * overlapRatio;
  return (
    <View style={[styles.scatterWrap, { height: cardH + 44 }]}>
      {items.map((url, i) => (
        <ScatterCard key={i} url={url} index={i}
          tilt={SCATTER_LAYOUT[i].tilt} dy={SCATTER_LAYOUT[i].dy}
          w={cardW} h={cardH} overlap={overlap} />
      ))}
    </View>
  );
}

function AnimatedPreviewCard({ url, index }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, delay: index * 180, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    );
    const f = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 3000 + index * 200, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 3000 + index * 200, useNativeDriver: true }),
      ])
    );
    p.start(); f.start();
    return () => { p.stop(); f.stop(); };
  }, []);
  return (
    <Animated.Image
      source={{ uri: url }}
      style={[styles.previewImg, {
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] }),
        transform: [
          { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
          { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.02] }) },
        ],
      }]}
      blurRadius={22}
      resizeMode="cover"
    />
  );
}

function getCategoryIcon(category) {
  const icons = {
    Adventures: '🏔',
    Chill: '☕',
    Creative: '🎨',
    Travel: '✈️',
    Daily: '☀️',
    Romance: '💐',
    Seasonal: '❄️',
    Food: '🍷',
    Sporty: '🚴',
  };
  return icons[category] || '✨';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 60,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  navSide: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navTitle: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  navTitleCaret: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 6,
    marginTop: -2,
    fontWeight: '600',
  },
  navItem: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginLeft: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardImage: {
    aspectRatio: 1 / 1,
    width: '100%',
    backgroundColor: colors.warm,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  categoryIcon: {
    fontSize: 80,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  nudgeBadge: {
    backgroundColor: '#F4E6CC',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  nudgeBadgeText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardTagline: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 30,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeOverlay: {
    right: 24,
    borderColor: colors.accent,
  },
  skipOverlay: {
    left: 24,
    borderColor: '#888',
  },
  likeText: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  skipOverlayText: {
    color: '#888',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  swipeHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    lineHeight: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: 20,
  },
  swipeBtn: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  skipBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  loveBtn: {
    backgroundColor: colors.accent,
  },
  skipText: {
    color: colors.textLight,
    fontSize: 18,
  },
  loveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  promptCard: {
    backgroundColor: '#F8E2C8',
    shadowOpacity: 0,
    elevation: 0,
    minHeight: 460,
    justifyContent: 'center',
  },
  promptInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  promptHeart: {
    fontSize: 56,
    marginBottom: 18,
  },
  promptTitle: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 14,
    textAlign: 'center',
  },
  promptTagline: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    marginBottom: 28,
    opacity: 0.7,
  },
  promptButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  promptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  introHint: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  promptSkipLink: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  promptSkipLinkText: {
    color: colors.textLight,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    color: colors.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.line || '#eee',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
    backgroundColor: colors.bg,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalCancel: {
    backgroundColor: 'transparent',
  },
  modalCancelText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  modalBtnDisabled: {
    opacity: 0.4,
  },
  previewRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  scatterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  scatterCard: {
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: colors.warm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 5,
  },
  previewImg: {
    width: 70,
    height: 90,
    borderRadius: 10,
    marginHorizontal: 4,
    backgroundColor: colors.warm,
    opacity: 0.7,
  },
  blockedEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  blockedTitle: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '300',
    marginBottom: 10,
  },
  blockedText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
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
  },
  matchContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  matchCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchEmoji: {
    fontSize: 80,
    marginBottom: 24,
    textAlign: 'center',
  },
  matchTitle: {
    fontSize: 26,
    color: colors.text,
    fontWeight: '300',
    marginBottom: 12,
    textAlign: 'center',
  },
  matchActivity: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: '500',
    textAlign: 'center',
  },
  matchFooter: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
});
