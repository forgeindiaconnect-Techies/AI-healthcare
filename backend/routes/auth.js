// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updateProfile, updatePassword, uploadAvatar, forgotPassword, resetPassword, verifyEmail } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadProfile } = require('../config/cloudinary');
const { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator } = require('../middleware/validator');

const { seedDatabase } = require('../controllers/seedController');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/seed-db', seedDatabase);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);
router.put('/updatepassword', protect, updatePassword);
router.put('/avatar', protect, uploadProfile.single('avatar'), uploadAvatar);
router.post('/forgotpassword', forgotPasswordValidator, forgotPassword);
router.put('/resetpassword/:token', resetPasswordValidator, resetPassword);
router.get('/verifyemail/:token', verifyEmail);

module.exports = router;
