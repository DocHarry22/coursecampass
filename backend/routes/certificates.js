const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

/**
 * @route   POST /api/certificates/generate
 * @desc    Generate certificate for completed course
 * @access  Private
 */
router.post('/generate', protect, async (req, res) => {
  try {
    const { enrollmentId } = req.body;

    // Verify enrollment exists and belongs to user
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course')
      .populate('student');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (enrollment.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (enrollment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Course must be completed to generate certificate'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      student: req.user.id,
      course: enrollment.course._id
    });

    if (existingCertificate) {
      return res.json({
        success: true,
        data: existingCertificate,
        message: 'Certificate already exists'
      });
    }

    // Generate certificate number and verification code
    const certificateNumber = `CC-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const verificationCode = crypto.randomBytes(16).toString('hex');

    // Calculate grade based on progress/score
    const grade = calculateGrade(enrollment.progress);

    // Create certificate
    const certificate = await Certificate.create({
      student: req.user.id,
      course: enrollment.course._id,
      enrollment: enrollmentId,
      certificateNumber,
      verificationCode,
      completionDate: enrollment.completionDate,
      grade,
      pdfUrl: `/api/certificates/${certificateNumber}/download`,
      metadata: {
        courseDuration: enrollment.course.duration,
        courseCredits: enrollment.course.credits,
        instructorName: enrollment.course.instructors?.[0]?.instructor?.firstName || 'Instructor',
        universityName: enrollment.course.university?.name || 'CourseCompass'
      }
    });

    res.status(201).json({
      success: true,
      data: certificate,
      message: 'Certificate generated successfully'
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/certificates/my-certificates
 * @desc    Get all certificates for authenticated user
 * @access  Private
 */
router.get('/my-certificates', protect, async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user.id })
      .populate('course', 'title thumbnail category')
      .sort({ issueDate: -1 });

    res.json({
      success: true,
      data: certificates
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/certificates/:certificateNumber/download
 * @desc    Download certificate as PDF
 * @access  Public
 */
router.get('/:certificateNumber/download', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      certificateNumber: req.params.certificateNumber 
    })
      .populate('student', 'firstName lastName')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Generate PDF certificate (simplified HTML version)
    const certificateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: landscape; margin: 0; }
          body {
            font-family: 'Georgia', serif;
            margin: 0;
            padding: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate {
            background: white;
            padding: 60px;
            max-width: 900px;
            margin: 0 auto;
            border: 20px solid #f0f0f0;
            box-shadow: 0 0 40px rgba(0,0,0,0.3);
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          .title {
            font-size: 48px;
            color: #333;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 4px;
          }
          .subtitle {
            font-size: 20px;
            color: #666;
            font-style: italic;
          }
          .body {
            text-align: center;
            padding: 40px 0;
          }
          .awarded-to {
            font-size: 18px;
            color: #666;
            margin-bottom: 10px;
          }
          .student-name {
            font-size: 42px;
            color: #333;
            font-weight: bold;
            margin: 20px 0;
            text-decoration: underline;
            text-decoration-color: #667eea;
            text-decoration-thickness: 2px;
          }
          .course-title {
            font-size: 28px;
            color: #667eea;
            margin: 30px 0;
            font-weight: bold;
          }
          .completion-text {
            font-size: 18px;
            color: #666;
            line-height: 1.6;
            margin: 20px 0;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #eee;
          }
          .signature-block {
            text-align: center;
            flex: 1;
          }
          .signature-line {
            border-top: 2px solid #333;
            margin: 40px 20px 10px;
          }
          .signature-label {
            font-size: 14px;
            color: #666;
          }
          .certificate-info {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
          }
          .info-item {
            display: inline-block;
            margin: 0 20px;
            font-size: 12px;
            color: #999;
          }
          .seal {
            position: absolute;
            bottom: 60px;
            right: 60px;
            width: 120px;
            height: 120px;
            border: 3px solid #667eea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            background: white;
          }
          .seal-text {
            font-size: 14px;
            font-weight: bold;
            color: #667eea;
            text-align: center;
          }
          .grade-badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 30px;
            border-radius: 25px;
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="logo">CourseCompass</div>
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">This is to certify that</div>
          </div>
          
          <div class="body">
            <div class="student-name">
              ${certificate.student.firstName} ${certificate.student.lastName}
            </div>
            
            <div class="completion-text">
              has successfully completed the course
            </div>
            
            <div class="course-title">
              ${certificate.course.title}
            </div>
            
            <div class="grade-badge">Grade: ${certificate.grade}</div>
            
            <div class="completion-text">
              Completed on ${new Date(certificate.completionDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <div class="footer">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">Instructor</div>
              <div class="signature-label">${certificate.metadata?.instructorName || 'Instructor'}</div>
            </div>
            
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">Director</div>
              <div class="signature-label">CourseCompass Education</div>
            </div>
          </div>
          
          <div class="certificate-info">
            <div class="info-item">Certificate No: ${certificate.certificateNumber}</div>
            <div class="info-item">Verification Code: ${certificate.verificationCode}</div>
            <div class="info-item">Issue Date: ${new Date(certificate.issueDate).toLocaleDateString()}</div>
          </div>
          
          <div class="seal">
            <div class="seal-text">
              VERIFIED<br>
              CERTIFICATE
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(certificateHtml);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download certificate',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/certificates/verify/:verificationCode
 * @desc    Verify certificate authenticity
 * @access  Public
 */
router.get('/verify/:verificationCode', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      verificationCode: req.params.verificationCode 
    })
      .populate('student', 'firstName lastName')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid verification code'
      });
    }

    res.json({
      success: true,
      data: {
        isValid: certificate.isVerified,
        certificateNumber: certificate.certificateNumber,
        studentName: `${certificate.student.firstName} ${certificate.student.lastName}`,
        courseTitle: certificate.course.title,
        issueDate: certificate.issueDate,
        completionDate: certificate.completionDate,
        grade: certificate.grade
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/certificates/:id/linkedin
 * @desc    Get LinkedIn share URL for certificate
 * @access  Private
 */
router.get('/:id/linkedin', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    if (certificate.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Generate LinkedIn share URL
    const certUrl = `${process.env.FRONTEND_URL}/certificates/verify/${certificate.verificationCode}`;
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certificate.course.title)}&organizationId=CourseCompass&issueYear=${new Date(certificate.issueDate).getFullYear()}&issueMonth=${new Date(certificate.issueDate).getMonth() + 1}&certUrl=${encodeURIComponent(certUrl)}&certId=${certificate.certificateNumber}`;

    certificate.linkedInUrl = linkedInUrl;
    await certificate.save();

    res.json({
      success: true,
      data: {
        linkedInUrl
      }
    });
  } catch (error) {
    console.error('Error generating LinkedIn URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate LinkedIn URL',
      error: error.message
    });
  }
});

// Helper function to calculate grade
function calculateGrade(progress) {
  if (progress >= 95) return 'A+';
  if (progress >= 90) return 'A';
  if (progress >= 85) return 'A-';
  if (progress >= 80) return 'B+';
  if (progress >= 75) return 'B';
  if (progress >= 70) return 'B-';
  if (progress >= 65) return 'C+';
  if (progress >= 60) return 'C';
  if (progress >= 50) return 'Pass';
  return 'Merit';
}

module.exports = router;
