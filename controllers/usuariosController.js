const Usuarios = require('../models/Usuarios')
const { body, validationResult } = require('express-validator')

const enviarEmail = require('../handlers/emails')

exports.formCrearCuenta = (req, res) =>{
    res.render('crear-cuenta',{
        nombrePagina : 'Crea tu cuenta'
    })
}

exports.crearNuevaCuenta = async (req, res) => {

    const usuario = req.body

    console.log(usuario);

    // body('confirmar', 'Repetir password no puede ir vacio').notEmpty()
    // body('confirmar', 'El password es diferente').equals(req.body.password)

    //check('confirmar').not().isEmpty().withMessage('Debes de confirmar tu password')
   
    const rules = [
        body('confirmar').notEmpty().withMessage('Debes de confirmar tu password'),
        body('confirmar').equals(usuario.password).withMessage('El password es diferente')
      ]

    await Promise.all(rules.map(validation => validation.run(req)))
    
    const errExp = validationResult(req);


    try {
        await Usuarios.create(usuario)
       
        // Url de confirmacion
        const url = `http://${req.headers.host}/confirmar-cuenta/${usuario.email}`


        // Enviar email de confirmacion
        await enviarEmail.enviarEmail({
            usuario,
            url,
            subject: 'Confirmar cuenta en Meei',
            archivo: 'confirmar-cuenta'
        })

        //Flash message y redireccionar
        req.flash('exito', 'Revisa tu email para activar tu cuenta')
        res.redirect('/iniciar-sesion')

    } catch (error) {


        const erroresSequelize = error.errors.map(err => err.message)
        // console.log(erroresSequelize);

        const erroresExpress = errExp.errors.map(err => err.msg)
        // console.log(erroresExpress)

        const listaErrores = [...erroresSequelize, ...erroresExpress]

       // console.log(listaErrores);

        req.flash('error', listaErrores)
        res.redirect('/crear-cuenta')
        
    }

}

exports.formIniciarSesion = async (req,res) => {
    res.render('iniciar-sesion',{
        nombrePagina : 'Iniciar sesion'
    })
}

exports.confirmarCuenta = async (req, res, next) => {

    console.log(req.params);

    // Verificar usuario existe
    const usuario = await Usuarios.findOne({
        where : { email : req.params.correo }
    })


    // Si no existe redireccionar
    if(!usuario){
        req.flash('error', 'La cuenta no existe')
        res.redirect('/crear-cuenta')
        return next()
    }


    //Existe ativar cuenta
    usuario.activo = 1
    await usuario.save()

    req.flash('exito', 'La cuenta se activo correctamente')
    res.redirect('/iniciar-sesion')

}