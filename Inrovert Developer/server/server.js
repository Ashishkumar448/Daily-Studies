import express from 'express';
import PostRoute from './routes/post.route.js'
import { connectWithMongoose } from './db/connection1.db.js';
import cors from 'cors';
const app = express();
connectWithMongoose();
app.use(cors({
    origin: ['http://localhost:5173'], // Update to allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
/*===================-==============Import statements and express initiation at above==================================================== */

app.use('/api/v1',PostRoute);


// Main function for server.js
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

