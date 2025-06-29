import mongoose from 'mongoose';

const connectWithMongoose = async () =>{
    try {
       const connectionInstance = await mongoose.connect('mongoDB URI Here');

        console.log("Cloud database is connected + ",connectionInstance.connection.host);
    } catch (error) {
        console.log(error);
    }
    
};

export {connectWithMongoose};
