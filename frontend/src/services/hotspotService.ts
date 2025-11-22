import axios from "axios";

export const getHotspotTransactions = async () => {
  const response = await axios.get("/hotspot")
  return response.data
}
