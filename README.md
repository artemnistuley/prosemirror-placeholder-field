# prosemirror-placeholder-field

`prosemirror-placeholder-field` adds an inline `placeholderField` node for ProseMirror documents. It is useful for template editors, fillable forms, and document builders where authors insert structured placeholders first and replace them with real values later.

## Features

- Inline atom node for placeholder fields
- Default text rendering plus custom node views for field kinds like links or images
- Commands for insert, update, delete, search, and replace workflows
- Optional drag-and-drop and paste helpers
- Support for custom attributes and DOM serialization

## Installation

```bash
npm install prosemirror-placeholder-field
```

## Quick start

Add the node to your schema:

```ts
import { Schema } from 'prosemirror-model';
import { schema as baseSchema } from 'prosemirror-schema-basic';
import {
  placeholderFieldNode,
} from 'prosemirror-placeholder-field';

const schema = new Schema({
  nodes: baseSchema.spec.nodes.append(placeholderFieldNode()),
  marks: baseSchema.spec.marks,
});
```

Register the editing plugin so placeholders render through a node view:

```ts
import { EditorState } from 'prosemirror-state';
import {
  placeholderFieldEditing,
} from 'prosemirror-placeholder-field';

const state = EditorState.create({
  schema,
  plugins: [
    placeholderFieldEditing(),
  ],
});
```

Insert and update fields:

```ts
import {
  insertPlaceholderField,
  updatePlaceholderFieldById,
} from 'prosemirror-placeholder-field';

insertPlaceholderField(0, {
  id: 'customer-name',
  kind: 'text',
  label: 'Customer name',
  value: 'Jane Doe',
})(view.state, view.dispatch);

updatePlaceholderFieldById('customer-name', {
  value: 'John Smith',
})(view.state, view.dispatch);
```

Replace placeholders with actual content:

```ts
import {
  replacePlaceholderFieldWithValue,
} from 'prosemirror-placeholder-field';

replacePlaceholderFieldWithValue(null)(view.state, view.dispatch);
```

Passing `null` replaces all placeholder fields. For text fields, the default behavior replaces the node with a text node using the `value` attribute.

## Node attributes

Each `placeholderField` node supports these built-in attributes:

- `id`
- `kind` with default `text`
- `name`
- `value`
- `label`
- `color`

The default node view displays `value` when present, otherwise `label`.

## Schema customization

You can add custom attributes when building the node spec:

```ts
import { placeholderFieldNode } from 'prosemirror-placeholder-field';

const placeholderNodes = placeholderFieldNode({
  defaultColor: '#0f766e',
  extraAttributes: {
    required: {
      default: false,
      validate: 'boolean',
      getFromDOM: (dom) => dom.hasAttribute('data-required'),
      setDOMAttr: (value, attrs) => {
        if (value) attrs['data-required'] = '';
      },
    },
  },
});
```

## Plugins

The package exports three helper plugins:

- `placeholderFieldEditing(options?)` renders placeholders using `PlaceholderFieldView`
- `placeholderFieldDrop(options?)` handles dropping serialized placeholder metadata into the editor
- `placeholderFieldPaste()` emits a document event when placeholder fields are pasted

### Drop behavior

`placeholderFieldDrop()` expects drag payloads under the `placeholderField` key in `dataTransfer`.

With the default `handleOutside: false`, the payload should look like this:

```ts
event.dataTransfer?.setData('placeholderField', JSON.stringify({
  attrs: {
    id: 'field-1',
    kind: 'text',
    label: 'Demo field',
    value: 'Text value',
  },
}));
```

With `handleOutside: true`, the plugin does not insert the node directly. Instead it emits a `placeholderFieldDrop` DOM event so you can decide what to create and where.

## Custom node views

Use `placeholderFieldEditing()` with `viewHandlers` to define field-kind-specific UI:

```ts
placeholderFieldEditing({
  viewHandlers: {
    link: {
      buildView() {
        // `this` is PlaceholderFieldView
      },
      updateView() {
        // `this` is PlaceholderFieldView
      },
    },
  },
});
```

You can also provide:

- `extraAttributes` to keep custom DOM parsing/serialization aligned with the schema
- `setDOMAttrs(node)` to fully control root DOM attributes for the node view

## Commands

### Mutation commands

- `insertPlaceholderField(pos, attrs)`
- `deletePlaceholderField(fields)`
- `updatePlaceholderFieldAttrs(fields, attrs)`
- `updatePlaceholderFieldById(id, attrs)`
- `updatePlaceholderFieldByName(name, attrs)`
- `deletePlaceholderFieldById(id)`
- `replacePlaceholderFieldWithValue(id, replacers?)`
- `buildReplacePlaceholderFieldWithValue(replacers)`

### Query helpers

- `getAllPlaceholderFields(state)`
- `findPlaceholderFields(predicate, state)`
- `findPlaceholderFieldsById(id, state)`
- `findPlaceholderFieldsByName(name, state)`
- `findPlaceholderFieldsBetween(from, to, state)`
- `isPlaceholderField(node)`

## Custom replacers

For non-text field kinds, pass replacer functions:

```ts
import {
  buildReplacePlaceholderFieldWithValue,
} from 'prosemirror-placeholder-field';

const replacePlaceholderFieldWithValue = buildReplacePlaceholderFieldWithValue({
  image: ({ tr, from, to, node, state }) => {
    const src = node.attrs.value;
    if (!src) return;

    const imageNode = state.schema.nodes.image.create({ src });
    tr.replaceWith(from, to, imageNode);
  },
});

replacePlaceholderFieldWithValue(null)(view.state, view.dispatch);
```

If a field kind has no custom replacer, the package falls back to the built-in text replacement logic.

## DOM events

The default node view and plugins emit these browser events:

- `placeholderFieldClick`
- `placeholderFieldDoubleClick`
- `placeholderFieldDrop`
- `placeholderFieldPaste`

These events are dispatched on `document` and include contextual data such as the editor view, node, position, or pasted content in `event.detail`.

## Demo and development

Useful scripts from this repository:

```bash
npm run dev
npm run build
npm run test
```

The interactive example lives in [`demo/main.ts`](./demo/main.ts).

## License

[MIT](./LICENSE)
