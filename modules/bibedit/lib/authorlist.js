function Authorlist( sDiv ) {
    this._nDiv = this._fnSanitizeDiv( sDiv );
    
    this._nPaper = jQuery( '<div id="' + sDiv + '-paper">' );
    this._nDiv.append( this._nPaper );
    
    this._nPaperName = this._fnCreatePaperName( sDiv );
    this._nReferenceList = this._fnCreateReferenceList( sDiv );

    this._nAuthors = jQuery( '<div id="' + sDiv + '-authors">' );
    this._nDiv.append( this._nAuthors );
    this._oAuthors = this._fnCreateAuthorsSheet();
    
    this._nAffiliations = jQuery( '<div id="' + sDiv + '-affiliations">' );
    this._nDiv.append( this._nAffiliations );
    this._oAffiliations = this._fnCreateAffiliationsSheet(); 
    
    this._nControls = jQuery( '<div id="' + sDiv + '-controls">' );
    this._nDiv.append( this._nControls );
 
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

Authorlist.prototype._fnCreatePaperName = function( sDiv ) {
    var nPaperName = jQuery( '<div id="' + sDiv + '-papername">' );
    
    return nPaperName;
}

Authorlist.prototype._fnCreateReferenceList = function( sDiv ) {
    var nReferenceList = jQuery( '<div id="' + sDiv + '-referencelist">' );
    
    return nReferenceList;
}

Authorlist.prototype._fnCreateAuthorsSheet = function() {
    return new SpreadSheet( this._nAuthors.attr( 'id' ), {
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
    return new SpreadSheet( this._nAffiliations.attr( 'id' ), {
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
