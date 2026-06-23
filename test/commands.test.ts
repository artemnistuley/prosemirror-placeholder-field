import { describe, expect, it, vi } from 'vitest';
import {
  buildReplacePlaceholderFieldWithValue,
  deletePlaceholderField,
  deletePlaceholderFieldById,
  insertPlaceholderField,
  replacePlaceholderFieldWithValue,
  updatePlaceholderFieldAttrs,
  updatePlaceholderFieldById,
  updatePlaceholderFieldByName,
} from '../src';
import { applyCommand, createState, findNodeByAttr } from './utils/build-state';
import { createTestSchema } from './utils/schema';

describe('commands', () => {
  describe('insertPlaceholderField', () => {
    it('inserts a placeholder field at the target position', () => {
      const schema = createTestSchema();
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [schema.text('AB')]),
        ]),
      );

      const nextState = applyCommand(
        state,
        insertPlaceholderField(2, { id: 'field-1', label: 'Customer name' }),
      );

      const match = findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'field-1');
      expect(match).not.toBeNull();
      expect(match?.node.attrs.label).toBe('Customer name');
    });
  });

  describe('updatePlaceholderFieldById', () => {
    it('updates only provided attrs and preserves existing ones', () => {
      const schema = createTestSchema();
      const field = schema.nodes.placeholderField;
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [
            field.create({
              id: 'first',
              name: 'customer',
              label: 'Customer',
              value: 'Jane Doe',
            }),
          ]),
        ]),
      );

      const nextState = applyCommand(
        state,
        updatePlaceholderFieldById('first', { value: 'John Smith' }),
      );

      const match = findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'first');
      expect(match?.node.attrs.value).toBe('John Smith');
      expect(match?.node.attrs.label).toBe('Customer');
      expect(match?.node.attrs.name).toBe('customer');
    });

    it('does not fail when id does not exist', () => {
      const schema = createTestSchema();
      const initialState = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [schema.text('Plain text')]),
        ]),
      );
      const dispatch = vi.fn();

      const handled = updatePlaceholderFieldById('missing', { value: 'X' })(
        initialState,
        dispatch,
      );

      expect(handled).toBe(true);
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('updatePlaceholderFieldAttrs', () => {
    it('updates passed fields and preserves other attrs', () => {
      const schema = createTestSchema();
      const field = schema.nodes.placeholderField;
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [
            field.create({
              id: 'first',
              name: 'customer',
              label: 'Customer',
              value: 'Jane Doe',
            }),
          ]),
        ]),
      );
      const target = findNodeByAttr(state.doc, 'placeholderField', 'id', 'first');

      const nextState = applyCommand(
        state,
        updatePlaceholderFieldAttrs([target!], { value: 'John Smith' }),
      );

      const match = findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'first');
      expect(match?.node.attrs.value).toBe('John Smith');
      expect(match?.node.attrs.label).toBe('Customer');
      expect(match?.node.attrs.name).toBe('customer');
    });
  });

  describe('updatePlaceholderFieldByName', () => {
    it('updates fields matched by name', () => {
      const schema = createTestSchema();
      const field = schema.nodes.placeholderField;
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [
            field.create({
              id: 'first',
              name: 'customer',
              label: 'Customer 1',
              value: 'Jane Doe',
            }),
            field.create({
              id: 'second',
              name: 'customer',
              label: 'Customer 2',
              value: 'John Doe',
            }),
          ]),
        ]),
      );

      const nextState = applyCommand(
        state,
        updatePlaceholderFieldByName('customer', { value: 'Updated' }),
      );

      expect(
        findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'first')?.node.attrs.value,
      ).toBe('Updated');
      expect(
        findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'second')?.node.attrs.value,
      ).toBe('Updated');
    });
  });

  describe('deletePlaceholderFieldById', () => {
    it('deletes a single field by id', () => {
      const schema = createTestSchema();
      const field = schema.nodes.placeholderField;
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [
            field.create({ id: 'first', label: 'Customer' }),
            schema.text(' after'),
          ]),
        ]),
      );

      const nextState = applyCommand(state, deletePlaceholderFieldById('first'));

      expect(findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'first')).toBeNull();
    });

    it('deletes multiple fields by id array with correct position remapping', () => {
      const schema = createTestSchema();
      const field = schema.nodes.placeholderField;
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [
            field.create({ id: 'first', label: 'A' }),
            schema.text('X'),
            field.create({ id: 'second', label: 'B' }),
            schema.text('Y'),
            field.create({ id: 'third', label: 'C' }),
          ]),
        ]),
      );

      const nextState = applyCommand(
        state,
        deletePlaceholderFieldById(['first', 'third']),
      );

      expect(findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'first')).toBeNull();
      expect(findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'third')).toBeNull();
      expect(findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'second')).not.toBeNull();
    });

    it('does not fail or dispatch when id does not exist', () => {
      const schema = createTestSchema();
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [schema.text('Plain text')]),
        ]),
      );
      const dispatch = vi.fn();

      const handled = deletePlaceholderFieldById('missing')(state, dispatch);

      expect(handled).toBe(true);
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('deletePlaceholderField', () => {
    it('deletes multiple passed nodes in one transaction', () => {
      const schema = createTestSchema();
      const field = schema.nodes.placeholderField;
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [
            field.create({ id: 'first', label: 'A' }),
            schema.text('X'),
            field.create({ id: 'second', label: 'B' }),
            schema.text('Y'),
            field.create({ id: 'third', label: 'C' }),
          ]),
        ]),
      );
      const first = findNodeByAttr(state.doc, 'placeholderField', 'id', 'first');
      const third = findNodeByAttr(state.doc, 'placeholderField', 'id', 'third');

      const nextState = applyCommand(state, deletePlaceholderField([first!, third!]));

      expect(findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'first')).toBeNull();
      expect(findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'third')).toBeNull();
      expect(findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'second')).not.toBeNull();
    });
  });

  describe('replacePlaceholderFieldWithValue', () => {
    it('replaces text placeholder with text node from value', () => {
      const schema = createTestSchema();
      const field = schema.nodes.placeholderField;
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [
            schema.text('Hello '),
            field.create({
              id: 'first',
              kind: 'text',
              label: 'Customer',
              value: 'Jane Doe',
            }),
          ]),
        ]),
      );

      const nextState = applyCommand(state, replacePlaceholderFieldWithValue('first'));

      expect(nextState.doc.textContent).toBe('Hello Jane Doe');
      expect(findNodeByAttr(nextState.doc, 'placeholderField', 'id', 'first')).toBeNull();
    });

    it('inserts a space when value is empty', () => {
      const schema = createTestSchema();
      const field = schema.nodes.placeholderField;
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [
            schema.text('Hello'),
            field.create({
              id: 'first',
              kind: 'text',
              label: 'Customer',
              value: '',
            }),
          ]),
        ]),
      );

      const nextState = applyCommand(state, replacePlaceholderFieldWithValue('first'));

      expect(nextState.doc.textContent).toBe('Hello ');
    });

    it('uses custom replacer for matching kind', () => {
      const schema = createTestSchema();
      const field = schema.nodes.placeholderField;
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [
            field.create({
              id: 'first',
              kind: 'link',
              label: 'Profile',
              value: 'https://example.com',
            }),
          ]),
        ]),
      );
      const replacer = vi.fn(({ tr, from, to, state: currentState }) => {
        tr.replaceWith(from, to, currentState.schema.text('LINK'));
      });

      const nextState = applyCommand(
        state,
        replacePlaceholderFieldWithValue('first', { link: replacer }),
      );

      expect(replacer).toHaveBeenCalledTimes(1);
      expect(nextState.doc.textContent).toBe('LINK');
    });
  });

  describe('buildReplacePlaceholderFieldWithValue', () => {
    it('returns a working command factory with bound replacers', () => {
      const schema = createTestSchema();
      const field = schema.nodes.placeholderField;
      const state = createState(
        schema,
        schema.node('doc', null, [
          schema.node('paragraph', null, [
            field.create({
              id: 'first',
              kind: 'link',
              label: 'Profile',
              value: 'https://example.com',
            }),
          ]),
        ]),
      );
      const replacer = vi.fn(({ tr, from, to, state: currentState }) => {
        tr.replaceWith(from, to, currentState.schema.text('BOUND'));
      });
      const commandFactory = buildReplacePlaceholderFieldWithValue({ link: replacer });

      const nextState = applyCommand(state, commandFactory('first'));

      expect(replacer).toHaveBeenCalledTimes(1);
      expect(nextState.doc.textContent).toBe('BOUND');
    });
  });
});
