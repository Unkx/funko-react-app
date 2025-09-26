// src/components/admin/Requests.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface RequestItem {
  id: number;
  title: string;
  number: string | null;
  reason: string;
  created_at: string;
  user_login: string;
}

const Requests = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) return;
      try {
        const res = await fetch("http://localhost:5000/api/admin/requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setRequests(await res.json());
        }
      } catch (err) {
        alert("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token]);

  const resolveRequest = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/requests/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRequests(requests.filter(r => r.id !== id));
      } else {
        alert("Failed to resolve request");
      }
    } catch (err) {
      alert("Error resolving request");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Pending Item Requests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <h3 className="font-bold">{req.title} {req.number && `(#${req.number})`}</h3>
              <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">{req.reason}</p>
              <p className="text-xs mt-2 text-gray-500">
                Requested by: {req.user_login} • {new Date(req.created_at).toLocaleString()}
              </p>
              <button
                onClick={() => resolveRequest(req.id)}
                className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm"
              >
                Mark as Added
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;