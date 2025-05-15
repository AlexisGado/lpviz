import { useObjectiveStore } from "../stores";

function Objective() {
  const objectiveStr = useObjectiveStore((state) => state.objectiveStr);
  const error = useObjectiveStore((state) => state.error);
  const setObjective = useObjectiveStore((state) => state.setObjective);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: "1rem",
      }}
    >
      <div>
        {"Minimize  "}
        <input
          type="text"
          value={objectiveStr}
          onChange={(e) => setObjective(e.target.value)}
          style={{
            borderColor: error ? "red" : "black",
            marginBottom: "0.5rem",
            width: "30rem",
          }}
        />
      </div>
      {error && <span style={{ color: "red" }}>{error}</span>}
    </div>
  );
}

export default Objective;
