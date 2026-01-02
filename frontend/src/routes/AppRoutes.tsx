import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import BookToken from "../pages/BookToken";
import Staff from "../pages/Staff";
import Admin from "../pages/Admin";
import TokenStatus from "../pages/TokenStatus";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<BookToken />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/status" element={<TokenStatus />} />
      </Routes>
    </BrowserRouter>
  );
}
