import { http } from './client';
import type { NotificationListResponse } from '../types';

export const notifications = {
  list: (limit = 20, offset = 0) =>
    http.get<NotificationListResponse>(`/notifications/?limit=${limit}&offset=${offset}`),

  markRead: (notificationId: string) =>
    http.patch<{ status: string }>(`/notifications/${notificationId}/read`),
};
