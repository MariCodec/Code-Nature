import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadUserData } from "./store/thunks/syncThunks";
import type { AppDispatch } from "./store";

export const AppInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
      console.log("AppInitializer mounted -> loadUserData");
    dispatch(loadUserData());
  }, [dispatch]);

  return null;
};
