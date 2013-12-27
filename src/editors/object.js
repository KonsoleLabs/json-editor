$.jsoneditor.editors.object = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return $.extend(true,{},this.schema.default || {});
  },
  getChildEditors: function() {
    return this.editors;
  },
  build: function() {
    this.editors = {};
    var self = this;

    // If the object should be rendered as a table row
    if(this.getOption('table_row',false)) {
      this.editor_holder = this.container;
      $.each(this.schema.properties, function(key,schema) {
        var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);
        var holder = self.getTheme().getTableCell().appendTo(self.editor_holder);

        self.editors[key] = new editor({
          jsoneditor: self.jsoneditor,
          schema: schema,
          container: holder,
          path: self.path+'.'+key,
          parent: self,
          compact: true
        });
      });
    }
    // If the object should be rendered as a table
    else if(this.getOption('table',false)) {
      // TODO: table display format
    }
    // If the object should be rendered as a div
    else {
      this.title = this.getTheme().getHeader(this.getTitle()).appendTo(this.container);
      
      this.editjson_holder = this.theme.getTextareaInput().appendTo(this.container).hide().css({
        height: 100,
        width: '100%'
      });
      
      if(this.schema.description) this.description = this.getTheme().getDescription(this.schema.description).appendTo(this.container);
      this.editor_holder = this.getTheme().getIndentedPanel().appendTo(this.container);

      $.each(this.schema.properties, function(key,schema) {
        var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);
        var holder = self.getTheme().getChildEditorHolder().appendTo(self.editor_holder);

        self.editors[key] = new editor({
          jsoneditor: self.jsoneditor,
          schema: schema,
          container: holder,
          path: self.path+'.'+key,
          parent: self
        });
      });

      // Control buttons
      this.title_controls = this.getTheme().getHeaderButtonHolder().appendTo(this.title);

      // Show/Hide button
      this.collapsed = false;
      this.toggle_button = this.getTheme().getButton('Collapse').appendTo(this.title_controls).on('click',function() {
        if(self.collapsed) {
          self.editor_holder.show(300);
          self.collapsed = false;
          self.getTheme().setButtonText(self.toggle_button,'Collapse');
        }
        else {
          self.editor_holder.hide(300);
          self.collapsed = true;
          self.getTheme().setButtonText(self.toggle_button,'Expand');
        }
      });
      
      // Edit JSON Button
      this.editing_json = false
      this.editjson_button = this.theme.getButton('Edit JSON').appendTo(this.title_controls).on('click',function() {
        // Save Changes
        if(self.editing_json) {
          // Get value from form
          try {
            var value = JSON.parse(self.editjson_holder.val());
          }
          catch(e) {
            // Error parsing the JSON
            alert('Invalid JSON - '+e);
            return false;
          }
          
          // Hide the edit form
          self.cancel_editjson_button.hide();
          self.editjson_holder.hide(300);
          self.theme.setButtonText(self.editjson_button,'Edit JSON');
          self.editing_json = false;
          
          // Set the value
          self.setValue(value);
          self.editor_holder.trigger('change');
        }
        // Start Editing
        else {
          self.editing_json = true;
          self.cancel_editjson_button.show();
          self.editjson_holder.show(300);
          self.theme.setButtonText(self.editjson_button,'Save JSON');
        }
        
        return false;
      });
      this.cancel_editjson_button = this.theme.getButton('Cancel Edit').appendTo(this.title_controls).hide().on('click',function() {
          self.cancel_editjson_button.hide();
          self.editjson_holder.hide(300);
          self.theme.setButtonText(self.editjson_button,'Edit JSON');
          self.editing_json = false;
          
          return false;
      });
    }
      
    // When a child editor changes, refresh the value
    self.editor_holder.on('change',function() {
      self.refreshValue();
    });
    
  },
  destroy: function() {
    $.each(this.editors, function(i,el) {
      el.destroy();
    });
    this.editor_holder.empty();
    if(this.title) this.title.remove();

    this.editors = null;
    this.editor_holder.remove();
    this.editor_holder = null;

    this._super();
  },
  refreshValue: function() {
    this.value = {};
    var self = this;
    $.each(this.editors, function(i,editor) {
      self.value[i] = editor.getValue();
    });
    
    if(!this.editing_json && this.editjson_holder) this.editjson_holder.val(JSON.stringify(this.value,null,2));
  },
  setValue: function(value) {
    value = value || {};
    var self = this;
    $.each(this.editors, function(i,editor) {
      if(typeof value[i] !== "undefined") {
        editor.setValue(value[i]);
      }
      else {
        editor.setValue(editor.getDefault());
      }
    });
    this.refreshValue();
  },
  isValid: function(callback) {
    var errors = [];

    var needed = 0;
    $.each(this.editors, function(i,editor) {
      needed++;
    });
    
    if(!needed) return callback();

    var finished = 0;
    $.each(this.editors, function(i,editor) {
      editor.isValid(function(err) {
        if(err) {
          errors = errors.concat(err);
        }
        finished++;

        if(finished >= needed) {
          if(errors.length) callback(errors);
          else callback();
        }
      });
    });
  }
});