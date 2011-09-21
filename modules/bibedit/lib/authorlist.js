/*
* Function: remove
* Purpose:  Extend the array prototype to remove an element by value
* Input(s): object:value - value to remove
* Returns:  object:removed - the removed element if found or undefined elsewise
*
*/
Array.prototype.remove = function( value ) {
    var index = this.indexOf( value );
    if ( index !== -1 ) return this.splice( index, 1 );
}

/*
* Variable: Authorlist.CSS
* Purpose:  Central enumeration and mapping for the CSS classes used in the 
*           Authorlist module. Eases consistent look up and renaming if 
*           required.
*
*/
Authorlist.CSS = {
    // Section classes
    'Authorlist'        : 'Authorlist',
    'Headline'          : 'AuthorlistHeadline',
    'Footnote'          : 'AuthorlistFootnote',
    'FootnoteSymbol'    : 'AuthorlistFootnoteSymbol',
    'Paper'             : 'AuthorlistPaper',
    'Reference'         : 'AuthorlistReference',
    'Authors'           : 'AuthorlistAuthors',
    'Affiliations'      : 'AuthorlistAffiliations',
    
    // Input classes
    'Label'             : 'AuthorlistLabel',
    'Input'             : 'AuthorlistInput',
    
    // Button classes
    'Button'            : 'AuthorlistButton',
    'Save'              : 'AuthorlistSave',
    'SaveIcon'          : 'ui-icon-disk',
    'Export'            : 'ui-icon-document',
    'Add'               : 'AuthorlistAdd',
    'AddIcon'           : 'ui-icon-plusthick',
    'Remove'            : 'AuthorlistRemove',
    'RemoveIcon'        : 'ui-icon-minusthick',
    
    // Dialog classes
    'Dialog'            : 'AuthorlistDialog',
    'Error'             : 'ui-state-error',
    'ErrorTitle'        : 'AuthorlistErrorTitle',
    'Icon'              : 'ui-icon',
    'ErrorIcon'         : 'ui-icon-alert',
    'Bullet'            : 'AuthorlistBullet',
    'BulletIcon'        : 'ui-icon-carat-1-e',
    'BulletText'        : 'AuthorlistBulletText'
}

/*
* Variable: Authorlist.EMPTY
* Purpose:  RegEx that defines that a field is considered to be empty if it 
*           contains only whitespaces or no characters at all.
*
*/
Authorlist.EMPTY = /^\s*$/;

/*
* Variable: Authorlist.Indices
* Purpose:  Names for the indices into the result arrays of the authors and 
*           affiliations .fnGetData() arrays
*
*/
Authorlist.INDICES = {
    'Acronym'         : 2,
    'Address'         : 4,
    'AffiliationName' : 0,
    'Affiliations'    : 6,
    'AuthorName'      : 4,
    'Index'           : 0,
    'Umbrella'        : 3
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
    this._nFootnotes = this._fnCreateFootnotes( this._nParent );
    this._nControlPanel = this._fnCreateControlPanel( this._nParent );
}

/*
* Function: fnGetData
* Purpose:  Returns the whole content of the authorlist tool as an objects. It 
*           includes the values of the paper information, the author SpreadSheet
*           as well as the ones of the affiliations sheet.
* Input(s): void
* Returns:  object:oResults - the content of the authorlist instance
*
*/
Authorlist.prototype.fnGetData = function() {
    var oResult = this._oPaper.fnGetData();
    oResult.authors = this._oAuthors.fnGetData();
    oResult.affiliations = this._oAffiliations.fnGetData();
    
    return oResult;
}

