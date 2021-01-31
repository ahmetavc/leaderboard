import express from "express";

const app = express();

app.get('/', (req, res) => {
    return res.send('Received a GET HTTP method');
});

app.post('/', (req, res) => {
    return res.send('Received a POST HTTP method');
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});