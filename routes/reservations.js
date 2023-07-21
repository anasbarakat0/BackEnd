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

router.get('/api/restaurants/:restaurantId/tables/:tableId/reservations/:reservationId', (req, res) => {
    Reservation.findById(req.params.reservationId, (err, reservation) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(reservation);
        }
    });
});

router.post('/api/restaurants/:restaurantId/tables/:tableId/reservations', (req, res) => {
    const reservation = new Reservation({
        restaurantId: req.params.restaurantId,
        tableId: req.params.tableId,
        customerName: req.body.customerName,
        customerNumber: req.body.customerNumber,
        reservationDate: req.body.reservationDate,
        numberOfPeople: req.body.numberOfPeople,
        reservationType: req.body.reservationType
    });
    reservation.save((err, savedReservation) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(savedReservation);
        }
    });
});

router.put('/api/restaurants/:restaurantId/tables/:tableId/reservations/:reservationId', (req, res) => {
    Reservation.findByIdAndUpdate(req.params.reservationId, req.body, { new: true }, (err, reservation) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(reservation);
        }
    });
});


router.delete('/api/restaurants/:restaurantId/tables/:tableId/reservations/:reservationId', (req, res) => {
    Reservation.findByIdAndDelete(req.params.reservationId, (err, reservation) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(reservation);
        }
    });
});

module.exports = router;
