import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
  videoUrl?: string | null;
  title: string;
  artist?: string;
  artwork?: string | null;
  shareUrl?: string;
  onPlayingChange?: (playing: boolean) => void;
  showShareButton?: boolean;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const AudioPlayer = ({
  audioUrl,
  videoUrl,
  title,
  artist,
  artwork,
  shareUrl,
  onPlayingChange,
  showShareButton = true
}: AudioPlayerProps) => {
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const youtubeId = videoUrl ? getYoutubeId(videoUrl) : null;

  // Media Session API for lock screen / minimized player
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: artist || 'Ministração',
        album: 'Igreja',
        artwork: artwork ? [
          { src: artwork, sizes: '96x96', type: 'image/png' },
          { src: artwork, sizes: '128x128', type: 'image/png' },
          { src: artwork, sizes: '192x192', type: 'image/png' },
          { src: artwork, sizes: '256x256', type: 'image/png' },
          { src: artwork, sizes: '384x384', type: 'image/png' },
          { src: artwork, sizes: '512x512', type: 'image/png' },
        ] : []
      });

      navigator.mediaSession.setActionHandler('play', () => {
        mediaRef.current?.play();
        setIsPlaying(true);
        onPlayingChange?.(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        mediaRef.current?.pause();
        setIsPlaying(false);
        onPlayingChange?.(false);
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => skip(-10));
      navigator.mediaSession.setActionHandler('seekforward', () => skip(10));
    }
  }, [title, artist, artwork]);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => setCurrentTime(media.currentTime);
    const handleLoadedMetadata = () => setDuration(media.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onPlayingChange?.(false);
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('ended', handleEnded);
    };
  }, [onPlayingChange]);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
    onPlayingChange?.(!isPlaying);
  };

  const seek = (value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const skip = (seconds: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = Math.max(0, Math.min(media.currentTime + seconds, duration));
  };

  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackRate(newSpeed);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = newSpeed;
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleShare = async () => {
    const url = shareUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!" });
    } catch {
      toast({ title: "Erro ao copiar link", variant: "destructive" });
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Hidden media element */}
      {/* Hidden media element */}
      {youtubeId ? (
        <div className="w-full rounded-xl aspect-video bg-black overflow-hidden relative">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full absolute top-0 left-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        </div>
      ) : videoUrl ? (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={videoUrl}
          className="w-full rounded-xl aspect-video bg-black"
          controls={false}
          playsInline
        />
      ) : (
        <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={audioUrl} />
      )}

      {/* Progress bar - Hide for YouTube */}
      {!youtubeId && (
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={seek}
            className="sermon-progress-slider cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(duration - currentTime)}</span>
          </div>
        </div>
      )}

      {/* Controls - Hide playback controls for YouTube, keep Share */}
      <div className="flex items-center justify-center gap-2">
        {!youtubeId && (
          <>
            {/* Speed control */}
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleSpeed}
              className="w-12 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              {playbackRate}x
            </Button>

            {/* Skip back */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="text-muted-foreground hover:text-foreground"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            {/* Play/Pause - Large central button */}
            <Button
              onClick={togglePlay}
              size="icon"
              className={cn(
                "w-14 h-14 rounded-full transition-all duration-200",
                "bg-foreground text-background hover:bg-foreground/90 hover:scale-105",
                "shadow-lg"
              )}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6 ml-1" fill="currentColor" />
              )}
            </Button>

            {/* Skip forward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Share */}
        {showShareButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="text-muted-foreground hover:text-foreground"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        )}
      </div>



      {/* Volume control - Desktop only */}
      {/* Volume control - Desktop only - Hide for YouTube */}
      {!youtubeId && (
        <div className="hidden md:flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            max={100}
            step={1}
            onValueChange={(v) => {
              const newVol = v[0] / 100;
              setVolume(newVol);
              if (mediaRef.current) {
                mediaRef.current.volume = newVol;
              }
              if (newVol > 0 && isMuted) setIsMuted(false);
            }}
            className="w-24"
          />
        </div>
      )}
    </div>
  );
};
