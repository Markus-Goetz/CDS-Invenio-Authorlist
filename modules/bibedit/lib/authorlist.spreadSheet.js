/*
* File:        SpreadSheet.js
* Version:     1.0
* Description: SpreadSheet features for DataTables
* Author:      Markus Goetz
* Created:     Fri Jul 22 17:25:02 CEST 2011
* Modified:    $Date$ by $Author$
* Language:    Javascript
* License:     GPL v2 or BSD 3 point style
* Project:     SpreadSheet
* 
* Copyright 2011 Markus Goetz, all rights reserved.
*
*/

/*
* Type constants
*/
SpreadSheet._oTypes = {
	'edit' :			'edit',
	'increment' :		'increment',
	'text' : 			'text',
	'select' : 			'select',
	'checkbox' : 		'checkbox'
}

/*
* Default initialization parameters
*/
SpreadSheet._oDefaults = {
	'Focus' : 		null
}

/*
*  Default column
*/
SpreadSheet._oDefaultColumn = {
	'name' :		'&nbsp',
	'visible' :		true,
	'readonly' :	false,
	'type' :		SpreadSheet._oTypes.text,
	'value' :		'-',
	'options' :		null
}

/*
* CSS classes for the various objects, right-hand value can be changed to customize the classes
*/
SpreadSheet._oCss = {
	'DataTable' : 		'DataTable',
	'KeyTable' :		'KeyTable',
	'SpreadSheet' :		'SpreadSheet',
	'ReadOnly' :		'ReadOnly',
	
	'Edit' :			'Edit',
	'Increment' :		'Increment',
	
	'jQueryIcon' :		'ui-icon',
	'jQueryDelete' :	'ui-icon-close',
	'jQueryUp' :		'ui-icon-carat-1-n',
	'jQueryDown' :		'ui-icon-carat-1-s',
}

/*
* Function:	SpreadSheet
* Purpose:	Constructor
* Input(s):	string:sDivId - Id of the html element where the SpreadSheet will be embedded in (preferably a div)
*			object:oInit - Object containing initialization settings
* Returns:	void
*
*/
function SpreadSheet( sDivId, oInit ) {
	// Sanitized initial parameter
	this._nDiv = this._fnSanitizeDiv( sDivId );
	this._oInit = this._fnSanitizeOptions( oInit );
	this._oInit.Columns = this._fnSanitizeColumns( this._oInit.Columns );
	this._asColumnNames = this._fnGetColumnNames( this._oInit );
	this._aiReadonlyColumns = this._fnGetReadonlyColumns( this._oInit );
	
	// Counters for easier access in methods
	this._iLine = -1;
	
	// Key and click managament for readonly columns
	this._bWasRightButton = false;
	this._bWasLeftButton = false;

	// DOM nodes for fast access
	this._nTable = this._fnCreateTable( this._nDiv );
	this._nTableHead = this._fnCreateTableHead( this._nTable, this._asColumnNames );
	this._nTableBody = this._fnCreateTableBody( this._nTable, this._asColumnNames );
	
	// DataTables management
	this._fnRegisterDataTableType();
	this._fnRegisterDataTableSorting();
	this._fnRegisterDataTableFiltering();
	this._oDataTable = this._fnCreateDataTable( this._nTable, this._oInit );
	this.fnInsertNewLine();
	this._fnRegisterEvents( this._oDataTable );
	
	// KeyTable managemenet
	this._oInit.Focus = this._fnSanitizeFocus( this._oInit.Focus );
	if ( this._oInit.Focus !== null ) {
		this._iOldX = this._fnVisibleToHiddenIndex( this._oInit.Focus[0] );
		this._iOldY = this._oInit.Focus[1];
	}
	this._oKeyTable = this._fnCreateKeyTable( this._nTable, this._oDataTable, this._oInit );
}

/*
* Function:	_fnSanitizeDiv
* Purpose:	Turns a div id into a respective node
* Input(s):	string:sDivId - Id of the html element where the SpreadSheet will be embedded in (preferably a div)
* Returns:	node:Div - The node 
*
*/
SpreadSheet.prototype._fnSanitizeDiv = function( sDivId ) {
	// Check type of id string
	if ( typeof sDivId !== 'string' ) {
		throw 'First argument passed to the constructor has to be a string indicating element id to append to';
	}
	
	// Get div and return it
	var nDiv = jQuery( '#' + sDivId );
	if ( nDiv.length === 0 ) {
		throw 'Element with given id ' + sDivId + ' not present. Could not create table';
	}
	return nDiv;
}

/*
* Function:	_fnSanitizeOptions
* Purpose:	Sets missing values to defaults
* Input(s):	object:oInit - Object containing initialization settings
* Returns:	object:oSanitizedInit - extended initializer object
*
*/
SpreadSheet.prototype._fnSanitizeOptions = function( oInit ) {
	// Check for correct type of initializer object
	if ( typeof oInit !== 'object' || jQuery.isArray( oInit ) ) {
		throw 'Type of initializing object has to be of type object';
	}
	
	return jQuery.extend( {}, SpreadSheet._oDefaults, oInit );
}

