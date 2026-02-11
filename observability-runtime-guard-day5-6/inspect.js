import express from "express";

const app = express();

app.use((req, res, next) => {
    console.log("=== req keys ===");
    console.log(Object.keys(req));

    console.log("=== method ===", req.method);
    console.log("=== url ===", req.url);
    console.log("=== headers ===", req.headers);

    next();
});

app.get("/", (req, res) => {
    res.send("ok");
});

app.listen(3000, () => {
    console.log("server running at http://localhost:3000");
});
