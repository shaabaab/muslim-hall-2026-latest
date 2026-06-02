import CountdownTimer from './CountdownTimer';
import NotifyForm from './NotifyForm';

const Hadish = () => {
  return (
    <div className="App">
      <header>
        <div className="container">
          <a href="#" className="logo">
            <i className="fas fa-seedling"></i>
            Hadish
          </a>
        </div>
      </header>

      {/* Main Content */}
      <section className="main-content">
        <div className="container">
          <div className="content-left">
            <h1>Something <span>Amazing</span> Is Coming Soon</h1>
            <p>We're working hard to bring you an incredible new experience. Subscribe to get notified when we launch and be the first to know about our special launch offers.</p>
            
          <CountdownTimer/>
          <NotifyForm/>
            
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          
        </div>
      </section>

    </div>
  );
};

export default Hadish;