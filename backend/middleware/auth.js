const jwt = require('jsonwebtoken')
const User = require('../models/User')

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No token provided, authorization denied'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      return res.status(401).json({
        message: 'Token is not valid'
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account is deactivated'
      })
    }

    // Add user to request object
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Token is not valid'
      })
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token has expired'
      })
    }
    
    console.error('Auth middleware error:', error)
    res.status(500).json({
      message: 'Server error in authentication'
    })
  }
}

module.exports = auth