/*
* Function:	_fnSanitizeColumns
* Purpose:	Ensures correct types and values of the columns' initilization parameters
* Input(s):	object:oInit - Object containing initialization settings
* Returns:	object:oSanitizedInit - Sanitized and default extended initializer object
*
*/
SpreadSheet.prototype._fnSanitizeColumns = function( aoColumns ) {
	var sanitized = [];
	
	// Check if type of column definitions is array
	if ( !jQuery.isArray( aoColumns ) ) {
		throw 'Columns option has to be of type array';
	}
	
	// Fill up each given column with defaults and push it into the sanitized version
	for ( var i = 0, iLen = aoColumns.length; i < iLen; i++ ) {
		var column = jQuery.extend( {}, SpreadSheet._oDefaultColumn, aoColumns[i] );
		
		// Type checks of individual values
		if ( typeof column.name !== 'string' ) {
			console.log( 'WARNING: Column name has to be given as a string, skipping index ' + i );
			continue;
		}
		if ( typeof column.visible !== 'boolean' ) {
			console.log( 'WARNING: Column visibility has to be given as a boolean, skipping column ' + column.name );
			continue;
		}
		if ( typeof column.readonly !== 'boolean' ) {
			console.log( 'WARNING: Column read-only value has to be given as a boolean, skipping column ' + column.name );
			continue;
		}
		if ( typeof column.type !== 'string' ) {
			console.log( 'WARNING: Column type has to be given as a string, skipping column ' + column.name );
			continue;
		}
		
		// Type checks for value and options property depending on given type
		switch ( column.type ) {
			case SpreadSheet._oTypes.edit:
				break;
		
			case SpreadSheet._oTypes.increment:
				if ( !this._fnIsInteger( column.value ) && !this._fnIsInteger( column.options ) ) {
					console.log( 'WARNING: Column value and options have to be present and need to be \
								  given as type integer for incremental type, skipping ' + column.name );
					continue;
				}
				break;
				
			case SpreadSheet._oTypes.text:
				if ( typeof column.value !== 'string' ) {
					console.log( 'WARNING: Column value has to be of type string for text (default) type, skipping ' + column.name );
					continue;
				}
				break;
				
			case SpreadSheet._oTypes.select:
				if ( typeof column.value !== 'string' && !jQuery.isArray( column.options ) ) {
					console.log( 'WARNING: Column value has to be of type string and \
								  options of type array for select type, skipping ' + column.name );
					continue;
				}
				
				// Make sure default value is in array of all options
				if ( jQuery.inArray( column.value, column.options ) < 0 ) {
					column.options.unshift( column.value );
				}
				break;
				
			case SpreadSheet._oTypes.checkbox:
				if ( typeof column.value !== 'boolean' ) {
					console.log( 'WARNING: Column value has to be of type boolean for checkbox type, skipping ' + column.name );
					continue;
				}
				break;
				
			default:
				console.log( 'WARNING: Unsupported type ' + column.type + ', skipping ' + column.name );
				continue;
		}
		
		// If we reach should reach this point, the column is quite okay, keep it! :)
		sanitized.push( column );
	}
	
	return sanitized;
}

/*
* Function:	_fnGetColumnNames
* Purpose:	Filters the column names out of an initializer-like object
* Input(s):	object:oInit - Initializer-like objects
* Returns:	string array:asColumnNames - The column names
*
*/
SpreadSheet.prototype._fnGetColumnNames = function( oInit ) {
	var columnNames = [];

	for ( var i = 0, iLen = oInit.Columns.length; i < iLen; i++ ) {	
		columnNames.push( oInit.Columns[i].name );
	}
	return columnNames;
}

/*
* Function:	_fnGetReadonlyColumns
* Purpose:	Filters the column that are readonly out of an initializer-like object
* Input(s):	object:oInit - Initializer-like objects
* Returns:	interger array:asColumnNames - the readonly column indices
*
*/
SpreadSheet.prototype._fnGetReadonlyColumns = function( oInit ) {
	var readonlyColumns = [];
	
	for ( var i = 0, iLen = oInit.Columns.length; i < iLen; i++) {
		if ( oInit.Columns[i].readonly ) {
			readonlyColumns.push( i );
		}
	}
	
	return readonlyColumns;
}

/*
* Function:	_fnIsInteger
* Purpose:	JavaScript is lacking a function to check a value for being an integer.
			So we are doing this by ensuring that the input is of type number and 
			its rounded value equals to itself.
* Input(s):	object:iValue - object to be checked
* Returns:	bool:isInteger - truth value if given object is an integer
*
*/
SpreadSheet.prototype._fnIsInteger = function( oValue ) {
	return typeof oValue === 'number' && oValue === Math.round( oValue );
}

/*
* Function:	_fnCreateTable
* Purpose:	Creates the html elements of the table and adds them to the node specified in the passed parameter
* Input(s):	node:nDiv - the wrapper node to which the table will be appended to 
* Returns:	node:table - the created table
*
*/
SpreadSheet.prototype._fnCreateTable = function( nDiv ) {
	// Create table, append it to the div and return the node
	var css = [ SpreadSheet._oCss.DataTable, SpreadSheet._oCss.KeyTable, SpreadSheet._oCss.SpreadSheet ].join( ' ' );
	var nTable = jQuery( '<table class="' + css + '" id="' + this._fnGenerateId() + '">' );
	
	nDiv.append( nTable );
	
	return nTable;
}

/*
* Function:	_fnGenerateId
* Purpose:	Generates a unique ID for the table tag. JavaScript is lacking a native function 
* 			for that so we just use millis since epoch instead. This approach may theoretically(!) 
*			lead to collision but not in practice as we only create a few SpreadSheets on one 
*			page with sufficient timelag
* Input(s):	void
* Returns:	integer:id - the generated id
*
*/
SpreadSheet.prototype._fnGenerateId = function() {
	return jQuery.now();
}

/*
* Function:	_fnCreateTableHead
* Purpose:	Creates the html elements for the table head and adds them to the passed table node
* Input(s):	node:nTable - the table node for which the header is going to be created
			string array:asColumnNames - the array containing the titles for the columns
* Returns:	node:tableHead - the created tableHead
*
*/
SpreadSheet.prototype._fnCreateTableHead = function( nTable, asColumnNames ) {
	// Create a table header in the given table with the given columns names
	var nTableHead = jQuery( '<thead>' );
	var nTableHeadRow = jQuery( '<tr>' );
	
	for ( var i = 0, iLen = asColumnNames.length; i < iLen; i++ ) {
		nTableHeadRow.append( '<th>' + asColumnNames[i] + '</th>' );
	}
	nTableHead.append( nTableHeadRow );
	nTable.append( nTableHead );
	
	return nTableHead;
}

/*
* Function:	_fnCreateTableBody
* Purpose:	Creates a table body for the given table node
* Input(s):	node:nTable - the table node for which the header is going to be created
* Returns:	node:tableBody - the embedded body node
*
*/
SpreadSheet.prototype._fnCreateTableBody = function( nTable ) {
	var nTableBody = jQuery( '<tbody>' );
	
	nTable.append( nTableBody );
	return nTableBody;
}

/*
* Function:	_fnRegisterDataTableType
* Purpose:	Registers the sType definition (see DataTable documentation online) for SpreadSheet with DataTable
			as most prior one.
* Input(s):	void
* Returns:	void
*
*/
SpreadSheet.prototype._fnRegisterDataTableType = function() {
	jQuery.fn.dataTableExt.aTypes.unshift( this._fnDataTableTypeDefinition );
}

/*
* Function:	_fnDataTableTypeDefinition
* Purpose:	Defines the sType (see DataTable online documentation) of SpreadSheet. Every cell that contains html
			that has the SpreadSheet CSS class is considered to be of our sType, everything else not.
* Input(s):	string:sData - raw string of the cell
* Returns:	string:sType - the according sType
*
*/
SpreadSheet.prototype._fnDataTableTypeDefinition = function( sData ) {
	if ( jQuery( sData ).hasClass( SpreadSheet._oCss.SpreadSheet ) ) {
		return SpreadSheet._oCss.SpreadSheet;
	}
	
	return null;
}