/*
* Function: fnValidate
* Purpose:  Returns a list of errors if the entered data in the author list 
*           fields are in valid. This means it checks whether all required 
*           fields are set as well as whether every link string is correct. If
*           so the array with error message is empty.
* Input(s): object:oData - the data of the authorlist as it can be obtained by 
                           the fnGetData() call
* Returns:  array string:asErrors - true if data is sane, else false
*
*/
Authorlist.prototype.fnValidate = function( oData ) {
    var asErrors = [];
    
    // Paper title
    if ( oData.paper_title.match( Authorlist.EMPTY ) !== null ) {
        asErrors.push( 'Paper title <strong>required</strong>' );
    }    
    // Collaboration name
    if ( oData.collaboration.match( Authorlist.EMPTY ) !== null ) {
        asErrors.push( 'Collaboration name <strong>required</strong>' );
    }
    
    // Validate affiliations and authors
    var aaoAffiliations = oData.affiliations;
    var aaoAuthors = oData.authors;
    var asAcronyms = this._fnValidateAffiliations( aaoAffiliations, asErrors );
    this._fnValidateAuthors( aaoAuthors, asAcronyms, asErrors );
    this._fnValidateUmbrellas( aaoAffiliations, asAcronyms, asErrors );
    
    return asErrors;
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
            'title'       : 'Acronym (*)',
            'width'       : '9%',
        }, {
            'title'       : 'Umbrella (+)',
            'width'       : '9%',
        }, {
            'title'       : 'Name And Address (*)',
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
            'title'       : 'Name On Paper (*)'
        }, {
            'title'       : 'Alive',
            'type'        : 'checkbox',
            'value'       : true
        }, {
            'title'       : 'Affiliations (*,+)',
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
* Function: _fnCreateButton
* Purpose:  Creates a button in the given parent element with the given label 
*           and - if set - given icon and returns the new button. The button is 
*           a jQuery UI button widget.
* Input(s): node:nParent - the parent element
*           string:sLabel - the button label
*           string:sIcon - a jQuery UI/general CSS icon class
* Returns:  node:nButton - the button widget
*
*/
Authorlist.prototype._fnCreateButton = function( nParent, sLabel, sIcon) {
    var nButton = jQuery( '<button>' ).addClass( Authorlist.CSS.Button );
    nParent.append( nButton );
    
    nButton.button( {
        'label' : sLabel,
        'icons' : {
            'primary' : sIcon
        }
    } );
    
    return nButton;
}

/*
* Function: _fnCreateControlPanel
* Purpose:  Creates the bar in the end, containing all the control buttons, like
*           save or export.
* Input(s): node:nParent - the node to append the panel to
* Returns:  void
*
*/
Authorlist.prototype._fnCreateControlPanel = function( nParent ) {
    var nControlPanel = jQuery( '<div>' );
    this._fnCreateHeadline( nControlPanel, '' );
    
    var nSave = this._fnCreateButton( nControlPanel, 'Save', Authorlist.CSS.SaveIcon );
    nSave.addClass( Authorlist.CSS.Save );
    var nAuthorsXML = this._fnCreateButton( nControlPanel, 'AuthorsXML', Authorlist.CSS.Export);
    var nLatex = this._fnCreateButton( nControlPanel, 'LaTeX', Authorlist.CSS.Export);
    
    var self = this;
    // Register safe callback
    nSave.click( function( event ) {
        self._fnSave();
    } );
    
    // Register export callbacks
    nAuthorsXML.click( function( event ) {
        self._fnExport( this );
    } );
    nLatex.click( function( event ) {
        self._fnExport( this );
    } );
    
    nParent.append( nControlPanel );
}


/*
* Function: _fnCreateFootnotes
* Purpose:  Creates the small footnotes below the tables
* Input(s): node:nParent - the node to append the footnotes to
* Returns:  void
*
*/
Authorlist.prototype._fnCreateFootnotes = function( nParent ) {
    var nFootnotes = jQuery( '<div>' ).addClass( Authorlist.CSS.Footnote );

    var nRequired       = jQuery( '<div>' );
    var nRequiredSymbol = jQuery( '<span>(*)</span>' );
    var nRequiredText   = jQuery( '<span>Required</span>' );
    nRequired.append( nRequiredSymbol, nRequiredText );
    
    var nLink       = jQuery( '<div>' );
    var nLinkSymbol = jQuery( '<span>(+)</span>' );
    var nLinkText   = jQuery( '<span>Use an acronym of the affiliations table</span>' );
    nLink.append( nLinkSymbol, nLinkText );
    
    nRequiredSymbol.addClass( Authorlist.CSS.FootnoteSymbol );
    nLinkSymbol.addClass( Authorlist.CSS.FootnoteSymbol );
    nFootnotes.append( nRequired, nLink );
    
    nParent.append( nFootnotes );
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

Authorlist.prototype._fnExport = function( nButton ) {
    console.log( 'export', nButton );
}

/*
* Function: _fnSave
* Purpose:  Saves the data of the authorlist instance on the server as long as 
*           there are no errors, which will be displayed in a dialog otherwise.
* Input(s): void
* Returns:  void
*
*/
Authorlist.prototype._fnSave = function() {
    var oData = this.fnGetData();
    var asErrors = this.fnValidate( oData );
    
    if ( asErrors.length === 0 ) {
       this._fnSend( oData );
    } else {
        this._fnShowErrors( asErrors );
    }
}

Authorlist.prototype._fnSend = function( oData ) {
    console.log( JSON.stringify( oData ) );
}

/*
* Function: _fnShowErrors
* Purpose:  Opens up a modal dialog box that presents all missing information/
*           errors in the passed asErrors array in a bullet point list.
* Input(s): array string:asErrors - the error messages array
* Returns:  void
*
*/
Authorlist.prototype._fnShowErrors = function( asErrors ) {
    var nDialog = jQuery( '<div>' );
    var nError = jQuery( '<p>' );
    var nErrorIcon = jQuery( '<span>' );
    var nErrorText = jQuery( '<span>The following errors prevent saving:</span>' );
    
    // Add CSS classes
    nDialog.addClass( Authorlist.CSS.Error );
    nError.addClass( Authorlist.CSS.ErrorTitle );
    nErrorIcon.addClass( Authorlist.CSS.Icon ).addClass( Authorlist.CSS.ErrorIcon );
    nDialog.append( nError.append( nErrorIcon, nErrorText ) );
    
    // Create each individual message
    asErrors.forEach( function( sError ) {
        var nBullet = jQuery( '<p>' );
        var nBulletIcon = jQuery( '<span>' );        
        var nBulletText = jQuery( '<span>' + sError + '</span>' );
        
        nBullet.addClass( Authorlist.CSS.Bullet );
        nBulletIcon.addClass( Authorlist.CSS.Icon );
        nBulletIcon.addClass( Authorlist.CSS.BulletIcon );
        nBulletText.addClass( Authorlist.CSS.BulletText );
        
        nDialog.append( nBullet.append( nBulletIcon, nBulletText ) );
    } );
    nDialog.appendTo( jQuery( 'body' ) );
    
    // Instantiate a jQuery UI dialog widget
    nDialog.dialog( {
        'modal'       : true,
        'resizable'   : false,
        'title'       : 'Error',
        'width'       : '33%',
        'maxWidth'    : '50%',
        'dialogClass' : Authorlist.CSS.Dialog,
        'buttons'     : {
            'Close' : function() { jQuery( this ).remove(); }
        }
    } );
}

/*
* Function: _fnValidateAffiliations
* Purpose:  Validates a subset - namely the affiliations - of the whole data of 
*           the fnGetData() call in fnValidate. It makes sure that all acronyms 
*           and names/addresses of an affiliation is set. At the same time it 
*           generates errors messages if this is not the case and appends them 
*           to the passed error messages array.
* Input(s): array array object:aaoAffiliations - the affiliations data entry
*           array string:asErrors - the error messages array
* Returns:  array string:asAcronyms - an array containing the valid affiliation 
                                      acronyms; used in _fnValidateAuthors()
*
*/
Authorlist.prototype._fnValidateAffiliations = function( aaoAffiliations, asErrors ) {
    var asAcronyms = [];
    var asMissingAcronyms = [];
    var asMissingAddresses = [];
    
    aaoAffiliations.forEach( function( aoAffiliation ) {
        var sIndex = aoAffiliation[ Authorlist.INDICES.Index ];
        var sAcronym = aoAffiliation[ Authorlist.INDICES.Acronym ];
        var sAddress = aoAffiliation[ Authorlist.INDICES.Address ];
        
        // If acronym field is empty save it in missing acronyms, otherwise save 
        // it in present acronyms
        var bAcronymEmpty = sAcronym.match( Authorlist.EMPTY ) !== null;
        if ( bAcronymEmpty ) {
            asMissingAcronyms.push( sIndex );
        } else {
            asAcronyms.push( sAcronym );
        }
        
        // If address field is not set remember the index
        var bAddressEmpty = sAddress.match( Authorlist.EMPTY ) !== null;
        if ( bAddressEmpty ) asMissingAddresses.push( sIndex );
    } );
    
    // Create error messages
    if ( asMissingAcronyms.length > 0 ) {
        var sAcronymsError = 'Affiliation acronym <strong>missing</strong> in line(s): ';
        sAcronymsError += '<strong>' + asMissingAcronyms.join( ',' ) + '</strong>';
        asErrors.push(  sAcronymsError  );
    }
    
    if ( asMissingAddresses.length > 0 ) {
        var sAddressesError = 'Affiliation name and address <strong>missing</strong> in line(s): ';
        sAddressesError += '<strong>' + asMissingAddresses.join( ',' ) + '</strong>';
        asErrors.push( sAddressesError  );
    }
    
    // Return acronyms, which can be used later in the author validation
    return asAcronyms;
}

/*
* Function: _fnValidateAuthors
* Purpose:  Validates a subset - namely the authors - of the whole data of the 
*           fnGetData() call in fnValidate. It makes sure that all paper names 
*           and affiliations are present and linkable. At the same time it 
*           generates errors messages if this is not the case and appends them 
*           to the passed error messages array.
* Input(s): array array object:aaoAuthors - the authors data entry
            array string:asErrors - the error messages array
* Returns:  void
*
*/
Authorlist.prototype._fnValidateAuthors = function( aaoAuthors, asAcronyms, asErrors ) {
    var asMissingNames = [];
    var asUnknownAcronyms = [];
    // Real copy of asAcronyms
    var asUnusedAcronyms = asAcronyms.slice();
    
    aaoAuthors.forEach( function( aoAuthor ) {
        var sIndex = aoAuthor[ Authorlist.INDICES.Index ];
        var sName = aoAuthor[ Authorlist.INDICES.AuthorName ];
        var aasAffiliations = aoAuthor[ Authorlist.INDICES.Affiliations ];
        
        // Name is empty? Remember the line
        if ( sName.match( Authorlist.EMPTY ) !== null ) {
            asMissingNames.push( sIndex );
        }
        
        // An affiliation ancronym could not be found in the affiliations table?
        aasAffiliations.forEach( function( asAffiliation ) {
            var sAffName = asAffiliation[ Authorlist.INDICES.AffiliationName ];
            if ( asAcronyms.indexOf( sAffName ) < 0 ) {
                asUnknownAcronyms.push( sAffName );
            }
            asUnusedAcronyms.remove( sAffName );
        } );
    } );
    
    // If missing names are present append them to the error messages array
    if ( asMissingNames.length > 0 ) {
        var sNamesError = 'Author paper name <strong>missing</strong> in line(s) ';
        sNamesError += '<strong>' + asMissingNames.join( ', ' ) + '</strong>';
        asErrors.push( sNamesError );
    }
    
    // If unknown are acronyms were found push them in the error messages array
    if ( asUnknownAcronyms.length > 0 ) {
        var sAcronymsError = '<strong>Unknown</strong> affiliation acronyms: ';
        sAcronymsError += '<strong>' + asUnknownAcronyms.join( ', ' ) + '</strong>';
        asErrors.push( sAcronymsError );
    }
    
    // Acronyms that are unused in the affiliations table
    if ( asUnusedAcronyms.length > 0 ) {
        var sUnusedError = '<strong>Unused</strong> acronyms: ';
        sUnusedError += '<strong>' + asUnusedAcronyms.join( ', ' ) + '</strong>';
        asErrors.push( sUnusedError );
    }
}

/*
* Function: _fnValidateUmbrellas
* Purpose:  Validates a subset - namely the umbrella organizatons - of the whole
*           data as retrieved by the fnGetData() call in fnValidate. It ensures 
*           that each umbrella acronym is present in the list of all acronyms.
*           Otherwise is generates a error message and appends it to the error 
*           messages array. 
* Input(s): array array object:aaoAffiliations - the affiliations data entry
*           array string:asAcronyms - an array containing all the acronyms in 
*                                     the affiliations table
*           array string:asErrors - the error messages array
* Returns:  void
*
*/
Authorlist.prototype._fnValidateUmbrellas = function( aaoAffiliations, asAcronyms, asErrors ) {
    var asInvalidUmbrellas = [];

    aaoAffiliations.forEach( function( aoAffiliation ) {
        var sIndex = aoAffiliation[ Authorlist.INDICES.Index ];
        var sUmbrella = aoAffiliation[ Authorlist.INDICES.Umbrella ];
        var bNotEmpty = sUmbrella.match( Authorlist.EMPTY ) === null;
        
        // Umbrella string not empty and not in the acronyms? Record that!
        if ( bNotEmpty && asAcronyms.indexOf( sUmbrella ) < 0 ) {
            asInvalidUmbrellas.push( sIndex );
        }
    } );
    
    // Invalid umbrellas present? 
    if ( asInvalidUmbrellas.length > 0 ) {
        var sInvalidError = '<strong>Unknown</strong> umbrella organization in line(s): ';
        sInvalidError += '<strong>' + asInvalidUmbrellas.join( ',' ) + '</strong>';
        asErrors.push( sInvalidError );
    }
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
    
    this._nPaper = this._fnCreateInput( 'Paper Title (*)' );
    this._nCollaboration = this._fnCreateInput( 'Collaboration (*)' );
    this._nReference = this._fnCreateInput( 'Reference Id(s)', Authorlist.CSS.Reference + '0' );
    this._nExperimentNumber = this._fnCreateInput( 'Experiment Number' );
    this._fnCreateButtons( this._nReference);
    
    this._nParent.append( this._nPaper, this._nCollaboration, 
                          this._nExperimentNumber, this._nReference );
}

/*
* Function: fnGetData
* Purpose:  Retrieves the paper information in a further processable form. EMPTY
*           lines in the reference ids will NOT BE in the result.
* Input(s): void
* Returns:  object:oResult - an object containing the paper information
*
*/
Paper.prototype.fnGetData = function() {
    var oResult = {};
    var sSelector = '.' + Authorlist.CSS.Input;
    
    oResult.paper_title = this._nPaper.find( sSelector ).val();
    oResult.collaboration = this._nCollaboration.find( sSelector ).val();
    oResult.experiment_number = this._nExperimentNumber.find( sSelector ).val();
    oResult.reference_ids = [];
    
    this._nReference.find( sSelector ).each( function( iIndex, nInput ) {
        var sValue = jQuery( nInput ).val();
        
        // Skip empty elements
        if ( sValue.match( Authorlist.EMPTY ) !== null ) return true;
        oResult.reference_ids.push( sValue );
    } );
    
    return oResult;
}

/*
* Function: _fnCreateButtons
* Purpose:  Do the same thing as authorlist does here
*
*/
Paper.prototype._fnCreateButton = Authorlist.prototype._fnCreateButton

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
    var nAddButton = this._fnCreateButton( nParent, 'Add', Authorlist.CSS.AddIcon );
    var nRemoveButton = this._fnCreateButton( nParent, 'Remove', Authorlist.CSS.RemoveIcon );
    
    // Add classes
    nAddButton.addClass( Authorlist.CSS.Add );
    nRemoveButton.addClass( Authorlist.CSS.Remove );
    
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
