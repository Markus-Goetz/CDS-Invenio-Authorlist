/*
* Variable: SpreadSheet.CSS
* Purpose:  Central enumeration and mapping for the CSS classes used in 
*           SpreadSheet to ease look up and adjustments if needed.
*
*/
SpreadSheet.CSS = {
    // General classes
    'SpreadSheet'           : 'SpreadSheet',
    'DataTable'             : 'DataTable',
    
    // Cell classes
    'Wrapper'               : 'Wrapper',
    'Content'               : 'Content',
    'Clickable'             : 'Clickable',
    'Focus'                 : 'Focus',
    
    'Text'                  : 'Text',
    'Edit'                  : 'Edit',
    'Increment'             : 'Increment',
    'Select'                : 'Select',
    'Checkbox'              : 'Checkbox',
    'Complex'               : 'Complex',
    'Extendable'            : 'Extendable',
    
    'Readonly'              : 'Readonly',
    
    // jQuery UI classes
    'Icon'                  : 'ui-icon',
    'Plus'                  : 'ui-icon-plus',
    'Minus'                 : 'ui-icon-minus',
    'Up'                    : 'ui-icon-carat-1-n',
    'Down'                  : 'ui-icon-carat-1-s',
    'Delete'                : 'ui-icon-close',
    'Checked'               : 'ui-icon-check',
    'Unchecked'             : 'ui-icon-closethick'
}









/*
* Function: SpreadSheetColumn
* Purpose:  Constructor
* Input(s): object:oInit - Initialization settings for a column
* Returns:  SpreadSheetColumn instance when called with new, else undefined
*
*/
SpreadSheet.Column = function( oInit ) {
    if ( typeof oInit === 'undefined' ) return this;
    
    // Set the properties of the columns to the passed values or the sane 
    // defaults. DO NOT change their names as they will be passed directly to 
    // the DataTables instance and have to HAVE this FORMAT. For more details 
    // see the jQuery DataTables online documentation.
    
    // objects
    this.oSpreadSheet = oInit.oSpreadSheet;
    
    // strings
    this.sClass = [ oInit.sType, SpreadSheet.CSS.Clickable ].join( ' ' );
    this.sTitle = typeof oInit.title === 'string' ? oInit.title : '';
    this.sType = oInit.sType;
    this.sValue = oInit.value || '-';
    this.sWidth = oInit.width || null;
    
    // booleans
    this.bExtendable = oInit.extendable || false;
    this.bProtected = oInit.readonly || false;
    this.bSearchable = typeof oInit.searchable !== 'undefined' ? oInit.searchable : true;
    this.bSortable = typeof oInit.sortable !== 'undefined' ? oInit.sortable : true;
    this.bVisible = typeof oInit.visible !== 'undefined' ? oInit.visible : true;
    
    // callbacks
    var oSort = jQuery.fn.dataTableExt.oSort;    
    oSort[ this.sType + '-asc' ] = this._fnMakeAscendingSorting();
    oSort[ this.sType + '-desc' ] = this._fnMakeDescendingSorting();
    jQuery.fn.dataTableExt.ofnSearch[ this.sType ] = this._fnMakeFilter();
    this._fnRegisterClicks();
}

/*
* Function: _fnMakeFilter
* Purpose:  Constructs a filter callback to be registered with the DataTable 
*           instance to allow searching columns. The callback just basically 
*           parses the value of the column and returns its normalized value.
* Input(s): void
* Returns:  function:fnFilterCallback - the filter callback
*
*/
SpreadSheet.Column.prototype._fnMakeFilter = function() {
    var self = this;
    
    return function( sData ) {
        return self.fnValue( sData ).toString();
    }
}

/*
* Function: _fnMakeAscendingSorting
* Purpose:  Constructs a sorting callback for ascending sorting. The ascending 
*           order is equal to the generic sorting order of the fnCompare 
*           function.
* Input(s): void
* Returns:  function:fnAscendingSortingCallback - the sort callback
*
*/
SpreadSheet.Column.prototype._fnMakeAscendingSorting = function() {
    var self = this;
    
    return function( a, b ) {
        return self.fnCompare( a, b, self );
    }
}

/*
* Function: _fnMakeDescendingSorting
* Purpose:  Constructs a sorting callback for descending sorting. The sort order
*           is directly inverse to the generic sort order.
* Input(s): void
* Returns:  function:fnDescendingSortingCallback - the sort callback
*
*/
SpreadSheet.Column.prototype._fnMakeDescendingSorting = function() {
    var self = this;
    
    return function( a, b ) {
        return -1 * self.fnCompare( a, b, self );
    }
}

/*
* Function: fnCompare
* Purpose:  Generic javascript-style compare function that is able to compare 
*           two cells that belong to this column. In case that the column is 
*           of type extendable, we will convert the value of the cell - i.e. 
*           an array to a string first, to allow a more or less meaningful 
*           sorting.
* Input(s): object:oA - the left hand value as string, DOM element or jQuery set
*           object:oA - the right hand value as string, ...
* Returns:  integer:iCompare - the javascript-style comparison value
*
*/
SpreadSheet.Column.prototype.fnCompare = function( oA, oB, self ) {
    if ( typeof self === 'undefined' ) self = this;
    var a = self.fnValue( oA );
    var b = self.fnValue( oB );
    
    if ( this.bExtendable ) {
        a = a.toString();
        b = b.toString();
    }
    
    return a < b ? -1 : ( a > b ? 1 : 0 );
}

/*
* Function: fnCreate
* Purpose:  Creates a new cell of this column with all values set to default.
* Input(s): node:nNode - the node to be serialized
* Returns:  string:sInnerHtml - the serialized html of the node
*
*/
SpreadSheet.Column.prototype.fnCreate = function( oValue ) {
    // If we do not pass a value, it will create a default cell
    if ( typeof oValue === 'undefined' ) oValue = this.sValue;
    // Extendable cells expect arrays as value
    if ( this.bExtendable && !jQuery.isArray( oValue ) ) oValue = [ oValue ];

    var nWrapper = jQuery( '<div>' );
    nWrapper.addClass( SpreadSheet.CSS.Wrapper );

    // Not extendable? then return one cell only
    if ( !this.bExtendable ) {
        var nContent = jQuery( '<div>' );
        nContent.addClass( SpreadSheet.CSS.Content );
        
        var nCell = this._fnCreateCell( oValue );
        nContent.append( nCell );
        nWrapper.append( nContent );
        
        return this._fnOuterHtml( nWrapper );
    }

    // Is extendable? Some layouting required
    // Create the cell as table. I am scared to say this, but we need it for
    // layouting reasons. For details google for 'input width display block'
    var nTable = jQuery( '<table>' );
    var asClasses = [ SpreadSheet.CSS.Content ];
    nTable.attr( {
        'class'     : asClasses.join( ' ' )
    } );

    for ( var i = 0, iLen = oValue.length; i < iLen; i++ ) {
        // Create the table row    
        var nTableRow = jQuery( '<tr>' );
        nTable.append( nTableRow );

        // Create cell content
        var nCell = jQuery( '<td>' );
        nCell.append( this._fnCreateCell( oValue[ i ] ) );
        nTableRow.append( nCell );
    
        // Create add button if required
        var nExtendable = jQuery( '<td>' );
        nExtendable.attr( {
            'class'     : SpreadSheet.CSS.Extendable
        } );
        
        // Have the add button only in the first row
        if ( i === 0 ) {
            nExtendable.append( this._fnCreateExtendable() );
            nTableRow.append( nExtendable );
        }
    }
    
    nWrapper.append( nTable );
    return this._fnOuterHtml( nWrapper );
}