/*
* Function:	_fnRegistersDataTableSorting
* Purpose:	Registers the DataTable sorting functions (table header click) for ascending and descending ordering.
* Input(s):	void
* Returns:	void
*
*/
SpreadSheet.prototype._fnRegisterDataTableSorting = function() {
	jQuery.fn.dataTableExt.oSort[SpreadSheet._oCss.SpreadSheet + '-asc'] = this._fnMakeDataTableSortAscendingCallback();
	jQuery.fn.dataTableExt.oSort[SpreadSheet._oCss.SpreadSheet + '-desc'] = this._fnMakeDataTableSortDescendingCallback();
}

/*
* Function:	_fnMakeDataTableSortAscendingCallback
* Purpose:	Creates a callback that is registered with DataTables in order to allow dynamical ascending
            ordering of the content. Forwards the two parameters unchanged to the canonical compare
            function.
* Input(s):	string:a - the raw string content of the cell on the left-hand side of the comparison
			string:b - the raw string content of the cell on the right-hand side of the comparison
* Returns:	function:callback - the comparison callback for ascending ordering
*
*/
SpreadSheet.prototype._fnMakeDataTableSortAscendingCallback = function() {
    var self = this;

    return function( a, b ) {
        return self._fnDataTableSortCompare( a, b );
    }
}

/*
* Function:	_fnMakeDataTableSortDescendingCallback
* Purpose:	Creates a callback that is registered with DataTables in order to allow dynamical ascending
            ordering of the content. Forwards the two parameters to the canonical compare
            function and inverts the order by multiplying with -1 to reverse the sort output.
* Input(s):	string:a - the raw string content of the cell on the left-hand side of the comparison
			string:b - the raw string content of the cell on the right-hand side of the comparison
* Returns:	function:callback - the comparison callback for descending ordering
*
*/
SpreadSheet.prototype._fnMakeDataTableSortDescendingCallback = function() {
    var self = this;
    
    return function( a, b ) {
        return self._fnDataTableSortCompare( a, b ) * -1;
    }
}

/*
* Function:	_fnDataTableSortCompare
* Purpose:	Defines the sorting function for ascending ordering of the table. Distinguishes between the supported
			input types of the SpreadSheet and selects and compares their values accordingly. Everything unknown is
			considered to be equal to every other value.
* Input(s):	string:a - the raw string content of the cell on the left-hand side of the comparison
			string:b - the raw string content of the cell on the right-hand side of the comparison
* Returns:	integer:comparison - a standard javascript return value for sort functions (less than: negative, equal: zero, greater than: positive)
*
*/
SpreadSheet.prototype._fnDataTableSortCompare = function( a, b ) {
    var nA = jQuery( a );
	var nB = jQuery( b );
	
	if ( nA.hasClass( SpreadSheet._oCss.Increment ) ) {
	    var left = parseInt( nA.val() );
	    var right = parseInt( nB.val() );
	
	} else if ( nA.is( 'input:text' ) ) {
		var left = nA.val();
		var right = nB.val();
		
	} else if ( nA.is( 'input:checkbox' ) ) {
		var left = typeof nA.attr( 'checked' ) !== 'undefined' ? 'on' : 'off';
		var right = typeof nB.attr( 'checked' ) !== 'undefined' ? 'on' : 'off';
		
	} else if ( nX.is( 'select' ) ) {
		var left = nA.children( 'option:selected' ).val();
		var right = nB.children( 'option:selected' ).val();
		
	} else {
		return 0;
	}	
	return ( left < right ) ? -1 : ( ( left > right ) ? 1 : 0 );
}

/*
* Function:	_fnRegisterDataTableFiltering
* Purpose:	Registers the DataTable filtering function for the SpreadSheet sType (see DataTable online documentation)
* Input(s):	void
* Returns:	void
*
*/
SpreadSheet.prototype._fnRegisterDataTableFiltering = function() {
	jQuery.fn.dataTableExt.ofnSearch[SpreadSheet._oCss.SpreadSheet] = this._fnDataTableFiltering;
}

/*
* Function:	_fnDataTableFiltering
* Purpose:	Defines how to extract a canonical (normalized) content of a cell from its wrapping HTML input tags.
			This is done only for every currently supported type of SpreadSheet. Everything is considered to be
			not normalizable - i.e. empty string.
* Input(s):	string:sData - raw string content of a cell
* Returns:	string:canonicalValue - the canonical (normalized) content of the cell - i.e. stripped from wrapping HTML code.
*
*/
SpreadSheet.prototype._fnDataTableFiltering = function( sData ) {
	var nData = jQuery( sData );
	
	if ( nData.is( 'input:text' ) ) {
		return nData.val();
		
	} else if ( nData.is( 'input:checkbox' ) ) {
		return typeof nData.attr( 'checked' ) !== 'undefined' ? 'on' : 'off';
		
	} else if ( nData.is( 'select' ) ) {
		return nData.children( 'option:selected' ).val();
	}
	return '';
}

/*
* Function:	_fnCreateDataTable
* Purpose:	Initializes the DataTables jQuery plugin and its extra ColVis
* Input(s):	node:nTable - the table node to transform into a DataTable
			object:oInit - the initializer object for the SpreadSheet; used to extract hidden columns
* Returns:	object:dataTable - he created DataTable object
*
*/
SpreadSheet.prototype._fnCreateDataTable = function( nTable, oInit ) {
	// Find all Initial hidden columns
	var hiddenColumns = [];	
	for ( var i = 0, iLen = oInit.Columns.length; i < iLen; i++ ) {
		if ( !oInit.Columns[i].visible ) {
			hiddenColumns.push( i );
		}
	}
	
	var dataTable = nTable.dataTable( {
		'sDom' : '<"H"lfr>Ct<"F"ip>',
		'bJQueryUI' : true,
		'sPaginationType' : 'full_numbers',
		'bAutoWidth' : false,
		'aoColumnDefs' : [
			{ 'bVisible' : false, 
			  'aTargets' : hiddenColumns
			}
		],
		
		'aoColumns' : this._fnGetFixedWidthColumns( oInit ),
		'aaSorting' : this._fnGetInitialSorting( oInit ),
		
		// ColVis plug-in initialization parameters
		'oColVis' : {
			'activate' : 'mouseover',
			'buttonText' : '&nbsp;',
			'bRestore' : true,
			'sAlign' : 'left'
		},
		'fnDrawCallback' : this._fnMakeDrawCallback()
	});
	return dataTable;
}

