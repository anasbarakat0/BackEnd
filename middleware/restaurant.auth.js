const jwt = require('jsonwebtoken');

 module.exports = function authenticateTokenForRestaurant(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    //const ACCESS_TOKEN_SECRET = 'mysecretkey';
    
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

