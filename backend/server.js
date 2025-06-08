require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, // Ahora usa 'svi' desde .env
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- MIDDLEWARE DE AUTENTICACIÓN (Sin cambios) ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; // Guardamos los datos del usuario del token (id, email, rol)
        next();
    });
};


// --- RUTAS DE AUTENTICACIÓN (Modificadas para la tabla `usuario`) ---

// REGISTRAR UN NUEVO USUARIO
app.post('/api/auth/register', async (req, res) => {
    try {
        // Ahora también esperamos 'username' desde el frontend
        const { Nombre, username, Email, Celular, password, Rol } = req.body;
        if (!username || !Email || !password || !Nombre) {
            return res.status(400).json({ message: 'Nombre, username, Email y contraseña son requeridos' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Añadimos 'username' a la consulta INSERT
        const sql = 'INSERT INTO usuario (Nombre, username, Email, Celular, password_hash, Rol) VALUES (?, ?, ?, ?, ?, ?)';
        await pool.query(sql, [Nombre, username, Email, Celular, hashedPassword, Rol || 'Vendedor']);

        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error("Error al registrar:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            // El error puede ser por email duplicado O por username duplicado
            return res.status(409).json({ message: 'El Email o el Nombre de Usuario ya existen' });
        }
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// INICIAR SESIÓN
app.post('/api/auth/login', async (req, res) => {
    try {
        // El frontend ahora enviará un campo genérico: 'loginIdentifier'
        const { loginIdentifier, password } = req.body;
        if (!loginIdentifier || !password) {
            return res.status(400).json({ message: 'El identificador y la contraseña son requeridos' });
        }

        // ¡LA MAGIA ESTÁ AQUÍ! La consulta ahora busca en ambas columnas.
        const sql = 'SELECT * FROM usuario WHERE Email = ? OR username = ?';
        // Pasamos el mismo identificador para ambos '?'
        const [users] = await pool.query(sql, [loginIdentifier, loginIdentifier]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = users[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        // El resto del código para crear el token no cambia...
        const payload = { id: user.id_usuario, email: user.Email, rol: user.Rol, username: user.username };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ token: accessToken });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});


// --- RUTAS DE LA API DE INVENTARIO (Modificadas) ---

// OBTENER TODOS LOS PRODUCTOS
app.get('/api/productos', authenticateToken, async (req, res) => {
    try {
        // Consulta adaptada a tu tabla 'productos'
        const [rows] = await pool.query('SELECT id_producto, Nombre, Distribuidor, Precio, Stock FROM productos ORDER BY Nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// --- RUTA DE VENTAS (Completamente nueva y transaccional) ---

// REGISTRAR UNA NUEVA VENTA
app.post('/api/ventas', authenticateToken, async (req, res) => {
    // El frontend ahora debe enviar un objeto más complejo:
    // { id_cliente: 1, productos: [ { id_producto: 4, cantidad: 2 }, { id_producto: 2, cantidad: 1 } ] }
    const { id_cliente, productos } = req.body;
    const id_usuario_vendedor = req.user.id; // Obtenemos el ID del vendedor desde el token JWT

    if (!id_cliente || !productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ message: 'Datos de venta incompletos o inválidos.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // <-- INICIAMOS LA TRANSACCIÓN

        // 1. Crear la venta en la tabla 'ventas' para obtener el id_venta
        const ventaSql = 'INSERT INTO ventas (id_usuario, id_cliente, Fecha_venta) VALUES (?, ?, NOW())';
        const [ventaResult] = await connection.query(ventaSql, [id_usuario_vendedor, id_cliente]);
        const id_venta_creada = ventaResult.insertId;

        // 2. Recorrer los productos del "carrito" y guardarlos en 'detalle_venta' y actualizar el stock
        for (const producto of productos) {
            // Obtenemos el precio actual del producto y verificamos el stock
            const [productoData] = await connection.query('SELECT Precio, Stock FROM productos WHERE id_producto = ? FOR UPDATE', [producto.id_producto]);

            if (productoData.length === 0 || productoData[0].Stock < producto.cantidad) {
                // Si un producto no existe o no hay stock, revertimos todo
                await connection.rollback();
                return res.status(400).json({ message: `Stock insuficiente para el producto ID ${producto.id_producto}` });
            }
            
            const precio_unitario = productoData[0].Precio;

            // Insertar en detalle_venta
            const detalleSql = 'INSERT INTO detalle_venta (id_venta, id_producto, Cantidad, Precio_unitario) VALUES (?, ?, ?, ?)';
            await connection.query(detalleSql, [id_venta_creada, producto.id_producto, producto.cantidad, precio_unitario]);

            // Actualizar el stock del producto
            const updateStockSql = 'UPDATE productos SET Stock = Stock - ? WHERE id_producto = ?';
            await connection.query(updateStockSql, [producto.cantidad, producto.id_producto]);
        }

        await connection.commit(); // <-- SI TODO FUE BIEN, CONFIRMAMOS LOS CAMBIOS
        res.status(201).json({ message: 'Venta registrada con éxito', id_venta: id_venta_creada });

    } catch (error) {
        if (connection) await connection.rollback(); // <-- SI ALGO FALLÓ, REVERTIMOS TODO
        console.error("Error al registrar venta:", error);
        res.status(500).json({ message: 'Error en el servidor al procesar la venta.' });
    } finally {
        if (connection) connection.release(); // Liberamos la conexión al pool
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});