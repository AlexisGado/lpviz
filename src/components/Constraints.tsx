import { useConstraintsStore } from "../stores";

function ConstraintInput({ index }: { index: number }) {
  const constraintStr = useConstraintsStore(
    (state) => state.constraints[index].constraintStr,
  );
  const error = useConstraintsStore((state) => state.constraints[index].error);
  const setConstraint = useConstraintsStore((state) => state.setConstraint);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: "1rem",
        width: "20rem",
      }}
    >
      <input
        type="text"
        value={constraintStr}
        onChange={(e) => setConstraint(index, e.target.value)}
        style={{
          borderColor: error ? "red" : "black",
          marginBottom: "0.5rem",
        }}
      />
      {error && <span style={{ color: "red" }}>{error}</span>}
    </div>
  );
}

function Constraints() {
  const nbConstraints = useConstraintsStore(
    (state) => state.constraints.length,
  );
  const removeConstraint = useConstraintsStore(
    (state) => state.removeConstraint,
  );
  const addConstraint = useConstraintsStore((state) => state.addConstraint);

  return (
    <div>
      <h2>Constraints</h2>
      {Array.from({ length: nbConstraints }, (_, index) => (
        <div
          key={index}
          style={{ display: "flex", flexDirection: "row", gap: "1rem" }}
        >
          <ConstraintInput index={index} />
          {nbConstraints > 1 && (
            <button
              onClick={() => {
                removeConstraint(index);
              }}
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        onClick={() => {
          addConstraint();
        }}
      >
        Add Constraint
      </button>
    </div>
  );
}

export default Constraints;
