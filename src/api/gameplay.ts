import axios from "axios";
import auth from "./auth";

const getFriendsRecentlyPlayed = async () => {
  const credentials = await auth.getCredentials();
  const res = await axios.get(
    `https://gameplay.gog.com/users/${credentials.user_id}/friends_recently_played`
  );
  return res.data;
};

export default {getFriendsRecentlyPlayed}
