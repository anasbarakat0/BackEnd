const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const tableschema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    tableNumber: Number,
    tableCapacity: Number,
    isReserved: Boolean
});
const Table = mongoose.model('Table', tableschema)


router.post('/tables', async (req, res) => {
    try {
        const { restaurantId, tableNumber, tableCapacity, isReserved } = req.body;

        const table = new Table({ restaurantId, tableNumber, tableCapacity, isReserved });
        await table.save();
        res.status(201).json(table);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/tables/:id', async (req, res) => {
    try {
        const table = await Table.findById(req.params.id).populate({ path: 'restaurantId', options: { strictpopulate: false } });
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        res.json(table);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/tables/:id', async (req, res) => {
    try {
        const { restaurantId, tableNumber, tableCapacity, isReserved } = req.body;
        const table = await Table.findByIdAndUpdate(req.params.id, { restaurantId, tableNumber, tableCapacity, isReserved }, { new: true });
        if (!table) {
            return res.status(404).json({ error: 'table not found' });
        }
        res.json(table);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/tables/:id', async (req, res) => {
    try {
        const table = await Table.findById(req.params.id).populate({ path: 'restaurantId', options: { strictpopulate: false } });
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        res.json(table);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;