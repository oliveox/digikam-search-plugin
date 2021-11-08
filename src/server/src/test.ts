import { internalDB } from "./adapters/dbConnections";
import { analyseInternalDBFiles } from "./services/analyse";
import { importDigiKamFileData } from "./services/digikamImport";

const test_postgresInit = async () => {
    try {
        await internalDB.authenticate();
        console.log("DB connection ON");

        await internalDB.sync()
        console.log("Synchronized model with DB");
    } catch (err) {
        console.error(`Can't conenct to DB: ${err}`);
    }
}

const test_importDigiKam = async () => {
    const results = await importDigiKamFileData();
    console.log(results);
}

(async() => {
    try {
        await test_postgresInit();
        await test_importDigiKam();
        await analyseInternalDBFiles();
    } catch (err) {
        console.error(err);
    }
})()