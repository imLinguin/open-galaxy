import axios from "axios";
import auth from "./auth";

const getUserInfo = async () => {
  const credentials = await auth.getCredentials()
  const res = await axios.get(
    `https://users.gog.com/users/${credentials.user_id}`
  );

  return res.data;
};


export default { getUserInfo };