/*
* Function: _fnCreateCell
* Purpose:  Creates the actual content of the cell in this case a text input box
* Input(s): void
* Returns:  node:nCell - the cell content as a jQuery node
*
*/
SpreadSheet.Column.prototype._fnCreateCell = function( sValue ) {
    var nCell = jQuery( '<input type="text" value="' + sValue + '">' );
    var asClasses = [ SpreadSheet.CSS.SpreadSheet, 
                      SpreadSheet.CSS.Text, 
                      SpreadSheet.CSS.Readonly,
                      this.sType ];
                      
    nCell.attr( {
        'class'     : asClasses.join( ' ' ),
        'readonly'  : 'readonly'
    } );
    
    return nCell;
}

/*
* Function: _fnCreateExtendable
* Purpose:  Creates the neat plus button in the end of cell if this column is 
*           marked to be a extendable column (bExtendable = true)
* Input(s): void
* Returns:  node:nExtendable - the node containing the add button
*
*/
SpreadSheet.Column.prototype._fnCreateExtendable = function() {
    var nWrapper = jQuery( '<div>' );

    // Plus
    var nPlus = jQuery( '<span>' );
    var asClasses = [ SpreadSheet.CSS.SpreadSheet, 
                      SpreadSheet.CSS.Extendable, 
                      SpreadSheet.CSS.Icon,
                      SpreadSheet.CSS.Plus,
                      this.sType ];
    nPlus.attr( {
        'class'     : asClasses.join( ' ' )
    } );
    
    // Minus
    var nMinus = jQuery( '<span>' );
    asClasses = [ SpreadSheet.CSS.SpreadSheet,
                  SpreadSheet.CSS.Extendable,
                  SpreadSheet.CSS.Icon,
                  SpreadSheet.CSS.Minus,
                  this.sType ];
    nMinus.attr( {
        'class'     : asClasses.join( ' ' )
    } );
    
    // Fill wrapper
    nWrapper.append( nPlus, nMinus );
    
    return nWrapper;
}

/*
* Function: _fnOuterHtml
* Purpose:  Transforms a DOM or jQuery node into its serialized HTML version.
* Input(s): node:nNode - the node to be serialized
* Returns:  string:sInnerHtml - the serialized html of the node
*
*/
SpreadSheet.Column.prototype._fnOuterHtml = function( nNode ) {
    var nDummy = jQuery( '<div>' );
    nDummy.append( jQuery( nNode ).clone() );
    
    return nDummy.html();
}

/*
* Function: fnValue
* Purpose:  Returns the value of a cell of this column in a processable way - 
*           meaning it returns a simple string or in case of an extendable cell 
*           an array with each value.
* Input(s): object:oData - the data of a cell of this column as a string, DOM
*                          element or jQuery set.
* Returns:  string|array string:oValue - the value of the cell
*
*/
SpreadSheet.Column.prototype.fnValue = function( oData ) {
    var anCells = jQuery( 'input.' + SpreadSheet.CSS.Text, jQuery( oData ) );
    
    // Individual cell? A simple val will do - returns the first result
    if ( !this.bExtendable ) {
        return anCells.val();
    }
    
    // Extendable cell? Then we have to get the value of each of the cells
    var aoResults = [];
    anCells.each( function( iIndex, nCell ) {
        aoResults.push( jQuery( nCell ).val() );
    } );
    return aoResults;
}

/*
* Function: _fnRegisterClicks
* Purpose:  Register the click event handlers for a cell. The individual calls 
*           for clicking on a the cell itself should be overwritten in other 
*           column types, the plus and minus button interaction however should 
*           be reusable in most of the cases.
* Input(s): void
* Returns:  void
*
*/
SpreadSheet.Column.prototype._fnRegisterClicks = function() {
    if ( this.bProtected ) return;

    var sTable = '#' + this.oSpreadSheet.fnGetId();
    var sTd = [ 'td', this.sType, SpreadSheet.CSS.Clickable ].join( '.' );
    
    // Click on a cell
    this._fnRegisterClick( sTable, sTd );    
    // Blurring a cell
    this._fnRegisterBlur( sTable, sTd );
    // Click on plus
    this._fnRegisterAdd( sTable, sTd );
    // Click on minus
    this._fnRegisterMinus( sTable, sTd );
}

/*
* Function: _fnRegisterClick
* Purpose:  Register the click interaction with a normal column cell. In this 
*           case, we will make the clicked input field writeable and select the 
*           content.
* Input(s): string:sTable - the own table selector string
*           string:sTd - the own table cell (td) selector string
* Returns:  void
*
*/
SpreadSheet.Column.prototype._fnRegisterClick = function( sTable, sTd ) {
    var self = this;
    var sInput = [ 'input', this.sType, SpreadSheet.CSS.Text ].join( '.' );

    jQuery( sTable ).delegate( sInput, 'click', function( event ) {    
        var nInput = jQuery( this );
        
        nInput.removeAttr( 'readonly' );
        nInput.removeClass( SpreadSheet.CSS.Readonly );
        nInput.select();
    } );
}

/*
* Function: _fnRegisterBlur
* Purpose:  Registers a cell blur callback. In this case, make all blurred input
*           field readonly again and save the content in the DataTables instance
* Input(s): string:sTable - the own table selector string
*           string:sTd - the own table cell (td) selector string
* Returns:  void
*
*/
SpreadSheet.Column.prototype._fnRegisterBlur = function( sTable, sTd ) {
    var self = this;
    var sInput = [ 'input', this.sType, SpreadSheet.CSS.Text ].join( '.' );
    
    jQuery( sTable ).delegate( sInput, 'blur', function( event ) {    
        var nInput = jQuery( this );
        var nCell = nInput.parents( sTd );
        var aoValues = self.fnValue( nCell );
        
        nInput.attr( 'readonly', 'readonly' );
        nInput.addClass( SpreadSheet.CSS.Readonly );
        self.oSpreadSheet.fnUpdate( nCell, self.fnCreate( aoValues ) );
    } );
}

