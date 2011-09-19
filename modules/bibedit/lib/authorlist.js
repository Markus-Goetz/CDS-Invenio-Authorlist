/*
* Variable: SpreadSheet.CSS
* Purpose:  Central enumeration and mapping for the CSS classes used in the 
*           Authorlist module. Eases consistent look up and renaming if 
*           required.
*
*/
Authorlist.CSS = {
    // Section classes
    'Authorlist'        : 'Authorlist',
    'Headline'          : 'AuthorlistHeadline',
    'Paper'             : 'AuthorlistPaper',
    'Reference'         : 'AuthorlistReference',
    'Authors'           : 'AuthorlistAuthors',
    'Affiliations'      : 'AuthorlistAffiliations',
    
    // Input classes
    'Label'             : 'AuthorlistLabel',
    'Input'             : 'AuthorlistInput',
    
    // Button classes
    'Button'            : 'AuthorlistButton',
    'Add'               : 'AuthorlistAdd',
    'AddIcon'           : 'ui-icon-plusthick',
    'Remove'            : 'AuthorlistRemove',
    'RemoveIcon'        : 'ui-icon-minusthick'
}

/*
* Function: Authorlist
* Purpose:  Constructor
* Input(s): string:sId - Id of the html element the Authorlist will be embedded
*                        into (preferably a div).
* Returns:  Authorlist instance when called with new, else undefined
*
*/
function Authorlist( sId ) {
    this._nParent = jQuery( '#' + sId );
    this._nParent.addClass( Authorlist.CSS.Authorlist );

    this._oPaper = this._fnCreatePaper( this._nParent );
    this._oAuthors = this._fnCreateAuthors( this._nParent );
    this._oAffiliations = this._fnCreateAffiliations( this._nParent );
}

/*
* Function: _fnCreateAffiliations
* Purpose:  Creates all DOM-elements required for the affiliations - i.e. the 
*           headline and the wrapping div - embeds a SpreadSheet instance in it 
*           and returns the created object afterwards.
* Input(s): node:nParent - the node where the affiliations will be embedded
* Returns:  object:oAffiliations - the SpreadSheet instance
*
*/
Authorlist.prototype._fnCreateAffiliations = function( nParent ) {
    var nAffiliations = jQuery( '<div>' )
    nAffiliations.attr( 'id', Authorlist.CSS.Affiliations );
    this._fnCreateHeadline( nAffiliations, 'Affiliations' );
    nParent.append( nAffiliations );
    
    var oAffiliations = new SpreadSheet( Authorlist.CSS.Affiliations, {
        columns : [ {
            'title'       : '',
            'type'        : 'increment',
            'width'       : '2%'
        }, {
            'title'       : 'Edit',
            'type'        : 'edit'
        }, {
            'title'       : 'Acronym',
            'width'       : '5%',
        }, {
            'title'       : 'Umbrella',
            'width'       : '5%',
        }, {
            'title'       : 'Name And Address',
        }, {
            'title'       : 'Domain',
            'width'       : '20%',
        }, {
            'title'       : 'Member',
            'type'        : 'checkbox',
            'value'       : true,
            'width'       : '4%'
        }, {
            'title'       : 'Spires ID',
            'width'       : '9%'
        } ]
    } );

    return oAffiliations;
}

/*
* Function: _fnCreateAuthors
* Purpose:  Creates all DOM-elements required for the authors - i.e. the 
*           headline and the wrapping div - embeds a SpreadSheet instance in it 
*           and returns the created object afterwards.
* Input(s): node:nParent - the node where the authors will be embedded
* Returns:  object:oAffiliations - the SpreadSheet instance
*
*/
Authorlist.prototype._fnCreateAuthors = function( nParent ) {
    var nAuthors = jQuery( '<div>' )
    nAuthors.attr( 'id', Authorlist.CSS.Authors );
    this._fnCreateHeadline( nAuthors, 'Authors' );
    nParent.append( nAuthors );
    
    var oAuthors = new SpreadSheet( Authorlist.CSS.Authors, {
        columns : [ {
            'title'       : '',
            'type'        : 'increment',
            'width'       : '2%'
        }, {
            'title'       : 'Edit',
            'type'        : 'edit'
        },  {
            'title'       : 'Family Name'
        }, {
            'title'       : 'Given Name'
        }, {
            'title'       : 'Name On Paper'
        }, {
            'title'       : 'Alive',
            'type'        : 'checkbox',
            'value'       : true
        }, {
            'title'       : 'Affiliations',
            'type'        : 'textselect',
            'value'       : 'Affiliated with',
            'options'     : [ 'Affiliated with', 
                              'Also at', 
                              'On leave from', 
                              'Visitor' ],
            'width'       : '33%',
            'extendable'  : true
        }, {
            'title'       : 'Inspire ID',
            'width'       : '9%'
        } ]
    } );
    
    return oAuthors;
}

/*
* Function: _fnCreateHeadline
* Purpose:  Small helper function that will create a generic authorlist headline
* Input(s): node:nParent - the node going to get a headline
            string:sTitle - the title string
* Returns:  node:nHeadline - the created headline node
*
*/
Authorlist.prototype._fnCreateHeadline = function( nParent, sTitle ) {
    var nHeadline = jQuery( '<h2>' + sTitle + '</h2>' );
    nHeadline.addClass( Authorlist.CSS.Headline );
    nParent.append( nHeadline );
    
    return nHeadline;
}

