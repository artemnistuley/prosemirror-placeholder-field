import type { Node as PMNode, Schema } from 'prosemirror-model';
import { EditorState, type Command } from 'prosemirror-state';

export function createState(schema: Schema, doc?: PMNode) {
  return EditorState.create({
    schema,
    doc: doc ?? schema.topNodeType.createAndFill() ?? undefined,
  });
}

export function applyCommand(state: EditorState, command: Command): EditorState {
  let nextState = state;

  command(state, (tr) => {
    nextState = nextState.apply(tr);
  });

  return nextState;
}

export function getDocText(state: EditorState) {
  return state.doc.textContent;
}

export function findNodeByAttr(
  doc: PMNode,
  nodeTypeName: string,
  attrName: string,
  attrValue: unknown,
) {
  let result: { node: PMNode; pos: number } | null = null;

  doc.descendants((node, pos) => {
    if (node.type.name === nodeTypeName && node.attrs[attrName] === attrValue) {
      result = { node, pos };
      return false;
    }

    return undefined;
  });

  return result;
}
