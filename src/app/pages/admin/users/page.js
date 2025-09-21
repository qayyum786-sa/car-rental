"use client";
import React, { useEffect, useState, useRef } from "react";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";

function renderAction(role, user, onEdit) {
  const normalized = (role || "").toString().toUpperCase();
  if (normalized === "ADMIN") {
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters state with only one filter on role supporting multiple selections
  const [filters, setFilters] = useState({
    role: { value: [], matchMode: "in" }
  });

  const toast = useRef(null);

  const [visibleRight, setVisibleRight] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);

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

  // Fetch users with pagination and server-side filtering on role (multi-select)
  const fetchUsers = async (pageIndex = 0, pageSize = 5, currentFilters = filters) => {
    setLoading(true);
    try {
      const page = Math.floor(pageIndex / pageSize) + 1;
      let filterQuery = "";
      if (currentFilters.role && currentFilters.role.value && currentFilters.role.value.length > 0) {
        const selectedRoles = Array.isArray(currentFilters.role.value)
          ? currentFilters.role.value.join(",")
          : currentFilters.role.value;
        filterQuery += `&role_id=${encodeURIComponent(selectedRoles)}`;
      }

      const res = await fetch(`/api/v1/users?page=${page}&limit=${pageSize}${filterQuery}`);
      const data = await res.json();

      if (res.ok) {
        const rows = (data.users || []).map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role_id,
        }));
        setUsers(rows);
        setTotalRecords(data.pagination?.totalCount || 0);
        setFirst(pageIndex);
        setRows(pageSize);
      } else {
        alert(data?.message || "Failed to load users");
      }
    } catch (e) {
      console.error(e);
      alert("Error loading users");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers(0, rows, filters);
  }, []);

  const onLazyLoad = (event) => {
    fetchUsers(event.first, event.rows, filters);
  };

  const onFilter = (event) => {
    setFilters(event.filters);
    fetchUsers(0, rows, event.filters);
  };

  const handleSubmit = async () => {
    if (!name || !username || !role || !password) {
      toast.current.show({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all fields',
        life: 3000
      });
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
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: data?.message || "Failed to create user",
          life: 3000
        });
        return;
      }
      
      toast.current.show({
        severity: 'success',
        summary: 'Success',
        detail: 'User created successfully',
        life: 3000
      });
      
      fetchUsers(first, rows, filters);

      setName("");
      setUsername("");
      setPassword("");
      setRole(null);
      setVisibleRight(false);
    } catch (err) {
      console.error(err);
      toast.current.show({
        severity: 'error',
        summary: 'Network Error',
        detail: 'Network error while creating user',
        life: 3000
      });
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

    setUsers(prev =>
      prev.map(u =>
        u.id === editingUser.id ? { ...u, name: editName, username: editUsername, role: editRole } : u
      )
    );

    setEditVisible(false);
    setEditingUser(null);
  };

  const cancelEdit = () => {
    setEditVisible(false);
    setEditingUser(null);
  };

  const actionBodyTemplate = (rowData) => renderAction(rowData.role, rowData, openEdit);

  return (
    <div style={{ padding: "2rem", position: "relative" }}>
      <Toast ref={toast} />
      
      {/* Filter Section */}
      <div className="flex justify-content-between align-items-center mb-4" style={{ marginTop: "1rem" }}>
        <div className="flex align-items-center gap-3">
          <label htmlFor="role-filter" className="font-semibold">Filter by Role:</label>
          <MultiSelect
            id="role-filter"
            options={roleOptions}
            value={filters.role?.value || []}
            onChange={(e) => onFilter({ filters: { role: { value: e.value, matchMode: "in" } } })}
            optionLabel="label"
            optionValue="value"
            placeholder="Select Roles"
            display="chip"
            showClear
            style={{ minWidth: "20rem" }}
          />
        </div>
        <Button
          label="Add User"
          onClick={() => setVisibleRight(true)}
          className="p-button-success"
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            borderRadius: "25px",
          }}
        />
      </div>

      <Sidebar visible={visibleRight} position="right" onHide={() => setVisibleRight(false)}>
        <h2 className="mb-4">Add User</h2>
        <div className="p-fluid flex flex-column gap-3">
          <span className="p-float-label">
            <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} />
            <label htmlFor="name">Name</label>
          </span>
          <span className="p-float-label">
            <InputText id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <label htmlFor="username">Username</label>
          </span>
          <span className="p-float-label">
            <InputText id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <label htmlFor="password">Password</label>
          </span>
          <span className="p-float-label">
            <Dropdown id="role" value={role} options={roleOptions} onChange={(e) => setRole(e.value)} placeholder="Select Role" />
            <label htmlFor="role">Role</label>
          </span>
          <Button label="Save User" onClick={handleSubmit} className="p-button-success mt-3" />
        </div>
      </Sidebar>

      <Sidebar visible={editVisible} position="right" onHide={cancelEdit}>
        <h2 className="mb-4">Edit User</h2>
        <div className="p-fluid flex flex-column gap-3">
          <span className="p-float-label">
            <InputText id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <label htmlFor="edit-name">Name</label>
          </span>
          <span className="p-float-label">
            <InputText id="edit-username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
            <label htmlFor="edit-username">Username</label>
          </span>
          <span className="p-float-label">
            <Dropdown id="edit-role" value={editRole} options={roleOptions} onChange={(e) => setEditRole(e.value)} placeholder="Select Role" />
            <label htmlFor="edit-role">Role</label>
          </span>
          <div className="flex gap-2 mt-3">
            <Button label="Cancel" className="p-button-secondary" onClick={cancelEdit} />
            <Button label="Save Changes" className="p-button-success" onClick={saveEdit} />
          </div>
        </div>
      </Sidebar>

      <h1>Users</h1>

      <DataTable
        value={users}
        lazy
        loading={loading}
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPage={onLazyLoad}
        paginator
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column field="name" header="Name" />
        <Column field="username" header="Username" />
        <Column field="role" header="Role" />
        <Column header="Action" body={actionBodyTemplate} />
      </DataTable>
    </div>
  );
}
