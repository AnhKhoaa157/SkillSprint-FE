import { Link, Outlet } from "react-router";
import { BrandLogo } from "../components/layout/BrandLogo";
import { useState } from "react";

export default function AdminLayout() {
  // Minimal admin layout: remove top navbar per request.
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", width: '100%' }}>
      <main style={{ width: '100%', padding: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
