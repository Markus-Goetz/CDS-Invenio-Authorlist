Authorlist._oCss = {
    'Authorlist' :  'Authorlist',
    'Fieldset' :    'AuthorlistFieldset',
    'Legend' :      'AuthorlistLegend',
    'Label' :       'AuthorlistLabel',
    'Input' :       'AuthorlistInput'
}

function Authorlist( sDiv ) {
    this._nDiv = this._fnSanitizeDiv( sDiv );
    this._nDiv.addClass( Authorlist._oCss.Authorlist );    
    this._nForm = this._fnCreateForm( sDiv );
    
    this._nPaper = this._fnCreateFieldset( 'Paper' );
    this._nCollaboration = this._fnCreateInputField( 'Collaboration', sDiv + '-collaboration' );
    this._nPaperName = this._fnCreateInputField( 'Paper title', sDiv + '-papername' );
    this._nReferenceList = this._fnCreateInputField( 'Reference', sDiv + '-referencelist' );
    this._nPaper.append( this._nCollaboration, this._nPaperName, this._nReferenceList );

    this._nAuthors = this._fnCreateFieldset( 'Authors' );
    this._nAuthorsDiv = jQuery( '<div id="' + sDiv + '-authors">' );
    this._nAuthors.append( this._nAuthorsDiv );
    this._nPaper.append( this._nAuthors );
    
    this._nAffiliations = this._fnCreateFieldset( 'Affiliations' );
    this._nAffiliationsDiv = jQuery( '<div id="' + sDiv + '-affiliations">' );
    this._nAffiliations.append( this._nAffiliationsDiv );
    this._nPaper.append( this._nAffliations );
    
    this._nControls = this._fnCreateFieldset( 'Edit' );
    this._nPaper.append( this._nControls );

    this._nForm.append( this._nPaper, this._nAuthors, this._nAffiliations, this._nControls );
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

Authorlist.prototype._fnCreateForm = function( sDiv ) {
    var nForm = jQuery( '<form id="' + sDiv + '-form">' );    
    return nForm;
}

Authorlist.prototype._fnCreateFieldset = function( sTitle ) {
    var nFieldset = jQuery( '<fieldset>' );
    var nLegend = jQuery( '<legend>' + sTitle + '</legend>' );
    
    nFieldset.addClass( Authorlist._oCss.Fieldset );
    nLegend.addClass( Authorlist._oCss.Legend );
    
    nFieldset.append( nLegend );
    
    return nFieldset
}

Authorlist.prototype._fnCreateInputField = function( sLabel, sId ) {
    var nParagraph = jQuery( '<p>' );
    var nLabel = jQuery( '<label for="' + sId + '">' + sLabel + '</label>');
    var nInput = jQuery( '<input type="text" id="' + sId + '">' );
    
    nLabel.addClass( Authorlist._oCss.Label );
    nInput.addClass( Authorlist._oCss.Input );
    
    nParagraph.append( nLabel, nInput );
    
    return nParagraph;
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
            'name'      : 'Author ID'
         }, {
            'name'      : 'Last name'
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
         } ],
        'Focus' : 'Author ID'
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
            'name'      : 'INSPIRE ID'
         } ],
    });
}

Authorlist.prototype.fnGetData = function() {

}
