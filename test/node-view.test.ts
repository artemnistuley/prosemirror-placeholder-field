import { describe, expect, it, vi } from 'vitest';
import { PlaceholderFieldView } from '../src';
import { createTestSchema } from './utils/schema';

function createView(editable = true) {
  return {
    editable,
    dispatch: vi.fn(),
    state: {
      tr: {
        setNodeMarkup: vi.fn(),
      },
    },
  };
}

describe('PlaceholderFieldView', () => {
  it('creates a DOM element with the expected classes and attributes', () => {
    const schema = createTestSchema();
    const node = schema.nodes.placeholderField.create({
      id: 'field-1',
      label: 'Customer',
      color: '#0f766e',
    });

    const nodeView = new PlaceholderFieldView({
      node,
      view: createView() as never,
      getPos: () => 1,
    });

    expect(nodeView.dom.classList.contains('placeholder-field')).toBe(true);
    expect(nodeView.dom.getAttribute('data-placeholder-field')).toBe('');
    expect(nodeView.dom.getAttribute('data-id')).toBe('field-1');
    expect(nodeView.dom.getAttribute('data-color')).toBe('#0f766e');
    expect(nodeView.dom.firstElementChild?.classList.contains('placeholder-field__content')).toBe(true);
    expect((nodeView.dom.firstElementChild as HTMLElement).textContent).toBe('Customer');
  });

  it('updates text content and style when attrs change', () => {
    const schema = createTestSchema();
    const node = schema.nodes.placeholderField.create({
      id: 'field-1',
      label: 'Customer',
      color: '#0f766e',
    });
    const updatedNode = schema.nodes.placeholderField.create({
      id: 'field-1',
      value: 'Jane Doe',
      label: 'Customer',
      color: '#7c3aed',
    });

    const nodeView = new PlaceholderFieldView({
      node,
      view: createView() as never,
      getPos: () => 1,
    });
    const updated = nodeView.update(updatedNode);

    expect(updated).toBe(true);
    expect((nodeView.dom.firstElementChild as HTMLElement).textContent).toBe('Jane Doe');
    expect(nodeView.dom.getAttribute('style')).toContain('background-color: #7c3aed33');
  });

  it('returns false when updated with a different node type', () => {
    const schema = createTestSchema();
    const nodeView = new PlaceholderFieldView({
      node: schema.nodes.placeholderField.create({ label: 'Customer' }),
      view: createView() as never,
      getPos: () => 1,
    });

    const updated = nodeView.update(schema.nodes.paragraph.create());

    expect(updated).toBe(false);
  });

  it('dispatches click and doubleclick events on document when editable', () => {
    const schema = createTestSchema();
    const clickListener = vi.fn();
    const doubleClickListener = vi.fn();
    const nodeView = new PlaceholderFieldView({
      node: schema.nodes.placeholderField.create({ id: 'field-1', label: 'Customer' }),
      view: createView(true) as never,
      getPos: () => 1,
    });

    document.addEventListener('placeholderFieldClick', clickListener);
    document.addEventListener('placeholderFieldDoubleClick', doubleClickListener);

    nodeView.dom.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    nodeView.dom.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(clickListener).toHaveBeenCalledTimes(1);
    expect(doubleClickListener).toHaveBeenCalledTimes(1);

    document.removeEventListener('placeholderFieldClick', clickListener);
    document.removeEventListener('placeholderFieldDoubleClick', doubleClickListener);
  });

  it('does not dispatch click events when view is not editable', () => {
    const schema = createTestSchema();
    const clickListener = vi.fn();
    const doubleClickListener = vi.fn();
    const nodeView = new PlaceholderFieldView({
      node: schema.nodes.placeholderField.create({ id: 'field-1', label: 'Customer' }),
      view: createView(false) as never,
      getPos: () => 1,
    });

    document.addEventListener('placeholderFieldClick', clickListener);
    document.addEventListener('placeholderFieldDoubleClick', doubleClickListener);

    nodeView.dom.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    nodeView.dom.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(clickListener).not.toHaveBeenCalled();
    expect(doubleClickListener).not.toHaveBeenCalled();

    document.removeEventListener('placeholderFieldClick', clickListener);
    document.removeEventListener('placeholderFieldDoubleClick', doubleClickListener);
  });

  it('stops dispatching events after destroy', () => {
    const schema = createTestSchema();
    const clickListener = vi.fn();
    const nodeView = new PlaceholderFieldView({
      node: schema.nodes.placeholderField.create({ id: 'field-1', label: 'Customer' }),
      view: createView(true) as never,
      getPos: () => 1,
    });

    document.addEventListener('placeholderFieldClick', clickListener);

    nodeView.destroy();
    nodeView.dom.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(clickListener).not.toHaveBeenCalled();

    document.removeEventListener('placeholderFieldClick', clickListener);
  });

  it('uses custom viewHandlers for buildView and updateView', () => {
    const schema = createTestSchema();
    const buildView = vi.fn(function(this: PlaceholderFieldView) {
      const root = document.createElement('span');
      root.textContent = `custom:${this.node.attrs.label}`;
      this.root = root;
    });
    const updateView = vi.fn(function(this: PlaceholderFieldView) {
      this.dom.textContent = `updated:${this.node.attrs.value}`;
    });
    const nodeView = new PlaceholderFieldView({
      node: schema.nodes.placeholderField.create({
        kind: 'link',
        label: 'Profile',
      }),
      view: createView(true) as never,
      getPos: () => 1,
      options: {
        viewHandlers: {
          link: {
            buildView,
            updateView,
          },
        },
      },
    });

    const updated = nodeView.update(
      schema.nodes.placeholderField.create({
        kind: 'link',
        label: 'Profile',
        value: 'https://example.com',
      }),
    );

    expect(buildView).toHaveBeenCalledTimes(1);
    expect(updateView).toHaveBeenCalledTimes(1);
    expect(updated).toBe(true);
    expect(nodeView.dom.textContent).toBe('updated:https://example.com');
  });

  it('updateAttributes dispatches setNodeMarkup with merged attrs', () => {
    const schema = createTestSchema();
    const setNodeMarkup = vi.fn(() => ({ step: 'tr' }));
    const dispatch = vi.fn();
    const nodeView = new PlaceholderFieldView({
      node: schema.nodes.placeholderField.create({
        id: 'field-1',
        label: 'Customer',
      }),
      view: {
        editable: true,
        dispatch,
        state: {
          tr: {
            setNodeMarkup,
          },
        },
      } as never,
      getPos: () => 3,
    });

    nodeView.updateAttributes({ value: 'Jane Doe' });

    expect(setNodeMarkup).toHaveBeenCalledWith(3, undefined, {
      id: 'field-1',
      kind: 'text',
      name: null,
      value: 'Jane Doe',
      label: 'Customer',
      color: '#7c3aed',
    });
    expect(dispatch).toHaveBeenCalledWith({ step: 'tr' });
  });
});
