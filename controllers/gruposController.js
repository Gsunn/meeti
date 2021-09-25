const Categorias = require('../models/Categorias')
const Grupos = require('../models/Grupos')
const multer = require('multer')
const shortid = require('shortid')
const fs = require('fs')

configuracionMulter = {
    limits: { filesize: 100000 },
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, next) => {
            next(null, __dirname + '/../public/uploads/grupos/')
        },
        filename: (req, file, next) => {
            const extension = file.mimetype.split('/')[1]
            next(null, `${shortid.generate()}.${extension}`)
        },
        fileFilter(req, file, next) {
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
                //el formato es valido
                next(null, true);
            } else {
                // el formato no es valido
                next(new Error('Formato no válido'), false);
            }
        }
    })
}

const upload = multer(configuracionMulter).single('imagen')

const { body } = require('express-validator')

exports.formNuevoGrupo = async (req, res) => {

    const categorias = await Categorias.findAll()

    res.render('nuevo-grupo', {
        nombrePagina: 'Crear un nuevo grupo',
        categorias
    })
}


// Sube imagen al servidor
exports.subirImagen = (req, res, next) => {
    upload(req, res, (error) => {
        if (error) {
            console.log(error);
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'El Archivo es muy grande')
                } else {
                    req.flash('error', error.message);
                }
            } else if (error.hasOwnProperty('message')) {
                req.flash('error', error.message);
            }
            res, redirect('back')
            return
        } else {
            next()
        }

    })
}

exports.crearGrupo = async (req, res) => {

    // Sanitizar campos
    const rules = [
        body('nombre').trim().escape(),//.notEmpty().withMessage('El nombre del grupo esta vacio'),
        body('url').trim().escape() //.notEmpty().withMessage('La url esta vacia')
    ]

    await Promise.all(rules.map(validation => validation.run(req)))

    const errExp = validationResult(req);

    // console.log(errExp);
    console.log(req);

    const grupo = req.body
    grupo.usuarioId = req.user.id
    console.log(grupo)

    // Leer imagen
    if (req.file) grupo.imagen = req.file.filename

    try {
        await Grupos.create(grupo)
        req.flash('exito', 'Se creo un nuevo grupo')
        res.redirect('/administracion')
    } catch (error) {
        // console.log(error);

        const erroresSequelize = error.errors.map(err => err.message)

        req.flash('error', erroresSequelize)
        res.redirect('/nuevo-grupo')
    }
}

exports.formEditarGrupo = async (req, res, next) => {
    const consultas = [];
    consultas.push(Grupos.findByPk(req.params.grupoId));
    consultas.push(Categorias.findAll());

    // Promise con await
    const [grupo, categorias] = await Promise.all(consultas);

    res.render('editar-grupo', {
        nombrePagina: `Editar Grupo : ${grupo.nombre}`,
        grupo,
        categorias
    })
}


exports.editarGrupo = async (req, res, next) => {
    const grupo = await Grupos.findOne({
        where: { id: req.params.grupoId, usuarioId: req.user.id }
    })

    // Si no existe el grupo o no lo creo
    if (!grupo) {
        req.flash('error', 'Operación no válida')
        res.redirect('/administracion')
        return next()
    }

    // Fue bien, leer valores
    const { nombre, descripcion, categoriaId, url } = req.body

    // asignar los valores
    grupo.nombre = nombre
    grupo.descripcion = descripcion
    grupo.categoriaId = categoriaId
    grupo.url = url

    // guardamos en la base de datos
    await grupo.save()
    req.flash('exito', 'Cambios Almacenados Correctamente')
    res.redirect('/administracion')

}


// Muestra formulario para editar la imagen de grupo
exports.formEditarImagen = async (req, res) => {
    const grupo = await Grupos.findOne({
        where: { id: req.params.grupoId, usuarioId: req.user.id }
    })

    res.render('imagen-grupo',{
        nombrePagina : `Editar imagen de grupo : ${grupo.nombre}`,
        grupo
    })
}

// Modifica la imagen den la BD y elimina la anterior
exports.editarImagen = async (req, res, next) => {
    const grupo = await Grupos.findOne({
        where: { id: req.params.grupoId, usuarioId: req.user.id }
    })

    if(!grupo){
        req.flash('error','Operación no válida')
        res.redirect('/iniciar-sesion')
        return next()
    }


    if(req.file && grupo.imagen){
        const imagenAnterior = __dirname + `/../public/uploads/grupos/${grupo.imagen}`

        if(imagenAnterior){
            fs.unlink(imagenAnterior, (error) => {
                if(error){
                    console.log(error);
                    return
                }
            })
           
        }

    }

    //Guardar imagen nueva
    if(req.file){
        grupo.imagen = req.file.filename
    }

    await grupo.save()
    req.flash('exito','Los cambios se almacenaron correctamente')
    res.redirect('/administracion')


}


exports.formEliminarGrupo = async (req, res, next) => {
    const grupo = await Grupos.findOne({
        where: { id: req.params.grupoId, usuarioId: req.user.id }
    })

    if(!grupo){
        req.flash('error', 'Operacion no valida')
        res.redirect('/administracion')
        return next()
    }

    //Ejecutar la vista , todo bien
    res.render('eliminar-grupo',{
        nombrePagina : `Eliminar grupo: ${grupo.nombre}`
    })

}


exports.eliminarGrupo = async (req, res, next) => {
    const grupo = await Grupos.findOne({
        where: { id: req.params.grupoId, usuarioId: req.user.id }
    })

    if(!grupo){
        req.flash('error', 'Operacion no valida')
        res.redirect('/administracion')
        return next()
    }

    if(grupo.imagen){
        const imagenAnterior = __dirname + `/../public/uploads/grupos/${grupo.imagen}`

        fs.unlink(imagenAnterior, (error) => {
            if(error){
                console.log(error);
                return
            }
        })
    }

    await Grupos.destroy({
        where : {
            id : req.params.grupoId 
        } 
    })
   
    // Redireccionar
    req.flash('exito', 'Grupo eliminado')
    res.redirect('/administracion')

}