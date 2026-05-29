const { Op } = require('sequelize');
const db = require('../DB/index');

exports.clearDatabase = async (req, res) => {
  try {
    // Limpiar datos de prueba (orden correcto por foreign keys)
    await db.Rating.destroy({ where: {}, force: true });
    await db.Comision.destroy({ where: {}, force: true });
    await db.Notificacion.destroy({ where: {}, force: true });
    await db.ActualizacionAnimal.destroy({ where: {}, force: true });
    await db.Donacion.destroy({ where: {}, force: true });
    await db.ManadaAnimal.destroy({ where: {}, force: true });
    await db.Manada.destroy({ where: {}, force: true });
    await db.Animal.destroy({ where: {}, force: true });
    await db.Fundacion.destroy({ where: {}, force: true });
    await db.Usuario.destroy({ where: { email: { [Op.like]: '%e2e-test%' } }, force: true });

    return res.status(200).send({ message: 'Database cleared successfully for E2E tests.' });
  } catch (error) {
    console.error('Error clearing database:', error);
    return res.status(500).send({ error: 'Failed to clear database.' });
  }
};

exports.createDonation = async (req, res) => {
  try {
    const donationData = req.body;
    const authenticatedUserId = req.User.id; // From passport middleware

    // Security check: Ensure the user is creating a donation for themselves
    if (donationData.donador_id !== authenticatedUserId) {
      return res.status(403).send({ error: 'Forbidden: You can only create donations for yourself.' });
    }

    const newDonation = await db.Donacion.create(donationData);
    return res.status(201).send(newDonation);
  } catch (error) {
    console.error('Error creating donation for test:', error);
    return res.status(500).send({ error: 'Failed to create donation for test.' });
  }
};
