export type NotificationType =
  | 'trip_completed'
  | 'trip_cancelled'
  | 'payment_confirmed'
  | 'rating_received';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}
