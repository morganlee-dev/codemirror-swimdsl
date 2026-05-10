import { TreeCursor } from "@lezer/common";
import {
  AuthorDefintion,
  BlockInstruction,
  Breathe,
  ConstantDefinition,
  Instruction,
  InstructionModifier,
  InstructionModifiers,
  Intensity,
  Message,
  Pace,
  PaceDefinition,
  Programme,
  RestInstruction,
  SingleInstruction,
  Statement,
  Statements,
  SwimInstruction,
} from "./astTypes";
import { EditorState } from "@codemirror/state";

/**
 * Create an AST node for a `Pace` CST node.
 *
 * Precondition: `cursor` points to a `Pace`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `Pace` AST node.
 */
function visitPace(cursor: TreeCursor, state: EditorState): Pace {
  // Move down into starting intensity
  cursor.firstChild();

  const startIntensity: Intensity = {
    isAlias: cursor.name === "PaceAlias",
    value: state.sliceDoc(cursor.from, cursor.to),
  };

  let stopIntensity: Intensity | undefined = undefined;

  // Move to finishing Intensity if it exists
  if (cursor.nextSibling()) {
    stopIntensity = {
      isAlias: cursor.name === "PaceAlias",
      value: state.sliceDoc(cursor.from, cursor.to),
    };
  }

  // Move back up to Pace
  cursor.parent();

  return {
    modifier: InstructionModifiers.PACE,
    startIntensity,
    stopIntensity,
  };
}

/**
 * Create an AST node for a `PaceDefinition` CST node.
 *
 * Precondition: `cursor` points to a `PaceAlias`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `PaceDefinition` AST node.
 */
function visitPaceDefinition(
  cursor: TreeCursor,
  state: EditorState,
): PaceDefinition {
  // Move into PaceDefinitionName
  cursor.firstChild();
  const name = state.sliceDoc(cursor.from, cursor.to);

  // Move into Pace
  cursor.nextSibling();
  const pace = visitPace(cursor, state);

  // Move back up to the PaceDefinition
  cursor.parent();

  return { statement: Statements.PACE_DEFINITION, name, pace };
}

/**
 * Creates an AST node for `Breathe` CST node
 *
 * Precondition: `cursor` points to a `Breathe`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `Breathe` AST node
 */
function visitBreathe(cursor: TreeCursor, state: EditorState): Breathe {
  // Move into the breatheStrokes value
  cursor.firstChild();
  const breatheStrokes = state.sliceDoc(cursor.from, cursor.to);

  // Step back up to the Breathe
  cursor.parent();
  return {
    modifier: InstructionModifiers.BREATHE,
    breatheStrokes: breatheStrokes,
  };
}

/**
 * Create an AST node for an `instruction` CST node.
 *
 * Precondition: `cursor` points to any of `SwimInstruction`,
 * `RestInstruction`, or `Message`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An `Instruction` AST node.
 */
function visitInstruction(cursor: TreeCursor, state: EditorState): Instruction {
  if (cursor.name === "SwimInstruction") {
    return visitSwimInstruction(cursor, state);
  }

  if (cursor.name === "RestInstruction") {
    return visitRestInstruction(cursor, state);
  }

  return visitMessage(cursor, state);
}

/**
 * Create an AST node for a `Duration` CST node.
 *
 * Precondition: `cursor` points to a `Duration` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `PaceDefinition` AST node.
 */
function visitDuration(
  cursor: TreeCursor,
  state: EditorState,
): { minutes: string; seconds: string } {
  // Move down to minutes Number
  cursor.firstChild();
  const minutes = state.sliceDoc(cursor.from, cursor.to);

  // Move to seconds Number
  cursor.nextSibling();
  const seconds = state.sliceDoc(cursor.from, cursor.to);

  // Move back up to Duration
  cursor.parent();

  return { minutes, seconds };
}

/**
 * Convert the swimDSL equipment name to the swiML equipment name.
 *
 * @param equipmentName - The swimDSL name of an eqipment item.
 *
 * @returns The swiML name of the same item.
 */
function getEquipment(equipmentName: string | undefined): string {
  switch (equipmentName) {
    case "Board":
      return "board";

    case "Pads":
      return "pads";

    case "PullBuoy":
      return "pullBuoy";

    case "Fins":
      return "fins";

    case "Snorkel":
      return "snorkel";

    case "Chute":
      return "chute";

    case "StretchCord":
      return "stretchCord";

    default:
      return "";
  }
}

/**
 * Create an AST node for an `instructionModifier` CST node.
 *
 * Precondition: `cursor` points to one of `EquipmentSpecification`, `Pace`, or
 * `Duration`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An `InstructionModifier` AST node.
 */
