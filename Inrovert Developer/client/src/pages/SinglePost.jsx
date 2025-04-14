import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const SinglePost = () => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:5000/api/posts/${id}`);
                setPost(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-gray-300">Loading...</div>;
    if (error) return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-red-400">Error: {error}</div>;
    if (!post) return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-gray-300">No post found</div>;

    return (
        <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                <div className="p-8">
                    <h1 className="text-4xl font-bold text-white mb-6">{post.title}</h1>
                    <p className="text-gray-300 text-lg leading-relaxed mb-8">{post.content}</p>
                    <div className="border-t border-gray-700 pt-4 flex justify-between items-center text-sm text-gray-400">
                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                            </svg>
                            {post.author}
                        </span>
                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"/>
                            </svg>
                            {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SinglePost;