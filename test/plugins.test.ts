import { Fragment, Slice } from 'prosemirror-model';
import { describe, expect, it, vi } from 'vitest';
import {
  PlaceholderFieldView,
  placeholderFieldDrop,
  placeholderFieldEditing,
  placeholderFieldPaste,
} from '../src';
import { createState, findNodeByAttr } from './utils/build-state';
import { createTestSchema } from './utils/schema';

function createDropView() {
  const schema = createTestSchema();
  const state = createState(
    schema,
    schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('AB')]),
    ]),
  );
  let nextState = state;

  return {
    editable: true,
    state,
    dispatch: vi.fn((tr) => {
      nextState = nextState.apply(tr);
    }),
    posAtCoords: vi.fn(() => ({ pos: 2 })),
    getNextState: () => nextState,
  };
}

describe('plugins', () => {
  it('registers PlaceholderFieldView under nodeViews.placeholderField', () => {
    const plugin = placeholderFieldEditing();
    const schema = createTestSchema();
    const nodeViewFactory = plugin.props.nodeViews?.placeholderField;

    expect(nodeViewFactory).toBeTypeOf('function');

    const instance = nodeViewFactory?.(
      schema.nodes.placeholderField.create({ label: 'Customer' }),
      {
        editable: true,
        dispatch: vi.fn(),
        state: createState(schema),
      } as never,
      () => 1,
    );

    expect(instance).toBeInstanceOf(PlaceholderFieldView);
  });

  it('inserts a placeholder field from drop payload', () => {
    const plugin = placeholderFieldDrop();
    const view = createDropView();
    const event = {
      clientX: 10,
      clientY: 20,
      dataTransfer: {
        getData: vi.fn(() => JSON.stringify({
          attrs: {
            id: 'field-1',
            label: 'Customer',
          },
        })),
      },
    } as unknown as DragEvent;

    const handled = plugin.props.handleDrop?.(
      view as never,
      event,
      null as never,
      false,
    );

    expect(handled).toBe(true);
    expect(view.dispatch).toHaveBeenCalledTimes(1);
    expect(
      findNodeByAttr(view.getNextState().doc, 'placeholderField', 'id', 'field-1'),
    ).not.toBeNull();
  });

  it('dispatches placeholderFieldDrop event when handleOutside is true', () => {
    const plugin = placeholderFieldDrop({ handleOutside: true });
    const view = createDropView();
    const listener = vi.fn();
    const event = {
      clientX: 10,
      clientY: 20,
      dataTransfer: {
        getData: vi.fn(() => JSON.stringify({
          attrs: {
            id: 'field-1',
            label: 'Customer',
          },
        })),
      },
    } as unknown as DragEvent;

    document.addEventListener('placeholderFieldDrop', listener);

    const handled = plugin.props.handleDrop?.(
      view as never,
      event,
      null as never,
      false,
    );

    expect(handled).toBe(true);
    expect(view.dispatch).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);

    document.removeEventListener('placeholderFieldDrop', listener);
  });

  it('dispatches placeholderFieldPaste event when pasted content contains placeholder fields', () => {
    const schema = createTestSchema();
    const plugin = placeholderFieldPaste();
    const listener = vi.fn();
    const slice = new Slice(
      Fragment.fromArray([
        schema.nodes.placeholderField.create({ id: 'field-1', label: 'Customer' }),
      ]),
      0,
      0,
    );

    document.addEventListener('placeholderFieldPaste', listener);

    const handled = plugin.props.handlePaste?.(
      {
        editable: true,
        dispatch: vi.fn(),
        state: createState(schema),
      } as never,
      new Event('paste') as never,
      slice,
    );

    expect(handled).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);

    document.removeEventListener('placeholderFieldPaste', listener);
  });
});
