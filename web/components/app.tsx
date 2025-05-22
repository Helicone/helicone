import { BrowserRouter, Route, Routes } from "react-router";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/page-one" element={<p>page one</p>} />
        <Route path="/page-two" element={<p>page two</p>} />
      </Routes>
    </BrowserRouter>
  );
}