/*
* Function:	_fnGetFixedWidthColumns
* Purpose:	Sets Edit and Increment columns to the fixed size of 50px
* Input(s):	object:oInit - the initializer object for the SpreadSheet; used to determine the widths
* Returns:	object array:column width - array containing objects representing a DataTable width value
*
*/
SpreadSheet.prototype._fnGetFixedWidthColumns = function( oInit ) {
	var columnWidths = [];
	
	for ( var i = 0, iLen = oInit.Columns.length; i < iLen; i++ ) {
		var column = oInit.Columns[i];
		
		if ( column.type === SpreadSheet._oTypes.edit || column.type === SpreadSheet._oTypes.increment ) {
			columnWidths.push( { 'sWidth' : '50px' } );
		} else {
			columnWidths.push( null );
		}
	}
	return columnWidths;
}

/*
* Function:	_fnGetInitialSorting
* Purpose:	Sets the first Increment column to be as sorted for or the first column as default
* Input(s):	object:oInit - the initializer object for the SpreadSheet; used to determine the widths
* Returns:	array array:sorting - array containing a DataTable sort information
*
*/
SpreadSheet.prototype._fnGetInitialSorting = function( oInit ) {
	for ( var i = 0, iLen = oInit.Columns.length; i < iLen; i++ ) {
		if ( oInit.Columns[i].type === SpreadSheet._oTypes.increment ) {
			return [[ i, 'asc' ]];
		}
	}
	return [[ 0, 'asc' ]];
}

/*
* Function:	_fnMakeDrawCallback
* Purpose:	Returns a callback function for the DataTables fnDrawCallback options. 
*			It is responsible for positioning the ColVis show/hide column button 
*			in the left upper corner of the table head - closures a reference to this
*			in self.
* Input(s):	void
* Returns:	function:drawCallback - the mentioned callback
*
*/
SpreadSheet.prototype._fnMakeDrawCallback = function() {
	var self = this;

	return function( event ) {
		// Look up the button in the DOM, than set its position to the upper-left corner of the table head
		var nColVis = jQuery( 'div.ColVis', event.nTableWrapper )[0];
		
		nColVis.style.top = ( self._nTableHead.position().top ) + 'px';
		nColVis.style.left = ( self._nTableHead.position().left ) + 'px';
		nColVis.style.height = ( self._nTableHead.height() ) + 'px';
		
		if ( jQuery.browser.mozilla ) {
			nColVis.style.top = ( self._nTableHead.position().top - 1 ) + 'px';
		}
	}
}

/*
* Function:	_fnRegisterEvents
* Purpose:	Registers key press and click callbacks on the table. They keep track of 
*			the pressed buttons for the SpreadSheet cursor navigation.
* Input(s):	object:oDataTable - the DataTable instance that gets the events assigned to
* Returns:	void
*
*/
SpreadSheet.prototype._fnRegisterEvents = function( oDataTable ) {
	// Click action on cell, use live here in order to add it also to added cells later
	jQuery( 'tbody td', oDataTable.fnSettings().nTable ).live( 'click', this._fnMakeClickCallback() );
	
	// Click action on delete button
	jQuery( 'span.' + SpreadSheet._oCss.jQueryDelete, oDataTable.fnSettings().nTable ).live( 'click', this._fnMakeDeleteCallback() );
	jQuery( 'span.' + SpreadSheet._oCss.jQueryUp, oDataTable.fnSettings().nTable ).live( 'click', this._fnMakeUpCallback() );
	jQuery( 'span.' + SpreadSheet._oCss.jQueryDown, oDataTable.fnSettings().nTable ).live( 'click', this._fnMakeDownCallback() );
	
	// Decide between Opera and Mozilla, respectively the others
	var callback = this._fnMakeKeypressCallback();
	if ( jQuery.browser.mozilla || jQuery.browser.opera ) {
		jQuery(document).bind( 'keypress', callback );
	} else {
		jQuery(document).bind( 'keydown', callback );
	}
}

/*
* Function:	_fnMakeClickCallback
* Purpose:	Returns a callback function for the click event handler in _fnRegisterEvents - closures 
*			reference to this as self into the function. It is responsible for deactivating every
			flag of a button press when clicking.
* Input(s):	void
* Returns:	function:clickCallback - the mentioned callback
*
*/
SpreadSheet.prototype._fnMakeClickCallback = function() {
	var self = this;
	
	// Set pressed keyboard buttons to false
	return function( event ) {
		self._bWasRightButton = false;
		self._bWasLeftButton = false;
	}
}

/*
* Function:	_fnMakeDeleteCallback
* Purpose:	Returns a callback function for the click event handler in _fnRegisterEvents - closures 
*			reference to this as self into the function. It is responsible to first save every
			cell that is still in the edit mode and afterwards to delete the row and update every
			incremental row.
* Input(s):	void
* Returns:	function:deleteCallback - the mentioned callback
*
*/
SpreadSheet.prototype._fnMakeDeleteCallback = function() {
	var self = this;
	
	return function( event ) {
		// Disable the edit status on all cells
		self._fnBlur();
	
		// Find the position of the row we are deleting
		var row = jQuery( event.currentTarget ).parents( 'tr' )[0];
		var line = self._oDataTable.fnGetPosition( row );
		
		// Delete the row, update our internal counter and make sure that there is at least one line to edit
		self._oDataTable.fnDeleteRow( line );
		self._iLine--;
		if ( self._iLine < 0 ) {
			self.fnInsertNewLine();
		}
		
		// Update the incremental columns
		self._fnUpdateIncrementColumns( line );
	}
}

/*
* Function:	_fnBlur
* Purpose:	Blurs and saves all current editable data cells
* Input(s):	void
* Returns:	void
*
*/
SpreadSheet.prototype._fnBlur = function() {
	var nCells = jQuery( 'td > *:not(' + SpreadSheet._oCss.ReadOnly + ')', this._nTableBody ).parents( 'td' );
	for ( var i = 0, iLen = nCells.length; i < iLen; i++ ) {
		this._fnSave( nCells[i] );
	}
}

/*
* Function:	_fnMapeUpCallback
* Purpose:	Creates a row exchange callback with an offset of -1 (change the element with the one that has its index minus one)
* Input(s):	void
* Returns:	function:exchangeCallback
*
*/
SpreadSheet.prototype._fnMakeUpCallback = function() {
	return this._fnMakeExchangeCallback( -1 );
}

