import {
  MAX_VARIABLES_VALUE,
  MIN_VARIABLES_VALUE,
  X_VARIABLE,
  Y_VARIABLE,
} from "./constants";

type Operator = "+" | "-" | "*" | "/";

type ExpressionType = "number" | "variable" | "operation";

interface ExpressionBase {
  type: ExpressionType;
}

interface NumberLiteral extends ExpressionBase {
  type: "number";
  value: number;
}
interface Variable extends ExpressionBase {
  type: "variable";
  name: string;
}

interface OperationExpression extends ExpressionBase {
  type: "operation";
  operator: Operator;
  left: Expression;
  right: Expression;
}

export type Expression = NumberLiteral | Variable | OperationExpression;

function parseOperator(input: string): Operator {
  switch (input) {
    case "+":
    case "-":
    case "*":
    case "/":
      return input;
    default:
      throw new Error(`Unknown operation: ${input}`);
  }
}

function parsePrimitive(input: string, variables: string[]): Expression {
  if (input.match(/^\d+$/)) {
    return { type: "number", value: parseInt(input, 10) };
  } else if (variables.includes(input)) {
    return { type: "variable", name: input };
  } else {
    throw new Error(`Unknown variable or number: ${input}`);
  }
}

function parseClause(input: string, variables: string[]): Expression {
  // Split on * and / operators
  const primitivesAndOps = input
    .split(/([*/])/)
    .map((elem) => elem.trim())
    .filter((elem) => elem.length > 0);

  if (primitivesAndOps.length === 1) {
    return parsePrimitive(primitivesAndOps[0], variables);
  }
  if (primitivesAndOps.length < 3) {
    throw new Error(`Invalid clause: ${input}`);
  }
  const left = parsePrimitive(primitivesAndOps[0], variables);
  const operator = parseOperator(primitivesAndOps[1]);
  const right = parseClause(primitivesAndOps.slice(2).join(" "), variables);
  return {
    type: "operation",
    operator,
    left,
    right,
  };
}

export function parseExpression(
  input: string,
  variables: string[],
): Expression {
  // Split on + and - operators
  const clausesAndOps = input
    .split(/([+-])/)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 0);

  if (clausesAndOps.length === 1) {
    return parseClause(clausesAndOps[0], variables);
  }
  if (clausesAndOps.length == 2) {
    if (clausesAndOps[0] === "-") {
      // Handle unary minus
      const left: NumberLiteral = { type: "number", value: 0 };
      const operator = parseOperator(clausesAndOps[0]);
      const right = parseClause(clausesAndOps[1], variables);
      return {
        type: "operation",
        operator,
        left,
        right,
      };
    }
  }

  if (clausesAndOps.length < 3) {
    throw new Error(`Invalid expression: ${input}`);
  }

  // We do the nesting from left to right
  // For example, for "a + b - c + d" will become ((a + b) - c) + d
  const left = parseExpression(
    clausesAndOps.slice(0, clausesAndOps.length - 2).join(" "),
    variables,
  );
  const operator = parseOperator(clausesAndOps[clausesAndOps.length - 2]);
  const right = parseClause(clausesAndOps[clausesAndOps.length - 1], variables);
  return {
    type: "operation",
    operator,
    left,
    right,
  };
}

type ComparisonOperator = ">" | "<";

export interface Constraint {
  operator: ComparisonOperator;
  left: Expression;
  right: Expression;
}

function parseComparisonOperator(input: string): ComparisonOperator {
  switch (input) {
    case ">":
    case "<":
      return input;
    default:
      throw new Error(`Unknown comparison operator: ${input}`);
  }
}

export function parseConstraint(
  input: string,
  variables: string[],
): Constraint {
  const expressionsAndOps = input.split(/([<>=])/);

  if (expressionsAndOps.length !== 3) {
    throw new Error(`Invalid constraint: ${input}`);
  }
  const left = parseExpression(expressionsAndOps[0], variables);
  const operator = parseComparisonOperator(expressionsAndOps[1]);
  const right = parseExpression(expressionsAndOps[2], variables);
  return {
    operator,
    left,
    right,
  };
}

