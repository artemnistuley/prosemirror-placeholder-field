import { describe, expect, it } from 'vitest';
import {
  findPlaceholderFields,
  findPlaceholderFieldsBetween,
  findPlaceholderFieldsById,
  findPlaceholderFieldsByName,
  getAllPlaceholderFields,
  isPlaceholderField,
  updateDOMAttributes,
} from '../src';
import { createState } from './utils/build-state';
import { createTestSchema } from './utils/schema';

function buildDoc() {
  const schema = createTestSchema();
  const field = schema.nodes.placeholderField;

  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [
      schema.text('A'),
      field.create({ id: 'first', name: 'customer', label: 'Customer' }),
      schema.text('B'),
      field.create({ id: 'second', name: 'order', label: 'Order' }),
    ]),
    schema.node('paragraph', null, [
      field.create({ id: 'third', name: 'customer', label: 'Customer 2' }),
      schema.text('C'),
    ]),
  ]);

  return {
    schema,
    state: createState(schema, doc),
  };
}

function createMockElement() {
  const attrs = new Map<string, string>();

  return {
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
    removeAttribute(name: string) {
      attrs.delete(name);
    },
    hasAttribute(name: string) {
      return attrs.has(name);
    },
    getAttribute(name: string) {
      return attrs.get(name) ?? null;
    },
  };
}

describe('helpers', () => {
  describe('isPlaceholderField', () => {
    it('returns true for placeholderField node', () => {
      const { schema } = buildDoc();

      expect(isPlaceholderField(schema.nodes.placeholderField.create())).toBe(true);
    });

    it('returns false for regular nodes', () => {
      const { schema } = buildDoc();

      expect(isPlaceholderField(schema.nodes.paragraph.create())).toBe(false);
    });
  });

  describe('getAllPlaceholderFields', () => {
    it('returns all placeholder fields with positions', () => {
      const { state } = buildDoc();

      const fields = getAllPlaceholderFields(state);

      expect(fields).toHaveLength(3);
      expect(fields.map((field) => field.node.attrs.id)).toEqual([
        'first',
        'second',
        'third',
      ]);
      expect(fields.map((field) => field.pos)).toEqual([2, 4, 7]);
    });

    it('returns empty array for document without placeholder fields', () => {
      const schema = createTestSchema();
      const state = createState(schema, schema.node('doc', null, [
        schema.node('paragraph', null, [schema.text('Plain text')]),
      ]));

      expect(getAllPlaceholderFields(state)).toEqual([]);
    });
  });

  describe('findPlaceholderFieldsById', () => {
    it('finds a field by single id', () => {
      const { state } = buildDoc();

      const fields = findPlaceholderFieldsById('second', state);

      expect(fields).toHaveLength(1);
      expect(fields[0]?.node.attrs.id).toBe('second');
    });

    it('finds fields by id array', () => {
      const { state } = buildDoc();

      const fields = findPlaceholderFieldsById(['first', 'third'], state);

      expect(fields.map((field) => field.node.attrs.id)).toEqual(['first', 'third']);
    });
  });

  describe('findPlaceholderFieldsByName', () => {
    it('finds a field by single name', () => {
      const { state } = buildDoc();

      const fields = findPlaceholderFieldsByName('order', state);

      expect(fields).toHaveLength(1);
      expect(fields[0]?.node.attrs.id).toBe('second');
    });

    it('finds fields by name array', () => {
      const { state } = buildDoc();

      const fields = findPlaceholderFieldsByName(['customer', 'order'], state);

      expect(fields.map((field) => field.node.attrs.id)).toEqual([
        'first',
        'second',
        'third',
      ]);
    });
  });

  describe('findPlaceholderFieldsBetween', () => {
    it('returns only fields inside the given range', () => {
      const { state } = buildDoc();
      const allFields = getAllPlaceholderFields(state);
      const from = allFields[1]!.pos;
      const to = allFields[2]!.pos + allFields[2]!.node.nodeSize;

      const fields = findPlaceholderFieldsBetween(from, to, state);

      expect(fields.map((field) => field.node.attrs.id)).toEqual(['second', 'third']);
    });
  });

  describe('findPlaceholderFields', () => {
    it('filters fields using a custom predicate', () => {
      const { state } = buildDoc();

      const fields = findPlaceholderFields(
        (node) => node.attrs.name === 'customer',
        state,
      );

      expect(fields.map((field) => field.node.attrs.id)).toEqual(['first', 'third']);
    });
  });

  describe('updateDOMAttributes', () => {
    it('sets regular attributes and removes nullish ones', () => {
      const element = createMockElement();

      updateDOMAttributes(element as unknown as HTMLElement, {
        'data-id': 'field-1',
        title: null,
      });

      expect(element.getAttribute('data-id')).toBe('field-1');
      expect(element.hasAttribute('title')).toBe(false);
    });

    it('handles boolean attributes with truthy and falsy values', () => {
      const element = createMockElement();

      updateDOMAttributes(element as unknown as HTMLElement, {
        required: true,
        disabled: false,
        readonly: 1,
      });

      expect(element.getAttribute('required')).toBe('');
      expect(element.hasAttribute('disabled')).toBe(false);
      expect(element.getAttribute('readonly')).toBe('');
    });
  });
});
