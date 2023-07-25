const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const restaurantsRouter = require('./routes/restaurants');
const tablesRouter = require('./routes/tables');
const reservationsRouter = require('./routes/reservations');
const path = require('path');

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, './uploads')))
// app.use('/uploads', express.static('uploads'));
const connection = mongoose.connection;

mongoose.connect('mongodb+srv://ghaithbirkdar:c4a@cluster0.jb1c741.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("mongodb connect success.");
    app.listen(3000)
  })
  .catch(err => { console.log(err) 
  });



const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  }
});

const User = mongoose.model('User', UserSchema);


function generateRandomNumber() {
  return Math.floor(1000 + Math.random() * 9000);
}


app.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ phone, password });

    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }


    const token = jwt.sign({ userId: user._id }, 'secret_key');

    res.json({ token , id: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/signup', async (req, res) => {
  const { name, password, phone, address, email } = req.body;

  try {
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const user = new User({ name, password, phone, address, email });
    await user.save();
    const token = jwt.sign({ userId: user._id }, 'secret_key');


    res.json({ message: 'User created successfully', token , id: user._id  });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/forgot-password', async (req, res) => {
  const { name, phone } = req.body;

  try {

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    const randomCode = generateRandomNumber();



    res.json({ message: 'Random code sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/change-password', async (req, res) => {
  const { phone, randomCode, newPassword } = req.body;

  try {

    const user = await User.findOneAndUpdate({ phone }, { password: newPassword });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// profile user
app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId,{
      name: 1,
      phone: 1,
      address: 1
    });
    res.send(user);
  } catch (err) {
    res.status(500).send(err);

  }
});
// update profile user
app.put('/users/:userId' , async (req,res)=> {
  try{
    const user =await User.findByIdAndUpdate(req.params.userId,{
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address
    },{new:true});
    res.send(user);
  } catch (err){
    res.status(500).send(err);
  }
});



//restaurants path
app.use(restaurantsRouter)
//table path
app.use(tablesRouter)
//reservation path
app.use(reservationsRouter)

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
      return res.sendStatus(401);
  }

  jwt.verify(token, 'secretkey', (err, user) => {
      if (err) {
          return res.sendStatus(403);
      }

      req.user = user;
      next();
  });
}



app.listen(2000, () => console.log('Server started'));