/*
* Function: _fnRegisterAdd
* Purpose:  Register the callback what will happen if one clicks on the neat add
*           button in a cell. Usually a new default line should appear and the 
*           whole thing shall be saved in the DataTables instance. In almost all 
*           cases this callback is nothing that you would like to overwrite in 
*           your column prototype.
* Input(s): string:sTable - the own table selector string
*           string:sTd - the own table cell (td) selector string
* Returns:  void
*
*/
SpreadSheet.Column.prototype._fnRegisterAdd = function( sTable, sTd ) {
    var self = this;
    var sAdd = [ 'span', this.sType, SpreadSheet.CSS.Plus ].join( '.' );
    
    jQuery( sTable ).delegate( sAdd, 'click', function( event ) {
        var nCell = jQuery( this ).parents( sTd );
        self._fnInsertNewLine( nCell );
    } );
}

/*
* Function: _fnRegisterMinus
* Purpose:  Register the callback what will happen if one clicks on the neat 
*           minus button in a cell. In this case the last line will be removed 
*           and the new cell shall be saved in the DataTables instance. In 
*           almost all cases this event handler is nothing that you would like 
*           to overwrite in your column prototype.
* Input(s): string:sTable - the own table selector string
*           string:sTd - the own table cell (td) selector string
* Returns:  void
*
*/
SpreadSheet.Column.prototype._fnRegisterMinus = function( sTable, sTd ) {
    var self = this;
    var sMinus = [ 'span', this.sType, SpreadSheet.CSS.Minus ].join( '.' );
    
    jQuery( sTable ).delegate( sMinus, 'click', function( event ) {
        var nCell = jQuery( this ).parents( sTd );
        self._fnDeleteLine( nCell );
    } );
}

/*
* Function: _fnInsertNewLine
* Purpose:  Inserts a new default line at the end of the given cell and saves it
*           in the DataTable instance.
* Input(s): node:nCell - the DOM element or jQuery of the cell to be modified
* Returns:  void
*
*/
SpreadSheet.Column.prototype._fnInsertNewLine = function( nCell ) {
    var aoValues = this.fnValue( nCell );
    
    // Insert a new default value
    aoValues.push( this.sValue );
    this.oSpreadSheet.fnUpdate( nCell, this.fnCreate( aoValues ) );
}

/*
* Function: _fnRegisterMinus
* Purpose:  Removes a cell at the end of the given input cell and saves the 
*           result in the respective DataTable instance. This is only done as 
*           long as there are at least two cells in the table.
* Input(s): node:nCell - the cell to be modified
* Returns:  void
*
*/
SpreadSheet.Column.prototype._fnDeleteLine = function( nCell ) {
    var aoValues = this.fnValue( nCell );
    
    // Can we remove an element - i.e. at least two in there?
    if ( aoValues.length > 1 ) {
        aoValues = aoValues.slice( 0, aoValues.length - 1 );
        this.oSpreadSheet.fnUpdate( nCell, this.fnCreate( aoValues ) );
    }
}

/*
* Function: _fnKeyin
* Purpose:  Function to be executed when a cell gets a 'keyin' event. This event
*           is a custom invention to support cell focusing when a user interacts
*           with the sheet using the keyboard.
* Input(s): node:nCell - the cell getting the keyin event
* Returns:  void
*
*/
SpreadSheet.Column.prototype.fnKeyin = function( nCell ) {
    var sInput = [ 'input', this.sType, SpreadSheet.CSS.Text ].join( '.' );
    var nInput = jQuery( nCell ).find( sInput ).last();
    
    nInput.click();
}

/*
* Function: _fnKeyout
* Purpose:  Function to be executed when a cell gets a 'keyout' event. It is a
*           custom invention to support cell defocusing when a user interacts
*           with the sheet using the keyboard and is about to leave a cell.
* Input(s): node:nCell - the cell getting the keyout event
* Returns:  void
*
*/
SpreadSheet.Column.prototype.fnKeyout = function( nCell ) {
    var sInput = [ 'input', this.sType, SpreadSheet.CSS.Text ].join( '.' );
    var nInput = jQuery( nCell ).find( sInput );
    
    nInput.blur();
}









/*
* Function: SpreadSheetIncrementColumn
* Purpose:  Constructor
* Input(s): object:oInit - Initialization settings for a column
* Returns:  SpreadSheetIncrementColumn instance when called with new
*
*/
SpreadSheet.IncrementColumn = function( oInit ) {
    SpreadSheet.Column.call(this, oInit);
    
    // objects
    this.oSpreadSheet = oInit.oSpreadSheet;
    
    // string
    this.sValue = oInit.value;
    this.sIncrement = oInit.increment;
    
    // booleans
    this.bExtendable = false;
    this.bProtected = true;
}
// Inherit from SpreadSheet.Column
SpreadSheet.IncrementColumn.prototype = new SpreadSheet.Column();
SpreadSheet.IncrementColumn.prototype.constructor = SpreadSheet.IncrementColumn;

/*
* Function: _fnCreateCell
* Purpose:  Creates the actual content of the cell in this case a simple div 
*           containing the number.
* Input(s): void
* Returns:  node:nCell - the cell content as a jQuery node
*
*/
SpreadSheet.IncrementColumn.prototype._fnCreateCell = function( sValue ) {
    var nCell = jQuery( '<div>' );
    var asClasses = [ SpreadSheet.CSS.SpreadSheet, 
                      SpreadSheet.CSS.Increment,
                      this.sType ];
                      
    if ( typeof sValue === 'undefined' ) {
        sValue = this.sValue;
    }
    nCell.text( sValue );
    nCell.addClass( asClasses.join( ' ' ) );
    
    return nCell;
}









/*
* Function: SpreadSheetCheckboxColumn
* Purpose:  Constructor
* Input(s): object:oInit - Initialization settings for a column
* Returns:  SpreadSheetCheckboxColumn instance when called with new, 
*           else undefined
*
*/
SpreadSheet.CheckboxColumn = function( oInit ) {
    SpreadSheet.Column.call(this, oInit);
    
    // strings
    if ( typeof oInit.value === 'boolean' ) {
        this.sValue = oInit.value;
    } else if ( typeof oInit.value === 'string' ) {
        this.sValue = oInit.value === 'true' ? true : false;
    } else {
        this.sValue = false;
    }
}
// Inherit from SpreadSheet.Column
SpreadSheet.CheckboxColumn.prototype = new SpreadSheet.Column();
SpreadSheet.CheckboxColumn.prototype.constructor = SpreadSheet.CheckboxColumn;

