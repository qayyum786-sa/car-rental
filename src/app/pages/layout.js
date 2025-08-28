"use client"
import React from "react";
import { useRouter } from "next/navigation";
import "primereact/resources/themes/lara-light-indigo/theme.css";     // theme
import "primereact/resources/primereact.css";                       // core css
import "primeicons/primeicons.css";                                // icons
import "primeflex/primeflex.css";                                 // primeflex
import { Button } from "primereact/button";
import { Menubar } from "primereact/menubar";


// ...existing code...

const Header = () => {
  const router = useRouter();

   const items = [
    {
      label: 'Home',
      icon: 'pi pi-fw pi-home',
      command: () => router.push('/pages/dashboard')
    },
   
      {
      label: "Admin",
      icon: "pi pi-fw pi-user",
      items: [
        { label: "Users", icon: "pi pi-fw pi-users", command: () => router.push("/pages/admin/users") },
        { label: "Brands", icon: "pi pi-fw pi-car", command: () => router.push("/pages/admin/brands") },
        { label: "Models", icon: "pi pi-fw pi-car", command: () => router.push("/pages/admin/models") },
        { label: "Variants", icon: "pi pi-fw pi-car", command: () => router.push("/pages/admin/variants") },
        { label: "States", icon: "pi pi-fw pi-map-marker", command: () => router.push("/pages/admin/states") },
        { label: "Cities", icon: "pi pi-fw pi-map-marker", command: () => router.push("/pages/admin/cities") },
        { label: "Checklist Category", icon: "pi pi-fw pi-check-square", command: () => router.push("/pages/admin/ChecklistCatogary") },
        { label: "Checklist Items", icon: "pi pi-fw pi-check-square", command: () => router.push("/pages/admin/checklist-items") },
        { label: "Settings", icon: "pi pi-fw pi-cog", command: () => router.push("/pages/admin/settings") },
      ],
    },
    
    
   {
      label: "Inventory",
      icon: "pi pi-fw pi-warehouse",
      items: [
        { label: "Pending Vehicles", icon: "pi pi-fw pi-clock", command: () => router.push("/pages/inventory/pending") },
        { label: "Available Vehicles", icon: "pi pi-fw pi-check", command: () => router.push("/pages/inventory/available") },
      ],
    },
    {
      label: "Bookings",
      icon: "pi pi-fw pi-calendar",
      command: () => router.push("/pages/bookings"),
    },
    {
      label: "Hosters",
      icon: "pi pi-fw pi-users",
      command: () => router.push("/pages/hosters"),
    },
    {
      label: "Customers",
      icon: "pi pi-fw pi-users",
      command: () => router.push("/pages/customers"),
    },
    {
      label: "Billing",
      icon: "pi pi-fw pi-dollar",
      command: () => router.push("/pages/billing"),
    },
    {
      label: "Reports",
      icon: "pi pi-fw pi-chart-bar",
      command: () => router.push("/pages/reports"),
    },
   
    
  ];
  const start = (
    <div className="flex align-items-center gap-4">
      <img
        src="https://img.icons8.com/color/64/000000/car--v2.png"
        alt="Car Rental Logo"
        style={{ width: 48, height: 48 }}
        className="animate-bounce shadow-4 border-circle bg-yellow-100 p-1"
      />
      
    </div>
  );

  const end = (
    <Button 
      label="Logout" 
      icon="pi pi-power-off" 
      severity="danger" 
      className="p-button-rounded font-bold px-5 py-1"
      onClick={() => router.push('/')}
      style={{ fontSize: "1rem" }}
    />
  );

   return (
    <header className="surface-0 shadow-5 border-round-bottom-3xl mb-0.5">
      <div className="flex align-items-center justify-content-between px-2 py-3 bg-white">
        <Menubar 
          model={items} 
          start={start} 
          end={end}
          className="border-none w-full bg-transparent"
          style={{
            background: 'white',
            color: '#120202ff',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}
        />
      </div>
      <style jsx global>{`
        /* Root menu items: dark text on white navbar */
        .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link .p-menuitem-text,
        .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link .p-menuitem-icon {
          color: #212529 !important;
          font-weight: 600 !important;
          text-shadow: none !important;
        }

        /* Submenu panel: white background with dark text */
        .p-menubar .p-submenu-list {
          background: #ffffff !important;
        }

        .p-menubar .p-submenu-list .p-menuitem-link .p-menuitem-text,
        .p-menubar .p-submenu-list .p-menuitem-link .p-menuitem-icon {
          color: #212529 !important;
          font-weight: 600 !important;
        }

        /* Hover states: subtle gray */
        .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:hover,
        .p-menubar .p-submenu-list .p-menuitem-link:hover {
          background: rgba(0, 0, 0, 0.06) !important;
        }
      `}</style>
    </header>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-column">
      <Header />
      <main className="flex-grow-1 ">
        {children}
      </main>
    </div>
  );
};

export default Layout;