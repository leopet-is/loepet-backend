const fs = require('fs');
const path = require('path');
const LocalStorage = require('../../lib/Storage/LocalStorage');

describe('LocalStorage', () => {
  const UPLOAD_DIR = path.join(__dirname, '../../uploads');
  const TEST_FILE_DIR = path.join(__dirname, '../fixtures');
  let testFilePath;

  beforeAll(() => {
    // Crear directorio de fixtures si no existe
    if (!fs.existsSync(TEST_FILE_DIR)) {
      fs.mkdirSync(TEST_FILE_DIR, { recursive: true });
    }

    // Crear archivo de prueba
    testFilePath = path.join(TEST_FILE_DIR, 'test-image.jpg');
    fs.writeFileSync(testFilePath, 'fake image content');
  });

  afterAll(() => {
    // Limpiar directorio uploads completo
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      files.forEach((file) => {
        const filePath = path.join(UPLOAD_DIR, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Limpiar archivo de prueba
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    // Limpiar directorio de fixtures
    if (fs.existsSync(TEST_FILE_DIR)) {
      try {
        fs.rmdirSync(TEST_FILE_DIR);
      } catch (e) {
        // Ignorar si no está vacío
      }
    }
  });

  afterEach(() => {
    // Limpiar archivos subidos después de cada test
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      files.forEach((file) => {
        const filePath = path.join(UPLOAD_DIR, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });

  describe('updateFile', () => {
    it('should upload a file and return its URL', async () => {
      const fileName = 'test-image.jpg';
      const location = await LocalStorage.updateFile(fileName, testFilePath);

      expect(location).toBeDefined();
      expect(location).toContain('/uploads/');
      expect(location).toContain('test-image.jpg');

      // Verificar que el archivo fue copiado
      const uploadedFiles = fs.readdirSync(UPLOAD_DIR);
      expect(uploadedFiles.length).toBe(1);
      expect(uploadedFiles[0]).toContain('test-image.jpg');
    });

    it('should add a timestamp prefix to the uploaded file', async () => {
      const fileName = 'test-image.jpg';
      await LocalStorage.updateFile(fileName, testFilePath);

      const uploadedFiles = fs.readdirSync(UPLOAD_DIR);
      expect(uploadedFiles[0]).toMatch(/^\d{8}_\d{6}_\d{3}_test-image\.jpg$/);
    });

    it('should create the upload directory if it does not exist', async () => {
      // Verificar que el archivo de test existe antes de borrar uploads
      expect(fs.existsSync(testFilePath)).toBe(true);

      // Guardar archivos existentes y eliminar el directorio
      if (fs.existsSync(UPLOAD_DIR)) {
        const files = fs.readdirSync(UPLOAD_DIR);
        files.forEach((file) => {
          const filePath = path.join(UPLOAD_DIR, file);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        });
        fs.rmdirSync(UPLOAD_DIR);
      }

      // Verificar que el directorio ya no existe
      expect(fs.existsSync(UPLOAD_DIR)).toBe(false);

      const fileName = 'test-image.jpg';
      await LocalStorage.updateFile(fileName, testFilePath);

      // Verificar que el directorio fue creado
      expect(fs.existsSync(UPLOAD_DIR)).toBe(true);
    });

    it('should reject when source file does not exist', async () => {
      const fileName = 'test-image.jpg';
      const nonExistentPath = path.join(TEST_FILE_DIR, 'non-existent.jpg');

      await expect(LocalStorage.updateFile(fileName, nonExistentPath)).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      // Recrear directorio uploads si no existe
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      // Primero subir un archivo
      const fileName = 'test-image.jpg';
      await LocalStorage.updateFile(fileName, testFilePath);

      const uploadedFiles = fs.readdirSync(UPLOAD_DIR);
      const uploadedFileName = uploadedFiles[uploadedFiles.length - 1]; // Usar el último archivo

      // Ahora eliminar el archivo
      const result = await LocalStorage.deleteFile(uploadedFileName);

      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(UPLOAD_DIR, uploadedFileName))).toBe(false);
    });

    it('should not fail when trying to delete non-existent file', async () => {
      const result = await LocalStorage.deleteFile('non-existent-file.jpg');
      expect(result.success).toBe(true);
    });
  });
});
