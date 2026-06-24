const Disease = require('../models/Disease');
const DietPlan = require('../models/DietPlan');
const PatientDietReport = require('../models/PatientDietReport');
const logger = require('../utils/logger');

// @desc    Get all diseases or search by query
// @route   GET /api/diet/diseases
// @access  Private
exports.getDiseases = async (req, res, next) => {
  try {
    const { q } = req.query;
    let query = { isActive: true };
    
    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }
    
    const diseases = await Disease.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: diseases.length, data: diseases });
  } catch (error) {
    logger.error(`Get diseases error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get diet plans for a specific disease
// @route   GET /api/diet/plans/:diseaseId
// @access  Private
exports.getDietPlans = async (req, res, next) => {
  try {
    const dietPlans = await DietPlan.find({ 
      disease: req.params.diseaseId,
      isActive: true 
    });
    
    res.status(200).json({ success: true, count: dietPlans.length, data: dietPlans });
  } catch (error) {
    logger.error(`Get diet plans error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Save a generated patient diet report
// @route   POST /api/diet/reports
// @access  Private
exports.createDietReport = async (req, res, next) => {
  try {
    req.body.patient = req.user.id;
    
    const report = await PatientDietReport.create(req.body);
    
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    logger.error(`Create diet report error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all diet reports for a patient
// @route   GET /api/diet/reports/:patientId
// @access  Private
exports.getPatientDietReports = async (req, res, next) => {
  try {
    // Make sure user can only access their own reports, unless admin/doctor
    if (req.user.role === 'patient' && req.user.id !== req.params.patientId) {
      return res.status(403).json({ success: false, message: 'Not authorized to access these reports' });
    }

    const reports = await PatientDietReport.find({ patient: req.params.patientId })
      .populate('disease', 'name')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    logger.error(`Get patient diet reports error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
