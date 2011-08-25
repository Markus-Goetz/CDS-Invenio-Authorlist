Authorlist._oCss = {
    'Authorlist' :      'Authorlist',
    'Fieldset' :        'AuthorlistFieldset',
    'Legend' :          'AuthorlistLegend',
    'Label' :           'AuthorlistLabel',
    'Input' :           'AuthorlistInput'
}

Authorlist._oJSON = {
    'Collaboration' :   'Collaboration',
    'PaperTitle' :      'PaperTitle',
    'ReferenceId' :     'ReferenceId',
    'Authors' :         'Authors',
    'Affiliations' :    'Affiliations'
}

Authorlist._oForm = {
    'URL' :             '/record/edit/authorlist?state=export',
    'Data' :            'data',
    'Mode' :            'mode'
}

function Authorlist( sDiv ) {
    /*jQuery( window ).blur( function() {
        console.log('looool');
    });*/

    this._nDiv = this._fnSanitizeDiv( sDiv );
    this._nDiv.addClass( Authorlist._oCss.Authorlist );
      
    this._nForm = this._fnCreateForm();
    
    this._nMode = this._fnCreateContent( Authorlist._oForm.Mode );
    this._nData = this._fnCreateContent( Authorlist._oForm.Data );
    
    this._nPaper = this._fnCreateFieldset( 'Paper' );
    this._nCollaboration = this._fnCreateInputField( 'Collaboration', this._nPaper );
    this._nPaperTitle = this._fnCreateInputField( 'Paper title', this._nPaper );
    this._nReferenceId = this._fnCreateInputField( 'Reference Id', this._nPaper );

    this._nAuthors = this._fnCreateFieldset( 'Authors' );
    this._nAuthorsDiv = this._fnCreateDiv( sDiv, '-authors' );
    this._nAuthors.append( this._nAuthorsDiv );
    
    this._nAffiliations = this._fnCreateFieldset( 'Affiliations' );
    this._nAffiliationsDiv = this._fnCreateDiv( sDiv, '-affiliations' );
    this._nAffiliations.append( this._nAffiliationsDiv );
    
    this._nControls = this._fnCreateFieldset( 'Edit' );
    this._fnCreateFormatButton( 'JSON', this._nControls );
    this._fnCreateFormatButton( 'AuthorsXML', this._nControls );
    this._fnCreateFormatButton( 'CMS Tex', this._nControls );

    this._nForm.append( this._nMode, this._nData, this._nPaper, 
                        this._nAuthors, this._nAffiliations, this._nControls );
    this._nDiv.append( this._nForm );
    
    this._oAuthors = this._fnCreateAuthorsSheet();
    this._oAffiliations = this._fnCreateAffiliationsSheet();
 
    this._oAuthors.fnFocus();
}

Authorlist.prototype._fnSanitizeDiv = function( sDiv ) {
    if ( typeof sDiv !== 'string' ) {
        throw 'Id of element the Authormanager is embedded into, has to be given as a string, but was ' + typeof sDiv;
    }
 
    var nDiv = jQuery( '#' + sDiv );
    if ( nDiv.length === 0 ) {
        throw 'Element with id ' + sDivId + ' is not present, could not initialize Authormanager';
    }
    return nDiv;
}

Authorlist.prototype._fnCreateForm = function() {
    var nForm = jQuery( '<form>' );
    nForm.attr( {
        'method' : 'POST',
        'action' : Authorlist._oForm.URL
    } );    
    
    return nForm;
}

Authorlist.prototype._fnCreateContent = function( sContent ) {
    var nInput = jQuery( '<input type="hidden">' );
    nInput.attr( 'name', sContent );
    
    return nInput;
}

Authorlist.prototype._fnCreateFieldset = function( sTitle ) {
    var nFieldset = jQuery( '<fieldset>' );
    nFieldset.addClass( Authorlist._oCss.Fieldset );
    
    var nLegend = jQuery( '<legend>' + sTitle + '</legend>' );
    nLegend.addClass( Authorlist._oCss.Legend );
    
    nFieldset.append( nLegend );
    
    return nFieldset;
}

