const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


const Reservation = mongoose.model('Reservation', {
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    tableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant.tables'
    },
    customerName: String,
    customerNumber: String,
    reservationDate: Date,
    numberOfPeople: Number,
    reservationType: String
});

// show reservation
router.get('/api/restaurants/:restaurantId/tables/:tableId/reservations/:reservationId', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.reservationId);
        res.json(reservation);
    } catch (err) {
        res.status(500).json(err);
    }
});

// add reservation
router.post('/api/restaurants/:restaurantId/tables/:tableId/reservations', async (req, res) => {
    try {
        const reservation = new Reservation({
            restaurantId: req.params.restaurantId,
            tableId: req.params.tableId,
            customerName: req.body.customerName,
            customerNumber: req.body.customerNumber,
            reservationDate: req.body.reservationDate,
            numberOfPeople: req.body.numberOfPeople,
            reservationType: req.body.reservationType
        });
        const savedReservation = await reservation.save();
        res.status(201).json({ message:'تمت عملية الحجز بنجاح' ,savedReservation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// update reservation
router.put('/api/restaurants/:restaurantId/tables/:tableId/reservations/:reservationId', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(req.params.reservationId, req.body, { new: true });
        res.json(reservation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// delete reservation
router.delete('/api/restaurants/:restaurantId/tables/:tableId/reservations/:reservationId', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.reservationId);
        res.json(reservation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
