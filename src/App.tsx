import "./App.css";
import Canvas from "./components/Canvas";
import Constraints from "./components/Constraints";
import Objective from "./components/Objective";

function App() {
  return (
    <>
      <h1>LPViz</h1>
      <Objective />
      <div style={{ display: "flex", flexDirection: "row", gap: "5rem" }}>
        <Canvas />
        <Constraints />
      </div>
    </>
  );
}

export default App;
