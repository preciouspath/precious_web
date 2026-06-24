import React, { useState } from "react";
import Reports from "./Reports";
import MyUpload from "./MyUpload";
import DoctorUpload from "./DoctorUpload";

type PageView = "reports" | "myUpload" | "doctorUpload";

const ReportsContainer: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>("reports");

  const handleNavigateToMyUpload = () => {
    setCurrentView("myUpload");
  };

  const handleNavigateToDoctorUpload = () => {
    setCurrentView("doctorUpload");
  };


  if (currentView === "myUpload") {
    return <MyUpload />;
  }

  if (currentView === "doctorUpload") {
    return <DoctorUpload />;
  }

  return (
    <Reports
      onNavigateToMyUpload={handleNavigateToMyUpload}
      onNavigateToDoctorUpload={handleNavigateToDoctorUpload}
    />
  );
};

export default ReportsContainer;