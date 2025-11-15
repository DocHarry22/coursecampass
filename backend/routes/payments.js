const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/auth');

// Stripe integration (simulated - requires actual Stripe SDK installation)
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * @route   POST /api/payments/create-payment-intent
 * @desc    Create Stripe payment intent
 * @access  Private
 */
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { courseId, amount } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Create payment record
    const payment = await Payment.create({
      user: req.user.id,
      course: courseId,
      amount: amount || course.price,
      paymentMethod: 'stripe',
      status: 'pending'
    });

    // Simulated Stripe payment intent
    // In production, use: const paymentIntent = await stripe.paymentIntents.create({...})
    const mockPaymentIntent = {
      id: 'pi_' + Math.random().toString(36).substr(2, 9),
      client_secret: 'pi_secret_' + Math.random().toString(36).substr(2, 20),
      amount: payment.amount * 100, // Stripe uses cents
      currency: 'usd'
    };

    payment.stripePaymentIntentId = mockPaymentIntent.id;
    await payment.save();

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/payments/confirm
 * @desc    Confirm payment and create enrollment
 * @access  Private
 */
router.post('/confirm', protect, async (req, res) => {
  try {
    const { paymentId, paymentIntentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify payment with Stripe (simulated)
    // In production: const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    // Check if intent.status === 'succeeded'

    // Update payment status
    payment.status = 'completed';
    payment.transactionId = 'txn_' + Date.now();
    payment.receiptUrl = `/api/payments/${payment._id}/receipt`;
    payment.invoiceUrl = `/api/payments/${payment._id}/invoice`;
    await payment.save();

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: payment.course,
      enrollmentDate: new Date(),
      status: 'in-progress',
      progress: 0
    });

    res.json({
      success: true,
      message: 'Payment successful! You are now enrolled.',
      data: {
        payment,
        enrollment
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payments/history
 * @desc    Get user's payment history
 * @access  Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Request refund for a payment
 * @access  Private
 */
router.post('/:id/refund', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund incomplete payment'
      });
    }

    // Check refund eligibility (e.g., within 30 days)
    const daysSincePurchase = (Date.now() - payment.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSincePurchase > 30) {
      return res.status(400).json({
        success: false,
        message: 'Refund period has expired (30 days)'
      });
    }

    // Process refund with Stripe (simulated)
    // In production: const refund = await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });

    payment.status = 'refunded';
    payment.refundAmount = payment.amount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();

    // Remove enrollment
    await Enrollment.findOneAndDelete({
      student: req.user.id,
      course: payment.course
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payments/:id/receipt
 * @desc    Get payment receipt
 * @access  Private
 */
router.get('/:id/receipt', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('course', 'title');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Generate HTML receipt
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .details { margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; }
          .total { font-size: 20px; font-weight: bold; margin-top: 20px; border-top: 2px solid #333; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CourseCompass</h1>
          <h2>Payment Receipt</h2>
        </div>
        <div class="details">
          <div class="row"><span>Receipt #:</span><span>${payment.transactionId}</span></div>
          <div class="row"><span>Date:</span><span>${payment.createdAt.toLocaleDateString()}</span></div>
          <div class="row"><span>Customer:</span><span>${payment.user.firstName} ${payment.user.lastName}</span></div>
          <div class="row"><span>Email:</span><span>${payment.user.email}</span></div>
          <div class="row"><span>Course:</span><span>${payment.course.title}</span></div>
          <div class="row"><span>Payment Method:</span><span>${payment.paymentMethod.toUpperCase()}</span></div>
          <div class="row"><span>Status:</span><span>${payment.status.toUpperCase()}</span></div>
          <div class="row total"><span>Total:</span><span>$${payment.amount.toFixed(2)} ${payment.currency}</span></div>
        </div>
      </body>
      </html>
    `;

    res.send(receiptHtml);
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payments/:id/invoice
 * @desc    Get payment invoice
 * @access  Private
 */
router.get('/:id/invoice', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('course', 'title');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Generate invoice (similar to receipt but formatted as invoice)
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .invoice-details { margin: 30px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>CourseCompass</h1>
            <p>Online Learning Platform</p>
          </div>
          <div>
            <h2>INVOICE</h2>
            <p>Invoice #: ${payment.transactionId}</p>
            <p>Date: ${payment.createdAt.toLocaleDateString()}</p>
          </div>
        </div>
        <div class="invoice-details">
          <h3>Bill To:</h3>
          <p>${payment.user.firstName} ${payment.user.lastName}<br>
          ${payment.user.email}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${payment.course.title}</td>
              <td>$${payment.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <div class="total">
          Total: $${payment.amount.toFixed(2)} ${payment.currency}
        </div>
        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          Thank you for your purchase! If you have any questions, please contact support@coursecompass.com
        </p>
      </body>
      </html>
    `;

    res.send(invoiceHtml);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Stripe webhook endpoint
 * @access  Public
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // In production, verify webhook signature:
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    const event = req.body;

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook error',
      error: error.message
    });
  }
});

module.exports = router;