/*
* Function: _fnCreatePaper
* Purpose:  Creates a new headline for the paper information, creates a Paper 
*           objects, embeds it into the parent and returns it.
* Input(s): node:nParent - where to append the paper information to
* Returns:  object:oPaper - the Paper instance.
*
*/
Authorlist.prototype._fnCreatePaper = function( nParent ) {
    var nPaper = jQuery( '<div>' );
    nPaper.attr( 'id', Authorlist.CSS.Paper );
    this._fnCreateHeadline( nPaper, 'Paper' );
    nParent.append( nPaper );
    
    return new Paper( Authorlist.CSS. Paper );
}








/*
* Function: Paper
* Purpose:  Constructor
* Input(s): string:sId - Id of the html element the Paper will be embedded
*                        into (preferably a div).
* Returns:  Paper instance when called with new, else undefined
*
*/
function Paper( sId ) {
    this._nParent = jQuery( '#' + sId );
    
    this._nPaper = this._fnCreateInput( 'Paper Title' );
    this._nCollaboration = this._fnCreateInput( 'Collaboration' );
    this._nReference = this._fnCreateInput( 'Reference Ids', Authorlist.CSS.Reference + '0' );
    this._fnCreateButtons( this._nReference);
    
    this._nParent.append( this._nPaper, this._nCollaboration, this._nReference );
    
    var test = jQuery( '<div>Test</div>' );
    test.addClass( 'ui-state-error' );
    jQuery( 'body' ).append( test );
    test.dialog( {
        'modal' : true
    } );
}

/*
* Function: fnGetData
* Purpose:  Retrieves the paper information in a further processable form. EMPTY
*           lines are SKIPPED in the result.
* Input(s): void
* Returns:  object:oResult - an object containing the paper information
*
*/
Paper.prototype.fnGetData = function() {
    var oResult = {};
    var sSelector = '.' + Authorlist.CSS.Input;
    
    oResult.paper_title = this._nPaper.find( sSelector ).val();
    oResult.collaboration = this._nCollaboration.find( sSelector ).val();
    oResult.reference_ids = [];
    
    this._nReference.find( sSelector ).each( function( iIndex, nInput ) {
        var sValue = jQuery( nInput ).val();
        
        // Skip empty elements
        if ( sValue.match( /^\s*$/) !== null ) return true;
        oResult.reference_ids.push( sValue );
    } );
    
    return oResult;
}

/*
* Function: _fnCreateButtons
* Purpose:  Creates the add and remove buttons next to the passed parent and 
*           assigns callbacks to them.
* Input(s): node:nParent - the parent node to which to append the buttons
* Returns:  void
*
*/
Paper.prototype._fnCreateButtons = function( nParent ) {
    // Create button elements
    var nAddButton = jQuery( '<button>' );
    var nRemoveButton = jQuery( '<button>' );
    
    // Add classes and add them to the DOM
    nAddButton.addClass( Authorlist.CSS.Button ).addClass( Authorlist.CSS.Add );
    nRemoveButton.addClass( Authorlist.CSS.Button ).addClass( Authorlist.CSS.Remove );
    nParent.append( nAddButton, nRemoveButton );
    
    // Transform them to jQuery UI buttons
    nAddButton.button( {
        'label' : 'Add',
        'icons' : {
            'primary' : Authorlist.CSS.AddIcon
        }
    } );
    nRemoveButton.button( {
        'label' : 'Remove',
        'icons' : {
            'primary' : Authorlist.CSS.RemoveIcon
        }
    } );
    
    // Register callbacks for add and remove action
    var self = this;
    nAddButton.click( function() {
        // Just create a new input line with no title
        var iInputs = nParent.find( '.' + Authorlist.CSS.Input ).length;
        nParent.append( self._fnCreateInput ( '', Authorlist.CSS.Reference + iInputs ) );
    } );
    nRemoveButton.click( function() {
        var iInputs = nParent.find( '.' + Authorlist.CSS.Input ).length;
        
        // Delete the last input as long as there will be one line remaining
        if ( iInputs <= 1 ) return;
        nParent.children().last().remove();
    } );
}

/*
* Function: _fnCreateInput
* Purpose:  Creates a label and input element combination and returns it.
* Input(s): string:sTitle - the title/label string of the field
*           string:sId - the id that the input field will get
* Returns:  node:nWrapper - a element containing the label and input field
*
*/
Paper.prototype._fnCreateInput = function( sTitle, sId ) {
    if ( typeof sId === 'undefined' ) sId = sTitle.replace( / /g, '' );
    
    var nWrapper = jQuery( '<div>' );
    var nLabel = jQuery( '<label for="' + sId + '">' + sTitle + '</label>' );
    nLabel.addClass( Authorlist.CSS.Label );
    var nInput = jQuery( '<input id="' + sId + '">' );
    nInput.addClass( Authorlist.CSS.Input );
    
    return nWrapper.append( nLabel, nInput );
}