function visitInstructionModifier(
  cursor: TreeCursor,
  state: EditorState,
): InstructionModifier {
  if (cursor.name === "EquipmentSpecification") {
    const equipment: string[] = [];

    // Move down into first EquipmentName
    cursor.firstChild();

    do {
      const equipmentName = state.sliceDoc(cursor.from, cursor.to);
      equipment.push(getEquipment(equipmentName));
    } while (cursor.nextSibling());

    // Step back up to the EquipmentSpecification
    cursor.parent();

    return {
      modifier: InstructionModifiers.EQUIPMENT_SPECIFICATION,
      equipment,
    };
  }

  if (cursor.name === "Pace") {
    return visitPace(cursor, state);
  }

  if (cursor.name === "Breathe") {
    return visitBreathe(cursor, state);
  }

  if (cursor.name === "Underwater") {
    return {
      modifier: InstructionModifiers.UNDERWATER,
      isTrue: true,
    };
  }

  // We are in Duration
  return {
    modifier: InstructionModifiers.TIME,
    ...visitDuration(cursor, state),
  };
}

/**
 * Convert the swimDSL stroke name to the swiML stroke name.
 *
 * @param strokeName - The swimDSL name of stroke.
 *
 * @returns The swiML name of the same stroke.
 */
function getStroke(strokeName: string): string {
  switch (strokeName) {
    case "Freestyle":
    case "Free":
    case "Fr":
      return "freestyle";

    case "Backstroke":
    case "Back":
    case "Bk":
      return "backstroke";

    case "Breaststroke":
    case "Breast":
    case "Br":
      return "breaststroke";

    case "Butterfly":
    case "Fly":
    case "Fl":
      return "butterfly";

    case "IndividualMedley":
    case "Medley":
    case "Im":
      return "individualMedley";

    case "ReverseIndividualMedley":
    case "ReverseMedley":
    case "ReverseIm":
      return "reverseIndividualMedley";

    case "IndividualMedleyOverlap":
    case "MedleyOverlap":
    case "ImOverlap":
      return "individualMedleyOverlap";

    case "IndividualMedleyOrder":
    case "MedleyOrder":
    case "ImOrder":
      return "individualMedleyOrder";

    case "ReverseIndividualMedleyOrder":
    case "ReverseMedleyOrder":
    case "ReverseImOrder":
      return "reverseIndividualMedleyOrder";

    case "NumberOne":
      return "nr1";

    case "NumberTwo":
      return "nr2";

    case "NumberThree":
      return "nr3";

    case "NumberFour":
      return "nr4";

    case "NotFreestyle":
    case "NotFree":
    case "NotFr":
      return "notFreestyle";

    case "NotBackstroke":
    case "NotBack":
    case "NotBk":
      return "notBackstroke";

    case "NotBreastroke":
    case "NotBreast":
    case "NotBr":
      return "notBreastroke";

    case "NotButterfly":
    case "NotFly":
    case "NotFl":
      return "notButterfly";

    case "Choice":
    default:
      return "any";
  }
}

/**
 * Create an AST node for a `SwimInstruction` CST node.
 *
 * Precondition: `cursor` points to a `SwimInstruction` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `SwimInstruction` AST node.
 */
function visitSwimInstruction(
  cursor: TreeCursor,
  state: EditorState,
): SwimInstruction {
  let repetitions = 1;
  let strokeModifier = "default";
  let instruction: SingleInstruction | BlockInstruction;
  const instructionModifiers: InstructionModifier[] = [];
  let instructionDescription: Message | undefined;

  // Move into either Number (for repetitions) or SingleInstruction |
  // BlockInstruction
  cursor.firstChild();

  if (cursor.name === "Number") {
    repetitions = Number(state.sliceDoc(cursor.from, cursor.to));

    // Move into SingleInstruction | BlockInstruction
    cursor.nextSibling();
  }

  if (cursor.name === "BlockInstruction") {
    // Move into first Instruction of the block
    cursor.firstChild();

    const instructions: Instruction[] = [];
    do {
      instructions.push(visitInstruction(cursor, state));
    } while (cursor.nextSibling());

    instruction = { isBlock: true, instructions };
  } else {
    // Move into Number
    cursor.firstChild();
    const distance = state.sliceDoc(cursor.from, cursor.to);

    // Move into Stroke
    cursor.nextSibling();
    const stroke = getStroke(state.sliceDoc(cursor.from, cursor.to));

    instruction = { isBlock: false, distance, stroke };
  }
  // Move back up to SingleInstruction | BlockInstruction
  cursor.parent();

  if (cursor.nextSibling()) {
    let hasModifiers = true;
    if (cursor.name === "StrokeModifier") {
      strokeModifier = state.sliceDoc(cursor.from, cursor.to);

      // Move away from the StrokeModifier to a potential instruction modifier.
      hasModifiers = cursor.nextSibling();
    }

    if (hasModifiers) {
      do {
        instructionModifiers.push(visitInstructionModifier(cursor, state));
        hasModifiers = cursor.nextSibling();
      } while (cursor.name !== "Message" && hasModifiers);
    }

    // Modifiers finished
    if (cursor.name === "Message") {
      instructionDescription = visitMessage(cursor, state);
    }
  }

  // Move up out of the SwimInstruction
  cursor.parent();

  return {
    statement: Statements.SWIM_INSTRUCTION,
    repetitions,
    instruction,
    strokeModifier,
    instructionModifiers,
    ...(instructionDescription !== undefined && { instructionDescription }),
  };
}

