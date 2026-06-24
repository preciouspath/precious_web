import axios from "axios";

// Configuration
const API_URL = "http://localhost:4000/api/patient/smartwatch-data";
const USER_ID = "679c6d4ba4c8a245d8b8555a"; // Replace with your actual User ID
const COOKIE = "accessToken=...; refreshToken=..."; // Needs a valid session for 'authenticate' middleware

const simulateAppAPI = async () => {
  console.log("Simulating APP side API call...");
  
  const healthData = {
    data: {
      heartRate: Math.floor(Math.random() * (100 - 60) + 60).toString(),
      steps: Math.floor(Math.random() * 10000).toString(),
      sleep: "8h 30m",
      bloodOxygen: "98",
      bloodPressure: "115/75"
    }
  };

  try {
    const response = await axios.post(API_URL, healthData, {
      headers: {
        Cookie: COOKIE // The app would typically send this or use Bearer token if implemented
      },
      withCredentials: true
    });

    console.log("Backend Response:", response.data);
    console.log("Check your Web Dashboard for real-time updates!");
  } catch (error: any) {
    console.error("API Error:", error.response?.data || error.message);
    console.log("\nNote: You need a valid authentication cookie to test this API.");
  }
};

simulateAppAPI();
