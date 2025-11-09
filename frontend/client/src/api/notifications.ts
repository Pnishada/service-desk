import api from "./axios";

export interface Notification {
  id: number;
  ticket: number;
  ticket_title: string;
  ticket_status: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const fetchNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get("/notifications/");
  return data;
};

export const markNotificationRead = async (id: number) => {
  await api.post(`/notifications/${id}/read/`);
};
