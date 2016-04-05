//// plugin's base /////
var MiniTemplate = {
	version: "0.7.4"
}

//// This version does not support pre-compiled templates /////

//// template compiling handler /////
MiniTemplate.compiler = function(options){
};

//// template loading handler /////
MiniTemplate.loader = function(options){
	this.xhr_request = null;
};

//// template loading queue /////
MiniTemplate.T_queue = function(options){
	this.t_queue_pos = 0;
	this.t_queue = [];
	this.completed_tasks = [];
	this.failed_tasks = [];
	this.onComplete = options.onComplete || null;
	this.templateLoader = new MiniTemplate.loader();
};

MiniTemplate.T_queue.prototype = {
	constructor: MiniTemplate.T_queue,
	add_task: function( task ){
		if(typeof task === "object"){
			if(this._check_task(task)){
				this.t_queue.push( task );
			}else{
				MiniTemplate.utils.Logger("error","T_queue",{ msg: "Unable to add new task" ,reason: "One of task attributes [name, type,data] is not defined"});
			}
		}else{
			MiniTemplate.utils.Logger("error","T_queue",{ msg: "Unable to add new task" ,reason: "task !==  'object'"});
		}
	},
	process_tasks: function(){
		this._process_next_task();
	},
	_process_next_task: function(){
		var self = this;
		var task = self.t_queue[self.t_queue_pos]; //// get task  from t_queue ///
		switch(task.type){
			case "t_load":
				self.templateLoader.load_template( task.data , function(t_string){ ////template_string ////
					task.data = t_string;
					task.status = "success";
					self._task_processed(task);
				},function(err){
					task.status = "success";
					self._task_processed(task);
					console.log("Error", err)
				});
			break;
			case "t_compile":
				MiniTemplate.utils.Logger("warn","T_queue",{ msg: "Unable to compile template" ,reason: "feature not yet supported"});
				break;
		}
	},
	_task_processed: function(task){
		this.t_queue_pos++;
		
		if(task.status === "success"){
			this.completed_tasks.push(task);
		}else{
			this.failed_tasks.push(task);
		}
		
		if( this.t_queue_pos !== this.t_queue.length ){
			this._process_next_task();
		}else{
			this._all_tasks_processed();
		}
	},
	_all_tasks_processed: function(){
		if(this.onComplete !== null){
			this.onComplete(this.completed_tasks, this.failed_tasks);
			this._reset();
		}
	},
	_check_task: function(task){
		if(task.name && task.type && task.data){
			return true;
		}
		return false;
	},
	_reset: function(){
		this.t_queue = [];
		this.completed_tasks = [];
		this.failed_tasks = [];
		this.t_queue_pos = 0;
	}
};

MiniTemplate.compiler.prototype = {
	constructor: MiniTemplate.compiler,
	compile: function( template, data ){
		var compiled_t = template;
		if(typeof data !== "undefined"){
			var all_vars = template.match(/\<%(.*?)\%>/g); //// extract all variables form the template /////
			var var_name = "";
			if( all_vars !== null ){
				for(var v = 0; v <  all_vars.length; v++){ ///// itterate over all the extracted variables ////
					var_name = /\<%(.*?)\%>/g.exec( all_vars[v] )[1].trim(); ////  get the variable name only ////
					if( data[var_name] ){ //// if variable exists in data object ////
						compiled_t =  compiled_t.replace( all_vars[v], data[var_name] );  //// replace the variable name with the respective data ///
					}else{ //// if variable was defined in template , but doesn't have data ///
						compiled_t =  compiled_t.replace( all_vars[v], "" ); //// remove from compiled template /// 
					}
				}
			}
		}
		
		if (typeof jQuery !== 'undefined') {
			compiled_t = $(compiled_t);
		}
		
		return compiled_t;
	}
};

MiniTemplate.loader.prototype = { //// micro template /////
	constructor: MiniTemplate.loader,
	load_template : function( template_src , complete_cb, error_cb){
		switch( typeof template_src ){
			case "array":
				for(var s = 0; s < template_src.length; s++){
					if( MiniTemplate.utils.isURL( template_src[s] ) ){
						this.fetch_template( template_src[s] , complete_cb, error_cb);
					}
				}
				break;
			case "string":
				var template_ext = ".jst";
				if( MiniTemplate.utils.isURL( template_src ) ){
					this.fetch_template( template_src, complete_cb, error_cb);
				}else{
					if( template_src.indexOf(template_ext, template_src.length - template_ext.length) !== -1){ //// check if url ends with .jst ////
						this.fetch_template( template_src, complete_cb, error_cb);
					}else{
						complete_cb(template_src) //// when template string is passed  ///
					}
				}
				break;
			default:
				MiniTemplate.utils.Logger("warn","t_loader",{ msg: "Unable to load template" ,reason: "Invalid emplate source [src: "+typeof template_url+"]"});
				if(error_cb){
					error_cb("[MiniTemplate] [m_template] An error occured while parsing template url(s)");
				}
		}
	},
	
	fetch_template: function(t_url, success_cb, err_cb){
		var self = this;
		if (typeof jQuery !== 'undefined') {
			self.abortAjax();
			self.xhr_request = $.ajax({
				dataType: 'html',
				type: 'GET',
				url: t_url
			}).done(function (template_str) {
				self.xhr_request = null;
				if(typeof success_cb !== "undefined"){
					success_cb( template_str );
				}
			}).fail(function (jqXHR, textStatus, errorThrown) {
				self.xhr_request = null;
				if(typeof err_cb !== "undefined"){
					err_cb("[MiniTemplate] [t_fetch] An error occured while fetching template file")
				}
				MiniTemplate.utils.Logger("error","t_fetch",{ msg: "Unable to load template" , reason: "Request returned with status code  "+jqXHR.status });
			});
		}else{
			MiniTemplate.utils.Logger("error","t_fetch",{ msg: "Unable to load template" ,reason: "jQuery not defined"});
			if(typeof err_cb !== "undefined"){
				err_cb("[MiniTemplate] [t_fetch] An error occured while loading template");
			}
		}
	},
	
	abortAjax: function () {
		if (this.xhr_request) {
			this.xhr_request.abort();
			this.xhr_request = null;
		}
	},
	
	close: function(){
		this.abortAjax();
		this.callbacks = {};
	}
};

MiniTemplate.utils = {
	isURL : function( url ){
		var result = url.match(/\b(https?|ftp|file):\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[\-A-Za-z0-9+&@#\/%=~_|??]/);
		if( result !== null ){
			//// index has to be 0, to make sure it's not matching an url within the template content ////
			return result.index === 0;
		}else{
			return false;
		}
	},
	Logger : function( type, component,  msg_data ){
		if( typeof type !== "undefined" && typeof component !== "undefined" && typeof msg_data !== "undefined"){
			switch(type){
				case "info":
						console.log( "[I] ["+component+"] "+msg_data.msg );
					break;
				case "warn":
						console.warn( "[W] ["+component+"] "+msg_data.msg+" (reason : "+msg_data.reason+")" );
					break;
				case "error":
						console.error( "[E] ["+component+"] "+msg_data.msg+" (reason : ",msg_data.reason,")" );
					break;
				default: 
					this.utils.Logger( "warn" ,component,{ msg: "Unable to log message", reason: "Unrecognized type ["+type+"] used"});
			}
		}else{
			this.utils.Logger( "error" ,"Logger", { msg : "Unable to log message", reason: "Insufficient data provided" });
		}
	}
};