// "use client";
// import React from "react";
// import { Chart } from "primereact/chart";

// export default function Dashboard() {
//   // Sample Bar Chart Data
//   const barData = {
//     labels: ["Users", "Cars", "Bookings"],
//     datasets: [
//       {
//         label: "Count",
//         backgroundColor: ["#3b82f6", "#22c55e", "#a855f7"],
//         data: [120, 45, 78],
//       },
//     ],
//   };
//   const barOptions = {
//     plugins: {
//       legend: { display: false },
//     },
//     responsive: true,
//     maintainAspectRatio: false,
//   };

//   // Sample Pie Chart Data
//   const pieData = {
//     labels: ["Admin", "Staff", "Customer"],
//     datasets: [
//       {
//         data: [10, 25, 85],
//         backgroundColor: ["#2563eb", "#10b981", "#f59e42"],
//         hoverBackgroundColor: ["#1d4ed8", "#059669", "#ea580c"],
//       },
//     ],
//   };
//   const pieOptions = {
//     plugins: {
//       legend: {
//         position: "bottom",
//         labels: { color: "#374151" },
//       },
//     },
//     responsive: true,
//     maintainAspectRatio: false,
//   };

//    return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
//       <h1 className="text-4xl font-extrabold text-blue-700 mb-4">Dashboard</h1>
//       <p className="text-lg text-gray-600 mb-8">
//         Welcome! Here's a quick overview of your car rental system.
//       </p>
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10">
//         <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
//           <span className="pi pi-users text-3xl text-blue-500 mb-2" />
//           <span className="text-xl font-semibold">Users</span>
//           <span className="text-gray-500 mt-1">Manage all users</span>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
//           <span className="pi pi-car text-3xl text-green-500 mb-2" />
//           <span className="text-xl font-semibold">Cars</span>
//           <span className="text-gray-500 mt-1">View and add cars</span>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
//           <span className="pi pi-book text-3xl text-purple-500 mb-2" />
//           <span className="text-xl font-semibold">Bookings</span>
//           <span className="text-gray-500 mt-1">Track reservations</span>
//         </div>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
//         <div className="bg-white rounded-lg shadow p-6">
//           <h2 className="text-lg font-semibold text-gray-700 mb-4">Overview (Bar Chart)</h2>
//           <div className="h-64">
//             <Chart type="bar" data={barData} options={barOptions} />
//           </div>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6">
//           <h2 className="text-lg font-semibold text-gray-700 mb-4">User Roles (Pie Chart)</h2>
//           <div className="h-64">
//             <Chart type="pie" data={pieData} options={pieOptions} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// "use client";
// import React from "react";
// import { Chart } from "primereact/chart";

// export default function Dashboard() {
//   // Sample Bar Chart Data
//   const barData = {
//     labels: ["Users", "Cars", "Bookings"],
//     datasets: [
//       {
//         label: "Count",
//         backgroundColor: ["#3b82f6", "#22c55e", "#a855f7"],
//         data: [120, 45, 78],
//       },
//     ],
//   };
//   const barOptions = {
//     plugins: {
//       legend: { display: false },
//     },
//     responsive: true,
//     maintainAspectRatio: false,
//   };

