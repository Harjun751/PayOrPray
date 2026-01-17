import { useContext } from "react";
import { UserContext } from "../App";

export default function useUser() {
  return useContext(UserContext);
}
