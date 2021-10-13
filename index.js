const express = require('express'); 
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const favicon = require('serve-favicon');

const router = express.Router();
router.use(express.urlencoded({extended: true}))
router.use(express.json())
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", ORIGIN || "*");
    next();
});

app.use(express.static(path.join(__dirname, "public")))
    .use(favicon(path.join(__dirname, "public", "img/favicon.ico")))
    .get("/", (req, res) => res.render('index.html'));

let count = 0;
let default_page;
let admin_sockets = new Array();
let teacher_sockets = new Array();

io.sockets.on('connection', socket => {
    let admin_index;
    let teacher_index;

    console.log('A user connected');
    count++;
    sendCount();

    socket.on('admin', () => {
        admin_index = admin_sockets.length;
        admin_sockets.push(socket);
        socket.emit('user_count', count);
    });

    socket.on('teacher', () => {
        console.log('Teacher connected');
        teacher_index = teacher_sockets.length;
        teacher_sockets.push(socket);

        admin_sockets.filter(Boolean).forEach(s => s.on('move', page => {
            console.log(page);
            socket.emit('send_page', page);
        }));
    });

    let pages_opened = new Array();
    socket.on('send_page', options => {
        let id = options.id;
        if(pages_opened.indexOf(id) === -1)
            pages_opened.push(id);
        else if(options.first_only)
            return;
        io.sockets.emit('send_page', id);
    });

    socket.on('default_page', page => {
        default_page = page;
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        count--;
        sendCount();
        if(admin_index > -1)
            admin_sockets[admin_index] = null;
        socket.removeAllListeners();
    });

    socket.emit('default_page', default_page);
});

http.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

function sendCount() {
    admin_sockets.filter(Boolean).forEach(s => s.emit('user_count', count));
}