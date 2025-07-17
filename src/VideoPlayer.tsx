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
import {  useCreateMetadataMutation, useGetFavoritesQuery, useGetMetadataQuery, useToggleFavoritesMutation } from "./services/api";
import {  IconButton } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from '@mui/icons-material/ArrowForward';
import Favorite from '@mui/icons-material/Favorite';
import MovingIcon from '@mui/icons-material/Moving';

export default function VideoPlayer() {
  const dispatch = useAppDispatch();

  const { currentVideo, videos } = useAppSelector((state) => state.ui);
  const playerRef = useRef<HTMLVideoElement | null>(null);

  const finishRef = useRef(false);
  const currentTimeRef = useRef<number>(0);

  const { data: videoMeta } = useGetMetadataQuery(currentVideo || "", {
    skip: !currentVideo,
  });
  const {data: favorites} = useGetFavoritesQuery();

  const [createMetadata] = useCreateMetadataMutation();
  const [toggleFavorites] = useToggleFavoritesMutation();

  const [A, setA] = useState<number>();
  const [B, setB] = useState<number>();

  useEffect(() => {
    if (videoMeta) {
      setA(videoMeta.A ? parseFloat(videoMeta.A) : undefined);
      setB(videoMeta.B ? parseFloat(videoMeta.B) : undefined);
    } else {
      setA(undefined);
      setB(undefined);
    }
  }, [videoMeta]);

  useEffect(() => {
    if (currentVideo && A !== undefined && B !== undefined) {
      createMetadata({ id: currentVideo, A: A.toString(), B: B.toString() });
    }
  }, [currentVideo, A, B, createMetadata]);

  const handleTimeUpdate = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (finishRef.current && player.currentTime >= currentTimeRef.current) {
      player.currentTime = currentTimeRef.current - 1;

      console.log(player.currentTime, currentTimeRef.current);
      return;
    }
    console.log("Time update:", player.currentTime);
    currentTimeRef.current = player.currentTime;


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

  const next = useCallback(() => {
    if (videos.length === 0) return;
    const currentIndex = videos.indexOf(currentVideo || "");
    const nextIndex = (currentIndex + 1) % videos.length;
    dispatch(setCurrentVideo(videos[nextIndex]));
  }, [videos, currentVideo, dispatch]);

  const prev = useCallback(() => {
    if (videos.length === 0) return;
    const currentIndex = videos.indexOf(currentVideo || "");
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
    dispatch(setCurrentVideo(videos[prevIndex]));
  }, [videos, currentVideo, dispatch]);

  const onFavorite = useCallback(() => {
    if (currentVideo) {
      toggleFavorites(currentVideo)
        .unwrap()
        .then(() => {
          console.log("Added to favorites:", currentVideo);
        })
        .catch((error) => {
          console.error("Failed to add to favorites:", error);
        });
    }
  }, [currentVideo, toggleFavorites]);

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
        src={`http://192.168.1.200:5050/api/video/${currentVideo}`}
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
        <IconButton onClick={prev}>
          <ArrowBack></ArrowBack>
        </IconButton>
        <IconButton onClick={next}>
          <ArrowForward></ArrowForward>
        </IconButton>
        <IconButton onClick={onFavorite}>
          <Favorite color={
                favorites?.includes(currentVideo || "") ? "primary" : "inherit"
          }></Favorite>
        </IconButton>
        <IconButton onClick={() => {
          finishRef.current = !finishRef.current;
        }}>
          <MovingIcon color={finishRef.current ? "primary" : "inherit"} />
          </IconButton>

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
