import { Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import {
  placeholderFieldNode,
  type PlaceholderFieldNodeOptions,
} from '../../src';

export function createTestSchema(options: PlaceholderFieldNodeOptions = {}) {
  return new Schema({
    nodes: basicSchema.spec.nodes.append(placeholderFieldNode(options)),
    marks: basicSchema.spec.marks,
  });
}
