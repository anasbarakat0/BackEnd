const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Restaurantschema = new mongoose.Schema({
    logoImage: String,
    randomCode: Number,
    name: String,
    address: String,
    phoneNumber: String,
    mobileNumber: String,
    restaurantImages: [String],
    workingHours: String,
    description: String,
    categories:["category 1", "category 2"],
    expirationDate: Date,
    menu: [{
        menuName: String,
        food: [{
            foodImage: String,
            foodName: String,
            foodDescription: String,
            foodCategory: String,
            foodPrice: Number
        }]
    }],
    tables: [{
        tableNumber: Number,
        tableCapacity: Number,
        isReserved: Boolean
    }]
});

 


router.post('/api/restaurants/:id/tables', (req, res) => {
    Restaurant.findById(req.params.id, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            restaurant.tables.push(req.body);
            restaurant.save((err, updatedRestaurant) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(updatedRestaurant);
                }
            });
        }
    });
});

router.put('/api/restaurants/:restaurantId/tables/:tableId', (req, res) => {
    Restaurant.findById(req.params.restaurantId, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const table = restaurant.tables.id(req.params.tableId);
            table.set(req.body);
            restaurant.save((err, updatedRestaurant) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(updatedRestaurant);
                }
            });
        }
    });
});

router.get('/api/restaurants/:restaurantId/tables/:tableId', (req, res) => {
    Restaurant.findById(req.params.restaurantId, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const table = restaurant.tables.id(req.params.tableId);
            res.send(table);
        }
    });
});

router.delete('/api/restaurants/:restaurantId/tables/:tableId', (req, res) => {
    Restaurant.findById(req.params.restaurantId, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const table = restaurant.tables.id(req.params.tableId).remove();
            restaurant.save((err, updatedRestaurant) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(updatedRestaurant);
                }
            });
        }
    });
});

module.exports = router;