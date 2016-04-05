# magicbox
MagicBox is jQuery-ui plugin that helps you create UI for your games.

### Features
* Items
  + All items are draggable/droppable
  + Item stats are shown, while hovering over its icon.
  + Items of same type can be stacked, different types will just switch their positon.
* Panel
  + It's also poossible, to move around with entire inventory panel.
  + Panel's colision detection won't let you place panels over each other.
* General
  + Each widget has it's own template to generate the layout.

#### Example
```javascript
$('#element').inventory({
	rows: 2,
	cols: 2,
	widgets: {
		panel: {
			template: "./templates/inventory_panel.jst"
		},
		slot: {
			template: "./templates/inventory_slot.jst"
		},
		item: {
			template: "./templates/inventory_item.jst"
		}
	}
});
```
