import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminCustomers from "./pages/AdminCustomers";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminCustomers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;