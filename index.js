import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import sitRouter from './routes/salesRouter';

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

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

io.on('connection', function (socket) {
    socket.on('create schedule', function (schedule, channel) {
        socket.broadcast.emit(channel + 'create schedule', schedule);
    });
    socket.on('update schedule', function (scheduleId, calId, changes, channel) {
        socket.broadcast.emit(channel + 'update schedule', scheduleId, calId, changes);
    });
    socket.on('delete schedule', function (scheduleId, calId, channel) {
        socket.broadcast.emit(channel + 'delete schedule', scheduleId, calId);
    });
    socket.on('create calendar', function (calendarId, calendarName, calendarColor) {
        socket.broadcast.emit('create calendar', calendarId, calendarName, calendarColor);
    });
    socket.on('delete calendar', function (delCalId) {
        socket.broadcast.emit('delete calendar', delCalId);
    });
    socket.on('delete schedule relattive to the calendar', function (delScheduleIdRes, delCalId) {
        socket.broadcast.emit('delete schedule relattive to the calendar', delScheduleIdRes, delCalId);
    });
});


const host = '0.0.0.0';
const port = process.env.PORT || 3100;

http.listen(port, host, function () {
    console.log("Server started.......");
});