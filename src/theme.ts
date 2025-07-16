import { createTheme } from "@mui/material/styles";

export const colors = [
  "#e50000",
  "#3ea908",
  "#4640ff",
  "#ec894d",
  "#f0cc2e",
  "#e641b6",
  "#41b6e6",
  "#FE5D26",
];

// A custom theme for this app
export const darkTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "dark",
    primary: {
      main: colors[6],
    },
    secondary: {
      main: "#f48fb1",
    },
    error: {
      main: colors[0],
    },
    success: {
      main: colors[1],
    },
  },
});

export const lightTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: colors[6],
    },
    secondary: {
      main: "#19857b",
    },
    error: {
      main: colors[0],
    },
    success: {
      main: colors[1],
    },
  },
});
