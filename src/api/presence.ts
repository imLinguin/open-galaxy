import axios from "axios";
import auth from "./auth";

const setPresence = async (state: "online" | "invisible") => {
  const credentials = await auth.getCredentials();
  const res = await axios.post(
    `https://presence.gog.com/users/${credentials.user_id}/status`,
    {
      application_type: "GOG Galaxy",
      force_update: false,
      presence: state,
      version: "2.0.45.61",
    },
    { headers: { Authorization: `Bearer ${credentials.access_token}` } }
  );
};
const deletePresence = async () => {
  const credentials = await auth.getCredentials();
  const res = await axios.delete(
    `https://presence.gog.com/users/${credentials.user_id}/status`,
    {
      headers: { Authorization: `Bearer ${credentials.access_token}` },
    }
  );
};

export default { setPresence, deletePresence };
