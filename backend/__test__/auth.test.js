// backend/__tests__/auth.test.js (Versión completa, corregida y limpia)

const { app, pool } = require('../app');
const request = require('supertest');

describe('API de Autenticación', () => {

    // Hook de Jest: se ejecuta una vez después de TODAS las pruebas en este archivo
    afterAll(async () => {
        // Cierra la conexión a la base de datos para que Jest pueda terminar limpiamente
        await pool.end();
    });

    // Suite de pruebas para el endpoint de REGISTRO
    describe('POST /api/auth/register', () => {
        
        // Generamos datos únicos para el nuevo usuario en cada ejecución de la suite de pruebas
        const uniqueId = Date.now();
        const newUser = {
            Nombre: 'Usuario de Prueba',
            username: `testuser_${uniqueId}`,
            Email: `test_${uniqueId}@test.com`,
            Celular: '3001234567',
            password: 'password123',
            Rol: 'Vendedor'
        };

        // Prueba del "camino feliz": un registro exitoso
        test('Debería registrar un nuevo usuario exitosamente (201)', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(newUser);
            
            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe('Usuario registrado con éxito');
        });

        // Aislamos la prueba que sabemos que genera un error en la consola
        describe('cuando el usuario ya existe', () => {
            let consoleErrorSpy;

            // Antes de ejecutar la prueba de duplicado, interceptamos console.error
            beforeAll(() => {
                // Reemplazamos la función real con una vacía para que no imprima en la consola del test
                consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            });

            // Después de la prueba, restauramos la función original de console.error
            afterAll(() => {
                consoleErrorSpy.mockRestore();
            });
            
            // Prueba del "camino triste": intentar registrar un usuario duplicado
            test('Debería fallar al intentar registrar un usuario con un email o username ya existente (409)', async () => {
                // Intentamos registrar OTRA VEZ con los mismos datos
                const response = await request(app)
                    .post('/api/auth/register')
                    .send(newUser);

                expect(response.statusCode).toBe(409); // 409 Conflict
                expect(response.body.message).toBe('El Email o el Nombre de Usuario ya existen');
            });
        });
    });

    // Suite de pruebas para el endpoint de LOGIN
    describe('POST /api/auth/login', () => {

        test('Debería fallar con un password incorrecto (401)', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    loginIdentifier: 'admin', // Asume que 'admin' existe
                    password: 'password_totalmente_incorrecto'
                });
            
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe('Credenciales inválidas');
        });

        test('Debería fallar con un usuario que no existe (401)', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    loginIdentifier: 'usuario_que_no_existe_jamas_999',
                    password: 'password123'
                });
            
            expect(response.statusCode).toBe(401);
        });
    });
});