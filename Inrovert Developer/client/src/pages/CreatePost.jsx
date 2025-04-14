// CreatePost.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const CreatePost = () => {
  const [form, setForm] = useState({
    topic: "",
    question: "",
    answer: "",
  });
const navigate = useNavigate();
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post("http://localhost:3000/api/v1/createpost", {
            topic: form.topic,
            question: form.question,
            answer: form.answer,
        });
        if(response.status === 200 || response.status === 201){
            navigate("/");
        }
        console.log(response.data);
    } catch (error) {
        console.error("Error creating post:", error);
    }
};

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Create a New Post</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-1" htmlFor="topic">Topic</label>
            <input
              type="text"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-white outline-none"
              placeholder="Enter topic"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="question">Question</label>
            <input
              type="text"
              name="question"
              value={form.question}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-white outline-none"
              placeholder="Enter question"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="answer">Answer</label>
            <textarea
              name="answer"
              value={form.answer}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-white outline-none"
              placeholder="Write answer..."
              rows="5"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg text-lg font-semibold"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
