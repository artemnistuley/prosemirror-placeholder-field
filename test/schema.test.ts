import { DOMParser as PMDOMParser, DOMSerializer } from 'prosemirror-model';
import { describe, expect, it, vi } from 'vitest';
import { placeholderFieldNode } from '../src';
import { createTestSchema } from './utils/schema';

describe('schema', () => {
  describe('placeholderFieldNode', () => {
    it('returns a node spec with built-in attrs', () => {
      const spec = placeholderFieldNode().placeholderField;

      expect(Object.keys(spec.attrs ?? {})).toEqual([
        'id',
        'kind',
        'name',
        'value',
        'label',
        'color',
      ]);
    });

    it('applies default attr values', () => {
      const schema = createTestSchema();
      const node = schema.nodes.placeholderField.create();

      expect(node.attrs.id).toBeNull();
      expect(node.attrs.kind).toBe('text');
      expect(node.attrs.name).toBeNull();
      expect(node.attrs.value).toBeNull();
      expect(node.attrs.label).toBeNull();
      expect(node.attrs.color).toBe('#7c3aed');
    });

    it('adds extraAttributes to the node spec', () => {
      const spec = placeholderFieldNode({
        extraAttributes: {
          required: {
            default: false,
            validate: 'boolean',
          },
        },
      }).placeholderField;

      expect(spec.attrs?.required).toEqual({
        default: false,
        validate: 'boolean',
      });
    });
  });

  describe('DOM serialization', () => {
    it('round-trips built-in attrs through DOM', () => {
      const schema = createTestSchema();
      const serializer = DOMSerializer.fromSchema(schema);
      const parser = PMDOMParser.fromSchema(schema);
      const node = schema.nodes.placeholderField.create({
        id: 'field-1',
        kind: 'text',
        name: 'customer',
        value: 'Jane Doe',
        label: 'Customer',
        color: '#0f766e',
      });
      const wrapper = document.createElement('div');

      wrapper.appendChild(serializer.serializeNode(node));

      const parsed = parser.parseSlice(wrapper).content.firstChild;

      expect(parsed?.type.name).toBe('placeholderField');
      expect(parsed?.attrs).toEqual(node.attrs);
    });

    it('round-trips custom attrs through DOM using getFromDOM/setDOMAttr', () => {
      const getFromDOM = vi.fn((dom: HTMLElement) => dom.getAttribute('data-required') === '');
      const setDOMAttr = vi.fn((value: unknown, attrs: Record<string, unknown>) => {
        if (value) {
          attrs['data-required'] = '';
        }
      });
      const schema = createTestSchema({
        extraAttributes: {
          required: {
            default: false,
            validate: 'boolean',
            getFromDOM,
            setDOMAttr,
          },
        },
      });
      const serializer = DOMSerializer.fromSchema(schema);
      const parser = PMDOMParser.fromSchema(schema);
      const node = schema.nodes.placeholderField.create({
        id: 'field-1',
        label: 'Customer',
        required: true,
      });
      const wrapper = document.createElement('div');

      wrapper.appendChild(serializer.serializeNode(node));

      const element = wrapper.firstElementChild as HTMLElement;
      expect(setDOMAttr).toHaveBeenCalledTimes(1);
      expect(element.hasAttribute('data-required')).toBe(true);

      const parsed = parser.parseSlice(wrapper).content.firstChild;

      expect(getFromDOM).toHaveBeenCalled();
      expect(parsed?.attrs.required).toBe(true);
      expect(parsed?.attrs.id).toBe('field-1');
      expect(parsed?.attrs.label).toBe('Customer');
    });
  });
});
