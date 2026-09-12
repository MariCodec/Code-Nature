import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadUserData } from "./store/thunks/syncThunks";
import { loadSession } from "./store/thunks/authThunks";
import type { AppDispatch } from "./store";
import { useThemeAttribute } from "./hooks/useThemeAttribute";

export const AppInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();
  useThemeAttribute();

  useEffect(() => {
    void dispatch(loadSession()).finally(() => {
      void dispatch(loadUserData());
    });
  }, [dispatch]);

  return null;
};