/*
* Function: _fnCreateCell
* Purpose:  Creates the actual content of the cell in this case a text input box
* Input(s): void
* Returns:  node:nCell - the cell content as a jQuery node
*
*/
SpreadSheet.CheckboxColumn.prototype._fnCreateCell = function( sValue ) {
    var nCell = jQuery( '<span>' );
    var asClasses = [ SpreadSheet.CSS.SpreadSheet, 
                      SpreadSheet.CSS.Icon,
                      SpreadSheet.CSS.Checkbox, 
                      this.sType ];
                      
    if ( sValue ) {
        asClasses.push( SpreadSheet.CSS.Checked );
    } else {
        asClasses.push( SpreadSheet.CSS.Unchecked );
    }                          
    nCell.addClass( asClasses.join( ' ' ) );
    
    return nCell;
}

/*
* Function: fnValue
* Purpose:  Returns the value of a cell of this column in a processable way - 
*           meaning it returns a simple string or in case of an extendable cell 
*           an array with each value.
* Input(s): object:oData - the data of a cell of this column as a string, DOM
*                          element or jQuery set.
* Returns:  string|array string:oValue - the value of the cell
*
*/
SpreadSheet.CheckboxColumn.prototype.fnValue = function( oData ) {
    var anCells = jQuery( 'span.' + SpreadSheet.CSS.Checkbox, jQuery( oData ) );
    
    // Individual cell? A simple val will do - returns the first result
    if ( !this.bExtendable ) {
        return anCells.hasClass( SpreadSheet.CSS.Checked );
    }
    
    // Extendable cell? Then we have to get the value of each of the cells
    var aoResults = [];
    anCells.each( function( iIndex, nCell ) {
        aoResults.push( jQuery( nCell ).hasClass( SpreadSheet.CSS.Checked ) );
    } );
    return aoResults;
}

/*
* Function: _fnRegisterClick
* Purpose:  Register the click interaction with a normal column cell. In this 
*           case, we will toggle the symbol of the checkbox on click and save 
*           the new state directly in the DataTables instance.
* Input(s): string:sTable - the own table selector string
*           string:sTd - the own table cell (td) selector string
* Returns:  void
*
*/
SpreadSheet.CheckboxColumn.prototype._fnRegisterClick = function( sTable, sTd ) {
    var self = this;
    var sBox = [ 'span', this.sType, SpreadSheet.CSS.Checkbox ].join( '.' );

    jQuery( sTable ).delegate( sBox, 'click', function( event ) {    
        var nCheckbox = jQuery( this );
        var nCell = nCheckbox.parents( sTd );
        
        nCheckbox.toggleClass( SpreadSheet.CSS.Checked );
        nCheckbox.toggleClass( SpreadSheet.CSS.Unchecked );
        
        var aoValues = self.fnValue( nCell );
        self.oSpreadSheet.fnUpdate( nCell, self.fnCreate( aoValues ) );
    } );
}

/*
* Function: _fnRegisterBlur
* Purpose:  Registers a cell blur callback. In this case, we have to do nothing 
*           because checkboxes save their state already when being clicked.
* Input(s): string:sTable - the own table selector string
*           string:sTd - the own table cell (td) selector string
* Returns:  void
*
*/
SpreadSheet.CheckboxColumn.prototype._fnRegisterBlur = function( sTable, sTd ) {
    // Nothing to see here, please proceed
}

/*
* Function: _fnKeyin
* Purpose:  Function to be executed when a cell gets a 'keyin' event. Here: 
*           nothing to do
* Input(s): node:nCell - the cell getting the keyin event
* Returns:  void
*
*/
SpreadSheet.CheckboxColumn.prototype.fnKeyin = function( nCell ) {
    // Nothing to do
}

/*
* Function: _fnKeyout
* Purpose:  Function to be executed when a cell gets a 'keyout' event. Here: 
*           nothing to do
* Input(s): node:nCell - the cell getting the keyout event
* Returns:  void
*
*/
SpreadSheet.CheckboxColumn.prototype.fnKeyout = function( nCell ) {
    // Nothing to do
}









/*
* Function: SpreadSheetSelectColumn
* Purpose:  ConstructorSpreadSheet.CSS.SpreadSheet, 
                      SpreadSheet.CSS.Select,
                      this.sType ]
* Input(s): object:oInit - Initialization settings for a column
* Returns:  SpreadSheetCheckboxColumn instance when called with new, 
*           else undefined
*
*/
SpreadSheet.SelectColumn = function( oInit ) {
    SpreadSheet.Column.call(this, oInit);
    
    // strings
    this.sValue = typeof oInit.value !== 'undefined' ? oInit.value : '';
    
    // objects
    this.aOptions = typeof oInit.options !== 'undefined' ? oInit.options : [];
    if ( jQuery.inArray( this.sValue, this.aOptions ) < 0 ) {
        this.aOptions.unshift( this.sValue );
    }
}
// Inherit from SpreadSheet.Column
SpreadSheet.SelectColumn.prototype = new SpreadSheet.Column();
SpreadSheet.SelectColumn.prototype.constructor = SpreadSheet.SelectColumn;

/*
* Function: _fnCreateCell
* Purpose:  Creates the actual content of the cell in this case a text input box
* Input(s): void
* Returns:  node:nCell - the cell content as a jQuery node
*
*/
SpreadSheet.SelectColumn.prototype._fnCreateCell = function( sValue ) {
    var nCell = jQuery( '<div>' );
    var asClasses = [ SpreadSheet.CSS.SpreadSheet, 
                      SpreadSheet.CSS.Select,
                      this.sType ];
                      
    if ( typeof sValue === 'undefined' ) {
        sValue = this.sValue;
    }                      
    nCell.authorlist_select( {
        'value'         : sValue,
        'options'       : this.aOptions
    } );
    nCell.addClass( asClasses.join( ' ' ) );
    
    return nCell;
}

/*
* Function: fnValue
* Purpose:  Returns the value of a cell of this column in a processable way - 
*           meaning it returns a simple string or in case of an extendable cell 
*           an array with each value.
* Input(s): object:oData - the data of a cell of this column as a string, DOM
*                          element or jQuery set.
* Returns:  string|array string:oValue - the value of the cell
*
*/
SpreadSheet.SelectColumn.prototype.fnValue = function( oData ) {
    var anCells = jQuery( 'select', jQuery( oData ) );
    
    // Individual cell? A simple val will do - returns the first result
    if ( !this.bExtendable ) {
        return anCells.val();
    }
    
    // Extendable cell? Then we have to get the value of each of the cells
    var aoResults = [];
    anCells.each( function( iIndex, nCell ) {
        aoResults.push( jQuery( nCell ).val() );
    } );
    return aoResults;
}

