"use client"

// Define the types based on the specification
export interface Device {
  _id: string; // Corresponds to device_id
  router: { _id: string; name: string; } | string; // Corresponds to router_id
  ipAddress: string;
  macAddress: string;
  deviceType: "Access" | "Station";
  status: "UP" | "DOWN";
  monitoringMode?: "SNITCH" | "NONE";
  lastSeen?: string;
  physicalBuilding?: string | Building;
  serviceArea?: string[];
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

export interface MikrotikRouter {
  _id: string;
  name: string;
  ipAddress: string;
}

export interface Building {
  _id: string;
  name: string;
}

// Fetch all devices
export const getDevices = async (deviceType?: "Access" | "Station"): Promise<Device[]> => {
  const params = new URLSearchParams();
  if (deviceType) {
    params.append("deviceType", deviceType);
  }
  const response = await fetch(`/api/devices?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch devices");
  }
  return response.json();
};

// Fetch a single device by ID
export const getDeviceById = async (id: string): Promise<Device> => {
  const response = await fetch(`/api/devices/${id}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch device");
  }
  return response.json();
};

// Create a new device
export const createDevice = async (deviceData: Partial<Device>): Promise<Device> => {
  const response = await fetch(`/api/devices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deviceData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create device");
  }
  return response.json();
};

// Update an existing device
export const updateDevice = async (id: string, deviceData: Partial<Device>): Promise<Device> => {
  const response = await fetch(`/api/devices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deviceData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update device");
  }
  return response.json();
};

// Delete a device
export const deleteDevice = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`/api/devices/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete device");
  }
  return response.json();
};

// Fetch Mikrotik Routers (for dropdowns in device forms)
export const getMikrotikRouters = async (): Promise<MikrotikRouter[]> => {
  const response = await fetch(`/api/mikrotik/routers`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch Mikrotik routers");
  }
  return response.json();
};

// Fetch Buildings (for dropdowns in device forms)
export const getBuildings = async (): Promise<any[]> => { // Using any for now, should be replaced with a Building interface
  const response = await fetch(`/api/buildings`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch buildings");
  }
  const data = await response.json();
  return data.data; // The buildings are in the 'data' property
};

// Create a new building
export const createBuilding = async (buildingData: { name: string, address?: string }): Promise<Building> => {
  const response = await fetch(`/api/buildings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildingData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create building");
  }
  const data = await response.json();
  return data.data;
};

// Ping a device for live status
export const pingDevice = async (id: string): Promise<{ success: boolean; status: 'Reachable' | 'Unreachable' }> => {
  const response = await fetch(`/api/devices/${id}/ping`, {
    method: "POST",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to ping device");
  }
  return response.json();
};

// Enable Netwatch monitoring for a device
export const enableMonitoring = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`/api/devices/${id}/enable-monitoring`, {
    method: "POST",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to enable monitoring");
  }
  return response.json();
};

// Fetch Downtime Logs for a specific device
export const getDeviceDowntimeLogs = async (deviceId: string): Promise<DowntimeLog[]> => {
  const response = await fetch(`/api/devices/${deviceId}/downtime`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch device downtime logs");
  }
  return response.json();
};
