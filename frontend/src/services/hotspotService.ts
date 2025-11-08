import { apiClient } from "@/lib/api-client"

export const getHotspotTransactions = async () => {
  const response = await apiClient.get("/hotspot")
  return response.data
}