/*
* Function: _fnRegisterClick
* Purpose:  Register the click interaction with a normal column cell. In this 
*           case, we will save the updated select box in the DataTable instance 
*           as soon as we get the change event of any of the contained select 
*           boxes.
* Input(s): string:sTable - the own table selector string
*           string:sTd - the own table cell (td) selector string
* Returns:  void
*
*/
SpreadSheet.SelectColumn.prototype._fnRegisterClick = function( sTable, sTd ) {
    var self = this;
    var sDiv = [ 'div', SpreadSheet.CSS.SpreadSheet, 
                  SpreadSheet.CSS.Select, this.sType ].join( '.' );
    var sSelector = [ sTd, sDiv, 'select' ].join( ' ' );

    jQuery( sTable ).delegate( sSelector, 'change', function( event ) {
        var nSelect = jQuery( event.currentTarget );
        var nCell = nSelect.parents( sTd );
        var aoValues = self.fnValue( nCell );
        
        self.oSpreadSheet.fnUpdate( nCell, self.fnCreate( aoValues ) );
    } );
}

/*
* Function: _fnRegisterBlur
* Purpose:  Registers a cell blur callback. In this case, we have to nothing do.
* Input(s): string:sTable - the own table selector string
*           string:sTd - the own table cell (td) selector string
* Returns:  void
*
*/
SpreadSheet.SelectColumn.prototype._fnRegisterBlur = function( sTable, sTd ) {
    // Nothing to see here, please proceed
}

/*
* Function: _fnKeyin
* Purpose:  Function to be executed when a cell gets a 'keyin' event. Here: 
*           nothing to do
* Input(s): node:nCell - the cell getting the keyin event
* Returns:  void
*
*/
SpreadSheet.SelectColumn.prototype.fnKeyin = function( nCell ) {
    // Nothing to do
}

/*
* Function: _fnKeyout
* Purpose:  Function to be executed when a cell gets a 'keyout' event. Here: 
*           nothing to do
* Input(s): node:nCell - the cell getting the keyout event
* Returns:  void
*
*/
SpreadSheet.SelectColumn.prototype.fnKeyout = function( nCell ) {
    // Nothing to do
}









/*
* Variable: SpreadSheet.ColumnTypes
* Purpose:  Lookup table to determine the handling prototype for a certain 
*           column type.
*
*/
SpreadSheet.ColumnTypes = {
    'text'                  : SpreadSheet.Column,
    'increment'             : SpreadSheet.IncrementColumn,
    'checkbox'              : SpreadSheet.CheckboxColumn,
    'select'                : SpreadSheet.SelectColumn,
    
    'default'               : SpreadSheet.Column
}









/*
* Function: SpreadSheet
* Purpose:  Constructor
* Input(s): string:sId - Id of the html element the SpreadSheet will be embedded
*                        into (preferably a div).
*           object:oInit - Object containing initialization settings
* Returns:  SpreadSheet instance when called with new, else undefined
*
*/
function SpreadSheet( sId, oInit ) {
    // Clean the initialization parameters
    this._oInit = this._fnSanitizeParameters( oInit );

    // Find the parent element and assign SpreadSheet elements
    this._nParent = this._fnGetElement( sId );
    this._nParent.addClass( SpreadSheet.CSS.SpreadSheet );

    // Create the table    
    this._nTable = this._fnCreateTable();
    this._nParent.append( this._nTable );
    
    // Construct the column descriptors
    this._aoColumns = this._fnCreateColumns( this._oInit, this._nTable );
    
    // Register table interaction callbacks
    this._fnRegisterClicks( this._nTable );
    this._fnRegisterKeyboard( this._nTable );
    
    // Create the DataTable instance
    this._oDataTable = this._fnCreateDataTable( this._nTable, this._aoColumns );
    
    // Create an initial empty new line
    this.fnInsertNewLine();
}

/*
* Function: _fnSanitizeParameters
* Purpose:  Ensures that the necessary options in the initializer object are set
            and that they are of the right type.
* Input(s): object:oInit - the initializer object to be sanitized.
* Returns:  object:oSanitized - the sanitized version of the passed one.
*
*/
SpreadSheet.prototype._fnSanitizeParameters = function( oInit ) {
    var oSanitized = jQuery.extend( {}, oInit );
    
    oSanitized.columns = oInit.columns || [];
    oSanitized.focus = oInit.focus || null;
    
    return oSanitized;
}

/*
* Function: _fnGetElement
* Purpose:  Get element by id or raises error. Handy for initialization calls to 
            ensure presence of important nodes.
* Input(s): object:oId - Id of the element to get. Should be of type string but 
*                        could be of any type - toString() will be automatically
*                        called in doubt.
* Returns:  node:nElement - The element with the given id.
*
*/
SpreadSheet.prototype._fnGetElement = function( oId ) {
    var nElement = jQuery( '#' + oId );
    if ( nElement.length === 0 ) {
        throw 'Element with Id ' + oId + ' not present.';
    }
    
    return nElement;
}

/*
* Function: _fnCreateTable
* Purpose:  Creates the DOM nodes - i.e. table, thead and tbody and their rows -
*           in which the DataTable instance will be embedded into.
* Input(s): void
* Returns:  node:nTable - the root node of the created table
*
*/
SpreadSheet.prototype._fnCreateTable = function() {
    var aClasses = [ SpreadSheet.CSS.SpreadSheet, SpreadSheet.CSS.DataTable ];

    var nTable = jQuery( '<table>' );
    nTable.attr( {
        'id'    : this._fnCreateId(),
        'class' : aClasses.join( ' ' )
    } );
    var nTableHead = jQuery( '<thead><tr></thead>' );
    var nTableBody = jQuery( '<tbody>' );
    nTable.append( nTableHead, nTableBody );
    
    return nTable;
}

/*
* Function: _fnCreateId
* Purpose:  Generates a unique ID for something. JavaScript is lacking a native 
*           function for this purpose. Instead, we will just use the millis 
*           since the epoch. This approach may theoretically(!) lead to id 
*           collisions. However, in most cases in practice we should have enough
*           time between each generation.
* Input(s): void
* Returns:  integer:id - the generated id
*
*/
SpreadSheet.prototype._fnCreateId = function() {
    return 'sheet-' + jQuery.now();
}

/*
* Function: _fnCreateColumns
* Purpose:  Creates column descriptors from a initialization parameters-like 
*           object as passed to the SpreadSheet constructor for instance.
* Input(s): object:oInit - the initialization parameters passed to the table
* Returns:  array object:aoColumns
*
*/
SpreadSheet.prototype._fnCreateColumns = function( oInit, nTable ) {
    var aoColumns = [];
    var oColumn = null;
    var oColumnType = null;
    var oColumnPrototype = null;    
    var sTableId = this.fnGetId( nTable );
    
    for ( var i = 0, iLen = oInit.columns.length; i < iLen; i++ ) {
        // Get column,its type or default if not present and its prototype
        oColumn = oInit.columns[i];
        oColumn.sType = sTableId + '-' + i;
        oColumn.oSpreadSheet = this;
        
        oColumnType = oColumn.type || 'default';
        oColumnPrototype = SpreadSheet.ColumnTypes[ oColumnType ];
        
        aoColumns.push( new oColumnPrototype( oColumn ) );
    }
    
    return aoColumns;
}

