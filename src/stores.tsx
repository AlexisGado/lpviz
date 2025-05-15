import { create } from "zustand";
import {
  parseConstraint,
  parseExpression,
  type Constraint,
  type Expression,
} from "./ExpressionParser";
import {
  DEFAULT_CONSTRAINT_STR,
  DEFAULT_OBJECTIVE_STR,
  VARIABLES,
} from "./constants";
import { createJSONStorage, persist } from "zustand/middleware";

type ObjectiveStoreState = {
  objectiveStr: string;
  objective: Expression | null;
  error: string | null;
};

type ObjectiveStoreActions = {
  setObjective: (objectiveStr: string) => void;
};

type ObjectiveStore = ObjectiveStoreState & ObjectiveStoreActions;

export const useObjectiveStore = create<ObjectiveStore>()(
  persist(
    (set) => ({
      objectiveStr: DEFAULT_OBJECTIVE_STR,
      objective: parseExpression(DEFAULT_OBJECTIVE_STR, VARIABLES),
      error: null,
      setObjective: (objectiveStr: string) => {
        try {
          const objective = parseExpression(objectiveStr, VARIABLES);
          set({ objectiveStr, objective, error: null });
        } catch (error: unknown) {
          if (error instanceof Error) {
            set({
              objectiveStr,
              objective: null,
              error: error.message,
            });
          } else {
            throw error;
          }
        }
      },
    }),
    {
      name: "objective-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

type ConstraintState = {
  constraintStr: string;
  constraint: Constraint | null;
  error: string | null;
};

type ConstraintsStoreState = {
  constraints: ConstraintState[];
};

type ConstraintsStoreActions = {
  setConstraint: (index: number, constraintStr: string) => void;
  addConstraint: () => void;
  removeConstraint: (index: number) => void;
};
type ConstraintsStore = ConstraintsStoreState & ConstraintsStoreActions;

export const useConstraintsStore = create<ConstraintsStore>()(
  persist(
    (set) => ({
      constraints: [
        {
          constraintStr: DEFAULT_CONSTRAINT_STR,
          constraint: parseConstraint(DEFAULT_CONSTRAINT_STR, VARIABLES),
          error: null,
        },
      ],
      setConstraint: (index: number, constraintStr: string) => {
        try {
          const constraint = parseConstraint(constraintStr, VARIABLES);
          set((state) => {
            const newConstraints = [...state.constraints];
            newConstraints[index] = {
              constraintStr,
              constraint,
              error: null,
            };
            return { constraints: newConstraints };
          });
        } catch (error: unknown) {
          if (error instanceof Error) {
            set((state) => {
              const newConstraints = [...state.constraints];
              newConstraints[index] = {
                constraintStr,
                constraint: null,
                error: error.message,
              };
              return { constraints: newConstraints };
            });
          } else {
            throw error;
          }
        }
      },
      addConstraint: () =>
        set((state) => ({
          constraints: [
            ...state.constraints,
            {
              constraintStr: "",
              constraint: null,
              error: null,
            },
          ],
        })),
      removeConstraint: (index: number) =>
        set((state) => ({
          constraints: state.constraints.filter((_, i) => i !== index),
        })),
    }),
    {
      name: "constraints-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
