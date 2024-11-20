// backend/src/createApp.mjs

import express from 'express';
//import mongoose from 'mongoose';
import routes from './routes/index.mjs';  // routes api's
import cookieParser from 'cookie-parser';
//import session from 'express-session';
//import MongoStore from 'connect-mongo';
import cors from 'cors';
import bodyParser from 'body-parser';

export function createApp() {
    const app = express();

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Credentials", true);
        next()
    })

    // CORS configuration to allow credentials
    // app.use(cors({
    //     origin: 'http://localhost:3000',  // Your frontend URL
    //     credentials: true,                // Allow cookies/session to be sent
    // }));
    app.use(cors({
          origin: 'http://localhost:3000', // Allow requests from your frontend
          methods: ['GET', 'POST', 'OPTIONS'], // Specify allowed methods
          //allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
          credentials: true, // Enable credentials (cookies, session)
        })
      );

    app.use(bodyParser.json());
    app.use(express.json());
    app.use(cookieParser());

    // Set up session handling
    // app.use(session({
    //     secret: "userID",
    //     resave: false,
    //     saveUninitialized: true,
    //     cookie: {
    //         secure: false,
    //         maxAge: 60000 * 60,       // cookie span = 1 hour
    //         httpOnly: true
    //     },
    //     store: MongoStore.create({
    //         client: mongoose.connection.getClient()
    //     }),
    // }));

    app.use(routes);  // Routes

    return app;
}
