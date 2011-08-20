Authormanager.Author = {
 'AuthorID'   : 2,
 'LastName'   : 3,
 'GivenName'   : 4,
 'NameOnPaper'  : 5,
 'Alive'    : 6,
 'AffiliatedWith' : 7,
 'CurrentlyAt'  : 8
}

Authormanager.Organization = {
 'Abbreviation'  : 2,
 'Name'    : 3,
 'Address'   : 4,
 'Member'   : 5,
 'INSPIRE ID'  : 6
}

function Authormanager( sDiv ) {
 this._aoExporter = [];

 this._nDiv = this._fnSanitizeDiv( sDiv );
 
 this._nButtonDiv = jQuery( '<div id="' + sDiv + '-buttons" style="height:50px;">' );
 this._nAuthorsDiv = jQuery( '<div id="' + sDiv + '-authors">' );
 this._nAffiliationsDiv = jQuery( '<div id="' + sDiv + '-affiliations">' );
 this._nDiv.append( this._nButtonDiv );
 this._nDiv.append( this._nAuthorsDiv );
 this._nDiv.append( this._nAffiliationsDiv );
 
 this._oAuthors = new SpreadSheet( this._nAuthorsDiv.attr( 'id' ), {
  'Columns' : [ {
      'name' :  'Edit',
      'readonly' : true,
      'type' :  'edit'
     }, {
      'name' :  'Index',
      'readonly' : true,
      'type' :  'increment',
      'value' :  1, // start with 1
      'options' :  1  // increment by 1
     }, {
      'name' :  'Author ID'
     }, {
      'name' :  'Last name'
     }, {
      'name' :  'Given name'
     }, {
      'name' :  'Name on paper'
     }, {
      'name' :  'Alive',
      'type' :  'checkbox',
      'visible' :  true,
      'value' :  true
     }, {
      'name' :  'Affiliated with'
     }, {
      'name' :  'Currently at'
     } ],
  'Focus' : 'Author ID'
 });
 
 this._oAffiliations = new SpreadSheet( this._nAffiliationsDiv.attr( 'id' ), {
  'Columns' : [ {
      'name' :  'Edit',
      'readonly' : true,
      'type' :  'edit'
     }, {
      'name' :  'Index',
      'readonly' : true,
      'type' :  'increment',
      'value' :  1, // start with 1
      'options' :  1  // increment by 1
     }, {
      'name' :  'Abbreviation'
     }, {
      'name' :  'Name'
     }, {
      'name' :  'Address'
     }, {
      'name' :  'Member',
      'type' :  'checkbox',
      'value' :  true
     }, {
      'name' :  'INSPIRE ID'
     } ],
 });
 
 this._oAuthors.fnFocus();
}

Authormanager.prototype._fnSanitizeDiv = function( sDiv ) {
 if ( typeof sDiv !== 'string' ) {
  throw 'Id of element the Authormanager is embedded into, has to be given as a string, but was ' + typeof sDiv;
 }
 
 var nDiv = jQuery( '#' + sDiv );
 if ( nDiv.length === 0 ) {
  throw 'Element with id ' + sDivId + ' is not present, could not initialize Authormanager';
 }
 return nDiv;
}

Authormanager.prototype.fnAddExporter = function( exporter ) {
 this._aoExporter.push( new exporter( this ) );
}

Authormanager.prototype._fnAddButton = function( sText, fnCallback ) {
 var button = jQuery( '<button class="' + SpreadSheet._oCss.SpreadSheet + '" style="float:right">' + sText + '</button>' );
 button.click( fnCallback );
 this._nButtonDiv.append( button );
}