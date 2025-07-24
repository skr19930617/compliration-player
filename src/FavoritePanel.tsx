import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { useGetFavoritesQuery, useLazyGetVideosQuery } from "./services/api";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { useTreeItem } from "@mui/x-tree-view/useTreeItem";
import { TreeItemProps } from "@mui/x-tree-view/TreeItem";
import { forwardRef, useCallback, useMemo } from "react";
import { Button, IconButton, Stack, Typography } from "@mui/material";
import { RichTreeView } from "@mui/x-tree-view";
import { useAppDispatch } from "./app/hooks";
import { setCurrentVideo, setVideos } from "./app/uiSlice";

interface CustomLabelProps {
  children: string;
  itemType?: "file" | "directory";
  handleClick?: () => void;
}

function CustomLabel({ children, itemType, handleClick }: CustomLabelProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={4}
      flexGrow={1}
    >
      <Typography>{children}</Typography>
      {itemType === "directory" && !!handleClick && (
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
  const item = publicAPI.getItem(props.itemId);

  const dispatch = useAppDispatch();
  const { data: favorites } = useGetFavoritesQuery();

  const handleSelectFile = useCallback(
    (path: string) => {
      dispatch(setCurrentVideo(path));
      dispatch(setVideos([])); // Clear videos when selecting a file
    },
    [dispatch]
  );

  const handleSelectDir = useCallback(() => {
    dispatch(setVideos(favorites || []));
  }, [dispatch]);

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    const item = publicAPI.getItem(props.itemId);
    if (item.itemType === "file") {
      handleSelectFile(item.id);
    } else if (item.itemType === "directory") {
      handleSelectDir();
    }
  };

  return (
    <TreeItem
      {...props}
      ref={ref}
      slots={{
        label: CustomLabel,
      }}
      onClick={(e) => {
        if (item.itemType === "file") {
          handleClick(e);
        }
      }}
      slotProps={{
        label: { itemType: item.itemType, handleClick } as CustomLabelProps,
      }}
    />
  );
});

export default function FavoritePanel() {
  const { data: favorites } = useGetFavoritesQuery();
  const dispatch = useAppDispatch();

  const favoriteItems = useMemo(() => {
    if (!favorites) return [];
    return [
      {
        id: "favorites",
        itemType: "directory",
        label: "Favorites",
        children: favorites.map((f) => {
          return {
            id: f,
            itemType: "file", // Assuming favorites are files
            label: f, // Placeholder label
          };
        }),
      },
    ];
  }, [favorites]);

  const handleSelectFavorites = useCallback(() => {
    if (favorites && favorites.length > 0) {
      dispatch(setVideos(favorites));
      dispatch(setCurrentVideo(favorites[0]));
    } else {
      console.warn("No favorites available");
    }
  }, [dispatch, favorites]);

  if (!favorites) return null;

  return (
    <>
      <RichTreeView
        sx={{
          width: "100%",
          overflow: "auto",
          flexGrow: 1,
          flexShrink: 0,
        }}
        items={favoriteItems}
        slots={{ item: CustomTreeItem }}
      />
    </>
  );
}
