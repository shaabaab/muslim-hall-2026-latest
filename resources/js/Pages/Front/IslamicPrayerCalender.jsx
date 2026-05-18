import React, { useState, useEffect, useCallback } from 'react';
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import './Css1.css'; 
import Header from './Header';
import Footer from './Footer';

const Icons = {
  Location: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Globe: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
  Refresh: ({ className }) => <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
};

const IslamicPrayerCalender = () => {
  const [location, setLocation] = useState({ lat: 23.8103, lng: 90.4125, name: "Dhaka, Bangladesh", timezone: "Asia/Dhaka" });
  const [prayerData, setPrayerData] = useState(null);
  const [dates, setDates] = useState({ gregorian: '', hijri: '', localTime: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [calculationMethod, setCalculationMethod] = useState('MuslimWorldLeague');
  const [lastUpdated, setLastUpdated] = useState('');

  const majorCities = [
    { name: "Dhaka, Bangladesh", lat: 23.8103, lng: 90.4125, tz: "Asia/Dhaka" },
    { name: "Makkah, Saudi Arabia", lat: 21.4225, lng: 39.8262, tz: "Asia/Riyadh" },
    { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708, tz: "Asia/Dubai" },
    { name: "London, UK", lat: 51.5074, lng: -0.1278, tz: "Europe/London" },
    { name: "New York, USA", lat: 40.7128, lng: -74.0060, tz: "America/New_York" },
  ];

  const calculationMethods = {
    'MuslimWorldLeague': 'Muslim World League',
    'Egyptian': 'Egyptian Authority',
    'Karachi': 'U.I.S. Karachi',
    'UmmAlQura': 'Umm al-Qura',
    'NorthAmerica': 'ISNA',
    'Dubai': 'Dubai (GAIA)',
  };

  const calculatePrayerTimes = useCallback(async () => {
    setIsLoading(true);
    try {
      const adhanModule = await import('adhan');
      const { Coordinates, CalculationMethod } = adhanModule;
      const moment = (await import('moment-timezone')).default;
      const coordinates = new Coordinates(location.lat, location.lng);
      const params = CalculationMethod[calculationMethod]();
      const prayerTimes = new adhanModule.PrayerTimes(coordinates, new Date(), params);
      const formatT = (d) => moment(d).tz(location.timezone).format('hh:mm A');

      setPrayerData({
        fajr: formatT(prayerTimes.fajr),
        sunrise: formatT(prayerTimes.sunrise),
        dhuhr: formatT(prayerTimes.dhuhr),
        asr: formatT(prayerTimes.asr),
        maghrib: formatT(prayerTimes.maghrib),
        isha: formatT(prayerTimes.isha),
        current: prayerTimes.currentPrayer(),
        next: prayerTimes.nextPrayer(),
      });

      const now = new Date();
      setDates({
        gregorian: new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: location.timezone }).format(now),
        hijri: new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric', timeZone: location.timezone }).format(now),
        localTime: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: location.timezone }).format(now)
      });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, [location, calculationMethod]);

  useEffect(() => {
    calculatePrayerTimes();
    const interval = setInterval(calculatePrayerTimes, 60000);
    return () => clearInterval(interval);
  }, [calculatePrayerTimes]);

  return (
    <FrontAuthenticatedLayout>
      <Header />
      <div className="prayer-app-wrapper">
        <div className="main-content-container container">
          
          {/* Header & Hero Section */}
          <div className="prayer-hero-card">
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <div className="location-info">
                <span className="live-tag">LIVE</span>
                <h2>{location.name}</h2>
                <p>{dates.gregorian} • {dates.hijri}</p>
              </div>
              <div className="next-prayer-focus">
                <p className="next-label">NEXT PRAYER</p>
                <h1 className="next-time">
                  {prayerData && prayerData[prayerData.next] ? prayerData[prayerData.next] : '--:--'}
                </h1>
                <span className="next-name">
                  {prayerData?.next?.toUpperCase() || 'LOADING'}
                </span>
              </div>
            </div>
          </div>

          {/* Settings Bar */}
          <div className="settings-glass-bar">
            <div className="input-field">
              <Icons.Location />
              <select value={location.name} onChange={(e) => {
                const city = majorCities.find(c => c.name === e.target.value);
                if(city) setLocation({ lat: city.lat, lng: city.lng, name: city.name, timezone: city.tz });
              }}>
                {majorCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-field">
              <Icons.Clock />
              <select value={calculationMethod} onChange={(e) => setCalculationMethod(e.target.value)}>
                {Object.entries(calculationMethods).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button className="update-btn" onClick={calculatePrayerTimes} disabled={isLoading}>
              <Icons.Refresh className={isLoading ? "spinning" : ""} />
              <span>Update</span>
            </button>
          </div>

          {/* Prayer Grid */}
          <div className="prayer-times-grid">
            {['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
              <div key={p} className={`time-card ${prayerData?.current === p ? 'current' : ''} ${prayerData?.next === p ? 'upcoming' : ''}`}>
                <div className="card-inner">
                  <span className="p-name">{p.toUpperCase()}</span>
                  <span className="p-time">{prayerData ? prayerData[p] : '--:--'}</span>
                  {prayerData?.current === p && <span className="status-pill">Active</span>}
                </div>
              </div>
            ))}
          </div>

          <footer className="data-footer">
            <span>Method: {calculationMethods[calculationMethod]}</span>
            <span>Sync: {lastUpdated}</span>
          </footer>
        </div>
      </div>
      <Footer />
    </FrontAuthenticatedLayout>
  );
};

export default IslamicPrayerCalender;