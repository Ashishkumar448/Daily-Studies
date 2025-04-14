import mongoose from 'mongoose';

const connectWithMongoose = async () =>{
    try {
       const connectionInstance = await mongoose.connect('mongodb+srv://ashishkumarjena1437:123ASD456@blogsdb.sedzt5t.mongodb.net/?retryWrites=true&w=majority&appName=BlogsDB');

        console.log("Cloud database is connected + ",connectionInstance.connection.host);
    } catch (error) {
        console.log(error);
    }
    
};

export {connectWithMongoose};