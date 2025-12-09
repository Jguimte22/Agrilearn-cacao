const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Notification = require('../models/Notification');
const userAuth = require('../middleware/userAuth');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Get all certificates for the current user
router.get('/', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching certificates for user:', userId);
    
    const certificates = await Certificate.find({ userId })
      .sort({ issueDate: -1 });
    
    console.log('Found certificates:', certificates.length);
    
    // Transform to match frontend format
    const transformedCertificates = certificates.map(cert => ({
      id: cert._id.toString(),
      title: cert.courseTitle || `${cert.courseTitle || 'Course'} Certificate`,
      description: `Successfully completed the ${cert.courseTitle || 'course'} with excellent performance`,
      issueDate: cert.issueDate,
      completionDate: cert.completionDate,
      courseId: cert.courseId,
      courseName: cert.courseTitle || 'Course',
      courseTitle: cert.courseTitle || 'Course',
      score: cert.finalScore,
      status: 'earned',
      isNew: false,
      certificateUrl: cert.verificationUrl || '#',
      icon: '🎓',
      category: cert.courseCategory || 'beginner',
      verificationCode: cert.certificateId,
      image: cert.certificateImage || '/Certificates.png'
    }));
    
    res.json({
      success: true,
      certificates: transformedCertificates,
      count: transformedCertificates.length
    });
    
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificates',
      error: error.message
    });
  }
});

