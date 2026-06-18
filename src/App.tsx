import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import UploadPage from "@/pages/UploadPage";
import VerifyPage from "@/pages/VerifyPage";
import ValidatePage from "@/pages/ValidatePage";
import ExceptionsPage from "@/pages/ExceptionsPage";
import SettingsPage from "@/pages/SettingsPage";
import StatisticsPage from "@/pages/StatisticsPage";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/validate" element={<ValidatePage />} />
          <Route path="/exceptions" element={<ExceptionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="*" element={<Navigate to="/upload" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
