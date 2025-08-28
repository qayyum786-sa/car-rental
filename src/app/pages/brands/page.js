"use client";
import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";

/**
 * Car Brands Page with photos
 * - 10 sample brands with logos
 * - Edit/Delete with round icon buttons
 */

export default function CarBrandsPage() {
  const [brands, setBrands] = useState([
    {
      id: 1,
      name: "Toyota",
      country: "Japan",
      founded: 1937,
      type: "Mass",
      logo: "https://1000logos.net/wp-content/uploads/2018/02/Toyota-Logo.png",
    },
    {
      id: 2,
      name: "BMW",
      country: "Germany",
      founded: 1916,
      type: "Luxury",
      logo: "https://1000logos.net/wp-content/uploads/2018/02/BMW-Logo.png",
    },
    {
      id: 3,
      name: "Mercedes-Benz",
      country: "Germany",
      founded: 1926,
      type: "Luxury",
      logo: "https://1000logos.net/wp-content/uploads/2018/02/Mercedes-Benz-Logo.png",
    },
    {
      id: 4,
      name: "Tesla",
      country: "USA",
      founded: 2003,
      type: "Electric",
      logo: "https://1000logos.net/wp-content/uploads/2018/02/Tesla-Logo.png",
    },
    {
      id: 5,
      name: "Hyundai",
      country: "South Korea",
      founded: 1967,
      type: "Mass",
      logo: "https://1000logos.net/wp-content/uploads/2018/02/Hyundai-logo.png",
    },
    {
      id: 6,
      name: "Kia",
      country: "South Korea",
      founded: 1944,
      type: "Mass",
      logo: "https://1000logos.net/wp-content/uploads/2018/03/Kia-logo.png",
    },
    {
      id: 7,
      name: "Ferrari",
      country: "Italy",
      founded: 1939,
      type: "Performance",
      logo: "https://1000logos.net/wp-content/uploads/2018/02/Ferrari-Logo.png",
    },
    {
      id: 8,
      name: "Lamborghini",
      country: "Italy",
      founded: 1963,
      type: "Performance",
      logo: "https://1000logos.net/wp-content/uploads/2018/02/Lamborghini-Logo.png",
    },
    {
      id: 9,
      name: "Tata Motors",
      country: "India",
      founded: 1945,
      type: "Mass",
      logo: "https://1000logos.net/wp-content/uploads/2018/04/Tata-logo.png",
    },
    {
      id: 10,
      name: "Mahindra",
      country: "India",
      founded: 1945,
      type: "Mass",
      logo: "https://1000logos.net/wp-content/uploads/2018/04/Mahindra-logo.png",
    },
  ]);

  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editFounded, setEditFounded] = useState("");
  const [editType, setEditType] = useState("");

  const typeOptions = ["Mass", "Luxury", "Performance", "Electric"].map((t) => ({
    label: t,
    value: t,
  }));

  // Open edit sidebar
  const openEdit = (row) => {
    setEditing(row);
    setEditName(row.name);
    setEditCountry(row.country);
    setEditFounded(row.founded);
    setEditType(row.type);
    setEditVisible(true);
  };

  // Save edit
  const saveEdit = () => {
    setBrands((prev) =>
      prev.map((b) =>
        b.id === editing.id
          ? { ...b, name: editName, country: editCountry, founded: editFounded, type: editType }
          : b
      )
    );
    setEditVisible(false);
    setEditing(null);
  };

  // Delete brand
  const removeBrand = (row) => {
    if (confirm(`Delete ${row.name}?`)) {
      setBrands((prev) => prev.filter((b) => b.id !== row.id));
    }
  };

  // Table custom cells
  const logoBody = (row) => (
    <img src={row.logo} alt={row.name} style={{ width: "50px", height: "50px", objectFit: "contain" }} />
  );

  const typeBody = (row) => {
    const severityMap = {
      Mass: "secondary",
      Luxury: "info",
      Performance: "warning",
      Electric: "success",
    };
    return <Tag value={row.type} severity={severityMap[row.type]} rounded />;
  };

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Car Brands</h1>

      <DataTable
        value={brands}
        paginator
        rows={5}
        className="rounded-2xl shadow-1"
        tableStyle={{ minWidth: "60rem" }}
      >
        <Column header="Logo" body={logoBody} style={{ width: "100px" }} />
        <Column field="name" header="Brand" sortable />
        <Column field="country" header="Country" sortable />
        <Column field="founded" header="Founded" sortable />
        <Column field="type" header="Type" body={typeBody} sortable />
        <Column header="Action" body={actionBody} style={{ width: "120px" }} />
      </DataTable>

      {/* Edit Sidebar */}
      <Sidebar visible={editVisible} position="right" onHide={() => setEditVisible(false)}>
        <h2 className="mb-4">Edit Brand</h2>
        <div className="p-fluid flex flex-col gap-3">
          <span className="p-float-label">
            <InputText id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <label htmlFor="edit-name">Name</label>
          </span>

          <span className="p-float-label">
            <InputText id="edit-country" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} />
            <label htmlFor="edit-country">Country</label>
          </span>

          <span className="p-float-label">
            <InputText id="edit-founded" value={editFounded} onChange={(e) => setEditFounded(e.target.value)} />
            <label htmlFor="edit-founded">Founded</label>
          </span>

          <span className="p-float-label">
            <Dropdown
              id="edit-type"
              value={editType}
              options={typeOptions}
              onChange={(e) => setEditType(e.value)}
              placeholder="Select Type"
            />
            <label htmlFor="edit-type">Type</label>
          </span>

          <div className="flex gap-2 mt-3">
            <Button label="Cancel" className="p-button-secondary" onClick={() => setEditVisible(false)} />
            <Button label="Save Changes" className="p-button-success" onClick={saveEdit} />
          </div>
        </div>
      </Sidebar>
    </div>
  );
}
