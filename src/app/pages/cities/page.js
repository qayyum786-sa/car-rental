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

export default function CitiesPage() {
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState(0); // index of first record in current page
  const [rows, setRows] = useState(5); // rows per page
  const [totalRecords, setTotalRecords] = useState(0);

  // Server-side filters state
  const [filters, setFilters] = useState({
    search: { value: "", matchMode: "contains" },
    status: { value: null, matchMode: "equals" },
    state: { value: null, matchMode: "equals" }
  });

  const toast = useRef(null);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const [editName, setEditName] = useState("");
  const [editStateId, setEditStateId] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
  ];

  const statusFilterOptions = [
    { label: "Active", value: true },
    { label: "Inactive", value: false },
  ];

  // Fetch states for dropdown
  const fetchStates = async () => {
    try {
      const response = await fetch('/api/v1/states?limit=100&active=true', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const stateOptions = data.states.map(state => ({
          label: state.name,
          value: state.id,
          code: state.code
        }));
        setStates(stateOptions);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  // Fetch cities for current page and rows per page with server-side filtering
  const fetchCities = async (pageIndex = 0, pageSize = 5, currentFilters = filters, retryCount = 0) => {
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

      // Add state filter
      if (currentFilters.state && currentFilters.state.value) {
        filterQuery += `&stateId=${currentFilters.state.value}`;
      }

      const response = await fetch(`/api/v1/cities?page=${page}&limit=${pageSize}&includeState=true${filterQuery}`, {
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
        const formattedCities = data.cities.map((city) => ({
          id: city.id,
          name: city.name,
          stateName: city.state?.name || 'Unknown',
          stateCode: city.state?.code || '',
          stateId: city.stateId,
          pincode: city.pincode || '',
          status: city.active ? "Active" : "Inactive",
        }));

        setCities(formattedCities);
        setTotalRecords(data.pagination.totalCount);
        setFirst(pageIndex);
        setRows(pageSize);
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to fetch cities",
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
          fetchCities(pageIndex, pageSize, currentFilters, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      console.error("Error fetching cities:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Failed to fetch cities",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const createCity = async (cityData) => {
    try {
      const response = await fetch("/api/v1/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cityData.name,
          stateId: cityData.stateId,
          pincode: cityData.pincode || null,
          active: cityData.status === "Active",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "City created successfully",
          life: 3000,
        });
        fetchCities(first, rows, filters); // refresh current page
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to create city",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error creating city:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to create city",
        life: 3000,
      });
      return false;
    }
  };

  const updateCity = async (id, cityData) => {
    try {
      const response = await fetch(`/api/v1/cities/stats?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cityData.name,
          stateId: cityData.stateId,
          pincode: cityData.pincode || null,
          active: cityData.status === "Active",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "City updated successfully",
          life: 3000,
        });
        fetchCities(first, rows, filters); // refresh current page
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to update city",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating city:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update city",
        life: 3000,
      });
      return false;
    }
  };

  const deleteCity = async (id) => {
    try {
      const response = await fetch(`/api/v1/cities/stats?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "City deleted successfully",
          life: 3000,
        });
        fetchCities(first, rows, filters); // refresh current page
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to delete city",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error deleting city:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to delete city",
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

  const stateBody = (row) => (
    <div>
      <div className="font-semibold">{row.stateName}</div>
      {row.stateCode && <div className="text-sm text-gray-500">({row.stateCode})</div>}
    </div>
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
        onClick={() => removeCity(row)}
      />
    </div>
  );

  // Pagination event handler
  const onPageChange = (event) => {
    // event.first = Index of first record
    // event.rows = Rows per page
    fetchCities(event.first, event.rows, filters);
  };

  // Filter handlers
  const onFilter = (newFilters) => {
    setFilters(newFilters);
    fetchCities(0, rows, newFilters);
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
      fetchCities(0, rows, newFilters);
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

  // Handle state filter change
  const handleStateFilterChange = (value) => {
    const newFilters = {
      ...filters,
      state: { value, matchMode: "equals" }
    };
    onFilter(newFilters);
  };

  useEffect(() => {
    fetchStates();
    fetchCities(0, rows, filters);
    
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
    setEditStateId(row.stateId);
    setEditPincode(row.pincode);
    setEditStatus(row.status);
    setEditVisible(true);
  };

  const openAdd = () => {
    setEditing(null);
    setEditName("");
    setEditStateId("");
    setEditPincode("");
    setEditStatus("Active");
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Warning",
        detail: "City name is required",
        life: 3000,
      });
      return;
    }

    if (!editStateId) {
      toast.current?.show({
        severity: "warn",
        summary: "Warning",
        detail: "State is required",
        life: 3000,
      });
      return;
    }

    const cityData = {
      name: editName.trim(),
      stateId: editStateId,
      pincode: editPincode.trim(),
      status: editStatus,
    };

    let success = false;
    if (editing) {
      success = await updateCity(editing.id, cityData);
    } else {
      success = await createCity(cityData);
    }

    if (success) {
      setEditVisible(false);
      setEditing(null);
      setEditName("");
      setEditStateId("");
      setEditPincode("");
      setEditStatus("Active");
    }
  };

  const removeCity = async (row) => {
    if (confirm(`Delete ${row.name}?`)) {
      await deleteCity(row.id);
    }
  };

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-semibold">Cities</h1>
          <Button
            label="Add City"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={openAdd}
            disabled={loading}
          />
        </div>

        {/* Server-side Filter Section */}
        <div className="flex flex-col lg:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col gap-2">
            <label htmlFor="search-filter" className="font-semibold text-sm">Search by Name/Pincode:</label>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                id="search-filter"
                value={filters.search?.value || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by city name or pincode..."
                style={{ minWidth: "15rem" }}
              />
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="state-filter" className="font-semibold text-sm">Filter by State:</label>
            <Dropdown
              id="state-filter"
              value={filters.state?.value}
              options={states}
              onChange={(e) => handleStateFilterChange(e.value)}
              placeholder="All States"
              showClear
              style={{ minWidth: "12rem" }}
            />
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

      {/* Cities Table */}
      <DataTable
        value={cities}
        loading={loading}
        className="rounded-2xl shadow-1"
        tableStyle={{ minWidth: "50rem" }}
        emptyMessage="No cities found."
        stripedRows
      >
        <Column field="name" header="City Name" sortable />
        <Column field="stateName" header="State" body={stateBody} sortable />
        <Column field="pincode" header="Pincode" sortable />
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
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} cities"
      />

      {/* Add/Edit Sidebar */}
      <Sidebar
        visible={editVisible}
        position="right"
        onHide={() => setEditVisible(false)}
        style={{ width: "400px" }}
      >
        <h2 className="mb-4">{editing ? "Edit City" : "Add City"}</h2>
        <div className="p-fluid flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-name" className="font-semibold">City Name *</label>
            <InputText
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter city name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-state" className="font-semibold">State *</label>
            <Dropdown
              id="edit-state"
              value={editStateId}
              options={states}
              onChange={(e) => setEditStateId(e.value)}
              placeholder="Select State"
              filter
              showClear
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-pincode" className="font-semibold">Pincode</label>
            <InputText
              id="edit-pincode"
              value={editPincode}
              onChange={(e) => setEditPincode(e.target.value)}
              placeholder="Enter pincode (optional)"
              maxLength={10}
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
              label={editing ? "Save Changes" : "Add City"}
              className="p-button-success flex-1"
              onClick={saveEdit}
            />
          </div>
        </div>
      </Sidebar>
    </div>
  );
}