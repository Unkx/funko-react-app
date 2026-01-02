import React, { useState, useEffect } from 'react';
import { translations } from './Translations/TranslationAdminInvites';

interface InviteCode {
  id: number;
  display_code: string; // Hashed/short code
  token_hash?: string; // Hashed version (not shown to other admins)
  created_by: number;
  created_by_username: string;
  created_at: string;
  expires_at: string | null;
  used_by: number | null;
  used_by_username: string | null;
  used_at: string | null;
  status?: 'active' | 'used' | 'expired';
}

const AdminInvites = () => {
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvite, setNewInvite] = useState({
    expiresInDays: 7
  });
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const isDarkMode = localStorage.getItem("preferredTheme") === "dark";
  const language = localStorage.getItem("preferredLanguage") || "EN";
  const t = translations[language] || translations["EN"];
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch("http://192.168.0.162:5000/api/admin/invites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Filter invites: Show all invite data, but for invites NOT created by current user,
        // we won't show the actual token (it's hashed on backend)
        const formattedInvites = data.map((invite: any) => ({
          id: invite.id,
          display_code: invite.display_code || `INV-${invite.id}`,
          created_by: invite.created_by,
          created_by_username: invite.created_by_username || `Admin ${invite.created_by}`,
          created_at: invite.created_at,
          expires_at: invite.expires_at,
          used_by: invite.used_by,
          used_by_username: invite.used_by_username,
          used_at: invite.used_at,
          status: invite.status || 'active',
          // Token will only be included in response for newly created invites
          raw_token: invite.token || null
        }));
        
        setInvites(formattedInvites);
      }
    } catch (err) {
      console.error("Error fetching invites:", err);
      alert(t.failedToLoadInvites || "Failed to load invites");
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    if (!token) return;
    
    setProcessing(true);
    try {
      const response = await fetch("http://192.168.0.162:5000/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expiresInDays: parseInt(newInvite.expiresInDays.toString())
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add the new invite to the list
        const newInviteData = {
          id: data.invite.id,
          display_code: data.invite.display_code,
          created_by: currentUser.id,
          created_by_username: currentUser.login,
          created_at: data.invite.created_at,
          expires_at: data.invite.expires_at,
          used_by: null,
          used_by_username: null,
          used_at: null,
          status: 'active',
          raw_token: data.token // Token only shown once to creator
        };
        
        setInvites([newInviteData, ...invites]);
        setGeneratedToken(data.token);
        setNewInvite({ expiresInDays: 7 });
      } else {
        const error = await response.json();
        alert(error.error || t.failedToCreateInvite || "Failed to create invite");
      }
    } catch (err) {
      console.error("Error creating invite:", err);
      alert(t.failedToCreateInvite || "Failed to create invite");
    } finally {
      setProcessing(false);
    }
  };

  const revokeInvite = async (inviteId: number) => {
    if (!token) return;
    
    if (!confirm(t.confirmRevokeInvite || "Are you sure you want to revoke this invite?")) {
      return;
    }
    
    try {
      const response = await fetch(`http://192.168.0.162:5000/api/admin/invites/${inviteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        setInvites(invites.filter(invite => invite.id !== inviteId));
        alert(t.inviteRevoked || "Invite revoked successfully");
      } else {
        const error = await response.json();
        alert(error.error || t.failedToRevokeInvite || "Failed to revoke invite");
      }
    } catch (err) {
      console.error("Error revoking invite:", err);
      alert(t.failedToRevokeInvite || "Failed to revoke invite");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Check if current user can see invite details
  const canSeeDetails = (invite: InviteCode) => {
    return invite.created_by === currentUser.id;
  };

  return (
    <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800 border border-gray-200"}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-yellow-400" : "text-blue-600"}`}>
            {t.adminInvites || "Admin Invites"}
          </h2>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            {t.invitesDescription || "Create and manage invite codes for new admin users"}
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            isDarkMode
              ? "bg-yellow-500 hover:bg-yellow-600 text-black"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } transition`}
        >
          <span>+</span> {t.createInvite || "Create Invite"}
        </button>
      </div>

      {/* Invite List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? "border-yellow-400" : "border-blue-600"}`}></div>
        </div>
      ) : invites.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔐</div>
          <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {t.noInvitesCreated || "No invite codes created yet"}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`mt-4 px-6 py-2 rounded-lg font-medium ${
              isDarkMode
                ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } transition`}
          >
            {t.createFirstInvite || "Create Your First Invite"}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`min-w-full border-collapse ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
            <thead>
              <tr className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">{t.inviteCode || "Invite Code"}</th>
                <th className="px-4 py-3 text-left font-medium">{t.createdBy || "Created By"}</th>
                <th className="px-4 py-3 text-left font-medium">{t.createdAt || "Created At"}</th>
                <th className="px-4 py-3 text-left font-medium">{t.expiresAt || "Expires At"}</th>
                <th className="px-4 py-3 text-left font-medium">{t.usedBy || "Used By"}</th>
                <th className="px-4 py-3 text-left font-medium">{t.status || "Status"}</th>
                <th className="px-4 py-3 text-left font-medium">{t.actions || "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr 
                  key={invite.id} 
                  className={`border-b ${isDarkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <td className="px-4 py-3">#{invite.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className={`px-2 py-1 rounded text-sm font-mono ${
                        isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800"
                      }`}>
                        {invite.display_code}
                      </code>
                      
                      {/* Show token only to creator */}
                      {canSeeDetails(invite) && invite.raw_token && (
                        <div className="relative group">
                          <button
                            onClick={() => copyToClipboard(invite.raw_token!)}
                            className={`text-xs px-2 py-1 rounded ${
                              isDarkMode 
                                ? "bg-yellow-800 hover:bg-yellow-700 text-yellow-200" 
                                : "bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                            }`}
                            title="Copy token (shown only once)"
                          >
                            📋
                          </button>
                          <div className={`absolute left-0 bottom-full mb-2 hidden group-hover:block p-2 rounded shadow-lg z-10 min-w-[200px] ${
                            isDarkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-300"
                          }`}>
                            <p className="text-xs mb-1 font-medium">{t.oneTimeToken || "One-time token:"}</p>
                            <code className="text-xs break-all">{invite.raw_token}</code>
                          </div>
                        </div>
                      )}
                      
                      {/* Indicator for invites created by other admins */}
                      {!canSeeDetails(invite) && (
                        <span className="text-xs italic text-gray-500" title="Created by another admin">
                          🔒
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {invite.created_by_username}
                    {invite.created_by === currentUser.id && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {t.you || "You"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDate(invite.created_at)}</td>
                  <td className="px-4 py-3">
                    {invite.expires_at ? formatDate(invite.expires_at) : "Never"}
                    {isExpired(invite.expires_at) && !invite.used_at && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        {t.expired || "Expired"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {invite.used_by_username ? (
                      <span className="text-sm">{invite.used_by_username}</span>
                    ) : (
                      <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {t.notUsed || "Not used"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {invite.used_at ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {t.used || "Used"}
                      </span>
                    ) : isExpired(invite.expires_at) ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        {t.expired || "Expired"}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {t.active || "Active"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {/* Only show revoke button for unused invites created by current user */}
                      {!invite.used_at && !isExpired(invite.expires_at) && canSeeDetails(invite) && (
                        <button
                          onClick={() => revokeInvite(invite.id)}
                          className={`px-3 py-1 rounded text-sm ${
                            isDarkMode
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-red-500 hover:bg-red-600 text-white"
                          }`}
                        >
                          {t.revoke || "Revoke"}
                        </button>
                      )}
                      
                      {/* View button - shows limited info for other admins' invites */}
                      <button
                        onClick={() => {
                          const details = [
                            `Invite Code: ${invite.display_code}`,
                            `Created By: ${invite.created_by_username}`,
                            `Created: ${formatDate(invite.created_at)}`,
                            `Expires: ${invite.expires_at ? formatDate(invite.expires_at) : 'Never'}`,
                            `Status: ${invite.status || (invite.used_at ? 'Used' : isExpired(invite.expires_at) ? 'Expired' : 'Active')}`,
                            invite.used_by_username && `Used By: ${invite.used_by_username}`,
                            invite.used_at && `Used At: ${formatDate(invite.used_at)}`,
                            !canSeeDetails(invite) && "🔒 Token not visible (created by another admin)"
                          ].filter(Boolean).join('\n');
                          
                          alert(details);
                        }}
                        className={`px-3 py-1 rounded text-sm ${
                          isDarkMode
                            ? "bg-gray-600 hover:bg-gray-500 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                      >
                        {t.details || "Details"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Summary */}
      {invites.length > 0 && (
        <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{invites.length}</p>
              <p className="text-sm">{t.totalInvites || "Total Invites"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {invites.filter(i => !i.used_at && !isExpired(i.expires_at)).length}
              </p>
              <p className="text-sm">{t.activeInvites || "Active Invites"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {invites.filter(i => i.used_at).length}
              </p>
              <p className="text-sm">{t.usedInvites || "Used Invites"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {invites.filter(i => canSeeDetails(i)).length}
              </p>
              <p className="text-sm">{t.yourInvites || "Your Invites"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Invite Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div 
            className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            } border`}
            onClick={(e) => e.stopPropagation()}
          >
            {!generatedToken ? (
              <>
                <h3 className="text-xl font-semibold mb-4">{t.createNewInvite || "Create New Invite"}</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    {t.expiresInDays || "Expires in (days)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newInvite.expiresInDays}
                    onChange={(e) => setNewInvite({ expiresInDays: parseInt(e.target.value) || 7 })}
                    className={`w-full px-3 py-2 rounded border ${
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white" 
                        : "bg-white border-gray-300 text-gray-800"
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {t.leaveEmptyForNoExpiry || "Leave blank for no expiration"}
                  </p>
                </div>
                
                <div className={`p-3 rounded mb-6 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                  <h4 className="font-medium mb-2">⚠️ {t.importantNote || "Important:"}</h4>
                  <ul className="text-sm space-y-1">
                    <li>• {t.inviteWarning1 || "Invite tokens are shown only once"}</li>
                    <li>• {t.inviteWarning2 || "Only you can see tokens you create"}</li>
                    <li>• {t.inviteWarning3 || "Other admins see only the hashed code"}</li>
                    <li>• {t.inviteWarning4 || "Copy and save the token immediately"}</li>
                  </ul>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setGeneratedToken(null);
                    }}
                    className={`px-4 py-2 rounded ${
                      isDarkMode 
                        ? "bg-gray-600 hover:bg-gray-500 text-white" 
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                  >
                    {t.cancel || "Cancel"}
                  </button>
                  <button
                    onClick={createInvite}
                    disabled={processing}
                    className={`px-4 py-2 rounded ${
                      isDarkMode
                        ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    } ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {processing ? t.creating || "Creating..." : t.createInvite || "Create Invite"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-4 text-green-600">
                  ✅ {t.inviteCreated || "Invite Created Successfully!"}
                </h3>
                
                <div className={`p-4 rounded mb-4 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                  <p className="font-medium mb-2">🔑 {t.yourInviteToken || "Your Invite Token:"}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <code className={`flex-1 px-3 py-2 rounded text-sm font-mono break-all ${
                      isDarkMode ? "bg-gray-800 text-yellow-300" : "bg-gray-200 text-gray-800"
                    }`}>
                      {generatedToken}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedToken!)}
                      className={`px-3 py-2 rounded ${
                        copySuccess
                          ? (isDarkMode ? "bg-green-700" : "bg-green-600")
                          : (isDarkMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-blue-600 hover:bg-blue-700")
                      } text-white`}
                    >
                      {copySuccess ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-sm text-red-500">
                    ⚠️ {t.tokenWarning || "This token will be shown only once! Save it now."}
                  </p>
                </div>
                
                <div className={`p-3 rounded mb-4 ${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  <h4 className="font-medium mb-2">📋 {t.howToUse || "How to use:"}</h4>
                  <ol className="text-sm list-decimal list-inside space-y-1">
                    <li>{t.step1 || "Share this token with the new admin user"}</li>
                    <li>{t.step2 || "They should use it during registration"}</li>
                    <li>{t.step3 || "Token grants immediate admin access"}</li>
                    <li>{t.step4 || "Token cannot be used more than once"}</li>
                  </ol>
                </div>
                
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setGeneratedToken(null);
                  }}
                  className={`w-full px-4 py-2 rounded ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  {t.close || "Close"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvites;