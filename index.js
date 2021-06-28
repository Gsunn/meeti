const express = require('express')
const path = require('path')
const router = require('./routes')
const expressLayouts = require('express-ejs-layouts')
require('dotenv').config({path: 'variables.env'})

const app = express()

app.use(expressLayouts)
// View engine EJS
app.set('view engine', 'ejs')

app.set('views', path.join(__dirname, './views'))
app.use(express.static('public'))

//Routing
app.use('/', router())


app.listen(process.env.PORT, ()=>{
    console.log('Servidor OK!');
})