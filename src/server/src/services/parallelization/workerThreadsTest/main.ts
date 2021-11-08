import {spawn, Thread, Worker} from "threads";

const launchWorkers = async () => {
    console.log("Main thread");

    const worker = await spawn(new Worker("worker"));
    const result = await worker("WUSUP!");

    console.log(result);

    await Thread.terminate(worker);
    console.log("Spawned the worker!");
}

(async () => {
    console.log("Launching worker");
    await launchWorkers();
})()