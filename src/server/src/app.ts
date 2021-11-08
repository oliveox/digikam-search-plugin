import express from "express";
import { internalDB } from './adapters/dbConnections.js';
import { config } from './config/config';
import analyseRouter from './routes/analyse';
import displayRouter from './routes/display';
import galleryRouter from './routes/gallery';
import indexRouter from './routes/index';
import searchRouter from './routes/search';
const cors = require('cors');

const port = config.port || 3001;

let app = express();
app.use(cors());

app.use((req, res, next) => {
    console.log("\n#####################");
    console.log("new request made");
    console.log(`host: ${req.hostname}`);
    console.log(`path: ${req.path}`);
    console.log(`method: ${req.method}`);
    console.log("#####################\n");

    next();
});

app.use('/', indexRouter);
app.use('/gallery', galleryRouter);
app.use('/analyse', analyseRouter);
app.use('/search', searchRouter);
app.use('/display', displayRouter);

app.use((req, res) => {
    res.status(404).send(`Woops, no such page here`);
});

(async () => {
    try {
        await internalDB.authenticate();
        console.log("Internal DB connection ON");

        await internalDB.sync();
        console.log("Synchronized model with Internal DB");

        app.listen(port, () => {
            console.log(`Server is up at: ${port}`)
        });

    } catch (err) {
        console.log(`Can't conenct to Internal DB: ${err}`);
    }
})()
