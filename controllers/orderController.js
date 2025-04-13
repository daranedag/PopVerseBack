import { connectDb } from '../config/db.js';

const isTest = process.env.NODE_ENV === 'test';
let db;
// Obtener todas las órdenes
export const getOrders = async (req, res) => {
    db = await connectDb();
    try {
        let orders;
        if (isTest) {
            orders = await db.all('SELECT * FROM orders');
        } else {
            const result = await db.query('SELECT * FROM orders');
            orders = result.rows;
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error al obtener órdenes:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Obtener una orden por ID
export const getOrder = async (req, res) => {
    const orderId = req.params.id;
    try {
        db = await connectDb();
        let orderDetails;
        if (isTest) {
            order = await db.get('select od.*, p.name from order_details od join products p on od.product_id=p.id where od.order_id= ?', [orderId]);
        } else {
            const result = await db.query('select od.*, p.name from order_details od join products p on od.product_id=p.id where od.order_id= $1', [orderId]);
            orderDetails = result.rows
        }

        if (!orderDetails || orderDetails.length === 0) {
            return res.status(404).json({ message: 'Detalles de la orden no encontrados' });
        }

        res.status(200).json(orderDetails);
    } catch (error) {
        console.error('Error al obtener orden:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

export const createOrder = async (req, res) => {
    const { user_id, product_ids, total_price, status } = req.body;
  
    try {
        db = await connectDb();
        if (isTest) {
            await db.run(
                'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
                [user_id, JSON.stringify(product_ids), total_price, status]
            );
        } else {
            const result = await db.query(
                'INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING id',
                [user_id, total_price, status]
            );
            const orderId = result.rows[0].id;

            // Insertar en order_details
            for (const product of product_ids) {
                const { product_id, quantity, price, discount = 0 } = product;
                const subtotal = quantity * price * (1 - discount / 100);
                await db.query(
                    'INSERT INTO order_details (order_id, product_id, quantity, subtotal) VALUES ($1, $2, $3, $4)',
                    [orderId, product_id, quantity, subtotal]
                );
            }
        }
    
        res.status(201).json({ message: 'Orden creada' });
    } catch (error) {
        console.error('Error al crear orden:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Actualizar una orden
export const updateOrder = async (req, res) => {
    const orderId = req.params.id;
    const { product_ids, total_price, status } = req.body;
  
    try {
        db = await connectDb();
        if (isTest) {
            await db.run(
                'UPDATE orders SET product_ids = ?, total_price = ?, status = ? WHERE id = ?',
                [JSON.stringify(product_ids), total_price, status, orderId]
            );
        } else {
            await db.query(
                'UPDATE orders SET product_ids = $1, total_price = $2, status = $3 WHERE id = $4',
                [JSON.stringify(product_ids), total_price, status, orderId]
            );
        }
  
        res.status(200).json({ message: `Orden ${orderId} actualizada` });
    } catch (error) {
        console.error('Error al actualizar orden:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};