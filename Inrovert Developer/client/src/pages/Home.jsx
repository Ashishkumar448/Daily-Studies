import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from '../components/Navbar.jsx';
import Blogs from '../pages/Blogs.jsx';
import CreatePost from '../pages/CreatePost';
import SinglePost from '../pages/SinglePost.jsx';

const Home = () => {
  return (
   <>
      <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/create-post" element={<CreatePost/>} />
        <Route path="/singlepost/:postId" element={<SinglePost/>} />
      </Routes>
      <Blogs/>
      <footer>Footer Content</footer>
    </Router>
    </>
  )
}

export default Home
