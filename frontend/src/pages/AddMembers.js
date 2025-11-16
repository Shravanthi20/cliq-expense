import React, { useState, useEffect } from "react";
import api, { userAPI, groupAPI } from "../config/api";

export default function AddMembers() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  // current user from storage
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (_) {
      return null;
    }
  })();
  const [members, setMembers] = useState([{ user_id: currentUser?.id || "", share: "" }]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // 🔍 search state

  // Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editGroupId, setEditGroupId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editMembers, setEditMembers] = useState([]);
  const [editIsCreator, setEditIsCreator] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups', { params: { mine: true } });
      setGroups(response.data);
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const addMember = () => {
    setMembers([...members, { user_id: "", share: "" }]);
  };

  const removeMember = (index) => {
    // Prevent removing the creator row (index 0)
    if (index === 0) return;
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure creator is included in members exactly once
      const creatorId = currentUser?.id;
      const normalized = members
        .filter((m) => m && m.user_id)
        .map((m) => ({ user_id: String(m.user_id), share: parseFloat(m.share) || 0 }));
      const hasCreator = normalized.some((m) => String(m.user_id) === String(creatorId));
      if (!hasCreator && creatorId) {
        normalized.unshift({ user_id: String(creatorId), share: 0 });
      }

      // Deduplicate by user_id
      const seen = new Set();
      const uniqueMembers = [];
      for (const m of normalized) {
        if (!seen.has(m.user_id)) {
          seen.add(m.user_id);
          uniqueMembers.push(m);
        }
      }

      await groupAPI.create({
        name,
        members: uniqueMembers,
      });

      alert("Group Created Successfully!");
      setName("");
      setMembers([{ user_id: creatorId || "", share: "" }]);
      fetchGroups();
    } catch (err) {
      console.error("Error creating group:", err);
      alert("Error creating group");
    } finally {
      setLoading(false);
    }
  };
  const getUserNameById = (id) => {
    const u = users.find((x) => String(x._id) === String(id));
    return u ? u.name : id;
  };

  const getDisplayedMemberCount = (g) => {
    const ids = new Set((g.members || []).map((m) => String(m.user_id)));
    const creatorId = String(g.created_by);
    ids.add(creatorId);
    return ids.size;
  };


  // --- Delete Group ---
  const deleteGroup = async (id) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      try {
        await groupAPI.delete(id);
        alert("Group deleted successfully!");
        fetchGroups();
      } catch (err) {
        console.error("Error deleting group:", err);
        alert("Failed to delete group");
      }
    }
  };

  // --- Open Edit Modal ---
  const openEditModal = (group) => {
    setEditGroupId(group._id);
    setEditName(group.name);
    setEditMembers(
      group.members.map((m) => ({
        user_id: m.user_id,
        share: m.share,
      }))
    );
    const isCreator = currentUser && String(group.created_by) === String(currentUser.id);
    setEditIsCreator(!!isCreator);
    setIsEditing(true);
  };

  // --- Handle Edit Changes ---
  const handleEditMemberChange = (index, field, value) => {
    const newMembers = [...editMembers];
    newMembers[index][field] = value;
    setEditMembers(newMembers);
  };

  const addEditMember = () => {
    setEditMembers([...editMembers, { user_id: "", share: "" }]);
  };

  const removeEditMember = (index) => {
    if (editMembers.length > 1) {
      setEditMembers(editMembers.filter((_, i) => i !== index));
    }
  };

  // --- Submit Edit ---
  const handleEditSubmit = async () => {
    try {
      await groupAPI.update(editGroupId, {
        name: editName,
        members: editMembers.map((m) => ({
          user_id: m.user_id,
          share: parseFloat(m.share) || 0,
        })),
      });
      alert("Group updated successfully!");
      setIsEditing(false);
      fetchGroups();
    } catch (err) {
      console.error("Error updating group:", err);
      alert("Failed to update group");
    }
  };

  const leaveGroup = async () => {
    try {
      await groupAPI.leave(editGroupId);
      alert("You left the group");
      setIsEditing(false);
      fetchGroups();
    } catch (err) {
      console.error("Error leaving group:", err);
      alert("Failed to leave group");
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h2>Create Group</h2>

      {/* Create Group Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>Group Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        {/* Creator is derived from token on the server */}

        <h3>Members</h3>
        {members.map((member, index) => (
          <div
            key={index}
            style={{
              marginBottom: "10px",
              padding: "10px",
              border: "1px solid #ccc",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              <label>Member:</label>
              {index === 0 ? (
                <input
                  type="text"
                  value={`Creator: ${getUserNameById(currentUser?.id) || 'You'}`}
                  disabled
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              ) : (
                <select
                  value={member.user_id}
                  onChange={(e) =>
                    handleMemberChange(index, "user_id", e.target.value)
                  }
                  required
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                >
                  <option value="">Select Member</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>Share:</label>
              <input
                type="number"
                step="0.01"
                value={member.share}
                onChange={(e) =>
                  handleMemberChange(index, "share", e.target.value)
                }
                required
                style={{ width: "100%", padding: "8px", marginTop: "5px" }}
              />
            </div>

            {members.length > 1 && index !== 0 && (
              <button
                type="button"
                onClick={() => removeMember(index)}
                style={{ backgroundColor: "#ff4444", color: "white" }}
              >
                Remove Member
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addMember}
          style={{
            marginRight: "10px",
            backgroundColor: "#4CAF50",
            color: "white",
          }}
        >
          Add Member
        </button>

        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: "#2196F3", color: "white" }}
        >
          {loading ? "Creating..." : "Create Group"}
        </button>
      </form>

      {/* Group List */}
      <h3 style={{ marginTop: "30px" }}>Existing Groups</h3>

      {/* 🔍 Search Bar */}
      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
      </div>

      {groups.length === 0 ? (
        <p>No groups yet.</p>
      ) : (
        <ul>
            {groups
            .filter((g) =>
              g.name.toLowerCase().includes(search.toLowerCase())
            )
            .slice(0, search ? groups.length : 3) // show 3 by default, all when searching
            .map((g) => (
              <li key={g._id} style={{ marginBottom: "8px" }}>
                {g.name} ({getDisplayedMemberCount(g)} members)
                <span style={{ marginLeft: 8, color: "#666" }}>
                  • Created by: {getUserNameById(g.created_by)}
                </span>
                <button
                  onClick={() => openEditModal(g)}
                  style={{
                    marginLeft: "10px",
                    background: "#ffa500",
                    color: "white",
                  }}
                >
                  Manage Members
                </button>
                  {currentUser && String(g.created_by) === String(currentUser.id) && (
                    <button
                      onClick={() => deleteGroup(g._id)}
                      style={{
                        marginLeft: "10px",
                        background: "#ff4444",
                        color: "white",
                      }}
                    >
                      Delete
                    </button>
                  )}
              </li>
            ))}
        </ul>
      )}

      {/* 🧭 Info Message */}
      {!search && groups.length > 3 && (
        <p style={{ color: "gray", fontSize: "0.9em", marginTop: "10px" }}>
          Showing 3 most recent groups...
        </p>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3>Edit Group</h3>
            <div style={{ color: "#666", marginBottom: "10px" }}>
              Created by: {getUserNameById(editIsCreator ? currentUser?.id : (editGroupId && (groups.find((gr) => gr._id === editGroupId)?.created_by)))}
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label>Group Name:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={!editIsCreator}
                style={{ width: "100%", padding: "8px", marginTop: "5px" }}
              />
            </div>

            <h4>Members</h4>
            {editMembers.map((member, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <label>Member:</label>
                  <select
                    value={member.user_id}
                    onChange={(e) =>
                      handleEditMemberChange(index, "user_id", e.target.value)
                    }
                    required
                    disabled={!editIsCreator}
                    style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                  >
                    <option value="">Select Member</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label>Share:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={member.share}
                    onChange={(e) =>
                      handleEditMemberChange(index, "share", e.target.value)
                    }
                    disabled={!editIsCreator}
                    style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                  />
                </div>

                {editIsCreator && editMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEditMember(index)}
                    style={{ backgroundColor: "#ff4444", color: "white" }}
                  >
                    Remove Member
                  </button>
                )}
              </div>
            ))}

            <div
              style={{
                marginTop: "15px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              {editIsCreator ? (
                <>
                  <button
                    type="button"
                    onClick={addEditMember}
                    style={{ backgroundColor: "#4CAF50", color: "white" }}
                  >
                    Add Member
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    style={{ backgroundColor: "#2196F3", color: "white" }}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={leaveGroup}
                  style={{ backgroundColor: "#ff4444", color: "white" }}
                >
                  Leave Group
                </button>
              )}
              <button
                onClick={() => setIsEditing(false)}
                style={{ backgroundColor: "#aaa", color: "white" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


