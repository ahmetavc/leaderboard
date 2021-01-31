import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    return res.send('Received a GET HTTP method');
});

app.post('/', (req, res) => {
    return res.send('Received a POST HTTP method');
});

app.listen(PORT, () => {
    console.log("Server running on port 3000");
});