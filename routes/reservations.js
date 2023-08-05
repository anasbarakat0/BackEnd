const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Table } = require('./tables');
const { Restaurant } = require('./restaurants');
const userAuth = require('../middleware/user.auth');
const restauth = require('../middleware/restaurant.auth');


const Reservation = mongoose.model('Reservation', {
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
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
    reservationType: String,
    isPending: Boolean,
    isAccepted: Boolean
});

// show all reservations
router.get('/bookings/:restaurantsId', restauth, async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantsId);
        if (!restaurant) {
            return res.status(404).json({ message: 'المطعم غير موجود' });
        }
        const startOfWeek = moment().startOf('week');
        const endOfWeek = moment().endOf('week');

        const bookings = await Reservation.find({
            restaurantId: restaurant._id,
            reservationDate: { $gte: startOfWeek, $lte: endOfWeek }
        });
        res.status(200).json(bookings);
    } catch (err) {
        console.error(error);
        res.status(500).json({ message: err.message });
    }
});

//show all reservations user
router.get('/reservations', userAuth, async (req, res) => {
    try {
        const reservations = await Reservation.find({ userId: req.user.id });
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ اثناء جلب الحجوزات' });
    }
});

// show reservation
router.get('/reservations/:reservationId', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.reservationId);
        res.json(reservation);
    } catch (err) {
        res.status(500).json(err);
    }
});

// add reservation
router.post('/api/restaurants/:restaurantId/tables/:tableId/reservations',userAuth, async (req, res) => {
    try {
        const table = await Table.findById(req.params.tableId);
        const ccurrentdate = moment().startOf('day');
        if (table.isReserved && moment(table.reservationDate).isSame(ccurrentdate,'day')) {
            return res.status(400).json({ message: 'الطاولة محجوزة بالفعل' });
        }
        const reservationDate = moment(req.body.reservationDate, 'MM-DD HH:mm').toDate();
        const minDate = moment().add(30, 'days');
        if (!moment(reservationDate).isBetween(moment(), minDate)) {
            return res.status(400).json({ message: 'لا يمكن الحجز بعد 30 يوما من الان' });
        }
        const reservation = new Reservation({
            userId:req.user.id,
            restaurantId: req.params.restaurantId,
            tableId: req.params.tableId,
            customerName: req.body.customerName,
            customerNumber: req.body.customerNumber,
            reservationDate: reservationDate,
            numberOfPeople: req.body.numberOfPeople,
            reservationType: req.body.reservationType,
            isPending: true,
            isAccepted: false
        });

        const reservationTime = moment(reservation.reservationDate);
        const dayofweek = reservationTime.format('dddd').toLowerCase();
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        console.log(dayofweek);
        if (!restaurant) {
            return res.status(404).json({ message: 'المطعم غير موجود ' });
        }
        const reservationtemp = moment(reservationTime.format('HH:mm'), 'HH:mm');
        const openTime = moment(restaurant.workingHours.open, 'HH:mm');
        const closeTime = moment(restaurant.workingHours.close, 'HH:mm');
        if (!reservationtemp.isBetween(openTime, closeTime)) {
            return res.status(400).json({ message: 'حجز خارج ساعات العمل ' });
        }
        const savedReservation = await reservation.save();
        const updatedtable = await Table.findByIdAndUpdate(req.params.tableId, { isReserved: true , reservationDate:reservationDate }, { new: true });
        res.status(201).json({ message: 'تمت عملية الحجز بنجاح', savedReservation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

 // قبول حجز معين
router.put('/api/restaurants/:restaurantId/tables/:tableId/reservations/:reservationId/accept', restauth, async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(req.params.reservationId, { isPending: false, isAccepted: true }, { new: true });
        if (!reservation) {
            return res.status(404).json({ message: 'الحجز غير موجود' });
        }

        res.json({ message: 'تم قبول الحجز بنجاح', reservation });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ أثناء قبول الحجز' });
    }
});

 // رفض حجز معين
router.put('/api/restaurants/:restaurantId/tables/:tableId/reservations/:reservationId/reject', restauth, async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(req.params.reservationId, { isPending: false, isAccepted: false }, { new: true });
        if (!reservation) {
            return res.status(404).json({ message: 'الحجز غير موجود' });
        }
        const updatedtable = await Table.findByIdAndUpdate(req.params.tableId,{isReserved:false},{new:true});

        res.json({ message: 'تم رفض الحجز بنجاح', reservation });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ أثناء رفض الحجز' });
    }
});

// update reservation
router.put('/reservations/:reservationId', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(req.params.reservationId, req.body, { new: true });
        res.status(200).json({message:'تم تعديل الحجز'});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// delete reservation
router.delete('/reservations/:reservationId', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.reservationId);
        res.status(200).json({reservation, message:'reservation has been deleted'});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
