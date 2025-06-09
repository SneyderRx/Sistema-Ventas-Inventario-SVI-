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
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { Nombre, username, Email, Celular, password, Rol } = req.body;
        if (!username || !Email || !password || !Nombre) {
            return res.status(400).json({ message: 'Nombre, username, Email y contraseña son requeridos' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO usuario (Nombre, username, Email, Celular, password_hash, Rol) VALUES (?, ?, ?, ?, ?, ?)';
        await pool.query(sql, [Nombre, username, Email, Celular, hashedPassword, Rol || 'Vendedor']);
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error("Error al registrar:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El Email o el Nombre de Usuario ya existen' });
        }
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { loginIdentifier, password } = req.body;
        if (!loginIdentifier || !password) {
            return res.status(400).json({ message: 'El identificador y la contraseña son requeridos' });
        }
        const sql = 'SELECT * FROM usuario WHERE Email = ? OR username = ?';
        const [users] = await pool.query(sql, [loginIdentifier, loginIdentifier]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const user = users[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const payload = { id: user.id_usuario, email: user.Email, rol: user.Rol, username: user.username };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token: accessToken });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// --- RUTA PARA OBTENER TODOS LOS CLIENTES (GET) ---
app.get('/api/clientes', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id_cliente, Nombre_cliente FROM cliente ORDER BY Nombre_cliente ASC');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// --- RUTA PARA CREAR (REGISTRAR) UN NUEVO CLIENTE (POST) ---
app.post('/api/clientes', authenticateToken, async (req, res) => {
    try {
        const { Nombre_cliente, Celular_cliente, Email_cliente } = req.body;
        if (!Nombre_cliente || !Celular_cliente || !Email_cliente) {
            return res.status(400).json({ message: 'Nombre, Celular y Email del cliente son requeridos.' });
        }
        const sql = 'INSERT INTO cliente (Nombre_cliente, Celular_cliente, Email_cliente) VALUES (?, ?, ?)';
        const [result] = await pool.query(sql, [Nombre_cliente, Celular_cliente, Email_cliente]);
        
        // Devolvemos el cliente recién creado con su nuevo ID
        res.status(201).json({
            id_cliente: result.insertId,
            Nombre_cliente,
            Celular_cliente,
            Email_cliente
        });
    } catch (error) {
        console.error("Error al registrar cliente:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});


// --- RUTAS DE LA API PARA PRODUCTOS (CRUD) ---

// OBTENER TODOS LOS PRODUCTOS (GET)
app.get('/api/productos', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id_producto, Nombre, Distribuidor, Precio, Stock, Fecha_arribo FROM productos ORDER BY Nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// **AQUÍ ESTÁ LA NUEVA RUTA PARA CREAR (AGREGAR) UN PRODUCTO (POST)**
app.post('/api/productos', authenticateToken, async (req, res) => {
    try {
        const { Nombre, Distribuidor, Fecha_arribo, Precio, Stock } = req.body;
        if (!Nombre || !Distribuidor || !Fecha_arribo || Precio === undefined || Stock === undefined) {
            return res.status(400).json({ message: 'Todos los campos son requeridos.' });
        }
        const sql = 'INSERT INTO productos (Nombre, Distribuidor, Fecha_arribo, Precio, Stock) VALUES (?, ?, ?, ?, ?)';
        const [result] = await pool.query(sql, [Nombre, Distribuidor, Fecha_arribo, Precio, Stock]);
        res.status(201).json({ id_producto: result.insertId, ...req.body });
    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// ACTUALIZAR (EDITAR) UN PRODUCTO (PUT)
app.put('/api/productos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { Nombre, Precio, Stock } = req.body; // El formulario de editar simple solo actualiza estos campos
        if (!Nombre || Precio === undefined || Stock === undefined) {
            return res.status(400).json({ message: 'Nombre, Precio y Stock son requeridos.' });
        }
        const sql = 'UPDATE productos SET Nombre = ?, Precio = ?, Stock = ? WHERE id_producto = ?';
        const [result] = await pool.query(sql, [Nombre, Precio, Stock, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.json({ message: 'Producto actualizado con éxito.' });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// ELIMINAR UN PRODUCTO (DELETE)
app.delete('/api/productos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM productos WHERE id_producto = ?';
        const [result] = await pool.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.json({ message: 'Producto eliminado con éxito.' });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'No se puede eliminar el producto porque ya ha sido parte de una venta.' });
        }
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});


// --- RUTA DE VENTAS ---
app.post('/api/ventas', authenticateToken, async (req, res) => {
    const { id_cliente, productos } = req.body;
    const id_usuario_vendedor = req.user.id;
    if (!id_cliente || !productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ message: 'Datos de venta incompletos o inválidos.' });
    }
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const ventaSql = 'INSERT INTO ventas (id_usuario, id_cliente, Fecha_venta) VALUES (?, ?, NOW())';
        const [ventaResult] = await connection.query(ventaSql, [id_usuario_vendedor, id_cliente]);
        const id_venta_creada = ventaResult.insertId;
        for (const producto of productos) {
            const [productoData] = await connection.query('SELECT Precio, Stock FROM productos WHERE id_producto = ? FOR UPDATE', [producto.id_producto]);
            if (productoData.length === 0 || productoData[0].Stock < producto.cantidad) {
                await connection.rollback();
                return res.status(400).json({ message: `Stock insuficiente para el producto ID ${producto.id_producto}` });
            }
            const precio_unitario = productoData[0].Precio;
            const detalleSql = 'INSERT INTO detalle_venta (id_venta, id_producto, Cantidad, Precio_unitario) VALUES (?, ?, ?, ?)';
            await connection.query(detalleSql, [id_venta_creada, producto.id_producto, producto.cantidad, precio_unitario]);
            const updateStockSql = 'UPDATE productos SET Stock = Stock - ? WHERE id_producto = ?';
            await connection.query(updateStockSql, [producto.cantidad, producto.id_producto]);
        }
        await connection.commit();
        res.status(201).json({ message: 'Venta registrada con éxito', id_venta: id_venta_creada });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error al registrar venta:", error);
        res.status(500).json({ message: 'Error en el servidor al procesar la venta.' });
    } finally {
        if (connection) connection.release();
    }
});


// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});