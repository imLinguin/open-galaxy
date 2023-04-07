import axios from "axios";

const storeApi = async (id: string, lang?: string): Promise<any> => {
  const res = await axios.get(
    `https://api.gog.com/v2/games/${id}?nonComplete=1`
  );

  return res.data;
};

const getProductsApi = async (id: string): Promise<any> => {
  const res = await axios.get(
    `https://api.gog.com/products/${id}?expand=downloads,expanded_dlcs,related_products,changelog&locale=en-US`
  );

  return res.data;
};

const getReviewScore = async (id: string): Promise<any> => {
  const res = await axios.get(
    `https://reviews.gog.com//v1/products/${id}/averageRating`
  );

  return res.data;
};

export default { storeApi, getProductsApi, getReviewScore };