/*
* Function: _fnRegisterClicks
* Purpose:  Register click callbacks on all cells of this table. The callback 
*           itself will just simply forward the click event directly to the 
*           respective column object, after blurring any current focused cell,
*           setting the focus to the clicked cell and looking up the cell in the
*           DataTable.
* Input(s): node:nTable - the jQuery set of the table root node
* Returns:  void
*
*/
SpreadSheet.prototype._fnRegisterClicks = function( nTable ) {
    var self = this;
    // id selector of the passed table
    var sId = '#' + this.fnGetId( nTable );
    // all sub cells that are clickable
    var sTd = ' td.' + SpreadSheet.CSS.Clickable;

    // TODO: rethink me! Click in a cell on input and then on another input cell
    jQuery( sId ).delegate( sTd, 'focus', function( event ) {
        var nTarget = jQuery( event.currentTarget );
        var iX = nTarget.parent().children().index( nTarget );
        
        if ( !self._aoColumns[ iX ].bProtected ) {
            self._fnFocusin( nTarget );
        }
    } );
    
    jQuery( sId ).delegate( sTd, 'focusout', function( event ) {
        var nTarget = jQuery( event.currentTarget );
        var iX = nTarget.parent().children().index( nTarget );
        
        if ( !self._aoColumns[ iX ].bProtected ) {
            self._fnFocusout( nTarget );
        }
    } );
}

/*
* Function: _fnRegisterKeyboard
* Purpose:  Register keyboard callbacks on all cells of this table. The callback 
*           itself will just simply forward the click event directly to the 
*           respective column object, after blurring any current focused cell,
*           setting the focus to the focused cell and looking up the cell in the
*           DataTable.
* Input(s): node:nTable - the jQuery set of the table root node
* Returns:  void
*
*/
SpreadSheet.prototype._fnRegisterKeyboard = function( nTable ) {
    var self = this;

    jQuery( document ).keydown( function( event ) {
        // find focused cells and look up whether they belong to our table
        var nFocus = jQuery( 'td.' + SpreadSheet.CSS.Focus );
        var nTable = nFocus.parents( '#' + self.fnGetId() );
        if ( nTable.length <= 0 ) return;

        // Escape
        if ( event.which == jQuery.ui.keyCode.ESCAPE ) {
            self._fnKeyoutAll( nFocus );
            event.preventDefault();
        //Enter
        } else if ( event.which == jQuery.ui.keyCode.ENTER ) {
            self._fnFocusout( nFocus );
            self._fnEnter( nFocus );
            event.preventDefault();
        // Shift + Tab
        } else if ( event.shiftKey && event.which == jQuery.ui.keyCode.TAB ) {
            self._fnFocusout( nFocus );
            self._fnMoveLeft( nFocus );
            event.preventDefault();
        // Tab
        } else if ( event.which == jQuery.ui.keyCode.TAB ) {
            self._fnFocusout( nFocus );
            self._fnMoveRight( nFocus );
            event.preventDefault();
        // Up arrow
        } else if ( event.which == jQuery.ui.keyCode.UP ) {
            self._fnFocusout( nFocus );
            self._fnMoveUp( nFocus );
            event.preventDefault();
        // Down arrow
        } else if ( event.which == jQuery.ui.keyCode.DOWN ) {
            self._fnFocusout( nFocus );
            self._fnMoveDown( nFocus );
            event.preventDefault();
        }
    } );
}

/*
* Function: _fnEnter
* Purpose:  Defines what happens when a person hits the enter button - i.e. move
*           down if another cell is there or introduce a new one first and then 
*           move.
* Input(s): node:nCell - the cell that was focused when the enter key was hit
* Returns:  void
*
*/
SpreadSheet.prototype._fnEnter = function( nCell ) {
    var nRow = nCell.parent();
    var anRows = nRow.parent().children();
    var iX = nRow.find( 'td.' + SpreadSheet.CSS.Clickable ).index( nCell );
    var iY = anRows.index( nRow );
    
    var oSettings = this._oDataTable.fnSettings();
    var iEnd = oSettings._iDisplayEnd;
    var iItems = iEnd - oSettings._iDisplayStart;
    var iTotalItems = oSettings.aoData.length;
    
    var oColumn = this._aoColumns[ iX ];
    
    if ( iY == iItems - 1 && iEnd == iTotalItems ) {
        this.fnInsertNewLine( false );
        this._oDataTable.fnPageChange( 'last' );
        
        anRows = jQuery( '#' + this.fnGetId() + ' > tbody > tr' );
        nNewCell = anRows.last().children().eq( iX );
        
        oColumn.fnKeyout( nCell );
        this._fnFocusin( nNewCell );
        oColumn.fnKeyin( nNewCell );
    } else {
        this._fnMoveDown( nCell );
    }
}

/*
* Function: _fnKeyoutAll
* Purpose:  Sends a 'Keyout' event to all passed cells
* Input(s): node:nFocus - the nodes
* Returns:  void
*
*/
SpreadSheet.prototype._fnKeyoutAll = function( nFocus ) {
    var self = this;
    
    nFocus.each( function( iIndex, nCell ) {
        var iColumn = self._oDataTable.fnGetPosition( nCell )[ 2 ];
        self._aoColumns[ iColumn ].fnKeyout( nCell );
    } );
}

/*
* Function: _fnFocusout
* Purpose:  Remove the focus from the one passed cell
* Input(s): node:nTd - the cell
* Returns:  void
*
*/
SpreadSheet.prototype._fnFocusout = function( nTd ) {    
    jQuery( nTd ).removeClass( SpreadSheet.CSS.Focus );
}

/*
* Function: _fnFocusin
* Purpose:  Add the focus to the passed cell
* Input(s): node:nTd - the cell
* Returns:  void
*
*/
SpreadSheet.prototype._fnFocusin = function( nTd ) {
    jQuery( nTd ).addClass( SpreadSheet.CSS.Focus );
}

