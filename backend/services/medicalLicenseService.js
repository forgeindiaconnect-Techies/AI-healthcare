const MedicalLicenceVerification = require('../models/MedicalLicenceVerification');

/**
 * Service to simulate external Medical License Verification.
 * In a real application, this would call an official registry API.
 */
class MedicalLicenseVerificationService {
  /**
   * Normalizes license number to remove spaces and special characters for comparison.
   */
  normalizeLicenseNumber(licenseNumber) {
    if (!licenseNumber) return '';
    return licenseNumber.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  /**
   * Simulates an API call to verify the medical license.
   */
  async verifyLicense({ doctorId, licenseNumber, medicalCouncil, state, country }) {
    const normalizedNumber = this.normalizeLicenseNumber(licenseNumber);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulation logic based on the license number
    let status = 'VERIFIED';
    let registeredName = 'Test Doctor Name';
    let registrationStatus = 'ACTIVE';
    let specialization = 'General Medicine';
    
    // Simulating specific edge cases for testing purposes
    if (normalizedNumber.startsWith('FAIL')) {
      status = 'NOT_FOUND';
    } else if (normalizedNumber.startsWith('EXP')) {
      status = 'EXPIRED';
      registrationStatus = 'EXPIRED';
    } else if (normalizedNumber.startsWith('SUSP')) {
      status = 'SUSPENDED';
      registrationStatus = 'SUSPENDED';
    } else if (normalizedNumber.startsWith('MISMATCH')) {
      status = 'DETAILS_MISMATCH';
      registeredName = 'Someone Else entirely';
    }

    const verificationResult = {
      status,
      registeredName,
      licenseNumber: normalizedNumber,
      authority: medicalCouncil || 'National Medical Council',
      registrationStatus,
      specialization,
      expiryDate: status === 'EXPIRED' ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) : null,
      checkedAt: new Date(),
      sourceReference: 'SIMULATED_REGISTRY_' + Date.now()
    };

    return verificationResult;
  }

  /**
   * Saves the verification result to the database.
   */
  async saveVerificationResult(doctorId, adminUserId, result, notes = '') {
    const record = await MedicalLicenceVerification.create({
      doctor: doctorId,
      licenceNumber: result.licenseNumber,
      medicalCouncil: result.authority,
      verificationMethod: 'API',
      verificationStatus: result.status,
      registeredName: result.registeredName,
      registrationStatus: result.registrationStatus,
      specialization: result.specialization,
      expiryDate: result.expiryDate,
      sourceReference: result.sourceReference,
      checkedBy: adminUserId,
      checkedAt: result.checkedAt,
      notes
    });
    
    return record;
  }
}

module.exports = new MedicalLicenseVerificationService();
