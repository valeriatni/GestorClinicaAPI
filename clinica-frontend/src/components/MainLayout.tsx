import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import { Sidebar } from "./Sidebar";


export default function MainLayout() {
  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="d-flex">
        <Sidebar />

        <main className="flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}