/*
* Function:	_fnMakeExchangeCallback
* Purpose:	Creates a callback that will change the row that got the event with the one that has the
			index of the triggered row + offset. It also makes sure that all data is being saved before
			invoking any changes.
* Input(s):	integer:offset - the row offset to the row to be changed with
* Returns:	function:exchangeCallback
*
*/
SpreadSheet.prototype._fnMakeExchangeCallback = function( offset ) {
	var self = this;
	
	return function( event ) {
		// Disable the edit status on all cells
		self._fnBlur();
		
		// Find the position of the row we are exchanging
		var row = jQuery( event.currentTarget ).parents( 'tr' )[0];
		var line = self._oDataTable.fnGetPosition( row );
		
		// ... and change!
		self._fnExchangeRows( line, line + offset );
	}
}


/*
* Function:	_fnExchangeRow
* Purpose:	This function changes two rows with each other and updates the indices of all involved rows.
			The function automatically fixes one of the parameters that is out of bounds by setting it 
			to the other valid value. This behavious is especially needed when trying to shift rows up
			or down in the very first or last row.
* Input(s):	integer:that - index of the first row
			integer:other - index of the other (second) row
* Returns:	void
*
*/
SpreadSheet.prototype._fnExchangeRows = function( that, other ) {
	if ( that < 0 || that > this._iLine ) {
		that = other;
	} else if ( other < 0 || other > this._iLine ) {
		other = that;
	}
	
	var thatData = this._oDataTable.fnGetData( that );
	var otherData = this._oDataTable.fnGetData( other );
	
	this._oDataTable.fnUpdate( thatData, other );
	this._oDataTable.fnUpdate( otherData, that );
	
	this._fnUpdateIncrementColumns( Math.min( that, other ) );
}


/*
* Function:	_fnMapeDownCallback
* Purpose:	Creates a row exchange callback with an offset of 1 (change the element with the one that has its index plus one)
* Input(s):	void
* Returns:	function:exchangeCallback
*
*/
SpreadSheet.prototype._fnMakeDownCallback = function() {
	return this._fnMakeExchangeCallback( 1 );
}

/*
* Function:	_fnUpdateIncrementColumns
* Purpose:	After deleting a row from the sheet, all incremental columns' values need to be updated. 
			This function does this starting from passed line number (usually the deleted row) and
			updates all information. On the last cell it invokes an index rebuild on the datatable
			instance.
* Input(s):	integer:line - the line from which INCLUDING itself all fields shall be updated
* Returns:	void
*
*/
SpreadSheet.prototype._fnUpdateIncrementColumns = function( line ) {
	var incrementColumns = this._fnGetIncrementColumns();
	
	for ( var i = 0, iLen = incrementColumns.length; i < iLen; i++ ) {
		var column = incrementColumns[i];
		
		for ( var j = line, jLen = this._iLine; j <= jLen; j++ ) {
			if ( i === iLen - 1 && j === jLen ) {
				this._oDataTable.fnUpdate( this._fnCreateCell( column, j ), j, column, false, true );
			} else {
				this._oDataTable.fnUpdate( this._fnCreateCell( column, j ), j, column, false, false );
			}
		}
	}
}

/*
* Function:	_fnGetIncrementColumns
* Purpose:	Determines which columns are of type increment and returns them.
* Input(s):	void
* Returns:	array integer:incrementColumns - array holding the hidden indices of all type increment columns
*
*/
SpreadSheet.prototype._fnGetIncrementColumns = function() {
	var incrementColumns = [];

	for ( var i = 0, iLen = this._oInit.Columns.length; i < iLen; i++ ) {
		var column = this._oInit.Columns[i];
		if ( column.type === SpreadSheet._oTypes.increment ) {
			incrementColumns.push( i );
		}
	}
	return incrementColumns;
}

/*
* Function:	_fnMakeKeystrokeCallback
* Purpose:	Returns a callback function for the keypress, respectively keydown event handler in 
*			_fnRegisterEvents - closures reference to this as self into the function. It will keep
			track of the pushed buttons - i.e. left (e.g. left arrow) or right buttons (e.g. tab)
			in form of flags. It also ensures that there are always enough lines in the table to
			perform a focus action.
* Input(s):	void
* Returns:	function:keypressCallback - the mentioned callback
*
*/
SpreadSheet.prototype._fnMakeKeypressCallback = function () {
	var self = this;

	return function( event ) {
		// Shift + tab or left arrow?
		if ( event.keyCode == 9 && event.shiftKey || event.keyCode == 37 ) {
			self._bWasRightButton = false;
			self._bWasLeftButton = true;
		
		// Tab or right arrow?
		} else if ( event.keyCode == 9 || event.keyCode == 39 ) {
			self._bWasRightButton = true;
			self._bWasLeftButton = false;
			
			// Make sure we have enough lines to fulfill the tab/right button
			if ( self._iOldX === self._fnGetVisibleColumns() - 1 && self._iOldY === self._iLine ) {
				self.fnInsertNewLine();
			}
		}
	}
}

/*
* Function:	fnInsertNewLine
* Purpose:	Inserts a new empty line with all initial values set at the end of the SpreadSheet
* Input(s):	void
* Returns:	string array:lineObjects - an array of string containing the html code inserted in each column (including hidden columns)
*
*/
SpreadSheet.prototype.fnInsertNewLine = function() {
	var lineObjects = [];
	
	this._iLine++;
	for ( var i = 0, iLen = this._oInit.Columns.length; i < iLen; i++ ) {
		lineObjects.push( this._fnCreateCell( i, this._iLine ) );
		
	}
	this._oDataTable.fnAddData( lineObjects );
	
	return lineObjects;
}