// Create a new certificate (for testing/manual creation)
router.post('/', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, courseTitle, score = 95 } = req.body;
    
    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({ userId, courseId });
    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already exists for this course'
      });
    }
    
    // Get user's full name from User model
    const user = await User.findById(userId);
    const studentFullName = user ? `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.surname}`.trim() : 'Student';

    // Create new certificate
    const certificate = new Certificate({
      userId,
      courseId,
      certificateId: `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 8)}`.toUpperCase(),
      issueDate: new Date(),
      completionDate: new Date(),
      finalScore: score,
      totalTimeSpent: 120, // Default 2 hours
      courseTitle,
      courseCategory: 'beginner',
      studentName: studentFullName,
      studentEmail: user ? user.email : req.user.email,
      instructorName: 'AgriLearn Cacao Instructor',
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificate.certificateId}`,
      certificateImage: '/Certificates.png',
      metadata: {
        totalLessons: 10,
        totalQuizzes: 5,
        averageQuizScore: score,
        completionTime: '2 hours'
      }
    });
    
    await certificate.save();

    // Create certificate notification
    await Notification.createCertificateNotification(
      userId,
      courseTitle,
      certificate._id
    );

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      certificate: certificate
    });
    
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating certificate',
      error: error.message
    });
  }
});

// Create certificates for all completed courses (helper endpoint)
router.post('/create-for-completed', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const CourseProgress = require('../models/CourseProgress');

    console.log('Creating certificates for all completed courses for user:', userId);

    // Get all completed courses for this user
    const completedCourses = await CourseProgress.find({
      userId: userId,
      isCompleted: true
    });

    console.log('Found completed courses:', completedCourses.length);

    const certificatesCreated = [];
    const courseTitles = {
      'cacao-basics': 'Cacao Basics',
      'planting-techniques': 'Planting Techniques',
      'harvest-processing': 'Harvest & Processing',
      'pest-disease': 'Pest & Disease Management',
      'cloning-techniques': 'Types of Cloning in Cacao',
      'care-management': 'Care Management',
      'gap-practices': 'GAP (Good Agricultural Practices)'
    };

    for (const courseProgress of completedCourses) {
      const courseId = courseProgress.courseId;

      // Check if certificate already exists
      const existingCertificate = await Certificate.findOne({
        userId: userId,
        courseId: courseId
      });

      if (!existingCertificate) {
        const courseTitle = courseTitles[courseId] || 'Course';

        // Get user's full name from User model
        const user = await User.findById(userId);
        const studentFullName = user ? `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.surname}`.trim() : 'Student';

        const certificate = new Certificate({
          userId: userId,
          courseId: courseId,
          certificateId: `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 8)}`.toUpperCase(),
          issueDate: new Date(),
          completionDate: courseProgress.completedAt || new Date(),
          finalScore: 95,
          totalTimeSpent: courseProgress.totalTimeSpent || 120,
          courseTitle: courseTitle,
          courseCategory: 'beginner',
          studentName: studentFullName,
          studentEmail: user ? user.email : req.user.email,
          instructorName: 'AgriLearn Cacao Instructor',
          certificateImage: '/Certificates.png',
          metadata: {
            totalLessons: courseProgress.completedLessons.length,
            totalQuizzes: 0,
            averageQuizScore: 95,
            completionTime: '2 hours'
          }
        });

        await certificate.save();
        certificatesCreated.push(certificate);
        console.log('✅ Created certificate for:', courseTitle);

        // Create certificate notification
        await Notification.createCertificateNotification(
          userId,
          courseTitle,
          certificate._id
        );
        console.log('🔔 Created notification for certificate:', courseTitle);
      }
    }

    res.json({
      success: true,
      message: `Created ${certificatesCreated.length} certificates`,
      certificates: certificatesCreated,
      count: certificatesCreated.length
    });

  } catch (error) {
    console.error('Error creating certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating certificates',
      error: error.message
    });
  }
});

// Generate and download certificate as PDF
router.get('/download/:courseId', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;

    console.log('Generating certificate PDF for user:', userId, 'course:', courseId);

    // Find the certificate
    let certificate = await Certificate.findOne({ userId, courseId });

    // If certificate doesn't exist, create it
    if (!certificate) {
      const CourseProgress = require('../models/CourseProgress');
      const courseProgress = await CourseProgress.findOne({ userId, courseId, isCompleted: true });

      if (!courseProgress) {
        return res.status(404).json({
          success: false,
          message: 'Course not completed yet'
        });
      }

      const courseTitles = {
        'cacao-basics': 'Cacao Basics',
        'planting-techniques': 'Planting Techniques',
        'harvest-processing': 'Harvest & Processing',
        'pest-disease': 'Pest & Disease Management',
        'cloning-techniques': 'Types of Cloning in Cacao',
        'care-management': 'Care Management',
        'gap-practices': 'GAP (Good Agricultural Practices)'
      };

      const user = await User.findById(userId);
      const studentFullName = user ? `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.surname}`.trim() : 'Student';

      certificate = new Certificate({
        userId,
        courseId,
        certificateId: `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 8)}`.toUpperCase(),
        issuedDate: new Date(),
        completionDate: courseProgress.completedAt || new Date(),
        finalScore: 95,
        totalTimeSpent: courseProgress.totalTimeSpent || 120,
        courseTitle: courseTitles[courseId] || 'Course',
        courseCategory: 'beginner',
        studentName: studentFullName,
        studentEmail: user ? user.email : 'student@example.com',
        instructorName: 'AgriLearn Cacao Instructor',
        certificateImage: '/Certificates.png',
        metadata: {
          totalLessons: courseProgress.completedLessons.length,
          totalQuizzes: 0,
          averageQuizScore: 95,
          completionTime: '2 hours'
        }
      });

      await certificate.save();
      console.log('✅ Created certificate for:', certificate.courseTitle);

      // Create certificate notification for newly created certificate
      await Notification.createCertificateNotification(
        userId,
        certificate.courseTitle,
        certificate._id
      );
      console.log('🔔 Created notification for certificate:', certificate.courseTitle);
    }

    // Update download count
    certificate.downloadCount = (certificate.downloadCount || 0) + 1;
    await certificate.save();

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      autoFirstPage: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.courseTitle.replace(/\s+/g, '-')}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const centerX = pageWidth / 2;

    // === ADD CERTIFICATE TEMPLATE IMAGE ===
    try {
      const templatePath = path.join(__dirname, '..', '..', 'public', 'AgriLearnCertificates.png');
      if (fs.existsSync(templatePath)) {
        // Add the certificate template as background, fitting to page
        doc.image(templatePath, 0, 0, {
          width: pageWidth,
          height: pageHeight,
          align: 'center',
          valign: 'center'
        });
      } else {
        console.error('Certificate template not found at:', templatePath);
        throw new Error('Certificate template not found');
      }
    } catch (error) {
      console.error('Error loading certificate template:', error);
      return res.status(500).json({
        success: false,
        message: 'Certificate template not found',
        error: error.message
      });
    }

    // === OVERLAY TEXT ON CERTIFICATE ===

    // Student Name (positioned on the first golden line)
    doc.fontSize(28)
       .fillColor('#2C2C2C')
       .font('Helvetica-Bold')
       .text(certificate.studentName.toUpperCase(), 50, 240, {
         width: pageWidth - 100,
         align: 'center',
         lineBreak: false
       });

    // Course Title (positioned on second golden line)
    doc.fontSize(26)
       .fillColor('#8B5A2B')
       .font('Helvetica-Bold')
       .text(certificate.courseTitle, 50, 360, {
         width: pageWidth - 100,
         align: 'center',
         lineBreak: false
       });

    // Issued Date (complete text with date)
    const completionDateStr = new Date(certificate.completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fontSize(16)
       .fillColor('#8B5A2B')
       .font('Helvetica-Bold')
       .text(`issued date: ${completionDateStr}`, 0, 425, {
         width: pageWidth,
         align: 'center',
         lineBreak: false
       });

    // Finalize the PDF
    doc.end();

    console.log('✅ Certificate PDF generated successfully');

  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating certificate',
      error: error.message
    });
  }
});

// Delete a certificate
router.delete('/:id', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const certificateId = req.params.id;

    const certificate = await Certificate.findOne({ _id: certificateId, userId });
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    await Certificate.findByIdAndDelete(certificateId);

    res.json({
      success: true,
      message: 'Certificate deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting certificate',
      error: error.message
    });
  }
});

module.exports = router;
