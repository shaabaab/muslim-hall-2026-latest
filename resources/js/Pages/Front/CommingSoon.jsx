import { HomeFilled } from '@ant-design/icons';
import { Button } from 'antd';
import React, { useState, useEffect } from 'react';

const HadithComingSoon = () => {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [currentHadith, setCurrentHadith] = useState(0);

  // Target launch date (3 months from now)
  const launchDate = new Date();
  launchDate.setMonth(launchDate.getMonth() + 3);

  // Sample Hadith collection
  const hadithCollection = [
    {
      text: "The best among you are those who have the best manners and character.",
      reference: "Sahih al-Bukhari",
      narrator: "Prophet Muhammad (ﷺ)"
    },
    {
      text: "None of you truly believes until he loves for his brother what he loves for himself.",
      reference: "Sahih al-Bukhari",
      narrator: "Prophet Muhammad (ﷺ)"
    },
    {
      text: "The strong is not the one who overcomes the people by his strength, but the strong is the one who controls himself while in anger.",
      reference: "Sahih al-Bukhari",
      narrator: "Prophet Muhammad (ﷺ)"
    },
    {
      text: "The world is the believer's prison and the unbeliever's paradise.",
      reference: "Sahih Muslim",
      narrator: "Prophet Muhammad (ﷺ)"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate - now;

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    // Rotate hadith every 10 seconds
    const hadithTimer = setInterval(() => {
      setCurrentHadith((prev) => (prev + 1) % hadithCollection.length);
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(hadithTimer);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Here you would typically send the email to your backend
      console.log('Email submitted:', email);
      setSubscribed(true);
      setEmail('');
      
      // Reset subscription message after 5 seconds
      setTimeout(() => {
        setSubscribed(false);
      }, 5000);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#328344',
      color: 'white',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    },
    backgroundPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 0),
        radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 2px, transparent 0)
      `,
      backgroundSize: '50px 50px',
      opacity: 0.3
    },
    content: {
      position: 'relative',
      zIndex: 1,
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 0'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    arabicText: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      fontFamily: "'Traditional Arabic', 'Scheherazade New', serif"
    },
    englishText: {
      fontSize: '1.8rem',
      fontWeight: 300,
      letterSpacing: '2px'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '2rem 0'
    },
    announcement: {
      marginBottom: '3rem'
    },
    title: {
      marginBottom: '1.5rem'
    },
    titleArabic: {
      display: 'block',
      fontSize: '3.5rem',
      fontFamily: "'Traditional Arabic', 'Scheherazade New', serif",
      marginBottom: '0.5rem',
      fontWeight: 'bold'
    },
    titleEnglish: {
      display: 'block',
      fontSize: '2.5rem',
      fontWeight: 300,
      letterSpacing: '3px'
    },
    subtitle: {
      fontSize: '1.2rem',
      maxWidth: '600px',
      lineHeight: 1.6,
      opacity: 0.9,
      margin: '0 auto'
    },
    featuredHadith: {
      margin: '2rem 0',
      maxWidth: '600px'
    },
    hadithCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '15px',
      padding: '2rem',
      margin: '1rem 0',
      transition: 'all 0.5s ease'
    },
    hadithText: {
      fontSize: '1.3rem',
      lineHeight: 1.6,
      marginBottom: '1rem',
      fontStyle: 'italic'
    },
    hadithReference: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.9rem',
      opacity: 0.8
    },
    narrator: {
      fontWeight: 500
    },
    book: {
      fontStyle: 'italic'
    },
    countdown: {
      display: 'flex',
      gap: '2rem',
      margin: '2rem 0',
      flexWrap: 'wrap',
      justifyContent: 'center'
    },
    countdownItem: {
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '10px',
      padding: '1.5rem 1rem',
      minWidth: '100px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    countdownNumber: {
      display: 'block',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    countdownLabel: {
      fontSize: '0.9rem',
      opacity: 0.8,
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    subscription: {
      margin: '2rem 0',
      maxWidth: '500px',
      width: '100%'
    },
    subscriptionH3: {
      marginBottom: '1.5rem',
      fontWeight: 400,
      fontSize: '1.3rem'
    },
    subscriptionForm: {
      display: 'flex',
      gap: '0.5rem',
      maxWidth: '400px',
      margin: '0 auto'
    },
    emailInput: {
      flex: 1,
      padding: '1rem 1.5rem',
      border: 'none',
      borderRadius: '50px',
      background: 'rgba(255, 255, 255, 0.9)',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.3s ease',
      color: '#2c3e50'
    },
    subscribeBtn: {
      padding: '1rem 2rem',
      border: 'none',
      borderRadius: '50px',
      background: '#f1c40f',
      color: '#2c3e50',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '1rem'
    },
    successMessage: {
      background: 'rgba(255, 255, 255, 0.15)',
      padding: '1.5rem',
      borderRadius: '10px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    successIcon: {
      display: 'inline-block',
      background: '#27ae60',
      color: 'white',
      width: '25px',
      height: '25px',
      borderRadius: '50%',
      textAlign: 'center',
      lineHeight: '25px',
      marginRight: '0.5rem'
    },
    footer: {
      marginTop: 'auto',
      padding: '2rem 0 1rem',
      textAlign: 'center'
    },
    socialLinks: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '1rem'
    },
    socialLink: {
      color: 'white',
      textDecoration: 'none',
      fontSize: '1.5rem',
      transition: 'transform 0.3s ease'
    },
    copyright: {
      opacity: 0.7,
      fontSize: '0.9rem'
    },
    // Responsive styles
    mobileStyles: {
      '@media (max-width: 768px)': {
        content: {
          padding: '1rem'
        },
        titleArabic: {
          fontSize: '2.5rem'
        },
        titleEnglish: {
          fontSize: '2rem'
        },
        countdown: {
          gap: '1rem'
        },
        countdownItem: {
          minWidth: '80px',
          padding: '1rem 0.5rem'
        },
        countdownNumber: {
          fontSize: '2rem'
        },
        subscriptionForm: {
          flexDirection: 'column'
        },
        hadithReference: {
          flexDirection: 'column',
          gap: '0.5rem'
        }
      },
      '@media (max-width: 480px)': {
        logo: {
          flexDirection: 'column',
          gap: '0.5rem'
        },
        arabicText: {
          fontSize: '2rem'
        },
        englishText: {
          fontSize: '1.5rem'
        }
      }
    }
  };

  // Apply responsive styles
  const applyResponsiveStyles = (baseStyle, responsiveStyles) => {
    return {
      ...baseStyle,
      ...(window.innerWidth <= 768 && responsiveStyles['@media (max-width: 768px)']),
      ...(window.innerWidth <= 480 && responsiveStyles['@media (max-width: 480px)'])
    };
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern}></div>
      
      <div style={applyResponsiveStyles(styles.content, styles.mobileStyles)}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.arabicText}>حديـث</span>
            <span style={styles.englishText}>Hadith</span>
          </div>
        </header>

        {/* Main Content */}
        <main style={styles.mainContent}>
          <div style={styles.announcement}>
            <h1 style={styles.title}>
              <span style={styles.titleArabic}>يأتي قريباً</span>
              <span style={styles.titleEnglish}>Coming Soon</span>
            </h1>
            
            <p style={styles.subtitle}>
              A comprehensive collection of authentic Hadith with detailed explanations, 
              search functionality, and daily reminders. Join us in preserving and sharing 
              the wisdom of Prophet Muhammad (ﷺ).
            </p>
          </div>

          {/* Featured Hadith */}
          <div style={styles.featuredHadith}>
            <div style={styles.hadithCard}>
              <div style={styles.hadithText}>"{hadithCollection[currentHadith].text}"</div>
              <div style={styles.hadithReference}>
                <span style={styles.narrator}>{hadithCollection[currentHadith].narrator}</span>
                <span style={styles.book}>{hadithCollection[currentHadith].reference}</span>
              </div>
            </div>
          </div>

            <Button href='/' style={{color: '#fff', background: '#328344', fontSize : '20px', padding : '30px'}}> <HomeFilled/> Back to Home </Button>


          {/* Countdown Timer */}
          {/* <div style={styles.countdown}>
            <div style={styles.countdownItem}>
              <span style={styles.countdownNumber}>{countdown.days}</span>
              <span style={styles.countdownLabel}>Days</span>
            </div>
            <div style={styles.countdownItem}>
              <span style={styles.countdownNumber}>{countdown.hours}</span>
              <span style={styles.countdownLabel}>Hours</span>
            </div>
            <div style={styles.countdownItem}>
              <span style={styles.countdownNumber}>{countdown.minutes}</span>
              <span style={styles.countdownLabel}>Minutes</span>
            </div>
            <div style={styles.countdownItem}>
              <span style={styles.countdownNumber}>{countdown.seconds}</span>
              <span style={styles.countdownLabel}>Seconds</span>
            </div>
          </div>

          <div style={styles.subscription}>
            <h3 style={styles.subscriptionH3}>Get Notified When We Launch</h3>
            {subscribed ? (
              <div style={styles.successMessage}>
                <span style={styles.successIcon}>✓</span>
                Thank you! We'll notify you when we launch.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={styles.subscriptionForm}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.emailInput}
                  onFocus={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button 
                  type="submit" 
                  style={styles.subscribeBtn}
                  onMouseOver={(e) => {
                    e.target.style.background = '#f39c12';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#f1c40f';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Notify Me
                </button>
              </form>
            )}
          </div> */}

        </main>

        {/* Footer */}
        <footer style={styles.footer}>
          <div style={styles.socialLinks}>
            <a 
              href="#" 
              aria-label="Facebook"
              style={styles.socialLink}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >📘</a>
            <a 
              href="#" 
              aria-label="Twitter"
              style={styles.socialLink}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >🐦</a>
            <a 
              href="#" 
              aria-label="Instagram"
              style={styles.socialLink}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >📷</a>
          </div>
          <p style={styles.copyright}>
            &copy; {new Date().getFullYear()} Muslim Hall. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default HadithComingSoon;