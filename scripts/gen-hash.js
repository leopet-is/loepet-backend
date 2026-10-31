const bcrypt = require('bcrypt');

bcrypt.hash('Leopet2025!', 10).then((h) => console.log(h));