//   // Sample Pie Chart Data
//   const pieData = {
//     labels: ["Admin", "Staff", "Customer"],
//     datasets: [
//       {
//         data: [10, 25, 85],
//         backgroundColor: ["#2563eb", "#10b981", "#f59e42"],
//         hoverBackgroundColor: ["#1d4ed8", "#059669", "#ea580c"],
//       },
//     ],
//   };
//   const pieOptions = {
//     plugins: {
//       legend: {
//         position: "bottom",
//         labels: { color: "#374151" },
//       },
//     },
//     responsive: true,
//     maintainAspectRatio: false,
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
//       <h1 className="text-4xl font-extrabold text-blue-700 mb-4">Dashboard</h1>
//       <p className="text-lg text-gray-600 mb-8">
//         Welcome! Here&apos;s a quick overview of your car rental system.
//       </p>
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10">
//         <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
//           <span className="pi pi-users text-3xl text-blue-500 mb-2" />
//           <span className="text-xl font-semibold">Users</span>
//           <span className="text-gray-500 mt-1">Manage all users</span>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
//           <span className="pi pi-car text-3xl text-green-500 mb-2" />
//           <span className="text-xl font-semibold">Cars</span>
//           <span className="text-gray-500 mt-1">View and add cars</span>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
//           <span className="pi pi-book text-3xl text-purple-500 mb-2" />
//           <span className="text-xl font-semibold">Bookings</span>
//           <span className="text-gray-500 mt-1">Track reservations</span>
//         </div>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
//         <div className="bg-white rounded-lg shadow p-6">
//           <h2 className="text-lg font-semibold text-gray-700 mb-4">Overview (Bar Chart)</h2>
//           <div className="h-64">
//             <Chart type="bar" data={barData} options={barOptions} />
//           </div>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6">
//           <h2 className="text-lg font-semibold text-gray-700 mb-4">User Roles (Pie Chart)</h2>
//           <div className="h-64">
//             <Chart type="pie" data={pieData} options={pieOptions} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



"use client";
import React, { useEffect, useState } from "react";
import { Chart } from "primereact/chart";

export default function Dashboard() {
  // State for protected API data
  const [protectedData, setProtectedData] = useState(null);
  const [apiError, setApiError] = useState("");

  // Fetch protected API data on mount
  useEffect(() => {
    async function fetchProtected() {
      // Get JWT token from localStorage
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/api/protected-route", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Unauthorized or Fetch Failed");
        }
        const data = await res.json();
        setProtectedData(data);
      } catch (error) {
        setApiError(error.message);
      }
    }
    fetchProtected();
  }, []);

  // Sample Bar Chart Data
  const barData = {
    labels: ["Users", "Cars", "Bookings"],
    datasets: [
      {
        label: "Count",
        backgroundColor: ["#3b82f6", "#22c55e", "#a855f7"],
        data: [120, 45, 78],
      },
    ],
  };
  const barOptions = {
    plugins: {
      legend: { display: false },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Sample Pie Chart Data
  const pieData = {
    labels: ["Admin", "Staff", "Customer"],
    datasets: [
      {
        data: [10, 25, 85],
        backgroundColor: ["#2563eb", "#10b981", "#f59e42"],
        hoverBackgroundColor: ["#1d4ed8", "#059669", "#ea580c"],
      },
    ],
  };
  const pieOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#374151" },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-extrabold text-blue-700 mb-4">Dashboard</h1>
      <p className="text-lg text-gray-600 mb-8">
        Welcome! Here&apos;s a quick overview of your car rental system.
      </p>

      {/* Protected API Data Output */}
      {apiError && <div className="text-red-600 font-semibold mb-2">{apiError}</div>}
      {protectedData && (
        <div className="text-green-600 font-semibold mb-2">
          {JSON.stringify(protectedData)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="pi pi-users text-3xl text-blue-500 mb-2" />
          <span className="text-xl font-semibold">Users</span>
          <span className="text-gray-500 mt-1">Manage all users</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="pi pi-car text-3xl text-green-500 mb-2" />
          <span className="text-xl font-semibold">Cars</span>
          <span className="text-gray-500 mt-1">View and add cars</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="pi pi-book text-3xl text-purple-500 mb-2" />
          <span className="text-xl font-semibold">Bookings</span>
          <span className="text-gray-500 mt-1">Track reservations</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Overview (Bar Chart)</h2>
          <div className="h-64">
            <Chart type="bar" data={barData} options={barOptions} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">User Roles (Pie Chart)</h2>
          <div className="h-64">
            <Chart type="pie" data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
