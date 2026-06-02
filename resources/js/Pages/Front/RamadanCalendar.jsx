import React, { useState, useEffect, useCallback } from 'react';
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import Header from './Header';
import Footer from './Footer';
import './RamadanCalendarBD.css'; 

// --- SVG ICON DEFINITIONS ---
const Icons = {
  Moon: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
  ),
  Sun: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
  ),
  MapPin: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
  ),
  Globe: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
  )
};

const RamadanCalendarWorldwide = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [ramadanData, setRamadanData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState({ name: 'Mecca, Saudi Arabia', lat: 21.4225, lng: 39.8262, tz: 3 });
  const [currentTime, setCurrentTime] = useState(new Date());

  const majorCities = [
    { name: 'Mecca, Saudi Arabia', lat: 21.4225, lng: 39.8262, tz: 3 },
    { name: 'Medina, Saudi Arabia', lat: 24.4672, lng: 39.6068, tz: 3 },
    { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, tz: 4 },
    { name: 'Doha, Qatar', lat: 25.2854, lng: 51.5310, tz: 3 },
    { name: 'Kuwait City, Kuwait', lat: 29.3759, lng: 47.9774, tz: 3 },
    { name: 'Manama, Bahrain', lat: 26.2285, lng: 50.5860, tz: 3 },
    { name: 'Muscat, Oman', lat: 23.5859, lng: 58.4059, tz: 4 },
    { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357, tz: 2 },
    { name: 'Amman, Jordan', lat: 31.9454, lng: 35.9284, tz: 3 },
    { name: 'Beirut, Lebanon', lat: 33.8938, lng: 35.5018, tz: 2 },
    { name: 'Baghdad, Iraq', lat: 33.3152, lng: 44.3661, tz: 3 },
    { name: 'Jerusalem, Palestine', lat: 31.7683, lng: 35.2137, tz: 2 },
    { name: 'Damascus, Syria', lat: 33.5138, lng: 36.2765, tz: 3 },
    { name: 'Sana’a, Yemen', lat: 15.3694, lng: 44.1910, tz: 3 },
    { name: 'Istanbul, Turkey', lat: 41.0082, lng: 28.9784, tz: 3 },
    { name: 'Dhaka, Bangladesh', lat: 23.8103, lng: 90.4125, tz: 6 },
  ];

  const ramadanStartDates = {
    2024: new Date(2024, 2, 11),
    2025: new Date(2025, 2, 1),
    2026: new Date(2026, 1, 18),
  };

  const calculatePrayerTimes = (date, lat, lng, timezoneOffset) => {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const p = (2 * Math.PI / 365) * (dayOfYear - 1);
    const decl = 0.006918 - 0.399912 * Math.cos(p) + 0.070257 * Math.sin(p);
    
    const format = (offsetHours) => {
      const d = new Date(date);
      d.setHours(12 + offsetHours + (lng/15) - timezoneOffset);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return { sehri: format(-7.1), iftar: format(6.2) };
  };

  const generateData = useCallback(() => {
    let start = ramadanStartDates[currentYear] || new Date(currentYear, 2, 1);
    const data = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const times = calculatePrayerTimes(date, selectedLocation.lat, selectedLocation.lng, selectedLocation.tz);
      data.push({
        day: i + 1,
        dateString: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' }),
        sehri: times.sehri, 
        iftar: times.iftar,
        isToday: new Date().toDateString() === date.toDateString()
      });
    }
    setRamadanData(data);
  }, [currentYear, selectedLocation]);

  useEffect(() => { generateData(); }, [generateData]);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDay = ramadanData.find(d => d.isToday) || ramadanData[0];

  return (
    <FrontAuthenticatedLayout>
      <Header />
      <div className="ramadan-app-wrapper py-2">
        
        
        <main className="container">
          <div className="ramadan-main-card">
            
            {/* Header Gradient */}
            <header className="ramadan-header-gradient">
              <div className="ramadan-brand">
                <div className="brand-icon-box"><Icons.Globe /></div>
                <div>
                  <h1>Ramadan Calendar</h1>
                  <p className="location-subtitle">{selectedLocation.name} • {currentYear}</p>
                </div>
              </div>
              <div className="ramadan-clock-pill">
                <Icons.Clock />
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </header>

            {/* Controls */}
            <div className="ramadan-controls-bar">
              <div className="year-stepper">
                <button onClick={() => setCurrentYear(y => y - 1)}><Icons.ChevronLeft /></button>
                <span className="current-year-val">{currentYear}</span>
                <button onClick={() => setCurrentYear(y => y + 1)}><Icons.ChevronRight /></button>
              </div>

              <div className="location-dropdown-wrapper">
                <Icons.MapPin />
                <select 
                  value={selectedLocation.name} 
                  onChange={(e) => setSelectedLocation(majorCities.find(c => c.name === e.target.value))}
                >
                  {majorCities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
                </select>
              </div>
            </div>

            {/* Highlight Cards */}
            <div className="ramadan-highlights-grid">
              <div className="highlight-card suhoor">
                <div className="h-icon"><Icons.Moon /></div>
                <div className="h-text">
                  <span className="h-label">SUHOOR ENDS</span>
                  <span className="h-value">{currentDay?.sehri}</span>
                </div>
              </div>
              <div className="highlight-card iftar">
                <div className="h-icon"><Icons.Sun /></div>
                <div className="h-text">
                  <span className="h-label">IFTAR STARTS</span>
                  <span className="h-value">{currentDay?.iftar}</span>
                </div>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="ramadan-table-container">
              <table className="ramadan-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Date</th>
                    <th className="text-suhoor">Suhoor Ends</th>
                    <th className="text-iftar">Iftar Starts</th>
                  </tr>
                </thead>
                <tbody>
                  {ramadanData.map((d, idx) => (
                    <tr key={idx} className={d.isToday ? "active-row" : ""}>
                      <td><strong>{d.day}</strong></td>
                      <td>{d.dateString}</td>
                      <td className="font-bold">{d.sehri}</td>
                      <td className="font-bold text-gold">{d.iftar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="ramadan-footer-note">
              <p><Icons.MapPin /> Times calculated for {selectedLocation.name}. Please adjust for local sightings.</p>
            </footer>
          </div>
        </main>

        
      </div>
      <Footer />
    </FrontAuthenticatedLayout>
  );
};

export default RamadanCalendarWorldwide;