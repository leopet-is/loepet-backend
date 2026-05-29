/* eslint-disable camelcase */
const db = require('../DB/index');

/**
 * Crear notificaciones para todos los donadores que tienen esta fundación en favoritos
 * cuando se crea un nuevo animal
 */
exports.crearNotificacionesNuevoAnimal = async (animal) => {
  try {
    const fundacionId = animal.fundacion_id;

    // Obtener todos los usuarios que tienen esta fundación en favoritos
    const favoritos = await db.FavoritoFundacion.findAll({
      where: {
        fundacion_id: fundacionId,
      },
    });

    // Crear notificación para cada usuario
    const notificaciones = favoritos.map((favorito) => ({
      usuario_id: favorito.usuario_id,
      fundacion_id: fundacionId,
      animal_id: animal.id,
      actualizacion_id: null,
      visible: true,
      leido: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (notificaciones.length > 0) {
      await db.Notificacion.bulkCreate(notificaciones);
      console.log(`Notificaciones creadas para nuevo animal ${animal.nombre}`);
    }
  } catch (error) {
    console.log('Error creando notificaciones de nuevo animal:', error);
  }
};

/**
 * Generar descripción de alerta basada en condiciones de urgencia
 */
const generarDescripcionAlerta = (animal) => {
  const tieneEnfermedades = animal.enfermedades && animal.enfermedades.trim() !== '';
  const sinEsterilizacion = !animal.esterilizacion;
  const sinVacunacion = !animal.vacunacion;
  const sinDesparasitacion = !animal.desparasitacion;

  const problemas = [];

  if (tieneEnfermedades) {
    problemas.push(`Enfermedades: ${animal.enfermedades}`);
  }
  if (sinEsterilizacion) {
    problemas.push('Sin esterilización');
  }
  if (sinVacunacion) {
    problemas.push('Sin vacunación');
  }
  if (sinDesparasitacion) {
    problemas.push('Sin desparasitación');
  }

  return problemas.join(', ');
};

/**
 * Crear notificaciones de alerta cuando se detectan condiciones de urgencia
 * Condiciones: enfermedades O (sin esterilización/vacunación/desparasitación)
 */
exports.crearNotificacionesAlerta = async (animal) => {
  try {
    const fundacionId = animal.fundacion_id;

    // Verificar si cumple condiciones de alerta
    const tieneEnfermedades = animal.enfermedades && animal.enfermedades.trim() !== '';
    const sinEsterilizacion = !animal.esterilizacion;
    const sinVacunacion = !animal.vacunacion;
    const sinDesparasitacion = !animal.desparasitacion;

    // Crear alerta si tiene enfermedades O le falta al menos uno de los tres
    const esAlerta = tieneEnfermedades
      || sinEsterilizacion
      || sinVacunacion
      || sinDesparasitacion;

    if (!esAlerta) {
      return;
    }

    // Generar descripción de la alerta
    const descripcionAlerta = generarDescripcionAlerta(animal);

    // Obtener todos los usuarios que tienen esta fundación en favoritos
    const favoritos = await db.FavoritoFundacion.findAll({
      where: {
        fundacion_id: fundacionId,
      },
    });

    // Crear notificaciones de alerta
    const notificaciones = favoritos.map((favorito) => ({
      usuario_id: favorito.usuario_id,
      fundacion_id: fundacionId,
      animal_id: animal.id,
      actualizacion_id: null,
      visible: true,
      leido: false,
      es_alerta_salud: true,
      descripcion_alerta: descripcionAlerta,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (notificaciones.length > 0) {
      await db.Notificacion.bulkCreate(notificaciones);
      console.log(
        `Notificaciones de alerta creadas para ${animal.nombre}: ${descripcionAlerta}`,
      );
    }
  } catch (error) {
    console.log('Error creando notificaciones de alerta:', error);
  }
};

/**
 * Crear notificaciones cuando hay una actualización de un animal
 * Se envía a los donadores activos (usuarios en la Manada del animal)
 */
exports.crearNotificacionesActualizacion = async (actualizacion) => {
  try {
    const animalId = actualizacion.animal_id;
    console.log(`crearNotificacionesActualizacion: actualizacion_id=${actualizacion.id}, animal_id=${animalId}`);

    // Obtener todas las manadas del animal (donadores activos)
    const manadasAnimal = await db.ManadaAnimal.findAll({
      where: {
        animal_id: animalId,
      },
    });
    console.log(`crearNotificacionesActualizacion: Se encontraron ${manadasAnimal.length} manadas para este animal`);

    if (manadasAnimal.length === 0) {
      console.log('crearNotificacionesActualizacion: No hay manadas para este animal');
      return;
    }

    // Obtener los usuarios donadores de estas manadas
    const notificaciones = await Promise.all(manadasAnimal.map(async (manadaAnimal) => {
      const manada = await db.Manada.findOne({
        where: {
          id: manadaAnimal.manada_id,
        },
      });
      if (manada) {
        return {
          usuario_id: manada.userId,
          fundacion_id: actualizacion.fundacion_id,
          animal_id: animalId,
          actualizacion_id: actualizacion.id,
          visible: true,
          leido: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    }));

    const validNotificaciones = notificaciones.filter((n) => n !== null);

    if (validNotificaciones.length > 0) {
      await db.Notificacion.bulkCreate(validNotificaciones);
      console.log(
        `crearNotificacionesActualizacion: ${validNotificaciones.length} notificaciones creadas`,
      );
    }
  } catch (error) {
    console.log('Error creando notificaciones de actualización:', error);
  }
};
