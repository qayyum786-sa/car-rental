"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";

/**
 * Car Variants Page (Admin Panel)
 * Features: Add, Edit, Delete, Search, Filter with Database Integration
 */
export default function CarVariantsPage() {
  const statusOptions = [
    { label: "Active", value: true },
    { label: "Inactive", value: false },
  ];

  const [variants, setVariants] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);

  // Server-side filters state
  const [filters, setFilters] = useState({
    modelId: { value: null, matchMode: "equals" },
    active: { value: null, matchMode: "equals" },
    search: { value: "", matchMode: "contains" }
  });

  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const toast = useRef(null);

  const [editName, setEditName] = useState("");
  const [editModelId, setEditModelId] = useState("");
  const [editStatus, setEditStatus] = useState(true);



  // Fetch variants from API with server-side filtering and pagination
  const fetchVariants = async (pageIndex = 0, pageSize = 10, currentFilters = filters) => {
    try {
      setLoading(true);
      const page = Math.floor(pageIndex / pageSize) + 1;
      let filterQuery = "";
      
      // Add model filter
      if (currentFilters.modelId && currentFilters.modelId.value) {
        filterQuery += `&modelId=${encodeURIComponent(currentFilters.modelId.value)}`;
      }
      
      // Add status filter
      if (currentFilters.active && currentFilters.active.value !== null && currentFilters.active.value !== undefined) {
        filterQuery += `&active=${currentFilters.active.value}`;
      }
      
      // Add search filter
      if (currentFilters.search && currentFilters.search.value && currentFilters.search.value.trim()) {
        filterQuery += `&search=${encodeURIComponent(currentFilters.search.value.trim())}`;
      }

      const response = await fetch(`/api/v1/variants?page=${page}&limit=${pageSize}${filterQuery}`);
      const data = await response.json();
      
      if (response.ok) {
        setVariants(data.variants || []);
        setTotalRecords(data.pagination?.totalCount || 0);
        setFirst(pageIndex);
        setRows(pageSize);
      } else {
        showToast('error', 'Error', data.message || 'Failed to fetch variants');
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      showToast('error', 'Error', 'Failed to fetch variants');
    } finally {
      setLoading(false);
    }
  };

  // Fetch models from API
  const fetchModels = async () => {
    try {
      const response = await fetch('/api/v1/models?limit=100&active=true');
      const data = await response.json();
      
      if (response.ok) {
        const modelOptions = data.models.map(model => ({
          label: `${model.brand?.name} ${model.name}`,
          value: model.id
        }));
        setModels(modelOptions);
      } else {
        showToast('error', 'Error', data.message || 'Failed to fetch models');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      showToast('error', 'Error', 'Failed to fetch models');
    }
  };

  // Show toast message
  const showToast = (severity, summary, detail) => {
    if (toast.current) {
      toast.current.show({ severity, summary, detail });
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchModels();
      await fetchVariants(0, rows, filters);
    };
    loadData();
  }, []);

  // Pagination and filtering handlers
  const onLazyLoad = (event) => {
    fetchVariants(event.first, event.rows, filters);
  };

  const onFilter = (newFilters) => {
    setFilters(newFilters);
    fetchVariants(0, rows, newFilters);
  };

  // Handle search input change
  const handleSearchChange = (value) => {
    const newFilters = {
      ...filters,
      search: { value, matchMode: "contains" }
    };
    onFilter(newFilters);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    const newFilters = {
      ...filters,
      active: { value, matchMode: "equals" }
    };
    onFilter(newFilters);
  };

  // Handle model filter change
  const handleModelFilterChange = (value) => {
    const newFilters = {
      ...filters,
      modelId: { value, matchMode: "equals" }
    };
    onFilter(newFilters);
  };

  // Open sidebar for Edit
  const openEdit = (row) => {
    setEditing(row);
    setEditName(row.name);
    setEditModelId(row.modelId);
    setEditStatus(row.active);
    setEditVisible(true);
  };

  // Open sidebar for Add
  const openAdd = () => {
    setEditing(null);
    setEditName("");
    setEditModelId("");
    setEditStatus(true);
    setEditVisible(true);
  };

  // Save Edit or Add
  const saveEdit = async () => {
    if (!editName.trim() || !editModelId) {
      showToast('warn', 'Warning', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: editName.trim(),
        modelId: editModelId,
        active: editStatus
      };

      let response;
      if (editing) {
        // Update existing variant
        response = await fetch(`/api/v1/variants/${editing.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Add new variant
        response = await fetch('/api/v1/variants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (response.ok) {
        showToast('success', 'Success', data.message);
        setEditVisible(false);
        setEditing(null);
        fetchVariants(first, rows, filters); // Refresh the list
      } else {
        showToast('error', 'Error', data.message || 'Failed to save variant');
      }
    } catch (error) {
      console.error('Error saving variant:', error);
      showToast('error', 'Error', 'Failed to save variant');
    } finally {
      setSaving(false);
    }
  };

  // Delete variant
  const removeVariant = async (row) => {
    if (confirm(`Delete variant ${row.name}?`)) {
      try {
        const response = await fetch(`/api/v1/variants/${row.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          showToast('success', 'Success', data.message);
          fetchVariants(first, rows, filters); // Refresh the list
        } else {
          showToast('error', 'Error', data.message || 'Failed to delete variant');
        }
      } catch (error) {
        console.error('Error deleting variant:', error);
        showToast('error', 'Error', 'Failed to delete variant');
      }
    }
  };

  // Table custom cells
  const statusBody = (row) => (
    <Tag
      value={row.active ? "Active" : "Inactive"}
      severity={row.active ? "success" : "danger"}
      rounded
    />
  );

  const modelBody = (row) => (
    <span>{row.model?.brand?.name} {row.model?.name}</span>
  );

  const actionBody = (row) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        aria-label="Edit"
        className="p-button-sm"
        onClick={() => openEdit(row)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        aria-label="Delete"
        className="p-button-sm"
        onClick={() => removeVariant(row)}
      />
    </div>
  );

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-semibold">Car Variants</h1>
          <Button
            label="Add Variant"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={openAdd}
            disabled={loading}
          />
        </div>

        {/* Server-side Filter Section */}
        <div className="flex flex-col lg:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col gap-2">
            <label htmlFor="search-filter" className="font-semibold text-sm">Search by Name:</label>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                id="search-filter"
                value={filters.search?.value || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by variant name..."
                style={{ minWidth: "15rem" }}
              />
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="model-filter" className="font-semibold text-sm">Filter by Model:</label>
            <Dropdown
              id="model-filter"
              options={models}
              value={filters.modelId?.value}
              onChange={(e) => handleModelFilterChange(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Model"
              showClear
              style={{ minWidth: "20rem" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="status-filter" className="font-semibold text-sm">Filter by Status:</label>
            <Dropdown
              id="status-filter"
              value={filters.active?.value}
              options={statusOptions}
              onChange={(e) => handleStatusFilterChange(e.value)}
              placeholder="Filter by Status"
              showClear
              style={{ minWidth: "12rem" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm">&nbsp;</label>
            <Button
              icon="pi pi-refresh"
              className="p-button-outlined"
              onClick={() => {
                fetchVariants(first, rows, filters);
                fetchModels();
              }}
              disabled={loading}
              tooltip="Refresh"
            />
          </div>
        </div>
      </div>

      {/* Variants Table */}
      <DataTable
        value={variants}
        lazy
        loading={loading}
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPage={onLazyLoad}
        paginator
        className="rounded-2xl shadow-1"
        tableStyle={{ minWidth: "60rem" }}
        emptyMessage="No variants found."
      >
        <Column field="name" header="Variant" sortable />
        <Column field="model" header="Model" body={modelBody} sortable />
        <Column field="active" header="Status" body={statusBody} sortable />
        <Column header="Action" body={actionBody} style={{ width: "120px" }} />
      </DataTable>

      {/* Add/Edit Sidebar */}
      <Sidebar
        visible={editVisible}
        position="right"
        onHide={() => setEditVisible(false)}
        style={{ width: '400px' }}
      >
        <h2 className="mb-4">{editing ? "Edit Variant" : "Add Variant"}</h2>
        <div className="p-fluid flex flex-col gap-4">
          <span className="p-float-label">
            <InputText
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={saving}
            />
            <label htmlFor="edit-name">Variant Name *</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="edit-model"
              value={editModelId}
              options={models}
              onChange={(e) => setEditModelId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Model"
              disabled={saving}
            />
            <label htmlFor="edit-model">Model *</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="edit-status"
              value={editStatus}
              options={statusOptions}
              onChange={(e) => setEditStatus(e.value)}
              placeholder="Select Status"
              disabled={saving}
            />
            <label htmlFor="edit-status">Status *</label>
          </span>

          <div className="flex gap-2 mt-3">
            <Button
              label="Cancel"
              className="p-button-secondary"
              onClick={() => setEditVisible(false)}
              disabled={saving}
            />
            <Button
              label={editing ? "Save Changes" : "Add Variant"}
              className="p-button-success"
              onClick={saveEdit}
              loading={saving}
            />
          </div>
        </div>
      </Sidebar>
    </div>
  );
}
