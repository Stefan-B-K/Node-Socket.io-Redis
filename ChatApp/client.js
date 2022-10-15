const socket = io.connect('http://localhost:3005')

const status = document.querySelector('#status')

let nickname

socket.on('connect', () => {
    nickname = prompt('Enter your nickname')
    socket.emit('join', nickname)
})

socket.on('user taken', () => {
    nickname = prompt('Nickname already in use. Enter another nickname')
    socket.emit('join', nickname)
})

socket.on('joined', () => {
    status.innerHTML = 'connected as ' + `<i class="user">${nickname}</i>`
    status.style.color = '#1a7203'
})

socket.on('messages', message => insertMessage(message))

socket.on('user joined', name => insertUser(name, nickname))

socket.on('user left', name => removeUser(name))


const btn = document.querySelector('button')
const input = document.querySelector('input')
btn.addEventListener('click', () => processMessage())
input.addEventListener('keypress', event => {
    if (event.key === 'Enter') processMessage()
})


const processMessage = () => {
    const message = input.value.trim()
    if (message.length) {
        socket.emit('messages', message)
        input.value = ''
    }
}

const insertUser = (user, me) => {
    const newUser = document.createElement('li')
    newUser.innerHTML = user
    newUser.id = 'user-' + user
    if (user === me) newUser.classList.add('user')

    const users = document.querySelector('#users')
    users.appendChild(newUser)
}

const removeUser = user => {
    const removedUser = document.querySelector('#user-' + user)
    removedUser.remove()
}

const insertMessage = message => {
    const newMessage = document.createElement('div')
    newMessage.innerHTML = message
    newMessage.classList.add('box', 'message')
    if (message.includes('<b>Me</b>')) newMessage.classList.add('me')

    const messages = document.querySelector('.messages')
    messages.appendChild(newMessage)

    const updateScroll = () => messages.scrollTop = messages.scrollHeight
    setTimeout(updateScroll, 10)
}