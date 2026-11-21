// Seleccionar o crear la base de datos
use("megashop_db");

// Limpiar colecciones previas para evitar duplicados en pruebas
db.clientes.drop();
db.productos.drop();
db.repartidores.drop();
db.pedidos.drop();
db.historial_estados.drop();
db.carritos.drop();

const distritos = ["Los Olivos", "San Martín de Porres", "Independencia", "Comas", "Miraflores", "San Isidro"];
const categorias = ["Comida Rápida", "Bebidas", "Abarrotes", "Postres", "Farmacia"];
const estados = ["pendiente", "preparando", "en_camino", "entregado", "cancelado"];
const metodosPago = ["Tarjeta", "Yape", "Plin", "Efectivo"];

// 1. Insertar 40 Clientes
const clientesDocs = [];
for (let i = 1; i <= 40; i++) {
  clientesDocs.push({
    nombre: `Cliente Megashop ${i}`,
    email: `cliente${i}@megashop.com`,
    telefono: `+51987000${String(i).padStart(3, "0")}`,
    direcciones: [
      {
        etiqueta: "Casa",
        calle: `Av. Principal ${100 + i * 10}`,
        distrito: distritos[i % distritos.length],
        referencia: `Cerca al cruce ${i}`
      }
    ],
    fecha_registro: new Date(2026, (i % 10), (i % 28) + 1),
    activo: true
  });
}
const resClientes = db.clientes.insertMany(clientesDocs);
const clienteIds = Object.values(resClientes.insertedIds);

// 2. Insertar 30 Productos
const productosDocs = [];
for (let i = 1; i <= 30; i++) {
  const precio = (10 + (i * 2.5)).toFixed(2);
  productosDocs.push({
    sku: `PROD-${String(i).padStart(3, "0")}`,
    nombre: `Producto Delivery ${i}`,
    categoria: categorias[i % categorias.length],
    precio: NumberDecimal(precio),
    stock: 50 + (i * 5),
    disponible: true
  });
}
const resProductos = db.productos.insertMany(productosDocs);
const productoIds = Object.values(resProductos.insertedIds);

// 3. Insertar 15 Repartidores
const repartidoresDocs = [];
for (let i = 1; i <= 15; i++) {
  repartidoresDocs.push({
    nombre: `Repartidor ${i}`,
    telefono: `+51911000${String(i).padStart(3, "0")}`,
    vehiculo: i % 2 === 0 ? "Moto" : "Bicicleta",
    placa: i % 2 === 0 ? `MTO-${100 + i}` : "N/A",
    zona: i % 2 === 0 ? "Lima Norte" : "Lima Centro",
    disponible: true
  });
}
const resRepartidores = db.repartidores.insertMany(repartidoresDocs);
const repartidorIds = Object.values(resRepartidores.insertedIds);

// 4. Insertar 60 Pedidos
const pedidosDocs = [];
for (let i = 1; i <= 60; i++) {
  const prodIdx = i % productoIds.length;
  const precioUnit = 10 + ((prodIdx + 1) * 2.5);
  const cantidad = (i % 3) + 1;
  const total = (precioUnit * cantidad).toFixed(2);
  const dia = (i % 20) + 1;

  pedidosDocs.push({
    codigo_pedido: `PED-2026-${String(i).padStart(4, "0")}`,
    cliente_id: clienteIds[i % clienteIds.length],
    repartidor_id: repartidorIds[i % repartidorIds.length],
    fecha_pedido: new Date(2026, 10, dia, 12 + (i % 10), 15, 0),
    estado_actual: estados[i % estados.length],
    direccion_entrega: `Av. Principal ${100 + (i % 40) * 10}, ${distritos[i % distritos.length]}`,
    items: [
      {
        producto_id: productoIds[prodIdx],
        nombre: `Producto Delivery ${prodIdx + 1}`,
        cantidad: cantidad,
        precio_unitario: NumberDecimal(precioUnit.toFixed(2))
      }
    ],
    total: NumberDecimal(total),
    metodo_pago: metodosPago[i % metodosPago.length]
  });
}
const resPedidos = db.pedidos.insertMany(pedidosDocs);
const pedidoIds = Object.values(resPedidos.insertedIds);

// 5. Insertar 80 Registros de Historial de Estados
const historialDocs = [];
for (let i = 0; i < 80; i++) {
  const pedIdx = i % pedidoIds.length;
  historialDocs.push({
    pedido_id: pedidoIds[pedIdx],
    codigo_pedido: `PED-2026-${String(pedIdx + 1).padStart(4, "0")}`,
    estado: estados[i % estados.length],
    timestamp: new Date(2026, 10, (pedIdx % 20) + 1, 13, (i % 59), 0),
    observacion: `Actualización automática #${i + 1}`
  });
}
db.historial_estados.insertMany(historialDocs);

// 6. Insertar 25 Carritos de Compras
const carritosDocs = [];
const estadosCarrito = ["activo", "abandonado", "convertido"];
for (let i = 0; i < 25; i++) {
  const prodIdx = i % productoIds.length;
  const precioUnit = 10 + ((prodIdx + 1) * 2.5);
  const cantidad = (i % 3) + 1;
  const subtotal = (precioUnit * cantidad).toFixed(2);

  carritosDocs.push({
    cliente_id: clienteIds[i % clienteIds.length],
    items: [
      {
        producto_id: productoIds[prodIdx],
        nombre: `Producto Delivery ${prodIdx + 1}`,
        cantidad: cantidad,
        precio_unitario: NumberDecimal(precioUnit.toFixed(2))
      }
    ],
    subtotal: NumberDecimal(subtotal),
    estado: estadosCarrito[i % estadosCarrito.length],
    ultima_actualizacion: new Date(2026, 10, (i % 20) + 1, 18, 30, 0)
  });
}
db.carritos.insertMany(carritosDocs);

// Crear índices de optimización y TTL
db.pedidos.createIndex({ cliente_id: 1 });
db.pedidos.createIndex({ fecha_pedido: -1 });
db.clientes.createIndex({ email: 1 }, { unique: true });
db.carritos.createIndex({ cliente_id: 1 });
db.carritos.createIndex({ ultima_actualizacion: 1 }, { expireAfterSeconds: 604800 });

// Verificación de conteo total
const totalRegistros =
  db.clientes.countDocuments() +
  db.productos.countDocuments() +
  db.repartidores.countDocuments() +
  db.pedidos.countDocuments() +
  db.historial_estados.countDocuments() +
  db.carritos.countDocuments();

print("Carga completada. Total de registros insertados: " + totalRegistros);