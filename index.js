import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import sitRouter from './routes/salesRouter';

const app = express();
const http = require('http').Server(app);
app.use(session({
    secret: 'mySecret',
    name: 'user', 
    saveUninitialized: false,
    resave: true, 
    cookie: { maxAge: 3600 * 1000 }
}));

app.set("views", "views/");
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static('public'));
app.use('/', sitRouter);

const host = '0.0.0.0';
const port = process.env.PORT || 3100;

http.listen(port, host, function() {
    console.log("Server started.......");
});