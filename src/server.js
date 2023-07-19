const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { SERVER_PORT, SERVER_HOST } = process.env;
const api_route = `/api/v1/muebles`;
const {
    connectToCollection,
    disconnectFromMongo
} = require('../connection_db.js');
const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.get(`${api_route}`, async (req, res) => {
    try {
        let muebles;
        const collection = await connectToCollection('muebles');
        const { categoria, precio_gte, precio_lte } = req.query;

        if (categoria) {
            muebles = collection.find({categoria}).sort({nombre: 1});
        }
        if (precio_gte) {
            muebles = collection.find({precio: {$gte: Number(precio_gte)}}).sort({precio: 1});
        }
        if (precio_lte) {
            muebles = collection.find({precio: {$lte: Number(precio_lte)}}).sort({precio: -1});
        }
        if (!precio_gte && !precio_lte && !categoria) {
            muebles = collection.find();
        }
        const mueblesToArray = await muebles.toArray();
        res.status(200).send({payload: mueblesToArray });
    } catch (err) {
        res.status(500).json({'message': 'Se ha generado un error en el servidor'});
    } finally {
        await disconnectFromMongo();
    }
});
server.get(`${api_route}/:codigo`, async (req, res) => {
    try {
        const { codigo: codigoParam } = req.params;
        const collection = await connectToCollection('muebles');
        const muebleByCodigo = await collection.findOne({codigo: Number(codigoParam)});

        const result = muebleByCodigo === null ? {'message': 'El código no corresponde a un mueble registrado'} : {payload: muebleByCodigo};
        if (!muebleByCodigo) {
            return res.status(400).send(result);
        }
        res.status(200).send(result);
    } catch (err) {
        res.status(500).json({'message': 'Se ha generado un error en el servidor'});
    } finally {
        await disconnectFromMongo();
    }
});
server.post(`${api_route}`, async (req, res) => {
    const {nombre, precio, categoria } = req.body;
    try {
        if (!nombre || !precio || !categoria) {
            return res.status(400).send({'message': 'Faltan datos relevantes'});
        }
        const collection = await connectToCollection('muebles');
        await collection.insertOne({codigo: 16, nombre, precio: Number(precio), categoria});
        const getNewItem = await collection.findOne({codigo: 16});
        return res.status(201).send({'message': 'Registro creado', 'payload': getNewItem});
    } catch (err) {
        return res.status(500).send({'error': 'Se ha generado un error en el servidor'});
    } finally {
        disconnectFromMongo();
    }
});
server.delete(`${api_route}/:codigo`, async (req, res) => {
    const {codigo: codigoParam } = req.params;
    try {
        const collection = await connectToCollection('muebles');
        const itemToDelete = await collection.findOne({codigo: Number(codigoParam)});

        if (!itemToDelete) {
            return res.status(400).send({'message': 'El código no corresponde a un mueble registrado'});
        }
        await collection.deleteOne({codigo: Number(codigoParam)});
        return res.status(200).send({'message': 'Registro eliminado'});
    } catch (err) {
        res.status(500).send({'error': 'Se ha generado un error en el servidor'});
    } finally {
        disconnectFromMongo();
    }
});
server.put(`${api_route}/:codigo`, async (req, res) => {
    const {codigo: codigoParam} = req.params;
    const {nombre, precio: precioBody, categoria } = req.body;

    try {
        if (!nombre || !precioBody || !categoria) {
            return res.status(400).send({'message': 'Faltan datos relevantes'});
        }
        const collection = await connectToCollection('muebles');
        const itemToUpdate = await collection.findOne({codigo: Number(codigoParam)});

        if (itemToUpdate === null) {
            return res.status(400).send({'message': 'El código no corresponde a un mueble registrado'});
        }
        // await collection.findOneAndUpdate({codigo: Number(codigoParam)}, {$set: {nombre, precio: Number(precio), categoria }});
        await collection.findOneAndUpdate({codigo: Number(codigoParam)}, {$set: {
            nombre,
            precio: Number(precioBody),
            categoria

        }});

        const updatedProd = await collection.findOne({codigo: Number(codigoParam)});

        return res.status(200).send({'message': 'Registro actualizado',
            payload: updatedProd});
    } catch (err) {
        console.log(err.message);
        res.status(500).send({'message': 'Se ha generado un error en el servidor'});
    } finally {
        disconnectFromMongo();
    }
});
server.use('*', (req, res) => {
    res.status(404).json({'error': 'not found'});
});
server.listen(SERVER_PORT, SERVER_HOST, () => console.log(`Running on ${SERVER_PORT}`));