/*
* Function:	_fnCreateCell
* Purpose:	Creates the content for a data cell given by the passed column index.
			Currently there are five different types supported
				1. Edit: Creates a number of spans, showing edit option button according to the options string
				2. Increment: Creates a text input with a number inside equal to increment start + lines * increment
				3. Text: Creates a text box with given initial string
				4. Select: Uses a html form select element to display a nice drop down list
				5. Checkbox: A simple checkbox that can already be marked
			All elements are from the start of readonly and have to be explicitly enabled first
* Input(s):	integer:iColumn - the index of the column for which the cell is to be made
* Returns:	string:cell - a string containing the html code for the respective cell
*
*/
SpreadSheet.prototype._fnCreateCell = function( iColumn, iRow, val ) {
	var css = [ SpreadSheet._oCss.SpreadSheet, SpreadSheet._oCss.ReadOnly ].join( ' ' );
	var column = this._oInit.Columns[iColumn];
	
	switch( column.type ) {
		case SpreadSheet._oTypes.edit:
			var outerHtml = jQuery( '<div>' );
			var div = jQuery( '<div class="' + css + ' ' + SpreadSheet._oCss.Edit + '">' );
			css += ' ' + SpreadSheet._oCss.jQueryIcon;
			var remove = jQuery( '<span class="' + css + ' ' + SpreadSheet._oCss.jQueryDelete + '">' );
			var up = jQuery( '<span class="' + css + ' ' + SpreadSheet._oCss.jQueryUp + '">' );
			var down = jQuery( '<span class="' + css + ' ' + SpreadSheet._oCss.jQueryDown + '">' );
			
			div.append( remove ).append( down ).append( up );;
			outerHtml.append( div );
		
			return outerHtml.html();
	
		case SpreadSheet._oTypes.increment:
			css += ' ' + SpreadSheet._oCss.Increment;
			var value = typeof val !== 'undefined' ? val : ( column.value + iRow * column.options )
			return '<input type="text" class="' + css + '" value="' + value + '" readonly></input>';
		
		case SpreadSheet._oTypes.text:
			var value = typeof val !== 'undefined' ? val : column.value;
			return '<input type="text" class="' + css + '" value="' + value + '" readonly></input>';
			
		case SpreadSheet._oTypes.select:
			var selection = '<select class="' + css + '" readonly>';
			for ( var i = 0, iLen = column.options.length; i < iLen; i++ ) {
				var selected = '';
				if ( ( typeof val !== 'undefined' && i + 1 == val ) || ( typeof val === 'undefined' && column.value == column.options[i] ) ) {
					selected = ' selected';
				}
				selection += '<option' + selected + '>' + column.options[i] + '</option>';
			}
			selection += '</select>';
			
			return selection;
			
		case SpreadSheet._oTypes.checkbox:
			var checked = ( typeof val !== 'undefined' && val ) || ( typeof val === 'undefined' && column.value ) ? ' checked' : '';
			return '<input type="checkbox" class="' + css + '"' + checked + ' readonly></input>';
			
		default:
			return '';
	}
}

/*
* Function:	_fnSanitizeFocus
* Purpose:	Sanitized the given cell to focus in the beginning - essentially converting the column name to an index, do type 
			checking as well as skipping readonly columns.
* Input(s):	object:oInit - Initializer-like objects
* Returns:	integer array:Focus - Two items array representing the final x and y position of the focus after sanitation
*
*/
SpreadSheet.prototype._fnSanitizeFocus = function( oFocus ) {
	// User did not specify focus? Well then, nothing to do here
	if ( oFocus === null ) {
		return null;
	}
	
	var focus = oFocus;
	// If the type of the focus is not integer or string, yell loudly otherwise
	if ( typeof focus !== 'string' && this._fnIsInteger( focus ) ) {
		throw 'Focus needs to be of type string or integer';
	}
	
	// Set focus cell and X and Y position properly in the beginning - i.e. make sure the focus is not on a protected 
	// column. However it is, we want to find the next free column to the right. We use a bit hacky way here and just 
	// fake a right button push of the focus callback.
	var x = this._fnHiddenToVisibleIndex( this._fnColumnToIndex( focus ) );
	var y = 0;
	
	this._bWasRightButton = true;
	var offsets = this._fnGetNextFreeCell( this, x, y );
	this._bWasRightButton = false;
	
	x += offsets.columnOffset;
	y += offsets.rowOffset;
	
	return [ x, y ];
}

/*
* Function:	_fnColumnToIndex
* Purpose:	Converts a column name to its according index INCLUDING hidden column.
			If the input is already given as an index, boundary checks are made and index is returned
* Input(s):	integer|string:oColumn - column to be converted
* Returns:	integer:hiddenIndex - the converted index
*
*/
SpreadSheet.prototype._fnColumnToIndex = function( oColumn ) {
	// Column given as integer? Make bounds check and return if valid
	if ( this._fnIsInteger( oColumn ) && oColumn >= 0 && oColumn < this._oInit.Columns.length ) {
		return oColumn;

	// Column to convert given as string? Look up if such a column is present and convert to index instead
	} else if ( typeof oColumn === 'string' && jQuery.inArray( oColumn, this._asColumnNames ) > -1 ) {
		return jQuery.inArray( oColumn, this._asColumnNames );
	}
	
	throw 'Could not convert ' + oColumn + ' to column index';
}

/*
* Function:	_fnHiddenToVisibleIndex
* Purpose:	Converts a hidden column index to its according visible counterpart.
* Input(s):	integer:iHiddenX - column index to be converted
* Returns:	integer:iX - the converted index
*
*/
SpreadSheet.prototype._fnHiddenToVisibleIndex = function( iHiddenX ) {
	var iX = -1;
	var currentColumnSettings = this._oDataTable.fnSettings().aoColumns;

	for ( var i = 0, iLen = currentColumnSettings.length; i < iLen; i++ ) {
		if ( currentColumnSettings[i].bVisible ) {
			iX++;
		}
		if ( i === iHiddenX ) {
			return iX;
		}
	}
	throw 'Could not convert ' + iHiddenX + ' to visible index';
}

/*
* Function:	_fnVisibleToHiddenIndex
* Purpose:	Converts a visible column index to its according hidden counterpart.
* Input(s):	integer:iX - column index to be converted
* Returns:	integer:iHiddenX - the converted hidden index
*
*/
SpreadSheet.prototype._fnVisibleToHiddenIndex = function( iX ) {
	var visibleColumns = -1;
	var currentColumnSettings = this._oDataTable.fnSettings().aoColumns;
	
	for ( var i = 0, iLen = currentColumnSettings.length; i < iLen; i++ ) {
		if ( currentColumnSettings[i].bVisible ) {
			visibleColumns++;
		}	
		if ( iX === visibleColumns ) {
			return i;
		}
	}	
	throw 'Could not convert ' + iX + ' to hidden index';
}

/*
* Function:	_fnGetNextFreeCell
* Purpose:	If the cell given by the coordinates is readonly this method will find another one that 
			is available depending on the previous interaction with the table, which are i.e.:
				1. Right Button: Skip cells as long as necessary to the right one by one (jumps also rows downwards)
				2. Left Button: Skip cells as long as necessary to the left one by one (jumps rows upwards)
				3. Neither: Stays in the previous position, comes in handy for clicks
			Given that the cell is not readonly we will go there
* Input(s):	object:self - reference to the SpreadSheet instance, to enable calling this method in callbacks
			integer:iX - x position (column) of the cursor EXCLUDING hidden columns
			integer:iY - y position (row) of the cursor
* Returns:	object:offsets - returns an object that contains the required offsets for column and row offset to the next 
			free cell in "visible column units"
*
*/
SpreadSheet.prototype._fnGetNextFreeCell = function( self, iX, iY ) {
	var iHiddenX = self._fnVisibleToHiddenIndex( iX );
	var visibleColumns = self._fnGetVisibleColumns();
	var rowOffset = 0;
	var columnOffset = 0;
	
	while ( jQuery.inArray( iHiddenX + columnOffset, self._aiReadonlyColumns ) > -1 ) {
		// Right button? Move right as far we can or go to next row to the beginning
		if ( self._bWasRightButton ) {
			columnOffset++;
			if ( iX + columnOffset >= visibleColumns ) {
				columnOffset = -iX;
				rowOffset++;
			}
			
		// Left button? Move left as far as we get or go one row up to the end
		} else if ( self._bWasLeftButton ) {
			columnOffset--;
			if ( iX + columnOffset < 0 ) {
				columnOffset = visibleColumns - iX - 1;
				rowOffset--;
			}
		}
		
		// Make sure we do not loop infinately
		if ( rowOffset !== 0 && columnOffset === 0 ) {
			break;
		}
	}	
	return { 'columnOffset' : columnOffset, 'rowOffset' : rowOffset };
}

