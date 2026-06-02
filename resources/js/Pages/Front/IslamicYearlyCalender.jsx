import React, { useState, useEffect } from 'react'
import { toHijri, toGregorian } from 'hijri-converter'
import './IslamicYearlyCalender.css'
import Header from './Header'
import Footer from './Footer'

// SVG Icon Components
const Icons = {
  Calendar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
  ),
  Globe: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
  ),
  LayoutGrid: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  )
}

const IslamicYearlyCalendar = () => {
  const [currentHijriYear, setCurrentHijriYear] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [calendarData, setCalendarData] = useState([])
  const [view, setView] = useState('monthly')
  const [language, setLanguage] = useState('en') 
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)

  const translations = {
    en: {
      title: 'Islamic Hijri Calendar',
      loading: 'Loading Calendar...',
      today: 'Today:',
      monthlyView: 'Monthly',
      yearlyOverview: 'Yearly',
      previousYear: 'Previous',
      nextYear: 'Next',
      hijriDate: 'Hijri',
      gregorianDate: 'Gregorian',
      day: 'Day',
      islamicEvents: 'Events',
      viewFullMonth: 'View Month',
      eventLegend: 'Event Legend',
      veryImportant: 'Very Important',
      important: 'Important',
      celebration: 'Celebration',
      optional: 'Optional',
      calendarInfo: 'The Islamic calendar is a lunar calendar based on the moon\'s phases. Each month begins with the sighting of the new crescent moon.',
      months: [
        { name: 'Muharram', meaning: 'Sacred' },
        { name: 'Safar', meaning: 'Void' },
        { name: 'Rabi\' al-Awwal', meaning: 'First Spring' },
        { name: 'Rabi\' al-Thani', meaning: 'Second Spring' },
        { name: 'Jumada al-Awwal', meaning: 'First Dry' },
        { name: 'Jumada al-Thani', meaning: 'Second Dry' },
        { name: 'Rajab', meaning: 'Respected' },
        { name: 'Sha\'ban', meaning: 'Scattered' },
        { name: 'Ramadan', meaning: 'Burning Heat' },
        { name: 'Shawwal', meaning: 'Raised' },
        { name: 'Dhu al-Qi\'dah', meaning: 'Truce' },
        { name: 'Dhu al-Hijjah', meaning: 'Pilgrimage' }
      ],
      events: {
        1: { 1: { name: 'Islamic New Year', type: 'important' }, 10: { name: 'Day of Ashura', type: 'important' } },
        3: { 12: { name: 'Mawlid al-Nabi', type: 'celebration' } },
        7: { 27: { name: 'Isra and Mi\'raj', type: 'important' } },
        8: { 15: { name: 'Mid-Sha\'ban', type: 'optional' } },
        9: { 1: { name: 'First day of Ramadan', type: 'important' }, 27: { name: 'Laylat al-Qadr', type: 'very-important' } },
        10: { 1: { name: 'Eid al-Fitr', type: 'celebration' } },
        12: { 8: { name: 'Day of Arafah', type: 'very-important' }, 9: { name: 'Eid al-Adha', type: 'celebration' } }
      }
    },
    bn: {
      title: 'ইসলামিক হিজরি ক্যালেন্ডার',
      loading: 'লোড হচ্ছে...',
      today: 'আজ:',
      monthlyView: 'মাসিক',
      yearlyOverview: 'বার্ষিক',
      previousYear: 'পূর্ববর্তী',
      nextYear: 'পরবর্তী',
      hijriDate: 'হিজরি',
      gregorianDate: 'গ্রেগরিয়ান',
      day: 'দিন',
      islamicEvents: 'ইভেন্ট',
      viewFullMonth: 'বিস্তারিত দেখুন',
      eventLegend: 'ইভেন্ট পরিচিতি',
      veryImportant: 'অত্যন্ত গুরুত্বপূর্ণ',
      important: 'গুরুত্বপূর্ণ',
      celebration: 'উৎসব',
      optional: 'ঐচ্ছিক',
      calendarInfo: 'ইসলামিক ক্যালেন্ডার চাঁদের পর্যায়ের উপর ভিত্তি করে একটি চান্দ্র ক্যালেন্ডার। প্রতিটি মাস নতুন চাঁদ দেখার সাথে শুরু হয়।',
      months: [
        { name: 'মুহাররম', meaning: 'পবিত্র' }, { name: 'সফর', meaning: 'খালি' }, { name: 'রবিউল আউয়াল', meaning: 'প্রথম বসন্ত' },
        { name: 'রবিউস সানি', meaning: 'দ্বিতীয় বসন্ত' }, { name: 'জমাদিউল আউয়াল', meaning: 'প্রথম শুষ্ক' }, { name: 'জমাদিউস সানি', meaning: 'দ্বিতীয় শুষ্ক' },
        { name: 'রজব', meaning: 'সম্মানিত' }, { name: 'শাবান', meaning: 'ছড়িয়ে পড়া' }, { name: 'রমজান', meaning: 'দহন তাপ' },
        { name: 'শাওয়াল', meaning: 'উত্থিত' }, { name: 'জিলকদ', meaning: 'সন্ধি' }, { name: 'জিলহজ', meaning: 'হজ্জ' }
      ],
      events: {
        1: { 1: { name: 'নববর্ষ', type: 'important' }, 10: { name: 'আশুরা', type: 'important' } },
        9: { 1: { name: 'রমজান শুরু', type: 'important' }, 27: { name: 'লাইলাতুল কদর', type: 'very-important' } },
        10: { 1: { name: 'ঈদুল ফিতর', type: 'celebration' } },
        12: { 9: { name: 'ঈদুল আযহা', type: 'celebration' } }
      }
    },
    ar: {
      title: 'التقويم الهجري الإسلامي',
      loading: 'جاري التحميل...',
      today: 'اليوم:',
      monthlyView: 'شهري',
      yearlyOverview: 'سنوي',
      previousYear: 'السابق',
      nextYear: 'التالي',
      hijriDate: 'هجري',
      gregorianDate: 'ميلادي',
      day: 'اليوم',
      islamicEvents: 'المناسبات',
      viewFullMonth: 'عرض الشهر',
      eventLegend: 'دليل الأحداث',
      veryImportant: 'هام جداً',
      important: 'هام',
      celebration: 'احتفال',
      optional: 'اختياري',
      calendarInfo: 'التقويم الإسلامي هو تقويم قمري يعتمد على أطوار القمر. يبدأ كل شهر برؤية الهلال.',
      months: [
        { name: 'محرم', meaning: 'حرام' }, { name: 'صفر', meaning: 'فراغ' }, { name: 'ربيع الأول', meaning: 'ربيع' },
        { name: 'ربيع الثاني', meaning: 'ربيع' }, { name: 'جمادى الأولى', meaning: 'جفاف' }, { name: 'جمادى الآخرة', meaning: 'جفاف' },
        { name: 'رجب', meaning: 'احترام' }, { name: 'شعبان', meaning: 'تفرق' }, { name: 'رمضان', meaning: 'حرارة' },
        { name: 'شوال', meaning: 'رفع' }, { name: 'ذو القعدة', meaning: 'هدنة' }, { name: 'ذو الحجة', meaning: 'حج' }
      ],
      events: {
        1: { 1: { name: 'رأس السنة', type: 'important' }, 10: { name: 'عاشوراء', type: 'important' } },
        9: { 1: { name: 'بداية رمضان', type: 'important' }, 27: { name: 'ليلة القدر', type: 'very-important' } },
        10: { 1: { name: 'عيد الفطر', type: 'celebration' } },
        12: { 9: { name: 'عيد الأضحى', type: 'celebration' } }
      }
    }
  }

  const t = translations[language]
  const islamicMonths = t.months

  useEffect(() => {
    const today = new Date()
    const hijriDate = toHijri(today.getFullYear(), today.getMonth() + 1, today.getDate())
    setCurrentHijriYear(hijriDate.hy)
    setSelectedMonth(hijriDate.hm - 1)
  }, [])

  useEffect(() => {
    if (currentHijriYear !== null && selectedMonth !== null && view === 'monthly') {
      generateMonthlyCalendar()
    }
  }, [currentHijriYear, selectedMonth, view, language])

  const handleLanguageChange = (lang) => {
    setIsChangingLanguage(true)
    setLanguage(lang)
    setTimeout(() => setIsChangingLanguage(false), 400)
  }

  const generateMonthlyCalendar = () => {
    const data = []
    let daysInMonth = 29
    try {
      toGregorian(currentHijriYear, selectedMonth + 1, 30)
      daysInMonth = 30
    } catch (e) {
      daysInMonth = 29
    }

    for (let i = 1; i <= daysInMonth; i++) {
      try {
        const greg = toGregorian(currentHijriYear, selectedMonth + 1, i)
        const dateObj = new Date(greg.gy, greg.gm - 1, greg.gd)
        
        let dayName = dateObj.toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' })
        
        data.push({
          hijriDay: i,
          hijriMonth: selectedMonth + 1,
          gregorianDate: dateObj,
          dayName: dayName,
          isToday: isToday(dateObj)
        })
      } catch (e) {}
    }
    setCalendarData(data)
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const navigateYear = (dir) => setCurrentHijriYear(prev => prev + dir)

  const formatGregorian = (date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  if (currentHijriYear === null) return <div className="loader-container"><div className="spinner"></div></div>

  return (
    <><Header />
    <div className={`container ${language === 'ar' ? 'rtl' : 'ltr'}`} lang={language}>
      
      
      <main className="calendar-card">
        {/* Top Header Section */}
        <div className="card-header-main">
          <div className="brand-section">
            <div className="icon-box"><Icons.Calendar /></div>
            <div>
              <h1>{t.title}</h1>
              <p className="today-badge">{t.today} {currentHijriYear} AH</p>
            </div>
          </div>

          <div className="language-nav">
            {['en', 'bn', 'ar'].map(lang => (
              <button 
                key={lang}
                className={`lang-pill ${language === lang ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lang)}
              >
                {lang === 'en' ? 'EN' : lang === 'bn' ? 'বাংলা' : 'العربية'}
              </button>
            ))}
          </div>
        </div>

        {/* View Switcher & Year Nav */}
        <div className="controls-bar">
          <div className="view-switcher">
            <button className={view === 'monthly' ? 'active' : ''} onClick={() => setView('monthly')}>{t.monthlyView}</button>
            <button className={view === 'yearly' ? 'active' : ''} onClick={() => setView('yearly')}>{t.yearlyOverview}</button>
          </div>

          <div className="year-stepper">
            <button onClick={() => navigateYear(-1)} aria-label="Prev Year"><Icons.ChevronLeft /></button>
            <span className="year-display">{currentHijriYear} <sub>AH</sub></span>
            <button onClick={() => navigateYear(1)} aria-label="Next Year"><Icons.ChevronRight /></button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className={`content-area ${isChangingLanguage ? 'fade' : ''}`}>
          {view === 'monthly' ? (
            <div className="monthly-layout">
              <div className="month-info-header">
                <h2>{islamicMonths[selectedMonth].name}</h2>
                <p>{islamicMonths[selectedMonth].meaning}</p>
              </div>

              <div className="month-grid-wrapper">
                <div className="month-grid-header">
                  <div>{t.hijriDate}</div>
                  <div>{t.gregorianDate}</div>
                  <div>{t.day}</div>
                  <div className="hide-mobile">{t.islamicEvents}</div>
                </div>
                {calendarData.map((day, idx) => {
                  const event = t.events[day.hijriMonth]?.[day.hijriDay]
                  return (
                    <div key={idx} className={`day-row ${day.isToday ? 'is-today' : ''} ${event ? 'has-event' : ''}`}>
                      <div className="hijri-cell"><strong>{day.hijriDay}</strong></div>
                      <div className="greg-cell">{formatGregorian(day.gregorianDate)}</div>
                      <div className="day-cell">{day.dayName}</div>
                      <div className="event-cell">
                        {event && <span className={`event-tag ${event.type}`}>{event.name}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="month-selector-ribbon">
                {islamicMonths.map((m, i) => (
                  <button key={i} className={selectedMonth === i ? 'active' : ''} onClick={() => setSelectedMonth(i)}>
                    {m.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="yearly-grid">
              {islamicMonths.map((m, i) => (
                <div key={i} className="year-month-card">
                  <h3>{m.name}</h3>
                  <button className="view-btn" onClick={() => { setSelectedMonth(i); setView('monthly'); }}>
                    {t.viewFullMonth} <Icons.ChevronRight />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="card-footer-info">
          <div className="legend-box">
             <div className="legend-item"><span className="dot very-important"></span> {t.veryImportant}</div>
             <div className="legend-item"><span className="dot important"></span> {t.important}</div>
             <div className="legend-item"><span className="dot celebration"></span> {t.celebration}</div>
          </div>
          <p className="info-text">{t.calendarInfo}</p>
        </div>
      </main>

      
    </div><Footer /></>
  )
}

export default IslamicYearlyCalendar