import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "reservations" | "menu" | "messages">("dashboard");
  
  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "reservations", label: "Reservations" },
            { id: "menu", label: "Menu" },
            { id: "messages", label: "Messages" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "reservations" && <ReservationsTab />}
      {activeTab === "menu" && <MenuTab />}
      {activeTab === "messages" && <MessagesTab />}
    </div>
  );
}

function DashboardTab() {
  const stats = useQuery(api.admin.getDashboardStats);
  const recentActivity = useQuery(api.admin.getRecentActivity);

  if (!stats || !recentActivity) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Reservations</h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">Today: {stats.reservations.today}</p>
            <p className="text-sm text-gray-600">Pending: {stats.reservations.pending}</p>
            <p className="text-sm text-gray-600">Total: {stats.reservations.total}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">New: {stats.messages.new}</p>
            <p className="text-sm text-gray-600">Read: {stats.messages.read}</p>
            <p className="text-sm text-gray-600">Total: {stats.messages.total}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Menu Items</h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">Available: {stats.menu.available}</p>
            <p className="text-sm text-gray-600">Unavailable: {stats.menu.unavailable}</p>
            <p className="text-sm text-gray-600">Total: {stats.menu.total}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reservations</h3>
          <div className="space-y-3">
            {recentActivity.reservations.map((reservation) => (
              <div key={reservation._id} className="border-l-4 border-blue-500 pl-3">
                <p className="font-medium">{reservation.name}</p>
                <p className="text-sm text-gray-600">
                  {reservation.date} at {reservation.time} - {reservation.guests} guests
                </p>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  reservation.status === "confirmed" ? "bg-green-100 text-green-800" :
                  reservation.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {reservation.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h3>
          <div className="space-y-3">
            {recentActivity.messages.map((message) => (
              <div key={message._id} className="border-l-4 border-green-500 pl-3">
                <p className="font-medium">{message.name}</p>
                <p className="text-sm text-gray-600">{message.subject}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  message.status === "new" ? "bg-blue-100 text-blue-800" :
                  message.status === "read" ? "bg-yellow-100 text-yellow-800" :
                  "bg-green-100 text-green-800"
                }`}>
                  {message.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationsTab() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const reservations = useQuery(api.reservations.listReservations, { date: selectedDate });
  const updateStatus = useMutation(api.reservations.updateReservationStatus);

  const handleStatusUpdate = async (reservationId: string, status: "pending" | "confirmed" | "cancelled") => {
    try {
      await updateStatus({ reservationId: reservationId as any, status });
      toast.success("Reservation status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (!reservations) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reservations</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {reservations.map((reservation) => (
            <li key={reservation._id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-gray-900">{reservation.name}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(reservation._id, "confirmed")}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full hover:bg-green-200"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(reservation._id, "cancelled")}
                        className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full hover:bg-red-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {reservation.email} • {reservation.phone}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        {reservation.date} at {reservation.time} • {reservation.guests} guests
                      </p>
                    </div>
                  </div>
                  {reservation.specialRequests && (
                    <p className="mt-2 text-sm text-gray-600">
                      Special requests: {reservation.specialRequests}
                    </p>
                  )}
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                    reservation.status === "confirmed" ? "bg-green-100 text-green-800" :
                    reservation.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {reservation.status}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MenuTab() {
  const menuItems = useQuery(api.menu.getMenuItems, {});
  const toggleAvailability = useMutation(api.menu.toggleItemAvailability);
  const deleteItem = useMutation(api.menu.deleteMenuItem);

  const handleToggleAvailability = async (itemId: string) => {
    try {
      await toggleAvailability({ itemId: itemId as any });
      toast.success("Item availability updated");
    } catch (error) {
      toast.error("Failed to update availability");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      try {
        await deleteItem({ itemId: itemId as any });
        toast.success("Menu item deleted");
      } catch (error) {
        toast.error("Failed to delete item");
      }
    }
  };

  if (!menuItems) {
    return <div>Loading...</div>;
  }

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Add New Item
        </button>
      </div>

      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 capitalize">{category}</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium text-gray-900">{item.name}</h4>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {item.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleAvailability(item._id)}
                      className={`px-3 py-1 text-sm rounded ${
                        item.available 
                          ? "bg-red-100 text-red-800 hover:bg-red-200" 
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      {item.available ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesTab() {
  const messages = useQuery(api.contact.getContactMessages, {});
  const updateStatus = useMutation(api.contact.updateMessageStatus);

  const handleStatusUpdate = async (messageId: string, status: "new" | "read" | "replied") => {
    try {
      await updateStatus({ messageId: messageId as any, status });
      toast.success("Message status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (!messages) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Contact Messages</h2>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {messages.map((message) => (
            <li key={message._id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-gray-900">{message.name}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(message._id, "read")}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full hover:bg-yellow-200"
                      >
                        Mark Read
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(message._id, "replied")}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full hover:bg-green-200"
                      >
                        Mark Replied
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">{message.email} • {message.phone}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{message.subject}</p>
                    <p className="text-sm text-gray-700 mt-2">{message.message}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      message.status === "new" ? "bg-blue-100 text-blue-800" :
                      message.status === "read" ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {message.status}
                    </span>
                    <p className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
