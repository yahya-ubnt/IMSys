"use client"

// Define the types based on the specification
export interface Device {
  _id: string; // Corresponds to device_id
  router: { _id: string; name: string; }; // Corresponds to router_id
  ipAddress: string;
  macAddress: string;
  deviceType: "Access" | "Station";
  status: "UP" | "DOWN";
  lastSeen?: string;
  location?: string;
  deviceName?: string;
  deviceModel?: string;
  loginUsername?: string;
  loginPassword?: string; // Only sent to the backend, not received
  ssid?: string;
  wirelessPassword?: string; // Only sent to the backend, not received
  createdAt?: string;
  updatedAt?: string;
  connectedStations?: Device[]; // Added for Access Points
  connectedAccessPoint?: Device; // Added for Stations
}

export interface DowntimeLog {
  _id: string;
  deviceId: string;
  downStartTime: string;
  downEndTime?: string;
  durationSeconds?: number;
}

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/**
 * Fetches all devices from the backend.
 * @param token The authentication token.
 * @returns A promise that resolves to an array of devices.
 */
export const getDevices = async (token: string, deviceType?: "Access" | "Station"): Promise<Device[]> => {
  let url = `${API_URL}/devices`;
  if (deviceType) {
    url += `?deviceType=${deviceType}`;
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch devices");
  }
  return response.json();
};

/**
 * Fetches a single device by its ID.
 * @param id The ID of the device to fetch.
 * @param token The authentication token.
 * @returns A promise that resolves to the device object.
 */
export const getDeviceById = async (id: string, token: string): Promise<Device> => {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch device");
  }
  return response.json();
};

/**
 * Creates a new device.
 * @param deviceData The data for the new device.
 * @param token The authentication token.
 * @returns A promise that resolves to the created device object.
 */
export const createDevice = async (deviceData: Partial<Device>, token: string): Promise<Device> => {
  const response = await fetch(`${API_URL}/devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(deviceData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create device");
  }
  return response.json();
};

/**
 * Updates an existing device.
 * @param id The ID of the device to update.
 * @param deviceData The new data for the device.
 * @param token The authentication token.
 * @returns A promise that resolves to the updated device object.
 */
export const updateDevice = async (id: string, deviceData: Partial<Device>, token: string): Promise<Device> => {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(deviceData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update device");
  }
  return response.json();
};

/**
 * Deletes a device by its ID.
 * @param id The ID of the device to delete.
 * @param token The authentication token.
 * @returns A promise that resolves when the device is deleted.
 */
export const deleteDevice = async (id: string, token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete device");
  }
};

/**
 * Fetches the downtime history for a specific device.
 * @param id The ID of the device.
 * @param token The authentication token.
 * @returns A promise that resolves to an array of downtime logs.
 */
export const getDeviceDowntimeLogs = async (id: string, token: string): Promise<DowntimeLog[]> => {
  const response = await fetch(`${API_URL}/devices/${id}/downtime`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch downtime logs");
  }
  return response.json();
};

/**
 * Fetches all Mikrotik routers.
 * @param token The authentication token.
 * @returns A promise that resolves to an array of routers.
 */
export interface MikrotikRouter {
  _id: string;
  name: string;
  ipAddress: string;
}
export const getMikrotikRouters = async (token: string): Promise<MikrotikRouter[]> => {
    const response = await fetch(`/api/mikrotik/routers`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch Mikrotik routers');
    }
    return response.json();
};
