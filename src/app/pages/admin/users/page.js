"use client";
import React, { useEffect, useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

function renderAction(role, user, onEdit) {
  const normalized = (role || '').toString().toUpperCase();
  if (normalized === 'ADMIN') {
    return (
      <Button
        label="Edit"
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        aria-label="Edit"
        onClick={() => onEdit(user)}
        className="p-button-sm"
      />
    );
  }
  return null;
}

export default function UsersPage() {
  // ✅ users state
  const [users, setUsers] = useState([]);

  const [visibleRight, setVisibleRight] = useState(false);

  // form states (Add User)
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);

  // edit states
  const [editVisible, setEditVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState(null);

  const roleOptions = [
    { label: "MECHANIC", value: "MECHANIC" },
    { label: "DRIVER", value: "DRIVER" },
    { label: "ADMIN", value: "ADMIN" },
    { label: "PROVIDER", value: "PROVIDER" },
    { label: "CUSTOMER", value: "CUSTOMER" },
  ];

  const handleSubmit = async () => {
    if (!name || !username || !role || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          password,
          role_id: role,
          is_active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || "Failed to create user");
        return;
      }

      const created = data.user; // { id, name, username, role_id, ... }
      setUsers((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          username: created.username,
          role: created.role_id,
        },
      ]);

      // reset form + close sidebar
      setName("");
      setUsername("");
      setPassword("");
      setRole(null);
      setVisibleRight(false);
    } catch (err) {
      console.error(err);
      alert("Network error while creating user");
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditVisible(true);
  };

  const saveEdit = () => {
    if (!editingUser) return;
    if (!editName || !editUsername || !editRole) {
      alert("Please fill all fields");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? { ...u, name: editName, username: editUsername, role: editRole }
          : u
      )
    );

    setEditVisible(false);
    setEditingUser(null);
  };

  const cancelEdit = () => {
    setEditVisible(false);
    setEditingUser(null);
  };

  // Load users on mount from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/v1/users');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load users');
        const rows = (data.users || []).map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role_id,
        }));
        setUsers(rows);
      } catch (e) {
        console.error(e);
      }
    };
    loadUsers();
  }, []);

  // Index column template (S.No)
  const indexBodyTemplate = (rowData, options) => options.rowIndex + 1;

  // Action column template for DataTable
  const actionBodyTemplate = (rowData) => {
    return renderAction(rowData.role, rowData, openEdit);
  };

  return (
    <div style={{ padding: "2rem", position: "relative" }}>
      {/* Add User Button */}
      <Button
        label="Add User"
        onClick={() => setVisibleRight(true)}
        className="p-button-success"
        style={{
          position: "absolute",
          top: "4px",
          
          right: "2rem",
          fontWeight: "bold",
          fontSize: "16px",
          borderRadius: "25px",
        }}
      />

      {/* Sidebar with Add User Form */}
      <Sidebar
        visible={visibleRight}
        position="right"
        onHide={() => setVisibleRight(false)}
      >
        <h2 className="mb-4">Add User</h2>

        <div className="p-fluid flex flex-column gap-3">
          <span className="p-float-label">
            <InputText
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label htmlFor="name">Name</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label htmlFor="username">Username</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="password">Password</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="role"
              value={role}
              options={roleOptions}
              onChange={(e) => setRole(e.value)}
              placeholder="Select Role"
            />
            <label htmlFor="role">Role</label>
          </span>

          <Button
            label="Save User"
            onClick={handleSubmit}
            className="p-button-success mt-3"
          />
        </div>
      </Sidebar>

      {/* Edit User Sidebar */}
      <Sidebar
        visible={editVisible}
        position="right"
        onHide={cancelEdit}
      >
        <h2 className="mb-4">Edit User</h2>
        <div className="p-fluid flex flex-column gap-3">
          <span className="p-float-label">
            <InputText
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <label htmlFor="edit-name">Name</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="edit-username"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
            />
            <label htmlFor="edit-username">Username</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="edit-role"
              value={editRole}
              options={roleOptions}
              onChange={(e) => setEditRole(e.value)}
              placeholder="Select Role"
            />
            <label htmlFor="edit-role">Role</label>
          </span>

          <div className="flex gap-2 mt-3">
            <Button label="Cancel" className="p-button-secondary" onClick={cancelEdit} />
            <Button label="Save Changes" className="p-button-success" onClick={saveEdit} />
          </div>
        </div>
      </Sidebar>

      <h1>Users</h1>
      
      {/* PrimeReact DataTable replacing the HTML table */}
      <DataTable value={users} tableStyle={{ minWidth: '50rem' }}>
        <Column header="S.No" body={indexBodyTemplate} style={{ width: '6rem' }}></Column>
        <Column field="name" header="Name"></Column>
        <Column field="username" header="Username"></Column>
        <Column field="role" header="Role"></Column>
        <Column header="Action" body={actionBodyTemplate}></Column>
      </DataTable>
    </div>
  );
}
