import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Groups from "./pages/Groups";
import CreateGroup from "./pages/CreateGroup";
import OwnGroups from "./pages/OwnGroups";
import Profile from "./pages/Profile";
import HandleGroup from "./pages/HandleGroup";
import SharedFavorite from "./pages/SharedFavorite";
import SpecificGroup from "./pages/SpecificGroup";
import SpecificMovie from "./pages/SpecificMovie";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/ryhmat" element={<Groups />} />
        <Route path="/creategroup" element={<CreateGroup />} />
        <Route path="/owngroups" element={<OwnGroups />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/handlegroup" element={<HandleGroup />} />
        <Route path="/sharedfavorite" element={<SharedFavorite />} />
        <Route path="/group/:id" element={<SpecificGroup />} />
        <Route path="/movie/:id" element={<SpecificMovie />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notfound" element={<NotFound />} />
        <Route path="/register" element={<Register />} />
        {/* fallback: any unknown path -> NotFound */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
