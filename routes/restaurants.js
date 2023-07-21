const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../uploads')
    },
    filename: (req, file, cb) => {
        const uniquename = Date.now() + '-' + Math.round(Math.round() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniquename + ext);
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


function generateRandomNumber() {
    const length = 8;
    let result = '';
    const characters = '0123456789';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return parseInt(result);
}
// login restaurant
router.post('/login', (req, res) => {
    const randomCode = generateRandomNumber();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 2);

    // إنشاء مستخدم جديد
    const user = new User({ randomCode, expirationDate });

    // حفظ المستخدم في قاعدة البيانات
    user.save((err) => {
        if (err) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        // إنشاء التوكن باستخدام JWT
        const token = jwt.sign({ randomCode: user.randomCode }, 'secret_key');

        res.json({ token });
    });
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
router.get('/categories', (req, res) => {
    // عملية الفلترة
    const filteredCategories = categories.filter((category) => {
        return category === "category 1" || category === "category 2";
    });

    res.json(filteredCategories);
});
//filter
router.get('/restaurants/filter', async (req, res) => {
    try {
        let filters = {};

        // تحديد المعايير للفلترة
        if (req.query.city) {
            filters.city = req.query.city;
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
// restaurants
// router.post('/api/restaurants', upload.fields([
//     {name:'logo' ,maxcount:1},
//      {name:'images', maxcount:5}
//     ]),async (req, res) => {
//         const{name,address, phoneNumber ,mobileNumber , workingHours ,description , categories }= req.body ;
//         const logo = req.files['logo'][0].path;
//         const images = req.files['images'].map(file => file.path);
//         console.log("test");
//         try{
//             const restaurant =await Restaurant.create({
//                 logo,
//                 images,
//                 name,
//                 address,
//                 phoneNumber,
//                 mobileNumber,
//                 workingHours,
//                 description,
//                 categories


//             });
//             res.status(200).json({message:'تمت اضافة المطعم',restaurant});
//         } catch(error){
//             console.error('حدث خطا في اضافة المطعم', error);
//             res.status(500).json({message: 'حدث خطا في اضافة المطعم'});
//         }});



//     const restaurant = new Restaurant(req.body);
//     restaurant.save((err, savedRestaurant) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.status(201).send(savedRestaurant);
//         }
//     });
// });

router.get('/api/restaurants/:id', authenticateToken, (req, res) => {
    Restaurant.findById(req.params.id, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(restaurant);
        }
    });
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

router.put('/api/restaurants/:id', (req, res) => {
    Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(restaurant);
        }
    });
});
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
router.get('/api/restaurants/:restaurantId', (req, res) => {
    Restaurant.findById(req.params.restaurantId, (err, restaurant) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(restaurant);
        }
    });
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

module.exports = router;

// app.post('/upload', upload.single('image'), (req, res) => {
//     const image = req.file;

//     res.status(200).json({ message: 'تم تحميل الصورة بنجاح!', imageUrl: image.path });
// });

// app.use('./uploads', express.static('uploads'));

// router.post('/uploadLogo', upload.single('logo'), async (req, res) => {
//     try {
//         const { filename, path, mimetype } = req.file;


//         const restaurant = new Restaurant({
//             logo: filename,

//         });



//         res.status(200).json({ message: 'Logo uploaded successfully!' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to upload logo!' });
//     }
// });

router.post('/uploadImages', upload.array('images', 5), async (req, res) => {
    try {
        const files = req.files.map(file => file.filename);


        const restaurant = new Restaurant({
            images: files,
        });



        res.status(200).json({ message: 'Images uploaded successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload images!' });
    }
});



router.post('/restaurant', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'images', maxCount: 5 }
]), (req, res) => {
    const { name, address, phoneNumber, mobileNumber, workingHours, description, categories, menu, tables } = req.body;

    const logo = req.files['logo'][0];
    const images = req.files['images'];

    try {
        const restaurant = Restaurant.create({
            logo,
            images,
            name,
            address,
            phoneNumber,
            mobileNumber,
            workingHours,
            description,
            categories,
            menu,
            tables


        });
        res.status(200).json({ message: 'تمت اضافة المطعم', restaurant });
    } catch (error) {
        console.error('حدث خطا في اضافة المطعم', error);
        res.status(500).json({ message: 'حدث خطا في اضافة المطعم' });
    }
});

