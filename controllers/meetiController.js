const Grupos = require('../models/Grupos')
const Meeti = require('../models/Meeti');

const uuid = require('uuid').v4

const { body } = require('express-validator')

//Muestra el form para crea un meeti
exports.formNuevoMeeti = async (req, res) => {

    const grupos = await Grupos.findAll({
        where: { usuarioId: req.user.id }
    })

    console.log('MEETI ', grupos);

    res.render('nuevo-meeti', {
        nombrePagina: 'Crear nuevo Meeti',
        grupos
    })
}

exports.crearMeeti = async (req, res) => {
    const meeti = req.body
    console.log(meeti)

    // asignar el usuario
    meeti.usuarioId = req.user.id

    // almacena la ubicación con un point
    const point = { type: 'Point', coordinates: [parseFloat(req.body.lat), parseFloat(req.body.lng)] }
    meeti.ubicacion = point

    // cupo opcional
    if (req.body.cupo === '') {
        meeti.cupo = 0
    }

    meeti.id = uuid()

    // almacenar en la BD
    try {
        await Meeti.create(meeti)
        req.flash('exito', 'Se ha creado el Meeti Correctamente')
        res.redirect('/administracion')
    } catch (error) {
        // extraer el message de los errores
        const erroresSequelize = error.errors.map(err => err.message)
        req.flash('error', erroresSequelize)
        res.redirect('/nuevo-meeti')
    }


}

// sanitiza los meeti
exports.sanitizarMeeti = (req, res, next) => {
    body('titulo').not().isEmpty().trim().escape();
    body('invitado').not().isEmpty().trim().escape();
    body('cupo').not().isEmpty().trim().escape();
    body('fecha').not().isEmpty().trim().escape();
    body('hora').not().isEmpty().trim().escape();
    body('direccion').not().isEmpty().trim().escape();
    body('ciudad').not().isEmpty().trim().escape();
    body('estado').not().isEmpty().trim().escape();
    body('pais').not().isEmpty().trim().escape();
    body('lat');
    body('lng');
    body('grupoId').not().isEmpty().trim().escape();

    next();
}