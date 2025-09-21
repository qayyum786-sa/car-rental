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
import { Paginator } from "primereact/paginator";

export default function CarBrandsPage() {
  const [brands, setBrands] = useState([]);
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
  const [editStatus, setEditStatus] = useState("");
  const [editLogo, setEditLogo] = useState("");

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
  ];

  const statusFilterOptions = [
    { label: "Active", value: true },
    { label: "Inactive", value: false },
  ];

  // Fetch brands for current page and rows per page with server-side filtering
  const fetchBrands = async (pageIndex = 0, pageSize = 5, currentFilters = filters, retryCount = 0) => {
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

      const response = await fetch(`/api/v1/brands?page=${page}&limit=${pageSize}${filterQuery}`, {
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
        const formattedBrands = data.brands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          status: brand.active ? "Active" : "Inactive",
          logo: brand.logo || "https://via.placeholder.com/100x50.png?text=Logo",
        }));

        setBrands(formattedBrands);
        setTotalRecords(data.pagination.totalCount);
        setFirst(pageIndex);
        setRows(pageSize);
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to fetch brands",
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
          fetchBrands(pageIndex, pageSize, currentFilters, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      console.error("Error fetching brands:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Failed to fetch brands",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const createBrand = async (brandData) => {
    try {
      const response = await fetch("/api/v1/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: brandData.name,
          logo: brandData.logo,
          active: brandData.status === "Active",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Brand created successfully",
          life: 3000,
        });
        fetchBrands(first, rows, filters); // refresh current page
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to create brand",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error creating brand:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to create brand",
        life: 3000,
      });
      return false;
    }
  };

  const updateBrand = async (id, brandData) => {
    try {
      const response = await fetch(`/api/v1/brands/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: brandData.name,
          logo: brandData.logo,
          active: brandData.status === "Active",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Brand updated successfully",
          life: 3000,
        });
        fetchBrands(first, rows, filters); // refresh current page
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to update brand",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating brand:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update brand",
        life: 3000,
      });
      return false;
    }
  };

  const deleteBrand = async (id) => {
    try {
      const response = await fetch(`/api/v1/brands/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Brand deleted successfully",
          life: 3000,
        });
        fetchBrands(first, rows, filters); // refresh current page
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to delete brand",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to delete brand",
        life: 3000,
      });
      return false;
    }
  };

  // Column body templates
  const logoBody = (row) => (
    <img
      src={row.logo}
      alt={row.name}
      style={{ width: "50px", height: "50px", objectFit: "contain" }}
    />
  );

  const statusBody = (row) => (
    <Tag
      value={row.status}
      severity={row.status === "Active" ? "success" : "danger"}
      rounded
    />
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
        onClick={() => removeBrand(row)}
      />
    </div>
  );

  // Pagination event handler
  const onPageChange = (event) => {
    // event.first = Index of first record
    // event.rows = Rows per page
    fetchBrands(event.first, event.rows, filters);
  };

  // Filter handlers
  const onFilter = (newFilters) => {
    setFilters(newFilters);
    fetchBrands(0, rows, newFilters);
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
      fetchBrands(0, rows, newFilters);
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
    fetchBrands(0, rows, filters);
    
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
    setEditStatus(row.status);
    setEditLogo(row.logo);
    setEditVisible(true);
  };

  const openAdd = () => {
    setEditing(null);
    setEditName("");
    setEditStatus("Active");
    setEditLogo("");
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Warning",
        detail: "Brand name is required",
        life: 3000,
      });
      return;
    }

    const brandData = {
      name: editName.trim(),
      status: editStatus,
      logo: editLogo || "https://via.placeholder.com/100x50.png?text=Logo",
    };

    let success = false;
    if (editing) {
      success = await updateBrand(editing.id, brandData);
    } else {
      success = await createBrand(brandData);
    }

    if (success) {
      setEditVisible(false);
      setEditing(null);
      setEditName("");
      setEditStatus("Active");
      setEditLogo("");
    }
  };

  const removeBrand = async (row) => {
    if (confirm(`Delete ${row.name}?`)) {
      await deleteBrand(row.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-semibold">Car Brands</h1>
          <Button
            label="Add Brand"
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
                placeholder="Search by brand name..."
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
              onClick={() => fetchBrands(first, rows, filters)}
              disabled={loading}
              tooltip="Refresh"
            />
          </div>
        </div>
      </div>

      <DataTable
        value={brands}
        loading={loading}
        paginator={false} // Disable built-in paginator, using external Paginator
        rows={rows}
        className="rounded-2xl shadow-1"
        tableStyle={{ minWidth: "40rem" }}
        emptyMessage="No brands found."
      >
        <Column header="Logo" body={logoBody} style={{ width: "100px" }} />
        <Column field="name" header="Brand" sortable />
        <Column field="status" header="Status" body={statusBody} sortable />
        <Column header="Action" body={actionBody} style={{ width: "120px" }} />
      </DataTable>

      <Paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        rowsPerPageOptions={[5, 10, 20]}
        className="mt-3"
      />

      <Sidebar
        visible={editVisible}
        position="right"
        onHide={() => setEditVisible(false)}
      >
        <h2 className="mb-4">{editing ? "Edit Brand" : "Add Brand"}</h2>
        <div className="p-fluid flex flex-col gap-3">
          <span className="p-float-label">
            <InputText
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <label htmlFor="edit-name">Name</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="edit-status"
              value={editStatus}
              options={statusOptions}
              onChange={(e) => setEditStatus(e.value)}
              placeholder="Select Status"
            />
            <label htmlFor="edit-status">Status</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="edit-logo"
              value={editLogo}
              onChange={(e) => setEditLogo(e.target.value)}
            />
            <label htmlFor="edit-logo">Logo URL</label>
          </span>

          <div className="flex gap-2 mt-3">
            <Button
              label="Cancel"
              className="p-button-secondary"
              onClick={() => setEditVisible(false)}
            />
            <Button
              label={editing ? "Save Changes" : "Add Brand"}
              className="p-button-success"
              onClick={saveEdit}
            />
          </div>
        </div>
      </Sidebar>

      <Toast ref={toast} />
    </div>
  );
}
