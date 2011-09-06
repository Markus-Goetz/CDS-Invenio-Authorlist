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
    this.sSortDataType = SpreadSheet.CSS.SpreadSheet;
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
    jQuery.fn.dataTableExt.oSort[ this.sType + '-asc' ] = this._fnMakeAscendingSorting();
    jQuery.fn.dataTableExt.oSort[ this.sType + '-desc' ] = this._fnMakeDescendingSorting();
    jQuery.fn.dataTableExt.ofnSearch[ this.sType ] = this._fnMakeFilter();
    this._fnRegisterClickCallback();
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

    // Not extendable? then return one cell only
    if ( !this.bExtendable ) {
        var nContent = jQuery( '<div>' );
        nContent.addClass( SpreadSheet.CSS.Content );
        
        var nCell = this._fnCreateCell( oValue );
        nContent.append( nCell );
        
        return this._fnOuterHtml( nContent );
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
    
    return this._fnOuterHtml( nTable );
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

SpreadSheet.Column.prototype._fnRegisterClickCallback = function() {
    var self = this;
    var sTable = '#' + this.oSpreadSheet.fnGetId();
    var sTd = [ 'td', this.sType, SpreadSheet.CSS.Clickable ].join( '.' );
    var sInput = [ 'input', this.sType, SpreadSheet.CSS.Text ].join( '.' );
    
    jQuery( sTable ).delegate( sInput, 'click', function( event ) {
        var nInput = jQuery( this );
        var nCell = nInput.parents( sTd );
        
        nInput.attr( 'readonly', false );
        nInput.removeClass( SpreadSheet.CSS.Readonly );
        nInput.select();
    } );
    
    jQuery( sTable ).delegate( sInput, 'blur', function( event ) {
        var nInput = jQuery( this );
        var nCell = nInput.parents( sTd );
        
        nInput.attr( 'readonly', 'readonly' );
        nInput.addClass( SpreadSheet.CSS.Readonly );
        // TODO: SpreadSheet update
    } );
    
    var sAdd = [ 'span', this.sType, SpreadSheet.CSS.Plus ].join( '.' );
    var sMinus = [ 'span', this.sType, SpreadSheet.CSS.Minus ].join( '.' );
    
    
    jQuery( sTable ).delegate( sAdd, 'click', function( event ) {
        var nCell = jQuery( this ).parents( sTd );
        
        self._fnInsertNewLine( nCell );
    } );
    
    jQuery( sTable ).delegate( sMinus, 'click', function( event ) {
        var nCell = jQuery( this ).parents( sTd );
        
        self._fnDeleteLine( nCell );
    } );
}

SpreadSheet.Column.prototype._fnInsertNewLine = function( nCell ) {
    var aoValues = this.fnValue( nCell );
    
    // Insert a new default value
    aoValues.push( this.sValue );
    jQuery( nCell ).html( this.fnCreate( aoValues ) );
}

SpreadSheet.Column.prototype._fnDeleteLine = function( nCell ) {
    var aoValues = this.fnValue( nCell );
    
    // Can we remove an element - i.e. at least two in there?
    if ( aoValues.length > 1 ) {
        aoValues = aoValues.slice( 0, aoValues.length - 1 )
    }
    jQuery( nCell ).html( this.fnCreate( aoValues ) );
}

/*
* Function: SpreadSheetEditColumn
* Purpose:  Constructor
* Input(s): object:oInit - Initialization settings for a column
* Returns:  SpreadSheetEditColumn instance when called with new, else undefined
*
*/
SpreadSheet.EditColumn = function( oInit ) {
    SpreadSheet.Column.call( this, oInit );
    
    this.sTitle = typeof oInit.title === 'string' ? oInit.title : 'Edit';
    this.sWidth = oInit.width || '50px';
    
    // booleans
    this.bExtendable = false;
    this.bProtected = true;
    this.bSearchable = false;
    this.bSortable = false;
}
// Inherit from SpreadSheet.Column
SpreadSheet.EditColumn.prototype = new SpreadSheet.Column();
SpreadSheet.EditColumn.prototype.constructor = SpreadSheet.EditColumn;

/*
* Function: _fnCreateCell
* Purpose:  Returns the actual cell content of an edit cell - i.e. the three 
*           buttons for up, down and delete.
* Input(s): void
* Returns:  node:nCell - the edit cell as node
*
*/
SpreadSheet.EditColumn.prototype._fnCreateCell = function() {
    var nCell = jQuery( '<div>' );
    var asClasses = [ SpreadSheet.CSS.SpreadSheet, SpreadSheet.CSS.Edit ];
    nCell.attr( {
        'class'     : asClasses.join( ' ' ),
    } );
    
    var nUp = jQuery( '<span>' );
    nUp.addClass( [ SpreadSheet.CSS.SpreadSheet, 
                    SpreadSheet.CSS.Icon, 
                    SpreadSheet.CSS.Up ].join( ' ' ) );
                    
    var nDown = jQuery( '<span>' );
    nDown.addClass( [ SpreadSheet.CSS.SpreadSheet, 
                      SpreadSheet.CSS.Icon, 
                      SpreadSheet.CSS.Down ].join( ' ' ) );
                      
    var nDelete = jQuery( '<span>' );
    nDelete.addClass( [ SpreadSheet.CSS.SpreadSheet, 
                        SpreadSheet.CSS.Icon, 
                        SpreadSheet.CSS.Delete ].join( ' ' ) );
    
    nCell.append( nUp, nDown, nDelete );
    
    return nCell;
}

/*
* Function: fnValue
* Purpose:  Returns the value of the edit cell - null as it is not editable
* Input(s): object:oData - the cell as string, DOM element or jQuery set 
* Returns:  string:sValue - the value of this row
*
*/
SpreadSheet.EditColumn.prototype.fnValue = function( oData ) {
    return null;
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
    
    // booleans
    this.bExtendable = false;
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
SpreadSheet.CheckboxColumn.prototype._fnCreateCell = function() {
    var nCell = jQuery( '<span>' );
    var asClasses = [ SpreadSheet.CSS.SpreadSheet, 
                      SpreadSheet.CSS.Checkbox, 
                      SpreadSheet.CSS.Icon ];
                      
    if ( this.sValue ) {
        asClasses.push( SpreadSheet.CSS.Checked );
    } else {
        asClasses.push( SpreadSheet.CSS.Unchecked );
    }
    nCell.attr( {
        'class'     : asClasses.join( ' ' ),
    } );
    
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
    var checkbox = jQuery( 'span.' + SpreadSheet.CSS.Checkbox, jQuery(oData) );
    return checkbox.hasClass( SpreadSheet.CSS.Checked );
}

/*
* Variable: SpreadSheet.ColumnTypes
* Purpose:  Lookup table to determine the handling prototype for a certain 
*           column type.
*
*/
SpreadSheet.ColumnTypes = {
    'text'                  : SpreadSheet.Column,
    'edit'                  : SpreadSheet.EditColumn,
    'checkbox'              : SpreadSheet.CheckboxColumn,
    
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
    
    for ( var i = 0, iLen = this._aoColumns.length; i < iLen; i++ ) {
        this._aoColumns[i].sValue = 'bar';
    }
    this.fnInsertNewLine();
        this.fnInsertNewLine();
            this.fnInsertNewLine();
                this.fnInsertNewLine();
                    this.fnInsertNewLine();
                        this.fnInsertNewLine();
                            this.fnInsertNewLine();
                this.fnInsertNewLine();
                    this.fnInsertNewLine();
                        this.fnInsertNewLine();
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

    jQuery( sId ).delegate( sTd, 'focusin', function( event ) {
        self._fnFocusin( event.currentTarget );
    } );
    
    jQuery( sId ).delegate( sTd, 'focusout', function( event ) {
        self._fnFocusout( event.currentTarget );
    } );
}

SpreadSheet.prototype._fnRegisterKeyboard = function( nTable ) {
    var self = this;

    jQuery( document ).keydown( function( event ) {
        // find focused cells and look up whether they belong to our table
        var nFocus = jQuery( 'td.' + SpreadSheet.CSS.Focus );
        var nTable = nFocus.parents( '#' + self.fnGetId() );
        if ( nTable.length < 0 ) return;
        
        // remove focus on all cells
        nFocus.each( function( iIndex, nCell ) {
            self._fnFocusout( nCell );
        } );
        
        // Shift + Tab
        if ( event.shiftKey && event.which == jQuery.ui.keyCode.TAB ) {
            event.preventDefault();
            
        // Tab
        } else if ( event.which == jQuery.ui.keyCode.TAB ) {
            event.preventDefault();
            
        // Up arrow
        } else if ( event.which == jQuery.ui.keyCode.UP ) {
            self._fnMoveUp( nFocus );
            event.preventDefault();
            
        // Down arrow
        } else if ( event.which == jQuery.ui.keyCode.DOWN ) {
            self._fnMoveDown( nFocus );
            event.preventDefault();
        }
    } );
}

SpreadSheet.prototype._fnFocusin = function( nTd ) {
    jQuery( nTd ).addClass( SpreadSheet.CSS.Focus );
}

SpreadSheet.prototype._fnFocusout = function( nTd ) {    
    jQuery( nTd ).removeClass( SpreadSheet.CSS.Focus );
}

SpreadSheet.prototype._fnMoveUp = function( nCell ) {
    var nRow = nCell.parent();
    var anRows = nRow.parent().children();
    var iX = nRow.find( 'td.' + SpreadSheet.CSS.Clickable ).index( nCell );
    var iY = anRows.index( nRow );
    
    var oSettings = this._oDataTable.fnSettings();
    var iStart = oSettings._iDisplayStart;
    var iPerPage = oSettings._iDisplayLength;
    
    // Same page just one row up; if available
    if ( iY > 0 ) {
        this._fnFocusin( anRows.eq( iY - 1 ).children().eq( iX ) );
        
    // First page; refocus top most cell
    } else if ( iY == 0 && iStart == 0 ) {
        this._fnFocusin( anRows.eq( 0 ).children().eq( iX ) );
    
    // Previous page; down most cell   
    } else if ( iY == 0 && iStart > 0 ) {
        this._oDataTable.fnPageChange( 'previous' );
        anRows = jQuery( '#' + this.fnGetId() + ' > tbody > tr' );
        this._fnFocusin( anRows.eq( iPerPage - 1 ).children().eq( iX ) );
    }
}

SpreadSheet.prototype._fnMoveDown = function( nCell ) {
    var nRow = nCell.parent();
    var anRows = nRow.parent().children();
    var iX = nRow.find( 'td.' + SpreadSheet.CSS.Clickable ).index( nCell );
    var iY = anRows.index( nRow );
    
    var oSettings = this._oDataTable.fnSettings();
    var iItems = oSettings._iDisplayEnd - oSettings._iDisplayStart;
    var iTotalItems = oSettings.aoData.length;
    var iPerPage = oSettings._iDisplayLength;
    
    // Same page just one row down
    if ( iY >= 0 && iY < iItems - 1 ) {
        this._fnFocusin( anRows.eq( iY + 1 ).children().eq( iX ) );
        
    // End of page or Would have to flip page; but no row available
    } else if ( iY >= 0 && iY == iItems - 1 && 
              ( iItems < iPerPage || iTotalItems % iPerPage == 0 ) ) {
        this._fnFocusin( anRows.eq( iItems - 1 ).children().eq( iX ) );

    // Have to flip page; and another row is available
    } else if ( iY >= 0 && iY == iItems - 1 && iTotalItems % iPerPage > 0 ) {
        this._oDataTable.fnPageChange( 'next' );
        anRows = jQuery( '#' + this.fnGetId() + ' > tbody > tr' );
        this._fnFocusin( anRows.eq( 0 ).children().eq( iX ) );
    }
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
* Input(s): void
* Returns:  asCell - an array containing the inserted cells as string
*
*/
SpreadSheet.prototype.fnInsertNewLine = function() {
    var asCells = [];
        
    for ( var i = 0, iLen = this._aoColumns.length; i < iLen; i++ ) {
        asCells.push( this._aoColumns[i].fnCreate() );
    }
    this._oDataTable.fnAddData( asCells );
    
    return asCells;
}

/*
* Function: fnGetId
* Purpose:  Returns the HTML id of the passed node or the id of the table that 
*           contains the SpreadSheet if argument is undefined
* Input(s): nNode - the node to get the id of
* Returns:  sId - the id
*
*/
SpreadSheet.prototype.fnGetId = function( nNode ) {
    if ( typeof nNode === 'undefined' ) nNode = this._nTable;

    return jQuery( nNode ).attr( 'id' );
}