/*
* Function: _fnMoveLeft
* Purpose:  This function gets a cell as an input and moves the focus from it to
*           another cell to the left. While doing so it keeps track of out of 
*           bounds checks, pagination, readonly columns and row skips for the 
*           previously mentioned possible column skips.
* Input(s): node:nTd - the cell
* Returns:  void
*
*/
SpreadSheet.prototype._fnMoveLeft = function( nCell ) {
    var nRow = nCell.parent();
    var anRows = nRow.parent().children();
    var iX = nRow.find( 'td.' + SpreadSheet.CSS.Clickable ).index( nCell );
    var iY = anRows.index( nRow );
    
    var oSettings = this._oDataTable.fnSettings();
    var iStart = oSettings._iDisplayStart;
    var iPerPage = oSettings._iDisplayLength;
    
    var iMovedX = iX;
    var iMovedY = iY;
    
    // Calculate the next free cell
    do {
        iMovedX--;
        if ( iMovedX < 0 ) {
            iMovedX = this._aoColumns.length - 1;
            iMovedY--;
        }
    } while ( this._aoColumns[ iMovedX ].bProtected );
    
    var oColumn = this._aoColumns[ iX ];
    var oNewColumn = this._aoColumns[ iMovedX ];
    var nNewCell = nCell;
    
    // We stay on the same page after the move
    if ( iMovedY >= 0 ) {
        nNewCell = anRows.eq( iMovedY ).children().eq( iMovedX );
        
    // Top most cell
    } else if ( iMovedY < 0 && iStart == 0 ) {
        oColumn = this._aoColumns[ iX ];
        nNewCell = anRows.eq( iY ).children().eq( iX );
        
    // We have to flip the page first
    } else if ( iMovedY < 0 && iStart > 0 ) {
        this._oDataTable.fnPageChange( 'previous' );
        anRows = jQuery( '#' + this.fnGetId() + ' > tbody > tr' );
        nNewCell = anRows.eq( iPerPage - 1 ).children().eq( iMovedX );
    }
    oColumn.fnKeyout( nCell );
    this._fnFocusin( nNewCell );
    oNewColumn.fnKeyin( nNewCell );
}

/*
* Function: _fnMoveRight
* Purpose:  This function gets a cell as an input and moves the focus from it to
*           another cell to the right. While doing so it keeps track of out of 
*           bounds checks, pagination, readonly columns and row skips for the 
*           previously mentioned possible column skips. If the user tabs right 
*           on the very last cells the script will introduce a new line at the 
*           very end and will focus on it.
* Input(s): node:nTd - the cell
* Returns:  void
*
*/
SpreadSheet.prototype._fnMoveRight = function( nCell ) {
    var nRow = nCell.parent();
    var anRows = nRow.parent().children();
    var iX = nRow.find( 'td.' + SpreadSheet.CSS.Clickable ).index( nCell );
    var iY = anRows.index( nRow );
    
    var oSettings = this._oDataTable.fnSettings();
    var iItems = oSettings._iDisplayEnd - oSettings._iDisplayStart;
    var iPerPage = oSettings._iDisplayLength;
    var iTotalItems = oSettings.aoData.length;
    
    var iMovedX = iX;
    var iMovedY = iY;
    
    do {
        iMovedX++;
        if ( iMovedX >= this._aoColumns.length ) {
            iMovedX = 0;
            iMovedY++;
        }
    } while ( this._aoColumns[ iMovedX ].bProtected );
    
    var oColumn = this._aoColumns[ iX ];
    var oNewColumn = this._aoColumns[ iMovedX ];
    var nNewCell = nCell;
    
    // just go down if we can
    if ( iMovedY < iItems ) {
        nNewCell = anRows.eq( iMovedY ).children().eq( iMovedX );
    
    // very last cell, introduce new line on the same page
    } else if ( iMovedY >= iItems &&  iItems < iPerPage ) {
        this.fnInsertNewLine();
        this._oDataTable.fnPageChange( 'last' );
        anRows = jQuery( '#' + this.fnGetId() + ' > tbody > tr' );
        nNewCell = anRows.eq( iMovedY ).children().eq( iMovedX );
    
    // very last cell, introduce new line on the next page
    } else if ( iMovedY >= iItems && iTotalItems % iPerPage == 0 ) {
        this.fnInsertNewLine();
        this._oDataTable.fnPageChange( 'last' );
        anRows = jQuery( '#' + this.fnGetId() + ' > tbody > tr' );
        nNewCell = anRows.eq( 0 ).children().eq( iMovedX );
        
    // flip the page
    } else if ( iMovedY >= iItems && iTotalItems % iPerPage > 0 ) {
        this._oDataTable.fnPageChange( 'next' );
        anRows = jQuery( '#' + this.fnGetId() + ' > tbody > tr' );
        nNewCell = anRows.eq( 0 ).children().eq( iMovedX );
    }
    
    oColumn.fnKeyout( nCell );
    this._fnFocusin( nNewCell );
    oNewColumn.fnKeyin( nNewCell );
}

/*
* Function: _fnMoveUp
* Purpose:  Moves the focus cursor from the passed cell one up. While doing so 
*           it takes into account pagination and out-of-bounds checks for the 
*           top most cell
* Input(s): node:nCell - the cell to move up from
* Returns:  void
*
*/
SpreadSheet.prototype._fnMoveUp = function( nCell ) {
    var nRow = nCell.parent();
    var anRows = nRow.parent().children();
    var iX = nRow.find( 'td.' + SpreadSheet.CSS.Clickable ).index( nCell );
    var iY = anRows.index( nRow );
    
    var oSettings = this._oDataTable.fnSettings();
    var iStart = oSettings._iDisplayStart;
    var iPerPage = oSettings._iDisplayLength;
    
    var oColumn = this._aoColumns[ iX ];
    var nNewCell = nCell;
    
    // Same page just one row up; if available
    if ( iY > 0 ) {
        nNewCell = anRows.eq( iY - 1 ).children().eq( iX );
        
    // First page; refocus top most cell
    } else if ( iY == 0 && iStart == 0 ) {
        nNewCell = anRows.eq( 0 ).children().eq( iX );
    
    // Previous page; down most cell   
    } else if ( iY == 0 && iStart > 0 ) {
        this._oDataTable.fnPageChange( 'previous' );
        anRows = jQuery( '#' + this.fnGetId() + ' > tbody > tr' );
        nNewCell = anRows.eq( iPerPage - 1 ).children().eq( iX );
    }
    
    oColumn.fnKeyout( nCell );
    this._fnFocusin( nNewCell );
    oColumn.fnKeyin( nNewCell );
}