/**
 * Create an AST node for a `RestInstruction` CST node.
 *
 * Precondition: `cursor` points to a `RestInstruction` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `RestInstruction` AST node.
 */
function visitRestInstruction(
  cursor: TreeCursor,
  state: EditorState,
): RestInstruction {
  // Move down to Duration
  cursor.firstChild();

  const duration = visitDuration(cursor, state);

  // Move back up to RestInstruction
  cursor.parent();

  return {
    statement: Statements.REST_INSTRUCTION,
    ...duration,
  };
}

/**
 * Create an AST node for a `Message` CST node.
 *
 * Precondition: `cursor` points to a `Message` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `Message` AST node.
 */
function visitMessage(cursor: TreeCursor, state: EditorState): Message {
  return {
    statement: Statements.MESSAGE,
    message: state.sliceDoc(cursor.from, cursor.to),
  };
}

/**
 * Create an AST node for a `ConstantDefinition` CST node.
 *
 * Precondition: `cursor` points to a `ConstantDefinition` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `ConstantDefinition` AST node.
 */
function visitConstantDefinition(
  cursor: TreeCursor,
  state: EditorState,
): ConstantDefinition {
  // Move into ConstantDefinition
  cursor.firstChild();
  const constantName = state.sliceDoc(cursor.from, cursor.to);

  // Move into Number | StringContent | Boolean
  cursor.nextSibling();
  const value: string = state.sliceDoc(cursor.from, cursor.to);

  // Move up out of the ConstantDefinition
  cursor.parent();
  return {
    statement: Statements.CONSTANT_DEFINITION,
    constantName,
    value,
  };
}

/**
 * Create an AST node for a `AuthorDefinition` CST node.
 *
 * Precondition: `cursor` points to an `AuthorDefinition` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An `AuthorDefinition` AST node.
 */
function visitAuthorDefinition(
  cursor: TreeCursor,
  state: EditorState,
): AuthorDefintion {
  // Move into AuthorDefinition's first child, the first name
  cursor.firstChild();
  const firstName = state.sliceDoc(cursor.from, cursor.to);

  // Move into last name
  cursor.nextSibling();
  const lastName = state.sliceDoc(cursor.from, cursor.to);

  let emailAddress: string | undefined;
  // Move into email address, if it exists
  if (cursor.nextSibling()) {
    emailAddress = state.sliceDoc(cursor.from, cursor.to);
  }

  // Move back up to the AuthorDefinition
  cursor.parent();
  return {
    statement: Statements.AUTHOR_DEFINITION,
    firstName,
    lastName,
    emailAddress,
  };
}

/**
 * Create an AST for the current program in `state`.
 *
 * Precondition: `cursor` points to the topmost node (`SwimProgramme`).
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An AST as an objection holding a list of top level statements.
 */
export default function buildAst(
  cursor: TreeCursor,
  state: EditorState,
): Programme {
  const statements: Statement[] = [];

  function walk(): void {
    do {
      let node: Statement | null = null;

      switch (cursor.type.name) {
        case "SwimInstruction":
          node = visitSwimInstruction(cursor, state);
          break;
        case "RestInstruction":
          node = visitRestInstruction(cursor, state);
          break;
        case "Message":
          node = visitMessage(cursor, state);
          break;
        case "PaceDefinition":
          node = visitPaceDefinition(cursor, state);
          break;
        case "ConstantDefinition":
          node = visitConstantDefinition(cursor, state);
          break;
        case "AuthorDefinition":
          node = visitAuthorDefinition(cursor, state);
          break;
        default:
          break;
      }

      if (node !== null) {
        statements.push(node);
      }
    } while (cursor.nextSibling());
  }

  cursor.firstChild();
  walk();
  return { statements };
}
