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

let default_page;
io.sockets.on('connection', socket => {
    console.log('A user connected');

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
    });

    socket.emit('default_page', default_page);
});

http.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});