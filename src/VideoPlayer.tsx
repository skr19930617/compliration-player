import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaPlaybackRateButton,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaFullscreenButton,
} from "media-chrome/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAppDispatch, useAppSelector } from "./app/hooks";
import { setCurrentVideo } from "./app/uiSlice";

import ReactPlayer from "react-player";
import { useCreateMetadataMutation, useGetMetadataQuery } from "./services/api";
export default function VideoPlayer() {
  const dispatch = useAppDispatch();

  const { currentVideo, videos } = useAppSelector((state) => state.ui);
  const playerRef = useRef<HTMLVideoElement | null>(null);

  const { data: videoMeta } = useGetMetadataQuery(currentVideo || "", {
    skip: !currentVideo,
  });

  const [createMetadata] = useCreateMetadataMutation();

  const [A, setA] = useState<number>();
  const [B, setB] = useState<number>();

  useEffect(() => {
    if (videoMeta) {
      setA(videoMeta.A ? parseFloat(videoMeta.A) : undefined);
      setB(videoMeta.B ? parseFloat(videoMeta.B) : undefined);
    }
  }, [videoMeta]);

  useEffect(() => {
    if (currentVideo && A !== undefined && B !== undefined) {
      createMetadata({ id: currentVideo, A: A.toString(), B: B.toString() });
    }
  }, [currentVideo, A, B, createMetadata]);

  const handleTimeUpdate = useCallback(() => {
    const player = playerRef.current;

    console.log("Time update:", player?.currentTime, A, B);
    if (!player) return;

    if (B && player.currentTime >= B) {
      dispatch(
        setCurrentVideo(
          videos[(videos.indexOf(currentVideo || "") + 1) % videos.length]
        )
      );
    }
  }, [dispatch, currentVideo, videos, A, B]);

  const handleEnd = useCallback(() => {
    if (videos.length === 0) return;
    const currentIndex = videos.indexOf(currentVideo || "");
    const nextIndex = (currentIndex + 1) % videos.length;
    dispatch(setCurrentVideo(videos[nextIndex]));
  }, [videos, currentVideo, dispatch]);

  useEffect(() => {
    if (!playerRef.current || !A) return;
    playerRef.current.currentTime = A;
  }, [A]);

  return (
    <MediaController
      style={{
        width: "100%",
        height: "100%",
        aspectRatio: "16/9",
      }}
    >
      <ReactPlayer
        ref={playerRef}
        slot="media"
        src={`http://127.0.0.1:5050/api/video/${currentVideo}`}
        controls={false}
        style={{
          width: "100%",
          height: "100%",
        }}
        onEnded={handleEnd}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (playerRef.current) {
            playerRef.current.play();
            if (A) {
              playerRef.current.currentTime = A;
            }
          }
        }}
      />
      <MediaControlBar>
        <MediaPlayButton />
        <MediaSeekBackwardButton
          seekOffset={0}
          onClick={() => {
            if (B) {
              setA(undefined);
              return;
            }
            setA(playerRef.current?.currentTime);
          }}
        >
          <span slot="icon" style={{ color: A ? "red" : "" }}>
            A
          </span>
        </MediaSeekBackwardButton>
        <MediaSeekForwardButton
          seekOffset={0}
          onClick={() => {
            if (B) {
              setB(undefined);
              return;
            }
            setB(playerRef.current?.currentTime);
          }}
        >
          <span slot="icon" style={{ color: B ? "red" : "" }}>
            B
          </span>
        </MediaSeekForwardButton>
        <MediaTimeRange />
        <MediaTimeDisplay showDuration />
        <MediaMuteButton />
        <MediaPlaybackRateButton />
        <MediaFullscreenButton />
      </MediaControlBar>
    </MediaController>
  );
}
