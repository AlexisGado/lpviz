import { useEffect, useRef, useState } from "react";
import { useConstraintsStore, useObjectiveStore } from "../stores";
import { getLineCoordinates, type Expression } from "../ExpressionParser";
import { MAX_VARIABLES_VALUE, MIN_VARIABLES_VALUE } from "../constants";

function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objective = useObjectiveStore((state) => state.objective);
  const constraints = useConstraintsStore((state) => state.constraints);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Scale and translate the canvas to fit the coordinates
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset the transformation matrix
      ctx.translate(-MIN_VARIABLES_VALUE, -MIN_VARIABLES_VALUE);

      // Clear the canvas
      ctx.clearRect(
        MIN_VARIABLES_VALUE,
        MIN_VARIABLES_VALUE,
        MAX_VARIABLES_VALUE - MIN_VARIABLES_VALUE,
        MAX_VARIABLES_VALUE - MIN_VARIABLES_VALUE,
      );

      // Draw the constraints rectangles
      constraints.forEach((constraint) => {
        if (!constraint.constraint) return;

        const expression: Expression = {
          type: "operation",
          operator: "-",
          left:
            constraint.constraint.operator === ">"
              ? constraint.constraint.left
              : constraint.constraint.right,
          right:
            constraint.constraint.operator === ">"
              ? constraint.constraint.right
              : constraint.constraint.left,
        };

        const constraintCoordinates = getLineCoordinates(expression);
        const normalVector = getLineCoordinates(expression, true);

        const x1 = constraintCoordinates.x1;
        const y1 = constraintCoordinates.y1;
        const x2 = constraintCoordinates.x2;
        const y2 = constraintCoordinates.y2;

        const x3 =
          constraintCoordinates.x1 + normalVector.x2 * MAX_VARIABLES_VALUE * 4;
        const y3 =
          constraintCoordinates.y1 + normalVector.y2 * MAX_VARIABLES_VALUE * 4;
        const x4 =
          constraintCoordinates.x2 + normalVector.x2 * MAX_VARIABLES_VALUE * 4;
        const y4 =
          constraintCoordinates.y2 + normalVector.y2 * MAX_VARIABLES_VALUE * 4;

        // Draw rectangle
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x4, y4);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.fill();
      });

      // Draw the axis
      ctx.beginPath();
      ctx.moveTo(MIN_VARIABLES_VALUE, 0);
      ctx.lineTo(MAX_VARIABLES_VALUE, 0);
      ctx.moveTo(0, MIN_VARIABLES_VALUE);
      ctx.lineTo(0, MAX_VARIABLES_VALUE);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "gray";
      ctx.stroke();

      // Draw the objective line
      if (!objective) return;

      const { x2: x2Normal, y2: y2Normal } = getLineCoordinates(
        objective,
        true,
      ); // Normal vector
      const x2 = (x2Normal * MAX_VARIABLES_VALUE) / 4;
      const y2 = (y2Normal * MAX_VARIABLES_VALUE) / 4;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x2, y2);

      // Draw arrowhead
      const arrowLength = MAX_VARIABLES_VALUE / 15;
      const arrowAngle = Math.atan2(y2, x2);
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
        y2 - arrowLength * Math.sin(arrowAngle - Math.PI / 6),
      );
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
        y2 - arrowLength * Math.sin(arrowAngle + Math.PI / 6),
      );

      ctx.lineWidth = 5;
      ctx.strokeStyle = "green";
      ctx.stroke();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        return;
      }
      throw error;
    }
  }, [objective, constraints]);

  return (
    <div style={{ width: "50%" }}>
      <canvas
        width={MAX_VARIABLES_VALUE - MIN_VARIABLES_VALUE}
        height={MAX_VARIABLES_VALUE - MIN_VARIABLES_VALUE}
        style={{ border: "1px solid black", width: "100%", height: "100%" }}
        ref={canvasRef}
      ></canvas>
      {errorMessage && <span style={{ color: "red" }}>{errorMessage}</span>}
    </div>
  );
}

export default Canvas;
