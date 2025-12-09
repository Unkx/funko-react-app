import React, { useState, useEffect } from 'react';
import { translations } from './Translations/TranslationAdmin';

const AdminInvites = ({ isDarkMode, language = 'EN' }) => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [newInviteToken, setNewInviteToken] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  
  const t = translations[language] || translations['EN'];
  const token = localStorage.getItem('token');

  const fetchInvites = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/invites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      } else {
        alert('Failed to fetch invites');
      }
    } catch (err) {
      console.error('Error fetching invites:', err);
      alert('Error fetching invites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleCreateInvite = async () => {
    if (!token) return;
    setCreatingInvite(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ expiresInDays })
      });
      
      if (res.ok) {
        const data = await res.json();
        setNewInviteToken(data.token);
        setShowTokenModal(true);
        await fetchInvites();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create invite');
      }
    } catch (err) {
      console.error('Error creating invite:', err);
      alert('Error creating invite');
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleRevokeInvite = async (id) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;
    if (!token) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/invites/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert('Invite revoked');
        await fetchInvites();
      } else {
        alert('Failed to revoke invite');
      }
    } catch (err) {
      console.error('Error revoking invite:', err);
      alert('Error revoking invite');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className={`w-full max-w-6xl p-6 rounded-lg shadow-lg transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 text-white border border-gray-700' 
        : 'bg-white text-gray-800 border border-gray-200'
    }`}>
      {/* Header */}
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 font-[Special_Gothic_Expanded_One] ${
          isDarkMode ? 'text-yellow-400' : 'text-blue-600'
        }`}>
          {t.adminInvites || 'Admin Invites'}
        </h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {t.adminInvitesDescription || 'Manage admin invitation tokens'}
        </p>
      </div>

      {/* Create Invite Form */}
      <div className={`p-5 rounded-lg mb-8 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-700 border border-gray-600' 
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          {t.createNewInvite || 'Create New Invite'}
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t.expiresIn || 'Expires In (Days)'}
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
              className={`w-full px-4 py-2.5 rounded-lg border transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-30'
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30'
              } focus:outline-none`}
            />
          </div>
          <button
            onClick={handleCreateInvite}
            disabled={creatingInvite}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] ${
              creatingInvite
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-lg'
            } ${
              isDarkMode
                ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {creatingInvite ? 'Creating...' : (t.createInvite || 'Create Invite')}
          </button>
        </div>
      </div>

      {/* Invites List */}
      {loading ? (
        <div className="text-center py-12">
          <div className={`animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 mx-auto mb-4 ${
            isDarkMode ? 'border-yellow-500' : 'border-blue-500'
          }`}>
          </div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading invites...
          </p>
        </div>
      ) : invites.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="mx-auto h-16 w-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t.noInvites || 'No invites created yet'}
          </p>
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-lg border transition-colors duration-300 ${
          isDarkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          <table className={`min-w-full border-collapse transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <thead className={`transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
            } border-b`}>
              <tr>
                <th className={`px-5 py-3.5 text-left text-sm font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.inviteCode || 'Code'}
                </th>
                <th className={`px-5 py-3.5 text-left text-sm font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.created || 'Created'}
                </th>
                <th className={`px-5 py-3.5 text-left text-sm font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.expires || 'Expires'}
                </th>
                <th className={`px-5 py-3.5 text-left text-sm font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.status || 'Status'}
                </th>
                <th className={`px-5 py-3.5 text-left text-sm font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.usedBy || 'Used By'}
                </th>
                <th className={`px-5 py-3.5 text-center text-sm font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t.actions || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const expired = isExpired(invite.expires_at);
                const used = !!invite.used_by;
                
                return (
                  <tr
                    key={invite.id}
                    className={`border-b transition-colors duration-300 ${
                      isDarkMode
                        ? 'border-gray-700 hover:bg-gray-750'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <code className={`px-3 py-1.5 rounded-md text-sm font-mono border transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-200' 
                          : 'bg-gray-100 border-gray-300 text-gray-800'
                      }`}>
                        {invite.display_code}
                      </code>
                    </td>
                    <td className={`px-5 py-3.5 text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {formatDate(invite.created_at)}
                    </td>
                    <td className={`px-5 py-3.5 text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {formatDate(invite.expires_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      {used ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-500 text-white">
                          {t.used || 'Used'}
                        </span>
                      ) : expired ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-500 text-white">
                          {t.expired || 'Expired'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-500 text-white">
                          {t.active || 'Active'}
                        </span>
                      )}
                    </td>
                    <td className={`px-5 py-3.5 text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {invite.used_at ? formatDate(invite.used_at) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {!used && !expired && (
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-[1.05] ${
                            isDarkMode
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {t.revoke || 'Revoke'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Invite Token Modal */}
      {showTokenModal && newInviteToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 backdrop-blur-sm transition-opacity duration-300">
          <div
            className={`w-full max-w-md p-6 rounded-xl shadow-2xl border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-200 text-gray-800'
            } transform scale-100 animate-fadeIn`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-xl font-bold mb-4 font-[Special_Gothic_Expanded_One] ${
              isDarkMode ? 'text-yellow-400' : 'text-blue-600'
            }`}>
              {t.inviteCreated || 'Invite Created! 🎉'}
            </h3>
            
            <div className={`p-4 rounded-lg mb-5 border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-yellow-900/30 border-yellow-700' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <p className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                isDarkMode ? 'text-yellow-200' : 'text-yellow-800'
              }`}>
                <span className="text-base">⚠️</span>
                {t.copyTokenWarning || 'Important: Copy this token now!'}
              </p>
              <p className={`text-xs ${
                isDarkMode ? 'text-yellow-300/80' : 'text-yellow-700'
              }`}>
                {t.tokenWarningDetails || 'This token will only be shown once. Make sure to copy it before closing this window.'}
              </p>
            </div>

            <div className={`p-4 rounded-lg mb-6 border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-gray-100 border-gray-300'
            }`}>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t.inviteToken || 'Invite Token'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInviteToken}
                  readOnly
                  className={`flex-1 px-3 py-2.5 rounded-lg border font-mono text-sm transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-600 border-gray-500 text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
                <button
                  onClick={() => copyToClipboard(newInviteToken)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.05] ${
                    copiedToken
                      ? 'bg-green-600 text-white'
                      : isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {copiedToken ? '✓ Copied!' : (t.copy || 'Copy')}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowTokenModal(false);
                  setNewInviteToken(null);
                  setCopiedToken(false);
                }}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.05] ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'
                }`}
              >
                {t.close || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .bg-gray-750 {
          background-color: #374151;
        }
        
        .hover\:bg-gray-750:hover {
          background-color: #374151;
        }
      `}</style>
    </div>
  );
};

export default AdminInvites;