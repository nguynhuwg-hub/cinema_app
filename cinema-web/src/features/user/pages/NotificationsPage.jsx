import { useEffect, useState } from 'react';
import { notificationApi } from '../api/userApi';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const load = () => notificationApi.getMine({ page: 0, size: 50, sort: 'createdAt,desc' }).then((data) => setNotifications(data?.content || []));
  useEffect(() => { load(); }, []);
  const read = async (id) => { await notificationApi.markRead(id); setNotifications(notifications.map((item) => item.id === id ? { ...item, isRead: true } : item)); };
  const readAll = async () => { await notificationApi.markAllRead(); setNotifications(notifications.map((item) => ({ ...item, isRead: true }))); };
  return <div className="page-shell notifications-page"><div className="section-heading"><div><p className="eyebrow">YOUR CINEFLIX</p><h1>Thông báo</h1></div><button className="outline-button" onClick={readAll}>Đánh dấu tất cả đã đọc</button></div>{notifications.map((notification) => <article className={`notification-item ${notification.isRead ? 'read' : ''}`} key={notification.id} onClick={() => !notification.isRead && read(notification.id)}><div><strong>{notification.title}</strong><p>{notification.content}</p><small>{notification.createdAt}</small></div>{!notification.isRead && <span className="unread-dot" />}</article>)}</div>;
};
export default NotificationsPage;