// This function returns the coefficients of the expression in the form of
// { variable1: coefficient1, variable2: coefficient2, ... } and the constant
// term as a separate number.
// For example, for the expression "2*x + 3*y - 4 + 2*y", it returns
// { x: 2, y: 5 }, -4
function getExpressionCoefficients(
  expression: Expression,
): [Record<string, number>, number] {
  const coefficients: Record<string, number> = {};
  let constant = 0;

  switch (expression.type) {
    case "number":
      constant += expression.value;
      break;
    case "variable":
      coefficients[expression.name] = (coefficients[expression.name] ?? 0) + 1;
      break;
    case "operation": {
      const [leftCoefficients, leftConstant] = getExpressionCoefficients(
        expression.left,
      );
      const [rightCoefficients, rightConstant] = getExpressionCoefficients(
        expression.right,
      );
      switch (expression.operator) {
        case "+":
          Object.entries(leftCoefficients).forEach(([key, value]) => {
            coefficients[key] = (coefficients[key] ?? 0) + value;
          });
          Object.entries(rightCoefficients).forEach(([key, value]) => {
            coefficients[key] = (coefficients[key] ?? 0) + value;
          });
          constant += leftConstant + rightConstant;
          break;
        case "-":
          Object.entries(leftCoefficients).forEach(([key, value]) => {
            coefficients[key] = (coefficients[key] ?? 0) + value;
          });
          Object.entries(rightCoefficients).forEach(([key, value]) => {
            coefficients[key] = (coefficients[key] ?? 0) - value;
          });
          constant += leftConstant - rightConstant;
          break;
        case "*":
          if (
            Object.keys(leftCoefficients).length > 0 &&
            Object.keys(rightCoefficients).length > 0
          ) {
            throw new Error(
              `Expression is not linear: ${JSON.stringify(expression)}`,
            );
          }
          Object.entries(leftCoefficients).forEach(([key, value]) => {
            coefficients[key] =
              (coefficients[key] ?? 1) * value * rightConstant;
          });
          Object.entries(rightCoefficients).forEach(([key, value]) => {
            coefficients[key] = (coefficients[key] ?? 1) * value * leftConstant;
          });
          constant += leftConstant * rightConstant;
          break;
        case "/":
          if (Object.keys(rightCoefficients).length > 0) {
            throw new Error(
              `Expression is not linear: ${JSON.stringify(expression)}`,
            );
          }
          Object.entries(leftCoefficients).forEach(([key, value]) => {
            coefficients[key] =
              ((coefficients[key] ?? 1) * value) / rightConstant;
          });
          Object.entries(rightCoefficients).forEach(([key, value]) => {
            coefficients[key] =
              ((coefficients[key] ?? 1) / value) * leftConstant;
          });
          constant += leftConstant / rightConstant;
          break;
      }
      break;
    }
  }
  return [coefficients, constant];
}

export function getLineCoordinates(
  expression: Expression,
  normal: boolean = false,
): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} {
  const minCoord = MIN_VARIABLES_VALUE;
  const maxCoord = MAX_VARIABLES_VALUE;

  const [coefficients, constant] = getExpressionCoefficients(expression);

  const xCoefficient = coefficients[X_VARIABLE] ?? 0;
  const yCoefficient = -(coefficients[Y_VARIABLE] ?? 0); // Invert y coefficient to match the canvas coordinates
  if (!xCoefficient && !yCoefficient) {
    throw new Error("No variables in the expression");
  }

  if (!normal) {
    if (yCoefficient !== 0) {
      return {
        x1: minCoord,
        y1: (-constant - xCoefficient * minCoord) / yCoefficient,
        x2: maxCoord,
        y2: (-constant - xCoefficient * maxCoord) / yCoefficient,
      };
    } else {
      // Vertical line
      const xValue = -constant / xCoefficient;
      return {
        x1: xValue,
        y1: minCoord,
        x2: xValue,
        y2: maxCoord,
      };
    }
  } else {
    // Draw normal, we ignore the constant term

    const vectorSize = Math.sqrt(
      xCoefficient * xCoefficient + yCoefficient * yCoefficient,
    );
    const xNormal = xCoefficient / vectorSize;
    const yNormal = yCoefficient / vectorSize;

    return {
      x1: 0,
      y1: 0,
      x2: -xNormal,
      y2: -yNormal,
    };
  }
}
