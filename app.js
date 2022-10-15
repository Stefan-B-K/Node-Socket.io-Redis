const express = require('express')
const path = require('path')
const { Server } = require('socket.io', {
    cors: {
        origin: "https://node-socket-redis.istef.ml",
        methods: ["GET", "POST"]
    }
})

const app = express()
const server = require('http').createServer(app)
const io = new Server(server)

const redis = require('redis')
let redisClient = redis.createClient()
redisClient.connect().catch(console.error)

const storeMessages = (name, message) => {
    const newMessage = styledMessage(name, message)
    redisClient.lPush('messages', newMessage)
}

app.use(express.static(path.join(__dirname, '/ChatApp')))
app.get('/', (req, res) => res.render('index.html'))

server.listen(3005)


io.sockets.on('connection', client => {
    client.on('join', async name => {
        let users = await redisClient.sMembers('users')
        if (users.includes(name)) {
            client.emit('user taken')
        } else {
            client.emit('joined')
            client.nickname = name
            client.broadcast.emit('user joined', name)

            await redisClient.sAdd('users', name)
            users = await redisClient.sMembers('users')
            users.forEach(name => client.emit('user joined', name))

            const messages = await redisClient.lRange('messages', 0, -1)
            messages
                .reverse()
                .forEach(message => client.emit('messages', message))

        }
    })

    client.on('messages', message => {
        const nickname = client.nickname
        client.broadcast.emit('messages', styledMessage(nickname, message))
        client.emit('messages', styledMessage('Me', message))
        storeMessages(nickname, message)
    })

    client.on('disconnect', () => {
        redisClient.sRem('users', client.nickname)
        client.broadcast.emit('user left', client.nickname)
    })
})


const styledMessage = (name, message) => {
    const now = new Date()
    const timestamp = `${now.toLocaleDateString()}, ${now.getHours()}:${now.getMinutes()}`
    return `<i style="color: darkgrey">${timestamp}</i> <b>${name}</b> : ${message}`
}