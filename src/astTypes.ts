export const enum Statements {
  SWIM_INSTRUCTION,
  REST_INSTRUCTION,
  MESSAGE,
  PACE_DEFINITION,
  CONSTANT_DEFINITION,
  AUTHOR_DEFINITION,
}

export const enum InstructionModifiers {
  EQUIPMENT_SPECIFICATION,
  PACE,
  TIME,
  BREATHE,
  UNDERWATER,
}

export interface Programme {
  statements: Statement[];
}

export type Instruction = SwimInstruction | RestInstruction | Message;

export interface ConstantDefinition {
  statement: Statements.CONSTANT_DEFINITION;
  constantName: string;
  value: string;
}

export interface AuthorDefintion {
  statement: Statements.AUTHOR_DEFINITION;
  firstName: string;
  lastName: string;
  emailAddress?: string | undefined;
}

export type Statement =
  | Instruction
  | PaceDefinition
  | ConstantDefinition
  | AuthorDefintion;

export interface EquipmentSpecification {
  modifier: InstructionModifiers.EQUIPMENT_SPECIFICATION;
  equipment: string[];
}

export interface Time {
  modifier: InstructionModifiers.TIME;
  minutes: string;
  seconds: string;
}

export interface Underwater {
  modifier: InstructionModifiers.UNDERWATER;
  isTrue: boolean;
}

export type InstructionModifier =
  | EquipmentSpecification
  | Pace
  | Time
  | Underwater
  | Breathe;

export interface SwimInstruction {
  statement: Statements.SWIM_INSTRUCTION;
  repetitions: number;
  instruction: SingleInstruction | BlockInstruction;
  strokeModifier: string;
  instructionModifiers: InstructionModifier[];
  instructionDescription?: Message;
}

export interface SingleInstruction {
  isBlock: false;
  distance: string;
  stroke: string;
}

export interface BlockInstruction {
  isBlock: true;
  instructions: Instruction[];
}

export interface RestInstruction {
  statement: Statements.REST_INSTRUCTION;
  minutes: string;
  seconds: string;
}

export interface Intensity {
  isAlias: boolean;
  value: string;
}

export interface Pace {
  modifier: InstructionModifiers.PACE;
  startIntensity: Intensity;
  stopIntensity?: Intensity | undefined;
}

export interface PaceDefinition {
  statement: Statements.PACE_DEFINITION;
  name: string;
  pace: Pace;
}

export interface Message {
  statement: Statements.MESSAGE;
  message: string;
}

export interface Breathe {
  modifier: InstructionModifiers.BREATHE;
  breatheStrokes: string;
}
