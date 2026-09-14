import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// A still image that slowly pans + zooms ("Ken Burns" drift) so the card art
// feels alive without needing actual video. Native-driven (transform only), so
// it's cheap and ships over-the-air. Pass `imageStyle` for any extra animated
// style the caller already applies (e.g. a fade-in opacity on the swipe deck).
export default function DriftImage({
  source,
  style,
  imageStyle,
  resizeMode = 'cover',
  duration = 14000,
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, t]);

  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.08] });
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Animated.Image
      source={source}
      resizeMode={resizeMode}
      style={[style, imageStyle, { transform: [{ scale }, { translateX }, { translateY }] }]}
    />
  );
}
