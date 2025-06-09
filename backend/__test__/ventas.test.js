const { app, pool } = require('../app');
const request = require('supertest');

describe('API de Ventas', () => {

    let token;
    let clienteId;
    let productoId;
    let stockInicial;

    beforeAll(async () => {
        // 1. Obtenemos token
        const resLogin = await request(app).post('/api/auth/login').send({ loginIdentifier: 'admin', password: 'adminpass' });
        token = resLogin.body.token;

        // 2. CREAMOS un cliente de prueba para asegurar que exista
        const resClienteNuevo = await request(app)
            .post('/api/clientes')
            .set('Authorization', `Bearer ${token}`)
            .send({
                Nombre_cliente: `Cliente de Prueba ${Date.now()}`,
                Celular_cliente: '1234567890',
                Email_cliente: `cliente_${Date.now()}@test.com`
            });
        clienteId = resClienteNuevo.body.id_cliente; // Usamos el ID del cliente recién creado

        // 3. Obtenemos un producto existente con stock suficiente
        const resProductos = await request(app).get('/api/productos').set('Authorization', `Bearer ${token}`);
        const productoConStock = resProductos.body.find(p => p.Stock > 5);
        if (!productoConStock) {
            throw new Error("No se encontró un producto con suficiente stock para las pruebas.");
        }
        productoId = productoConStock.id_producto;
        stockInicial = productoConStock.Stock;
    });

    afterAll(async () => {
        await pool.end();
    });

    // --- PRUEBAS ---

    test('Debería registrar una venta exitosamente y decrementar el stock del producto (201)', async () => {
        const cantidadAVender = 2;

        // 1. Realizamos la venta
        const resVenta = await request(app)
            .post('/api/ventas')
            .set('Authorization', `Bearer ${token}`)
            .send({
                id_cliente: clienteId,
                productos: [{
                    id_producto: productoId,
                    cantidad: cantidadAVender
                }]
            });
        
        expect(resVenta.statusCode).toBe(201);
        expect(resVenta.body.message).toBe('Venta registrada con éxito');

        // 2. Verificamos que el stock se haya actualizado correctamente
        const resProductoDespues = await request(app)
            .get('/api/productos')
            .set('Authorization', `Bearer ${token}`);
        
        const productoVendido = resProductoDespues.body.find(p => p.id_producto === productoId);
        const stockEsperado = stockInicial - cantidadAVender;

        expect(productoVendido.Stock).toBe(stockEsperado);
    });

    test('Debería fallar si se intenta vender más stock del disponible (400)', async () => {
        const cantidadExcesiva = stockInicial + 1; // Intentamos vender uno más del que hay

        const resVentaFallida = await request(app)
            .post('/api/ventas')
            .set('Authorization', `Bearer ${token}`)
            .send({
                id_cliente: clienteId,
                productos: [{
                    id_producto: productoId,
                    cantidad: cantidadExcesiva
                }]
            });
        
        expect(resVentaFallida.statusCode).toBe(400); // Bad Request
        expect(resVentaFallida.body.message).toContain('Stock insuficiente');
    });

    test('Debería obtener el historial de ventas (200)', async () => {
    // Esta prueba asume que la venta del test anterior ya se realizó
        const response = await request(app)
            .get('/api/ventas')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        // Verificamos que la respuesta tenga al menos una venta (la que creamos)
        expect(response.body.length).toBeGreaterThan(0);
    });

    test('Debería obtener el detalle de una venta específica (200)', async () => {
        // Primero creamos una nueva venta para tener un ID con el cual trabajar
        const resVenta = await request(app)
            .post('/api/ventas')
            .set('Authorization', `Bearer ${token}`)
            .send({
                id_cliente: clienteId,
                productos: [{ id_producto: productoId, cantidad: 1 }]
            });
        const nuevaVentaId = resVenta.body.id_venta;

        // Ahora pedimos el detalle de esa venta
        const resDetalle = await request(app)
            .get(`/api/ventas/${nuevaVentaId}`)
            .set('Authorization', `Bearer ${token}`);
        
        expect(resDetalle.statusCode).toBe(200);
        expect(resDetalle.body).toBeInstanceOf(Array);
        expect(resDetalle.body[0]).toHaveProperty('Nombre'); // El detalle debe tener el nombre del producto
    });

    test('Debería devolver 404 para el detalle de una venta inexistente', async () => {
        const idVentaInexistente = 999999;
        const response = await request(app)
            .get(`/api/ventas/${idVentaInexistente}`)
            .set('Authorization', `Bearer ${token}`);
        
        expect(response.statusCode).toBe(404);
    });

});