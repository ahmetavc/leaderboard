import express from "express";
import {router} from './routes/user.js'

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/user', router);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});