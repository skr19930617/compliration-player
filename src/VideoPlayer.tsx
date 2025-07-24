import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaPlaybackRateButton,
  MediaPlayButton,
  // MediaSeekBackwardButton,
  // MediaSeekForwardButton,
  MediaMuteButton,
  MediaFullscreenButton,
} from "media-chrome/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAppDispatch, useAppSelector } from "./app/hooks";
import { setCurrentVideo } from "./app/uiSlice";

import ReactPlayer from "react-player";
import {
  useCreateMetadataMutation,
  useGetFavoritesQuery,
  // useGetMetadataQuery,
  useToggleFavoritesMutation,
} from "./services/api";
import { IconButton } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Favorite from "@mui/icons-material/Favorite";
import MovingIcon from "@mui/icons-material/Moving";

export default function VideoPlayer() {
  const dispatch = useAppDispatch();

  const { currentVideo, videos } = useAppSelector((state) => state.ui);
  const playerRef = useRef<HTMLVideoElement | null>(null);

  const finishRef = useRef(false);
  const finishTimeRef = useRef<number | undefined>(undefined);
  const currentTimeRef = useRef<number>(0);

  // const { data: videoMeta } = useGetMetadataQuery(currentVideo || "", {
  //   skip: !currentVideo,
  // });
  const { data: favorites } = useGetFavoritesQuery();

  const [createMetadata] = useCreateMetadataMutation();
  const [toggleFavorites] = useToggleFavoritesMutation();

  const [A, setA] = useState<number>();
  const [B, setB] = useState<number>();
  const [finish, setFinish] = useState<boolean>(false);

  useEffect(() => {
    setA(undefined);
    setB(undefined);
  }, [currentVideo]);

  useEffect(() => {
    if (currentVideo && A !== undefined && B !== undefined) {
      createMetadata({ id: currentVideo, A: A.toString(), B: B.toString() });
    }
  }, [currentVideo, A, B, createMetadata]);

  const handleTimeUpdate = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (
      finishTimeRef.current !== undefined &&
      player.currentTime > finishTimeRef.current
    ) {
      player.currentTime = player.currentTime - 1;
      return;
    }
    currentTimeRef.current = player.currentTime;
  }, []);

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

  const handleFinish = useCallback(() => {
    if (!playerRef.current) return;
    finishRef.current = !finishRef.current;
    setFinish(finishRef.current);
    if (finishRef.current) {
      finishTimeRef.current = playerRef.current.currentTime;
      console.log("Finish time set to:", finishTimeRef.current);
    } else {
      finishTimeRef.current = undefined;
      console.log("Finish time cleared");
    }
  }, []);

  if (!currentVideo) {
    return <div>Select a video to play</div>;
  }

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
        src={`/api/video/${currentVideo}`}
        controls={false}
        style={{
          width: "100%",
          height: "100%",
        }}
        onEnded={handleEnd}
        onTimeUpdate={handleTimeUpdate}
        onReady={() => {
          playerRef.current?.play();
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
          <Favorite
            color={
              favorites?.includes(currentVideo || "") ? "primary" : "inherit"
            }
          ></Favorite>
        </IconButton>
        <IconButton onClick={handleFinish}>
          <MovingIcon color={finish ? "primary" : "inherit"} />
        </IconButton>
        {/* 
        <MediaSeekBackwardButton seekOffset={0} onClick={toggleA}>
          <span slot="icon" style={{ color: A !== undefined ? "red" : "" }}>
            A
          </span>
        </MediaSeekBackwardButton>
        <MediaSeekForwardButton seekOffset={0} onClick={toggleB}>
          <span slot="icon" style={{ color: B !== undefined ? "red" : "" }}>
            B
          </span>
        </MediaSeekForwardButton> */}
        <MediaTimeRange />
        <MediaTimeDisplay showDuration />
        <MediaMuteButton />
        <MediaPlaybackRateButton />
        <MediaFullscreenButton />
      </MediaControlBar>
    </MediaController>
  );
}
