const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const { error } = require('console');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(__dirname, "../uploads");
        cb(null, dest)
    },
    filename: (req, file, cb) => {
        const uniquename = Date.now() + '-' + Math.round(Math.round() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniquename}${ext}`);
    }
})

const upload = multer({ storage: storage });

const Restaurantschema = new mongoose.Schema({
    logo: String,
    randomCode: Number,
    name: String,
    address: String,
    phoneNumber: String,
    mobileNumber: String,
    Images: [String],
    workingHours: String,
    description: String,
    categories: ["category 1", "category 2"],
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

const Restaurant = mongoose.model('Restaurant', Restaurantschema);



function generateRandomCode() {
    let randomCode = '';
    for (let i = 0; i < 8; i++) {
        randomCode += Math.floor(Math.random() * 10);
    }
    return randomCode;
}

function setExpirationDate() {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 2); // تحديد مدة الصلاحية لمدة يومين
    return expirationDate;
}

// uploads pic
router.post('/upload', upload.array('images', 100), (req, res) => {
    const images = req.files;

    const imagesNames = images.map(image => image.filename)

    res.status(200).json({ message: 'تم تحميل الصورة بنجاح!', imagesUrls: imagesNames });
});


// login restaurant
router.post('/login/resturant', async (req, res) => {
    const randomCode = generateRandomCode();
    const expirationDate = setExpirationDate();
    // التحقق من وجود المستخدم في قاعدة البيانات
    try {
        const resturant = await Restaurant.findOne({ randomCode });

        if (!resturant) {

            return res.status(404).json({ message: 'User not found' });
        }



        // إنشاء التوكن باستخدام JWT
        const token = jwt.sign({ randomCode: resturant.randomCode }, 'secret_key');
        res.json({ token });

    } catch (err) {

        return res.status(500).json({ message: 'Internal Server Error' });
    }

});


router.post('/signup/resturant', async (req, res) => {
    const randomCode = generateRandomCode();
    const expirationDate = setExpirationDate();

    const { name, address, phoneNumber, mobileNumber, workingHours, description } = req.body;

    // إنشاء مستخدم جديد
    const restaurant = new Restaurant({ randomCode, name, address, phoneNumber, mobileNumber, workingHours, description, expirationDate });
    try {
        // حفظ المستخدم في قاعدة البيانات
        await restaurant.save();

        res.json({ message: 'User registered successfully' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// حماية الوصول باستخدام التوكن
router.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'Protected route' });
});

// Middleware للتحقق من صحة التوكن
function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, 'secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = decoded;

        // التحقق من صلاحية الرقم العشوائي
        User.findOne({ randomCode: req.user.randomCode }, (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Internal Server Error' });
            }

            if (!user || user.expirationDate < new Date()) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            next();
        });
    });
}

//filter
router.get('/restaurants/filter', async (req, res) => {
    try {
        let filters = {};

        // تحديد المعايير للفلترة
        if (req.query.address) {
            filters.address = req.query.address;
        }

        if (req.query.categories) {
            filters.categories = req.query.categories.split(',');
        }

        if (req.query.rating) {
            filters.rating = { $gte: req.query.rating };
        }

        // تنفيذ الفلترة
        const restaurants = await Restaurant.find(filters);
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: 'Failed to filter restaurants' });
    }
});

// restaurant
router.post('/restaurant', async (req, res) => {
    const { name, address, phoneNumber, mobileNumber, workingHours, description, categories, menu, tables } = req.body;
    const { logo, images } = req.body;

    const updatedMenu = [];
    if (menu) {
        for (let i = 0; i < menu.length; i++) {
            const item = menu[i];
            const updatedFood = [];
            if (item.food) {
                for (let j = 0; j < item.food.length; j++) {
                    const foodItem = item.food[j];
                    const updatedFoodItem = {
                        ...foodItem,
                        foodImage: req.files[`menu.${i}.food.${j}.foodImage`] ? req.files[`menu.${i}.food.${j}.foodImage`][0] : null
                    };
                    updatedFood.push(updatedFoodItem);
                }
                const updatedItem = {
                    ...item,
                    food: updatedFood
                };
                updatedMenu.push(updatedItem);
            }
        }
        try {
            const restaurant = await Restaurant.create({
                logo,
                images,
                name,
                address,
                phoneNumber,
                mobileNumber,
                workingHours,
                description,
                categories,
                menu: updatedMenu,
                tables
            });
            res.status(200).json({ message: 'تمت اضافة المطعم', restaurant });
        } catch (error) {
            console.error('حدث خطا في اضافة المطعم', error);
            res.status(500).json({ message: 'حدث خطا في اضافة المطعم' });
        }
    }
});


router.get('/api/restaurants/:id', authenticateTokenForRestaurant, async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        res.send(restaurant);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.delete('/api/restaurants/:id', (req, res) => {
    Restaurant.findByIdAndDelete(req.params.id, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(restaurant);
        }
    });
});

router.put('/restaurant/:id', async (req, res) => {
    const { id } = req.params;
    const { name, address, phoneNumber, mobileNumber, workingHours, description, categories, menu, tables } = req.body;
    const { logo, images } = req.body;

    const updatedMenu = [];
    if (menu) {
        for (let i = 0; i < menu.length; i++) {
            const item = menu[i];
            const updatedFood = [];
            if (item.food) {
                for (let j = 0; j < item.food.length; j++) {
                    const foodItem = item.food[j];
                    const updatedFoodItem = {
                        ...foodItem,
                        foodImage: req.files[`menu.${i}.food.${j}.foodImage`] ? req.files[`menu.${i}.food.${j}.foodImage`][0] : null
                    };
                    updatedFood.push(updatedFoodItem);
                }
                const updatedItem = {
                    ...item,
                    food: updatedFood
                };
                updatedMenu.push(updatedItem);
            }
        }
    }
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(id, {
            logo,
            images,
            name,
            address,
            phoneNumber,
            mobileNumber,
            workingHours,
            description,
            categories,
            menu: updatedMenu,
            tables
        }, { new: true });

        if (!restaurant) {
            return res.status(404).json({ message: 'المطعم غير موجود' });
        }

        res.status(200).json({ message: 'تم تحديث معلومات المطعم', restaurant });
    } catch (error) {
        console.error('حدث خطا في تحديث معلومات المطعم', error);
        res.status(500).json({ message: 'حدث خطا في تحديث معلومات المطعم' });
    }
});

// router.put('/api/restaurants/:id', (req, res) => {
//     Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, restaurant) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send(restaurant);
//         }
//     });
// });

// menu 
router.post('/api/restaurants/:id/menu', (req, res) => {
    Restaurant.findById(req.params.id, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            restaurant.menu.push(req.body);
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

router.put('/api/restaurants/:restaurantId/menu/:menuId', (req, res) => {
    Restaurant.findById(req.params.restaurantId, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const menu = restaurant.menu.id(req.params.menuId);
            menu.set(req.body);
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

router.get('/api/restaurants/:restaurantId/menu/:menuId', (req, res) => {
    Restaurant.findById(req.params.restaurantId, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const menu = restaurant.menu.id(req.params.menuId);
            res.send(menu);
        }
    });
});

router.delete('/api/restaurants/:restaurantId/menu/:menuId', (req, res) => {
    Restaurant.findById(req.params.restaurantId, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const menu = restaurant.menu.id(req.params.menuId).remove();
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
// profile restaurants
router.get('/api/restaurants/:restaurantId', authenticateTokenForRestaurant, async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        res.send(restaurant);
    } catch (err) {
        res.status(500).send(err);
    }
});

// search 
router.get('/restaurant/search', async (req, res) => {
    const { name } = req.query;
    try {
        const restaurants = await Restaurant.find({ name: { $regex: name, $options: 'i' } });
        res.status(200).json({ message: 'تم العثور على المطاعم', restaurants });
    } catch (error) {
        console.error('حدث خطا في عملية البحث', error);
        res.status(500).json({ message: 'حدث خطا في عملية البحث' });
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
}
function authenticateTokenForRestaurant(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, restaurant) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.restaurant = restaurant;
        next();
    });
}

module.exports = router;
