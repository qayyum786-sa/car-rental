"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Paginator } from "primereact/paginator";
import { Card } from "primereact/card";

export default function ChecklistCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState(0); // index of first record in current page
  const [rows, setRows] = useState(5); // rows per page
  const [totalRecords, setTotalRecords] = useState(0);

  // Server-side filters state
  const [filters, setFilters] = useState({
    search: { value: "", matchMode: "contains" },
    status: { value: null, matchMode: "equals" }
  });

  const toast = useRef(null);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalItems: 0
  });

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
  ];

  const statusFilterOptions = [
    { label: "Active", value: true },
    { label: "Inactive", value: false },
  ];

  // Fetch categories for current page and rows per page with server-side filtering
  const fetchCategories = async (pageIndex = 0, pageSize = 5, currentFilters = filters, retryCount = 0) => {
    try {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      // page is 1-based in backend, calculate page number
      const page = Math.floor(pageIndex / pageSize) + 1;
      let filterQuery = "";
      
      // Add search filter
      if (currentFilters.search && currentFilters.search.value && currentFilters.search.value.trim()) {
        filterQuery += `&search=${encodeURIComponent(currentFilters.search.value.trim())}`;
      }
      
      // Add status filter
      if (currentFilters.status && currentFilters.status.value !== null && currentFilters.status.value !== undefined) {
        filterQuery += `&active=${currentFilters.status.value}`;
      }

      const response = await fetch(`/api/v1/checklistcategories?page=${page}&limit=${pageSize}${filterQuery}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (response.ok) {
        const formattedCategories = data.categories.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description || "No description",
          status: category.active ? "Active" : "Inactive",
          itemsCount: category.items ? category.items.length : 0,
        }));

        setCategories(formattedCategories);
        setTotalRecords(data.pagination.totalCount);
        setFirst(pageIndex);
        setRows(pageSize);
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to fetch checklist categories",
          life: 3000,
        });
      }
    } catch (error) {
      // Don't show error for aborted requests
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      // Retry logic for network errors
      if (retryCount < 2 && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.log(`Retrying request (attempt ${retryCount + 1})`);
        setTimeout(() => {
          fetchCategories(pageIndex, pageSize, currentFilters, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      console.error("Error fetching checklist categories:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Failed to fetch checklist categories",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/checklistcategories/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.stats.categories.total,
          active: data.stats.categories.active,
          inactive: data.stats.categories.inactive,
          totalItems: data.stats.items.total
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const createCategory = async (categoryData) => {
    try {
      const response = await fetch("/api/v1/checklistcategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryData.name,
          description: categoryData.description,
          active: categoryData.status === "Active",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Checklist category created successfully",
          life: 3000,
        });
        fetchCategories(first, rows, filters); // refresh current page
        fetchStats(); // refresh statistics
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to create checklist category",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error creating checklist category:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to create checklist category",
        life: 3000,
      });
      return false;
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const response = await fetch(`/api/v1/checklistcategories/stats?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryData.name,
          description: categoryData.description,
          active: categoryData.status === "Active",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Checklist category updated successfully",
          life: 3000,
        });
        fetchCategories(first, rows, filters); // refresh current page
        fetchStats(); // refresh statistics
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to update checklist category",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating checklist category:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update checklist category",
        life: 3000,
      });
      return false;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const response = await fetch(`/api/v1/checklistcategories/stats?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Checklist category deleted successfully",
          life: 3000,
        });
        fetchCategories(first, rows, filters); // refresh current page
        fetchStats(); // refresh statistics
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to delete checklist category",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error deleting checklist category:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to delete checklist category",
        life: 3000,
      });
      return false;
    }
  };

  // Column body templates
  const statusBody = (row) => (
    <Tag
      value={row.status}
      severity={row.status === "Active" ? "success" : "danger"}
      rounded
    />
  );

  const itemsCountBody = (row) => (
    <span className="text-sm text-gray-600">{row.itemsCount} items</span>
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
        onClick={() => removeCategory(row)}
      />
    </div>
  );

  // Pagination event handler
  const onPageChange = (event) => {
    // event.first = Index of first record
    // event.rows = Rows per page
    fetchCategories(event.first, event.rows, filters);
  };

  // Filter handlers
  const onFilter = (newFilters) => {
    setFilters(newFilters);
    fetchCategories(0, rows, newFilters);
  };

  // Handle search input change with debouncing
  const handleSearchChange = (value) => {
    // Update the filter state immediately for UI responsiveness
    const newFilters = {
      ...filters,
      search: { value, matchMode: "contains" }
    };
    setFilters(newFilters);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debouncing the API call
    searchTimeoutRef.current = setTimeout(() => {
      fetchCategories(0, rows, newFilters);
    }, 500); // 500ms delay
  };

  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    const newFilters = {
      ...filters,
      status: { value, matchMode: "equals" }
    };
    onFilter(newFilters);
  };

  useEffect(() => {
    fetchCategories(0, rows, filters);
    fetchStats();
    
    // Cleanup function to clear timeout and abort requests on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const openEdit = (row) => {
    setEditing(row);
    setEditName(row.name);
    setEditDescription(row.description === "No description" ? "" : row.description);
    setEditStatus(row.status);
    setEditVisible(true);
  };

  const openAdd = () => {
    setEditing(null);
    setEditName("");
    setEditDescription("");
    setEditStatus("Active");
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Warning",
        detail: "Category name is required",
        life: 3000,
      });
      return;
    }

    const categoryData = {
      name: editName.trim(),
      description: editDescription.trim(),
      status: editStatus,
    };

    let success = false;
    if (editing) {
      success = await updateCategory(editing.id, categoryData);
    } else {
      success = await createCategory(categoryData);
    }

    if (success) {
      setEditVisible(false);
      setEditing(null);
      setEditName("");
      setEditDescription("");
      setEditStatus("Active");
    }
  };

  const removeCategory = async (row) => {
    if (confirm(`Delete ${row.name}?`)) {
      await deleteCategory(row.id);
    }
  };

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-semibold">Checklist Categories</h1>
          <Button
            label="Add Category"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={openAdd}
            disabled={loading}
          />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Categories</div>
              </div>
              <i className="pi pi-list text-2xl text-blue-600"></i>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-gray-600">Active Categories</div>
              </div>
              <i className="pi pi-check-circle text-2xl text-green-600"></i>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                <div className="text-sm text-gray-600">Inactive Categories</div>
              </div>
              <i className="pi pi-times-circle text-2xl text-red-600"></i>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.totalItems}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <i className="pi pi-clipboard text-2xl text-orange-600"></i>
            </div>
          </Card>
        </div>

        {/* Server-side Filter Section */}
        <div className="flex flex-col lg:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col gap-2">
            <label htmlFor="search-filter" className="font-semibold text-sm">Search by Name/Description:</label>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                id="search-filter"
                value={filters.search?.value || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by category name or description..."
                style={{ minWidth: "15rem" }}
              />
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="status-filter" className="font-semibold text-sm">Filter by Status:</label>
            <Dropdown
              id="status-filter"
              value={filters.status?.value}
              options={statusFilterOptions}
              onChange={(e) => handleStatusFilterChange(e.value)}
              placeholder="All Status"
              showClear
              style={{ minWidth: "10rem" }}
            />
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <DataTable
        value={categories}
        loading={loading}
        className="rounded-2xl shadow-1"
        tableStyle={{ minWidth: "50rem" }}
        emptyMessage="No checklist categories found."
        stripedRows
      >
        <Column field="name" header="Category Name" sortable />
        <Column field="description" header="Description" sortable />
        <Column header="Items Count" body={itemsCountBody} />
        <Column field="status" header="Status" body={statusBody} sortable />
        <Column header="Actions" body={actionBody} style={{ width: "120px" }} />
      </DataTable>

      {/* Server-side Pagination */}
      <Paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        rowsPerPageOptions={[5, 10, 20, 50]}
        onPageChange={onPageChange}
        className="mt-4"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} categories"
      />

      {/* Add/Edit Sidebar */}
      <Sidebar
        visible={editVisible}
        position="right"
        onHide={() => setEditVisible(false)}
        style={{ width: "400px" }}
      >
        <h2 className="mb-4">{editing ? "Edit Category" : "Add Category"}</h2>
        <div className="p-fluid flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-name" className="font-semibold">Category Name *</label>
            <InputText
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter category name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-description" className="font-semibold">Description</label>
            <InputTextarea
              id="edit-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Enter category description"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-status" className="font-semibold">Status</label>
            <Dropdown
              id="edit-status"
              value={editStatus}
              options={statusOptions}
              onChange={(e) => setEditStatus(e.value)}
              placeholder="Select Status"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              label="Cancel"
              className="p-button-secondary flex-1"
              onClick={() => setEditVisible(false)}
            />
            <Button
              label={editing ? "Save Changes" : "Add Category"}
              className="p-button-success flex-1"
              onClick={saveEdit}
            />
          </div>
        </div>
      </Sidebar>
    </div>
  );
}