/*
* Function: _fnMoveDown
* Purpose:  Moves the focus cursor from the passed cell one down. While doing so 
*           it takes into account pagination and out-of-bounds checks for the 
*           very last cell. This call DOES NOT introduce a new line when 
*           reaching the end of the table but will rather refocus on it.
* Input(s): node:nCell - the cell to move up from
* Returns:  void
*
*/
SpreadSheet.prototype._fnMoveDown = function( nCell ) {
    var nRow = nCell.parent();
    var anRows = nRow.parent().children();
    var iX = nRow.find( 'td.' + SpreadSheet.CSS.Clickable ).index( nCell );
    var iY = anRows.index( nRow );
    
    var oSettings = this._oDataTable.fnSettings();
    var iItems = oSettings._iDisplayEnd - oSettings._iDisplayStart;
    var iTotalItems = oSettings.aoData.length;
    var iPerPage = oSettings._iDisplayLength;
    
    var oColumn = this._aoColumns[ iX ];
    var nNewCell = nCell;
    
    // Same page just one row down
    if ( iY >= 0 && iY < iItems - 1 ) {
        nNewCell = anRows.eq( iY + 1 ).children().eq( iX );
    // End of page or Would have to flip page; but no row available
    } else if ( iY >= 0 && iY == iItems - 1 && 
              ( iItems < iPerPage || iTotalItems % iPerPage == 0 ) ) {
        nNewCell = anRows.eq( iItems - 1 ).children().eq( iX );

    // Have to flip page; and another row is available
    } else if ( iY >= 0 && iY == iItems - 1 && iTotalItems % iPerPage > 0 ) {
        this._oDataTable.fnPageChange( 'next' );
        anRows = jQuery( '#' + this.fnGetId() + ' > tbody > tr' );
        nNewCell = anRows.eq( 0 ).children().eq( iX );
    }
    
    oColumn.fnKeyout( nCell );
    this._fnFocusin( nNewCell );
    oColumn.fnKeyin( nNewCell );
}

/*
* Function: _fnCreateDataTable
* Purpose:  Initializes the DataTables jQuery plugin and its extra plugin ColVis
* Input(s): node:nTable - the table node in which the DataTable will be embedded
* Returns:  object:oDataTable - the created DataTable object
*
*/

SpreadSheet.prototype._fnCreateDataTable = function( nTable, aoColumns ) {    
    // Create the DataTables instance
    var oDataTable = nTable.dataTable( {
        'bAutoWidth'        : false,
        'bJQueryUI'         : true,
        
        'sDom'              : '<"H"lfr>Ct<"F"ip>',
        'sPaginationType'   : 'full_numbers',
        
        'aoColumns'         : aoColumns,
        'aaSorting'         : this._fnGetInitialSorting( aoColumns ),
        
        // ColVis extra
        'oColVis'           : {
            'activate'      : 'mouseover',
            'buttonText'    : '&nbsp;',
            
            'bRestore'      : true,
            
            'sAlign'        : 'left'
        },
        
        'fnDrawCallback'    : this._fnMakeDrawCallback()
    });
    
    return oDataTable;
}

/*
* Function: _fnGetInitialSorting
* Purpose:  Sets the initial sorting of a DataTables instance onto the first 
*           incremental column or to the very first column, if an incremental 
*           column is not present
* Input(s): object:aoColumns - the columns on which to determine the sorting
* Returns:  array array:asSorting - array representing a DataTable sorting
*
*/
SpreadSheet.prototype._fnGetInitialSorting = function( aoColumns ) {
    for ( var i = 0, iLen = aoColumns.length; i < iLen; i++ ) {
        // TODO: enable again
        //if ( aoColumns[i] instanceof SpreadSheetIncrementColumn ) {
        //    return [[ i, 'asc' ]];
        //}
    }
    return [[ 0, 'asc' ]];
}

/*
* Function: _fnMakeDrawCallback
* Purpose:  Returns a callback function for the DataTables fnDrawCallback 
*           option. It is responsible for the positioning of the ColVis button,
*           that can show or hide columns. The position will always be the left 
*           upper corner of the table head.
* Input(s): void
* Returns:  function:fnDrawCallback - the draw callback
*
*/
SpreadSheet.prototype._fnMakeDrawCallback = function() {
    var self = this;

    return function( event ) {
        var nColVisButton = jQuery( 'div.ColVis', event.nTableWrapper );
        var nTableHead = jQuery( 'thead', self._nTable );
        
        nColVisButton.css( 'height', nTableHead.height() );
        nColVisButton.css( 'left', nTableHead.position().left + 'px' );
        if ( !jQuery.browser.mozilla ) {
            nColVisButton.css( 'top', nTableHead.position().top + 'px' );
        } else {
            // Firefox has a different idea of what the top position of this 
            // button is, so we have to move it one pixel up
            nColVisButton.css( 'top', nTableHead.position().top - 1 + 'px' );
        }
    }
}

/*
* Function: fnInsertNewLine
* Purpose:  Inserts a new line at the end of the table containing default cells 
*           for each column.
* Input(s): boolean:bRedraw - a flag indicating whether to redraw the table 
                              after inserting the line. Default: true. NOTE:
                              when redraw is true pagination and sorting will be
                              reset immediately.
* Returns:  array string:asCell - an array containing the inserted cells
*
*/
SpreadSheet.prototype.fnInsertNewLine = function( bRedraw ) {
    if ( typeof bRedraw === 'undefined' ) bRedraw = true;
    var asCells = [];
        
    for ( var i = 0, iLen = this._aoColumns.length; i < iLen; i++ ) {
        asCells.push( this._aoColumns[i].fnCreate() );
    }
    this._oDataTable.fnAddData( asCells, bRedraw );
    
    return asCells;
}

/*
* Function: fnGetId
* Purpose:  Returns the HTML id of the passed node or the id of the table that 
*           contains the SpreadSheet if argument is undefined
* Input(s): node:nNode - the node to get the id of
* Returns:  stringLsId - the id
*
*/
SpreadSheet.prototype.fnGetId = function( nNode ) {
    if ( typeof nNode === 'undefined' ) nNode = this._nTable;

    return jQuery( nNode ).attr( 'id' );
}

/*
* Function: fnUpdate
* Purpose:  Updates a given cell with the newly passed content. It will be 
*           directly reflected on the underlying DataTable instance, by default
*           without a table redraw to keep the focus and clicks on the table.
* Input(s): node:nCell - the cell to be updated
*           string:sNew - new content as string
*           boolean:bRedraw - parameter telling whether to redraw the table
* Returns:  void
*
*/
SpreadSheet.prototype.fnUpdate = function( nCell, sNew, bRedraw ) {
    if ( typeof bRedraw === 'undefined' ) bRedraw = false;
    nCell = jQuery( nCell )[ 0 ];
    
    var aiPosition = this._oDataTable.fnGetPosition( nCell );
    var iRow = aiPosition[ 0 ];
    var iColumn = aiPosition[ 2 ] ;
    
    try {
        this._oDataTable.fnUpdate( sNew, iRow, iColumn, bRedraw );
    } catch ( error ) {
        this._oDataTable.fnDraw( false );
    }
}
