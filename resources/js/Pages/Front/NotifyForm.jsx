import React, { useState } from 'react';

const NotifyForm = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you! We'll notify you at ${email} when we launch.`);
      setEmail('');
    }
  };

  return (
    <form className="notify-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <input 
          type="email" 
          placeholder="Enter your email address" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Notify Me</button>
      </div>
      <p className="form-note">We respect your privacy and will never share your information.</p>
    </form>
  );
};

export default NotifyForm;