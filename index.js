const express = require('express')
const path = require('path')
const router = require('./routes')
const expressLayouts = require('express-ejs-layouts')

const passport = require('./config/passport')

const flash = require('connect-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser')

// const expressValidator = require('express-validator')

// Variable de desarrollo
require('dotenv').config({path: 'variables.env'})


// Configuracion y modelos DB
const db = require('./config/db')
// const { start } = require('repl')
require('./models/Usuarios')
require('./models/Categorias')
require('./models/Grupos')
require('./models/Meeti')

db.sync().then( () => {
    console.log('DB Conectada');
}).catch( (error) => console.log(error))


// Aplicacion principal
const app = express()

// Body parser
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// Express validator
// app.use(expressValidator())

app.use(expressLayouts)
// View engine EJS
app.set('view engine', 'ejs')

app.set('views', path.join(__dirname, './views'))
app.use(express.static('public'))

// Habilita cookie parser
app.use(cookieParser())

// Crear sesion
app.use(session({
    secret : process.env.SECRETO,
    key : process.env.KEY,
    resave : false,
    saveUninitialized : false
}))

// inicializar passport
app.use(passport.initialize())
app.use(passport.session())

// Agrega flash messages
app.use(flash())

//MiddleWare(usuario logeado, flash menssajes, fecha actual)
app.use((req, res, next) => {
    res.locals.usuario = {...req.user} || null
    res.locals.mensajes = req.flash()
    const fecha = new Date()
    res.locals.year = fecha.getFullYear()
    next()
})


//Routing
app.use('/', router())

app.listen(process.env.PORT, ()=>{
    console.log('Servidor OK!');
})