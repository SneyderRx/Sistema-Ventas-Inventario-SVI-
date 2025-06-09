// backend/__tests__/clientes.test.js

const { app, pool } = require('../app');
const request = require('supertest');

describe('API de Clientes', () => {
    let token;

    // Obtenemos un token antes de todas las pruebas
    beforeAll(async () => {
        const res = await request(app).post('/api/auth/login').send({ loginIdentifier: 'admin', password: 'adminpass' });
        token = res.body.token;
    });

    // Cerramos la conexión al final
    afterAll(async () => {
        await pool.end();
    });

    // --- PRUEBAS ---

    test('No debería permitir obtener clientes sin un token (401)', async () => {
        const response = await request(app).get('/api/clientes');
        expect(response.statusCode).toBe(401);
    });

    test('Debería crear un nuevo cliente y luego encontrarlo en la lista', async () => {
        const uniqueId = Date.now();
        const nuevoCliente = {
            Nombre_cliente: `Cliente Test ${uniqueId}`,
            Celular_cliente: '5551234567',
            Email_cliente: `cliente_${uniqueId}@test.com`
        };

        // 1. CREAR el cliente
        const resCrear = await request(app)
            .post('/api/clientes')
            .set('Authorization', `Bearer ${token}`)
            .send(nuevoCliente);

        expect(resCrear.statusCode).toBe(201);
        expect(resCrear.body).toHaveProperty('id_cliente');
        const nuevoClienteId = resCrear.body.id_cliente;

        // 2. OBTENER la lista de todos los clientes
        const resObtener = await request(app)
            .get('/api/clientes')
            .set('Authorization', `Bearer ${token}`);

        // 3. VERIFICAR que el cliente recién creado está en la lista
        expect(resObtener.statusCode).toBe(200);
        expect(resObtener.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id_cliente: nuevoClienteId, Nombre_cliente: nuevoCliente.Nombre_cliente })
            ])
        );
    });

    test('Debería devolver un error 400 si faltan datos al crear un cliente', async () => {
        const clienteIncompleto = {
            Nombre_cliente: 'Fantasma'
            // Faltan Celular y Email
        };

        const response = await request(app)
            .post('/api/clientes')
            .set('Authorization', `Bearer ${token}`)
            .send(clienteIncompleto);

        expect(response.statusCode).toBe(400);
    });
});