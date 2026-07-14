const jwt = require('jsonwebtoken');

function requireAuth(req, res, next){
    const auth_header = req.headers.authorization;

    if(!auth_header || !authHeader.startsWith('Bearer '))
        return res.stauts(401).json({ message: 'No token provided' });
    
    const token = auth_header.split(' ')[1];

    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.userId;
        next();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Something went wrong' });
    }
}

module.exports = requireAuth;