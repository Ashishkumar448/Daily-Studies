import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import authRouter from './routers/authrouter.js';
import postsRouter from "./routers/postsRouter.js";

const app = express();
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("Database connection established");
}).catch((err) => {
    console.log(err);
})

app.use('/api/auth', authRouter);
app.use('/api/post', postsRouter)


app.get('/', (req, res) => {
    res.json({ message: "Hello from Server" });
});

let port = process.env.PORT;

app.listen(port, () => {
    console.log(`listening to port ${port}`);
});