"use client";
import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Toast } from "primereact/toast";
import { useRef } from "react";

export default function CarChecklistPage() {
  const toast = useRef(null);

  // Sample checklist categories and items
  const [checklistCategories, setChecklistCategories] = useState([
    {
      id: 1,
      categoryName: "Exterior Inspection",
      description: "Check exterior condition of the vehicle",
      items: [
        { id: 1, item: "Body damage check", isRequired: true, completed: false },
        { id: 2, item: "Tire condition", isRequired: true, completed: false },
        { id: 3, item: "Lights functionality", isRequired: true, completed: false },
        { id: 4, item: "Mirror condition", isRequired: false, completed: false },
      ],
      status: "Active"
    },
    {
      id: 2,
      categoryName: "Interior Inspection",
      description: "Check interior condition and functionality",
      items: [
        { id: 1, item: "Seats condition", isRequired: true, completed: false },
        { id: 2, item: "Dashboard functionality", isRequired: true, completed: false },
        { id: 3, item: "Air conditioning", isRequired: false, completed: false },
        { id: 4, item: "Safety belt check", isRequired: true, completed: false },
      ],
      status: "Active"
    },
    {
      id: 3,
      categoryName: "Engine & Mechanical",
      description: "Check engine and mechanical components",
      items: [
        { id: 1, item: "Engine oil level", isRequired: true, completed: false },
        { id: 2, item: "Brake fluid", isRequired: true, completed: false },
        { id: 3, item: "Battery condition", isRequired: true, completed: false },
        { id: 4, item: "Coolant level", isRequired: false, completed: false },
      ],
      status: "Active"
    }
  ]);

  // Form states
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [editSidebarVisible, setEditSidebarVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Add category form
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [checklistItems, setChecklistItems] = useState([
    { item: "", isRequired: false }
  ]);

  // Edit category form
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editChecklistItems, setEditChecklistItems] = useState([]);

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" }
  ];

  // Add new checklist item to form
  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { item: "", isRequired: false }]);
  };

  // Remove checklist item from form
  const removeChecklistItem = (index) => {
    const updatedItems = checklistItems.filter((_, i) => i !== index);
    setChecklistItems(updatedItems);
  };

  // Handle checklist item change
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...checklistItems];
    updatedItems[index][field] = value;
    setChecklistItems(updatedItems);
  };

  // Handle edit checklist item change
  const handleEditItemChange = (index, field, value) => {
    const updatedItems = [...editChecklistItems];
    updatedItems[index][field] = value;
    setEditChecklistItems(updatedItems);
  };

  // Submit new category
  const handleSubmit = () => {
    if (!categoryName || !description || checklistItems.some(item => !item.item)) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields',
        life: 3000
      });
      return;
    }

    const newCategory = {
      id: checklistCategories.length + 1,
      categoryName,
      description,
      status,
      items: checklistItems.map((item, index) => ({
        id: index + 1,
        item: item.item,
        isRequired: item.isRequired,
        completed: false
      }))
    };

    setChecklistCategories([...checklistCategories, newCategory]);
    
    // Reset form
    setCategoryName("");
    setDescription("");
    setStatus("Active");
    setChecklistItems([{ item: "", isRequired: false }]);
    setSidebarVisible(false);

    toast.current.show({
      severity: 'success',
      summary: 'Success',
      detail: 'Checklist category created successfully',
      life: 3000
    });
  };

  // Open edit sidebar
  const openEdit = (category) => {
    setSelectedCategory(category);
    setEditCategoryName(category.categoryName);
    setEditDescription(category.description);
    setEditStatus(category.status);
    setEditChecklistItems([...category.items]);
    setEditSidebarVisible(true);
  };

  // Save edited category
  const saveEdit = () => {
    if (!editCategoryName || !editDescription || editChecklistItems.some(item => !item.item)) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields',
        life: 3000
      });
      return;
    }

    setChecklistCategories(prev => 
      prev.map(cat => 
        cat.id === selectedCategory.id 
          ? { 
              ...cat, 
              categoryName: editCategoryName,
              description: editDescription,
              status: editStatus,
              items: editChecklistItems
            }
          : cat
      )
    );

    setEditSidebarVisible(false);
    setSelectedCategory(null);

    toast.current.show({
      severity: 'success',
      summary: 'Success',
      detail: 'Checklist category updated successfully',
      life: 3000
    });
  };

  // Delete category
  const deleteCategory = (categoryId) => {
    setChecklistCategories(prev => prev.filter(cat => cat.id !== categoryId));
    toast.current.show({
      severity: 'info',
      summary: 'Deleted',
      detail: 'Checklist category deleted successfully',
      life: 3000
    });
  };

  // Template functions for DataTable
  const statusBodyTemplate = (rowData) => {
    return (
      <Badge 
        value={rowData.status} 
        severity={rowData.status === "Active" ? "success" : "warning"}
      />
    );
  };

  const itemsCountTemplate = (rowData) => {
    return `${rowData.items.length} items`;
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
          onClick={() => deleteCategory(rowData.id)}
          className="p-button-sm"
        />
      </div>
    );
  };

  return (
    <div style={{ padding: "2rem", position: "relative" }}>
      <Toast ref={toast} />
      
      {/* Header with Add Button */}
      <div className="flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="m-0"></h1>
          <p className="text-600 m-0"></p>
        </div>
        <Button
          label="Add Category"
          icon="pi pi-plus"
          onClick={() => setSidebarVisible(true)}
          className="p-button-success"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid mb-4">
        <div className="col-12 md:col-4">
          <Card>
            <div className="flex align-items-center">
              <div className="flex-1">
                <div className="text-xl font-bold text-primary">
                  {checklistCategories.length}
                </div>
                <div className="text-600">Total Categories</div>
              </div>
              <div className="text-primary">
                <i className="pi pi-list text-2xl"></i>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-4">
          <Card>
            <div className="flex align-items-center">
              <div className="flex-1">
                <div className="text-xl font-bold text-green-500">
                  {checklistCategories.filter(cat => cat.status === "Active").length}
                </div>
                <div className="text-600">Active Categories</div>
              </div>
              <div className="text-green-500">
                <i className="pi pi-check-circle text-2xl"></i>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-4">
          <Card>
            <div className="flex align-items-center">
              <div className="flex-1">
                <div className="text-xl font-bold text-orange-500">
                  {checklistCategories.reduce((total, cat) => total + cat.items.length, 0)}
                </div>
                <div className="text-600">Total Checklist Items</div>
              </div>
              <div className="text-orange-500">
                <i className="pi pi-clipboard text-2xl"></i>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* DataTable */}
      <Card>
        <DataTable 
          value={checklistCategories} 
          paginator 
          rows={10}
          dataKey="id"
          filterDisplay="menu"
          emptyMessage="No checklist categories found."
        >
          <Column field="categoryName" header="Category Name" sortable />
          <Column field="description" header="Description" />
          <Column header="Items Count" body={itemsCountTemplate} />
          <Column header="Status" body={statusBodyTemplate} sortable />
          <Column header="Actions" body={actionBodyTemplate} />
        </DataTable>
      </Card>

      {/* Add Category Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        position="right"
        onHide={() => setSidebarVisible(false)}
        style={{ width: "500px" }}
      >
        <h2 className="mb-4">Add Checklist Category</h2>

        <div className="p-fluid flex flex-column gap-4">
          <span className="p-float-label">
            <InputText
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <label htmlFor="categoryName">Category Name</label>
          </span>

          <span className="p-float-label">
            <InputTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <label htmlFor="description">Description</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="status"
              value={status}
              options={statusOptions}
              onChange={(e) => setStatus(e.value)}
            />
            <label htmlFor="status">Status</label>
          </span>

          <div className="field">
            <label className="font-bold">Checklist Items</label>
            {checklistItems.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <InputText
                  placeholder="Enter checklist item"
                  value={item.item}
                  onChange={(e) => handleItemChange(index, "item", e.target.value)}
                  className="flex-1"
                />
                <div className="flex align-items-center">
                  <Checkbox
                    checked={item.isRequired}
                    onChange={(e) => handleItemChange(index, "isRequired", e.checked)}
                  />
                  <label className="ml-1 text-sm">Required</label>
                </div>
                {checklistItems.length > 1 && (
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    onClick={() => removeChecklistItem(index)}
                  />
                )}
              </div>
            ))}
            <Button
              label="Add Item"
              icon="pi pi-plus"
              text
              onClick={addChecklistItem}
              className="mt-2"
            />
          </div>

          <Button
            label="Save Category"
            onClick={handleSubmit}
            className="p-button-success mt-3"
          />
        </div>
      </Sidebar>

      {/* Edit Category Sidebar */}
      <Sidebar
        visible={editSidebarVisible}
        position="right"
        onHide={() => setEditSidebarVisible(false)}
        style={{ width: "500px" }}
      >
        <h2 className="mb-4">Edit Checklist Category</h2>

        <div className="p-fluid flex flex-column gap-4">
          <span className="p-float-label">
            <InputText
              id="editCategoryName"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
            />
            <label htmlFor="editCategoryName">Category Name</label>
          </span>

          <span className="p-float-label">
            <InputTextarea
              id="editDescription"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
            />
            <label htmlFor="editDescription">Description</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="editStatus"
              value={editStatus}
              options={statusOptions}
              onChange={(e) => setEditStatus(e.value)}
            />
            <label htmlFor="editStatus">Status</label>
          </span>

          <div className="field">
            <label className="font-bold">Checklist Items</label>
            {editChecklistItems.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <InputText
                  placeholder="Enter checklist item"
                  value={item.item}
                  onChange={(e) => handleEditItemChange(index, "item", e.target.value)}
                  className="flex-1"
                />
                <div className="flex align-items-center">
                  <Checkbox
                    checked={item.isRequired}
                    onChange={(e) => handleEditItemChange(index, "isRequired", e.checked)}
                  />
                  <label className="ml-1 text-sm">Required</label>
                </div>
                {editChecklistItems.length > 1 && (
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    onClick={() => {
                      const updatedItems = editChecklistItems.filter((_, i) => i !== index);
                      setEditChecklistItems(updatedItems);
                    }}
                  />
                )}
              </div>
            ))}
            <Button
              label="Add Item"
              icon="pi pi-plus"
              text
              onClick={() => {
                setEditChecklistItems([...editChecklistItems, { id: Date.now(), item: "", isRequired: false, completed: false }]);
              }}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              label="Cancel"
              className="p-button-secondary"
              onClick={() => setEditSidebarVisible(false)}
            />
            <Button
              label="Save Changes"
              className="p-button-success"
              onClick={saveEdit}
            />
          </div>
        </div>
      </Sidebar>
    </div>
  );
}