Authorlist.prototype._fnCreateInputField = function( sLabel, nWhere ) {
    var nParagraph = jQuery( '<p>' );
    
    var nLabel = jQuery( '<label>' + sLabel + '</label>');
    nLabel.attr( 'for', sLabel );
    nLabel.addClass( Authorlist._oCss.Label );
    
    var nInput = jQuery( '<input type="text">' );
    nInput.attr( 'id', nLabel );
    nInput.addClass( Authorlist._oCss.Input );
    
    nParagraph.append( nLabel, nInput );
    nWhere.append( nParagraph );
    
    return nInput;
}

Authorlist.prototype._fnCreateDiv = function( sDiv, sExtension ) {
    var nDiv = jQuery( '<div>' );
    nDiv.attr( 'id', sDiv + sExtension );
    
    return nDiv;
}

Authorlist.prototype._fnCreateAuthorsSheet = function() {
    return new SpreadSheet( this._nAuthorsDiv.attr( 'id' ), {
        'Columns' : [ {
            'name'      : 'Edit',
            'readonly'  : true,
            'type'      : 'edit'
         }, {
            'name'      : 'Index',
            'readonly'  : true,
            'type'      : 'increment',
            'value'     : 1, // start with 1
            'options'   : 1  // increment by 1
         }, {
            'name'      : 'Family name'
         }, {
            'name'      : 'Given name'
         }, {
            'name'      : 'Suffix'
         }, {
            'name'      : 'Name on paper'
         }, {
            'name'      : 'Alive',
            'type'      : 'checkbox',
            'visible'   : true,
            'value'     : true
         }, {
            'name'      : 'Affiliated with'
         }, {
            'name'      : 'Also at'
         }, {
            'name'      : 'Inspire ID'
         } ],
        'Focus' : 'Family name'
    });
}

Authorlist.prototype._fnCreateAffiliationsSheet = function() {
    return new SpreadSheet( this._nAffiliationsDiv.attr( 'id' ), {
        'Columns' : [ {
            'name'      : 'Edit',
            'readonly'  : true,
            'type'      : 'edit'
         }, {
            'name'      : 'Index',
            'readonly'  : true,
            'type'      : 'increment',
            'value'     : 1, // start with 1
            'options'   : 1  // increment by 1
         }, {
            'name'      : 'Short name'
         }, {
            'name'      : 'Name and Address'
         }, {
            'name'      : 'Domain'
         }, {
            'name'      : 'Member',
            'type'      : 'checkbox',
            'value'     : true
         }, {
            'name'      : 'Spires ID'
         } ],
    });
}

Authorlist.prototype.fnGetData = function( self ) {
    // Funny construct to be able to use this function in callbacks where this
    // would point to a DOM element rather then on the instance of this class
    if ( typeof self === 'undefined' ) {
        self = this;
    }
    
    var result = {};
    
    result[Authorlist._oJSON.Collaboration] = self._nCollaboration.val();
    result[Authorlist._oJSON.PaperTitle] = self._nPaperTitle.val();
    result[Authorlist._oJSON.ReferenceId] = self._nReferenceId.val();
    
    result[Authorlist._oJSON.Authors] = self._oAuthors.fnGetData();
    result[Authorlist._oJSON.Affiliations] = self._oAffiliations.fnGetData();
    
    return result;
}

Authorlist.prototype._fnCreateFormatButton = function( sText, nWhere ) {
    var nButton = jQuery( '<input type="button">' );
    nButton.attr( 'value', sText );
    nButton.click( this._fnMakeFormatButtonCallback() );
    nWhere.append( nButton );
    
    return nButton;
}

Authorlist.prototype._fnMakeFormatButtonCallback = function() {
    var self = this;
    
    return function() {
        self._nMode.val( jQuery(this).val() );
        self._nData.val( JSON.stringify( self.fnGetData() ) );
        console.log(JSON.stringify( self.fnGetData() ));
        self._nForm.submit();
        console.log("foo");
    }
}
