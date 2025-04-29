import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Footer from "../components/Footer"; // Import Footer if needed
import Header from "../components/Header"; // Import Header component
import "../css/UserDashboard.css"; // Import CSS for UserDashboard

// Placeholder for Header (specific to logged-in users)
const UserHeader = () => (
  <header>
    <nav>
      <ul style={{ display: "flex", gap: "10px", listStyle: "none" }}>
        <li>
          <Link to="/user/application-form">Application Form</Link>
        </li>
        <li>
          <Link to="/user/existing-unit-registration">Existing Unit Registration</Link>
        </li>
        <li>
          <Link to="/user/unit-relocation">Unit Relocation</Link>
        </li>
        <li>
          <Link to="/user/ownership-change">Ownership Change</Link>
        </li>
        <li>
          <Link to="/Account/Login">Logout</Link> {/* Redirect to login on logout */}
        </li>
      </ul>
    </nav>
  </header>
);

// Application Form Component
const ApplicationForm = () => {
  const [applicantType, setApplicantType] = React.useState("");
  const [wbiCategory, setWbiCategory] = React.useState("");

  const handleContinue = (e) => {
    e.preventDefault();
    alert(`Applicant Type: ${applicantType}, WBI Category: ${wbiCategory}`);
  };

  return (
    <div className="container">
      <center>
        <h3 className="title">
          <b>
            APPLICATION FORM TO APPLY FOR NEW LICENSE TO SET UP AND OPERATE A WOOD BASED INDUSTRIAL UNIT
          </b>
        </h3>
      </center>
      <form onSubmit={handleContinue}>
        <div className="row">
          <div className="col-md-4">
            <select
              className="form-control"
              value={applicantType}
              onChange={(e) => setApplicantType(e.target.value)}
            >
              <option value="">Select Type of Applicant</option>
              <option value="1">Individual</option>
              <option value="2">Sole Proprietorship Firm</option>
              <option value="3">Partnership Firm</option>
              <option value="4">Association of Persons (AOP)</option>
              <option value="5">Hindu Undivided Family (HUF)</option>
              <option value="6">Pvt. Ltd. Company</option>
              <option value="7">Ltd. Liability Partnership (LLP)</option>
              <option value="8">Government Undertaking/Government department</option>
              <option value="9">Public Ltd. Company</option>
              <option value="10">Any Other</option>
            </select>
          </div>
          <div className="col-md-4">
            <select
              className="form-control"
              value={wbiCategory}
              onChange={(e) => setWbiCategory(e.target.value)}
            >
              <option value="">Category of WBI for which applied</option>
              <option value="1">Saw Mill</option>
              <option value="2">Veneer Mill</option>
              <option value="3">Plywood Industry</option>
              <option value="4">Standalone Chipper</option>
              <option value="5">Timber Depot</option>
              <option value="7">Standalone Slicer</option>
              <option value="8">Standalone Press</option>
              <option value="9">Medium Density Fibre/High Density Fibre</option>
              <option value="10">Particle Board Unit</option>
              <option value="11">MDF - HDF Board and Particle Board Unit</option>
              <option value="12">Katha Unit</option>
              <option value="14">Particle Board/Block Board/Paper Pulp/Rayon</option>
              <option value="15">Medium Density Fibre/High Density Fibre and Particle Board/Block Board</option>
              <option value="16">Charcoal Units</option>
            </select>
          </div>
          <div className="col-md-4">
            <input type="submit" value="Continue" className="btn btn-primary" />
          </div>
        </div>
      </form>
    </div>
  );
};

// Existing Unit Registration Component
const ExistingUnitRegistration = () => (
  <div className="container">
    <center>
      <h3 className="title">
        <b>Existing Unit Registration / मौजूदा इकाई पंजीकरण</b>
      </h3>
    </center>
    <div className="text-right">
      <a className="btn btn-sm btn-primary" href="/Renewal/SearchWithExistingRegistration">
        Search With Existing License No
      </a>
    </div>
    <br />
    <table className="table-bordered usertb" style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>Sr. No.</th>
          <th>Application No</th>
          <th>Firm Name</th>
          <th>License No</th>
          <th>Firm Address</th>
          <th>Remarks</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan="7">No data available in table</td>
        </tr>
      </tbody>
    </table>
  </div>
);

// Unit Relocation Component
const UnitRelocation = () => (
  <div className="container">
    <center>
      <h3 className="title">
        <b>Unit Relocation Registration</b>
      </h3>
    </center>
    <div className="text-right">
      <a className="btn btn-sm btn-primary" href="/UnitRelocation/AddRelocationUnitI">
        Apply for Relocation of Unit
      </a>
    </div>
    <br />
    <table className="table-bordered usertb" style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>Sr. No.</th>
          <th>Firm Name</th>
          <th>License No</th>
          <th>Application No</th>
          <th>Address</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan="6">No data available in table</td>
        </tr>
      </tbody>
    </table>
  </div>
);

// Ownership Change Component
const OwnershipChange = () => (
  <div className="container">
    <center>
      <h3 className="title">
        <b>Ownership Change Registration</b>
      </h3>
    </center>
    <div className="text-right">
      <a className="btn btn-sm btn-primary" href="/UnitOwnershipChange/SearchWithExistingRegistration">
        Search With Existing License No
      </a>
    </div>
    <br />
    <table className="table-bordered usertb" style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>Sr. No.</th>
          <th>Firm Name</th>
          <th>License No</th>
          <th>Application No</th>
          <th>Address</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan="6">No data available in table</td>
        </tr>
      </tbody>
    </table>
  </div>
);

// Main UserDashboard Component
const UserDashboard = () => {
  return (
    <>
      <Header /> {/* Add Header component */}
      <UserHeader /> {/* Add UserHeader component */}
      <div className="container">
        <Routes>
          {/* Protected Routes for Logged-In Users */}
          <Route path="application-form" element={<ApplicationForm />} />
          <Route path="existing-unit-registration" element={<ExistingUnitRegistration />} />
          <Route path="unit-relocation" element={<UnitRelocation />} />
          <Route path="ownership-change" element={<OwnershipChange />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
};

export default UserDashboard;