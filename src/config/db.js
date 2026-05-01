import mongoose from 'mongoose';

// Track connection state so routes can return a friendly error
let dbReady = false;

const connectDB = async (attempt = 1) => {

    //  MongoDB — resilient connection with retry 
    let MONGO_URI = process.env.MONGO_URI || '';
    if (!MONGO_URI || MONGO_URI.includes('<db_password>')) {
        console.warn('MONGO_URI missing or unpopulated — using local MongoDB.');
        MONGO_URI = 'mongodb://127.0.0.1:27017/mtalk';
    }

    const maxAttempts = 10;
    const delay = Math.min(1000 * 2 ** (attempt - 1), 30000); // exponential up to 30s

    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        dbReady = true;
        const label = MONGO_URI.includes('@')
            ? MONGO_URI.split('@')[1].split('/')[0]
            : MONGO_URI;
        console.log(`MongoDB connected → ${label}`);
    } catch (err) {
        dbReady = false;
        console.error(`❌  MongoDB attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
        if (attempt < maxAttempts) {
            console.log(`    Retrying in ${delay / 1000}s…`);
            setTimeout(() => connectDB(attempt + 1), delay);
        } else {
            console.error('    Giving up after max retries. The server stays running but DB-dependent routes will return 503.');
        }
    }
};

// Re-connect on unexpected drop
mongoose.connection.on('disconnected', () => {
    dbReady = false;
    console.warn('MongoDB disconnected — attempting to reconnect…');
    connectDB();
});
mongoose.connection.on('reconnected', () => {
    dbReady = true;
    console.log('MongoDB reconnected');
});


//  Middleware: guard routes when DB is unavailable
const requireDB = (_req, res, next) => {
    if (!dbReady) {
        return res.status(503).json({
            message: 'Database is temporarily unavailable. Please try again in a moment.',
        });
    }
    next();
};

export {
    dbReady,
    connectDB,
    requireDB
};