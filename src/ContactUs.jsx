import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import './ContactUs.css';
import Header from './components/Header';

function ContactUs() {
  const [formData, setFormData] = useState({
    sender: '',
    senderEmail: '',
    subject: '',
    content: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        setSubmitMessage('Your message has been sent successfully!');
        setFormData({
          sender: '',
          senderEmail: '',
          subject: '',
          content: ''
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to send message. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="contact-page">
      <Header />
      {/* Contact Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <h1>Get In Touch</h1>
          <p>We'd love to hear from you. Contact us through any of the channels below.</p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="contact-main">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Information */}
            <div className="contact-info">
              <div className="info-card">
                <h2>Contact Information</h2>
                <p className="info-subtitle">Fill out the form or reach out directly through these channels:</p>

                <div className="contact-method">
                  <div className="contact-icon">
                    <FaEnvelope />
                  </div>
                  <div className="contact-details">
                    <h3>Email Us</h3>
                    <a href="mailto:info@agrilearncacao.com">info@agrilearncacao.com</a>
                    <span className="response-time">Response within 24 hours</span>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="contact-icon">
                    <FaPhone />
                  </div>
                  <div className="contact-details">
                    <h3>Call Us</h3>
                    <a href="tel:+15551234567">+1 (555) 123-4567</a>
                    <span className="response-time">Mon-Fri, 9AM - 5PM EST</span>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="contact-icon">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="contact-details">
                    <h3>Our Location</h3>
                    <p>Provincial Agriculture Office (PAGRO)<br />Mati City, Davao Oriental, Philippines</p>
                  </div>
                </div>

                <div className="social-section">
                  <h3>Follow Us</h3>
                  <div className="social-links">
                    <a href="#" aria-label="Facebook"><FaFacebookF /></a>
                    <a href="#" aria-label="Twitter"><FaTwitter /></a>
                    <a href="#" aria-label="Instagram"><FaInstagram /></a>
                    <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
                    <a href="#" aria-label="YouTube"><FaYoutube /></a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-container">
              <div className="form-header">
                <h2>Send Us a Message</h2>
                <p>We'll get back to you within 24 hours</p>
              </div>

              {submitStatus && (
                <div className={`form-notification ${submitStatus}`}>
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sender">Full Name *</label>
                    <input
                      type="text"
                      id="sender"
                      name="sender"
                      value={formData.sender}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="form-input"
                    />
                    <div className="input-highlight"></div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="senderEmail">Email Address *</label>
                    <input
                      type="email"
                      id="senderEmail"
                      name="senderEmail"
                      value={formData.senderEmail}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                      className="form-input"
                    />
                    <div className="input-highlight"></div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      required
                      className="form-input"
                    />
                    <div className="input-highlight"></div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="content">Message *</label>
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      rows="6"
                      required
                      className="form-input textarea"
                    ></textarea>
                    <div className="input-highlight"></div>
                  </div>
                </div>

                <div className="form-footer">
                  <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                    {!isSubmitting && <i className="arrow-icon">→</i>}
                  </button>
                  <p className="form-note">We respect your privacy and never share your information</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section">
        <div className="container">
          <div className="map-container">
            <iframe
              title="Our Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1004386.0320426571!2d126.2!3d6.95!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f8d1d6c5a5e5a5%3A0x1c0d6d2b1b0b0b0b!2sMati%2C%20Davao%20Oriental!5e0!3m2!1sen!2sph!4v1234567890"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>AgriLearn Cacao</h4>
              <p>Empowering farmers with innovative e-learning solutions for sustainable cacao cultivation.</p>
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/learn-planting">Learning Planting</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Connect With Us</h4>
              <div className="social-links">
                <a href="#">Facebook</a>
                <a href="#">Twitter</a>
                <a href="#">Instagram</a>
                <a href="#">LinkedIn</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 AgriLearn Cacao. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ContactUs;