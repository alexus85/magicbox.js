(function ( factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define([ "jquery" ], factory );
	} else {
		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {
	
$.magicBox = $.magicBox || {};

if( MiniTemplate === "undefined"){
	console.error("[E] [MagicBox] Unable to find MiniTemplate framework")
}

$.extend( $.magicBox, {
	version: "0.7.4"
});

/////////////////////////////////////////////////
//////// [ Inventory item ] /////////////////////
/////////////////////////////////////////////////

$.widget("magicBox.inventory_item", $.ui.draggable,{
	options: { ///// defaults ////
		width: "100%", 
		height: "100%",
		margin: 0,
		max_stack_size: 1,
		item_id: 0,
		className: "ui-widget-element inventory_item",
		template: ""
	},
	_create: function(){
		this.templateCompiler =  new MiniTemplate.compiler();
		this._super();
		this._apply_template({ 
			"slot_id" : this.options.slot_id,  
			"stack_size": this.options.stack_size
		} );
		this._configure_draggable();
		//console.log(this)
		this.element.data({"max_satck_size":this.options.max_stack_size});
		//console.log(this.element.data())
	},
	_apply_template: function( data ){
		this.element.addClass(this.options.className);
		this.element.attr("id", this.options.item_id);
		this.element.css({
			"width": this.options.width,
			"height": this.options.height,
			"margin": this.options.margin,
			"background-image": "url('gfx/items/"+this.options.item_id+".png')",
		});
		this.element.html( this.templateCompiler.compile( this.options.template, data ) );
		if(data.stack_size > 1){
			this.element.find(".stack_size").show();
		}
	},
	_configure_draggable: function(){
		///// Draggable configuration /////
		this._setOptions({
			scroll: true,
			revert: "invalid",
			helper: "clone",
			stack: false,
			zindex: 4,
			start: function(ev, ui){
				$(this).parent().removeClass("hoverable");
				ui.helper.find(".stack_size").hide()
			},
			stop: function(ev, ui){
				ui.helper.find(".stack_size").show()
			}
		});
		///// Draggable configuration /////
	},
	_setOptions: function( options ){
		this._super( options );
	},
	_setOption: function( key, value ) {
		this._super( key, value );
	}
})

/////////////////////////////////////////////////
//////// [ Inventory slot ] /////////////////////
/////////////////////////////////////////////////

$.widget("magicBox.inventory_slot", $.ui.droppable,{
	options: { ///// defaults ////
		width: 45, 
		height: 45,
		margin: 2,
		border_w: 1,
		switchable_items: true,
		stackable_items: false,
		inv_slot: -1,
		slot_id: 0,
		className: "ui-widget-element inventory_slot hoverable",
		template: ""
	},
	
	_create: function(){
		this.templateCompiler =  new MiniTemplate.compiler();
		this.element.data( { 
			"inv_id": this.options.inv_id, 
			"slot_id": this.options.slot_id
		});
		this._super();
		this._configure_droppable();
		this._apply_template( { "slot_id": this.options.slot_id });
	},
	
	_configure_droppable: function(){
		var self = this;
		this._setOptions({
			accept: ".ui-widget-element.inventory_item", 
			cursor: 'auto',
			tolerance: 'pointer',
			drop: function(ev, ui){
				var prev_slot = ui.draggable.parent();
				var cur_slot = $(this);
				var drag_item_data = ui.draggable.data("magicBoxInventory_item");
				var prev_slot_item_el = prev_slot.find(".ui-widget-element.inventory_item");
				var cur_slot_item_el =  cur_slot.find(".ui-widget-element.inventory_item");
				var cur_slot_item_data = cur_slot_item_el.data("magicBoxInventory_item");
				
				if( cur_slot.hasClass("empty") && cur_slot_item_el.length === 0 ){  //// check if slot is empty ///// 
					cur_slot.append( ui.draggable );
					cur_slot.removeClass("empty").addClass("taken hoverable").find(".slot_id").hide();
					prev_slot.removeClass("taken").addClass("empty").find(".slot_id").show();
				}else{ //// slot is not empty ////
				
					if(self.options.switchable_items){
						var isSameSlotID = ( cur_slot.data("slot_id") == prev_slot.data("slot_id") ),
						isSameInvID = ( cur_slot.data("inv_id") == prev_slot.data("inv_id") ),
						isSameItemID = ( cur_slot_item_data.options.item_id == ui.draggable.attr("id") );
						if( ! isSameSlotID || isSameSlotID &&  !isSameInvID ){ ////  Checks if the item is in different slot and inventory ////
							if( ! isSameItemID ){ //// check if item has different item_id ///
								cur_slot.append( ui.draggable ).addClass("hoverable");
								prev_slot.append( cur_slot_item_el ).addClass("hoverable");
							}else{
								if(self.options.stackable_items){
									var cur_item_stack_el = cur_slot_item_el.find(".stack_size");
									var prev_slot_stack_el = prev_slot_item_el.find(".stack_size")
									var cur_item_stack_size = cur_slot_item_data.options.stack_size;
									var new_stack_size =  cur_item_stack_size + drag_item_data.options.stack_size;
									var max_stack_size = cur_slot_item_data.options.max_stack_size;
									if(new_stack_size <= max_stack_size){
										cur_item_stack_el.html( new_stack_size );
										cur_slot_item_data.options.stack_size = new_stack_size;
										if( !isNaN(new_stack_size) && new_stack_size > 1 ){  //// show stack info when stack_size > 1 //////
											cur_item_stack_el.show();
										}
										ui.draggable.remove();
										prev_slot.removeClass("taken").addClass("empty").find(".slot_id").show();
									}else{
										var diff = (max_stack_size - cur_item_stack_size ) ;
										if(diff > 0){
											//// calculate new stack size /////
											var rest =   drag_item_data.options.stack_size - diff;
											new_stack_size = cur_item_stack_size + diff;
											//// calculate new stack size /////
											//// update stack size /////
											cur_slot_item_data.options.stack_size = new_stack_size;
											drag_item_data.options.stack_size = rest;
											cur_item_stack_el.html( new_stack_size );
											prev_slot_stack_el.html(rest);
											cur_slot.addClass("hoverable");
											prev_slot.addClass("hoverable");
											//// update stack size /////
											if( !isNaN(new_stack_size) && new_stack_size > 1 ){  //// show stack info when stack_size > 1 //////
												cur_item_stack_el.show();
											}
										}
									}
								}
							}
						}else{
							prev_slot.append( cur_slot_item_el ).addClass("hoverable");
						}
					}
				}
			}
		});
	},
	
	_apply_template: function( data ){
		//// Obtain widget's layout /////
		this.element.addClass(this.options.className);
		this.element.css({
			"width": this.options.width,
			"height": this.options.height,
			"border-width": this.options.border_w,
			"margin": this.options.margin
		});
		this.element.html( this.templateCompiler.compile( this.options.template, data ) );
		//// Obtain widget's layout /////
	},
	_setOptions: function( options ){
		this._super( options );
	},
	_setOption: function( key, value ) {
		this._super( key, value );				
	}
})

/////////////////////////////////////////////////
//////// [ Inventory panel ] ////////////////////
/////////////////////////////////////////////////

$.widget("magicBox.inventory_panel",  {
	options: { //// defaults ////
		width: "100%",
		height: "100%",
		margin: 0,
		className: 'ui-widget inventory_panel',
		template: ""
	},
	
	_create: function(){
		this.templateCompiler =  new MiniTemplate.compiler();
		this._super( );
		this._apply_template();
	},
	
	///// [Template handlers ] /////////
	_apply_template: function( data ){
		this.element.addClass(this.options.className);
		this.element.css({
			"width": this.options.width,
			"height": this.options.height,
			"margin": this.options.margin
		});
		this.element.html( this.templateCompiler.compile( this.options.template, data ) );
	},
	///// [Template handlers ] /////////
	
	_setOptions: function(options){
		this._super( options );
	},
	_setOption: function( key, value ) {
		this._super( key, value );
	}
});

$.widget("magicBox.inventory", $.ui.draggable, {
	options: { //// Inventory defaults ////
		//// general settings ////
		rows: 2 , //// Maximum of inventory slots in horizontal axis ////
		cols: 4, //// maximum of inventory slots  in vertical axis ////
		className : "ui-widget inventory", ////inventory base lement class //// 
		switchable_items: true, //// items of different type , will have their positions switched /// 
		stackable_items: true, //// items of same type , will be stacked ///
		//// panel settings ///
		widgets: {
			panel: {
				width: "100%",
				height: "100%",
				margin: 0,
				template: "",
				side_space: 8, //// space on sides ////
			},
			 //// slot settings ///
			slot: {
				width: 45,
				height: 45,
				margin: 1,
				border_w: 1, //// border width ///
				template: ""
			},
			 //// item settings ///
			item: {
				width:"100%",
				height: "100%",
				margin: 0,
				template: ""
			}
		}
	},
	_create: function(){
		var self = this;
		self._super();
		self.templateCompiler =  new MiniTemplate.compiler();
		self.element.addClass(this.options.className);
		if(self.options.widgets){
			self.widgets = self.options.widgets;
			delete self.options["widgets"];
		}
		self.templateQueue = new MiniTemplate.T_queue({
			"onComplete": function(success_tasks, error_tasks){
				self._Templates_loaded( success_tasks );
			}
		});
		self._load_templates();
	},
	
	_refresh: function(initializedBy){
		console.log(" ["+initializedBy+"] refreshing ");
		this._calculate_inv_size();
		this._add_inv_panel();
		this._add_inv_slots();
		this._show_inventory();
		this._configure_droppable();
	},
	
	_configure_droppable: function(){
		//var slot = this.widgets.slot;
		var self = this;
		//console.log(self.element.parent().attr("id"))
		this._setOptions({
			containment: "parent",
			handle: ".ui-widget-element.text.caption",
			opacity: 0.9,
			zIndex: 100,
			revert: function(){
				var result = false;
				$(".ui-widget.inventory").each(function(i, e){
					if(self.element.attr("id") !== $(this).attr("id")){
						if( self._isColliding( self.element, $(this) ) ){
							result = true;
						}
					}
				});
				return result;
			},
			scroll: false,
			snapMode: "inner",
			snap: typeof self.element.parent().attr("class") !== "undefined" ? "."+self.element.parent().attr("class") :  "#"+self.element.parent().attr("id")
		})
	},
	
	_isColliding: function(el_a, el_b){
		//// store position in this order : [ X , Y ] , [width , height] ////
		//// pos = [pos, size] /////
		var pos_a = [ [ el_a.position().left, ( el_a.position().top ) ], [ el_a.outerWidth(), el_a.outerHeight() + 3] ]; //// + 3 ads the desired space at the bottom of each inventory ////
		var pos_b = [ [ el_b.position().left,  ( el_b.position().top ) ], [el_b.outerWidth(), el_b.outerHeight() + 3] ]; //// + 3 ads the desired space at the bottom of each inventory ////
		return ! (
			( ( pos_a[0][0] + pos_a[1][0] ) < pos_b[0][0] ) ||
			(  pos_a[0][0] > (  pos_b[0][0] +  pos_b[1][0] ) ) ||
			( (pos_a[0][1] +  pos_a[1][1]  ) < pos_b[0][1] ) ||
			( pos_a[0][1] > ( pos_b[0][1] + pos_b[1][1] ) )
		);
	},
	
	_show_inventory: function(){
		this.element.append(this._inv_panel);
	},
	
	_add_inv_panel: function(){
		this._inv_panel =  $("<div/>").inventory_panel({
			"width": this.widgets.panel.width,
			"height": this.widgets.panel.height,
			"margin": this.widgets.panel.margin,
			"template": this.widgets.panel.template
		});
		this._add_inv_container();
	},
	
	_add_inv_container: function(){
		var slot = this.widgets.slot;
		this._inv_slot_container = this._inv_panel.find(".ui-widget-element.container");
		var inv_w =  Math.floor(this.options.cols * ( slot.width + (2*slot.margin))),
		inv_h = this.options.rows * ( slot.height + ( 2*slot.margin) ) ,
		inv_l = (this.element.width() - inv_w ) /2,
		inv_t = (this.element.height() - inv_h ) /2;
		this._inv_slot_container.css({
			"width": inv_w,
			"height":inv_h,
			"top": inv_t,
			"left": inv_l
		});
	},
	
	_add_inv_slots: function(){
		var self = this;
		var inv_slots = [];
		var empty_slot_bp = $("<div/>"); //// Empty slot blueprint ////
		var rand_item_id, rand_stack_size = 0;
		for( var e_slot = 1; e_slot <= (self.options.rows * self.options.cols ); e_slot++ ){
			empty_slot = empty_slot_bp.clone().inventory_slot({ 
				"slot_id": e_slot,
				"inv_id":  self.uuid,
				"width": self.widgets.slot.width, 
				"heght": self.widgets.slot.height,
				"switchable_items": self.options.switchable_items,
				"stackable_items": self.options.stackable_items,
				"margin": self.widgets.slot.margin,
				"border_w": self.widgets.slot.border_w,
				"template": self.widgets.slot.template
			});
			rand_item_id = Math.floor( (Math.random() * 3) + 0); //// generate random number from range(0,2) ////
			rand_stack_size = Math.floor( (Math.random() * 7) + 1); //// generate random number from range(1,7) ////
			self._add_item( empty_slot, e_slot, rand_item_id , rand_stack_size, 5);
			inv_slots.push( empty_slot );	
		}
		self._inv_slot_container.append( inv_slots );
	},
	
	_add_item: function(slot_el, slot_id, item_id, stack_size, max_stack_size){
		//slot_el.attr("id", slot_id)
		if(item_id > 0){ //// taken slot ////
			slot_el.addClass("taken");
			//console.log( slot_id, "taken" );
			var item =  $("<div/>").inventory_item({
				"slot_id": slot_id, 
				"stack_size": stack_size,
				"max_stack_size": max_stack_size,
				"item_id": item_id , 
				"width": this.widgets.item.width, 
				"heght": this.widgets.item.height,
				"margin": this.widgets.item.margin,
				"template": this.widgets.item.template,
			 });
			slot_el.append( item );
		}else{
			slot_el.addClass("empty");
		}
	},
	_calculate_inv_size: function(){ //// calculate inventory's width and height ////
		var slot = this.widgets.slot;
		var width = this.options.cols * ( slot.width + slot.margin + (slot.border_w/this.options.cols) ) + this.widgets.panel.side_space;
		this.element.css({
			"width":   width - (width % 2),
			"height":  this.options.rows * ( slot.height + slot.margin) + this.widgets.panel.side_space,
		});
	},
	/* [Template Handlers ] */
	_load_templates: function(){
		//// load all templates ////
		for(var widget in  this.widgets){
			this.templateQueue.add_task({
				"name": widget, 
				"type": "t_load",
				"data": this.widgets[widget].template
			});
		}
		this.templateQueue.process_tasks();
	},
	_Templates_loaded: function(completed_t){
		for(var t =0; t < completed_t.length; t++){
			this.widgets[completed_t[t].name].template = completed_t[t].data;
		}
		this._refresh("_Templates_loaded");
	},
	_setOptions: function(options){
		this._super( options );
		//this._refresh("_setOptions");
	},
	_setOption: function( key, value ) {
		this._super( key, value );
	}
});

})); //// Plugin end ////

