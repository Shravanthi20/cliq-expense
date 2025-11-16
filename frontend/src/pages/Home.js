import React from 'react';
import uploadIcon from './upload_s.png';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

function Home() {
    const { user, isAuthenticated } = useAuth();
    
    return (
      <div className="home-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-background">
            <div className="hero-pattern"></div>
          </div>
          <div className="container">
            <div className="hero-content">
              <div className="hero-text">
                <div className="badge">Completely Free Forever</div>
                <h1 className="hero-title">
                  Take Control of Your <span className="gradient-text">Finances</span>
                </h1>
                <p className="hero-subtitle">
                  Import bank statements, automatically categorize expenses, and gain powerful insights 
                  with beautiful visualizations—all for free. No hidden costs, no subscriptions.
                </p>
                <div className="hero-actions">
                  {!isAuthenticated() ? (
                    <div className="action-buttons">
                      <Link className="btn btn-primary" to="/register">
                        <span>Get Started</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                      <Link className="btn btn-secondary" to="/login">
                        Sign In
                      </Link>
                    </div>
                  ) : (
                    <div className="action-buttons">
                      <Link className="btn btn-primary" to="/upload">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Import Statements
                      </Link>
                      <Link className="btn btn-secondary" to="/reports">
                        View Reports
                      </Link>
                      <Link className="btn btn-outline" to="/add-members">
                        Manage Groups
                      </Link>
                    </div>
                  )}
                </div>
                <div className="hero-features">
                  <div className="feature-item">
                    <span className="check-icon">✓</span>
                    <span>No credit card required</span>
                  </div>
                  <div className="feature-item">
                    <span className="check-icon">✓</span>
                    <span>Unlimited imports</span>
                  </div>
                  <div className="feature-item">
                    <span className="check-icon">✓</span>
                    <span>Forever free</span>
                  </div>
                </div>
              </div>
              <div className="hero-visual">
                <div className="image-container">
                  <img 
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                    alt="Financial Dashboard Preview" 
                    className="hero-image"
                  />
                  <div className="floating-card card-1">
                    <div className="card-icon">📈</div>
                    <div className="card-text">Expenses Down 15%</div>
                  </div>
                  <div className="floating-card card-2">
                    <div className="card-icon">💰</div>
                    <div className="card-text">$2,847 Saved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="container">
            <div className="section-header">
              <h2>Everything You Need, Completely Free</h2>
              <p>Powerful financial tools that won't cost you a dime</p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-image">
                  <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                    alt="Smart Imports"
                  />
                </div>
                <div className="feature-content">
                  <h3>Smart Imports</h3>
                  <p>Upload statements from any bank or wallet. Our AI automatically parses and structures your financial data.</p>
                  <ul className="feature-list">
                    <li>CSV & PDF Support</li>
                    <li>Auto-categorization</li>
                    <li>Multi-bank sync</li>
                  </ul>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-image">
                  <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                    alt="Visual Insights"
                  />
                </div>
                <div className="feature-content">
                  <h3>Visual Insights</h3>
                  <p>Beautiful dashboards and reports that help you understand spending patterns and save money.</p>
                  <ul className="feature-list">
                    <li>Interactive charts</li>
                    <li>Trend analysis</li>
                    <li>Spending alerts</li>
                  </ul>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-image">
                  <img 
                    src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                    alt="Team Collaboration"
                  />
                </div>
                <div className="feature-content">
                  <h3>Team Collaboration</h3>
                  <p>Perfect for families and roommates. Share expenses and manage finances together seamlessly.</p>
                  <ul className="feature-list">
                    <li>Shared wallets</li>
                    <li>Group reporting</li>
                    <li>Expense splitting</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="steps-section">
          <div className="container">
            <div className="section-header">
              <h2>Get Started in Minutes</h2>
              <p>Simple steps to financial clarity</p>
            </div>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-image">
                  <img 
                    src={uploadIcon}
                    alt="Upload Statements"
                  />
                </div>
                <h3>Upload Statements</h3>
                <p>Drag and drop your bank statements in CSV or PDF format</p>
              </div>

              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-image">
                  <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" 
                    alt="Auto Categorize"
                  />
                </div>
                <h3>Auto-Categorize</h3>
                <p>Our AI automatically categorizes your transactions</p>
              </div>

              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-image">
                  <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" 
                    alt="View Insights"
                  />
                </div>
                <h3>View Insights</h3>
                <p>Get beautiful visualizations and spending insights</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials-section">
          <div className="container">
            <div className="section-header">
              <h2>Loved by Thousands</h2>
              <p>See what our users are saying</p>
            </div>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p>"This app helped me save over $500 in the first month alone. The visualizations are incredible!"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt="Sarah" />
                  </div>
                  <div className="author-info">
                    <strong>Sarah M.</strong>
                    <span>Teacher</span>
                  </div>
                </div>
              </div>

              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p>"Finally, a free tool that actually works! The group features are perfect for managing household expenses."</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt="Mike" />
                  </div>
                  <div className="author-info">
                    <strong>Mike R.</strong>
                    <span>Freelancer</span>
                  </div>
                </div>
              </div>

              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p>"I've tried many paid apps, but this free version beats them all. The import feature is magic!"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt="Jessica" />
                  </div>
                  <div className="author-info">
                    <strong>Jessica L.</strong>
                    <span>Student</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        {!isAuthenticated() && (
          <section className="final-cta">
            <div className="container">
              <div className="cta-content">
                <h2>Start Your Financial Journey Today</h2>
                <p>Join thousands of users managing their money smarter with our completely free platform</p>
                <div className="cta-buttons">
                  
                  <Link className="btn btn-outline btn-large" to="/login">
                    Sign In
                  </Link>
                </div>
                <div className="cta-features">
                  <span>✓ No credit card required</span>
                  <span>✓ Setup in 2 minutes</span>
                  <span>✓ Forever free</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-brand">
                <h3>FinTracker</h3>
                <p>Making financial freedom accessible to everyone, for free.</p>
              </div>
              <div className="footer-links">
                <div className="footer-column">
                  <h4>Product</h4>
                  <Link to="/features">Features</Link>
                  <Link to="/how-it-works">How It Works</Link>
                  <Link to="/support">Support</Link>
                </div>
                <div className="footer-column">
                  <h4>Company</h4>
                  <Link to="/about">About</Link>
                  <Link to="/blog">Blog</Link>
                  <Link to="/contact">Contact</Link>
                </div>
                <div className="footer-column">
                  <h4>Legal</h4>
                  <Link to="/privacy">Privacy</Link>
                  <Link to="/terms">Terms</Link>
                  <Link to="/security">Security</Link>
                </div>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© {new Date().getFullYear()} FinTracker. Completely free, forever.</span>
            </div>
          </div>
        </footer>
      </div>
    );
}

export default Home;