/*
* Function:	_fnGetVisibleColumns
* Purpose:	Calculates how many rows are currently visible in the table. Handy method for interaction callbacks
* Input(s):	void
* Returns:	integer:visibleColumns - the number of visible columns
*
*/
SpreadSheet.prototype._fnGetVisibleColumns = function() {
	var visibleColumns = 0;
	var columnDefinitions = this._oDataTable.fnSettings().aoColumns;
	
	for ( var i = 0, iLen = columnDefinitions.length; i < iLen; i++ ) {
		if ( columnDefinitions[i].bVisible ) {
			visibleColumns++;
		}
	}
	
	return visibleColumns;
}

/*
* Function:	_fnGetHiddenColumns
* Purpose:	Calculates how many rows are currently visible in the table. Handy method for interaction callbacks
* Input(s):	void
* Returns:	integer:hiddenColumns - the number of hidden columns
*
*/
SpreadSheet.prototype._fnGetHiddenColumns = function() {
	var hiddenColumns = 0;
	var columnDefinitions = this._oDataTable.fnSettings().aoColumns;
	
	for ( var i = 0, iLen = columnDefinitions.length; i < iLen; i++ ) {
		if ( !columnDefinitions[i].bVisible ) {
			hiddenColumns++;
		}
	}
	
	return hiddenColumns;
}

/*
* Function:	_fnCreateKeyTable
* Purpose:	Creates a KeyTable instance and attaches it to the table as well as to the DataTable
* Input(s):	integer:iColumn - the index of the column for which the cell is to be made
* Returns:	object:KeyTable - the KeyTable instance
*
*/
SpreadSheet.prototype._fnCreateKeyTable = function( nTable, oDataTable, oInit ) {
	var tableId = nTable.attr( 'id' );
	
	var keyTable = new KeyTable({
		'table' : document.getElementById( tableId ),
		'datatable' : oDataTable,
		'initScroll' : true
	});

	keyTable.event.focus( null, null, this._fnMakeFocusCallback() );
	// Use this and not the KeyTable options to force a initial focus callback, but only if focus is set
	if ( oInit.Focus !== null ) {
		keyTable.fnSetPosition( oInit.Focus[0], oInit.Focus[1] );
	}
	keyTable.event.blur( null, null, this._fnMakeBlurCallback() );
	keyTable.event.action( null, null, this._fnMakeActionCallback() );
	
	return keyTable;
}

/*
* Function:	_fnMakeFocusCallback
* Purpose:	Creates a callback that determines what happens on focusing a data cell - basically two alternatives are possible:
				1. We have a protected column that we need to skip (including inserting new lines in case needed) and return or
				2. It is a accessable cell, than track the new position and go into edit mode
* Input(s):	void
* Returns:	function:FocusCallback - the callback
*
*/
SpreadSheet.prototype._fnMakeFocusCallback = function() {
	var self = this;
	
	return function( nCell, iX, iY ) {	
		var iHiddenX = self._fnVisibleToHiddenIndex( iX );
		
		// Are we in a column that is protected?
		if ( jQuery.inArray( iHiddenX, self._aiReadonlyColumns ) > -1 ) {
		
			if ( !self._bWasRightButton && !self._bWasLeftButton && self._oInit.Columns[iY].type === SpreadSheet._oTypes.edit ) {
				self._oKeyTable.fnSetPosition( self._iOldX, self._iOldY );
				return;
			}
			
			// Was caused by a key stroke? Then skip cells
			if ( self._bWasRightButton || self._bWasLeftButton ) {
				var offsets = self._fnGetNextFreeCell( self, iX, iY );
				var rowOffset = offsets.rowOffset;
				var columnOffset = offsets.columnOffset;
				
				// Make sure we are not out of bounds
				if ( iY + rowOffset >= 0 && iY + rowOffset <= self._iLine + 1 ) {
					if ( self._iOldY > self._iLine + 1 ) {
						self.fnInsertNewLine();
					}
					self._iOldX = iX + columnOffset;
					self._iOldY = iY + rowOffset;
				}
			}
			
			// Set position, leave function and they lived happily ever after :)
			self._oKeyTable.fnSetPosition( self._iOldX, self._iOldY );
			return
		}
		
		// In a not protected cell we just have to track the position
		self._iOldX = iX;
		self._iOldY = iY;

		// Make current cell editable
		self._fnEdit( nCell );
	};
}

/*
* Function:	_fnEdit
* Purpose:	Shifts the passed cell into edit mode. This is mainly done by removing the ReadOnly
			Css class as well as the readonly, respectively disabled attribute. Also makes sure
			that text input field are completely selected from the start off.
* Input(s):	void
* Returns:	void
*
*/
SpreadSheet.prototype._fnEdit = function( nCell ) {
	var iX = this._oDataTable.fnGetPosition( nCell )[1];
	var iHiddenX = this._fnVisibleToHiddenIndex( iX );

	switch ( this._oInit.Columns[iHiddenX].type ) {
		case SpreadSheet._oTypes.increment, SpreadSheet._oTypes.text:
			var input = jQuery( 'input', nCell );
			setTimeout( function() { input.select(); }, 0 );
			break;
			
		case SpreadSheet._oTypes.select:
			var input = jQuery( 'select', nCell );
			break;
			
		case SpreadSheet._oTypes.checkbox:
			var input = jQuery( 'input', nCell );
			break;
			
		default:
			break;
	}
	input.attr( 'readonly', false );
	input.removeClass( SpreadSheet._oCss.ReadOnly );
}

