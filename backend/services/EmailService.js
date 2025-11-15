const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Send enrollment confirmation email
   */
  async sendEnrollmentConfirmation(user, course) {
    try {
      const mailOptions = {
        from: `"CourseCompass" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Enrollment Confirmation: ${course.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Enrollment Confirmation</h2>
            <p>Hi ${user.firstName},</p>
            <p>You have successfully enrolled in:</p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${course.title}</h3>
              <p style="margin: 5px 0;"><strong>University:</strong> ${course.university?.name || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Level:</strong> ${course.level}</p>
              <p style="margin: 5px 0;"><strong>Start Date:</strong> ${course.startDate ? new Date(course.startDate).toLocaleDateString() : 'Self-paced'}</p>
            </div>
            <p>Access your course dashboard to start learning!</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Go to Dashboard</a>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              If you have any questions, reply to this email or contact our support team.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Enrollment confirmation sent to:', user.email);
    } catch (error) {
      console.error('Error sending enrollment confirmation:', error);
      throw error;
    }
  }

  /**
   * Send course completion email with certificate
   */
  async sendCompletionCertificate(user, course, certificateUrl) {
    try {
      const mailOptions = {
        from: `"CourseCompass" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `🎉 Congratulations! You completed ${course.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">🎉 Congratulations!</h2>
            <p>Hi ${user.firstName},</p>
            <p>You have successfully completed <strong>${course.title}</strong>!</p>
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; color: white;">
              <h3 style="margin: 0;">Certificate of Completion</h3>
              <p style="margin: 10px 0;">${course.title}</p>
              <p style="margin: 10px 0; font-size: 14px;">${course.university?.name || ''}</p>
            </div>
            ${certificateUrl ? `
              <p>Your certificate is ready to download:</p>
              <a href="${certificateUrl}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Download Certificate</a>
            ` : ''}
            <p>Share your achievement with your network!</p>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              Keep learning! Check out our recommended courses based on your interests.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Completion certificate sent to:', user.email);
    } catch (error) {
      console.error('Error sending completion certificate:', error);
      throw error;
    }
  }

  /**
   * Send course deadline reminder
   */
  async sendDeadlineReminder(user, course, deadline) {
    try {
      const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
      
      const mailOptions = {
        from: `"CourseCompass" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `⏰ Reminder: ${course.title} - ${daysLeft} days left`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F59E0B;">⏰ Course Deadline Reminder</h2>
            <p>Hi ${user.firstName},</p>
            <p>This is a friendly reminder that your course deadline is approaching:</p>
            <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
              <h3 style="margin: 0 0 10px 0;">${course.title}</h3>
              <p style="margin: 5px 0;"><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString()}</p>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #F59E0B;">${daysLeft} days remaining</p>
            </div>
            <p>Don't let your progress go to waste! Continue learning now:</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Continue Learning</a>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Deadline reminder sent to:', user.email);
    } catch (error) {
      console.error('Error sending deadline reminder:', error);
      throw error;
    }
  }

  /**
   * Send new course notification
   */
  async sendNewCourseNotification(user, course) {
    try {
      const mailOptions = {
        from: `"CourseCompass" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `New Course: ${course.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">📚 New Course Available</h2>
            <p>Hi ${user.firstName},</p>
            <p>A new course that matches your interests is now available:</p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${course.thumbnail ? `<img src="${course.thumbnail}" alt="${course.title}" style="width: 100%; border-radius: 8px; margin-bottom: 15px;">` : ''}
              <h3 style="margin: 0 0 10px 0;">${course.title}</h3>
              <p style="margin: 5px 0;"><strong>University:</strong> ${course.university?.name || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Level:</strong> ${course.level}</p>
              <p style="margin: 10px 0;">${course.description?.substring(0, 150)}...</p>
            </div>
            <a href="${process.env.FRONTEND_URL}/courses/${course._id}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Course</a>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('New course notification sent to:', user.email);
    } catch (error) {
      console.error('Error sending new course notification:', error);
      throw error;
    }
  }

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigest(user, stats, recommendations) {
    try {
      const mailOptions = {
        from: `"CourseCompass" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: '📊 Your Weekly Learning Digest',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">📊 Your Weekly Learning Digest</h2>
            <p>Hi ${user.firstName},</p>
            <p>Here's a summary of your learning activity this week:</p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>This Week's Progress</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #4F46E5;">${stats.hoursThisWeek || 0}</div>
                  <div style="color: #6B7280; margin-top: 5px;">Hours Learned</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #10B981;">${stats.completedLectures || 0}</div>
                  <div style="color: #6B7280; margin-top: 5px;">Lectures Completed</div>
                </div>
              </div>
            </div>

            ${recommendations && recommendations.length > 0 ? `
              <h3>Recommended for You</h3>
              ${recommendations.slice(0, 3).map(rec => `
                <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 10px 0;">
                  <h4 style="margin: 0 0 5px 0;">${rec.course.title}</h4>
                  <p style="margin: 5px 0; font-size: 14px; color: #6B7280;">${rec.course.university?.name || ''}</p>
                  <p style="margin: 5px 0; font-size: 12px; color: #4F46E5;">${rec.reason}</p>
                </div>
              `).join('')}
              <a href="${process.env.FRONTEND_URL}/courses" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Explore Courses</a>
            ` : ''}

            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              Keep up the great work! 🎉
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Weekly digest sent to:', user.email);
    } catch (error) {
      console.error('Error sending weekly digest:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const mailOptions = {
        from: `"CourseCompass" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Password Reset Request</h2>
            <p>Hi ${user.firstName},</p>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
            <p style="color: #6B7280; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #6B7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent to:', user.email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(user, verificationToken) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      const mailOptions = {
        from: `"CourseCompass" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Verify Your Email Address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Welcome to CourseCompass!</h2>
            <p>Hi ${user.firstName},</p>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Verify Email</a>
            <p style="color: #6B7280; font-size: 14px;">This link will expire in 24 hours.</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent to:', user.email);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
