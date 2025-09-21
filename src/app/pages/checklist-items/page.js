"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Toast } from "primereact/toast";
import { InputSwitch } from "primereact/inputswitch";
import { Paginator } from "primereact/paginator";

export default function ChecklistItemsPage() {
  const toast = useRef(null);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Pagination and data states
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState(0); // index of first record in current page
  const [rows, setRows] = useState(10); // rows per page
  const [totalRecords, setTotalRecords] = useState(0);

  // Categories state
  const [categories, setCategories] = useState([]);

  // Server-side filters state
  const [filters, setFilters] = useState({
    search: { value: "", matchMode: "contains" },
    active: { value: null, matchMode: "equals" },
    categoryId: { value: null, matchMode: "equals" },
    checkType: { value: null, matchMode: "equals" },
    required: { value: null, matchMode: "equals" }
  });

  // Form states
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form fields
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [checkType, setCheckType] = useState("VISUAL");
  const [isRequired, setIsRequired] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Dropdown options
  const checkTypeOptions = [
    { label: "Visual", value: "VISUAL" },
    { label: "Functional", value: "FUNCTIONAL" },
    { label: "Measurement", value: "MEASUREMENT" },
    { label: "Documentation", value: "DOCUMENTATION" }
  ];

  const statusFilterOptions = [
    { label: "Active", value: true },
    { label: "Inactive", value: false }
  ];

  const requiredFilterOptions = [
    { label: "Required", value: true },
    { label: "Optional", value: false }
  ];

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/checklistcategories?active=true');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.categories)) {
          setCategories(data.categories.map(cat => ({
            label: cat.name,
            value: cat.id
          })));
        } else {
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Fetch checklist items with pagination and filters
  const fetchChecklistItems = async (pageIndex = 0, pageSize = 10, currentFilters = filters, retryCount = 0) => {
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
      
      // Add active filter
      if (currentFilters.active && currentFilters.active.value !== null && currentFilters.active.value !== undefined) {
        filterQuery += `&active=${currentFilters.active.value}`;
      }
      
      // Add category filter
      if (currentFilters.categoryId && currentFilters.categoryId.value) {
        filterQuery += `&categoryId=${currentFilters.categoryId.value}`;
      }
      
      // Add checkType filter
      if (currentFilters.checkType && currentFilters.checkType.value) {
        filterQuery += `&checkType=${currentFilters.checkType.value}`;
      }
      
      // Add required filter
      if (currentFilters.required && currentFilters.required.value !== null && currentFilters.required.value !== undefined) {
        filterQuery += `&required=${currentFilters.required.value}`;
      }

      const response = await fetch(`/api/v1/checklistitems?page=${page}&limit=${pageSize}${filterQuery}`, {
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
        // Ensure data has the expected structure
        if (data && typeof data === 'object') {
          setChecklistItems(Array.isArray(data.items) ? data.items : []);
          setTotalRecords(data.pagination?.totalCount || 0);
          setFirst(pageIndex);
          setRows(pageSize);
        } else {
          // Handle unexpected data structure
          setChecklistItems([]);
          setTotalRecords(0);
          toast.current?.show({
            severity: "warn",
            summary: "Warning",
            detail: "Received unexpected data format from server",
            life: 3000,
          });
        }
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to fetch checklist items",
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
          fetchChecklistItems(pageIndex, pageSize, currentFilters, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      console.error("Error fetching checklist items:", error);
      // Ensure checklistItems is always an array even on error
      setChecklistItems([]);
      setTotalRecords(0);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Failed to fetch checklist items",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new checklist item
  const createChecklistItem = async (itemData) => {
    try {
      const response = await fetch("/api/v1/checklistitems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: itemData.name,
          description: itemData.description,
          categoryId: itemData.categoryId,
          checkType: itemData.checkType,
          required: itemData.required,
          active: itemData.active,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Checklist item created successfully",
          life: 3000,
        });
        fetchChecklistItems(first, rows, filters); // refresh current page
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to create checklist item",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error creating checklist item:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to create checklist item",
        life: 3000,
      });
      return false;
    }
  };

  // Update checklist item
  const updateChecklistItem = async (id, itemData) => {
    try {
      const response = await fetch(`/api/v1/checklistitems/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: itemData.name,
          description: itemData.description,
          categoryId: itemData.categoryId,
          checkType: itemData.checkType,
          required: itemData.required,
          active: itemData.active,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Checklist item updated successfully",
          life: 3000,
        });
        fetchChecklistItems(first, rows, filters); // refresh current page
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to update checklist item",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating checklist item:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update checklist item",
        life: 3000,
      });
      return false;
    }
  };

  // Delete checklist item
  const deleteChecklistItem = async (id) => {
    try {
      const response = await fetch(`/api/v1/checklistitems/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Checklist item deleted successfully",
          life: 3000,
        });
        fetchChecklistItems(first, rows, filters); // refresh current page
        return true;
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.message || "Failed to delete checklist item",
          life: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to delete checklist item",
        life: 3000,
      });
      return false;
    }
  };

  // Pagination event handler
  const onPageChange = (event) => {
    // event.first = Index of first record
    // event.rows = Rows per page
    fetchChecklistItems(event.first, event.rows, filters);
  };

  // Filter handlers
  const onFilter = (newFilters) => {
    setFilters(newFilters);
    fetchChecklistItems(0, rows, newFilters);
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
      fetchChecklistItems(0, rows, newFilters);
    }, 500); // 500ms delay
  };

  // Handle filter changes
  const handleActiveFilterChange = (value) => {
    const newFilters = {
      ...filters,
      active: { value, matchMode: "equals" }
    };
    onFilter(newFilters);
  };

  const handleCategoryFilterChange = (value) => {
    const newFilters = {
      ...filters,
      categoryId: { value, matchMode: "equals" }
    };
    onFilter(newFilters);
  };

  const handleCheckTypeFilterChange = (value) => {
    const newFilters = {
      ...filters,
      checkType: { value, matchMode: "equals" }
    };
    onFilter(newFilters);
  };

  const handleRequiredFilterChange = (value) => {
    const newFilters = {
      ...filters,
      required: { value, matchMode: "equals" }
    };
    onFilter(newFilters);
  };

  // useEffect to fetch data on component mount
  useEffect(() => {
    fetchCategories();
    fetchChecklistItems(0, rows, filters);
    
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

  // Form handlers
  const openAdd = () => {
    setSelectedItem(null);
    setItemName("");
    setDescription("");
    setCategoryId(null);
    setCheckType("VISUAL");
    setIsRequired(false);
    setIsActive(true);
    setSidebarVisible(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setItemName(item.name);
    setDescription(item.description);
    setCategoryId(item.categoryId);
    setCheckType(item.checkType);
    setIsRequired(item.required);
    setIsActive(item.active);
    setSidebarVisible(true);
  };

  const handleSubmit = async () => {
    if (!itemName.trim() || !description.trim() || !categoryId) {
      toast.current?.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please fill all required fields",
        life: 3000,
      });
      return;
    }

    const itemData = {
      name: itemName.trim(),
      description: description.trim(),
      categoryId,
      checkType,
      required: isRequired,
      active: isActive,
    };

    let success = false;
    if (selectedItem) {
      success = await updateChecklistItem(selectedItem.id, itemData);
    } else {
      success = await createChecklistItem(itemData);
    }

    if (success) {
      setSidebarVisible(false);
      setSelectedItem(null);
      setItemName("");
      setDescription("");
      setCategoryId(null);
      setCheckType("VISUAL");
      setIsRequired(false);
      setIsActive(true);
    }
  };

  const handleDelete = async (item) => {
    if (confirm(`Delete "${item.name}"?`)) {
      await deleteChecklistItem(item.id);
    }
  };

  // Toggle item status
  const toggleItemStatus = async (item) => {
    const itemData = {
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      checkType: item.checkType,
      required: item.required,
      active: !item.active,
    };
    await updateChecklistItem(item.id, itemData);
  };

  // Template functions for DataTable
  const categoryBodyTemplate = (rowData) => {
    return rowData.category?.name || 'N/A';
  };

  const checkTypeBodyTemplate = (rowData) => {
    const getCheckTypeLabel = (type) => {
      switch (type) {
        case 'VISUAL': return 'Visual';
        case 'FUNCTIONAL': return 'Functional';
        case 'MEASUREMENT': return 'Measurement';
        case 'DOCUMENTATION': return 'Documentation';
        default: return type;
      }
    };

    return (
      <Badge 
        value={getCheckTypeLabel(rowData.checkType)} 
        severity="info"
      />
    );
  };

  const requiredBodyTemplate = (rowData) => {
    return (
      <Badge 
        value={rowData.required ? "Required" : "Optional"} 
        severity={rowData.required ? "danger" : "info"}
      />
    );
  };

  const statusBodyTemplate = (rowData) => {
    return (
      <InputSwitch
        checked={rowData.active}
        onChange={() => toggleItemStatus(rowData)}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="info"
          aria-label="Edit"
          onClick={() => openEdit(rowData)}
          className="p-button-sm"
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          aria-label="Delete"
          onClick={() => handleDelete(rowData)}
          className="p-button-sm"
        />
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-semibold">Checklist Items</h1>
          <Button
            label="Add Item"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={openAdd}
            disabled={loading}
          />
        </div>

        {/* Server-side Filter Section */}
        <div className="flex flex-col lg:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col gap-2">
            <label htmlFor="search-filter" className="font-semibold text-sm">Search:</label>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                id="search-filter"
                value={filters.search?.value || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or description..."
                style={{ minWidth: "15rem" }}
              />
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="category-filter" className="font-semibold text-sm">Category:</label>
            <Dropdown
              id="category-filter"
              value={filters.categoryId?.value}
              options={categories}
              onChange={(e) => handleCategoryFilterChange(e.value)}
              placeholder="Filter by Category"
              showClear
              style={{ minWidth: "12rem" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="checktype-filter" className="font-semibold text-sm">Check Type:</label>
            <Dropdown
              id="checktype-filter"
              value={filters.checkType?.value}
              options={checkTypeOptions}
              onChange={(e) => handleCheckTypeFilterChange(e.value)}
              placeholder="Filter by Check Type"
              showClear
              style={{ minWidth: "12rem" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="required-filter" className="font-semibold text-sm">Required:</label>
            <Dropdown
              id="required-filter"
              value={filters.required?.value}
              options={requiredFilterOptions}
              onChange={(e) => handleRequiredFilterChange(e.value)}
              placeholder="Filter by Required"
              showClear
              style={{ minWidth: "10rem" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="status-filter" className="font-semibold text-sm">Status:</label>
            <Dropdown
              id="status-filter"
              value={filters.active?.value}
              options={statusFilterOptions}
              onChange={(e) => handleActiveFilterChange(e.value)}
              placeholder="Filter by Status"
              showClear
              style={{ minWidth: "10rem" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm">&nbsp;</label>
            <Button
              icon="pi pi-refresh"
              className="p-button-outlined"
              onClick={() => fetchChecklistItems(first, rows, filters)}
              disabled={loading}
              tooltip="Refresh"
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid">
          <div className="col-12 md:col-3">
            <Card>
              <div className="flex align-items-center">
                <div className="flex-1">
                  <div className="text-xl font-bold text-primary">
                    {totalRecords}
                  </div>
                  <div className="text-600">Total Items</div>
                </div>
                <div className="text-primary">
                  <i className="pi pi-list text-2xl"></i>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-3">
            <Card>
              <div className="flex align-items-center">
                <div className="flex-1">
                  <div className="text-xl font-bold text-green-500">
                    {(checklistItems || []).filter(item => item.active).length}
                  </div>
                  <div className="text-600">Active Items (Current Page)</div>
                </div>
                <div className="text-green-500">
                  <i className="pi pi-check-circle text-2xl"></i>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-3">
            <Card>
              <div className="flex align-items-center">
                <div className="flex-1">
                  <div className="text-xl font-bold text-red-500">
                    {(checklistItems || []).filter(item => item.required).length}
                  </div>
                  <div className="text-600">Required Items (Current Page)</div>
                </div>
                <div className="text-red-500">
                  <i className="pi pi-exclamation-triangle text-2xl"></i>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-3">
            <Card>
              <div className="flex align-items-center">
                <div className="flex-1">
                  <div className="text-xl font-bold text-blue-500">
                    {(checklistItems || []).length}
                  </div>
                  <div className="text-600">Items on Page</div>
                </div>
                <div className="text-blue-500">
                  <i className="pi pi-eye text-2xl"></i>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <DataTable
        value={checklistItems}
        loading={loading}
        paginator={false} // Disable built-in paginator, using external Paginator
        rows={rows}
        className="rounded-2xl shadow-1"
        tableStyle={{ minWidth: "60rem" }}
        emptyMessage="No checklist items found."
      >
        <Column field="name" header="Item Name" sortable />
        <Column field="description" header="Description" />
        <Column header="Category" body={categoryBodyTemplate} />
        <Column header="Check Type" body={checkTypeBodyTemplate} />
        <Column header="Required" body={requiredBodyTemplate} />
        <Column header="Status" body={statusBodyTemplate} />
        <Column header="Actions" body={actionBodyTemplate} style={{ width: "120px" }} />
      </DataTable>

      <Paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        rowsPerPageOptions={[5, 10, 20, 50]}
        className="mt-3"
      />

      {/* Add/Edit Item Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        position="right"
        onHide={() => setSidebarVisible(false)}
        style={{ width: "500px" }}
      >
        <h2 className="mb-4">{selectedItem ? "Edit Checklist Item" : "Add Checklist Item"}</h2>

        <div className="p-fluid flex flex-column gap-4">
          <span className="p-float-label">
            <InputText
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <label htmlFor="itemName">Item Name *</label>
          </span>

          <span className="p-float-label">
            <InputTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <label htmlFor="description">Description *</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="categoryId"
              value={categoryId}
              options={categories}
              onChange={(e) => setCategoryId(e.value)}
            />
            <label htmlFor="categoryId">Category *</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="checkType"
              value={checkType}
              options={checkTypeOptions}
              onChange={(e) => setCheckType(e.value)}
            />
            <label htmlFor="checkType">Check Type</label>
          </span>

          <div className="field-checkbox">
            <InputSwitch
              id="isRequired"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.value)}
            />
            <label htmlFor="isRequired" className="ml-2">This item is required</label>
          </div>

          <div className="field-checkbox">
            <InputSwitch
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.value)}
            />
            <label htmlFor="isActive" className="ml-2">Item is active</label>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              label="Cancel"
              className="p-button-secondary"
              onClick={() => setSidebarVisible(false)}
            />
            <Button
              label={selectedItem ? "Save Changes" : "Add Item"}
              className="p-button-success"
              onClick={handleSubmit}
            />
          </div>
        </div>
      </Sidebar>

      <Toast ref={toast} />
    </div>
  );
}
