export type Notification = {
  _id: string;
  message: string;
  type: 'device_status' | 'system' | 'billing' | 'ticket';
  status: 'read' | 'unread';
  createdAt: string;
  updatedAt: string;
};
