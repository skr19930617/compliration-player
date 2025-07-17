import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { useGetFavoritesQuery, useGetTreeQuery, useLazyGetVideosQuery } from "./services/api";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { useTreeItem } from "@mui/x-tree-view/useTreeItem";
import { TreeItemProps } from "@mui/x-tree-view/TreeItem";
import { forwardRef, useCallback } from "react";
import { Button, IconButton, Stack, Typography } from "@mui/material";
import { RichTreeView } from "@mui/x-tree-view";
import { useAppDispatch } from "./app/hooks";
import { setCurrentVideo, setVideos } from "./app/uiSlice";

interface CustomLabelProps {
  children: string;
  handleClick?: () => void;
}

function CustomLabel({ children, handleClick }: CustomLabelProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={4}
      flexGrow={1}
    >
      <Typography>{children}</Typography>
      {!!handleClick && (
        <IconButton
          sx={{ position: "absolute", right: 0, top: 0 }}
          onClick={handleClick}
        >
          <PlayArrowIcon />
        </IconButton>
      )}
    </Stack>
  );
}

const CustomTreeItem = forwardRef(function CustomTreeItem(
  props: TreeItemProps,
  ref: React.Ref<HTMLLIElement>
) {
  const { publicAPI } = useTreeItem(props);
  const dispatch = useAppDispatch();
  const [getVideos] = useLazyGetVideosQuery();



  const handleSelectFile = useCallback(
    (path: string) => {
      dispatch(setCurrentVideo(path));
    },
    [dispatch]
  );

  const handleSelectDir = useCallback(
    (path: string) => {
      getVideos(path)
        .unwrap()
        .then((videos) => {
          dispatch(setVideos(videos));
        })
        .catch((error) => {
          console.error("Failed to fetch videos:", error);
        });
    },
    [dispatch, getVideos]
  );



  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    const item = publicAPI.getItem(props.itemId);
    if (item.itemType === "file") {
      handleSelectFile(item.id);
    } else if (item.itemType === "directory") {
      handleSelectDir(item.id);
    }
  };

  return (
    <TreeItem
      {...props}
      ref={ref}
      slots={{
        label: CustomLabel,
      }}
      slotProps={{
        label: { handleClick } as CustomLabelProps,
      }}
    />
  );
});

export default function TreePanel() {
  const { data, isLoading } = useGetTreeQuery();
  const {data: favorites} = useGetFavoritesQuery();
  const dispatch = useAppDispatch();

  console.log("Favorites:", favorites);
  const handleSelectFavorites = useCallback(() => {
    if (favorites && favorites.length > 0) {
      dispatch(setVideos(favorites));
      dispatch(setCurrentVideo(favorites[0]));
    } else {
      console.warn("No favorites available");
    }
  }, [dispatch, favorites]);

  if (!data) return null;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (<>
  <Button variant="contained" onClick={handleSelectFavorites}>
    Load Favorites
  </Button>
  <RichTreeView sx={{
    width: "100%",
    height: 500,
    overflow: "auto",
    flexGrow: 1,
    flexShrink: 0,
  }} items={data} slots={{ item: CustomTreeItem }} />
  </>);
}
