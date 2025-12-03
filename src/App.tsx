import Header from "./components/Header";
import NotFound from "./pages/NotFound";
import { Route, Routes } from "react-router-dom";
import { UserProvider } from "./context/UserContext.tsx";

function App() {
  return (
    <UserProvider>
      <Header />
      <Routes>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
