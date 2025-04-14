import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "../components/Card.jsx";

const Blog = () => {

  const [posts, setPosts] = useState([]);

  const getPosts = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/v1/getallposts");
      console.log(response.data.posts);
      setPosts(response.data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <section className="bg-gray-950 text-white py-12 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <Card
            key={post._id}
            title={post.topic}
            subtitle={post.question}
            description={post.answer}
            
          />
        ))}
  
        {posts.length === 0 && (
          <div className="text-center col-span-full">
            <p>No posts found</p>
          </div>
        )}
      </div>
      <div className="text-center mt-8">
        <p>End of posts</p>
      </div>
    </section>
  );
};

export default Blog;
