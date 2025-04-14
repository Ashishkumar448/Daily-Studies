// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">My Blog</h1>
        <div className="space-x-4">
          <Link to="/" className="hover:text-blue-400">Home</Link>
          <Link to="/create-post" className="hover:text-blue-400">Create Post</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
