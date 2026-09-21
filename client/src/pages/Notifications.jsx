import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "../api/axios";
export default function Notifications() {
  const [notices, setNotices] = useState([]);
  useEffect(() => {
    api
      .get("/notifications")
      .then((response) => setNotices(response.data.data))
      .catch(() => {});
  }, []);
  const read = async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    setNotices((items) => items.map((item) => (item._id === id ? response.data.data : item)));
  };
  return (
    <main className="container page-shell">
      <div className="page-title">
        <h1>Notifications</h1>
      </div>
      {!notices.length ? (
        <div className="state-card">No notifications yet.</div>
      ) : (
        <div className="management-list">
          {notices.map((notice) => (
            <article className="management-card panel" key={notice._id}>
              <div>
                <h3>
                  {notice.title}
                  {!notice.read && " •"}
                </h3>
                <p>{notice.message}</p>
                <small>{new Date(notice.createdAt).toLocaleString()}</small>
              </div>
              <div className="management-actions">
                {notice.link && <Link to={notice.link}>View</Link>}
                {!notice.read && (
                  <button className="button small" onClick={() => read(notice._id)}>
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
