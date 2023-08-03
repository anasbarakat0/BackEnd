const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const restauth = require('../middleware/restaurant.auth');

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

// show all tables of restaurant
router.get('/tables/:restaurantsId', async(req,res)=> {
    try{
        const tables = await Table.find({
            restaurantId: req.params.restaurantsId
        });
        res.status(200).json(tables);
    }catch(error){
        res.status(500).json({message: error.message});
    }
});
// add table
router.post('/tables',restauth, async (req, res) => {
    try {
        const { restaurantId, tableNumber, tableCapacity, isReserved } = req.body;

        const table = new Table({ restaurantId, tableNumber, tableCapacity, isReserved });
        await table.save();
        res.status(201).json(table);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// show tables
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
// update table
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
// show table
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
// update status about table
router.put('/restaurants/:restaurantId/tables/:tableId', async(req,res) =>{
    try{
        const updatedtable = await Table.findByIdAndUpdate(req.params.tableId,{ isReserved:true},{new: true});
        res.status(200).json(updatedtable);
    }catch(err){
        res.status(500).json({message:err.message});
    }
});
// return idtable
router.get('/restaurant/:restaurantId/tables/:number',async (req,res) => {
    const tableNumber = parseInt(req.params.number);
    const table = await findTableByNumber(tableNumber);
    if(table){
        res.status(200).json({ id: table._id});
    } else{
        res.status(404).json({message:'table not found'});
    }
});
 
async function findTableByNumber(number){
    try{
        const table = await Table.findOne({ tableNumber: number});
        return table;
    }catch(error){
        console.error(error);
        return null;
    }
}

module.exports.Table = Table;
module.exports.tablesRouter = router;