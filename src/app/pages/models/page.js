"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";


/**
 * Car Models Page (Admin Panel)
 * Features: Add, Edit, Delete, Search, Filter with Database Integration
 */
export default function CarModelsPage() {
  const statusOptions = [
    { label: "Active", value: true },
    { label: "Inactive", value: false },
  ];

  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allBrands, setAllBrands] = useState([]); // For filter options
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);

  // Server-side filters state
  const [filters, setFilters] = useState({
    brand: { value: [], matchMode: "in" },
    status: { value: null, matchMode: "equals" },
    search: { value: "", matchMode: "contains" }
  });

  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const toast = useRef(null);

  const [editName, setEditName] = useState("");
  const [editBrandId, setEditBrandId] = useState("");
  const [editStatus, setEditStatus] = useState(true);

  // Fetch models from API with server-side filtering and pagination
  const fetchModels = async (pageIndex = 0, pageSize = 10, currentFilters = filters) => {
    try {
      setLoading(true);
      const page = Math.floor(pageIndex / pageSize) + 1;
      let filterQuery = "";
      
      // Add brand filter
      if (currentFilters.brand && currentFilters.brand.value && currentFilters.brand.value.length > 0) {
        const selectedBrands = Array.isArray(currentFilters.brand.value)
          ? currentFilters.brand.value.join(",")
          : currentFilters.brand.value;
        filterQuery += `&brandId=${encodeURIComponent(selectedBrands)}`;
      }
      
      // Add status filter
      if (currentFilters.status && currentFilters.status.value !== null && currentFilters.status.value !== undefined) {
        filterQuery += `&active=${currentFilters.status.value}`;
      }
      
      // Add search filter
      if (currentFilters.search && currentFilters.search.value && currentFilters.search.value.trim()) {
        filterQuery += `&search=${encodeURIComponent(currentFilters.search.value.trim())}`;
      }

      const response = await fetch(`/api/v1/models?page=${page}&limit=${pageSize}${filterQuery}`);
      const data = await response.json();
      
      if (response.ok) {
        setModels(data.models || []);
        setTotalRecords(data.pagination?.totalCount || 0);
        setFirst(pageIndex);
        setRows(pageSize);
      } else {
        showToast('error', 'Error', data.message || 'Failed to fetch models');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      showToast('error', 'Error', 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  // Fetch brands from API
  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/v1/brands?limit=100&active=true');
      const data = await response.json();
      
      if (response.ok) {
        const brandOptions = data.brands.map(brand => ({
          label: brand.name,
          value: brand.id
        }));
        setBrands(brandOptions);
        setAllBrands(brandOptions); // For filter options
      } else {
        showToast('error', 'Error', data.message || 'Failed to fetch brands');
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      showToast('error', 'Error', 'Failed to fetch brands');
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
      await fetchBrands();
      await fetchModels(0, rows, filters);
    };
    loadData();
  }, []);

  // Pagination and filtering handlers
  const onLazyLoad = (event) => {
    fetchModels(event.first, event.rows, filters);
  };

  const onFilter = (newFilters) => {
    setFilters(newFilters);
    fetchModels(0, rows, newFilters);
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
      status: { value, matchMode: "equals" }
    };
    onFilter(newFilters);
  };

  // Handle brand filter change
  const handleBrandFilterChange = (value) => {
    const newFilters = {
      ...filters,
      brand: { value, matchMode: "in" }
    };
    onFilter(newFilters);
  };

  // Open sidebar for Edit
  const openEdit = (row) => {
    setEditing(row);
    setEditName(row.name);
    setEditBrandId(row.brandId);
    setEditStatus(row.active);
    setEditVisible(true);
  };

  // Open sidebar for Add
  const openAdd = () => {
    setEditing(null);
    setEditName("");
    setEditBrandId("");
    setEditStatus(true);
    setEditVisible(true);
  };

  // Save Edit or Add
  const saveEdit = async () => {
    if (!editName.trim() || !editBrandId) {
      showToast('warn', 'Warning', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: editName.trim(),
        brandId: editBrandId,
        active: editStatus
      };

      let response;
      if (editing) {
        // Update existing model
        response = await fetch(`/api/v1/models/${editing.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Add new model
        response = await fetch('/api/v1/models', {
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
        fetchModels(first, rows, filters); // Refresh the list
      } else {
        showToast('error', 'Error', data.message || 'Failed to save model');
      }
    } catch (error) {
      console.error('Error saving model:', error);
      showToast('error', 'Error', 'Failed to save model');
    } finally {
      setSaving(false);
    }
  };

  // Delete model
  const removeModel = async (row) => {
    if (confirm(`Delete model ${row.name}?`)) {
      try {
        const response = await fetch(`/api/v1/models/${row.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          showToast('success', 'Success', data.message);
          fetchModels(first, rows, filters); // Refresh the list
        } else {
          showToast('error', 'Error', data.message || 'Failed to delete model');
        }
      } catch (error) {
        console.error('Error deleting model:', error);
        showToast('error', 'Error', 'Failed to delete model');
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

  const brandBody = (row) => (
    <span>{row.brand?.name || 'N/A'}</span>
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
        onClick={() => removeModel(row)}
      />
    </div>
  );

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-semibold">Car Models</h1>
          <Button
            label="Add Model"
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
                placeholder="Search by model name..."
                style={{ minWidth: "15rem" }}
              />
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="brand-filter" className="font-semibold text-sm">Filter by Brand:</label>
            <MultiSelect
              id="brand-filter"
              options={allBrands}
              value={filters.brand?.value || []}
              onChange={(e) => handleBrandFilterChange(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Brands"
              display="chip"
              showClear
              style={{ minWidth: "20rem" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="status-filter" className="font-semibold text-sm">Filter by Status:</label>
            <Dropdown
              id="status-filter"
              value={filters.status?.value}
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
                fetchModels(first, rows, filters);
                fetchBrands();
              }}
              disabled={loading}
              tooltip="Refresh"
            />
          </div>
        </div>
      </div>

      {/* Models Table */}
      <DataTable
        value={models}
        lazy
        loading={loading}
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPage={onLazyLoad}
        paginator
        className="rounded-2xl shadow-1"
        tableStyle={{ minWidth: "40rem" }}
        emptyMessage="No models found."
      >
        <Column field="name" header="Model" sortable />
        <Column field="brand" header="Brand" body={brandBody} sortable />
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
        <h2 className="mb-4">{editing ? "Edit Model" : "Add Model"}</h2>
        <div className="p-fluid flex flex-col gap-4">
          <span className="p-float-label">
            <InputText
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={saving}
            />
            <label htmlFor="edit-name">Model Name *</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="edit-brand"
              value={editBrandId}
              options={brands}
              onChange={(e) => setEditBrandId(e.value)}
              placeholder="Select Brand"
              disabled={saving}
            />
            <label htmlFor="edit-brand">Brand *</label>
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
            <label htmlFor="edit-status">Status</label>
          </span>

          <div className="flex gap-2 mt-4">
            <Button
              label="Cancel"
              className="p-button-secondary"
              onClick={() => setEditVisible(false)}
              disabled={saving}
            />
            <Button
              label={editing ? "Save Changes" : "Add Model"}
              className="p-button-success"
              onClick={saveEdit}
              loading={saving}
              disabled={saving}
            />
          </div>
        </div>
      </Sidebar>
    </div>
  );
}
