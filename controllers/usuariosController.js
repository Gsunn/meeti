const Usuarios = require('../models/Usuarios')
const { body, validationResult, check } = require('express-validator')

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


// Muestra el formulario para editar el perfil
exports.formEditarPerfil = async (req, res) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    res.render('editar-perfil', {
        nombrePagina : 'Editar Perfil',
        usuario
    })
}

// almacena en la Base de datos los cambios al perfil
exports.editarPerfil = async (req, res) => {

    const usuario = await Usuarios.findByPk(req.user.id);

    // ToDO : Sanitizar
    check('nombre');
    check('email');
    // leer datos del form
    const { nombre, descripcion, email} = req.body;

    // asignar los valores
    usuario.nombre = nombre;
    usuario.descripcion = descripcion;
    usuario.email = email;

    // guardar en la BD
    await usuario.save();
    req.flash('exito', 'Cambios Guardados Correctamente');
    res.redirect('/administracion');

}

// Muestra el formulario para modificar el password
exports.formCambiarPassword = (req, res) => {
    res.render('cambiar-password', {
        nombrePagina : 'Cambiar Password'
    })
}

// Revisa si el password anterior es correcto y lo modifica por uno nuevo

exports.cambiarPassword = async (req, res, next) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    // verificar que el password anterior sea correcto
    if(!usuario.validarPassword(req.body.anterior)) {
        req.flash('error', 'El password actual es incorrecto');
        res.redirect('/administracion');
        return next();
    }

    // si  el password es correcto, hashear el nuevo
    const hash = usuario.hashPassword(req.body.nuevo);

    // asignar el password al usuario
    usuario.password = hash;

    // guardar en la base de datos
    await usuario.save();

    // redireccionar
    req.logout();
    req.flash('exito', 'Password Modificado Correctamente, vuelve a iniciar sesión');
    res.redirect('/iniciar-sesion');
}