/*
* Function:	_fnMakeBlurCallback
* Purpose:	Creates a callback that describes the behaviour for leaving a data cell - i.e. save the content
* Input(s):	void
* Returns:	function:BlurCallback - the callback
*
*/
SpreadSheet.prototype._fnMakeBlurCallback = function() {
	var self = this;
	
	return function( nCell, iX, iY ) {
		if ( nCell === null || iX === null || iY === null ) {
			return;
		}
		self._fnSave( nCell );
	};
}

/*
* Function:	_fnSave
* Purpose:	Saves the contents in the edited cell depending on its cell type. Mainly this requires
			only to add the ReadOnly css flag again, set the field to readonly and update its content
			int the underlying DataTables instance. However, Firefox needs sometimes a little extra 
			treatement with the selections in textboxes when deselecting them.
* Input(s):	void
* Returns:	void
*
*/
SpreadSheet.prototype._fnSave = function( nCell ) {
	var position = this._oDataTable.fnGetPosition( nCell );
	var iX = position[1];
	var iHiddenX = this._fnVisibleToHiddenIndex( iX );
	var iRow = position[0];

	switch ( this._oInit.Columns[iHiddenX].type ) {
	
		case SpreadSheet._oTypes.increment, SpreadSheet._oTypes.text:				
			var input = jQuery( 'input', nCell );
			
			// Makes sure that Firefox gets rid of the selection in the previous element... but only for text ;)
			if ( jQuery.browser.mozilla ) {
				for ( var i = 0, iLen = input.length; i < iLen; i++ ) {
					var element = input[i];
					if ( element.type === 'text' ) {
						element.selectionStart = 0;
						element.selectionEnd = 0;
					}
				}
			}
			
			break;
			
		case SpreadSheet._oTypes.select:
			var input = jQuery( 'select', nCell );
			break;
			
		case SpreadSheet._oTypes.checkbox:
			var input = jQuery( 'input', nCell );
			break;
		
		default:
			return;
	}
	input.attr( 'readonly', true );
	input.addClass( SpreadSheet._oCss.ReadOnly );
	
	// Update the internal DataTable instance by creating new cell content
	var value = input.val();
	// Checkboxes are bit special... so we have to make some checks here
	if ( this._oInit.Columns[iHiddenX].type === SpreadSheet._oTypes.checkbox ) {
		value = typeof input.attr( 'checked' ) === 'undefined' ? false : true;
	}
	
	this._oDataTable.fnUpdate( this._fnCreateCell( iHiddenX, iRow, value ), iRow, iHiddenX, false, true );
}

/*
* Function:	_fnMakeActionCallback
* Purpose:	Creates a callback that describes the behaviour for pushing enter. At first save the content and 
			check whether we are in the last row of the table in order to introduce a new empty line than.
* Input(s):	void
* Returns:	function:ActionCallback - the callback
*
*/
SpreadSheet.prototype._fnMakeActionCallback = function() {
	var self = this;
	
	return function( nCell, iX, iY ) {
		self._fnSave( nCell );
		
		if ( iY === self._iLine ) {
			self.fnInsertNewLine();
		}
		self._oKeyTable.fnSetPosition( iX, iY + 1 );
	};
}

/*
* Function:	fnFocus
* Purpose:	Can be called in a multi SpreadSheet environment to determine which table is the first
* Input(s):	void
* Returns:	void
*
*/
SpreadSheet.prototype.fnFocus = function() {
	if ( this._oInit.Focus !== null ) {
		var nCell = this._oKeyTable.fnGetCurrentTD();
	
		// Make the other tables loose focus
		jQuery( nCell ).click();
		// Refocus the cell that we had before
		this._fnEdit( nCell );
	}
}

/*
* Function:	fnGetData
* Purpose:	Retrieves data from the SpreadSheet depending on the given parameters. There are three possibilities:
				1. No parameter is passed - the whole table will be returned as a 2D-array
				2. First parameter is given - the row indicated by the parameters will be returned as an array
				3. Two parameters are given - the content of the cell at the given coordinates is returned
* Input(s):	integer:iRow - index of the row
			integer:iColumn - index of the column
* Returns:	string|string array|array string array:content - the content of the table
*
*/
SpreadSheet.prototype.fnGetData = function( iRow, iColumn ) {
	var data = this._oDataTable.fnGetData( iRow, iColumn );
	
	if ( typeof iRow === 'undefined' && typeof iColumn === 'undefined' ) {
		return this._fnUnwrapTable( data );
	} else if ( typeof iRow !== 'undefined' && typeof iColumn === 'undefined' ) {
		return this._fnUnwrapRow( data );
	} else if ( typeof iRow !== 'undefined' && typeof iColumn !== 'undefined' ) {
		return this._fnUnwrapCell( data );
	}
}

/*
* Function:	_fnUnwrapTable
* Purpose:	Removes the input/selection tags from a whole table for each individual cell
* Input(s):	array string array:aasTable - the table as a 2D array as given for instance by this._oDataTable.fnGetData()
* Returns:	array string array:table - the unwrapped table content
*
*/
SpreadSheet.prototype._fnUnwrapTable = function( aasTable ) {
	var table = [];
	for( var i = 0, iLen = aasTable.length; i < iLen; i++ ) {
		table.push( this._fnUnwrapRow( aasTable[i] ) );
	}
	return table;
}

/*
* Function:	_fnUnwrapRow
* Purpose:	Removes the input/selection tags from a given row for each individual cell
* Input(s): string array:asCells - the row as an array as given for instance by this._oDataTable.fnGetData( index )
* Returns:	string array:row - the unwrapped row content
*
*/
SpreadSheet.prototype._fnUnwrapRow = function( asCells ) {
	var row = [];
	for ( var i = 0, iLen = asCells.length; i < iLen; i++ ) {
		row.push( this._fnUnwrapCell( asCells[i] ) );
	}
	return row;
}

/*
* Function:	_fnUnwrapCell
* Purpose:	Removes the input/selection tags from an individual cell. The wrapping is needed to enable inputting
			during editing the SpreadSheet (see e.g. _fnEdit, _fnSave, _fnMakeCell for more details). During an
			export this is unwanted and therefore removed.
* Input(s): string:sCell - the cell as for instance by this._oDataTable.fnGetData( index, otherIndex )
* Returns:	string:unwrapped - the unwrapped cell content
*
*/
SpreadSheet.prototype._fnUnwrapCell = function( sCell ) {
	var nCell = jQuery( sCell );
	
	if ( nCell.is( 'input:text' ) ) {
		return nCell.val()
	} else if ( nCell.is( 'input:checkbox' ) ) {
		return typeof nCell.attr( 'checked' ) !== 'undefined' ? 'on' : 'off';
	} else if ( nCell.is( 'select' ) ) {
		return nCell.children( 'option:selected' ).val();
	} else {
		return null;
	}
}
