import { View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../lib/colors';
import DriftImage from './DriftImage';

// Media for the plan detail hero. Prefers a looping video clip when the activity
// has one (video_url), otherwise falls back to the still image with the same
// Ken Burns drift used elsewhere, otherwise a neutral placeholder. Cards animate
// incrementally: only activities with a <id>.mp4 wired get real motion, the rest
// keep the drifting still — no per-card code, just presence of video_url.
export default function PlanMedia({ videoUrl, imageUrl, style, imageStyle }) {
  if (videoUrl) return <PlanVideo uri={videoUrl} style={style} />;
  if (imageUrl) return <DriftImage source={{ uri: imageUrl }} style={style} imageStyle={imageStyle} />;
  return <View style={[style, { backgroundColor: colors.warm }]} />;
}

// Isolated so the video-player hook only mounts when there's actually a clip.
function PlanVideo({ uri, style }) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={false}
      pointerEvents="none"
    />
  );
}
