import React from 'react';
import '../css/ContactUs.css';
import Navigation from '../components/Navigation'; // Import Navigation component
import Header from '../components/Header'; // Import Header component
import Footer from '../components/Footer'; // Import Footer component

const ContactInfo = () => {
  return (
    <div className="app-container">
      <Header /> {/* Add Header component */}
      <Navigation /> {/* Add Navigation component */}
      <div className="row main">
        <div className="main-login main-center">
          <div className="row">
            <div className="col-sm-12" style={{ marginBottom: '15px' }}>
              <h4>
                <b>
                  <i>HEADQUARTERS-PANCHKULA</i>
                </b>
              </h4>
              <br />
              <p className="contac">
                <b>PCCF, Haryana</b>
              </p>
              <p className="contac">
                <b>Address:</b> C-18 A, VAN BHAWAN, SEC 6 PANCHKULA
              </p>
              <p className="contac">
                <b>Contact No.</b> 0172-2560118
              </p>
              <p className="contac">
                <b>E Mail:</b> ccf.prt1@yahoo.in
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer /> {/* Add Footer component */}
    </div>
  );
};

export default ContactInfo;