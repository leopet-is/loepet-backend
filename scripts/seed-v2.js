const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../DB/index');

const PASSWORD = 'Leopet2025!';
const NOW = new Date();
const OLD = new Date('2022-03-02T19:39:10');

async function seed() {
  try {
    await db.connect();
    const count = await db.Usuario.count();
    const force = process.argv.includes('--force');

    if (count > 0 && !force) {
      console.log(`Ya existen ${count} usuarios. Usa --force para sobreescribir.`);
      await db.sequelize.close();
      return;
    }

    const tables = Object.keys(db.sequelize.models).map(m => db.sequelize.models[m].tableName);
    for (const t of tables) {
      await db.sequelize.query(`DELETE FROM "${t}" CASCADE`);
    }

    const pw = await bcrypt.hash(PASSWORD, 10);

    // ---- USUARIOS ----
    const users = await db.Usuario.bulkCreate([
      { id: 1, cedula: '0909090909', nombres: 'Johanna', apellidos: 'Lopez', telefono: '0909090909', email: 'donador@gmail.com', password: pw, role: 3, createdAt: OLD, updatedAt: OLD },
      { id: 2, cedula: '0808080808', nombres: 'Alexandra', apellidos: 'Ramos', telefono: '0808080808', email: 'admin@gmail.com', password: pw, role: 1, createdAt: OLD, updatedAt: OLD },
      { id: 3, cedula: '0909090909', nombres: 'Cecilia', apellidos: 'Castillo', telefono: '0909090909', direccion: 'Florida', email: 'colitafeliz@gmail.com', password: pw, role: 2, createdAt: OLD, updatedAt: new Date('2022-03-16T06:07:15') },
      { id: 4, cedula: '0909090909', nombres: 'Ricardo', apellidos: 'Silva', telefono: '0909090909', direccion: 'Ceibos', email: 'refugiohuellitas@gmail.com', password: pw, role: 2, createdAt: new Date('2022-03-16T06:25:51'), updatedAt: new Date('2022-03-16T06:25:51') },
      { id: 5, cedula: '0808080808', nombres: 'Cristian', apellidos: 'Pincay', telefono: '0909090909', direccion: 'Sauces', email: 'leopet@gmail.com', password: pw, role: 2, createdAt: new Date('2022-03-16T06:34:00'), updatedAt: new Date('2022-03-16T06:34:00') },
      { id: 6, cedula: '0000000000', nombres: 'Johanna Lopez', apellidos: 'NN', telefono: 'NN', direccion: 'NN', email: 'johannalopez@gmail.com', password: pw, role: 3, createdAt: new Date('2022-03-23T20:03:03'), updatedAt: new Date('2022-03-23T20:03:03') },
      { id: 8, cedula: '0909010203', nombres: 'Alex', apellidos: 'Vera', telefono: '0101020105', email: 'alex@gmail.com', password: pw, role: 3, createdAt: new Date('2022-08-21T04:09:36'), updatedAt: new Date('2022-08-21T04:09:36') },
      { id: 9, cedula: '0909090102', nombres: 'Sofia', apellidos: 'Castro', telefono: '0909090807', email: 'sofiacastro@gmail.com', password: pw, role: 3, createdAt: new Date('2022-08-21T13:41:47'), updatedAt: new Date('2022-08-21T13:41:47') },
    ]);
    console.log(`  ${users.length} usuarios`);

    // ---- FUNDACIONES ----
    const foundations = await db.Fundacion.bulkCreate([
      { id: 1, ruc: '0101010134101', nombre: 'Colita feliz', direccion: 'Urdesa', telefono: '0911111111', aprobado: true, comision: 0, logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3I04jO4GHF4ns9UnG4XW57jEowDh3TaWMGXc-N9WoqAF4mvYDOb2s73ZXDTTmDUZ8ytY&usqp=CAU', descripcion: 'Fundación dedicada al rescate y adopción de perros y gatos en el sector de Urdesa.', createdAt: new Date('2022-03-02T19:41:25'), updatedAt: new Date('2022-08-21T12:08:19') },
      { id: 2, ruc: '0909887620001', nombre: 'Refugio Huellitas', direccion: 'Durán', telefono: '0922222222', aprobado: true, comision: 0, logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3wY1PzsceCwSDZAvNPR-vrgzzmJDD_1QHbQ&usqp=CAU', descripcion: 'Refugio comprometido con el bienestar animal y la protección de mascotas rescatadas en Durán.', createdAt: new Date('2022-03-02T19:41:25'), updatedAt: new Date('2022-07-22T18:04:09') },
      { id: 3, ruc: '0909090064001', nombre: 'Leopet', direccion: 'Alborada', telefono: '0933333333', aprobado: true, comision: 0, logo: 'https://www.pregonagroecuario.com/assets/images/upload/perro_Huky_Siberiano.jpg', descripcion: 'Centro de rescate y plataforma de apoyo para animales desamparados en la Alborada.', createdAt: new Date('2022-03-02T19:41:25'), updatedAt: new Date('2022-07-22T18:04:09') },
    ]);
    console.log(`  ${foundations.length} fundaciones`);

    // ---- ADMIN FUND ----
    await db.AdminFund.bulkCreate([
      { id: 3, fundacion_id: 1, createdAt: new Date('2022-03-02T19:42:17'), updatedAt: new Date('2022-03-02T19:42:17') },
      { id: 4, fundacion_id: 2, createdAt: new Date('2022-03-16T06:25:51'), updatedAt: new Date('2022-03-16T06:25:51') },
      { id: 5, fundacion_id: 3, createdAt: new Date('2022-03-16T06:34:00'), updatedAt: new Date('2022-03-16T06:34:00') },
    ]);
    console.log('  3 admin_fund');

    // ---- ANIMALES ----
    const animals = await db.Animal.bulkCreate([
      { id: 1, nombre: 'Balto', status: 'REQUIERE_PADRINOS', especie: 'PERRO', raza: 'Husky', descripcion: 'Fue encontrado en condiciones deplorables, estaba deshidratado y con parásitos', imagen: 'https://www.pregonagropecuario.com/assets/images/upload/perro_Huky_Siberiano.jpg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_025417_583Balto.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_025422_888Balto2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_025428_149Balto3.jpg'] }, fundacion_id: 1, visible: true, fecha_nacimiento_estimada: '2020-01-02', peso: 23, sexo: 'MACHO', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-02T19:43:48'), updatedAt: new Date('2022-08-24T02:54:30') },
      { id: 2, nombre: 'Pepe', status: 'REQUIERE_PADRINOS', especie: 'PERRO', raza: 'Mestizo', descripcion: 'Fue abandonado por su antigua familia, vagaba por las calles estaba lleno de parasitos', imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCr2tLFj5lGk_3MwhsXpMlzUsGr12iDLkCyA&usqp=CAU', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_025558_283Pepe.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_02566_493Pepe2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_025615_628Pepe3.jpg'] }, fundacion_id: 1, visible: true, fecha_nacimiento_estimada: '2018-01-05', peso: 20, sexo: 'HEMBRA', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-02T19:44:35'), updatedAt: new Date('2022-08-24T02:56:18') },
      { id: 3, nombre: 'Pancho', status: 'REQUIERE_PADRINOS', especie: 'GATO', raza: 'Mestizo', descripcion: 'Fue encontrado en condiciones deplorables, estaba deshidratado y con parásitos', imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSW6MXVMYMKVyf5m_GjYC3rsQBVAour5kAjmw&usqp=CAU', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_030235_215Pancho.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_030345_389Pancho2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_030354_422Pancho3.jpg'] }, fundacion_id: 1, visible: true, fecha_nacimiento_estimada: '2016-01-07', peso: 4, sexo: 'MACHO', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-02T19:45:08'), updatedAt: new Date('2022-08-24T03:03:58') },
      { id: 4, nombre: 'Kiki', status: 'REQUIERE_PADRINOS', especie: 'GATO', raza: 'Mestizo', descripcion: 'Estaba amarrada en el portal de una casa soportando la inclemencias del tiempo, lluvia y sol', imagen: 'https://www.fundacion-affinity.org/sites/default/files/el-gato-necesita-tener-acceso-al-exterior.jpg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_031130_556Kiki.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_031138_330Kiki2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_03122_931Kiki3.jpg'] }, fundacion_id: 1, visible: true, fecha_nacimiento_estimada: '2018-01-05', peso: 4, sexo: 'HEMBRA', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: false, createdAt: new Date('2022-03-02T19:45:42'), updatedAt: new Date('2022-08-24T03:12:06') },
      { id: 5, nombre: 'Max', status: 'REQUIERE_PADRINOS', especie: 'PERRO', raza: 'Mestizo', descripcion: 'Fue encontrado en condiciones deplorables, estaba deshidratado y con parásitos', imagen: 'https://estaticos.muyinteresante.es/media/cache/1140x_thumb/uploads/images/gallery/6124cf315cafe8c3101f8bab/perro-slide_0.jpg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_031421_226Max.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_031427_561Max2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_031434_476Max3.jpg'] }, fundacion_id: 1, visible: true, fecha_nacimiento_estimada: '2019-01-03', peso: 19, sexo: 'HEMBRA', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-02T19:46:24'), updatedAt: new Date('2022-08-24T03:14:36') },
      { id: 6, nombre: 'Laker', status: 'REQUIERE_PADRINOS', especie: 'PERRO', raza: 'Mestizo', descripcion: 'Fue abandonado por su antigua familia, vagaba por las calles estaba lleno de parasitos', imagen: 'https://www.eluniverso.com/resizer/y4Scc_nzI4QX7pgXMIhZpiIGBkg=/1190x670/smart/filters:quality(70)/cloudfront-us-east-1.images.arcpublishing.com/eluniverso/YKYSZKHYV5FOFJCC3ZFY42ABYE.jpg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_004047_60Laker.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_004055_299Laker2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_00413_839Laker3.jpg'] }, fundacion_id: 3, visible: true, fecha_nacimiento_estimada: '2018-01-05', peso: 21, sexo: 'HEMBRA', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: false, createdAt: new Date('2022-03-17T19:44:33'), updatedAt: new Date('2022-08-24T06:41:34') },
      { id: 7, nombre: 'Betina', status: 'REQUIERE_PADRINOS', especie: 'PERRO', raza: 'Pomeranea', descripcion: 'Estaba amarrada en el portal de una casa soportando la inclemencias del tiempo, lluvia y sol', imagen: 'https://www.petdarling.com/wp-content/uploads/2020/11/razas-de-perros.jpg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_002311_894Betina.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_002619_198Betina2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_002624_234Betina3.jpg'] }, fundacion_id: 3, visible: true, fecha_nacimiento_estimada: '2014-01-10', peso: 7, sexo: 'HEMBRA', enfermedades: 'Otitis', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-17T19:45:35'), updatedAt: new Date('2022-08-24T03:44:17') },
      { id: 8, nombre: 'Morita', status: 'REQUIERE_PADRINOS', especie: 'PERRO', raza: 'Bulldog', descripcion: 'Estaba siendo utilizada como una perra de crias', imagen: 'https://okdiario.com/img/2022/01/18/english-bulldog-5422018_1920-1-2-655x368.jpg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_015912_15Morita.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_015925_44Morita2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_020553_373Morita3.jpg'] }, fundacion_id: 3, visible: true, fecha_nacimiento_estimada: '2016-01-08', peso: 20, sexo: 'HEMBRA', enfermedades: 'Gastritis', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-17T19:58:20'), updatedAt: new Date('2022-08-24T02:05:56') },
      { id: 9, nombre: 'Luna', status: 'REQUIERE_PADRINOS', especie: 'PERRO', raza: 'Husky', descripcion: 'Estaba amarrada en el portal de una casa soportando la inclemencias del tiempo, lluvia y sol', imagen: 'https://www.razasdeperros.com/wp-content/uploads/2013/11/preciosa-hembra-de-husky-siberiano.jpg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_003258_880Luna.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_00334_186Luna2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_003527_905Luna3.jpg'] }, fundacion_id: 3, visible: true, fecha_nacimiento_estimada: '2018-01-05', peso: 24, sexo: 'HEMBRA', enfermedades: 'Otitis', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-17T20:00:09'), updatedAt: new Date('2022-08-24T00:35:31') },
      { id: 10, nombre: 'Roco', status: 'REQUIERE_PADRINOS', especie: 'GATO', raza: 'Mestizo', descripcion: 'Fue encontrado en condiciones deplorables, estaba deshidratado y con parásitos', imagen: 'https://www.zooplus.es/magazine/wp-content/uploads/2022/01/Depresion-en-gatos.jpeg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_021035_71Roco.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_021052_279Roco3.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_021157_377Roco2.jpg'] }, fundacion_id: 3, visible: true, fecha_nacimiento_estimada: '2016-01-08', peso: 4, sexo: 'HEMBRA', enfermedades: 'Alergias cutáneas', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-17T20:02:15'), updatedAt: new Date('2022-08-24T02:12:00') },
      { id: 11, nombre: 'Milo', status: 'REQUIERE_PADRINOS', especie: 'GATO', raza: 'Mestizo', descripcion: 'Fue abandonado por su antigua familia, vagaba por las calles estaba lleno de parasitos', imagen: 'https://www.diariodesevilla.es/2021/09/01/mascotas/Cosas-sabias-gatos_1606949991_143253883_667x375.jpg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_021516_604Milo.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_021525_847Milo2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_021534_476Milo3.jpg'] }, fundacion_id: 3, visible: true, fecha_nacimiento_estimada: '2020-01-02', peso: 4, sexo: 'HEMBRA', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-17T20:03:36'), updatedAt: new Date('2022-08-24T02:15:38') },
      { id: 12, nombre: 'Vicky', status: 'REQUIERE_PADRINOS', especie: 'GATO', raza: 'Mestizo', descripcion: 'Fue abandonado por su antigua familia, vagaba por las calles estaba lleno de parasitos', imagen: 'https://static.nationalgeographicla.com/files/styles/image_3200/public/01-cat-questions-nationalgeographic_1228126.jpg?w=1600&h=900', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_021856_765Vicky.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_02192_695Vicky2jpg.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_02199_342Vicky3.jpg'] }, fundacion_id: 3, visible: true, fecha_nacimiento_estimada: '2016-01-07', peso: 5, sexo: 'HEMBRA', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: false, createdAt: new Date('2022-03-17T20:05:01'), updatedAt: new Date('2022-08-24T02:19:11') },
      { id: 13, nombre: 'Bruno', status: 'REQUIERE_PADRINOS', especie: 'PERRO', raza: 'Mestizo', descripcion: 'Fue encontrado en condiciones deplorables, estaba deshidratado y con parásitos', imagen: 'https://www.elcolombiano.com/documents/10157/0/810x562/0c0/0d0/none/11101/LKHV/image_content_33647778_20190618090316.jpg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_024626_894Bruno.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_024631_432Bruno2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_024635_975Bruno3.jpg'] }, fundacion_id: 2, visible: true, fecha_nacimiento_estimada: '2018-01-05', peso: 20, sexo: 'HEMBRA', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-17T20:11:08'), updatedAt: new Date('2022-08-24T02:46:37') },
      { id: 14, nombre: 'Cookie', status: 'REQUIERE_PADRINOS', especie: 'PERRO', raza: 'Mestizo', descripcion: 'Fue abandonado por su antigua familia, vagaba por las calles estaba lleno de parasitos', imagen: 'https://cdn.onemars.net/sites/nutro_es_NkyIN_B9cV/image/nutrodog8_1615970900195.jpeg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_024934_591Cookie.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_024942_152Cookie2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_024947_459Cookie3jpg.jpg'] }, fundacion_id: 2, visible: true, fecha_nacimiento_estimada: '2019-01-04', peso: 21, sexo: 'HEMBRA', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-17T20:12:51'), updatedAt: new Date('2022-08-24T02:49:49') },
      { id: 15, nombre: 'Romeo', status: 'REQUIERE_PADRINOS', especie: 'GATO', raza: 'Mestizo', descripcion: 'Fue encontrado en condiciones deplorables, estaba deshidratado y con parásitos', imagen: 'https://www.tqpets.com.ec/wp-content/uploads/2018/08/personalidades-gatos-01.jpg', galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220824_025028_380Romeo.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_025036_190Romeo2.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220824_025043_341Romeo3.jpg'] }, fundacion_id: 2, visible: true, fecha_nacimiento_estimada: '2020-01-02', peso: 3, sexo: 'HEMBRA', enfermedades: 'Ninguna', fecha_rescate: '2022-01-05', fecha_registro: '2022-01-10', esterilizacion: true, vacunacion: true, desparasitacion: true, createdAt: new Date('2022-03-17T20:14:28'), updatedAt: new Date('2022-08-24T02:50:45') },
    ]);
    console.log(`  ${animals.length} animales`);

    // ---- MANADAS ----
    await db.Manada.bulkCreate([
      { id: 1, nombre: 'Alfa', userId: 1, status: true, createdAt: new Date('2022-03-04T05:27:17'), updatedAt: new Date('2022-08-24T07:33:38') },
      { id: 2, nombre: 'Beta5', userId: 1, status: true, createdAt: new Date('2022-03-05T02:55:13'), updatedAt: new Date('2022-08-24T07:31:36') },
      { id: 10, nombre: 'Puff', userId: 1, status: true, createdAt: new Date('2022-03-16T03:51:51'), updatedAt: new Date('2022-08-24T07:50:07') },
      { id: 24, nombre: 'Mispollitos', userId: 6, status: true, createdAt: new Date('2022-03-23T20:06:26'), updatedAt: new Date('2022-03-23T20:06:27') },
      { id: 26, nombre: 'Mis Perros', userId: 8, status: true, createdAt: new Date('2022-08-21T04:10:14'), updatedAt: new Date('2022-08-21T08:03:11') },
      { id: 27, nombre: 'Paw', userId: 9, status: true, createdAt: new Date('2022-08-21T13:42:35'), updatedAt: new Date('2022-08-21T13:42:36') },
      { id: 28, nombre: 'Michis', userId: 9, status: true, createdAt: new Date('2022-08-21T13:44:07'), updatedAt: new Date('2022-08-21T13:44:07') },
    ]);
    console.log('  7 manadas');

    // ---- SUSCRIPCIONES DE APADRINAMIENTO ----
    await db.SuscripcionPadrino.bulkCreate([
      { manadaId: 1, montoTotal: 8, statusSubscription: false },
      { manadaId: 2, montoTotal: 8, statusSubscription: false },
      { manadaId: 10, montoTotal: 5, statusSubscription: false },
      { manadaId: 24, montoTotal: 5, statusSubscription: false },
      { manadaId: 26, montoTotal: 12, statusSubscription: false },
      { manadaId: 27, montoTotal: 8, statusSubscription: false },
      { manadaId: 28, montoTotal: 5, statusSubscription: false },
    ]);
    console.log('  7 suscripciones_padrino');

    // ---- MANADA ANIMAL ----
    await db.ManadaAnimal.bulkCreate([
      { manada_id: 1, animal_id: 5, createdAt: new Date('2022-03-04T05:30:35'), updatedAt: new Date('2022-03-04T05:30:35') },
      { manada_id: 1, animal_id: 1, createdAt: new Date('2022-03-04T05:30:43'), updatedAt: new Date('2022-03-04T05:30:43') },
      { manada_id: 1, animal_id: 3, createdAt: new Date('2022-03-06T11:22:45'), updatedAt: new Date('2022-03-06T11:22:45') },
      { manada_id: 1, animal_id: 4, createdAt: new Date('2022-03-07T13:14:26'), updatedAt: new Date('2022-03-07T13:14:26') },
      { manada_id: 1, animal_id: 2, createdAt: new Date('2022-03-16T03:54:05'), updatedAt: new Date('2022-03-16T03:54:05') },
      { manada_id: 10, animal_id: 6, createdAt: new Date('2022-03-18T01:31:09'), updatedAt: new Date('2022-03-18T01:31:09') },
      { manada_id: 24, animal_id: 15, createdAt: new Date('2022-03-23T20:08:40'), updatedAt: new Date('2022-03-23T20:08:40') },
      { manada_id: 1, animal_id: 15, createdAt: new Date('2022-04-19T16:00:59'), updatedAt: new Date('2022-04-19T16:00:59') },
      { manada_id: 10, animal_id: 7, createdAt: new Date('2022-07-28T15:34:43'), updatedAt: new Date('2022-07-28T15:34:43') },
      { manada_id: 26, animal_id: 1, createdAt: new Date('2022-08-21T04:10:24'), updatedAt: new Date('2022-08-21T04:10:24') },
      { manada_id: 26, animal_id: 6, createdAt: new Date('2022-08-21T04:10:44'), updatedAt: new Date('2022-08-21T04:10:44') },
      { manada_id: 27, animal_id: 8, createdAt: new Date('2022-08-21T13:43:01'), updatedAt: new Date('2022-08-21T13:43:01') },
      { manada_id: 27, animal_id: 7, createdAt: new Date('2022-08-21T13:43:08'), updatedAt: new Date('2022-08-21T13:43:08') },
      { manada_id: 27, animal_id: 12, createdAt: new Date('2022-08-21T13:43:19'), updatedAt: new Date('2022-08-21T13:43:19') },
      { manada_id: 27, animal_id: 13, createdAt: new Date('2022-08-21T13:43:28'), updatedAt: new Date('2022-08-21T13:43:28') },
      { manada_id: 27, animal_id: 5, createdAt: new Date('2022-08-21T13:43:37'), updatedAt: new Date('2022-08-21T13:43:37') },
      { manada_id: 27, animal_id: 1, createdAt: new Date('2022-08-21T13:43:46'), updatedAt: new Date('2022-08-21T13:43:46') },
      { manada_id: 28, animal_id: 15, createdAt: new Date('2022-08-21T13:44:20'), updatedAt: new Date('2022-08-21T13:44:20') },
      { manada_id: 28, animal_id: 12, createdAt: new Date('2022-08-21T13:44:28'), updatedAt: new Date('2022-08-21T13:44:28') },
      { manada_id: 28, animal_id: 3, createdAt: new Date('2022-08-21T13:44:40'), updatedAt: new Date('2022-08-21T13:44:40') },
      { manada_id: 10, animal_id: 17, createdAt: new Date('2022-08-23T21:58:00'), updatedAt: new Date('2022-08-23T21:58:00') },
    ]);
    console.log('  21 manada_animal');

    // ---- CUENTAS BANCARIAS ----
    await db.CuentaBancaria.bulkCreate([
      { id: 1, banco: 'BOLIVARIANO', numero: '0021227878', tipo: 'AHORROS', nombre: 'LEOPETXXX', fundacion_id: 3, principal: true, updatedAt: new Date('2022-08-24T03:39:06') },
      { id: 2, banco: 'PICHINCHA', numero: '001545455', tipo: 'CORRIENTE', nombre: 'LEOPETYYY', fundacion_id: 3, principal: false, updatedAt: new Date('2022-08-24T03:39:06') },
      { id: 3, banco: 'PRODUBANCO', numero: '8885554545', tipo: 'AHORROS', nombre: 'XXXXX', fundacion_id: 2, principal: false },
      { id: 4, banco: 'SOLIDARIO', numero: '585545454', tipo: 'AHORROS', nombre: 'QQQQQQ', fundacion_id: 3, createdAt: new Date('2022-07-22T21:52:24'), updatedAt: new Date('2022-08-24T03:39:06'), principal: false },
      { id: 6, banco: 'GUAYAQUIL', numero: '1010101010', tipo: 'AHORROS', nombre: 'HUELLITAS', fundacion_id: 2, createdAt: new Date('2022-08-21T13:36:54'), updatedAt: new Date('2022-08-21T13:36:54'), principal: true },
      { id: 7, banco: 'BOLIVARIANO', numero: '2020202020', tipo: 'AHORROS', nombre: 'COLITAFELIZ1', fundacion_id: 1, createdAt: new Date('2022-08-21T13:39:18'), updatedAt: new Date('2022-08-21T13:40:02'), principal: true },
      { id: 8, banco: 'SOLIDARIO', numero: '3030303030', tipo: 'AHORROS', nombre: 'COLITAYYYY', fundacion_id: 1, createdAt: new Date('2022-08-21T13:39:59'), updatedAt: new Date('2022-08-21T13:40:02'), principal: false },
    ]);
    console.log('  7 cuentas bancarias');

    // ---- ACTUALIZACION ANIMAL ----
    const update = await db.ActualizacionAnimal.create({
      id: 15, animal_id: 6, fundacion_id: 3, fecha: new Date('2022-08-23'), descripcion: 'Veterinario y comida', estado_salud: 'Muy Bien', visible: true, createdAt: new Date('2022-08-23'), updatedAt: new Date('2022-08-23'),
      galeria: { fotos: ['https://leopet.sfo3.digitaloceanspaces.com/20220823_223710_457Aprende_Veterinaria_y_etologi__a.jpg', 'https://leopet.sfo3.digitaloceanspaces.com/20220823_223725_28576a22a_0eff54c94e97404196b01f45b77e3145_mv2.jpg'] },
    });
    console.log('  1 actualizacion_animal');

    // ---- NOTIFICACIONES ----
    await db.Notificacion.bulkCreate([
      { actualizacion_id: 15, usuario_id: 1, fundacion_id: 3, animal_id: 6, createdAt: new Date('2022-08-23'), updatedAt: new Date('2022-08-23'), visible: true, leido: true, fecha_leido: new Date('2022-08-23') },
      { actualizacion_id: 15, usuario_id: 8, fundacion_id: 3, animal_id: 6, createdAt: new Date('2022-08-23'), updatedAt: new Date('2022-08-23'), visible: true, leido: false },
    ]);
    console.log('  2 notificaciones');

    // ---- CALIFICACIONES DE ACTUALIZACIONES ----
    await db.RatingActualizacion.bulkCreate([
      { actualizacionId: 15, userId: 1, estrellas: 5, comentario: 'Excelente actualización' },
      { actualizacionId: 15, userId: 8, estrellas: 4, comentario: 'Muy buen reporte' },
    ]);
    console.log('  2 ratings_actualizacion');

    // ---- SOLICITUDES FUNDACION ----
    await db.SolicitudFundacion.bulkCreate([
      { ruc: '0101010134101', nombre: 'Colita feliz', direccion: 'Urdesa', telefono: '0911111111', email_contacto: 'colitafeliz@gmail.com', cedula_contacto: '0909090909', nombre_contacto: 'Cecilia', apellido_contacto: 'Castillo', comentarios: 'Fundación con 5 años de experiencia en rescate y adopción. Redes: @ColitaFelizGYE', estado: 'aprobada', notas_admin: 'Aprobación histórica: Fundación ya activa.', createdAt: new Date('2025-10-24T10:00:00'), updatedAt: new Date('2025-10-24T11:30:00') },
      { ruc: '0909887620001', nombre: 'Refugio Huellitas', direccion: 'Durán', telefono: '0922222222', email_contacto: 'refugiohuellitas@gmail.com', cedula_contacto: '0909090909', nombre_contacto: 'Ricardo', apellido_contacto: 'Silva', estado: 'aprobada', notas_admin: 'Aprobación histórica: Fundación ya activa.', createdAt: new Date('2025-10-23T08:45:00'), updatedAt: new Date('2025-10-24T12:00:00') },
      { ruc: '0909090064001', nombre: 'Leopet', direccion: 'Alborada', telefono: '0933333333', email_contacto: 'leopet@gmail.com', cedula_contacto: '0808080808', nombre_contacto: 'Cristian', apellido_contacto: 'Pincay', estado: 'aprobada', notas_admin: 'Aprobación histórica: Fundación ya activa.', createdAt: new Date('2025-10-22T14:15:00'), updatedAt: new Date('2025-10-24T13:45:00') },
      { ruc: '0994445556001', nombre: 'Amigos de las Mascotas SOS', direccion: 'Vía a Daule, Sector Industrial', telefono: '0977665544', email_contacto: 'amigosmascotas@sos.org', cedula_contacto: '0901020304', nombre_contacto: 'Fernando', apellido_contacto: 'Pérez', comentarios: 'Llevamos 3 años trabajando de forma independiente y queremos formalizarnos para recibir más ayuda. Instagram: @AmigosMascotasSOS', estado: 'rechazada', notas_admin: 'Rechazado por falta de documentación legal RUC al momento de la revisión.', createdAt: new Date('2025-10-22T08:00:00'), updatedAt: new Date('2025-10-23T11:15:00') },
      { ruc: '0996667778001', nombre: 'El Puente Animal', direccion: 'Calle Principal, Bloque C', telefono: '0933221100', email_contacto: 'elpuentefail@mail.com', cedula_contacto: '0905060708', nombre_contacto: 'Valeria', apellido_contacto: 'López', comentarios: 'Nuestro objetivo es ser un puente entre animales rescatados y hogares amorosos. Web: elpuenteanimal.org', estado: 'rechazada', notas_admin: 'Rechazado. La dirección de email de contacto es inválida o no responde a nuestros intentos de contactarnos.', createdAt: new Date('2025-10-24T11:35:00'), updatedAt: new Date('2025-10-24T15:50:00') },
      { ruc: '0992345678001', nombre: 'Patitas Felices Ecuador', direccion: 'Av. 9 de Octubre 405', telefono: '0987654321', email_contacto: 'contacto@patitasfelices.org', cedula_contacto: '0912345678', nombre_contacto: 'Ana', apellido_contacto: 'Gutiérrez', comentarios: 'Somos una organización nueva con muchas ganas de ayudar. Pueden ver nuestro trabajo en @PatitasFelicesEC en todas las redes.', estado: 'pendiente', createdAt: new Date('2025-10-22T10:30:00') },
      { ruc: '0991112223001', nombre: 'Rescate Animal Urbano', direccion: 'Calle Panamá 120, Piso 3', telefono: '0998765432', email_contacto: 'rescaturbano@info.com', cedula_contacto: '0923456789', nombre_contacto: 'Carlos', apellido_contacto: 'Méndez', comentarios: 'Enfocados en el rescate y esterilización de animales en zonas urbanas de Guayaquil. Facebook: /RescateUrbanoGYE', estado: 'pendiente', createdAt: new Date('2025-10-23T15:45:00') },
      { ruc: '0993334445001', nombre: 'Fuerza Callejera GYE', direccion: 'Centro Comercial Albán', telefono: '0965432109', email_contacto: 'fuerzacallejera@support.net', cedula_contacto: '0934567890', nombre_contacto: 'María', apellido_contacto: 'Rojas', comentarios: 'Ayuda a los que no tienen voz. Somos un grupo de voluntarios que necesita apoyo para seguir creciendo. Instagram: @FuerzaCallejera', estado: 'pendiente', createdAt: new Date('2025-10-24T09:12:00') },
      { ruc: '0995556667001', nombre: 'El Hogar de Simba', direccion: 'Km 5 Vía a la Costa', telefono: '0954321098', email_contacto: 'simbahogar@contacto.org', cedula_contacto: '0945678901', nombre_contacto: 'Pedro', apellido_contacto: 'Sánchez', comentarios: 'Especializados en el cuidado de gatos rescatados. Nuestro trabajo se puede ver en www.hogarsimba.com', estado: 'pendiente', createdAt: new Date('2025-10-22T21:00:00') },
      { ruc: '0997778889001', nombre: 'Ángeles Peludos', direccion: 'Urdesa Central, Calle 3era', telefono: '0943210987', email_contacto: 'angelespeludos@fund.org', cedula_contacto: '0956789012', nombre_contacto: 'Luisa', apellido_contacto: 'Vargas', comentarios: 'Buscamos crear un futuro mejor para todos los animales abandonados. Conoce más en @AngelesPeludosFundacion en Facebook.', estado: 'pendiente', createdAt: new Date('2025-10-23T18:55:00') },
    ]);
    console.log('  10 solicitudes_fundacion');

    console.log('\n=== SEED COMPLETADO ===');
    console.log(`Contraseña: ${PASSWORD}`);
    console.log('\nDonador:    donador@gmail.com');
    console.log('Admin:      admin@gmail.com');
    console.log('Fundación:  colitafeliz@gmail.com');
    console.log('Fundación:  refugiohuellitas@gmail.com');
    console.log('Fundación:  leopet@gmail.com');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.sequelize.close();
  }
}

seed();
