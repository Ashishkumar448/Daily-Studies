import React from "react";
import { useNavigate } from "react-router-dom";

const Card = ({ title, subtitle, description }) => {

  const navigate = useNavigate();

  

  return (
    <div onClick={() => navigate(`/singlepost/${post._id}`)} className="bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <h3 className="text-md text-gray-400 mb-3">{subtitle}</h3>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );
};

export default Card;
