// backend/__tests__/productos.test.js (Versión corregida sin Roles)

const request = require('supertest');
const { app, pool } = require('../app'); // Importamos nuestra app de Express

// Describimos el conjunto de pruebas para la API de Productos
describe('API de Productos - Sin Roles', () => {

    let token; // Solo necesitamos un token válido, no importa el rol

    // Antes de que todas las pruebas se ejecuten, iniciamos sesión una vez para obtener un token.
    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                // IMPORTANTE: Usa las credenciales de CUALQUIER usuario válido que tengas
                loginIdentifier: 'SneyderRx', 
                password: 'sneydil112'
            });
        
        // Verificamos que el login es exitoso antes de continuar
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');

        // Guardamos el token para usarlo en las siguientes pruebas
        token = res.body.token;
    });

    afterAll(async () => {
        await pool.end();
    });

    // --- PRUEBAS ---

    // Prueba 1: Verificar que un usuario no autenticado no puede acceder
    test('Debería denegar el acceso sin un token (401)', async () => {
        const response = await request(app).get('/api/productos');
        expect(response.statusCode).toBe(401); // 401 Unauthorized
    });

    // Prueba 2: Verificar que un usuario autenticado puede obtener la lista de productos
    test('Debería obtener la lista de productos para un usuario autenticado (200)', async () => {
        const response = await request(app)
            .get('/api/productos')
            .set('Authorization', `Bearer ${token}`); // Usamos el token que obtuvimos
        
        expect(response.statusCode).toBe(200); // 200 OK
        expect(response.body).toBeInstanceOf(Array); // La respuesta debe ser un array
    });

    // Prueba 3: Probar el ciclo completo de vida de un producto (Crear, Actualizar, Eliminar)
    test('Debería permitir el ciclo CRUD completo para un producto', async () => {
        // --- 1. CREAR el producto ---
        const productoNuevo = {
            Nombre: `Producto Jest ${Date.now()}`,
            Distribuidor: 'Pruebas Automatizadas',
            Fecha_arribo: '2025-06-08',
            Precio: 199.99,
            Stock: 50
        };

        const resCrear = await request(app)
            .post('/api/productos')
            .set('Authorization', `Bearer ${token}`)
            .send(productoNuevo);
        
        expect(resCrear.statusCode).toBe(201); // 201 Created
        expect(resCrear.body).toHaveProperty('id_producto');
        const nuevoProductoId = resCrear.body.id_producto;

        // --- 2. ACTUALIZAR el producto ---
        const productoActualizado = {
            Nombre: 'Producto Jest Actualizado',
            Precio: 249.99,
            Stock: 45
        };

        const resActualizar = await request(app)
            .put(`/api/productos/${nuevoProductoId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(productoActualizado);
        
        expect(resActualizar.statusCode).toBe(200);
        expect(resActualizar.body.message).toBe('Producto actualizado con éxito.');

        // --- 3. ELIMINAR el producto ---
        const resEliminar = await request(app)
            .delete(`/api/productos/${nuevoProductoId}`)
            .set('Authorization', `Bearer ${token}`);
            
        expect(resEliminar.statusCode).toBe(200);
        expect(resEliminar.body.message).toBe('Producto eliminado con éxito.');
    });

    test('Debería devolver un error 400 si faltan campos al crear un producto', async () => {
        const productoIncompleto = {
            Nombre: 'Producto Incompleto'
            // Faltan deliberadamente Distribuidor, Fecha_arribo, Precio y Stock
        };

        const response = await request(app)
            .post('/api/productos')
            .set('Authorization', `Bearer ${token}`)
            .send(productoIncompleto);
        
        expect(response.statusCode).toBe(400); // Esperamos un error de "petición incorrecta"
        expect(response.body.message).toBe('Todos los campos son requeridos.'); // Verificamos el mensaje
    });

    test('Debería devolver un error 404 al intentar actualizar un producto que no existe', async () => {
        const idInexistente = 999999; // Un ID que sabemos que no está en la DB
        const productoActualizado = {
            Nombre: 'Producto Fantasma',
            Precio: 1,
            Stock: 1
        };

        const response = await request(app)
            .put(`/api/productos/${idInexistente}`)
            .set('Authorization', `Bearer ${token}`)
            .send(productoActualizado);
            
        expect(response.statusCode).toBe(404); // Esperamos un error de "no encontrado"
    });

    test('Debería devolver un error 404 al intentar eliminar un producto que no existe', async () => {
        const idInexistente = 999999;

        const response = await request(app)
            .delete(`/api/productos/${idInexistente}`)
            .set('Authorization', `Bearer ${token}`);
            
        expect(response.statusCode).toBe(404);
    });
});